'use client'

import { apiFetch, getToken } from '@/lib/api'
/**
 * Customer Design Requests List
 * Shows all design requests with status, links to approval page
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRealtime } from '@/contexts/RealtimeContext'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string; action?: string }> = {
  pending:             { label: 'Хүлээж байна',          color: '#6B7280', icon: '⏳' },
  assigned:            { label: 'Дизайнер хуваарилагдсан', color: '#3B82F6', icon: '👤' },
  in_progress:         { label: 'Ажиллаж байна',          color: '#8B5CF6', icon: '🎨' },
  under_review:        { label: '🔍 Таны хяналтад',        color: '#F59E0B', icon: '🔍', action: 'Хянах' },
  revision_requested:  { label: 'Засах хүсэлт явуулсан',  color: '#F97316', icon: '✏' },
  updated_version:     { label: 'Шинэ хувилбар бэлэн',    color: '#06B6D4', icon: '🆕', action: 'Хянах' },
  zoom_scheduled:      { label: 'Zoom товлосон',           color: '#10B981', icon: '📹', action: 'Нэгдэх' },
  approved:            { label: '✅ Батлагдсан',           color: '#10B981', icon: '✅' },
  in_production:       { label: '🏭 Үйлдвэрлэлд',         color: '#64748B', icon: '🏭' },
  rejected:            { label: 'Цуцлагдсан',             color: '#DC2626', icon: '❌' },
}

export default function CustomerDesignsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [designs, setDesigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { subscribe, joinRoom } = useRealtime()
  const token = getToken()
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState('')
  const [form, setForm] = useState({ product_name: '', requirements: '', deadline: '', notes: '' })

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    apiFetch<any>(`/auth/me`).catch(() => null).then(u => { if (u) setUser(u) })
  }, [])

  const loadDesigns = async (userId?: string) => {
    const uid = userId || user?.id
    if (!uid) return
    try {
      const data = await apiFetch<any>(`/design-requests/customer/${uid}`)
      if (Array.isArray(data)) setDesigns(data)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { if (user?.id) loadDesigns(user.id) }, [user?.id])

  // Real-time: join user room to get design updates
  useEffect(() => {
    if (!user?.id) return
    joinRoom(`user:${user.id}`)
    return subscribe('DESIGN_FILE_UPLOADED', () => loadDesigns())
  }, [user?.id])

  const actionRequired = designs.filter(d => ['under_review', 'updated_version', 'zoom_scheduled'].includes(d.status))

  const submitCreate = async () => {
    if (!form.product_name.trim()) { setCreateErr('Бүтээгдэхүүний нэр оруулна уу'); return }
    setCreating(true); setCreateErr('')
    try {
      const payload: any = {
        product_name: form.product_name.trim(),
        requirements: form.requirements.trim() || undefined,
        notes: form.notes.trim() || undefined,
        deadline: form.deadline || undefined,
        customer_name: user?.full_name || user?.email,
        customer_email: user?.email,
        customer_phone: user?.phone,
      }
      await apiFetch('/design-requests', { method: 'POST', body: JSON.stringify(payload) })
      setCreateOpen(false)
      setForm({ product_name: '', requirements: '', deadline: '', notes: '' })
      loadDesigns()
    } catch (e: any) {
      setCreateErr(e?.message || 'Алдаа гарлаа')
    } finally { setCreating(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F0F0F', color: '#fff', fontFamily: 'DM Sans, system-ui', padding: '24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <button onClick={() => router.back()} style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8, padding: 0 }}>← Буцах</button>
            <div style={{ fontSize: 24, fontWeight: 700 }}>🎨 Дизайн захиалгууд</div>
          </div>
          <button onClick={() => setCreateOpen(true)} style={{ background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Шинэ захиалга</button>
        </div>

        {/* Action required banner */}
        {actionRequired.length > 0 && (
          <div style={{ background: '#F59E0B18', border: '1px solid #F59E0B', borderRadius: 14, padding: '14px 20px', marginBottom: 20 }}>
            <div style={{ color: '#F59E0B', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
              🔔 {actionRequired.length} захиалга таны хариу хүлээж байна
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {actionRequired.map(d => (
                <button
                  key={d.id}
                  onClick={() => router.push(`/dashboard/customer/design/${d.id}`)}
                  style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: '#F59E0B', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}
                >
                  {d.product_name || 'Загвар хянах'} →
                </button>
              ))}
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#4B5563' }}>Ачаалж байна...</div>
        ) : designs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#4B5563' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
            <div style={{ fontSize: 16, marginBottom: 16 }}>Дизайн захиалга байхгүй байна</div>
            <button onClick={() => setCreateOpen(true)} style={{ background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Шинэ захиалга үүсгэх</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {designs.map(d => {
              const sc = STATUS_CONFIG[d.status] || { label: d.status, color: '#6B7280', icon: '●' }
              return (
                <div
                  key={d.id}
                  onClick={() => router.push(`/dashboard/customer/design/${d.id}`)}
                  style={{
                    background: '#1A1A1A', borderRadius: 16, padding: '20px 24px',
                    border: sc.action ? '1px solid ' + sc.color + '55' : '1px solid #2A2A2A',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20,
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Preview thumbnail */}
                  <div style={{
                    width: 64, height: 64, borderRadius: 10, background: '#252525',
                    flexShrink: 0, overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {d.preview_url
                      ? <img src={d.preview_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 24 }}>{sc.icon}</span>}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{d.product_name || 'Бүтээгдэхүүн'}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>
                      Дизайнер: {d.designer_name || 'Хуваарилагдаагүй'} · v{d.current_version} · {new Date(d.created_at).toLocaleDateString('mn-MN')}
                    </div>
                  </div>

                  {/* Status badge */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8,
                      background: sc.color + '22', color: sc.color,
                    }}>
                      {sc.label}
                    </span>
                    {sc.action && (
                      <span style={{ fontSize: 11, color: sc.color, fontWeight: 700 }}>{sc.action} →</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {createOpen && (
        <div onClick={() => !creating && setCreateOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Шинэ дизайн захиалга</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>Манай дизайнер таны хүсэлтэд нийцсэн дизайн бэлтгэнэ</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4, display: 'block' }}>Бүтээгдэхүүн / зорилго *</label>
                <input value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} placeholder="ж: Нэрийн хуудас, лого, A4 зурагт хуудас" style={{ width: '100%', padding: '10px 14px', background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 8, fontSize: 13, color: '#fff' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4, display: 'block' }}>Шаардлага / тайлбар</label>
                <textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} placeholder="Өнгө, хэв маяг, текст агуулга..." rows={4} style={{ width: '100%', padding: '10px 14px', background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 8, fontSize: 13, color: '#fff', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4, display: 'block' }}>Дуусах хугацаа</label>
                  <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 8, fontSize: 13, color: '#fff' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4, display: 'block' }}>Нэмэлт тэмдэглэл</label>
                  <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Сонголт..." style={{ width: '100%', padding: '10px 14px', background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 8, fontSize: 13, color: '#fff' }} />
                </div>
              </div>
              {createErr && <div style={{ fontSize: 12, color: '#EF4444' }}>{createErr}</div>}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={submitCreate} disabled={creating} style={{ flex: 1, padding: 12, background: creating ? '#7A3500' : '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: creating ? 'wait' : 'pointer' }}>
                {creating ? 'Илгээж байна...' : 'Захиалга үүсгэх'}
              </button>
              <button onClick={() => setCreateOpen(false)} disabled={creating} style={{ padding: '12px 20px', background: 'transparent', color: '#9CA3AF', border: '1px solid #2A2A2A', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>Болих</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
