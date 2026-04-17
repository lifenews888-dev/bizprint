'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const getHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` })

export default function AdminUsersPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'user', phone: '' })

  const load = () => { fetch(`${API}/admin/users`, { headers: getHeaders() }).then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(load, [])

  const reset = () => { setEditing(null); setForm({ full_name: '', email: '', password: '', role: 'user', phone: '' }) }
  const save = async () => {
    const method = editing?.id ? 'PATCH' : 'POST'
    const url = editing?.id ? `${API}/admin/users/${editing.id}` : `${API}/auth/register`
    const body: any = { ...form }
    if (!body.password) delete body.password
    await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(body) })
    reset(); load()
  }
  const del = async (id: string) => { if (!confirm('Устгах уу?')) return; await fetch(`${API}/admin/users/${id}`, { method: 'DELETE', headers: getHeaders() }); load() }
  const edit = (item: any) => { setEditing(item); setForm({ full_name: item.full_name || '', email: item.email || '', password: '', role: item.role || 'user', phone: item.phone || '' }) }

  const ROLE_COLOR: Record<string, string> = { admin: '#EF4444', vendor: '#8B5CF6', designer: '#3B82F6', sales: '#F59E0B', courier: '#10B981', user: '#888' }
  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Хэрэглэгчид</h1><p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Нийт {items.length} хэрэглэгч</p></div>
        <button onClick={() => { reset(); setEditing({}) }} style={{ padding: '10px 20px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Шинэ</button>
      </div>

      {editing !== null && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>{editing?.id ? 'Засах' : 'Шинэ хэрэглэгч'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="form-row">
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Нэр</label><input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>И-мэйл</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Нууц үг {editing?.id ? '(хоосон = өөрчлөхгүй)' : ''}</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Үүрэг</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inp}>
                {['user', 'admin', 'vendor', 'designer', 'sales', 'courier', 'partner'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Утас</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={save} style={{ padding: '10px 24px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Хадгалах</button>
            <button onClick={reset} style={{ padding: '10px 24px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Болих</button>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }} className="table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--surface2)' }}>{['Нэр', 'И-мэйл', 'Үүрэг', 'Утас', 'Бүртгэсэн', 'Үйлдэл'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500 }}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</td></tr>
            : items.map(u => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 16px', fontWeight: 500 }}>{u.full_name || '—'}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{u.email}</td>
                <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: (ROLE_COLOR[u.role] || '#888') + '15', color: ROLE_COLOR[u.role] || '#888', fontWeight: 600 }}>{u.role}</span></td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{u.phone || '—'}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                <td style={{ padding: '10px 16px' }}><div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => edit(u)} style={{ padding: '5px 12px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Засах</button>
                  <button onClick={() => del(u.id)} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Устгах</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
