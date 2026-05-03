import { getAllAlbums } from '@/lib/kv'
import AdminPanel from '@/components/admin/AdminPanel'

export default async function AdminPage() {
  const albums = await getAllAlbums()
  albums.sort((a, b) =>
    a.order !== b.order
      ? a.order - b.order
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  return <AdminPanel initialAlbums={albums} />
}
