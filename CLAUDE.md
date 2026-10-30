# Kids Dashboard: notes for agents and contributors

A Home Assistant integration (`custom_components/kids_dashboard`, Python) and a dashboard card
(`src/`, JavaScript with Lit, built with Vite into the integration's `www/`). The card runs on a small kiosk screen
in a child's room (an Echo Show 5 with Kiosk Satellite, 960×480), so it has to be simple, quick and calm.


## Layout

- `src/` is the card's source. `npm run build` bundles it into `custom_components/kids_dashboard/www/`.
  The built file is committed, so the integration installs without a build.
- `custom_components/kids_dashboard/` is the integration: it talks to Music Assistant, answers the card over
  Home Assistant's websocket (`kids_dashboard/*`), serves the card and the covers, and adds the card to the
  dashboard resources by itself.
- The card talks only to Home Assistant, never to Music Assistant or anything else directly.


## JavaScript

Enforced by ESLint (`npm run lint`, `npm run lint:fix`), so run it before every commit:

- No semicolons, single quotes, 4 spaces, trailing commas in multi-line lists.
- `const` by default, `let` only when the value changes, never `var`.
- `===` only, braces on every block.

Not enforced, but expected:

- **Happy path first.** Handle the special cases at the top and return early; the normal case reads straight
  down without nesting. No `else` after a `return`.
- **Let the code breathe.** A blank line between the steps of a function, between declarations and logic, and
  before the final `return`.
- **Small, named pieces.** One view per file in `src/views/`, each a function that takes what it needs and
  returns a Lit template. The card element wires them together; it does not draw.
- **Lit's way.** Templates with `html`, styles in `styles.js` with the theme's CSS variables, state as
  reactive properties. No `innerHTML`, no hand-made DOM updates.
- Private fields (`#name`) for what is internal to a class.
- Comments say *why*, not *what*: a decision, a quirk of Music Assistant or the Echo, a trade-off.
- User-facing text is German and short enough for a child; code, comments and commit messages are English.


## Python

Enforced by Ruff (`ruff format` and `ruff check`, configured in `pyproject.toml`):

- Home Assistant's style: type hints, `async` all the way, no blocking I/O in the event loop
  (`hass.async_add_executor_job` for files).
- Early returns here too; small functions; comments say why.
- Talk to Music Assistant only through `MusicAssistant.command()` in `library.py`.


## Music Assistant quirks worth knowing

- Home Assistant's Music Assistant integration passes only name, image and URI on; authors, collections and
  chapters need Music Assistant's own API (`music/item_by_uri`).
- `player_queues/seek` to position 0 is ignored. The very start is asked for as second 1, once the book plays.
- An audiobook always resumes at its saved point on `play_media`.
- A player's id in Music Assistant is the `unique_id` of its Home Assistant media player.


## Working on the live system

- Home Assistant must **not** be restarted while someone may be listening: ask first.
- Card-only changes need no restart: build, copy the file, bump the resource URL's `?v=`.
- Python changes need a restart: `./deploy.sh --restart` (`HA_SSH` names the host).
- Bump `VERSION` in `const.py` and `version` in `manifest.json` together on every change that ships.


## Privacy

The repository is public. No IP addresses, tokens, host names, or names of family members in code, docs,
examples or commits. Examples use neutral names such as `media_player.kids_room`.
