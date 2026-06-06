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
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 26, padding: '8px', color: '#fff', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}
              title={current && isFav(current.id) ? 'הסר ממועדפים' : 'הוסף למועדפים'}
            >
              {current && isFav(current.id) ? '⭐' : '☆'}
            </button>,
            <ShareItemButton key="share" />,
            <button
              key="download"
              onClick={() => current && window.open(current.downloadUrl, '_blank')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: '#fff', display: 'flex', alignItems: 'center', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}
              title="הורד קובץ מקורי"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v13m0 0-4.5-4.5M12 16l4.5-4.5"/>
                <path d="M3 19h18"/>
              </svg>
            </button>,
            <button
              key="info"
              onClick={() => setShowInfo((v) => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '8px', color: '#fff', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}
              title="פרטי צילום"
            >
              ℹ️
            </button>,
            'fullscreen',
          ],
        }}
      />

      {/* Lightbox header bar — gradient + close button, always above YARL (z 10001) */}
      {createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10001,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            direction: 'rtl',
            padding: '10px 12px',
            paddingTop: 'calc(10px + env(safe-area-inset-top))',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 60%, transparent 100%)',
            pointerEvents: 'none',
            gap: '10px',
          }}
        >
          {/* Close button — reading-start (right in RTL) */}
          <button
            onClick={onClose}
            style={{
              pointerEvents: 'auto',
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)',
              border: '1px solid rgba(255,255,255,0.22)',
              color: '#fff',
              fontSize: 18,
              lineHeight: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="סגור"
            title="סגור"
          >
            ✕
          </button>

          {/* Photo filename */}
          {current && (
            <span
              style={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'rgba(255,255,255,0.88)',
                fontSize: '13px',
                lineHeight: '36px',
                textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                textAlign: 'center',
              }}
            >
              {current.name}
            </span>
          )}

          {/* Spacer to keep title centred */}
          <div style={{ flexShrink: 0, width: 36 }} />
        </div>,
        document.body
      )}

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
