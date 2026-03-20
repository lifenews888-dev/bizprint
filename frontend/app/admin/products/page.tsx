'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const getHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` })

export default function AdminProductsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', name_mn: '', slug: '', category: '', base_price: 0, min_quantity: 1, lead_time_days: 3, description: '', is_active: true })

  const load = () => { fetch(`${API}/products`, { headers: getHeaders() }).then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(load, [])

  const reset = () => { setEditing(null); setForm({ name: '', name_mn: '', slug: '', category: '', base_price: 0, min_quantity: 1, lead_time_days: 3, description: '', is_active: true }) }
  const save = async () => {
    const method = editing?.id ? 'PATCH' : 'POST'
    const url = editing?.id ? `${API}/products/${editing.id}` : `${API}/products`
    await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(form) })
    reset(); load()
  }
  const del = async (id: string) => { if (!confirm('Устгах уу?')) return; await fetch(`${API}/products/${id}`, { method: 'DELETE', headers: getHeaders() }); load() }
  const edit = (item: any) => { setEditing(item); setForm({ name: item.name || '', name_mn: item.name_mn || '', slug: item.slug || '', category: item.category || '', base_price: item.base_price || 0, min_quantity: item.min_quantity || 1, lead_time_days: item.lead_time_days || 3, description: item.description || '', is_active: item.is_active !== false }) }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Бүтээгдэхүүн</h1><p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Нийт {items.length} бүтээгдэхүүн</p></div>
        <button onClick={() => { reset(); setEditing({}) }} style={{ padding: '10px 20px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Шинэ</button>
      </div>

      {editing !== null && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>{editing?.id ? 'Засах' : 'Шинэ бүтээгдэхүүн'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="form-row">
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Нэр (EN)</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} placeholder="Business Card" /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Нэр (МН)</label><input value={form.name_mn} onChange={e => setForm({ ...form, name_mn: e.target.value })} style={inp} placeholder="Визит карт" /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Slug</label><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} style={inp} placeholder="business-card" /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Ангилал</label><input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Үндсэн үнэ</label><input type="number" value={form.base_price} onChange={e => setForm({ ...form, base_price: +e.target.value })} style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Хамгийн бага тоо</label><input type="number" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: +e.target.value })} style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Хүргэх хугацаа (өдөр)</label><input type="number" value={form.lead_time_days} onChange={e => setForm({ ...form, lead_time_days: +e.target.value })} style={inp} /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, paddingTop: 20 }}><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />Идэвхтэй</label>
            <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Тайлбар</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inp, minHeight: 80, resize: 'vertical' }} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={save} style={{ padding: '10px 24px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Хадгалах</button>
            <button onClick={reset} style={{ padding: '10px 24px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Болих</button>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }} className="table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--surface2)' }}>{['Нэр', 'Ангилал', 'Үнэ', 'Тоо', 'Хугацаа', 'Төлөв', 'Үйлдэл'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500 }}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</td></tr>
            : items.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 16px' }}><div style={{ fontWeight: 500 }}>{p.name_mn || p.name}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.slug}</div></td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{p.category || '—'}</td>
                <td style={{ padding: '10px 16px', color: '#FF6B00', fontWeight: 600 }}>₮{Number(p.base_price || 0).toLocaleString()}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{p.min_quantity}+</td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{p.lead_time_days} өдөр</td>
                <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: p.is_active !== false ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: p.is_active !== false ? '#10B981' : '#EF4444', fontWeight: 600 }}>{p.is_active !== false ? 'On' : 'Off'}</span></td>
                <td style={{ padding: '10px 16px' }}><div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => edit(p)} style={{ padding: '5px 12px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Засах</button>
                  <button onClick={() => del(p.id)} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Устгах</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
