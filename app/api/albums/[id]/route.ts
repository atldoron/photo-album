import { NextRequest } from 'next/server'
import { getAlbum, setAlbum, deleteAlbum } from '@/lib/kv'

type Ctx = { params: Promise<{ id: string }> }

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
  const updated = { ...existing, ...body, id }
  await setAlbum(updated)
  return Response.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  await deleteAlbum(id)
  return new Response(null, { status: 204 })
}
