import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getAlbum } from '@/lib/kv'
import { getAlbumMedia } from '@/lib/drive'
import AlbumView from '@/components/album/AlbumView'
import AlbumLoading from './loading'

type Props = { params: Promise<{ slug: string }> }

export default async function AlbumPage({ params }: Props) {
  const { slug } = await params
  const album = await getAlbum(slug)
  if (!album) notFound()

  const media = await getAlbumMedia(album.driveFolder)

  return (
    <Suspense fallback={<AlbumLoading />}>
      <AlbumView album={album} media={media} />
    </Suspense>
  )
}
