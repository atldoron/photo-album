export default function AlbumNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div>
        <p className="text-5xl mb-4">📷</p>
        <p className="text-lg font-medium mb-2">האלבום לא נמצא</p>
        <p style={{ color: 'var(--muted)' }}>
          האלבום לא נמצא או שאינו זמין כרגע — פנה לשולח הקישור
        </p>
      </div>
    </div>
  )
}
