'use client'
import React, { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const tok = () => localStorage.getItem('access_token') || localStorage.getItem('token') || ''
const getHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` })

const ROLE_COLOR: Record<string, string> = {
  admin: '#EF4444', vendor: '#8B5CF6', designer: '#3B82F6',
  sales: '#F59E0B', courier: '#10B981', creator: '#A78BFA', user: '#888', customer: '#888',
}
const ROLE_MN: Record<string, string> = {
  admin: 'Админ', vendor: 'Вендор', designer: 'Дизайнер',
  sales: 'Борлуулагч', courier: 'Курьер', creator: 'Бүтээгч',
  customer: 'Хэрэглэгч', user: 'Хэрэглэгч',
}

export default function AdminUsersPage() {
  const [tab, setTab] = useState<'users' | 'requests'>('users')
  const [items, setItems] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reqLoading, setReqLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'customer', phone: '' })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const show = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  const load = () => {
    setLoading(true)
    fetch(`${API}/admin/users`, { headers: getHeaders() })
      .then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false))
  }

  const loadRequests = () => {
    setReqLoading(true)
    fetch(`${API}/admin/role-requests`, { headers: getHeaders() })
      .then(r => r.json()).then(d => setRequests(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setReqLoading(false))
  }

  useEffect(() => { load(); loadRequests() }, [])

  const reset = () => { setEditing(null); setForm({ full_name: '', email: '', password: '', role: 'customer', phone: '' }) }

  const save = async () => {
    const method = editing?.id ? 'PATCH' : 'POST'
    const url = editing?.id ? `${API}/admin/users/${editing.id}` : `${API}/auth/register`
    const body: any = { ...form }
    if (!body.password) delete body.password
    await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(body) })
    reset(); load()
  }

  const del = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    await fetch(`${API}/admin/users/${id}`, { method: 'DELETE', headers: getHeaders() }); load()
  }

  const edit = (item: any) => {
    setEditing(item)
    setForm({ full_name: item.full_name || '', email: item.email || '', password: '', role: item.role || 'customer', phone: item.phone || '' })
  }

  const approveRole = async (id: string) => {
    setActionLoading(id + '_approve')
    const r = await fetch(`${API}/admin/users/${id}/approve-role`, { method: 'PATCH', headers: getHeaders() })
    if (r.ok) { show('Үүрэг батлагдлаа ✅'); loadRequests(); load() }
    else show('Алдаа гарлаа')
    setActionLoading(null)
  }

  const rejectRole = async (id: string) => {
    setActionLoading(id + '_reject')
    const r = await fetch(`${API}/admin/users/${id}/reject-role`, { method: 'PATCH', headers: getHeaders() })
    if (r.ok) { show('Хүсэлт татгалзагдлаа'); loadRequests() }
    else show('Алдаа гарлаа')
    setActionLoading(null)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: 'var(--surface2)',
    border: '1px solid var(--border)', borderRadius: 8, fontSize: 13,
    color: 'var(--text)', outline: 'none',
  }

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1C1917', color: '#fff', padding: '10px 28px', borderRadius: 99, fontSize: 14, zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Хэрэглэгчид</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Нийт {items.length} хэрэглэгч</p>
        </div>
        <button onClick={() => { reset(); setEditing({}) }} style={{ padding: '10px 20px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          + Шинэ
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {[
          { key: 'users', label: 'Хэрэглэгчид', count: items.length },
          { key: 'requests', label: 'Үүргийн хүсэлтүүд', count: requests.length, highlight: requests.length > 0 },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} style={{
            padding: '10px 20px', border: 'none', borderBottom: tab === t.key ? '2px solid #FF6B00' : '2px solid transparent',
            marginBottom: '-2px', background: 'none', fontSize: 14, fontWeight: tab === t.key ? 600 : 400,
            color: tab === t.key ? 'var(--text)' : 'var(--text2)', cursor: 'pointer',
          }}>
            {t.label}
            <span style={{ marginLeft: 6, fontSize: 11, background: t.highlight ? '#EF444420' : (tab === t.key ? '#FF6B00' : 'var(--surface2)'), color: t.highlight ? '#EF4444' : (tab === t.key ? '#fff' : 'var(--text2)'), padding: '1px 7px', borderRadius: 99, fontWeight: 600 }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ─── USERS TAB ─── */}
      {tab === 'users' && (
        <>
          {editing !== null && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>{editing?.id ? 'Засах' : 'Шинэ хэрэглэгч'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="form-row">
                <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Нэр</label><input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} style={inp} /></div>
                <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>И-мэйл</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} /></div>
                <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Нууц үг {editing?.id ? '(хоосон = өөрчлөхгүй)' : ''}</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inp} /></div>
                <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Үүрэг</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inp}>
                    {['customer', 'admin', 'vendor', 'designer', 'sales', 'courier', 'creator'].map(r => (
                      <option key={r} value={r}>{ROLE_MN[r] || r}</option>
                    ))}
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
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  {['Нэр', 'И-мэйл', 'Үүрэг', 'Утас', 'Бүртгэсэн', 'Үйлдэл'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</td></tr>
                ) : items.map(u => (
                  <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 500 }}>{u.full_name || '—'}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{u.email}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: (ROLE_COLOR[u.role] || '#888') + '15', color: ROLE_COLOR[u.role] || '#888', fontWeight: 600 }}>
                        {ROLE_MN[u.role] || u.role}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{u.phone || '—'}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('mn-MN') : '—'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => edit(u)} style={{ padding: '5px 12px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Засах</button>
                        <button onClick={() => del(u.id)} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Устгах</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── ROLE REQUESTS TAB ─── */}
      {tab === 'requests' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {reqLoading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</div>
          ) : requests.length === 0 ? (
            <div style={{ padding: 64, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Хүсэлт байхгүй байна</div>
              <div style={{ color: 'var(--text2)', fontSize: 13 }}>Шийдвэрлэх үүргийн хүсэлт одоогоор байхгүй</div>
            </div>
          ) : (
            <>
              <div style={{ padding: '12px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr 0.8fr 1fr', fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                <span>Хэрэглэгч</span>
                <span>И-мэйл</span>
                <span>Одоогийн үүрэг</span>
                <span>Хүссэн үүрэг</span>
                <span>Үйлдэл</span>
              </div>
              {requests.map((u, i) => (
                <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr 0.8fr 1fr', padding: '14px 20px', borderTop: i > 0 ? '1px solid var(--border)' : 'none', alignItems: 'center', fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{u.full_name || '—'}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 12 }}>{u.email}</div>
                  <div>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: (ROLE_COLOR[u.role] || '#888') + '15', color: ROLE_COLOR[u.role] || '#888', fontWeight: 600 }}>
                      {ROLE_MN[u.role] || u.role}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 99, background: (ROLE_COLOR[u.role_request] || '#A78BFA') + '20', color: ROLE_COLOR[u.role_request] || '#A78BFA', fontWeight: 700, border: '1px solid ' + (ROLE_COLOR[u.role_request] || '#A78BFA') + '40' }}>
                      🎨 {ROLE_MN[u.role_request] || u.role_request}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => approveRole(u.id)}
                      disabled={actionLoading === u.id + '_approve'}
                      style={{ padding: '6px 14px', background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: actionLoading === u.id + '_approve' ? 0.5 : 1 }}>
                      ✓ Зөвшөөрөх
                    </button>
                    <button
                      onClick={() => rejectRole(u.id)}
                      disabled={actionLoading === u.id + '_reject'}
                      style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: actionLoading === u.id + '_reject' ? 0.5 : 1 }}>
                      ✕ Татгалзах
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
