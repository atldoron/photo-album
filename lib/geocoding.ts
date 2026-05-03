interface NominatimResult {
  display_name: string
  address: {
    // Specific named places (most precise first)
    tourism?: string
    amenity?: string
    leisure?: string
    historic?: string
    natural?: string
    building?: string
    // Street / neighbourhood
    road?: string
    neighbourhood?: string
    suburb?: string
    quarter?: string
    city_district?: string
    // City level
    city?: string
    town?: string
    village?: string
    municipality?: string
    // Region
    state?: string
    county?: string
    country?: string
  }
}

export async function getPlaceName(lat: number, lon: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=he,en`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PhotoAlbumApp/1.0 (personal)' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const data: NominatimResult = await res.json()
    const a = data.address

    // Most specific named place available
    const specificPlace = a.tourism ?? a.amenity ?? a.leisure ?? a.historic ?? a.natural ?? a.building

    // City / area
    const city = a.city ?? a.town ?? a.village ?? a.municipality

    // Sub-city area (neighbourhood/suburb)
    const area = a.neighbourhood ?? a.suburb ?? a.quarter ?? a.city_district

    // Build: specific place → sub-area → city
    const parts: string[] = []
    if (specificPlace) parts.push(specificPlace)
    else if (area) parts.push(area)
    if (city) parts.push(city)

    if (parts.length > 0) return parts.slice(0, 2).join(', ')

    // Fallback: first two segments of display_name
    return data.display_name.split(',').slice(0, 2).join(', ').trim() || null
  } catch {
    return null
  }
}
