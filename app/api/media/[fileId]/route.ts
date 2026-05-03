import { NextRequest } from 'next/server'
import { google } from 'googleapis'

function getAuth() {
  const sa = process.env.GOOGLE_SERVICE_ACCOUNT?.replace(/^﻿/, '')
  if (!sa) throw new Error('GOOGLE_SERVICE_ACCOUNT not set')
  return new google.auth.GoogleAuth({
    credentials: JSON.parse(sa),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
}

function readU32(buf: Buffer, offset: number, le: boolean): number {
  return le ? buf.readUInt32LE(offset) : buf.readUInt32BE(offset)
}
function readU16(buf: Buffer, offset: number, le: boolean): number {
  return le ? buf.readUInt16LE(offset) : buf.readUInt16BE(offset)
}
function readRational(buf: Buffer, offset: number, le: boolean): number {
  const num = readU32(buf, offset, le)
  const den = readU32(buf, offset + 4, le)
  return den === 0 ? 0 : num / den
}

/** Search for XMP GPS data (exif:GPSLatitude / exif:GPSLongitude) */
function parseXmpGps(buf: Buffer): { latitude: number; longitude: number } | null {
  // XMP in JPEG: APP1 segment starting with "http://ns.adobe.com/xap/1.0/\0"
  const xmpMarker = Buffer.from('http://ns.adobe.com/xap/')
  const idx = buf.indexOf(xmpMarker)
  if (idx < 0) return null

  // XMP is UTF-8 text; read up to 64KB from here
  const xmpText = buf.slice(idx, Math.min(idx + 65536, buf.length)).toString('utf8')

  // Look for exif:GPSLatitude="DD,MM.SSS..." or GPS coordinate patterns
  const latMatch = xmpText.match(/exif:GPSLatitude="([^"]+)"/)
  const lngMatch = xmpText.match(/exif:GPSLongitude="([^"]+)"/)
  const latRefMatch = xmpText.match(/exif:GPSLatitudeRef="([NS])"/)
  const lngRefMatch = xmpText.match(/exif:GPSLongitudeRef="([EW])"/)

  if (!latMatch || !lngMatch) return null

  // Parse "DD,MM.SSS" or "DD,MM,SS" DMS format
  function parseDms(s: string): number {
    const parts = s.split(',').map(Number)
    if (parts.length === 3) return parts[0] + parts[1] / 60 + parts[2] / 3600
    if (parts.length === 2) return parts[0] + parts[1] / 60
    return parts[0]
  }

  const lat = parseDms(latMatch[1])
  const lng = parseDms(lngMatch[1])
  const latRef = latRefMatch ? latRefMatch[1] : 'N'
  const lngRef = lngRefMatch ? lngRefMatch[1] : 'E'

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return {
    latitude: latRef === 'S' ? -lat : lat,
    longitude: lngRef === 'W' ? -lng : lng,
  }
}

function parseExifGps(buf: Buffer): { latitude: number; longitude: number } | null {
  let app1 = -1
  for (let i = 0; i < Math.min(buf.length - 6, 65536); i++) {
    if (buf[i] === 0xff && buf[i + 1] === 0xe1) {
      if (buf[i + 4] === 0x45 && buf[i + 5] === 0x78 && buf[i + 6] === 0x69) {
        app1 = i + 4
        break
      }
    }
  }
  if (app1 < 0) return null

  const tiff = app1 + 6
  const le = buf[tiff] === 0x49
  if (readU16(buf, tiff + 2, le) !== 42) return null

  const ifd0Offset = tiff + readU32(buf, tiff + 4, le)
  const ifd0Count = readU16(buf, ifd0Offset, le)
  let gpsIfdOffset = -1
  for (let i = 0; i < ifd0Count; i++) {
    const entry = ifd0Offset + 2 + i * 12
    if (entry + 12 > buf.length) break
    const tag = readU16(buf, entry, le)
    if (tag === 0x8825) {
      gpsIfdOffset = tiff + readU32(buf, entry + 8, le)
      break
    }
  }
  if (gpsIfdOffset < 0) return null

  const gpsCount = readU16(buf, gpsIfdOffset, le)
  let latRef = 'N', lngRef = 'E'
  let latOffset = -1, lngOffset = -1

  for (let i = 0; i < gpsCount; i++) {
    const entry = gpsIfdOffset + 2 + i * 12
    if (entry + 12 > buf.length) break
    const tag = readU16(buf, entry, le)
    if (tag === 0x0001) latRef = String.fromCharCode(buf[entry + 8])
    else if (tag === 0x0002) latOffset = tiff + readU32(buf, entry + 8, le)
    else if (tag === 0x0003) lngRef = String.fromCharCode(buf[entry + 8])
    else if (tag === 0x0004) lngOffset = tiff + readU32(buf, entry + 8, le)
  }

  if (latOffset < 0 || lngOffset < 0) return null
  if (latOffset + 24 > buf.length || lngOffset + 24 > buf.length) return null

  // Skip if GPS IFD has empty/zero values (Samsung pre-allocated template)
  const latBytes = buf.slice(latOffset, latOffset + 24)
  if (latBytes.every(b => b === 0)) return null

  const lat =
    readRational(buf, latOffset, le) +
    readRational(buf, latOffset + 8, le) / 60 +
    readRational(buf, latOffset + 16, le) / 3600
  const lng =
    readRational(buf, lngOffset, le) +
    readRational(buf, lngOffset + 8, le) / 60 +
    readRational(buf, lngOffset + 16, le) / 3600

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return {
    latitude: latRef === 'S' ? -lat : lat,
    longitude: lngRef === 'W' ? -lng : lng,
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params
    const auth = getAuth()
    const drive = google.drive({ version: 'v3', auth })

    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer', headers: { Range: 'bytes=0-1048575' } }
    )

    const buffer = Buffer.from(res.data as ArrayBuffer)

    const gps = parseExifGps(buffer) ?? parseXmpGps(buffer)

    if (!gps) {
      return Response.json({ hasGps: false })
    }

    return Response.json({ hasGps: true, latitude: gps.latitude, longitude: gps.longitude })
  } catch (err) {
    return Response.json({ hasGps: false, error: String(err) })
  }
}
