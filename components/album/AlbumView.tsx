'use client'

import { useState, useCallback, useEffect, useSyncExternalStore } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Toolbar from './Toolbar'
import FilterPanel from './FilterPanel'
import GalleryGrid from './GalleryGrid'
import LightboxViewer from './LightboxViewer'
import { useFavorites } from '@/hooks/useFavorites'
import { sortMedia } from '@/lib/utils'
import type { Album, MediaItem, Layout, SortOption, FilterState, GroupMode } from '@/types'

const PAGE_SIZE = 60
const COLS_MIN = 2
const PORTRAIT_DEFAULT_COLS = 3
const PORTRAIT_MAX_COLS = 5
const LANDSCAPE_DEFAULT_COLS = 5
const LANDSCAPE_MAX_COLS = 10
const COLS_CHANGED_EVENT = 'photo-album-cols-changed'
const COLS_STORAGE_VERSION = 'v2'

type Orientation = 'portrait' | 'landscape'

interface AlbumViewProps {
  album: Album
  media: MediaItem[]
}

interface DayGroup {
  key: string
  label: string
  items: MediaItem[]
  indices: number[]
}

const DEFAULT_FILTER: FilterState = {
  mediaType: 'all',
  orientation: 'all',
  datePreset: 'all',
  dateFrom: '',
  dateTo: '',
  search: '',
  favoritesOnly: false,
}

function subscribeNoop() {
  return () => {}
}

function AlbumHydrationLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <style>{`
        .album-hydration-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        @media (orientation: landscape) {
          .album-hydration-grid {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }
        }
      `}</style>
      <div
        className="px-4 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <div className="h-6 w-40 rounded animate-pulse" style={{ background: 'var(--border)' }} />
          <div className="h-4 w-60 rounded mt-2 animate-pulse" style={{ background: 'var(--border)' }} />
        </div>
        <div className="h-8 w-32 rounded animate-pulse" style={{ background: 'var(--border)' }} />
      </div>
      <div className="album-hydration-grid flex-1 p-4 grid gap-1">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="rounded animate-pulse aspect-square" style={{ background: 'var(--border)' }} />
        ))}
      </div>
    </div>
  )
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
  return `cols_${COLS_STORAGE_VERSION}_${orientation}_${albumId}`
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

function getDayGroupInfo(item: MediaItem) {
  if (!item.takenAt) return { key: 'no-date', label: 'ללא תאריך צילום' }

  const date = new Date(item.takenAt)
  if (Number.isNaN(date.getTime())) return { key: 'no-date', label: 'ללא תאריך צילום' }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return {
    key: `${year}-${month}-${day}`,
    label: date.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' }),
  }
}

function groupItemsByDay(items: MediaItem[]): DayGroup[] {
  return items.reduce<DayGroup[]>((groups, item, index) => {
    const info = getDayGroupInfo(item)
    const group = groups.find((current) => current.key === info.key)

    if (group) {
      group.items.push(item)
      group.indices.push(index)
    } else {
      groups.push({ ...info, items: [item], indices: [index] })
    }

    return groups
  }, [])
}

export default function AlbumView({ album, media }: AlbumViewProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [layout, setLayout] = useState<Layout>('rows')
  const [sort, setSort] = useState<SortOption>(album.defaultSort)
  const [groupMode, setGroupMode] = useState<GroupMode>('continuous')
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER)
  const [filterOpen, setFilterOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const isHydrated = useSyncExternalStore(subscribeNoop, () => true, () => false)
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
  const galleryKey = `${orientation}-${layout}-${cols}-${groupMode}`

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
  if (filter.orientation !== 'all') {
    filteredItems = filteredItems.filter((m) => {
      if (!m.width || !m.height) return false
      return filter.orientation === 'landscape' ? m.width >= m.height : m.height > m.width
    })
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
  const visibleDayGroups = groupMode === 'by-day' ? groupItemsByDay(visibleItems) : []
  const hasMore = visibleItems.length < filteredSorted.length
  const handleLoadMore = useCallback(() => setPage((p) => p + 1), [])

  const imageCount = media.filter((m) => m.type === 'image').length
  const videoCount = media.filter((m) => m.type === 'video').length

  if (!isHydrated) return <AlbumHydrationLoading />

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
        groupMode={groupMode}
        sort={sort}
        filterOpen={filterOpen}
        onLayoutChange={setLayout}
        onColsChange={handleColsChange}
        onGroupModeChange={setGroupMode}
        onSortChange={handleSortChange}
        onFilterToggle={() => setFilterOpen((v) => !v)}
        onFilterOpen={() => setFilterOpen(true)}
      />

      {filterOpen && (
        <FilterPanel
          filter={filter}
          totalCount={media.length}
          filteredCount={filteredSorted.length}
          onChange={handleFilterChange}
          onClose={() => setFilterOpen(false)}
        />
      )}

      {filteredSorted.length === 0 ? (
        <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--muted)' }}>
          <p>לא נמצאו פריטים</p>
        </div>
      ) : groupMode === 'by-day' ? (
        <div className="flex-1 p-2">
          {visibleDayGroups.map((group, groupIndex) => (
            <section key={group.key} className={groupIndex === 0 ? '' : 'mt-5'}>
              <div
                className="flex items-center justify-between gap-3 px-1 py-2"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <h2 className="text-sm font-semibold">{group.label}</h2>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {group.items.length} פריטים
                </span>
              </div>
              <GalleryGrid
                key={`${galleryKey}-${group.key}`}
                items={group.items}
                layout={layout}
                cols={cols}
                colsMin={colsMin}
                colsMax={colsMax}
                showLoadMore={groupIndex === visibleDayGroups.length - 1}
                isFav={isFav}
                onToggleFav={toggle}
                onOpen={(index) => handleOpenLightbox(group.indices[index] ?? 0)}
                onColsChange={handleColsChange}
                hasMore={groupIndex === visibleDayGroups.length - 1 && hasMore}
                onLoadMore={handleLoadMore}
              />
            </section>
          ))}
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
