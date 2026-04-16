'use client'
import { apiFetch, API_URL } from '@/lib/api'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import GlobalProductCard from '@/components/ProductCard'
import InstantQuoteWidget from '@/components/InstantQuoteWidget'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

/* ── Carousel helper ── */
function ProductCarousel({ items }: { items: any[] }) {
  const ref = useRef<HTMLDivElement>(null)
  if (!items.length) return null
  const scroll = (d: 'l' | 'r') => ref.current?.scrollBy({ left: d === 'l' ? -260 : 260, behavior: 'smooth' })
  return (
    <div className="relative group/c">
      <button onClick={() => scroll('l')} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 rounded-full bg-white shadow-lg items-center justify-center opacity-0 group-hover/c:opacity-100 transition-opacity hidden md:flex"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button>
      <div ref={ref} className="flex gap-4 overflow-x-auto pb-2 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
        {items.map((p: any, i: number) => <div key={p.id || i} className="flex-shrink-0 w-[220px]"><GlobalProductCard product={p} /></div>)}
      </div>
      <button onClick={() => scroll('r')} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 rounded-full bg-white shadow-lg items-center justify-center opacity-0 group-hover/c:opacity-100 transition-opacity hidden md:flex"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></button>
    </div>
  )
}

/* ═══════════════════════════════════════════
   HOMEPAGE — Bold, clean, eseller.mn inspired
   ═══════════════════════════════════════════ */
