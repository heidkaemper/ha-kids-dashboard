import { LitElement, html } from 'lit'
import { KidsDashboardApi } from './api.js'
import { icons } from './icons.js'
import { nowPlaying } from './now-playing.js'
import { PlaybackController } from './playback.js'
import { styles } from './styles.js'
import { SwipeBackController } from './swipe.js'
import { renderBook } from './views/book.js'
import { renderGroup } from './views/group.js'
import { renderHome } from './views/home.js'
import { renderRecent } from './views/recent.js'

// kids-dashboard-card: a kids' room screen for Home Assistant. Its first part is the audiobooks ("Hörspiele"),
// grouped by author as Music Assistant groups them. What plays now is shown by a floating media player around
// it, such as Navbar Card's, which links back here with ?playing to open the book. A link with ?home shows
// the overview, for a navbar button that should lead there even from an open book.
//
//   type: custom:kids-dashboard-card
//   entity: media_player.kids_room   # the Music Assistant player it plays on
//   title: Hörspiele                 # optional heading on the home page
//   height: 100vh                    # optional: the card scrolls inside itself at this height
//   inset_right: 120px               # optional: room on the right for a floating navbar
//   inset_bottom: 100px              # optional: room at the bottom for a floating media player

// New audiobooks, and the order of what played last, reach the home page this often.
const LIBRARY_INTERVAL = 30000

// Links to the card's view: ?playing opens the book that plays now, ?home the overview.
const LINKS = ['playing', 'home']

const HOME = { kind: 'home' }

// A book in no group stands on its own: its group id is "single-" and its own id (see the integration's
// to_book). A group's id is hex, so the prefix must not start with a hex digit.
const isSingle = (groupId) => groupId.startsWith('single-')

class KidsDashboardCard extends LitElement {
    static styles = styles

    static properties = {
        page: { state: true },
        groups: { state: true },
        recent: { state: true },
        group: { state: true },
        book: { state: true },
        failed: { state: true },
    }

    #hass = null
    #api = null
    #libraryTimer = null
    #playback = new PlaybackController(this, null)
    #openPlayingWhenKnown = false

    constructor() {
        super()
        this.page = HOME
        this.groups = []
        this.recent = []
        this.group = null
        this.book = null
        this.failed = false

        // Registers itself with the card; the card never asks it anything.
        new SwipeBackController(this, {
            enabled: () => this.page.kind !== 'home',
            onBack: () => this.#back(),
        })
    }

