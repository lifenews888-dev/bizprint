'use client'

import { useState, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PricingItem {
  category:   string
  name:       string
  unit:       'pcs' | 'm2' | 'm' | 'sheet'
  price:      number
  price_vat:  number | null
  size_label?: string
  material?:  string
}

interface QuoteResponse {
  product_type: string
  unit_price:   number
  total:        number
  total_vat?:   number
  quantity:     number
  area_m2?:     number
  vat_percent?: number
  breakdown:    { base_total: number; vat?: number; vat_mode?: string }
  item:         PricingItem
}

// ─── Category labels ──────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  banner:            'Хулдаас / Banner (м²)',
  uv:                'UV хэвлэл',
  board:             'Хавтан хэвлэл (м²)',
  sticker:           'Стикер (м²)',
  stand:             'Стенд (ш)',
  stand_base:        'Стендний хөл (ш)',
  flag:              'Туг (м²)',
  flag_base:         'Тугны суурь / иш',
  flag_table:        'Ширээний туг (ш)',
  flag_table_premium:'Ширээний туг premium (ш)',
  flag_wall:         'Ханын туг (ш)',
  flag_premium:      'Туг далбаа premium',
  flag_promo:        'Г хэлбэрийн туг (ш)',
  flag_feather:      'Өдөн туг (ш)',
  flag_misc:         'Дарцаг (ш)',
  fabric:            'Даавуун хэвлэл (м²)',
}

