'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import Lightbox, { SlideImage } from 'yet-another-react-lightbox'
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen'
import type { MediaItem } from '@/types'
import InfoPanel from './InfoPanel'

interface LightboxViewerProps {
  items: MediaItem[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
  isFav: (id: string) => boolean
  onToggleFav: (id: string) => void
}

function ShareItemButton() {
  const [copied, setCopied] = useState(false)
  async function handleShare() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleShare}
      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '8px', color: '#fff' }}
      title="העתק קישור לפריט"
    >
      {copied ? '✓' : '🔗'}
    </button>
  )
}

// Extend SlideImage with a custom field to store item index
interface ExtendedSlide extends SlideImage {
  itemIndex: number
}

export default function LightboxViewer({ items, index, onClose, onNavigate, isFav, onToggleFav }: LightboxViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(index)
  const [showInfo, setShowInfo] = useState(false)

  const current = items[currentIndex]

  const slides: ExtendedSlide[] = items.map((item, i) => ({
    src: item.type === 'image' ? item.viewUrl : item.thumbnailUrl,
    width: item.width,
    height: item.height,
    alt: item.name,
    itemIndex: i,
  }))

  return (
    <>
      <Lightbox
        open
        close={onClose}
        index={currentIndex}
        slides={slides}
        plugins={[Fullscreen]}
        on={{ view: ({ index: i }) => { setCurrentIndex(i); onNavigate(i) } }}
        carousel={{ finite: false, preload: 2 }}
        controller={{ closeOnBackdropClick: true }}
        render={{
          slide: ({ slide, rect }) => {
            const ext = slide as ExtendedSlide
            const item = items[ext.itemIndex]
            if (!item || item.type !== 'video') return undefined
            const aspect = item.width / item.height
            const fitW = Math.min(rect.width, rect.height * aspect)
            const fitH = fitW / aspect
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <iframe
                  src={item.viewUrl}
                  style={{ width: fitW, height: fitH, border: 'none' }}
                  allow="autoplay"
                  allowFullScreen
                  title={item.name}
                />
              </div>
            )
          },
        }}
        toolbar={{
          buttons: [
            <button
              key="fav"
              onClick={() => current && onToggleFav(current.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, padding: '8px', color: '#fff' }}
              title={current && isFav(current.id) ? 'הסר ממועדפים' : 'הוסף למועדפים'}
            >
              {current && isFav(current.id) ? '⭐' : '☆'}
            </button>,
            <ShareItemButton key="share" />,
            <button
              key="download"
              onClick={() => current && window.open(current.downloadUrl, '_blank')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '8px', color: '#fff' }}
              title="הורד קובץ מקורי"
            >
              ⬇
            </button>,
            <button
              key="info"
              onClick={() => setShowInfo((v) => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '8px', color: '#fff' }}
              title="פרטי צילום"
            >
              ℹ️
            </button>,
            'fullscreen',
            'close',
          ],
        }}
      />

      {/* Info panel overlay — rendered in a portal so it sits above YARL's own portal */}
      {showInfo && current && createPortal(
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            insetInlineStart: 0,
            zIndex: 10001,
            padding: 16,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            maxWidth: 280,
            margin: 8,
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <InfoPanel item={current} />
        </div>,
        document.body
      )}
    </>
  )
}
