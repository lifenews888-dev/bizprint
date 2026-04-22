'use client'

import { apiFetch } from '@/lib/api'
/**
 * Customer Design Approval Page
 *
 * Customer can:
 * - View current design version (preview)
 * - See all version history
 * - Read designer comments
 * - Add revision request with detailed reason
 * - Join Zoom session
 * - APPROVE the final design (triggers production)
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRealtime } from '@/contexts/RealtimeContext'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending:             { label: 'Хүлээж байна',    color: '#6B7280', icon: '⏳' },
  assigned:            { label: 'Дизайнер хуваарилагдсан', color: '#3B82F6', icon: '👤' },
  in_progress:         { label: 'Ажиллаж байна',   color: '#8B5CF6', icon: '🎨' },
  under_review:        { label: '🔍 Таны хяналтад', color: '#F59E0B', icon: '🔍' },
  revision_requested:  { label: 'Засах хүсэлт явуулсан', color: '#F97316', icon: '✏' },
  updated_version:     { label: 'Шинэ хувилбар бэлэн', color: '#06B6D4', icon: '🆕' },
  zoom_scheduled:      { label: 'Zoom товлосон',    color: '#10B981', icon: '📹' },
  approved:            { label: '✅ Та баталсан',   color: '#10B981', icon: '✅' },
  in_production:       { label: '🏭 Үйлдвэрлэлд явсан', color: '#64748B', icon: '🏭' },
  rejected:            { label: 'Цуцлагдсан',      color: '#DC2626', icon: '❌' },
}

export default function CustomerDesignApproval() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [design, setDesign] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'review' | 'history' | 'comments'>('review')
  const [revisionReason, setRevisionReason] = useState('')
  const [commentText, setCommentText] = useState('')
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [approving, setApproving] = useState(false)
  const [zoomRequesting, setZoomRequesting] = useState(false)
  const [zoomPreferredAt, setZoomPreferredAt] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const { subscribe, joinRoom, leaveRoom, onReconnect } = useRealtime()

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Load design detail ────────────────────────────────────────────────────

  const loadDesign = useCallback(async () => {
    if (!id) return
    try {
      const data = await apiFetch<any>(`/design-requests/${id}`)
      if (data) {
        setDesign(data)
      }
    } catch {}
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { loadDesign() }, [loadDesign])

  // ── Real-time updates ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return
    const room = `design:${id}`
    joinRoom(room)

    const unsubs = [
      subscribe('DESIGN_FILE_UPLOADED', (p: any) => {
        if (p.designRequestId === id) {
          showToast(`🆕 Дизайнер v${p.versionNumber} хувилбар байршуулсан!`)
          loadDesign()
        }
      }),
      subscribe('DESIGN_VERSION_UPDATED', (p: any) => {
        if (p.designRequestId === id) { loadDesign() }
      }),
      subscribe('DESIGN_ZOOM_CREATED', (p: any) => {
        if (p.designRequestId === id) {
          showToast('📹 Zoom уулзалт товлогдлоо!')
          loadDesign()
        }
      }),
      subscribe('DESIGN_COMMENT_ADDED', (p: any) => {
        if (p.designRequestId === id) { loadDesign() }
      }),
      onReconnect(loadDesign),
    ]

    return () => {
      leaveRoom(room)
      unsubs.forEach(fn => fn())
    }
  }, [id])

  // ── Revision request ──────────────────────────────────────────────────────

  const handleRequestRevision = async () => {
    if (!revisionReason.trim()) { showToast('Засах шалтгааныг бичнэ үү', 'error'); return }
    try {
      const res = await apiFetch<any>(`/design-requests/${id}/request-revision`, {
        method: 'PATCH',
        body: { reason: revisionReason },
      })
      showToast('Засах хүсэлт илгээгдлээ ✓')
      setRevisionReason('')
      loadDesign()
    } catch { showToast('Алдаа', 'error') }
  }

  // ── Approve design ────────────────────────────────────────────────────────

  const handleApprove = async () => {
    setApproving(true)
    try {
      const res = await apiFetch<any>(`/design-requests/${id}/approve`, {
        method: 'PATCH',
      })
      showToast('✅ Загвар амжилттай батлагдлаа! Үйлдвэрлэл эхэлж байна.')
      setShowApproveModal(false)
      loadDesign()
    } catch { showToast('Алдаа', 'error') }
    finally { setApproving(false) }
  }

  // ── Request Zoom ──────────────────────────────────────────────────────────

  const handleRequestZoom = async () => {
    setZoomRequesting(true)
    try {
      const body: any = {}
      if (zoomPreferredAt) body.preferred_at = zoomPreferredAt
      const res = await apiFetch<any>(`/design-requests/${id}/request-zoom`, {
        method: 'PATCH',
        body: body,
      })
      showToast('📹 Zoom хүсэлт дизайнерт илгээгдлээ!')
      setZoomPreferredAt('')
      loadDesign()
    } catch { showToast('Алдаа', 'error') }
    finally { setZoomRequesting(false) }
  }

  // ── Add comment ───────────────────────────────────────────────────────────

  const handleAddComment = async () => {
    if (!commentText.trim()) return
    try {
      await apiFetch<any>(`/design-requests/${id}/comments`, {
        method: 'POST',
        body: { content: commentText, author_role: 'customer', type: 'comment' },
      })
      setCommentText('')
      loadDesign()
    } catch {}
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0F0F0F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'DM Sans, system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
          <div>Ачаалж байна...</div>
        </div>
      </div>
    )
  }

  if (!design) {
    return (
      <div style={{ minHeight: '100vh', background: '#0F0F0F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'DM Sans, system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>❌</div>
          <div>Загвар олдсонгүй</div>
          <button onClick={() => router.back()} style={{ marginTop: 16, padding: '10px 20px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            Буцах
          </button>
        </div>
      </div>
    )
  }

  const sc = STATUS_CONFIG[design.status] || { label: design.status, color: '#6B7280', icon: '●' }
  const isLocked = design.approval_locked
  const canApprove = !isLocked && (design.status === 'under_review' || design.status === 'updated_version' || design.status === 'zoom_scheduled')
  const canRequestRevision = !isLocked && (design.status === 'under_review' || design.status === 'updated_version' || design.status === 'zoom_scheduled')
  const canRequestZoom = !isLocked && !design.zoom_join_url && (design.status === 'in_progress' || design.status === 'under_review' || design.status === 'updated_version' || design.status === 'zoom_scheduled' || design.status === 'revision_requested')

  return (
    <div style={{ minHeight: '100vh', background: '#0F0F0F', color: '#fff', fontFamily: 'DM Sans, system-ui' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'success' ? '#10B981' : '#EF4444',
          color: '#fff', padding: '14px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)', maxWidth: 360,
        }}>
          {toast.msg}
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1A1A1A', borderRadius: 20, padding: 32, maxWidth: 480, width: '100%', border: '1px solid #2A2A2A' }}>
            <div style={{ fontSize: 40, marginBottom: 16, textAlign: 'center' }}>✅</div>
            <div style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>Загвар батлах уу?</div>
            <div style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>
              <strong>v{design.current_version}</strong> загварыг батлахад:{' '}
              <br />— Засах боломжгүй болно (locked)
              <br />— Үйлдвэрлэл шууд эхэлнэ
              <br />— Дизайнер хөлс тооцогдоно
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowApproveModal(false)}
                style={{ flex: 1, padding: '12px', background: '#252525', color: '#fff', border: '1px solid #333', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}
              >
                Болих
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                style={{ flex: 1, padding: '12px', background: approving ? '#333' : '#10B981', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 15 }}
              >
                {approving ? 'Батлаж байна...' : '✅ Тийм, Батлах'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#1A1A1A', borderBottom: '1px solid #2A2A2A', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => router.back()}
          style={{ padding: '8px 12px', background: '#252525', color: '#9CA3AF', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
        >
          ← Буцах
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{design.product_name || 'Дизайн хүсэлт'}</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
            Дизайнер: {design.designer_name || 'Хуваарилагдаагүй'} · v{design.current_version}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: sc.color + '22', color: sc.color,
          padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
        }}>
          {sc.icon} {sc.label}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#1A1A1A', padding: '16px 24px', borderBottom: '1px solid #2A2A2A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, fontSize: 11 }}>
          {[
            { key: 'assigned', label: 'Хуваарилагдсан' },
            { key: 'in_progress', label: 'Ажиллаж байна' },
            { key: 'under_review', label: 'Хянах' },
            { key: 'approved', label: 'Батлах' },
            { key: 'in_production', label: 'Үйлдвэрлэл' },
          ].map((step, i, arr) => {
            const statusOrder = ['assigned', 'in_progress', 'under_review', 'revision_requested', 'updated_version', 'zoom_scheduled', 'approved', 'in_production']
            const currentIdx = statusOrder.indexOf(design.status)
            const stepIdx = statusOrder.indexOf(step.key)
            const done = stepIdx < currentIdx || design.status === step.key
            const active = design.status === step.key || (step.key === 'under_review' && ['under_review', 'revision_requested', 'updated_version', 'zoom_scheduled'].includes(design.status))
            return (
              <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < arr.length - 1 ? 1 : 0 }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 60,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? '#FF6B00' : active ? '#FF6B0044' : '#252525',
                    color: done ? '#fff' : active ? '#FF6B00' : '#4B5563',
                    fontSize: 12, fontWeight: 700,
                    border: active && !done ? '2px solid #FF6B00' : 'none',
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{ color: done || active ? '#D1D5DB' : '#4B5563', whiteSpace: 'nowrap' }}>{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: done ? '#FF6B00' : '#252525', margin: '0 4px', marginBottom: 18 }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px' }}>

        {/* Zoom banner — designer created a session */}
        {design.zoom_join_url && (
          <div style={{ background: '#0D2D1E', border: '2px solid #10B981', borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ color: '#10B981', fontWeight: 700, fontSize: 15 }}>📹 Zoom уулзалт бэлэн байна!</div>
              <div style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>Дизайнер дэлгэцээ share хийж загварыг хамтдаа хянах болно</div>
              {design.zoom_password && (
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Нууц үг: <strong style={{ color: '#fff' }}>{design.zoom_password}</strong></div>
              )}
            </div>
            <a
              href={design.zoom_join_url}
              target="_blank"
              rel="noreferrer"
              style={{ background: '#10B981', color: '#fff', padding: '14px 24px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              📹 Zoom-д нэгдэх
            </a>
          </div>
        )}

        {/* Approved banner */}
        {isLocked && (
          <div style={{ background: '#0A2E1A', border: '1px solid #10B981', borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 32 }}>✅</span>
            <div>
              <div style={{ color: '#10B981', fontWeight: 700, fontSize: 16 }}>Та загварыг батласан — Үйлдвэрлэл эхэллээ</div>
              <div style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>v{design.current_version} загвар батлагдаж үйлдвэрт явлаа. Хэвлэлийн явц холбогдох хэсгүүдэд харагдах болно.</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #2A2A2A', marginBottom: 24 }}>
          {(['review', 'history', 'comments'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px', fontSize: 14, fontWeight: 500, border: 'none',
                background: 'transparent', cursor: 'pointer',
                color: activeTab === tab ? '#FF6B00' : '#6B7280',
                borderBottom: activeTab === tab ? '2px solid #FF6B00' : '2px solid transparent',
              }}
            >
              {tab === 'review' ? '🔍 Загвар хянах' : tab === 'history' ? '📁 Хувилбарууд' : `💬 Тайлбар (${design.comments?.filter((c: any) => c.type !== 'system').length || 0})`}
            </button>
          ))}
        </div>

        {/* ── REVIEW TAB ─────────────────────────────────────────────────────── */}
        {activeTab === 'review' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>

            {/* Preview */}
            <div>
              <div style={{ background: '#1A1A1A', borderRadius: 16, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, fontWeight: 600 }}>
                  ОДООГИЙН ЗАГВАР — v{design.current_version}
                </div>
                {design.preview_url ? (
                  <img
                    src={design.preview_url}
                    alt="Design preview"
                    style={{ width: '100%', borderRadius: 10, objectFit: 'contain', maxHeight: 400, background: '#252525' }}
                  />
                ) : design.file_url ? (
                  <div style={{ padding: 40, background: '#252525', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                    <div style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 16 }}>Загварын файл</div>
                    <a href={design.file_url} target="_blank" rel="noreferrer" style={{ background: '#FF6B00', color: '#fff', padding: '12px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                      📎 Файл нээх
                    </a>
                  </div>
                ) : (
                  <div style={{ padding: 40, background: '#252525', borderRadius: 10, textAlign: 'center', color: '#4B5563' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>⏳</div>
                    <div style={{ marginBottom: 16 }}>Дизайнер ажиллаж байна...</div>
                    <button
                      onClick={() => router.push(`/design/editor?designRequestId=${id}`)}
                      style={{ background: '#FF6B00', color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                      ✏️ Өөрөө загвар санал болгох
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action panel */}
            <div>
              {/* Approve button */}
              {canApprove && !isLocked && (
                <div style={{ background: '#0A2E1A', border: '1px solid #10B981', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#10B981', marginBottom: 8 }}>✅ Загвар батлах</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 1.6 }}>
                    Загвар танд бүрэн тохирсон бол батлаарай. Батлагдсан даруй үйлдвэрлэл эхэлнэ.
                  </div>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    style={{
                      width: '100%', padding: '14px', background: '#10B981',
                      color: '#fff', border: 'none', borderRadius: 10,
                      cursor: 'pointer', fontWeight: 700, fontSize: 15,
                    }}
                  >
                    ✅ Зөвшөөрч батлах
                  </button>
                </div>
              )}

              {/* Revision request */}
              {canRequestRevision && (
                <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#F97316', marginBottom: 8 }}>✏ Засах хүсэлт</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>
                    Юу засах хэрэгтэйгээ тодорхой бичнэ үү — дизайнер шуурхай засна.
                  </div>
                  <textarea
                    value={revisionReason}
                    onChange={e => setRevisionReason(e.target.value)}
                    placeholder="Жишээ: Лого доош буулгах, өнгийг #FF6B00 болгох, текстийн хэмжээ 16px болгох..."
                    rows={4}
                    style={{
                      width: '100%', padding: '12px', background: '#252525',
                      border: '1px solid #333', borderRadius: 10, color: '#fff',
                      fontSize: 13, resize: 'none', marginBottom: 12, boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={handleRequestRevision}
                    disabled={!revisionReason.trim()}
                    style={{
                      width: '100%', padding: '12px',
                      background: revisionReason.trim() ? '#F97316' : '#333',
                      color: '#fff', border: 'none', borderRadius: 10,
                      cursor: revisionReason.trim() ? 'pointer' : 'default',
                      fontWeight: 600, fontSize: 14,
                    }}
                  >
                    ✏ Засах хүсэлт явуулах
                  </button>
                </div>
              )}

              {/* Zoom request — customer can request live session with designer */}
              {canRequestZoom && (
                <div style={{ background: '#0F1F2E', border: '1px solid #1E3A5F', borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#3B82F6', marginBottom: 8 }}>📹 Zoom уулзалт хүсэх</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14, lineHeight: 1.6 }}>
                    Загварын талаар дизайнертай шууд ярилцмаар байвал Zoom хүсэлт явуулаарай.
                    Дизайнер ажлын дэлгэцээ share хийж хамтдаа засварлана.
                  </div>
                  {/* Preferred time picker */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 6, fontWeight: 600 }}>
                      УУЛЗАЛТЫН ТОХИРОМЖТОЙ ЦАГ (заавал биш)
                    </label>
                    <input
                      type="datetime-local"
                      value={zoomPreferredAt}
                      onChange={e => setZoomPreferredAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      style={{
                        width: '100%', padding: '10px 12px',
                        background: '#152231', border: '1px solid #2D4A6B',
                        borderRadius: 8, color: '#E5E7EB', fontSize: 13,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <button
                    onClick={handleRequestZoom}
                    disabled={zoomRequesting}
                    style={{
                      width: '100%', padding: '12px',
                      background: zoomRequesting ? '#333' : '#1D4ED8',
                      color: '#fff', border: 'none', borderRadius: 10,
                      cursor: zoomRequesting ? 'default' : 'pointer',
                      fontWeight: 600, fontSize: 14,
                    }}
                  >
                    {zoomRequesting ? 'Илгээж байна...' : '📹 Zoom хүсэх'}
                  </button>
                </div>
              )}

              {/* Zoom already requested — waiting for designer */}
              {canRequestZoom &&
                design.comments?.some((c: any) => c.type === 'system' && c.author_role === 'customer' && c.content?.includes('Zoom')) && (
                <div style={{ background: '#0F1F2E', border: '1px solid #3B82F6', borderRadius: 12, padding: '12px 16px', marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>⏳</span>
                  <div style={{ fontSize: 12, color: '#60A5FA' }}>Zoom хүсэлт явуулсан — дизайнер уулзалт товлохыг хүлээж байна</div>
                </div>
              )}

              {/* Status info (when no actions) */}
              {!canApprove && !canRequestRevision && !canRequestZoom && !isLocked && (
                <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 24, textAlign: 'center', marginBottom: 12 }}>{sc.icon}</div>
                  <div style={{ color: sc.color, fontWeight: 700, textAlign: 'center', fontSize: 15, marginBottom: 8 }}>{sc.label}</div>
                  <div style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
                    {design.status === 'pending' && 'Дизайнер хуваарилагдахыг хүлээж байна.'}
                    {design.status === 'assigned' && 'Дизайнер таны захиалгатай танилцаж байна.'}
                    {design.status === 'in_progress' && 'Дизайнер загвар бэлтгэж байна. Удахгүй хянуулахаар ирнэ.'}
                    {design.status === 'revision_requested' && 'Засах хүсэлтийг дизайнер хүлээн авлаа. Удахгүй шинэ хувилбар ирнэ.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div>
            {(design.versions || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#4B5563' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
                <div>Хувилбар байхгүй байна</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {(design.versions as any[]).slice().reverse().map((v) => (
                  <div key={v.id} style={{
                    background: '#1A1A1A', borderRadius: 16, padding: 20,
                    border: v.is_current ? '1px solid #FF6B00' : '1px solid #2A2A2A',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ background: '#FF6B00', color: '#fff', fontSize: 13, fontWeight: 800, padding: '4px 10px', borderRadius: 8 }}>
                          v{v.version_number}
                        </span>
                        {v.is_current && <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>● Сүүлийн хувилбар</span>}
                      </div>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>
                        {new Date(v.created_at).toLocaleString('mn-MN')}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: v.preview_url ? '120px 1fr' : '1fr', gap: 16 }}>
                      {v.preview_url && (
                        <img src={v.preview_url} alt={`v${v.version_number}`} style={{ width: '100%', borderRadius: 8, objectFit: 'cover', aspectRatio: '4/3', background: '#252525' }} />
                      )}
                      <div>
                        {v.version_note && (
                          <div style={{ fontSize: 13, color: '#D1D5DB', lineHeight: 1.5, marginBottom: 10 }}>
                            {v.version_note}
                          </div>
                        )}
                        {v.issues && Object.values(v.issues).some(Boolean) && (
                          <div style={{ background: '#EF444418', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
                            <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>⚠ Анхааруулга:</div>
                            <div style={{ fontSize: 11, color: '#FCA5A5', marginTop: 2 }}>
                              {Object.entries(v.issues).filter(([, val]) => val).map(([k]) => k).join(', ')}
                            </div>
                          </div>
                        )}
                        {v.file_url && (
                          <a href={v.file_url} target="_blank" rel="noreferrer" style={{ color: '#FF6B00', fontSize: 12, fontWeight: 600 }}>
                            📎 Файл нээх →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── COMMENTS TAB ───────────────────────────────────────────────────── */}
        {activeTab === 'comments' && (
          <div style={{ maxWidth: 700 }}>
            {/* Comments list */}
            <div style={{ marginBottom: 24 }}>
              {(design.comments || []).map((c: any) => (
                <div key={c.id} style={{
                  display: 'flex', gap: 12, marginBottom: 16,
                  flexDirection: c.author_role === 'customer' ? 'row-reverse' : 'row',
                  opacity: c.type === 'system' ? 0.7 : 1,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: c.author_role === 'customer' ? '#FF6B00' : c.author_role === 'designer' ? '#3B82F6' : '#6B7280',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff',
                  }}>
                    {c.author_name?.[0] || '?'}
                  </div>
                  <div style={{ maxWidth: '80%' }}>
                    <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, textAlign: c.author_role === 'customer' ? 'right' : 'left' }}>
                      {c.author_name} · {c.author_role === 'customer' ? 'Та' : c.author_role === 'designer' ? 'Дизайнер' : 'Admin'}
                      {c.version_number ? ` · v${c.version_number}` : ''}
                    </div>
                    <div style={{
                      padding: '12px 16px', borderRadius: 12, fontSize: 13, lineHeight: 1.6,
                      background: c.type === 'system' ? '#1E1E1E' : c.author_role === 'customer' ? '#FF6B0022' : '#1E3A5F',
                      border: c.type === 'system' ? '1px solid #2A2A2A' : 'none',
                      color: c.type === 'system' ? '#6B7280' : '#E5E7EB',
                      fontStyle: c.type === 'system' ? 'italic' : 'normal',
                    }}>
                      {c.content}
                    </div>
                    <div style={{ fontSize: 10, color: '#374151', marginTop: 3, textAlign: c.author_role === 'customer' ? 'right' : 'left' }}>
                      {new Date(c.created_at).toLocaleString('mn-MN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* New comment */}
            {!isLocked && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Тайлбар, асуулт, санал бичих..."
                  rows={3}
                  style={{ flex: 1, padding: '12px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, color: '#fff', fontSize: 13, resize: 'none' }}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  style={{ padding: '12px 16px', background: commentText.trim() ? '#FF6B00' : '#252525', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}
                >
                  Илгээх
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
