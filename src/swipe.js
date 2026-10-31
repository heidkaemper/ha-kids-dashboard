// A swipe from left to right goes back one level, as the back button does.

// Finger travel before the direction is decided: below it a tap stays a tap.
const LOCK = 12

// Finger travel that goes back when the finger lets go.
const TRIGGER = 100

// The page follows the finger by this much, so it feels pulled rather than dragged away.
const PULL = 0.35

/**
 * A Lit controller in the way iOS and Android's predictive back do it: the page follows the finger a little,
 * and a back arrow comes in from the left once letting go would go back. Letting go short of that springs
 * back. Only a mostly sideways swipe counts, so scrolling up and down stays as it is.
 *
 * The finger's way is handed to the styles as a CSS variable on the host and the [swiping] and [armed]
 * attributes, not as reactive state, so the page is not drawn again on every move.
 */
export class SwipeBackController {
    #host
    #enabled
    #onBack
    #start = null
    #sideways = false
    #swiped = false

    constructor(host, { enabled, onBack }) {
        this.#host = host
        this.#enabled = enabled
        this.#onBack = onBack
        host.addController(this)
    }

    hostConnected() {
        this.#host.addEventListener('pointerdown', this.#down)
        this.#host.addEventListener('pointermove', this.#move)
        this.#host.addEventListener('pointerup', this.#up)
        this.#host.addEventListener('pointercancel', this.#reset)
        // A swipe ends over a tile or a chapter: that must not count as a tap on it.
        this.#host.addEventListener('click', this.#swallowClick, true)
    }

    hostDisconnected() {
        this.#host.removeEventListener('pointerdown', this.#down)
        this.#host.removeEventListener('pointermove', this.#move)
        this.#host.removeEventListener('pointerup', this.#up)
        this.#host.removeEventListener('pointercancel', this.#reset)
        this.#host.removeEventListener('click', this.#swallowClick, true)
    }

    #down = (event) => {
        if (!event.isPrimary || !this.#enabled()) {
            return
        }

        this.#start = { x: event.clientX, y: event.clientY, id: event.pointerId }
        this.#sideways = false
        this.#swiped = false
    }

    #move = (event) => {
        if (!this.#start || event.pointerId !== this.#start.id) {
            return
        }

        const dx = event.clientX - this.#start.x
        const dy = event.clientY - this.#start.y

        if (!this.#sideways) {
            this.#decide(dx, dy, event.pointerId)
            return
        }

        this.#show(Math.max(0, dx))
    }

    #up = (event) => {
        if (!this.#start || event.pointerId !== this.#start.id) {
            return
        }

        const travel = event.clientX - this.#start.x
        const back = this.#sideways && travel >= TRIGGER

        this.#swiped = this.#sideways
        this.#reset()

        if (back) {
            this.#onBack()
        }
    }

    #swallowClick = (event) => {
        if (!this.#swiped) {
            return
        }

        this.#swiped = false
        event.preventDefault()
        event.stopPropagation()
    }

    /** Sideways to the right is a swipe; anything else lets the page scroll, or the tap go through. */
    #decide(dx, dy, pointerId) {
        if (Math.abs(dx) < LOCK && Math.abs(dy) < LOCK) {
            return
        }

        if (dx <= 0 || Math.abs(dx) < Math.abs(dy) * 1.5) {
            this.#start = null
            return
        }

        this.#sideways = true
        this.#host.setPointerCapture(pointerId)
        this.#host.toggleAttribute('swiping', true)
    }

    #show(travel) {
        this.#host.style.setProperty('--kids-dashboard-swipe-shift', `${Math.round(travel * PULL)}px`)
        this.#host.toggleAttribute('armed', travel >= TRIGGER)
    }

    #reset = () => {
        this.#start = null
        this.#sideways = false
        this.#host.toggleAttribute('swiping', false)
        this.#host.toggleAttribute('armed', false)
        this.#host.style.removeProperty('--kids-dashboard-swipe-shift')
    }
}
