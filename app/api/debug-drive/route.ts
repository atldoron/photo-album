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

  // Scan ALL files in the album to find ones with GPS
  const allFiles: { id: string; name: string }[] = []
  let pageToken: string | undefined
  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
      fields: 'nextPageToken, files(id, name)',
      pageSize: 1000,
      ...(pageToken ? { pageToken } : {}),
    })
    for (const f of response.data.files ?? []) {
      if (f.id && f.name) allFiles.push({ id: f.id, name: f.name })
    }
    pageToken = response.data.nextPageToken ?? undefined
  } while (pageToken)

  // Check each file for GPS data by downloading 200KB and scanning EXIF + XMP
  const results: { id: string; name: string; hasGps: boolean; lat?: number; lng?: number }[] = []

  for (const file of allFiles) {
    try {
      const res = await drive.files.get(
        { fileId: file.id, alt: 'media' },
        { responseType: 'arraybuffer', headers: { Range: 'bytes=0-204799' } }
      )
      const buf = Buffer.from(res.data as ArrayBuffer)

      // Quick scan for non-zero GPS IFD or XMP GPS
      const hasData = checkHasGps(buf)
      if (hasData) {
        results.push({ id: file.id, name: file.name, hasGps: true, lat: hasData.lat, lng: hasData.lng })
      }
    } catch {
      // skip
    }
  }

  return Response.json({
    total: allFiles.length,
    withGps: results.length,
    files: results,
  })
}

function checkHasGps(buf: Buffer): { lat: number; lng: number } | null {
  // Look for non-zero GPS IFD
  let exifStart = -1
  for (let i = 0; i < Math.min(buf.length - 6, 65536); i++) {
    if (buf[i] === 0xff && buf[i + 1] === 0xe1 &&
        buf[i + 4] === 0x45 && buf[i + 5] === 0x78 && buf[i + 6] === 0x69) {
      exifStart = i + 10
      break
    }
  }
  if (exifStart >= 0) {
    const tiff = exifStart
    const le = buf[tiff] === 0x49
    const readU32 = (o: number) => le ? buf.readUInt32LE(o) : buf.readUInt32BE(o)
    const readU16 = (o: number) => le ? buf.readUInt16LE(o) : buf.readUInt16BE(o)
    if (readU16(tiff + 2) === 42) {
      const ifd0 = tiff + readU32(tiff + 4)
      const cnt = readU16(ifd0)
      for (let i = 0; i < cnt; i++) {
        const e = ifd0 + 2 + i * 12
        if (e + 12 > buf.length) break
        if (readU16(e) === 0x8825) {
          const gpsOff = tiff + readU32(e + 8)
          if (gpsOff + 2 > buf.length) break
          const gcnt = readU16(gpsOff)
          let latOff = -1, lngOff = -1, latRef = 'N', lngRef = 'E'
          for (let j = 0; j < gcnt; j++) {
            const ge = gpsOff + 2 + j * 12
            if (ge + 12 > buf.length) break
            const tag = readU16(ge)
            if (tag === 0x0001) latRef = String.fromCharCode(buf[ge + 8])
            else if (tag === 0x0002) latOff = tiff + readU32(ge + 8)
            else if (tag === 0x0003) lngRef = String.fromCharCode(buf[ge + 8])
            else if (tag === 0x0004) lngOff = tiff + readU32(ge + 8)
          }
          if (latOff >= 0 && lngOff >= 0 && latOff + 24 <= buf.length && lngOff + 24 <= buf.length) {
            const latBytes = buf.slice(latOff, latOff + 24)
            if (!latBytes.every(b => b === 0)) {
              const r = (o: number) => { const n = readU32(o), d = readU32(o+4); return d ? n/d : 0 }
              const lat = r(latOff) + r(latOff+8)/60 + r(latOff+16)/3600
              const lng = r(lngOff) + r(lngOff+8)/60 + r(lngOff+16)/3600
              return { lat: latRef === 'S' ? -lat : lat, lng: lngRef === 'W' ? -lng : lng }
            }
          }
          break
        }
      }
    }
  }

  // Check XMP for GPS
  const xmpIdx = buf.indexOf(Buffer.from('exif:GPSLatitude="'))
  if (xmpIdx >= 0) {
    const slice = buf.slice(xmpIdx, Math.min(xmpIdx + 200, buf.length)).toString('utf8')
    const latMatch = slice.match(/exif:GPSLatitude="([^"]+)"/)
    const lngMatch = buf.slice(0, buf.length).indexOf(Buffer.from('exif:GPSLongitude="')) >= 0
      ? buf.slice(buf.indexOf(Buffer.from('exif:GPSLongitude="')), Math.min(buf.indexOf(Buffer.from('exif:GPSLongitude="')) + 200, buf.length)).toString('utf8').match(/exif:GPSLongitude="([^"]+)"/)
      : null
    if (latMatch && lngMatch) {
      return { lat: parseFloat(latMatch[1]), lng: parseFloat(lngMatch[1]) }
    }
  }

  return null
}
