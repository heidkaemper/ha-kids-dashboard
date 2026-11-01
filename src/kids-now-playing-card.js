import { LitElement } from 'lit'
import { KidsDashboardApi } from './api.js'
import { isEpisode } from './format.js'
import { nowPlaying } from './now-playing.js'
import { PlaybackController } from './playback.js'
import { nowPlayingStyles } from './styles.js'
import { nowPlayingMedia, renderNowPlaying } from './views/now-playing.js'

// kids-now-playing-card: Now Playing over the whole screen, navbar and its player included. It comes up as soon
// as the player starts and stays through a pause, until the player has been stopped for a while; until then
// the card takes no room. It belongs on every view, and the views share whether it is up. While a podcast
// episode is the player's, it sets --kids-dashboard-skip-display: none on the page (see SKIP_DISPLAY).
//
//   type: custom:kids-now-playing-card
//   entity: media_player.kids_room   # the Music Assistant player it shows

// The timeline moves on this often while something plays: often enough to glide through a ten-second intro.
const TICK = 100

// How far behind the timeline's last place an answer from the player may land and still not move it back.
const STEADY = 1.5

// Music Assistant cannot pause the Echo's player: a pause stops it and keeps the place. Like the navbar's
// player, Now Playing stays through a pause and counts it as the end only after this long.
const ENDED_AFTER = 10 * 60 * 1000

// How far back and next skip in a podcast episode, in seconds.
const SKIP = 30

// "none" on the page while a podcast episode is the player's, for a floating player around the dashboard to
// hide its skip button by: an episode is alone in the queue, so skipping does nothing. A custom property
// reaches into every card's shadow root, which a class on the page would not.
const SKIP_DISPLAY = '--kids-dashboard-skip-display'

class KidsNowPlayingCard extends LitElement {
    static styles = nowPlayingStyles

    static properties = {
        open: { state: true },
        scrub: { state: true },
    }

    #hass = null
    #api = null
    #ticker = null
    #shown = null
    #askedAtEnd = 0
    #playback = new PlaybackController(this, null, () => this.open)

    constructor() {
        super()
        this.open = nowPlaying.open
        this.scrub = null
    }

    setConfig(config) {
        if (!config.entity) {
            throw new Error('entity: the Music Assistant player to show')
        }

        this.config = config
    }

    /**
     * The player's state goes to nowPlaying, which decides from when Home Assistant saw it change whether
     * that is a new start. A card keeps no state of its own for it: one on a view out of sight would take
     * the player it finds on coming back for one that just started.
     */
    set hass(hass) {
        const entity = hass.states[this.config.entity]

        this.#hass = hass
        this.#api = new KidsDashboardApi(hass, this.config.entity)
        this.#playback.api = this.#api

        if (!entity) {
            return
        }

        this.#tellSkip(isEpisode(entity.attributes.media_content_id))

        if (entity.state === 'playing') {
            nowPlaying.started(entity.last_changed)
            return
        }

        nowPlaying.stopped(entity.last_changed)
    }

    getCardSize() {
        return 0
    }

    connectedCallback() {
        super.connectedCallback()
        nowPlaying.listen(this.#onChanged)
        this.#onChanged()
        this.#ticker = setInterval(() => this.#tick(), TICK)
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        nowPlaying.unlisten(this.#onChanged)
        clearInterval(this.#ticker)
    }

    render() {
        if (!this.open || !this.#hass) {
            return ''
        }

        const entity = this.#hass.states[this.config.entity]
        const media = nowPlayingMedia(this.#playback.state, this.#playback.elapsed, entity)

        if (!media) {
            return ''
        }

        const playing = this.#playback.state ? this.#playback.playing : entity?.state === 'playing'

        return renderNowPlaying({
            media: this.scrub === null ? this.#steady(media, playing) : { ...media, position: this.scrub },
            playing,
            onClose: () => nowPlaying.dismiss(playing),
            onToggle: () => this.#toggle(),
            onPrevious: () => this.#skip('previous', media),
            onNext: () => this.#skip('next', media),
            onScrub: (position) => (this.scrub = position),
            onSeek: (position) => this.#seek(position, media.book),
        })
    }

    #tellSkip(episode) {
        const root = document.documentElement.style

        if (episode) {
            root.setProperty(SKIP_DISPLAY, 'none')
            return
        }

        root.removeProperty(SKIP_DISPLAY)
    }

    #onChanged = () => {
        this.open = nowPlaying.open

        if (this.open) {
            this.#playback.poll()
        }
    }

    #tick() {
        if (!this.open || !this.#hass) {
            return
        }

        const entity = this.#hass.states[this.config.entity]
        // Since the last playback, not the last change: the Echo coming back after a restart changes the state too.
        const lastPlayed = entity?.attributes.media_position_updated_at || entity?.last_changed

        if (entity?.state !== 'playing' && Date.now() - Date.parse(lastPlayed) >= ENDED_AFTER) {
            nowPlaying.hide()
            return
        }

        if (!this.#playback.playing || this.scrub !== null) {
            return
        }

        // A chapter's end reached: ask the player at once for the next one instead of waiting up to two
        // seconds with a full timeline.
        const media = nowPlayingMedia(this.#playback.state, this.#playback.elapsed, entity)

        if (media && media.position >= media.end && Date.now() - this.#askedAtEnd > 1000) {
            this.#askedAtEnd = Date.now()
            this.#playback.poll()
        }

        this.requestUpdate()
    }

    /**
     * The player answers every two seconds, and an answer can land a moment behind the estimate in between.
     * While it plays, the timeline does not step back for that, only for a real jump: a seek, another chapter.
     */
    #steady(media, playing) {
        const last = this.#shown
        const behind = last ? last.position - media.position : 0
        const position = playing && last?.start === media.start && behind > 0 && behind < STEADY
            ? last.position
            : media.position

        this.#shown = { start: media.start, position }

        return { ...media, position }
    }

    #toggle() {
        this.#playback.expect(this.#playback.playing ? 'paused' : 'playing')
        this.#playback.command('play_pause')
    }

    /**
     * Back and next move a chapter in an audiobook: back to the chapter's start, or the one before within its
     * first seconds (the integration's chapter_prev). In a podcast episode they skip half a minute. Anything
     * else skips as its player does.
     */
    async #skip(direction, media) {
        if (media.book) {
            await this.#playback.command(direction === 'next' ? 'chapter_next' : 'chapter_prev')
            return
        }

        if (media.episode) {
            const position = media.position + (direction === 'next' ? SKIP : -SKIP)

            // Not past the end, which would end the episode, nor to second 0, which Music Assistant ignores.
            await this.#seek(Math.max(1, media.end ? Math.min(position, media.end - 1) : position), false)
            return
        }

        await this.#hass.callService('media_player', `media_${direction}_track`, { entity_id: this.config.entity })
        this.#playback.poll()
    }

    async #seek(position, book) {
        try {
            if (book) {
                await this.#playback.command('seek', { position })
            } else {
                await this.#hass.callService('media_player', 'media_seek', {
                    entity_id: this.config.entity,
                    seek_position: position,
                })
            }
        } finally {
            this.scrub = null
        }
    }
}

customElements.define('kids-now-playing-card', KidsNowPlayingCard)

window.customCards = window.customCards || []
window.customCards.push({
    type: 'kids-now-playing-card',
    name: 'Kids Now Playing',
    description: 'Was gerade läuft, groß über dem ganzen Bildschirm',
})
