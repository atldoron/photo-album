'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import AlbumCard from './AlbumCard'
import AlbumForm from './AlbumForm'
import ShareModal from './ShareModal'
import type { Album } from '@/types'

interface AdminPanelProps {
  initialAlbums: Album[]
}

export default function AdminPanel({ initialAlbums }: AdminPanelProps) {
  const [albums, setAlbums] = useState<Album[]>(initialAlbums)
  const [showForm, setShowForm] = useState(false)
  const [editAlbum, setEditAlbum] = useState<Album | null>(null)
  const [shareAlbum, setShareAlbum] = useState<Album | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const handleCreate = useCallback(async (data: Omit<Album, 'createdAt' | 'order'>) => {
    const res = await fetch('/api/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(await res.text())
    const created: Album = await res.json()
    setAlbums((prev) => [...prev, created])
  }, [])

  const handleUpdate = useCallback(async (data: Omit<Album, 'createdAt' | 'order'>) => {
    const res = await fetch(`/api/albums/${data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(await res.text())
    const updated: Album = await res.json()
    setAlbums((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    setEditAlbum(null)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/albums/${id}`, { method: 'DELETE' })
    setAlbums((prev) => prev.filter((a) => a.id !== id))
    setDeleteId(null)
  }, [])

  // ── Drag & drop reorder ───────────────────────────────────────────────────

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setAlbums((prev) => {
      const oldIdx = prev.findIndex((a) => a.id === active.id)
      const newIdx = prev.findIndex((a) => a.id === over.id)
      const reordered = arrayMove(prev, oldIdx, newIdx)
      fetch('/api/albums/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: reordered.map((a) => a.id) }),
      })
      return reordered
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">ניהול אלבומים</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            {albums.length === 0 ? 'אין אלבומים' : `${albums.length} אלבומים`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          + הוסף אלבום
        </button>
      </header>

      {albums.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ border: '2px dashed var(--border)', color: 'var(--muted)' }}
        >
          <p className="text-4xl mb-3">📷</p>
          <p className="text-sm">לחץ על &quot;הוסף אלבום&quot; כדי להתחיל</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={albums.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {albums.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  onEdit={() => setEditAlbum(album)}
                  onDelete={() => setDeleteId(album.id)}
                  onShare={() => setShareAlbum(album)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create form */}
      <AlbumForm open={showForm} onClose={() => setShowForm(false)} onSave={handleCreate} />

      {/* Edit form */}
      {editAlbum && (
        <AlbumForm
          open
          onClose={() => setEditAlbum(null)}
          onSave={handleUpdate}
          initial={editAlbum}
        />
      )}

      {/* Share modal */}
      {shareAlbum && (
        <ShareModal
          open
          onClose={() => setShareAlbum(null)}
          albumId={shareAlbum.id}
          albumName={shareAlbum.name}
        />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-xl p-6 max-w-sm w-full shadow-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="font-semibold mb-2">מחיקת אלבום</p>
            <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
              האם למחוק את האלבום? הפעולה לא הפיכה.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ background: 'var(--border)' }}>
                ביטול
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors">
                מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
