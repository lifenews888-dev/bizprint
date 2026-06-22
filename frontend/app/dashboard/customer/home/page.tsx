'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const O = '#FF6B00'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Ноорог', color: '#6B7280' },
  quotation_sent: { label: 'Үнийн санал', color: '#8B5CF6' },
  confirmed: { label: 'Баталгаажсан', color: '#2563EB' },
  pending_file: { label: 'Файл хүлээж буй', color: '#D97706' },
  file_review: { label: 'Файл шалгаж буй', color: '#D97706' },
  file_rejected: { label: 'Файл буцаагдсан', color: '#DC2626' },
  in_production: { label: 'Үйлдвэрлэлд', color: '#DB2777' },
  finishing: { label: 'Боловсруулалт', color: '#DB2777' },
  dispatched: { label: 'Илгээгдсэн', color: '#059669' },
  delivered: { label: 'Хүргэгдсэн', color: '#047857' },
  completed: { label: 'Дууссан', color: '#047857' },
  cancelled: { label: 'Цуцлагдсан', color: '#DC2626' },
}

const WORKFLOW = ['draft','quotation_sent','confirmed','pending_file','file_review','in_production','finishing','dispatched','delivered','completed']
const WORKFLOW_LABELS = ['Захиалга','Төлбөр','Дизайн','Хавтал','Хүргэлт','Дууссан']

interface DashboardData {
  kpis: { total_orders: number; active_orders: number; pending_quotes: number; total_spent: number; completed: number }
  wallet: { balance: number; total_earned: number }
  recent_orders: CustomerOrder[]
  active_orders: CustomerOrder[]
  quotes: CustomerQuote[]
  suggestions: { icon: string; title: string; description: string; action?: string }[]
}

interface CustomerOrder {
  id: string
  status: string
  product_name?: string
  quantity?: number
  created_at: string
  total_price?: number | string
}

interface CustomerQuote {
  id: string
  product_name?: string
  quote_number?: string
  created_at: string
  total_price?: number | string
}

interface StoredUser {
  full_name?: string
}