export default function HomePage() {
  const { settings } = useSiteSettings()
  const [categories, setCategories] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [productsByCategory, setProductsByCategory] = useState<Record<string, any[]>>({})
  const [heroSlides, setHeroSlides] = useState<any[]>([])
  const [heroIdx, setHeroIdx] = useState(0)

  const heroNext = useCallback(() => setHeroIdx(p => (p + 1) % Math.max(heroSlides.length, 1)), [heroSlides.length])

  useEffect(() => {
    if (heroSlides.length <= 1) return
    const t = setInterval(heroNext, 6000)
    return () => clearInterval(t)
  }, [heroSlides.length, heroNext])

  useEffect(() => {
    apiFetch<any>('/cms/hero-slides/public', { auth: false }).then(d => {
      if (Array.isArray(d)) setHeroSlides(d)
    }).catch(() => {})
  }, [])

  useEffect(() => {
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

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ═══════════════════════════════════════
          HERO — CMS slides background + overlay text
          ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden h-[420px] sm:h-[500px] md:h-[600px] lg:h-[680px]">
        {/* Background: CMS slides or fallback gradient */}
        {heroSlides.length > 0 ? (
          heroSlides.map((slide, i) => (
            <div key={slide.id || i} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: i === heroIdx ? 1 : 0, zIndex: i === heroIdx ? 1 : 0 }}>
              {slide.video_url ? (() => {
                const v = slide.video_url
                const ytMatch = v.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?#]+)/)
                const vimeoMatch = v.match(/vimeo\.com\/(\d+)/)
                const fbMatch = v.includes('facebook.com')
                const embedUrl = ytMatch
                  ? `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1&playlist=${ytMatch[1]}`
                  : vimeoMatch
                  ? `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1&background=1`
                  : fbMatch
                  ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(v)}&show_text=false&autoplay=true&mute=true`
                  : null
                return embedUrl ? (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <iframe
                      src={embedUrl}
                      className="absolute border-none"
                      style={{ top: '50%', left: '50%', width: '177.78vh', height: '56.25vw', minWidth: '100%', minHeight: '100%', transform: 'translate(-50%, -50%)' }}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
                    <source src={v} />
                  </video>
                )
              })() : slide.image_url ? (
                <img src={slide.image_url} alt={slide.title || ''} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] to-[#1a1a2e]" />
              )}
            </div>
          ))
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#111] to-[#0A0A0A]">
            <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #FF6B00, transparent 70%)' }} />
            <div className="absolute bottom-[-100px] left-[-80px] w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)' }} />
          </div>
        )}

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20 z-[2]" />

        {/* Slide indicators */}
        {heroSlides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-[5]">
            {heroSlides.map((_, i) => (
              <button key={i} onClick={() => setHeroIdx(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === heroIdx ? 'w-8 bg-[#FF6B00]' : 'w-1.5 bg-white/40 hover:bg-white/60'}`} />
            ))}
          </div>
        )}

        {/* Hero content overlay */}
        <div className="absolute inset-0 z-[3] flex items-center">
          <div className="max-w-[1100px] mx-auto px-5 w-full">
            {/* Badge */}
            <div className="mb-5">
              <span className="inline-flex items-center gap-2 text-[10px] md:text-[11px] font-bold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full border border-[#FF6B00]/30 text-[#FF6B00] bg-[#FF6B00]/10 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" />
                Хэвлэлийн платформ
              </span>
            </div>

            {/* Headline — admin-editable via CMS site_settings */}
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight mb-4">
                {settings.hero_title || (
                  <>Хэвлэлээ захиалахад <span className="text-[#FF6B00]">бэлэн үү.</span></>
                )}
              </h1>
              <p className="text-sm md:text-lg text-white/60 leading-relaxed mb-8 max-w-lg">
                {settings.hero_subtitle || 'Файлаа оруулаад AI секундэд үнэ тооцоолно. Монголын хамгийн хурдан хэвлэлийн платформ.'}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3 mb-10">
                <Link href={settings.hero_cta_primary_url || '/quote'} className="no-underline group">
                  <span className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#FF6B00] hover:bg-[#E55D00] text-white rounded-xl text-sm md:text-base font-bold transition-all hover:shadow-lg hover:shadow-[#FF6B00]/25">
                    {settings.hero_cta_primary_text || 'Үнэ авах'}
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="group-hover:translate-x-0.5 transition-transform"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                </Link>
                <Link href={settings.hero_cta_secondary_url || '/shop'} className="no-underline">
                  <span className="inline-flex items-center px-7 py-3.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/15 text-white rounded-xl text-sm md:text-base font-medium transition-all">
                    {settings.hero_cta_secondary_text || 'Дэлгүүр үзэх'}
                  </span>
                </Link>
              </div>
              {/* Quick order shortcut */}
              <div className="mb-6">
                <Link href="/quick-order" className="no-underline inline-flex items-center gap-2 text-sm text-white/50 hover:text-[#FF6B00] transition-colors">
                  <span>📁</span> Файл оруулж шууд захиалах →
                </Link>
              </div>

              {/* Process: 3 steps */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                {[
                  { icon: '📄', label: 'Файл оруулах' },
                  { icon: '🤖', label: 'AI тооцоо' },
                  { icon: '🖨️', label: 'Хэвлэл бэлэн' },
                ].map((step, i) => (
                  <div key={step.label} className="flex items-center gap-2 md:gap-3">
                    {i > 0 && <span className="text-white/20">+</span>}
                    <div className="flex items-center gap-2 bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-lg px-3 py-2">
                      <span className="text-base">{step.icon}</span>
                      <span className="text-xs md:text-sm font-medium text-white/90">{step.label}</span>
                    </div>
                  </div>
                ))}
                <span className="text-white/20 hidden md:inline">=</span>
                <div className="hidden md:flex items-center gap-2 bg-[#FF6B00]/15 backdrop-blur-sm border border-[#FF6B00]/25 rounded-lg px-3 py-2">
                  <span className="text-base">🔥</span>
                  <span className="text-sm font-bold text-[#FF6B00]">Бодит хэвлэл</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF STATS ═══ */}
      <SocialProofSection />

      {/* ═══ SERVICES GRID ═══ */}
      <section className="max-w-[1100px] mx-auto px-5 py-10 md:py-16">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Үйлчилгээ</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>Хэрэгтэй зүйлээ сонгоорой</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { icon: '🖨️', title: 'Хэвлэл захиалах', desc: 'PDF оруулж AI-аар үнэ авах', href: '/quote', color: '#FF6B00' },
            { icon: '🛒', title: 'Дэлгүүр', desc: 'Бэлэн бүтээгдэхүүн сонгох', href: '/shop', color: '#8B5CF6' },
            { icon: '💳', title: 'Нэрийн хуудас', desc: 'Онлайнаар захиалах, QR кодтой', href: '/shop?category=business-card', color: '#F59E0B' },
            { icon: '🎨', title: 'Дизайн хийх', desc: 'Live editor-ээр загвар хийх', href: '/design/editor', color: '#10B981' },
          ].map(s => (
            <Link key={s.title} href={s.href} className="no-underline group">
              <div className="rounded-2xl p-5 md:p-6 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-3 transition-transform group-hover:scale-110"
                  style={{ background: s.color + '10' }}>
                  {s.icon}
                </div>
                <h3 className="text-sm md:text-base font-bold mb-1 group-hover:text-[#FF6B00] transition-colors" style={{ color: 'var(--text)' }}>{s.title}</h3>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ INSTANT QUOTE WIDGET ═══ */}
      <section className="max-w-[1100px] mx-auto px-5 pb-10 md:pb-16">
        <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-3 tracking-tight" style={{ color: 'var(--text)' }}>
              Хэвлэлийн үнэ мэдэх
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text3)' }}>
              Бүтээгдэхүүн, тираж сонгоод шууд үнэ мэдэгдэнэ. Бүртгэл шаардлагагүй.
            </p>
            <div className="space-y-3">
              {[
                { n: '01', t: 'Бүтээгдэхүүний төрөл сонгох' },
                { n: '02', t: 'Тираж тоо оруулах' },
                { n: '03', t: 'Шууд үнэ мэдэгдэнэ' },
              ].map(s => (
                <div key={s.n} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: 'rgba(255,107,0,0.08)', color: '#FF6B00' }}>{s.n}</span>
                  <span className="text-sm" style={{ color: 'var(--text2)' }}>{s.t}</span>
                </div>
              ))}
            </div>
          </div>
          <InstantQuoteWidget />
        </div>
      </section>

      {/* ═══ PRODUCT TABS ═══ */}
      {categories.length > 0 && (
        <section className="max-w-[1100px] mx-auto px-5 pb-10 md:pb-16">
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex overflow-x-auto" style={{ borderBottom: '1px solid var(--border)', scrollbarWidth: 'none' }}>
              {categories.map(cat => {
                const id = String(cat.id)
                return (
                  <button key={id} onClick={() => setActiveCategory(id)}
                    className="flex-shrink-0 px-5 py-4 text-sm font-medium transition-colors whitespace-nowrap"
                    style={{
                      borderBottom: `2px solid ${activeCategory === id ? '#FF6B00' : 'transparent'}`,
                      color: activeCategory === id ? '#FF6B00' : 'var(--text3)',
                    }}>
                    {cat.name_mn || cat.name}
                  </button>
                )
              })}
            </div>
            <div className="p-5">
              {activeCategory && productsByCategory[activeCategory] ? (
                productsByCategory[activeCategory].length > 0
                  ? <ProductCarousel items={productsByCategory[activeCategory]} />
                  : <div className="text-center py-10 text-sm" style={{ color: 'var(--text4)' }}>Бүтээгдэхүүн олдсонгүй</div>
              ) : (
                <div className="flex gap-4">{[1,2,3,4,5].map(i => <div key={i} className="flex-shrink-0 w-[220px] h-[280px] rounded-xl animate-pulse" style={{ background: 'var(--surface2)' }} />)}</div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="max-w-[1100px] mx-auto px-5 pb-10 md:pb-16">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Хэрхэн ажилладаг вэ</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { n: '01', title: 'Бүтээгдэхүүн сонгох', desc: 'Төрлөө сонгож хэмжээ тохируулна' },
            { n: '02', title: 'Файл оруулах', desc: 'PDF файл эсвэл загвар сонгоно' },
            { n: '03', title: 'AI тооцоолно', desc: 'Хамгийн тохиромжтой үйлдвэр олно' },
            { n: '04', title: 'Хүлээн авах', desc: 'УБ даяар 24-48 цагт хүргэнэ' },
          ].map(s => (
            <div key={s.n} className="rounded-2xl p-5 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-2xl font-black mb-3" style={{ color: 'rgba(255,107,0,0.15)' }}>{s.n}</div>
              <div className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>{s.title}</div>
              <div className="text-xs" style={{ color: 'var(--text3)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ BOTTOM CTA ═══ */}
      <section className="max-w-[1100px] mx-auto px-5 pb-16">
        <div className="rounded-2xl p-8 md:p-12 text-center relative overflow-hidden" style={{ background: '#0A0A0A' }}>
          <div className="absolute top-[-80px] right-[-40px] w-[300px] h-[300px] rounded-full opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #FF6B00, transparent 70%)' }} />
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2 relative">Эхлэхэд бэлэн үү?</h2>
          <p className="text-sm text-white/40 mb-6 relative">Файлаа хуулаад хэдхэн секундэд үнэ мэдэгдэнэ</p>
          <div className="flex gap-3 justify-center flex-wrap relative">
            <Link href="/quote" className="no-underline px-7 py-3 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#E55D00] transition-colors">
              Үнийн санал авах
            </Link>
            <Link href="/start" className="no-underline px-7 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
              Бүх үйлчилгээ
            </Link>
          </div>
        </div>
      </section>

      {/* Organization schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'BizPrint',
        url: 'https://bizprint.mn',
        aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '800' },
      }) }} />
    </div>
  )
}

/* ═══ SOCIAL PROOF + TESTIMONIALS ═══ */
const STATS = [
  { value: 1200, suffix: '+', label: 'Биелүүлсэн захиалга' },
  { value: 15, suffix: '+', label: 'Хамтрагч үйлдвэр' },
  { value: 800, suffix: '+', label: 'Сэтгэгдсэн хэрэглэгч' },
  { value: 4.8, suffix: '★', label: 'Дундаж үнэлгээ', decimal: true },
]

const TESTIMONIALS = [
  { text: 'Нэрийн хуудасны чанар гайхалтай байсан. 3 хоногт хүргэж өгсөн. Дахин захиална!', name: 'Б.Мөнхбаяр', role: 'StartupMN LLC', category: 'Нэрийн хуудас' },
  { text: 'Үнэ тооцоолуур маш хялбар байлаа. Флаер болон брошур захиалсан, чанар маш сайн.', name: 'Д.Энхжаргал', role: 'Marketing Pro', category: 'Флаер' },
  { text: 'Арга хэмжээний баннер болон backdrop маш хурдан хийж өгсөн. Үнэ боломжийн.', name: 'Г.Баярмаа', role: 'Event Masters', category: 'Баннер' },
  { text: 'Сав баглааны дизайн болон хэвлэл маш чанартай. Манай брэндийн дүр төрхийг сайн илэрхийлсэн.', name: 'Т.Батболд', role: 'Nomadic Coffee', category: 'Сав баглаа' },
  { text: 'Корпорэйт бизнес карт болон letterhead захиалсан. Мэргэжлийн түвшний хэвлэл.', name: 'С.Болдбаатар', role: 'Tech Solutions', category: 'Нэрийн хуудас' },
  { text: 'Хувцасны шошго болон hang tag захиалсан. Чанар сайн, үнэ боломжийн байсан.', name: 'Н.Оюунцэцэг', role: 'Fashion House MN', category: 'Шошго' },
]

function SocialProofSection() {
  const [visible, setVisible] = useState(false)
  const [counts, setCounts] = useState(STATS.map(() => 0))
  const [tIdx, setTIdx] = useState(0)
  const [liveTestimonials, setLiveTestimonials] = useState(TESTIMONIALS)
  const ref = useRef<HTMLDivElement>(null)

  // Fetch real reviews from API
  useEffect(() => {
    fetch(`${API_URL}/api/reviews?approved=true`).then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length >= 2) {
          setLiveTestimonials(data.slice(0, 6).map(r => ({ text: r.text, name: r.customer_name, role: r.customer_company || '', category: r.product_category || '' })))
        }
      }).catch(() => {})
    fetch(`${API_URL}/api/reviews/summary`).then(r => r.json())
      .then((data: any) => { if (data?.avgRating > 0) STATS[3].value = data.avgRating })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const duration = 1500
    const steps = 40
    const interval = duration / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = Math.min(step / steps, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCounts(STATS.map(s => s.decimal ? +(s.value * eased).toFixed(1) : Math.round(s.value * eased)))
      if (step >= steps) clearInterval(timer)
    }, interval)
    return () => clearInterval(timer)
  }, [visible])

  useEffect(() => {
    const timer = setInterval(() => setTIdx(i => (i + 1) % liveTestimonials.length), 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      {/* Stats */}
      <section ref={ref} style={{ background: '#0A0A0A', padding: '48px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, textAlign: 'center' }}>
          {STATS.map((s, i) => (
            <div key={s.label}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#FF6B00', lineHeight: 1 }}>
                {s.decimal ? counts[i].toFixed(1) : counts[i].toLocaleString()}{s.suffix}
              </div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials — card grid */}
      <section style={{ background: 'var(--surface)', padding: '48px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Хэрэглэгчдийн сэтгэгдэл</h2>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Бидний үйлчлүүлэгчдийн бодит үнэлгээ</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {liveTestimonials.slice(0, 6).map((t, i) => (
              <div key={i} style={{ padding: 20, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--bg)' }}>
                <div style={{ fontSize: 14, color: '#F59E0B', marginBottom: 8 }}>★★★★★</div>
                <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, marginBottom: 12 }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B00', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {t.name?.charAt(0) || 'Х'}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {t.role}{(t as any).category ? ` · ${(t as any).category}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
