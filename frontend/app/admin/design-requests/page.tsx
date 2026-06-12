'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { CSSProperties } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { useRealtime } from '@/contexts/RealtimeContext'

/* ═══════════════════════════════════════
 *  CREATIVE PRODUCTION PIPELINE
 *  KPI → Pipeline → Table → Detail Panel (versions, comments, actions)
 * ═══════════════════════════════════════ */

const STATUS_CFG: Record<string, { label: string; color: string; icon: string }> = {
  pending:              { label: 'Хүлээгдэж буй',   color: '#F59E0B', icon: '📋' },
  assigned:             { label: 'Оноогдсон',        color: '#8B5CF6', icon: '👩‍🎨' },
  in_progress:          { label: 'Хийгдэж байна',    color: '#3B82F6', icon: '✏️' },
  under_review:         { label: 'Шалгалтад',        color: '#06B6D4', icon: '🔍' },
  revision_requested:   { label: 'Засвар хүссэн',    color: '#F97316', icon: '🔄' },
  updated_version:      { label: 'Шинэ хувилбар',    color: '#6366F1', icon: '🆕' },
  zoom_scheduled:       { label: 'Zoom товлосон',     color: '#0EA5E9', icon: '📹' },
  approved:             { label: 'Батлагдсан',        color: '#10B981', icon: '✅' },
  in_production:        { label: 'Үйлдвэрт',         color: '#059669', icon: '🏭' },
  rejected:             { label: 'Татгалзсан',        color: '#EF4444', icon: '❌' },
}

const PIPELINE_STAGES = ['pending', 'assigned', 'in_progress', 'under_review', 'revision_requested', 'updated_version', 'zoom_scheduled', 'approved', 'in_production']

type DesignStatus = keyof typeof STATUS_CFG | string

type DesignerUser = {
  id: string
  role?: string
  full_name?: string
  email?: string
}

type DesignerLoad = {
  name: string
  active: number
}

type DesignStats = {
  total?: number
  by_status?: Record<string, number>
  avg_revisions?: number
  avg_design_hours?: number
  approval_rate?: number
  overdue?: number
  designer_load?: DesignerLoad[]
}

type DesignVersion = {
  id: string
  version_number?: number
  is_current?: boolean
  created_at?: string
  uploaded_by_name?: string
  uploaded_by_role?: string
  version_note?: string
  file_url?: string
}

type DesignComment = {
  id: string
  author_name?: string
  author_role?: string
  type?: string
  content?: string
  created_at?: string
}

type DesignRequest = {
  id: string
  status: DesignStatus
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  product_name?: string
  designer_name?: string
  current_version?: number
  zoom_join_url?: string
  zoom_password?: string
  created_at?: string
  deadline?: string
  order_id?: string
  design_fee?: number | string
  requirements?: string
  file_url?: string
  versions?: DesignVersion[]
  comments?: DesignComment[]
}

type DesignRealtimeEvent = {
  designRequestId?: string
}

