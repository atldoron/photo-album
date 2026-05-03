import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'אלבום תמונות',
  description: 'אפליקציית אלבום תמונות אישית',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <body className="min-h-screen antialiased" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
        {children}
      </body>
    </html>
  )
}
