'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

const API = 'http://localhost:4000'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

const STATS = [
  { label: 'Захиалга', target: 1240, suffix: '+', color: '#FF6B00' },
  { label: 'Үйлдвэр', target: 48, suffix: '+', color: '#3B82F6' },
  { label: 'Хэрэглэгч', target: 860, suffix: '+', color: '#10B981' },
  { label: 'Үнэлгээ', target: 48, suffix: '★', divisor: 10, color: '#F59E0B' },
]

function useCountUp(target: number, active: boolean, duration = 1200) {
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
    <div style={{ textAlign: 'center', padding: '24px 16px' }}>
      <div style={{ fontSize: 40, fontWeight: 800, color: stat.color, letterSpacing: '-1px', lineHeight: 1 }}>
        {display}{stat.suffix}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 8, fontWeight: 500 }}>{stat.label}</div>
    </div>
  )
}

export default function HomePage() {
  const [banners, setBanners] = useState<any[]>([])
  const [current, setCurrent] = useState(0)
  const [categories, setCategories] = useState<any[]>([])
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${API}/banners`).then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d.filter((b: any) => b.isActive !== false) : []
      setBanners(list)
    }).catch(() => {})
    fetch(`${API}/categories`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setCategories(d.filter((c: any) => c.isActive !== false).slice(0, 8))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setStatsVisible(true) }, { threshold: 0.3 })
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

  const features = [
    { icon: '🤖', title: 'AI Үнийн Тооцоо', desc: 'PDF хуулаад шууд үнэ тооцоол', color: '#FF6B00' },
    { icon: '🏭', title: 'Автомат Үйлдвэр', desc: 'Хамгийн тохиромжтой үйлдвэрийг автомат сонгоно', color: '#3B82F6' },
    { icon: '🚚', title: 'Бодит Цагийн Хүргэлт', desc: 'Захиалгаа бодит цагаар хянах', color: '#10B981' },
    { icon: '🎨', title: 'Онлайн Дизайн', desc: 'Бэлэн загвар сонгож, өөрчилж хэвлүүлэх', color: '#8B5CF6' },
    { icon: '💰', title: 'Хэтэвч Систем', desc: 'Нэгдсэн санхүүгийн удирдлага', color: '#F59E0B' },
    { icon: '🤝', title: 'Партнер Хөтөлбөр', desc: 'Борлуулалт бүрээс комисс авах', color: '#EF4444' },
  ]

  return (
    <div style={{ fontFamily: F, color: 'var(--text)', background: 'var(--bg)' }}>

      {/* ═══ HERO / BANNER SLIDER ═══ */}
      <section style={{ position: 'relative', height: '520px', overflow: 'hidden' }}>
        {banners.length > 0 ? banners.map((b, i) => (
          <div key={b.id || i} style={{
            position: 'absolute', inset: 0, transition: 'opacity 0.6s ease, transform 0.6s ease',
            opacity: i === current ? 1 : 0, transform: i === current ? 'scale(1)' : 'scale(1.05)',
          }}>
            {b.imageUrl ? (
              <img src={b.imageUrl} alt={b.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, #0A0A0A 0%, ${['#1a0a00', '#0a0a1a', '#0a1a0a'][i % 3]} 100%)` }} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 100%)' }} />
            <div style={{ position: 'absolute', bottom: '25%', left: '6%', maxWidth: '550px', zIndex: 2 }}>
              <h2 style={{ fontSize: '42px', fontWeight: 700, color: '#fff', lineHeight: 1.15, margin: '0 0 14px', letterSpacing: '-1px' }}>
                {b.title || 'BizPrint'}
              </h2>
              {b.description && <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', margin: '0 0 24px', lineHeight: 1.6 }}>{b.description}</p>}
              {b.link && (
                <a href={b.link} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: '#FF6B00', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
                  {b.buttonText || 'Дэлгэрэнгүй'} →
                </a>
              )}
            </div>
          </div>
        )) : (
          /* Default hero when no banners */
          <div style={{ position: 'relative', width: '100%', height: '100%', background: 'linear-gradient(135deg, #0A0A0A 0%, #1a0a00 100%)' }}>
            <div style={{ position: 'absolute', top: '20%', left: '15%', width: '400px', height: '400px', background: 'rgba(255,107,0,0.08)', borderRadius: '50%', filter: 'blur(80px)' }} />
            <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '300px', height: '300px', background: 'rgba(255,107,0,0.05)', borderRadius: '50%', filter: 'blur(60px)' }} />
            <div style={{ position: 'absolute', top: '50%', left: '6%', transform: 'translateY(-50%)', maxWidth: '600px', zIndex: 2 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: '8px', padding: '6px 14px', marginBottom: '20px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#FF6B00' }} />
                <span style={{ fontSize: '12px', color: '#FF6B00', fontWeight: 500 }}>Print Industry Platform</span>
              </div>
              <h1 style={{ fontSize: '52px', fontWeight: 700, color: '#F1F5F9', lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-2px' }}>
                Хэвлэлийн бүх <span style={{ color: '#FF6B00' }}>шийдэл</span> нэг дор
              </h1>
              <p style={{ fontSize: '17px', color: '#888', lineHeight: 1.7, margin: '0 0 32px' }}>
                AI-д суурилсан үнийн тооцоо, автомат үйлдвэр сонголт, бодит цагийн хүргэлт — бүгд нэг платформд.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a href="/quote" style={{ padding: '14px 32px', background: '#FF6B00', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '15px', fontWeight: 600 }}>
                  Үнийн санал авах →
                </a>
                <a href="/shop" style={{ padding: '14px 32px', background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)', color: '#FF6B00', borderRadius: '10px', textDecoration: 'none', fontSize: '15px', fontWeight: 500 }}>
                  Дэлгүүр үзэх
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Slider controls */}
        {banners.length > 1 && (
          <>
            <button onClick={prev} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>‹</button>
            <button onClick={next} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>›</button>
            <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 3 }}>
              {banners.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i === current ? '#FF6B00' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ═══ FEATURES ═══ */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.5px' }}>Яагаад <span style={{ color: '#FF6B00' }}>BizPrint</span>?</h2>
          <p style={{ fontSize: '15px', color: 'var(--text2)', maxWidth: '500px', margin: '0 auto' }}>Хэвлэлийн салбарын бүх оролцогчдыг нэгтгэсэн иж бүрэн экосистем</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }} className="grid-3">
          {features.map(f => (
            <div key={f.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', transition: 'border-color 0.2s', cursor: 'default' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = f.color + '40')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div style={{ fontSize: '32px', marginBottom: '14px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '17px', fontWeight: 600, margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text2)', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section ref={statsRef} style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.06) 0%, rgba(59,130,246,0.06) 100%)', border: '1px solid var(--border)', borderRadius: 20, padding: '48px 40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
            {STATS.map((stat, i) => (
              <div key={stat.label} style={{ borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <StatItem stat={stat} active={statsVisible} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL MEDIA DESIGN SERVICE ═══ */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'center' }} className="grid-2">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8B5CF6' }} />
              <span style={{ fontSize: '12px', color: '#8B5CF6', fontWeight: 500 }}>Шинэ үйлчилгээ</span>
            </div>
            <h2 style={{ fontSize: '34px', fontWeight: 700, margin: '0 0 14px', letterSpacing: '-1px', lineHeight: 1.15 }}>
              Сошиал медиа <span style={{ color: '#8B5CF6' }}>дизайн</span> үйлчилгээ
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text2)', lineHeight: 1.7, margin: '0 0 24px' }}>
              Facebook, Instagram постер, story, reels cover — мэргэжлийн дизайнер таны брэндэд тохирсон контент бэлтгэнэ. Хэвлэлтэй хослуулан захиалвал хямд!
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a href="/services" style={{ padding: '12px 28px', background: '#8B5CF6', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Үйлчилгээ үзэх →</a>
              <a href="/quote" style={{ padding: '12px 28px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#8B5CF6', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Үнэ тооцоолох</a>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'FB/IG Постер', price: '15,000₮~', color: '#FF6B00', icon: '📱' },
              { label: 'Story дизайн', price: '10,000₮~', color: '#8B5CF6', icon: '📸' },
              { label: 'Нэрийн хуудас', price: '25,000₮~', color: '#10B981', icon: '💼' },
              { label: 'Сарын багц', price: '200,000₮~', color: '#3B82F6', icon: '📅' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', textAlign: 'center', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = s.color + '60')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRINT + SOCIAL COMBO ═══ */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(255,107,0,0.06) 100%)', border: '1px solid var(--border)', borderRadius: '20px', padding: '48px 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.5px' }}>Print + Social <span style={{ color: '#FF6B00' }}>Combo</span></h2>
            <p style={{ fontSize: '14px', color: 'var(--text2)', maxWidth: '500px', margin: '0 auto' }}>Хэвлэл + сошиал дизайныг хамт захиалвал 15-20% хямд</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }} className="grid-3">
            {[
              { title: 'Starter combo', items: ['Нэрийн хуудас 100ш хэвлэл', 'FB/IG постер 1ш', 'Story дизайн 1ш'], price: '45,000', save: '12,000', color: '#FF6B00' },
              { title: 'Business combo', items: ['Нэрийн хуудас + Флаер хэвлэл', 'Social media постер 5ш', 'Story + Reels cover 3ш', 'Brand guideline'], price: '180,000', save: '55,000', color: '#8B5CF6', popular: true },
              { title: 'Monthly Pro', items: ['Сар бүрийн 20 пост дизайн', 'Story 10ш / Reels cover 5ш', 'Content calendar', 'Хэвлэл 20% хямдрал'], price: '350,000', save: '100,000+', color: '#10B981' },
            ].map(c => (
              <div key={c.title} style={{ background: 'var(--surface)', border: c.popular ? `2px solid ${c.color}` : '1px solid var(--border)', borderRadius: '16px', padding: '28px', position: 'relative' }}>
                {c.popular && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '3px 14px', background: c.color, color: '#fff', borderRadius: '99px', fontSize: '11px', fontWeight: 600 }}>Хамгийн их сонголт</div>}
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: c.color }}>{c.title}</h3>
                <div style={{ fontSize: '28px', fontWeight: 700, margin: '8px 0 4px' }}>₮{c.price}</div>
                <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 500, marginBottom: '16px' }}>₮{c.save} хэмнэлт</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
                  {c.items.map(item => (
                    <li key={item} style={{ fontSize: '13px', color: 'var(--text2)', padding: '5px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: c.color, fontSize: '12px' }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
                <a href="/services" style={{ display: 'block', textAlign: 'center', padding: '10px', background: c.popular ? c.color : 'rgba(255,107,0,0.08)', color: c.popular ? '#fff' : '#FF6B00', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 600, border: c.popular ? 'none' : '1px solid rgba(255,107,0,0.2)' }}>Захиалах →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 36px', textAlign: 'center', letterSpacing: '-0.5px' }}>Хэрхэн ажилладаг вэ?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }} className="grid-4">
          {[
            { step: '01', title: 'Үйлчилгээ сонгох', desc: 'Постер, story, нэрийн хуудас эсвэл combo багц', color: '#FF6B00' },
            { step: '02', title: 'Мэдээлэл өгөх', desc: 'Лого, текст, зураг, brand color-оо оруулна', color: '#8B5CF6' },
            { step: '03', title: 'Дизайнер ажиллана', desc: 'Мэргэжлийн дизайнер 24 цагт бэлтгэнэ', color: '#3B82F6' },
            { step: '04', title: 'Хүлээн авах', desc: 'Файл татах + хэвлэл захиалах боломж', color: '#10B981' },
          ].map(s => (
            <div key={s.step} style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: s.color, opacity: 0.15, marginBottom: '8px' }}>{s.step}</div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px' }}>{s.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text2)', margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CATEGORIES ═══ */}
      {categories.length > 0 && (
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 32px', letterSpacing: '-0.5px' }}>Ангилалууд</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }} className="grid-4">
            {categories.map((c: any) => (
              <a key={c.id} href={`/shop?category=${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', textDecoration: 'none', color: 'var(--text)', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#FF6B00')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <span style={{ fontSize: '24px' }}>{c.icon || '📦'}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{c.name_mn || c.name}</div>
                  {c.description && <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>{c.description}</div>}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ═══ B2B ═══ */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(139,92,246,0.06) 100%)', border: '1px solid var(--border)', borderRadius: '24px', padding: '52px 48px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '40px', alignItems: 'center' }} className="grid-2">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '5px 14px', marginBottom: '18px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }} />
              <span style={{ fontSize: '12px', color: '#3B82F6', fontWeight: 600 }}>Бизнес шийдэл</span>
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 12px', letterSpacing: '-1px', lineHeight: 1.2 }}>
              Том тоо хэмжээний<br/>
              <span style={{ color: '#3B82F6' }}>B2B захиалга</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text2)', lineHeight: 1.7, margin: '0 0 28px', maxWidth: '480px' }}>
              Сарын 500ш+ захиалгатай бизнест: 30% хүртэл хямдрал, нэхэмжлэхийн төлбөр, хувийн менежер, загварын сан.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a href="/b2b" style={{ padding: '12px 28px', background: '#3B82F6', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
                Дэлгэрэнгүй →
              </a>
              <a href="/b2b#contact" style={{ padding: '12px 28px', background: 'transparent', border: '1px solid rgba(59,130,246,0.3)', color: '#3B82F6', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
                Хүсэлт илгээх
              </a>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '200px' }} className="hide-mobile">
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

      {/* ═══ CTA ═══ */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 100px' }}>
        <div style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #e05500 100%)', borderRadius: '24px', padding: '60px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#fff', margin: '0 0 14px', letterSpacing: '-1px', position: 'relative' }}>
            Хэвлэлээ захиалахад бэлэн үү?
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', margin: '0 0 32px', position: 'relative' }}>
            PDF файлаа хуулаад хэдхэн секундэд үнийн санал аваарай
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
            <a href="/quote" style={{ padding: '14px 36px', background: '#fff', color: '#FF6B00', borderRadius: '10px', textDecoration: 'none', fontSize: '15px', fontWeight: 700 }}>
              Үнийн санал авах
            </a>
            <a href="/register" style={{ padding: '14px 36px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '15px', fontWeight: 500 }}>
              Бүртгүүлэх
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
