'use client'
import React, { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const tok = () => localStorage.getItem('access_token') || localStorage.getItem('token') || ''
const getHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` })

const COLORS = ['#FF6B00', '#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#06B6D4', '#EF4444']
const ICONS = ['📱', '📸', '💼', '📄', '🖼️', '📅', '🎨', '📦']

export default function ServicesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'services' | 'templates'>('services')
  const [selectedCat, setSelectedCat] = useState('')
  const [orderForm, setOrderForm] = useState({ service: '', description: '', contact_phone: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/categories`).then(r => r.json()).catch(() => []),
      fetch(`${API}/products`).then(r => r.json()).catch(() => []),
      fetch(`${API}/templates?status=approved`).then(r => r.json()).catch(() => []),
      fetch(`${API}/settings/public`).then(r => r.json()).catch(() => ({})),
    ]).then(([cats, prods, tmpl, sets]) => {
      setCategories(Array.isArray(cats) ? cats.filter((c: any) => c.is_active !== false) : [])
      setProducts(Array.isArray(prods) ? prods.filter((p: any) => p.is_active !== false) : [])
      setTemplates(Array.isArray(tmpl) ? tmpl : [])
      setSettings(typeof sets === 'object' && sets ? sets : {})
    }).finally(() => setLoading(false))
  }, [])

  const filteredProducts = selectedCat ? products.filter(p => p.category === selectedCat || p.category_id === selectedCat) : products

  const submitOrder = async () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    if (!token) { window.location.href = '/login'; return }
    setSubmitting(true)
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      await fetch(`${API}/design-requests`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({
          customer_id: user.id, customer_name: user.full_name || user.email,
          customer_email: user.email, customer_phone: orderForm.contact_phone,
          product_name: orderForm.service, description: orderForm.description, type: 'design',
        }),
      })
      setSubmitted(true)
    } catch {} finally { setSubmitting(false) }
  }

  const heroTitle = settings.services_hero_title || 'Хэвлэл & Дизайн үйлчилгээ'
  const heroDesc = settings.services_hero_desc || 'Мэргэжлийн дизайнер + AI хэвлэлийн тооцоо — бүгд нэг платформд'
  const inp: React.CSSProperties = { width: '100%', padding: '12px 16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '14px', color: 'var(--text)', outline: 'none' }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontFamily: F }}><p style={{ color: 'var(--text2)' }}>Ачаалж байна...</p></div>

  return (
    <div style={{ fontFamily: F, color: 'var(--text)', background: 'var(--bg)' }}>

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #1a0a1f 0%, #0a0a1a 50%, #1a0a00 100%)', padding: '80px 24px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', left: '30%', width: '400px', height: '400px', background: 'rgba(139,92,246,0.08)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: '300px', height: '300px', background: 'rgba(255,107,0,0.06)', borderRadius: '50%', filter: 'blur(60px)' }} />
        <div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '44px', fontWeight: 700, color: '#F1F5F9', lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-2px' }}>{heroTitle}</h1>
          <p style={{ fontSize: '16px', color: '#888', lineHeight: 1.7, margin: '0 0 32px' }}>{heroDesc}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#order" style={{ padding: '14px 32px', background: '#8B5CF6', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '15px', fontWeight: 600 }}>Захиалга өгөх →</a>
            <a href="/quote" style={{ padding: '14px 32px', background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)', color: '#FF6B00', borderRadius: '10px', textDecoration: 'none', fontSize: '15px', fontWeight: 500 }}>AI Үнийн тооцоо</a>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ maxWidth: '900px', margin: '-40px auto 0', padding: '0 24px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }} className="grid-4">
          {[{ value: `${categories.length}`, label: 'Ангилал', color: '#8B5CF6' }, { value: `${products.length}`, label: 'Бүтээгдэхүүн', color: '#FF6B00' }, { value: `${templates.length}`, label: 'Бэлэн загвар', color: '#10B981' }, { value: '4.8★', label: 'Үнэлгээ', color: '#F59E0B' }].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TABS */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 0' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
          {(['services', 'templates'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 28px', borderRadius: '10px', border: tab === t ? 'none' : '1px solid var(--border)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', background: tab === t ? '#8B5CF6' : 'var(--surface)', color: tab === t ? '#fff' : 'var(--text2)' }}>
              {t === 'services' ? `Бүтээгдэхүүн (${products.length})` : `Бэлэн загвар (${templates.length})`}
            </button>
          ))}
        </div>
      </section>

      {/* CATEGORY FILTER */}
      {tab === 'services' && categories.length > 0 && (
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 20px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => setSelectedCat('')} style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 500, cursor: 'pointer', background: !selectedCat ? '#FF6B00' : 'var(--surface2)', color: !selectedCat ? '#fff' : 'var(--text2)' }}>Бүгд</button>
            {categories.map((c, i) => (
              <button key={c.id} onClick={() => setSelectedCat(c.name || c.slug || c.id)} style={{ padding: '7px 18px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 500, cursor: 'pointer', background: selectedCat === (c.name || c.slug || c.id) ? (c.color || COLORS[i % COLORS.length]) : 'var(--surface2)', color: selectedCat === (c.name || c.slug || c.id) ? '#fff' : 'var(--text2)' }}>
                {c.icon || ICONS[i % ICONS.length]} {c.name_mn || c.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* PRODUCTS GRID */}
      {tab === 'services' && (
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 60px' }}>
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text2)' }}><p>Бүтээгдэхүүн байхгүй</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }} className="grid-3">
              {filteredProducts.map((p, i) => {
                const color = COLORS[i % COLORS.length]
                const catObj = categories.find(c => c.name === p.category || c.slug === p.category)
                return (
                  <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = color + '60')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                    {p.thumbnail_url ? (
                      <div style={{ height: '160px', overflow: 'hidden' }}>
                        <img src={p.thumbnail_url.startsWith('http') ? p.thumbnail_url : `${API}${p.thumbnail_url}`} alt={p.name_mn || p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ height: '120px', background: `linear-gradient(135deg, ${color}15, ${color}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '40px', opacity: 0.4 }}>{catObj?.icon || ICONS[i % ICONS.length]}</span>
                      </div>
                    )}
                    <div style={{ padding: '18px' }}>
                      {catObj && <span style={{ fontSize: '11px', color: catObj.color || color, fontWeight: 500 }}>{catObj.name_mn || catObj.name}</span>}
                      <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '4px 0 6px' }}>{p.name_mn || p.name}</h3>
                      {p.description && <p style={{ fontSize: '12px', color: 'var(--text2)', margin: '0 0 12px', lineHeight: 1.5, overflow: 'hidden', maxHeight: '36px' }}>{p.description}</p>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '20px', fontWeight: 700, color }}>₮{Number(p.base_price || 0).toLocaleString()}</span>
                        <a href="/quote" style={{ padding: '6px 16px', background: color + '15', color, border: `1px solid ${color}30`, borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>Захиалах</a>
                      </div>
                      {p.lead_time_days > 0 && <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px' }}>Хугацаа: {p.lead_time_days} хоног</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* TEMPLATES GRID */}
      {tab === 'templates' && (
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 60px' }}>
          {templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text2)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🎨</div>
              <p>Бэлэн загвар удахгүй нэмэгдэнэ</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }} className="grid-3">
              {templates.map((t: any, i: number) => (
                <div key={t.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ height: '160px', background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}40, ${COLORS[(i+2) % COLORS.length]}20)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', opacity: 0.5 }}>🎨</div>
                  <div style={{ padding: '16px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>{t.name}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text2)', margin: '0 0 12px' }}>{t.category || 'Загвар'}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#FF6B00' }}>₮{Number(t.price || 0).toLocaleString()}</span>
                      <button style={{ padding: '6px 16px', background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>Авах</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ORDER FORM */}
      <section id="order" style={{ maxWidth: '700px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px', textAlign: 'center' }}>Дизайн захиалга</h2>
          <p style={{ fontSize: '13px', color: 'var(--text2)', textAlign: 'center', margin: '0 0 28px' }}>Мэдээллээ бөглөвөл дизайнер 24 цагт холбогдоно</p>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 8px' }}>Амжилттай!</h3>
              <p style={{ fontSize: '14px', color: 'var(--text2)' }}>Dashboard-аас хянаарай.</p>
              <a href="/dashboard" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 24px', background: '#8B5CF6', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Dashboard →</a>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', display: 'block', fontWeight: 500 }}>Бүтээгдэхүүн</label>
                  <select value={orderForm.service} onChange={e => setOrderForm({...orderForm, service: e.target.value})} style={inp}>
                    <option value="">-- Сонгоно уу --</option>
                    {products.map(p => <option key={p.id} value={p.name_mn || p.name}>{p.name_mn || p.name} — ₮{Number(p.base_price||0).toLocaleString()}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', display: 'block', fontWeight: 500 }}>Тайлбар</label>
                  <textarea value={orderForm.description} onChange={e => setOrderForm({...orderForm, description: e.target.value})} placeholder="Брэнд өнгө, лого, текст..." rows={4} style={{ ...inp, resize: 'vertical' as any }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', display: 'block', fontWeight: 500 }}>Утас</label>
                  <input value={orderForm.contact_phone} onChange={e => setOrderForm({...orderForm, contact_phone: e.target.value})} placeholder="99001122" style={inp} />
                </div>
              </div>
              <button onClick={submitOrder} disabled={submitting || !orderForm.service}
                style={{ width: '100%', marginTop: '24px', padding: '14px', background: orderForm.service ? '#8B5CF6' : '#666', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: orderForm.service ? 'pointer' : 'not-allowed' }}>
                {submitting ? 'Илгээж байна...' : 'Захиалга илгээх'}
              </button>
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 100px' }}>
        <div style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', borderRadius: '24px', padding: '60px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
          <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', margin: '0 0 12px', position: 'relative' }}>Print + Design = <span style={{ color: '#FCD34D' }}>BizPrint</span></h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', margin: '0 0 28px', position: 'relative' }}>{settings.services_cta_text || 'Хэвлэл + дизайн нэг газраас'}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
            <a href="/quote" style={{ padding: '14px 32px', background: '#fff', color: '#8B5CF6', borderRadius: '10px', textDecoration: 'none', fontSize: '15px', fontWeight: 700 }}>AI Үнийн тооцоо</a>
            <a href="#order" style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '15px', fontWeight: 500 }}>Дизайн захиалах</a>
          </div>
        </div>
      </section>
    </div>
  )
}
