'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const tok = () => localStorage.getItem('access_token') || localStorage.getItem('token') || ''
const getHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` })

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Хүлээгдэж буй', color: '#F59E0B' },
  assigned: { label: 'Дизайнер оноогдсон', color: '#8B5CF6' },
  in_progress: { label: 'Хийгдэж байна', color: '#3B82F6' },
  approved: { label: 'Батлагдсан', color: '#10B981' },
  rejected: { label: 'Татгалзсан', color: '#EF4444' },
}

export default function AdminDesignRequestsPage() {
  const [items, setItems] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [assignModal, setAssignModal] = useState<any>(null)
  const [assignForm, setAssignForm] = useState({ designer_id: '', designer_name: '', designer_phone: '', designer_zoom: '' })
  const [detail, setDetail] = useState<any>(null)

  const load = () => {
    Promise.all([
      fetch(`${API}/design-requests`, { headers: getHeaders() }).then(r => r.json()).catch(() => []),
      fetch(`${API}/admin/users`, { headers: getHeaders() }).then(r => r.json()).catch(() => []),
    ]).then(([dr, u]) => {
      setItems(Array.isArray(dr) ? dr : [])
      setUsers(Array.isArray(u) ? u : [])
    }).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const designers = users.filter(u => u.role === 'designer')
  const filtered = filter ? items.filter(i => i.status === filter) : items
  const counts: Record<string, number> = {}
  items.forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1 })

  const assign = async () => {
    if (!assignModal || !assignForm.designer_id) return
    await fetch(`${API}/design-requests/${assignModal.id}/assign`, {
      method: 'PATCH', headers: getHeaders(),
      body: JSON.stringify(assignForm),
    })
    setAssignModal(null)
    setAssignForm({ designer_id: '', designer_name: '', designer_phone: '', designer_zoom: '' })
    load()
  }

  const approve = async (id: string) => {
    await fetch(`${API}/design-requests/${id}/approve`, { method: 'PATCH', headers: getHeaders() })
    load()
  }

  const reject = async (id: string) => {
    const reason = prompt('Татгалзах шалтгаан:')
    if (!reason) return
    await fetch(`${API}/design-requests/${id}/reject`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ reason }) })
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    await fetch(`${API}/design-requests/${id}`, { method: 'DELETE', headers: getHeaders() })
    load()
  }

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Дизайн хүсэлтүүд</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Дизайнер оноох, ажлын явц хянах, батлах/татгалзах</p>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>Нийт: <strong style={{ color: '#FF6B00' }}>{items.length}</strong></div>
      </div>

      {/* Pipeline stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <div key={key} onClick={() => setFilter(filter === key ? '' : key)} style={{ background: filter === key ? cfg.color + '15' : 'var(--surface)', borderLeft: `1px solid ${filter === key ? cfg.color + '40' : 'var(--border)'}`, borderRight: `1px solid ${filter === key ? cfg.color + '40' : 'var(--border)'}`, borderBottom: `1px solid ${filter === key ? cfg.color + '40' : 'var(--border)'}`, borderTop: `3px solid ${cfg.color}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: cfg.color }}>{counts[key] || 0}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setAssignModal(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 460, border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 6px' }}>Дизайнер оноох</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', margin: '0 0 20px' }}>Хүсэлт: {assignModal.product_name || assignModal.id?.slice(0, 8)}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Дизайнер</label>
                <select value={assignForm.designer_id} onChange={e => {
                  const d = designers.find(d => d.id === e.target.value)
                  setAssignForm({ ...assignForm, designer_id: e.target.value, designer_name: d?.full_name || d?.email || '' })
                }} style={{ width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)' }}>
                  <option value="">-- Дизайнер сонгох --</option>
                  {designers.map(d => <option key={d.id} value={d.id}>{d.full_name || d.email} ({d.email})</option>)}
                  {designers.length === 0 && <option disabled>Дизайнер бүртгэгдээгүй</option>}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Утас (заавал биш)</label>
                <input value={assignForm.designer_phone} onChange={e => setAssignForm({ ...assignForm, designer_phone: e.target.value })} placeholder="99001122"
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Zoom link (заавал биш)</label>
                <input value={assignForm.designer_zoom} onChange={e => setAssignForm({ ...assignForm, designer_zoom: e.target.value })} placeholder="https://zoom.us/j/..."
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={assign} disabled={!assignForm.designer_id} style={{ flex: 1, padding: '10px', background: assignForm.designer_id ? '#8B5CF6' : '#666', color: '#fff', border: 'none', borderRadius: 8, cursor: assignForm.designer_id ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 600 }}>Оноох</button>
              <button onClick={() => setAssignModal(null)} style={{ padding: '10px 20px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Болих</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDetail(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520, border: '1px solid var(--border)', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 16px' }}>Дэлгэрэнгүй</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              {[
                ['ID', detail.id?.slice(0, 12)],
                ['Бүтээгдэхүүн', detail.product_name],
                ['Хэрэглэгч', `${detail.customer_name || '—'} (${detail.customer_email || '—'})`],
                ['Утас', detail.customer_phone],
                ['Дизайнер', detail.designer_name || '—'],
                ['Төлөв', STATUS_CFG[detail.status]?.label || detail.status],
                ['Тайлбар', detail.description],
                ['Файл', detail.file_url],
                ['Preview', detail.preview_url],
                ['Огноо', detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'],
              ].map(([k, v]) => v ? (
                <div key={k as string} style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--text2)', minWidth: 100 }}>{k}</span>
                  <span style={{ fontWeight: 500, wordBreak: 'break-all' }}>{v as string}</span>
                </div>
              ) : null)}
            </div>
            <button onClick={() => setDetail(null)} style={{ marginTop: 20, padding: '10px 24px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, width: '100%' }}>Хаах</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--surface2)' }}>
            {['Хэрэглэгч', 'Бүтээгдэхүүн', 'Дизайнер', 'Төлөв', 'Огноо', 'Үйлдэл'].map(h =>
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
            )}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</td></tr>
            : filtered.length === 0 ? <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Хүсэлт байхгүй</td></tr>
            : filtered.map(dr => {
              const st = STATUS_CFG[dr.status] || { label: dr.status, color: '#888' }
              return (
                <tr key={dr.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{dr.customer_name || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{dr.customer_email || ''}</div>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{dr.product_name || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {dr.designer_name ? (
                      <span style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 500 }}>{dr.designer_name}</span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>Оноогдоогүй</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: st.color + '15', color: st.color, fontWeight: 600 }}>{st.label}</span>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text3)', fontSize: 12 }}>{dr.created_at ? new Date(dr.created_at).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <button onClick={() => setDetail(dr)} style={{ padding: '4px 10px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Харах</button>
                      {dr.status === 'pending' && <button onClick={() => setAssignModal(dr)} style={{ padding: '4px 10px', background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Оноох</button>}
                      {(dr.status === 'in_progress' || dr.status === 'assigned') && <button onClick={() => approve(dr.id)} style={{ padding: '4px 10px', background: 'rgba(16,185,129,0.1)', color: '#10B981', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Батлах</button>}
                      {(dr.status === 'in_progress' || dr.status === 'assigned') && <button onClick={() => reject(dr.id)} style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Татгалзах</button>}
                      <button onClick={() => del(dr.id)} style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Устгах</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
