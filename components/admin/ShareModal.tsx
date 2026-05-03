'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  albumId: string
  albumName: string
}

export default function ShareModal({ open, onClose, albumId, albumName }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/album/${albumId}`
      : `/album/${albumId}`

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal open={open} onClose={onClose} title={`שתף — ${albumName}`}>
      <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
        שלח את הקישור הזה לכל מי שאתה רוצה שיצפה באלבום:
      </p>
      <div className="flex items-center gap-2 rounded-lg p-3 mb-4 text-sm break-all select-all"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        {url}
      </div>
      <button
        onClick={handleCopy}
        className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
        style={{ background: copied ? '#16a34a' : '#2563eb', color: '#fff' }}
      >
        {copied ? '✓ הועתק!' : 'העתק קישור'}
      </button>
    </Modal>
  )
}
