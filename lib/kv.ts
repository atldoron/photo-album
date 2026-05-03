import type { Album } from '@/types'

const isKvConfigured = () =>
  !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

// ── Local JSON fallback for development ──────────────────────────────────────

import fs from 'fs/promises'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), '.data', 'albums.json')

async function readLocal(): Promise<Record<string, Album>> {
  try {
    const text = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(text)
  } catch {
    return {}
  }
}

async function writeLocal(data: Record<string, Album>): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getAllAlbums(): Promise<Album[]> {
  if (isKvConfigured()) {
    const { kv } = await import('@vercel/kv')
    const data = await kv.hgetall<Record<string, Album>>('albums')
    if (!data) return []
    return Object.values(data)
  }
  const data = await readLocal()
  return Object.values(data)
}

export async function getAlbum(id: string): Promise<Album | null> {
  if (isKvConfigured()) {
    const { kv } = await import('@vercel/kv')
    return kv.hget<Album>('albums', id)
  }
  const data = await readLocal()
  return data[id] ?? null
}

export async function setAlbum(album: Album): Promise<void> {
  if (isKvConfigured()) {
    const { kv } = await import('@vercel/kv')
    await kv.hset('albums', { [album.id]: album })
    return
  }
  const data = await readLocal()
  data[album.id] = album
  await writeLocal(data)
}

export async function deleteAlbum(id: string): Promise<void> {
  if (isKvConfigured()) {
    const { kv } = await import('@vercel/kv')
    await kv.hdel('albums', id)
    return
  }
  const data = await readLocal()
  delete data[id]
  await writeLocal(data)
}
