'use client'

import { useState, useRef, useEffect } from 'react'
import type { CSSProperties, ReactNode } from 'react'
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

const rowsIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="5" rx="1"/><rect x="3" y="10" width="18" height="5" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/>
  </svg>
)

const masonryIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="8" height="11" rx="1"/><rect x="13" y="3" width="8" height="7" rx="1"/>
    <rect x="3" y="16" width="8" height="5" rx="1"/><rect x="13" y="12" width="8" height="9" rx="1"/>
  </svg>
)

const continuousIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
)

const calendarIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const filterIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 3H2l8 9.46V19l4 2V12.46L22 3Z"/>
  </svg>
)

const moreIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="12" r="1"/>
    <circle cx="12" cy="12" r="1"/>
    <circle cx="19" cy="12" r="1"/>
  </svg>
)

const chevronIcon = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
)

const fullscreenIcon = '⛶'

const LAYOUTS: { value: Layout; label: string; description: string; icon: ReactNode }[] = [
  { value: 'rows', label: 'שורות', description: 'תמונות בגודל אחיד בשורות', icon: rowsIcon },
  { value: 'masonry', label: 'פסיפס', description: 'תמונות בגבהים שונים', icon: masonryIcon },
]

const GROUP_MODES: { value: GroupMode; label: string; icon: ReactNode }[] = [
  { value: 'continuous', label: 'רציף', icon: continuousIcon },
  { value: 'by-day', label: 'לפי ימים', icon: calendarIcon },
]

const btn: CSSProperties = {
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

const mobileBtn: CSSProperties = {
  ...btn,
  padding: '5px 7px',
  fontSize: '12px',
  gap: '4px',
  minHeight: '31px',
}

const sheetSection: CSSProperties = {
  padding: '12px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  background: 'rgba(255,255,255,0.02)',
}

const optionBtn: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '6px',
  padding: '8px 10px',
  fontSize: '13px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

function SortIcon({ sort }: { sort: SortOption }) {
  return sort === 'date-desc' ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="14" y2="6"/><line x1="3" y1="12" x2="10" y2="12"/><line x1="3" y1="18" x2="6" y2="18"/>
      <path d="M20 4v16m0 0-3-3m3 3 3-3"/>
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="14" y2="6"/><line x1="3" y1="12" x2="10" y2="12"/><line x1="3" y1="18" x2="6" y2="18"/>
      <path d="M20 20V4m0 0-3 3m3-3 3 3"/>
    </svg>
  )
}

