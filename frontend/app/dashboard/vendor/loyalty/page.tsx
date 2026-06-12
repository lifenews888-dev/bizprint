'use client'
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { QRCodeSVG } from 'qrcode.react'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const ORANGE = '#FF6B00'

interface LoyaltyProgram {
  id: string
  name: string
  description?: string
  required_stamps: number
  reward_type: string
  reward_description?: string
  discount_percent?: number
}

interface LoyaltyStats {
  totalCards?: number
  totalStamps?: number
  totalRedeems?: number
  todayStamps?: number
}

export default function VendorLoyalty() {
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([])
  const [stats, setStats] = useState<Record<string, LoyaltyStats>>({})
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', required_stamps: '10',
    reward_type: 'free', reward_description: '', discount_percent: '0',
    accent_color: '#FF6B00',
  })

  const loadData = useCallback(async () => {
    try {
      const progs = await apiFetch<LoyaltyProgram[]>('/loyalty/vendor/programs')
      setPrograms(progs)
      const statsMap: Record<string, LoyaltyStats> = {}
      for (const p of progs) {
        try {
          statsMap[p.id] = await apiFetch<LoyaltyStats>(`/loyalty/vendor/stats/${p.id}`)
        } catch {}
      }
      setStats(statsMap)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { void loadData() }, 0)
    return () => clearTimeout(timer)
  }, [loadData])

  const handleCreate = async () => {
    if (!form.name) return
    await apiFetch('/loyalty/program', {
      method: 'POST',
      body: {
        name: form.name,
        description: form.description || undefined,
        required_stamps: Number(form.required_stamps) || 10,
        reward_type: form.reward_type,
        reward_description: form.reward_description || undefined,
        discount_percent: Number(form.discount_percent) || 0,
        accent_color: form.accent_color,
      },
    })
    setShowCreate(false)
    setForm({ name: '', description: '', required_stamps: '10', reward_type: 'free', reward_description: '', discount_percent: '0', accent_color: '#FF6B00' })
    void loadData()
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: FONT, color: '#9CA3AF' }}>Ачааллаж байна...</div>

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div style={{ padding: 24, fontFamily: FONT, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Loyalty програм</h1>
          <p style={{ color: '#6B7280', fontSize: 14, margin: '4px 0 0' }}>QR тамгын програм үүсгэж удирдах</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={{ padding: '10px 24px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          + Шинэ програм
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 24, border: '1px solid var(--border, #E5E7EB)', marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Шинэ Loyalty програм</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Програмын нэр *" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Жишээ: Кофе Loyalty" />
            <div>
              <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Шаардлагатай тамга</label>
              <select value={form.required_stamps} onChange={e => setForm({ ...form, required_stamps: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border, #E5E7EB)', fontSize: 14, background: 'var(--bg, #fff)', color: 'var(--text, #000)' }}>
                {[5, 6, 7, 8, 9, 10, 12, 15, 20].map(n => <option key={n} value={n}>{n} тамга</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Шагналын төрөл</label>
              <select value={form.reward_type} onChange={e => setForm({ ...form, reward_type: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border, #E5E7EB)', fontSize: 14, background: 'var(--bg, #fff)', color: 'var(--text, #000)' }}>
                <option value="free">Үнэгүй бүтээгдэхүүн</option>
                <option value="discount">Хөнгөлөлт (%)</option>
              </select>
            </div>
            {form.reward_type === 'discount' && (
              <Field label="Хөнгөлөлт (%)" value={form.discount_percent} onChange={v => setForm({ ...form, discount_percent: v })} type="number" />
            )}
            <Field label="Шагналын тайлбар" value={form.reward_description} onChange={v => setForm({ ...form, reward_description: v })} placeholder="Жишээ: 1 кофе үнэгүй" />
            <Field label="Тайлбар" value={form.description} onChange={v => setForm({ ...form, description: v })} placeholder="Програмын товч тайлбар" />
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            <button onClick={handleCreate} style={{ padding: '10px 28px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Үүсгэх</button>
            <button onClick={() => setShowCreate(false)} style={{ padding: '10px 28px', background: 'var(--surface2, #F3F4F6)', color: 'var(--text, #374151)', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>Болих</button>
          </div>
        </div>
      )}

      {/* Programs list */}
      {programs.length === 0 ? (
        <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid var(--border, #E5E7EB)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#x2B50;</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text, #374151)' }}>Програм байхгүй</div>
          <p style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>Эхний loyalty програмаа үүсгээрэй</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {programs.map(p => {
            const s = stats[p.id]
            const url = `${baseUrl}/loyalty/${p.id}`
            return (
              <div key={p.id} style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 24, border: '1px solid var(--border, #E5E7EB)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px', color: 'var(--text, #111)' }}>{p.name}</h3>
                    {p.description && <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>{p.description}</div>}
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#6B7280', flexWrap: 'wrap' }}>
                      <span>{p.required_stamps} тамга = 1 шагнал</span>
                      <span>{p.reward_type === 'free' ? 'Үнэгүй бүтээгдэхүүн' : `${p.discount_percent}% хөнгөлөлт`}</span>
                      {p.reward_description && <span>({p.reward_description})</span>}
                    </div>

                    {/* Stats */}
                    {s && (
                      <div style={{ display: 'flex', gap: 20, marginTop: 16, fontSize: 13 }}>
                        <div><span style={{ fontWeight: 700, color: ORANGE }}>{s.totalCards}</span> <span style={{ color: '#9CA3AF' }}>хэрэглэгч</span></div>
                        <div><span style={{ fontWeight: 700, color: '#8B5CF6' }}>{s.totalStamps}</span> <span style={{ color: '#9CA3AF' }}>нийт тамга</span></div>
                        <div><span style={{ fontWeight: 700, color: '#10B981' }}>{s.totalRedeems}</span> <span style={{ color: '#9CA3AF' }}>шагнал</span></div>
                        <div><span style={{ fontWeight: 700, color: '#F59E0B' }}>{s.todayStamps}</span> <span style={{ color: '#9CA3AF' }}>өнөөдөр</span></div>
                      </div>
                    )}
                  </div>

                  {/* QR */}
                  <div style={{ textAlign: 'center', flexShrink: 0, marginLeft: 20 }}>
                    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 8, marginBottom: 8 }}>
                      <QRCodeSVG value={url} size={100} bgColor="#FFFFFF" fgColor="#000000" level="M" />
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(url)} style={{ padding: '6px 14px', background: 'var(--surface2, #F3F4F6)', color: 'var(--text, #374151)', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', marginBottom: 4 }}>
                      Линк хуулах
                    </button>
                    <button onClick={() => window.location.href = `/loyalty/staff/${p.id}`} style={{ padding: '6px 14px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                      Staff QR
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border, #E5E7EB)', fontSize: 14, background: 'var(--bg, #fff)', color: 'var(--text, #000)' }} />
    </div>
  )
}
