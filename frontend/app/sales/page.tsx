'use client'
import { apiFetch, getToken } from '@/lib/api'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import KpiCard from '@/components/dashboard/KpiCard'
import { useRoleGuard } from '@/lib/use-role-guard'
import { SALES_MENU } from '@/config/sidebar-config'
import { useOrderEvents } from '@/hooks/useOrderEvents'

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')

interface ReferralData {
  code: string
  commission_rate: number
  total_commission: number
  referral_count: number
  is_active: boolean
}

interface Order {
  id: string
  quantity: number
  total_price: number
  status: string
  created_at: string
}

interface User {
  id: string
  email: string
  full_name: string
  role: string
}

interface SalesSummary {
  totalOrders: number
  pendingAmount: number
  paidAmount: number
  totalRevenue: number
}

interface LeaderboardRow {
  rank: number
  salesUserId: string
  orderCount: number
  totalCommission: number
  totalRevenue: number
}

interface SalesCommissionRow {
  id: string
  order_id: string
  order_total: number
  commission_amount: number
  commission_rate: number
  status: string
  created_at: string
}

const isUser = (value: unknown): value is User => {
  if (!value || typeof value !== 'object') return false
  const user = value as Partial<User>
  return typeof user.id === 'string' && typeof user.role === 'string'
}

const parseStoredUser = (raw: string): User | null => {
  try {
    const parsed: unknown = JSON.parse(raw)
    return isUser(parsed) ? parsed : null
  } catch {
    return null
  }
}

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

function QRCode({ code }: { code: string }) {
  const cells: boolean[] = []
  for (let i = 0; i < 25; i++) {
    const ch = code.charCodeAt(i % code.length)
    cells.push((ch + i) % 2 === 0)
  }
  return (
    <div style={{ width: 160, height: 160, background: '#fff', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 10, border: '1px solid var(--border)' }}>
      <svg width="130" height="130" viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="35" height="35" rx="3" fill="none" stroke="#000" strokeWidth="4"/>
        <rect x="12" y="12" width="21" height="21" rx="2" fill="#000"/>
        <rect x="90" y="5" width="35" height="35" rx="3" fill="none" stroke="#000" strokeWidth="4"/>
        <rect x="97" y="12" width="21" height="21" rx="2" fill="#000"/>
        <rect x="5" y="90" width="35" height="35" rx="3" fill="none" stroke="#000" strokeWidth="4"/>
        <rect x="12" y="97" width="21" height="21" rx="2" fill="#000"/>
        {cells.map((on, i) => on ? (
          <rect key={i} x={48 + (i % 5) * 9} y={48 + Math.floor(i / 5) * 9} width="7" height="7" fill="#000"/>
        ) : null)}
      </svg>
      <div style={{ fontSize: 11, color: '#888', fontFamily: 'monospace', fontWeight: 700, marginTop: 4 }}>{code}</div>
    </div>
  )
}

