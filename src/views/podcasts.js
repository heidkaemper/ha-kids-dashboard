import { html } from 'lit'
import { countLabel, imageUrl } from '../format.js'
import { icons } from '../icons.js'

const EPISODES = ['Folge', 'Folgen']

/**
 * The podcasts' home page: "Zuletzt gehört" and "Kürzlich aktualisiert" first, each once it holds something,
 * then one tile per liked podcast.
 */
export function renderPodcastHome({ podcasts, recent, latest, onOpenList, onOpenPodcast }) {
    if (!podcasts.length) {
        return html`<div class="empty">Noch keine Podcasts da.</div>`
    }

    return html`
        <div class="shelf">
            ${recent ? listTile('Zuletzt gehört', icons.recent, recent, () => onOpenList('recent')) : ''}
            ${latest ? listTile('Kürzlich aktualisiert', icons.fresh, latest, () => onOpenList('latest')) : ''}
            ${podcasts.map((podcast) => html`
                <button class="tile" @click=${() => onOpenPodcast(podcast.id)}>
                    <div class="cover">
                        ${podcast.cover ? html`<img src=${imageUrl(podcast.cover, 256)} alt="">` : ''}
                    </div>
                    <div class="name single-line">${podcast.name}</div>
                    <div class="sub">${countLabel(podcast.count, EPISODES)}</div>
                </button>
            `)}
        </div>
    `
}

function listTile(name, icon, count, onOpen) {
    return html`
        <button class="tile" @click=${onOpen}>
            <div class="cover plain">${icon}</div>
            <div class="name single-line">${name}</div>
            <div class="sub">${countLabel(count, EPISODES)}</div>
        </button>
    `
}
