import { NextRequest } from 'next/server'
import { google } from 'googleapis'
import ExifReader from 'exifr'

function getAuth() {
  const sa = process.env.GOOGLE_SERVICE_ACCOUNT?.replace(/^﻿/, '')
  if (!sa) throw new Error('GOOGLE_SERVICE_ACCOUNT not set')
  return new google.auth.GoogleAuth({
    credentials: JSON.parse(sa),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params
    const auth = getAuth()
    const drive = google.drive({ version: 'v3', auth })

    // Download first 128KB — enough for EXIF headers
    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer', headers: { Range: 'bytes=0-131071' } }
    )

    const buffer = Buffer.from(res.data as ArrayBuffer)
    const exif = await ExifReader.parse(buffer, {
      gps: true,
      pick: ['GPSLatitude', 'GPSLongitude', 'GPSLatitudeRef', 'GPSLongitudeRef'],
    })

    if (!exif?.latitude || !exif?.longitude) {
      return Response.json({ hasGps: false })
    }

    return Response.json({
      hasGps: true,
      latitude: exif.latitude,
      longitude: exif.longitude,
    })
  } catch (err) {
    return Response.json({ hasGps: false, error: String(err) })
  }
}
