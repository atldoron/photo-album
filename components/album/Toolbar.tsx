'use client'

import { useState, useRef, useEffect } from 'react'
import type { GroupMode, Layout, SortOption } from '@/types'

interface ToolbarProps {
  albumName: string
  albumDescription: string
  imageCount: number
  videoCount: number
  layout: Layout
  cols: number
  colsMin: number
  colsMax: number
  groupMode: GroupMode
  sort: SortOption
  filterOpen: boolean
  onLayoutChange: (l: Layout) => void
  onColsChange: (n: number) => void
  onGroupModeChange: (m: GroupMode) => void
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

const GROUP_MODES: { value: GroupMode; label: string; icon: React.ReactNode }[] = [
  {
    value: 'continuous',
    label: 'רציף',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="20" y2="18" />
      </svg>
    ),
  },
  {
    value: 'by-day',
    label: 'לפי ימים',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
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

export default function Toolbar({
  albumName, albumDescription, imageCount, videoCount,
  layout, cols, colsMin, colsMax, groupMode, sort, filterOpen,
  onLayoutChange, onColsChange, onGroupModeChange, onSortChange, onFilterToggle,
}: ToolbarProps) {
  const [layoutOpen, setLayoutOpen] = useState(false)
  const [colsOpen, setColsOpen] = useState(false)
  const [groupOpen, setGroupOpen] = useState(false)
  const layoutRef = useRef<HTMLDivElement>(null)
  const colsRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<HTMLDivElement>(null)

  // Close both dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (layoutRef.current && !layoutRef.current.contains(e.target as Node)) setLayoutOpen(false)
      if (colsRef.current && !colsRef.current.contains(e.target as Node)) setColsOpen(false)
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) setGroupOpen(false)
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
      <div className="flex items-center h-11" style={{ gap: '8px' }}>

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
            <span className="hidden sm:block" style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              {counter}
            </span>
          )}
        </div>

        {/* divider — desktop only */}
        <div className="hidden sm:block" style={{ width: '1px', height: '18px', background: 'var(--border)', flexShrink: 0 }} />

        {/* layout dropdown */}
        <div style={{ position: 'relative', flexShrink: 0 }} ref={layoutRef}>
          <button onClick={() => setLayoutOpen((v) => !v)} style={btn} title="בחר תצוגה">
            <span className="hidden sm:inline" style={{ fontSize: '12px', opacity: 0.7 }}>תצוגה</span>
            {LAYOUTS.find((l) => l.value === layout)?.icon}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          {layoutOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', right: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '8px', overflow: 'hidden', zIndex: 50, minWidth: '130px',
            }}>
              {LAYOUTS.map((l) => (
                <button key={l.value}
                  onClick={() => { onLayoutChange(l.value); setLayoutOpen(false) }}
                  title={l.label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    width: '100%', padding: '8px 12px',
                    background: layout === l.value ? 'var(--muted)' : 'transparent',
                    color: layout === l.value ? 'var(--bg)' : 'var(--fg)',
                    border: 'none', cursor: 'pointer', fontSize: '13px', direction: 'rtl',
                  }}
                >
                  {l.icon}
                  <span>{l.label.split(' — ')[0]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* cols dropdown */}
        <div style={{ position: 'relative', flexShrink: 0 }} ref={colsRef}>
          <button onClick={() => setColsOpen((v) => !v)} style={btn} title="תמונות בשורה">
            <span className="hidden sm:inline" style={{ fontSize: '12px', opacity: 0.7 }}>בשורה</span>
            <span style={{ fontWeight: 600, minWidth: '14px', textAlign: 'center' }}>{cols}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          {colsOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', right: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '8px', overflow: 'hidden', zIndex: 50,
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            }}>
              {Array.from({ length: colsMax - colsMin + 1 }, (_, i) => colsMin + i).map((n) => (
                <button
                  key={n}
                  onClick={() => { onColsChange(n); setColsOpen(false) }}
                  style={{
                    padding: '8px 14px',
                    background: cols === n ? 'var(--muted)' : 'transparent',
                    color: cols === n ? 'var(--bg)' : 'var(--fg)',
                    border: 'none', cursor: 'pointer',
                    fontSize: '14px', fontWeight: cols === n ? 700 : 400,
                    textAlign: 'center',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* divider — desktop only */}
        <div className="hidden sm:block" style={{ width: '1px', height: '18px', background: 'var(--border)', flexShrink: 0 }} />

        {/* group dropdown */}
        <div style={{ position: 'relative', flexShrink: 0 }} ref={groupRef}>
          <button onClick={() => setGroupOpen((v) => !v)} style={btn} title="קיבוץ תצוגה">
            <span className="hidden sm:inline" style={{ fontSize: '12px', opacity: 0.7 }}>קיבוץ</span>
            {GROUP_MODES.find((m) => m.value === groupMode)?.icon}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          {groupOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', right: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '8px', overflow: 'hidden', zIndex: 50, minWidth: '130px',
            }}>
              {GROUP_MODES.map((mode) => (
                <button key={mode.value}
                  onClick={() => { onGroupModeChange(mode.value); setGroupOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    width: '100%', padding: '8px 12px',
                    background: groupMode === mode.value ? 'var(--muted)' : 'transparent',
                    color: groupMode === mode.value ? 'var(--bg)' : 'var(--fg)',
                    border: 'none', cursor: 'pointer', fontSize: '13px', direction: 'rtl',
                  }}
                >
                  {mode.icon}
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* divider — desktop only */}
        <div className="hidden sm:block" style={{ width: '1px', height: '18px', background: 'var(--border)', flexShrink: 0 }} />

        {/* sort */}
        <button
          onClick={() => onSortChange(sort === 'date-desc' ? 'date-asc' : 'date-desc')}
          title={sort === 'date-desc' ? 'מהחדש לישן — לחץ לסדר עולה' : 'מהישן לחדש — לחץ לסדר יורד'}
          style={btn}
        >
          <span className="hidden sm:inline">מיון</span>
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
          <span className="hidden sm:inline">סינון</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 3H2l8 9.46V19l4 2V12.46L22 3Z"/>
          </svg>
        </button>

        {/* divider — desktop only */}
        <div className="hidden sm:block" style={{ width: '1px', height: '18px', background: 'var(--border)', flexShrink: 0 }} />

        {/* fullscreen — desktop only */}
        <button
          className="hidden sm:flex"
          onClick={() => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen()
            else document.exitFullscreen()
          }}
          style={btn}
          title="מסך מלא"
        >
          ⛶
        </button>

      </div>
    </header>
  )
}
