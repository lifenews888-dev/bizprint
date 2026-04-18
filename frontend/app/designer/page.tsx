'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'

const API = 'http://localhost:4000'

interface Order {
  id: string
  quantity: number
  total_price: number
  status: string
  product_type?: string
  created_at: string
  file_url?: string
  notes?: string
  customer?: { full_name: string; email: string }
  options?: Record<string, string>
}

interface User { id: string; email: string; full_name: string; role: string }

const ST_MN: Record<string, string> = {
  pending:       'Хүлээгдэж байна',
  paid:          'Төлөгдсөн',
  in_design:     'Дизайнд байна',
  in_production: 'Хэвлэж байна',
  completed:     'Дууссан',
  shipped:       'Хүргэгдсэн',
  cancelled:     'Цуцлагдсан',
}
const ST_CLR: Record<string, string> = {
  pending: '#F59E0B', paid: '#378ADD', in_design: '#8B5CF6',
  in_production: '#8B5CF6', completed: '#10B981', shipped: '#1D9E75', cancelled: '#e24b4a',
}

const WORKFLOW = [
  { status: 'pending',       label: 'Хүлээгдэж байна', icon: '⏳' },
  { status: 'paid',          label: 'Төлөгдсөн',       icon: '💳' },
  { status: 'in_design',     label: 'Дизайнд байна',   icon: '🎨' },
  { status: 'in_production', label: 'Хэвлэж байна',    icon: '🖨️' },
  { status: 'completed',     label: 'Дууссан',          icon: '✅' },
]

function tok() { return localStorage.getItem('access_token') || localStorage.getItem('token') || '' }
function hdrs() { return { Authorization: 'Bearer ' + tok() } }

type FilterType = 'all' | 'pending' | 'paid' | 'in_production' | 'completed'

