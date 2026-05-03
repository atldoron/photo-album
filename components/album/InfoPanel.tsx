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

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
}
const labelStyle: React.CSSProperties = {
  opacity: 0.5,
  fontSize: 11,
  whiteSpace: 'nowrap',
  marginTop: 1,
}
const valueStyle: React.CSSProperties = {
  fontSize: 13,
  wordBreak: 'break-word',
}

export default function InfoPanel({ item }: { item: MediaItem }) {
  const [placeName, setPlaceName] = useState<string | null>(null)

  useEffect(() => {
    setPlaceName(null)
    if (item.latitude != null && item.longitude != null) {
      getPlaceName(item.latitude, item.longitude).then(setPlaceName)
    }
  }, [item.id, item.latitude, item.longitude])

  const hasLocation = item.latitude != null && item.longitude != null
  const resolution = item.width && item.height ? `${item.width} × ${item.height}` : null
  const fileSize = formatFileSize(item.fileSize)
  const mapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${item.latitude},${item.longitude}`
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 220 }}>
      {/* file name */}
      <div style={rowStyle}>
        <span style={labelStyle}>📄</span>
        <span style={{ ...valueStyle, fontWeight: 600 }}>{item.name}</span>
      </div>

      {/* date */}
      {item.takenAt && (
        <div style={rowStyle}>
          <span style={labelStyle}>📅</span>
          <span style={valueStyle}>{formatDate(item.takenAt)}</span>
        </div>
      )}

      {/* resolution */}
      {resolution && (
        <div style={rowStyle}>
          <span style={labelStyle}>🖼</span>
          <span style={valueStyle}>{resolution} פיקסלים</span>
        </div>
      )}

      {/* file size */}
      {fileSize && (
        <div style={rowStyle}>
          <span style={labelStyle}>💾</span>
          <span style={valueStyle}>{fileSize}</span>
        </div>
      )}

      {/* location */}
      {hasLocation && (
        <div style={rowStyle}>
          <span style={labelStyle}>📍</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {placeName
              ? <span style={valueStyle}>{placeName}</span>
              : <span style={{ ...valueStyle, opacity: 0.5 }}>טוען מיקום…</span>
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
    </div>
  )
}
