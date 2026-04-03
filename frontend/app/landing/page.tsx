'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ─── BizPrint Brand Tokens (orange, not purple) ────────────────────────────
const T = {
  bg: '#050507', surface: '#0a0a0f', surface2: '#0f0f16', surface3: '#14141e',
  border: '#1c1c28', border2: '#26263a',
  accent: '#FF6B00', accent2: '#FF8C42', accent3: '#FFB380',
  cyan: '#22d3ee', green: '#34d399', amber: '#fbbf24', pink: '#f472b6',
  text: '#f8fafc', muted: '#94a3b8', dim: '#475569',
}

// ─── Hooks ─────────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView] as const
}

function useTypewriter(text: string, speed = 40, started = true) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    if (!started) return
    setDisplayed('')
    let i = 0
    const id = setInterval(() => { i++; setDisplayed(text.slice(0, i)); if (i >= text.length) clearInterval(id) }, speed)
    return () => clearInterval(id)
  }, [text, speed, started])
  return displayed
}

// ─── Particle Canvas ───────────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const W = c.width = window.innerWidth
    const H = c.height = window.innerHeight
    const pts = Array.from({ length: 50 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
    }))
    let raf: number
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,107,0,0.3)'; ctx.fill()
      })
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 140) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y)
            ctx.strokeStyle = `rgba(255,107,0,${(1 - d / 140) * 0.15})`; ctx.lineWidth = 0.5; ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.6 }} />
}

// ─── Ticker ────────────────────────────────────────────────────────────────
function Ticker() {
  const items = ['⚡ AI Instant Quote', '🏭 Factory Intelligence', '📦 Smart Routing', '💳 QPay · SocialPay', '🔴 Live Tracking', '🧠 Imposition Engine', '🚀 Gang Run Optimizer', '📐 PDF Analyzer']
  return (
    <div style={{ borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: '0.55rem 0', background: T.surface, overflow: 'hidden' }}>
      <div style={{ display: 'flex', animation: 'ticker 28s linear infinite', whiteSpace: 'nowrap' }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} style={{ padding: '0 2.5rem', fontSize: '0.75rem', color: T.dim, fontFamily: 'monospace', letterSpacing: '0.06em' }}>{item}</span>
        ))}
      </div>
    </div>
  )
}

// ─── Pipeline ──────────────────────────────────────────────────────────────
function Pipeline() {
  const [ref, inView] = useInView()
  const steps = [
    { icon: '📄', label: 'PDF Upload', color: T.accent },
    { icon: '🔍', label: 'PDF Inspect', color: T.accent2 },
    { icon: '📐', label: 'Size Detect', color: T.cyan },
    { icon: '🗂', label: 'Imposition', color: T.green },
    { icon: '⚡', label: 'Gang Run', color: T.amber },
    { icon: '🏭', label: 'Machine Select', color: T.pink },
    { icon: '💰', label: 'Cost Engine', color: T.accent },
    { icon: '✅', label: 'Quote Output', color: T.green },
  ]
  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', marginTop: '3rem', overflowX: 'auto', paddingBottom: '1rem' }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(16px)', transition: `all 0.5s ${i * 0.07}s ease` }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: T.surface2, border: `2px solid ${s.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: `0 0 18px ${s.color}22` }}>{s.icon}</div>
            <span style={{ fontSize: '0.72rem', color: T.muted, textAlign: 'center', maxWidth: 70 }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <div style={{ width: 40, height: 1, background: `linear-gradient(90deg, ${s.color}40, ${steps[i + 1].color}40)`, flexShrink: 0, margin: '0 4px', marginBottom: 18 }} />}
        </div>
      ))}
    </div>
  )
}

// ─── Feature Card ──────────────────────────────────────────────────────────
function FeatureCard({ icon, label, desc, tag }: { icon: string; label: string; desc: string; tag: string }) {
  const [ref, inView] = useInView(0.1)
  const [hov, setHov] = useState(false)
  return (
    <div ref={ref} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? T.surface2 : T.surface, padding: '2rem', opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s ease, background 0.2s' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,107,0,0.08)', border: `1px solid ${T.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '1.25rem' }}>{icon}</div>
      <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: '1rem', marginBottom: '0.6rem', color: T.text }}>{label}</div>
      <div style={{ fontSize: '0.875rem', color: T.muted, lineHeight: 1.65, fontWeight: 300, marginBottom: '1rem' }}>{desc}</div>
      <span style={{ display: 'inline-flex', padding: '0.2rem 0.65rem', background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.25)', borderRadius: 100, fontFamily: 'monospace', fontSize: '0.7rem', color: T.accent2 }}>{tag}</span>
    </div>
  )
}

