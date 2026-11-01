import { html } from 'lit'
import { imageUrl } from '../format.js'

/** The books heard lately on this screen, the latest first, one per row: a small cover and the title. */
export function renderRecent({ books, onOpenBook }) {
    if (!books.length) {
        return html`<div class="empty">Hier steht, was du zuletzt gehört hast.</div>`
    }

    return html`
        <div class="list">
            ${books.map((book) => html`
                <button class="row" @click=${() => onOpenBook(book.id)}>
                    <div class="cover">
                        ${book.cover ? html`<img src=${imageUrl(book.cover, 160)} loading="lazy" alt="">` : ''}
                    </div>
                    <div class="name">${book.title}</div>
                </button>
            `)}
        </div>
    `
}
