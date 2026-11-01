import { css } from 'lit'

// Colors come from the Home Assistant theme, so the card follows light and dark mode. The card fills the screen
// on the view's own background and scrolls inside itself, the header along with the rest. A navbar and a media
// player float on top of it: the insets keep room for them, and the list scrolls on underneath.
export const styles = css`
    :host {
        display: block;
        height: var(--kids-dashboard-height, 100vh);
        /* In its vertical stack, the navbar and Now Playing after it take no room but still get the stack's gap
           before them, and the screen would scroll by that much: the card gives the two gaps back. */
        margin-bottom: calc(-2 * var(--vertical-stack-card-gap, var(--stack-card-gap, 8px)));
    }

    ha-card {
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
        padding: 0;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        background: none;
    }

    svg {
        display: block;
        width: 100%;
        height: 100%;
        fill: currentColor;
    }

    button {
        padding: 0;
        border: 0;
        background: none;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
    }

    /* Header and content */

    header {
        display: flex;
        flex: none;
        align-items: center;
        gap: 12px;
        min-height: 48px;
        padding-bottom: 12px;
    }

    header h1 {
        flex: 1;
        margin: 0;
        overflow: hidden;
        color: var(--primary-text-color);
        font-size: 26px;
        font-weight: 600;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .back {
        flex: none;
        width: 48px;
        height: 48px;
        padding: 12px;
        border-radius: 50%;
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
    }

    .content {
        flex: 1;
        min-height: 0;
        padding: 12px calc(16px + var(--kids-dashboard-inset-right, 0px)) calc(18px + var(--kids-dashboard-inset-bottom, 0px)) 16px;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-width: none;
        /* Sideways is the swipe back's (swipe.js), up and down the scrolling's. */
        touch-action: pan-y;
        transform: translateX(var(--kids-dashboard-swipe-shift, 0px));
        transition: transform 220ms ease;
    }

    .content::-webkit-scrollbar {
        display: none;
    }

    .content.home {
        padding-top: 16px;
    }

    /* The swipe back: the page follows the finger, and an arrow comes in once letting go goes back. */

    :host([swiping]) .content {
        transition: none;
    }

    .swipe-back {
        box-sizing: border-box;
        position: absolute;
        top: 50%;
        left: 0;
        width: 48px;
        height: 48px;
        padding: 12px;
        border-radius: 50%;
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
        opacity: 0;
        transform: translate(-60px, -50%);
        transition: transform 180ms ease, opacity 180ms ease;
        pointer-events: none;
    }

    :host([armed]) .swipe-back {
        opacity: 1;
        transform: translate(16px, -50%);
    }

    .empty {
        padding: 30px;
        color: var(--secondary-text-color);
        font-size: 17px;
        text-align: center;
    }

    /* Tiles: authors on the home page, books in a group */

    .shelf {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 18px 16px;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 16px;
    }

    .tile {
        display: flex;
        flex-direction: column;
        gap: 7px;
        min-width: 0;
    }

    .cover {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        overflow: hidden;
        border-radius: var(--ha-card-border-radius, 12px);
        background: var(--secondary-background-color);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    }

    .cover img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    /* A tile of one color with an icon, where there is no picture: "Zuletzt" */
    .cover.plain {
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
    }

    .cover.plain svg {
        width: 46%;
        height: 46%;
    }

    .name {
        display: -webkit-box;
        overflow: hidden;
        color: var(--primary-text-color);
        font-size: 16px;
        font-weight: 500;
        line-height: 1.25;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
    }

    .name.single-line {
        display: block;
        margin-top: 2px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .sub {
        margin-top: -3px;
        color: var(--secondary-text-color);
        font-size: 14px;
    }

    .heard {
        position: absolute;
        right: 6px;
        bottom: 6px;
        width: 22px;
        height: 22px;
        padding: 3px;
        border-radius: 50%;
        background: var(--success-color, #43a047);
        color: #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
    }

    .progress {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        height: 6px;
        background: rgba(0, 0, 0, 0.5);
    }

    .progress i {
        display: block;
        height: 100%;
        background: var(--primary-color);
    }

    /* A list: what was heard lately, one book per row */

    .list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .row {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 8px;
        border-radius: var(--ha-card-border-radius, 12px);
        background: var(--secondary-background-color);
    }

    .row .cover {
        flex: none;
        width: 64px;
        border-radius: 8px;
        box-shadow: none;
    }

    .row .name {
        font-size: 18px;
    }

    /* An episode's row: the title, and under it the podcast, the day and the length */
    .row .text {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    .row .meta {
        overflow: hidden;
        color: var(--secondary-text-color);
        font-size: 14px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .row .heard {
        right: 3px;
        bottom: 3px;
        width: 18px;
        height: 18px;
        padding: 2px;
    }

    /* A book */

    .book {
        display: flex;
        align-items: flex-start;
        gap: 22px;
    }

    .book .cover {
        flex: none;
        width: 260px;
    }

    .book .side {
        flex: 1;
        min-width: 0;
    }

    .book .meta {
        color: var(--secondary-text-color);
        font-size: 16px;
    }

    .book h3 {
        margin: 4px 0 14px;
        color: var(--primary-text-color);
        font-size: 24px;
        line-height: 1.2;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }

    .action {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        height: 56px;
        padding: 0 24px 0 16px;
        border-radius: 28px;
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
        font-size: 19px;
        font-weight: 600;
    }

    .action svg {
        width: 28px;
        height: 28px;
    }

    .action.secondary {
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
    }

    .chapters {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 16px;
    }

    .chapter {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 50px;
        padding: 4px 14px;
        border-radius: 12px;
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
        font-size: 16px;
    }

    .chapter.now {
        outline: 2px solid var(--primary-color);
    }

    .chapter b {
        display: flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 15px;
        background: var(--divider-color);
        font-size: 13px;
        font-weight: 600;
    }

    .chapter span {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .chapter em {
        color: var(--secondary-text-color);
        font-size: 14px;
        font-style: normal;
    }
`

