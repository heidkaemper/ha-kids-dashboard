import { html } from 'lit'
import { formatDay, imageUrl } from '../format.js'
import { progressMark } from './group.js'

/**
 * Episodes, one per row: a small cover with a tick once heard, the title, and under it when it came out and how
 * long it is. A tap plays it, where it was left. Lists from several podcasts name the podcast too.
 */
export function renderEpisodes({ episodes, showPodcast, empty, onPlay }) {
    if (!episodes.length) {
        return html`<div class="empty">${empty}</div>`
    }

    return html`
        <div class="list">
            ${episodes.map((episode) => html`
                <button class="row" @click=${() => onPlay(episode.uri)}>
                    <div class="cover">
                        ${episode.cover ? html`<img src=${imageUrl(episode.cover, 160)} loading="lazy" alt="">` : ''}
                        ${progressMark(episode)}
                    </div>
                    <div class="text">
                        <div class="name">${episode.title}</div>
                        <div class="meta">${meta(episode, showPodcast)}</div>
                    </div>
                </button>
            `)}
        </div>
    `
}

function meta(episode, showPodcast) {
    const minutes = episode.duration ? `${Math.max(1, Math.round(episode.duration / 60))} Min.` : ''

    return [showPodcast ? episode.podcast : '', formatDay(episode.date), minutes].filter(Boolean).join(' · ')
}
