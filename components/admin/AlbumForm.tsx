'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import type { Album } from '@/types'

interface AlbumFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Album, 'createdAt' | 'order'>, originalId?: string) => Promise<void>
  initial?: Album
}

const inputCls =
  'w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500'
const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }
const labelCls = 'block text-sm mb-1 font-medium'

export default function AlbumForm({ open, onClose, onSave, initial }: AlbumFormProps) {
  const [form, setForm] = useState({
    id: initial?.id ?? '',
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    driveFolder: initial?.driveFolder ?? '',
    defaultSort: initial?.defaultSort ?? 'date-desc',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const originalId = initial?.id

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.id || !form.name || !form.driveFolder) {
      setError('יש למלא את כל שדות החובה')
      return
    }
    if (!/^[a-z0-9-]+$/.test(form.id)) {
      setError('מזהה URL יכול להכיל רק אותיות אנגליות קטנות, מספרים ומקפים')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(form, originalId)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'ערוך אלבום' : 'הוסף אלבום'} wide>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelCls}>שם האלבום *</label>
          <input className={inputCls} style={inputStyle} value={form.name}
            onChange={(e) => set('name', e.target.value)} placeholder="למשל: חתונה 2024" />
        </div>
        <div>
          <label className={labelCls}>
            מזהה URL *{' '}
            <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(באנגלית, ללא רווחים)</span>
          </label>
          <input className={inputCls} style={inputStyle} value={form.id}
            onChange={(e) => set('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            placeholder="wedding-2024" />
          {initial && form.id !== originalId && (
            <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>
              שינוי המזהה ישנה את כתובת URL של האלבום. קישורים ישנים יפסיקו לעבוד.
            </p>
          )}
        </div>
        <div>
          <label className={labelCls}>תיאור</label>
          <textarea className={inputCls} style={inputStyle} rows={2} value={form.description}
            onChange={(e) => set('description', e.target.value)} placeholder="תיאור קצר של האלבום" />
        </div>
        <div>
          <label className={labelCls}>תיקיית Google Drive *</label>
          <input className={inputCls} style={inputStyle} value={form.driveFolder}
            onChange={(e) => set('driveFolder', e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..." />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-70"
            style={{ background: 'var(--border)' }}>
            ביטול
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
