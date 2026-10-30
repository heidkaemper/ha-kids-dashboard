import { LitElement, html } from 'lit'
import { KidsDashboardApi } from './api.js'
import { icons } from './icons.js'
import { PlaybackController } from './playback.js'
import { styles } from './styles.js'
import { renderBook } from './views/book.js'
import { renderGroup } from './views/group.js'
import { renderHome } from './views/home.js'
import { renderPlayerBar } from './views/player-bar.js'

// kids-dashboard-card: a kids' room screen for Home Assistant. Its first part is the audiobooks ("Hörspiele"),
// grouped by author as Music Assistant groups them, with a player bar at the bottom.
//
//   type: custom:kids-dashboard-card
//   entity: media_player.kids_room   # the Music Assistant player it plays on
//   title: Hörspiele                 # optional heading on the home page
//   height: 100vh                    # optional: the card scrolls inside itself at this height

// New audiobooks, and the order of what played last, reach the home page this often.
const LIBRARY_INTERVAL = 30000

const HOME = { kind: 'home' }

// A book in no group stands on its own: its group id is "b" and its own id (see the integration's to_book).
const isSingle = (groupId) => groupId.startsWith('b')

class KidsDashboardCard extends LitElement {
    static styles = styles

    static properties = {
        page: { state: true },
        groups: { state: true },
        group: { state: true },
        book: { state: true },
        failed: { state: true },
    }

    #hass = null
    #api = null
    #libraryTimer = null
    #playback = new PlaybackController(this, null)

    constructor() {
        super()
        this.page = HOME
        this.groups = []
        this.group = null
        this.book = null
        this.failed = false
    }

    setConfig(config) {
        if (!config.entity) {
            throw new Error('entity: the Music Assistant player to play on')
        }

        this.config = config

        if (config.height) {
            this.style.setProperty('--kids-dashboard-height', config.height)
        }
    }

    set hass(hass) {
        const first = !this.#hass

        this.#hass = hass
        this.#api = new KidsDashboardApi(hass, this.config.entity)
        this.#playback.api = this.#api

        if (first) {
            this.#load()
            this.#playback.poll()
        }
    }

    getCardSize() {
        return 12
    }

    connectedCallback() {
        super.connectedCallback()
        this.#libraryTimer = setInterval(() => this.#refreshHome(), LIBRARY_INTERVAL)
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        clearInterval(this.#libraryTimer)
    }

    updated(changed) {
        if (changed.has('page')) {
            this.renderRoot.querySelector('.content')?.scrollTo(0, 0)
        }
    }

    render() {
        const home = this.page.kind === 'home'

        return html`
            <ha-card>
                ${this.#renderHeader(home)}

                <div class="content ${home ? 'home' : ''}">
                    ${this.#renderPage()}
                </div>

                ${renderPlayerBar({
                    playback: this.#playback,
                    onOpen: () => this.#openPlaying(),
                    onCommand: (action) => this.#command(action),
                })}
            </ha-card>
        `
    }

    #renderHeader(home) {
        if (home && !this.config.title) {
            return ''
        }

        const title = {
            home: this.config.title,
            group: this.group?.series.name,
            book: this.book?.series || this.book?.author || 'Hörspiel',
        }[this.page.kind]

        return html`
            <header>
                ${home ? '' : html`<button class="back" aria-label="Zurück" @click=${() => this.#back()}>${icons.back}</button>`}
                <h1>${title ?? ''}</h1>
            </header>
        `
    }

    #renderPage() {
        if (this.failed) {
            return html`<div class="empty">Die Hörspiele sind gerade nicht erreichbar. Bitte gleich noch einmal versuchen.</div>`
        }

        if (this.page.kind === 'group' && this.group) {
            return renderGroup({ books: this.group.books, onOpenBook: (id) => this.#show({ kind: 'book', id }) })
        }

        if (this.page.kind === 'book' && this.book) {
            return renderBook({
                book: this.book,
                playback: this.#playback,
                onPlay: (uri, position) => this.#play(uri, position),
                onRestart: (uri) => this.#command('restart', { uri }, 'playing'),
                onToggle: () => this.#command('play_pause'),
            })
        }

        if (this.page.kind === 'home') {
            return renderHome({
                groups: this.groups,
                onOpenGroup: (id) => this.#show({ kind: 'group', id }),
                onOpenBook: (id) => this.#show({ kind: 'book', id }),
            })
        }

        return ''
    }

    // Navigation

    /**
     * Back goes one level up, not to the page seen before: from a book to its group, from a group home. A book
     * opened from the player bar on another book's page goes back to its own group, not to that other book.
     */
    #back() {
        const groupId = this.book?.series_id

        if (this.page.kind !== 'book' || !groupId || isSingle(groupId)) {
            this.#show(HOME)
            return
        }

        this.#show({ kind: 'group', id: groupId })
    }

    #openPlaying() {
        const id = this.#playback.book?.id

        if (!id || (this.page.kind === 'book' && this.page.id === id)) {
            return
        }

        this.#show({ kind: 'book', id })
    }

    async #show(page) {
        // What another group or book left behind would show for a moment while the new one loads.
        if (page.kind === 'group' && this.group?.series.id !== page.id) {
            this.group = null
        }

        if (page.kind === 'book' && this.book?.id !== page.id) {
            this.book = null
        }

        this.page = page
        await this.#load()
    }

    async #load() {
        if (!this.#api) {
            return
        }

        try {
            if (this.page.kind === 'group') {
                this.group = await this.#api.group(this.page.id)
            } else if (this.page.kind === 'book') {
                this.book = await this.#api.book(this.page.id)
            } else {
                this.groups = await this.#api.library()
            }

            this.failed = false
        } catch {
            this.failed = true
        }
    }

    /** New audiobooks and a new order of what played last; Lit redraws only what changed. */
    async #refreshHome() {
        if (this.page.kind !== 'home' || !this.#api) {
            return
        }

        const groups = await this.#api.library().catch(() => null)

        if (groups && JSON.stringify(groups) !== JSON.stringify(this.groups)) {
            this.groups = groups
        }
    }

    // Playback

    /** Plays a book where it was left, or from a chapter's start when a position is given. */
    #play(uri, position) {
        const args = position === undefined ? { uri } : { uri, position, from_position: true }

        return this.#command('play', args, 'playing')
    }

    #command(action, args = {}, expected = null) {
        const toggled = action === 'play_pause' && this.#playback.state
        const outcome = expected ?? (toggled ? (this.#playback.playing ? 'paused' : 'playing') : null)

        if (outcome) {
            this.#playback.expect(outcome)
        }

        return this.#playback.command(action, args)
    }
}

customElements.define('kids-dashboard-card', KidsDashboardCard)

window.customCards = window.customCards || []
window.customCards.push({
    type: 'kids-dashboard-card',
    name: 'Kids Dashboard',
    description: 'Ein Bildschirm fürs Kinderzimmer: Hörspiele aus Music Assistant, nach Autor',
})
