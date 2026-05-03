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

/** Read a 4-byte unsigned int from a buffer respecting byte order */
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

/**
 * Minimal JPEG/EXIF GPS parser.
 * Returns { latitude, longitude } or null if not found.
 */
function parseGps(buf: Buffer): { latitude: number; longitude: number } | null {
  // 1. Find APP1 (0xFF 0xE1) with "Exif\0\0"
  let app1 = -1
  for (let i = 0; i < Math.min(buf.length - 6, 65536); i++) {
    if (buf[i] === 0xff && buf[i + 1] === 0xe1) {
      if (buf[i + 4] === 0x45 && buf[i + 5] === 0x78 && buf[i + 6] === 0x69) { // "Exi"
        app1 = i + 4 // start of TIFF header (after marker + length)
        break
      }
    }
  }
  if (app1 < 0) return null

  // 2. TIFF header: byte order + magic + IFD0 offset
  const tiff = app1 + 6 // skip "Exif\0\0"
  const le = buf[tiff] === 0x49 // "II" = little-endian, "MM" = big-endian
  if (readU16(buf, tiff + 2, le) !== 42) return null // TIFF magic

  const ifd0Offset = tiff + readU32(buf, tiff + 4, le)

  // 3. Walk IFD0 to find GPS IFD pointer (tag 0x8825)
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

  // 4. Walk GPS IFD for tags 1-4 (LatRef, Lat, LngRef, Lng)
  const gpsCount = readU16(buf, gpsIfdOffset, le)
  let latRef = 'N', lngRef = 'E'
  let latOffset = -1, lngOffset = -1

  for (let i = 0; i < gpsCount; i++) {
    const entry = gpsIfdOffset + 2 + i * 12
    if (entry + 12 > buf.length) break
    const tag = readU16(buf, entry, le)
    if (tag === 0x0001) { // GPSLatitudeRef
      latRef = String.fromCharCode(buf[entry + 8])
    } else if (tag === 0x0002) { // GPSLatitude (3 RATIONAL)
      latOffset = tiff + readU32(buf, entry + 8, le)
    } else if (tag === 0x0003) { // GPSLongitudeRef
      lngRef = String.fromCharCode(buf[entry + 8])
    } else if (tag === 0x0004) { // GPSLongitude (3 RATIONAL)
      lngOffset = tiff + readU32(buf, entry + 8, le)
    }
  }

  if (latOffset < 0 || lngOffset < 0) return null
  if (latOffset + 24 > buf.length || lngOffset + 24 > buf.length) return null

  // 5. Convert DMS rationals → decimal degrees
  const lat =
    readRational(buf, latOffset, le) +
    readRational(buf, latOffset + 8, le) / 60 +
    readRational(buf, latOffset + 16, le) / 3600

  const lng =
    readRational(buf, lngOffset, le) +
    readRational(buf, lngOffset + 8, le) / 60 +
    readRational(buf, lngOffset + 16, le) / 3600

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

    // 1MB — enough to cover Samsung's large maker notes before GPS IFD values
    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer', headers: { Range: 'bytes=0-1048575' } }
    )

    const buffer = Buffer.from(res.data as ArrayBuffer)
    const gps = parseGps(buffer)

    if (!gps || !Number.isFinite(gps.latitude) || !Number.isFinite(gps.longitude)) {
      return Response.json({ hasGps: false })
    }

    return Response.json({ hasGps: true, latitude: gps.latitude, longitude: gps.longitude })
  } catch (err) {
    return Response.json({ hasGps: false, error: String(err) })
  }
}
