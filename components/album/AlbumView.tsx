'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Toolbar from './Toolbar'
import FilterPanel from './FilterPanel'
import GalleryGrid from './GalleryGrid'
import LightboxViewer from './LightboxViewer'
import { useFavorites } from '@/hooks/useFavorites'
import { sortMedia } from '@/lib/utils'
import type { Album, MediaItem, Layout, SortOption, FilterState } from '@/types'

const PAGE_SIZE = 60

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

export default function AlbumView({ album, media }: AlbumViewProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [layout, setLayout] = useState<Layout>(album.defaultLayout)
  const [size, setSize] = useState(album.defaultSize)

  // Mobile: 3 cols portrait (size=88), 5 cols landscape (size=62) — updates on rotation
  useEffect(() => {
    function applyMobileSize() {
      const w = window.innerWidth
      const h = window.innerHeight
      if (Math.max(w, h) < 1024) {          // treat as mobile/tablet
        setSize(h > w ? 88 : 62)            // portrait=3cols, landscape=5cols
      }
    }
    applyMobileSize()
    window.addEventListener('resize', applyMobileSize)
    return () => window.removeEventListener('resize', applyMobileSize)
  }, [])

  const [sort, setSort] = useState<SortOption>(album.defaultSort)
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER)
  const [filterOpen, setFilterOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const { isFav, toggle } = useFavorites(album.id)

  // Open lightbox to a specific item if ?item=ID is in URL
  useEffect(() => {
    const itemId = searchParams.get('item')
    if (!itemId) return
    const idx = media.findIndex((m) => m.id === itemId)
    if (idx >= 0) setLightboxIndex(idx)
  }, [searchParams, media])

  // Update URL when lightbox opens to a specific item
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

  // Filtered + sorted media
  const filteredSorted = useMemo(() => {
    let items = media

    if (filter.mediaType !== 'all') {
      items = items.filter((m) => m.type === filter.mediaType)
    }
    if (filter.favoritesOnly) {
      items = items.filter((m) => isFav(m.id))
    }
    if (filter.search) {
      const q = filter.search.toLowerCase()
      items = items.filter((m) => m.name.toLowerCase().includes(q))
    }
    if (filter.dateFrom) {
      items = items.filter((m) => m.takenAt && m.takenAt >= filter.dateFrom)
    }
    if (filter.dateTo) {
      items = items.filter((m) => m.takenAt && m.takenAt <= filter.dateTo + 'T23:59:59')
    }

    return sortMedia(items, sort)
  }, [media, filter, sort, isFav])

  // Paginated items for gallery
  const visibleItems = useMemo(
    () => filteredSorted.slice(0, page * PAGE_SIZE),
    [filteredSorted, page]
  )

  const hasMore = visibleItems.length < filteredSorted.length

  const handleLoadMore = useCallback(() => setPage((p) => p + 1), [])

  // Reset page when filter/sort changes
  useEffect(() => { setPage(1) }, [filter, sort])

  const imageCount = media.filter((m) => m.type === 'image').length
  const videoCount = media.filter((m) => m.type === 'video').length

  // Lightbox items — filtered by favorites if filter is active
  const lightboxItems = filter.favoritesOnly
    ? filteredSorted
    : filteredSorted

  return (
    <div className="min-h-screen flex flex-col">
      <Toolbar
        albumName={album.name}
        albumDescription={album.description}
        imageCount={imageCount}
        videoCount={videoCount}
        layout={layout}
        size={size}
        sort={sort}
        filterOpen={filterOpen}
        onLayoutChange={setLayout}
        onSizeChange={setSize}
        onSortChange={setSort}
        onFilterToggle={() => setFilterOpen((v) => !v)}
      />

      {filterOpen && (
        <FilterPanel
          filter={filter}
          onChange={(f) => { setFilter(f); setPage(1) }}
          onClose={() => setFilterOpen(false)}
        />
      )}

      {filteredSorted.length === 0 ? (
        <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--muted)' }}>
          <p>לא נמצאו פריטים</p>
        </div>
      ) : (
        <GalleryGrid
          items={visibleItems}
          layout={layout}
          size={size}
          isFav={isFav}
          onToggleFav={toggle}
          onOpen={handleOpenLightbox}
          onSizeChange={setSize}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
        />
      )}

      {lightboxIndex !== null && (
        <LightboxViewer
          items={lightboxItems}
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
