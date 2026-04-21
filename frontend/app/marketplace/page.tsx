'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://bizprint-production.up.railway.app'
const F   = "'DM Sans','Segoe UI',system-ui,sans-serif"

interface Creator {
  id: string
  full_name: string
  avatar_url?: string
  bio?: string
  starting_price?: number
  delivery_days?: number
  service_categories?: string   // "Сошиал контент,Хэвлэл дизайн"
  creator_tier?: string
  creator_rating?: number
  creator_completed?: number
}

const CATS = ['Бүгд','Сошиал контент','Хэвлэл дизайн','Live борлуулалт','AI контент','UGC контент']

const TIER_CLR: Record<string, { bg: string; text: string; border: string }> = {
  Elite:   { bg: '#FFF7ED', text: '#EA580C', border: '#FDBA74' },
  Expert:  { bg: '#F5F3FF', text: '#7C3AED', border: '#C4B5FD' },
  Pro:     { bg: '#EFF6FF', text: '#2563EB', border: '#93C5FD' },
  Starter: { bg: '#F0FDF4', text: '#16A34A', border: '#86EFAC' },
}

function stars(r: number) {
  return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r))
}

function CreatorCard({ c, onClick }: { c: Creator; onClick: () => void }) {
  const cats   = (c.service_categories || '').split(',').filter(Boolean).slice(0, 3)
  const tier   = c.creator_tier || 'Starter'
  const tc     = TIER_CLR[tier] || TIER_CLR.Starter
  const initials = (c.full_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const hue    = [...(c.id || 'x')].reduce((s, ch) => s + ch.charCodeAt(0), 0) % 360

  return (
    <div
      onClick={onClick}
      style={{ background: '#fff', border: '1px solid #E7E5E4', borderRadius: 16, padding: 20, cursor: 'pointer', transition: 'all .18s', fontFamily: F }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6B00'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,107,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E7E5E4'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        {c.avatar_url ? (
          <img src={c.avatar_url} alt={c.full_name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: `hsl(${hue},70%,55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
            {initials}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#1C1917' }}>{c.full_name}</span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`, fontWeight: 700 }}>
              {tier === 'Elite' ? '⭐ ' : ''}{tier}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#F59E0B', letterSpacing: 1, marginTop: 2 }}>
            {stars(Number(c.creator_rating) || 5)}
            <span style={{ fontSize: 12, color: '#78716C', fontWeight: 500, marginLeft: 4 }}>
              {Number(c.creator_rating || 5).toFixed(1)} ({c.creator_completed || 0})
            </span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {c.bio && (
        <p style={{ fontSize: 13, color: '#78716C', margin: '0 0 12px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
          {c.bio}
        </p>
      )}

      {/* Category tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {cats.map(cat => (
          <span key={cat} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: '#F5F5F4', color: '#57534E', fontWeight: 500 }}>{cat}</span>
        ))}
      </div>

      {/* Price & delivery */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F5F5F4', paddingTop: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: '#A8A29E' }}>Эхлэх үнэ</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FF6B00' }}>
            {c.starting_price ? '₮' + Number(c.starting_price).toLocaleString() : 'Тохиролцоно'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#A8A29E' }}>Хугацаа</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1C1917' }}>{c.delivery_days || 3} хоног</div>
        </div>
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  const router = useRouter()
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading]   = useState(true)
  const [cat, setCat]           = useState('Бүгд')
  const [search, setSearch]     = useState('')
  const [aiMode, setAiMode]     = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`${API}/users/creators`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setCreators(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = creators.filter(c => {
    const inCat = cat === 'Бүгд' || (c.service_categories || '').toLowerCase().includes(cat.toLowerCase())
    const q     = search.toLowerCase()
    const inSearch = !q || c.full_name.toLowerCase().includes(q)
      || (c.bio || '').toLowerCase().includes(q)
      || (c.service_categories || '').toLowerCase().includes(q)
    return inCat && inSearch
  })

  const recommended = filtered.slice(0, 4)
  const rest        = filtered.slice(4)

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', fontFamily: F, color: '#1C1917' }}>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap");
        .mp-search:focus { border-color: #FF6B00 !important; box-shadow: 0 0 0 3px rgba(255,107,0,0.12) !important; }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(135deg, #fff 0%, #FFF7ED 50%, #FFF 100%)', borderBottom: '1px solid #E7E5E4', padding: '56px 24px 48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 99, padding: '4px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 11, color: '#FF6B00', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>🎨 Creator Marketplace</span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Creator <span style={{ color: '#FF6B00' }}>Marketplace</span>
        </h1>
        <p style={{ fontSize: 16, color: '#78716C', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Монголын шилдэг контент бүтээгчийг олж, бизнесээ өсгө
        </p>

        {/* Search */}
        <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid #E7E5E4', borderRadius: 14, padding: '4px 4px 4px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'all .2s' }}>
            <span style={{ fontSize: 18, marginRight: 8 }}>🔍</span>
            <input
              ref={searchRef}
              className="mp-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Creator хайх... (жишээ: "лого дизайн, 3 хоногт, Pro")'
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: '#1C1917', fontFamily: F }}
            />
            <button
              onClick={() => setAiMode(true)}
              style={{ background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Хайх
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, justifyContent: 'center' }}>
            <span style={{ fontSize: 11, background: '#7C3AED15', color: '#7C3AED', border: '1px solid #7C3AED30', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>AI</span>
            <span style={{ fontSize: 12, color: '#A8A29E' }}>Байгалийн хэлээр хайлт хийх боломжтой</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32, overflowX: 'auto' }}>
          {CATS.map((c, i) => {
            const icons = ['🎨','📱','🖨️','📺','🤖','📹']
            const active = cat === c
            return (
              <button key={c} onClick={() => setCat(c)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px',
                borderRadius: 99, border: `1.5px solid ${active ? '#FF6B00' : '#E7E5E4'}`,
                background: active ? '#FF6B00' : '#fff', color: active ? '#fff' : '#57534E',
                fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all .15s', fontFamily: F,
              }}>
                <span>{icons[i]}</span> {c}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#A8A29E' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 16 }}>Бүтээгчид ачааллаж байна...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Бүтээгч олдсонгүй</div>
            <p style={{ color: '#A8A29E', fontSize: 14, marginBottom: 24 }}>
              Хайлтын үгийг өөрчилж эсвэл ангиллаас сонгоно уу
            </p>
            <button onClick={() => { setCat('Бүгд'); setSearch('') }} style={{ background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 99, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Бүгдийг харах
            </button>
          </div>
        ) : (
          <>
            {/* Recommended */}
            {recommended.length > 0 && (
              <section style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <span style={{ fontSize: 12, background: '#7C3AED15', color: '#7C3AED', border: '1px solid #7C3AED30', borderRadius: 6, padding: '3px 10px', fontWeight: 700 }}>AI</span>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Танд санал болгох</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {recommended.map(c => (
                    <CreatorCard key={c.id} c={c} onClick={() => router.push(`/marketplace/${c.id}`)} />
                  ))}
                </div>
              </section>
            )}

            {/* Rest */}
            {rest.length > 0 && (
              <section>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 20px' }}>
                  Бүх бүтээгчид
                  <span style={{ fontSize: 14, fontWeight: 400, color: '#A8A29E', marginLeft: 8 }}>{filtered.length} бүтээгч</span>
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {rest.map(c => (
                    <CreatorCard key={c.id} c={c} onClick={() => router.push(`/marketplace/${c.id}`)} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Empty state CTA for admins/creators */}
        {!loading && creators.length === 0 && (
          <div style={{ marginTop: 40, padding: '32px', background: 'rgba(255,107,0,0.04)', border: '2px dashed rgba(255,107,0,0.2)', borderRadius: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎨</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Бүтээгчид байхгүй байна</div>
            <p style={{ color: '#A8A29E', fontSize: 14, marginBottom: 20 }}>
              Бүтээгч болохыг хүсвэл /partner хуудсаар бүртгүүлнэ үү
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => router.push('/partner')} style={{ background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Бүтээгч болох →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