// ─── Section Header ────────────────────────────────────────────────────────
function SectionHeader({ label, title }: { label: string; title: string }) {
  const [ref, inView] = useInView()
  return (
    <div ref={ref} style={{ marginBottom: '0.5rem' }}>
      <div style={{ marginBottom: '0.75rem', opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.6s ease' }}>
        <span style={{ display: 'inline-flex', padding: '0.2rem 0.65rem', background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.25)', borderRadius: 100, fontFamily: 'monospace', fontSize: '0.7rem', color: T.accent2 }}>{label}</span>
      </div>
      <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, whiteSpace: 'pre-line', color: T.text, opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.7s 0.1s ease' }}>{title}</h2>
    </div>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [heroRef, heroIn] = useInView(0.1)
  const typed = useTypewriter('POST /ai/full-quote → ₮148,000 · HP Indigo 7900 · 3-5 өдөр', 28, heroIn)

  const features = [
    { icon: '🧠', label: 'AI Print Engine', desc: 'PDF upload → ~1s үнийн санал. Imposition, gang run, machine selection — бүгд автомат.', tag: 'Core Engine' },
    { icon: '⚡', label: 'Gang Run Optimizer', desc: 'Олон захиалгыг нэг хуудсанд оновчтой байрлуулж хаягдлыг 40% хүртэл бууруулна.', tag: 'Cost Saver' },
    { icon: '🏭', label: 'Factory Intelligence', desc: 'Бодит цагт бүх үйлдвэрийн ачаалал, дарааллыг хянаж хамгийн оновчтой сонголт хийнэ.', tag: 'Smart Routing' },
    { icon: '📋', label: 'Production Scheduler', desc: 'Queue time, start/finish time — автоматаар тооцооллно.', tag: 'Scheduler AI' },
    { icon: '💳', label: 'Монгол Төлбөр', desc: 'QPay, SocialPay, Khan Bank. Монгол хэрэглэгчдэд зориулсан native payment.', tag: 'Local Pay' },
    { icon: '🌐', label: 'Omni-Channel', desc: 'Website, Facebook, Instagram, WhatsApp — захиалга нэг системд.', tag: 'Multi Source' },
  ]

  const stats = [
    { val: '~1s', label: 'Quote хурд', color: T.accent },
    { val: '8', label: 'AI Tools', color: T.green },
    { val: '40+', label: 'System modules', color: T.cyan },
    { val: '25%', label: 'Ашгийн хувь', color: T.amber },
  ]

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: T.bg, color: T.text, minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(32px) } to { opacity:1; transform:translateY(0) } }
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
        @keyframes ticker { from { transform:translateX(0) } to { transform:translateX(-50%) } }
        @keyframes gradient-x { 0%,100% { background-position:0% 50% } 50% { background-position:100% 50% } }
        .fade-up { animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both }
        .text-grad { background:linear-gradient(135deg,${T.accent},${T.accent2},${T.amber}); background-size:300% 300%; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:gradient-x 4s ease infinite }
        .grid-bg { background-image:linear-gradient(${T.border} 1px,transparent 1px),linear-gradient(90deg,${T.border} 1px,transparent 1px); background-size:48px 48px }
      `}</style>

      {/* ═══ NAV ═══ */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', background: 'rgba(5,5,7,0.9)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${T.border}` }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, background: T.accent, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 900 }}>B</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: T.text }}>Biz<span style={{ color: T.accent }}>Print</span></span>
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />
            <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: T.green }}>API Online</span>
          </div>
          <Link href="/login" style={{ padding: '0.45rem 1rem', background: 'transparent', border: `1px solid ${T.border2}`, borderRadius: 6, fontSize: '0.8rem', color: T.muted, textDecoration: 'none', fontWeight: 600 }}>Нэвтрэх</Link>
          <Link href="/smart-quote" style={{ padding: '0.45rem 1rem', background: T.accent, borderRadius: 6, fontSize: '0.8rem', color: 'white', textDecoration: 'none', fontWeight: 700, border: 'none' }}>⚡ Quote авах</Link>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.25, maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 100%)' }} />
        <ParticleField />
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,0,0.1) 0%, transparent 70%)', top: '10%', right: '-10%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, padding: '0 2.5rem', paddingTop: 80 }}>
          <div className="fade-up" style={{ marginBottom: '1.5rem' }}>
            <span style={{ display: 'inline-flex', padding: '0.2rem 0.65rem', background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.25)', borderRadius: 100, fontFamily: 'monospace', fontSize: '0.7rem', color: T.accent2 }}>🚀 Монголын анхны Print Factory OS</span>
          </div>
          <h1 className="fade-up" style={{ fontSize: 'clamp(3rem,7vw,5.5rem)', fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.04em', marginBottom: '1.5rem', animationDelay: '0.1s' }}>
            PDF оруул.<br /><span className="text-grad">1 секундэд</span><br />үнэ гар.
          </h1>
          <p className="fade-up" style={{ fontSize: '1.1rem', color: T.muted, lineHeight: 1.75, maxWidth: 520, marginBottom: '2rem', fontWeight: 300, animationDelay: '0.2s' }}>
            AI-д тулгуурласан хэвлэлийн платформ. Захиалгыг автоматаар тооцоолж, хамгийн ойр үйлдвэрт шилжүүлнэ.
          </p>

          {/* Terminal */}
          <div className="fade-up" style={{ marginBottom: '2.5rem', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '1rem 1.25rem', maxWidth: 560, animationDelay: '0.3s' }}>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
              <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: T.dim, marginLeft: '0.5rem' }}>bizprint-api</span>
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: T.accent2 }}>$ </span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: T.green }}>{typed}</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: T.muted, animation: 'blink 1s infinite' }}>▋</span>
          </div>

          <div className="fade-up" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', animationDelay: '0.4s' }}>
            <Link href="/smart-quote" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', background: T.accent, color: 'white', borderRadius: 6, fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(255,107,0,0.3)' }}>⚡ Үнийн санал авах</Link>
            <Link href="/dashboard/customer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', background: 'transparent', border: `1px solid ${T.border2}`, color: T.muted, borderRadius: 6, fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none' }}>📊 Dashboard →</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="hide-mobile" style={{ position: 'absolute', right: '3rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '0.75rem', zIndex: 1 }}>
          {stats.map((s, i) => (
            <div key={i} className="fade-up" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '1rem 1.5rem', minWidth: 150, borderTop: `2px solid ${s.color}`, animationDelay: `${0.5 + i * 0.1}s` }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '0.75rem', color: T.muted, marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <Ticker />

      {/* ═══ AI Pipeline ═══ */}
      <section style={{ padding: '6rem 2.5rem', maxWidth: 1100, margin: '0 auto' }}>
        <SectionHeader label="AI Pipeline" title={'Автомат хэвлэлийн\nдамжуулах хоолой'} />
        <Pipeline />
      </section>

      {/* ═══ Features ═══ */}
      <section style={{ padding: '4rem 2.5rem 6rem', maxWidth: 1100, margin: '0 auto' }}>
        <SectionHeader label="Платформын давуу тал" title={'Дэлхийн түвшний\nхэвлэлийн технологи'} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: T.border, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', marginTop: '3rem' }}>
          {features.map((f, i) => <FeatureCard key={i} {...f} />)}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{ padding: '0 2.5rem 6rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ background: `linear-gradient(135deg, ${T.surface2} 0%, rgba(255,107,0,0.06) 100%)`, border: `1px solid ${T.border}`, borderRadius: 20, padding: '3rem 3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: T.text }}>BizPrint — Хэвлэлийн ухаалаг платформ</div>
            <div style={{ color: T.muted, fontWeight: 300 }}>AI-тай секундын дотор үнэ бодоод, шууд захиалга өгөөрэй.</div>
          </div>
          <Link href="/smart-quote" style={{ padding: '0.875rem 2rem', background: T.accent, borderRadius: 8, fontSize: '1rem', fontWeight: 700, color: 'white', textDecoration: 'none', flexShrink: 0, boxShadow: '0 8px 32px rgba(255,107,0,0.3)' }}>Одоо эхлэх →</Link>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer style={{ borderTop: `1px solid ${T.border}`, padding: '2rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1100, margin: '0 auto' }}>
        <span style={{ fontSize: '0.8rem', color: T.dim }}>© 2026 BizPrint. Бүх эрх хуулиар хамгаалагдсан.</span>
        <Link href="/" style={{ fontSize: '0.8rem', color: T.accent, textDecoration: 'none' }}>← Нүүр хуудас руу</Link>
      </footer>
    </div>
  )
}
