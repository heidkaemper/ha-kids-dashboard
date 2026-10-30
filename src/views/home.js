import { html } from 'lit'
import { countLabel, imageUrl } from '../format.js'

/**
 * The home page: one tile per author, as Music Assistant's author page shows them, with the author's
 * picture. A book that belongs to no group opens straight away.
 */
export function renderHome({ groups, onOpenGroup, onOpenBook }) {
    if (!groups.length) {
        return html`<div class="empty">Noch keine Hörspiele da.</div>`
    }

    return html`
        <div class="shelf">
            ${groups.map((group) => html`
                <button
                    class="tile"
                    @click=${() => (group.single ? onOpenBook(group.single) : onOpenGroup(group.id))}
                >
                    <div class="cover">
                        ${group.covers[0] ? html`<img src=${imageUrl(group.covers[0], 256)} alt="">` : ''}
                    </div>
                    <div class="name single-line">${group.name}</div>
                    <div class="sub">${group.single ? group.sub : countLabel(group.count)}</div>
                </button>
            `)}
        </div>
    `
}
