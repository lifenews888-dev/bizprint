'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

const CATEGORIES = [
  { key: 'all', label: 'Бүгд', icon: '◎' },
  { key: 'minimal', label: 'Минимал', icon: '○' },
  { key: 'corporate', label: 'Корпорайт', icon: '◆' },
  { key: 'creative', label: 'Бүтээлч', icon: '✦' },
  { key: 'dark', label: 'Харанхуй', icon: '●' },
  { key: 'bold', label: 'Тод', icon: '◉' },
]

function CardPreview({ layout }: { layout: any; card?: any }) {
  const cd = layout?.canvas_data
  const accent = cd?.accent || '#FF6B00'
  const bg = cd?.bg || '#FFFFFF'
  const td = cd?.textDark || '#111'
  const tl = cd?.textLight || '#6B7280'
  const isDark = ['#111111','#1F2937','#0F0F1A','#0C1929','#0A1A0D','#0F1A2E','#1C1917'].includes(bg)
  const zones: any[] = layout?.front_json || []
  const PW = 280, PH = 170
  const sx = PW / 450, sy = PH / 275

  // Zone байгаа бол бодит байрлалаар зурна
  if (zones.length > 0 && zones[0].key) {
    return (
      <div style={{ width: PW, height: PH, background: bg, borderRadius: 8, position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
        {zones.map((z: any) => {
          const x = Math.round(z.x * sx), y = Math.round(z.y * sy)
          const zw = Math.round((z.w || 200) * sx), zh = Math.round((z.h || 20) * sy)
          const fs = Math.max(5, Math.round((z.fontSize || 11) * ((sx + sy) / 2)))
          if (z.type === 'logo') return <div key={z.key} style={{ position: 'absolute', left: x, top: y, width: zw, height: zh, background: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, color: isDark ? 'rgba(255,255,255,0.3)' : '#bbb' }}>Logo</div>
          if (z.type === 'qr') return <div key={z.key} style={{ position: 'absolute', left: x, top: y, width: Math.min(zw, zh), height: Math.min(zw, zh), background: isDark ? 'rgba(255,255,255,0.06)' : '#f9f9f9', borderRadius: 3, border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#ddd'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '55%', height: '55%', background: `repeating-conic-gradient(${isDark ? '#555' : '#999'} 0% 25%, transparent 0% 50%) 0 0 / 3px 3px`, opacity: 0.4 }} /></div>
          if (z.type === 'social') return <div key={z.key} style={{ position: 'absolute', left: x, top: y, display: 'flex', gap: 2 }}>{['#1877F2','#E4405F','#0A66C2'].map((c,i) => <div key={i} style={{ width: Math.max(5, zh * 0.4), height: Math.max(5, zh * 0.4), borderRadius: 3, background: c }} />)}</div>
          if (!z.key) return null
          const color = z.fill === 'accent' ? accent : z.fill === 'light' ? tl : td
          const labels: Record<string, string> = { company_name: 'Company', company_message: 'Slogan', full_name: 'Name', job_title: 'Title', email: '@mail', phone: 'Phone', address1: 'Addr', address2: 'Addr2', website: 'Web' }
          return <div key={z.key} style={{ position: 'absolute', left: x, top: y, fontSize: fs, fontWeight: z.fontWeight === 'bold' ? 700 : 400, color, fontFamily: F, whiteSpace: 'nowrap', overflow: 'hidden', lineHeight: 1.2, textAlign: z.align || 'left', width: z.align ? zw : undefined }}>{labels[z.key] || z.key}</div>
        })}
      </div>
    )
  }

  // Fallback: энгийн preview
  return (
    <div style={{ width: PW, height: PH, background: bg, borderRadius: 8, position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: 4, background: accent }} />
      <div style={{ position: 'absolute', left: 14, top: 16, fontSize: 12, fontWeight: 700, color: accent, fontFamily: F }}>Овог Нэр</div>
      <div style={{ position: 'absolute', left: 14, top: 34, fontSize: 8, color: tl, fontFamily: F }}>Захирал · Компани</div>
      <div style={{ position: 'absolute', left: 14, bottom: 24, fontSize: 7.5, color: tl, fontFamily: F }}>+976 9911 2233</div>
      <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, background: isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f5', borderRadius: 3 }} />
    </div>
  )
}

export default function BusinessCardsPage() {
  const router = useRouter()
  const [cat, setCat] = useState('all')
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [layouts, setLayouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const API = process.env.NEXT_PUBLIC_API_URL || 'https://bizprint-production.up.railway.app'

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`${API}/api/business-cards`, { cache: 'no-store' })
        const data = await res.json()
        const cards = Array.isArray(data) ? data : (data.value || [])
        const all: any[] = []
        cards.forEach((card: any) => {
          if (card.layouts && card.layouts.length > 0) {
            card.layouts
              .filter((l: any) => l.canvas_data)
              .forEach((l: any) => all.push({ ...l, _card: card }))
          }
        })
        setLayouts(all)
      } catch { setLayouts([]) }
      finally { setLoading(false) }
    }
    load()
  }, [API])

  const filtered = cat === 'all' ? layouts : layouts.filter(l => l.type === cat)

  const goEditor = (cardId: string, layoutId: string) =>
    router.push(`/business-cards/editor?bc=${cardId}&layout=${layoutId}`)

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: F }}>
      <div style={{ background: 'linear-gradient(135deg,#FF6B00 0%,#FF8533 50%,#FFa366 100%)', padding: '48px 24px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: 0 }}>Нэрийн хуудас <span style={{ opacity: 0.9 }}>2 минутанд</span></h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 12, lineHeight: 1.6 }}>Загвар сонго → мэдээлэл бөглө → захиал. Дижитал QR карт үнэгүй.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 24 }}>
            {[{ num: `${filtered.length || layouts.length}+`, label: 'Загвар' }, { num: '90×55', label: 'мм стандарт' }, { num: '1-2', label: 'өдөрт бэлэн' }].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{s.num}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: 8, padding: '24px 0 20px', overflowX: 'auto' }}>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setCat(c.key)} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', fontSize: 13, cursor: 'pointer', background: cat === c.key ? '#111' : '#fff', color: cat === c.key ? '#fff' : '#374151', fontWeight: cat === c.key ? 600 : 400, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 10 }}>{c.icon}</span> {c.label}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 13, color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
            {loading ? '...' : `${filtered.length} загвар`}
          </div>
        </div>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, paddingBottom: 48 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                <div style={{ height: 220, background: '#f0f0f0' }} />
                <div style={{ padding: 20 }}>
                  <div style={{ height: 16, background: '#f0f0f0', borderRadius: 8, marginBottom: 8 }} />
                  <div style={{ height: 12, background: '#f0f0f0', borderRadius: 8, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#374151' }}>Загвар олдсонгүй</div>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, paddingBottom: 48 }}>
            {filtered.map(layout => {
              const card = layout._card
              const isHover = hoverId === layout.id
              const accent = layout.canvas_data?.accent || '#FF6B00'
              const bg = layout.canvas_data?.bg || '#fff'
              const tier0 = card.pricingTiers?.[0]
              const minUnit = tier0 ? Number(tier0.unit_price) : 30
              const minQty = tier0 ? Number(tier0.quantity) : 100
              const minTotal = Math.round(minUnit * minQty)

              return (
                <div key={layout.id}
                  onMouseEnter={() => setHoverId(layout.id)}
                  onMouseLeave={() => setHoverId(null)}
                  style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', boxShadow: isHover ? '0 12px 40px rgba(0,0,0,0.14)' : '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB', transform: isHover ? 'translateY(-4px)' : 'none', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
                  <div onClick={() => goEditor(card.id, layout.id)} style={{ padding: 24, background: '#F5F5F5', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 220, position: 'relative' }}>
                    <CardPreview layout={layout} card={card} />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isHover ? 1 : 0, transition: 'opacity 0.2s', borderRadius: '16px 16px 0 0' }}>
                      <div style={{ padding: '12px 28px', background: '#FF6B00', color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 700, boxShadow: '0 4px 16px rgba(255,107,0,0.4)' }}>Энэ загвар ашиглах</div>
                    </div>
                  </div>
                  <div style={{ padding: '16px 20px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#111', lineHeight: 1.3 }}>{layout.name_mn || layout.name}</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, display: 'inline-block' }} />
                          {layout.type}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 3 }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, background: accent, border: '1px solid rgba(0,0,0,0.1)' }} />
                        <div style={{ width: 16, height: 16, borderRadius: 4, background: bg, border: '1px solid rgba(0,0,0,0.1)' }} />
                      </div>
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FAFAFA', borderRadius: 10 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#FF6B00' }}>₮{minTotal.toLocaleString()}-аас</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>{minQty} ширхэг</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>₮{minUnit}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>нэгж үнэ</div>
                      </div>
                    </div>
                    <button onClick={() => goEditor(card.id, layout.id)} style={{ width: '100%', marginTop: 12, padding: '12px', borderRadius: 10, border: 'none', background: isHover ? '#FF6B00' : '#F3F4F6', color: isHover ? '#fff' : '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>
                      Загвар ашиглах
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '32px 0 48px' }}>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>Хүссэн загвараа олохгүй байна уу?</p>
          <a href="/quote" style={{ display: 'inline-block', padding: '12px 32px', background: '#111', color: '#fff', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Тусгай загвар захиалах</a>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){div[style*="repeat(3,1fr)"]{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:600px){div[style*="repeat(3,1fr)"]{grid-template-columns:1fr!important}}
      `}</style>
    </div>
  )
}