export default function CustomerHomePage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [user, setUser] = useState<StoredUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const timer = window.setTimeout(() => {
      if (stored) try { setUser(JSON.parse(stored) as StoredUser) } catch {}
    }, 0)

    apiFetch<DashboardData>('/customer-dashboard/summary')
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))

    return () => window.clearTimeout(timer)
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Өглөөний мэнд'
    if (h < 18) return 'Өдрийн мэнд'
    return 'Оройн мэнд'
  }

  if (loading) return (
    <div style={{ padding: 40, fontFamily: F, color: 'var(--text3)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ height: 80, background: 'var(--surface)', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )

  const kpis = data?.kpis || { total_orders: 0, active_orders: 0, pending_quotes: 0, total_spent: 0, completed: 0 }

  return (
    <div style={{ padding: '24px 28px', fontFamily: F, maxWidth: 1100, margin: '0 auto' }}>
      {/* ── Greeting ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px', color: 'var(--text)' }}>
          {greeting()}, {user?.full_name || 'Хэрэглэгч'} 👋
        </h1>
        <p style={{ color: 'var(--text3)', fontSize: 14, margin: 0 }}>
          Таны хэвлэлийн захиалгуудын хураангуй
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <KpiCard label="ИДЭВХТЭЙ" value={kpis.active_orders} sub="захиалга" color="#8B5CF6" bg="rgba(139,92,246,0.1)" />
        <KpiCard label="ҮНИЙН САНАЛ" value={kpis.pending_quotes} sub="хүлээдэж буй" color="#3B82F6" bg="rgba(59,130,246,0.1)" />
        <KpiCard label="ЗАРЦУУЛСАН" value={`₮${kpis.total_spent.toLocaleString()}`} sub={`${kpis.total_orders} захиалга`} color="#10B981" bg="rgba(16,185,129,0.1)" />
        <KpiCard label="ДУУССАН" value={kpis.completed} sub="амжилттай" color="#047857" bg="rgba(4,120,87,0.1)" />
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
        <QuickAction icon="📦" label="Шинэ захиалга" onClick={() => router.push('/dashboard/customer/new-order')} />
        <QuickAction icon="💰" label="Үнэ тооцоо" onClick={() => router.push('/dashboard/customer/quote-calc')} />
        <QuickAction icon="🛒" label="Marketplace" onClick={() => router.push('/dashboard/customer/shop')} />
        <QuickAction icon="🪪" label="Нэрийн хуудас" onClick={() => router.push('/business-cards')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* ── Left Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Active Orders Tracker */}
          {(data?.active_orders?.length || 0) > 0 && (
            <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Идэвхтэй захиалга</h2>
                <button onClick={() => router.push('/dashboard/customer/orders')} style={{ background: 'none', border: 'none', color: O, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Бүгдийг харах →</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data!.active_orders.map(o => (
                  <ActiveOrderCard key={o.id} order={o} onClick={() => router.push('/dashboard/customer/orders')} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Сүүлийн захиалга</h2>
              <button onClick={() => router.push('/dashboard/customer/orders')} style={{ background: 'none', border: 'none', color: O, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Бүгдийг харах →</button>
            </div>
            {(data?.recent_orders?.length || 0) === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
                Захиалга байхгүй. Эхний захиалгаа өгөөрэй!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data!.recent_orders.map(o => {
                  const s = STATUS_LABELS[o.status] || { label: o.status, color: '#6B7280' }
                  return (
                    <div key={o.id} onClick={() => router.push('/dashboard/customer/orders')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2, rgba(0,0,0,0.03))')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{o.product_name || 'Захиалга'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>#{o.id?.slice(0,8)} · {o.quantity}ш · {new Date(o.created_at).toLocaleDateString('mn-MN')}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>₮{Number(o.total_price || 0).toLocaleString()}</div>
                        <span style={{ padding: '2px 8px', borderRadius: 20, background: `${s.color}18`, color: s.color, fontSize: 11, fontWeight: 600 }}>{s.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Wallet */}
          <div style={{ background: `linear-gradient(135deg, ${O} 0%, #E55A00 100%)`, borderRadius: 16, padding: '20px 22px', color: '#fff' }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Хэтэвч</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>₮{(data?.wallet?.balance || 0).toLocaleString()}</div>
            <button onClick={() => router.push('/dashboard/customer/wallet')} style={{ marginTop: 12, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '7px 14px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Дэлгэрэнгүй →
            </button>
          </div>

          {/* AI Suggestions */}
          {(data?.suggestions?.length || 0) > 0 && (
            <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 22px' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Санал болгох</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data!.suggestions.map((s, i) => (
                  <div key={i} onClick={() => s.action && router.push(s.action)} style={{
                    padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)',
                    cursor: s.action ? 'pointer' : 'default', transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => s.action && (e.currentTarget.style.background = 'var(--surface2, rgba(0,0,0,0.03))')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.4 }}>{s.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Quotes */}
          {(data?.quotes?.length || 0) > 0 && (
            <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 22px' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Үнийн саналууд</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data!.quotes.map(q => (
                  <div key={q.id} onClick={() => router.push('/dashboard/customer/quotes')} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{q.product_name || q.quote_number}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(q.created_at).toLocaleDateString('mn-MN')}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: O }}>₮{Number(q.total_price || 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )
}

function KpiCard({ label, value, sub, color, bg }: { label: string; value: string | number; sub: string; color: string; bg: string }) {
  return (
    <div style={{ background: bg, borderRadius: 14, padding: '18px 20px', border: `1px solid ${color}22` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: '16px 10px', borderRadius: 12, border: '1px solid var(--border)',
      background: 'var(--surface)', cursor: 'pointer', transition: 'all 0.15s',
      color: 'var(--text)',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = O; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
    </button>
  )
}

function ActiveOrderCard({ order, onClick }: { order: CustomerOrder; onClick: () => void }) {
  const s = STATUS_LABELS[order.status] || { label: order.status, color: '#6B7280' }
  const stageIndex = WORKFLOW.indexOf(order.status)
  const progress = stageIndex >= 0 ? Math.round(((stageIndex + 1) / WORKFLOW.length) * 100) : 10

  return (
    <div onClick={onClick} style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2, rgba(0,0,0,0.03))')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{order.product_name || 'Захиалга'}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>#{order.id?.slice(0,8)}</div>
        </div>
        <span style={{ padding: '3px 10px', borderRadius: 20, background: `${s.color}18`, color: s.color, fontSize: 11, fontWeight: 600, height: 'fit-content' }}>{s.label}</span>
      </div>
      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: s.color, borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{WORKFLOW_LABELS[Math.min(Math.floor(stageIndex / 2), WORKFLOW_LABELS.length - 1)] || 'Захиалга'}</span>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{progress}%</span>
      </div>
    </div>
  )
}
