"""Kids Dashboard: a kids' room screen for Home Assistant: the audiobooks ("Hörspiele") from Music Assistant,
grouped as Music Assistant groups them, and the podcasts a child likes there.

The integration keeps the library and talks to Music Assistant; the card (served from this folder and
loaded on every dashboard) talks only to Home Assistant, over its websocket.
"""

from __future__ import annotations

from datetime import timedelta
import logging
from pathlib import Path
import re
import time
from types import MappingProxyType

from aiohttp import web
from homeassistant.components import websocket_api
from homeassistant.components.http import HomeAssistantView, StaticPathConfig
from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.const import EVENT_CALL_SERVICE, EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import CoreState, Event, HomeAssistant, callback
from homeassistant.helpers import config_validation as cv, entity_registry as er
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.helpers.storage import Store
import voluptuous as vol

from .const import (
    CARD_URL,
    CONF_TOKEN,
    CONF_URL,
    DOMAIN,
    IMAGE_URL,
    REFRESH_INTERVAL,
    SUBENTRY_PROFILE,
    VERSION,
)
from .library import Library, MusicAssistant, MusicAssistantError
from .podcasts import Podcasts

_LOGGER = logging.getLogger(__name__)

type KidsDashboardConfigEntry = ConfigEntry[Library]

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Serve the card and register what it calls, once, whatever entries come and go."""
    await hass.http.async_register_static_paths(
        [StaticPathConfig(CARD_URL, str(Path(__file__).parent / "www" / "kids-dashboard-card.js"), False)]
    )
    hass.http.register_view(CoverView(hass))
    for command in (
        ws_library,
        ws_recent,
        ws_series,
        ws_book,
        ws_state,
        ws_command,
        ws_podcasts,
        ws_podcast,
        ws_episodes,
    ):
        websocket_api.async_register_command(hass, command)

    async def add_resource(_event=None) -> None:
        await _ensure_resource(hass)

    if hass.state is CoreState.running:
        await add_resource()
    else:
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, add_resource)
    return True


async def _ensure_resource(hass: HomeAssistant) -> None:
    """Add the card to the dashboards' resources, as HACS does for its cards, and keep its version current.

    A resource is loaded where an extra module may not be: Kiosk Satellite's view of Home Assistant loads
    resources but did not define a card from an extra module.
    """
    url = f"{CARD_URL}?v={VERSION}"
    lovelace = hass.data.get("lovelace")
    resources = getattr(lovelace, "resources", None)
    if resources is None or not hasattr(resources, "async_create_item"):
        _LOGGER.warning("Dashboards are in YAML mode: add %s as a module resource by hand", url)
        return
    if not resources.loaded:
        await resources.async_load()
        resources.loaded = True
    for item in resources.async_items():
        if item["url"].split("?")[0] == CARD_URL:
            if item["url"] != url:
                await resources.async_update_item(item["id"], {"res_type": "module", "url": url})
            return
    await resources.async_create_item({"res_type": "module", "url": url})


async def async_migrate_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Version 1 had one token; from version 2 each child has a profile with its own. The one token becomes
    the first profile, so the dashboard carries on until the children's profiles are added."""
    if entry.version > 2:
        return False
    if entry.version == 1:
        token = entry.data[CONF_TOKEN]
        try:
            user = await MusicAssistant(hass, entry.data[CONF_URL], token).user()
        except MusicAssistantError:
            user = {}
        hass.config_entries.async_add_subentry(
            entry,
            ConfigSubentry(
                data=MappingProxyType({CONF_TOKEN: token}),
                subentry_type=SUBENTRY_PROFILE,
                title=user.get("display_name") or user.get("username") or "Standard",
                unique_id=user.get("user_id"),
            ),
        )
        hass.config_entries.async_update_entry(entry, data={CONF_URL: entry.data[CONF_URL]}, version=2)
    return True


def _clients(hass: HomeAssistant, entry: ConfigEntry):
    """The profiles' connections to Music Assistant, read from the entry each time, so a profile added or
    removed counts without a reload. One connection per token, made once."""
    made: dict[str, MusicAssistant] = {}

    def clients() -> dict[str, MusicAssistant]:
        out: dict[str, MusicAssistant] = {}
        for sub in entry.subentries.values():
            if sub.subentry_type != SUBENTRY_PROFILE:
                continue
            token = sub.data[CONF_TOKEN]
            if token not in made:
                made[token] = MusicAssistant(hass, entry.data[CONF_URL], token)
            out[sub.title.casefold()] = made[token]
        return out

    return clients


