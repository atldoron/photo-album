'use client'

import { useState, useCallback, useEffect } from 'react'

function key(albumId: string, itemId: string) {
  return `fav_${albumId}_${itemId}`
}

export function useFavorites(albumId: string) {
  const [favs, setFavs] = useState<Set<string>>(new Set())

  useEffect(() => {
    const stored = new Set<string>()
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? ''
      if (k.startsWith(`fav_${albumId}_`) && localStorage.getItem(k) === '1') {
        stored.add(k.slice(`fav_${albumId}_`.length))
      }
    }
    setFavs(stored)
  }, [albumId])

  const toggle = useCallback(
    (itemId: string) => {
      setFavs((prev) => {
        const next = new Set(prev)
        if (next.has(itemId)) {
          next.delete(itemId)
          localStorage.removeItem(key(albumId, itemId))
        } else {
          next.add(itemId)
          localStorage.setItem(key(albumId, itemId), '1')
        }
        return next
      })
    },
    [albumId]
  )

  const isFav = useCallback((itemId: string) => favs.has(itemId), [favs])

  return { isFav, toggle, favs }
}
