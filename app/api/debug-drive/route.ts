import { google } from 'googleapis'
import { getAllAlbums } from '@/lib/kv'
import { extractFolderId } from '@/lib/drive'

export async function GET() {
  const albums = await getAllAlbums()
  const thailand = albums.find((a) => a.id === 'thailand')
  if (!thailand) return Response.json({ error: 'album not found' })

  const sa = process.env.GOOGLE_SERVICE_ACCOUNT?.replace(/^﻿/, '')
  const creds = JSON.parse(sa!)
  const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/drive.readonly'] })
  const drive = google.drive({ version: 'v3', auth })

  const folderId = extractFolderId(thailand.driveFolder)
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
    fields: 'files(id, name, mimeType, size, imageMediaMetadata, createdTime)',
    pageSize: 20,
  })

  const files = (response.data.files ?? []).slice(0, 20).map((f) => ({
    id: f.id,
    name: f.name,
    hasImageMeta: !!f.imageMediaMetadata,
    meta: f.imageMediaMetadata,
    size: f.size,
    createdTime: f.createdTime,
  }))

  return Response.json(files)
}
