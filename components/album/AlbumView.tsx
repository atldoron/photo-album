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

  // localStorage keys — per album, per orientation
  const KEY_P = `cols_portrait_${album.id}`
  const KEY_L = `cols_landscape_${album.id}`

  const [cols, setCols] = useState<number>(3)
  const [isPortrait, setIsPortrait] = useState<boolean>(true)

  // On first load and on every portrait↔landscape transition:
  // restore the user's last choice from localStorage, or apply the default.
  // We compare orientation before/after so that browser-bar hide/show
  // (which also fires "resize" on mobile) does NOT reset the column count.
  useEffect(() => {
    let lastIsPortrait: boolean | null = null

    function handleResize() {
      const portrait = window.innerHeight >= window.innerWidth
      if (lastIsPortrait === portrait) return   // same orientation — do nothing
      lastIsPortrait = portrait
      setIsPortrait(portrait)
      const stored = localStorage.getItem(portrait ? KEY_P : KEY_L)
      setCols(stored ? Number(stored) : portrait ? 3 : 5)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update cols + persist to localStorage
  function handleColsChange(n: number) {
    const portrait = window.innerHeight >= window.innerWidth
    setCols(n)
    localStorage.setItem(portrait ? KEY_P : KEY_L, String(n))
  }

  const colsMin = 2
  const colsMax = isPortrait ? 5 : 10

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

  const lightboxItems = filteredSorted

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
