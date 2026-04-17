'use client'

import { useState, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: number
  name: string
  icon?: string
  parent_id?: number | null
  children?: Category[]
}

interface Product {
  id: number
  name: string
  name_mn?: string
  base_price?: number
  category_id?: number
}

interface ProductAttribute {
  id: number
  name: string
  type: 'select' | 'number' | 'text' | 'boolean'
  options?: string[]
  unit?: string
  required: boolean
}

interface QuoteResult {
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  platform_margin: number
  delivery_fee: number
  total: number
  currency: string
  valid_until: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API = 'http://localhost:4000'

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuotePage() {
  const [step, setStep]               = useState<1 | 2 | 3>(1)

  // Data
  const [categories, setCategories]   = useState<Category[]>([])
  const [products, setProducts]       = useState<Product[]>([])
  const [attributes, setAttributes]   = useState<ProductAttribute[]>([])

  // Selections
  const [selectedCatId, setSelectedCatId]     = useState<number | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [quantity, setQuantity]               = useState(100)
  const [attrValues, setAttrValues]           = useState<Record<string, string>>({})
  const [delivery, setDelivery]               = useState(false)
  const [rush, setRush]                       = useState(false)

  // Result
  const [result, setResult]           = useState<QuoteResult | null>(null)
  const [loading, setLoading]         = useState(false)
  const [calculating, setCalculating] = useState(false)

  // ── Fetch categories on mount ──
  useEffect(() => {
    setLoading(true)
    fetch(`${API}/categories/tree`)
      .then(r => r.json())
      .then(data => { setCategories(data); setLoading(false) })
      .catch(() => setLoading(false))

    // Check URL param
    const params = new URLSearchParams(window.location.search)
    const pid = params.get('product_id')
    if (pid) setSelectedProductId(Number(pid))
  }, [])

  // ── Fetch products when category selected ──
  useEffect(() => {
    if (!selectedCatId) return
    fetch(`${API}/products?category_id=${selectedCatId}`)
      .then(r => r.json())
      .then(setProducts)
      .catch(() => setProducts([]))
    setSelectedProductId(null)
    setAttributes([])
    setAttrValues({})
    setResult(null)
  }, [selectedCatId])

  // ── Fetch attributes when product selected ──
  useEffect(() => {
    if (!selectedProductId) return
    Promise.all([
      fetch(`${API}/product-attributes?product_id=${selectedProductId}`).then(r => r.json()),
      fetch(`${API}/product-attributes?category_id=${selectedCatId}`).then(r => r.json()),
    ])
      .then(([prodAttrs, catAttrs]) => {
        const merged = [...(Array.isArray(prodAttrs) ? prodAttrs : []), ...(Array.isArray(catAttrs) ? catAttrs : [])]
        const unique = merged.filter((a, i, arr) => arr.findIndex(x => x.id === a.id) === i)
        setAttributes(unique)
        // Default values
        const defaults: Record<string, string> = {}
        unique.forEach((a: ProductAttribute) => {
          if (a.type === 'boolean') defaults[a.name] = 'false'
          if (a.type === 'select' && a.options?.[0]) defaults[a.name] = a.options[0]
        })
        setAttrValues(defaults)
      })
      .catch(() => setAttributes([]))
  }, [selectedProductId])

  // ── Calculate ──
  async function calculate() {
    if (!selectedProductId) return
    setCalculating(true)
    setResult(null)
    try {
      const res = await fetch(`${API}/pricing/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProductId,
          quantity,
          options: attrValues,
          delivery,
          rush,
        }),
      })
      const data = await res.json()
      setResult(data)
      setStep(3)
    } catch {}
    setCalculating(false)
  }

  const selectedProduct = products.find(p => p.id === selectedProductId)
  const rootCats = categories.filter(c => !c.parent_id)
  const catProducts = selectedCatId ? products : []

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg, #F8F7F4)',
      fontFamily: "'DM Sans', 'Segoe UI', system-ui",
      color: 'var(--text, #0F0F0F)',
    }}>

      {/* ── Nav ── */}
      <nav style={{
        borderBottom: '1px solid var(--border, #EBEBEB)',
        padding: '0 48px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface, #fff)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <a href="/" style={{
          fontSize: 20, fontWeight: 800, textDecoration: 'none',
          color: 'var(--text, #0F0F0F)',
        }}>
          <span style={{ color: '#FF6B35' }}>Biz</span>Print
        </a>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <a href="/products" style={{ color: 'var(--text2, #888)', textDecoration: 'none', fontSize: 14 }}>Бүтээгдэхүүн</a>
          <a href="/quote" style={{ color: '#FF6B35', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>Үнэ тооцоолол</a>
          <a href="/login" style={{
            background: '#FF6B35', color: '#fff',
            padding: '7px 18px', borderRadius: 8,
            textDecoration: 'none', fontSize: 13, fontWeight: 600,
          }}>Нэвтрэх</a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
        padding: '48px 48px 40px',
        color: '#fff',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.2)', borderRadius: 20,
            padding: '4px 14px', fontSize: 12, fontWeight: 600, marginBottom: 16,
          }}>
            ⚡ AI-тай үнэ тооцоолол — 1 секундэд
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 10px' }}>
            Хэвлэлийн үнээ тооцоол
          </h1>
          <p style={{ opacity: 0.85, fontSize: 16, margin: 0 }}>
            Ангилал сонгоод параметрүүдийг тохируулбал манай AI систем яг одоо үнэ гаргана
          </p>
        </div>
      </div>

      {/* ── Step indicator ── */}
      <div style={{ background: 'var(--surface, #fff)', borderBottom: '1px solid var(--border, #EBEBEB)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 48px', display: 'flex' }}>
          {[
            { n: 1, label: 'Бүтээгдэхүүн сонгох' },
            { n: 2, label: 'Параметр тохируулах' },
            { n: 3, label: 'Үнэ харах' },
          ].map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => step > s.n && setStep(s.n as 1 | 2 | 3)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '16px 0', background: 'none', border: 'none',
                  cursor: step > s.n ? 'pointer' : 'default',
                  borderBottom: step === s.n ? '2px solid #FF6B35' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: step >= s.n ? '#FF6B35' : 'var(--border, #EBEBEB)',
                  color: step >= s.n ? '#fff' : 'var(--text2, #888)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span style={{
                  fontSize: 13, fontWeight: step === s.n ? 600 : 400,
                  color: step === s.n ? '#FF6B35' : 'var(--text2, #888)',
                }}>
                  {s.label}
                </span>
              </button>
              {i < 2 && (
                <div style={{
                  width: 40, height: 1,
                  background: step > s.n ? '#FF6B35' : 'var(--border, #EBEBEB)',
                  margin: '0 12px',
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 48px' }}>

        {/* ════ STEP 1 — Category + Product ════ */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Юу хэвлэх вэ?</h2>
            <p style={{ color: 'var(--text2, #888)', fontSize: 14, marginBottom: 28 }}>
              Эхлээд ангилал, дараа нь бүтээгдэхүүнээ сонгоно уу
            </p>

            {/* Categories */}
            {loading ? (
              <div style={{ color: 'var(--text2, #888)', padding: 40, textAlign: 'center' }}>
                Уншиж байна...
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 12, marginBottom: 32,
                }}>
                  {rootCats.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCatId(cat.id)}
                      style={{
                        padding: '20px 12px',
                        borderRadius: 12,
                        border: selectedCatId === cat.id
                          ? '2px solid #FF6B35'
                          : '1px solid var(--border, #EBEBEB)',
                        background: selectedCatId === cat.id
                          ? 'rgba(255,107,53,0.06)'
                          : 'var(--surface, #fff)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{cat.icon || '📦'}</div>
                      <div style={{
                        fontSize: 13, fontWeight: 600,
                        color: selectedCatId === cat.id ? '#FF6B35' : 'var(--text, #0F0F0F)',
                      }}>
                        {cat.name}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Products */}
                {selectedCatId && (
                  <>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
                      Бүтээгдэхүүн сонгох
                    </h3>
                    {products.length === 0 ? (
                      <div style={{
                        padding: 32, textAlign: 'center',
                        color: 'var(--text2, #888)', fontSize: 14,
                        background: 'var(--surface, #fff)',
                        border: '1px solid var(--border, #EBEBEB)',
                        borderRadius: 12,
                      }}>
                        Энэ ангилалд бүтээгдэхүүн байхгүй байна
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 12, marginBottom: 32,
                      }}>
                        {products.map(p => (
                          <button
                            key={p.id}
                            onClick={() => { setSelectedProductId(p.id); setStep(2) }}
                            style={{
                              padding: '16px 18px',
                              borderRadius: 12,
                              border: selectedProductId === p.id
                                ? '2px solid #FF6B35'
                                : '1px solid var(--border, #EBEBEB)',
                              background: selectedProductId === p.id
                                ? 'rgba(255,107,53,0.06)'
                                : 'var(--surface, #fff)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s',
                            }}
                          >
                            <div style={{
                              fontSize: 14, fontWeight: 600,
                              color: selectedProductId === p.id ? '#FF6B35' : 'var(--text, #0F0F0F)',
                              marginBottom: 4,
                            }}>
                              {p.name_mn || p.name}
                            </div>
                            {p.base_price && (
                              <div style={{ fontSize: 12, color: 'var(--text2, #888)' }}>
                                {p.base_price.toLocaleString()}₮-аас
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ════ STEP 2 — Attributes + Quantity ════ */}
        {step === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32 }}>

            {/* Left — form */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    background: 'none', border: '1px solid var(--border, #EBEBEB)',
                    borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                    fontSize: 13, color: 'var(--text2, #888)',
                  }}
                >
                  ← Буцах
                </button>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>
                    {selectedProduct?.name_mn || selectedProduct?.name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2, #888)' }}>
                    Параметрүүдийг тохируулна уу
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div style={{
                background: 'var(--surface, #fff)',
                border: '1px solid var(--border, #EBEBEB)',
                borderRadius: 12, padding: '20px 24px', marginBottom: 16,
              }}>
                <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>
                  Тоо ширхэг
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                    style={{
                      width: 100, padding: '10px 12px',
                      background: 'var(--bg, #F8F7F4)',
                      border: '2px solid #FF6B35',
                      borderRadius: 8, fontSize: 18, fontWeight: 700,
                      color: 'var(--text, #0F0F0F)', outline: 'none',
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ fontSize: 14, color: 'var(--text2, #888)' }}>ширхэг</span>
                </div>
                <input
                  type="range" min={10} max={5000} step={10}
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#FF6B35' }}
                />
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 11, color: 'var(--text2, #888)', marginTop: 6,
                }}>
                  {[10, 100, 500, 1000, 5000].map(n => (
                    <button key={n}
                      onClick={() => setQuantity(n)}
                      style={{
                        background: quantity === n ? '#FF6B35' : 'var(--bg, #F8F7F4)',
                        color: quantity === n ? '#fff' : 'var(--text2, #888)',
                        border: '1px solid var(--border, #EBEBEB)',
                        borderRadius: 6, padding: '3px 8px',
                        cursor: 'pointer', fontSize: 11,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic attributes */}
              {attributes.length > 0 && attributes.map(attr => (
                <div key={attr.id} style={{
                  background: 'var(--surface, #fff)',
                  border: '1px solid var(--border, #EBEBEB)',
                  borderRadius: 12, padding: '18px 24px', marginBottom: 12,
                }}>
                  <div style={{
                    fontWeight: 600, fontSize: 14, marginBottom: 12,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {attr.name}
                    {attr.required && (
                      <span style={{ color: '#FF6B35', fontSize: 11 }}>*</span>
                    )}
                  </div>

                  {/* Select type */}
                  {attr.type === 'select' && attr.options && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {attr.options.map(opt => (
                        <button key={opt}
                          onClick={() => setAttrValues({ ...attrValues, [attr.name]: opt })}
                          style={{
                            padding: '8px 16px', borderRadius: 8,
                            border: attrValues[attr.name] === opt
                              ? '2px solid #FF6B35'
                              : '1px solid var(--border, #EBEBEB)',
                            background: attrValues[attr.name] === opt
                              ? 'rgba(255,107,53,0.08)'
                              : 'var(--bg, #F8F7F4)',
                            color: attrValues[attr.name] === opt
                              ? '#FF6B35'
                              : 'var(--text, #0F0F0F)',
                            cursor: 'pointer', fontSize: 13, fontWeight: 500,
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Number type */}
                  {attr.type === 'number' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="number"
                        value={attrValues[attr.name] || ''}
                        onChange={e => setAttrValues({ ...attrValues, [attr.name]: e.target.value })}
                        placeholder="Утга оруулах"
                        style={{
                          padding: '10px 12px',
                          background: 'var(--bg, #F8F7F4)',
                          border: '1px solid var(--border, #EBEBEB)',
                          borderRadius: 8, fontSize: 14, outline: 'none',
                          color: 'var(--text, #0F0F0F)',
                        }}
                      />
                      {attr.unit && (
                        <span style={{ color: 'var(--text2, #888)', fontSize: 13 }}>{attr.unit}</span>
                      )}
                    </div>
                  )}

                  {/* Text type */}
                  {attr.type === 'text' && (
                    <input
                      type="text"
                      value={attrValues[attr.name] || ''}
                      onChange={e => setAttrValues({ ...attrValues, [attr.name]: e.target.value })}
                      placeholder="Утга оруулах"
                      style={{
                        width: '100%', padding: '10px 12px',
                        background: 'var(--bg, #F8F7F4)',
                        border: '1px solid var(--border, #EBEBEB)',
                        borderRadius: 8, fontSize: 14, outline: 'none',
                        color: 'var(--text, #0F0F0F)', boxSizing: 'border-box',
                      }}
                    />
                  )}

                  {/* Boolean type */}
                  {attr.type === 'boolean' && (
                    <button
                      onClick={() => setAttrValues({
                        ...attrValues,
                        [attr.name]: attrValues[attr.name] === 'true' ? 'false' : 'true',
                      })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <div style={{
                        width: 44, height: 24, borderRadius: 12,
                        background: attrValues[attr.name] === 'true' ? '#FF6B35' : 'var(--border, #EBEBEB)',
                        position: 'relative', transition: 'background 0.2s',
                      }}>
                        <span style={{
                          position: 'absolute', top: 3,
                          left: attrValues[attr.name] === 'true' ? 22 : 2,
                          width: 18, height: 18, borderRadius: '50%', background: '#fff',
                          transition: 'left 0.2s',
                        }} />
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--text, #0F0F0F)' }}>
                        {attrValues[attr.name] === 'true' ? 'Тийм' : 'Үгүй'}
                      </span>
                    </button>
                  )}
                </div>
              ))}

              {/* Delivery + Rush */}
              <div style={{
                background: 'var(--surface, #fff)',
                border: '1px solid var(--border, #EBEBEB)',
                borderRadius: 12, padding: '18px 24px', marginBottom: 24,
              }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
                  Нэмэлт үйлчилгээ
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { key: 'delivery', label: 'Хүргэлт', desc: '+15,000₮', state: delivery, set: setDelivery },
                    { key: 'rush',     label: 'Яаралтай', desc: '+35%',     state: rush,     set: setRush     },
                  ].map(opt => (
                    <button key={opt.key}
                      onClick={() => opt.set(!opt.state)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', borderRadius: 10,
                        border: opt.state ? '2px solid #FF6B35' : '1px solid var(--border, #EBEBEB)',
                        background: opt.state ? 'rgba(255,107,53,0.06)' : 'var(--bg, #F8F7F4)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 4,
                          border: opt.state ? '2px solid #FF6B35' : '2px solid var(--border, #EBEBEB)',
                          background: opt.state ? '#FF6B35' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {opt.state && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                        </div>
                        <span style={{
                          fontSize: 14, fontWeight: 500,
                          color: opt.state ? '#FF6B35' : 'var(--text, #0F0F0F)',
                        }}>
                          {opt.label}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: opt.state ? '#FF6B35' : 'var(--text2, #888)',
                      }}>
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={calculate}
                disabled={!selectedProductId || calculating}
                style={{
                  width: '100%', padding: '16px',
                  background: !selectedProductId || calculating ? 'var(--border, #EBEBEB)' : '#FF6B35',
                  color: !selectedProductId || calculating ? 'var(--text2, #888)' : '#fff',
                  border: 'none', borderRadius: 12,
                  fontSize: 16, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {calculating ? '⚡ Тооцоолж байна...' : '🧮 Үнэ тооцоолох'}
              </button>
            </div>

            {/* Right — summary card */}
            <div>
              <div style={{
                background: 'var(--surface, #fff)',
                border: '1px solid var(--border, #EBEBEB)',
                borderRadius: 16, padding: '24px',
                position: 'sticky', top: 80,
              }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
                  Захиалгын тойм
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SummaryRow label="Бүтээгдэхүүн" value={selectedProduct?.name_mn || selectedProduct?.name || '—'} />
                  <SummaryRow label="Тоо ширхэг" value={`${quantity.toLocaleString()} ш`} />
                  {Object.entries(attrValues).map(([k, v]) => (
                    <SummaryRow key={k} label={k} value={v === 'true' ? 'Тийм' : v === 'false' ? 'Үгүй' : v} />
                  ))}
                  {delivery && <SummaryRow label="Хүргэлт" value="+15,000₮" accent />}
                  {rush && <SummaryRow label="Яаралтай" value="+35%" accent />}
                </div>

                <div style={{
                  marginTop: 20, padding: '16px', borderRadius: 10,
                  background: 'rgba(255,107,53,0.06)',
                  border: '1px dashed rgba(255,107,53,0.3)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 12, color: '#FF6B35', fontWeight: 600, marginBottom: 4 }}>
                    ⚡ AI тооцоолол
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2, #888)' }}>
                    1 секундэд үнэ гарна
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ STEP 3 — Result ════ */}
        {step === 3 && result && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    background: 'none', border: '1px solid var(--border, #EBEBEB)',
                    borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                    fontSize: 13, color: 'var(--text2, #888)',
                  }}
                >
                  ← Засах
                </button>
                <div style={{ fontWeight: 700, fontSize: 18 }}>Үнийн тооцоолол</div>
              </div>

              {/* Result card */}
              <div style={{
                background: 'var(--surface, #fff)',
                border: '1px solid var(--border, #EBEBEB)',
                borderRadius: 16, overflow: 'hidden',
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
                  padding: '20px 24px', color: '#fff',
                }}>
                  <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>
                    {result.product_name}
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 800 }}>
                    {Number(result.total).toLocaleString()}₮
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
                    Нийт төлөх дүн
                  </div>
                </div>

                <div style={{ padding: '20px 24px' }}>
                  {[
                    { label: 'Тоо ширхэг',         value: `${result.quantity} ширхэг` },
                    { label: 'Нэгж үнэ',            value: `${Number(result.unit_price).toLocaleString()}₮` },
                    { label: 'Нийт дүн',            value: `${Number(result.subtotal).toLocaleString()}₮` },
                    { label: 'Платформ шимтгэл',    value: `${Number(result.platform_margin).toLocaleString()}₮` },
                    { label: 'Хүргэлт',             value: `${Number(result.delivery_fee).toLocaleString()}₮` },
                  ].map((row, i, arr) => (
                    <div key={row.label} style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '10px 0',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border, #EBEBEB)' : 'none',
                    }}>
                      <span style={{ fontSize: 14, color: 'var(--text2, #888)' }}>{row.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', paddingTop: 16, marginTop: 8,
                    borderTop: '2px solid var(--border, #EBEBEB)',
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>Нийт төлөх</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#FF6B35' }}>
                      {Number(result.total).toLocaleString()}₮
                    </span>
                  </div>

                  {result.valid_until && (
                    <div style={{
                      marginTop: 16, padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(16,185,129,0.08)',
                      fontSize: 12, color: '#10B981', fontWeight: 500,
                    }}>
                      ✓ Үнэ хүчинтэй: {new Date(result.valid_until).toLocaleDateString('mn-MN')} хүртэл
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div>
              <div style={{
                background: 'var(--surface, #fff)',
                border: '1px solid var(--border, #EBEBEB)',
                borderRadius: 16, padding: '28px 24px',
                position: 'sticky', top: 80,
              }}>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
                  Захиалга өгөх үү?
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2, #888)', marginBottom: 24 }}>
                  Нэвтэрч орон захиалгаа баталгаажуулна уу
                </div>

                <a href="/order" style={{
                  display: 'block', textAlign: 'center',
                  background: '#FF6B35', color: '#fff',
                  padding: '14px', borderRadius: 12,
                  textDecoration: 'none', fontSize: 15, fontWeight: 700,
                  marginBottom: 12,
                }}>
                  Захиалга өгөх →
                </a>
                <button
                  onClick={() => { setStep(1); setResult(null) }}
                  style={{
                    width: '100%', padding: '12px',
                    background: 'none',
                    border: '1px solid var(--border, #EBEBEB)',
                    borderRadius: 12, cursor: 'pointer',
                    fontSize: 14, color: 'var(--text2, #888)',
                  }}
                >
                  Дахин тооцоолох
                </button>

                <div style={{
                  marginTop: 20, padding: '14px', borderRadius: 10,
                  background: 'var(--bg, #F8F7F4)',
                  fontSize: 12, color: 'var(--text2, #888)', lineHeight: 1.6,
                }}>
                  💡 Их тоогоор захиалахад хямдрал эдэлнэ. Борлуулагчтай холбоо барина уу.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', fontSize: 13,
    }}>
      <span style={{ color: 'var(--text2, #888)' }}>{label}</span>
      <span style={{ fontWeight: 500, color: accent ? '#FF6B35' : 'var(--text, #0F0F0F)' }}>
        {value}
      </span>
    </div>
  )
}
