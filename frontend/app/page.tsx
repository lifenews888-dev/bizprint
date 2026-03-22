'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

function parseJsonItems(raw: any, fallback: any[]): any[] {
  if (Array.isArray(raw) && raw.length > 0) return raw
  if (typeof raw === 'string') { try { const p = JSON.parse(raw); if (Array.isArray(p)) return p } catch {} }
  return fallback
}

// Horizontal scrollable carousel — enhanced with badges, wishlist, hover CTA
function ProductCarousel({ items }: { items: any[] }) {
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set())
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  if (!items.length) return null

  const toggleWish = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation()
    setWishlisted(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {items.map((p: any, i) => {
          const id = String(p.id || i)
          const isHov = hoveredId === id
          const discount = p.sale_price && p.base_price && p.sale_price < p.base_price
            ? Math.round((1 - p.sale_price / p.base_price) * 100) : null
          const price = p.sale_price ?? p.basePrice ?? p.base_price
          return (
            <a key={id} href={`/shop/${p.slug || p.id}`}
              style={{ flexShrink: 0, width: 210, textDecoration: 'none', color: 'inherit', background: '#fff', borderRadius: 12, border: '1px solid #EBEBEB', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s', position: 'relative', boxShadow: isHov ? '0 6px 20px rgba(0,0,0,0.10)' : 'none', transform: isHov ? 'translateY(-2px)' : 'none' }}
              onMouseEnter={() => setHoveredId(id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Image */}
              <div style={{ height: 160, background: '#F5F5F0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {p.imageUrl || p.image
                  ? <img src={p.imageUrl || p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 40 }}>{p.icon || '🖨️'}</span>}
                {/* Discount badge */}
                {discount && <div style={{ position: 'absolute', top: 8, left: 8, background: '#E53E3E', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, zIndex: 2 }}>-{discount}%</div>}
                {/* Wishlist */}
                <button onClick={e => toggleWish(e, id)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.92)', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, boxShadow: '0 1px 4px rgba(0,0,0,0.12)', zIndex: 2 }}>
                  {wishlisted.has(id) ? '❤️' : '🤍'}
                </button>
                {/* Hover CTA */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#FF6B00', color: '#fff', fontSize: 13, fontWeight: 700, textAlign: 'center', padding: '10px 0', transform: isHov ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.2s ease', zIndex: 2 }}>
                  Захиалах →
                </div>
              </div>
              {/* Info */}
              <div style={{ padding: '12px 14px' }}>
                {p.vendor_name && <div style={{ fontSize: 11, color: '#AAA', marginBottom: 2 }}>{p.vendor_name}</div>}
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                {/* Stars */}
                {p.rating != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 5 }}>
                    {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 11, color: s <= Math.round(p.rating) ? '#F59E0B' : '#DDD' }}>★</span>)}
                    <span style={{ fontSize: 11, color: '#999', marginLeft: 3 }}>{Number(p.rating).toFixed(1)}</span>
                  </div>
                )}
                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {price != null && <div style={{ fontSize: 14, fontWeight: 700, color: '#FF6B00' }}>₮{Number(price).toLocaleString()}+</div>}
                  {discount && p.base_price && <div style={{ fontSize: 12, color: '#BBB', textDecoration: 'line-through' }}>₮{Number(p.base_price).toLocaleString()}</div>}
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

function BannerItem({ b, style }: { b: any; style: React.CSSProperties }) {
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', position: 'relative', ...style }}>
      {b.imageUrl ? (
        <img src={b.imageUrl} alt={b.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF6B00 0%, #e05500 100%)' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
      <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
        {b.title && <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.3 }}>{b.title}</div>}
        {b.link && (
          <a href={b.link} style={{ display: 'inline-block', padding: '7px 18px', background: '#FF6B00', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            {b.buttonText || 'Дэлгэрэнгүй'} →
          </a>
        )}
      </div>
    </div>
  )
}

function DefaultHero({ s }: { s: Record<string, any> }) {
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', position: 'relative', height: '100%', background: 'linear-gradient(135deg, #FF6B00 0%, #c94d00 100%)' }}>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: '50%', left: 36, transform: 'translateY(-50%)', maxWidth: 420, zIndex: 2 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Print Industry Platform
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1.2, margin: '0 0 14px', letterSpacing: '-0.5px' }}>
          {s.hero_title || 'Хэвлэлийн үйлчилгээ — хурдан, ухаалаг'}
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: '0 0 24px' }}>
          {s.hero_subtitle || 'AI-тай үнэ тооцоолол. Бүтээгдэхүүн сонгоод шууд захиал.'}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={s.hero_cta_primary_url || '/shop'} style={{ padding: '12px 28px', background: '#fff', color: '#FF6B00', borderRadius: 9, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
            {s.hero_cta_primary_text || 'Захиалга эхлэх'}
          </a>
          <a href="#how-it-works" style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 9, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            Хэрхэн ажилладаг вэ
          </a>
        </div>
      </div>
    </div>
  )
}

function HowItWorks() {
  const steps = [
    { icon: '🛒', title: 'Бүтээгдэхүүн сонгоно', desc: 'Дэлгүүрээс хэвлэлийн бүтээгдэхүүн сонгож сагсанд нэмнэ' },
    { icon: '📤', title: 'Файл оруулна', desc: 'PDF файлаа upload хийж AI-ээр шалгуулна' },
    { icon: '✅', title: 'Батлах — Хэвлэлт', desc: 'Үнийн санал авч, захиалга баталгаажуулна' },
  ]
  return (
    <section id="how-it-works" style={{ padding: '48px 0 32px' }}>
      <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, marginBottom: 32, color: 'var(--text, #111)' }}>Хэрхэн ажилладаг вэ?</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: 24, background: 'var(--surface, #fff)', borderRadius: 16, border: '1px solid var(--border, #E5E7EB)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{s.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FF6B00', marginBottom: 6 }}>Алхам {i + 1}</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--text, #111)' }}>{s.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text2, #888)', lineHeight: 1.5 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function HomePage() {
  const { settings } = useSiteSettings()
  const [banners, setBanners] = useState<any[]>([])
  const [current, setCurrent] = useState(0)
  const [categories, setCategories] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [productsByCategory, setProductsByCategory] = useState<Record<string, any[]>>({})
  const [templates, setTemplates] = useState<any[]>([])

  // Fetch banners, categories & featured templates
  useEffect(() => {
    apiFetch('/banners', { auth: false }).then(d => {
      const list = Array.isArray(d) ? d.filter((b: any) => b.isActive !== false) : []
      setBanners(list)
    }).catch(() => {})

    apiFetch('/templates?status=active&limit=8', { auth: false }).then(d => {
      setTemplates(Array.isArray(d) ? d : (d?.data ?? []))
    }).catch(() => {})

    apiFetch('/categories', { auth: false }).then(d => {
      if (Array.isArray(d)) {
        const cats = d.filter((c: any) => c.isActive !== false).slice(0, 8)
        setCategories(cats)
        if (cats.length > 0) setActiveCategory(String(cats[0].id))
      }
    }).catch(() => {})
  }, [])

  // Fetch products for all categories, batch setState into one update
  useEffect(() => {
    if (!categories.length) return
    const unfetched = categories.filter(cat => !productsByCategory[String(cat.id)])
    if (!unfetched.length) return
    Promise.all(
      unfetched.map(cat =>
        apiFetch(`/products?categoryId=${cat.id}&limit=10`)
          .then(r => r.json())
          .then(d => ({ id: String(cat.id), list: Array.isArray(d) ? d : (d?.data ?? []) }))
          .catch(() => ({ id: String(cat.id), list: [] as any[] }))
      )
    ).then(results => {
      setProductsByCategory(prev => {
        const next = { ...prev }
        results.forEach(({ id, list }) => { next[id] = list })
        return next
      })
    })
  }, [categories]) // eslint-disable-line react-hooks/exhaustive-deps

  const next = useCallback(() => setCurrent(c => (c + 1) % Math.max(banners.length, 1)), [banners.length])
  const prev = useCallback(() => setCurrent(c => (c - 1 + banners.length) % Math.max(banners.length, 1)), [banners.length])

  useEffect(() => {
    if (banners.length < 2) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [banners.length, next])

  const sideBanners = banners.slice(1, 3)

  return (
    <div style={{ fontFamily: F, background: '#F5F5F0', minHeight: '100vh' }}>

      {/* ═══ BANNER GRID — 2/3 + 1/3 ═══ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 20px 0' }}>

        {/* Slider dots for mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, height: 380 }} className="banner-grid">

          {/* Main banner */}
          <div style={{ position: 'relative', height: '100%' }}>
            {banners.length > 0 ? (
              <>
                {banners.map((b, i) => (
                  <div key={b.id || i} style={{
                    position: 'absolute', inset: 0,
                    opacity: i === current ? 1 : 0,
                    transition: 'opacity 0.5s ease',
                    pointerEvents: i === current ? 'auto' : 'none',
                  }}>
                    <BannerItem b={b} style={{ height: '100%' }} />
                  </div>
                ))}
                {banners.length > 1 && (
                  <>
                    <button onClick={prev} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.85)', border: 'none', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, color: '#333' }}>‹</button>
                    <button onClick={next} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.85)', border: 'none', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, color: '#333' }}>›</button>
                    <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 3 }}>
                      {banners.map((_, i) => (
                        <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? 20 : 7, height: 7, borderRadius: 4, background: i === current ? '#FF6B00' : 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <DefaultHero s={settings} />
            )}
          </div>

          {/* Side banners */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
            {sideBanners.length > 0 ? (
              sideBanners.map((b, i) => (
                <BannerItem key={i} b={b} style={{ flex: 1 }} />
              ))
            ) : (
              <>
                {/* Placeholder side panels */}
                <a href="/quote" style={{ flex: 1, borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 18, textDecoration: 'none', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 28 }}>🤖</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>AI Үнийн Тооцоо</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>PDF хуулаад шууд үнэ аваарай</div>
                </a>
                <a href="/shop" style={{ flex: 1, borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(135deg, #0d2818 0%, #1a4a2e 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 18, textDecoration: 'none', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 28 }}>🏭</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Хэвлэлийн Дэлгүүр</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Бүтээгдэхүүн захиалах</div>
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      <HowItWorks />

      {/* ═══ PRINT IT YOUR WAY — DUAL CTA ═══ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 20px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="print-cta-grid">
          <a href="/templates" style={{ borderRadius: 16, background: 'linear-gradient(135deg, #FF6B00 0%, #c94d00 100%)', padding: '32px 28px', textDecoration: 'none', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', minHeight: 190, transition: 'transform 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: 12 }}>🎨 хамгийн хурдан</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 10 }}>Онлайн дизайн хийх</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 20, flex: 1 }}>Мянга мянган бэлэн загвараас сонгоод өөрийн брэндэд тохируулаарай</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 9, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 600, width: 'fit-content' }}>Загвар сан харах →</div>
          </a>
          <a href="/quote" style={{ borderRadius: 16, background: 'linear-gradient(135deg, #111827 0%, #1e2a3a 100%)', padding: '32px 28px', textDecoration: 'none', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', minHeight: 190, transition: 'transform 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 12 }}>📤 файл бэлэн бол</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 10 }}>Файл байршуулах</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 20, flex: 1 }}>PDF, AI, EPS файлаа оруулаад AI-тай секундэд үнийн санал аваарай</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,107,0,0.2)', border: '1px solid rgba(255,107,0,0.4)', borderRadius: 9, padding: '10px 20px', color: '#FF6B00', fontSize: 13, fontWeight: 600, width: 'fit-content' }}>Үнэ тооцоолох →</div>
          </a>
        </div>
      </section>

      {/* ═══ PRODUCT TYPE ICON GRID ═══ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 20px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }} className="ptype-grid">
          {[
            { icon: '🪪', label: 'Нэрийн хуудас', url: '/shop?cat=business-card' },
            { icon: '📄', label: 'Флаер & Постер', url: '/shop?cat=flyer' },
            { icon: '🏷️', label: 'Стикер', url: '/shop?cat=sticker' },
            { icon: '🪧', label: 'Баннер', url: '/shop?cat=banner' },
            { icon: '📗', label: 'Ном & Каталог', url: '/shop?cat=book' },
            { icon: '🎨', label: 'Загвар сан', url: '/templates' },
          ].map(pt => (
            <a key={pt.label} href={pt.url} style={{ background: '#fff', border: '1px solid #EBEBEB', borderRadius: 12, padding: '16px 10px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'box-shadow 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,107,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
            >
              <div style={{ fontSize: 30 }}>{pt.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#444', textAlign: 'center', lineHeight: 1.3 }}>{pt.label}</div>
            </a>
          ))}
        </div>
      </section>

      {/* ═══ CATEGORY TABS ═══ */}
      {categories.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px 0' }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #EBEBEB', overflow: 'hidden' }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid #EBEBEB', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {categories.map(cat => {
                const id = String(cat.id)
                const isAct = activeCategory === id
                return (
                  <button
                    key={id}
                    onClick={() => setActiveCategory(id)}
                    style={{
                      flexShrink: 0, padding: '14px 20px', border: 'none',
                      borderBottom: isAct ? '2px solid #FF6B00' : '2px solid transparent',
                      background: 'transparent', cursor: 'pointer', fontFamily: F,
                      fontSize: 14, fontWeight: isAct ? 600 : 500,
                      color: isAct ? '#FF6B00' : '#555', transition: 'color 0.15s',
                      display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                    }}
                  >
                    {cat.icon && <span style={{ fontSize: 16 }}>{cat.icon}</span>}
                    {cat.name_mn || cat.name}
                  </button>
                )
              })}
            </div>

            {/* Category products carousel */}
            <div style={{ padding: '20px 20px 24px' }}>
              {activeCategory && productsByCategory[activeCategory] ? (
                productsByCategory[activeCategory].length > 0 ? (
                  <ProductCarousel items={productsByCategory[activeCategory]} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#999', fontSize: 14 }}>
                    Бүтээгдэхүүн олдсонгүй
                  </div>
                )
              ) : (
                <div style={{ display: 'flex', gap: 14 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ flexShrink: 0, width: 200, height: 220, background: '#F5F5F0', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ ALL CATEGORY CAROUSELS ═══ */}
      {categories.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px 0' }}>
          {categories.map(cat => {
            const id = String(cat.id)
            const items = productsByCategory[id] || []
            if (!items.length) return null
            return (
              <div key={id} style={{ marginBottom: 36 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.name_mn || cat.name}
                  </h2>
                  <a href={`/shop?category=${id}`} style={{ fontSize: 13, fontWeight: 500, color: '#FF6B00', textDecoration: 'none' }}>
                    Бүгдийг үзэх →
                  </a>
                </div>
                <ProductCarousel items={items} />
              </div>
            )
          })}
        </section>
      )}

      {/* ═══ TEMPLATE PREVIEW STRIP ═══ */}
      {templates.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: 0 }}>🎨 Бэлэн загварууд</h2>
              <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>Загвар сонгоод шууд захиалаарай</p>
            </div>
            <a href="/templates" style={{ fontSize: 13, fontWeight: 600, color: '#FF6B00', textDecoration: 'none' }}>Бүгдийг үзэх →</a>
          </div>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {templates.map((t: any, i) => {
              const catColors: Record<string, string> = { business_card: '#FF6B00', flyer: '#8B5CF6', banner: '#3B82F6', sticker: '#10B981', book: '#F59E0B' }
              const color = catColors[t.category] || '#FF6B00'
              return (
                <a key={t.id || i} href={`/templates?use=${t.id}`} style={{ flexShrink: 0, width: 180, textDecoration: 'none', color: 'inherit', background: '#fff', borderRadius: 12, border: '1px solid #EBEBEB', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
                >
                  <div style={{ height: 130, background: t.preview_url ? 'transparent' : `linear-gradient(135deg, ${color}22 0%, ${color}44 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {t.preview_url
                      ? <img src={t.preview_url} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 40 }}>🖨️</span>}
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, color, background: color + '15', padding: '2px 8px', borderRadius: 999, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.category || 'Загвар'}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name || 'Загвар'}</div>
                    {t.downloads != null && <div style={{ fontSize: 11, color: '#AAA', marginTop: 3 }}>{t.downloads} ашигласан</div>}
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      )}

      {/* ═══ HOW IT WORKS ═══ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '44px 20px 0' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 8px', textAlign: 'center' }}>Хэрхэн ажилладаг вэ?</h2>
        <p style={{ fontSize: 14, color: '#888', textAlign: 'center', margin: '0 0 32px' }}>4 алхамаар хэвлэлийн захиалгаа бэлэн болго</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, position: 'relative' }} className="how-steps">
          {[
            { step: '01', icon: '🛍️', title: 'Бүтээгдэхүүн сонгох', desc: 'Хэвлэлийн төрлөө сонгоод хэмжээ, тоо хэмжээгээ тохируулна', color: '#FF6B00', href: '/shop' },
            { step: '02', icon: '🎨', title: 'Дизайн / Файл', desc: 'Загвар сангаас сонгох эсвэл өөрийн PDF файлаа байршуулна', color: '#8B5CF6', href: '/templates' },
            { step: '03', icon: '🏭', title: 'Бид хэвлэнэ', desc: 'AI систем хамгийн тохиромжтой үйлдвэрт автоматаар дамжуулна', color: '#3B82F6', href: '/quote' },
            { step: '04', icon: '🚚', title: 'Хаалгаандаа авна', desc: 'Улаанбаатар даяар 24-48 цагт хүргэнэ', color: '#10B981', href: '/shop' },
          ].map((s, i, arr) => (
            <a key={s.step} href={s.href} style={{ background: '#fff', border: '1px solid #EBEBEB', borderRadius: 16, padding: '24px 18px', textAlign: 'center', textDecoration: 'none', color: 'inherit', position: 'relative', transition: 'box-shadow 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 20px ${s.color}22`; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
            >
              {i < arr.length - 1 && <div style={{ position: 'absolute', top: 38, left: 'calc(100% + 2px)', width: 'calc(100% - 4px)', height: 2, background: `linear-gradient(90deg, ${s.color}66, ${arr[i+1].color}66)`, zIndex: 0, pointerEvents: 'none' }} className="step-connector" />}
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: s.color + '15', border: `2px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px' }}>{s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: s.color, letterSpacing: '0.06em', marginBottom: 8 }}>АЛХАМ {s.step}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: '#777', lineHeight: 1.6 }}>{s.desc}</div>
            </a>
          ))}
        </div>
      </section>

      {/* ═══ SERVICE HIGHLIGHTS (CMS features_items) ═══ */}
      {settings.features_active !== 'false' && settings.features_active !== false && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px 0' }}>
          {(() => {
            const defaultItems = [
              { icon: '🤖', title: 'AI Үнийн Тооцоо', desc: 'PDF хуулаад шууд үнэ тооцоол', color: '#FF6B00' },
              { icon: '🚚', title: 'Хурдан Хүргэлт', desc: 'Улаанбаатар даяар 24 цагийн дотор', color: '#3B82F6' },
              { icon: '🎨', title: 'Онлайн Дизайн', desc: 'Бэлэн загвар ашиглан хэвлүүлэх', color: '#8B5CF6' },
              { icon: '🏭', title: 'Автомат Үйлдвэр', desc: 'Хамгийн тохиромжтой үйлдвэр сонгоно', color: '#10B981' },
            ]
            const items = parseJsonItems(settings.features_items, defaultItems)
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }} className="grid-3">
                {items.map((f: any) => {
                  const color = f.color || '#FF6B00'
                  return (
                    <a key={f.title} href={f.url || f.href || '#'} style={{
                      background: '#fff', border: '1px solid #EBEBEB', borderRadius: 12,
                      padding: '20px 22px', textDecoration: 'none', color: 'inherit',
                      display: 'flex', alignItems: 'flex-start', gap: 14, transition: 'box-shadow 0.2s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 4px 16px ${color}22`)}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                        {f.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 4 }}>{f.title}</div>
                        <div style={{ fontSize: 13, color: '#777', lineHeight: 1.5 }}>{f.desc}</div>
                      </div>
                    </a>
                  )
                })}
              </div>
            )
          })()}
        </section>
      )}

      {/* ═══ CTA ═══ */}
      {settings.cta_section_active !== false && settings.cta_section_active !== 'false' && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px 40px' }}>
          <div style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #e05500 100%)', borderRadius: 18, padding: '44px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -40, width: 150, height: 150, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
            <h2 style={{ fontSize: 30, fontWeight: 700, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.5px', position: 'relative' }}>
              {settings.cta_title || 'Хэвлэлээ захиалахад бэлэн үү?'}
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', margin: '0 0 28px', position: 'relative' }}>
              {settings.cta_subtitle || settings.hero_subtitle || 'PDF файлаа хуулаад хэдхэн секундэд үнийн санал аваарай'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
              <a href={settings.cta_button_url || '/quote'} style={{ padding: '12px 32px', background: '#fff', color: '#FF6B00', borderRadius: 9, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
                {settings.cta_button_text || 'Үнийн санал авах'}
              </a>
              <a href="/register" style={{ padding: '12px 32px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 9, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
                Бүртгүүлэх
              </a>
            </div>
          </div>
        </section>
      )}

      <style>{`
        @media (max-width: 900px) {
          .banner-grid { grid-template-columns: 1fr !important; height: auto !important; }
          .banner-grid > div:last-child { display: none !important; }
          .print-cta-grid { grid-template-columns: 1fr !important; }
          .ptype-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .how-steps { grid-template-columns: 1fr 1fr !important; }
          .step-connector { display: none !important; }
        }
        @media (max-width: 520px) {
          .ptype-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .how-steps { grid-template-columns: 1fr 1fr !important; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
