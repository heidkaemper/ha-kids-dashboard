// Everything the card asks of Home Assistant: the Kids Dashboard integration over the websocket.

export class KidsDashboardApi {
    /** profile names the child whose Music Assistant user is asked; without one, the integration's first. */
    constructor(hass, entityId, profile) {
        this.hass = hass
        this.entityId = entityId
        this.profile = profile
    }

    library() {
        return this.call('library', { entity_id: this.entityId })
    }

    /** The books heard lately on this screen's player, the latest first. */
    recent() {
        return this.call('recent', { entity_id: this.entityId })
    }

    group(seriesId) {
        return this.call('series', { series_id: seriesId })
    }

    book(bookId) {
        return this.call('book', { book_id: bookId })
    }

    state() {
        return this.call('state', { entity_id: this.entityId })
    }

    /** Runs a book page command on the player. */
    command(action, args = {}) {
        return this.call('command', { entity_id: this.entityId, action, ...args })
    }

    /** The liked podcasts, and how many episodes the two lists hold. */
    podcasts() {
        return this.call('podcasts')
    }

    /** fresh: false takes the episodes as the integration last read them, without asking Music Assistant. */
    podcast(podcastId, fresh = true) {
        return this.call('podcast', { podcast_id: podcastId, fresh })
    }

    /** "recent" for Zuletzt gehört, "latest" for Kürzlich aktualisiert. */
    episodes(list) {
        return this.call('episodes', { list })
    }

    call(type, args = {}) {
        const profile = this.profile ? { profile: this.profile } : {}

        return this.hass.callWS({ type: `kids_dashboard/${type}`, ...profile, ...args })
    }
}
