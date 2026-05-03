import type { Album } from '@/types'
import fs from 'fs/promises'
import path from 'path'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = process.env.GITHUB_REPO ?? 'atldoron/photo-album'
const GITHUB_FILE = '_data/albums.json'

const LOCAL_FILE = path.join(process.cwd(), '.data', 'albums.json')

// ── GitHub API storage (production) ─────────────────────────────────────────

interface GitHubContents {
  content: string
  sha: string
}

async function githubFetch(): Promise<{ albums: Album[]; sha: string | null }> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`
  const res = await fetch(url, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' },
    cache: 'no-store',
  })
  if (res.status === 404) return { albums: [], sha: null }
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
  const file = (await res.json()) as GitHubContents
  const text = Buffer.from(file.content, 'base64').toString('utf-8')
  return { albums: JSON.parse(text) as Album[], sha: file.sha }
}

async function githubSave(albums: Album[], sha: string | null): Promise<void> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`
  const content = Buffer.from(JSON.stringify(albums, null, 2)).toString('base64')
  const body: Record<string, unknown> = { message: 'chore: update albums', content }
  if (sha) body.sha = sha
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`GitHub save failed: ${res.status} ${await res.text()}`)
}

// ── Local JSON fallback (development) ────────────────────────────────────────

async function localRead(): Promise<Record<string, Album>> {
  try {
    return JSON.parse(await fs.readFile(LOCAL_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

async function localWrite(data: Record<string, Album>): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
  await fs.writeFile(LOCAL_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getAllAlbums(): Promise<Album[]> {
  if (GITHUB_TOKEN) {
    const { albums } = await githubFetch()
    return albums.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }
  const data = await localRead()
  return Object.values(data).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export async function getAlbum(id: string): Promise<Album | null> {
  if (GITHUB_TOKEN) {
    const { albums } = await githubFetch()
    return albums.find((a) => a.id === id) ?? null
  }
  const data = await localRead()
  return data[id] ?? null
}

export async function setAlbum(album: Album): Promise<void> {
  if (GITHUB_TOKEN) {
    const { albums, sha } = await githubFetch()
    const idx = albums.findIndex((a) => a.id === album.id)
    if (idx >= 0) albums[idx] = album
    else albums.push(album)
    await githubSave(albums, sha)
    return
  }
  const data = await localRead()
  data[album.id] = album
  await localWrite(data)
}

export async function deleteAlbum(id: string): Promise<void> {
  if (GITHUB_TOKEN) {
    const { albums, sha } = await githubFetch()
    await githubSave(albums.filter((a) => a.id !== id), sha)
    return
  }
  const data = await localRead()
  delete data[id]
  await localWrite(data)
}
