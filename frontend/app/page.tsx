'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import Link from 'next/link'
import HeroSlider from '@/components/HeroSlider'
import GlobalProductCard from '@/components/ProductCard'

/* ───────────── helpers ───────────── */
function parseJsonItems(raw: any, fallback: any[]): any[] {
  if (Array.isArray(raw) && raw.length > 0) return raw
  if (typeof raw === 'string') { try { const p = JSON.parse(raw); if (Array.isArray(p)) return p } catch {} }
  return fallback
}

/* ───────────── SVG Icons ───────────── */
const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#E53E3E' : 'none'} stroke={filled ? '#E53E3E' : 'currentColor'} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)
const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? '#F59E0B' : '#E5E7EB'} stroke="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
)
const ChevronLeft = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
)
const ChevronRight = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
)
const QrCodeIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/>
    <rect x="18" y="18" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/>
    <rect x="18" y="14" width="3" height="3"/>
    <rect x="5.5" y="5.5" width="2" height="2" fill="currentColor"/><rect x="16.5" y="5.5" width="2" height="2" fill="currentColor"/>
    <rect x="5.5" y="16.5" width="2" height="2" fill="currentColor"/>
  </svg>
)

/* ─── Category SVG Icons (Merto-style) ─── */
const CategoryIcons: Record<string, React.ReactNode> = {
  'business-card': <svg width="32" height="32" viewBox="0 0 48 48" fill="none"><rect x="6" y="12" width="36" height="24" rx="3" stroke="#FF6B00" strokeWidth="2.5"/><line x1="14" y1="22" x2="28" y2="22" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round"/><line x1="14" y1="28" x2="22" y2="28" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round"/><circle cx="37" cy="18" r="2" fill="#FF6B00"/></svg>,
  'flyer': <svg width="32" height="32" viewBox="0 0 48 48" fill="none"><rect x="10" y="6" width="28" height="36" rx="2" stroke="#8B5CF6" strokeWidth="2.5"/><line x1="16" y1="16" x2="32" y2="16" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/><line x1="16" y1="22" x2="32" y2="22" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/><line x1="16" y1="28" x2="26" y2="28" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/></svg>,
  'sticker': <svg width="32" height="32" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="16" stroke="#10B981" strokeWidth="2.5"/><path d="M24 8C24 8 40 20 40 24C40 28 24 40 24 40" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/></svg>,
  'banner': <svg width="32" height="32" viewBox="0 0 48 48" fill="none"><rect x="4" y="10" width="40" height="22" rx="2" stroke="#3B82F6" strokeWidth="2.5"/><line x1="24" y1="32" x2="24" y2="40" stroke="#3B82F6" strokeWidth="2.5"/><line x1="16" y1="40" x2="32" y2="40" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round"/></svg>,
  'book': <svg width="32" height="32" viewBox="0 0 48 48" fill="none"><path d="M8 8C8 8 16 6 24 10C32 6 40 8 40 8V38C40 38 32 36 24 40C16 36 8 38 8 38V8Z" stroke="#F59E0B" strokeWidth="2.5"/><line x1="24" y1="10" x2="24" y2="40" stroke="#F59E0B" strokeWidth="2"/></svg>,
  'template': <svg width="32" height="32" viewBox="0 0 48 48" fill="none"><rect x="8" y="6" width="32" height="36" rx="3" stroke="#EC4899" strokeWidth="2.5"/><rect x="14" y="12" width="20" height="12" rx="1.5" stroke="#EC4899" strokeWidth="2"/><line x1="14" y1="30" x2="28" y2="30" stroke="#EC4899" strokeWidth="2" strokeLinecap="round"/><line x1="14" y1="35" x2="22" y2="35" stroke="#EC4899" strokeWidth="2" strokeLinecap="round"/></svg>,
}

/* ───────────── Countdown Timer ───────────── */
function FlashCountdown() {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 })
  useEffect(() => {
    function calcRemaining() {
      const now = new Date()
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      const diff = Math.max(0, end.getTime() - now.getTime())
      return {
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      }
    }
    setTime(calcRemaining())
    const interval = setInterval(() => setTime(calcRemaining()), 1000)
    return () => clearInterval(interval)
  }, [])
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <div className="flex items-center gap-1.5 text-sm font-semibold">
      <span className="text-[var(--text2)]">Дуусахад</span>
      {[pad(time.h), pad(time.m), pad(time.s)].map((v, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="bg-[#111] text-white rounded-md px-2 py-1 text-sm font-bold min-w-[32px] text-center">{v}</span>
          {i < 2 && <span className="text-[var(--text3)] font-bold">:</span>}
        </span>
      ))}
    </div>
  )
}

/* ───────────── Product Card (Merto-style) ───────────── */
// ProductCard — use global component from @/components/ProductCard
// (imported at top of file)

/* ───────────── Product Carousel (scrollable) ───────────── */
function ProductCarousel({ items }: { items: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  if (!items.length) return null

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = 260
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div className="relative group/carousel">
      <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-gray-50">
        <ChevronLeft />
      </button>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {items.map((p: any, i: number) => (
          <div key={p.id || i} className="flex-shrink-0 w-[220px]">
            <GlobalProductCard product={p} />
          </div>
        ))}
      </div>
      <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-gray-50">
        <ChevronRight />
      </button>
    </div>
  )
}