async def async_setup_entry(hass: HomeAssistant, entry: KidsDashboardConfigEntry) -> bool:
    lib = Library(_clients(hass, entry), Podcasts())
    # What played last on each player outlives restarts, so each screen keeps its own order. Taken over once
    # from the integration's earlier name, Hörspiele.
    store: Store[dict] = Store(hass, 1, f"{DOMAIN}.recent")
    lib.recent = await store.async_load() or await Store(hass, 1, "hoerspiele.recent").async_load() or {}
    # The books for "Zuletzt", in a store of their own: the groups' store stays as it was.
    heard: Store[dict] = Store(hass, 1, f"{DOMAIN}.heard")
    lib.heard = await heard.async_load() or {}

    # When each podcast episode was first seen, for "Kürzlich aktualisiert" where a feed gives no dates.
    seen: Store[dict] = Store(hass, 1, f"{DOMAIN}.episodes")
    lib.podcasts.seen = await seen.async_load() or {}

    @callback
    def save_recent() -> None:
        store.async_delay_save(lambda: lib.recent, 30)
        heard.async_delay_save(lambda: lib.heard, 30)

    lib.on_recent = save_recent
    lib.podcasts.on_seen = lambda: seen.async_delay_save(lambda: lib.podcasts.seen, 30)
    entry.runtime_data = lib
    # The first read can take a while (every audiobook's details): the card waits for it,
    # Home Assistant does not.
    entry.async_create_background_task(hass, _refresh(lib), "kids dashboard first read")

    async def tick(_now) -> None:
        await _refresh(lib)

    entry.async_on_unload(async_track_time_interval(hass, tick, timedelta(seconds=REFRESH_INTERVAL)))
    entry.async_on_unload(
        hass.bus.async_listen(EVENT_CALL_SERVICE, _chapter_skip(hass, lib), event_filter=_is_track_skip)
    )
    return True


# A media player's next button (Navbar Card's, Home Assistant's own) skips a queue item, and an audiobook is
# one item: Music Assistant does nothing. So while an audiobook plays it moves a chapter on. Not the previous
# button: there Music Assistant starts its one item over itself, and a chapter seek would race with that.
TRACK_SKIPS = {"media_next_track": "chapter_next"}


@callback
def _is_track_skip(event_data) -> bool:
    return event_data.get("domain") == "media_player" and event_data.get("service") in TRACK_SKIPS


def _chapter_skip(hass: HomeAssistant, lib: Library):
    async def skip(event: Event) -> None:
        entity_ids = event.data.get("service_data", {}).get("entity_id", [])
        if isinstance(entity_ids, str):
            entity_ids = [entity_ids]
        for entity_id in entity_ids:
            try:
                # Does nothing where no audiobook is on the player: there the skip is Music Assistant's.
                await lib.command(_player_id(hass, entity_id), TRACK_SKIPS[event.data["service"]])
            except MusicAssistantError:
                continue

    return skip


async def async_unload_entry(hass: HomeAssistant, entry: KidsDashboardConfigEntry) -> bool:
    return True


async def _refresh(lib: Library) -> None:
    try:
        await lib.refresh()
    except MusicAssistantError as err:
        _LOGGER.warning("Reading the library from Music Assistant failed: %s", err)


@callback
def _library(hass: HomeAssistant) -> Library | None:
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    return entries[0].runtime_data if entries else None


def _player_id(hass: HomeAssistant, entity_id: str) -> str:
    """Music Assistant's id of a player, from its Home Assistant entity."""
    entry = er.async_get(hass).async_get(entity_id)
    if entry is None or entry.platform != "music_assistant":
        raise MusicAssistantError(f"{entity_id} is not a Music Assistant player")
    return entry.unique_id


def _handler(fn):
    """Run a websocket command with the library, answering with an error instead of raising."""

    async def run(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
        lib = _library(hass)
        if lib is None:
            connection.send_error(msg["id"], "not_set_up", "Kids Dashboard is not set up")
            return
        try:
            if not lib.shelves and not lib.read_at:
                await lib.refresh()
            connection.send_result(msg["id"], await fn(hass, lib, msg))
        except MusicAssistantError as err:
            connection.send_error(msg["id"], "music_assistant", str(err))

    return run


# Every command names the card's profile; without one, the first profile counts.
PROFILE = vol.Optional("profile")


@websocket_api.websocket_command(
    {vol.Required("type"): "kids_dashboard/library", vol.Optional("entity_id"): str, PROFILE: str}
)
@websocket_api.async_response
@_handler
async def ws_library(hass, lib: Library, msg):
    player_id = _player_id(hass, msg["entity_id"]) if msg.get("entity_id") else None
    return lib.overview(player_id, msg.get("profile"))


@websocket_api.websocket_command(
    {vol.Required("type"): "kids_dashboard/recent", vol.Required("entity_id"): str, PROFILE: str}
)
@websocket_api.async_response
@_handler
async def ws_recent(hass, lib: Library, msg):
    return lib.recently_heard(_player_id(hass, msg["entity_id"]), msg.get("profile"))


@websocket_api.websocket_command(
    {vol.Required("type"): "kids_dashboard/series", vol.Required("series_id"): str, PROFILE: str}
)
@websocket_api.async_response
@_handler
async def ws_series(hass, lib: Library, msg):
    if (found := lib.collection(msg["series_id"], msg.get("profile"))) is None:
        raise MusicAssistantError("unknown series")
    return found


@websocket_api.websocket_command(
    {vol.Required("type"): "kids_dashboard/book", vol.Required("book_id"): str, PROFILE: str}
)
@websocket_api.async_response
@_handler
async def ws_book(hass, lib: Library, msg):
    return await lib.book(msg["book_id"], msg.get("profile"))


@websocket_api.websocket_command(
    {vol.Required("type"): "kids_dashboard/state", vol.Required("entity_id"): str, PROFILE: str}
)
@websocket_api.async_response
@_handler
async def ws_state(hass, lib: Library, msg):
    return await lib.state(_player_id(hass, msg["entity_id"]), msg.get("profile"))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "kids_dashboard/command",
        vol.Required("entity_id"): str,
        vol.Required("action"): vol.In(
            ["play", "restart", "play_pause", "seek", "chapter_prev", "chapter_next"]
        ),
        vol.Optional("uri", default=""): str,
        vol.Optional("position", default=0): vol.Coerce(float),
        vol.Optional("from_position", default=False): bool,
        PROFILE: str,
    }
)
@websocket_api.async_response
@_handler
async def ws_command(hass, lib: Library, msg):
    await lib.command(
        _player_id(hass, msg["entity_id"]),
        msg["action"],
        msg["uri"],
        msg["position"],
        msg["from_position"],
        profile=msg.get("profile"),
    )
    return {"ok": True}


