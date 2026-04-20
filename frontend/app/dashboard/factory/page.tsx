'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const API = 'http://localhost:4000'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const H = () => {
  const t = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('token')) : ''
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }
}
const fmt = (n: number) => Number(n).toLocaleString('mn-MN')
const fmtDate = (d: string) => new Date(d).toLocaleDateString('mn-MN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

// ─── Types ────────────────────────────────────────────────────────────────────

interface Job {
  id: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string
  order: {
    id: string
    customer_name: string
    customer_phone: string
    product_name: string
    quantity: number
    total_price: number
    width_mm: number | null
    height_mm: number | null
    paper_gsm: number | null
    color_mode: string | null
    sides: string | null
    finishing: string | null
    notes: string | null
    created_at: string
    file_url: string | null
  } | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; bg: string; next?: string; action?: string }> = {
  pending:     { label: 'Хүлээгдэж буй', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',   next: 'in_progress', action: 'Эхлүүлэх' },
  in_progress: { label: 'Хийгдэж байна',  color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  next: 'completed',   action: 'Дуусгах'   },
  completed:   { label: 'Дуусгасан',       color: '#10B981', bg: 'rgba(16,185,129,0.1)',  next: undefined,     action: undefined   },
  cancelled:   { label: 'Цуцлагдсан',      color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   next: undefined,     action: undefined   },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FactoryDashboard() {
  const router = useRouter()
  const [jobs, setJobs]             = useState<Job[]>([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState<string>('all')
  const [updating, setUpdating]     = useState<number | null>(null)
  const [editNotes, setEditNotes]   = useState<Record<number, string>>({})
  const [savingNote, setSavingNote] = useState<number | null>(null)
  const [expanded, setExpanded]     = useState<number | null>(null)
  const [files, setFiles]           = useState<Record<string, any[]>>({})

  // ── Auth + role guard ──
  useEffect(() => {
    const ud = localStorage.getItem('user')
    const tk = localStorage.getItem('access_token') || localStorage.getItem('token')
    if (!ud || !tk) { router.push('/login'); return }
    const u = JSON.parse(ud)
    if (u.role !== 'factory' && u.role !== 'admin') { router.push('/login') }
  }, [])

  const load = useCallback(() => {
    fetch(`${API}/production-jobs`, { headers: H() })
      .then(r => r.json())
      .then(d => setJobs(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [load])

  async function updateStatus(job: Job, status: string) {
    setUpdating(job.id)
    try {
      await fetch(`${API}/production-jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: H(),
        body: JSON.stringify({ status }),
      })
      load()
    } catch { /* ignore */ }
    setUpdating(null)
  }

  async function saveNote(job: Job) {
    setSavingNote(job.id)
    try {
      await fetch(`${API}/production-jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: H(),
        body: JSON.stringify({ status: job.status, notes: editNotes[job.id] }),
      })
      setEditNotes(prev => { const c = { ...prev }; delete c[job.id]; return c })
      load()
    } catch { /* ignore */ }
    setSavingNote(null)
  }

  async function loadFiles(orderId: string) {
    if (files[orderId]) return
    try {
      const d = await fetch(`${API}/order-files?order_id=${orderId}`, { headers: H() }).then(r => r.json())
      setFiles(prev => ({ ...prev, [orderId]: Array.isArray(d) ? d : [] }))
    } catch { setFiles(prev => ({ ...prev, [orderId]: [] })) }
  }

  function toggleExpand(job: Job) {
    const next = expanded === job.id ? null : job.id
    setExpanded(next)
    if (next && job.order) loadFiles(job.order.id)
  }

  // ── Derived stats ──────────────────────────────────────────────────────────

  const todayStr = new Date().toDateString()
  const stats = {
    pending:     jobs.filter(j => j.status === 'pending').length,
    in_progress: jobs.filter(j => j.status === 'in_progress').length,
    completed:   jobs.filter(j => j.status === 'completed' && new Date(j.updated_at).toDateString() === todayStr).length,
    total:       jobs.length,
  }

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', fontFamily: F }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text, #111)' }}>🏭 Үйлдвэрийн самбар</h1>
          <p style={{ fontSize: 13, color: 'var(--text2, #888)', margin: '4px 0 0' }}>
            Production jobs — 30 секунд тутамд автомат шинэчлэгддэг
          </p>
        </div>
        <button
          onClick={load}
          style={{ padding: '8px 16px', background: 'var(--surface, #fff)', border: '1px solid var(--border, #E5E7EB)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text2, #888)' }}
        >
          🔄 Шинэчлэх
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Хүлээгдэж буй', value: stats.pending,     color: '#F59E0B', icon: '⏳' },
          { label: 'Хийгдэж байна',  value: stats.in_progress, color: '#3B82F6', icon: '⚙️' },
          { label: 'Өнөөдөр дуусгасан', value: stats.completed, color: '#10B981', icon: '✅' },
          { label: 'Нийт job',        value: stats.total,      color: '#6B7280', icon: '📋' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border, #E5E7EB)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text2, #888)', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['all', 'Бүгд'], ['pending', 'Хүлээгдэж буй'], ['in_progress', 'Хийгдэж байна'], ['completed', 'Дуусгасан'], ['cancelled', 'Цуцлагдсан']].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: filter === v ? 700 : 400, background: filter === v ? '#FF6B00' : 'var(--surface, #fff)', color: filter === v ? '#fff' : 'var(--text2, #888)', boxShadow: filter === v ? 'none' : '0 0 0 1px var(--border, #E5E7EB)' }}
          >
            {l}
            {v !== 'all' && <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.8 }}>({jobs.filter(j => j.status === v).length})</span>}
          </button>
        ))}
      </div>

      {/* Job list */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text2, #888)' }}>Уншиж байна...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text2, #888)', background: 'var(--surface, #fff)', borderRadius: 12, border: '1px dashed var(--border, #E5E7EB)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏭</div>
          <div style={{ fontWeight: 600 }}>Job байхгүй байна</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(job => {
            const meta   = STATUS_META[job.status] ?? STATUS_META.pending
            const order  = job.order
            const isOpen = expanded === job.id
            const hasNote = job.id in editNotes

            return (
              <div
                key={job.id}
                style={{ background: 'var(--surface, #fff)', border: `1px solid ${isOpen ? 'rgba(255,107,0,0.3)' : 'var(--border, #E5E7EB)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}
              >
                {/* ── Job row ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto', alignItems: 'center', padding: '14px 20px', gap: 16 }}>

                  {/* Job # */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#FF6B00' }}>#{job.id}</div>
                    <div style={{ fontSize: 10, color: 'var(--text2, #888)' }}>{fmtDate(job.created_at).split(' ')[0]}</div>
                  </div>

                  {/* Main info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text, #111)' }}>
                        {order?.product_name || '—'}
                      </span>
                      <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                      {order?.quantity && (
                        <span style={{ fontSize: 12, color: 'var(--text2, #888)', background: 'var(--surface2, #F3F4F6)', padding: '2px 8px', borderRadius: 6 }}>
                          {order.quantity.toLocaleString()} ш
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text2, #888)', marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {order?.customer_name && <span>👤 {order.customer_name}</span>}
                      {order?.customer_phone && <span>📞 {order.customer_phone}</span>}
                      {order?.total_price && <span style={{ color: '#FF6B00', fontWeight: 600 }}>₮{fmt(order.total_price)}</span>}
                      {order?.color_mode && <span>🎨 {order.color_mode}</span>}
                      {order?.sides && <span>📄 {order.sides === 'double' ? '2 тал' : '1 тал'}</span>}
                      {order?.paper_gsm && <span>📦 {order.paper_gsm}г/м²</span>}
                      {order?.width_mm && order?.height_mm && (
                        <span>📐 {order.width_mm}×{order.height_mm}мм</span>
                      )}
                    </div>
                    {job.notes && (
                      <div style={{ fontSize: 12, color: 'var(--text2, #888)', marginTop: 4, fontStyle: 'italic' }}>
                        📝 {job.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {meta.next && meta.action && (
                      <button
                        onClick={() => updateStatus(job, meta.next!)}
                        disabled={updating === job.id}
                        style={{ padding: '8px 16px', background: meta.next === 'in_progress' ? '#3B82F6' : '#10B981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: updating === job.id ? 0.6 : 1 }}
                      >
                        {updating === job.id ? '⏳' : meta.action}
                      </button>
                    )}
                    <button
                      onClick={() => toggleExpand(job)}
                      style={{ padding: '8px 12px', background: 'var(--surface2, #F3F4F6)', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2, #888)' }}
                    >
                      {isOpen ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* ── Expanded detail ── */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border, #E5E7EB)', padding: '16px 20px', background: 'var(--surface2, #F9FAFB)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                      {/* Left: order details */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2, #888)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Захиалгын дэлгэрэнгүй</div>
                        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                          <tbody>
                            {[
                              ['Захиалгын ID', order?.id ? order.id.slice(0, 12) + '…' : '—'],
                              ['Огноо', order?.created_at ? fmtDate(order.created_at) : '—'],
                              ['Хэмжээ', order?.width_mm && order?.height_mm ? `${order.width_mm} × ${order.height_mm} мм` : '—'],
                              ['Цаас', order?.paper_gsm ? `${order.paper_gsm} г/м²` : '—'],
                              ['Өнгө', order?.color_mode || '—'],
                              ['Хэвлэх тал', order?.sides === 'double' ? '2 тал' : order?.sides === 'single' ? '1 тал' : '—'],
                              ['Боловсруулалт', order?.finishing && order.finishing !== 'none' ? order.finishing : '—'],
                              ['Тэмдэглэл', order?.notes || '—'],
                            ].map(([k, v]) => (
                              <tr key={k}>
                                <td style={{ padding: '4px 0', color: 'var(--text2, #888)', width: 130 }}>{k}</td>
                                <td style={{ padding: '4px 0', fontWeight: 500, color: 'var(--text, #111)' }}>{v}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Right: files + notes */}
                      <div>
                        {/* Files */}
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2, #888)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                          Хэвлэлийн файлууд
                        </div>
                        {order && (
                          files[order.id] === undefined ? (
                            <div style={{ fontSize: 13, color: 'var(--text2, #888)' }}>Уншиж байна...</div>
                          ) : files[order.id].length === 0 ? (
                            <div style={{ fontSize: 13, color: 'var(--text2, #888)' }}>Файл бэлэн болоогүй байна</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {files[order.id].map((f: any) => (
                                <a
                                  key={f.id}
                                  href={`${API}${f.path}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, textDecoration: 'none', fontSize: 13 }}
                                >
                                  <span style={{ fontSize: 16 }}>📄</span>
                                  <span style={{ color: 'var(--text, #111)', fontWeight: 500 }}>{f.filename}</span>
                                  <span style={{ marginLeft: 'auto', color: '#10B981', fontSize: 11, fontWeight: 600 }}>Татах ↗</span>
                                </a>
                              ))}
                            </div>
                          )
                        )}

                        {/* Notes */}
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2, #888)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, marginTop: 16 }}>
                          Үйлдвэрийн тэмдэглэл
                        </div>
                        <textarea
                          value={hasNote ? editNotes[job.id] : (job.notes || '')}
                          onChange={e => setEditNotes(prev => ({ ...prev, [job.id]: e.target.value }))}
                          placeholder="Тэмдэглэл оруулах..."
                          rows={3}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border, #E5E7EB)', borderRadius: 8, fontSize: 13, fontFamily: F, resize: 'vertical', boxSizing: 'border-box', background: 'var(--surface, #fff)', color: 'var(--text, #111)', outline: 'none' }}
                        />
                        {hasNote && (
                          <button
                            onClick={() => saveNote(job)}
                            disabled={savingNote === job.id}
                            style={{ marginTop: 6, padding: '7px 16px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: savingNote === job.id ? 0.7 : 1 }}
                          >
                            {savingNote === job.id ? '⏳ Хадгалж байна...' : 'Хадгалах'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Cancel button */}
                    {job.status !== 'completed' && job.status !== 'cancelled' && (
                      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border, #E5E7EB)' }}>
                        <button
                          onClick={() => updateStatus(job, 'cancelled')}
                          disabled={updating === job.id}
                          style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                        >
                          Цуцлах
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