/* ───────────── Banner Slide ───────────── */
function BannerSlide({ b, style }: { b: any; style?: React.CSSProperties }) {
  return (
    <div className="rounded-2xl overflow-hidden relative h-full" style={style}>
      {b.imageUrl ? (
        <img src={b.imageUrl} alt={b.title || ''} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#FF6B00] to-[#F59E0B]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="absolute bottom-6 left-6 right-6">
        {b.title && <h2 className="text-xl md:text-2xl font-bold text-white mb-3 leading-tight">{b.title}</h2>}
        {b.link && (
          <a href={b.link} className="inline-block px-6 py-2.5 bg-[#FF6B00] hover:bg-[#E55D00] text-white rounded-lg text-sm font-semibold transition-colors">
            {b.buttonText || 'Дэлгэрэнгүй'} →
          </a>
        )}
      </div>
    </div>
  )
}

function DefaultHero({ s }: { s: Record<string, any> }) {
  return (
    <div className="rounded-2xl overflow-hidden relative h-full bg-gradient-to-br from-[#FF6B00] to-[#F59E0B]">
      <div className="absolute -top-16 -right-16 w-60 h-60 bg-white/[0.08] rounded-full" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-white/[0.05] rounded-full" />
      <div className="absolute top-1/2 left-8 md:left-10 -translate-y-1/2 max-w-md z-[2]">
        <div className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-3">
          Print Industry Platform
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-4 tracking-tight">
          {s.hero_title || 'Хэвлэлийн үйлчилгээ — хурдан, хямд, найдвартай'}
        </h1>
        <p className="text-sm md:text-base text-white/80 leading-relaxed mb-6">
          {s.hero_subtitle || 'AI-тай үнэ тооцоолол. 1 секундэд үнэ мэдэх.'}
        </p>
        <div className="flex flex-wrap gap-3">
          <a href={s.hero_cta_primary_url || '/shop'} className="px-7 py-3 bg-white text-[#FF6B00] rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
            {s.hero_cta_primary_text || 'Үнэ авах'}
          </a>
          <a href="#how-it-works" className="px-6 py-3 bg-white/15 border border-white/30 text-white rounded-lg text-sm font-medium hover:bg-white/25 transition-colors">
            Хэрхэн ажилладаг вэ
          </a>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN HOMEPAGE
   ═══════════════════════════════════════════ */
export default function HomePage() {
  const { settings, megaMenuV2 } = useSiteSettings()
  const [banners, setBanners] = useState<any[]>([])
  const [heroSlides, setHeroSlides] = useState<any[]>([])
  const [current, setCurrent] = useState(0)
  const [categories, setCategories] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [productsByCategory, setProductsByCategory] = useState<Record<string, any[]>>({})
  const [templates, setTemplates] = useState<any[]>([])

  /* ── Data fetching (unchanged) ── */
  useEffect(() => {
    apiFetch<any>('/banners', { auth: false }).then(d => {
      const list = Array.isArray(d) ? d.filter((b: any) => b.isActive !== false) : []
      setBanners(list)
    }).catch(() => {})

    apiFetch<any>('/cms/hero-slides/public', { auth: false }).then(d => {
      if (Array.isArray(d)) setHeroSlides(d)
    }).catch(() => {})

    apiFetch<any>('/templates?status=active&limit=8', { auth: false }).then(d => {
      setTemplates(Array.isArray(d) ? d : (d?.data ?? []))
    }).catch(() => {})

    apiFetch<any>('/categories', { auth: false }).then(d => {
      if (Array.isArray(d)) {
        const cats = d.filter((c: any) => c.isActive !== false).slice(0, 8)
        setCategories(cats)
        if (cats.length > 0) setActiveCategory(String(cats[0].id))
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!categories.length) return
    const unfetched = categories.filter(cat => !productsByCategory[String(cat.id)])
    if (!unfetched.length) return
    Promise.all(
      unfetched.map(cat =>
        apiFetch<any>(`/products?categoryId=${cat.id}&limit=10`, { auth: false })
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

  /* ── Banner auto-slide ── */
  const next = useCallback(() => setCurrent(c => (c + 1) % Math.max(banners.length, 1)), [banners.length])
  const prev = useCallback(() => setCurrent(c => (c - 1 + banners.length) % Math.max(banners.length, 1)), [banners.length])

  useEffect(() => {
    if (banners.length < 2) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [banners.length, next])

  const sideBanners = banners.slice(1, 3)

  /* ── Product type icons — from V2 mega menu API (admin-managed), fallback to defaults ── */
  const FALLBACK_TYPES: { key: string; label: string; url: string; color: string; icon?: string }[] = [
    { key: 'business-card', label: 'Нэрийн хуудас', url: '/shop?cat=business-card', color: '#FF6B00' },
    { key: 'flyer', label: 'Флаер & Постер', url: '/shop?cat=flyer', color: '#8B5CF6' },
    { key: 'sticker', label: 'Стикер', url: '/shop?cat=sticker', color: '#10B981' },
    { key: 'banner', label: 'Баннер', url: '/shop?cat=banner', color: '#3B82F6' },
    { key: 'book', label: 'Ном & Каталог', url: '/shop?cat=book', color: '#F59E0B' },
    { key: 'template', label: 'Загвар сан', url: '/templates', color: '#EC4899' },
  ]

  const productTypes = megaMenuV2?.columns?.length
    ? megaMenuV2.columns.map((col: any) => ({
        key: (col.categories?.[0]?.slug || col.title || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'),
        label: col.title,
        url: col.categories?.[0]?.items?.[0]?.link || `/shop?cat=${(col.title || '').toLowerCase().replace(/\s+/g, '-')}`,
        color: col.color || '#FF6B00',
        icon: col.icon,
      }))
    : FALLBACK_TYPES

  /* ── Feature highlights — from CMS settings or fallback ── */
  const FALLBACK_FEATURES = [
    { icon: '◆', title: 'Хурдан хүргэлт', desc: '₮50,000+ үнэгүй' },
    { icon: '◆', title: '24 цагт бэлэн', desc: 'Дижитал хэвлэл' },
    { icon: '◆', title: 'Өрсөлдөхүйц үнэ', desc: 'Хямд үнийн баталгаа' },
    { icon: '◆', title: '100% баталгаа', desc: 'Чанарын стандарт' },
  ]
  const featureStrip = (() => {
    try {
      const raw = settings.feature_strip
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {}
    return FALLBACK_FEATURES
  })()

  /* ── Recent orders for reorder section ── */
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      apiFetch<any>('/orders?limit=4&sort=createdAt:DESC').then(d => {
        setRecentOrders(Array.isArray(d) ? d.slice(0, 4) : (d?.data ?? []).slice(0, 4))
      }).catch(() => {})
    }
  }, [])

  // Homepage background theme (from CMS or default)
  const bgTheme = (() => {
    try {
      const raw = settings.homepage_bg_theme
      if (typeof raw === 'string') {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') return parsed
      }
      if (raw && typeof raw === 'object') return raw
    } catch {}
    return {
      mode: 'gradient', // 'solid' | 'gradient' | 'mesh' | 'image'
      main: 'var(--bg)',
      heroGlow: true,
      sections: {
        feature: 'var(--surface)',
        categories: 'var(--bg)',
        products: 'var(--bg)',
        cta: 'var(--bg)',
      },
      glowColor: '#FF6B00',
      glowOpacity: 0.04,
    }
  })()

  const heroGlowStyle = bgTheme.heroGlow ? {
    background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${bgTheme.glowColor || '#FF6B00'}${Math.round((bgTheme.glowOpacity || 0.04) * 255).toString(16).padStart(2, '0')}, transparent)`,
  } : {}

  return (
    <div className="min-h-screen relative" style={{ background: bgTheme.main || 'var(--bg)' }}>
      {/* Ambient glow from hero */}
      {bgTheme.heroGlow && <div className="absolute top-0 left-0 right-0 h-[800px] pointer-events-none z-0" style={heroGlowStyle} />}

      {/* ═══ HERO SLIDER ═══ */}
      {heroSlides.length > 0 && (
        <section className="w-full relative z-10">
          <HeroSlider slides={heroSlides} />
        </section>
      )}

      {/* ═══ FEATURE STRIP ═══ */}
      <section className="hidden md:block border-b border-[var(--border)] relative z-10" style={{ background: bgTheme.sections?.feature || 'var(--surface)' }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-4 divide-x divide-[var(--border)]">
            {featureStrip.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 py-3.5 px-6 flex-shrink-0">
                <span className="text-[10px] text-[#FF6B00] flex-shrink-0">{f.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--text)] truncate tracking-tight">{f.title}</div>
                  <div className="text-[10px] text-[var(--text3)] truncate">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MOBILE: Greeting + Search ═══ */}
      <section className="md:hidden px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] text-[var(--text3)] font-medium">Өглөөний мэнд</div>
            <h1 className="text-xl font-bold text-[var(--text)] m-0 tracking-tight">BizPrint</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/notifications" className="w-9 h-9 rounded-full bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center no-underline">
              <svg width="18" height="18" fill="none" stroke="var(--text2)" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
            </Link>
            <Link href="/dashboard/customer" className="w-9 h-9 rounded-full bg-[#FF6B00] flex items-center justify-center no-underline">
              <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            </Link>
          </div>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" fill="none" stroke="var(--text3)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Бүтээгдэхүүн, брэнд хайх..."
            className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--text)] placeholder:text-[var(--text3)] outline-none focus:border-[var(--orange-30)]"
          />
        </div>
      </section>

      {/* ═══ MOBILE: Quick Actions — File upload + Template ═══ */}
      <section className="md:hidden px-4 py-3">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/quote" className="no-underline">
            <div className="bg-[#FF6B00] rounded-2xl p-4 flex items-center gap-3 min-h-[80px]">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><path d="M12 18v-6M9 15l3 3 3-3"/></svg>
              </div>
              <div>
                <div className="text-sm font-bold text-white">Файл хэвлүүлэх</div>
                <div className="text-[10px] text-white/70">PDF, зураг оруулах</div>
              </div>
            </div>
          </Link>
          <Link href="/templates" className="no-underline">
            <div className="bg-[#8B5CF6] rounded-2xl p-4 flex items-center gap-3 min-h-[80px]">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              </div>
              <div>
                <div className="text-sm font-bold text-white">Загвар ашиглах</div>
                <div className="text-[10px] text-white/70">Бэлэн загвар сонгох</div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ═══ MOBILE: Business Card + QR quick cards (compact, horizontal) ═══ */}
      <section className="md:hidden px-4 pb-3">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/business-cards" className="no-underline">
            <div className="bg-[var(--surface)] border border-[var(--orange-15)] rounded-xl p-3 min-h-[90px]">
              <div className="w-8 h-8 rounded-lg bg-[var(--orange-10)] flex items-center justify-center mb-2">
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none"><rect x="6" y="12" width="36" height="24" rx="3" stroke="#FF6B00" strokeWidth="2.5"/><line x1="14" y1="22" x2="28" y2="22" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round"/><line x1="14" y1="28" x2="22" y2="28" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <div className="text-xs font-bold text-[var(--text)] mb-0.5">Нэрийн хуудас</div>
              <div className="text-[10px] text-[var(--text3)] leading-tight mb-2">3 алхамаар захиалах, QR код</div>
              <div className="text-[10px] font-bold text-[#FF6B00]">₮3,000-аас →</div>
            </div>
          </Link>
          <Link href="/dashboard/customer/digital-card" className="no-underline">
            <div className="bg-[var(--surface)] border border-[#8B5CF6]/15 rounded-xl p-3 min-h-[90px]">
              <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center mb-2 text-[#8B5CF6]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/></svg>
              </div>
              <div className="text-xs font-bold text-[var(--text)] mb-0.5">QR Нэрийн хуудас</div>
              <div className="text-[10px] text-[var(--text3)] leading-tight mb-2">Дижитал карт, хуваалцах</div>
              <div className="text-[10px] font-bold text-[#8B5CF6]">Үнэгүй →</div>
            </div>
          </Link>
        </div>
      </section>

      {/* ═══ CATEGORY ICONS ═══ */}
      <section className="max-w-[1200px] mx-auto px-4 md:px-5 py-5 md:py-8 relative z-10">
        <div className="flex items-center justify-between mb-3 md:mb-6">
          <h2 className="text-base md:text-lg font-bold text-[var(--text)] m-0 tracking-tight">Хэвлэлийн үйлчилгээ</h2>
          <a href="/shop" className="text-xs md:text-sm font-semibold text-[#FF6B00] hover:underline no-underline">Бүгдийг харах →</a>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-5">
          {productTypes.map(pt => (
            <a key={pt.key} href={pt.url} className="flex flex-col items-center gap-1.5 md:gap-2.5 group no-underline">
              <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center transition-all duration-300 group-hover:border-[var(--orange-30)] group-hover:bg-[var(--orange-05)] group-hover:-translate-y-0.5">
                {CategoryIcons[pt.key] || (pt.icon ? <span className="text-xl md:text-2xl">{pt.icon}</span> : <span className="text-xl md:text-2xl">🖨️</span>)}
              </div>
              <span className="text-[10px] md:text-xs font-medium text-[var(--text2)] text-center group-hover:text-[#FF6B00] transition-colors leading-tight">{pt.label}</span>
            </a>
          ))}
        </div>
      </section>

      {/* (Hero Slider moved to top) */}

      {/* ═══ MOBILE: Reorder Section ═══ */}
      {recentOrders.length > 0 && (
        <section className="md:hidden px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[var(--text)] m-0">Дахин захиалах</h2>
            <Link href="/dashboard/orders" className="text-xs font-semibold text-[#FF6B00] no-underline">Бүгдийг харах →</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {recentOrders.map((order: any, i) => (
              <Link key={order.id || i} href={`/dashboard/orders?reorder=${order.id}`} className="flex-shrink-0 w-[200px] bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 no-underline">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-[var(--surface2)] flex items-center justify-center text-lg flex-shrink-0">
                    🖨️
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--text)] truncate">{order.productName || order.items?.[0]?.name || 'Захиалга'}</div>
                    <div className="text-[10px] text-[var(--text3)]">{order.status === 'delivered' ? 'Хүргэгдсэн' : order.status === 'quotation_sent' ? 'quotation_sent' : order.status}</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-[#FF6B00]">
                  {order.totalPrice ? `₮${Number(order.totalPrice).toLocaleString()}` : '₮0'}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ HERO BANNER — shown only when no hero slides ═══ */}
      {heroSlides.length === 0 && <section className="max-w-[1200px] mx-auto px-4 md:px-5 pt-2 md:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 h-auto lg:h-[420px]">
          <div className="relative h-[160px] sm:h-[340px] lg:h-full rounded-2xl overflow-hidden">
            {banners.length > 0 ? (
              <>
                {banners.map((b, i) => (
                  <div key={b.id || i} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}>
                    <BannerSlide b={b} style={{ height: '100%' }} />
                  </div>
                ))}
                {banners.length > 1 && (
                  <>
                    <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center z-[3] transition-colors">
                      <ChevronLeft />
                    </button>
                    <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center z-[3] transition-colors">
                      <ChevronRight />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-[3]">
                      {banners.map((_, i) => (
                        <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-5 bg-[#FF6B00]' : 'w-1.5 bg-white/60 hover:bg-white/80'}`} />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <DefaultHero s={settings} />
            )}
          </div>
          <div className="hidden lg:flex flex-col gap-4 h-full">
            {sideBanners.length > 0 ? (
              sideBanners.map((b, i) => <BannerSlide key={i} b={b} style={{ flex: 1 }} />)
            ) : (
              <>
                {((() => {
                  try {
                    const raw = settings.hero_side_cards
                    const cards = typeof raw === 'string' ? JSON.parse(raw) : raw
                    if (Array.isArray(cards) && cards.length > 0) return cards
                  } catch {}
                  return [
                    { title: 'AI Үнийн Тооцоо', desc: 'PDF хуулаад шууд үнэ аваарай', icon: '🤖', url: '/quote', gradient: 'from-[#7C3AED] to-[#5B21B6]' },
                    { title: 'Хэвлэлийн Дэлгүүр', desc: 'Бүтээгдэхүүн захиалах', icon: '🏭', url: '/shop', gradient: 'from-[#FF6B00] to-[#E55D00]' },
                  ]
                })()).map((card: any, i: number) => (
                  <a key={i} href={card.url || '#'} className={`flex-1 rounded-2xl overflow-hidden bg-gradient-to-br ${card.gradient || (i === 0 ? 'from-[#7C3AED] to-[#5B21B6]' : 'from-[#FF6B00] to-[#E55D00]')} flex flex-col justify-end p-5 no-underline relative group hover:shadow-xl transition-shadow`}>
                    <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">{card.icon || '📦'}</div>
                    <div className="text-[15px] font-bold text-white mb-1">{card.title}</div>
                    <div className="text-xs text-white/60">{card.desc}</div>
                  </a>
                ))}
              </>
            )}
          </div>
        </div>
      </section>}

      {/* ═══ DESKTOP: BUSINESS CARD + QR — full cards ═══ */}
      <section className="hidden md:block max-w-[1200px] mx-auto px-5 pt-8 pb-6">
        <div className="grid grid-cols-2 gap-5">
          <Link href="/business-cards" className="no-underline group">
            <div className="relative rounded-2xl overflow-hidden border border-[var(--orange-15)] bg-[var(--surface)] p-8 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 hover:-translate-y-0.5">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[var(--orange-06)] to-transparent rounded-bl-full" />
              <div className="relative z-[1]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--orange-10)] flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 48 48" fill="none"><rect x="6" y="12" width="36" height="24" rx="3" stroke="#FF6B00" strokeWidth="2.5"/><line x1="14" y1="22" x2="28" y2="22" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round"/><line x1="14" y1="28" x2="22" y2="28" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round"/><circle cx="37" cy="18" r="2" fill="#FF6B00"/></svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text)] m-0 leading-tight">Нэрийн хуудас</h3>
                    <span className="text-[11px] text-[var(--text3)]">Хялбар захиалга</span>
                  </div>
                </div>
                <p className="text-sm text-[var(--text2)] leading-relaxed mb-5 m-0">Нэр, утас, и-мэйл оруулаад шууд захиалаарай. QR код автоматаар үүснэ.</p>
                <div className="flex items-center gap-4 mb-5">
                  {['Мэдээлэл оруулах', 'Загвар сонгох', 'Захиалах'].map((step, idx) => (
                    <div key={step} className="flex items-center gap-2 text-xs text-[var(--text3)]">
                      {idx > 0 && <div className="w-4 h-px bg-[var(--border)]" />}
                      <span className="w-5 h-5 rounded-full bg-[var(--orange-10)] flex items-center justify-center text-[10px] text-[#FF6B00] font-bold">{idx + 1}</span>
                      {step}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-5 py-2.5 bg-[#FF6B00] text-white rounded-xl text-sm font-semibold group-hover:bg-[#E55D00] transition-colors">Захиалах</span>
                  <span className="text-xs text-[var(--text3)]">₮3,000-аас</span>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/dashboard/customer/digital-card" className="no-underline group">
            <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] p-8 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 hover:-translate-y-0.5">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#8B5CF6]/[0.06] to-transparent rounded-bl-full" />
              <div className="relative z-[1]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6]"><QrCodeIcon /></div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text)] m-0 leading-tight">QR Нэрийн хуудас</h3>
                    <span className="text-[11px] text-[var(--text3)]">Дижитал & хэвлэмэл</span>
                  </div>
                </div>
                <p className="text-sm text-[var(--text2)] leading-relaxed mb-5 m-0">Өөрийн QR кодтой дижитал нэрийн хуудас үүсгэж, утсаараа хуваалцаарай.</p>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[{ label: 'QR код', desc: 'Автомат үүсгэх' }, { label: 'Хуваалцах', desc: 'Линкээр илгээх' }, { label: 'Хэвлэх', desc: 'QR кодтой карт' }].map(f => (
                    <div key={f.label} className="text-center p-2.5 rounded-lg bg-[var(--surface2)]">
                      <div className="text-xs font-semibold text-[var(--text)] mb-0.5">{f.label}</div>
                      <div className="text-[10px] text-[var(--text3)]">{f.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-5 py-2.5 bg-[#8B5CF6] text-white rounded-xl text-sm font-semibold group-hover:bg-[#7C3AED] transition-colors">QR карт үүсгэх</span>
                  <span className="text-xs text-[var(--text3)]">Үнэгүй</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ═══ WHAT'S NEW — Recent Updates (scroll on mobile) ═══ */}
      <section className="max-w-[1200px] mx-auto px-4 md:px-5 pb-5 md:pb-8">
        <div className="flex items-center justify-between mb-3 md:mb-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 md:w-1.5 md:h-5 rounded-full bg-[#FF6B00]" />
            <h2 className="text-base md:text-lg font-bold text-[var(--text)] m-0 tracking-tight">Шинэ боломжууд</h2>
          </div>
        </div>
        <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 overflow-x-auto md:overflow-visible pb-1 md:pb-0" style={{ scrollbarWidth: 'none' }}>
          {((() => {
            try {
              const raw = settings.whats_new_cards
              const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
              if (Array.isArray(parsed) && parsed.length > 0) return parsed
            } catch {}
            return [
              { tag: 'Шинэ', title: 'QR Нэрийн хуудас', desc: 'Дижитал нэрийн хуудас + QR код. Утсаар хуваалцаж, хэвлүүлэх боломжтой.', color: '#8B5CF6', href: '/dashboard/customer/digital-card', icon: '📱' },
              { tag: 'AI', title: 'Ухаалаг үнийн санал', desc: 'PDF файлаа оруулаад AI хэдхэн секундэд үнийн санал, хэмжээ тооцоолно.', color: '#3B82F6', href: '/smart-quote', icon: '🤖' },
              { tag: 'Хурдан', title: 'Нэрийн хуудас 3 алхамаар', desc: 'Мэдээллээ оруулаад загвар сонгоод шууд захиалга өгнө.', color: '#FF6B00', href: '/business-cards', icon: '⚡' },
              { tag: 'Creator', title: 'Marketplace нээлттэй', desc: 'Мэргэжлийн дизайнер, контент бүтээгчдээс захиалга өгөх боломжтой.', color: '#EC4899', href: '/marketplace', icon: '🎨' },
            ]
          })()).map((item: any) => (
            <a key={item.title} href={item.href} className="no-underline group flex-shrink-0 w-[160px] md:w-auto">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl md:rounded-2xl p-3.5 md:p-5 h-full transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--border2)]">
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <span className="text-lg md:text-xl">{item.icon}</span>
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-1.5 md:px-2 py-0.5 rounded-full" style={{ color: item.color, background: item.color + '12' }}>{item.tag}</span>
                </div>
                <h3 className="text-xs md:text-sm font-bold text-[var(--text)] mb-1 md:mb-2 m-0 group-hover:text-[#FF6B00] transition-colors leading-tight">{item.title}</h3>
                <p className="text-[10px] md:text-xs text-[var(--text3)] leading-relaxed m-0 line-clamp-3">{item.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ═══ SERVICES — hidden on mobile (quick actions already cover it) ═══ */}
      <section className="hidden md:block max-w-[1200px] mx-auto px-5 pb-8">
        <div className="grid grid-cols-4 gap-4">
          {((() => {
            try {
              const raw = settings.service_cards
              const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
              if (Array.isArray(parsed) && parsed.length > 0) return parsed
            } catch {}
            return [
              { icon: '🛒', title: 'Дэлгүүр', desc: 'Бэлэн бүтээгдэхүүн захиалах', color: '#FF6B00', href: '/shop', cta: 'Дэлгүүр үзэх →' },
              { icon: '🖨️', title: 'Хэвлэл захиалах', desc: 'Файлаа оруулж AI-тай үнэ авах', color: '#8B5CF6', href: '/quote', cta: 'Үнэ тооцоолох →' },
              { icon: '🤖', title: 'AI Smart Quote', desc: 'Хаяг реклам ухаалаг үнийн санал', color: '#3B82F6', href: '/smart-quote', cta: 'AI Quote →' },
              { icon: '🎨', title: 'Marketplace', desc: 'Creator-уудаар дизайн хийлгэх', color: '#EC4899', href: '/marketplace', cta: 'Creator олох →' },
            ]
          })()).map((s: any) => (
            <a key={s.title} href={s.href} className="no-underline group">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--border2)]">
                <div className="text-2xl mb-3">{s.icon}</div>
                <h3 className="text-sm font-bold text-[var(--text)] mb-1.5 m-0 group-hover:text-[#FF6B00] transition-colors">{s.title}</h3>
                <p className="text-xs text-[var(--text3)] leading-relaxed mb-4 m-0">{s.desc}</p>
                <div className="text-xs font-bold" style={{ color: s.color }}>{s.cta}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ═══ DUAL CTA — from CMS or fallback ═══ */}
      <section className="max-w-[1200px] mx-auto px-4 md:px-5 pb-5 md:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {((() => {
            try {
              const raw = settings.dual_cta_banners
              const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
              if (Array.isArray(parsed) && parsed.length > 0) return parsed
            } catch {}
            return [
              { tag: 'Загвар сан', title: 'Онлайн дизайн хийх', desc: 'Бэлэн загвараас сонгоод брэндэд тохируулаарай', cta: 'Загвар сан →', url: '/templates', from: '#FF6B00', to: '#E55D00', dark: false },
              { tag: 'Файл байршуулах', title: 'AI Үнийн тооцоолол', desc: 'PDF файлаа оруулаад секундэд үнийн санал аваарай', cta: 'Үнэ тооцоолох →', url: '/quote', from: '#1A1A2E', to: '#16213E', dark: true },
            ]
          })()).map((b: any, i: number) => (
            <a key={i} href={b.url || '#'} className={`rounded-2xl p-5 md:p-8 no-underline flex flex-col relative overflow-hidden min-h-[140px] md:min-h-[180px] group hover:-translate-y-0.5 transition-all duration-300 ${b.dark ? 'border border-[#2A2A4A]' : ''}`}
              style={{ background: `linear-gradient(135deg, ${b.from || '#FF6B00'}, ${b.to || '#E55D00'})` }}>
              <div className="absolute -top-10 -right-10 w-32 md:w-40 h-32 md:h-40 bg-white/[0.06] rounded-full" />
              <div className={`text-[10px] md:text-[11px] font-bold tracking-[0.15em] uppercase mb-2 md:mb-3 ${b.dark ? 'text-white/30' : 'text-white/50'}`}>{b.tag}</div>
              <div className="text-lg md:text-2xl font-extrabold text-white leading-tight mb-2 md:mb-3 tracking-tight">{b.title}</div>
              <div className={`text-xs md:text-sm leading-relaxed mb-3 md:mb-5 flex-1 ${b.dark ? 'text-white/40' : 'text-white/70'}`}>{b.desc}</div>
              <div className={`inline-flex items-center rounded-xl px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-semibold w-fit ${b.dark ? 'bg-[#FF6B00]/20 border border-[#FF6B00]/30 text-[#FF6B00]' : 'bg-white/15 border border-white/20 text-white'}`}>{b.cta}</div>
            </a>
          ))}
        </div>
      </section>

      {/* ═══ FLASH DEALS — only sale_price products ═══ */}
      {(() => {
        const allProducts = Object.values(productsByCategory).flat()
        const now = new Date()
        const deals = allProducts.filter((p: any) => {
          // Flash deal flag from admin OR has sale_price
          const isFlash = p.is_flash_deal && (!p.flash_deal_end || new Date(p.flash_deal_end) > now)
          const hasSale = p.sale_price && Number(p.sale_price) > 0 && Number(p.sale_price) < Number(p.base_price)
          return isFlash || hasSale
        })
        const seen = new Set<string>()
        const uniqueDeals = deals.filter((p: any) => { if (seen.has(p.id)) return false; seen.add(p.id); return true })
        if (!uniqueDeals.length) return null
        return (
          <section className="max-w-[1200px] mx-auto px-4 md:px-5 pb-6 md:pb-10">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl md:rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3 md:py-5 border-b border-[var(--border)]">
                <div className="flex items-center gap-2 md:gap-3">
                  <h2 className="text-base md:text-xl font-bold text-[var(--text)] m-0">Flash Deals</h2>
                  <span className="text-[10px] md:text-xs font-medium text-[var(--text3)] hidden sm:inline">Онцгой хямдрал</span>
                </div>
                <div className="flex items-center gap-4">
                  <FlashCountdown />
                  <a href="/shop?deals=true" className="text-sm font-semibold text-[#FF6B00] hover:underline hidden sm:block">Бүгдийг үзэх →</a>
                </div>
              </div>
              <div className="p-5">
                <ProductCarousel items={uniqueDeals} />
              </div>
            </div>
          </section>
        )
      })()}

      {/* ═══ CATEGORY TABS + PRODUCTS ═══ */}
      {categories.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-5 pb-10">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="flex overflow-x-auto border-b border-[var(--border)]" style={{ scrollbarWidth: 'none' }}>
              {categories.map(cat => {
                const id = String(cat.id)
                const isAct = activeCategory === id
                return (
                  <button
                    key={id}
                    onClick={() => setActiveCategory(id)}
                    className={`flex-shrink-0 px-5 py-4 border-b-2 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                      isAct
                        ? 'border-[#FF6B00] text-[#FF6B00] font-semibold'
                        : 'border-transparent text-[var(--text2)] hover:text-[var(--text)]'
                    }`}
                  >
                    {cat.icon && <span className="text-base">{cat.icon}</span>}
                    {cat.name_mn || cat.name}
                  </button>
                )
              })}
            </div>
            <div className="p-5">
              {activeCategory && productsByCategory[activeCategory] ? (
                productsByCategory[activeCategory].length > 0 ? (
                  <ProductCarousel items={productsByCategory[activeCategory]} />
                ) : (
                  <div className="text-center py-10 text-[var(--text3)] text-sm">Бүтээгдэхүүн олдсонгүй</div>
                )
              ) : (
                <div className="flex gap-4">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex-shrink-0 w-[220px] h-[280px] bg-[var(--surface2)] rounded-xl animate-pulse" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Category carousels removed — products shown in Category Tabs above */}

      {/* ═══ PROMO BANNER GRID ═══ */}
      <section className="max-w-[1200px] mx-auto px-4 md:px-5 pb-5 md:pb-8">
        <div className="grid grid-cols-3 gap-2 md:gap-4 h-[120px] md:h-[220px]">
          <a href="/shop?cat=banner" className="rounded-xl md:rounded-2xl overflow-hidden relative group h-full hover:-translate-y-0.5 transition-all duration-300 no-underline">
            <div className="w-full h-full bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D]" />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-2 md:p-6">
              <div className="text-[8px] md:text-[10px] font-bold text-[#FF6B00] uppercase tracking-[0.15em] mb-1 md:mb-2">Онцлох</div>
              <div className="text-xs md:text-xl font-bold text-white leading-tight">Баннер</div>
              <div className="mt-1 text-[9px] md:text-xs text-white/40 hidden md:block">20% хямдрал</div>
            </div>
          </a>
          <a href="/shop" className="rounded-xl md:rounded-2xl overflow-hidden relative group h-full hover:-translate-y-0.5 transition-all duration-300 no-underline">
            <div className="w-full h-full bg-gradient-to-br from-[#1A1A2E] to-[#16213E]" />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-2 md:p-6">
              <div className="text-[8px] md:text-[10px] font-bold text-[#8B5CF6] uppercase tracking-[0.15em] mb-1 md:mb-2">Шинэ</div>
              <div className="text-xs md:text-xl font-bold text-white leading-tight">Хэвлэл</div>
              <div className="mt-1 text-[9px] md:text-xs text-white/40 hidden md:block">Захиалга өгөх →</div>
            </div>
          </a>
          <a href="/shop?cat=sticker" className="rounded-xl md:rounded-2xl overflow-hidden relative group h-full hover:-translate-y-0.5 transition-all duration-300 no-underline">
            <div className="w-full h-full bg-gradient-to-br from-[#1A1A1A] to-[#2D1A0A]" />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-2 md:p-6">
              <div className="text-[8px] md:text-[10px] font-bold text-[#F59E0B] uppercase tracking-[0.15em] mb-1 md:mb-2">Хямд</div>
              <div className="text-xs md:text-xl font-bold text-white leading-tight">Стикер</div>
              <div className="mt-1 text-[9px] md:text-xs text-white/40 hidden md:block">₮500-аас</div>
            </div>
          </a>
        </div>
      </section>

      {/* ═══ TEMPLATE PREVIEW STRIP ═══ */}
      {templates.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-5 pb-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-[var(--text)] m-0">Бэлэн загварууд</h2>
              <p className="text-sm text-[var(--text3)] mt-1 m-0">Загвар сонгоод шууд захиалаарай</p>
            </div>
            <a href="/templates" className="text-sm font-semibold text-[#FF6B00] hover:underline no-underline">Бүгдийг үзэх →</a>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {templates.map((t: any, i) => {
              const catColors: Record<string, string> = { business_card: '#FF6B00', flyer: '#8B5CF6', banner: '#3B82F6', sticker: '#10B981', book: '#F59E0B' }
              const color = catColors[t.category] || '#FF6B00'
              return (
                <a key={t.id || i} href={`/templates?use=${t.id}`} className="flex-shrink-0 w-[200px] bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 no-underline">
                  <div className="h-[140px] overflow-hidden" style={{ background: t.preview_url ? 'transparent' : `linear-gradient(135deg, ${color}22 0%, ${color}44 100%)` }}>
                    {t.preview_url
                      ? <img src={t.preview_url} alt={t.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      : <div className="w-full h-full flex items-center justify-center text-4xl">🖨️</div>}
                  </div>
                  <div className="p-3">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 uppercase tracking-wide" style={{ color, background: color + '15' }}>{t.category || 'Загвар'}</span>
                    <div className="text-xs font-semibold text-[var(--text)] truncate">{t.name || 'Загвар'}</div>
                    {t.downloads != null && <div className="text-[11px] text-[var(--text3)] mt-1">{t.downloads} ашигласан</div>}
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      )}

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="max-w-[1200px] mx-auto px-4 md:px-5 pb-6 md:pb-10">
        <div className="text-center mb-5 md:mb-8">
          <h2 className="text-base md:text-xl font-bold text-[var(--text)] mb-1 tracking-tight">Яагаад BizPrint?</h2>
          <p className="text-[10px] md:text-xs text-[var(--text3)]">4 алхамаар хэвлэлийн захиалгаа бэлэн болго</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4 relative">
          {[
            { step: '01', title: 'Бүтээгдэхүүн сонгох', desc: 'Төрлөө сонгоод хэмжээ тохируулна', href: '/shop' },
            { step: '02', title: 'Дизайн / Файл', desc: 'Загвар сонгох эсвэл PDF оруулна', href: '/templates' },
            { step: '03', title: 'Бид хэвлэнэ', desc: 'AI тохиромжтой үйлдвэрт дамжуулна', href: '/quote' },
            { step: '04', title: 'Хаалгаандаа авна', desc: 'УБ даяар 24-48 цагт хүргэнэ', href: '/shop' },
          ].map((s) => (
            <a key={s.step} href={s.href} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl md:rounded-2xl p-3 md:p-5 text-center no-underline group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 hover:border-[var(--orange-20)]">
              <div className="text-lg md:text-2xl font-black text-[var(--orange-15)] mb-1.5 md:mb-3 tracking-tighter">{s.step}</div>
              <div className="text-xs md:text-sm font-bold text-[var(--text)] mb-1">{s.title}</div>
              <div className="text-[9px] md:text-[11px] text-[var(--text3)] leading-relaxed">{s.desc}</div>
            </a>
          ))}
        </div>
      </section>

      {/* ═══ SERVICE HIGHLIGHTS ═══ */}
      {settings.features_active !== 'false' && settings.features_active !== false && (() => {
        const defaultItems = [
          { icon: '🤖', title: 'AI Үнийн Тооцоо', desc: 'PDF хуулаад шууд үнэ тооцоол', color: '#FF6B00' },
          { icon: '🚚', title: 'Хурдан Хүргэлт', desc: 'Улаанбаатар даяар 24 цагийн дотор', color: '#3B82F6' },
          { icon: '🎨', title: 'Онлайн Дизайн', desc: 'Бэлэн загвар ашиглан хэвлүүлэх', color: '#8B5CF6' },
          { icon: '🏭', title: 'Автомат Үйлдвэр', desc: 'Хамгийн тохиромжтой үйлдвэр сонгоно', color: '#10B981' },
        ]
        const items = parseJsonItems(settings.features_items, defaultItems)
        return (
          <section className="max-w-[1200px] mx-auto px-5 pb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {items.map((f: any) => {
                const color = f.color || '#FF6B00'
                return (
                  <a key={f.title} href={f.url || f.href || '#'} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 no-underline flex items-start gap-4 group hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: color + '12' }}>
                      {f.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--text)] mb-1 group-hover:text-[#FF6B00] transition-colors">{f.title}</div>
                      <div className="text-xs text-[var(--text3)] leading-relaxed">{f.desc}</div>
                    </div>
                  </a>
                )
              })}
            </div>
          </section>
        )
      })()}

      {/* ═══ CTA BANNER — Premium ═══ */}
      {settings.cta_section_active !== false && settings.cta_section_active !== 'false' && (
        <section className="max-w-[1200px] mx-auto px-5 pb-10">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF6B00]/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF6B00]/30 to-transparent" />
            <h2 className="text-xl md:text-2xl font-bold text-[var(--text)] mb-2 relative tracking-tight">
              {settings.cta_title || 'Хэвлэлээ захиалахад бэлэн үү?'}
            </h2>
            <p className="text-sm text-[var(--text3)] mb-6 relative">
              {settings.cta_subtitle || settings.hero_subtitle || 'PDF файлаа хуулаад хэдхэн секундэд үнийн санал аваарай'}
            </p>
            <div className="flex gap-3 justify-center flex-wrap relative">
              <a href={settings.cta_button_url || '/quote'} className="px-7 py-3 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#E55D00] transition-colors no-underline">
                {settings.cta_button_text || 'Үнийн санал авах'}
              </a>
              <a href="/register" className="px-7 py-3 bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] rounded-xl text-sm font-medium hover:bg-[var(--surface3)] transition-colors no-underline">
                Бүртгүүлэх
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
