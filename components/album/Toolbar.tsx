'use client'

import type { Layout, SortOption } from '@/types'
import { useDarkMode } from '@/hooks/useDarkMode'

interface ToolbarProps {
  albumName: string
  albumDescription: string
  imageCount: number
  videoCount: number
  layout: Layout
  size: number
  sort: SortOption
  filterOpen: boolean
  onLayoutChange: (l: Layout) => void
  onSizeChange: (s: number) => void
  onSortChange: (s: SortOption) => void
  onFilterToggle: () => void
}

const LAYOUTS: { value: Layout; icon: string; label: string }[] = [
  { value: 'rows', icon: '▤', label: 'שורות' },
  { value: 'masonry', icon: '▦', label: 'Masonry' },
]


export default function Toolbar({
  albumName, albumDescription, imageCount, videoCount,
  layout, size, sort, filterOpen,
  onLayoutChange, onSizeChange, onSortChange, onFilterToggle,
}: ToolbarProps) {
  const { dark, toggle } = useDarkMode()

  const counter =
    [imageCount && `${imageCount} תמונות`, videoCount && `${videoCount} סרטונים`]
      .filter(Boolean)
      .join(' · ')

  return (
    <header
      className="sticky top-0 z-30 px-4 py-2"
      style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
    >
      {/* single combined row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* title info */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 text-sm">
          <span className="font-semibold truncate">{albumName}</span>
          {albumDescription && (
            <>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span className="truncate" style={{ color: 'var(--muted)' }}>{albumDescription}</span>
            </>
          )}
          {counter && (
            <>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span className="whitespace-nowrap" style={{ color: 'var(--muted)' }}>{counter}</span>
            </>
          )}
        </div>

        {/* layout */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {LAYOUTS.map((l) => (
            <button
              key={l.value}
              onClick={() => onLayoutChange(l.value)}
              title={l.label}
              className="px-2.5 py-1.5 text-sm transition-colors"
              style={{
                background: layout === l.value ? 'var(--muted)' : 'var(--surface)',
                color: layout === l.value ? 'var(--bg)' : 'var(--fg)',
              }}
            >
              {l.icon}
            </button>
          ))}
        </div>

        {/* size slider */}
        <div className="flex items-center gap-2 flex-1 min-w-[120px] max-w-[200px]">
          <span className="text-xs opacity-50">🔍</span>
          <input
            type="range" min={10} max={100} value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="flex-1 accent-blue-500"
          />
        </div>

        {/* sort toggle */}
        <button
          onClick={() => onSortChange(sort === 'date-desc' ? 'date-asc' : 'date-desc')}
          title={sort === 'date-desc' ? 'מהחדש לישן — לחץ לסדר עולה' : 'מהישן לחדש — לחץ לסדר יורד'}
          className="text-sm px-2.5 py-1.5 rounded-lg transition-colors"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}
        >
          {sort === 'date-desc' ? '📅 ▼' : '📅 ▲'}
        </button>

        {/* filter */}
        <button
          onClick={onFilterToggle}
          className="text-sm px-3 py-1.5 rounded-lg transition-colors"
          style={{
            background: filterOpen ? 'var(--muted)' : 'var(--surface)',
            border: '1px solid var(--border)',
            color: filterOpen ? 'var(--bg)' : 'var(--fg)',
          }}
        >
          🔎 סינון
        </button>

        {/* fullscreen */}
        <button
          onClick={() => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen()
            else document.exitFullscreen()
          }}
          className="text-sm px-2.5 py-1.5 rounded-lg transition-colors"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          title="מסך מלא"
        >
          ⛶
        </button>

        {/* dark mode */}
        <button
          onClick={toggle}
          className="text-sm px-2.5 py-1.5 rounded-lg hover:opacity-70 transition-opacity"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          title={dark ? 'מצב בהיר' : 'מצב כהה'}
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
