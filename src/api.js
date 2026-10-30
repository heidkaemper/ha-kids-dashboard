// Everything the card asks of Home Assistant: the Kids Dashboard integration over the websocket, and for
// playback that is not one of the audiobooks, the media player itself.

// What the player bar's buttons ask of a player that plays something else than an audiobook.
const MEDIA_PLAYER_SERVICES = {
    play_pause: 'media_play_pause',
    chapter_prev: 'media_previous_track',
    chapter_next: 'media_next_track',
}

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

    async state() {
        const state = await this.call('state', { entity_id: this.entityId })

        return state.book ? state : (this.mediaPlayerState() ?? state)
    }

    /** Runs a player bar or book page command; other playback goes to the media player's own services. */
    command(action, args = {}, external = false) {
        const service = external && MEDIA_PLAYER_SERVICES[action]

        if (service) {
            return this.hass.callService('media_player', service, { entity_id: this.entityId })
        }

        return this.call('command', { entity_id: this.entityId, action, ...args })
    }

    call(type, args) {
        return this.hass.callWS({ type: `kids_dashboard/${type}`, ...args })
    }

    /** Music, a podcast or the radio sent from Music Assistant, as the media player reports it. */
    mediaPlayerState() {
        const entity = this.hass.states[this.entityId]

        if (!entity || !['playing', 'paused'].includes(entity.state) || !entity.attributes.media_title) {
            return null
        }

        const attributes = entity.attributes
        let elapsed = attributes.media_position || 0

        if (entity.state === 'playing' && attributes.media_position_updated_at) {
            elapsed += (Date.now() - Date.parse(attributes.media_position_updated_at)) / 1000
        }

        return {
            state: entity.state,
            external: true,
            elapsed,
            duration: attributes.media_duration || 0,
            chapter: null,
            chapters: 0,
            book: {
                id: '',
                title: attributes.media_title,
                number: '',
                series: attributes.media_artist || attributes.media_album_name || '',
                cover: attributes.entity_picture || '',
            },
        }
    }
}
