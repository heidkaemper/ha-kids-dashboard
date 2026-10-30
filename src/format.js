// How times and names read on the screen.

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

/** "1 Hörspiel", "12 Hörspiele". */
export function countLabel(count) {
    return `${count} ${count === 1 ? 'Hörspiel' : 'Hörspiele'}`
}

/** A cover from the integration at the size wanted; any other picture (a player's art) as it is. */
export function imageUrl(path, size) {
    if (!path) {
        return ''
    }

    return path.startsWith('/api/kids_dashboard/img/') ? `${path}?s=${size}` : path
}
