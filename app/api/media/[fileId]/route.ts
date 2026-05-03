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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exifData: any = await exifr.parse(buffer, { gps: true, xmp: false, iptc: false, icc: false })

    // exifr with gps:true computes latitude/longitude — prefer those
    let lat: number | undefined = Number.isFinite(exifData?.latitude) ? exifData.latitude : undefined
    let lng: number | undefined = Number.isFinite(exifData?.longitude) ? exifData.longitude : undefined

    // Fallback: manual DMS → decimal conversion from raw GPS tags
    if ((lat == null || lng == null) && Array.isArray(exifData?.GPSLatitude) && Array.isArray(exifData?.GPSLongitude)) {
      const [d, m, s] = exifData.GPSLatitude as number[]
      lat = d + m / 60 + s / 3600
      if (exifData.GPSLatitudeRef === 'S') lat = -lat

      const [ld, lm, ls] = exifData.GPSLongitude as number[]
      lng = ld + lm / 60 + ls / 3600
      if (exifData.GPSLongitudeRef === 'W') lng = -lng
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return Response.json({
        hasGps: false,
        debug: {
          rawLat: exifData?.GPSLatitude,
          rawLng: exifData?.GPSLongitude,
          latRef: exifData?.GPSLatitudeRef,
          lngRef: exifData?.GPSLongitudeRef,
          computedLat: exifData?.latitude,
          computedLng: exifData?.longitude,
        },
      })
    }

    return Response.json({ hasGps: true, latitude: lat, longitude: lng })
  } catch (err) {
    return Response.json({ hasGps: false, error: String(err) })
  }
}
