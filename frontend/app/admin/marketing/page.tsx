'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'

export default function AdminMarketingPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', type: 'discount', code: '', discount_percent: 0, start_date: '', end_date: '', is_active: true, description: '' })

  useEffect(() => {
    Promise.all([
      apiFetch('/orders').catch(() => []),
      apiFetch('/banners').catch(() => []),
      apiFetch('/marketing/campaigns').catch(() => []),
    ]).then(([o, b, c]) => {
      setOrders(Array.isArray(o) ? o : [])
      setBanners(Array.isArray(b) ? b : [])
      setCampaigns(Array.isArray(c) ? c : [])
    }).finally(() => setLoading(false))
  }, [])

  const reset = () => { setEditing(null); setForm({ name: '', type: 'discount', code: '', discount_percent: 0, start_date: '', end_date: '', is_active: true, description: '' }) }
  const save = async () => {
    const method = editing?.id ? 'PATCH' : 'POST'
    const url = editing?.id ? `/marketing/campaigns/${editing.id}` : `/marketing/campaigns`
    try { await apiFetch(url, { method: , body: form }) } catch {}
    reset()
    const c = await apiFetch('/marketing/campaigns').catch(() => [])
    setCampaigns(Array.isArray(c) ? c : [])
  }
  const del = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    try { await apiFetch(`/marketing/campaigns/${id}`, { method: 'DELETE') } catch {}
    setCampaigns(prev => prev.filter(c => c.id !== id))
  }

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_price || 0), 0)
  const thisMonth = orders.filter(o => { const d = new Date(o.created_at); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
  const lastMonth = orders.filter(o => { const d = new Date(o.created_at); const now = new Date(); const lm = new Date(now.getFullYear(), now.getMonth() - 1); return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear() })
  const growth = lastMonth.length > 0 ? (((thisMonth.length - lastMonth.length) / lastMonth.length) * 100).toFixed(1) : '—'

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Маркетинг</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Кампанит ажил, хямдрал, сурталчилгаа</p>
        </div>
        <button onClick={() => { reset(); setEditing({}) }} style={{ padding: '10px 20px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Шинэ кампани</button>
      </div>

      {/* Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }} className="grid-4">
        {[
          { label: 'Нийт орлого', value: `₮${totalRevenue.toLocaleString()}`, color: '#10B981' },
          { label: 'Энэ сарын захиалга', value: thisMonth.length.toString(), color: '#FF6B00' },
          { label: 'Өсөлт (сар/сар)', value: growth === '—' ? '—' : `${growth}%`, color: Number(growth) >= 0 ? '#10B981' : '#EF4444' },
          { label: 'Идэвхтэй баннер', value: banners.filter(b => b.isActive !== false).length.toString(), color: '#3B82F6' },
          { label: 'Кампани', value: campaigns.length.toString(), color: '#8B5CF6' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{loading ? '...' : s.value}</div>
          </div>
        ))}
      </div>

      {/* Campaign Form */}
      {editing !== null && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>{editing?.id ? 'Кампани засах' : 'Шинэ кампани'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }} className="form-row">
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Кампаний нэр</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inp} placeholder="Шинэ жилийн хямдрал" /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Төрөл</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={inp}>
                <option value="discount">Хямдрал</option><option value="coupon">Купон код</option><option value="banner">Баннер</option><option value="email">И-мэйл</option>
              </select>
            </div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Купон код</label><input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} style={inp} placeholder="NEWYEAR2026" /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Хямдрал %</label><input type="number" value={form.discount_percent} onChange={e => setForm({...form, discount_percent: +e.target.value})} style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Эхлэх огноо</label><input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Дуусах огноо</label><input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} style={inp} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Тайлбар</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={inp} /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, paddingTop: 20 }}><input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />Идэвхтэй</label>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={save} style={{ padding: '10px 24px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Хадгалах</button>
            <button onClick={reset} style={{ padding: '10px 24px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Болих</button>
          </div>
        </div>
      )}

      {/* Campaign List */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Кампанит ажлууд</h3>
        </div>
        {campaigns.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
            {loading ? 'Уншиж байна...' : 'Кампани бүртгэгдээгүй. Backend-д /marketing/campaigns endpoint байгаа эсэхийг шалгана уу.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: 'var(--surface2)' }}>{['Нэр', 'Төрөл', 'Код', 'Хямдрал', 'Хугацаа', 'Төлөв', 'Үйлдэл'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500, fontSize: 12 }}>{h}</th>)}</tr></thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>{c.type}</span></td>
                  <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#FF6B00', fontWeight: 600 }}>{c.code || '—'}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{c.discount_percent ? `${c.discount_percent}%` : '—'}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text2)', fontSize: 12 }}>{c.start_date || '—'} ~ {c.end_date || '—'}</td>
                  <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: c.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: c.is_active ? '#10B981' : '#EF4444', fontWeight: 600 }}>{c.is_active ? 'On' : 'Off'}</span></td>
                  <td style={{ padding: '10px 16px' }}><div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setEditing(c); setForm({ name: c.name||'', type: c.type||'discount', code: c.code||'', discount_percent: c.discount_percent||0, start_date: c.start_date||'', end_date: c.end_date||'', is_active: c.is_active!==false, description: c.description||'' }) }} style={{ padding: '5px 12px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Засах</button>
                    <button onClick={() => del(c.id)} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Устгах</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick links */}
      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <a href="/admin/banners" style={{ padding: '10px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', color: 'var(--text)', fontSize: 13 }}>🖼️ Баннер удирдлага →</a>
        <a href="/admin/settings" style={{ padding: '10px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', color: 'var(--text)', fontSize: 13 }}>⚙️ Тохиргоо →</a>
      </div>
    </div>
  )
}
