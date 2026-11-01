"""The audiobook library as Music Assistant groups it, the podcasts, and what the card's buttons ask of a
player.

Home Assistant's Music Assistant integration passes only an audiobook's name, image and URI on. The
collections (series) and chapters are in Music Assistant's own API, so this talks to it directly.

Each child has a profile: a user of its own in Music Assistant, reached with its own token. Music Assistant
keeps per user how far a book or an episode got, what was played lately and (from 2.11) what is liked, so
everything a child does goes through its profile.
"""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from dataclasses import dataclass, field
import hashlib
import logging
import re
import time
from typing import TYPE_CHECKING, Any

import aiohttp
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import EPISODE, HEARD_AFTER, IMAGE_URL, RECENT_BOOKS

if TYPE_CHECKING:
    from .podcasts import Podcasts

_LOGGER = logging.getLogger(__name__)

# A title's own number, when it is written into it:
# "001 - Panik im Paradies", "Mini-Fall 03 - Die Piratenbande".
NUMBERED = re.compile(r"^(?:Mini-Fall )?(\d{1,3}) - (.+)$")


class MusicAssistantError(Exception):
    """Music Assistant could not be reached, or refused a command."""


class MusicAssistant:
    """Music Assistant's HTTP API: one command per request."""

    def __init__(self, hass: HomeAssistant, url: str, token: str) -> None:
        self.url = url.rstrip("/")
        self._token = token
        self._session = async_get_clientsession(hass)

    async def command(self, command: str, **args: Any) -> Any:
        try:
            async with self._session.post(
                f"{self.url}/api",
                json={"command": command, "args": args},
                headers={"Authorization": f"Bearer {self._token}"},
                timeout=aiohttp.ClientTimeout(total=20),
            ) as resp:
                if resp.status != 200:
                    raise MusicAssistantError(f"{command}: HTTP {resp.status}: {(await resp.text())[:200]}")
                return await resp.json(content_type=None)
        except (aiohttp.ClientError, TimeoutError) as err:
            raise MusicAssistantError(f"{command}: {err}") from err

    async def user(self) -> dict:
        """The Music Assistant user the token belongs to."""
        return await self.command("auth/me")

    async def image(self, proxy_id: str, size: int) -> bytes | None:
        try:
            async with self._session.get(
                f"{self.url}/imageproxy/{proxy_id}",
                params={"size": str(size)},
                timeout=aiohttp.ClientTimeout(total=20),
            ) as resp:
                return await resp.read() if resp.status == 200 else None
        except (aiohttp.ClientError, TimeoutError):
            return None


# The group id of a book in no group is its own id after this. A group's id is hex, so this must not
# start with a hex digit.
SINGLE = "single-"


def series_id(name: str) -> str:
    return hashlib.sha1(name.encode()).hexdigest()[:12]


def _authors(item: dict) -> list[str]:
    return [a["name"] for a in item.get("authors") or []]


def to_book(item: dict) -> dict:
    """Music Assistant's audiobook as the card wants it. Its group is its author, as Music Assistant's author
    page groups them (a series such as "Die drei ??? Kids" is the author there); without an author, its
    collection; without either, it stands on its own."""
    meta = item.get("metadata") or {}
    images = meta.get("images") or []
    proxy = images[0].get("proxy_id") if images else None
    authors = item.get("authors") or []
    resume = item.get("resume_position_ms")
    book = {
        "id": item["item_id"],
        "uri": item["uri"],
        "title": item["name"],
        "number": "",
        "author": authors[0]["name"] if authors else "",
        "series": "",
        "series_id": SINGLE + item["item_id"],
        "collection": "",
        "cover": f"{IMAGE_URL}/{proxy}" if proxy else "",
        "duration": item.get("duration") or 0,
        "resume": (resume or 0) // 1000,
        "played": bool(item.get("fully_played")),
        "sort": "z" + item["name"].lower(),
    }
    if m := NUMBERED.match(item["name"]):
        n = int(m.group(1))
        book["number"], book["title"], book["sort"] = str(n), m.group(2), f"a{n:08.2f}"
    collections = meta.get("collections") or []
    if collections:
        c = collections[0]
        book["collection"] = c["title"]
        try:
            n = float(str(c.get("sequence", "")).strip())
            book["sort"] = f"a{n:08.2f}"
            if not book["number"]:
                book["number"] = str(c["sequence"]).strip()
        except ValueError:
            pass
    group = book["author"] or book["collection"]
    if group:
        book["series"], book["series_id"] = group, series_id(group)
    # Within a group, its collections one after the other, each in its own order.
    book["sort"] = f"{book['collection'].lower()}\x01{book['sort']}"
    return book


