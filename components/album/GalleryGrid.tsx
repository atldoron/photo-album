'use client'

import { useRef, useEffect } from 'react'
import { RowsPhotoAlbum, MasonryPhotoAlbum } from 'react-photo-album'
import type { Photo, RenderPhotoProps, RenderPhotoContext } from 'react-photo-album'
import 'react-photo-album/rows.css'
import 'react-photo-album/masonry.css'
import type { MediaItem, Layout } from '@/types'

interface GalleryPhoto extends Photo {
  mediaItem: MediaItem
  favStatus: boolean
}

interface GalleryGridProps {
  items: MediaItem[]
  layout: Layout
  size: number
  isFav: (id: string) => boolean
  onToggleFav: (id: string) => void
  onOpen: (index: number) => void
  onSizeChange: (s: number) => void
  hasMore: boolean
  onLoadMore: () => void
}

export default function GalleryGrid({
  items, layout, size, isFav, onToggleFav, onOpen, onSizeChange, hasMore, onLoadMore,
}: GalleryGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pinchRef = useRef<{ startDist: number; startSize: number } | null>(null)
  const sizeRef = useRef(size)
  sizeRef.current = size

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore) onLoadMore() },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, onLoadMore])

  // Pinch-to-zoom — must use native listeners with passive:false so preventDefault works
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function dist(touches: TouchList) {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    function onStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        pinchRef.current = { startDist: dist(e.touches), startSize: sizeRef.current }
      }
    }

    function onMove(e: TouchEvent) {
      if (e.touches.length !== 2 || !pinchRef.current) return
      e.preventDefault() // stops browser zoom + scroll
      const scale = dist(e.touches) / pinchRef.current.startDist
      const next = Math.round(pinchRef.current.startSize * scale)
      onSizeChange(Math.min(100, Math.max(10, next)))
    }

    function onEnd() { pinchRef.current = null }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false }) // passive:false = can preventDefault
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [onSizeChange])

  const photos: GalleryPhoto[] = items.map((item) => ({
    src: item.thumbnailUrl,
    width: item.width || 1,
    height: item.height || 1,
    key: item.id,
    alt: item.name,
    mediaItem: item,
    favStatus: isFav(item.id),
  }))

  // Columns from slider/pinch; cap only by minimum image width (70px) so mobile pinch works freely
  const columns = Math.max(2, Math.round(10 - size / 12.5))
  const responsiveColumns = (containerWidth: number) => {
    const maxByWidth = Math.max(2, Math.floor(containerWidth / 70))
    return Math.min(columns, maxByWidth)
  }
  const targetRowHeight = (containerWidth: number) =>
    Math.round(containerWidth / (responsiveColumns(containerWidth) * 1.5))

  function renderPhoto(
    props: RenderPhotoProps,
    context: RenderPhotoContext<GalleryPhoto>
  ) {
    const { photo, index, width, height } = context
    const item = photo.mediaItem
    return (
      <div
        className="relative group overflow-hidden"
        style={{ width, height, cursor: 'pointer' }}
        onClick={props.onClick}
      >
        <img
          src={photo.src}
          alt={photo.alt ?? ''}
          loading="lazy"
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {item.type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="rounded-full w-10 h-10 flex items-center justify-center text-white text-lg"
              style={{ background: 'rgba(0,0,0,0.55)' }}
            >
              ▶
            </div>
          </div>
        )}
        {/* star */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFav(item.id) }}
          className="absolute top-1 end-1 text-xl leading-none z-10 transition-opacity"
          style={{
            opacity: photo.favStatus ? 1 : 0.45,
            textShadow: '0 1px 4px rgba(0,0,0,0.9)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = photo.favStatus ? '1' : '0.45')}
          aria-label={photo.favStatus ? 'הסר ממועדפים' : 'הוסף למועדפים'}
        >
          {photo.favStatus ? '⭐' : '☆'}
        </button>
      </div>
    )
  }

  const sharedProps = {
    photos,
    spacing: 2,
    render: { photo: renderPhoto },
    onClick: ({ index }: { index: number }) => onOpen(index),
  }

  return (
    <div
      ref={containerRef}
      className="p-2 flex-1"
      style={{ touchAction: 'pan-y' }}
    >
      {(layout === 'rows' || layout === 'columns') && (
        <RowsPhotoAlbum
          {...sharedProps}
          targetRowHeight={targetRowHeight}
          rowConstraints={(containerWidth) => {
            const cols = responsiveColumns(containerWidth)
            return { minPhotos: cols, maxPhotos: cols }
          }}
        />
      )}
      {layout === 'masonry' && (
        <MasonryPhotoAlbum {...sharedProps} columns={responsiveColumns} />
      )}

      {/* Infinite scroll sentinel + skeleton */}
      <div ref={sentinelRef} className="mt-1">
        {hasMore && (
          <div
            className="grid gap-0.5"
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${Math.round(80 + size)}px, 1fr))` }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded"
                style={{ aspectRatio: '1', background: 'var(--border)' }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
