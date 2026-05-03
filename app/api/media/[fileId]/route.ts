import { NextRequest } from 'next/server'
import { google } from 'googleapis'
import exifr from 'exifr'

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

    // Download first 128KB — JPEG EXIF (incl. GPS) is always in the first few KB
    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer', headers: { Range: 'bytes=0-131071' } }
    )

    const buffer = Buffer.from(res.data as ArrayBuffer)

    const exifData = await exifr.parse(buffer, { gps: true, xmp: false, iptc: false, icc: false })
    const lat: number | undefined = exifData?.latitude
    const lng: number | undefined = exifData?.longitude

    if (!lat || !lng) {
      return Response.json({ hasGps: false })
    }

    return Response.json({
      hasGps: true,
      latitude: lat,
      longitude: lng,
    })
  } catch (err) {
    return Response.json({ hasGps: false, error: String(err) })
  }
}
