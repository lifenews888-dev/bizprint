'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const O = '#FF6B00'

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  digital_card: { label: 'Дижитал карт', icon: '💳', color: '#2563EB' },
  loyalty_campaign: { label: 'Loyalty кампанит', icon: '⭐', color: '#F59E0B' },
  qr_campaign: { label: 'QR кампанит', icon: '📱', color: '#10B981' },
  invitation_premium: { label: 'Урилга Premium', icon: '💌', color: '#8B5CF6' },
  custom: { label: 'Бусад', icon: '📦', color: '#6B7280' },
}
const MODEL_LABELS: Record<string, string> = { one_time: 'Нэг удаа', subscription: 'Захиалга', per_unit: 'Ширхэгээр' }

const EMPTY: any = { slug: '', name: '', description: '', product_type: 'digital_card', price_model: 'one_time', price: 0, duration_days: 365, unit_price: 0, free_tier_days: 0, free_tier_units: 0, is_active: true, sort_order: 0 }

export default function AdminProductPricing() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const show = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  const load = () => {
    setLoading(true)
    apiFetch('/admin/product-pricing').then((d: any) => setItems(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleSave = async () => {
    if (!editing.name || !editing.slug) { show('Нэр, slug шаардлагатай'); return }
    setSaving(true)
    try {
      if (editing.id) {
        await apiFetch(`/admin/product-pricing/${editing.id}`, { method: 'PATCH', body: editing })
        show('Шинэчлэгдлээ ✓')
      } else {
        await apiFetch('/admin/product-pricing', { method: 'POST', body: editing })
        show('Үүсгэгдлээ ✓')
      }
      setEditing(null); load()
    } catch (err: any) { show(err.message || 'Алдаа') }
    setSaving(false)
  }

  const handleToggle = async (id: string) => {
    await apiFetch(`/admin/product-pricing/${id}/toggle`, { method: 'POST' })
    load()
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: F, color: '#9CA3AF' }}>Ачааллаж байна...</div>

  // ═══ EDIT ═══
  if (editing) {
    return (
      <div style={{ padding: 24, fontFamily: F, maxWidth: 600, margin: '0 auto' }}>
        {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1F2937', color: '#fff', padding: '10px 28px', borderRadius: 99, fontSize: 14, zIndex: 9999 }}>{toast}</div>}
        <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', color: O, fontSize: 14, cursor: 'pointer', fontFamily: F, marginBottom: 8 }}>← Буцах</button>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 20px' }}>{editing.id ? 'Үнэ засах' : 'Шинэ бүтээгдэхүүний үнэ'}</h1>

        <div style={{ background: 'var(--surface, #fff)', borderRadius: 14, padding: 24, border: '1px solid var(--border, #E5E7EB)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Inp label="Нэр *" value={editing.name} onChange={v => setEditing({ ...editing, name: v })} />
            <Inp label="Slug *" value={editing.slug} onChange={v => setEditing({ ...editing, slug: v })} placeholder="digital-card-yearly" />
          </div>
          <Inp label="Тайлбар" value={editing.description || ''} onChange={v => setEditing({ ...editing, description: v })} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Бүтээгдэхүүний төрөл</label>
              <select value={editing.product_type} onChange={e => setEditing({ ...editing, product_type: e.target.value })} style={inp}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Үнийн модел</label>
              <select value={editing.price_model} onChange={e => setEditing({ ...editing, price_model: e.target.value })} style={inp}>
                {Object.entries(MODEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Inp label="Үнэ (MNT)" value={editing.price} onChange={v => setEditing({ ...editing, price: Number(v) })} type="number" />
            {editing.price_model === 'per_unit' && (
              <Inp label="Ширхэгийн үнэ (MNT)" value={editing.unit_price} onChange={v => setEditing({ ...editing, unit_price: Number(v) })} type="number" />
            )}
            {editing.price_model === 'subscription' && (
              <Inp label="Хугацаа (хоног)" value={editing.duration_days} onChange={v => setEditing({ ...editing, duration_days: Number(v) })} type="number" />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Inp label="Үнэгүй хоног" value={editing.free_tier_days} onChange={v => setEditing({ ...editing, free_tier_days: Number(v) })} type="number" />
            <Inp label="Үнэгүй тоо" value={editing.free_tier_units} onChange={v => setEditing({ ...editing, free_tier_units: Number(v) })} type="number" />
          </div>

          <Inp label="Эрэмбэ" value={editing.sort_order} onChange={v => setEditing({ ...editing, sort_order: Number(v) })} type="number" />

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} style={{ width: 18, height: 18, accentColor: O }} />
            Идэвхтэй
          </label>

          <button onClick={handleSave} disabled={saving} style={{ padding: '12px', background: O, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
        </div>
      </div>
    )
  }

  // ═══ LIST ═══
  return (
    <div style={{ padding: 24, fontFamily: F }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1F2937', color: '#fff', padding: '10px 28px', borderRadius: 99, fontSize: 14, zIndex: 9999 }}>{toast}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Бүтээгдэхүүний үнийн удирдлага</h1>
          <p style={{ color: '#6B7280', fontSize: 14, margin: '4px 0 0' }}>Дижитал карт, loyalty, QR, урилга — бүх үнийг удирдах</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} style={{ padding: '10px 24px', background: O, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>+ Шинэ үнэ</button>
      </div>

      {/* Group by product_type */}
      {Object.entries(TYPE_LABELS).map(([type, meta]) => {
        const typeItems = items.filter(i => i.product_type === type)
        if (typeItems.length === 0) return null
        return (
          <div key={type} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>{meta.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: meta.color }}>{meta.label}</span>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>({typeItems.length})</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {typeItems.map((item: any) => (
                <div key={item.id} style={{ background: 'var(--surface, #fff)', borderRadius: 14, padding: 20, border: '1px solid var(--border, #E5E7EB)', opacity: item.is_active ? 1 : 0.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text, #111)' }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{item.slug}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: item.is_active ? '#D1FAE5' : '#FEE2E2', color: item.is_active ? '#059669' : '#DC2626' }}>
                      {item.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                    </span>
                  </div>
                  {item.description && <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10, lineHeight: 1.4 }}>{item.description}</div>}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: meta.color }}>{Number(item.price).toLocaleString()}₮</span>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>{MODEL_LABELS[item.price_model] || item.price_model}</span>
                    {item.price_model === 'subscription' && <span style={{ fontSize: 12, color: '#6B7280' }}>/ {item.duration_days} хоног</span>}
                  </div>
                  {item.free_tier_days > 0 && <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>🎁 {item.free_tier_days} хоног үнэгүй</div>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={() => setEditing({ ...item })} style={{ flex: 1, padding: '7px', background: 'var(--surface2, #F3F4F6)', color: 'var(--text, #374151)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>Засах</button>
                    <button onClick={() => handleToggle(item.id)} style={{ padding: '7px 12px', background: item.is_active ? '#FEE2E2' : '#D1FAE5', color: item.is_active ? '#DC2626' : '#059669', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                      {item.is_active ? 'Идэвхгүй' : 'Идэвхтэй'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Inp({ label, value, onChange, type = 'text', placeholder }: { label: string; value: any; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inp} />
    </div>
  )
}

const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border, #E5E7EB)', fontSize: 14, background: 'var(--bg, #fff)', color: 'var(--text, #000)', fontFamily: "'DM Sans','Segoe UI',sans-serif" }
const lbl: React.CSSProperties = { fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }
