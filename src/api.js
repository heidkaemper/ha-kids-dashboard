// Everything the card asks of Home Assistant: the Kids Dashboard integration over the websocket.

export class KidsDashboardApi {
    constructor(hass, entityId) {
        this.hass = hass
        this.entityId = entityId
    }

    library() {
        return this.call('library', { entity_id: this.entityId })
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

    call(type, args) {
        return this.hass.callWS({ type: `kids_dashboard/${type}`, ...args })
    }
}
