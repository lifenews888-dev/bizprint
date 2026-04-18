'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const API = 'http://localhost:4000'
const F   = "'DM Sans','Segoe UI',system-ui,sans-serif"

const getToken  = () => typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('token') || '') : ''
const getUser   = () => { try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null } }
const authHdrs  = () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() })

interface Creator {
  id: string
  full_name: string
  avatar_url?: string
  bio?: string
  starting_price?: number
  delivery_days?: number
  service_categories?: string
  portfolio_url?: string
  creator_tier?: string
  creator_rating?: number
  creator_completed?: number
  created_at?: string
}

interface Package {
  key: 'basic' | 'standard' | 'premium'
  label: string
  desc: string
  price: number
  days: number
  includes: string[]
}

const TIER_CLR: Record<string, { bg: string; text: string; border: string }> = {
  Elite:   { bg: '#FFF7ED', text: '#EA580C', border: '#FDBA74' },
  Expert:  { bg: '#F5F3FF', text: '#7C3AED', border: '#C4B5FD' },
  Pro:     { bg: '#EFF6FF', text: '#2563EB', border: '#93C5FD' },
  Starter: { bg: '#F0FDF4', text: '#16A34A', border: '#86EFAC' },
}

function makePackages(c: Creator): Package[] {
  const base = Number(c.starting_price) || 50000
  const days = Number(c.delivery_days) || 3
  return [
    {
      key: 'basic', label: 'Үндсэн', desc: '1 контент, хурдан хүргэлт',
      price: base, days: Math.max(1, days - 1),
      includes: ['1 контент', 'Нэг удаагийн засвар', 'Файл хүргэлт'],
    },
    {
      key: 'standard', label: 'Стандарт', desc: '3 контент, хэвийн хугацаа',
      price: Math.round(base * 2.5), days,
      includes: ['3 контент', '3 удаагийн засвар', 'HD чанар', 'Файл хүргэлт'],
    },
    {
      key: 'premium', label: 'Премиум', desc: 'Хязгааргүй засвар + дэмжлэг',
      price: Math.round(base * 5), days: days + 2,
      includes: ['5+ контент', 'Хязгааргүй засвар', 'Брэнд иллэмж', 'Тэргүүлэх дэмжлэг', 'RAW файл'],
    },
  ]
}