export default function Toolbar({
  albumName, albumDescription, imageCount, videoCount,
  layout, cols, colsMin, colsMax, groupMode, sort, filterOpen,
  onLayoutChange, onColsChange, onGroupModeChange, onSortChange, onFilterToggle,
}: ToolbarProps) {
  const [layoutOpen, setLayoutOpen] = useState(false)
  const [colsOpen, setColsOpen] = useState(false)
  const [mobileColsOpen, setMobileColsOpen] = useState(false)
  const [groupOpen, setGroupOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [isMobileToolbar, setIsMobileToolbar] = useState(false)
  const layoutRef = useRef<HTMLDivElement>(null)
  const colsRef = useRef<HTMLDivElement>(null)
  const mobileColsRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (layoutRef.current && !layoutRef.current.contains(e.target as Node)) setLayoutOpen(false)
      if (colsRef.current && !colsRef.current.contains(e.target as Node)) setColsOpen(false)
      if (mobileColsRef.current && !mobileColsRef.current.contains(e.target as Node)) setMobileColsOpen(false)
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) setGroupOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    function updateMobileToolbar() {
      setIsMobileToolbar(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 640)
    }
    updateMobileToolbar()
    window.addEventListener('resize', updateMobileToolbar)
    window.addEventListener('orientationchange', updateMobileToolbar)
    return () => {
      window.removeEventListener('resize', updateMobileToolbar)
      window.removeEventListener('orientationchange', updateMobileToolbar)
    }
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const counter =
    [imageCount && `${imageCount} תמונות`, videoCount && `${videoCount} סרטונים`]
      .filter(Boolean)
      .join(' · ')

  const activeLayout = LAYOUTS.find((l) => l.value === layout) ?? LAYOUTS[0]
  const activeGroupMode = GROUP_MODES.find((m) => m.value === groupMode) ?? GROUP_MODES[0]

  const toggleSort = () => onSortChange(sort === 'date-desc' ? 'date-asc' : 'date-desc')
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  const renderColsDropdown = (close: () => void) => (
    <div style={{
      position: 'absolute', top: 'calc(100% + 4px)', right: 0,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '8px', overflow: 'hidden', zIndex: 50,
      display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
    }}>
      {Array.from({ length: colsMax - colsMin + 1 }, (_, i) => colsMin + i).map((n) => (
        <button
          key={n}
          onClick={() => { onColsChange(n); close() }}
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
  )

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        padding: '0 8px 0 10px',
      }}
    >
      <div className="flex items-center h-11" style={{ gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
          <span style={{ fontSize: '15px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1 }}>
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

        <div style={{ display: isMobileToolbar ? 'none' : 'block', width: '1px', height: '18px', background: 'var(--border)', flexShrink: 0 }} />

        <div style={{ display: isMobileToolbar ? 'none' : 'block', position: 'relative', flexShrink: 0 }} ref={layoutRef}>
          <button onClick={() => setLayoutOpen((v) => !v)} style={btn} title="בחר תצוגה">
            <span style={{ fontSize: '12px', opacity: 0.7 }}>תצוגה</span>
            {activeLayout.icon}
            {chevronIcon}
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
                  title={l.description}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    width: '100%', padding: '8px 12px',
                    background: layout === l.value ? 'var(--muted)' : 'transparent',
                    color: layout === l.value ? 'var(--bg)' : 'var(--fg)',
                    border: 'none', cursor: 'pointer', fontSize: '13px', direction: 'rtl',
                  }}
                >
                  {l.icon}
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: isMobileToolbar ? 'none' : 'block', position: 'relative', flexShrink: 0 }} ref={colsRef}>
          <button onClick={() => setColsOpen((v) => !v)} style={btn} title="תמונות בשורה">
            <span style={{ fontSize: '12px', opacity: 0.7 }}>בשורה</span>
            <span style={{ fontWeight: 600, minWidth: '14px', textAlign: 'center' }}>{cols}</span>
            {chevronIcon}
          </button>
          {colsOpen && renderColsDropdown(() => setColsOpen(false))}
        </div>

        <div style={{ display: isMobileToolbar ? 'none' : 'block', width: '1px', height: '18px', background: 'var(--border)', flexShrink: 0 }} />

        <div style={{ display: isMobileToolbar ? 'none' : 'block', position: 'relative', flexShrink: 0 }} ref={groupRef}>
          <button onClick={() => setGroupOpen((v) => !v)} style={btn} title="קיבוץ תצוגה">
            <span style={{ fontSize: '12px', opacity: 0.7 }}>קיבוץ</span>
            {activeGroupMode.icon}
            {chevronIcon}
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

        <div style={{ display: isMobileToolbar ? 'none' : 'block', width: '1px', height: '18px', background: 'var(--border)', flexShrink: 0 }} />

        <button
          onClick={toggleSort}
          title={sort === 'date-desc' ? 'מהחדש לישן - לחץ לסדר עולה' : 'מהישן לחדש - לחץ לסדר יורד'}
          style={{ ...btn, display: isMobileToolbar ? 'none' : 'flex' }}
        >
          <span>מיון</span>
          <SortIcon sort={sort} />
        </button>

        <button
          onClick={onFilterToggle}
          style={{
            ...btn,
            display: isMobileToolbar ? 'none' : 'flex',
            background: filterOpen ? 'var(--muted)' : 'var(--surface)',
            color: filterOpen ? 'var(--bg)' : 'var(--fg)',
          }}
        >
          <span>סינון</span>
          {filterIcon}
        </button>

        <div style={{ display: isMobileToolbar ? 'none' : 'block', width: '1px', height: '18px', background: 'var(--border)', flexShrink: 0 }} />

        <div style={{ display: isMobileToolbar ? 'block' : 'none', position: 'relative', flexShrink: 0 }} ref={mobileColsRef}>
          <button onClick={() => setMobileColsOpen((v) => !v)} style={mobileBtn} title="תמונות בשורה">
            <span>בשורה</span>
            <span style={{ fontWeight: 700, minWidth: '12px', textAlign: 'center' }}>{cols}</span>
            {chevronIcon}
          </button>
          {mobileColsOpen && renderColsDropdown(() => setMobileColsOpen(false))}
        </div>

        <button
          onClick={toggleSort}
          title={sort === 'date-desc' ? 'מהחדש לישן' : 'מהישן לחדש'}
          style={{ ...mobileBtn, display: isMobileToolbar ? 'flex' : 'none' }}
        >
          <span>מיון</span>
          <SortIcon sort={sort} />
        </button>

        <button
          onClick={() => setMoreOpen(true)}
          style={{ ...mobileBtn, display: isMobileToolbar ? 'flex' : 'none' }}
          title="עוד"
        >
          <span>עוד</span>
          {moreIcon}
        </button>

        <button
          onClick={toggleFullscreen}
          style={{ ...mobileBtn, display: isMobileToolbar ? 'flex' : 'none', width: '32px', justifyContent: 'center', padding: '5px 0' }}
          title="מסך מלא"
          aria-label="מסך מלא"
        >
          {fullscreenIcon}
        </button>

        <button
          onClick={toggleFullscreen}
          style={{ ...btn, display: isMobileToolbar ? 'none' : 'flex' }}
          title="מסך מלא"
        >
          {fullscreenIcon}
        </button>
      </div>

      {isMobileToolbar && moreOpen && (
        <div className="fixed inset-0" style={{ zIndex: 70 }}>
          <button
            aria-label="סגור"
            onClick={() => setMoreOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              border: 'none',
              background: 'rgba(0,0,0,0.45)',
              cursor: 'pointer',
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="עוד"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              background: 'var(--bg)',
              color: 'var(--fg)',
              borderTop: '1px solid var(--border)',
              borderRadius: '14px 14px 0 0',
              padding: '8px 14px calc(14px + env(safe-area-inset-bottom))',
              boxShadow: '0 -12px 40px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ width: '38px', height: '4px', borderRadius: '999px', background: 'var(--border)', margin: '0 auto 10px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <strong style={{ fontSize: '15px' }}>עוד</strong>
              <button
                onClick={() => setMoreOpen(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--muted)',
                  fontSize: '20px',
                  lineHeight: 1,
                  cursor: 'pointer',
                }}
                aria-label="סגור"
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              <section style={sheetSection}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activeLayout.icon}
                    <span style={{ fontSize: '13px', color: 'var(--muted)' }}>תצוגה</span>
                  </div>
                  <strong style={{ fontSize: '14px' }}>{activeLayout.label}</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {LAYOUTS.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => onLayoutChange(l.value)}
                      style={{
                        ...optionBtn,
                        background: layout === l.value ? 'var(--muted)' : 'var(--surface)',
                        color: layout === l.value ? 'var(--bg)' : 'var(--fg)',
                        fontWeight: layout === l.value ? 700 : 400,
                      }}
                    >
                      {l.icon}
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section style={sheetSection}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activeGroupMode.icon}
                    <span style={{ fontSize: '13px', color: 'var(--muted)' }}>קיבוץ</span>
                  </div>
                  <strong style={{ fontSize: '14px' }}>{activeGroupMode.label}</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {GROUP_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => onGroupModeChange(mode.value)}
                      style={{
                        ...optionBtn,
                        background: groupMode === mode.value ? 'var(--muted)' : 'var(--surface)',
                        color: groupMode === mode.value ? 'var(--bg)' : 'var(--fg)',
                        fontWeight: groupMode === mode.value ? 700 : 400,
                      }}
                    >
                      {mode.icon}
                      <span>{mode.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <button
                onClick={() => { onFilterToggle(); setMoreOpen(false) }}
                style={{
                  ...sheetSection,
                  color: filterOpen ? 'var(--bg)' : 'var(--fg)',
                  background: filterOpen ? 'var(--muted)' : 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'right',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {filterIcon}
                  <span style={{ fontSize: '13px' }}>סינון</span>
                </span>
                <strong style={{ fontSize: '14px' }}>{filterOpen ? 'פעיל' : 'סינון מתקדם'}</strong>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
