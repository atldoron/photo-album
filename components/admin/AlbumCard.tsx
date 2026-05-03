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

export default function AlbumCard({ album, onEdit, onDelete, onShare }: AlbumCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: album.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const date = new Date(album.createdAt).toLocaleDateString('he-IL')

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: 'var(--surface)', border: '1px solid var(--border)' }}
      className="rounded-xl p-4 flex items-center gap-4"
    >
      {/* drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-xl opacity-30 hover:opacity-70 cursor-grab active:cursor-grabbing select-none"
        aria-label="גרור לשינוי סדר"
      >
        ⠿
      </button>

      {/* info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{album.name}</p>
        <p className="text-sm truncate" style={{ color: 'var(--muted)' }}>
          /{album.id}
          {album.description && <> · {album.description}</>}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{date}</p>
      </div>

      {/* actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onShare}
          title="שתף"
          className="p-1.5 rounded-lg text-sm hover:opacity-70 transition-opacity"
        >
          🔗
        </button>
        <button
          onClick={onEdit}
          title="ערוך"
          className="p-1.5 rounded-lg text-sm hover:opacity-70 transition-opacity"
        >
          ✏️
        </button>
        <button
          onClick={onDelete}
          title="מחק"
          className="p-1.5 rounded-lg text-sm hover:opacity-70 transition-opacity text-red-400"
        >
          🗑
        </button>
      </div>
    </div>
  )
}
