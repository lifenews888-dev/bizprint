'use client'
import { apiFetch, API_URL, getToken } from '@/lib/api'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import KpiCard from '@/components/dashboard/KpiCard'
import { useRoleGuard } from '@/lib/use-role-guard'
import { DESIGNER_MENU } from '@/config/sidebar-config'

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
  pending: '\u0425\u04af\u043b\u044d\u044d\u0433\u0434\u044d\u0436 \u0431\u0430\u0439\u043d\u0430',
  paid: '\u0422\u04e9\u043b\u04e9\u0433\u0434\u0441\u04e9\u043d',
  in_production: '\u0425\u044d\u0432\u043b\u044d\u0436 \u0431\u0430\u0439\u043d\u0430',
  completed: '\u0414\u0443\u0443\u0441\u0441\u0430\u043d',
  shipped: '\u0425\u04af\u0440\u0433\u044d\u0433\u0434\u0441\u044d\u043d',
  cancelled: '\u0426\u0443\u0446\u043b\u0430\u0433\u0434\u0441\u0430\u043d',
}
const ST_CLR: Record<string, string> = {
  pending: '#F59E0B', paid: '#378ADD', in_production: '#8B5CF6',
  completed: '#10B981', shipped: '#1D9E75', cancelled: '#e24b4a',
}

const WORKFLOW = [
  { status: 'pending',       label: '\u0425\u04af\u043b\u044d\u044d\u0433\u0434\u044d\u0436 \u0431\u0430\u0439\u043d\u0430', icon: '\u23f3' },
  { status: 'paid',          label: '\u0422\u04e9\u043b\u04e9\u0433\u0434\u0441\u04e9\u043d',        icon: '\ud83d\udcb3' },
  { status: 'in_production', label: '\u0425\u044d\u0432\u043b\u044d\u0436 \u0431\u0430\u0439\u043d\u0430',   icon: '\ud83d\udda8\ufe0f' },
  { status: 'completed',     label: '\u0414\u0443\u0443\u0441\u0441\u0430\u043d',         icon: '\u2705' },
]

type FilterType = 'all' | 'pending' | 'paid' | 'in_production' | 'completed'

export default function DesignerDashboard() {
  const router = useRouter()
  const { user: guardUser, loading: authLoading } = useRoleGuard(['designer', 'admin'])
  const [user, setUser]         = useState<User | null>(null)
  const [orders, setOrders]     = useState<Order[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<FilterType>('all')
  const [selected, setSelected] = useState<Order | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (authLoading) return
    const ud = localStorage.getItem('user')
    const tk = getToken()
    if (!ud || !tk) { router.push('/login'); return }
    setUser(JSON.parse(ud))
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      const r = await apiFetch<any>('/admin/orders')
      setOrders(r)
    } catch {}
    setLoading(false)
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function updateStatus(order: Order, status: string) {
    try {
      await apiFetch<any>('/orders/' + order.id, {
        method: 'PATCH',
        body: { status },
      })
      showToast('\u0422\u04e9\u043b\u04e9\u0432 \u0448\u0438\u043d\u044d\u0447\u043b\u044d\u0433\u0434\u043b\u044d\u044d \u2713')
      const updated = { ...order, status }
      setOrders(prev => prev.map(o => o.id === order.id ? updated : o))
      setSelected(updated)
    } catch { showToast('\u0410\u043b\u0434\u0430\u0430 \u0433\u0430\u0440\u043b\u0430\u0430', false) }
  }

  async function uploadFile(order: Order, file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const uploadData = await apiFetch<any>('/upload/file', { method: 'POST', body: fd })
      if (!uploadData) throw new Error()
      const url = uploadData.url || uploadData.file_url || uploadData.filename
      await apiFetch<any>('/orders/' + order.id, {
        method: 'PATCH',
        body: { file_url: url },
      })
      showToast('\u0424\u0430\u0439\u043b \u0430\u043c\u062c\u0438\u043b\u0442\u0430\u0439 \u0438\u043b\u044d\u0433\u0434\u043b\u044d\u044d \u2713')
      const updated = { ...order, file_url: url }
      setOrders(prev => prev.map(o => o.id === order.id ? updated : o))
      setSelected(updated)
    } catch { showToast('\u0424\u0430\u0439\u043b \u0438\u043b\u044d\u0433\u044d\u0445 \u0430\u043b\u0434\u0430\u0430', false) }
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

  if (authLoading) return <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Ачааллаж байна...</div>

  return (
    <DashboardLayout navGroups={DESIGNER_MENU} user={user || guardUser || undefined}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.ok ? '#1D9E75' : '#e24b4a', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Дизайнерийн удирдлага</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Захиалгын дизайн, файл дамжуулалт, workflow</p>
      </div>

      <KpiCard items={[
        { label: 'Нийт захиалга', value: stats.total, color: 'purple', icon: '🎨' },
        { label: 'Хүлээгдэж байна', value: stats.pending, color: 'orange', icon: '⏳' },
        { label: 'Хэвлэж байна', value: stats.inProd, color: 'blue', icon: '🖨️' },
        { label: 'Дууссан', value: stats.done, color: 'green', icon: '✅' },
      ]} />

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
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.07em' }}>Workflow</div>
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
                    <a href={API_URL + '/' + selected.file_url} target="_blank" rel="noreferrer"
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
    </DashboardLayout>
  )
}
