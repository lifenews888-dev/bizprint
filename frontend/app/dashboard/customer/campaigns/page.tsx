'use client'
import React, { useState, useEffect } from 'react'
import React, { apiFetch } from '@/lib/api'
import React, { QRCodeSVG } from 'qrcode.react'
import Paywall from '@/components/Paywall'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const O = '#FF6B00'
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function CampaignsPage() {
  const [programs, setPrograms] = useState<any[]>([])
  const [stats, setStats] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [usage, setUsage] = useState<any>(null)
  const [form, setForm] = useState({
    name: '', description: '', required_stamps: 10, reward_type: 'free' as 'free' | 'discount',
    reward_description: '', discount_percent: 20, accent_color: '#FF6B00',
    marketing_enabled: false, marketing: [] as any[],
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [detail, setDetail] = useState<any>(null)

  const show = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500) }
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const load = async () => {
    setLoading(true)
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    const h = { Authorization: `Bearer ${token}` }
    const sf = (p: string) => fetch(`${API}${p}`, { headers: h }).then(r => r.ok ? r.json() : null).catch(() => null)
    const [progs, u] = await Promise.all([
      sf('/loyalty/my-programs'),
      sf('/subscription/usage'),
    ])
    const progList = Array.isArray(progs) ? progs : []
    setPrograms(progList)
    setUsage(u)
    // Load stats for each program
    const statsMap: Record<string, any> = {}
    await Promise.all(progList.map(async (p: any) => {
      const s = await sf(`/loyalty/my-programs/${p.id}/stats`)
      if (s) statsMap[p.id] = s
    }))
    setStats(statsMap)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const campaignUsage = usage?.loyalty_campaigns
  const canCreate = !campaignUsage || campaignUsage.current < campaignUsage.effective_max
  const featureLocked = campaignUsage && campaignUsage.effective_max === 0 && programs.length === 0

  const handleCreate = async () => {
    if (!form.name) { show('Нэр оруулна уу'); return }
    setSaving(true)
    try {
      await apiFetch('/loyalty/my-programs', { method: 'POST', body: form })
      show('Кампанит амжилттай үүслээ ✓')
      setShowCreate(false)
      setForm({ name: '', description: '', required_stamps: 10, reward_type: 'free', reward_description: '', discount_percent: 20, accent_color: '#FF6B00', marketing_enabled: false, marketing: [] })
      load()
    } catch (err: any) {
      let errData: any = null
      try { errData = JSON.parse(err.message) } catch {}
      show(errData?.message || err.message || 'Алдаа')
    }
    setSaving(false)
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: F, color: '#9CA3AF' }}>Ачааллаж байна...</div>

  // ═══ DETAIL VIEW ═══
  if (detail) {
    const st = stats[detail.id] || {}
    const accent = detail.accent_color || O
    const stampUrl = `${baseUrl}/loyalty/stamp/${detail.id}`
    const loyaltyUrl = `${baseUrl}/loyalty/${detail.id}`
    const staffUrl = `${baseUrl}/loyalty/staff/${detail.id}`
    return (
      <div style={{ padding: 24, fontFamily: F, maxWidth: 800, margin: '0 auto' }}>
        {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1F2937', color: '#fff', padding: '10px 28px', borderRadius: 99, fontSize: 14, zIndex: 9999 }}>{toast}</div>}
        <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', color: O, fontSize: 14, cursor: 'pointer', fontFamily: F, marginBottom: 16 }}>← Бүх кампанит</button>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${accent}15, ${accent}05)`, borderRadius: 16, padding: 28, border: `1px solid ${accent}30`, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: 'var(--text, #111)' }}>{detail.name}</h1>
              {detail.description && <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>{detail.description}</p>}
              <div style={{ marginTop: 10, fontSize: 13, color: accent, fontWeight: 600 }}>
                🎁 {detail.reward_description || (detail.reward_type === 'discount' ? `${detail.discount_percent}% хөнгөлөлт` : 'Үнэгүй бүтээгдэхүүн')}
                <span style={{ color: '#6B7280', fontWeight: 400, marginLeft: 8 }}>· {detail.required_stamps} тамга</span>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, padding: 10, border: '1px solid #E5E7EB' }}>
              <QRCodeSVG value={stampUrl} size={100} bgColor="#FFFFFF" fgColor="#000000" level="H" />
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Нийт хэрэглэгч', value: st.totalCards || 0, color: '#2563EB', icon: '👥' },
            { label: 'Нийт тамга', value: st.totalStamps || 0, color: O, icon: '⭐' },
            { label: 'Шагнал авсан', value: st.totalRedeems || 0, color: '#10B981', icon: '🎁' },
            { label: 'Өнөөдөр', value: st.todayStamps || 0, color: '#8B5CF6', icon: '📊' },
          ].map(k => (
            <div key={k.label} style={{ background: 'var(--surface, #fff)', borderRadius: 14, padding: '18px 16px', border: '1px solid var(--border, #E5E7EB)', textAlign: 'center' }}>
              <div style={{ fontSize: 12, marginBottom: 6 }}>{k.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'var(--surface, #fff)', borderRadius: 14, padding: 20, border: '1px solid var(--border, #E5E7EB)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text, #111)' }}>📱 QR скан линк (утсаар)</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10, wordBreak: 'break-all' }}>{stampUrl}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { navigator.clipboard.writeText(stampUrl); show('Линк хуулагдлаа') }} style={{ padding: '8px 16px', background: `${O}10`, color: O, border: `1px solid ${O}30`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>Хуулах</button>
              <a href={stampUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 16px', background: O, color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Нээх</a>
            </div>
          </div>
          <div style={{ background: 'var(--surface, #fff)', borderRadius: 14, padding: 20, border: '1px solid var(--border, #E5E7EB)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text, #111)' }}>👨‍💼 Staff QR хуудас</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>Ажилтан QR үүсгэж, хэрэглэгч скан хийнэ</div>
            <a href={staffUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 16px', background: O, color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>Staff QR нээх</a>
          </div>
        </div>

        {/* How it works */}
        <div style={{ background: 'var(--surface, #fff)', borderRadius: 14, padding: 20, border: '1px solid var(--border, #E5E7EB)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text, #111)' }}>Хэрхэн ажиллах вэ?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { step: '1', icon: '🖨️', title: 'QR хэвлэх', desc: 'Нэрийн хуудас, poster дээр QR байрлуулах' },
              { step: '2', icon: '📱', title: 'Хэрэглэгч скан', desc: 'QR уншуулахад loyalty хуудас нээгдэнэ' },
              { step: '3', icon: '⭐', title: 'Тамга цуглуулах', desc: 'Зочилсон бүрд 1 тамга авна' },
              { step: '4', icon: '🎁', title: 'Шагнал авах', desc: `${detail.required_stamps} тамга = 1 шагнал` },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text, #111)', marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.4 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ═══ PAYWALL ═══
  if (featureLocked) {
    return (
      <div style={{ padding: 24, fontFamily: F, maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Loyalty кампанит</h1>
        <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px' }}>QR + тамга + шагнал системээр хэрэглэгч татах</p>
        <Paywall feature="loyalty_campaigns" />
      </div>
    )
  }

  // ═══ LIST VIEW ═══
  return (
    <div style={{ padding: 24, fontFamily: F, maxWidth: 900, margin: '0 auto' }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1F2937', color: '#fff', padding: '10px 28px', borderRadius: 99, fontSize: 14, zIndex: 9999 }}>{toast}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Loyalty кампанит</h1>
          <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>QR + тамга + шагнал системээр хэрэглэгч татах</p>
        </div>
        <button onClick={() => canCreate ? setShowCreate(!showCreate) : show('Багцын хязгаарт хүрсэн')} style={{
          padding: '10px 24px', background: canCreate ? O : '#D1D5DB', color: '#fff', border: 'none',
          borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: F,
        }}>
          + Шинэ кампанит
        </button>
      </div>

      {/* Usage bar */}
      {campaignUsage && campaignUsage.effective_max > 0 && (
        <div style={{ background: 'var(--surface, #fff)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--border, #E5E7EB)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>⭐ Кампанит:</span>
          <div style={{ flex: 1, height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(campaignUsage.percentage, 100)}%`, background: campaignUsage.percentage >= 100 ? '#DC2626' : O, borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: campaignUsage.percentage >= 100 ? '#DC2626' : O }}>{campaignUsage.current}/{campaignUsage.effective_max}</span>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 24, border: '1px solid var(--border, #E5E7EB)', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Шинэ Loyalty кампанит</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Нэр *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Жиш: Кофе шопын loyalty" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Тамгын тоо</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[5, 8, 10, 15, 20].map(n => (
                  <button key={n} onClick={() => setForm({ ...form, required_stamps: n })} style={{
                    padding: '8px 14px', borderRadius: 8, border: form.required_stamps === n ? `2px solid ${O}` : '1px solid #E5E7EB',
                    background: form.required_stamps === n ? `${O}10` : '#fff',
                    color: form.required_stamps === n ? O : '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>{n}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Шагналын төрөл</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setForm({ ...form, reward_type: 'free' })} style={{ flex: 1, padding: '10px', borderRadius: 8, border: form.reward_type === 'free' ? `2px solid ${O}` : '1px solid #E5E7EB', background: form.reward_type === 'free' ? `${O}10` : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: form.reward_type === 'free' ? O : '#6B7280' }}>🎁 Үнэгүй</button>
                <button onClick={() => setForm({ ...form, reward_type: 'discount' })} style={{ flex: 1, padding: '10px', borderRadius: 8, border: form.reward_type === 'discount' ? `2px solid ${O}` : '1px solid #E5E7EB', background: form.reward_type === 'discount' ? `${O}10` : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: form.reward_type === 'discount' ? O : '#6B7280' }}>💰 Хөнгөлөлт</button>
              </div>
            </div>
            {form.reward_type === 'discount' && (
              <div>
                <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Хөнгөлөлт %</label>
                <input type="number" min={5} max={100} value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: Number(e.target.value) })} style={inp} />
              </div>
            )}
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Шагналын тайлбар</label>
            <input value={form.reward_description} onChange={e => setForm({ ...form, reward_description: e.target.value })} placeholder="Жиш: 1 Американо үнэгүй" style={inp} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Тайлбар</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Кампанитын дэлгэрэнгүй..." rows={2} style={{ ...inp, resize: 'vertical' }} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Өнгө</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#FF6B00', '#8B4513', '#2563EB', '#7C3AED', '#059669', '#DC2626', '#EC4899'].map(c => (
                <button key={c} onClick={() => setForm({ ...form, accent_color: c })} style={{
                  width: 28, height: 28, borderRadius: '50%', background: c, border: form.accent_color === c ? '3px solid #111' : '2px solid #E5E7EB', cursor: 'pointer',
                }} />
              ))}
            </div>
          </div>
          {/* Marketing toggle */}
          <div style={{ marginTop: 16, borderTop: '1px solid var(--border, #E5E7EB)', paddingTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text, #374151)', marginBottom: 10 }}>
              <input type="checkbox" checked={form.marketing_enabled} onChange={e => setForm({ ...form, marketing_enabled: e.target.checked })} style={{ width: 18, height: 18, accentColor: O }} />
              📣 Маркетинг контент нэмэх
            </label>
            {form.marketing_enabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(form.marketing || []).map((m: any, i: number) => (
                  <div key={i} style={{ background: 'var(--surface2, #F3F4F6)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span>{m.type === 'banner' ? '🖼️' : m.type === 'promo' ? '🎉' : '📦'}</span>
                    <span style={{ flex: 1 }}>{m.title || m.message || m.type}</span>
                    <button onClick={() => setForm({ ...form, marketing: form.marketing.filter((_: any, j: number) => j !== i) })} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setForm({ ...form, marketing: [...form.marketing, { type: 'promo', message: '', title: 'Урамшуулал' }] })} style={{ flex: 1, padding: '8px', background: '#FEF3C7', color: '#92400E', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🎉 Промо</button>
                  <button onClick={() => setForm({ ...form, marketing: [...form.marketing, { type: 'banner', title: '', description: '', image_url: '', button_text: '', button_link: '' }] })} style={{ flex: 1, padding: '8px', background: '#DBEAFE', color: '#1E40AF', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🖼️ Баннер</button>
                </div>
                {/* Edit last added marketing item */}
                {form.marketing.length > 0 && (() => {
                  const lastIdx = form.marketing.length - 1
                  const last = form.marketing[lastIdx]
                  const updateLast = (field: string, val: string) => {
                    const updated = [...form.marketing]
                    updated[lastIdx] = { ...updated[lastIdx], [field]: val }
                    setForm({ ...form, marketing: updated })
                  }
                  return (
                    <div style={{ background: '#fff', border: '1px solid var(--border, #E5E7EB)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input value={last.title || ''} onChange={e => updateLast('title', e.target.value)} placeholder="Гарчиг" style={inp} />
                      {last.type === 'promo' && (
                        <input value={last.message || ''} onChange={e => updateLast('message', e.target.value)} placeholder="Промо мессеж (жиш: 10% хөнгөлөлт)" style={inp} />
                      )}
                      {last.type === 'banner' && (
                        <>
                          <input value={last.description || ''} onChange={e => updateLast('description', e.target.value)} placeholder="Тайлбар" style={inp} />
                          {/* Image: upload or URL */}
                          <div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--surface2, #F3F4F6)', borderRadius: 8, cursor: 'pointer', fontSize: 12, border: '1px dashed #D1D5DB' }}>
                                📷 Зураг оруулах
                                <input type="file" accept="image/*" hidden onChange={async e => {
                                  const f = e.target.files?.[0]
                                  if (!f) return
                                  const fd = new FormData(); fd.append('file', f)
                                  try {
                                    const res = await apiFetch<any>('/upload/file', { method: 'POST', body: fd })
                                    if (res?.file_url) updateLast('image_url', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${res.file_url}`)
                                  } catch {}
                                }} />
                              </label>
                              {last.image_url && <img src={last.image_url} alt="" style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 6 }} />}
                              {!last.image_url && <input value={last.image_url || ''} onChange={e => updateLast('image_url', e.target.value)} placeholder="эсвэл URL оруулах" style={{ ...inp, flex: 1 }} />}
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <input value={last.button_text || ''} onChange={e => updateLast('button_text', e.target.value)} placeholder="Товчний текст" style={inp} />
                            <input value={last.button_link || ''} onChange={e => updateLast('button_link', e.target.value)} placeholder="Товчний линк" style={inp} />
                          </div>
                        </>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            <button onClick={handleCreate} disabled={saving} style={{ padding: '10px 28px', background: O, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Үүсгэж байна...' : 'Үүсгэх'}
            </button>
            <button onClick={() => setShowCreate(false)} style={{ padding: '10px 28px', background: 'var(--surface2, #F3F4F6)', color: 'var(--text, #374151)', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>Болих</button>
          </div>
        </div>
      )}

      {/* Campaign list */}
      {programs.length === 0 ? (
        <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid var(--border, #E5E7EB)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text, #374151)', marginBottom: 8 }}>Кампанит байхгүй</div>
          <p style={{ color: '#9CA3AF', fontSize: 14, margin: '0 0 20px' }}>Loyalty кампанит үүсгээд хэрэглэгчдээ татаарай</p>
          <button onClick={() => canCreate ? setShowCreate(true) : show('Багцын хязгаарт хүрсэн')} style={{ padding: '10px 28px', background: O, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ Эхний кампанит үүсгэх</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {programs.map((prog: any) => {
            const accent = prog.accent_color || O
            const st = stats[prog.id] || {}
            const loyaltyUrl = `${baseUrl}/loyalty/stamp/${prog.id}`
            return (
              <div key={prog.id} onClick={() => setDetail(prog)} style={{
                background: 'var(--surface, #fff)', borderRadius: 16, padding: 20, border: '1px solid var(--border, #E5E7EB)',
                cursor: 'pointer', transition: 'box-shadow 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text, #111)' }}>{prog.name}</h3>
                    <div style={{ fontSize: 12, color: accent, fontWeight: 600, marginTop: 4 }}>
                      {prog.required_stamps} тамга = {prog.reward_description || (prog.reward_type === 'discount' ? `${prog.discount_percent}%` : '🎁')}
                    </div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 8, padding: 4, border: '1px solid #E5E7EB', flexShrink: 0 }}>
                    <QRCodeSVG value={loyaltyUrl} size={56} bgColor="#FFFFFF" fgColor="#000000" level="H" />
                  </div>
                </div>
                {/* Stats */}
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6B7280' }}>
                  <span>👥 {st.totalCards || 0}</span>
                  <span>⭐ {st.totalStamps || 0}</span>
                  <span>🎁 {st.totalRedeems || 0}</span>
                  <span style={{ color: '#10B981' }}>📊 Өнөөдөр: {st.todayStamps || 0}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border, #E5E7EB)', fontSize: 14, background: 'var(--bg, #fff)', color: 'var(--text, #000)', fontFamily: "'DM Sans','Segoe UI',sans-serif" }
