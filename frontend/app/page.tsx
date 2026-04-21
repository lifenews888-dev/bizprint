'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

const STATS = [
  { label: 'Ð—Ð°Ñ…Ð¸Ð°Ð»Ð³Ð°', target: 1240, suffix: '+', color: '#FF6B00' },
  { label: 'Ð¥ÑÑ€ÑÐ³Ð»ÑÐ³Ñ‡', target: 860, suffix: '+', color: '#10B981' },
  { label: 'Ò®Ð¹Ð»Ð´Ð²ÑÑ€',   target: 3,    suffix: '+', color: '#3B82F6' },
  { label: 'Ò®Ð½ÑÐ»Ð³ÑÑ',   target: 48,   suffix: 'â˜…', divisor: 10, color: '#F59E0B' },
]

const STEPS = [
  { n: '01', icon: 'ðŸ–¨ï¸', title: 'Ð‘Ò¯Ñ‚ÑÑÐ³Ð´ÑÑ…Ò¯Ò¯Ð½ ÑÐ¾Ð½Ð³Ð¾Ñ…', desc: 'ÐÑÑ€Ð¸Ð¹Ð½ Ñ…ÑƒÑƒÐ´Ð°Ñ, Ñ„Ð»Ð°ÐµÑ€, Ð½Ð¾Ð¼ Ð³ÑÑ… Ð¼ÑÑ‚ 20+ Ñ‚Ó©Ñ€Ð»Ó©Ó©Ñ ÑÐ¾Ð½Ð³Ð¾Ð½Ð¾' },
  { n: '02', icon: 'ðŸ’°', title: 'Ð¨ÑƒÑƒÑ€Ñ…Ð°Ð¹ Ò¯Ð½Ñ Ð°Ð²Ð°Ñ…', desc: 'PDF Ñ…ÑƒÑƒÐ»Ð°Ñ… ÑÑÐ²ÑÐ» Ð¿Ð°Ñ€Ð°Ð¼ÐµÑ‚Ñ€ Ð¾Ñ€ÑƒÑƒÐ»Ð°Ð°Ð´ AI Ñ‚Ð¾Ð¾Ñ†Ð¾Ð¾Ð»Ð»Ð¾Ð¾Ñ€ ÑˆÑƒÑƒÐ´ Ð¼ÑÐ´ÑÐ½Ñ' },
  { n: '03', icon: 'âœ…', title: 'ÐžÐ½Ð»Ð°Ð¹Ð½ Ð·Ð°Ñ…Ð¸Ð°Ð»Ð³Ð° Ó©Ð³Ó©Ñ…', desc: 'QR, Ð±Ð°Ð½ÐºÐ½Ñ‹ ÑˆÐ¸Ð»Ð¶Ò¯Ò¯Ð»ÑÐ³, Ð½ÑÑ…ÑÐ¼Ð¶Ð»ÑÑ…Ð¸Ð¹Ð½ Ð°Ð»ÑŒ Ñ‡ Ð°Ñ€Ð³Ð°Ð°Ñ€ Ñ‚Ó©Ð»Ð½Ó©' },
  { n: '04', icon: 'ðŸš€', title: 'Ð¥Ò¯Ñ€Ð³ÑÐ»Ñ‚ Ð°Ð²Ð°Ñ…', desc: '3â€“7 Ñ…Ð¾Ð½Ð¾Ð³Ð¸Ð¹Ð½ Ð´Ð¾Ñ‚Ð¾Ñ€ Ñ…Ð°ÑÐ³ Ñ€ÑƒÑƒ Ñ‡Ð°Ð½Ð°Ñ€Ñ‚Ð°Ð¹ Ñ…Ò¯Ñ€Ð³ÑÐ½Ñ' },
]