export default function CreatorProfilePage() {
  const router  = useRouter()
  const params  = useParams<{ id: string }>()
  const id      = params?.id as string

  const [creator,  setCreator]  = useState<Creator | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [selPkg,   setSelPkg]   = useState<'basic' | 'standard' | 'premium'>('standard')
  const [showHire, setShowHire] = useState(false)
  const [form,     setForm]     = useState({ requirements: '', deadline: '', budget: '' })
  const [submitting, setSubmitting] = useState(false)
  const [hired,    setHired]    = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (!id) return
    fetch(`${API}/users/creators/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setCreator(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  async function hire() {
    const u = getUser()
    if (!u) { router.push('/login'); return }
    if (!form.requirements.trim()) { setError('Шаардлагаа тайлбарлана уу'); return }

    setSubmitting(true); setError('')
    const pkg = packages.find(p => p.key === selPkg)!

    try {
      const r = await fetch(`${API}/design-requests`, {
        method: 'POST',
        headers: authHdrs(),
        body: JSON.stringify({
          customer_id:    u.id,
          customer_name:  u.full_name,
          customer_email: u.email,
          designer_id:    creator!.id,
          designer_name:  creator!.full_name,
          requirements:   form.requirements,
          deadline:       form.deadline || null,
          design_fee:     pkg.price,
          product_name:   `Creator захиалга — ${pkg.label}`,
          notes:          `Багц: ${pkg.label} · Хугацаа: ${pkg.days} хоног`,
          status:         'pending',
        }),
      })
      if (r.ok) {
        setHired(true)
        setShowHire(false)
      } else {
        const data = await r.json()
        setError(data?.message || 'Алдаа гарлаа')
      }
    } catch { setError('Сервертэй холбогдоход алдаа гарлаа') }
    setSubmitting(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: F, color: '#A8A29E' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div><div>Уншиж байна...</div></div>
    </div>
  )

  if (!creator) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: F }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Бүтээгч олдсонгүй</div>
        <button onClick={() => router.push('/marketplace')} style={{ background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Буцах</button>
      </div>
    </div>
  )

  const cats     = (creator.service_categories || '').split(',').filter(Boolean)
  const tier     = creator.creator_tier || 'Starter'
  const tc       = TIER_CLR[tier] || TIER_CLR.Starter
  const initials = (creator.full_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const hue      = [...(creator.id || 'x')].reduce((s, ch) => s + ch.charCodeAt(0), 0) % 360
  const packages = makePackages(creator)
  const selPkgData = packages.find(p => p.key === selPkg)!

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', fontFamily: F, color: '#1C1917' }}>
      <style>{`@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap");`}</style>

      {/* ── Back nav ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E7E5E4', padding: '12px 32px' }}>
        <button onClick={() => router.push('/marketplace')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#78716C', display: 'flex', alignItems: 'center', gap: 6, fontFamily: F }}>
          ← Creator Marketplace
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' }}>

          {/* ─── LEFT ─── */}
          <div>
            {/* Profile header */}
            <div style={{ background: '#fff', border: '1px solid #E7E5E4', borderRadius: 20, padding: 28, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {creator.avatar_url ? (
                  <img src={creator.avatar_url} alt={creator.full_name} style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 88, height: 88, borderRadius: '50%', background: `hsl(${hue},70%,55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 32, flexShrink: 0 }}>
                    {initials}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{creator.full_name}</h1>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`, fontWeight: 700 }}>
                      {tier === 'Elite' || tier === 'Expert' ? '⭐ ' : ''}{tier}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: '#F59E0B', letterSpacing: 1, marginBottom: 8 }}>
                    {'★'.repeat(Math.round(Number(creator.creator_rating) || 5))}{'☆'.repeat(5 - Math.round(Number(creator.creator_rating) || 5))}
                    <span style={{ fontSize: 13, color: '#78716C', marginLeft: 6 }}>
                      {Number(creator.creator_rating || 5).toFixed(1)} ({creator.creator_completed || 0} захиалга)
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {cats.map(c => (
                      <span key={c} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: '#F5F5F4', color: '#57534E', fontWeight: 500 }}>{c}</span>
                    ))}
                  </div>
                </div>
              </div>

              {creator.bio && (
                <div style={{ marginTop: 20, padding: '16px', background: '#FAFAF8', borderRadius: 12 }}>
                  <p style={{ fontSize: 14, color: '#57534E', lineHeight: 1.7, margin: 0 }}>{creator.bio}</p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 20 }}>
                {[
                  { label: 'Дууссан захиалга', val: String(creator.creator_completed || 0), icon: '✅' },
                  { label: 'Хүргэлтийн хугацаа', val: (creator.delivery_days || 3) + ' хоног', icon: '⚡' },
                  { label: 'Эхлэх үнэ', val: creator.starting_price ? '₮' + Number(creator.starting_price).toLocaleString() : 'Тохиролцоно', icon: '💰' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#F5F5F4', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#FF6B00' }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: '#A8A29E', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio */}
            {creator.portfolio_url && (
              <div style={{ background: '#fff', border: '1px solid #E7E5E4', borderRadius: 20, padding: 24, marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>📁 Портфолио</h2>
                <a href={creator.portfolio_url} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#F5F5F4', border: '1px solid #E7E5E4', borderRadius: 10, color: '#1C1917', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                  🔗 Портфолио харах →
                </a>
              </div>
            )}

            {/* Conditions / Process */}
            <div style={{ background: '#fff', border: '1px solid #E7E5E4', borderRadius: 20, padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>📋 Ажлын нөхцөл</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { step: '1', title: 'Захиалга өгөх', desc: 'Захиалгын маягт бөглөж, шаардлагаа тайлбарлана уу', color: '#FF6B00' },
                  { step: '2', title: 'Бүтээгч хүлээн авна', desc: 'Бүтээгч таны захиалгыг хүлээн аваад ажлаа эхлүүлнэ', color: '#7C3AED' },
                  { step: '3', title: 'Үр дүнгийн засвар', desc: 'Тохиролцсон тооны засвар, нэмэлт тохиргоо хийнэ', color: '#2563EB' },
                  { step: '4', title: 'Эцсийн файл хүргэлт', desc: 'Батлагдсаны дараа файлыг хүргэж, дансанд мөнгийг шилжүүлнэ', color: '#16A34A' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: i < 3 ? '1px solid #F5F5F4' : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.color + '15', border: '2px solid ' + s.color + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: s.color, flexShrink: 0 }}>
                      {s.step}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{s.title}</div>
                      <div style={{ fontSize: 13, color: '#78716C', lineHeight: 1.5 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Packages + Hire ─── */}
          <div style={{ position: 'sticky', top: 20 }}>
            <div style={{ background: '#fff', border: '1px solid #E7E5E4', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

              {/* Package tabs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid #E7E5E4' }}>
                {packages.map(p => (
                  <button key={p.key} onClick={() => setSelPkg(p.key)} style={{
                    padding: '14px 8px', border: 'none', borderBottom: selPkg === p.key ? '2px solid #FF6B00' : '2px solid transparent',
                    background: selPkg === p.key ? '#FFF7ED' : 'none', color: selPkg === p.key ? '#FF6B00' : '#78716C',
                    fontSize: 13, fontWeight: selPkg === p.key ? 700 : 400, cursor: 'pointer', fontFamily: F,
                  }}>
                    {p.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#1C1917' }}>₮{selPkgData.price.toLocaleString()}</div>
                    <div style={{ fontSize: 13, color: '#78716C', padding: '4px 10px', background: '#F5F5F4', borderRadius: 8 }}>
                      ⚡ {selPkgData.days} хоног
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: '#78716C', margin: 0, lineHeight: 1.5 }}>{selPkgData.desc}</p>
                </div>

                {/* Includes */}
                <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selPkgData.includes.map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1C1917' }}>
                      <span style={{ color: '#16A34A', fontWeight: 700 }}>✓</span> {item}
                    </div>
                  ))}
                </div>

                {hired ? (
                  <div style={{ background: '#ECFDF5', border: '1px solid #86EFAC', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#15803D', marginBottom: 4 }}>Захиалга илгээгдлээ!</div>
                    <div style={{ fontSize: 13, color: '#16A34A', marginBottom: 16 }}>Бүтээгч таны захиалгыг хүлээн авах болно</div>
                    <button onClick={() => router.push('/dashboard')} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                      Захиалгаа харах →
                    </button>
                  </div>
                ) : !showHire ? (
                  <button onClick={() => setShowHire(true)} style={{ width: '100%', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: F, transition: 'background .2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#EA580C'}
                    onMouseLeave={e => e.currentTarget.style.background = '#FF6B00'}>
                    Захиалах →
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {error && (
                      <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
                        {error}
                      </div>
                    )}

                    <div>
                      <label style={{ fontSize: 12, color: '#78716C', marginBottom: 6, display: 'block', fontWeight: 500 }}>
                        Шаардлага / Тайлбар *
                      </label>
                      <textarea
                        value={form.requirements}
                        onChange={e => setForm({ ...form, requirements: e.target.value })}
                        rows={4}
                        placeholder="Юу хийлгэхийг хүсч байна? Брэнд, өнгө, хэв маяг, зорилтот үзэгчид..."
                        style={{ width: '100%', background: '#FAFAF8', border: '1.5px solid #E7E5E4', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#1C1917', outline: 'none', resize: 'vertical', fontFamily: F, boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, color: '#78716C', marginBottom: 6, display: 'block', fontWeight: 500 }}>
                        Дуусах огноо (заавал биш)
                      </label>
                      <input
                        type="date"
                        value={form.deadline}
                        onChange={e => setForm({ ...form, deadline: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        style={{ width: '100%', background: '#FAFAF8', border: '1.5px solid #E7E5E4', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#1C1917', outline: 'none', fontFamily: F, boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ background: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: '#78716C' }}>Багц</span>
                        <span style={{ fontWeight: 600 }}>{selPkgData.label}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
                        <span style={{ color: '#78716C' }}>Нийт</span>
                        <span style={{ color: '#FF6B00' }}>₮{selPkgData.price.toLocaleString()}</span>
                      </div>
                    </div>

                    <button onClick={hire} disabled={submitting} style={{ width: '100%', background: submitting ? '#D6D3D1' : '#FF6B00', color: submitting ? '#A8A29E' : '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: F }}>
                      {submitting ? 'Илгээж байна...' : '✓ Захиалга батлах'}
                    </button>
                    <button onClick={() => { setShowHire(false); setError('') }} style={{ width: '100%', background: 'none', border: '1.5px solid #E7E5E4', borderRadius: 12, padding: '11px', fontSize: 14, color: '#78716C', cursor: 'pointer', fontFamily: F }}>
                      Болих
                    </button>
                  </div>
                )}

                {/* Trust badges */}
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: '🔒', text: 'Захиалга батлагдаж, ажил дуусмагц л мөнгө шилжинэ' },
                    { icon: '↩️', text: 'Хүлээлтэд нийцэхгүй бол буцаан олголт хийнэ' },
                    { icon: '💬', text: 'Захиалга дотроос шууд харилцах боломжтой' },
                  ].map(b => (
                    <div key={b.text} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#78716C' }}>
                      <span>{b.icon}</span>
                      <span style={{ lineHeight: 1.4 }}>{b.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
