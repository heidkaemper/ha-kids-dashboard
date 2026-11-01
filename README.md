# Kids Dashboard

A Home Assistant integration and card for a kids' room screen, made for a small kiosk such as an Echo Show 5
running Kiosk Satellite.

- **The card** shows every audiobook grouped by author, as Music Assistant's author page does, each group with
  the author's picture, the groups played lately on that screen first; a book with neither author nor collection
  stands on its own. A tap opens a group (its books in one list, heard ones ticked), then a book with its chapters.
  A tile "Zuletzt" comes first and lists the books heard lately on that screen. There is no search and no settings, so it suits a child's screen. A player bar stays at the bottom: cover,
  title, the current chapter, and previous chapter / play-pause / next chapter; other playback on the player
  (music, podcasts, radio) shows there too. The colors come from the Home Assistant theme, so it follows dark mode.
- **The podcast card** shows the podcasts liked in Music Assistant, one tile each, the ones heard lately first.
  Two tiles come before them: "Zuletzt gehört" (the episodes heard lately) and "Kürzlich aktualisiert" (the newest
  episodes of the last 30 days). A podcast opens its episodes, the newest first, heard ones ticked; a tap plays an
  episode where it was left. New episodes come as Music Assistant reads the feeds.
- **The integration** reads the library from Music Assistant's own API, since Home Assistant's Music Assistant
  integration does not pass collections or chapters on. It reads the list again every minute (details only for
  new books), so new audiobooks show up on their own. It remembers, per player, which groups and books played there
  lately, each after a minute of listening (kept across restarts). Covers are fetched through Home Assistant and kept on disk.
- **Profiles:** each child has a user of its own in Music Assistant, and the integration a profile with that
  user's token. Everything a card does goes through its profile, so Music Assistant keeps each child's progress,
  what it played lately and (from Music Assistant 2.11) what it likes apart. Up to 2.10 a like counts for every
  user, so a podcast liked by anyone shows on every screen.

## Install

1. Build the card (`npm install`, `npm run build`; the repository has no built file), then copy
   `custom_components/kids_dashboard` into Home Assistant's `/config/custom_components/` and restart Home
   Assistant. Or run `./deploy.sh --restart` with SSH access to Home Assistant, which does all of it.
2. In Music Assistant, give each child a user of its own (role "user"). Sign in as that user and make a
   long-lived token.
3. **Settings → Devices & services → Add integration → Kids Dashboard**: Music Assistant's address (for the
   add-on, `http://homeassistant.local:8095` or the host's IP) and the first child's token. The profile is named
   after the Music Assistant user. **Add profile** on the integration adds the other children.
4. To show a podcast to a child, sign in to Music Assistant as the child and like the podcast.

The integration adds the card to the dashboard resources by itself (storage mode); in YAML mode add
`/kids_dashboard/kids-dashboard-card.js` as a module resource.

## Cards

```yaml
type: custom:kids-dashboard-card
entity: media_player.kids_room   # a Music Assistant player
profile: Kid                     # optional; the child's profile (default: the first)
title: Hörspiele                 # optional
height: 100vh                    # optional; the card scrolls inside itself at this height
```

```yaml
type: custom:kids-podcasts-card
entity: media_player.kids_room
profile: Kid
```

Use each alone in a **Panel** view so it fills the screen.

```yaml
type: custom:kids-now-playing-card   # on every view: what plays, over the whole screen
entity: media_player.kids_room
```

While a podcast episode plays, this card sets the CSS variable `--kids-dashboard-skip-display` to `none` on the
page. An episode is alone in the queue, so a floating player's skip button does nothing then; Navbar Card's can
hide it with `.media-player .media-player-button-skip { display: var(--kids-dashboard-skip-display, flex); }` in
its `styles`.

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
