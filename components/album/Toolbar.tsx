'use client'

import { useState, useRef, useEffect } from 'react'
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

const LAYOUTS: { value: Layout; label: string; icon: React.ReactNode }[] = [
  {
    value: 'rows',
    label: 'שורות — תמונות בגודל אחיד בשורות',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="5" rx="1"/><rect x="3" y="10" width="18" height="5" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/>
      </svg>
    ),
  },
  {
    value: 'masonry',
    label: 'פסיפס — תמונות בגבהים שונים',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="8" height="11" rx="1"/><rect x="13" y="3" width="8" height="7" rx="1"/>
        <rect x="3" y="16" width="8" height="5" rx="1"/><rect x="13" y="12" width="8" height="9" rx="1"/>
      </svg>
    ),
  },
]

const btn: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  color: 'var(--fg)',
  borderRadius: '6px',
  padding: '5px 10px',
  fontSize: '13px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const divider = (
  <div style={{ width: '1px', height: '18px', background: 'var(--border)', flexShrink: 0 }} />
)

export default function Toolbar({
  albumName, albumDescription, imageCount, videoCount,
  layout, size, sort, filterOpen,
  onLayoutChange, onSizeChange, onSortChange, onFilterToggle,
}: ToolbarProps) {
  const { dark, toggle } = useDarkMode()
  const [layoutOpen, setLayoutOpen] = useState(false)
  const layoutRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (layoutRef.current && !layoutRef.current.contains(e.target as Node)) {
        setLayoutOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const counter =
    [imageCount && `${imageCount} תמונות`, videoCount && `${videoCount} סרטונים`]
      .filter(Boolean)
      .join(' · ')

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        padding: '0 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '44px' }}>

        {/* title + meta */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
          <span style={{ fontSize: '15px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>
            {albumName}
          </span>
          {albumDescription && (
            <span className="hidden sm:block" style={{ fontSize: '12px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {albumDescription}
            </span>
          )}
          {counter && (
            <span style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              {counter}
            </span>
          )}
        </div>

        {divider}

        {/* layout dropdown */}
        <div style={{ position: 'relative', flexShrink: 0 }} ref={layoutRef}>
          <button
            onClick={() => setLayoutOpen((v) => !v)}
            style={btn}
            title="בחר תצוגה"
          >
            <span style={{ fontSize: '12px', opacity: 0.7 }}>תצוגה</span>
            {LAYOUTS.find((l) => l.value === layout)?.icon}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          {layoutOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                overflow: 'hidden',
                zIndex: 50,
                minWidth: '130px',
              }}
            >
              {LAYOUTS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => { onLayoutChange(l.value); setLayoutOpen(false) }}
                  title={l.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    background: layout === l.value ? 'var(--muted)' : 'transparent',
                    color: layout === l.value ? 'var(--bg)' : 'var(--fg)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    direction: 'rtl',
                  }}
                >
                  {l.icon}
                  <span>{l.label.split(' — ')[0]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {divider}

        {/* size slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, width: '130px' }}>
          <span style={{ fontSize: '12px', opacity: 0.6, whiteSpace: 'nowrap' }}>גודל</span>
          <input
            type="range" min={10} max={100} value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--fg)' }}
          />
        </div>

        {divider}

        {/* sort */}
        <button
          onClick={() => onSortChange(sort === 'date-desc' ? 'date-asc' : 'date-desc')}
          title={sort === 'date-desc' ? 'מהחדש לישן — לחץ לסדר עולה' : 'מהישן לחדש — לחץ לסדר יורד'}
          style={btn}
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
          style={{
            ...btn,
            background: filterOpen ? 'var(--muted)' : 'var(--surface)',
            color: filterOpen ? 'var(--bg)' : 'var(--fg)',
          }}
        >
          סינון
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 3H2l8 9.46V19l4 2V12.46L22 3Z"/>
          </svg>
        </button>

        {divider}

        {/* fullscreen */}
        <button
          onClick={() => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen()
            else document.exitFullscreen()
          }}
          style={btn}
          title="מסך מלא"
        >
          ⛶
        </button>

        {/* dark mode */}
        <button
          onClick={toggle}
          style={btn}
          title={dark ? 'מצב בהיר' : 'מצב כהה'}
        >
          {dark ? '☀️' : '🌙'}
        </button>

      </div>
    </header>
  )
}
