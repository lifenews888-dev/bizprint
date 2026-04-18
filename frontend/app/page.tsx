'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

const API = 'http://localhost:4000'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

const STATS = [
  { label: 'Захиалга', target: 1240, suffix: '+', color: '#FF6B00' },
  { label: 'Хэрэглэгч', target: 860, suffix: '+', color: '#10B981' },
  { label: 'Үйлдвэр',   target: 3,    suffix: '+', color: '#3B82F6' },
  { label: 'Үнэлгээ',   target: 48,   suffix: '★', divisor: 10, color: '#F59E0B' },
]

const STEPS = [
  { n: '01', icon: '🖨️', title: 'Бүтээгдэхүүн сонгох', desc: 'Нэрийн хуудас, флаер, ном гэх мэт 20+ төрлөөс сонгоно' },
  { n: '02', icon: '💰', title: 'Шуурхай үнэ авах', desc: 'PDF хуулах эсвэл параметр оруулаад AI тооцооллоор шууд мэдэнэ' },
  { n: '03', icon: '✅', title: 'Онлайн захиалга өгөх', desc: 'QR, банкны шилжүүлэг, нэхэмжлэхийн аль ч аргаар төлнө' },
  { n: '04', icon: '🚀', title: 'Хүргэлт авах', desc: '3–7 хоногийн дотор хаяг руу чанартай хүргэнэ' },
]

const PRODUCTS = [
  { icon: '💼', name: 'Нэрийн хуудас',  price: '25,000₮~', href: '/shop', color: '#FF6B00', tag: 'Хамгийн их захиалга' },
  { icon: '📄', name: 'Флаер & Постер', price: '45,000₮~', href: '/shop', color: '#3B82F6', tag: '' },
  { icon: '🏷️', name: 'Наклейк',        price: '15,000₮~', href: '/shop', color: '#10B981', tag: '' },
  { icon: '📦', name: 'Хайрцаг & Уут',  price: '80,000₮~', href: '/shop', color: '#8B5CF6', tag: '' },
  { icon: '📚', name: 'Ном & Каталог',  price: '120,000₮~', href: '/shop', color: '#F59E0B', tag: '' },
  { icon: '🖼️', name: 'Баннер',         price: '60,000₮~', href: '/shop', color: '#EC4899', tag: '' },
  { icon: '📱', name: 'Сошиал дизайн',  price: '15,000₮~', href: '/services', color: '#06B6D4', tag: 'Шинэ' },
  { icon: '🗂️', name: 'Бусад хэвлэл',  price: 'Үнэ авах', href: '/quote', color: '#6366F1', tag: '' },
]

const REVIEWS = [
  {
    name: 'Б. Мөнхбаяр',
    role: 'Рестораны эзэн, Улаанбаатар',
    text: 'Нэрийн хуудас, меню хэвлүүлсэн. Чанар гайхалтай, хүргэлт маш хурдан байлаа. Дараа ч захиална.',
    stars: 5,
    color: '#FF6B00',
  },
  {
    name: 'О. Энхзул',
    role: 'Маркетингийн менежер',
    text: 'Хэвлэлийн компанитай биечлэн очих хэрэгтэй байсан. BizPrint-ээр онлайн захиалж болохоор цаг маш хэмнэгдлээ!',
    stars: 5,
    color: '#8B5CF6',
  },
  {
    name: 'Д. Баатарсүх',
    role: 'Дизайн студийн захирал',
    text: 'Харилцагч бүрийн хэвлэлийг BizPrint-р хийдэг болсон. Захиалгын систем, хяналт бүгд нэг дор байдаг нь давуу.',
    stars: 5,
    color: '#10B981',
  },
]

