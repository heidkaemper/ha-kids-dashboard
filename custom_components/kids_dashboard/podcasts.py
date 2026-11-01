"""The podcasts a profile likes in Music Assistant, with their episodes.

A podcast is shown once it is liked in Music Assistant, new episodes come with Music Assistant's own reading
of the feed. Up to Music Assistant 2.10 a like counts for every user; from 2.11 each user has its own, and
asking with the child's token then gives the child's.
"""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
import logging
import time

from .const import EPISODES_TTL, IMAGE_URL, LATEST_DAYS, LATEST_EPISODES, RECENT_EPISODES
from .library import MusicAssistant, MusicAssistantError

_LOGGER = logging.getLogger(__name__)


def _cover(item: dict) -> str:
    images = (item.get("metadata") or {}).get("images") or []
    proxy = images[0].get("proxy_id") if images else None
    return f"{IMAGE_URL}/{proxy}" if proxy else ""


def to_podcast(item: dict) -> dict:
    return {"id": item["item_id"], "name": item["name"], "cover": _cover(item), "count": 0}


def to_episode(item: dict, podcast: dict) -> dict:
    """Music Assistant's episode as the card wants it. It is known by its URI: the provider's id of an
    episode is its feed's address and more, and an episode is in no library of its own."""
    return {
        "id": item["uri"],
        "uri": item["uri"],
        "title": item["name"],
        "podcast": podcast["name"],
        "podcast_id": podcast["id"],
        "cover": _cover(item) or podcast["cover"],
        "date": (item.get("metadata") or {}).get("release_date") or "",
        # The podcast's own count, the newest highest; what orders episodes that have no date.
        "position": item.get("position") or 0,
        "duration": item.get("duration") or 0,
        "resume": (item.get("resume_position_ms") or 0) // 1000,
        "played": bool(item.get("fully_played")),
    }


def _released(episode: dict) -> datetime:
    try:
        released = datetime.fromisoformat(episode["date"])
    except ValueError:
        return datetime.min.replace(tzinfo=UTC)
    return released if released.tzinfo else released.replace(tzinfo=UTC)


def _newest_first(episode: dict) -> tuple[datetime, int]:
    return _released(episode), episode["position"]


