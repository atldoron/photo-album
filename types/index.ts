export type Layout = 'rows' | 'columns' | 'masonry'
export type SortOption = 'date-desc' | 'date-asc'
export type MediaType = 'all' | 'image' | 'video'
export type MediaOrientation = 'all' | 'landscape' | 'portrait'
export type DatePreset = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom'

export interface Album {
  id: string
  name: string
  description: string
  driveFolder: string
  defaultLayout: Layout
  defaultSize: number
  defaultSort: SortOption
  createdAt: string
  order: number
}

export interface MediaItem {
  id: string
  name: string
  mimeType: string
  type: 'image' | 'video'
  thumbnailUrl: string
  viewUrl: string
  downloadUrl: string
  width: number
  height: number
  takenAt?: string
  fileSize?: number
  latitude?: number
  longitude?: number
}

export interface FilterState {
  mediaType: MediaType
  orientation: MediaOrientation
  datePreset: DatePreset
  dateFrom: string
  dateTo: string
  search: string
  favoritesOnly: boolean
}
