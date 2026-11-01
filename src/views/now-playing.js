import { html } from 'lit'
import { chapterName, formatTime, imageUrl, isEpisode } from '../format.js'
import { icons } from '../icons.js'

/**
 * Now Playing over everything, lined up on the cover: back, play/pause and next level with its middle, the
 * timeline of the chapter that plays at its foot, and the times level with the title below it. A small close
 * button sits in the corner; a tap anywhere but on the controls closes it too. For a podcast episode, back and
 * next skip half a minute: an episode has no chapters, and the queue nothing after it.
 */
export function renderNowPlaying({ media, playing, onClose, onToggle, onPrevious, onNext, onScrub, onSeek }) {
    const length = Math.max(1, media.end - media.start)
    const position = Math.min(Math.max(media.position - media.start, 0), length)
    const progress = (position / length) * 100
    const stop = (event) => event.stopPropagation()

    return html`
        <div class="overlay" @click=${onClose}>
            ${media.cover ? html`<img class="blur" src=${imageUrl(media.cover, 256)} alt="">` : ''}

            <button class="close" aria-label="Schließen" @click=${onClose}>${icons.close}</button>

            <div class="layout">
                <div class="cover">${media.cover ? html`<img src=${imageUrl(media.cover, 512)} alt="">` : ''}</div>

                <div class="text">
                    <div class="title">${media.title}</div>
                    ${media.detail ? html`<div class="detail">${media.detail}</div>` : ''}
                </div>

                <div class="controls" @click=${stop}>
                    ${media.episode
                        ? html`<button class="control" aria-label="30 Sekunden zurück" @click=${onPrevious}>${icons.back30}</button>`
                        : html`<button class="control" aria-label="Zurück" @click=${onPrevious}>${icons.previous}</button>`}
                    <button class="control main" aria-label=${playing ? 'Pause' : 'Abspielen'} @click=${onToggle}>
                        ${playing ? icons.pause : icons.play}
                    </button>
                    ${media.episode
                        ? html`<button class="control" aria-label="30 Sekunden vor" @click=${onNext}>${icons.forward30}</button>`
                        : html`<button class="control" aria-label="Weiter" @click=${onNext}>${icons.next}</button>`}
                </div>

                <input
                    class="timeline"
                    type="range"
                    aria-label="Spulen"
                    min="0"
                    max=${length}
                    step="any"
                    .value=${String(position)}
                    style="--progress: ${progress.toFixed(2)}%"
                    @click=${stop}
                    @input=${(event) => onScrub(media.start + Number(event.target.value))}
                    @change=${(event) => onSeek(media.start + Number(event.target.value))}
                >

                <div class="times" @click=${stop}>
                    <span>${formatTime(position)}</span>
                    <span>${formatTime(length)}</span>
                </div>
            </div>
        </div>
    `
}

/** What plays, as Now Playing shows it: an audiobook by its chapter, anything else as the player has it. */
export function nowPlayingMedia(state, elapsed, entity) {
    const book = state?.book

    if (book) {
        const chapter = state.chapter

        return {
            book: true,
            cover: book.cover,
            title: book.title,
            detail: chapter ? `Kapitel ${chapter.position} von ${state.chapters}: ${chapterName(chapter.name)}` : '',
            start: chapter?.start ?? 0,
            end: chapter?.end ?? state.duration,
            position: elapsed,
        }
    }

    const attributes = entity?.attributes

    if (!attributes?.media_title) {
        return null
    }

    let position = attributes.media_position || 0

    if (entity.state === 'playing' && attributes.media_position_updated_at) {
        position += (Date.now() - Date.parse(attributes.media_position_updated_at)) / 1000
    }

    return {
        book: false,
        episode: isEpisode(attributes.media_content_id),
        cover: attributes.entity_picture || '',
        title: chapterName(attributes.media_title),
        detail: attributes.media_artist || '',
        start: 0,
        end: attributes.media_duration || 0,
        position,
    }
}
