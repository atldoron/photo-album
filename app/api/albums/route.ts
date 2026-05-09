import { NextRequest } from 'next/server'
import { getAllAlbums, setAlbum } from '@/lib/kv'
import type { Album } from '@/types'

export async function GET() {
  const albums = await getAllAlbums()
  albums.sort((a, b) =>
    a.order !== b.order
      ? a.order - b.order
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  return Response.json(albums)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const albums = await getAllAlbums()
  const maxOrder = albums.reduce((m, a) => Math.max(m, a.order), -1)

  const album: Album = {
    id: body.id,
    name: body.name,
    description: body.description ?? '',
    driveFolder: body.driveFolder,
    defaultSort: body.defaultSort ?? 'date-desc',
    createdAt: new Date().toISOString(),
    order: maxOrder + 1,
  }
  await setAlbum(album)
  return Response.json(album, { status: 201 })
}
