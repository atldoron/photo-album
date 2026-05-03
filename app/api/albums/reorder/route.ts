import { NextRequest } from 'next/server'
import { getAlbum, setAlbum } from '@/lib/kv'

export async function PATCH(req: NextRequest) {
  // body: { ids: string[] } — ordered list of album IDs
  const { ids }: { ids: string[] } = await req.json()
  await Promise.all(
    ids.map(async (id, index) => {
      const album = await getAlbum(id)
      if (album) await setAlbum({ ...album, order: index })
    })
  )
  return Response.json({ ok: true })
}
