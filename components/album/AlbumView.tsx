'use client'

import { useState, useCallback, useEffect, useSyncExternalStore } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Toolbar from './Toolbar'
import FilterPanel from './FilterPanel'
import GalleryGrid from './GalleryGrid'
import LightboxViewer from './LightboxViewer'
import { useFavorites } from '@/hooks/useFavorites'
import { sortMedia } from '@/lib/utils'
import type { Album, MediaItem, Layout, SortOption, FilterState } from '@/types'

const PAGE_SIZE = 60
const COLS_MIN = 2
const PORTRAIT_DEFAULT_COLS = 3
const PORTRAIT_MAX_COLS = 5
const LANDSCAPE_DEFAULT_COLS = 5
const LANDSCAPE_MAX_COLS = 10
const COLS_CHANGED_EVENT = 'photo-album-cols-changed'

type Orientation = 'portrait' | 'landscape'

interface AlbumViewProps {
  album: Album
  media: MediaItem[]
}

const DEFAULT_FILTER: FilterState = {
  mediaType: 'all',
  dateFrom: '',
  dateTo: '',
  search: '',
  favoritesOnly: false,
}

function getOrientationSnapshot(): Orientation {
  if (typeof window === 'undefined') return 'portrait'
  return window.innerHeight >= window.innerWidth ? 'portrait' : 'landscape'
}

function subscribeToOrientation(callback: () => void) {
  const mq = window.matchMedia('(orientation: portrait)')
  mq.addEventListener('change', callback)
  window.addEventListener('resize', callback)
  window.addEventListener('orientationchange', callback)
  return () => {
    mq.removeEventListener('change', callback)
    window.removeEventListener('resize', callback)
    window.removeEventListener('orientationchange', callback)
  }
}

function clampCols(value: number, orientation: Orientation) {
  const max = orientation === 'portrait' ? PORTRAIT_MAX_COLS : LANDSCAPE_MAX_COLS
  const fallback = orientation === 'portrait' ? PORTRAIT_DEFAULT_COLS : LANDSCAPE_DEFAULT_COLS
  return Math.min(max, Math.max(COLS_MIN, Number.isFinite(value) ? value : fallback))
}

function columnStorageKey(albumId: string, orientation: Orientation) {
  return `cols_${orientation}_${albumId}`
}

function readStoredCols(albumId: string, orientation: Orientation) {
  if (typeof window === 'undefined') {
    return orientation === 'portrait' ? PORTRAIT_DEFAULT_COLS : LANDSCAPE_DEFAULT_COLS
  }

  const stored = window.localStorage.getItem(columnStorageKey(albumId, orientation))
  return clampCols(stored ? Number(stored) : Number.NaN, orientation)
}

