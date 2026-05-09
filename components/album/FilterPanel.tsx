'use client'

import type { DatePreset, FilterState, MediaOrientation, MediaType } from '@/types'

interface FilterPanelProps {
  filter: FilterState
  totalCount: number
  filteredCount: number
  onChange: (f: FilterState) => void
  onClose: () => void
}

const inputCls = 'rounded-md px-2 py-2 text-sm outline-none w-full'
const inputStyle = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  color: 'var(--fg)',
}

const sectionStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
}

const MEDIA_TYPES: { value: MediaType; label: string }[] = [
  { value: 'all', label: 'הכל' },
  { value: 'image', label: 'תמונות בלבד' },
  { value: 'video', label: 'סרטונים בלבד' },
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

export default function FilterPanel({
  filter,
  totalCount,
  filteredCount,
  onChange,
  onClose,
}: FilterPanelProps) {
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
