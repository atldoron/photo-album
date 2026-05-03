import type { MediaItem, SortOption } from '@/types'

export function sortMedia(items: MediaItem[], sort: SortOption): MediaItem[] {
  return [...items].sort((a, b) => {
    switch (sort) {
      case 'date-desc':
        return (b.takenAt ?? b.name).localeCompare(a.takenAt ?? a.name)
      case 'date-asc':
        return (a.takenAt ?? a.name).localeCompare(b.takenAt ?? b.name)
      case 'name-asc':
        return a.name.localeCompare(b.name, 'he')
      case 'name-desc':
        return b.name.localeCompare(a.name, 'he')
    }
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