@dataclass
class Shelf:
    """The audiobooks as one profile sees them: the same books for every child, its own progress in them."""

    series: list[dict] = field(default_factory=list)
    by_id: dict[str, dict] = field(default_factory=dict)
    books: dict[str, dict] = field(default_factory=dict)


@dataclass
class Library:
    """The library, read every minute with the authors' pictures, once per profile for its progress; each
    audiobook's details (collection, chapters) are read once."""

    # The profiles' connections to Music Assistant by name (casefolded), asked each time, so a profile
    # added or removed counts at once. The first is the default.
    clients: Callable[[], dict[str, MusicAssistant]]
    podcasts: Podcasts
    shelves: dict[str, Shelf] = field(default_factory=dict)
    details: dict[str, dict] = field(default_factory=dict)
    author_images: dict[str, str] = field(default_factory=dict)
    # When each group last played on each player: {player_id: {series_id: unix time}}, kept by Home Assistant.
    recent: dict[str, dict[str, float]] = field(default_factory=dict)
    # When each book last played on each player, the latest RECENT_BOOKS: {player_id: {book_id: unix time}}.
    heard: dict[str, dict[str, float]] = field(default_factory=dict)
    on_recent: Callable[[], None] | None = None
    # Which book plays on each player now, and since when.
    _playing: dict[str, tuple[str, float]] = field(default_factory=dict)
    read_at: float = 0
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock)

    def ma(self, profile: str | None = None) -> MusicAssistant:
        """A profile's connection to Music Assistant, by name; without one, the first profile's."""
        return self.clients()[self._profile(profile)]

    def _profile(self, profile: str | None) -> str:
        clients = self.clients()
        if not clients:
            raise MusicAssistantError("no profile is set up")
        if not profile:
            return next(iter(clients))
        if profile.casefold() not in clients:
            raise MusicAssistantError(f"unknown profile {profile}")
        return profile.casefold()

    def _shelf(self, profile: str | None) -> Shelf:
        return self.shelves.get(self._profile(profile)) or Shelf()

    async def refresh(self) -> None:
        async with self._lock:
            clients = self.clients()
            if not clients:
                return
            # The books are the same for every profile; how far each child got in them is not.
            lists = await asyncio.gather(
                *(ma.command("music/audiobooks/library_items", limit=5000) for ma in clients.values()),
                return_exceptions=True,
            )
            by_profile: dict[str, list[dict]] = {}
            for name, found in zip(clients, lists, strict=True):
                if isinstance(found, MusicAssistantError):
                    _LOGGER.warning("Reading the audiobooks of profile %s failed: %s", name, found)
                elif isinstance(found, BaseException):
                    raise found
                else:
                    by_profile[name] = found
            if not by_profile:
                raise MusicAssistantError("no profile could read the audiobooks")
            ma = clients[next(iter(by_profile))]
            items = next(iter(by_profile.values()))
            missing = [it["item_id"] for it in items if self._outdated(it)]
            if missing:
                sem = asyncio.Semaphore(6)

                async def fetch(item_id: str) -> None:
                    async with sem:
                        try:
                            self.details[item_id] = await ma.command(
                                "music/item_by_uri", uri=f"library://audiobook/{item_id}"
                            )
                        except MusicAssistantError as err:
                            _LOGGER.warning("Details of audiobook %s: %s", item_id, err)

                await asyncio.gather(*(fetch(i) for i in missing))
                _LOGGER.debug("Read the details of %d new or changed audiobooks", len(missing))
            try:
                artists = await ma.command("music/artists/library_items", limit=5000)
                self.author_images = {
                    a["name"]: imgs[0]["proxy_id"]
                    for a in artists
                    if (imgs := (a.get("metadata") or {}).get("images")) and imgs[0].get("proxy_id")
                }
            except MusicAssistantError as err:
                _LOGGER.warning("Reading the authors' pictures failed: %s", err)
            self.shelves = {name: self._build(found) for name, found in by_profile.items()}
            self.read_at = time.monotonic()

    def _outdated(self, item: dict) -> bool:
        """Whether a book's details are still to be read: new ones, and ones whose name or authors have
        changed since. Audiobookshelf names a book after its files at first and after its real title once
        it is matched, and the list has no other sign of that."""
        known = self.details.get(item["item_id"])
        if known is None:
            return True
        return (known["name"], _authors(known)) != (item["name"], _authors(item))

    def _build(self, items: list[dict]) -> Shelf:
        by_id: dict[str, dict] = {}
        books: dict[str, dict] = {}
        order: list[dict] = []
        for it in items:
            src = dict(self.details.get(it["item_id"], it))
            # The list's progress is the newer one.
            src["resume_position_ms"], src["fully_played"] = (
                it.get("resume_position_ms"),
                it.get("fully_played"),
            )
            book = to_book(src)
            books[book["id"]] = book
            s = by_id.get(book["series_id"])
            if s is None:
                s = {
                    "id": book["series_id"],
                    "name": book["series"],
                    "sub": "",
                    "covers": [],
                    "count": 0,
                    "single": "",
                    "books": [],
                }
                if not book["series"]:
                    s.update(name=book["title"], sub=book["author"], single=book["id"])
                by_id[s["id"]] = s
                order.append(s)
            s["books"].append(book)
        for s in order:
            s["books"].sort(key=lambda b: b["sort"])
            s["count"] = len(s["books"])
            # A group's face is its author's picture in Music Assistant, else its first real episode's cover
            # (a "0" is a special, like a live show).
            if (proxy := self.author_images.get(s["name"])) and not s["single"]:
                s["covers"] = [f"{IMAGE_URL}/{proxy}"]
            else:
                s["covers"] = [b["cover"] for b in s["books"] if b["cover"] and b["number"] != "0"][:1] or [
                    b["cover"] for b in s["books"][:1] if b["cover"]
                ]
        order.sort(key=lambda s: s["name"].lower())
        return Shelf(order, by_id, books)

    def chapters(self, item_id: str) -> list[dict]:
        return ((self.details.get(item_id) or {}).get("metadata") or {}).get("chapters") or []

    def overview(self, player_id: str | None = None, profile: str | None = None) -> list[dict]:
        """The home page's groups. For a player, the groups it played lately come first, the latest first; the
        rest by name."""
        played = self.recent.get(player_id or "", {})
        order = sorted(self._shelf(profile).series, key=lambda s: -played.get(s["id"], 0))
        return [{k: v for k, v in s.items() if k != "books"} for s in order]

    def played(self, player_id: str, book: dict) -> None:
        """Note that a book plays on a player now. Once it has played there for HEARD_AFTER without a break,
        it and its group count as heard there, noted at most once a minute."""
        now = time.time()
        playing = self._playing.get(player_id)
        if playing is None or playing[0] != book["id"]:
            self._playing[player_id] = (book["id"], now)
            return
        books = self.heard.setdefault(player_id, {})
        if now - playing[1] < HEARD_AFTER or now - books.get(book["id"], 0) < 60:
            return

        books[book["id"]] = now
        for old in sorted(books, key=books.get)[:-RECENT_BOOKS]:
            del books[old]
        self.recent.setdefault(player_id, {})[book["series_id"]] = now
        if self.on_recent:
            self.on_recent()

    def recently_heard(self, player_id: str, profile: str | None = None) -> list[dict]:
        """The books heard lately on a player, the latest first; ones gone from the library are left out."""
        heard = self.heard.get(player_id, {})
        latest = sorted(heard, key=heard.get, reverse=True)
        books = self._shelf(profile).books
        return [{k: v for k, v in books[i].items() if k != "sort"} for i in latest if i in books]

    def collection(self, sid: str, profile: str | None = None) -> dict | None:
        s = self._shelf(profile).by_id.get(sid)
        if s is None:
            return None
        return {
            "series": {k: v for k, v in s.items() if k != "books"},
            "books": [{k: v for k, v in b.items() if k != "sort"} for b in s["books"]],
        }

    async def book(self, item_id: str, profile: str | None = None) -> dict:
        """One audiobook with its chapters, read fresh so its resume point is current."""
        item = await self.ma(profile).command("music/item_by_uri", uri=f"library://audiobook/{item_id}")
        self.details[item_id] = item
        book = to_book(item)
        book.pop("sort")
        book["chapters"] = self.chapters(item_id)
        return book

    async def state(self, player_id: str, profile: str | None = None) -> dict:
        """What plays: the book, where in it, and which chapter; or the episode, and its podcast."""
        ma = self.ma(profile)
        queue = await ma.command("player_queues/get", queue_id=player_id)
        out: dict[str, Any] = {
            "state": (queue or {}).get("state", "idle"),
            "book": None,
            "episode": None,
            "elapsed": 0,
            "duration": 0,
            "chapter": None,
            "chapters": 0,
        }
        current = (queue or {}).get("current_item") or {}
        item = current.get("media_item")
        if out["state"] != "playing":
            self._playing.pop(player_id, None)
        if item and item.get("media_type") == "podcast_episode":
            out["episode"] = {"uri": item["uri"], "podcast_id": await self.podcasts.podcast_of(ma, item)}
        if not item or item.get("media_type") != "audiobook":
            self._playing.pop(player_id, None)
            return out
        known = self._shelf(profile).books.get(item["item_id"])
        book = dict(known) if known else to_book(item)
        book.pop("sort", None)
        elapsed = queue.get("elapsed_time") or 0
        if out["state"] == "playing" and queue.get("elapsed_time_last_updated"):
            elapsed += time.time() - queue["elapsed_time_last_updated"]
        if out["state"] == "playing":
            self.played(player_id, book)
        chapters = self.chapters(item["item_id"])
        current_chapter = None
        for c in chapters:
            if elapsed >= c["start"]:
                current_chapter = c
        out.update(
            book=book,
            elapsed=elapsed,
            duration=current.get("duration") or 0,
            chapter=current_chapter,
            chapters=len(chapters),
        )
        return out

    async def wait_playing(self, ma: MusicAssistant, player_id: str, uri: str) -> None:
        """Wait until the queue plays uri, so a seek lands in the new book rather than the old."""
        for _ in range(40):
            queue = await ma.command("player_queues/get", queue_id=player_id)
            item = ((queue or {}).get("current_item") or {}).get("media_item") or {}
            if queue and queue.get("state") == "playing" and item.get("uri") == uri:
                return
            await asyncio.sleep(0.25)

    async def command(
        self,
        player_id: str,
        action: str,
        uri: str = "",
        position: float = 0,
        from_position: bool = False,
        *,
        profile: str | None = None,
    ) -> None:
        # What a child starts plays as its own user, so Music Assistant keeps its progress apart.
        ma = self.ma(profile)

        async def seek(pos: float) -> None:
            # Music Assistant takes a seek to 0 as no seek at all (tried on a Sendspin player), so the very
            # start is asked for as second 1.
            await ma.command("player_queues/seek", queue_id=player_id, position=int(max(1, pos)))

        if action in ("play", "restart") and EPISODE in uri:
            # An episode starts where it was left too, and has no chapters to look for.
            restart = {"start_from_beginning": True} if action == "restart" else {}
            await ma.command(
                "player_queues/play_media", queue_id=player_id, media=[uri], option="replace", **restart
            )
        elif action in ("play", "restart"):
            if not uri.startswith("library://audiobook/"):
                raise MusicAssistantError("not an audiobook")
            if action == "restart":
                from_position, position = True, 0
            await ma.command("player_queues/play_media", queue_id=player_id, media=[uri], option="replace")
            # Music Assistant starts an audiobook where it was left. A chapter, or starting over, then moves
            # to where it asks, once the book is playing (a seek before that is lost to the resume).
            if from_position:
                await self.wait_playing(ma, player_id, uri)
                await seek(position)
        elif action == "play_pause":
            await ma.command("player_queues/play_pause", queue_id=player_id)
        elif action == "seek":
            await seek(position)
        elif action in ("chapter_prev", "chapter_next"):
            st = await self.state(player_id, profile)
            if not st["book"]:
                return
            chapters = self.chapters(st["book"]["id"])
            elapsed = st["elapsed"]
            if not chapters:
                await seek(elapsed + (60 if action == "chapter_next" else -60))
                return
            cur = max((i for i, c in enumerate(chapters) if elapsed >= c["start"]), default=0)
            if action == "chapter_next" and cur + 1 < len(chapters):
                await seek(chapters[cur + 1]["start"])
            elif action == "chapter_prev":
                await seek(
                    chapters[cur]["start"]
                    if elapsed - chapters[cur]["start"] > 5 or cur == 0
                    else chapters[cur - 1]["start"]
                )
        else:
            raise MusicAssistantError(f"unknown action {action}")
