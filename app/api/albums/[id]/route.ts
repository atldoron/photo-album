import { NextRequest } from 'next/server'
import { getAlbum, setAlbum, deleteAlbum } from '@/lib/kv'
import type { Album } from '@/types'

type Ctx = { params: Promise<{ id: string }> }

function stripDeprecatedAlbumFields<T extends Record<string, unknown>>(payload: T) {
  const clean = { ...payload }
  delete clean.defaultLayout
  delete clean.defaultSize
  return clean
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const album = await getAlbum(id)
  if (!album) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(album)
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const existing = await getAlbum(id)
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const safeBody = stripDeprecatedAlbumFields(body as Record<string, unknown>)
  const safeExisting = stripDeprecatedAlbumFields(existing as unknown as Record<string, unknown>)
  const newId: string = body.id && /^[a-z0-9-]+$/.test(body.id) ? body.id : id

  if (newId !== id) {
    const conflict = await getAlbum(newId)
    if (conflict) return Response.json({ error: 'מזהה URL זה כבר בשימוש' }, { status: 409 })
    await deleteAlbum(id)
    const renamed = { ...safeExisting, ...safeBody, id: newId } as Album
    await setAlbum(renamed)
    return Response.json(renamed)
  }

  const updated = { ...safeExisting, ...safeBody, id } as Album
  await setAlbum(updated)
  return Response.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  await deleteAlbum(id)
  return new Response(null, { status: 204 })
}
