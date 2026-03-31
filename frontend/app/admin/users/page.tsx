'use client'
import { apiFetch, API_URL } from '@/lib/api'
import { useState, useEffect, useCallback } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Megaphone, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/* ═══════════════════════════════════════
 *  ADMIN USER MANAGEMENT
 *  Role tabs, contract upload, broadcast notifications
 * ═══════════════════════════════════════ */

const ROLE_LABELS: Record<string, string> = {
  all: 'Бүгд', customer: 'Хэрэглэгч', admin: 'Админ', superadmin: 'Супер Админ',
  vendor: 'Үйлдвэрлэгч', designer: 'Дизайнер', sales: 'Борлуулагч',
  courier: 'Хүргэлт', factory: 'Үйлдвэр', creator: 'Контент',
}
const ROLE_COLOR: Record<string, string> = {
  superadmin: '#DC2626', admin: '#EF4444', vendor: '#8B5CF6', designer: '#3B82F6',
  sales: '#F59E0B', courier: '#10B981', customer: '#64748B', factory: '#6366F1', creator: '#EC4899',
}
const CONTRACT_ROLES = ['vendor', 'designer', 'sales', 'courier', 'factory', 'creator']

export default function AdminUsersPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'customer', phone: '', company_name: '' })
  const [detail, setDetail] = useState<any>(null)
  const [broadcastModal, setBroadcastModal] = useState(false)
  const [bcForm, setBcForm] = useState({ title: '', message: '', roles: [] as string[], send_email: false, attachment_url: '' })
  const [bcSending, setBcSending] = useState(false)
  const [bcUploading, setBcUploading] = useState(false)
  const [bcFileName, setBcFileName] = useState('')

  const load = useCallback(() => {
    apiFetch('/admin/users').then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  const reset = () => { setEditing(null); setForm({ full_name: '', email: '', password: '', role: 'customer', phone: '', company_name: '' }) }

  const save = async () => {
    if (!form.full_name || !form.email) { alert('Нэр, имэйл шаардлагатай'); return }
    if (!editing?.id && (!form.password || form.password.length < 8)) { alert('Нууц үг 8+ тэмдэгт'); return }
    const method = editing?.id ? 'PATCH' : 'POST'
    const url = editing?.id ? `/admin/users/${editing.id}` : '/auth/register'
    const body: any = { ...form }
    if (!body.password) delete body.password
    await apiFetch(url, { method, body: JSON.stringify(body) })
    reset(); load()
  }

  const del = async (id: string) => { if (!confirm('Устгах уу?')) return; await apiFetch(`/admin/users/${id}`, { method: 'DELETE' }); load() }

  const edit = (u: any) => {
    setEditing(u)
    setForm({ full_name: u.full_name || '', email: u.email || '', password: '', role: u.role || 'customer', phone: u.phone || '', company_name: u.company_name || '' })
  }

  const toggleActive = async (u: any) => {
    await apiFetch(`/admin/users/${u.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !u.is_active }) })
    load()
  }

  const uploadContract = async (userId: string, field: 'contract_url' | 'contract_attachment_url', file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${API_URL}/upload/file`, { method: 'POST', body: fd, headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` } })
    const data = await res.json()
    if (data.file_url) {
      await apiFetch(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify({ [field]: data.file_url, ...(field === 'contract_url' ? { contract_signed_at: new Date().toISOString() } : {}) }) })
      load()
      if (detail?.id === userId) setDetail((p: any) => p ? { ...p, [field]: data.file_url } : null)
    }
  }

  const sendBroadcast = async () => {
    if (!bcForm.title || !bcForm.message) { alert('Гарчиг, мессеж шаардлагатай'); return }
    setBcSending(true)
    try {
      const res: any = await apiFetch('/admin/broadcast', { method: 'POST', body: JSON.stringify(bcForm) })
      alert(`Илгээгдлээ: ${res.notifications_sent} мэдэгдэл, ${res.emails_sent} имэйл`)
      setBroadcastModal(false)
      setBcForm({ title: '', message: '', roles: [], send_email: false, attachment_url: '' }); setBcFileName('')
    } catch { alert('Алдаа') } finally { setBcSending(false) }
  }

  // Filter
  const filtered = items.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return (u.full_name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s) || (u.phone || '').includes(s)
    }
    return true
  })

  // Role counts
  const roleCounts: Record<string, number> = { all: items.length }
  items.forEach(u => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1 })

  return (
    <div className="p-4 md:p-6">
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}} .u-row{transition:background .15s}.u-row:hover{background:var(--surface2)!important}`}</style>

      {/* Header */}
      <AdminPageHeader title="Хэрэглэгчид" description={`Нийт ${items.length} хэрэглэгч`}>
        <Button variant="outline" size="sm" onClick={() => setBroadcastModal(true)}>
          <Megaphone className="h-3.5 w-3.5 mr-1.5" />Мэдэгдэл
        </Button>
        <Button size="sm" onClick={() => { reset(); setEditing({}) }}>
          <Plus className="h-4 w-4 mr-1" />Шинэ
        </Button>
      </AdminPageHeader>

      {/* Role Tabs */}
      <div className="flex flex-wrap gap-1 mb-4">
        {Object.entries(ROLE_LABELS).map(([k, v]) => {
          const count = roleCounts[k] || 0
          const active = roleFilter === k
          const color = k === 'all' ? '#FF6B00' : ROLE_COLOR[k] || '#888'
          return (
            <button key={k} onClick={() => setRoleFilter(k)} className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors border',
              active ? 'text-white font-semibold' : 'bg-card text-muted-foreground border-border hover:bg-muted'
            )} style={active ? { background: color, borderColor: color } : undefined}>
              {v} {count > 0 && <span className="opacity-70">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="mb-4 relative w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Хайх... (нэр, имэйл, утас)" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
      </div>

      {/* Create/Edit Form */}
      {editing !== null && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>{editing?.id ? 'Засах' : 'Шинэ хэрэглэгч'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
            <div><label style={lbl}>Нэр</label><input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>И-мэйл</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Нууц үг {editing?.id ? '(хоосон=өөрчлөхгүй)' : '*'}</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Үүрэг</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inp}>
                {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'all').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Утас</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Байгууллага</label><input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} style={inp} /></div>
          </div>
          {!editing?.id && CONTRACT_ROLES.includes(form.role) && (
            <p style={{ fontSize: 12, color: '#F59E0B', marginTop: 12, padding: '8px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 8 }}>Гэрээ байгуулсны дараа идэвхжинэ</p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={save} style={{ padding: '10px 24px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Хадгалах</button>
            <button onClick={reset} style={{ padding: '10px 24px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Болих</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--surface2)' }}>
            {['Нэр', 'И-мэйл', 'Үүрэг', 'Гэрээ', 'Утас', 'Бүртгэсэн', 'Үйлдэл'].map(h =>
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
            )}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</td></tr>
            : filtered.length === 0 ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Хэрэглэгч олдсонгүй</td></tr>
            : filtered.map(u => {
              const rc = ROLE_COLOR[u.role] || '#888'
              const isContract = CONTRACT_ROLES.includes(u.role)
              return (
                <tr key={u.id} className="u-row" style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setDetail(u)}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 500 }}>{u.full_name || '—'}</div>
                    {u.company_name && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.company_name}</div>}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text2)', fontSize: 12 }}>{u.email}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: rc + '18', color: rc, fontWeight: 600 }}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {isContract ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {u.contract_url ? (
                          <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>📄 Гэрээтэй</span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#F59E0B' }}>Гэрээгүй</span>
                        )}
                        {u.is_active ? (
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#DCFCE7', color: '#16A34A' }}>Идэвхтэй</span>
                        ) : (
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#FEF3C7', color: '#D97706' }}>Хүлээгдэж буй</span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text2)', fontSize: 12 }}>{u.phone || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text3)', fontSize: 12 }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('mn-MN') : '—'}</td>
                  <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => edit(u)} style={actionBtn('#3B82F6')}>Засах</button>
                      {isContract && (
                        <button onClick={() => toggleActive(u)} style={actionBtn(u.is_active ? '#EF4444' : '#10B981')}>
                          {u.is_active ? 'Зогсоох' : 'Идэвхжүүлэх'}
                        </button>
                      )}
                      <button onClick={() => del(u.id)} style={actionBtn('#EF4444')}>Устгах</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* DETAIL PANEL */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setDetail(null)}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: 500, height: '100%', overflow: 'auto', borderLeft: '1px solid var(--border)', boxShadow: '-8px 0 30px rgba(0,0,0,0.15)', animation: 'slideIn .2s ease', padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{detail.full_name || '—'}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>{detail.email}</div>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: (ROLE_COLOR[detail.role] || '#888') + '18', color: ROLE_COLOR[detail.role] || '#888', fontWeight: 600, marginTop: 4, display: 'inline-block' }}>
                  {ROLE_LABELS[detail.role] || detail.role}
                </span>
              </div>
              <button onClick={() => setDetail(null)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            {/* Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 20 }}>
              {[
                ['Утас', detail.phone],
                ['Байгууллага', detail.company_name],
                ['Регистр', detail.register_number],
                ['Банк', detail.bank_name],
                ['Данс', detail.bank_account],
                ['Данс нэр', detail.bank_account_name],
                ['Бүртгэл', detail.created_at ? new Date(detail.created_at).toLocaleDateString('mn-MN') : '—'],
                ['Сүүлд нэвтэрсэн', detail.last_login_at ? new Date(detail.last_login_at).toLocaleString('mn-MN') : '—'],
              ].map(([k, v]) => (
                <div key={k as string} style={{ fontSize: 12 }}>
                  <span style={{ color: 'var(--text3)' }}>{k}: </span>
                  <span style={{ fontWeight: 500 }}>{(v as string) || '—'}</span>
                </div>
              ))}
            </div>

            {/* Contract Section */}
            {CONTRACT_ROLES.includes(detail.role) && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--text)' }}>Гэрээний мэдээлэл</div>

                {/* Contract file */}
                <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>📄 Гэрээ</div>
                  {detail.contract_url ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <a href={detail.contract_url.startsWith('http') ? detail.contract_url : `/${detail.contract_url}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#3B82F6' }}>Файл харах →</a>
                      {detail.contract_signed_at && <span style={{ fontSize: 11, color: 'var(--text3)' }}>Баталсан: {new Date(detail.contract_signed_at).toLocaleDateString('mn-MN')}</span>}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#F59E0B', marginBottom: 6 }}>Гэрээ оруулаагүй</div>
                  )}
                  <label style={{ display: 'inline-block', marginTop: 8, padding: '6px 14px', background: '#FF6B00', color: '#fff', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                    Гэрээ оруулах
                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" hidden onChange={e => { if (e.target.files?.[0]) uploadContract(detail.id, 'contract_url', e.target.files[0]) }} />
                  </label>
                </div>

                {/* Contract attachment */}
                <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>📎 Хавсралт</div>
                  {detail.contract_attachment_url ? (
                    <a href={detail.contract_attachment_url.startsWith('http') ? detail.contract_attachment_url : `/${detail.contract_attachment_url}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#3B82F6' }}>Файл харах →</a>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>Хавсралт байхгүй</div>
                  )}
                  <label style={{ display: 'inline-block', marginTop: 8, padding: '6px 14px', background: 'var(--surface2)', color: 'var(--text2)', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '1px solid var(--border)' }}>
                    Хавсралт оруулах
                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.png,.xlsx" hidden onChange={e => { if (e.target.files?.[0]) uploadContract(detail.id, 'contract_attachment_url', e.target.files[0]) }} />
                  </label>
                </div>

                {/* Activate/Deactivate */}
                <div style={{ marginTop: 12 }}>
                  <button onClick={() => { toggleActive(detail); setDetail((p: any) => p ? { ...p, is_active: !p.is_active } : null) }} style={{
                    padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: detail.is_active ? '#FEE2E2' : '#DCFCE7', color: detail.is_active ? '#DC2626' : '#16A34A',
                  }}>
                    {detail.is_active ? 'Гэрээ цуцлах (идэвхгүй болгох)' : 'Гэрээ баталгаажуулах (идэвхжүүлэх)'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BROADCAST MODAL */}
      {broadcastModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setBroadcastModal(false)}>
          <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 520, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg,#FF6B00,#F59E0B)', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Мэдэгдэл илгээх</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Dashboard + имэйл</div>
              </div>
              <button onClick={() => setBroadcastModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 32, height: 32, color: '#fff', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            <div style={{ padding: '24px 28px 28px' }}>
              {/* Title */}
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Гарчиг *</label>
                <input value={bcForm.title} onChange={e => setBcForm({ ...bcForm, title: e.target.value })} placeholder="Жишээ: Шинэ үнийн санал" style={{ ...inp, fontSize: 15, padding: '12px 16px' }} />
              </div>

              {/* Message */}
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Мэдэгдэлийн агуулга *</label>
                <textarea value={bcForm.message} onChange={e => setBcForm({ ...bcForm, message: e.target.value })} placeholder="Хэрэглэгчдэд хүргэх мэдээлэл..." rows={4} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
              </div>

              {/* File Attachment */}
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Хавсралт файл</label>
                <div style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: bcForm.attachment_url ? '10px 16px' : '20px', textAlign: 'center', background: 'var(--bg)', transition: 'all .15s' }}>
                  {bcForm.attachment_url ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>📎</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{bcFileName || 'Файл'}</div>
                          <div style={{ fontSize: 11, color: '#10B981' }}>Амжилттай оруулсан</div>
                        </div>
                      </div>
                      <button onClick={() => { setBcForm({ ...bcForm, attachment_url: '' }); setBcFileName('') }} style={{ padding: '4px 10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>Устгах</button>
                    </div>
                  ) : (
                    <label style={{ cursor: 'pointer', display: 'block' }}>
                      {bcUploading ? (
                        <div style={{ color: 'var(--text3)', fontSize: 13 }}>Оруулж байна...</div>
                      ) : (
                        <>
                          <div style={{ fontSize: 28, marginBottom: 4 }}>📁</div>
                          <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Файл чирж оруулах эсвэл сонгох</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>PDF, DOC, XLSX, JPG, PNG (10MB хүртэл)</div>
                        </>
                      )}
                      <input type="file" accept=".pdf,.doc,.docx,.xlsx,.jpg,.png,.jpeg" hidden onChange={async e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setBcUploading(true)
                        try {
                          const fd = new FormData(); fd.append('file', file)
                          const res = await fetch(`${API_URL}/upload/file`, { method: 'POST', body: fd, headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}` } })
                          const data = await res.json()
                          if (data.file_url) { setBcForm(f => ({ ...f, attachment_url: data.file_url })); setBcFileName(file.name) }
                        } catch {} finally { setBcUploading(false) }
                      }} />
                    </label>
                  )}
                </div>
              </div>

              {/* Target Roles */}
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Хүлээн авагчид</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'all').map(([k, v]) => {
                    const selected = bcForm.roles.includes(k)
                    const color = ROLE_COLOR[k] || '#888'
                    return (
                      <button key={k} onClick={() => setBcForm(f => ({ ...f, roles: selected ? f.roles.filter(r => r !== k) : [...f.roles, k] }))} style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: selected ? 600 : 400, transition: 'all .15s',
                        background: selected ? color : 'var(--surface2)', color: selected ? '#fff' : 'var(--text2)', border: `1px solid ${selected ? color : 'var(--border)'}`,
                      }}>{v}</button>
                    )
                  })}
                </div>
                {bcForm.roles.length === 0 && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Сонголт хийгээгүй = бүх хэрэглэгчдэд</div>}
              </div>

              {/* Email toggle */}
              <div style={{ marginBottom: 20, padding: '12px 16px', background: 'var(--surface2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>И-мэйлээр бас илгээх</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Dashboard мэдэгдлийн зэрэгцээ имэйл илгээнэ</div>
                </div>
                <button onClick={() => setBcForm({ ...bcForm, send_email: !bcForm.send_email })} style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s',
                  background: bcForm.send_email ? '#FF6B00' : 'var(--border)',
                }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: bcForm.send_email ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={sendBroadcast} disabled={bcSending || !bcForm.title || !bcForm.message} style={{
                  flex: 1, padding: '12px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 700, cursor: bcSending ? 'wait' : 'pointer',
                  background: (!bcForm.title || !bcForm.message) ? '#D1D5DB' : '#FF6B00', color: '#fff', transition: 'all .15s',
                }}>
                  {bcSending ? 'Илгээж байна...' : 'Илгээх'}
                </button>
                <button onClick={() => setBroadcastModal(false)} style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)', cursor: 'pointer', fontSize: 14 }}>Болих</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }
const lbl: React.CSSProperties = { fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block', fontWeight: 600 }
function actionBtn(color: string): React.CSSProperties {
  return { padding: '4px 10px', background: color + '12', color, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500 }
}
