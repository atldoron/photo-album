'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { DatePreset, FilterState, MediaOrientation, MediaType } from '@/types'

interface FilterPanelProps {
  filter: FilterState
  totalCount: number
  filteredCount: number
  onChange: (f: FilterState) => void
  onClose: () => void
}

const inputCls = 'rounded-md px-2 py-2 text-sm outline-none w-full'
const inputStyle: CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  color: 'var(--fg)',
}

const sectionStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
}

const mobileSheetStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1,
  background: 'var(--bg)',
  color: 'var(--fg)',
  borderTop: '1px solid var(--border)',
  borderRadius: '14px 14px 0 0',
  padding: '8px 14px calc(12px + env(safe-area-inset-bottom))',
  boxShadow: '0 -12px 40px rgba(0,0,0,0.45)',
  maxHeight: 'calc(100dvh - 52px)',
  overflowY: 'auto',
}

const mobileRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '68px minmax(0, 1fr)',
  alignItems: 'center',
  gap: '10px',
  minHeight: '44px',
  padding: '7px 9px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  background: 'rgba(255,255,255,0.025)',
}

const mobileLabelStyle: CSSProperties = {
  color: 'var(--muted)',
  fontSize: '13px',
  fontWeight: 600,
  textAlign: 'right',
  whiteSpace: 'nowrap',
}

const mobileSegmentStyle: CSSProperties = {
  display: 'grid',
  gap: '6px',
  minWidth: 0,
}

const mobileControlStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '6px',
  background: 'var(--surface)',
  color: 'var(--fg)',
  minHeight: '32px',
  padding: '5px 7px',
  fontSize: '13px',
  lineHeight: 1,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const mobileInputStyle: CSSProperties = {
  ...inputStyle,
  minHeight: '32px',
  minWidth: 0,
  width: '100%',
  boxSizing: 'border-box',
  padding: '5px 8px',
  fontSize: '13px',
}

const MEDIA_TYPES: { value: MediaType; label: string }[] = [
  { value: 'all', label: 'הכל' },
  { value: 'image', label: 'תמונות בלבד' },
  { value: 'video', label: 'סרטונים בלבד' },
]

const MOBILE_MEDIA_TYPES: { value: MediaType; label: string }[] = [
  { value: 'all', label: 'הכל' },
  { value: 'image', label: 'תמונות' },
  { value: 'video', label: 'סרטונים' },
]

const ORIENTATIONS: { value: MediaOrientation; label: string }[] = [
  { value: 'all', label: 'הכל' },
  { value: 'landscape', label: 'לרוחב' },
  { value: 'portrait', label: 'לאורך' },
]

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'הכל' },
  { value: 'today', label: 'היום' },
  { value: 'week', label: 'השבוע' },
  { value: 'month', label: 'החודש' },
  { value: 'year', label: 'השנה' },
  { value: 'custom', label: 'מותאם אישית' },
]

const MOBILE_DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'הכל' },
  { value: 'today', label: 'היום' },
  { value: 'week', label: 'שבוע' },
  { value: 'month', label: 'חודש' },
  { value: 'year', label: 'שנה' },
]

const EMPTY_FILTER: FilterState = {
  mediaType: 'all',
  orientation: 'all',
  datePreset: 'all',
  dateFrom: '',
  dateTo: '',
  search: '',
  favoritesOnly: false,
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateRangeForPreset(preset: DatePreset) {
  const today = new Date()
  const dateTo = toDateInputValue(today)

  if (preset === 'all' || preset === 'custom') return { dateFrom: '', dateTo: '' }
  if (preset === 'today') return { dateFrom: dateTo, dateTo }
  if (preset === 'month') {
    return { dateFrom: toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1)), dateTo }
  }
  if (preset === 'year') {
    return { dateFrom: toDateInputValue(new Date(today.getFullYear(), 0, 1)), dateTo }
  }

  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  return { dateFrom: toDateInputValue(weekStart), dateTo }
}

function useMobileFilterPanel() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function updateMobile() {
      setIsMobile(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 640)
    }

    updateMobile()
    window.addEventListener('resize', updateMobile)
    window.addEventListener('orientationchange', updateMobile)
    return () => {
      window.removeEventListener('resize', updateMobile)
      window.removeEventListener('orientationchange', updateMobile)
    }
  }, [])

  return isMobile
}

function getButtonStyle(active: boolean): CSSProperties {
  return {
    ...mobileControlStyle,
    background: active ? 'var(--muted)' : 'var(--surface)',
    color: active ? 'var(--bg)' : 'var(--fg)',
    fontWeight: active ? 700 : 500,
  }
}

