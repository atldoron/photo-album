'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Album } from '@/types'

interface AlbumCardProps {
  album: Album
  onEdit: () => void
  onDelete: () => void
  onShare: () => void
}

const IconDrag = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="5.5" cy="4" r="1.2" /><circle cx="10.5" cy="4" r="1.2" />
    <circle cx="5.5" cy="8" r="1.2" /><circle cx="10.5" cy="8" r="1.2" />
    <circle cx="5.5" cy="12" r="1.2" /><circle cx="10.5" cy="12" r="1.2" />
  </svg>
)

const IconOpen = () => (
  <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9.5" />
    <path d="M9.5 2H14v4.5" />
    <line x1="14" y1="2" x2="7.5" y2="8.5" />
  </svg>
)

const IconShare = () => (
  <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="3.5" r="1.5" /><circle cx="4" cy="8" r="1.5" /><circle cx="12" cy="12.5" r="1.5" />
    <line x1="5.4" y1="7.1" x2="10.6" y2="4.4" /><line x1="5.4" y1="8.9" x2="10.6" y2="11.6" />
  </svg>
)

const IconEdit = () => (
  <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11.5 2a1.5 1.5 0 0 1 2.1 2.1L5 12.6 2 13.5l.9-3L11.5 2z" />
  </svg>
)

const IconDelete = () => (
  <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,4 4,4 14,4" />
    <path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
    <path d="M6 7v4.5M10 7v4.5" />
    <path d="M4 4l.9 8.5a1 1 0 0 0 1 .9h4.2a1 1 0 0 0 1-.9L12 4" />
  </svg>
)

export default function AlbumCard({ album, onEdit, onDelete, onShare }: AlbumCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: album.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const date = new Date(album.createdAt).toLocaleDateString('he-IL')

  const btnBase: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '7px',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--fg)',
    opacity: 0.55,
    transition: 'opacity 0.15s, background 0.15s',
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: 'var(--surface)', border: '1px solid var(--border)' }}
      className="rounded-xl p-4 flex items-center gap-3"
    >
      {/* drag handle */}
      <button
        {...attributes}
        {...listeners}
        style={{ ...btnBase, cursor: 'grab' }}
        className="shrink-0 active:cursor-grabbing select-none"
        aria-label="גרור לשינוי סדר"
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.55')}
      >
        <IconDrag />
      </button>

      {/* info — clickable to open album */}
      <a
        href={`/album/${album.id}`}
        target="_blank"
        rel="noreferrer"
        className="flex-1 min-w-0 no-underline"
        style={{ color: 'inherit' }}
      >
        <p className="font-semibold truncate hover:underline">{album.name}</p>
        <p className="text-sm truncate" style={{ color: 'var(--muted)' }}>
          /{album.id}
          {album.description && <> · {album.description}</>}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{date}</p>
      </a>

      {/* actions */}
      <div className="flex items-center gap-1 shrink-0">
        <a
          href={`/album/${album.id}`}
          target="_blank"
          rel="noreferrer"
          style={btnBase}
          title="פתח אלבום"
          className="rounded-lg"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.background = 'var(--border)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.55'; (e.currentTarget as HTMLElement).style.background = 'none' }}
        >
          <IconOpen />
        </a>
        <button
          onClick={onShare}
          style={btnBase}
          title="שתף"
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--border)' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.55'; e.currentTarget.style.background = 'none' }}
        >
          <IconShare />
        </button>
        <button
          onClick={onEdit}
          style={btnBase}
          title="ערוך"
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--border)' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.55'; e.currentTarget.style.background = 'none' }}
        >
          <IconEdit />
        </button>
        <button
          onClick={onDelete}
          style={{ ...btnBase, color: 'var(--fg)' }}
          title="מחק"
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#ef4444' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.55'; e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--fg)' }}
        >
          <IconDelete />
        </button>
      </div>
    </div>
  )
}
