'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const O = '#FF6B00'

const PRODUCT_CATEGORIES = [
  { key: 'business_card', icon: '🪪', label: 'Нэрийн хуудас', desc: '90x55мм, офсет/дижитал' },
  { key: 'flyer', icon: '📄', label: 'Флаер / Хуудас', desc: 'A4, A5, DL хэмжээ' },
  { key: 'brochure', icon: '📖', label: 'Брошур', desc: '2-3 нугалаа, A4' },
  { key: 'poster', icon: '🖼️', label: 'Постер / Баннер', desc: 'A3, A2, A1, захиалгат' },
  { key: 'sticker', icon: '🏷️', label: 'Стикер / Шошго', desc: 'Нэг ширхэг, хуудас, рулон' },
  { key: 'book', icon: '📚', label: 'Ном / Каталог', desc: 'Зөөлөн/хатуу хавтас' },
  { key: 'box', icon: '📦', label: 'Хайрцаг / Савлагаа', desc: 'Бүтээгдэхүүний хайрцаг' },
  { key: 'other', icon: '✨', label: 'Бусад', desc: 'Тусгай захиалга' },
]

const MATERIALS = [
  { key: 'coated_300', label: 'Мелованный 300гр', desc: 'Гялгар, хатуу' },
  { key: 'coated_200', label: 'Мелованный 200гр', desc: 'Гялгар, дунд зэрэг' },
  { key: 'coated_150', label: 'Мелованный 150гр', desc: 'Гялгар, нимгэн' },
  { key: 'uncoated_120', label: 'Офсет 120гр', desc: 'Матт, бичвэрт тохиромжтой' },
  { key: 'uncoated_80', label: 'Офсет 80гр', desc: 'Стандарт A4 цаас' },
  { key: 'kraft', label: 'Крафт цаас', desc: 'Байгалийн өнгө' },
  { key: 'vinyl', label: 'Винил', desc: 'Стикер, тэсвэртэй' },
  { key: 'canvas', label: 'Канвас', desc: 'Зурагт хэвлэл' },
]

const SIZES: Record<string, { key: string; label: string }[]> = {
  business_card: [
    { key: '90x55', label: '90 x 55 мм (стандарт)' },
    { key: '85x55', label: '85 x 55 мм' },
    { key: '90x50', label: '90 x 50 мм' },
  ],
  flyer: [
    { key: 'A4', label: 'A4 (210 x 297 мм)' },
    { key: 'A5', label: 'A5 (148 x 210 мм)' },
    { key: 'DL', label: 'DL (99 x 210 мм)' },
  ],
  brochure: [
    { key: 'A4_fold', label: 'A4 нугалаатай' },
    { key: 'A5_fold', label: 'A5 нугалаатай' },
  ],
  poster: [
    { key: 'A3', label: 'A3 (297 x 420 мм)' },
    { key: 'A2', label: 'A2 (420 x 594 мм)' },
    { key: 'A1', label: 'A1 (594 x 841 мм)' },
    { key: 'custom', label: 'Захиалгат хэмжээ' },
  ],
  sticker: [
    { key: 'circle_50', label: 'Тойрог 50мм' },
    { key: 'rect_70x50', label: '70 x 50 мм' },
    { key: 'custom', label: 'Захиалгат хэмжээ' },
  ],
  book: [
    { key: 'A4', label: 'A4' },
    { key: 'A5', label: 'A5' },
    { key: 'B5', label: 'B5' },
  ],
  box: [
    { key: 'custom', label: 'Захиалгат хэмжээ' },
  ],
  other: [
    { key: 'custom', label: 'Захиалгат хэмжээ' },
  ],
}

const QUANTITY_OPTIONS = [50, 100, 200, 500, 1000, 2000, 5000]

type Step = 'category' | 'details' | 'file' | 'review'

