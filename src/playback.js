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
    #timer = null
    #asked = 0
    #shown = 0
    #expected = null

    constructor(host, api) {
        this.#host = host
        this.#api = api
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
            await this.#api?.command(action, args, this.state?.external)
        } finally {
            this.poll()
        }
    }

    async poll() {
        if (!this.#api || document.hidden) {
            return
        }

        const asked = ++this.#asked
        const state = await this.#api.state().catch(() => null)

        if (asked < this.#shown) {
            return
        }

        this.#shown = asked
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
