'use client'

import { useEffect, useState } from 'react'
import { getPlaceName } from '@/lib/geocoding'
import { formatDate } from '@/lib/utils'
import type { MediaItem } from '@/types'

interface InfoPanelProps {
  item: MediaItem
}

export default function InfoPanel({ item }: InfoPanelProps) {
  const [placeName, setPlaceName] = useState<string | null>(null)

  useEffect(() => {
    setPlaceName(null)
    if (item.latitude != null && item.longitude != null) {
      getPlaceName(item.latitude, item.longitude).then(setPlaceName)
    }
  }, [item.id, item.latitude, item.longitude])

  const hasLocation = item.latitude != null && item.longitude != null

  return (
    <div className="text-sm flex flex-col gap-2">
      <p className="font-medium truncate">{item.name}</p>
      {item.takenAt && (
        <p style={{ color: 'var(--muted)' }}>📅 {formatDate(item.takenAt)}</p>
      )}
      {hasLocation && (
        <div>
          {placeName && (
            <p style={{ color: 'var(--muted)' }}>📍 {placeName}</p>
          )}
          <a
            href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline text-xs"
          >
            פתח במפה
          </a>
        </div>
      )}
    </div>
  )
}