@websocket_api.websocket_command({vol.Required("type"): "kids_dashboard/podcasts", PROFILE: str})
@websocket_api.async_response
@_handler
async def ws_podcasts(hass, lib: Library, msg):
    return await lib.podcasts.overview(lib.ma(msg.get("profile")))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "kids_dashboard/podcast",
        vol.Required("podcast_id"): str,
        vol.Optional("fresh", default=True): bool,
        PROFILE: str,
    }
)
@websocket_api.async_response
@_handler
async def ws_podcast(hass, lib: Library, msg):
    """A podcast's episodes; fresh=False takes them as last read, for the card to have them ready."""
    ma = lib.ma(msg.get("profile"))
    if (found := await lib.podcasts.podcast(ma, msg["podcast_id"], fresh=msg["fresh"])) is None:
        raise MusicAssistantError("unknown podcast")
    return found


@websocket_api.websocket_command(
    {
        vol.Required("type"): "kids_dashboard/episodes",
        vol.Required("list"): vol.In(["recent", "latest"]),
        PROFILE: str,
    }
)
@websocket_api.async_response
@_handler
async def ws_episodes(hass, lib: Library, msg):
    """The episodes behind the two tiles: "Zuletzt gehört" and "Kürzlich aktualisiert"."""
    ma = lib.ma(msg.get("profile"))
    if msg["list"] == "recent":
        return await lib.podcasts.recent(ma)
    return await lib.podcasts.latest(ma)


PROXY_ID = re.compile(r"^[0-9a-f]{16,128}$")

# A kept cover is asked for again in the background once it is this old, in seconds, and a browser keeps one
# this long: a picture changed in Audiobookshelf shows within about a day.
COVER_RENEW = 60 * 60
COVER_MAX_AGE = 24 * 60 * 60


class CoverView(HomeAssistantView):
    """The covers, from Music Assistant's image proxy, kept on disk: a page of them comes up much quicker
    from here. Open without a login, as an <img> sends none; it serves nothing but cover art, by an id only
    Music Assistant hands out."""

    url = IMAGE_URL + "/{proxy_id}"
    name = "api:kids_dashboard:img"
    requires_auth = False

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.cache = Path(hass.config.path(".storage", "kids_dashboard_covers"))

    async def get(self, request: web.Request, proxy_id: str) -> web.Response:
        size = request.query.get("s", "256")
        if size not in ("160", "256", "512") or not PROXY_ID.match(proxy_id):
            return web.Response(status=404)
        path = self.cache / f"{proxy_id}-{size}.jpg"
        data, age = await self.hass.async_add_executor_job(_read, path)
        if data is None:
            data = await self._fetch(path, proxy_id, int(size))
            if data is None:
                return web.Response(status=404)
        elif age > COVER_RENEW:
            # A picture can change at the same address (Audiobookshelf's cover or author picture): the kept
            # one is served at once, and the current one is fetched for next time.
            self.hass.async_create_background_task(
                self._fetch(path, proxy_id, int(size)), f"kids dashboard cover {proxy_id}"
            )
        return web.Response(
            body=data,
            content_type="image/jpeg",
            headers={"Cache-Control": f"public, max-age={COVER_MAX_AGE}"},
        )

    async def _fetch(self, path: Path, proxy_id: str, size: int) -> bytes | None:
        lib = _library(self.hass)
        try:
            data = await lib.ma().image(proxy_id, size) if lib else None
        except MusicAssistantError:
            data = None
        if data is not None:
            await self.hass.async_add_executor_job(_write, path, data)
        return data


def _read(path: Path) -> tuple[bytes | None, float]:
    """A kept cover and how old it is, in seconds."""
    try:
        return path.read_bytes(), time.time() - path.stat().st_mtime
    except OSError:
        return None, 0


def _write(path: Path, data: bytes) -> None:
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    except OSError as err:
        _LOGGER.debug("Could not keep cover %s: %s", path.name, err)
