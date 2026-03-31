'use client'
import { apiFetch, API_URL } from '@/lib/api'
import { useState, useEffect, useRef } from 'react'
import PdfViewer from '@/components/PdfViewer'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

const STAGES = [
  { key: 'pending', label: 'Хүлээгдэж буй', color: '#F59E0B', icon: '📋', next: 'designing' },
  { key: 'designing', label: 'Дизайн', color: '#8B5CF6', icon: '🎨', next: 'prepress' },
  { key: 'prepress', label: 'Prepress', color: '#06B6D4', icon: '🔍', next: 'printing' },
  { key: 'printing', label: 'Хэвлэл', color: '#EC4899', icon: '🖨️', next: 'finishing' },
  { key: 'finishing', label: 'Finishing', color: '#3B82F6', icon: '✂️', next: 'qc' },
  { key: 'qc', label: 'QC шалгалт', color: '#F97316', icon: '✅', next: 'ready' },
  { key: 'ready', label: 'Бэлэн', color: '#10B981', icon: '📦', next: 'delivering' },
  { key: 'delivering', label: 'Хүргэлтэнд', color: '#6366F1', icon: '🚚', next: 'completed' },
  { key: 'completed', label: 'Дууссан', color: '#059669', icon: '🎉', next: null },
]

// Frontend stage key → Backend OrderStatus mapping
const STAGE_TO_BACKEND: Record<string, string> = {
  pending: 'CONFIRMED',
  designing: 'PENDING_FILE',
  prepress: 'FILE_REVIEW',
  printing: 'IN_PRODUCTION',
  finishing: 'FINISHING',
  qc: 'PARTIALLY_DISPATCHED',
  ready: 'DISPATCHED',
  delivering: 'DELIVERED',
  completed: 'COMPLETED',
}

const ORDER_STATUS: Record<string, { label: string; color: string }> = {}
STAGES.forEach(s => { ORDER_STATUS[s.key] = { label: s.label, color: s.color } })
ORDER_STATUS['paid'] = { label: 'Төлөгдсөн', color: '#3B82F6' }
ORDER_STATUS['in_production'] = { label: 'Үйлдвэрлэлд', color: '#EC4899' }
ORDER_STATUS['in_design'] = { label: 'Дизайнд', color: '#8B5CF6' }
ORDER_STATUS['shipped'] = { label: 'Хүргэгдсэн', color: '#10B981' }
ORDER_STATUS['delivered'] = { label: 'Хүргэгдсэн', color: '#059669' }
ORDER_STATUS['cancelled'] = { label: 'Цуцлагдсан', color: '#EF4444' }

const RISK_MAP: Record<string, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Бага', color: '#10B981', bg: '#dcfce7' },
  MEDIUM: { label: 'Дунд', color: '#F59E0B', bg: '#fef3c7' },
  HIGH: { label: 'Өндөр', color: '#EF4444', bg: '#fee2e2' },
  CRITICAL: { label: 'Маш өндөр', color: '#991B1B', bg: '#fecaca' },
}

const FILE_STATUS_MAP: Record<string, { label: string; color: string }> = {
  uploaded: { label: 'Шинэ', color: '#3B82F6' },
  checking: { label: 'Шалгаж байна', color: '#F59E0B' },
  approved: { label: 'Батлагдсан', color: '#10B981' },
  rejected: { label: 'Буцаагдсан', color: '#EF4444' },
  needs_fix: { label: 'Засах', color: '#F97316' },
}

const FILE_TYPE_MAP: Record<string, string> = {
  original: '📄 Эх файл', design: '🎨 Дизайн', prepress: '🔍 Prepress',
  production: '🖨️ Хэвлэл', qc: '✅ QC', final: '📦 Final',
}

const DESIGN_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:            { label: 'Хүлээгдэж буй', color: '#6366F1', bg: '#EEF2FF' },
  assigned:           { label: 'Дизайнер томилогдсон', color: '#8B5CF6', bg: '#F5F3FF' },
  in_progress:        { label: 'Хийгдэж байна', color: '#F59E0B', bg: '#FFFBEB' },
  under_review:       { label: 'Хэрэглэгч шалгаж байна', color: '#3B82F6', bg: '#EFF6FF' },
  revision_requested: { label: 'Засвар хүсэгдсэн', color: '#EF4444', bg: '#FEF2F2' },
  updated_version:    { label: 'Шинэчлэгдсэн', color: '#F97316', bg: '#FFF7ED' },
  zoom_scheduled:     { label: 'Zoom уулзалт', color: '#06B6D4', bg: '#ECFEFF' },
  approved:           { label: 'Батлагдсан ✓', color: '#10B981', bg: '#ECFDF5' },
  in_production:      { label: 'Үйлдвэрлэлд', color: '#059669', bg: '#D1FAE5' },
}

