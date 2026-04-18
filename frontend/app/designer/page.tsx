'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'

const API = 'http://localhost:4000'

interface DesignRequest {
  id: string
  product_name?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  description?: string
  file_url?: string
  preview_url?: string
  designer_id?: string
  designer_name?: string
  designer_zoom?: string
  status: string
  created_at: string
  order_id?: string
}

interface User { id: string; email: string; full_name: string; role: string }

const ST_MN: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Хүлээгдэж байна', color: '#F59E0B' },
  assigned:    { label: 'Оноогдсон',       color: '#8B5CF6' },
  in_progress: { label: 'Хийгдэж байна',   color: '#3B82F6' },
  approved:    { label: 'Батлагдсан',      color: '#10B981' },
  rejected:    { label: 'Татгалзсан',      color: '#EF4444' },
}

const WORKFLOW = [
  { status: 'pending',     label: 'Хүлээгдэж байна', icon: '⏳' },
  { status: 'assigned',    label: 'Оноогдсон',       icon: '👤' },
  { status: 'in_progress', label: 'Хийгдэж байна',   icon: '🎨' },
  { status: 'approved',    label: 'Батлагдсан',      icon: '✅' },
]

// Prepress issue labels
const ISSUE_MN: Record<string, string> = {
  LOW_DPI:            '⚠ DPI хэт бага (300-с дээш байх ёстой)',
  BLEED_TOO_SMALL:    '⚠ Цонхивч хэт бага (3мм-с дээш байх ёстой)',
  COLOR_NOT_CMYK:     '⚠ Өнгийн загвар CMYK биш (CMYK байх ёстой)',
  FONTS_NOT_EMBEDDED: '⚠ Фонт суулгагдаагүй (font embed хийх ёстой)',
}

function tok() { return localStorage.getItem('access_token') || localStorage.getItem('token') || '' }
function hdrs() { return { Authorization: 'Bearer ' + tok() } }
function jhdrs() { return { ...hdrs(), 'Content-Type': 'application/json' } }

