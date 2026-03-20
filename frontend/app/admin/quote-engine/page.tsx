'use client'

import { useState } from 'react'

type QuoteResponse = {
  product_type: string
  unit_price: number
  total: number
  total_vat?: number
  quantity: number
  area_m2?: number
  vat_percent?: number
  breakdown: { base_total: number; vat?: number }
  item: { name: string; category: string; unit: string }
}

const API = 'http://localhost:4000'

const PRODUCT_TYPES = [
  { value: 'banner', label: 'Хулдаас / Banner (m²)' },
  { value: 'uv', label: 'UV хэвлэл (m²)' },
  { value: 'board', label: 'Хавтан хэвлэл (m²)' },
  { value: 'sticker', label: 'Стикер (m²)' },
  { value: 'stand', label: 'Стенд (ш)' },
  { value: 'stand_base', label: 'Стендний хөл (ш)' },
  { value: 'flag', label: 'Туг (m²)' },
  { value: 'flag_base', label: 'Тугны суурь (ш)' },
  { value: 'flag_table', label: 'Ширээний туг (ш)' },
  { value: 'fabric', label: 'Даавуун хэвлэл (m²)' },
  { value: 'flag_premium', label: 'Туг далбаа premium (m²)' },
  { value: 'flag_promo', label: 'Г хэлбэрийн туг (ш)' },
  { value: 'flag_feather', label: 'Өдөн туг (ш)' },
]

export default function AdminQuoteEngine() {
  const [productType, setProductType] = useState('banner')
  const [width, setWidth] = useState<number | ''>('')
  const [height, setHeight] = useState<number | ''>('')
  const [quantity, setQuantity] = useState(1)
  const [applyVat, setApplyVat] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QuoteResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload: any = {
        product_type: productType,
        quantity,
        apply_vat: applyVat,
      }
      if (width && height) {
        payload.width_mm = Number(width)
        payload.height_mm = Number(height)
      }
      const res = await fetch(`${API}/pricing-catalog/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as QuoteResponse
      setResult(data)
    } catch (err: any) {
      setError(err?.message || 'Алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 16 }}>
        Quote Engine (Pricing Catalog)
      </h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Бүх төрлийн хэвлэлийн тарифийг backend дахь <code>pricing-catalog</code> API ашиглан алдаагүй бодно.
      </p>

      <form onSubmit={handleSubmit} style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        background: '#fff',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
      }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Бүтээгдэхүүний төрөл</span>
          <select value={productType} onChange={e => setProductType(e.target.value)} style={inputStyle}>
            {PRODUCT_TYPES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Тоо ширхэг</span>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value) || 1)}
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Өргөн (мм) — м² бүтээгдэхүүнд</span>
          <input
            type="number"
            min={1}
            value={width}
            onChange={e => setWidth(e.target.value === '' ? '' : Number(e.target.value))}
            style={inputStyle}
            placeholder="жишээ 2000"
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Өндөр (мм) — м² бүтээгдэхүүнд</span>
          <input
            type="number"
            min={1}
            value={height}
            onChange={e => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
            style={inputStyle}
            placeholder="жишээ 1000"
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={applyVat}
            onChange={e => setApplyVat(e.target.checked)}
          />
          НӨАТ тооцох
        </label>

        <div />

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Тооцоолж байна...' : 'Үнэ тооцоолох'}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: 16, color: '#b00020' }}>
          {error}
        </div>
      )}

      {result && (
        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: 22, color: '#FF6B35' }}>
            Нийт төлөх: {formatPrice(result.total)}₮
          </h3>
          <p style={{ margin: '4px 0 12px', color: '#777' }}>
            Нэгж үнэ: {formatPrice(result.unit_price)}₮ | Төрөл: {result.item.name}
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <tbody>
              <Row label="Quantity" value={`${result.quantity} (${result.item.unit})`} />
              {result.area_m2 && <Row label="Area (m²)" value={result.area_m2.toFixed(3)} />}
              <Row label="Base total" value={formatPrice(result.breakdown.base_total) + '₮'} />
              {result.breakdown.vat !== undefined && (
                <Row label={`НӨАТ (${result.vat_percent}%)`} value={formatPrice(result.breakdown.vat) + '₮'} />
              )}
              <Row label="Total" value={formatPrice(result.total) + '₮'} bold />
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr>
      <td style={{ padding: '4px 0', color: '#666' }}>{label}</td>
      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: bold ? 700 : 500 }}>{value}</td>
    </tr>
  )
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('mn-MN').format(Math.round(n))
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 14,
  outline: 'none',
}

const buttonStyle: React.CSSProperties = {
  gridColumn: '1 / span 2',
  padding: '12px 18px',
  border: 'none',
  borderRadius: 10,
  background: '#FF6B35',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
}

const cardStyle: React.CSSProperties = {
  marginTop: 24,
  background: '#fff',
  border: '1px solid #eee',
  borderRadius: 12,
  padding: 20,
  boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
}
