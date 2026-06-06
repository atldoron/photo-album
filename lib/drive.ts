import { google } from 'googleapis'
import type { MediaItem } from '@/types'

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
])
const VIDEO_MIME_TYPES = new Set([
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/avi',
])

export function extractFolderId(folderUrl: string): string {
  const match = folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  if (match) return match[1]
  if (/^[a-zA-Z0-9_-]+$/.test(folderUrl)) return folderUrl
  throw new Error(`Invalid Google Drive folder URL: ${folderUrl}`)
}

function getAuth() {
  const sa = process.env.GOOGLE_SERVICE_ACCOUNT?.replace(/^﻿/, '')
  if (!sa) throw new Error('GOOGLE_SERVICE_ACCOUNT env var is not set')
  const creds = JSON.parse(sa)
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
}

function getMockMedia(): MediaItem[] {
  // Deterministic mock set — portrait + landscape mix for layout testing
  const items: MediaItem[] = []
  const sizes: [number, number][] = [
    [800, 1200], [1200, 800], [900, 1200], [1200, 900],
    [1200, 800], [800, 1200], [1000, 1000], [1200, 800],
    [800, 1200], [1200, 800], [900, 1100], [1100, 800],
    [800, 1200], [1200, 900], [1200, 800], [800, 1000],
    [1200, 800], [800, 1200], [1200, 800], [800, 1200],
  ]
  for (let i = 0; i < 80; i++) {
    const [w, h] = sizes[i % sizes.length]
    const seed = i + 10
    const day = String((i % 28) + 1).padStart(2, '0')
    const month = String(Math.floor(i / 28) + 1).padStart(2, '0')
    items.push({
      id: `mock-${i}`,
      name: `IMG_${String(i + 1).padStart(4, '0')}.jpg`,
      mimeType: 'image/jpeg',
      type: 'image',
      thumbnailUrl: `https://picsum.photos/seed/${seed}/400/300`,
      viewUrl: `https://picsum.photos/seed/${seed}/${w}/${h}`,
      downloadUrl: `https://picsum.photos/seed/${seed}/${w}/${h}`,
      width: w,
      height: h,
      takenAt: `2026-${month}-${day}T10:${String(i % 60).padStart(2, '0')}:00`,
    })
  }
  return items
}

export async function getAlbumMedia(folderUrl: string): Promise<MediaItem[]> {
  const folderId = extractFolderId(folderUrl)

  // Local dev mock — used when driveFolder is "mock"
  if (folderId === 'mock') return getMockMedia()
  const auth = getAuth()
  const drive = google.drive({ version: 'v3', auth })

  const items: MediaItem[] = []
  let pageToken: string | undefined

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        'nextPageToken, files(id, name, mimeType, size, imageMediaMetadata, createdTime)',
      pageSize: 1000,
      ...(pageToken ? { pageToken } : {}),
    })

    const files = response.data.files ?? []
    pageToken = response.data.nextPageToken ?? undefined

    for (const file of files) {
      const mime = file.mimeType ?? ''
      let type: 'image' | 'video' | null = null
      if (IMAGE_MIME_TYPES.has(mime)) type = 'image'
      else if (VIDEO_MIME_TYPES.has(mime)) type = 'video'
      if (!type || !file.id || !file.name) continue

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meta = (file.imageMediaMetadata ?? {}) as any
      const width: number = meta.width ?? (type === 'video' ? 1280 : 1200)
      const height: number = meta.height ?? (type === 'video' ? 720 : 900)

      let takenAt: string | undefined
      if (meta.time) {
        // Drive format: "YYYY:MM:DD HH:MM:SS"
        takenAt = (meta.time as string).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
      } else if (file.createdTime) {
        takenAt = file.createdTime
      }

      items.push({
        id: file.id,
        name: file.name,
        mimeType: mime,
        type,
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${file.id}&sz=w400`,
        viewUrl:
          type === 'image'
            ? `https://drive.google.com/thumbnail?id=${file.id}&sz=w1600`
            : `https://drive.google.com/file/d/${file.id}/preview`,
        downloadUrl: `https://drive.google.com/uc?id=${file.id}&export=download`,
        width,
        height,
        takenAt,
        fileSize: file.size ? Number(file.size) : undefined,
        latitude: meta.location?.latitude,
        longitude: meta.location?.longitude,
      })
    }
  } while (pageToken)

  return items
}
