'use client'

import { apiFetch, API_URL, getToken } from '@/lib/api'
/**
 * Designer Dashboard — Print Design Approval System
 *
 * Designer can:
 * - View all assigned design requests
 * - Upload file versions
 * - Submit for customer review
 * - Add comments / flag issues
 * - Start Zoom session
 * - See real-time status changes
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRealtime } from '@/contexts/RealtimeContext'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { DESIGNER_MENU } from '@/config/sidebar-config'
import { useRoleGuard } from '@/lib/use-role-guard'

type DesignStatus =
  | 'pending' | 'assigned' | 'in_progress' | 'under_review'
  | 'revision_requested' | 'updated_version' | 'zoom_scheduled'
  | 'approved' | 'in_production' | 'rejected'

interface DesignRequest {
  id: string
  order_id: string
  customer_name: string
  customer_email: string
  product_name: string
  status: DesignStatus
  current_version: number
  file_url: string
  preview_url: string
  requirements: string
  notes: string
  designer_zoom: string
  approval_locked: boolean
  zoom_join_url: string
  zoom_start_url: string
  zoom_preferred_at?: string
  created_at: string
  versions?: DesignVersion[]
  comments?: DesignComment[]
  zoomSessions?: ZoomSession[]
}

interface AppUser {
  id: string
  full_name?: string
  email?: string
  role?: string
}

interface RealtimeDesignPayload {
  designRequestId?: string
}

interface DesignVersion {
  id: string
  version_number?: number
  is_current?: boolean
  created_at: string
  version_note?: string
  preview_url?: string
  file_url?: string
  issues?: Record<string, unknown>
}

interface DesignComment {
  id: string
  author_role?: string
  author_name?: string
  type?: string
  content?: string
  created_at: string
}

interface ZoomSession {
  id: string
  created_at: string
  scheduled_at?: string
  join_url?: string
}

interface UploadResponse {
  file_url?: string
  error?: string
}

interface ZoomPayload {
  [key: string]: unknown
  scheduled_at?: string
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:             { label: 'Хүлээж байна',    color: '#6B7280' },
  assigned:            { label: 'Хуваарилагдсан',  color: '#3B82F6' },
  in_progress:         { label: 'Ажиллаж байна',   color: '#8B5CF6' },
  under_review:        { label: 'Хянагдаж байна',  color: '#F59E0B' },
  revision_requested:  { label: '⚠ Засах хүсэлт',  color: '#EF4444' },
  updated_version:     { label: 'Шинэ хувилбар',   color: '#06B6D4' },
  zoom_scheduled:      { label: '📹 Zoom товлосон', color: '#10B981' },
  approved:            { label: '✅ Батлагдсан',    color: '#10B981' },
  in_production:       { label: '🏭 Үйлдвэрлэлд', color: '#64748B' },
  rejected:            { label: '❌ Цуцлагдсан',   color: '#DC2626' },
}

export default function DesignerDashboard() {
  const { user: guardUser, loading: guardLoading } = useRoleGuard(['designer', 'admin', 'superadmin'])
  const [user, setUser] = useState<AppUser | null>(null)
  const [requests, setRequests] = useState<DesignRequest[]>([])
  const [selected, setSelected] = useState<DesignRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [comment, setComment] = useState('')
  const [versionNote, setVersionNote] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'versions' | 'comments' | 'zoom'>('overview')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const { subscribe, joinRoom, leaveRoom } = useRealtime()
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Load user ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!getToken()) { window.location.href = '/login'; return }
    apiFetch<AppUser>(`/auth/me`)
      .then(u => { if (u) setUser(u) })
      .catch(() => {})
  }, [])

  // ── Load requests ─────────────────────────────────────────────────────────

  const loadRequests = useCallback(async () => {
    if (!user?.id) return
    try {
      const data = await apiFetch<DesignRequest[]>(`/design-requests/designer/${user.id}`)
      if (Array.isArray(data)) setRequests(data)
    } catch {}
  }, [user?.id])

  useEffect(() => { loadRequests() }, [loadRequests])
  useEffect(() => { setLoading(false) }, [requests])

  // ── Real-time: join designer room ─────────────────────────────────────────

  useEffect(() => {
    if (!user?.id) return
    const room = `designer:${user.id}`
    joinRoom(room)

    const unsubs = [
      subscribe('DESIGN_FILE_UPLOADED', () => { loadRequests(); if (selected) loadDetail(selected.id) }),
      subscribe('DESIGN_REVISION_REQUESTED', (p: RealtimeDesignPayload) => {
        showToast(`⚠ Засах хүсэлт ирлээ: ${p.designRequestId?.slice(0, 8)}`, 'error')
        loadRequests()
        if (selected && selected.id === p.designRequestId) loadDetail(selected.id)
      }),
      subscribe('DESIGN_APPROVED', () => {
        showToast('✅ Загвар батлагдлаа!')
        loadRequests()
      }),
      subscribe('DESIGN_COMMENT_ADDED', (p: RealtimeDesignPayload) => {
        if (selected && selected.id === p.designRequestId) loadDetail(selected.id)
        loadRequests()
      }),
      subscribe('DESIGN_ZOOM_CREATED', (p: RealtimeDesignPayload) => {
        showToast('📹 Zoom уулзалт үүслээ!')
        loadRequests()
        if (selected && selected.id === p.designRequestId) loadDetail(selected.id)
      }),
    ]

    return () => {
      leaveRoom(room)
      unsubs.forEach(fn => fn())
    }
  }, [user?.id, selected?.id])

  // ── Load single detail ────────────────────────────────────────────────────

  const loadDetail = useCallback(async (id: string) => {
    try {
      const data = await apiFetch<DesignRequest>(`/design-requests/${id}`)
      setSelected(data)
    } catch {}
  }, [])

  const selectRequest = (r: DesignRequest) => {
    setSelected(r)
    setActiveTab('overview')
    loadDetail(r.id)
  }

  // ── Upload actual file ─────────────────────────────────────────────────────

  const handleFileUpload = async (file: File) => {
    if (!file) return
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const data = await apiFetch<UploadResponse>(`/upload/file`, {
        method: 'POST',
        body: formData,
      })
      if (data.file_url) {
        const fullUrl = data.file_url.startsWith('http') ? data.file_url : `${API_URL}${data.file_url}`
        setFileUrl(fullUrl)
        // If it's an image, use as preview too
        const ext = file.name.split('.').pop()?.toLowerCase() || ''
        if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
          setPreviewUrl(fullUrl)
        }
        showToast(`✅ ${file.name} байршуулагдлаа`)
      } else {
        showToast(data.error || 'Байршуулахад алдаа гарлаа', 'error')
      }
    } catch { showToast('Байршуулахад алдаа гарлаа', 'error') }
    finally { setUploadingFile(false) }
  }

  // ── Upload new version ────────────────────────────────────────────────────

  const handleUploadVersion = async () => {
    if (!selected || !fileUrl) { showToast('Файлын URL оруулна уу', 'error'); return }
    setUploading(true)
    try {
      await apiFetch<DesignVersion>(`/design-requests/${selected.id}/versions`, {
        method: 'POST',
        body: { file_url: fileUrl, preview_url: previewUrl, version_note: versionNote },
      })
      showToast(`v${(selected.current_version || 0) + 1} байршуулагдлаа ✓`)
      setFileUrl(''); setPreviewUrl(''); setVersionNote('')
      loadDetail(selected.id); loadRequests()
    } catch { showToast('Алдаа гарлаа', 'error') }
    finally { setUploading(false) }
  }

  // ── Submit for review ─────────────────────────────────────────────────────

  const handleSubmitForReview = async () => {
    if (!selected) return
    try {
      await apiFetch<DesignRequest>(`/design-requests/${selected.id}/submit-for-review`, {
        method: 'PATCH',
      })
      showToast('Хянуулахаар илгээлээ ✓'); loadDetail(selected.id); loadRequests()
    } catch { showToast('Алдаа', 'error') }
  }

  // ── Add comment ───────────────────────────────────────────────────────────

  const handleAddComment = async () => {
    if (!selected || !comment.trim()) return
    try {
      await apiFetch<DesignComment>(`/design-requests/${selected.id}/comments`, {
        method: 'POST',
        body: { content: comment, author_role: 'designer', type: 'comment' },
      })
      setComment(''); loadDetail(selected.id)
    } catch {}
  }

  // ── Create Zoom session ───────────────────────────────────────────────────

  const handleCreateZoom = async () => {
    if (!selected) return
    try {
      const body: ZoomPayload = {}
      if (scheduledAt) body.scheduled_at = scheduledAt
      const data = await apiFetch<ZoomSession>(`/design-requests/${selected.id}/zoom`, {
        method: 'POST',
        body: body,
      })
      if (data) {
        showToast('Zoom уулзалт товлогдлоо ✓')
        setScheduledAt('')
        loadDetail(selected.id)
      }
    } catch { showToast('Zoom алдаа', 'error') }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const st = selected ? STATUS_LABEL[selected.status] : null

  if (guardLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ color: 'var(--text3)', fontSize: 13 }}>Уншиж байна...</div>
    </div>
  )

  return (
    <DashboardLayout navGroups={DESIGNER_MENU} user={user ?? undefined}>
    <div style={{ display: 'flex', height: 'calc(100vh - 54px)', fontFamily: 'DM Sans, system-ui', background: '#0F0F0F', color: '#fff', overflow: 'hidden' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'success' ? '#10B981' : '#EF4444',
          color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Left sidebar: request list ─────────────────────────────────────── */}
      <div style={{ width: 320, background: '#1A1A1A', borderRight: '1px solid #2A2A2A', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #2A2A2A' }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Дизайнер дашборд</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>🎨 Design Approval</div>
          <div style={{ fontSize: 12, color: '#FF6B00', marginTop: 4 }}>{user?.full_name || user?.email}</div>
        </div>

        <div style={{ padding: '12px 8px', borderBottom: '1px solid #2A2A2A', display: 'flex', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>Нийт: </span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{requests.length}</span>
          <span style={{ fontSize: 12, color: '#EF4444', marginLeft: 8 }}>
            ⚠ {requests.filter(r => r.status === 'revision_requested').length} засалт
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && <div style={{ padding: 16, color: '#6B7280', fontSize: 13 }}>Ачаалж байна...</div>}
          {requests.map(r => {
            const s = STATUS_LABEL[r.status] || { label: r.status, color: '#6B7280' }
            const isSelected = selected?.id === r.id
            return (
              <div
                key={r.id}
                onClick={() => selectRequest(r)}
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  background: isSelected ? '#252525' : 'transparent',
                  borderLeft: isSelected ? '3px solid #FF6B00' : '3px solid transparent',
                  borderBottom: '1px solid #1E1E1E',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, flex: 1, marginRight: 8 }}>{r.product_name || 'Бүтээгдэхүүн'}</div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                    background: s.color + '22', color: s.color, whiteSpace: 'nowrap',
                  }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>{r.customer_name}</div>
                <div style={{ fontSize: 11, color: '#4B5563', marginTop: 2 }}>v{r.current_version || 0} · {new Date(r.created_at).toLocaleDateString('mn-MN')}</div>
              </div>
            )
          })}
          {!loading && requests.length === 0 && (
            <div style={{ padding: 24, color: '#4B5563', fontSize: 13, textAlign: 'center' }}>
              Одоогоор даалгавар байхгүй
            </div>
          )}
        </div>
      </div>

      {/* ── Main panel ────────────────────────────────────────────────────── */}
      {!selected ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
            <div style={{ fontSize: 16 }}>Зүүн талаас захиалга сонгоно уу</div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #2A2A2A', background: '#1A1A1A', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{selected.product_name || 'Бүтээгдэхүүн'}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                Захиалга: {selected.order_id?.slice(0, 8)} · Хэрэглэгч: {selected.customer_name}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 8,
                background: (st?.color || '#6B7280') + '22', color: st?.color || '#6B7280',
              }}>{st?.label || selected.status}</span>
              <span style={{ fontSize: 12, color: '#6B7280' }}>v{selected.current_version}</span>
              {selected.approval_locked && (
                <span style={{ fontSize: 11, padding: '4px 8px', background: '#10B98122', color: '#10B981', borderRadius: 6 }}>🔒 LOCKED</span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #2A2A2A', background: '#161616' }}>
            {(['overview', 'versions', 'comments', 'zoom'] as const).map(tab => {
              // Badge: show red dot on zoom tab if customer requested zoom but no link yet
              const hasZoomRequest = tab === 'zoom' && !selected.zoom_join_url &&
                selected.comments?.some((c) => c.type === 'system' && c.author_role === 'customer' && c.content?.includes('Zoom'))
              // Badge: show count on comments tab for unread customer comments
              const commentCount = tab === 'comments'
                ? (selected.comments?.filter((c) => c.author_role === 'customer' && c.type !== 'system').length || 0)
                : 0
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '12px 20px', fontSize: 13, fontWeight: 500, border: 'none',
                    background: 'transparent', cursor: 'pointer', position: 'relative',
                    color: activeTab === tab ? '#FF6B00' : '#6B7280',
                    borderBottom: activeTab === tab ? '2px solid #FF6B00' : '2px solid transparent',
                  }}
                >
                  {tab === 'overview' ? '📋 Ерөнхий'
                    : tab === 'versions' ? '📁 Хувилбарууд'
                    : tab === 'comments'
                      ? <>💬 Тайлбар {commentCount > 0 && <span style={{ marginLeft: 4, background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 99 }}>{commentCount}</span>}</>
                      : <>📹 Zoom {hasZoomRequest && <span style={{ marginLeft: 4, background: '#3B82F6', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 99 }}>!</span>}</>
                  }
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

            {/* ── Overview tab ─────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                {/* Requirements */}
                <div style={{ background: '#1A1A1A', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, fontWeight: 600 }}>ШААРДЛАГА</div>
                  <div style={{ fontSize: 13, color: '#D1D5DB', lineHeight: 1.6 }}>
                    {selected.requirements || 'Шаардлага оруулаагүй'}
                  </div>
                </div>

                {/* Preview */}
                <div style={{ background: '#1A1A1A', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, fontWeight: 600 }}>ОДООГИЙН ЗАГВАР (v{selected.current_version})</div>
                  {selected.preview_url ? (
                    <img src={selected.preview_url} alt="preview" style={{ width: '100%', borderRadius: 8, objectFit: 'contain', maxHeight: 200 }} />
                  ) : selected.file_url ? (
                    <a href={selected.file_url} target="_blank" rel="noreferrer" style={{ color: '#FF6B00', fontSize: 13 }}>
                      📎 Файл татах
                    </a>
                  ) : (
                    <div style={{ color: '#4B5563', fontSize: 13 }}>Файл байхгүй</div>
                  )}
                </div>

                {/* Upload new version */}
                {!selected.approval_locked && (
                  <div style={{ background: '#1A1A1A', borderRadius: 12, padding: 16, gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 12, color: '#FF6B00', marginBottom: 12, fontWeight: 700 }}>
                      📤 ШИНЭ ХУВИЛБАР БАЙРШУУЛАХ (v{(selected.current_version || 0) + 1})
                    </div>
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.ai,.eps"
                      style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
                    />

                    {/* Drag & drop upload area */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#FF6B00' }}
                      onDragLeave={e => { e.currentTarget.style.borderColor = '#333' }}
                      onDrop={e => {
                        e.preventDefault()
                        e.currentTarget.style.borderColor = '#333'
                        const f = e.dataTransfer.files?.[0]
                        if (f) handleFileUpload(f)
                      }}
                      style={{
                        border: '2px dashed #333', borderRadius: 10, padding: '20px',
                        textAlign: 'center', cursor: 'pointer', marginBottom: 12,
                        background: '#1A1A1A', transition: 'border-color 0.2s',
                      }}
                    >
                      {uploadingFile ? (
                        <div style={{ color: '#FF6B00', fontSize: 13 }}>⏳ Байршуулж байна...</div>
                      ) : fileUrl ? (
                        <div>
                          <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600, marginBottom: 4 }}>✅ Файл бэлэн</div>
                          <div style={{ fontSize: 11, color: '#6B7280', wordBreak: 'break-all' }}>{fileUrl.split('/').pop()}</div>
                          <div style={{ fontSize: 11, color: '#4B5563', marginTop: 4 }}>Өөр файл дарж солих</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 24, marginBottom: 8 }}>📤</div>
                          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Файл чирч тавих эсвэл <span style={{ color: '#FF6B00', fontWeight: 600 }}>энд дарна уу</span></div>
                          <div style={{ fontSize: 11, color: '#4B5563' }}>PDF, PNG, JPG, AI, EPS — max 50MB</div>
                        </div>
                      )}
                    </div>

                    {/* OR: manual URL input */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Эсвэл файлын URL</label>
                        <input
                          value={fileUrl}
                          onChange={e => setFileUrl(e.target.value)}
                          placeholder="https://drive.google.com/..."
                          style={{ width: '100%', padding: '10px 12px', background: '#252525', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 13, boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Preview зургийн URL</label>
                        <input
                          value={previewUrl}
                          onChange={e => setPreviewUrl(e.target.value)}
                          placeholder="https://..."
                          style={{ width: '100%', padding: '10px 12px', background: '#252525', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 13, boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                    <textarea
                      value={versionNote}
                      onChange={e => setVersionNote(e.target.value)}
                      placeholder="Энэ хувилбарт юу өөрчлөгдсөнийг тайлбарлана уу..."
                      rows={2}
                      style={{ width: '100%', padding: '10px 12px', background: '#252525', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 13, resize: 'none', marginBottom: 12, boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        onClick={handleUploadVersion}
                        disabled={uploading || !fileUrl}
                        style={{
                          padding: '10px 20px', background: uploading || !fileUrl ? '#333' : '#FF6B00',
                          color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                        }}
                      >
                        {uploading ? 'Байршуулж байна...' : '⬆ Байршуулах'}
                      </button>
                      {selected.current_version > 0 && selected.status !== 'under_review' && (
                        <button
                          onClick={handleSubmitForReview}
                          style={{ padding: '10px 20px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                        >
                          📤 Хянуулахаар илгээх
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {selected.approval_locked && (
                  <div style={{ background: '#10B98118', border: '1px solid #10B981', borderRadius: 12, padding: 16, gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>✅</span>
                    <div>
                      <div style={{ color: '#10B981', fontWeight: 700, fontSize: 14 }}>Загвар батлагдсан — Locked</div>
                      <div style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>Хэрэглэгч v{selected.current_version} загварыг батласан. Үйлдвэрлэлд шилжлээ.</div>
                    </div>
                  </div>
                )}

                {/* Revision warning */}
                {selected.status === 'revision_requested' && (
                  <div style={{ background: '#EF444418', border: '1px solid #EF4444', borderRadius: 12, padding: 16, gridColumn: '1 / -1' }}>
                    <div style={{ color: '#EF4444', fontWeight: 700, fontSize: 14 }}>⚠ Засах хүсэлт ирсэн байна</div>
                    <div style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>Хэрэглэгчийн тайлбарыг &quot;Тайлбар&quot; таб дээр харна уу. Засаад шинэ хувилбар байршуулна уу.</div>
                  </div>
                )}

                {/* Customer Zoom request notification */}
                {!selected.zoom_join_url && !selected.approval_locked &&
                  selected.comments?.some((c) => c.type === 'system' && c.author_role === 'customer' && c.content?.includes('Zoom')) && (
                  <div style={{ background: '#0F1F2E', border: '2px solid #3B82F6', borderRadius: 12, padding: 16, gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ color: '#3B82F6', fontWeight: 700, fontSize: 14 }}>📹 Хэрэглэгч Zoom уулзалт хүсэж байна</div>
                      {selected.zoom_preferred_at && (
                        <div style={{ color: '#60A5FA', fontSize: 13, marginTop: 6, fontWeight: 600 }}>
                          🕐 Хүссэн цаг: {new Date(selected.zoom_preferred_at).toLocaleString('mn-MN')}
                        </div>
                      )}
                      <div style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>
                        Та Zoom уулзалт үүсгэж хэрэглэгчтэй дэлгэц share хийн ажиллана уу.
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('zoom')}
                      style={{ padding: '10px 18px', background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                    >
                      📹 Zoom товлох →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Versions tab ─────────────────────────────────────────── */}
            {activeTab === 'versions' && (
              <div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                  Нийт {selected.versions?.length || 0} хувилбар
                </div>
                {(selected.versions || []).slice().reverse().map((v) => (
                  <div key={v.id} style={{ background: '#1A1A1A', borderRadius: 12, padding: 16, marginBottom: 12, border: v.is_current ? '1px solid #FF6B00' : '1px solid #2A2A2A' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ background: '#FF6B00', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>v{v.version_number}</span>
                        {v.is_current && <span style={{ fontSize: 11, color: '#10B981' }}>● Одоогийн</span>}
                      </div>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{new Date(v.created_at).toLocaleString('mn-MN')}</span>
                    </div>
                    {v.version_note && <div style={{ fontSize: 13, color: '#D1D5DB', marginBottom: 10 }}>{v.version_note}</div>}
                    <div style={{ display: 'flex', gap: 12 }}>
                      {v.preview_url && <img src={v.preview_url} alt={`v${v.version_number}`} style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 6 }} />}
                      <div>
                        {v.file_url && <a href={v.file_url} target="_blank" rel="noreferrer" style={{ color: '#FF6B00', fontSize: 12, display: 'block', marginBottom: 4 }}>📎 Файл татах</a>}
                        {v.issues && Object.entries(v.issues).some(([, val]) => val) && (
                          <div style={{ fontSize: 11, color: '#EF4444' }}>
                            ⚠ {Object.entries(v.issues).filter(([, val]) => val).map(([key]) => key).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(!selected.versions || selected.versions.length === 0) && (
                  <div style={{ color: '#4B5563', fontSize: 13 }}>Хувилбар байхгүй</div>
                )}
              </div>
            )}

            {/* ── Comments tab ─────────────────────────────────────────── */}
            {activeTab === 'comments' && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  {(selected.comments || []).map((c) => (
                    <div key={c.id} style={{
                      display: 'flex', gap: 10, marginBottom: 12,
                      flexDirection: c.author_role === 'designer' ? 'row-reverse' : 'row',
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: c.author_role === 'designer' ? '#FF6B00' : c.author_role === 'customer' ? '#3B82F6' : '#6B7280',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: '#fff',
                      }}>
                        {c.author_name?.[0] || '?'}
                      </div>
                      <div style={{ maxWidth: '75%' }}>
                        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, textAlign: c.author_role === 'designer' ? 'right' : 'left' }}>
                          {c.author_name} · {c.author_role === 'designer' ? 'Дизайнер' : c.author_role === 'customer' ? 'Хэрэглэгч' : 'Admin'}
                        </div>
                        <div style={{
                          padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                          background: c.type === 'system' ? '#252525' : c.author_role === 'designer' ? '#FF6B0018' : '#1E3A5F',
                          border: c.type === 'system' ? '1px solid #2A2A2A' : 'none',
                          color: c.type === 'system' ? '#6B7280' : '#E5E7EB',
                          fontStyle: c.type === 'system' ? 'italic' : 'normal',
                        }}>
                          {c.content}
                        </div>
                        <div style={{ fontSize: 10, color: '#4B5563', marginTop: 3, textAlign: c.author_role === 'designer' ? 'right' : 'left' }}>
                          {new Date(c.created_at).toLocaleTimeString('mn-MN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {!selected.approval_locked && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Тайлбар бичих..."
                      rows={2}
                      style={{ flex: 1, padding: '10px 12px', background: '#1A1A1A', border: '1px solid #333', borderRadius: 10, color: '#fff', fontSize: 13, resize: 'none' }}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!comment.trim()}
                      style={{ padding: '10px 16px', background: comment.trim() ? '#FF6B00' : '#333', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}
                    >
                      Илгээх
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Zoom tab ─────────────────────────────────────────────── */}
            {activeTab === 'zoom' && (
              <div>
                {/* Active Zoom link */}
                {selected.zoom_join_url && (
                  <div style={{ background: '#1E3A2F', border: '1px solid #10B981', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                    <div style={{ color: '#10B981', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>📹 Zoom уулзалт товлосон</div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {selected.zoom_start_url && (
                        <a href={selected.zoom_start_url} target="_blank" rel="noreferrer" style={{ background: '#10B981', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                          🎙 Уулзалт эхлүүлэх (Host)
                        </a>
                      )}
                      <a href={selected.zoom_join_url} target="_blank" rel="noreferrer" style={{ background: '#3B82F6', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                        🔗 Нэгдэх (Join)
                      </a>
                    </div>
                  </div>
                )}

                {/* Customer zoom request notice */}
                {!selected.zoom_join_url && !selected.approval_locked &&
                  selected.comments?.some((c) => c.type === 'system' && c.author_role === 'customer' && c.content?.includes('Zoom')) && (
                  <div style={{ background: '#0F1F2E', border: '2px solid #3B82F6', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24 }}>📹</span>
                      <div>
                        <div style={{ color: '#60A5FA', fontWeight: 700, fontSize: 13 }}>Хэрэглэгч уулзалт хүсэж байна</div>
                        <div style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>Доор Zoom товлоод хэрэглэгч шуурхай link авна</div>
                      </div>
                    </div>
                    {selected.zoom_preferred_at && (
                      <div style={{ marginTop: 10, background: '#162030', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>🕐</span>
                        <div>
                          <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>ХЭРЭГЛЭГЧИЙН ХҮССЭН ЦАГ</div>
                          <div style={{ fontSize: 13, color: '#93C5FD', fontWeight: 700 }}>
                            {new Date(selected.zoom_preferred_at).toLocaleString('mn-MN')}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const dt = new Date(selected.zoom_preferred_at!)
                            const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                            setScheduledAt(local)
                          }}
                          style={{ marginLeft: 'auto', fontSize: 11, padding: '4px 10px', background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                        >
                          Цаг авах
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Schedule new Zoom */}
                {!selected.approval_locked && (
                  <div style={{ background: '#1A1A1A', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#D1D5DB' }}>📹 Zoom уулзалт товлох</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>Та host болж дэлгэцээ share хийж хэрэглэгчтэй хамтран ажиллана</div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Цаг (хоосон = шуурхай)</label>
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={e => setScheduledAt(e.target.value)}
                        style={{ padding: '10px 12px', background: '#252525', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 13, width: 280 }}
                      />
                    </div>
                    <button
                      onClick={handleCreateZoom}
                      style={{ padding: '10px 20px', background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                    >
                      📹 Zoom товлох
                    </button>
                  </div>
                )}

                {/* Previous sessions */}
                {(selected.zoomSessions || []).length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10, fontWeight: 600 }}>ӨМНӨХ УУЛЗАЛТУУД</div>
                    {(selected.zoomSessions || []).map((s) => (
                      <div key={s.id} style={{ background: '#1A1A1A', borderRadius: 10, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 12, color: '#D1D5DB' }}>{new Date(s.created_at).toLocaleString('mn-MN')}</div>
                          {s.scheduled_at && <div style={{ fontSize: 11, color: '#6B7280' }}>Товлосон: {new Date(s.scheduled_at).toLocaleString('mn-MN')}</div>}
                        </div>
                        <a href={s.join_url} target="_blank" rel="noreferrer" style={{ color: '#3B82F6', fontSize: 12 }}>Холбоос</a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  )
}