const COMBO = [
  {
    title: 'Эхлэгч багц',
    sub: 'Жижиг бизнест',
    items: ['Нэрийн хуудас 100ш хэвлэл', 'FB/IG постер 1ш дизайн', 'Story дизайн 1ш'],
    price: '45,000',
    save: '12,000',
    color: '#FF6B00',
  },
  {
    title: 'Бизнес багц',
    sub: 'Хамгийн их сонголт',
    items: ['Нэрийн хуудас + Флаер хэвлэл', 'Сошиал медиа постер 5ш', 'Story + Reels зураг 3ш', 'Брэндийн гарын авлага'],
    price: '180,000',
    save: '55,000',
    color: '#8B5CF6',
    popular: true,
  },
  {
    title: 'Сарын багц',
    sub: 'Тогтмол захиалагчид',
    items: ['Сар бүрийн 20 пост дизайн', 'Story 10ш / Reels cover 5ш', 'Контентийн хуваарь', 'Хэвлэлд 20% хямдрал'],
    price: '350,000',
    save: '100,000+',
    color: '#10B981',
  },
]

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [active, target, duration])
  return count
}

function StatItem({ stat, active }: { stat: typeof STATS[0]; active: boolean }) {
  const count = useCountUp(stat.target, active)
  const display = stat.divisor ? (count / stat.divisor).toFixed(1) : count.toLocaleString()
  return (
    <div style={{ textAlign: 'center', padding: '28px 16px' }}>
      <div style={{ fontSize: 44, fontWeight: 800, color: stat.color, letterSpacing: '-1px', lineHeight: 1 }}>
        {display}{stat.suffix}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 8, fontWeight: 500 }}>{stat.label}</div>
    </div>
  )
}

