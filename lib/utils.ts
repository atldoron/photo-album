import type { MediaItem, SortOption } from '@/types'

export function sortMedia(items: MediaItem[], sort: SortOption): MediaItem[] {
  return [...items].sort((a, b) => {
    const dateA = a.takenAt ?? a.name
    const dateB = b.takenAt ?? b.name
    return sort === 'date-desc'
      ? dateB.localeCompare(dateA)
      : dateA.localeCompare(dateB)
  })
}

export function formatDate(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