export default function DesignerDashboard() {
  const router = useRouter()
  const [user, setUser]         = useState<User | null>(null)
  const [orders, setOrders]     = useState<Order[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<FilterType>('all')
  const [selected, setSelected] = useState<Order | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const ud = localStorage.getItem('user')
    const tk = tok()
    if (!ud || !tk) { router.push('/login'); return }
    setUser(JSON.parse(ud))
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      // /orders is open (no admin guard) and returns all orders
      const r = await fetch(API + '/orders', { headers: hdrs() })
      const data = r.ok ? await r.json() : []
      setOrders(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function updateStatus(order: Order, status: string) {
    try {
      const r = await fetch(API + '/orders/' + order.id + '/status', {
        method: 'PATCH',
        headers: { ...hdrs(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (r.ok) {
        showToast('Төлөв шинэчлэгдлээ ✓')
        const updated = { ...order, status }
        setOrders(prev => prev.map(o => o.id === order.id ? updated : o))
        setSelected(updated)
      } else showToast('Алдаа гарлаа', false)
    } catch { showToast('Алдаа гарлаа', false) }
  }

  async function uploadFile(order: Order, file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      // Strip auth header for multipart — token is in Authorization only
      const uploadHeaders: Record<string, string> = { Authorization: 'Bearer ' + tok() }
      const r = await fetch(API + '/upload/file', { method: 'POST', headers: uploadHeaders, body: fd })
      if (!r.ok) throw new Error('Upload failed')
      const data = await r.json()
      const file_url: string = data.file_url || data.url || ''
      if (!file_url) throw new Error('No file_url in response')

      // Attach the uploaded file URL to the order and set status to in_design
      const r2 = await fetch(API + '/orders/' + order.id + '/status', {
        method: 'PATCH',
        headers: { ...hdrs(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url, status: 'in_design' }),
      })
      if (r2.ok) {
        showToast('Файл амжилттай илэгдлээ ✓')
        const updated = { ...order, file_url, status: 'in_design' }
        setOrders(prev => prev.map(o => o.id === order.id ? updated : o))
        setSelected(updated)
      } else throw new Error('Order update failed')
    } catch (e: any) {
      showToast('Файл илэгэх алдаа: ' + (e?.message || ''), false)
    }
    setUploading(false)
  }

  const filtered = orders.filter(o => filter === 'all' || o.status === filter)
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    inProd: orders.filter(o => o.status === 'in_production').length,
    done: orders.filter(o => o.status === 'completed').length,
  }

  const s: React.CSSProperties = { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Segoe UI',system-ui,sans-serif", color: 'var(--text)' }}>

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
          <button onClick={() => router.push('/dashboard/wallet')} style={{ ...s, cursor: 'pointer', fontSize: 12 }}>💳 Хэтэвч</button>
          <button onClick={() => { localStorage.clear(); router.push('/') }} style={{ ...s, cursor: 'pointer', fontSize: 12 }}>Гарах</button>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1300, margin: '0 auto' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Дизайнерийн хяналтын самбар</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Захиалгын дизайн, файл дамжуулалт, ажлын урсгал</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Нийт захиалга',   val: stats.total,   color: '#8B5CF6' },
            { label: 'Хүлээгдэж байна', val: stats.pending, color: '#F59E0B' },
            { label: 'Хэвлэж байна',    val: stats.inProd,  color: '#3B82F6' },
            { label: 'Дууссан',         val: stats.done,    color: '#10B981' },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', borderTop: '3px solid ' + item.color }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.val}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* File transfer info banner */}
        <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>📁</span>
          <div style={{ fontSize: 13, color: 'var(--text)' }}>
            <strong>Файл дамжуулалтын workflow:</strong> Хэрэглэгч → файл upload → Дизайнер засварлана → Үйлдвэрт илгээнэ
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 20 }}>

          {/* Orders table */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Filter tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 4px', overflowX: 'auto' }}>
              {([
                { key: 'all', label: 'Бүгд (' + orders.length + ')' },
                { key: 'pending', label: 'Хүлээгдэж байна' },
                { key: 'paid', label: 'Төлөгдсөн' },
                { key: 'in_production', label: 'Хэвлэж байна' },
                { key: 'completed', label: 'Дууссан' },
              ] as { key: FilterType; label: string }[]).map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{ background: 'none', border: 'none', padding: '12px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: filter === f.key ? '#8B5CF6' : 'var(--text2)', borderBottom: filter === f.key ? '2px solid #8B5CF6' : '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap' }}>
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.7fr 0.8fr 1fr 60px', padding: '10px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              <span>ID</span><span>Бүтээгдэхүүн</span><span>Тоо</span><span>Дүн</span><span>Төлөв</span><span>Файл</span>
            </div>

            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎨</div>
                <div style={{ fontWeight: 600 }}>Захиалга байхгүй байна</div>
              </div>
            ) : filtered.map((o, i) => (
              <div key={o.id}
                onClick={() => setSelected(selected?.id === o.id ? null : o)}
                style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.7fr 0.8fr 1fr 60px', padding: '12px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', fontSize: 13, cursor: 'pointer', background: selected?.id === o.id ? 'rgba(139,92,246,0.06)' : 'transparent' }}
                onMouseEnter={e => { if (selected?.id !== o.id) e.currentTarget.style.background = 'var(--surface2)' }}
                onMouseLeave={e => { if (selected?.id !== o.id) e.currentTarget.style.background = 'transparent' }}>
                <code style={{ fontSize: 11, color: 'var(--text2)' }}>{o.id.slice(0, 10)}...</code>
                <span style={{ fontSize: 12 }}>{o.product_type || '—'}</span>
                <span>{o.quantity} ш</span>
                <span style={{ fontWeight: 600, color: '#FF6B00' }}>{Number(o.total_price).toLocaleString()}₮</span>
                <span style={{ background: (ST_CLR[o.status] || '#888') + '20', color: ST_CLR[o.status] || '#888', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, width: 'fit-content' }}>
                  {ST_MN[o.status] || o.status}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {o.file_url ? (
                    <span style={{ fontSize: 16 }} title="Файл байна">📎</span>
                  ) : (
                    <span style={{ fontSize: 14, color: 'var(--text3)' }}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, height: 'fit-content', position: 'sticky', top: 74 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Захиалгын дэлгэрэнгүй</div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 20 }}>×</button>
              </div>

              {/* Info */}
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'ID', val: selected.id.slice(0, 12) + '...' },
                    { label: 'Тоо', val: selected.quantity + ' ш' },
                    { label: 'Дүн', val: Number(selected.total_price).toLocaleString() + '₮' },
                    { label: 'Огноо', val: new Date(selected.created_at).toLocaleDateString('mn-MN') },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{item.val}</div>
                    </div>
                  ))}
                </div>
              </div>

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
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>Хэрэглэгчийн файл</div>
                  {selected.file_url ? (
                    <a href={API + '/' + selected.file_url} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#378ADD', fontSize: 13, textDecoration: 'none' }}>
                      <span>📎</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selected.file_url.split('/').pop()}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, background: 'rgba(55,138,221,0.1)', border: '1px solid rgba(55,138,221,0.3)', borderRadius: 5, padding: '2px 7px' }}>Татах</span>
                    </a>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Хэрэглэгч файл оруулаагүй байна</div>
                  )}
                </div>

                {/* Upload designer file */}
                <div style={{ background: 'var(--surface2)', border: '1px dashed var(--border)', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>Дизайнерын боловсруулсан файл үйлдвэрт илгээх</div>
                  <input ref={fileRef} type="file" accept=".pdf,.ai,.psd,.eps,.png,.jpg" style={{ display: 'none' }}
                    onChange={e => { if (e.target.files?.[0]) uploadFile(selected, e.target.files[0]) }} />
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    style={{ padding: '8px 18px', background: uploading ? 'var(--border)' : '#8B5CF6', color: '#fff', border: 'none', borderRadius: 8, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
                    {uploading ? 'Илгээж байна...' : '📤 Файл илгээх'}
                  </button>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>PDF, AI, PSD, EPS, PNG, JPG</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.07em' }}>Төлөв өөрчлөх</div>
                {selected.status === 'pending' && (
                  <button onClick={() => updateStatus(selected, 'in_production')}
                    style={{ padding: '10px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                    🖨️ Хэвлэлд оруулах
                  </button>
                )}
                {selected.status === 'paid' && (
                  <button onClick={() => updateStatus(selected, 'in_production')}
                    style={{ padding: '10px', background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                    🖨️ Хэвлэлд оруулах
                  </button>
                )}
                {selected.status === 'in_production' && (
                  <button onClick={() => updateStatus(selected, 'completed')}
                    style={{ padding: '10px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                    ✅ Дууссан гэж тэмдэглэх
                  </button>
                )}
                {selected.status === 'completed' && (
                  <div style={{ padding: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid #10B981', borderRadius: 8, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#10B981' }}>
                    ✓ Захиалга дууссан
                  </div>
                )}
                {!['completed', 'cancelled'].includes(selected.status) && (
                  <button onClick={() => updateStatus(selected, 'cancelled')}
                    style={{ padding: '10px', background: 'rgba(226,75,74,0.08)', color: '#e24b4a', border: '1px solid rgba(226,75,74,0.3)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    ✕ Цуцлах
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
