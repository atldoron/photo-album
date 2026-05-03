interface NominatimResult {
  display_name: string
  address: {
    city?: string
    town?: string
    village?: string
    state?: string
    county?: string
    country?: string
  }
}

export async function getPlaceName(lat: number, lon: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=he`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PhotoAlbumApp/1.0 (personal)' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const data: NominatimResult = await res.json()
    const addr = data.address
    const parts = [
      addr.city ?? addr.town ?? addr.village,
      addr.state ?? addr.county,
      addr.country,
    ].filter(Boolean) as string[]
    return parts.slice(0, 2).join(', ') || data.display_name.split(',').slice(0, 2).join(', ')
  } catch {
    return null
  }
}
