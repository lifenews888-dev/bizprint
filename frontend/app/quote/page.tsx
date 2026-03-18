'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const F = "'DM Sans','Segoe UI',system-ui"

interface Category { id: string; name: string; name_mn: string; icon?: string; parent_id?: string | null }
interface Product { id: string; name: string; name_mn?: string; base_price?: number; category: string }
interface ProductAttribute { id: string; name: string; name_mn?: string; type: string; options?: string[]; unit?: string; required: boolean; default_value?: string }
interface QuoteResult { product_name: string; quantity: number; unit_price: number; setup_fee: number; subtotal: number; platform_margin: number; delivery_fee: number; total: number; currency: string; valid_until: string; breakdown: Record<string,any> }

export default function QuotePage() {
  const [step, setStep] = useState<1|2|3|4>(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [attributes, setAttributes] = useState<ProductAttribute[]>([])
  const [selectedCatId, setSelectedCatId] = useState<string|null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string|null>(null)
  const [quantity, setQuantity] = useState(100)
  const [attrValues, setAttrValues] = useState<Record<string,string>>({})
  const [delivery, setDelivery] = useState(false)
  const [rush, setRush] = useState(false)
  const [result, setResult] = useState<QuoteResult|null>(null)
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', product_name: '', notes: '' })

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/categories/tree`)
      .then(r => r.json())
      .then(data => { setCategories(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedCatId) return
    fetch(`${API}/products?category_id=${selectedCatId}`)
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
    setSelectedProductId(null); setAttributes([]); setAttrValues({}); setResult(null)
  }, [selectedCatId])

  useEffect(() => {
    if (!selectedProductId) return
    fetch(`${API}/product-attributes?product_id=${selectedProductId}`)
      .then(r => r.json())
      .then(data => {
        const attrs = Array.isArray(data) ? data : []
        setAttributes(attrs)
        const defaults: Record<string,string> = {}
        attrs.forEach((a: ProductAttribute) => {
          if (a.default_value) defaults[a.name] = a.default_value
          else if (a.type === 'select' && a.options?.[0]) defaults[a.name] = a.options[0]
          else if (a.type === 'checkbox') defaults[a.name] = 'false'
        })
        setAttrValues(defaults)
      })
      .catch(() => setAttributes([]))
  }, [selectedProductId])

  async function calculate() {
    if (!selectedProductId) return
    setCalculating(true); setResult(null); setError(null)
    try {
      const res = await fetch(`${API}/pricing/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: selectedProductId, quantity, options: attrValues, delivery, rush }),
      })
      if (!res.ok) { const e = await res.json(); setError(e.message || 'Алдаа'); setCalculating(false); return }
      const data = await res.json()
      setResult(data)
      setStep(3)
    } catch { setError('Сүлжээнд алдаа гарлаа') }
    setCalculating(false)
  }

  async function saveQuote() {
    if (!result) return
    setSaving(true)
    const selectedProduct = products.find(p => p.id === selectedProductId)
    try {
      await fetch(`${API}/quotes-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name:    customer.name,
          customer_phone:   customer.phone,
          customer_email:   customer.email,
          product_name:     customer.product_name || selectedProduct?.name_mn || selectedProduct?.name || '',
          product_description: Object.entries(attrValues).map(([k,v]) => k + ': ' + v).join(', '),
          notes:            customer.notes,
          quantity,
          pages:            1,
          size:             attrValues['size'] || 'A4',
          width_mm:         210,
          height_mm:        297,
          paper_type:       attrValues['paper_type'] || attrValues['finish'] || '',
          paper_gsm:        Number(attrValues['paper_weight']) || 150,
          color_mode:       attrValues['color'] || 'color',
          sides:            attrValues['side'] === 'Хоёр тал' ? 'double' : 'single',
          finishing:        attrValues['finish'] || 'none',
          binding:          attrValues['binding'] || 'none',
          unit_price:       result.unit_price,
          total_price:      result.total,
          breakdown:        result.breakdown,
        }),
      })
      setSaved(true)
      setStep(4)
    } catch { setError('Хадгалахад алдаа гарлаа') }
    setSaving(false)
  }

  const selectedProduct = products.find(p => p.id === selectedProductId)
  const rootCats = categories.filter(c => !c.parent_id)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #F8F7F4)', fontFamily: F, color: 'var(--text, #0F0F0F)' }}>
      <nav style={{ borderBottom: '1px solid var(--border, #EBEBEB)', padding: '0 48px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface, #fff)', position: 'sticky', top: 0, zIndex: 10 }}>
        <a href="/" style={{ fontSize: 20, fontWeight: 800, textDecoration: 'none', color: 'var(--text, #0F0F0F)' }}><span style={{ color: '#FF6B35' }}>Biz</span>Print</a>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <a href="/products" style={{ color: 'var(--text2, #888)', textDecoration: 'none', fontSize: 14 }}>Бүтээгдэхүүн</a>
          <a href="/quote" style={{ color: '#FF6B35', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>Үнэ тооцоолол</a>
          <a href="/login" style={{ background: '#FF6B35', color: '#fff', padding: '7px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Нэвтрэх</a>
        </div>
      </nav>

      <div style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)', padding: '48px 48px 40px', color: '#fff' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
            AI-тай үнэ тооцоолол – 1 секундад
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 10px' }}>Хэвлэлийн үнээ тооцоол</h1>
          <p style={{ opacity: 0.85, fontSize: 16, margin: 0 }}>Параметрүүдийг тохируулбал манай систем эг одоо үнэ гаргана</p>
        </div>
      </div>

      <div style={{ background: 'var(--surface, #fff)', borderBottom: '1px solid var(--border, #EBEBEB)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 48px', display: 'flex' }}>
          {[
            { n: 1, label: 'Бүтээгдэхүүн' },
            { n: 2, label: 'Параметр' },
            { n: 3, label: 'Үнэ харах' },
            { n: 4, label: 'Баталгаажуулах' },
          ].map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => step > s.n && setStep(s.n as any)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0', background: 'none', border: 'none', cursor: step > s.n ? 'pointer' : 'default', borderBottom: step === s.n ? '2px solid #FF6B35' : '2px solid transparent', marginBottom: -1 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: step >= s.n ? '#FF6B35' : 'var(--border, #EBEBEB)', color: step >= s.n ? '#fff' : 'var(--text2, #888)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span style={{ fontSize: 13, fontWeight: step === s.n ? 600 : 400, color: step === s.n ? '#FF6B35' : 'var(--text2, #888)' }}>{s.label}</span>
              </button>
              {i < 3 && <div style={{ width: 32, height: 1, background: step > s.n ? '#FF6B35' : 'var(--border, #EBEBEB)', margin: '0 12px' }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 48px' }}>

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Юу хэвлэх вэ?</h2>
            <p style={{ color: 'var(--text2, #888)', fontSize: 14, marginBottom: 28 }}>Эхлээд ангилал, дараа нь бүтээгдэхүүнээс сонгоно уу</p>
            {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Уншиж байна...</div> : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 32 }}>
                  {rootCats.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCatId(cat.id)} style={{ padding: '20px 12px', borderRadius: 12, border: selectedCatId === cat.id ? '2px solid #FF6B35' : '1px solid var(--border, #EBEBEB)', background: selectedCatId === cat.id ? 'rgba(255,107,53,0.06)' : 'var(--surface, #fff)', cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{cat.icon || '📦'}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: selectedCatId === cat.id ? '#FF6B35' : 'var(--text, #0F0F0F)' }}>{cat.name_mn || cat.name}</div>
                    </button>
                  ))}
                </div>
                {selectedCatId && products.length > 0 && (
                  <>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Бүтээгдэхүүн сонгох</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                      {products.map(p => (
                        <button key={p.id} onClick={() => { setSelectedProductId(p.id); setStep(2) }} style={{ padding: '16px 18px', borderRadius: 12, border: selectedProductId === p.id ? '2px solid #FF6B35' : '1px solid var(--border, #EBEBEB)', background: selectedProductId === p.id ? 'rgba(255,107,53,0.06)' : 'var(--surface, #fff)', cursor: 'pointer', textAlign: 'left' }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: selectedProductId === p.id ? '#FF6B35' : 'var(--text)', marginBottom: 4 }}>{p.name_mn || p.name}</div>
                          {p.base_price && <div style={{ fontSize: 12, color: 'var(--text2)' }}>{Number(p.base_price).toLocaleString()}₮-аас</div>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>← Буцах</button>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{selectedProduct?.name_mn || selectedProduct?.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>Параметрүүдийг тохируулна уу</div>
                </div>
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>Тоо ширхэг</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} style={{ width: 100, padding: '10px 12px', background: 'var(--bg)', border: '2px solid #FF6B35', borderRadius: 8, fontSize: 18, fontWeight: 700, color: 'var(--text)', outline: 'none', textAlign: 'center' }} />
                  <span style={{ fontSize: 14, color: 'var(--text2)' }}>ширхэг</span>
                </div>
                <input type="range" min={10} max={5000} step={10} value={quantity} onChange={e => setQuantity(Number(e.target.value))} style={{ width: '100%', accentColor: '#FF6B35' }} />
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                  {[10,100,500,1000,5000].map(n => (
                    <button key={n} onClick={() => setQuantity(n)} style={{ background: quantity === n ? '#FF6B35' : 'var(--bg)', color: quantity === n ? '#fff' : 'var(--text2)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>{n}</button>
                  ))}
                </div>
              </div>

              {attributes.map(attr => (
                <div key={attr.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 24px', marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>{attr.name_mn || attr.name}{attr.required && <span style={{ color: '#FF6B35', fontSize: 11 }}> *</span>}</div>
                  {attr.type === 'select' && attr.options && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {attr.options.map(opt => (
                        <button key={opt} onClick={() => setAttrValues({ ...attrValues, [attr.name]: opt })} style={{ padding: '8px 16px', borderRadius: 8, border: attrValues[attr.name] === opt ? '2px solid #FF6B35' : '1px solid var(--border)', background: attrValues[attr.name] === opt ? 'rgba(255,107,53,0.08)' : 'var(--bg)', color: attrValues[attr.name] === opt ? '#FF6B35' : 'var(--text)', cursor: 'pointer', fontSize: 13 }}>{opt}</button>
                      ))}
                    </div>
                  )}
                  {attr.type === 'checkbox' && (
                    <button onClick={() => setAttrValues({ ...attrValues, [attr.name]: attrValues[attr.name] === 'true' ? 'false' : 'true' })} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <div style={{ width: 44, height: 24, borderRadius: 12, background: attrValues[attr.name] === 'true' ? '#FF6B35' : 'var(--border)', position: 'relative', transition: 'background 0.2s' }}>
                        <span style={{ position: 'absolute', top: 3, left: attrValues[attr.name] === 'true' ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                      </div>
                      <span style={{ fontSize: 13 }}>{attrValues[attr.name] === 'true' ? 'Тийм' : 'Үгүй'}</span>
                    </button>
                  )}
                </div>
              ))}

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 24px', marginBottom: 24 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Нэмэлт үйлчилгээ</div>
                {[
                  { key: 'delivery', label: 'Хүргэлт', desc: '+15,000₮', state: delivery, set: setDelivery },
                  { key: 'rush', label: 'Яаралтай', desc: '+35%', state: rush, set: setRush },
                ].map(opt => (
                  <button key={opt.key} onClick={() => opt.set(!opt.state)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, border: opt.state ? '2px solid #FF6B35' : '1px solid var(--border)', background: opt.state ? 'rgba(255,107,53,0.06)' : 'var(--bg)', cursor: 'pointer', width: '100%', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: opt.state ? '2px solid #FF6B35' : '2px solid var(--border)', background: opt.state ? '#FF6B35' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {opt.state && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: opt.state ? '#FF6B35' : 'var(--text)' }}>{opt.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: opt.state ? '#FF6B35' : 'var(--text2)' }}>{opt.desc}</span>
                  </button>
                ))}
              </div>

              {error && <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.3)', color: '#E24B4A', fontSize: 14, marginBottom: 16 }}>{error}</div>}

              <button onClick={calculate} disabled={!selectedProductId || calculating} style={{ width: '100%', padding: 16, background: !selectedProductId || calculating ? 'var(--border)' : '#FF6B35', color: !selectedProductId || calculating ? 'var(--text2)' : '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                {calculating ? 'Тооцоолж байна...' : 'Үнэ тооцоолох'}
              </button>
            </div>

            <div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, position: 'sticky', top: 80 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Захиалгын тойм</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--text2)' }}>Бүтээгдэхүүн</span><span style={{ fontWeight: 500 }}>{selectedProduct?.name_mn || selectedProduct?.name || '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--text2)' }}>Тоо ширхэг</span><span style={{ fontWeight: 500 }}>{quantity.toLocaleString()} ш</span></div>
                  {Object.entries(attrValues).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--text2)' }}>{k}</span><span style={{ fontWeight: 500 }}>{v === 'true' ? 'Тийм' : v === 'false' ? 'Үгүй' : v}</span></div>
                  ))}
                  {delivery && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--text2)' }}>Хүргэлт</span><span style={{ fontWeight: 500, color: '#FF6B35' }}>+15,000₮</span></div>}
                  {rush && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--text2)' }}>Яаралтай</span><span style={{ fontWeight: 500, color: '#FF6B35' }}>+35%</span></div>}
                </div>
                <div style={{ marginTop: 20, padding: 16, borderRadius: 10, background: 'rgba(255,107,53,0.06)', border: '1px dashed rgba(255,107,53,0.3)', textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#FF6B35', fontWeight: 600, marginBottom: 4 }}>AI тооцоолол</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>1 секундад үнэ гарна</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && result && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 32 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <button onClick={() => setStep(2)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>← Засах</button>
                <div style={{ fontWeight: 700, fontSize: 18 }}>Үнийн тооцоолол</div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
                <div style={{ background: 'linear-gradient(135deg, #FF6B35, #FF8C42)', padding: '20px 24px', color: '#fff' }}>
                  <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>{result.product_name}</div>
                  <div style={{ fontSize: 36, fontWeight: 800 }}>{Number(result.total).toLocaleString()}₮</div>
                  <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Нийт төлөх дүн</div>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  {[
                    { label: 'Тоо ширхэг', value: `${result.quantity} ширхэг` },
                    { label: 'Нэгж үнэ', value: `${Number(result.unit_price).toLocaleString()}₮` },
                    { label: 'Нийт дүн', value: `${Number(result.subtotal).toLocaleString()}₮` },
                    { label: 'Платформ шимтгэл', value: `${Number(result.platform_margin).toLocaleString()}₮` },
                    { label: 'Хүргэлт', value: `${Number(result.delivery_fee).toLocaleString()}₮` },
                  ].map((row, i, arr) => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ fontSize: 14, color: 'var(--text2)' }}>{row.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, marginTop: 8, borderTop: '2px solid var(--border)' }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>Нийт төлөх</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#FF6B35' }}>{Number(result.total).toLocaleString()}₮</span>
                  </div>
                  {result.valid_until && <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.08)', fontSize: 12, color: '#10B981', fontWeight: 500 }}>Үнэ хүчинтэй: {new Date(result.valid_until).toLocaleDateString('mn-MN')} хүртэл</div>}
                </div>
              </div>

              {/* Customer form */}
              <div style={{ background: 'var(--surface)', border: '2px solid #FF6B35', borderRadius: 16, padding: '24px' }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Үнийн санал авах</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Мэдээллийг оруулбал имэйлээр үнийн санал очно</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Нэр *</label>
                    <input value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} placeholder="Таны нэр" style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' as any }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Утас *</label>
                    <input value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} placeholder="+976 XXXX-XXXX" style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' as any }} />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Имэйл *</label>
                  <input type="email" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} placeholder="example@email.com" style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' as any }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Бүтээгдэхүүний нэр (заавал биш)</label>
                  <input value={customer.product_name} onChange={e => setCustomer({ ...customer, product_name: e.target.value })} placeholder="Жишээ: Компанийн каталог 2026" style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' as any }} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Нэмэлт тэмдэглэл</label>
                  <textarea value={customer.notes} onChange={e => setCustomer({ ...customer, notes: e.target.value })} placeholder="Нэмэлт хүсэлт, тайлбар..." rows={3} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', resize: 'vertical' as any, boxSizing: 'border-box' as any }} />
                </div>
                {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(226,75,74,0.08)', color: '#E24B4A', fontSize: 13, marginBottom: 16 }}>{error}</div>}
                <button onClick={saveQuote} disabled={!customer.name || !customer.phone || !customer.email || saving}
                  style={{ width: '100%', padding: 16, background: !customer.name || !customer.phone || !customer.email || saving ? 'var(--border)' : '#FF6B35', color: !customer.name || !customer.phone || !customer.email || saving ? 'var(--text2)' : '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Илгээж байна...' : 'Үнийн санал авах →'}
                </button>
              </div>
            </div>

            <div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, position: 'sticky', top: 80 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Захиалгын тойм</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--text2)' }}>Бүтээгдэхүүн</span><span style={{ fontWeight: 500 }}>{result.product_name}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--text2)' }}>Тоо ширхэг</span><span style={{ fontWeight: 500 }}>{quantity.toLocaleString()} ш</span></div>
                  {Object.entries(attrValues).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--text2)' }}>{k}</span><span style={{ fontWeight: 500 }}>{v === 'true' ? 'Тийм' : v === 'false' ? 'Үгүй' : v}</span></div>
                  ))}
                </div>
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>Нийт</span>
                    <span style={{ fontSize: 24, fontWeight: 800, color: '#FF6B35' }}>{Number(result.total).toLocaleString()}₮</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 - Success */}
        {step === 4 && (
          <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' as any, padding: '40px 0' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>✓</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, color: '#10B981' }}>Амжилттай илгээгдлээ!</h2>
            <p style={{ fontSize: 16, color: 'var(--text2)', marginBottom: 8 }}>Үнийн санал таны имэйл хаяг руу илгээгдлээ.</p>
            <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 32 }}>Үнэ 3 хоног хүчинтэй байна. Захиалга өгөхөд манайтай холбогдоно уу.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => { setStep(1); setResult(null); setSaved(false); setCustomer({ name:'', phone:'', email:'', product_name:'', notes:'' }) }}
                style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 14 }}>
                Дахин тооцоолох
              </button>
              <a href="tel:+97699XXXXXX" style={{ padding: '12px 24px', borderRadius: 12, background: '#FF6B35', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
                Утсаар холбогдох
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}