import { LitElement, html } from 'lit'
import { clockStyles } from './styles.js'
import { renderBackdrop, renderClock, renderPicture } from './views/clock.js'

// kids-clock-card: the home screen of the kids' room. The time and the date in the middle of the screen, on
// a calm picture. It fills the screen like the audiobooks do; a navbar and a media player float on top.
//
//   type: custom:kids-clock-card
//   images:                    # optional: pictures behind the clock, a new one each day in this order
//     - /local/kids-dashboard/home-1.jpg
//     - /local/kids-dashboard/home-2.jpg
//   height: 100vh              # optional: the card's height

// The time is looked at every few seconds, so a new minute shows soon after it begins.
const TICK = 5000

class KidsClockCard extends LitElement {
    static styles = clockStyles

    static properties = {
        now: { state: true },
    }

    #timer = null

    constructor() {
        super()
        this.now = new Date()
    }

    setConfig(config) {
        this.config = config

        if (config.height) {
            this.style.setProperty('--kids-dashboard-height', config.height)
        }
    }

    getCardSize() {
        return 12
    }

    connectedCallback() {
        super.connectedCallback()
        this.#timer = setInterval(() => this.#tick(), TICK)
        this.#tick()
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        clearInterval(this.#timer)
    }

    render() {
        return html`
            <ha-card>
                ${this.#background()}
                ${renderClock(this.now)}
            </ha-card>
        `
    }

    /** Today's picture: the day's number picks it, so it changes at midnight and is the same on every screen. */
    #background() {
        const images = this.config.images ?? []

        if (!images.length) {
            return renderBackdrop()
        }

        const day = Date.UTC(this.now.getFullYear(), this.now.getMonth(), this.now.getDate()) / 86400000

        return renderPicture(images[day % images.length])
    }

    #tick() {
        const now = new Date()

        if (now.getMinutes() !== this.now.getMinutes() || now.getDate() !== this.now.getDate()) {
            this.now = now
        }
    }
}

customElements.define('kids-clock-card', KidsClockCard)

window.customCards = window.customCards || []
window.customCards.push({
    type: 'kids-clock-card',
    name: 'Kids Clock',
    description: 'Uhrzeit und Datum fürs Kinderzimmer, auf einem ruhigen Hintergrund',
})
