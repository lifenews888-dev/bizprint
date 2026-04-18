'use client'
import { useState, useEffect } from 'react'
const API = 'http://localhost:4000'
const tok = () => localStorage.getItem('access_token') || localStorage.getItem('token') || ''
const getHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` })
export default function AdminVendorsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ company_name: '', contact_name: '', email: '', phone: '', address: '', description: '', is_active: true })
  const load = () => { fetch(`${API}/admin/vendors`, { headers: getHeaders() }).then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(load, [])
  const reset = () => { setEditing(null); setForm({ company_name: '', contact_name: '', email: '', phone: '', address: '', description: '', is_active: true }) }
  const save = async () => { const m = editing?.id ? 'PATCH' : 'POST'; const u = editing?.id ? `${API}/admin/vendors/${editing.id}` : `${API}/admin/vendors`; await fetch(u, { method: m, headers: getHeaders(), body: JSON.stringify(form) }); reset(); load() }
  const del = async (id: string) => { if (!confirm('Устгах уу?')) return; await fetch(`${API}/admin/vendors/${id}`, { method: 'DELETE', headers: getHeaders() }); load() }
  const edit = (i: any) => { setEditing(i); setForm({ company_name: i.company_name||'', contact_name: i.contact_name||'', email: i.contact_email||i.email||'', phone: i.phone||'', address: i.address||'', description: i.description||'', is_active: i.is_active !== false }) }
  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }
  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Vendors</h1><p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Нийлүүлэгч / Үйлдвэрүүд</p></div>
        <button onClick={() => { reset(); setEditing({}) }} style={{ padding: '10px 20px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Шинэ</button>
      </div>
      {editing !== null && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="form-row">
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Компани</label><input value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Холбогдох хүн</label><input value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>И-мэйл</label><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Утас</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Хаяг</label><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={inp} /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, paddingTop: 20 }}><input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />Идэвхтэй</label>
            <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Тайлбар</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{...inp, minHeight: 60, resize: 'vertical'}} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={save} style={{ padding: '10px 24px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Хадгалах</button>
            <button onClick={reset} style={{ padding: '10px 24px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Болих</button>
          </div>
        </div>
      )}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }} className="table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--surface2)' }}>{['Компани', 'Холбоо', 'И-мэйл', 'Утас', 'Төлөв', 'Үйлдэл'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500 }}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</td></tr>
            : items.length === 0 ? <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Vendor байхгүй</td></tr>
            : items.map(v => (
              <tr key={v.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 16px', fontWeight: 500 }}>{v.company_name || v.name || '—'}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{v.contact_name || '—'}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{v.email || '—'}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{v.phone || '—'}</td>
                <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: v.is_active !== false ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: v.is_active !== false ? '#10B981' : '#EF4444', fontWeight: 600 }}>{v.is_active !== false ? 'On' : 'Off'}</span></td>
                <td style={{ padding: '10px 16px' }}><div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => edit(v)} style={{ padding: '5px 12px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Засах</button>
                  <button onClick={() => del(v.id)} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Устгах</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
