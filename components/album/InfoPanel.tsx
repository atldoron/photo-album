'use client'

import { useEffect, useState } from 'react'
import { getPlaceName } from '@/lib/geocoding'
import { formatDate } from '@/lib/utils'
import type { MediaItem } from '@/types'

function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 8 }
const labelStyle: React.CSSProperties = { opacity: 0.5, fontSize: 11, whiteSpace: 'nowrap', marginTop: 1 }
const valueStyle: React.CSSProperties = { fontSize: 13, wordBreak: 'break-word' }

interface GpsState {
  status: 'idle' | 'loading' | 'done' | 'none'
  latitude?: number
  longitude?: number
  placeName?: string
}

export default function InfoPanel({ item }: { item: MediaItem }) {
  const [gps, setGps] = useState<GpsState>({ status: 'idle' })

  useEffect(() => {
    queueMicrotask(() => setGps({ status: 'loading' }))

    // First try GPS already on the item (may be present for some albums)
    if (item.latitude != null && item.longitude != null) {
      const lat = item.latitude
      const lng = item.longitude
      queueMicrotask(() => setGps({ status: 'done', latitude: lat, longitude: lng }))
      getPlaceName(lat, lng).then((name) =>
        setGps((g) => ({ ...g, placeName: name ?? undefined }))
      )
      return
    }

    // Otherwise fetch EXIF from the file
    fetch(`/api/media/${item.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.hasGps) {
          setGps({ status: 'none' })
          return
        }
        const lat: number = data.latitude
        const lng: number = data.longitude
        setGps({ status: 'done', latitude: lat, longitude: lng })
        getPlaceName(lat, lng).then((name) =>
          setGps((g) => ({ ...g, placeName: name ?? undefined }))
        )
      })
      .catch(() => setGps({ status: 'none' }))
  }, [item.id, item.latitude, item.longitude])

  const resolution = item.width && item.height ? `${item.width} × ${item.height}` : null
  const fileSize = formatFileSize(item.fileSize)
  const mapsUrl =
    gps.latitude != null && gps.longitude != null
      ? `https://www.google.com/maps?q=${gps.latitude},${gps.longitude}`
      : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 220 }}>
      <div style={rowStyle}>
        <span style={labelStyle}>📄</span>
        <span style={{ ...valueStyle, fontWeight: 600 }}>{item.name}</span>
      </div>

      {item.takenAt && (
        <div style={rowStyle}>
          <span style={labelStyle}>📅</span>
          <span style={valueStyle}>{formatDate(item.takenAt)}</span>
        </div>
      )}

      {resolution && (
        <div style={rowStyle}>
          <span style={labelStyle}>🖼</span>
          <span style={valueStyle}>{resolution} פיקסלים</span>
        </div>
      )}

      {fileSize && (
        <div style={rowStyle}>
          <span style={labelStyle}>💾</span>
          <span style={valueStyle}>{fileSize}</span>
        </div>
      )}

      {/* GPS / location */}
      {gps.status === 'loading' && (
        <div style={rowStyle}>
          <span style={labelStyle}>📍</span>
          <span style={{ ...valueStyle, opacity: 0.5 }}>טוען מיקום…</span>
        </div>
      )}

      {gps.status === 'done' && (
        <div style={rowStyle}>
          <span style={labelStyle}>📍</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {gps.placeName
              ? <span style={valueStyle}>{gps.placeName}</span>
              : <span style={{ ...valueStyle, opacity: 0.5 }}>מאתר שם מקום…</span>
            }
            <a
              href={mapsUrl!}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: '#60a5fa' }}
            >
              פתח ב-Google Maps ↗
            </a>
          </div>
        </div>
      )}

      {gps.status === 'none' && (
        <div style={rowStyle}>
          <span style={labelStyle}>📍</span>
          <span style={{ ...valueStyle, opacity: 0.4 }}>אין נתוני מיקום</span>
        </div>
      )}
    </div>
  )
}
