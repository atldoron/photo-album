'use client'

import type { FilterState, MediaType } from '@/types'

interface FilterPanelProps {
  filter: FilterState
  onChange: (f: FilterState) => void
  onClose: () => void
}

const inputCls = 'rounded-lg px-2 py-1.5 text-sm outline-none w-full'
const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }

const MEDIA_TYPES: { value: MediaType; label: string }[] = [
  { value: 'all', label: 'הכל' },
  { value: 'image', label: 'תמונות בלבד' },
  { value: 'video', label: 'סרטונים בלבד' },
]

export default function FilterPanel({ filter, onChange, onClose }: FilterPanelProps) {
  const set = <K extends keyof FilterState>(k: K, v: FilterState[K]) =>
    onChange({ ...filter, [k]: v })

  const hasActive =
    filter.mediaType !== 'all' ||
    filter.dateFrom ||
    filter.dateTo ||
    filter.search ||
    filter.favoritesOnly

  return (
    <div
      className="px-4 py-4 flex flex-col gap-3"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">סינון</p>
        <div className="flex items-center gap-2">
          {hasActive && (
            <button
              onClick={() => onChange({ mediaType: 'all', dateFrom: '', dateTo: '', search: '', favoritesOnly: false })}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              נקה סינון
            </button>
          )}
          <button onClick={onClose} className="text-lg opacity-60 hover:opacity-100">×</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* media type */}
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>סוג מדיה</label>
          <select className={inputCls} style={inputStyle}
            value={filter.mediaType}
            onChange={(e) => set('mediaType', e.target.value as MediaType)}>
            {MEDIA_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* date from */}
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>מתאריך</label>
          <input type="date" className={inputCls} style={inputStyle}
            value={filter.dateFrom}
            onChange={(e) => set('dateFrom', e.target.value)} />
        </div>

        {/* date to */}
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>עד תאריך</label>
          <input type="date" className={inputCls} style={inputStyle}
            value={filter.dateTo}
            onChange={(e) => set('dateTo', e.target.value)} />
        </div>

        {/* search */}
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>חיפוש לפי שם</label>
          <input type="text" className={inputCls} style={inputStyle}
            placeholder="שם קובץ..."
            value={filter.search}
            onChange={(e) => set('search', e.target.value)} />
        </div>
      </div>

      {/* favorites */}
      <label className="flex items-center gap-2 text-sm cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={filter.favoritesOnly}
          onChange={(e) => set('favoritesOnly', e.target.checked)}
          className="accent-yellow-400 w-4 h-4"
        />
        ⭐ מועדפים בלבד
      </label>
    </div>
  )
}
