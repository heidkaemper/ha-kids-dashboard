import { html } from 'lit'
import { chapterName, formatTime, imageUrl } from '../format.js'
import { icons } from '../icons.js'

// Music Assistant keeps a resume point only after a while; until then a book counts as begun once it played.
const BEGUN_AFTER = 30

/** A book: its cover, what can be done with it, and its chapters with the one playing marked. */
export function renderBook({ book, playback, onPlay, onRestart, onToggle }) {
    const current = playback.book?.id === book.id
    const playingChapter = current ? playback.state.chapter : null

    return html`
        <div class="book">
            <div class="cover">
                ${book.cover ? html`<img src=${imageUrl(book.cover, 512)} alt="">` : ''}
            </div>

            <div class="side">
                <div class="meta">${book.number ? `Folge ${book.number} · ` : ''}${Math.round(book.duration / 60)} Min.</div>
                <h3>${book.title}</h3>

                <div class="actions">
                    ${mainAction({ book, current, playing: current && playback.playing, onPlay, onToggle })}
                    ${current || begun(book) ? html`
                        <button class="action secondary" @click=${() => onRestart(book.uri)}>
                            ${icons.restart} Neustart
                        </button>
                    ` : ''}
                </div>

                <div class="chapters">
                    ${(book.chapters ?? []).map((chapter) => html`
                        <button
                            class="chapter ${playingChapter?.start === chapter.start ? 'now' : ''}"
                            @click=${() => onPlay(book.uri, chapter.start)}
                        >
                            <b>${chapter.position}</b>
                            <span>${chapterName(chapter.name)}</span>
                            <em>${formatTime(chapter.end - chapter.start)}</em>
                        </button>
                    `)}
                </div>
            </div>
        </div>
    `
}

/**
 * The book on the player: Pause while it plays, Weiterhören while paused, both on the player itself.
 * Another book: Abspielen, or Weiterhören once begun (Music Assistant resumes it where it was left).
 */
function mainAction({ book, current, playing, onPlay, onToggle }) {
    if (current) {
        return html`
            <button class="action" @click=${onToggle}>
                ${playing ? html`${icons.pause} Pause` : html`${icons.play} Weiterhören`}
            </button>
        `
    }

    return html`
        <button class="action" @click=${() => onPlay(book.uri)}>
            ${icons.play} ${begun(book) ? 'Weiterhören' : 'Abspielen'}
        </button>
    `
}

function begun(book) {
    return book.resume > BEGUN_AFTER && !book.played
}
