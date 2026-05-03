export default function AlbumLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* header skeleton */}
      <div className="px-4 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="h-6 w-40 rounded animate-pulse" style={{ background: 'var(--border)' }} />
          <div className="h-4 w-60 rounded mt-2 animate-pulse" style={{ background: 'var(--border)' }} />
        </div>
        <div className="h-8 w-32 rounded animate-pulse" style={{ background: 'var(--border)' }} />
      </div>
      {/* grid skeleton */}
      <div className="flex-1 p-4 grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="rounded animate-pulse aspect-square"
            style={{ background: 'var(--border)' }} />
        ))}
      </div>
    </div>
  )
}
