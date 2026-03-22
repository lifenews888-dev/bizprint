'use client'

import { apiFetch } from '@/lib/api'
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
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    apiFetch(`//auth/me`, { headers }).catch(() => null).then(u => { if (u) setUser(u) })
  }, [])

  const loadDesigns = async (userId?: string) => {
    const uid = userId || user?.id
    if (!uid) return
    try {
      const res = await apiFetch(`//design-requests/customer/${uid}`, { headers })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setDesigns(data)
      }
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

  return (
    <div style={{ minHeight: '100vh', background: '#0F0F0F', color: '#fff', fontFamily: 'DM Sans, system-ui', padding: '24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <button onClick={() => router.back()} style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8, padding: 0 }}>← Буцах</button>
            <div style={{ fontSize: 24, fontWeight: 700 }}>🎨 Дизайн захиалгууд</div>
          </div>
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
            <div style={{ fontSize: 16 }}>Дизайн захиалга байхгүй байна</div>
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
    </div>
  )
}