export default function DesignerDashboard() {
  const router = useRouter()
  const [user, setUser]           = useState<User | null>(null)
  const [requests, setRequests]   = useState<DesignRequest[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<string>('all')
  const [selected, setSelected]   = useState<DesignRequest | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)
  const fileRef                   = useRef<HTMLInputElement>(null)

  // Prepress checker state
  const [ppForm, setPpForm] = useState({ dpi: 300, bleed_mm: 3, color_mode: 'CMYK', fonts_embedded: true, page_width_mm: 210, page_height_mm: 297 })
  const [ppResult, setPpResult] = useState<{ safe: boolean; issues: string[] } | null>(null)
  const [ppChecking, setPpChecking] = useState(false)
  const [showPp, setShowPp] = useState(false)

  // ── Auth: role guard ──
  useEffect(() => {
    const ud = localStorage.getItem('user')
    const tk = tok()
    if (!ud || !tk) { router.push('/login'); return }
    const parsed: User = JSON.parse(ud)
    if (parsed.role !== 'designer' && parsed.role !== 'admin') {
      router.push('/login')
      return
    }
    setUser(parsed)
    fetchRequests(parsed.id)
  }, [])

  async function fetchRequests(userId: string) {
    setLoading(true)
    try {
      const r = await fetch(`${API}/design-requests/designer/${userId}`, { headers: hdrs() })
      const data = r.ok ? await r.json() : []
      setRequests(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function submitFile(req: DesignRequest, file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch(`${API}/upload/file`, { method: 'POST', headers: hdrs(), body: fd })
      if (!r.ok) throw new Error('Upload failed')
      const data = await r.json()
      const fileUrl: string = data.file_url || data.url || data.path || ''
      if (!fileUrl) throw new Error('No file URL returned')

      const clean = fileUrl.startsWith('http') ? fileUrl : `${API}/${fileUrl.replace(/^\//, '')}`
      const r2 = await fetch(`${API}/design-requests/${req.id}/submit`, {
        method: 'PATCH',
        headers: jhdrs(),
        body: JSON.stringify({ file_url: clean }),
      })
      if (r2.ok) {
        showToast('Файл амжилттай илгээгдлээ ✓')
        const updated = { ...req, file_url: clean, status: 'in_progress' }
        setRequests(prev => prev.map(r => r.id === req.id ? updated : r))
        setSelected(updated)
      } else throw new Error('Submit failed')
    } catch (e: any) {
      showToast('Файл илгээхэд алдаа: ' + (e?.message || ''), false)
    }
    setUploading(false)
  }

  async function runPrepressCheck() {
    setPpChecking(true)
    try {
      const r = await fetch(`${API}/ai/prepress/check`, {
        method: 'POST',
        headers: jhdrs(),
        body: JSON.stringify(ppForm),
      })
      const data = await r.json()
      setPpResult(data)
    } catch {
      showToast('Prepress шалгахад алдаа гарлаа', false)
    }
    setPpChecking(false)
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const counts = { all: requests.length, ...Object.fromEntries(Object.keys(ST_MN).map(k => [k, requests.filter(r => r.status === k).length])) }

  const s: React.CSSProperties = { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }
  const inp: React.CSSProperties = { ...s, width: '100%', padding: '9px 12px', boxSizing: 'border-box' as const }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", color: 'var(--text)' }}>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.ok ? '#1D9E75' : '#e24b4a', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          {toast.msg}
        </div>
      )}

      {/* Topbar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 32px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}><span style={{ color: '#FF6B00' }}>Biz</span>Print</span>
          <span style={{ fontSize: 11, background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '2px 10px' }}>Дизайнер</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{user?.full_name}</span>
          <NotificationBell userId={user?.id} />
          <button onClick={() => router.push('/dashboard/customer/wallet')} style={{ ...s, cursor: 'pointer', fontSize: 12 }}>💳 Хэтэвч</button>
          <button onClick={() => router.push('/dashboard/chat')} style={{ ...s, cursor: 'pointer', fontSize: 12 }}>💬 Чат</button>
          <button onClick={() => { localStorage.clear(); router.push('/') }} style={{ ...s, cursor: 'pointer', fontSize: 12 }}>Гарах</button>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1300, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Дизайнерийн хяналтын самбар</h1>
            <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Миний дизайн хүсэлтүүд · файл дамжуулалт · эх бэлтгэл шалгалт</p>
          </div>
          <button onClick={() => { setShowPp(v => !v); setPpResult(null) }}
            style={{ padding: '9px 18px', background: showPp ? '#8B5CF6' : 'var(--surface)', border: showPp ? '1px solid #8B5CF6' : '1px solid var(--border)', borderRadius: 8, color: showPp ? '#fff' : 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
            🔍 Эх бэлтгэл шалгах (Prepress)
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Нийт',          val: counts.all,         color: '#8B5CF6' },
            { label: 'Хүлээгдэж байна', val: counts.pending || 0, color: '#F59E0B' },
            { label: 'Оноогдсон',     val: counts.assigned || 0, color: '#3B82F6' },
            { label: 'Хийгдэж байна', val: counts.in_progress || 0, color: '#06B6D4' },
            { label: 'Батлагдсан',    val: counts.approved || 0, color: '#10B981' },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', borderTop: '3px solid ' + item.color }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.val}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* ── PREPRESS CHECKER ── */}
        {showPp && (
          <div style={{ background: 'var(--surface)', border: '2px solid rgba(139,92,246,0.3)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🔍 Эх бэлтгэл шалгалт (Prepress Check)</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text2)' }}>Файлын параметрүүдийг хэвлэлтэнд бэлэн эсэхийг шалгана</p>
              </div>
              <button onClick={() => { setShowPp(false); setPpResult(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 20 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, display: 'block' }}>DPI (нарийвчлал)</label>
                <input type="number" value={ppForm.dpi} onChange={e => setPpForm(f => ({ ...f, dpi: +e.target.value }))} style={inp} placeholder="300" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, display: 'block' }}>Цонхивч (bleed) мм</label>
                <input type="number" value={ppForm.bleed_mm} onChange={e => setPpForm(f => ({ ...f, bleed_mm: +e.target.value }))} style={inp} placeholder="3" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, display: 'block' }}>Өнгийн загвар</label>
                <select value={ppForm.color_mode} onChange={e => setPpForm(f => ({ ...f, color_mode: e.target.value }))} style={inp}>
                  <option value="CMYK">CMYK</option>
                  <option value="RGB">RGB</option>
                  <option value="SPOT">Spot color</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, display: 'block' }}>Хуудасны өргөн (мм)</label>
                <input type="number" value={ppForm.page_width_mm} onChange={e => setPpForm(f => ({ ...f, page_width_mm: +e.target.value }))} style={inp} placeholder="210" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, display: 'block' }}>Хуудасны өндөр (мм)</label>
                <input type="number" value={ppForm.page_height_mm} onChange={e => setPpForm(f => ({ ...f, page_height_mm: +e.target.value }))} style={inp} placeholder="297" />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', paddingBottom: 9 }}>
                  <input type="checkbox" checked={ppForm.fonts_embedded} onChange={e => setPpForm(f => ({ ...f, fonts_embedded: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: '#8B5CF6' }} />
                  Фонт суулгасан (embed)
                </label>
              </div>
            </div>
            <button onClick={runPrepressCheck} disabled={ppChecking}
              style={{ padding: '10px 24px', background: ppChecking ? 'var(--border)' : '#8B5CF6', color: '#fff', border: 'none', borderRadius: 8, cursor: ppChecking ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13 }}>
              {ppChecking ? 'Шалгаж байна...' : '🔍 Шалгах'}
            </button>

            {ppResult && (
              <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 10, background: ppResult.safe ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${ppResult.safe ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: ppResult.safe ? '#10B981' : '#EF4444', marginBottom: ppResult.issues.length ? 10 : 0 }}>
                  {ppResult.safe ? '✅ Файл хэвлэлтэнд бэлэн байна' : '❌ Засвар шаарлагатай зүйлс олдлоо'}
                </div>
                {ppResult.issues.map(issue => (
                  <div key={issue} style={{ fontSize: 13, color: '#EF4444', marginTop: 5 }}>
                    {ISSUE_MN[issue] || issue}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          {[
            { key: 'all',         label: `Бүгд (${counts.all})` },
            { key: 'assigned',    label: 'Оноогдсон' },
            { key: 'in_progress', label: 'Хийгдэж байна' },
            { key: 'approved',    label: 'Батлагдсан' },
            { key: 'rejected',    label: 'Татгалзсан' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ background: 'none', border: 'none', padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: filter === f.key ? '#8B5CF6' : 'var(--text2)', borderBottom: filter === f.key ? '2px solid #8B5CF6' : '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap' }}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 20 }}>

          {/* Requests table */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.8fr 1fr 80px', padding: '10px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              <span>Бүтээгдэхүүн / Хэрэглэгч</span><span>Тайлбар</span><span>Zoom</span><span>Төлөв</span><span>Файл</span>
            </div>

            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎨</div>
                <div style={{ fontWeight: 600 }}>Дизайн хүсэлт байхгүй байна</div>
                <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>Админ таны нэр дээр хүсэлт оноох үед энд харагдана</div>
              </div>
            ) : filtered.map((req, i) => {
              const st = ST_MN[req.status] || { label: req.status, color: '#888' }
              return (
                <div key={req.id}
                  onClick={() => setSelected(selected?.id === req.id ? null : req)}
                  style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.8fr 1fr 80px', padding: '12px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', fontSize: 13, cursor: 'pointer', background: selected?.id === req.id ? 'rgba(139,92,246,0.06)' : 'transparent' }}
                  onMouseEnter={e => { if (selected?.id !== req.id) e.currentTarget.style.background = 'var(--surface2)' }}
                  onMouseLeave={e => { if (selected?.id !== req.id) e.currentTarget.style.background = 'transparent' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{req.product_name || 'Нэргүй'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{req.customer_name || req.customer_email || '—'}</div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.description || '—'}</span>
                  <div>
                    {req.designer_zoom ? (
                      <a href={req.designer_zoom} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(99,102,241,0.1)', color: '#6366F1', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(99,102,241,0.3)' }}>
                        📹 Zoom
                      </a>
                    ) : <span style={{ fontSize: 12, color: 'var(--text3)' }}>—</span>}
                  </div>
                  <span style={{ background: st.color + '18', color: st.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, width: 'fit-content' }}>
                    {st.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {req.file_url ? <span style={{ fontSize: 16 }} title="Файл илгээгдсэн">📎</span> : <span style={{ fontSize: 14, color: 'var(--text3)' }}>—</span>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, height: 'fit-content', position: 'sticky', top: 74 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Хүсэлтийн дэлгэрэнгүй</div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 20 }}>×</button>
              </div>

              {/* Info */}
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                {[
                  { label: 'Бүтээгдэхүүн', val: selected.product_name },
                  { label: 'Хэрэглэгч', val: selected.customer_name },
                  { label: 'Имэйл', val: selected.customer_email },
                  { label: 'Утас', val: selected.customer_phone },
                  { label: 'Огноо', val: selected.created_at ? new Date(selected.created_at).toLocaleDateString('mn-MN') : '—' },
                ].filter(i => i.val).map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text2)' }}>{item.label}</span>
                    <span style={{ fontWeight: 500 }}>{item.val}</span>
                  </div>
                ))}
                {selected.description && (
                  <div style={{ marginTop: 8, padding: '8px 0', fontSize: 13 }}>
                    <div style={{ color: 'var(--text2)', marginBottom: 4 }}>Тайлбар</div>
                    <div>{selected.description}</div>
                  </div>
                )}
              </div>

              {/* Zoom meeting */}
              {selected.designer_zoom && (
                <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>📹</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Zoom уулзалт</div>
                    <a href={selected.designer_zoom} target="_blank" rel="noreferrer"
                      style={{ fontSize: 13, color: '#6366F1', fontWeight: 600, textDecoration: 'none', wordBreak: 'break-all' }}>
                      {selected.designer_zoom}
                    </a>
                  </div>
                  <a href={selected.designer_zoom} target="_blank" rel="noreferrer"
                    style={{ padding: '7px 14px', background: '#6366F1', color: '#fff', borderRadius: 7, fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Нэгдэх →
                  </a>
                </div>
              )}

              {/* Workflow */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.07em' }}>Ажлын урсгал</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {WORKFLOW.map((step, i) => {
                    const curIdx = WORKFLOW.findIndex(w => w.status === selected.status)
                    const isDone = i <= curIdx
                    const isCur = step.status === selected.status
                    return (
                      <div key={step.status} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: isCur ? 'rgba(139,92,246,0.08)' : 'transparent', border: isCur ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent' }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: isDone ? '#8B5CF6' : 'var(--border)', color: isDone ? '#fff' : 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {isDone ? '✓' : i + 1}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: isCur ? 600 : 400, color: isCur ? '#8B5CF6' : isDone ? 'var(--text)' : 'var(--text2)' }}>
                          {step.icon} {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* File section */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.07em' }}>📁 Файл дамжуулалт</div>

                {/* Customer file */}
                {selected.file_url && (
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>Хэрэглэгчийн файл</div>
                    <a href={selected.file_url.startsWith('http') ? selected.file_url : `${API}/${selected.file_url}`}
                      target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#378ADD', fontSize: 13, textDecoration: 'none' }}>
                      <span>📎</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {selected.file_url.split('/').pop()}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, background: 'rgba(55,138,221,0.1)', border: '1px solid rgba(55,138,221,0.3)', borderRadius: 5, padding: '2px 7px' }}>Татах</span>
                    </a>
                  </div>
                )}

                {/* Upload final file */}
                {selected.status !== 'approved' && (
                  <div style={{ background: 'var(--surface2)', border: '1px dashed rgba(139,92,246,0.4)', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
                      {selected.status === 'in_progress' ? '✅ Файл илгээгдсэн — дахин илгээх бол:' : 'Боловсруулсан файлыг илгээх'}
                    </div>
                    <input ref={fileRef} type="file" accept=".pdf,.ai,.psd,.eps,.png,.jpg" style={{ display: 'none' }}
                      onChange={e => { if (e.target.files?.[0]) submitFile(selected, e.target.files[0]) }} />
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                      style={{ padding: '8px 18px', background: uploading ? 'var(--border)' : '#8B5CF6', color: '#fff', border: 'none', borderRadius: 8, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
                      {uploading ? 'Илгээж байна...' : '📤 Файл илгээх'}
                    </button>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>PDF, AI, PSD, EPS, PNG, JPG</div>
                  </div>
                )}
              </div>

              {/* Status badge */}
              <div style={{ padding: '10px 14px', borderRadius: 8, background: (ST_MN[selected.status]?.color || '#888') + '15', border: `1px solid ${(ST_MN[selected.status]?.color || '#888')}30`, textAlign: 'center', fontSize: 13, fontWeight: 600, color: ST_MN[selected.status]?.color || '#888' }}>
                {ST_MN[selected.status]?.label || selected.status}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