function subscribeToStoredCols(callback: () => void) {
  window.addEventListener(COLS_CHANGED_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(COLS_CHANGED_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

function getStoredColsSnapshot(albumId: string) {
  return `${readStoredCols(albumId, 'portrait')}:${readStoredCols(albumId, 'landscape')}`
}

export default function AlbumView({ album, media }: AlbumViewProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [layout, setLayout] = useState<Layout>(album.defaultLayout)
  const [sort, setSort] = useState<SortOption>(album.defaultSort)
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER)
  const [filterOpen, setFilterOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const orientation = useSyncExternalStore(
    subscribeToOrientation,
    getOrientationSnapshot,
    () => 'portrait' as Orientation
  )
  const storedColsSnapshot = useSyncExternalStore(
    subscribeToStoredCols,
    () => getStoredColsSnapshot(album.id),
    () => `${PORTRAIT_DEFAULT_COLS}:${LANDSCAPE_DEFAULT_COLS}`
  )
  const [portraitCols, landscapeCols] = storedColsSnapshot.split(':').map(Number)
  const cols = orientation === 'portrait' ? portraitCols : landscapeCols
  const colsMin = COLS_MIN
  const colsMax = orientation === 'portrait' ? PORTRAIT_MAX_COLS : LANDSCAPE_MAX_COLS
  const galleryKey = `${orientation}-${layout}-${cols}`

  const { isFav, toggle } = useFavorites(album.id)

  function handleColsChange(n: number) {
    const next = clampCols(n, orientation)
    window.localStorage.setItem(columnStorageKey(album.id, orientation), String(next))
    window.dispatchEvent(new Event(COLS_CHANGED_EVENT))
  }

  function handleSortChange(nextSort: SortOption) {
    setSort(nextSort)
    setPage(1)
  }

  function handleFilterChange(nextFilter: FilterState) {
    setFilter(nextFilter)
    setPage(1)
  }

  // Open shared item links when the URL contains ?item=ID.
  useEffect(() => {
    const itemId = searchParams.get('item')
    if (!itemId) return
    const idx = media.findIndex((m) => m.id === itemId)
    if (idx >= 0) queueMicrotask(() => setLightboxIndex(idx))
  }, [searchParams, media])

  let filteredItems = media

  if (filter.mediaType !== 'all') {
    filteredItems = filteredItems.filter((m) => m.type === filter.mediaType)
  }
  if (filter.favoritesOnly) {
    filteredItems = filteredItems.filter((m) => isFav(m.id))
  }
  if (filter.search) {
    const q = filter.search.toLowerCase()
    filteredItems = filteredItems.filter((m) => m.name.toLowerCase().includes(q))
  }
  if (filter.dateFrom) {
    filteredItems = filteredItems.filter((m) => m.takenAt && m.takenAt >= filter.dateFrom)
  }
  if (filter.dateTo) {
    filteredItems = filteredItems.filter((m) => m.takenAt && m.takenAt <= `${filter.dateTo}T23:59:59`)
  }

  const filteredSorted = sortMedia(filteredItems, sort)
  const visibleItems = filteredSorted.slice(0, page * PAGE_SIZE)
  const hasMore = visibleItems.length < filteredSorted.length
  const handleLoadMore = useCallback(() => setPage((p) => p + 1), [])

  const imageCount = media.filter((m) => m.type === 'image').length
  const videoCount = media.filter((m) => m.type === 'video').length

  function handleOpenLightbox(index: number) {
    setLightboxIndex(index)
    const item = filteredSorted[index]
    if (item) {
      const url = new URL(window.location.href)
      url.searchParams.set('item', item.id)
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }

  function handleNavigateLightbox(index: number) {
    const item = filteredSorted[index]
    if (item) {
      const url = new URL(window.location.href)
      url.searchParams.set('item', item.id)
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }

  function handleCloseLightbox() {
    setLightboxIndex(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('item')
    router.replace(url.pathname + url.search, { scroll: false })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Toolbar
        albumName={album.name}
        albumDescription={album.description}
        imageCount={imageCount}
        videoCount={videoCount}
        layout={layout}
        cols={cols}
        colsMin={colsMin}
        colsMax={colsMax}
        sort={sort}
        filterOpen={filterOpen}
        onLayoutChange={setLayout}
        onColsChange={handleColsChange}
        onSortChange={handleSortChange}
        onFilterToggle={() => setFilterOpen((v) => !v)}
      />

      {filterOpen && (
        <FilterPanel
          filter={filter}
          onChange={handleFilterChange}
          onClose={() => setFilterOpen(false)}
        />
      )}

      {filteredSorted.length === 0 ? (
        <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--muted)' }}>
          <p>לא נמצאו פריטים</p>
        </div>
      ) : (
        <GalleryGrid
          key={galleryKey}
          items={visibleItems}
          layout={layout}
          cols={cols}
          colsMin={colsMin}
          colsMax={colsMax}
          isFav={isFav}
          onToggleFav={toggle}
          onOpen={handleOpenLightbox}
          onColsChange={handleColsChange}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
        />
      )}

      {lightboxIndex !== null && (
        <LightboxViewer
          items={filteredSorted}
          index={lightboxIndex}
          onClose={handleCloseLightbox}
          onNavigate={handleNavigateLightbox}
          isFav={isFav}
          onToggleFav={toggle}
        />
      )}
    </div>
  )
}