export default function HomePage() {
  const [banners, setBanners]           = useState<any[]>([])
  const [current, setCurrent]           = useState(0)
  const [categories, setCategories]     = useState<any[]>([])
  const [products, setProducts]         = useState<any[]>([])
  const [activeCategory, setActiveCat]  = useState<string>('all')
  const [prodLoading, setProdLoading]   = useState(false)
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  /* fetch banners + categories on mount */
  useEffect(() => {
    fetch(`${API}/banners`).then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d.filter((b: any) => b.isActive !== false) : []
      setBanners(list)
    }).catch(() => {})

    fetch(`${API}/categories`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) {
        const cats = d.filter((c: any) => c.isActive !== false)
        setCategories(cats)
      }
    }).catch(() => {})
  }, [])

  /* fetch products whenever active category changes */
  useEffect(() => {
    setProdLoading(true)
    const url = activeCategory === 'all'
      ? `${API}/products?limit=24`
      : `${API}/products?category_id=${activeCategory}&limit=24`
    fetch(url).then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d.filter((p: any) => p.isActive !== false) : (d?.data || [])
      setProducts(list)
    }).catch(() => setProducts([]))
    .finally(() => setProdLoading(false))
  }, [activeCategory])

  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true) }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const next = useCallback(() => setCurrent(c => (c + 1) % Math.max(banners.length, 1)), [banners.length])
  const prev = useCallback(() => setCurrent(c => (c - 1 + banners.length) % Math.max(banners.length, 1)), [banners.length])
  useEffect(() => {
    if (banners.length < 2) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [banners.length, next])

  return (
    <div style={{ fontFamily: F, color: 'var(--text)', background: 'var(--bg)' }}>

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      {banners.length > 0 ? (
        /* Admin-configured banner slider */
        <section style={{ position: 'relative', height: '520px', overflow: 'hidden' }}>
          {banners.map((b, i) => (
            <div key={b.id || i} style={{ position: 'absolute', inset: 0, transition: 'opacity 0.6s ease, transform 0.6s ease', opacity: i === current ? 1 : 0, transform: i === current ? 'scale(1)' : 'scale(1.05)' }}>
              {b.imageUrl
                ? <img src={b.imageUrl} alt={b.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,#0A0A0A,${['#1a0a00','#0a0a1a','#0a1a0a'][i%3]})` }} />}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.3) 100%)' }} />
              <div style={{ position: 'absolute', bottom: '25%', left: '6%', maxWidth: '550px', zIndex: 2 }}>
                <h2 style={{ fontSize: '42px', fontWeight: 700, color: '#fff', lineHeight: 1.15, margin: '0 0 14px', letterSpacing: '-1px' }}>{b.title || 'BizPrint'}</h2>
                {b.description && <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', margin: '0 0 24px', lineHeight: 1.6 }}>{b.description}</p>}
                {b.link && <a href={b.link} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: '#FF6B00', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>{b.buttonText || 'Дэлгэрэнгүй'} →</a>}
              </div>
            </div>
          ))}
          {banners.length > 1 && (
            <>
              <button onClick={prev} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>‹</button>
              <button onClick={next} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>›</button>
              <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 3 }}>
                {banners.map((_, i) => (<button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i === current ? '#FF6B00' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />))}
              </div>
            </>
          )}
        </section>
      ) : (
        /* Default hero — product-visual layout */
        <section style={{ background: 'linear-gradient(135deg,#0A0A0A 0%,#111 60%,#0a0a14 100%)', padding: '0', overflow: 'hidden', position: 'relative' }}>
          {/* Background glows */}
          <div style={{ position: 'absolute', top: '10%', left: '5%', width: '500px', height: '500px', background: 'rgba(255,107,0,0.07)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '0', right: '10%', width: '400px', height: '400px', background: 'rgba(59,130,246,0.06)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center', position: 'relative', zIndex: 1 }} className="grid-2">
            {/* Left */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.25)', borderRadius: '8px', padding: '5px 14px', marginBottom: '24px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#FF6B00', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '12px', color: '#FF6B00', fontWeight: 600 }}>Монголын хэвлэлийн платформ</span>
              </div>
              <h1 style={{ fontSize: '52px', fontWeight: 800, color: '#F1F5F9', lineHeight: 1.1, margin: '0 0 20px', letterSpacing: '-2px' }}>
                Хэвлэл захиалах<br/>
                <span style={{ color: '#FF6B00' }}>хэзээ ч энэ хялбар</span><br/>
                байгаагүй
              </h1>
              <p style={{ fontSize: '17px', color: '#888', lineHeight: 1.75, margin: '0 0 36px', maxWidth: '460px' }}>
                Үнэ авах, захиалга өгөх, хүргэлт хянах — бүгдийг онлайнаар. Хэвлэлийн компанид биечлэн очих шаардлагагүй.
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '36px' }}>
                <a href="/quote" style={{ padding: '15px 36px', background: '#FF6B00', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontSize: '16px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  Үнэ авах → <span style={{ fontSize: '13px', opacity: 0.8 }}>30 сек</span>
                </a>
                <a href="/shop" style={{ padding: '15px 36px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#F1F5F9', borderRadius: '12px', textDecoration: 'none', fontSize: '16px', fontWeight: 500 }}>
                  Бүтээгдэхүүн үзэх
                </a>
              </div>

              {/* Mini trust */}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {[
                  { icon: '✓', text: '3–7 хоногт хүргэлт' },
                  { icon: '✓', text: 'Онлайн төлбөр' },
                  { icon: '✓', text: 'Чанарын баталгаа' },
                ].map(t => (
                  <div key={t.text} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#666' }}>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>{t.icon}</span> {t.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — product cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { icon: '💼', name: 'Нэрийн хуудас', price: '25,000₮~', color: '#FF6B00', tag: '🔥 Хамгийн их' },
                { icon: '📄', name: 'Флаер & Постер', price: '45,000₮~', color: '#3B82F6', tag: '' },
                { icon: '🏷️', name: 'Наклейк & Стикер', price: '15,000₮~', color: '#10B981', tag: '' },
                { icon: '📦', name: 'Хайрцаг & Уут', price: '80,000₮~', color: '#8B5CF6', tag: '' },
              ].map(p => (
                <a key={p.name} href="/shop" style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px', padding: '20px', textDecoration: 'none', color: '#F1F5F9',
                  transition: 'all 0.2s', display: 'block', position: 'relative',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = p.color + '60' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
                  {p.tag && <div style={{ position: 'absolute', top: 10, right: 10, fontSize: '10px', background: p.color + '25', color: p.color, borderRadius: '99px', padding: '2px 8px', fontWeight: 600 }}>{p.tag}</div>}
                  <div style={{ fontSize: '28px', marginBottom: '10px' }}>{p.icon}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{p.name}</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: p.color }}>{p.price}</div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════ */}
      <section ref={statsRef} style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {STATS.map((stat, i) => (
            <div key={stat.label} style={{ borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <StatItem stat={stat} active={statsVisible} />
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <h2 style={{ fontSize: '34px', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-1px' }}>
            Захиалга өгөх нь <span style={{ color: '#FF6B00' }}>4 алхам</span>
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text2)', maxWidth: '440px', margin: '0 auto' }}>
            Бүртгэлгүйгээр ч үнэ авах боломжтой — дараа бүртгүүлээд захиалаарай
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px', position: 'relative' }} className="grid-4">
          {/* connecting line */}
          <div style={{ position: 'absolute', top: '36px', left: '12%', right: '12%', height: '2px', background: 'linear-gradient(to right, #FF6B00, #3B82F6, #10B981, #8B5CF6)', opacity: 0.2, zIndex: 0 }} className="hide-mobile" />
          {STEPS.map((s, i) => {
            const colors = ['#FF6B00','#3B82F6','#10B981','#8B5CF6']
            const c = colors[i]
            return (
              <div key={s.n} style={{ textAlign: 'center', padding: '0 8px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: c + '15', border: `2px solid ${c}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: c, letterSpacing: '0.1em', marginBottom: '6px' }}>АЛХАМ {s.n}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: 'var(--text)' }}>{s.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text2)', margin: 0, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            )
          })}
        </div>
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <a href="/quote" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 32px', background: '#FF6B00', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: 700 }}>
            Одоо эхлэх → үнэгүй үнэ авах
          </a>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PRODUCTS — category tabs + dynamic grid
      ══════════════════════════════════════════════ */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>Бид юу хэвлэдэг вэ?</h2>
              <p style={{ fontSize: '15px', color: 'var(--text2)', margin: 0 }}>Нэрийн хуудаснаас эхлэн том форматын хэвлэл хүртэл</p>
            </div>
            <a href="/shop" style={{ fontSize: '14px', color: '#FF6B00', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              Бүгдийг үзэх →
            </a>
          </div>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[{ id: 'all', name_mn: 'Бүгд', name: 'All', icon: '🗂️', color: '#FF6B00' }, ...categories].map((cat: any) => {
              const isActive = activeCategory === cat.id
              const color = cat.color || '#FF6B00'
              return (
                <button key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '99px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                    border: isActive ? `2px solid ${color}` : '1px solid var(--border)',
                    background: isActive ? color + '15' : 'var(--bg)',
                    color: isActive ? color : 'var(--text2)',
                    transition: 'all 0.18s', whiteSpace: 'nowrap',
                  }}>
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.name_mn || cat.name}
                </button>
              )
            })}
          </div>

          {/* Product grid */}
          {prodLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text2)', fontSize: '14px' }}>Уншиж байна...</div>
          ) : products.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '14px' }}>
              {products.map((p: any) => {
                const catColor = categories.find((c: any) => c.id === p.category_id || c.name === p.category)?.color || '#FF6B00'
                const price = p.sale_price
                  ? Number(p.sale_price).toLocaleString() + '₮~'
                  : Number(p.base_price).toLocaleString() + '₮~'
                const href = `/shop?product=${p.slug || p.id}`
                return (
                  <a key={p.id} href={href} style={{
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: '16px', textDecoration: 'none', color: 'var(--text)',
                    transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', position: 'relative',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = catColor; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 28px ${catColor}18` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                    {/* Thumbnail */}
                    <div style={{ width: '100%', aspectRatio: '4/3', background: catColor + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {p.thumbnail_url
                        ? <img src={p.thumbnail_url} alt={p.name_mn || p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '40px' }}>📦</span>
                      }
                    </div>
                    {/* Info */}
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', lineHeight: 1.3 }}>{p.name_mn || p.name}</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: catColor }}>{price}</div>
                      {p.sale_price && (
                        <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 500 }}>Хямдарсан</div>
                      )}
                    </div>
                  </a>
                )
              })}
            </div>
          ) : (
            /* fallback static grid when no API data */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '14px' }}>
              {PRODUCTS.map((p: any) => (
                <a key={p.name} href={p.href} style={{
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: '16px', padding: '20px 18px', textDecoration: 'none',
                  color: 'var(--text)', transition: 'all 0.2s', display: 'flex',
                  alignItems: 'center', gap: '14px', position: 'relative',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${p.color}18` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                  {p.tag && <div style={{ position: 'absolute', top: 10, right: 10, fontSize: '10px', background: 'rgba(255,107,0,0.12)', color: '#FF6B00', borderRadius: '99px', padding: '2px 8px', fontWeight: 600 }}>{p.tag}</div>}
                  <div style={{ fontSize: '28px', flexShrink: 0 }}>{p.icon}</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>{p.name}</div>
                    {p.price && <div style={{ fontSize: '13px', fontWeight: 700, color: p.color }}>{p.price}</div>}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          REVIEWS / SOCIAL PROOF
      ══════════════════════════════════════════════ */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.5px' }}>
            Хэрэглэгчид ямар туршлага хуваалцдаг вэ?
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '8px' }}>
            {[1,2,3,4,5].map(i => <span key={i} style={{ color: '#F59E0B', fontSize: '20px' }}>★</span>)}
            <span style={{ fontSize: '15px', color: 'var(--text2)', marginLeft: '8px', fontWeight: 500 }}>4.8 / 5.0 · 1,240+ захиалга</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }} className="grid-3">
          {REVIEWS.map(r => (
            <div key={r.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1,2,3,4,5].map(i => <span key={i} style={{ color: '#F59E0B', fontSize: '16px' }}>★</span>)}
              </div>
              <p style={{ fontSize: '15px', color: 'var(--text)', lineHeight: 1.7, margin: 0, flex: 1, fontStyle: 'italic' }}>"{r.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: r.color + '20', border: `2px solid ${r.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: r.color, flexShrink: 0 }}>
                  {r.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{r.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          COMBO PACKAGES (Монгол)
      ══════════════════════════════════════════════ */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', padding: '5px 14px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: '#8B5CF6', fontWeight: 600 }}>Combo хэмнэлт</span>
            </div>
            <h2 style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.5px' }}>
              Хэвлэл + Дизайн хамт захиалвал <span style={{ color: '#8B5CF6' }}>15–20% хямд</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text2)' }}>Нэг дороос захиалаад цаг болон мөнгөө хэмнэ</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }} className="grid-3">
            {COMBO.map(c => (
              <div key={c.title} style={{ background: 'var(--bg)', border: c.popular ? `2px solid ${c.color}` : '1px solid var(--border)', borderRadius: '20px', padding: '28px', position: 'relative', transition: 'transform 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
                {c.popular && (
                  <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: c.color, color: '#fff', borderRadius: '99px', padding: '4px 16px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    ⭐ Хамгийн их сонголт
                  </div>
                )}
                <div style={{ fontSize: '12px', fontWeight: 700, color: c.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{c.sub}</div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text)' }}>{c.title}</h3>
                <div style={{ fontSize: '32px', fontWeight: 800, color: c.color, margin: '12px 0 2px' }}>₮{c.price}</div>
                <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, marginBottom: '20px' }}>₮{c.save} хэмнэлт</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {c.items.map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text2)' }}>
                      <span style={{ color: c.color, fontWeight: 700, fontSize: '14px' }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
                <a href="/services" style={{ display: 'block', textAlign: 'center', padding: '12px', background: c.popular ? c.color : 'transparent', color: c.popular ? '#fff' : c.color, border: `1px solid ${c.color}`, borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}>
                  Захиалах →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TRUST BADGES
      ══════════════════════════════════════════════ */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }} className="grid-4">
          {[
            { icon: '🔒', title: 'Аюулгүй төлбөр', desc: 'QR, банк, нэхэмжлэх — бүгд аюулгүй' },
            { icon: '🔄', title: 'Буцаалтын баталгаа', desc: 'Манай алдаагаар хэвлэсэн бол дахин хэвлэнэ' },
            { icon: '🚀', title: 'Хурдан хүргэлт', desc: '3–7 хоногт UB хотод, 7–14 хоногт орон нутагт' },
            { icon: '💬', title: '24/7 дэмжлэг', desc: 'Chat, утас, имэйлээр хүссэн үедээ холбоо бар' },
          ].map(t => (
            <div key={t.title} style={{ textAlign: 'center', padding: '24px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>{t.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>{t.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.6 }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          B2B SECTION
      ══════════════════════════════════════════════ */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.06) 0%,rgba(139,92,246,0.06) 100%)', border: '1px solid var(--border)', borderRadius: '24px', padding: '52px 48px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '40px', alignItems: 'center' }} className="grid-2">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '5px 14px', marginBottom: '18px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }} />
              <span style={{ fontSize: '12px', color: '#3B82F6', fontWeight: 600 }}>Бизнес шийдэл</span>
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-1px', lineHeight: 1.2 }}>
              Сар бүр их хэмжээгээр<br/>
              <span style={{ color: '#3B82F6' }}>захиалдаг уу?</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text2)', lineHeight: 1.75, margin: '0 0 28px', maxWidth: '480px' }}>
              500ш+ захиалгатай бизнест: 30% хүртэл хямдрал, нэхэмжлэхийн төлбөр, хувийн менежер, загварын сан.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a href="/b2b" style={{ padding: '12px 28px', background: '#3B82F6', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}>Дэлгэрэнгүй →</a>
              <a href="/b2b#contact" style={{ padding: '12px 28px', background: 'transparent', border: '1px solid rgba(59,130,246,0.3)', color: '#3B82F6', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Хүсэлт илгээх</a>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '210px' }} className="hide-mobile">
            {[
              { icon: '💰', text: '30% хямдрал', sub: '10,000ш+ захиалгад' },
              { icon: '🏦', text: 'Нэхэмжлэх', sub: '30 хоногийн хугацаатай' },
              { icon: '👤', text: 'Хувийн менежер', sub: 'Онцгой дэмжлэг' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px' }}>
                <span style={{ fontSize: '22px' }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{item.text}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════ */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 100px' }}>
        <div style={{ background: 'linear-gradient(135deg,#FF6B00 0%,#e05500 100%)', borderRadius: '24px', padding: '64px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '240px', height: '240px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ fontSize: '38px', fontWeight: 800, color: '#fff', margin: '0 0 14px', letterSpacing: '-1px' }}>
              Анхны захиалгаа өгөхөд бэлэн үү?
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', margin: '0 0 36px', lineHeight: 1.7 }}>
              30 секундэд үнэ аваарай — бүртгэлгүйгээр ч болно
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/quote" style={{ padding: '15px 40px', background: '#fff', color: '#FF6B00', borderRadius: '12px', textDecoration: 'none', fontSize: '16px', fontWeight: 800 }}>
                Үнэ авах →
              </a>
              <a href="/register" style={{ padding: '15px 40px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontSize: '16px', fontWeight: 600 }}>
                Бүртгүүлэх — үнэгүй
              </a>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '28px', flexWrap: 'wrap' }}>
              {['✓ Картын мэдээлэл шаардлагагүй', '✓ Буцаалтын баталгаа', '✓ Хурдан хүргэлт'].map(t => (
                <span key={t} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  )
}
