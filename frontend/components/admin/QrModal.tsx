'use client'
import { useState, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { QrCode, Copy, Download, X, Check, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://bizprint.mn'

interface Props {
  product: { id: string; name_mn?: string; name?: string; slug?: string }
  type?: 'shop' | 'print' | 'signage'
}

export function QrButton({ product, type }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} title="QR код"
        style={{ padding: '4px 10px', background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
        <QrCode className="w-3 h-3" strokeWidth={1.5} />QR
      </button>
      {open && <QrModal product={product} type={type} onClose={() => setOpen(false)} />}
    </>
  )
}

function QrModal({ product, type, onClose }: Props & { onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)
  const slug = product.slug || product.id
  const url = `${SITE_URL}/product/${slug}`
  const name = product.name_mn || product.name || 'Бүтээгдэхүүн'

  const copyLink = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Линк хуулагдлаа')
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `bizprint-qr-${slug}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success('QR код татагдлаа')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--surface)', borderRadius: 20, width: 380, maxWidth: '90vw', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <QrCode className="w-5 h-5 text-[#8B5CF6]" strokeWidth={1.5} />
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>QR код</span>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface2)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, textAlign: 'center' }}>
          {/* Product name */}
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 20 }}>
            {type === 'signage' ? '🪧 Хаяг самбар' : type === 'print' ? '🖨️ Хэвлэмэл' : '🛍️ Дэлгүүр'}
          </div>

          {/* QR Code */}
          <div ref={qrRef} style={{ display: 'inline-block', padding: 16, background: '#fff', borderRadius: 16, border: '1px solid var(--border)', marginBottom: 16 }}>
            <QRCodeCanvas value={url} size={200} level="H"
              imageSettings={{ src: '/favicon.ico', height: 30, width: 30, excavate: true }} />
          </div>

          {/* URL */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, background: 'var(--surface2)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border)' }}>
            <code style={{ flex: 1, fontSize: 11, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{url}</code>
            <button onClick={copyLink} style={{ background: copied ? '#10B981' : '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
              {copied ? <><Check className="w-3 h-3" />Хуулсан</> : <><Copy className="w-3 h-3" />Хуулах</>}
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={downloadQr} style={{ flex: 1, padding: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Download className="w-4 h-4" strokeWidth={1.5} />QR татах (PNG)
            </button>
            <a href={`/product/${slug}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '10px', background: '#FF6B00', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>
              <ExternalLink className="w-4 h-4" strokeWidth={1.5} />Хуудас нээх
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
