'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://bizprint-production.up.railway.app'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

function getToken() { return typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('token') || '') : '' }
function getHeaders() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` } }

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:       { label: 'Хүлээгдэж буй', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  paid:          { label: 'Төлөгдсөн',     color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  in_design:     { label: 'Дизайнд',       color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  in_production: { label: 'Үйлдвэрлэлд',  color: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
  completed:     { label: 'Дууссан',        color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  delivered:     { label: 'Хүргэгдсэн',    color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' },
  cancelled:     { label: 'Цуцлагдсан',    color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
}

// ── Mini Bar Chart ──
function MiniBar({ data, height = 120 }: { data: { label: string; value: number; color: string }[]; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: d.color }}>{d.value}</span>
          <div style={{ width: '100%', maxWidth: 36, height: `${Math.max((d.value / max) * (height - 36), 4)}px`, background: d.color, borderRadius: '4px 4px 2px 2px', transition: 'height 0.6s ease', opacity: 0.85 }} />
          <span style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.2 }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Sparkline ──
function Sparkline({ values, color = '#FF6B00', width = 200, height = 40 }: { values: number[]; color?: string; width?: number; height?: number }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const points = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ')
  const areaPoints = points + ` ${width},${height} 0,${height}`
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polygon points={areaPoints} fill={color} opacity="0.08" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(values.length - 1) / (values.length - 1) * width} cy={height - ((values[values.length - 1] - min) / range) * (height - 4) - 2} r="3" fill={color} />
    </svg>
  )
}

// ── Pipeline Step ──
function PipelineStep({ label, count, color, total, icon }: { label: string; count: number; color: string; total: number; icon: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginBottom: 6 }}>{count}</div>
      <div style={{ height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [wallets, setWallets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/login'); return }
    try { const u = JSON.parse(localStorage.getItem('user') || '{}'); setUser(u) } catch {}

    Promise.all([
      fetch(`${API}/orders`, { headers: getHeaders() }).then(r => r.json()).catch(() => []),
      fetch(`${API}/admin/users`, { headers: getHeaders() }).then(r => r.json()).catch(() => []),
      fetch(`${API}/quotes-v2`, { headers: getHeaders() }).then(r => r.json()).catch(() => []),
      fetch(`${API}/wallet/withdraw-requests`, { headers: getHeaders() }).then(r => r.json()).catch(() => []),
    ]).then(([o, u, q, w]) => {
      setOrders(Array.isArray(o) ? o : [])
      setUsers(Array.isArray(u) ? u : [])
      setQuotes(Array.isArray(q) ? q : [])
      setWallets(Array.isArray(w) ? w : [])
    }).finally(() => setLoading(false))
  }, [])

  // ── Computed Stats ──
  const stats = useMemo(() => {
    const totalRevenue = orders.filter(o => ['paid', 'completed', 'delivered', 'in_production', 'in_design'].includes(o.status))
      .reduce((s, o) => s + Number(o.total_price || 0), 0)
    const pendingRevenue = orders.filter(o => o.status === 'pending').reduce((s, o) => s + Number(o.total_price || 0), 0)
    const todayOrders = orders.filter(o => {
      const d = new Date(o.created_at)
      const now = new Date()
      return d.toDateString() === now.toDateString()
    })

    // Status breakdown
    const statusCounts: Record<string, number> = {}
    orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1 })

    // Daily revenue (last 7 days)
    const dailyRevenue: number[] = []
    const dailyLabels: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toDateString()
      const dayTotal = orders.filter(o => new Date(o.created_at).toDateString() === ds)
        .reduce((s, o) => s + Number(o.total_price || 0), 0)
      dailyRevenue.push(dayTotal)
      dailyLabels.push(d.toLocaleDateString('mn', { month: 'short', day: 'numeric' }))
    }

    // User role breakdown
    const roleCounts: Record<string, number> = {}
    users.forEach(u => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1 })

    return { totalRevenue, pendingRevenue, todayOrders, statusCounts, dailyRevenue, dailyLabels, roleCounts }
  }, [orders, users])

  const statusBarData = Object.entries(STATUS_CFG).map(([key, cfg]) => ({
    label: cfg.label, value: stats.statusCounts[key] || 0, color: cfg.color,
  })).filter(d => d.value > 0 || ['pending', 'in_production', 'completed'].includes(
    Object.entries(STATUS_CFG).find(([, c]) => c.label === d.label)?.[0] || ''
  ))

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontFamily: F }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Dashboard ачаалж байна...</p>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '20px 24px 40px', fontFamily: F, color: 'var(--text)', maxWidth: 1400 }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>Dashboard</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>
            BizPrint экосистемийн хяналтын самбар — <strong style={{ color: '#FF6B00' }}>{user?.email || 'Admin'}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ padding: '6px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: 12, color: '#10B981', fontWeight: 500 }}>
            ● Өнөөдөр {stats.todayOrders.length} захиалга
          </div>
          <div style={{ padding: '6px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
            {new Date().toLocaleDateString('mn', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }} className="grid-4">
        {[
          { label: 'Нийт орлого', value: `₮${stats.totalRevenue.toLocaleString()}`, sub: 'Төлөгдсөн захиалгууд', color: '#10B981', icon: '💰' },
          { label: 'Хүлээгдэж буй', value: `₮${stats.pendingRevenue.toLocaleString()}`, sub: `${stats.statusCounts.pending || 0} захиалга`, color: '#F59E0B', icon: '⏳' },
          { label: 'Нийт захиалга', value: orders.length.toString(), sub: `${stats.todayOrders.length} өнөөдөр`, color: '#FF6B00', icon: '📋' },
          { label: 'Хэрэглэгчид', value: users.length.toString(), sub: `${stats.roleCounts.vendor || 0} vendor, ${stats.roleCounts.designer || 0} designer`, color: '#3B82F6', icon: '👥' },
          { label: 'Үнийн санал', value: quotes.length.toString(), sub: 'Quotes-v2', color: '#8B5CF6', icon: '🧮' },
          { label: 'Татах хүсэлт', value: wallets.filter((w:any) => w.status === 'pending').length.toString(), sub: wallets.filter((w:any) => w.status === 'pending').reduce((s:number,w:any)=>s+Number(w.amount),0).toLocaleString()+'₮ хүлээгдэж байна', color: '#F97316', icon: '💸' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: kpi.color, opacity: 0.7 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{kpi.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: kpi.color, letterSpacing: '-0.5px' }}>{kpi.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{kpi.sub}</div>
              </div>
              <span style={{ fontSize: 28, opacity: 0.5 }}>{kpi.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ ORDER PIPELINE ═══ */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Захиалгын Pipeline</h2>
          <a href="/admin/orders" style={{ fontSize: 12, color: '#FF6B00', textDecoration: 'none' }}>Бүгдийг харах →</a>
        </div>
        <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 4 }}>
          <PipelineStep label="Хүлээгдэж буй" count={stats.statusCounts.pending || 0} color="#F59E0B" total={orders.length} icon="📝" />
          <div style={{ width: 1, background: 'var(--border)', flexShrink: 0, margin: '8px 0' }} />
          <PipelineStep label="Дизайнд" count={stats.statusCounts.in_design || 0} color="#8B5CF6" total={orders.length} icon="🎨" />
          <div style={{ width: 1, background: 'var(--border)', flexShrink: 0, margin: '8px 0' }} />
          <PipelineStep label="Үйлдвэрлэлд" count={stats.statusCounts.in_production || 0} color="#EC4899" total={orders.length} icon="🏭" />
          <div style={{ width: 1, background: 'var(--border)', flexShrink: 0, margin: '8px 0' }} />
          <PipelineStep label="Хүргэлтэнд" count={(stats.statusCounts.delivering || 0) + (stats.statusCounts.shipped || 0)} color="#06B6D4" total={orders.length} icon="🚚" />
          <div style={{ width: 1, background: 'var(--border)', flexShrink: 0, margin: '8px 0' }} />
          <PipelineStep label="Дууссан" count={(stats.statusCounts.completed || 0) + (stats.statusCounts.delivered || 0)} color="#10B981" total={orders.length} icon="✅" />
        </div>
      </div>

      {/* ═══ CHARTS ROW ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 24 }} className="grid-2">

        {/* Revenue Trend */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Орлогын чиг хандлага (7 хоног)</h2>
          <p style={{ fontSize: 12, color: 'var(--text3)', margin: '0 0 16px' }}>Өдөр тутмын орлого</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 140 }}>
            {stats.dailyRevenue.map((val, i) => {
              const max = Math.max(...stats.dailyRevenue, 1)
              const h = Math.max((val / max) * 110, 4)
              const isToday = i === stats.dailyRevenue.length - 1
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  {val > 0 && <span style={{ fontSize: 10, color: isToday ? '#FF6B00' : 'var(--text3)', fontWeight: isToday ? 600 : 400 }}>₮{(val / 1000000).toFixed(1)}M</span>}
                  <div style={{ width: '100%', maxWidth: 48, height: h, background: isToday ? '#FF6B00' : 'rgba(255,107,0,0.25)', borderRadius: '4px 4px 2px 2px', transition: 'height 0.8s ease' }} />
                  <span style={{ fontSize: 10, color: isToday ? '#FF6B00' : 'var(--text3)', fontWeight: isToday ? 600 : 400 }}>{stats.dailyLabels[i]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status Distribution */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Захиалгын төлөв</h2>
          <p style={{ fontSize: 12, color: 'var(--text3)', margin: '0 0 16px' }}>Нийт {orders.length}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(STATUS_CFG).map(([key, cfg]) => {
              const count = stats.statusCounts[key] || 0
              if (count === 0) return null
              const pct = orders.length > 0 ? (count / orders.length) * 100 : 0
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: cfg.color, fontWeight: 500 }}>{cfg.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: cfg.color, borderRadius: 3, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM ROW ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: 14 }} className="grid-2">

        {/* Recent Orders */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Сүүлийн захиалгууд</h2>
            <a href="/admin/orders" style={{ fontSize: 12, color: '#FF6B00', textDecoration: 'none' }}>Бүгдийг →</a>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  {['ID', 'Хэрэглэгч', 'Бүтээгдэхүүн', 'Дүн', 'Төлөв', 'Огноо'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500, whiteSpace: 'nowrap', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map(o => {
                  const sc = STATUS_CFG[o.status] || { label: o.status, color: '#888', bg: 'rgba(136,136,136,0.1)' }
                  return (
                    <tr key={o.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: 'var(--text3)', fontSize: 11 }}>#{o.id?.slice(0, 8)}</td>
                      <td style={{ padding: '10px 16px', fontWeight: 500, fontSize: 13 }}>{o.customer_name || o.customer_email || '-'}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text2)', fontSize: 12 }}>{o.product_name || '-'}</td>
                      <td style={{ padding: '10px 16px', color: '#FF6B00', fontWeight: 600 }}>₮{Number(o.total_price || 0).toLocaleString()}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: sc.bg, color: sc.color, fontWeight: 600, whiteSpace: 'nowrap' }}>{sc.label}</span>
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--text3)', fontSize: 12 }}>{o.created_at ? new Date(o.created_at).toLocaleDateString() : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions + User Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Quick Actions */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Шууд үйлдлүүд</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Захиалгууд', href: '/admin/orders', icon: '📦', color: '#FF6B00' },
                { label: 'Шинэ бүтээгдэхүүн', href: '/admin/products', icon: '➕', color: '#3B82F6' },
                { label: 'Үнийн дүрэм', href: '/admin/pricing-rules', icon: '💲', color: '#8B5CF6' },
                { label: 'Workflow', href: '/admin/workflow', icon: '⚙️', color: '#10B981' },
                { label: 'Баннер засах', href: '/admin/banners', icon: '🖼️', color: '#F59E0B' },
              ].map(a => (
                <a key={a.href} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, textDecoration: 'none', color: 'var(--text)', fontSize: 13, transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ fontSize: 16 }}>{a.icon}</span>
                  <span style={{ fontWeight: 500 }}>{a.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>→</span>
                </a>
              ))}
            </div>
          </div>

          {/* User Roles Breakdown */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Хэрэглэгчдийн бүтэц</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { role: 'admin', label: 'Админ', color: '#FF6B00' },
                { role: 'vendor', label: 'Vendor', color: '#8B5CF6' },
                { role: 'designer', label: 'Дизайнер', color: '#3B82F6' },
                { role: 'sales', label: 'Борлуулалт', color: '#F59E0B' },
                { role: 'courier', label: 'Курьер', color: '#10B981' },
                { role: 'user', label: 'Хэрэглэгч', color: '#888' },
              ].map(r => {
                const count = stats.roleCounts[r.role] || 0
                if (count === 0 && !['admin', 'vendor', 'user'].includes(r.role)) return null
                return (
                  <div key={r.role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{r.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: r.color }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* System Status */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Системийн төлөв</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Backend API', status: 'online', color: '#10B981' },
                { label: 'WebSocket Chat', status: 'online', color: '#10B981' },
                { label: 'Database', status: 'online', color: '#10B981' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: s.color + '15', color: s.color, fontWeight: 600 }}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