export default function FilterPanel({
  filter,
  totalCount,
  filteredCount,
  onChange,
  onClose,
}: FilterPanelProps) {
  const isMobileFilter = useMobileFilterPanel()
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filter, [key]: value })

  function setDatePreset(datePreset: DatePreset) {
    const range = dateRangeForPreset(datePreset)
    onChange({ ...filter, datePreset, ...range })
  }

  function setDateField(key: 'dateFrom' | 'dateTo', value: string) {
    const next = { ...filter, [key]: value }
    next.datePreset = next.dateFrom || next.dateTo ? 'custom' : 'all'
    onChange(next)
  }

  const hasActive =
    filter.mediaType !== 'all' ||
    filter.orientation !== 'all' ||
    filter.datePreset !== 'all' ||
    filter.dateFrom ||
    filter.dateTo ||
    filter.search ||
    filter.favoritesOnly

  if (isMobileFilter) {
    return (
      <div className="fixed inset-0" style={{ zIndex: 65 }}>
        <button
          type="button"
          aria-label="סגור סינון"
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            border: 'none',
            background: 'rgba(0,0,0,0.45)',
            cursor: 'pointer',
          }}
        />
        <section
          role="dialog"
          aria-modal="true"
          aria-label="סינון מתקדם"
          style={mobileSheetStyle}
        >
          <div style={{ width: '38px', height: '4px', borderRadius: '999px', background: 'var(--border)', margin: '0 auto 9px' }} />
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-base font-semibold">סינון מתקדם</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                מוצגים {filteredCount} מתוך {totalCount}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-md text-xl opacity-70 hover:opacity-100"
              style={{ border: '1px solid var(--border)' }}
              aria-label="סגור סינון"
            >
              ×
            </button>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={mobileRowStyle}>
              <span style={mobileLabelStyle}>מדיה</span>
              <div style={{ ...mobileSegmentStyle, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                {MOBILE_MEDIA_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => set('mediaType', type.value)}
                    style={getButtonStyle(filter.mediaType === type.value)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={mobileRowStyle}>
              <span style={mobileLabelStyle}>כיוון</span>
              <div style={{ ...mobileSegmentStyle, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                {ORIENTATIONS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => set('orientation', item.value)}
                    style={getButtonStyle(filter.orientation === item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={mobileRowStyle}>
              <span style={mobileLabelStyle}>תאריכים</span>
              <div style={{ ...mobileSegmentStyle, gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
                {MOBILE_DATE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setDatePreset(preset.value)}
                    style={{
                      ...getButtonStyle(filter.datePreset === preset.value),
                      fontSize: '12px',
                      paddingInline: '4px',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={mobileRowStyle}>
              <span style={mobileLabelStyle}>טווח</span>
              <div style={{ ...mobileSegmentStyle, gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
                <input
                  type="date"
                  className="outline-none"
                  style={mobileInputStyle}
                  value={filter.dateFrom}
                  onChange={(e) => setDateField('dateFrom', e.target.value)}
                  aria-label="מתאריך"
                />
                <input
                  type="date"
                  className="outline-none"
                  style={mobileInputStyle}
                  value={filter.dateTo}
                  onChange={(e) => setDateField('dateTo', e.target.value)}
                  aria-label="עד תאריך"
                />
              </div>
            </div>

            <div style={mobileRowStyle}>
              <span style={mobileLabelStyle}>חיפוש</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '6px', minWidth: 0 }}>
                <input
                  type="text"
                  className="outline-none"
                  style={mobileInputStyle}
                  placeholder="שם קובץ..."
                  value={filter.search}
                  onChange={(e) => set('search', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => set('favoritesOnly', !filter.favoritesOnly)}
                  style={{
                    ...getButtonStyle(filter.favoritesOnly),
                    paddingInline: '9px',
                  }}
                >
                  מועדפים
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '0.75fr 1.25fr', gap: '8px', marginTop: '2px' }}>
              <button
                type="button"
                onClick={() => onChange(EMPTY_FILTER)}
                disabled={!hasActive}
                style={{
                  ...mobileControlStyle,
                  minHeight: '38px',
                  opacity: hasActive ? 1 : 0.45,
                }}
              >
                נקה
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  ...mobileControlStyle,
                  minHeight: '38px',
                  background: 'var(--muted)',
                  color: 'var(--bg)',
                  fontWeight: 800,
                }}
              >
                הצג תוצאות
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <section
      className="px-4 py-4"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-sm font-semibold">סינון מתקדם</p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            מוצגים {filteredCount} מתוך {totalCount}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActive && (
            <button
              onClick={() => onChange(EMPTY_FILTER)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              נקה סינון
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md text-lg opacity-70 hover:opacity-100"
            style={{ border: '1px solid var(--border)' }}
            aria-label="סגור סינון"
          >
            ×
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1.35fr_1fr]">
        <div className="p-3" style={sectionStyle}>
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--muted)' }}>מדיה</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>סוג מדיה</label>
              <select
                className={inputCls}
                style={inputStyle}
                value={filter.mediaType}
                onChange={(e) => set('mediaType', e.target.value as MediaType)}
              >
                {MEDIA_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>כיוון</label>
              <select
                className={inputCls}
                style={inputStyle}
                value={filter.orientation}
                onChange={(e) => set('orientation', e.target.value as MediaOrientation)}
              >
                {ORIENTATIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="p-3" style={sectionStyle}>
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--muted)' }}>תאריכים</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>טווח מהיר</label>
              <select
                className={inputCls}
                style={inputStyle}
                value={filter.datePreset}
                onChange={(e) => setDatePreset(e.target.value as DatePreset)}
              >
                {DATE_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>{preset.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>מתאריך</label>
              <input
                type="date"
                className={inputCls}
                style={inputStyle}
                value={filter.dateFrom}
                onChange={(e) => setDateField('dateFrom', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>עד תאריך</label>
              <input
                type="date"
                className={inputCls}
                style={inputStyle}
                value={filter.dateTo}
                onChange={(e) => setDateField('dateTo', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="p-3" style={sectionStyle}>
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--muted)' }}>חיפוש</p>
          <div className="grid gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>שם קובץ</label>
              <input
                type="text"
                className={inputCls}
                style={inputStyle}
                placeholder="שם קובץ..."
                value={filter.search}
                onChange={(e) => set('search', e.target.value)}
              />
            </div>
            <label className="flex items-center justify-between gap-3 text-sm cursor-pointer rounded-md px-3 py-2"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <span>מועדפים בלבד</span>
              <input
                type="checkbox"
                checked={filter.favoritesOnly}
                onChange={(e) => set('favoritesOnly', e.target.checked)}
                className="accent-yellow-400 w-4 h-4"
              />
            </label>
          </div>
        </div>
      </div>
    </section>
  )
}