// The clock card: the backdrop fills the card, the clock sits in the middle of the screen, whatever floats on it.
// White text with a soft shadow reads on both the dark and the light shapes.
export const clockStyles = css`
    :host {
        display: block;
        height: var(--kids-dashboard-height, 100vh);
        /* In its vertical stack, the navbar and Now Playing after it take no room but still get the stack's gap
           before them, and the screen would scroll by that much: the card gives the two gaps back. */
        margin-bottom: calc(-2 * var(--vertical-stack-card-gap, var(--stack-card-gap, 8px)));
    }

    ha-card {
        position: relative;
        height: 100%;
        overflow: hidden;
        padding: 0;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        background: none;
    }

    .backdrop {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .shade {
        background: rgba(0, 0, 0, 0.18);
    }

    .clock {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #fff;
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
    }

    .time {
        font-size: 140px;
        font-weight: 400;
        line-height: 1;
        font-variant-numeric: tabular-nums;
        letter-spacing: -2px;
    }

    .date {
        margin-top: -8px;
        font-size: 24px;
        font-weight: 500;
    }
`

// Now Playing: fixed over the whole screen, above the navbar and its player (Navbar Card's layers reach 901).
// The cover blurred and darkened behind it keeps the colors of what plays.
export const nowPlayingStyles = css`
    :host {
        display: block;
    }

    svg {
        display: block;
        width: 100%;
        height: 100%;
        fill: currentColor;
    }

    button {
        padding: 0;
        border: 0;
        background: none;
        color: inherit;
        cursor: pointer;
    }

    .overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px 40px;
        overflow: hidden;
        background: #111;
        color: #fff;
    }

    .blur {
        position: absolute;
        inset: -40px;
        width: calc(100% + 80px);
        height: calc(100% + 80px);
        object-fit: cover;
        filter: blur(40px) brightness(0.4);
    }

    .close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 40px;
        height: 40px;
        padding: 10px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.12);
    }

    /* Two columns lined up on the cover's height: its middle, its foot, and the title row below it. */
    .layout {
        position: relative;
        display: grid;
        grid-template-columns: 260px 360px;
        grid-template-rows: 260px auto;
        column-gap: 56px;
        align-items: start;
    }

    .cover {
        grid-area: 1 / 1;
        overflow: hidden;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.1);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }

    .cover,
    .cover img {
        display: block;
        width: 260px;
        height: 260px;
        object-fit: cover;
    }

    .text {
        grid-area: 2 / 1;
        min-width: 0;
        padding-top: 14px;
        text-align: center;
    }

    .title {
        display: -webkit-box;
        overflow: hidden;
        font-size: 20px;
        font-weight: 600;
        line-height: 1.25;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
    }

    .detail {
        margin-top: 4px;
        overflow: hidden;
        color: rgba(255, 255, 255, 0.7);
        font-size: 15px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .controls {
        display: flex;
        grid-area: 1 / 2;
        align-items: center;
        align-self: center;
        justify-content: center;
        gap: 28px;
    }

    .timeline {
        grid-area: 1 / 2;
        align-self: end;
        width: 100%;
        height: 32px;
        margin: 0 0 -12px;
        background: none;
        cursor: pointer;
        -webkit-appearance: none;
        appearance: none;
    }

    .timeline::-webkit-slider-runnable-track {
        height: 8px;
        border-radius: 4px;
        background: linear-gradient(to right, #fff var(--progress), rgba(255, 255, 255, 0.25) var(--progress));
    }

    .timeline::-webkit-slider-thumb {
        width: 24px;
        height: 24px;
        margin-top: -8px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        -webkit-appearance: none;
        appearance: none;
    }

    .times {
        display: flex;
        grid-area: 2 / 2;
        justify-content: space-between;
        padding-top: 16px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
        font-variant-numeric: tabular-nums;
    }

    .control {
        width: 64px;
        height: 64px;
        padding: 16px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.12);
    }

    .control.main {
        width: 96px;
        height: 96px;
        padding: 26px;
        background: #fff;
        color: #111;
    }
`
