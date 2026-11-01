import { html } from 'lit'
import { imageUrl } from '../format.js'
import { icons } from '../icons.js'

/** A group's books in one list, as Music Assistant lists them: a heard one ticked, a begun one with its progress. */
export function renderGroup({ books, onOpenBook }) {
    return html`
        <div class="grid">
            ${books.map((book) => html`
                <button class="tile" @click=${() => onOpenBook(book.id)}>
                    <div class="cover">
                        ${book.cover ? html`<img src=${imageUrl(book.cover, 256)} loading="lazy" alt="">` : ''}
                        ${progressMark(book)}
                    </div>
                    <div class="name">${book.title}</div>
                </button>
            `)}
        </div>
    `
}

/** A tick once heard, a bar while begun: on a book's cover, and on an episode's. */
export function progressMark(book) {
    if (book.played) {
        return html`<span class="heard">${icons.check}</span>`
    }

    const percent = book.resume && book.duration ? Math.min(100, (book.resume / book.duration) * 100) : 0

    if (percent <= 1) {
        return ''
    }

    return html`<div class="progress"><i style="width: ${percent}%"></i></div>`
}
