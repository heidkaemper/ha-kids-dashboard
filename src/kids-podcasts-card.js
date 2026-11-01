import { LitElement, html } from 'lit'
import { KidsDashboardApi } from './api.js'
import { icons } from './icons.js'
import { nowPlaying } from './now-playing.js'
import { applySizes } from './sizes.js'
import { styles } from './styles.js'
import { SwipeBackController } from './swipe.js'
import { renderEpisodes } from './views/episodes.js'
import { renderPodcastHome } from './views/podcasts.js'

// kids-podcasts-card: the podcasts a child likes in Music Assistant, each with its episodes, and two lists over
// all of them: what the child heard lately and the newest episodes. A tap on an episode plays it; what plays is
// shown by Now Playing and the floating media player, as for the audiobooks; the player links back here with
// ?playing to open the podcast that plays. A link with ?home shows the overview, for a navbar button that should
// lead there even from an open podcast.
//
//   type: custom:kids-podcasts-card
//   entity: media_player.kids_room   # the Music Assistant player it plays on
//   profile: Kid                     # optional: the child's profile in the integration (default: the first)
//   title: Podcasts                  # optional heading on the home page
//   height: 100vh                    # optional: the card scrolls inside itself at this height
//   inset_right: 120px               # optional: room on the right for a floating navbar
//   inset_bottom: 100px              # optional: room at the bottom for a floating media player

// New episodes, and the order of what was heard last, reach the home page this often.
const HOME_INTERVAL = 30000

// Links to the card's view: ?playing opens the podcast of the episode that plays now, ?home the overview.
const LINKS = ['playing', 'home']

const HOME = { kind: 'home' }

// Each podcast as last loaded, by profile and id. Reading one fresh from Music Assistant takes a second or two
// (the ARD Audiothek more), so an opened podcast shows what is kept at once and the current one follows.
const kept = new Map()

const LISTS = {
    recent: { title: 'Zuletzt gehört', empty: 'Hier steht, was du zuletzt gehört hast.' },
    latest: { title: 'Kürzlich aktualisiert', empty: 'Gerade gibt es keine neuen Folgen.' },
}

class KidsPodcastsCard extends LitElement {
    static styles = styles

    static properties = {
        page: { state: true },
        home: { state: true },
        podcast: { state: true },
        episodes: { state: true },
        failed: { state: true },
    }

    #api = null
    #homeTimer = null
    #openPlayingWhenReady = false

    constructor() {
        super()
        this.page = HOME
        this.home = { podcasts: [], recent: 0, latest: 0 }
        this.podcast = null
        this.episodes = []
        this.failed = false

        new SwipeBackController(this, {
            enabled: () => this.page.kind !== 'home',
            onBack: () => this.#show(HOME),
        })
    }

    setConfig(config) {
        if (!config.entity) {
            throw new Error('entity: the Music Assistant player to play on')
        }

        this.config = config
        applySizes(this, config)
    }

    set hass(hass) {
        const first = !this.#api

        this.#api = new KidsDashboardApi(hass, this.config.entity, this.config.profile)

        if (!first) {
            return
        }

        this.#load()

        if (this.#openPlayingWhenReady) {
            this.#openPlayingWhenReady = false
            this.#openPlaying()
        }
    }

    getCardSize() {
        return 12
    }

