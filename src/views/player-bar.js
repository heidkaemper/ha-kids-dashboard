import { html } from 'lit'
import { chapterName, imageUrl } from '../format.js'
import { icons } from '../icons.js'

/** What plays now, fixed at the bottom: a tap on it opens the book, the buttons work the player. */
export function renderPlayerBar({ playback, onOpen, onCommand }) {
    const state = playback.state
    const book = playback.book

    if (!book) {
        return ''
    }

    const progress = state.duration ? Math.min(100, (state.elapsed / state.duration) * 100) : 0
    const detail = state.chapter
        ? `Kapitel ${state.chapter.position} von ${state.chapters}: ${chapterName(state.chapter.name)}`
        : book.series

    return html`
        <div class="player">
            <button class="now-playing" aria-label="Zum Hörspiel" @click=${onOpen}>
                <img src=${imageUrl(book.cover, 160)} alt="">
                <div class="text">
                    <div class="title">${book.number ? `${book.number} · ` : ''}${book.title}</div>
                    <div class="detail">${detail}</div>
                    <div class="bar"><i style="width: ${progress.toFixed(1)}%"></i></div>
                </div>
            </button>

            <button class="control" aria-label="Kapitel zurück" @click=${() => onCommand('chapter_prev')}>
                ${icons.previous}
            </button>
            <button class="control main" aria-label="Abspielen oder Pause" @click=${() => onCommand('play_pause')}>
                ${playback.playing ? icons.pause : icons.play}
            </button>
            <button class="control" aria-label="Nächstes Kapitel" @click=${() => onCommand('chapter_next')}>
                ${icons.next}
            </button>
        </div>
    `
}
