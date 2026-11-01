// How times and names read on the screen.

// Music Assistant's URIs name what they point to: provider://podcast_episode/…
const EPISODE = /^[^:]+:\/\/podcast_episode\//

/** Whether a Music Assistant URI is a podcast episode's. */
export function isEpisode(uri) {
    return EPISODE.test(uri ?? '')
}

/** Seconds as 1:02:03 or 2:03. */
export function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds || 0))
    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    const rest = String(total % 60).padStart(2, '0')

    if (!hours) {
        return `${minutes}:${rest}`
    }

    return `${hours}:${String(minutes).padStart(2, '0')}:${rest}`
}

/** A chapter's name without the number Music Assistant puts in front ("03 - Polizeiarbeit"). */
export function chapterName(name) {
    return String(name || '').replace(/^\d+\s*-\s*/, '')
}

/** "1 Hörspiel", "12 Hörspiele"; with other words, "1 Folge", "12 Folgen". */
export function countLabel(count, [one, many] = ['Hörspiel', 'Hörspiele']) {
    return `${count} ${count === 1 ? one : many}`
}

/** A day as a child says it: "Heute", "Gestern", "12. Okt.". */
export function formatDay(iso) {
    const day = new Date(iso)

    if (Number.isNaN(day.getTime())) {
        return ''
    }

    const today = new Date()
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)

    if (day.toDateString() === today.toDateString()) {
        return 'Heute'
    }

    if (day.toDateString() === yesterday.toDateString()) {
        return 'Gestern'
    }

    const sameYear = day.getFullYear() === today.getFullYear()

    return day.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: sameYear ? undefined : 'numeric' })
}

/** A cover from the integration at the size wanted; any other picture (a player's art) as it is. */
export function imageUrl(path, size) {
    if (!path) {
        return ''
    }

    return path.startsWith('/api/kids_dashboard/img/') ? `${path}?s=${size}` : path
}
