// What the player plays, asked for every two seconds, kept steady for the screen.

const POLL_INTERVAL = 2000

// How long a tap's outcome is shown before Music Assistant has to agree with it.
const EXPECT_FOR = 4000

/**
 * A Lit controller: the card's host updates whenever the state changes.
 *
 * Music Assistant reports the old state for a moment after a command, and an answer arriving then flipped
 * the play button back and forth. So a tap's outcome is shown at once and held for a few seconds, and an
 * answer overtaken by a newer one is dropped.
 */
export class PlaybackController {
    state = null

    #host
    #api
    #active
    #at = 0
    #timer = null
    #asked = 0
    #shown = 0
    #expected = null

    /** active says when the player is worth asking: a card that is mostly hidden asks only while shown. */
    constructor(host, api, active = () => true) {
        this.#host = host
        this.#api = api
        this.#active = active
        host.addController(this)
    }

    set api(api) {
        this.#api = api
    }

    get book() {
        return this.state?.book ?? null
    }

    get playing() {
        return this.state?.state === 'playing'
    }

    /** Where the player is now: its last answer, moved on by the time since while it plays. */
    get elapsed() {
        if (!this.state) {
            return 0
        }

        return this.state.elapsed + (this.playing ? (Date.now() - this.#at) / 1000 : 0)
    }

    hostConnected() {
        this.#timer = setInterval(() => this.poll(), POLL_INTERVAL)
        this.poll()
    }

    hostDisconnected() {
        clearInterval(this.#timer)
        this.#timer = null
    }

    /** Shows what a tap will do before the player confirms it. */
    expect(state) {
        this.#expected = { state, until: Date.now() + EXPECT_FOR }

        if (!this.state) {
            return
        }

        this.state = { ...this.state, state }
        this.#host.requestUpdate()
    }

    async command(action, args = {}) {
        try {
            await this.#api?.command(action, args)
        } finally {
            this.poll()
        }
    }

    async poll() {
        if (!this.#api || document.hidden || !this.#active()) {
            return
        }

        const asked = ++this.#asked
        const state = await this.#api.state().catch(() => null)

        if (asked < this.#shown) {
            return
        }

        this.#shown = asked
        this.#at = Date.now()
        this.state = this.#heldUntilConfirmed(state)
        this.#host.requestUpdate()
    }

    #heldUntilConfirmed(state) {
        const expected = this.#expected

        if (!state || !expected) {
            return state
        }

        if (state.state === expected.state || Date.now() > expected.until) {
            this.#expected = null
            return state
        }

        return { ...state, state: expected.state }
    }
}
