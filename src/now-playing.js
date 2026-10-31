// Whether Now Playing is up, shared by the cards on every view, so it is up or closed on all of them at once.

const CHANGED = 'kids-dashboard-now-playing'

// How long after a chapter is picked a start of playback opens nothing.
const QUIET_FOR = 10000

// A start Home Assistant reported longer ago than this is no news: a view shown again, a page loaded.
const FRESH_FOR = 10000

// Once closed while playing, Now Playing stays away from a start this soon after a stop: the player only
// went on to the next part, and someone is looking around the dashboard meanwhile.
const CARRIES_ON_WITHIN = 10000

const shared = { open: false, quietUntil: 0, dismissed: false, stoppedAt: 0, lastStart: '' }

export const nowPlaying = {
    get open() {
        return shared.open
    },

    show() {
        set(true)
    },

    /** Closed by a tap: while it plays, a pause long enough or a start from the dashboard brings it back. */
    dismiss(playing) {
        shared.dismissed = playing
        set(false)
    },

    hide() {
        set(false)
    },

    /**
     * The player plays since changedAt (its state's last_changed): Now Playing comes up when that is a new
     * start. Not when a chapter was just picked on a book's page, since someone looks for a place in the book
     * and wants to stay on it, and not when it was closed while playing and the player carries on after a
     * moment's stop. Every card on every view reports the same start, so each is taken once.
     */
    started(changedAt) {
        if (changedAt === shared.lastStart) {
            return
        }

        shared.lastStart = changedAt

        const at = Date.parse(changedAt)

        if (Date.now() - at > FRESH_FOR || Date.now() < shared.quietUntil) {
            return
        }

        if (shared.dismissed && at - shared.stoppedAt < CARRIES_ON_WITHIN) {
            return
        }

        set(true)
    },

    stopped(changedAt) {
        shared.stoppedAt = Date.parse(changedAt)
    },

    /** A start from the dashboard (Abspielen, Weiterhören, Neustart) brings Now Playing up again. */
    asked() {
        shared.dismissed = false
    },

    stayQuiet() {
        shared.quietUntil = Date.now() + QUIET_FOR
    },

    listen(callback) {
        window.addEventListener(CHANGED, callback)
    },

    unlisten(callback) {
        window.removeEventListener(CHANGED, callback)
    },
}

function set(open) {
    if (open) {
        shared.dismissed = false
    }

    if (shared.open === open) {
        return
    }

    shared.open = open
    window.dispatchEvent(new Event(CHANGED))
}