@dataclass
class Podcasts:
    """The podcasts per profile, read when the card asks; each podcast's episodes kept for EPISODES_TTL, as
    the home page asks every half minute and needs every episode for its two lists."""

    # When each episode was first seen: {podcast_id: {uri: unix time}}, kept by Home Assistant. Some
    # providers (ARD Audiothek) give no release date, so "Kürzlich aktualisiert" goes by this for theirs.
    # What a podcast held when first read counts as old (0).
    seen: dict[str, dict[str, float]] = field(default_factory=dict)
    on_seen: Callable[[], None] | None = None
    _episodes: dict[tuple[MusicAssistant, str], tuple[float, list[dict]]] = field(default_factory=dict)
    # Each liked podcast's id by its provider's (its feed): an episode that plays knows only that of its
    # podcast. None for a feed no liked podcast has.
    _by_feed: dict[str, str | None] = field(default_factory=dict)
    # One podcast's episodes at a time, whichever card asks: Music Assistant's ARD Audiothek fails on a second
    # podcast asked for meanwhile ("Transport is already connected", 2.10.9).
    _reading: asyncio.Lock = field(default_factory=asyncio.Lock)

    async def overview(self, ma: MusicAssistant) -> dict:
        """The home page: the liked podcasts, those heard lately first, the rest by name; and how many
        episodes "Zuletzt gehört" and "Kürzlich aktualisiert" hold, so an empty tile stays away."""
        podcasts, episodes = await self._all(ma)
        recent = await self._recent(ma, episodes)
        heard = [e["podcast_id"] for e in recent]
        order = sorted(
            podcasts,
            key=lambda p: (heard.index(p["id"]) if p["id"] in heard else len(heard), p["name"].lower()),
        )
        return {"podcasts": order, "recent": len(recent), "latest": len(self._latest(episodes))}

    async def podcast(self, ma: MusicAssistant, podcast_id: str, *, fresh: bool = True) -> dict | None:
        """A liked podcast and its episodes, the newest first. Read fresh, so what was heard is current,
        unless the card only wants them ready to show: then as last read, if that was within EPISODES_TTL."""
        found = next((p for p in await self._liked(ma) if p["id"] == podcast_id), None)
        if found is None:
            return None
        episodes = await self._episodes_of(ma, found, fresh=fresh)
        return {"podcast": {**found, "count": len(episodes)}, "episodes": episodes}

    async def podcast_of(self, ma: MusicAssistant, episode: dict) -> str | None:
        """The liked podcast an episode of Music Assistant's belongs to, by its id."""
        feed = (episode.get("podcast") or {}).get("item_id")
        if not feed:
            return None
        if feed not in self._by_feed:
            await self._liked(ma)
            self._by_feed.setdefault(feed, None)
        return self._by_feed[feed]

    async def recent(self, ma: MusicAssistant) -> list[dict]:
        _podcasts, episodes = await self._all(ma)
        return await self._recent(ma, episodes)

    async def latest(self, ma: MusicAssistant) -> list[dict]:
        _podcasts, episodes = await self._all(ma)
        return self._latest(episodes)

    async def _liked(self, ma: MusicAssistant) -> list[dict]:
        items = await ma.command("music/podcasts/library_items", favorite=True, limit=500)
        self._by_feed = {
            mapping["item_id"]: item["item_id"]
            for item in items
            for mapping in item.get("provider_mappings") or []
        }
        return [to_podcast(item) for item in items]

    async def _all(self, ma: MusicAssistant) -> tuple[list[dict], list[dict]]:
        """The liked podcasts, each with how many episodes it has now (a provider's own total can count
        episodes no longer offered), and all their episodes."""
        podcasts = await self._liked(ma)
        everything: list[dict] = []
        for podcast in podcasts:
            try:
                episodes = await self._episodes_of(ma, podcast)
            except MusicAssistantError as err:
                # One podcast that cannot be read leaves the others, with what was read of it before.
                _LOGGER.warning("Reading the episodes of %s failed: %s", podcast["name"], err)
                episodes = (self._episodes.get((ma, podcast["id"])) or (0, []))[1]
            podcast["count"] = len(episodes)
            everything += episodes
        return podcasts, everything

    async def _episodes_of(self, ma: MusicAssistant, podcast: dict, fresh: bool = False) -> list[dict]:
        key = (ma, podcast["id"])
        kept = self._episodes.get(key)
        if kept and not fresh and time.monotonic() - kept[0] < EPISODES_TTL:
            return kept[1]
        async with self._reading:
            items = await ma.command(
                "music/podcasts/podcast_episodes",
                item_id=podcast["id"],
                provider_instance_id_or_domain="library",
            )
        episodes = [to_episode(item, podcast) for item in items]
        self._date_new(podcast["id"], episodes)
        episodes.sort(key=_newest_first, reverse=True)
        self._episodes[key] = (time.monotonic(), episodes)
        return episodes

    def _date_new(self, podcast_id: str, episodes: list[dict]) -> None:
        """Note the episodes not seen before, and give one without a release date the day it was first
        seen. Episodes gone from the feed are forgotten."""
        now = time.time()
        known = self.seen.get(podcast_id)
        first = 0 if known is None else now
        seen = {e["uri"]: (known or {}).get(e["uri"], first) for e in episodes}
        if seen != known:
            self.seen[podcast_id] = seen
            if self.on_seen:
                self.on_seen()
        for e in episodes:
            if not e["date"] and seen[e["uri"]]:
                e["date"] = datetime.fromtimestamp(seen[e["uri"]], UTC).isoformat()

    async def _recent(self, ma: MusicAssistant, episodes: list[dict]) -> list[dict]:
        """The episodes the profile played lately, the latest first, of the podcasts it still likes. Music
        Assistant counts only episodes heard to the end unless asked otherwise; one begun counts here too."""
        played = await ma.command(
            "music/recently_played_items",
            limit=50,
            media_types=["podcast_episode"],
            fully_played_only=False,
        )
        by_uri = {e["uri"]: e for e in episodes}
        uris = list(dict.fromkeys(item["uri"] for item in played))
        return [by_uri[uri] for uri in uris if uri in by_uri][:RECENT_EPISODES]

    def _latest(self, episodes: list[dict]) -> list[dict]:
        since = datetime.now(UTC) - timedelta(days=LATEST_DAYS)
        fresh = [e for e in episodes if _released(e) >= since]
        return sorted(fresh, key=_newest_first, reverse=True)[:LATEST_EPISODES]