    setConfig(config) {
        if (!config.entity) {
            throw new Error('entity: the Music Assistant player to play on')
        }

        this.config = config

        const sizes = {
            height: '--kids-dashboard-height',
            inset_right: '--kids-dashboard-inset-right',
            inset_bottom: '--kids-dashboard-inset-bottom',
        }

        for (const [key, property] of Object.entries(sizes)) {
            if (config[key]) {
                this.style.setProperty(property, config[key])
            }
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

        // Home Assistant keeps a view's cards when another view is shown, so a link from there finds the card
        // either already connected or connecting again.
        window.addEventListener('location-changed', this.#onLocationChanged)
        this.#onLocationChanged()
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        clearInterval(this.#libraryTimer)
        window.removeEventListener('location-changed', this.#onLocationChanged)
    }

    updated(changed) {
        if (changed.has('page')) {
            this.renderRoot.querySelector('.content')?.scrollTo(0, 0)
        }

        // The first answer from the player, after a link asked for what plays now.
        if (this.#openPlayingWhenKnown && this.#playback.state) {
            this.#openPlayingWhenKnown = false
            this.#openPlaying()
        }
    }

    render() {
        const home = this.page.kind === 'home'

        return html`
            <ha-card>
                <div class="content ${home ? 'home' : ''}">
                    ${this.#renderHeader(home)}
                    ${this.#renderPage()}
                </div>

                <div class="swipe-back" aria-hidden="true">${icons.back}</div>
            </ha-card>
        `
    }

    #renderHeader(home) {
        if (home && !this.config.title) {
            return ''
        }

        const title = {
            home: this.config.title,
            recent: 'Zuletzt',
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

        if (this.page.kind === 'recent') {
            return renderRecent({
                books: this.recent,
                onOpenBook: (id) => this.#show({ kind: 'book', id, from: 'recent' }),
            })
        }

        if (this.page.kind === 'group' && this.group) {
            return renderGroup({ books: this.group.books, onOpenBook: (id) => this.#show({ kind: 'book', id }) })
        }

        if (this.page.kind === 'book' && this.book) {
            return renderBook({
                book: this.book,
                playback: this.#playback,
                onPlay: (uri, position) => this.#play(uri, position),
                onRestart: (uri) => this.#restart(uri),
                onToggle: () => this.#command('play_pause'),
            })
        }

        if (this.page.kind === 'home') {
            return renderHome({
                groups: this.groups,
                recent: this.recent,
                onOpenRecent: () => this.#show({ kind: 'recent' }),
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
     * Only a book opened from "Zuletzt" goes back there, as that list is where it was looked for.
     */
    #back() {
        const groupId = this.book?.series_id

        if (this.page.from === 'recent') {
            this.#show({ kind: 'recent' })
            return
        }

        if (this.page.kind !== 'book' || !groupId || isSingle(groupId)) {
            this.#show(HOME)
            return
        }

        this.#show({ kind: 'group', id: groupId })
    }

    /** Follows a link, and takes it off the address, so going back or reloading does not follow it again. */
    #onLocationChanged = () => {
        const url = new URL(window.location.href)
        const link = LINKS.find((name) => url.searchParams.has(name))

        if (!link) {
            return
        }

        url.searchParams.delete(link)
        history.replaceState(history.state, '', url)

        if (link === 'home') {
            this.#show(HOME)
            this.renderRoot.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }

        if (!this.#playback.state) {
            this.#openPlayingWhenKnown = true
            return
        }

        this.#openPlaying()
    }

    /** Opens the book that plays now; on that book's own page, Now Playing instead. */
    #openPlaying() {
        const id = this.#playback.book?.id

        if (!id) {
            return
        }

        if (this.page.kind === 'book' && this.page.id === id) {
            nowPlaying.show()
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
            } else if (this.page.kind === 'recent') {
                this.recent = await this.#api.recent()
            } else {
                // Without "Zuletzt" the home page still works.
                [this.groups, this.recent] = await Promise.all([
                    this.#api.library(),
                    this.#api.recent().catch(() => []),
                ])
            }

            this.failed = false
        } catch {
            this.failed = true
        }
    }

    /** New audiobooks, a new order of what played last and what was heard; Lit redraws only what changed. */
    async #refreshHome() {
        if (this.page.kind !== 'home' || !this.#api) {
            return
        }

        const [groups, recent] = await Promise.all([
            this.#api.library().catch(() => null),
            this.#api.recent().catch(() => null),
        ])

        if (groups && JSON.stringify(groups) !== JSON.stringify(this.groups)) {
            this.groups = groups
        }

        if (recent && JSON.stringify(recent) !== JSON.stringify(this.recent)) {
            this.recent = recent
        }
    }

    // Playback

    /**
     * Plays a book where it was left, or from a chapter's start when a position is given. A chapter picked
     * means a place is looked for in the book, so Now Playing stays away and the book's page stays in view.
     */
    #play(uri, position) {
        const args = position === undefined ? { uri } : { uri, position, from_position: true }

        if (position === undefined) {
            nowPlaying.asked()
        } else {
            nowPlaying.stayQuiet()
        }

        return this.#command('play', args, 'playing')
    }

    #restart(uri) {
        nowPlaying.asked()

        return this.#command('restart', { uri }, 'playing')
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
