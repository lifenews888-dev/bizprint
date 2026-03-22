'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'

export default function AdminUsersPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'customer', phone: '' })

  const load = () => { apiFetch('/admin/users').then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(load, [])

  const reset = () => { setEditing(null); setForm({ full_name: '', email: '', password: '', role: 'customer', phone: '' }) }
  const save = async () => {
    if (!form.full_name || !form.email) { alert('Нэр, имэйл шаардлагатай'); return }
    if (!editing?.id && (!form.password || form.password.length < 8)) {
      alert('Шинэ хэрэглэгч бүртгэхэд нууц үг (8+ тэмдэгт) шаардлагатай')
      return
    }
    const method = editing?.id ? 'PATCH' : 'POST'
    const url = editing?.id ? `/admin/users/${editing.id}` : `/auth/register`
    const body: any = { ...form }
    if (!body.password) delete body.password
    await apiFetch(url, { method: , body: body })
    reset(); load()
  }
  const del = async (id: string) => { if (!confirm('Устгах уу?')) return; await apiFetch(`/admin/users/${id}`, { method: 'DELETE' }); load() }
  const edit = (item: any) => { setEditing(item); setForm({ full_name: item.full_name || '', email: item.email || '', password: '', role: item.role || 'customer', phone: item.phone || '' }) }

  const ROLE_LABELS: Record<string, string> = { customer: 'Хэрэглэгч', admin: 'Админ', vendor: 'Үйлдвэрлэгч', designer: 'Дизайнер', sales: 'Борлуулагч', courier: 'Хүргэлтийн ажилтан', factory: 'Үйлдвэр' }
  const ROLE_COLOR: Record<string, string> = { admin: '#EF4444', vendor: '#8B5CF6', designer: '#3B82F6', sales: '#F59E0B', courier: '#10B981', customer: '#888', factory: '#6366F1' }
  const CONTRACT_ROLES = ['vendor', 'designer', 'sales', 'courier', 'factory']
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
                {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Утас</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} /></div>
          </div>
          {!editing?.id && CONTRACT_ROLES.includes(form.role) && (
            <p style={{ fontSize: 12, color: '#F59E0B', marginTop: 12, padding: '8px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 8 }}>Гэрээ байгуулсны дараа идэвхжинэ</p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={save} style={{ padding: '10px 24px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Хадгалах</button>
            <button onClick={reset} style={{ padding: '10px 24px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Болих</button>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }} className="table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--surface2)' }}>{['Нэр', 'И-мэйл', 'Үүрэг', 'Гэрээний төлөв', 'Утас', 'Бүртгэсэн', 'Үйлдэл'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500 }}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</td></tr>
            : items.map(u => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 16px', fontWeight: 500 }}>{u.full_name || '—'}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{u.email}</td>
                <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: (ROLE_COLOR[u.role] || '#888') + '15', color: ROLE_COLOR[u.role] || '#888', fontWeight: 600 }}>{ROLE_LABELS[u.role] || u.role}</span></td>
                <td style={{ padding: '10px 16px' }}>
                  {CONTRACT_ROLES.includes(u.role) ? (
                    <span style={{ fontSize: 11, color: u.is_active ? '#10B981' : '#F59E0B' }}>{u.is_active ? 'Гэрээ: Баталгаажсан \u2713' : 'Гэрээ: Хүлээгдэж байна \u231B'}</span>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--text2)' }}>—</span>
                  )}
                  {CONTRACT_ROLES.includes(u.role) && (
                    <button onClick={async () => { await apiFetch(`/admin/users/${u.id}`, { method: 'PATCH', body: { is_active: !u.is_active } }); load() }} style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', background: u.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: u.is_active ? '#EF4444' : '#10B981', border: 'none', borderRadius: 4, cursor: 'pointer' }}>{u.is_active ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}</button>
                  )}
                </td>
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