const API = 'http://localhost:4000'
const fmt = (n: number) => new Intl.NumberFormat('mn-MN').format(Math.round(n))

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminQuoteEngine() {
  const [categories, setCategories]   = useState<string[]>([])
  const [catItems,   setCatItems]     = useState<PricingItem[]>([])
  const [category,   setCategory]     = useState('')
  const [selectedItem, setSelectedItem] = useState<PricingItem | null>(null)

  const [width,    setWidth]    = useState<number | ''>('')
  const [height,   setHeight]   = useState<number | ''>('')
  const [quantity, setQuantity] = useState(1)
  const [applyVat, setApplyVat] = useState(true)

  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState<QuoteResponse | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [reloading, setReloading] = useState(false)

  // ── Load all categories on mount ──
  useEffect(() => {
    fetch(`${API}/pricing-catalog/categories`)
      .then(r => r.json())
      .then((data: { category: string }[]) => {
        setCategories(data.map(d => d.category))
        if (data.length) setCategory(data[0].category)
      })
      .catch(() => {})
  }, [])

  // ── Load items when category changes ──
  useEffect(() => {
    if (!category) return
    fetch(`${API}/pricing-catalog/items?category=${encodeURIComponent(category)}`)
      .then(r => r.json())
      .then((items: PricingItem[]) => {
        setCatItems(items)
        setSelectedItem(items[0] ?? null)
        setResult(null)
      })
      .catch(() => setCatItems([]))
  }, [category])

  const isM2 = selectedItem?.unit === 'm2'

  // ── Calculate ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedItem) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload: Record<string, any> = {
        product_type: category,
        item_name:    selectedItem.name,
        quantity,
        apply_vat:    applyVat,
      }
      if (isM2 && width && height) {
        payload.width_mm  = Number(width)
        payload.height_mm = Number(height)
      }
      const res = await fetch(`${API}/pricing-catalog/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      setResult(await res.json() as QuoteResponse)
    } catch (err: any) {
      setError(err?.message || 'Алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  // ── Reload catalog ──
  async function handleReload() {
    setReloading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/pricing-catalog/reload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      alert(`Каталог шинэчлэгдлээ — ${data.items} бүтээгдэхүүн`)
    } catch {
      alert('Шинэчлэх үед алдаа гарлаа')
    } finally {
      setReloading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Рекламны үнэ тооцоолол</h1>
          <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>
            catalog.manual.json → pricing-catalog API
          </p>
        </div>
        <button onClick={handleReload} disabled={reloading} style={{
          padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB',
          background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          color: '#555',
        }}>
          {reloading ? '⏳ Шинэчилж байна...' : '🔄 Каталог шинэчлэх'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>

          {/* Category */}
          <Field label="Ангилал">
            <select value={category} onChange={e => setCategory(e.target.value)} style={inputSt}>
              {categories.map(c => (
                <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
              ))}
            </select>
          </Field>

          {/* Item within category */}
          {catItems.length > 0 && (
            <Field label={`Материал / загвар (${catItems.length} сонголт)`}>
              <select
                value={selectedItem?.name ?? ''}
                onChange={e => setSelectedItem(catItems.find(i => i.name === e.target.value) ?? null)}
                style={inputSt}
              >
                {catItems.map(item => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                    {item.unit === 'm2' ? ` — ${fmt(item.price)}₮/м²` : ` — ${fmt(item.price)}₮/ш`}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {/* Dimensions — only for m² items */}
          {isM2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Өргөн (мм)">
                <input type="number" min={1} value={width}
                  onChange={e => setWidth(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="жишээ 2000" style={inputSt} />
              </Field>
              <Field label="Өндөр (мм)">
                <input type="number" min={1} value={height}
                  onChange={e => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="жишээ 1000" style={inputSt} />
              </Field>
              {width && height && (
                <div style={{ gridColumn: '1/3', fontSize: 12, color: '#888', marginTop: -4 }}>
                  Нэгжийн талбай: {((Number(width)/1000)*(Number(height)/1000)).toFixed(3)} м²
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          <Field label="Тоо ширхэг">
            <input type="number" min={1} value={quantity}
              onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              style={inputSt} />
          </Field>

          {/* VAT toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 20 }}>
            <input type="checkbox" checked={applyVat} onChange={e => setApplyVat(e.target.checked)} />
            <span style={{ fontSize: 14 }}>НӨАТ тооцох (10%)</span>
          </label>

          <button type="submit" disabled={loading || !selectedItem} style={{
            width: '100%', padding: '12px', border: 'none', borderRadius: 10,
            background: loading || !selectedItem ? '#E5E7EB' : '#FF6B35',
            color: loading || !selectedItem ? '#999' : '#fff',
            fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}>
            {loading ? '⏳ Тооцоолж байна...' : '🧮 Үнэ тооцоолох'}
          </button>

          {error && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', color: '#b91c1c', fontSize: 13 }}>
              {error}
            </div>
          )}
        </form>

        {/* ── Result panel ── */}
        <div>
          {result ? (
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
              {/* Total header */}
              <div style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)', padding: '20px 24px', color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>{result.item.name}</div>
                <div style={{ fontSize: 36, fontWeight: 800 }}>{fmt(result.total)}₮</div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>
                  {result.vat_percent
                    ? (result.breakdown.vat_mode === 'included'
                        ? `НӨАТ багтсан (${result.vat_percent}%)`
                        : `НӨАТ-тай нийт (${result.vat_percent}%)`)
                    : 'НӨАТ-гүй нийт'}
                </div>
              </div>

              {/* Breakdown */}
              <div style={{ padding: '20px 24px' }}>
                {[
                  { label: 'Материал',    value: result.item.name },
                  { label: 'Нэгж үнэ',    value: `${fmt(result.unit_price)}₮/${result.item.unit === 'm2' ? 'м²' : 'ш'}` },
                  result.area_m2 != null
                    ? { label: 'Нийт талбай', value: `${result.area_m2.toFixed(3)} м²` }
                    : null,
                  { label: 'Тоо ширхэг',  value: `${result.quantity} ш` },
                  { label: 'НӨАТ-гүй дүн', value: `${fmt(result.breakdown.base_total)}₮` },
                  result.breakdown.vat != null
                    ? { label: `НӨАТ ${result.breakdown.vat_mode === 'included' ? '(багтсан)' : '(+10%)'}`,
                        value: `${fmt(result.breakdown.vat)}₮` }
                    : null,
                ].filter(Boolean).map((row, i, arr) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '9px 0',
                    borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none',
                  }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>{row!.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{row!.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, marginTop: 8, borderTop: '2px solid #E5E7EB' }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>Нийт төлөх</span>
                  <span style={{ fontWeight: 800, fontSize: 22, color: '#FF6B35' }}>{fmt(result.total)}₮</span>
                </div>
              </div>
            </div>
          ) : (
            /* Placeholder when no result yet */
            <div style={{
              background: '#fff', border: '1px dashed #E5E7EB', borderRadius: 12,
              padding: 40, textAlign: 'center', color: '#9CA3AF',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🧮</div>
              <div style={{ fontWeight: 600 }}>Зүүн талын маягтыг бөглөн</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>үнэ тооцоолно</div>
            </div>
          )}

          {/* Selected item info card */}
          {selectedItem && (
            <div style={{ marginTop: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 18px', fontSize: 13 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#374151' }}>Сонгосон бүтээгдэхүүн</div>
              <Row label="Нэр"      value={selectedItem.name} />
              <Row label="Нэгж"     value={selectedItem.unit === 'm2' ? 'м² (талбайгаар)' : 'ш (ширхэгээр)'} />
              <Row label="Үнэ"      value={`${fmt(selectedItem.price)}₮${selectedItem.unit === 'm2' ? '/м²' : '/ш'}`} />
              {selectedItem.price_vat !== null && (
                <Row
                  label="НӨАТ-тай"
                  value={
                    selectedItem.price_vat === selectedItem.price
                      ? `${fmt(selectedItem.price_vat)}₮ (аль хэдийн багтсан)`
                      : `${fmt(selectedItem.price_vat)}₮`
                  }
                />
              )}
              {selectedItem.material && <Row label="Материал" value={selectedItem.material} />}
              {selectedItem.size_label && <Row label="Хэмжээ" value={selectedItem.size_label} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#6B7280' }}>
      <span>{label}</span>
      <span style={{ fontWeight: 500, color: '#111' }}>{value}</span>
    </div>
  )
}

const inputSt: React.CSSProperties = {
  width: '100%', border: '1px solid #E5E7EB', borderRadius: 8,
  padding: '10px 12px', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', background: '#fff',
}