export default function SalesDashboard() {
  const router = useRouter()
  const { user: guardUser, loading: authLoading } = useRoleGuard(['sales', 'admin'])
  const [user, setUser]               = useState<User | null>(null)
  const [referral, setReferral]       = useState<ReferralData | null>(null)
  const [orders, setOrders]           = useState<Order[]>([])
  const [commissions, setCommissions] = useState<SalesCommissionRow[]>([])
  const [summary, setSummary]         = useState<SalesSummary | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [loading, setLoading]         = useState(true)
  const [copied, setCopied]           = useState(false)

  const loadStats = useCallback(() => {
    Promise.all([
      apiFetch<ReferralData | null>('/referral/my').catch(() => null),
      apiFetch<SalesCommissionRow[]>('/commission/sales/me').catch(() => []),
      apiFetch<SalesSummary | null>('/commission/sales/me/summary').catch(() => null),
      apiFetch<LeaderboardRow[]>('/commission/sales/leaderboard').catch(() => []),
    ]).then(([ref, comms, sum, board]) => {
      if (ref) setReferral(ref)
      setCommissions(Array.isArray(comms) ? comms : [])
      if (sum) setSummary(sum)
      setLeaderboard(Array.isArray(board) ? board : [])
      setOrders((Array.isArray(comms) ? comms : []).map((c: SalesCommissionRow) => ({
        id: c.order_id,
        quantity: 1,
        total_price: c.order_total,
        status: c.status,
        created_at: c.created_at,
      })))
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (authLoading) return
    const ud = localStorage.getItem('user')
    const tk = getToken()
    if (!ud || !tk) { router.push('/login'); return }
    const u = parseStoredUser(ud)
    if (!u) { router.push('/login'); return }
    const userTimer = window.setTimeout(() => setUser(u), 0)
    loadStats()
    return () => window.clearTimeout(userTimer)
  }, [authLoading, loadStats, router])

  // Live updates: refresh whenever an attributed order is paid or finished
  // so the agent sees their commission update without a refresh.
  useOrderEvents({
    rooms: user?.id ? [`user:${user.id}`] : [],
    onChange: loadStats,
    enabled: !!user?.id,
  })

  const refLink = referral ? BASE_URL + '/register?ref=' + referral.code : ''
  const totalRev = summary?.totalRevenue ?? 0
  const commission = summary ? (summary.pendingAmount + summary.paidAmount) : 0
  const myRank = leaderboard.find(l => l.salesUserId === user?.id)?.rank

  function copyLink() {
    navigator.clipboard.writeText(refLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const inp: React.CSSProperties = { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text2)' }}>
      Уншиж байна...
    </div>
  )

  if (authLoading) return <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Ачааллаж байна...</div>

  return (
    <DashboardLayout navGroups={SALES_MENU} user={user || guardUser || undefined}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Борлуулалтын удирдлага</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Referral линк, комисс, захиалгын хяналт</p>
        </div>

        <KpiCard items={[
          { label: 'Миний захиалгууд', value: summary?.totalOrders ?? 0, color: 'orange', icon: '📋' },
          { label: 'Нийт борлуулалт', value: totalRev.toLocaleString()+'₮', color: 'blue', icon: '💰' },
          { label: 'Хүлээгдэж буй шагнал', value: (summary?.pendingAmount ?? 0).toLocaleString()+'₮', color: 'purple', icon: '⏳' },
          { label: 'Нийт олсон шагнал', value: commission.toLocaleString()+'₮', color: 'green', icon: '🎯' },
        ]} />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20, marginBottom:24 }}>

          {/* Referral card */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:24 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>Таны Referral линк</div>
            <div style={{ fontSize:12, color:'var(--text2)', marginBottom:20 }}>Энэ линкээр бүртгүүлсэн хэрэглэгч бүрт комисс авна</div>

            {referral ? (
              <>
                {/* Code */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <div style={{ background:'rgba(255,107,0,0.08)', border:'1px solid rgba(255,107,0,0.3)', borderRadius:8, padding:'10px 18px' }}>
                    <div style={{ fontSize:11, color:'var(--text2)', marginBottom:2 }}>Таны код</div>
                    <div style={{ fontSize:24, fontWeight:800, letterSpacing:4, color:'#FF6B00', fontFamily:'monospace' }}>{referral.code}</div>
                  </div>
                  <div style={{ background:referral.is_active?'rgba(16,185,129,0.1)':'var(--surface2)', border:'1px solid', borderColor:referral.is_active?'#10B981':'var(--border)', borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:600, color:referral.is_active?'#10B981':'var(--text2)' }}>
                    {referral.is_active ? '● Идэвхтэй' : '○ Идэвхгүй'}
                  </div>
                </div>

                {/* Link */}
                <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ flex:1, fontSize:12, fontFamily:'monospace', color:'#FF6B00', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{refLink}</div>
                  <button onClick={copyLink}
                    style={{ background:copied?'#10B981':'#FF6B00', color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', cursor:'pointer', fontSize:12, fontWeight:600, flexShrink:0, transition:'background 0.2s' }}>
                    {copied ? '✓ Хуулагдлаа' : 'Хуулах'}
                  </button>
                </div>

                {/* Share */}
                <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                  {[
                    { label:'📘 Facebook', color:'#1877F2', href:'https://facebook.com/sharer/sharer.php?u='+encodeURIComponent(refLink) },
                    { label:'✉️ Email', color:'#6366F1', href:'mailto:?body='+encodeURIComponent(refLink) },
                  ].map(s=>(
                    <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                      style={{ flex:1, textAlign:'center', padding:'8px', background:s.color+'15', border:'1px solid '+s.color+'44', borderRadius:8, fontSize:12, fontWeight:600, color:s.color, textDecoration:'none' }}>
                      {s.label}
                    </a>
                  ))}
                </div>

                {/* Mini stats */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px', textAlign:'center' }}>
                    <div style={{ fontSize:22, fontWeight:700, color:'#FF6B00' }}>{referral.referral_count}</div>
                    <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>Бүртгүүлсэн</div>
                  </div>
                  <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px', textAlign:'center' }}>
                    <div style={{ fontSize:18, fontWeight:700, color:'#8B5CF6' }}>{Number(referral.total_commission).toLocaleString()}₮</div>
                    <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>Нийт комисс</div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding:24, textAlign:'center', color:'var(--text2)', background:'var(--surface2)', borderRadius:8 }}>
                Referral мэдээлэл байхгүй байна
              </div>
            )}
          </div>

          {/* QR card */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:24, display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>QR Код</div>
            <div style={{ fontSize:12, color:'var(--text2)', marginBottom:20, textAlign:'center' }}>Хэрэглэгчид QR уншуулж бүртгүүлнэ</div>
            {referral ? (
              <>
                <QRCode code={referral.code} />
                <button onClick={()=>window.print()}
                  style={{ marginTop:16, padding:'9px 0', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'var(--text)', width:'100%' }}>
                  🖨️ Хэвлэх
                </button>
              </>
            ) : (
              <div style={{ color:'var(--text2)', fontSize:13 }}>—</div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontWeight:700, fontSize:15 }}>🏆 Тэргүүлэгчид</span>
              {myRank && <span style={{ fontSize:12, color:'#FF6B00', fontWeight:600 }}>Таны байр: #{myRank}</span>}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {leaderboard.slice(0, 10).map(row => {
                const isMe = row.salesUserId === user?.id
                return (
                  <div key={row.salesUserId} style={{
                    display:'grid',
                    gridTemplateColumns:'40px 1fr 100px 120px',
                    gap:12,
                    padding:'10px 14px',
                    borderRadius:8,
                    background: isMe ? 'rgba(255,107,0,0.08)' : 'var(--surface2)',
                    border: isMe ? '1px solid #FF6B00' : '1px solid transparent',
                    alignItems:'center',
                    fontSize:13,
                  }}>
                    <span style={{ fontSize:16, fontWeight:700, color: row.rank === 1 ? '#FFD700' : row.rank === 2 ? '#C0C0C0' : row.rank === 3 ? '#CD7F32' : 'var(--text2)' }}>
                      {row.rank <= 3 ? ['🥇','🥈','🥉'][row.rank - 1] : `#${row.rank}`}
                    </span>
                    <span style={{ fontFamily:'monospace', fontSize:12, color:'var(--text2)' }}>
                      {isMe ? 'Та' : row.salesUserId.slice(0, 8) + '…'}
                    </span>
                    <span style={{ textAlign:'right' }}>{row.orderCount} захиалга</span>
                    <span style={{ textAlign:'right', fontWeight:700, color:'#10B981' }}>
                      {Number(row.totalCommission).toLocaleString()}₮
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Commissions detail */}
        {commissions.length > 0 && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:24 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>💸 Шагналын дэлгэрэнгүй</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {commissions.slice(0, 8).map(c => (
                <div key={c.id} style={{
                  display:'grid',
                  gridTemplateColumns:'1fr 100px 80px 100px',
                  gap:12,
                  padding:'8px 12px',
                  borderRadius:6,
                  background:'var(--surface2)',
                  fontSize:12,
                  alignItems:'center',
                }}>
                  <code style={{ color:'var(--text2)' }}>#{c.order_id.slice(0, 8)}</code>
                  <span style={{ textAlign:'right' }}>{Number(c.order_total).toLocaleString()}₮</span>
                  <span style={{ textAlign:'right', color:'var(--text3)' }}>{c.commission_rate}%</span>
                  <span style={{ textAlign:'right', fontWeight:600, color: c.status === 'approved' || c.status === 'paid' ? '#10B981' : '#F59E0B' }}>
                    {Number(c.commission_amount).toLocaleString()}₮ {c.status === 'pending' ? '⏳' : '✓'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:700, fontSize:15 }}>Захиалгууд</span>
            <button onClick={()=>router.push('/order')}
              style={{ background:'#FF6B00', color:'#fff', border:'none', borderRadius:8, padding:'7px 16px', cursor:'pointer', fontSize:13, fontWeight:600 }}>
              + Шинэ захиалга
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 0.6fr 1fr 1fr 0.9fr', padding:'10px 20px', background:'var(--surface2)', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.07em' }}>
            <span>ID</span><span>Тоо</span><span>Дүн</span><span>Огноо</span><span>Төлөв</span>
          </div>
          {orders.length === 0 ? (
            <div style={{ padding:48, textAlign:'center', color:'var(--text2)' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📦</div>
              <div style={{ fontWeight:600 }}>Захиалга байхгүй байна</div>
            </div>
          ) : orders.slice(0,8).map((o,i)=>(
            <div key={o.id} style={{ display:'grid', gridTemplateColumns:'1fr 0.6fr 1fr 1fr 0.9fr', padding:'12px 20px', borderBottom:i<orders.length-1?'1px solid var(--border)':'none', alignItems:'center', fontSize:13 }}>
              <code style={{ fontSize:12, color:'var(--text2)' }}>{o.id.slice(0,10)}...</code>
              <span>{o.quantity} ш</span>
              <span style={{ fontWeight:600, color:'#FF6B00' }}>{Number(o.total_price).toLocaleString()}₮</span>
              <span style={{ color:'var(--text2)' }}>{new Date(o.created_at).toLocaleDateString('mn-MN')}</span>
              <span style={{ background:(ST_CLR[o.status]||'#888')+'20', color:ST_CLR[o.status]||'#888', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:600 }}>
                {ST_MN[o.status]||o.status}
              </span>
            </div>
          ))}
        </div>
    </DashboardLayout>
  )
}