export default function AdminWorkflowPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [designRequests, setDesignRequests] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [machines, setMachines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'pipeline' | 'table' | 'delivery'>('pipeline')
  const [filter, setFilter] = useState('')
  const [detail, setDetail] = useState<any>(null)
  const [noteText, setNoteText] = useState('')
  const [auditTrail, setAuditTrail] = useState<any[]>([])
  const [orderFiles, setOrderFiles] = useState<any[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(true)
  const [modalTab, setModalTab] = useState<'info' | 'files' | 'trail'>('info')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const commentFileRef = useRef<HTMLInputElement>(null)
  const [commentFile, setCommentFile] = useState<globalThis.File | null>(null)

  // Revert modal state
  const [revertModal, setRevertModal] = useState<any>(null)
  // PDF preview state
  const [previewFile, setPreviewFile] = useState<any>(null)
  const [revertReason, setRevertReason] = useState('')
  const [revertTarget, setRevertTarget] = useState('')
  const [reverting, setReverting] = useState(false)

  const currentUser = 'Системийн Админ'

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const load = () => {
    setLoading(true)
    Promise.all([
      apiFetch<any>('/orders').catch(() => []),
      apiFetch<any>('/production-jobs').catch(() => []),
      apiFetch<any>('/delivery').catch(() => []),
      apiFetch<any>('/machines').catch(() => []),
      apiFetch<any>('/design-requests').catch(() => []),
    ]).then(([o, j, d, m, dr]) => {
      setOrders(Array.isArray(o) ? o : []); setJobs(Array.isArray(j) ? j : [])
      setDeliveries(Array.isArray(d) ? d : []); setMachines(Array.isArray(m) ? m : [])
      setDesignRequests(Array.isArray(dr) ? dr : [])
    }).finally(() => setLoading(false))
  }
  useEffect(load, [])
  useEffect(() => { if (!isLive) return; const i = setInterval(load, 30000); return () => clearInterval(i) }, [isLive])

  const loadFiles = async (orderId: string) => {
    try { const d = await apiFetch<any>(`/order-files?order_id=${orderId}`); setOrderFiles(Array.isArray(d) ? d : []) } catch { setOrderFiles([]) }
  }

  // DB Audit Trail ачааллах
  const loadAuditTrail = async (orderId: string) => {
    try {
      const d = await apiFetch<any>(`/audit-trail/${orderId}`)
      setAuditTrail(Array.isArray(d) ? d : [])
    } catch { setAuditTrail([]) }
  }

  // DB Audit Trail бичих
  const addAuditEntry = async (orderId: string, action: string, file?: string) => {
    try {
      await apiFetch<any>(`/audit-trail`, {
        method: 'POST',
        body: { order_id: orderId, user: currentUser, action, file },
      })
    } catch (e) { console.log('Audit trail error:', e) }
  }

  const uploadFile = async (file: globalThis.File, orderId: string, fileType = 'original') => {
    setUploading(true)
    try {
      const formData = new FormData(); formData.append('file', file)
      const uploadData = await apiFetch<any>(`/upload/file`, { method: 'POST', body: formData })
      const filePath = uploadData?.url || uploadData?.path || uploadData?.filename || file.name
      await apiFetch<any>('/order-files', { method: 'POST', body: { order_id: orderId, filename: file.name, path: filePath, size: file.size, mime_type: file.type, file_type: fileType, uploaded_by: currentUser, uploaded_by_role: 'admin' } })
      if (file.type === 'application/pdf') {
        const inspectForm = new FormData(); inspectForm.append('file', file)
        const analysis = await apiFetch<any>(`/ai/pdf-inspector/inspect`, { method: 'POST', body: inspectForm }).catch(() => null)
        if (analysis) {
          const files = await apiFetch<any>(`/order-files?order_id=${orderId}`)
          if (files.length > 0) await apiFetch<any>(`/order-files/${files[0].id}/analysis`, { method: 'PATCH', body: { analysis } }).catch(() => {})
        }
      }
      showToast(`📄 ${file.name} амжилттай`)
      await addAuditEntry(orderId, `Файл: ${file.name}`, filePath)
      await loadAuditTrail(orderId)
      await loadFiles(orderId)
    } catch { showToast('Файл хуулахад алдаа') }
    finally { setUploading(false) }
  }

  const approveFile = async (fileId: string, orderId: string) => {
    await apiFetch<any>(`/order-files/${fileId}/approve`, { method: 'PATCH'})
    await addAuditEntry(orderId, 'Файл батлагдсан ✅')
    await loadAuditTrail(orderId); await loadFiles(orderId); showToast('Файл батлагдлаа ✅')
  }
  const rejectFile = async (fileId: string, orderId: string) => {
    await apiFetch<any>(`/order-files/${fileId}/reject`, { method: 'PATCH', body: { notes: 'Засвар шаардлагатай' } })
    await addAuditEntry(orderId, 'Файл буцаагдсан ❌')
    await loadAuditTrail(orderId); await loadFiles(orderId); showToast('Файл буцаагдлаа')
  }
  const setFinalFile = async (fileId: string, orderId: string) => {
    await apiFetch<any>(`/order-files/${fileId}/set-final`, { method: 'PATCH'})
    await addAuditEntry(orderId, 'Final файл тогтоосон 📦')
    await loadAuditTrail(orderId); await loadFiles(orderId); showToast('Final файл тогтоогдлоо 📦')
  }

  const getStage = (o: any) => {
    const s = (o.status || '').toLowerCase()
    if (s === 'cancelled') return 'cancelled'
    if (s === 'delivered' || s === 'completed') return 'completed'
    if (s === 'shipped' || s === 'delivering' || s === 'dispatched') return 'delivering'
    if (s === 'ready' || s === 'partially_dispatched') return 'ready'
    if (s === 'qc') return 'qc'
    if (s === 'finishing') return 'finishing'
    if (s === 'in_production' || s === 'printing') return 'printing'
    if (s === 'prepress' || s === 'file_review') return 'prepress'
    if (s === 'in_design' || s === 'designing' || s === 'pending_file' || s === 'file_rejected') return 'designing'
    if (s === 'paid' || s === 'scheduled' || s === 'confirmed' || s === 'quotation_sent' || s === 'draft' || s === 'on_hold') return 'pending'
    return 'pending'
  }

  const stageCounts: Record<string, number> = {}; const stageOrders: Record<string, any[]> = {}
  STAGES.forEach(s => { stageCounts[s.key] = 0; stageOrders[s.key] = [] })
  orders.forEach(o => { const st = getStage(o); if (stageCounts[st] !== undefined) { stageCounts[st]++; stageOrders[st].push(o) } })
  const filtered = filter ? orders.filter(o => getStage(o) === filter) : orders.filter(o => o.status !== 'cancelled')
  const activeOrders = orders.filter(o => !['completed', 'delivered', 'cancelled'].includes(o.status))

  const updateOrderStatus = async (id: string, status: string) => {
    await apiFetch<any>(`/orders/${id}/status`, { method: 'PATCH', body: { status } }); load()
  }

  const getDesignRequest = (orderId: string) =>
    designRequests.find((dr: any) => dr.order_id === orderId || dr.orderId === orderId)

  const moveToNext = async (order: any) => {
    const cur = getStage(order); const so = STAGES.find(s => s.key === cur); if (!so?.next) return
    const ns = STAGES.find(s => s.key === so.next); if (!ns) return
    // Warn if design not approved when moving designing → prepress
    if (cur === 'designing') {
      const dr = getDesignRequest(order.id)
      if (dr && dr.status !== 'approved' && dr.status !== 'in_production') {
        const dsm = DESIGN_STATUS_MAP[dr.status]
        const ok = window.confirm(`⚠️ Дизайн батлагдаагүй байна!\n\nОдоогийн төлөв: ${dsm?.label || dr.status}\n\nГэсэн ч Prepress руу шилжүүлэх үү?`)
        if (!ok) return
      }
    }
    const backendStatus = STAGE_TO_BACKEND[so.next] || so.next
    if (so.next === 'printing') { await apiFetch<any>(`/production-jobs/from-order/${order.id}`, { method: 'POST'}).catch(() => {}); await updateOrderStatus(order.id, 'IN_PRODUCTION') }
    else if (so.next === 'delivering') { await apiFetch<any>('/delivery', { method: 'POST', body: { order_id: order.id, address: order.notes || '', status: 'assigned' } }).catch(() => {}); await updateOrderStatus(order.id, 'DELIVERED') }
    else { await updateOrderStatus(order.id, backendStatus) }
    await addAuditEntry(order.id, `"${ns.label}" руу шилжүүлсэн`)
    showToast(`${order.product_name || 'Захиалга'} → ${ns.icon} ${ns.label}`)
  }

  // === QC FAIL БУЦААХ ===
  const openRevertModal = (order: any) => {
    const curStage = getStage(order)
    const curIndex = STAGES.findIndex(s => s.key === curStage)
    setRevertModal({ order, curStage, curIndex })
    setRevertReason('')
    // Default: нэг алхам буцаана
    setRevertTarget(curIndex > 0 ? STAGES[curIndex - 1].key : '')
  }

  const handleRevert = async () => {
    if (!revertModal || !revertReason.trim()) return
    setReverting(true)
    try {
      const backendTarget = revertTarget ? (STAGE_TO_BACKEND[revertTarget] || revertTarget) : undefined
      await apiFetch<any>(`/orders/${revertModal.order.id}/revert`, {
        method: 'PATCH',
        body: {
          reason: revertReason.trim(),
          target_stage: backendTarget,
          status: backendTarget,
        },
      })
      const targetLabel = STAGES.find(s => s.key === revertTarget)?.label || 'Өмнөх'
      showToast(`↩️ Буцаагдлаа: "${targetLabel}" руу`)
      setRevertModal(null)
      setRevertReason('')
      setRevertTarget('')
      load()
      // Detail modal нээлттэй бол шинэчлэх
      if (detail?.id === revertModal.order.id) {
        const updated = await apiFetch<any>(`/orders/${revertModal.order.id}`)
        setDetail(updated)
        await loadAuditTrail(revertModal.order.id)
      }
    } catch {
      showToast('❌ Буцаахад алдаа гарлаа')
    } finally {
      setReverting(false)
    }
  }

  const openDetail = (order: any) => {
    setDetail(order); setNoteText(''); setCommentFile(null); setModalTab('info')
    loadFiles(order.id)
    loadAuditTrail(order.id)
  }

  const handleAddNote = async () => {
    if (!noteText.trim() && !commentFile) return; if (!detail) return
    if (commentFile) {
      await uploadFile(commentFile, detail.id)
      if (noteText.trim()) await addAuditEntry(detail.id, noteText.trim())
    } else {
      await addAuditEntry(detail.id, noteText.trim())
    }
    await loadAuditTrail(detail.id)
    setNoteText(''); setCommentFile(null)
    if (commentFileRef.current) commentFileRef.current.value = ''
  }

  const st = (status: string) => ORDER_STATUS[status] || { label: status, color: '#888' }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text2)' }}>Ачааллж байна...</div>

  return (
    <div className="p-4 md:p-6" style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {toast && <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: '#e2e8f0', padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 9999, animation: 'toastIn 0.3s ease' }}>{toast}</div>}
      <style>{`
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .wf-card{transition:all .15s;cursor:pointer}.wf-card:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.08)!important}
        .wf-move{transition:all .12s}.wf-move:hover{filter:brightness(1.15);transform:scale(1.02)}.wf-move:active{transform:scale(.98)}
        .wf-col{animation:slideUp .3s ease backwards}
        .tab-btn{transition:all .15s;cursor:pointer;border:none;font-size:12px;font-weight:500;padding:6px 14px;border-radius:6px}.tab-btn:hover{opacity:.8}
        .file-row{transition:background .15s;border-radius:8px}.file-row:hover{background:var(--surface2)!important}
        .file-action{border:none;border-radius:4px;font-size:10px;padding:3px 8px;cursor:pointer;font-weight:600;transition:all .12s}.file-action:hover{filter:brightness(1.1);transform:scale(1.03)}
        .revert-btn{transition:all .12s;cursor:pointer}.revert-btn:hover{filter:brightness(1.1);transform:scale(1.02)}.revert-btn:active{transform:scale(.98)}
      `}</style>

      <AdminPageHeader title="Production Workflow" description="Захиалга → Дизайн → Prepress → Хэвлэл → QC → Хүргэлт → Дууссан">
        <button onClick={() => setIsLive(!isLive)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 11, cursor: 'pointer', background: isLive ? '#dcfce7' : 'var(--surface2)', color: isLive ? '#16a34a' : 'var(--text3)' }}>{isLive ? '● Live' : '○ Live'}</button>
        {(['pipeline', 'table', 'delivery'] as const).map(v => (
          <button key={v} onClick={() => { setView(v); setFilter('') }} style={{ padding: '6px 14px', borderRadius: 8, border: view === v ? 'none' : '1px solid var(--border)', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: view === v ? '#FF6B00' : 'var(--surface)', color: view === v ? '#fff' : 'var(--text2)' }}>
            {v === 'pipeline' ? 'Pipeline' : v === 'table' ? 'Хүснэгт' : `Хүргэлт (${deliveries.length})`}
          </button>
        ))}
      </AdminPageHeader>

      {/* KPI */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', flexShrink: 0 }}>
        {[{ label: 'Идэвхтэй', value: activeOrders.length, color: '#FF6B00' }, { label: 'Хэвлэлд', value: stageCounts.printing, color: '#EC4899' }, { label: 'Хүргэлтэнд', value: stageCounts.delivering, color: '#6366F1' }, { label: 'Дууссан', value: stageCounts.completed, color: '#059669' }, { label: 'Машин', value: machines.length, color: '#3B82F6' }, { label: 'Нийт', value: orders.length, color: '#888' }].map(k => (
          <div key={k.label} style={{ background: 'var(--surface)', borderLeft: `3px solid ${k.color}`, borderRadius: '0 6px 6px 0', padding: '6px 12px', border: '1px solid var(--border)', borderLeftWidth: 3, borderLeftColor: k.color }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: k.color, marginRight: 6 }}>{k.value}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{k.label}</span>
          </div>
        ))}
      </div>

      {/* PIPELINE */}
      {view === 'pipeline' && (
        <div style={{ display: 'flex', gap: 6, flex: 1, overflow: 'hidden' }}>
          {STAGES.map((stage, si) => {
            const nextStage = stage.next ? STAGES.find(s => s.key === stage.next) : null
            return (
              <div key={stage.key} className="wf-col" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', animationDelay: `${si * 0.04}s` }}>
                <div style={{ padding: '8px 10px', borderBottom: `2px solid ${stage.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stage.icon} {stage.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: stage.color, background: stage.color + '15', padding: '1px 6px', borderRadius: 8, flexShrink: 0 }}>{stageCounts[stage.key]}</span>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: 4 }}>
                  {stageOrders[stage.key].length === 0 ? <div style={{ padding: 16, textAlign: 'center', color: 'var(--text3)', fontSize: 11 }}>Хоосон</div>
                  : stageOrders[stage.key].map(o => {
                    const canRevert = si > 0 && stage.key !== 'completed'
                    const dr = stage.key === 'designing' ? getDesignRequest(o.id) : null
                    const drInfo = dr ? (DESIGN_STATUS_MAP[dr.status] || { label: dr.status, color: '#888', bg: '#f3f4f6' }) : null
                    const isApproved = dr?.status === 'approved' || dr?.status === 'in_production'
                    return (
                      <div key={o.id} className="wf-card" onClick={() => openDetail(o)} style={{ padding: '8px 8px 6px', marginBottom: 4, background: 'var(--surface2)', borderRadius: 6, fontSize: 11, borderLeft: `3px solid ${stage.color}` }}>
                        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.product_name || 'Захиалга'}</div>
                        <div style={{ color: 'var(--text3)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customer_name || '—'} · {o.quantity}ш</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#FF6B00', fontWeight: 600 }}>₮{Number(o.total_price || 0).toLocaleString()}</span>
                          <div style={{ display: 'flex', gap: 4 }}>{o.file_url && <span style={{ fontSize: 9, color: '#3B82F6' }}>🔎</span>}</div>
                        </div>
                        {/* Design approval badge — only for designing stage */}
                        {stage.key === 'designing' && (
                          <div style={{ marginTop: 5 }}>
                            {drInfo ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 6px', borderRadius: 4, background: drInfo.bg, border: `1px solid ${drInfo.color}30` }}>
                                <span style={{ fontSize: 9, color: drInfo.color, fontWeight: 700 }}>🎨</span>
                                <span style={{ fontSize: 9, color: drInfo.color, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{drInfo.label}</span>
                                {isApproved && <span style={{ fontSize: 9, color: '#10B981' }}>✓ Батлагдсан</span>}
                                {dr.zoom_join_url && <span title="Zoom уулзалт бий" style={{ fontSize: 9 }}>📹</span>}
                              </div>
                            ) : (
                              <div style={{ fontSize: 9, color: 'var(--text3)', padding: '2px 4px', background: 'var(--surface)', borderRadius: 3, border: '1px dashed var(--border)' }}>🎨 Дизайн хүсэлт байхгүй</div>
                            )}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                          {nextStage && <button className="wf-move" onClick={e => { e.stopPropagation(); moveToNext(o) }} style={{ flex: 1, padding: '4px 0', background: stage.key === 'designing' && dr && !isApproved ? '#FEF3C7' : nextStage.color + '12', border: `1px solid ${stage.key === 'designing' && dr && !isApproved ? '#F59E0B' : nextStage.color}30`, borderRadius: 4, color: stage.key === 'designing' && dr && !isApproved ? '#92400E' : nextStage.color, fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>{stage.key === 'designing' && dr && !isApproved ? '⚠️' : nextStage.icon} {nextStage.label} →</button>}
                          {canRevert && <button className="revert-btn" onClick={e => { e.stopPropagation(); openRevertModal(o) }} style={{ padding: '4px 6px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 4, color: '#DC2626', fontSize: 10, fontWeight: 600 }} title="Буцаах">↩️</button>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TABLE */}
      {view === 'table' && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setFilter('')} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', fontSize: 11, cursor: 'pointer', background: !filter ? '#FF6B00' : 'var(--surface2)', color: !filter ? '#fff' : 'var(--text2)' }}>Бүгд ({orders.length})</button>
            {STAGES.map(s => <button key={s.key} onClick={() => setFilter(s.key)} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', fontSize: 11, cursor: 'pointer', background: filter === s.key ? s.color + '20' : 'var(--surface2)', color: filter === s.key ? s.color : 'var(--text2)' }}>{s.icon} {s.label} ({stageCounts[s.key]})</button>)}
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ background: 'var(--surface2)' }}>{['Захиалга', 'Хэрэглэгч', 'Бүтээгдэхүүн', 'Тоо', 'Дүн', 'Төлөв', 'Үйлдэл'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500 }}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.length === 0 ? <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Захиалга байхгүй</td></tr>
                : filtered.slice(0, 30).map(o => {
                  const s = st(o.status); const stage = getStage(o); const so = STAGES.find(sg => sg.key === stage); const ns = so?.next ? STAGES.find(sg => sg.key === so.next) : null
                  const canRevert = STAGES.findIndex(sg => sg.key === stage) > 0 && stage !== 'completed'
                  return (
                    <tr key={o.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text3)' }}>#{o.id?.slice(0, 8)}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 500 }}>{o.customer_name || '—'}</td>
                      <td style={{ padding: '6px 10px' }}>{o.product_name || '—'}</td>
                      <td style={{ padding: '6px 10px', color: 'var(--text2)' }}>{o.quantity}</td>
                      <td style={{ padding: '6px 10px', color: '#FF6B00', fontWeight: 600 }}>₮{Number(o.total_price || 0).toLocaleString()}</td>
                      <td style={{ padding: '6px 10px' }}><span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: s.color + '15', color: s.color, fontWeight: 600 }}>{s.label}</span></td>
                      <td style={{ padding: '6px 10px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => openDetail(o)} style={{ padding: '3px 8px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 10 }}>Харах</button>
                          {ns && <button onClick={() => moveToNext(o)} className="wf-move" style={{ padding: '3px 8px', background: ns.color + '15', color: ns.color, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>{ns.icon} →</button>}
                          {canRevert && <button onClick={e => { e.stopPropagation(); openRevertModal(o) }} className="revert-btn" style={{ padding: '3px 8px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>↩️</button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DELIVERY */}
      {view === 'delivery' && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ background: 'var(--surface2)' }}>{['ID', 'Захиалга', 'Хаяг', 'Курьер', 'Төлөв', 'Огноо'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500 }}>{h}</th>)}</tr></thead>
              <tbody>
                {deliveries.length === 0 ? <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Хүргэлт байхгүй</td></tr>
                : deliveries.map(d => (
                  <tr key={d.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text3)' }}>#{String(d.id).slice(0, 8)}</td>
                    <td style={{ padding: '6px 10px' }}>#{String(d.order_id || d.order?.id || '').slice(0, 8)}</td>
                    <td style={{ padding: '6px 10px', color: 'var(--text2)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.address || '—'}</td>
                    <td style={{ padding: '6px 10px' }}>{d.courier_name || '—'}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <select value={d.status} onChange={async e => { await apiFetch<any>(`/delivery/${d.id}/status`, { method: 'PATCH', body: { status: e.target.value } }); load() }}
                        style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer' }}>
                        {['assigned', 'picked_up', 'on_the_way', 'in_transit', 'delivered'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '6px 10px', color: 'var(--text3)', fontSize: 11 }}>{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }} onClick={() => setDetail(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 620, border: '1px solid var(--border)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text3)' }}>#{detail.id?.slice(0, 12)}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: st(detail.status).color + '15', color: st(detail.status).color, fontWeight: 600 }}>{st(detail.status).label}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{detail.product_name || 'Захиалга'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{detail.customer_name} · {detail.quantity}ш · ₮{Number(detail.total_price || 0).toLocaleString()}</div>
                </div>
                <button onClick={() => setDetail(null)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              {/* Action buttons: Forward + Revert */}
              {(() => {
                const cur = getStage(detail); const curIdx = STAGES.findIndex(s => s.key === cur)
                const so = STAGES.find(s => s.key === cur); const ns = so?.next ? STAGES.find(s => s.key === so.next) : null
                const canRevert = curIdx > 0 && cur !== 'completed'
                return (
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    {ns && <button className="wf-move" onClick={() => { moveToNext(detail); setDetail({ ...detail, status: so!.next }); loadAuditTrail(detail.id) }} style={{ flex: 1, padding: '9px 0', background: `linear-gradient(135deg, ${so!.color}, ${ns.color})`, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>{ns.icon} {ns.label} руу шилжүүлэх →</button>}
                    {canRevert && <button className="revert-btn" onClick={() => openRevertModal(detail)} style={{ padding: '9px 16px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, color: '#DC2626', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>↩️ Буцаах</button>}
                  </div>
                )
              })()}
              <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
                {[{ key: 'info', label: '📋 Мэдээлэл' }, { key: 'files', label: `📁 Файлууд (${orderFiles.length})` }, { key: 'trail', label: `📝 Trail (${auditTrail.length})` }].map(t => (
                  <button key={t.key} className="tab-btn" onClick={() => setModalTab(t.key as any)} style={{ background: modalTab === t.key ? '#FF6B00' : 'var(--surface2)', color: modalTab === t.key ? '#fff' : 'var(--text2)' }}>{t.label}</button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px' }}>
              {/* INFO */}
              {modalTab === 'info' && <>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, marginBottom: 14 }}>
                  {[{ label: 'Утас', value: detail.customer_phone }, { label: 'Хэмжээ', value: detail.width_mm && detail.height_mm ? `${detail.width_mm}×${detail.height_mm}мм` : null }, { label: 'Цаас', value: detail.paper_gsm ? detail.paper_gsm + 'gsm' : null }, { label: 'Өнгө', value: detail.color_mode }, { label: 'Огноо', value: detail.created_at ? new Date(detail.created_at).toLocaleDateString() : null }].filter(x => x.value).map(x => (
                    <div key={x.label} style={{ background: 'var(--surface2)', borderRadius: 6, padding: '4px 10px' }}><span style={{ color: 'var(--text3)', marginRight: 4 }}>{x.label}:</span><span style={{ fontWeight: 500 }}>{x.value}</span></div>
                  ))}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>Төлөв шилжүүлэх</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                  {STAGES.map(s => <button key={s.key} onClick={() => { updateOrderStatus(detail.id, s.key); addAuditEntry(detail.id, `"${s.label}" руу шилжүүлсэн`); setDetail({ ...detail, status: s.key }); loadAuditTrail(detail.id) }} style={{ padding: '4px 10px', borderRadius: 5, border: 'none', fontSize: 10, cursor: 'pointer', background: getStage(detail) === s.key ? s.color : s.color + '12', color: getStage(detail) === s.key ? '#fff' : s.color, fontWeight: 500 }}>{s.icon} {s.label}</button>)}
                </div>
                {machines.length > 0 && <>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text2)' }}>Машин оноох</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {machines.map(m => <button key={m.id} onClick={() => { updateOrderStatus(detail.id, 'in_production'); setDetail(null) }} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border)', fontSize: 10, cursor: 'pointer', background: 'var(--surface2)', color: 'var(--text)' }}>🖨️ {m.name}</button>)}
                  </div>
                </>}
              </>}

              {/* FILES */}
              {modalTab === 'files' && <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>📁 Файлууд</span>
                  <div>
                    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.ai,.psd,.eps,.tiff" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0], detail.id) }} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', fontSize: 11, cursor: 'pointer', background: '#FF6B00', color: '#fff', fontWeight: 600, opacity: uploading ? 0.5 : 1 }}>{uploading ? '⏳ Хуулж байна...' : '📤 Файл нэмэх'}</button>
                  </div>
                </div>
                {orderFiles.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔭</div>Файл байхгүй
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {orderFiles.map((f: any) => {
                      const fst = FILE_STATUS_MAP[f.status] || { label: f.status, color: '#888' }
                      const risk = f.analysis?.risk ? RISK_MAP[f.analysis.risk] : null
                      return (
                        <div key={f.id} className="file-row" style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, background: f.is_final ? '#f0fdf4' : 'transparent' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                <span style={{ fontSize: 12, fontWeight: 600 }}>{f.filename}</span>
                                {f.is_final && <span style={{ fontSize: 9, background: '#10B981', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>FINAL</span>}
                              </div>
                              <div style={{ display: 'flex', gap: 6, fontSize: 10, color: 'var(--text3)', flexWrap: 'wrap' }}>
                                <span>{FILE_TYPE_MAP[f.file_type] || f.file_type}</span>
                                <span>v{f.version}</span>
                                <span>{(f.size / 1024).toFixed(0)}KB</span>
                                <span style={{ color: fst.color, fontWeight: 600 }}>{fst.label}</span>
                                {f.uploaded_by && <span>👤 {f.uploaded_by}</span>}
                              </div>
                              {f.analysis && (
                                <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: risk?.color || '#888', background: risk?.bg || '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>🧠 {f.analysis.score}/100</span>
                                  {f.analysis.issues?.filter((i: any) => i.severity === 'error').length > 0 && <span style={{ fontSize: 10, color: '#EF4444' }}>🔴 {f.analysis.issues.filter((i: any) => i.severity === 'error').length} алдаа</span>}
                                  {f.analysis.issues?.filter((i: any) => i.severity === 'warning').length > 0 && <span style={{ fontSize: 10, color: '#F59E0B' }}>⚠️ {f.analysis.issues.filter((i: any) => i.severity === 'warning').length} анхааруулга</span>}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                              {f.path && (/\.(pdf|jpg|jpeg|png|gif|webp)$/i.test(f.filename || f.path)) && (
                                <button onClick={() => setPreviewFile(f)} className="file-action" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }} title="Preview">👁️</button>
                              )}
                              {f.path && <a href={f.path.startsWith('http') ? f.path : `${API_URL}${f.path}`} target="_blank" className="file-action" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', textDecoration: 'none' }}>Татах</a>}
                              {f.status !== 'approved' && <button onClick={() => approveFile(f.id, detail.id)} className="file-action" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>✅</button>}
                              {f.status !== 'rejected' && <button onClick={() => rejectFile(f.id, detail.id)} className="file-action" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>❌</button>}
                              {!f.is_final && f.status === 'approved' && <button onClick={() => setFinalFile(f.id, detail.id)} className="file-action" style={{ background: 'rgba(16,185,129,0.15)', color: '#059669' }}>📦</button>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* PDF/Image Preview Panel */}
                {previewFile && (
                  <div style={{ marginTop: 12 }}>
                    <PdfViewer
                      fileUrl={previewFile.path}
                      filename={previewFile.filename}
                      analysis={previewFile.analysis}
                      height={500}
                      showAnalysis={true}
                      onClose={() => setPreviewFile(null)}
                    />
                  </div>
                )}
              </>}

              {/* TRAIL — DB-based */}
              {modalTab === 'trail' && <>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>📝 Audit Trail ({auditTrail.length})</div>
                {auditTrail.length === 0 ? <div style={{ padding: 16, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>Тэмдэглэл байхгүй</div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {auditTrail.map((entry: any, i: number) => {
                    const isRevert = entry.action?.includes('БУЦААГДСАН')
                    const time = entry.created_at ? new Date(entry.created_at).toLocaleString('mn-MN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''
                    return (
                      <div key={entry.id || i} style={{ display: 'flex', gap: 10, padding: '6px 8px', background: isRevert ? '#FEF2F2' : i === 0 ? 'var(--surface2)' : 'transparent', borderRadius: 5, alignItems: 'baseline', borderLeft: isRevert ? '3px solid #DC2626' : 'none' }}>
                        <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'monospace', whiteSpace: 'nowrap', minWidth: 80 }}>{time}</span>
                        <span style={{ fontSize: 11, color: isRevert ? '#DC2626' : '#3B82F6', fontWeight: 600, minWidth: 60 }}>{entry.user}</span>
                        <div>
                          <span style={{ fontSize: 12, color: isRevert ? '#DC2626' : i === 0 ? 'var(--text)' : 'var(--text2)' }}>{entry.action}</span>
                          {entry.file && <span style={{ fontSize: 10, color: '#3B82F6', marginLeft: 6 }}>🔎</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>}
              </>}
            </div>

            {/* Comment + File */}
            <div style={{ padding: '10px 20px 14px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              {commentFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 11, color: '#3B82F6', background: 'rgba(59,130,246,0.06)', padding: '4px 10px', borderRadius: 6 }}>
                  📎 {commentFile.name} ({(commentFile.size / 1024).toFixed(0)}KB)
                  <button onClick={() => { setCommentFile(null); if (commentFileRef.current) commentFileRef.current.value = '' }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 12, padding: '0 4px' }}>✕</button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                <input ref={commentFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.ai,.psd,.eps,.tiff" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setCommentFile(e.target.files[0]) }} />
                <button onClick={() => commentFileRef.current?.click()} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="Файл хавсаргах">📎</button>
                <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddNote() }} placeholder="Тэмдэглэл бичих..." style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '8px 12px', fontSize: 12, outline: 'none' }} />
                <button onClick={handleAddNote} disabled={uploading} style={{ background: (noteText.trim() || commentFile) ? '#FF6B00' : 'var(--surface2)', border: 'none', color: (noteText.trim() || commentFile) ? '#fff' : 'var(--text3)', borderRadius: 8, padding: '0 16px', fontSize: 12, fontWeight: 600, cursor: (noteText.trim() || commentFile) ? 'pointer' : 'default', transition: 'all 0.15s' }}>{uploading ? '⏳' : 'Илгээх'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === REVERT MODAL === */}
      {revertModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }} onClick={() => setRevertModal(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 440, border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', animation: 'slideUp 0.25s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#DC2626' }}>↩️ Захиалга буцаах</div>
                <button onClick={() => setRevertModal(null)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                <span style={{ fontWeight: 600 }}>{revertModal.order.product_name || 'Захиалга'}</span> · #{revertModal.order.id?.slice(0, 8)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                Одоогийн төлөв: <span style={{ fontWeight: 600, color: STAGES[revertModal.curIndex]?.color }}>{STAGES[revertModal.curIndex]?.icon} {STAGES[revertModal.curIndex]?.label}</span>
              </div>
            </div>
            <div style={{ padding: '16px 24px' }}>
              {/* Буцаах stage сонгох */}
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>Аль stage руу буцаах вэ?</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
                {STAGES.slice(0, revertModal.curIndex).map(s => (
                  <button key={s.key} onClick={() => setRevertTarget(s.key)} style={{ padding: '5px 12px', borderRadius: 6, border: revertTarget === s.key ? `2px solid ${s.color}` : '1px solid var(--border)', fontSize: 11, cursor: 'pointer', background: revertTarget === s.key ? s.color + '15' : 'var(--surface2)', color: revertTarget === s.key ? s.color : 'var(--text2)', fontWeight: revertTarget === s.key ? 700 : 400 }}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>

              {/* Шалтгаан */}
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>Буцаах шалтгаан *</div>
              <textarea value={revertReason} onChange={e => setRevertReason(e.target.value)} placeholder="Жишээ: QC шалгалтад өнгөний тохируулга буруу, дахин хэвлэх шаардлагатай..." style={{ width: '100%', minHeight: 80, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '10px 12px', fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />

              {/* Түргэн шалтгаанууд */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8, marginBottom: 16 }}>
                {['Өнгө тохируулга буруу', 'DPI хүрэлцэхгүй', 'Зүсэлт согог тай', 'Материал буруу', 'Хэрэглэгчийн хүсэлтээр'].map(q => (
                  <button key={q} onClick={() => setRevertReason(q)} style={{ padding: '3px 10px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 10, cursor: 'pointer', background: revertReason === q ? '#FEE2E2' : 'var(--surface2)', color: revertReason === q ? '#DC2626' : 'var(--text3)' }}>{q}</button>
                ))}
              </div>

              {/* Баталгаажуулах */}
              <button onClick={handleRevert} disabled={reverting || !revertReason.trim() || !revertTarget} style={{ width: '100%', padding: '11px 0', background: (revertReason.trim() && revertTarget) ? '#DC2626' : '#ccc', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: (revertReason.trim() && revertTarget) ? 'pointer' : 'default', transition: 'all 0.15s' }}>
                {reverting ? '⏳ Буцааж байна...' : `↩️ "${STAGES.find(s => s.key === revertTarget)?.label || ''}" руу буцаах`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
