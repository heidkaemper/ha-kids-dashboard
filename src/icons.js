import { svg } from 'lit'

// The card's icons, drawn in the text color so they follow the theme.

const icon = (body) => svg`<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`

export const icons = {
    play: icon(svg`<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/>`),
    pause: icon(svg`<rect x="5.5" y="4" width="4.5" height="16" rx="1.5"/><rect x="14" y="4" width="4.5" height="16" rx="1.5"/>`),
    previous: icon(svg`<rect x="4" y="5" width="3" height="14" rx="1"/><path d="M20 5.7v12.6a1 1 0 0 1-1.55.83L9.3 12.83a1 1 0 0 1 0-1.66l9.15-6.3A1 1 0 0 1 20 5.7z"/>`),
    next: icon(svg`<rect x="17" y="5" width="3" height="14" rx="1"/><path d="M4 5.7v12.6a1 1 0 0 0 1.55.83l9.15-6.3a1 1 0 0 0 0-1.66L5.55 4.87A1 1 0 0 0 4 5.7z"/>`),
    check: icon(svg`<path d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4z"/>`),
    restart: icon(svg`<path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/>`),
    back: icon(svg`<path d="M15.4 4.6 8 12l7.4 7.4-1.8 1.8L4.4 12l9.2-9.2z"/>`),
}
