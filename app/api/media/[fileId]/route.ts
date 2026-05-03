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
  if (offset + 4 > buf.length) return 0
  return le ? buf.readUInt32LE(offset) : buf.readUInt32BE(offset)
}
function readU16(buf: Buffer, offset: number, le: boolean): number {
  if (offset + 2 > buf.length) return 0
  return le ? buf.readUInt16LE(offset) : buf.readUInt16BE(offset)
}
function readRational(buf: Buffer, offset: number, le: boolean): number {
  const num = readU32(buf, offset, le)
  const den = readU32(buf, offset + 4, le)
  return den === 0 ? 0 : num / den
}

function parseXmpGps(buf: Buffer): { latitude: number; longitude: number } | null {
  const idx = buf.indexOf(Buffer.from('http://ns.adobe.com/xap/'))
  if (idx < 0) return null
  const xmpText = buf.slice(idx, Math.min(idx + 65536, buf.length)).toString('utf8')
  const latMatch = xmpText.match(/exif:GPSLatitude="([^"]+)"/)
  const lngMatch = xmpText.match(/exif:GPSLongitude="([^"]+)"/)
  const latRefMatch = xmpText.match(/exif:GPSLatitudeRef="([NS])"/)
  const lngRefMatch = xmpText.match(/exif:GPSLongitudeRef="([EW])"/)
  if (!latMatch || !lngMatch) return null
  function parseDms(s: string): number {
    const parts = s.split(',').map(Number)
    if (parts.length === 3) return parts[0] + parts[1] / 60 + parts[2] / 3600
    if (parts.length === 2) return parts[0] + parts[1] / 60
    return parts[0]
  }
  const lat = parseDms(latMatch[1])
  const lng = parseDms(lngMatch[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return {
    latitude: (latRefMatch?.[1] === 'S') ? -lat : lat,
    longitude: (lngRefMatch?.[1] === 'W') ? -lng : lng,
  }
}

/**
 * Walk any TIFF-format IFD looking for GPS IFD pointer (0x8825).
 * Also checks IFD1, ExifIFD, and any nested sub-IFDs.
 */
function scanForGpsIfd(buf: Buffer, tiff: number, le: boolean, ifdOffset: number, depth = 0): number {
  if (depth > 5 || ifdOffset + 2 > buf.length) return -1
  const count = readU16(buf, ifdOffset, le)
  if (count > 200) return -1
  for (let i = 0; i < count; i++) {
    const e = ifdOffset + 2 + i * 12
    if (e + 12 > buf.length) break
    const tag = readU16(buf, e, le)
    const type = readU16(buf, e + 2, le)
    const valOrOff = readU32(buf, e + 8, le)
    if (tag === 0x8825) {
      return tiff + valOrOff
    }
    // Recurse into sub-IFDs: ExifIFD (0x8769), InteropIFD (0xa005)
    if ((tag === 0x8769 || tag === 0xa005) && (type === 4 || type === 13)) {
      const sub = scanForGpsIfd(buf, tiff, le, tiff + valOrOff, depth + 1)
      if (sub >= 0) return sub
    }
  }
  // Follow IFD1 (next IFD pointer after last entry)
  if (depth === 0) {
    const nextIfdPtr = ifdOffset + 2 + count * 12
    if (nextIfdPtr + 4 <= buf.length) {
      const next = readU32(buf, nextIfdPtr, le)
      if (next > 0) {
        const sub = scanForGpsIfd(buf, tiff, le, tiff + next, depth + 1)
        if (sub >= 0) return sub
      }
    }
  }
  return -1
}

function parseExifGps(buf: Buffer): { latitude: number; longitude: number } | null {
  let tiff = -1
  for (let i = 0; i < Math.min(buf.length - 10, 65536); i++) {
    if (buf[i] === 0xff && buf[i + 1] === 0xe1 &&
        buf[i + 4] === 0x45 && buf[i + 5] === 0x78 && buf[i + 6] === 0x69) {
      tiff = i + 10
      break
    }
  }
  if (tiff < 0) return null

  const le = buf[tiff] === 0x49
  if (readU16(buf, tiff + 2, le) !== 42) return null

  const ifd0Offset = tiff + readU32(buf, tiff + 4, le)
  const gpsIfdOffset = scanForGpsIfd(buf, tiff, le, ifd0Offset)
  if (gpsIfdOffset < 0 || gpsIfdOffset + 2 > buf.length) return null

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
  if (buf.slice(latOffset, latOffset + 24).every(b => b === 0)) return null

  const lat = readRational(buf, latOffset, le) + readRational(buf, latOffset + 8, le) / 60 + readRational(buf, latOffset + 16, le) / 3600
  const lng = readRational(buf, lngOffset, le) + readRational(buf, lngOffset + 8, le) / 60 + readRational(buf, lngOffset + 16, le) / 3600
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  return {
    latitude: latRef === 'S' ? -lat : lat,
    longitude: lngRef === 'W' ? -lng : lng,
  }
}

/**
 * Brute-force scan for Thailand-range GPS coordinates encoded as RATIONAL pairs.
 * Looks for [deg, 0, 0, 0, 1, 0, 0, 0] patterns (deg/1 = integer degrees).
 * Thailand: lat 5-21, lng 97-106
 */
function bruteForceScanGps(buf: Buffer): { latitude: number; longitude: number } | null {
  for (let i = 0; i < buf.length - 48; i++) {
    // Check LE RATIONAL: numerator/denominator pairs
    const latDeg = buf.readUInt32LE(i)
    const latDen = buf.readUInt32LE(i + 4)
    if (latDen === 0 || latDen > 10000) continue
    const latD = latDeg / latDen
    if (latD < 5 || latD > 21) continue

    const latMinNum = buf.readUInt32LE(i + 8)
    const latMinDen = buf.readUInt32LE(i + 12)
    if (latMinDen === 0 || latMinDen > 1000000) continue
    const latM = latMinNum / latMinDen
    if (latM < 0 || latM >= 60) continue

    const latSecNum = buf.readUInt32LE(i + 16)
    const latSecDen = buf.readUInt32LE(i + 20)
    if (latSecDen === 0 || latSecDen > 1000000) continue
    const latS = latSecNum / latSecDen
    if (latS < 0 || latS >= 60) continue

    // Check longitude
    const lngDeg = buf.readUInt32LE(i + 24)
    const lngDen = buf.readUInt32LE(i + 28)
    if (lngDen === 0 || lngDen > 10000) continue
    const lngD = lngDeg / lngDen
    if (lngD < 97 || lngD > 106) continue

    const lngMinNum = buf.readUInt32LE(i + 32)
    const lngMinDen = buf.readUInt32LE(i + 36)
    if (lngMinDen === 0 || lngMinDen > 1000000) continue
    const lngM = lngMinNum / lngMinDen
    if (lngM < 0 || lngM >= 60) continue

    const lngSecNum = buf.readUInt32LE(i + 40)
    const lngSecDen = buf.readUInt32LE(i + 44)
    if (lngSecDen === 0 || lngSecDen > 1000000) continue
    const lngS = lngSecNum / lngSecDen
    if (lngS < 0 || lngS >= 60) continue

    const lat = latD + latM / 60 + latS / 3600
    const lng = lngD + lngM / 60 + lngS / 3600
    return { latitude: lat, longitude: lng }
  }
  return null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params
    const auth = getAuth()
    const drive = google.drive({ version: 'v3', auth })

    // Download 4MB to cover Samsung's large maker notes
    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer', headers: { Range: 'bytes=0-4194303' } }
    )

    const buffer = Buffer.from(res.data as ArrayBuffer)

    const gps = parseExifGps(buffer) ?? parseXmpGps(buffer) ?? bruteForceScanGps(buffer)

    if (!gps) {
      return Response.json({ hasGps: false })
    }

    return Response.json({ hasGps: true, latitude: gps.latitude, longitude: gps.longitude })
  } catch (err) {
    return Response.json({ hasGps: false, error: String(err) })
  }
}
