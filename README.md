# Kids Dashboard

A Home Assistant integration and card for a kids' room screen, made for a small kiosk such as an Echo Show 5
running Kiosk Satellite.

- **The card** shows every audiobook grouped by author, as Music Assistant's author page does, each group with
  the author's picture, the groups played lately on that screen first; a book with neither author nor collection
  stands on its own. A tap opens a group (its books in one list, heard ones ticked), then a book with its chapters.
  There is no search and no settings, so it suits a child's screen. A player bar stays at the bottom: cover,
  title, the current chapter, and previous chapter / play-pause / next chapter; other playback on the player
  (music, podcasts, radio) shows there too. The colors come from the Home Assistant theme, so it follows dark mode.
- **The integration** reads the library from Music Assistant's own API, since Home Assistant's Music Assistant
  integration does not pass collections or chapters on. It reads the list again every minute (details only for
  new books), so new audiobooks show up on their own. It remembers, per player, which groups played there lately
  (kept across restarts). Covers are fetched through Home Assistant and kept on disk.

## Install

1. Build the card (`npm install`, `npm run build`; the repository has no built file), then copy
   `custom_components/kids_dashboard` into Home Assistant's `/config/custom_components/` and restart Home
   Assistant. Or run `./deploy.sh --restart` with SSH access to Home Assistant, which does all of it.
2. **Settings → Devices & services → Add integration → Kids Dashboard**: Music Assistant's address (for the
   add-on, `http://homeassistant.local:8095` or the host's IP) and a long-lived token made in Music Assistant,
   ideally for a user of its own.
3. Optional: the integration's **Configure** sets the favourite series, which are shown first.

The integration adds the card to the dashboard resources by itself (storage mode); in YAML mode add
`/kids_dashboard/kids-dashboard-card.js` as a module resource.

## Card

```yaml
type: custom:kids-dashboard-card
entity: media_player.kids_room   # a Music Assistant player
title: Hörspiele                 # optional
height: 100vh                    # optional; the card scrolls inside itself at this height
```

Use it alone in a **Panel** view so it fills the screen.

## Requirements

Home Assistant 2025.1 or later with the Music Assistant integration, and Music Assistant 2.7 or later (token
login). Audiobook collections come from providers that have them, such as Audiobookshelf.


## Development

```sh
npm install
npm run lint      # ESLint, see CLAUDE.md for the rules
npm run build     # bundles src/ into custom_components/kids_dashboard/www/
./deploy.sh       # lint, build, copy to Home Assistant over SSH (HA_SSH=root@host)
```

Python is formatted and checked with [Ruff](https://docs.astral.sh/ruff/): `ruff format` and `ruff check`.
