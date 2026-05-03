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

function hex(buf: Buffer, offset: number, len: number): string {
  return buf.slice(offset, offset + len).toString('hex')
}

function parseGpsDebug(buf: Buffer) {
  // 1. Find APP1
  let app1 = -1
  for (let i = 0; i < Math.min(buf.length - 6, 65536); i++) {
    if (buf[i] === 0xff && buf[i + 1] === 0xe1) {
      if (buf[i + 4] === 0x45 && buf[i + 5] === 0x78 && buf[i + 6] === 0x69) {
        app1 = i + 4
        break
      }
    }
  }
  if (app1 < 0) return { error: 'no APP1' }

  const tiff = app1 + 6
  const le = buf[tiff] === 0x49
  if (readU16(buf, tiff + 2, le) !== 42) return { error: 'bad TIFF magic', tiff, bytes: hex(buf, tiff, 8) }

  const ifd0RelOffset = readU32(buf, tiff + 4, le)
  const ifd0Offset = tiff + ifd0RelOffset
  const ifd0Count = readU16(buf, ifd0Offset, le)

  // collect all IFD0 tags
  const ifd0Tags: Record<string, string> = {}
  let gpsIfdOffset = -1
  for (let i = 0; i < ifd0Count; i++) {
    const entry = ifd0Offset + 2 + i * 12
    if (entry + 12 > buf.length) break
    const tag = readU16(buf, entry, le)
    const type = readU16(buf, entry + 2, le)
    const count = readU32(buf, entry + 4, le)
    const valOrOff = readU32(buf, entry + 8, le)
    ifd0Tags[`0x${tag.toString(16).padStart(4,'0')}`] = `type=${type} count=${count} val/off=${valOrOff}`
    if (tag === 0x8825) {
      gpsIfdOffset = tiff + valOrOff
    }
  }

  if (gpsIfdOffset < 0) return { error: 'no GPS IFD in IFD0', tiff, le, ifd0Tags }

  const gpsCount = readU16(buf, gpsIfdOffset, le)
  const gpsTags: Record<string, string> = {}
  let latRef = 'N', lngRef = 'E'
  let latRelOffset = -1, lngRelOffset = -1

  for (let i = 0; i < gpsCount; i++) {
    const entry = gpsIfdOffset + 2 + i * 12
    if (entry + 12 > buf.length) break
    const tag = readU16(buf, entry, le)
    const type = readU16(buf, entry + 2, le)
    const count = readU32(buf, entry + 4, le)
    const valOrOff = readU32(buf, entry + 8, le)
    gpsTags[`0x${tag.toString(16).padStart(4,'0')}`] = `type=${type} count=${count} val/off=${valOrOff}`
    if (tag === 0x0001) latRef = String.fromCharCode(buf[entry + 8])
    else if (tag === 0x0002) latRelOffset = valOrOff
    else if (tag === 0x0003) lngRef = String.fromCharCode(buf[entry + 8])
    else if (tag === 0x0004) lngRelOffset = valOrOff
  }

  const latOffset = latRelOffset >= 0 ? tiff + latRelOffset : -1
  const lngOffset = lngRelOffset >= 0 ? tiff + lngRelOffset : -1

  const latBytes = latOffset >= 0 && latOffset + 24 <= buf.length ? hex(buf, latOffset, 24) : 'OUT_OF_RANGE'
  const lngBytes = lngOffset >= 0 && lngOffset + 24 <= buf.length ? hex(buf, lngOffset, 24) : 'OUT_OF_RANGE'

  let latitude: number | null = null
  let longitude: number | null = null
  if (latOffset >= 0 && latOffset + 24 <= buf.length) {
    const lat = readRational(buf, latOffset, le) + readRational(buf, latOffset + 8, le) / 60 + readRational(buf, latOffset + 16, le) / 3600
    latitude = latRef === 'S' ? -lat : lat
  }
  if (lngOffset >= 0 && lngOffset + 24 <= buf.length) {
    const lng = readRational(buf, lngOffset, le) + readRational(buf, lngOffset + 8, le) / 60 + readRational(buf, lngOffset + 16, le) / 3600
    longitude = lngRef === 'W' ? -lng : lng
  }

  return {
    bufLen: buf.length,
    tiff,
    le,
    ifd0RelOffset,
    ifd0Count,
    gpsIfdOffset,
    gpsCount,
    gpsTags,
    latRef,
    lngRef,
    latRelOffset,
    lngRelOffset,
    latOffset,
    lngOffset,
    latBytes,
    lngBytes,
    latitude,
    longitude,
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
    const debug = parseGpsDebug(buffer)
    return Response.json(debug)
  } catch (err) {
    return Response.json({ error: String(err) })
  }
}
