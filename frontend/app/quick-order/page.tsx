'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { API_URL } from '@/lib/api'
import { fbPixel } from '@/components/FacebookPixel'

interface PrintType {
  id: string
  name: string
  icon: string
  price: string
}

// Static fallback used while API loads or if it errors out
const FALLBACK_TYPES: PrintType[] = [
  { id: 'flyer', name: 'Флаер', icon: '📄', price: '89,000₮-аас' },
  { id: 'business-card', name: 'Нэрийн хуудас', icon: '💳', price: '45,000₮-аас' },
  { id: 'banner', name: 'Баннер', icon: '🏗️', price: '35,000₮-аас' },
  { id: 'poster', name: 'Постер', icon: '🖼️', price: '15,000₮-аас' },
  { id: 'sticker', name: 'Стикер', icon: '📎', price: '25,000₮-аас' },
  { id: 'brochure', name: 'Брошур', icon: '📋', price: '120,000₮-аас' },
]

type Step = 1 | 2 | 3 | 4

export default function QuickOrderPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>(1)
  const [PRINT_TYPES, setPrintTypes] = useState<PrintType[]>(FALLBACK_TYPES)

  // Pull product types from admin-managed quote config; fall back gracefully on error
  useEffect(() => {
    fetch(`${API_URL}/api/cms/quote-config`)
      .then(r => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data) || data.length === 0) return
        const mapped: PrintType[] = data.map(c => {
          // Compute "from" price from base_rate × min_qty when no sample exists
          const base = Number(c.base_rate) || 0
          const minQty = Number(c.min_qty) || 100
          // Rough estimate: 200ш A5-equivalent baseline
          const sampleQty = Math.max(minQty, 200)
          const estPrice = base > 0 ? Math.round(base * sampleQty * 0.5) : 0
          const priceLabel = estPrice > 0
            ? `${estPrice.toLocaleString()}₮-аас`
            : 'Үнэ авах'
          return {
            id: c.product_type,
            name: c.name_mn,
            icon: c.icon || '📦',
            price: priceLabel,
          }
        })
        setPrintTypes(mapped)
      })
      .catch(() => {})
  }, [])
  const [selected, setSelected] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!phone || !selected) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('product_name', PRINT_TYPES.find(t => t.id === selected)?.name || selected)
      fd.append('customer_phone', phone)
      fd.append('category', selected)
      fd.append('preferred_contact', 'chat')
      if (note) fd.append('message', note)
      if (file) fd.append('files', file)

      await fetch(`${API_URL}/api/inquiries`, { method: 'POST', body: fd }).catch(() => {})
      setDone(true)
      fbPixel.lead({ contentName: `Quick Order — ${PRINT_TYPES.find(t => t.id === selected)?.name || selected}` })
      setStep(4)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--bg)' }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 22, fontWeight: 800 }}><span style={{ color: '#FF6B00' }}>Biz</span><span style={{ color: 'var(--text)' }}>Print</span></span>
          </a>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginTop: 12 }}>Хурдан захиалга</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>3 алхамд захиалга өгнө</p>

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                width: step === s ? 28 : 8, height: 8, borderRadius: 4, transition: 'all 0.3s',
                background: step > s ? '#FF6B00' : step === s ? '#FF6B00' : 'var(--border)',
              }} />
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
          {/* Step 1: Product type */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Ямар бүтээгдэхүүн хэвлүүлэх вэ?</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {PRINT_TYPES.map(t => (
                  <button key={t.id} onClick={() => { setSelected(t.id); setStep(2) }}
                    style={{
                      padding: 16, borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                      border: `2px solid ${selected === t.id ? '#FF6B00' : 'var(--border)'}`,
                      background: selected === t.id ? 'rgba(255,107,0,0.06)' : 'var(--bg)',
                    }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#FF6B00', marginTop: 2 }}>{t.price}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: File upload */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Эх файлаа оруулна уу</p>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>PDF, AI, PSD, JPG, PNG — 50MB хүртэл</p>

              <div onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
                style={{
                  border: '2px dashed var(--border)', borderRadius: 16, padding: '32px 20px', textAlign: 'center',
                  cursor: 'pointer', marginBottom: 16, transition: 'border-color 0.2s',
                }}>
                {file ? (
                  <>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>📎</div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{file.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text3)' }}>{(file.size / 1024 / 1024).toFixed(1)}MB</p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 6 }}>📁</div>
                    <p style={{ fontSize: 13, color: 'var(--text3)' }}>Файл чирж тавих эсвэл дарж сонгох</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.ai,.psd,.jpg,.jpeg,.png,.webp,.eps,.zip" style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>← Буцах</button>
                <button onClick={() => { fbPixel.initiateCheckout({ value: 0, productName: PRINT_TYPES.find(t => t.id === selected)?.name }); setStep(3) }} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: '#FF6B00', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {file ? 'Дараах →' : 'Файлгүй үргэлжлэх →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Contact */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Холбоо барих мэдээлэл</p>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block' }}>Утасны дугаар</label>
                <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                  <span style={{ padding: '12px 14px', background: 'var(--surface2)', color: 'var(--text3)', fontSize: 13, borderRight: '1px solid var(--border)' }}>+976</span>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9900 0000" autoFocus
                    style={{ flex: 1, padding: '12px 14px', border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: 'var(--text)' }} />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block' }}>Нэмэлт тэмдэглэл (заавал биш)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Тираж, хэмжээ, онцлох зүйл..." rows={2}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13, resize: 'none', background: 'transparent', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Summary */}
              <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 12, color: 'var(--text2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>Бүтээгдэхүүн</span>
                  <strong style={{ color: 'var(--text)' }}>{PRINT_TYPES.find(t => t.id === selected)?.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>Файл</span>
                  <strong style={{ color: 'var(--text)' }}>{file ? file.name.slice(0, 25) : 'Байхгүй'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Холбоо барих</span>
                  <strong style={{ color: '#FF6B00' }}>30 минутад хариулна</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>← Буцах</button>
                <button onClick={handleSubmit} disabled={!phone || submitting}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: '#111', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!phone || submitting) ? 0.5 : 1 }}>
                  {submitting ? 'Илгээж байна...' : 'Захиалга илгээх ✓'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && done && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Захиалга амжилттай илгээгдлээ!</h2>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>Бид 30 минутын дотор тантай холбогдоно</p>

              {/* Messenger deeplink */}
              {process.env.NEXT_PUBLIC_FB_PAGE_ID && (
                <div style={{ padding: 14, background: 'rgba(0,132,255,0.06)', border: '1px solid rgba(0,132,255,0.2)', borderRadius: 12, marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: '#0084FF', marginBottom: 8 }}>Захиалгын мэдэгдэл хурдан авахыг хүсвэл:</p>
                  <a href={`https://m.me/${process.env.NEXT_PUBLIC_FB_PAGE_ID}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#0084FF', color: '#fff', borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                    💬 Messenger-т холбогдох
                  </a>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <Link href="/quote" style={{ flex: 1, textAlign: 'center', padding: '12px 0', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)', textDecoration: 'none', fontSize: 13 }}>Үнэ тооцоолох</Link>
                <Link href="/" style={{ flex: 1, textAlign: 'center', padding: '12px 0', borderRadius: 12, border: 'none', background: '#FF6B00', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Нүүр хуудас</Link>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 16 }}>Бид 30 минутын дотор холбогдоно</p>
      </div>
    </div>
  )
}