export default function NewOrderPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('category')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [category, setCategory] = useState('')
  const [material, setMaterial] = useState('')
  const [size, setSize] = useState('')
  const [customSize, setCustomSize] = useState('')
  const [quantity, setQuantity] = useState(100)
  const [customQty, setCustomQty] = useState(false)
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [needDesign, setNeedDesign] = useState(false)

  // Quick estimate
  const unitPrice = category === 'business_card' ? 150 : category === 'flyer' ? 200 : category === 'sticker' ? 100 : category === 'poster' ? 2000 : category === 'book' ? 15000 : category === 'brochure' ? 500 : category === 'box' ? 3000 : 500
  const estimated = unitPrice * quantity

  const catInfo = PRODUCT_CATEGORIES.find(c => c.key === category)
  const sizeOptions = SIZES[category] || SIZES.other

  const canProceedDetails = material && size && quantity > 0
  const canSubmit = category && material && size && quantity > 0

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const body: any = {
        product_name: catInfo?.label || 'Захиалга',
        product_type: category,
        material,
        dimensions: size === 'custom' ? customSize : size,
        quantity,
        notes,
        need_design: needDesign,
        unit_price: unitPrice,
        total_price: estimated,
      }
      const order = await apiFetch<any>('/orders', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })

      // Upload file if provided
      if (file && order?.id) {
        const formData = new FormData()
        formData.append('file', file)
        await apiFetch(`/orders/${order.id}/upload-file`, { method: 'POST', body: formData })
      }

      router.push('/dashboard/customer/orders')
    } catch (e: any) {
      setError(e?.message || 'Алдаа гарлаа')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '24px 28px', fontFamily: F, maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 13, cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Буцах
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Шинэ захиалга</h1>
        <p style={{ color: 'var(--text3)', fontSize: 14, margin: 0 }}>Хэвлэлийн захиалга үүсгэх</p>
      </div>

      {/* Progress Steps */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {(['category', 'details', 'file', 'review'] as Step[]).map((s, i) => {
          const labels = ['Бүтээгдэхүүн', 'Дэлгэрэнгүй', 'Файл', 'Баталгаажуулах']
          const stepIndex = ['category', 'details', 'file', 'review'].indexOf(step)
          const isActive = s === step
          const isPast = i < stepIndex
          return (
            <div key={s} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 4, borderRadius: 2, background: isPast ? '#10B981' : isActive ? O : 'var(--border)', marginBottom: 6, transition: 'background 0.3s' }} />
              <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? O : isPast ? '#10B981' : 'var(--text3)' }}>{labels[i]}</span>
            </div>
          )
        })}
      </div>

      {/* Step 1: Category */}
      {step === 'category' && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Бүтээгдэхүүний төрөл сонгох</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {PRODUCT_CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => { setCategory(cat.key); setStep('details') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
                  borderRadius: 14, border: `2px solid ${category === cat.key ? O : 'var(--border)'}`,
                  background: category === cat.key ? `${O}08` : 'var(--surface)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  color: 'var(--text)',
                }}
                onMouseEnter={e => { if (category !== cat.key) e.currentTarget.style.borderColor = `${O}60` }}
                onMouseLeave={e => { if (category !== cat.key) e.currentTarget.style.borderColor = 'var(--border)' }}>
                <span style={{ fontSize: 28 }}>{cat.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{cat.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{cat.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 'details' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 24 }}>{catInfo?.icon}</span>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{catInfo?.label}</h2>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{catInfo?.desc}</span>
            </div>
          </div>

          {/* Size */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Хэмжээ</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {sizeOptions.map(s => (
                <button key={s.key} onClick={() => setSize(s.key)} style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  border: `1.5px solid ${size === s.key ? O : 'var(--border)'}`,
                  background: size === s.key ? `${O}10` : 'var(--surface)',
                  color: size === s.key ? O : 'var(--text)',
                  cursor: 'pointer',
                }}>
                  {s.label}
                </button>
              ))}
            </div>
            {size === 'custom' && (
              <input value={customSize} onChange={e => setCustomSize(e.target.value)} placeholder="Жнь: 200 x 100 мм"
                style={{ marginTop: 8, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', width: '100%', fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }} />
            )}
          </div>

          {/* Material */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Материал</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {MATERIALS.map(m => (
                <button key={m.key} onClick={() => setMaterial(m.key)} style={{
                  padding: '10px 14px', borderRadius: 10, textAlign: 'left',
                  border: `1.5px solid ${material === m.key ? O : 'var(--border)'}`,
                  background: material === m.key ? `${O}10` : 'var(--surface)',
                  cursor: 'pointer', color: 'var(--text)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Тоо ширхэг</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {QUANTITY_OPTIONS.map(q => (
                <button key={q} onClick={() => { setQuantity(q); setCustomQty(false) }} style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: `1.5px solid ${quantity === q && !customQty ? O : 'var(--border)'}`,
                  background: quantity === q && !customQty ? `${O}10` : 'var(--surface)',
                  color: quantity === q && !customQty ? O : 'var(--text)',
                  cursor: 'pointer',
                }}>
                  {q.toLocaleString()}
                </button>
              ))}
              <button onClick={() => setCustomQty(true)} style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: `1.5px solid ${customQty ? O : 'var(--border)'}`,
                background: customQty ? `${O}10` : 'var(--surface)',
                color: customQty ? O : 'var(--text)',
                cursor: 'pointer',
              }}>
                Бусад
              </button>
            </div>
            {customQty && (
              <input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value) || 1)} placeholder="Тоо оруулах"
                style={{ marginTop: 8, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', width: 180, fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }} />
            )}
          </div>

          {/* Estimate card */}
          <div style={{ background: `${O}08`, border: `1px solid ${O}30`, borderRadius: 14, padding: '18px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Төсөөлөл үнэ</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: O }}>₮{estimated.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>₮{unitPrice.toLocaleString()} x {quantity.toLocaleString()} ширхэг · Үнэ нь ойролцоо тооцоо</div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('category')} style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--text)' }}>← Буцах</button>
            <button onClick={() => setStep('file')} disabled={!canProceedDetails} style={{
              flex: 1, padding: '12px 24px', borderRadius: 10, border: 'none',
              background: canProceedDetails ? O : '#ccc', color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: canProceedDetails ? 'pointer' : 'not-allowed',
            }}>Үргэлжлүүлэх →</button>
          </div>
        </div>
      )}

      {/* Step 3: File */}
      {step === 'file' && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Файл оруулах</h2>

          <div style={{
            border: '2px dashed var(--border)', borderRadius: 16, padding: 40, textAlign: 'center',
            background: file ? `${O}05` : 'var(--surface)', marginBottom: 20, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
            onClick={() => document.getElementById('file-input')?.click()}>
            <input id="file-input" type="file" accept=".pdf,.ai,.eps,.psd,.png,.jpg,.jpeg,.tiff" style={{ display: 'none' }}
              onChange={e => setFile(e.target.files?.[0] || null)} />
            {file ? (
              <>
                <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{file.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                <button onClick={e => { e.stopPropagation(); setFile(null) }} style={{ marginTop: 10, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 16px', fontSize: 12, color: 'var(--text3)', cursor: 'pointer' }}>
                  Устгах
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📁</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Файл чирж оруулах эсвэл сонгох</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>PDF, AI, EPS, PSD, PNG, JPG, TIFF</div>
              </>
            )}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', marginBottom: 20 }}>
            <input type="checkbox" checked={needDesign} onChange={e => setNeedDesign(e.target.checked)} style={{ width: 18, height: 18, accentColor: O }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Дизайн хэрэгтэй</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Манай дизайнер таны дизайныг бэлдэнэ</div>
            </div>
          </label>

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Нэмэлт тэмдэглэл</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Тусгай шаардлага, тайлбар..."
              rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, resize: 'vertical', background: 'var(--surface)', color: 'var(--text)' }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('details')} style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--text)' }}>← Буцах</button>
            <button onClick={() => setStep('review')} style={{ flex: 1, padding: '12px 24px', borderRadius: 10, border: 'none', background: O, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Баталгаажуулах →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 'review' && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Захиалга баталгаажуулах</h2>

          <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '20px 22px', marginBottom: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ReviewRow label="Бүтээгдэхүүн" value={`${catInfo?.icon} ${catInfo?.label}`} />
              <ReviewRow label="Хэмжээ" value={size === 'custom' ? customSize || 'Захиалгат' : sizeOptions.find(s => s.key === size)?.label || size} />
              <ReviewRow label="Материал" value={MATERIALS.find(m => m.key === material)?.label || material} />
              <ReviewRow label="Тоо ширхэг" value={`${quantity.toLocaleString()} ш`} />
              {file && <ReviewRow label="Файл" value={file.name} />}
              {needDesign && <ReviewRow label="Дизайн" value="Дизайн хэрэгтэй" />}
              {notes && <ReviewRow label="Тэмдэглэл" value={notes} />}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Төсөөлөл нийт үнэ</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: O }}>₮{estimated.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Эцсийн үнийг менежер баталгаажуулсны дараа мэдэгдэнэ</div>
          </div>

          {error && (
            <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 16px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('file')} style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--text)' }}>← Буцах</button>
            <button onClick={handleSubmit} disabled={!canSubmit || submitting} style={{
              flex: 1, padding: '14px 24px', borderRadius: 10, border: 'none',
              background: canSubmit && !submitting ? O : '#ccc', color: '#fff',
              fontSize: 15, fontWeight: 700, cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
            }}>
              {submitting ? 'Илгээж байна...' : 'Захиалга илгээх'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--text3)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
    </div>
  )
}
