'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import GlobalProductCard from '@/components/ProductCard'
import InstantQuoteWidget from '@/components/InstantQuoteWidget'

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
              {slide.video_url ? (
                <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
                  <source src={slide.video_url} type="video/mp4" />
                </video>
              ) : slide.image_url ? (
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

            {/* Headline */}
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight mb-4">
                Хэвлэлээ захиалахад{' '}
                <span className="text-[#FF6B00]">бэлэн үү.</span>
              </h1>
              <p className="text-sm md:text-lg text-white/60 leading-relaxed mb-8 max-w-lg">
                Файлаа оруулаад AI секундэд үнэ тооцоолно. Монголын хамгийн хурдан хэвлэлийн платформ.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3 mb-10">
                <Link href="/quote" className="no-underline group">
                  <span className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#FF6B00] hover:bg-[#E55D00] text-white rounded-xl text-sm md:text-base font-bold transition-all hover:shadow-lg hover:shadow-[#FF6B00]/25">
                    Үнэ авах
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="group-hover:translate-x-0.5 transition-transform"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                </Link>
                <Link href="/shop" className="no-underline">
                  <span className="inline-flex items-center px-7 py-3.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/15 text-white rounded-xl text-sm md:text-base font-medium transition-all">
                    Дэлгүүр үзэх
                  </span>
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

      {/* ═══ SERVICES GRID ═══ */}
      <section className="max-w-[1100px] mx-auto px-5 py-10 md:py-16">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Үйлчилгээ</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>Хэрэгтэй зүйлээ сонгоорой</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {[
            { icon: '🖨️', title: 'Хэвлэл захиалах', desc: 'PDF оруулж AI-аар үнэ авах', href: '/quote', color: '#FF6B00' },
            { icon: '🛒', title: 'Дэлгүүр', desc: 'Бэлэн бүтээгдэхүүн сонгох', href: '/shop', color: '#8B5CF6' },
            { icon: '🤖', title: 'Шууд үнэ мэдэх', desc: '10 секундэд үнэ тооцоолох', href: '/quote/instant', color: '#3B82F6' },
            { icon: '🎨', title: 'Дизайн захиалах', desc: 'Creator-оор хийлгэх', href: '/marketplace', color: '#EC4899' },
            { icon: '💳', title: 'Нэрийн хуудас', desc: '3 алхамаар, QR кодтой', href: '/business-cards', color: '#F59E0B' },
            { icon: '🎭', title: 'Загвар сан', desc: 'Бэлэн загвар ашиглах', href: '/templates', color: '#10B981' },
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
    </div>
  )
}
