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

const btnBase: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  color: 'var(--fg)',
}

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
      className="sticky top-0 z-30 px-4"
      style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2 h-11">

        {/* title + meta */}
        <div className="flex items-baseline gap-2 min-w-0 flex-1 overflow-hidden">
          <span
            className="font-semibold truncate shrink-0"
            style={{ fontSize: '15px' }}
          >
            {albumName}
          </span>
          {albumDescription && (
            <span className="text-xs truncate hidden sm:block" style={{ color: 'var(--muted)' }}>
              {albumDescription}
            </span>
          )}
          {counter && (
            <span className="text-xs whitespace-nowrap" style={{ color: 'var(--muted)' }}>
              {counter}
            </span>
          )}
        </div>

        {/* divider */}
        <div className="h-5 w-px shrink-0" style={{ background: 'var(--border)' }} />

        {/* layout toggle */}
        <div className="flex rounded-md overflow-hidden shrink-0" style={{ border: '1px solid var(--border)' }}>
          {LAYOUTS.map((l) => (
            <button
              key={l.value}
              onClick={() => onLayoutChange(l.value)}
              title={l.label}
              className="px-2.5 py-1 text-sm transition-colors"
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
        <div className="flex items-center gap-1.5 shrink-0" style={{ width: '140px' }}>
          <span className="text-xs opacity-60 select-none whitespace-nowrap">גודל</span>
          <input
            type="range" min={10} max={100} value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="flex-1 accent-blue-500"
          />
        </div>

        {/* divider */}
        <div className="h-5 w-px shrink-0" style={{ background: 'var(--border)' }} />

        {/* sort */}
        <button
          onClick={() => onSortChange(sort === 'date-desc' ? 'date-asc' : 'date-desc')}
          title={sort === 'date-desc' ? 'מהחדש לישן — לחץ לסדר עולה' : 'מהישן לחדש — לחץ לסדר יורד'}
          className="text-sm px-2.5 py-1 rounded-md transition-opacity hover:opacity-70 shrink-0 flex items-center gap-1.5"
          style={btnBase}
        >
          מיון
          {sort === 'date-desc' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="14" y2="6"/><line x1="3" y1="12" x2="10" y2="12"/><line x1="3" y1="18" x2="6" y2="18"/>
              <path d="M20 4v16m0 0-3-3m3 3 3-3"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="14" y2="6"/><line x1="3" y1="12" x2="10" y2="12"/><line x1="3" y1="18" x2="6" y2="18"/>
              <path d="M20 20V4m0 0-3 3m3-3 3 3"/>
            </svg>
          )}
        </button>

        {/* filter */}
        <button
          onClick={onFilterToggle}
          className="text-sm px-2.5 py-1 rounded-md transition-colors shrink-0 flex items-center gap-1.5"
          style={{
            background: filterOpen ? 'var(--muted)' : 'var(--surface)',
            border: '1px solid var(--border)',
            color: filterOpen ? 'var(--bg)' : 'var(--fg)',
          }}
        >
          סינון
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 3H2l8 9.46V19l4 2V12.46L22 3Z"/>
          </svg>
        </button>

        {/* divider */}
        <div className="h-5 w-px shrink-0" style={{ background: 'var(--border)' }} />

        {/* fullscreen */}
        <button
          onClick={() => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen()
            else document.exitFullscreen()
          }}
          className="text-sm px-2.5 py-1 rounded-md transition-opacity hover:opacity-70 shrink-0"
          style={btnBase}
          title="מסך מלא"
        >
          ⛶
        </button>

        {/* dark mode */}
        <button
          onClick={toggle}
          className="text-sm px-2.5 py-1 rounded-md transition-opacity hover:opacity-70 shrink-0"
          style={btnBase}
          title={dark ? 'מצב בהיר' : 'מצב כהה'}
        >
          {dark ? '☀️' : '🌙'}
        </button>

      </div>
    </header>
  )
}