const PRODUCTS = [
  { icon: 'ðŸ’¼', name: 'ÐÑÑ€Ð¸Ð¹Ð½ Ñ…ÑƒÑƒÐ´Ð°Ñ',  price: '25,000â‚®~', href: '/shop', color: '#FF6B00', tag: 'Ð¥Ð°Ð¼Ð³Ð¸Ð¹Ð½ Ð¸Ñ… Ð·Ð°Ñ…Ð¸Ð°Ð»Ð³Ð°' },
  { icon: 'ðŸ“„', name: 'Ð¤Ð»Ð°ÐµÑ€ & ÐŸÐ¾ÑÑ‚ÐµÑ€', price: '45,000â‚®~', href: '/shop', color: '#3B82F6', tag: '' },
  { icon: 'ðŸ·ï¸', name: 'ÐÐ°ÐºÐ»ÐµÐ¹Ðº',        price: '15,000â‚®~', href: '/shop', color: '#10B981', tag: '' },
  { icon: 'ðŸ“¦', name: 'Ð¥Ð°Ð¹Ñ€Ñ†Ð°Ð³ & Ð£ÑƒÑ‚',  price: '80,000â‚®~', href: '/shop', color: '#8B5CF6', tag: '' },
  { icon: 'ðŸ“š', name: 'ÐÐ¾Ð¼ & ÐšÐ°Ñ‚Ð°Ð»Ð¾Ð³',  price: '120,000â‚®~', href: '/shop', color: '#F59E0B', tag: '' },
  { icon: 'ðŸ–¼ï¸', name: 'Ð‘Ð°Ð½Ð½ÐµÑ€',         price: '60,000â‚®~', href: '/shop', color: '#EC4899', tag: '' },
  { icon: 'ðŸ“±', name: 'Ð¡Ð¾ÑˆÐ¸Ð°Ð» Ð´Ð¸Ð·Ð°Ð¹Ð½',  price: '15,000â‚®~', href: '/services', color: '#06B6D4', tag: 'Ð¨Ð¸Ð½Ñ' },
  { icon: 'ðŸ—‚ï¸', name: 'Ð‘ÑƒÑÐ°Ð´ Ñ…ÑÐ²Ð»ÑÐ»',  price: 'Ò®Ð½Ñ Ð°Ð²Ð°Ñ…', href: '/quote', color: '#6366F1', tag: '' },
]

const REVIEWS = [
  {
    name: 'Ð‘. ÐœÓ©Ð½Ñ…Ð±Ð°ÑÑ€',
    role: 'Ð ÐµÑÑ‚Ð¾Ñ€Ð°Ð½Ñ‹ ÑÐ·ÑÐ½, Ð£Ð»Ð°Ð°Ð½Ð±Ð°Ð°Ñ‚Ð°Ñ€',
    text: 'ÐÑÑ€Ð¸Ð¹Ð½ Ñ…ÑƒÑƒÐ´Ð°Ñ, Ð¼ÐµÐ½ÑŽ Ñ…ÑÐ²Ð»Ò¯Ò¯Ð»ÑÑÐ½. Ð§Ð°Ð½Ð°Ñ€ Ð³Ð°Ð¹Ñ…Ð°Ð»Ñ‚Ð°Ð¹, Ñ…Ò¯Ñ€Ð³ÑÐ»Ñ‚ Ð¼Ð°Ñˆ Ñ…ÑƒÑ€Ð´Ð°Ð½ Ð±Ð°Ð¹Ð»Ð°Ð°. Ð”Ð°Ñ€Ð°Ð° Ñ‡ Ð·Ð°Ñ…Ð¸Ð°Ð»Ð½Ð°.',
    stars: 5,
    color: '#FF6B00',
  },
  {
    name: 'Ðž. Ð­Ð½Ñ…Ð·ÑƒÐ»',
    role: 'ÐœÐ°Ñ€ÐºÐµÑ‚Ð¸Ð½Ð³Ð¸Ð¹Ð½ Ð¼ÐµÐ½ÐµÐ¶ÐµÑ€',
    text: 'Ð¥ÑÐ²Ð»ÑÐ»Ð¸Ð¹Ð½ ÐºÐ¾Ð¼Ð¿Ð°Ð½Ð¸Ñ‚Ð°Ð¹ Ð±Ð¸ÐµÑ‡Ð»ÑÐ½ Ð¾Ñ‡Ð¸Ñ… Ñ…ÑÑ€ÑÐ³Ñ‚ÑÐ¹ Ð±Ð°Ð¹ÑÐ°Ð½. BizPrint-ÑÑÑ€ Ð¾Ð½Ð»Ð°Ð¹Ð½ Ð·Ð°Ñ…Ð¸Ð°Ð»Ð¶ Ð±Ð¾Ð»Ð¾Ñ…Ð¾Ð¾Ñ€ Ñ†Ð°Ð³ Ð¼Ð°Ñˆ Ñ…ÑÐ¼Ð½ÑÐ³Ð´Ð»ÑÑ!',
    stars: 5,
    color: '#8B5CF6',
  },
  {
    name: 'Ð”. Ð‘Ð°Ð°Ñ‚Ð°Ñ€ÑÒ¯Ñ…',
    role: 'Ð”Ð¸Ð·Ð°Ð¹Ð½ ÑÑ‚ÑƒÐ´Ð¸Ð¹Ð½ Ð·Ð°Ñ…Ð¸Ñ€Ð°Ð»',
    text: 'Ð¥Ð°Ñ€Ð¸Ð»Ñ†Ð°Ð³Ñ‡ Ð±Ò¯Ñ€Ð¸Ð¹Ð½ Ñ…ÑÐ²Ð»ÑÐ»Ð¸Ð¹Ð³ BizPrint-Ñ€ Ñ…Ð¸Ð¹Ð´ÑÐ³ Ð±Ð¾Ð»ÑÐ¾Ð½. Ð—Ð°Ñ…Ð¸Ð°Ð»Ð³Ñ‹Ð½ ÑÐ¸ÑÑ‚ÐµÐ¼, Ñ…ÑÐ½Ð°Ð»Ñ‚ Ð±Ò¯Ð³Ð´ Ð½ÑÐ³ Ð´Ð¾Ñ€ Ð±Ð°Ð¹Ð´Ð°Ð³ Ð½ÑŒ Ð´Ð°Ð²ÑƒÑƒ.',
    stars: 5,
    color: '#10B981',
  },
]