    connectedCallback() {
        super.connectedCallback()
        this.#homeTimer = setInterval(() => this.#refreshHome(), HOME_INTERVAL)

        window.addEventListener('location-changed', this.#onLocationChanged)
        this.#onLocationChanged()
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        clearInterval(this.#homeTimer)
        window.removeEventListener('location-changed', this.#onLocationChanged)
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

        const title = home
            ? this.config.title
            : LISTS[this.page.kind]?.title ?? this.podcast?.podcast.name

        return html`
            <header>
                ${home ? '' : html`<button class="back" aria-label="Zurück" @click=${() => this.#show(HOME)}>${icons.back}</button>`}
                <h1>${title ?? ''}</h1>
            </header>
        `
    }

    #renderPage() {
        if (this.failed) {
            return html`<div class="empty">Die Podcasts sind gerade nicht erreichbar. Bitte gleich noch einmal versuchen.</div>`
        }

        if (this.page.kind === 'home') {
            return renderPodcastHome({
                ...this.home,
                onOpenList: (list) => this.#show({ kind: list }),
                onOpenPodcast: (id) => this.#show({ kind: 'podcast', id }),
            })
        }

        if (this.page.kind !== 'podcast') {
            return renderEpisodes({
                episodes: this.episodes,
                showPodcast: true,
                empty: LISTS[this.page.kind].empty,
                onPlay: (uri) => this.#play(uri),
            })
        }

        // Nothing until it is loaded: an empty list would say there are no episodes.
        if (!this.podcast) {
            return ''
        }

        return renderEpisodes({
            episodes: this.podcast.episodes,
            empty: 'Noch keine Folgen da.',
            onPlay: (uri) => this.#play(uri),
        })
    }

    // Navigation

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

        if (!this.#api) {
            this.#openPlayingWhenReady = true
            return
        }

        this.#openPlaying()
    }

    /**
     * Now Playing at once, and the podcast of the episode that plays beneath it: closing it leads there, as
     * from an audiobook to its book.
     */
    async #openPlaying() {
        nowPlaying.show()

        const playing = await this.#api.state().catch(() => null)
        const id = playing?.episode?.podcast_id

        if (!id || (this.page.kind === 'podcast' && this.page.id === id)) {
            return
        }

        await this.#show({ kind: 'podcast', id })
    }

    async #show(page) {
        // What another list left behind would show for a moment while the new one loads.
        if (page.kind !== this.page.kind) {
            this.episodes = []
        }

        if (page.kind === 'podcast') {
            this.podcast = kept.get(this.#key(page.id)) ?? null
        }

        this.failed = false
        this.page = page
        await this.#load()
    }

    async #load() {
        if (!this.#api) {
            return
        }

        const page = this.page

        try {
            if (page.kind === 'home') {
                this.home = await this.#api.podcasts()
                this.#prefetch()
            } else if (page.kind === 'podcast') {
                await this.#loadPodcast(page)
            } else {
                this.episodes = await this.#api.episodes(page.kind)
            }

            this.failed = false
        } catch {
            if (page !== this.page) {
                return
            }

            // A podcast whose provider does not answer just now stays as it was kept, rather than an error.
            this.failed = !(page.kind === 'podcast' && this.podcast)
        }
    }

    async #loadPodcast(page) {
        const podcast = await this.#api.podcast(page.id)

        kept.set(this.#key(page.id), podcast)

        // Another page opened meanwhile: this one's episodes would show under its title.
        if (page !== this.page) {
            return
        }

        this.podcast = podcast
    }

    /**
     * Every podcast not kept yet, one after the other, as the integration last read them for the home page:
     * a first tap on a podcast shows its episodes at once too.
     */
    async #prefetch() {
        for (const { id } of this.home.podcasts) {
            if (kept.has(this.#key(id))) {
                continue
            }

            const podcast = await this.#api.podcast(id, false).catch(() => null)

            if (podcast) {
                kept.set(this.#key(id), podcast)
            }
        }
    }

    #key(podcastId) {
        return `${this.config.profile ?? ''}/${podcastId}`
    }

    /** New episodes and a new order of what was heard; Lit redraws only what changed. */
    async #refreshHome() {
        if (this.page.kind !== 'home' || !this.#api) {
            return
        }

        const home = await this.#api.podcasts().catch(() => null)

        if (home && JSON.stringify(home) !== JSON.stringify(this.home)) {
            this.home = home
        }
    }

    // Playback

    /** Plays an episode where it was left; Now Playing comes up for it. */
    #play(uri) {
        nowPlaying.asked()

        return this.#api.command('play', { uri })
    }
}

customElements.define('kids-podcasts-card', KidsPodcastsCard)

window.customCards = window.customCards || []
window.customCards.push({
    type: 'kids-podcasts-card',
    name: 'Kids Podcasts',
    description: 'Die Podcasts, die ein Kind in Music Assistant mag, mit ihren Folgen',
})