export default function AdminDesignRequestsPage() {
  const [items, setItems] = useState<DesignRequest[]>([])
  const [stats, setStats] = useState<DesignStats | null>(null)
  const [users, setUsers] = useState<DesignerUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<DesignRequest | null>(null)
  const [detailTab, setDetailTab] = useState<'info' | 'versions' | 'comments'>('info')
  const [assignModal, setAssignModal] = useState<DesignRequest | null>(null)
  const [assignForm, setAssignForm] = useState({ designer_id: '', designer_name: '', designer_phone: '', designer_zoom: '' })
  const [newComment, setNewComment] = useState('')
  const [liveToast, setLiveToast] = useState<{ msg: string; color: string } | null>(null)
  const detailIdRef = useRef<string | null>(null)
  detailIdRef.current = detail?.id || null
  const { subscribe, joinRoom, leaveRoom, connected } = useRealtime()

  const load = useCallback(async () => {
    try {
      const [dr, st, u] = await Promise.all([
        apiFetch<DesignRequest[]>('/design-requests'),
        apiFetch<DesignStats>('/design-requests/stats').catch(() => null),
        apiFetch<DesignerUser[]>('/admin/users').catch(() => []),
      ])
      setItems(Array.isArray(dr) ? dr : [])
      setStats(st)
      setUsers(Array.isArray(u) ? u : [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Real-time: listen to all design events broadcast to the `admin` room.
  // When the open detail panel matches the event, also re-fetch its full data.
  useEffect(() => {
    joinRoom('admin')
    const refresh = (label: string, color: string) => (data: DesignRealtimeEvent) => {
      setLiveToast({ msg: label, color })
      setTimeout(() => setLiveToast(null), 3000)
      load()
      if (detailIdRef.current && data?.designRequestId === detailIdRef.current) {
        apiFetch<DesignRequest>(`/design-requests/${detailIdRef.current}`).then(full => setDetail(full)).catch(() => {})
      }
    }
    const unsubs = [
      subscribe('DESIGN_FILE_UPLOADED',      refresh('🆕 Шинэ файл',         '#6366F1')),
      subscribe('DESIGN_VERSION_UPDATED',    refresh('🆕 Шинэ хувилбар',     '#6366F1')),
      subscribe('DESIGN_REVISION_REQUESTED', refresh('🔄 Засвар хүссэн',     '#F97316')),
      subscribe('DESIGN_ZOOM_CREATED',       refresh('📹 Zoom үүссэн',        '#0EA5E9')),
      subscribe('DESIGN_APPROVED',           refresh('✅ Дизайн батлагдлаа', '#10B981')),
      subscribe('DESIGN_REJECTED',           refresh('❌ Татгалзлаа',         '#EF4444')),
      subscribe('DESIGN_IN_PRODUCTION',      refresh('🏭 Үйлдвэрт орлоо',    '#059669')),
      subscribe('DESIGN_COMMENT_ADDED',      refresh('💬 Шинэ сэтгэгдэл',    '#FF6B00')),
    ]
    return () => { unsubs.forEach(fn => fn()); leaveRoom('admin') }
  }, [subscribe, joinRoom, leaveRoom, load])

  const designers = users.filter(u => u.role === 'designer')

  const openDetail = async (dr: DesignRequest) => {
    try {
      const full = await apiFetch<DesignRequest>(`/design-requests/${dr.id}`)
      setDetail(full)
      setDetailTab('info')
    } catch { setDetail(dr) }
  }

  const assign = async () => {
    if (!assignModal || !assignForm.designer_id) return
    await apiFetch(`/design-requests/${assignModal.id}/assign`, { method: 'PATCH', body: JSON.stringify(assignForm) })
    setAssignModal(null)
    setAssignForm({ designer_id: '', designer_name: '', designer_phone: '', designer_zoom: '' })
    load()
  }

  const approve = async (id: string) => {
    if (!confirm('Батлах уу? Үйлдвэрт автоматаар илгээгдэнэ.')) return
    await apiFetch(`/design-requests/${id}/approve`, { method: 'PATCH' })
    setDetail(null)
    load()
  }

  const reject = async (id: string) => {
    const reason = prompt('Татгалзах шалтгаан:')
    if (!reason) return
    await apiFetch(`/design-requests/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) })
    setDetail(null)
    load()
  }

  const addComment = async (id: string) => {
    if (!newComment.trim()) return
    await apiFetch(`/design-requests/${id}/comments`, { method: 'POST', body: JSON.stringify({ content: newComment, author_name: 'Админ', author_role: 'admin', type: 'comment' }) })
    setNewComment('')
    const full = await apiFetch<DesignRequest>(`/design-requests/${id}`)
    setDetail(full)
  }

  // Filter + Search
  const filtered = items.filter(o => {
    if (filter && o.status !== filter) return false
    if (search) {
      const s = search.toLowerCase()
      return (o.customer_name || '').toLowerCase().includes(s) || (o.product_name || '').toLowerCase().includes(s) || (o.designer_name || '').toLowerCase().includes(s)
    }
    return true
  })

  const st = (status: string) => STATUS_CFG[status] || { label: status, color: '#888', icon: '•' }
  const fmt = (n: number) => n?.toLocaleString?.() ?? '0'

  // Pipeline counts
  const pipelineCounts: Record<string, number> = {}
  items.forEach(d => { pipelineCounts[d.status] = (pipelineCounts[d.status] || 0) + 1 })

  return (
    <div className="p-4 md:p-6">
      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .dr-row{transition:background .15s}.dr-row:hover{background:var(--surface2)!important}
      `}</style>

      {liveToast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: liveToast.color, color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', animation: 'fadeIn .2s ease' }}>{liveToast.msg}</div>
      )}

      <AdminPageHeader title="Дизайн хүсэлтүүд" description={`Creative Production Pipeline · ${items.length} хүсэлт`}>
        <span title={connected ? 'Шууд холболт' : 'Холбогдоогүй'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 99, background: connected ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: connected ? '#10B981' : '#EF4444', fontSize: 11, fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#10B981' : '#EF4444' }} />
          {connected ? 'Live' : 'Offline'}
        </span>
        <button onClick={load} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13 }}>🔄 Шинэчлэх</button>
      </AdminPageHeader>

      {/* KPI CARDS */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Нийт', value: stats.total, color: '#64748B', icon: '📋' },
            { label: 'Хүлээгдэж буй', value: stats.by_status?.pending || 0, color: '#F59E0B', icon: '⏳' },
            { label: 'Хийгдэж буй', value: (stats.by_status?.in_progress || 0) + (stats.by_status?.assigned || 0), color: '#3B82F6', icon: '✏️' },
            { label: 'Батлагдсан', value: (stats.by_status?.approved || 0) + (stats.by_status?.in_production || 0), color: '#10B981', icon: '✅' },
            { label: 'Дундаж засвар', value: stats.avg_revisions, color: '#F97316', icon: '🔄' },
            { label: 'Дундаж цаг', value: `${stats.avg_design_hours}ц`, color: '#8B5CF6', icon: '⏱️' },
            { label: 'Батлалт %', value: `${stats.approval_rate}%`, color: '#059669', icon: '📊' },
            { label: 'Хоцорсон', value: stats.overdue || 0, color: '#EF4444', icon: '🔴' },
          ].map(k => (
            <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', borderLeft: `4px solid ${k.color}` }}>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{k.icon} {k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color, marginTop: 2 }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* PIPELINE VIEW */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {PIPELINE_STAGES.map((stage, i) => {
          const cfg = st(stage)
          const count = pipelineCounts[stage] || 0
          return (
            <div key={stage} onClick={() => setFilter(filter === stage ? '' : stage)} style={{
              flex: 1, minWidth: 120, padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
              background: filter === stage ? cfg.color + '18' : 'var(--surface)',
              border: `1px solid ${filter === stage ? cfg.color + '50' : 'var(--border)'}`,
              borderTop: `3px solid ${cfg.color}`, textAlign: 'center', transition: 'all .15s',
            }}>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>{cfg.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: cfg.color }}>{count}</div>
              <div style={{ fontSize: 10, color: 'var(--text2)' }}>{cfg.label}</div>
            </div>
          )
        })}
      </div>

      {/* SEARCH + FILTER */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Хайх..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, width: 240 }} />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button onClick={() => setFilter('')} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', fontSize: 11, cursor: 'pointer', background: !filter ? '#FF6B00' : 'var(--surface2)', color: !filter ? '#fff' : 'var(--text2)' }}>Бүгд</button>
          {Object.entries(STATUS_CFG).map(([k, v]) => (
            <button key={k} onClick={() => setFilter(filter === k ? '' : k)} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', fontSize: 11, cursor: 'pointer', background: filter === k ? v.color : 'var(--surface2)', color: filter === k ? '#fff' : 'var(--text2)' }}>{v.icon} {v.label}</button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--surface2)' }}>
            {['Хэрэглэгч', 'Бүтээгдэхүүн', 'Дизайнер', 'Версия', 'Төлөв', 'Огноо', 'Үйлдэл'].map(h =>
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
            )}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</td></tr>
            : filtered.length === 0 ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Хүсэлт байхгүй</td></tr>
            : filtered.map(dr => {
              const cfg = st(dr.status)
              const hasZoom = !!dr.zoom_join_url
              return (
                <tr key={dr.id} className="dr-row" style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => openDetail(dr)}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 500 }}>{dr.customer_name || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{dr.customer_email || ''}</div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{dr.product_name || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    {dr.designer_name ? (
                      <span style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 500 }}>{dr.designer_name}</span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 500 }}>Оноогдоогүй</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>v{dr.current_version || 1}</span>
                    {hasZoom && <span style={{ marginLeft: 6 }} title="Zoom">📹</span>}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: cfg.color + '18', color: cfg.color, fontWeight: 600 }}>{cfg.icon} {cfg.label}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text3)', fontSize: 12 }}>{dr.created_at ? new Date(dr.created_at).toLocaleDateString('mn-MN') : '—'}</td>
                  <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {dr.status === 'pending' && <button onClick={() => setAssignModal(dr)} style={btnStyle('#8B5CF6')}>Оноох</button>}
                      {['under_review', 'updated_version', 'zoom_scheduled'].includes(dr.status) && <button onClick={() => approve(dr.id)} style={btnStyle('#10B981')}>Батлах</button>}
                      {!['approved', 'in_production', 'rejected'].includes(dr.status) && <button onClick={() => reject(dr.id)} style={btnStyle('#EF4444')}>Татгалзах</button>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ASSIGN MODAL */}
      {assignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setAssignModal(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440, border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px' }}>Дизайнер оноох</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', margin: '0 0 16px' }}>{assignModal.product_name || '—'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block' }}>Дизайнер</label>
                <select value={assignForm.designer_id} onChange={e => {
                  const d = designers.find(d => d.id === e.target.value)
                  setAssignForm({ ...assignForm, designer_id: e.target.value, designer_name: d?.full_name || d?.email || '' })
                }} style={inputStyle}>
                  <option value="">-- Сонгох --</option>
                  {designers.map(d => <option key={d.id} value={d.id}>{d.full_name || d.email}</option>)}
                </select>
              </div>
              {(stats?.designer_load?.length || 0) > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(stats?.designer_load || []).map((d, i) => (
                    <span key={i} style={{ padding: '2px 8px', background: 'var(--surface2)', borderRadius: 6 }}>{d.name}: {d.active} идэвхтэй</span>
                  ))}
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block' }}>Zoom link</label>
                <input value={assignForm.designer_zoom} onChange={e => setAssignForm({ ...assignForm, designer_zoom: e.target.value })} placeholder="https://zoom.us/j/..." style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={assign} disabled={!assignForm.designer_id} style={{ flex: 1, padding: 10, background: assignForm.designer_id ? '#8B5CF6' : '#94A3B8', color: '#fff', border: 'none', borderRadius: 8, cursor: assignForm.designer_id ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 600 }}>Оноох</button>
              <button onClick={() => setAssignModal(null)} style={{ padding: '10px 20px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Болих</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL PANEL (slide-in) */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setDetail(null)}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: 560, height: '100%', overflow: 'auto', borderLeft: '1px solid var(--border)', boxShadow: '-8px 0 30px rgba(0,0,0,0.15)', animation: 'slideIn .2s ease', padding: 24 }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: st(detail.status).color + '18', color: st(detail.status).color, fontWeight: 600 }}>
                    {st(detail.status).icon} {st(detail.status).label}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>v{detail.current_version || 1}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{detail.product_name || 'Дизайн хүсэлт'}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{detail.customer_name} · {detail.designer_name || 'Оноогдоогүй'}</div>
              </div>
              <button onClick={() => setDetail(null)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              {(['info', 'versions', 'comments'] as const).map(t => (
                <button key={t} onClick={() => setDetailTab(t)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, cursor: 'pointer', background: detailTab === t ? '#FF6B00' : 'transparent', color: detailTab === t ? '#fff' : 'var(--text2)', fontWeight: detailTab === t ? 600 : 400 }}>
                  {t === 'info' ? 'Мэдээлэл' : t === 'versions' ? `Хувилбар (${detail.versions?.length || 0})` : `Сэтгэгдэл (${detail.comments?.length || 0})`}
                </button>
              ))}
            </div>

            {/* INFO TAB */}
            {detailTab === 'info' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 20 }}>
                  {[
                    ['Хэрэглэгч', detail.customer_name],
                    ['И-мэйл', detail.customer_email],
                    ['Утас', detail.customer_phone],
                    ['Дизайнер', detail.designer_name || '—'],
                    ['Дуусах хугацаа', detail.deadline ? new Date(detail.deadline).toLocaleDateString('mn-MN') : '—'],
                    ['Огноо', detail.created_at ? new Date(detail.created_at).toLocaleString('mn-MN') : '—'],
                    ['Захиалга', detail.order_id?.slice(0, 8) || '—'],
                    ['Төлбөр', detail.design_fee ? `₮${fmt(Number(detail.design_fee))}` : '—'],
                  ].map(([k, v]) => (
                    <div key={k as string} style={{ fontSize: 12 }}>
                      <span style={{ color: 'var(--text3)' }}>{k}: </span>
                      <span style={{ fontWeight: 500 }}>{v as string}</span>
                    </div>
                  ))}
                </div>

                {detail.requirements && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>Шаардлага</div>
                    <div style={{ fontSize: 12, background: 'var(--surface2)', padding: 12, borderRadius: 8, lineHeight: 1.5 }}>{detail.requirements}</div>
                  </div>
                )}

                {/* Zoom */}
                {detail.zoom_join_url && (
                  <div style={{ marginBottom: 16, padding: 14, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1D4ED8', marginBottom: 6 }}>📹 Zoom уулзалт</div>
                    <a href={detail.zoom_join_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563EB', textDecoration: 'none' }}>Нэгдэх →</a>
                    {detail.zoom_password && <span style={{ fontSize: 11, marginLeft: 8, color: '#64748B' }}>Нууц: {detail.zoom_password}</span>}
                  </div>
                )}

                {/* File preview */}
                {detail.file_url && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Одоогийн файл</div>
                    <a href={detail.file_url.startsWith('http') ? detail.file_url : `/${detail.file_url}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#3B82F6' }}>📎 Файл татах (v{detail.current_version})</a>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 16 }}>
                  {detail.status === 'pending' && <button onClick={() => { setDetail(null); setAssignModal(detail) }} style={actionBtn('#8B5CF6')}>👩‍🎨 Оноох</button>}
                  {['under_review', 'updated_version', 'zoom_scheduled'].includes(detail.status) && <button onClick={() => approve(detail.id)} style={actionBtn('#10B981')}>✅ Батлах</button>}
                  {!['approved', 'in_production', 'rejected'].includes(detail.status) && <button onClick={() => reject(detail.id)} style={actionBtn('#EF4444')}>❌ Татгалзах</button>}
                </div>
              </div>
            )}

            {/* VERSIONS TAB */}
            {detailTab === 'versions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(detail.versions || []).length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Хувилбар байхгүй</div>
                ) : (detail.versions || []).map(v => (
                  <div key={v.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, background: v.is_current ? '#F0FDF4' : 'var(--surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 14, color: v.is_current ? '#16A34A' : 'var(--text)' }}>v{v.version_number}</span>
                        {v.is_current && <span style={{ fontSize: 10, marginLeft: 8, padding: '2px 6px', borderRadius: 4, background: '#DCFCE7', color: '#16A34A', fontWeight: 600 }}>CURRENT</span>}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{v.created_at ? new Date(v.created_at).toLocaleString('mn-MN') : '—'}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
                      {v.uploaded_by_name || v.uploaded_by_role} оруулсан
                    </div>
                    {v.version_note && <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text)' }}>{v.version_note}</div>}
                    {v.file_url && (
                      <a href={v.file_url.startsWith('http') ? v.file_url : `/${v.file_url}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#3B82F6', marginTop: 6, display: 'inline-block' }}>📎 Файл татах</a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* COMMENTS TAB */}
            {detailTab === 'comments' && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, maxHeight: 400, overflow: 'auto' }}>
                  {(detail.comments || []).length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Сэтгэгдэл байхгүй</div>
                  ) : (detail.comments || []).map(c => {
                    const roleColor = c.author_role === 'customer' ? '#3B82F6' : c.author_role === 'designer' ? '#8B5CF6' : c.type === 'system' ? '#94A3B8' : '#FF6B00'
                    return (
                      <div key={c.id} style={{ padding: 10, borderRadius: 8, background: c.type === 'system' ? 'var(--surface2)' : 'var(--surface)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: roleColor }}>{c.author_name || c.author_role}</span>
                          <span style={{ fontSize: 10, color: 'var(--text3)' }}>{c.created_at ? new Date(c.created_at).toLocaleString('mn-MN') : '—'}</span>
                        </div>
                        <div style={{ fontSize: 12, lineHeight: 1.5 }}>{c.content}</div>
                      </div>
                    )
                  })}
                </div>
                {/* Add comment */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Сэтгэгдэл бичих..." onKeyDown={e => e.key === 'Enter' && addComment(detail.id)} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                  <button onClick={() => addComment(detail.id)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#FF6B00', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Илгээх</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Shared styles ── */
const inputStyle: CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)' }

function btnStyle(color: string): CSSProperties {
  return { padding: '4px 10px', background: color + '12', color, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500 }
}

function actionBtn(color: string): CSSProperties {
  return { padding: '8px 16px', background: color, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }
}
