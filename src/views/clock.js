import { html, svg } from 'lit'

const TIME = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' })
const DATE = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })

/** The time in the middle of the screen, the date below it. */
export function renderClock(now) {
    return html`
        <div class="clock">
            <div class="time">${TIME.format(now)}</div>
            <div class="date">${DATE.format(now)}</div>
        </div>
    `
}

/** A picture of one's own, a little darkened so the white clock reads on light ones too. */
export function renderPicture(url) {
    return html`
        <img class="backdrop" src=${url} alt="">
        <div class="backdrop shade"></div>
    `
}

/** Soft shapes in muted earth tones, drawn here so the card needs no picture. */
export function renderBackdrop() {
    return svg`
        <svg class="backdrop" viewBox="0 0 960 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <rect width="960" height="480" fill="#a99d93"/>
            <path d="M960 0H585c-38 70 8 150 58 225 55 85 25 175 45 255h272z" fill="#7a503f"/>
            <path d="M0 30C130-20 300 55 360 185c55 125-5 230-70 295H0z" fill="#2b2422"/>
            <ellipse cx="470" cy="-5" rx="125" ry="72" fill="#3a2d29"/>
            <ellipse cx="770" cy="505" rx="115" ry="62" fill="#2b2422"/>
            <path d="M690 330c55-40 105 25 160-15s75-10 110-30" fill="none" stroke="#2b2422" stroke-width="3"/>
            <rect width="960" height="480" fill="#000" opacity="0.18"/>
        </svg>
    `
}
