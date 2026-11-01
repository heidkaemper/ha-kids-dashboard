import { html } from 'lit'
import { countLabel, imageUrl } from '../format.js'
import { icons } from '../icons.js'

/**
 * The home page: one tile per author, as Music Assistant's author page shows them, with the author's
 * picture. A book that belongs to no group opens straight away. "Zuletzt" comes first, once something has
 * been heard on this screen.
 */
export function renderHome({ groups, recent, onOpenRecent, onOpenGroup, onOpenBook }) {
    if (!groups.length) {
        return html`<div class="empty">Noch keine Hörspiele da.</div>`
    }

    return html`
        <div class="shelf">
            ${recent.length ? html`
                <button class="tile" @click=${onOpenRecent}>
                    <div class="cover plain">${icons.recent}</div>
                    <div class="name single-line">Zuletzt</div>
                    <div class="sub">${countLabel(recent.length)}</div>
                </button>
            ` : ''}
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