const COMBO = [
  {
    title: 'Ð­Ñ…Ð»ÑÐ³Ñ‡ Ð±Ð°Ð³Ñ†',
    sub: 'Ð–Ð¸Ð¶Ð¸Ð³ Ð±Ð¸Ð·Ð½ÐµÑÑ‚',
    items: ['ÐÑÑ€Ð¸Ð¹Ð½ Ñ…ÑƒÑƒÐ´Ð°Ñ 100Ñˆ Ñ…ÑÐ²Ð»ÑÐ»', 'FB/IG Ð¿Ð¾ÑÑ‚ÐµÑ€ 1Ñˆ Ð´Ð¸Ð·Ð°Ð¹Ð½', 'Story Ð´Ð¸Ð·Ð°Ð¹Ð½ 1Ñˆ'],
    price: '45,000',
    save: '12,000',
    color: '#FF6B00',
  },
  {
    title: 'Ð‘Ð¸Ð·Ð½ÐµÑ Ð±Ð°Ð³Ñ†',
    sub: 'Ð¥Ð°Ð¼Ð³Ð¸Ð¹Ð½ Ð¸Ñ… ÑÐ¾Ð½Ð³Ð¾Ð»Ñ‚',
    items: ['ÐÑÑ€Ð¸Ð¹Ð½ Ñ…ÑƒÑƒÐ´Ð°Ñ + Ð¤Ð»Ð°ÐµÑ€ Ñ…ÑÐ²Ð»ÑÐ»', 'Ð¡Ð¾ÑˆÐ¸Ð°Ð» Ð¼ÐµÐ´Ð¸Ð° Ð¿Ð¾ÑÑ‚ÐµÑ€ 5Ñˆ', 'Story + Reels Ð·ÑƒÑ€Ð°Ð³ 3Ñˆ', 'Ð‘Ñ€ÑÐ½Ð´Ð¸Ð¹Ð½ Ð³Ð°Ñ€Ñ‹Ð½ Ð°Ð²Ð»Ð°Ð³Ð°'],
    price: '180,000',
    save: '55,000',
    color: '#8B5CF6',
    popular: true,
  },
  {
    title: 'Ð¡Ð°Ñ€Ñ‹Ð½ Ð±Ð°Ð³Ñ†',
    sub: 'Ð¢Ð¾Ð³Ñ‚Ð¼Ð¾Ð» Ð·Ð°Ñ…Ð¸Ð°Ð»Ð°Ð³Ñ‡Ð¸Ð´',
    items: ['Ð¡Ð°Ñ€ Ð±Ò¯Ñ€Ð¸Ð¹Ð½ 20 Ð¿Ð¾ÑÑ‚ Ð´Ð¸Ð·Ð°Ð¹Ð½', 'Story 10Ñˆ / Reels cover 5Ñˆ', 'ÐšÐ¾Ð½Ñ‚ÐµÐ½Ñ‚Ð¸Ð¹Ð½ Ñ…ÑƒÐ²Ð°Ð°Ñ€ÑŒ', 'Ð¥ÑÐ²Ð»ÑÐ»Ð´ 20% Ñ…ÑÐ¼Ð´Ñ€Ð°Ð»'],
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
    fetch(`${API}/api/banners`).then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d.filter((b: any) => b.isActive !== false) : []
      setBanners(list)
    }).catch(() => {})

    fetch(`${API}/api/categories`).then(r => r.json()).then(d => {
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
      ? `${API}/api/products?limit=24`
      : `${API}/api/products?category_id=${activeCategory}&limit=24`
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          HERO
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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
                {b.link && <a href={b.link} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: '#FF6B00', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>{b.buttonText || 'Ð”ÑÐ»Ð³ÑÑ€ÑÐ½Ð³Ò¯Ð¹'} â†’</a>}
              </div>
            </div>
          ))}
          {banners.length > 1 && (
            <>
              <button onClick={prev} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>â€¹</button>
              <button onClick={next} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>â€º</button>
              <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 3 }}>
                {banners.map((_, i) => (<button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i === current ? '#FF6B00' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />))}
              </div>
            </>
          )}
        </section>
      ) : (
        /* Default hero â€” product-visual layout */
        <section style={{ background: 'linear-gradient(135deg,#0A0A0A 0%,#111 60%,#0a0a14 100%)', padding: '0', overflow: 'hidden', position: 'relative' }}>
          {/* Background glows */}
          <div style={{ position: 'absolute', top: '10%', left: '5%', width: '500px', height: '500px', background: 'rgba(255,107,0,0.07)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '0', right: '10%', width: '400px', height: '400px', background: 'rgba(59,130,246,0.06)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center', position: 'relative', zIndex: 1 }} className="grid-2">
            {/* Left */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.25)', borderRadius: '8px', padding: '5px 14px', marginBottom: '24px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#FF6B00', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '12px', color: '#FF6B00', fontWeight: 600 }}>ÐœÐ¾Ð½Ð³Ð¾Ð»Ñ‹Ð½ Ñ…ÑÐ²Ð»ÑÐ»Ð¸Ð¹Ð½ Ð¿Ð»Ð°Ñ‚Ñ„Ð¾Ñ€Ð¼</span>
              </div>
              <h1 style={{ fontSize: '52px', fontWeight: 800, color: '#F1F5F9', lineHeight: 1.1, margin: '0 0 20px', letterSpacing: '-2px' }}>
                Ð¥ÑÐ²Ð»ÑÐ» Ð·Ð°Ñ…Ð¸Ð°Ð»Ð°Ñ…<br/>
                <span style={{ color: '#FF6B00' }}>Ñ…ÑÐ·ÑÑ Ñ‡ ÑÐ½Ñ Ñ…ÑÐ»Ð±Ð°Ñ€</span><br/>
                Ð±Ð°Ð¹Ð³Ð°Ð°Ð³Ò¯Ð¹
              </h1>
              <p style={{ fontSize: '17px', color: '#888', lineHeight: 1.75, margin: '0 0 36px', maxWidth: '460px' }}>
                Ò®Ð½Ñ Ð°Ð²Ð°Ñ…, Ð·Ð°Ñ…Ð¸Ð°Ð»Ð³Ð° Ó©Ð³Ó©Ñ…, Ñ…Ò¯Ñ€Ð³ÑÐ»Ñ‚ Ñ…ÑÐ½Ð°Ñ… â€” Ð±Ò¯Ð³Ð´Ð¸Ð¹Ð³ Ð¾Ð½Ð»Ð°Ð¹Ð½Ð°Ð°Ñ€. Ð¥ÑÐ²Ð»ÑÐ»Ð¸Ð¹Ð½ ÐºÐ¾Ð¼Ð¿Ð°Ð½Ð¸Ð´ Ð±Ð¸ÐµÑ‡Ð»ÑÐ½ Ð¾Ñ‡Ð¸Ñ… ÑˆÐ°Ð°Ñ€Ð´Ð»Ð°Ð³Ð°Ð³Ò¯Ð¹.
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '36px' }}>
                <a href="/quote" style={{ padding: '15px 36px', background: '#FF6B00', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontSize: '16px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  Ò®Ð½Ñ Ð°Ð²Ð°Ñ… â†’ <span style={{ fontSize: '13px', opacity: 0.8 }}>30 ÑÐµÐº</span>
                </a>
                <a href="/shop" style={{ padding: '15px 36px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#F1F5F9', borderRadius: '12px', textDecoration: 'none', fontSize: '16px', fontWeight: 500 }}>
                  Ð‘Ò¯Ñ‚ÑÑÐ³Ð´ÑÑ…Ò¯Ò¯Ð½ Ò¯Ð·ÑÑ…
                </a>
              </div>

              {/* Mini trust */}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {[
                  { icon: 'âœ“', text: '3â€“7 Ñ…Ð¾Ð½Ð¾Ð³Ñ‚ Ñ…Ò¯Ñ€Ð³ÑÐ»Ñ‚' },
                  { icon: 'âœ“', text: 'ÐžÐ½Ð»Ð°Ð¹Ð½ Ñ‚Ó©Ð»Ð±Ó©Ñ€' },
                  { icon: 'âœ“', text: 'Ð§Ð°Ð½Ð°Ñ€Ñ‹Ð½ Ð±Ð°Ñ‚Ð°Ð»Ð³Ð°Ð°' },
                ].map(t => (
                  <div key={t.text} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#666' }}>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>{t.icon}</span> {t.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right â€” product cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { icon: 'ðŸ’¼', name: 'ÐÑÑ€Ð¸Ð¹Ð½ Ñ…ÑƒÑƒÐ´Ð°Ñ', price: '25,000â‚®~', color: '#FF6B00', tag: 'ðŸ”¥ Ð¥Ð°Ð¼Ð³Ð¸Ð¹Ð½ Ð¸Ñ…' },
                { icon: 'ðŸ“„', name: 'Ð¤Ð»Ð°ÐµÑ€ & ÐŸÐ¾ÑÑ‚ÐµÑ€', price: '45,000â‚®~', color: '#3B82F6', tag: '' },
                { icon: 'ðŸ·ï¸', name: 'ÐÐ°ÐºÐ»ÐµÐ¹Ðº & Ð¡Ñ‚Ð¸ÐºÐµÑ€', price: '15,000â‚®~', color: '#10B981', tag: '' },
                { icon: 'ðŸ“¦', name: 'Ð¥Ð°Ð¹Ñ€Ñ†Ð°Ð³ & Ð£ÑƒÑ‚', price: '80,000â‚®~', color: '#8B5CF6', tag: '' },
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          STATS STRIP
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section ref={statsRef} style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {STATS.map((stat, i) => (
            <div key={stat.label} style={{ borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <StatItem stat={stat} active={statsVisible} />
            </div>
          ))}
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          HOW IT WORKS
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <h2 style={{ fontSize: '34px', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-1px' }}>
            Ð—Ð°Ñ…Ð¸Ð°Ð»Ð³Ð° Ó©Ð³Ó©Ñ… Ð½ÑŒ <span style={{ color: '#FF6B00' }}>4 Ð°Ð»Ñ…Ð°Ð¼</span>
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text2)', maxWidth: '440px', margin: '0 auto' }}>
            Ð‘Ò¯Ñ€Ñ‚Ð³ÑÐ»Ð³Ò¯Ð¹Ð³ÑÑÑ€ Ñ‡ Ò¯Ð½Ñ Ð°Ð²Ð°Ñ… Ð±Ð¾Ð»Ð¾Ð¼Ð¶Ñ‚Ð¾Ð¹ â€” Ð´Ð°Ñ€Ð°Ð° Ð±Ò¯Ñ€Ñ‚Ð³Ò¯Ò¯Ð»ÑÑÐ´ Ð·Ð°Ñ…Ð¸Ð°Ð»Ð°Ð°Ñ€Ð°Ð¹
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
                <div style={{ fontSize: '11px', fontWeight: 700, color: c, letterSpacing: '0.1em', marginBottom: '6px' }}>ÐÐ›Ð¥ÐÐœ {s.n}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: 'var(--text)' }}>{s.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text2)', margin: 0, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            )
          })}
        </div>
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <a href="/quote" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 32px', background: '#FF6B00', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: 700 }}>
            ÐžÐ´Ð¾Ð¾ ÑÑ…Ð»ÑÑ… â†’ Ò¯Ð½ÑÐ³Ò¯Ð¹ Ò¯Ð½Ñ Ð°Ð²Ð°Ñ…
          </a>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          PRODUCTS â€” category tabs + dynamic grid
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>Ð‘Ð¸Ð´ ÑŽÑƒ Ñ…ÑÐ²Ð»ÑÐ´ÑÐ³ Ð²Ñ?</h2>
              <p style={{ fontSize: '15px', color: 'var(--text2)', margin: 0 }}>ÐÑÑ€Ð¸Ð¹Ð½ Ñ…ÑƒÑƒÐ´Ð°ÑÐ½Ð°Ð°Ñ ÑÑ…Ð»ÑÐ½ Ñ‚Ð¾Ð¼ Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚Ñ‹Ð½ Ñ…ÑÐ²Ð»ÑÐ» Ñ…Ò¯Ñ€Ñ‚ÑÐ»</p>
            </div>
            <a href="/shop" style={{ fontSize: '14px', color: '#FF6B00', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              Ð‘Ò¯Ð³Ð´Ð¸Ð¹Ð³ Ò¯Ð·ÑÑ… â†’
            </a>
          </div>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[{ id: 'all', name_mn: 'Ð‘Ò¯Ð³Ð´', name: 'All', icon: 'ðŸ—‚ï¸', color: '#FF6B00' }, ...categories].map((cat: any) => {
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
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text2)', fontSize: '14px' }}>Ð£Ð½ÑˆÐ¸Ð¶ Ð±Ð°Ð¹Ð½Ð°...</div>
          ) : products.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '14px' }}>
              {products.map((p: any) => {
                const catColor = categories.find((c: any) => c.id === p.category_id || c.name === p.category)?.color || '#FF6B00'
                const price = p.sale_price
                  ? Number(p.sale_price).toLocaleString() + 'â‚®~'
                  : Number(p.base_price).toLocaleString() + 'â‚®~'
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
                        : <span style={{ fontSize: '40px' }}>ðŸ“¦</span>
                      }
                    </div>
                    {/* Info */}
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', lineHeight: 1.3 }}>{p.name_mn || p.name}</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: catColor }}>{price}</div>
                      {p.sale_price && (
                        <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 500 }}>Ð¥ÑÐ¼Ð´Ð°Ñ€ÑÐ°Ð½</div>
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          REVIEWS / SOCIAL PROOF
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.5px' }}>
            Ð¥ÑÑ€ÑÐ³Ð»ÑÐ³Ñ‡Ð¸Ð´ ÑÐ¼Ð°Ñ€ Ñ‚ÑƒÑ€ÑˆÐ»Ð°Ð³Ð° Ñ…ÑƒÐ²Ð°Ð°Ð»Ñ†Ð´Ð°Ð³ Ð²Ñ?
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '8px' }}>
            {[1,2,3,4,5].map(i => <span key={i} style={{ color: '#F59E0B', fontSize: '20px' }}>â˜…</span>)}
            <span style={{ fontSize: '15px', color: 'var(--text2)', marginLeft: '8px', fontWeight: 500 }}>4.8 / 5.0 Â· 1,240+ Ð·Ð°Ñ…Ð¸Ð°Ð»Ð³Ð°</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }} className="grid-3">
          {REVIEWS.map(r => (
            <div key={r.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1,2,3,4,5].map(i => <span key={i} style={{ color: '#F59E0B', fontSize: '16px' }}>â˜…</span>)}
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          COMBO PACKAGES (ÐœÐ¾Ð½Ð³Ð¾Ð»)
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', padding: '5px 14px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: '#8B5CF6', fontWeight: 600 }}>Combo Ñ…ÑÐ¼Ð½ÑÐ»Ñ‚</span>
            </div>
            <h2 style={{ fontSize: '30px', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.5px' }}>
              Ð¥ÑÐ²Ð»ÑÐ» + Ð”Ð¸Ð·Ð°Ð¹Ð½ Ñ…Ð°Ð¼Ñ‚ Ð·Ð°Ñ…Ð¸Ð°Ð»Ð²Ð°Ð» <span style={{ color: '#8B5CF6' }}>15â€“20% Ñ…ÑÐ¼Ð´</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text2)' }}>ÐÑÐ³ Ð´Ð¾Ñ€Ð¾Ð¾Ñ Ð·Ð°Ñ…Ð¸Ð°Ð»Ð°Ð°Ð´ Ñ†Ð°Ð³ Ð±Ð¾Ð»Ð¾Ð½ Ð¼Ó©Ð½Ð³Ó©Ó© Ñ…ÑÐ¼Ð½Ñ</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }} className="grid-3">
            {COMBO.map(c => (
              <div key={c.title} style={{ background: 'var(--bg)', border: c.popular ? `2px solid ${c.color}` : '1px solid var(--border)', borderRadius: '20px', padding: '28px', position: 'relative', transition: 'transform 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
                {c.popular && (
                  <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: c.color, color: '#fff', borderRadius: '99px', padding: '4px 16px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    â­ Ð¥Ð°Ð¼Ð³Ð¸Ð¹Ð½ Ð¸Ñ… ÑÐ¾Ð½Ð³Ð¾Ð»Ñ‚
                  </div>
                )}
                <div style={{ fontSize: '12px', fontWeight: 700, color: c.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{c.sub}</div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text)' }}>{c.title}</h3>
                <div style={{ fontSize: '32px', fontWeight: 800, color: c.color, margin: '12px 0 2px' }}>â‚®{c.price}</div>
                <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, marginBottom: '20px' }}>â‚®{c.save} Ñ…ÑÐ¼Ð½ÑÐ»Ñ‚</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {c.items.map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text2)' }}>
                      <span style={{ color: c.color, fontWeight: 700, fontSize: '14px' }}>âœ“</span> {item}
                    </li>
                  ))}
                </ul>
                <a href="/services" style={{ display: 'block', textAlign: 'center', padding: '12px', background: c.popular ? c.color : 'transparent', color: c.popular ? '#fff' : c.color, border: `1px solid ${c.color}`, borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}>
                  Ð—Ð°Ñ…Ð¸Ð°Ð»Ð°Ñ… â†’
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          TRUST BADGES
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }} className="grid-4">
          {[
            { icon: 'ðŸ”’', title: 'ÐÑŽÑƒÐ»Ð³Ò¯Ð¹ Ñ‚Ó©Ð»Ð±Ó©Ñ€', desc: 'QR, Ð±Ð°Ð½Ðº, Ð½ÑÑ…ÑÐ¼Ð¶Ð»ÑÑ… â€” Ð±Ò¯Ð³Ð´ Ð°ÑŽÑƒÐ»Ð³Ò¯Ð¹' },
            { icon: 'ðŸ”„', title: 'Ð‘ÑƒÑ†Ð°Ð°Ð»Ñ‚Ñ‹Ð½ Ð±Ð°Ñ‚Ð°Ð»Ð³Ð°Ð°', desc: 'ÐœÐ°Ð½Ð°Ð¹ Ð°Ð»Ð´Ð°Ð°Ð³Ð°Ð°Ñ€ Ñ…ÑÐ²Ð»ÑÑÑÐ½ Ð±Ð¾Ð» Ð´Ð°Ñ…Ð¸Ð½ Ñ…ÑÐ²Ð»ÑÐ½Ñ' },
            { icon: 'ðŸš€', title: 'Ð¥ÑƒÑ€Ð´Ð°Ð½ Ñ…Ò¯Ñ€Ð³ÑÐ»Ñ‚', desc: '3â€“7 Ñ…Ð¾Ð½Ð¾Ð³Ñ‚ UB Ñ…Ð¾Ñ‚Ð¾Ð´, 7â€“14 Ñ…Ð¾Ð½Ð¾Ð³Ñ‚ Ð¾Ñ€Ð¾Ð½ Ð½ÑƒÑ‚Ð°Ð³Ñ‚' },
            { icon: 'ðŸ’¬', title: '24/7 Ð´ÑÐ¼Ð¶Ð»ÑÐ³', desc: 'Chat, ÑƒÑ‚Ð°Ñ, Ð¸Ð¼ÑÐ¹Ð»ÑÑÑ€ Ñ…Ò¯ÑÑÑÐ½ Ò¯ÐµÐ´ÑÑ Ñ…Ð¾Ð»Ð±Ð¾Ð¾ Ð±Ð°Ñ€' },
          ].map(t => (
            <div key={t.title} style={{ textAlign: 'center', padding: '24px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>{t.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>{t.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.6 }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          B2B SECTION
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.06) 0%,rgba(139,92,246,0.06) 100%)', border: '1px solid var(--border)', borderRadius: '24px', padding: '52px 48px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '40px', alignItems: 'center' }} className="grid-2">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '5px 14px', marginBottom: '18px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }} />
              <span style={{ fontSize: '12px', color: '#3B82F6', fontWeight: 600 }}>Ð‘Ð¸Ð·Ð½ÐµÑ ÑˆÐ¸Ð¹Ð´ÑÐ»</span>
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-1px', lineHeight: 1.2 }}>
              Ð¡Ð°Ñ€ Ð±Ò¯Ñ€ Ð¸Ñ… Ñ…ÑÐ¼Ð¶ÑÑÐ³ÑÑÑ€<br/>
              <span style={{ color: '#3B82F6' }}>Ð·Ð°Ñ…Ð¸Ð°Ð»Ð´Ð°Ð³ ÑƒÑƒ?</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text2)', lineHeight: 1.75, margin: '0 0 28px', maxWidth: '480px' }}>
              500Ñˆ+ Ð·Ð°Ñ…Ð¸Ð°Ð»Ð³Ð°Ñ‚Ð°Ð¹ Ð±Ð¸Ð·Ð½ÐµÑÑ‚: 30% Ñ…Ò¯Ñ€Ñ‚ÑÐ» Ñ…ÑÐ¼Ð´Ñ€Ð°Ð», Ð½ÑÑ…ÑÐ¼Ð¶Ð»ÑÑ…Ð¸Ð¹Ð½ Ñ‚Ó©Ð»Ð±Ó©Ñ€, Ñ…ÑƒÐ²Ð¸Ð¹Ð½ Ð¼ÐµÐ½ÐµÐ¶ÐµÑ€, Ð·Ð°Ð³Ð²Ð°Ñ€Ñ‹Ð½ ÑÐ°Ð½.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a href="/b2b" style={{ padding: '12px 28px', background: '#3B82F6', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}>Ð”ÑÐ»Ð³ÑÑ€ÑÐ½Ð³Ò¯Ð¹ â†’</a>
              <a href="/b2b#contact" style={{ padding: '12px 28px', background: 'transparent', border: '1px solid rgba(59,130,246,0.3)', color: '#3B82F6', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Ð¥Ò¯ÑÑÐ»Ñ‚ Ð¸Ð»Ð³ÑÑÑ…</a>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '210px' }} className="hide-mobile">
            {[
              { icon: 'ðŸ’°', text: '30% Ñ…ÑÐ¼Ð´Ñ€Ð°Ð»', sub: '10,000Ñˆ+ Ð·Ð°Ñ…Ð¸Ð°Ð»Ð³Ð°Ð´' },
              { icon: 'ðŸ¦', text: 'ÐÑÑ…ÑÐ¼Ð¶Ð»ÑÑ…', sub: '30 Ñ…Ð¾Ð½Ð¾Ð³Ð¸Ð¹Ð½ Ñ…ÑƒÐ³Ð°Ñ†Ð°Ð°Ñ‚Ð°Ð¹' },
              { icon: 'ðŸ‘¤', text: 'Ð¥ÑƒÐ²Ð¸Ð¹Ð½ Ð¼ÐµÐ½ÐµÐ¶ÐµÑ€', sub: 'ÐžÐ½Ñ†Ð³Ð¾Ð¹ Ð´ÑÐ¼Ð¶Ð»ÑÐ³' },
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          FINAL CTA
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 100px' }}>
        <div style={{ background: 'linear-gradient(135deg,#FF6B00 0%,#e05500 100%)', borderRadius: '24px', padding: '64px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '240px', height: '240px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ fontSize: '38px', fontWeight: 800, color: '#fff', margin: '0 0 14px', letterSpacing: '-1px' }}>
              ÐÐ½Ñ…Ð½Ñ‹ Ð·Ð°Ñ…Ð¸Ð°Ð»Ð³Ð°Ð° Ó©Ð³Ó©Ñ…Ó©Ð´ Ð±ÑÐ»ÑÐ½ Ò¯Ò¯?
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', margin: '0 0 36px', lineHeight: 1.7 }}>
              30 ÑÐµÐºÑƒÐ½Ð´ÑÐ´ Ò¯Ð½Ñ Ð°Ð²Ð°Ð°Ñ€Ð°Ð¹ â€” Ð±Ò¯Ñ€Ñ‚Ð³ÑÐ»Ð³Ò¯Ð¹Ð³ÑÑÑ€ Ñ‡ Ð±Ð¾Ð»Ð½Ð¾
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/quote" style={{ padding: '15px 40px', background: '#fff', color: '#FF6B00', borderRadius: '12px', textDecoration: 'none', fontSize: '16px', fontWeight: 800 }}>
                Ò®Ð½Ñ Ð°Ð²Ð°Ñ… â†’
              </a>
              <a href="/register" style={{ padding: '15px 40px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontSize: '16px', fontWeight: 600 }}>
                Ð‘Ò¯Ñ€Ñ‚Ð³Ò¯Ò¯Ð»ÑÑ… â€” Ò¯Ð½ÑÐ³Ò¯Ð¹
              </a>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '28px', flexWrap: 'wrap' }}>
              {['âœ“ ÐšÐ°Ñ€Ñ‚Ñ‹Ð½ Ð¼ÑÐ´ÑÑÐ»ÑÐ» ÑˆÐ°Ð°Ñ€Ð´Ð»Ð°Ð³Ð°Ð³Ò¯Ð¹', 'âœ“ Ð‘ÑƒÑ†Ð°Ð°Ð»Ñ‚Ñ‹Ð½ Ð±Ð°Ñ‚Ð°Ð»Ð³Ð°Ð°', 'âœ“ Ð¥ÑƒÑ€Ð´Ð°Ð½ Ñ…Ò¯Ñ€Ð³ÑÐ»Ñ‚'].map(t => (
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
