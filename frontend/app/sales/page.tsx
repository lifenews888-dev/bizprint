'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'

const API = 'http://localhost:4000'
const BASE_URL = 'http://localhost:3000'

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

const ST_MN: Record<string, string> = {
  pending:       'Хүлээгдэж байна',
  paid:          'Төлөгдсөн',
  in_production: 'Хэвлэж байна',
  completed:     'Дууссан',
  shipped:       'Хүргэгдсэн',
  cancelled:     'Цуцлагдсан',
}
const ST_CLR: Record<string, string> = {
  pending: '#F59E0B', paid: '#378ADD', in_production: '#8B5CF6',
  completed: '#10B981', shipped: '#1D9E75', cancelled: '#e24b4a',
}

function tok() { return localStorage.getItem('access_token') || localStorage.getItem('token') || '' }
function hdrs() { return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() } }

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
  const [user, setUser]         = useState<User | null>(null)
  const [referral, setReferral] = useState<ReferralData | null>(null)
  const [orders, setOrders]     = useState<Order[]>([])
  const [loading, setLoading]   = useState(true)
  const [copied, setCopied]     = useState(false)

  useEffect(() => {
    const ud = localStorage.getItem('user')
    const tk = tok()
    if (!ud || !tk) { router.push('/login'); return }
    const u = JSON.parse(ud)
    if (u.role !== 'sales' && u.role !== 'admin') { router.push('/login'); return }
    setUser(u)
    Promise.all([
      fetch(API + '/referral/my', { headers: hdrs() }).then(r => r.ok ? r.json() : null),
      fetch(API + '/orders/customer/' + u.id, { headers: hdrs() }).then(r => r.ok ? r.json() : []),
    ]).then(([ref, ord]) => {
      if (ref) setReferral(ref)
      setOrders(Array.isArray(ord) ? ord : [])
      setLoading(false)
    })
  }, [])

  const refLink = referral ? BASE_URL + '/register?ref=' + referral.code : ''
  const totalRev = orders.reduce((s, o) => s + Number(o.total_price), 0)
  const commission = referral ? (totalRev * Number(referral.commission_rate)) / 100 : 0

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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Segoe UI',system-ui,sans-serif", color: 'var(--text)' }}>

      {/* Topbar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 32px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}><span style={{ color: '#FF6B00' }}>Biz</span>Print</span>
          <span style={{ fontSize: 11, background: 'rgba(255,107,0,0.1)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.3)', borderRadius: 20, padding: '2px 10px' }}>Борлуулагч</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{user?.full_name}</span>
          <NotificationBell userId={user?.id} />
          <button onClick={() => { localStorage.clear(); router.push('/') }}
            style={{ ...inp, cursor: 'pointer', fontSize: 12 }}>
            Гарах
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Борлуулалтын хяналтын самбар</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Рефэрал линк, комисс, захиалгын хяналт</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Нийт захиалга',  val: orders.length,                        color: '#FF6B00' },
            { label: 'Дууссан',        val: orders.filter(o=>o.status==='completed').length, color: '#10B981' },
            { label: 'Нийт орлого',    val: totalRev.toLocaleString()+'₮',         color: '#378ADD' },
            { label: 'Комисс ('+(referral?.commission_rate||10)+'%)', val: commission.toLocaleString()+'₮', color: '#8B5CF6' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'18px 20px', borderTop:'3px solid '+s.color }}>
              <div style={{ fontSize:22, fontWeight:700, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20, marginBottom:24 }}>

          {/* Referral card */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:24 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>Таны Рефэрал линк</div>
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
                    { label:'✉️ Имэйл', color:'#6366F1', href:'mailto:?body='+encodeURIComponent(refLink) },
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
                Рефэрал мэдээлэл байхгүй байна
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
      </div>
    </div>
  )
}
