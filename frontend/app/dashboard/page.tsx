'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API = 'http://localhost:4000'
const getToken = () => localStorage.getItem('access_token') || localStorage.getItem('token') || ''
const getH = () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() })

const ST: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Хүлээгдэж буй', color: '#D97706', bg: '#FEF3C7' },
  paid: { label: 'Төлөгдсөн', color: '#2563EB', bg: '#DBEAFE' },
  designing: { label: 'Дизайн хийгдэж байна', color: '#7C3AED', bg: '#EDE9FE' },
  prepress: { label: 'Prepress', color: '#0891B2', bg: '#CFFAFE' },
  printing: { label: 'Хэвлэгдэж байна', color: '#DB2777', bg: '#FCE7F3' },
  in_production: { label: 'Үйлдвэрлэлд', color: '#DB2777', bg: '#FCE7F3' },
  finishing: { label: 'Finishing', color: '#2563EB', bg: '#DBEAFE' },
  qc: { label: 'Чанарын шалгалт', color: '#EA580C', bg: '#FFEDD5' },
  ready: { label: 'Бэлэн болсон', color: '#059669', bg: '#D1FAE5' },
  delivering: { label: 'Хүргэлтэнд', color: '#4F46E5', bg: '#E0E7FF' },
  shipped: { label: 'Хүргэгдсэн', color: '#059669', bg: '#D1FAE5' },
  completed: { label: 'Амжилттай дууссан', color: '#047857', bg: '#D1FAE5' },
  delivered: { label: 'Хүргэгдсэн', color: '#047857', bg: '#D1FAE5' },
  cancelled: { label: 'Цуцлагдсан', color: '#DC2626', bg: '#FEE2E2' },
  draft: { label: 'Ноорог', color: '#6B7280', bg: '#F3F4F6' },
  sent: { label: 'Илгээгдсэн', color: '#FF6B00', bg: '#FFF7ED' },
  accepted: { label: 'Зөвшөөрсөн', color: '#059669', bg: '#D1FAE5' },
  ordered: { label: 'Захиалагдсан', color: '#047857', bg: '#D1FAE5' },
  rejected: { label: 'Татгалзсан', color: '#DC2626', bg: '#FEE2E2' },
}
const gs = (s: string) => ST[s] || { label: s, color: '#6B7280', bg: '#F3F4F6' }

const STEP_LABELS = ['Захиалга','Төлбөр','Дизайн','Хэвлэл','Хүргэлт','Дууссан']
const stepIdx = (s: string) => {
  if (['completed','delivered'].includes(s)) return 5
  if (['shipped','delivering','ready'].includes(s)) return 4
  if (['printing','in_production','finishing','qc','prepress'].includes(s)) return 3
  if (['designing','in_design'].includes(s)) return 2
  if (s === 'paid') return 1
  return 0
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState('orders')
  const [selQ, setSelQ] = useState<Set<string>>(new Set())
  const [detailOrder, setDetailOrder] = useState<any>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '', phone: '', address: '', company: '' })
  const [toast, setToast] = useState('')
  const [qFilter, setQFilter] = useState('all')
  const [showProposal, setShowProposal] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [payMethod, setPayMethod] = useState<'qr'|'bank'|'cash'>('qr')
  const [qrInfo, setQrInfo] = useState<{invoiceNo:string; qrImage:string; expiresAt?:string}|null>(null)
  const [payLoading, setPayLoading] = useState(false)
  const [ordering, setOrdering] = useState(false)
  const [creatorReqSent, setCreatorReqSent] = useState(false)
  const [creatorReqLoading, setCreatorReqLoading] = useState(false)

  const show = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  const requestCreatorRole = async () => {
    if (creatorReqLoading) return
    setCreatorReqLoading(true)
    try {
      const r = await fetch(API + '/auth/request-role', {
        method: 'POST', headers: getH(),
        body: JSON.stringify({ role: 'creator' }),
      })
      if (r.ok) {
        setCreatorReqSent(true)
        const u = { ...user, role_request: 'creator' }
        localStorage.setItem('user', JSON.stringify(u)); setUser(u)
        show('Бүтээгч болох хүсэлт илгээгдлээ ✅')
      } else {
        show('Алдаа гарлаа, дахин оролдоно уу')
      }
    } catch { show('Алдаа гарлаа') }
    setCreatorReqLoading(false)
  }

  useEffect(() => {
    const ud = localStorage.getItem('user'); const tk = getToken()
    if (!ud || !tk) { router.push('/login'); return }
    const u = JSON.parse(ud); setUser(u)
    setProfileForm({ full_name: u.full_name || '', email: u.email || '', phone: u.phone || '', address: u.address || '', company: u.company || '' })
    if (u.role_request === 'creator' || u.role === 'creator') setCreatorReqSent(true)
    setLoading(true)
    Promise.all([
      fetch(API+'/orders/customer/'+u.id, { headers: getH() }).then(r=>r.json()).catch(()=>[]),
      fetch(API+'/quotes-v2', { headers: getH() }).then(r=>r.json()).catch(()=>[]),
      fetch(API+'/products', { headers: getH() }).then(r=>r.json()).catch(()=>[]),
    ]).then(([o,q,p]) => {
      setOrders(Array.isArray(o)?o:[]); setQuotes(Array.isArray(q)?q:[]); setProducts(Array.isArray(p)?p:[])
    }).finally(() => setLoading(false))
  }, [])

  const toggleQ = (id: string) => setSelQ(p => { const n = new Set(p); n.has(id)?n.delete(id):n.add(id); return n })
  const selTotal = quotes.filter(q => selQ.has(q.id)).reduce((s,q) => s+Number(q.total_price||0), 0)
  const activeOrders = orders.filter(o => !['completed','delivered','cancelled'].includes(o.status))
  const pendingQ = quotes.filter(q => !['ordered','rejected'].includes(q.status||''))
  const totalSpent = orders.reduce((s,o) => s+Number(o.total_price||0), 0)
  const doneOrders = orders.filter(o => ['completed','delivered'].includes(o.status))
  const quotesTotal = quotes.reduce((s,q) => s+Number(q.total_price||0), 0)

  const selectedQuotesList = quotes.filter(q => selQ.has(q.id))

  const handlePayment = async () => {
    if (selectedQuotesList.length === 0 || ordering) return
    setOrdering(true); setPayLoading(true); setQrInfo(null)
    try {
      // 1) Order үүсгэх (одоогоор эхний quote-оор)
      const q = selectedQuotesList[0]
      const orderRes = await fetch(API+"/orders/from-quote", { method:"POST", headers: getH(), body: JSON.stringify({ quote_id: q.id }) })
      const orderData = await orderRes.json()
      const orderId = orderData?.id || q.id

      // 2) Payment create
      const amount = Math.round(selTotal * 1.1)
      const payRes = await fetch(`${API}/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ orderId, amount, method: payMethod }),
      })
      const pay = await payRes.json()

      if (payMethod === 'qr' && pay?.qrImage && pay?.invoiceNo) {
        setQrInfo({ invoiceNo: pay.invoiceNo, qrImage: pay.qrImage, expiresAt: pay.expiresAt })
        pollStatus(pay.invoiceNo)
      } else {
        show('Төлбөрийн мэдээлэл үүсгэлээ')
        setShowPayment(false)
      }
      setSelQ(new Set())
      // refresh
      const o = await fetch(API+"/orders/customer/"+user?.id, { headers: getH() }).then(r=>r.json()).catch(()=>[])
      const q2 = await fetch(API+"/quotes-v2", { headers: getH() }).then(r=>r.json()).catch(()=>[])
      setOrders(Array.isArray(o)?o:[]); setQuotes(Array.isArray(q2)?q2:[]); setSection("orders")
    } catch (err) {
      show("Алдаа гарлаа")
    } finally {
      setOrdering(false); setPayLoading(false)
    }
  }

  const pollStatus = async (invoiceNo: string) => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`${API}/payment/status/${invoiceNo}`, { headers: { Authorization: `Bearer ${getToken()}` } })
        const data = await res.json()
        if (data?.status === 1 || data?.status === 'PAID' || data?.status === 'paid') {
          clearInterval(timer)
          show('Төлбөр амжилттай!')
          setShowPayment(false); setQrInfo(null)
          fetch(API+'/orders/customer/'+user?.id, { headers: getH() }).then(r=>r.json()).catch(()=>[]).then((o:any)=>{ if(Array.isArray(o)) setOrders(o) })
          fetch(API+'/quotes-v2', { headers: getH() }).then(r=>r.json()).catch(()=>[]).then((q:any)=>{ if(Array.isArray(q)) setQuotes(q) })
        }
      } catch {}
    }, 5000)
  }

  const filteredQuotes = qFilter === 'all' ? quotes
    : qFilter === 'active' ? quotes.filter(q => ['sent','draft','pending','accepted'].includes(q.status||''))
    : qFilter === 'confirmed' ? quotes.filter(q => ['accepted','ordered'].includes(q.status||''))
    : qFilter === 'done' ? quotes.filter(q => ['ordered'].includes(q.status||''))
    : quotes

  const orderFromQuotes = async () => {
    if (ordering) return; setOrdering(true); try {
    if (selQ.size === 0) return
    for (const qid of selQ) { try { await fetch(API+'/orders/from-quote', { method:'POST', headers: getH(), body: JSON.stringify({ quote_id: qid }) }) } catch {} }
    show(selQ.size + ' захиалга үүсгэгдлээ!'); setSelQ(new Set())
    const o = await fetch(API+'/orders/customer/'+user?.id, { headers: getH() }).then(r=>r.json()).catch(()=>[])
    const q = await fetch(API+'/quotes-v2', { headers: getH() }).then(r=>r.json()).catch(()=>[])
    setOrders(Array.isArray(o)?o:[]); setQuotes(Array.isArray(q)?q:[]); setSection('orders')
    } finally { setOrdering(false) }
  }

  const saveProfile = () => {
    const updated = { ...user, ...profileForm }
    localStorage.setItem('user', JSON.stringify(updated)); setUser(updated)
    show('Профайл хадгалагдлаа ✅'); setShowProfile(false)
  }

  const getExpiry = (created: string) => {
    const d = new Date(created); d.setDate(d.getDate() + 3)
    return d.toLocaleDateString()
  }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#FAFAF8' }}><div style={{ textAlign:'center' }}><div style={{ width:40, height:40, border:'3px solid #FF6B00', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/><div style={{ color:'#78716C', fontSize:14 }}>Ачааллж байна...</div></div><style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style></div>

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#FAFAF8', fontFamily:"'Newsreader','Georgia',serif", color:'#1C1917' }}>
      {toast && <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', background:'#1C1917', color:'#FAFAF8', padding:'10px 28px', borderRadius:99, fontSize:14, fontWeight:500, zIndex:9999, boxShadow:'0 8px 30px rgba(0,0,0,0.15)' }}>{toast}</div>}
      <style>{'@import url("https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap");'}</style>

      {/* ═══ SIDEBAR ═══ */}
      <div style={{ width:260, minWidth:260, height:'100vh', background:'#1C1917', color:'#E7E5E4', display:'flex', flexDirection:'column', position:'sticky', top:0, zIndex:20, fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid #292524' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, background:'#FF6B00', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><svg width="15" height="15" fill="#fff" viewBox="0 0 18 18"><rect x="2" y="2" width="6" height="6" rx="1.5"/><rect x="10" y="2" width="6" height="6" rx="1.5" opacity=".6"/><rect x="2" y="10" width="6" height="6" rx="1.5" opacity=".6"/><rect x="10" y="10" width="6" height="6" rx="1.5" opacity=".85"/></svg></div>
            <div><div style={{ fontSize:16, fontWeight:700, lineHeight:1, letterSpacing:'-0.02em' }}><span style={{ color:'#FF6B00' }}>Biz</span>Print</div><div style={{ fontSize:10, color:'#78716C', marginTop:2 }}>Хэвлэлийн платформ</div></div>
          </div>
        </div>
        <div onClick={() => setShowProfile(true)} style={{ margin:'12px 12px 0', padding:'14px', background:'#292524', borderRadius:12, cursor:'pointer' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg, #FF6B00, #FF8C40)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, flexShrink:0 }}>{user?.full_name?.charAt(0)?.toUpperCase()||'U'}</div>
            <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:14, fontWeight:600, color:'#E7E5E4', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.full_name||user?.email}</div><div style={{ fontSize:11, color:'#A8A29E' }}>{user?.email}</div></div>
            <svg width="14" height="14" fill="none" stroke="#78716C" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
          </div>
          <div style={{ marginTop:8, display:'flex', gap:6 }}><span style={{ fontSize:10, padding:'2px 8px', borderRadius:99, background:'rgba(255,107,0,0.15)', color:'#FF8C40' }}>{user?.role||'customer'}</span><span style={{ fontSize:10, padding:'2px 8px', borderRadius:99, background:'rgba(255,255,255,0.06)', color:'#A8A29E' }}>Засварлах →</span></div>
        </div>
        <div style={{ flex:1, padding:'16px 12px', overflowY:'auto' }}>
          <div style={{ fontSize:10, fontWeight:600, color:'#57534E', letterSpacing:'0.12em', padding:'0 8px 8px', textTransform:'uppercase' }}>Удирдлага</div>
          {[{key:'orders',label:'Захиалгууд',icon:'📦',count:orders.length},{key:'quotes',label:'Үнийн санал',icon:'💰',count:quotes.length},{key:'recommend',label:'Бүтээгдэхүүн',icon:'🏪',count:null},{key:'profile',label:'Профайл',icon:'👤',count:null}].map(n=>(<button key={n.key} onClick={()=>n.key==='profile'?setShowProfile(true):setSection(n.key)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border:'none', background:section===n.key?'rgba(255,107,0,0.12)':'transparent', color:section===n.key?'#FF8C40':'#A8A29E', cursor:'pointer', fontSize:13, fontWeight:section===n.key?600:400, marginBottom:2, fontFamily:"'DM Sans',sans-serif" }}><span style={{ fontSize:16, width:20, textAlign:'center' }}>{n.icon}</span><span>{n.label}</span>{n.count!==null&&<span style={{ marginLeft:'auto', fontSize:11, background:section===n.key?'rgba(255,107,0,0.2)':'rgba(255,255,255,0.06)', padding:'1px 7px', borderRadius:99, fontWeight:600 }}>{n.count}</span>}</button>))}
          <div style={{ fontSize:10, fontWeight:600, color:'#57534E', letterSpacing:'0.12em', padding:'20px 8px 8px', textTransform:'uppercase' }}>Түргэн үйлдэл</div>
          {[{label:'Шинэ захиалга',icon:'➕',href:'/order'},{label:'Үнэ тооцоолох',icon:'🧮',href:'/quote'},{label:'Дэлгүүр',icon:'🛍️',href:'/shop'}].map(a=>(<button key={a.label} onClick={()=>router.push(a.href)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, border:'none', background:'transparent', color:'#78716C', cursor:'pointer', fontSize:13, fontFamily:"'DM Sans',sans-serif", marginBottom:2 }}><span style={{ fontSize:15, width:20, textAlign:'center' }}>{a.icon}</span><span>{a.label}</span></button>))}
        </div>
        <div style={{ padding:'12px', borderTop:'1px solid #292524' }}>
          {user?.role==='admin'&&<button onClick={()=>router.push('/admin')} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, border:'none', background:'rgba(255,107,0,0.08)', color:'#FF8C40', cursor:'pointer', fontSize:13, fontFamily:"'DM Sans',sans-serif", marginBottom:4, fontWeight:500 }}>⚙️ Admin Panel</button>}
          {(user?.role==='customer'||user?.role==='creator') && (
            <button
              onClick={user?.role==='creator' ? ()=>router.push('/creator') : (creatorReqSent ? undefined : requestCreatorRole)}
              disabled={creatorReqLoading}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, border:'1px solid rgba(139,92,246,0.3)', background:'rgba(139,92,246,0.08)', color:'#A78BFA', cursor: (creatorReqSent && user?.role!=='creator') ? 'default' : 'pointer', fontSize:13, fontFamily:"'DM Sans',sans-serif", marginBottom:4, fontWeight:500, opacity: creatorReqLoading ? 0.6 : 1 }}>
              🎨 {user?.role==='creator' ? 'Бүтээгч самбар' : creatorReqSent ? 'Хүсэлт илгээгдсэн ✓' : 'Бүтээгч болох'}
            </button>
          )}
          <button onClick={()=>{localStorage.clear();router.push('/')}} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, border:'none', background:'transparent', color:'#78716C', cursor:'pointer', fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>🚪 Гарах</button>
        </div>
      </div>

      {/* ═══ MAIN ═══ */}
      <div style={{ flex:1, minWidth:0, overflowY:'auto' }}>
        <div style={{ maxWidth:960, margin:'0 auto', padding:'32px 40px' }}>
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontSize:28, fontWeight:700, margin:0, letterSpacing:'-0.03em' }}>Сайн байна уу, {user?.full_name?.split(' ')[0]||'Хэрэглэгч'}</h1>
            <p style={{ color:'#78716C', fontSize:15, margin:'4px 0 0', fontFamily:"'DM Sans',sans-serif" }}>Таны хэвлэлийн захиалгуудын хураангуй</p>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
            {[{label:'Идэвхтэй',val:String(activeOrders.length),sub:'захиалга',color:'#FF6B00',bg:'linear-gradient(135deg,#FFF7ED,#FFEDD5)'},{label:'Үнийн санал',val:String(pendingQ.length),sub:'хүлээгдэж буй',color:'#2563EB',bg:'linear-gradient(135deg,#EFF6FF,#DBEAFE)'},{label:'Зарцуулсан',val:'₮'+totalSpent.toLocaleString(),sub:orders.length+' захиалга',color:'#047857',bg:'linear-gradient(135deg,#ECFDF5,#D1FAE5)'},{label:'Дууссан',val:String(doneOrders.length),sub:'амжилттай',color:'#7C3AED',bg:'linear-gradient(135deg,#F5F3FF,#EDE9FE)'}].map(k=>(<div key={k.label} style={{ background:k.bg, borderRadius:14, padding:'18px 20px' }}><div style={{ fontSize:12, color:k.color, fontWeight:600, marginBottom:8, fontFamily:"'DM Sans',sans-serif", textTransform:'uppercase', letterSpacing:'0.05em', opacity:0.8 }}>{k.label}</div><div style={{ fontSize:26, fontWeight:700, color:k.color, lineHeight:1, letterSpacing:'-0.02em' }}>{k.val}</div><div style={{ fontSize:12, color:k.color, opacity:0.6, marginTop:4, fontFamily:"'DM Sans',sans-serif" }}>{k.sub}</div></div>))}
          </div>

          {/* Tab bar */}
          <div style={{ display:'flex', gap:0, marginBottom:24, borderBottom:'2px solid #E7E5E4' }}>
            {[{key:'orders',label:'Захиалгууд',count:orders.length},{key:'quotes',label:'Үнийн санал',count:quotes.length},{key:'recommend',label:'Бүтээгдэхүүн'}].map(t=>(<button key={t.key} onClick={()=>setSection(t.key)} style={{ padding:'12px 20px', border:'none', borderBottom:section===t.key?'2px solid #FF6B00':'2px solid transparent', marginBottom:'-2px', background:'none', fontSize:14, fontWeight:section===t.key?600:400, color:section===t.key?'#1C1917':'#A8A29E', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>{t.label}{t.count!==undefined&&<span style={{ marginLeft:6, fontSize:11, background:section===t.key?'#FF6B00':'#E7E5E4', color:section===t.key?'#fff':'#78716C', padding:'1px 7px', borderRadius:99 }}>{t.count}</span>}</button>))}
          </div>

          {/* ═══ ORDERS ═══ */}
          {section==='orders' && (<div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {orders.length===0?(
              <div style={{ border:'2px dashed #D6D3D1', borderRadius:16, padding:'60px 24px', textAlign:'center' }}><div style={{ fontSize:48, marginBottom:12 }}>📦</div><div style={{ fontSize:20, fontWeight:600, marginBottom:6 }}>Захиалга байхгүй байна</div><div style={{ fontSize:14, color:'#78716C', marginBottom:20 }}>Эхний захиалгаа өгөөд хэвлэлийн аялалаа эхлүүлээрэй</div><button onClick={()=>router.push('/order')} style={{ background:'#1C1917', color:'#fff', border:'none', padding:'12px 28px', borderRadius:99, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>+ Шинэ захиалга өгөх</button></div>
            ):orders.map(o=>{const s=gs(o.status);const si=stepIdx(o.status);return(
              <div key={o.id} onClick={()=>setDetailOrder(o)} style={{ background:'#fff', border:'1px solid #E7E5E4', borderRadius:16, padding:'20px 24px', cursor:'pointer', transition:'all .2s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor='#FF6B00';e.currentTarget.style.boxShadow='0 4px 20px rgba(255,107,0,0.08)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#E7E5E4';e.currentTarget.style.boxShadow='none'}}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:16 }}><div><div style={{ fontSize:18, fontWeight:600, marginBottom:3, letterSpacing:'-0.01em' }}>{o.product_name||'Захиалга'}</div><div style={{ fontSize:13, color:'#A8A29E', fontFamily:"'DM Sans',sans-serif" }}>#{o.id.slice(0,8)} · {o.quantity}ш · {new Date(o.created_at).toLocaleDateString()}</div></div><div style={{ textAlign:'right' }}><div style={{ fontSize:20, fontWeight:700, color:'#1C1917', letterSpacing:'-0.02em' }}>₮{Number(o.total_price||0).toLocaleString()}</div><span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, background:s.bg, color:s.color, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{s.label}</span></div></div>
                <div style={{ display:'flex', alignItems:'center', gap:0 }}>{STEP_LABELS.map((label,i)=>{const done=i<=si;const current=i===si;const last=i===STEP_LABELS.length-1;return(<div key={i} style={{ display:'flex', alignItems:'center', flex:last?0:1 }}><div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}><div style={{ width:24, height:24, borderRadius:'50%', background:done?(current?'#FF6B00':'#059669'):'#E7E5E4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:done?'#fff':'#A8A29E', fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>{done?(current?(si===5?'✓':'●'):'✓'):(i+1)}</div><div style={{ fontSize:10, color:current?'#FF6B00':done?'#78716C':'#D6D3D1', marginTop:4, fontWeight:current?600:400, fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap' }}>{label}</div></div>{!last&&<div style={{ flex:1, height:2, background:done&&i<si?'#059669':'#E7E5E4', minWidth:8, marginBottom:16 }}/>}</div>)})}</div>
              </div>
            )})}
          </div>)}

          {/* ═══ QUOTES (Screenshot дизайн) ═══ */}
          {section==='quotes' && (<div>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:20 }}>
              <div><h2 style={{ fontSize:24, fontWeight:700, margin:'0 0 4px', letterSpacing:'-0.02em' }}>Үнийн саналууд</h2><p style={{ fontSize:13, color:'#A8A29E', margin:0, fontFamily:"'DM Sans',sans-serif" }}>Таны авсан үнийн саналуудын түүх</p></div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>router.push('/dashboard/customer/quotes')} style={{ background:'#fff', border:'1px solid #E7E5E4', padding:'9px 18px', borderRadius:99, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", color:'#78716C', display:'flex', alignItems:'center', gap:6 }}>👁 Харангуй</button>
                <button onClick={()=>router.push('/quote')} style={{ background:'#FF6B00', color:'#fff', border:'none', padding:'9px 22px', borderRadius:99, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>+ Шинэ үнэ тооцоолох</button>
              </div>
            </div>

            {/* Quote KPI */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:'#E7E5E4', borderRadius:14, overflow:'hidden', marginBottom:20 }}>
              {[{label:'НИЙТ',val:String(quotes.length),color:'#FF6B00'},{label:'ХҮЧИНТЭЙ',val:String(pendingQ.length),color:'#2563EB'},{label:'НИЙТ ДҮН',val:'₮'+quotesTotal.toLocaleString(),color:'#047857'},{label:'СОНГОСОН',val:selQ.size+' / ₮'+selTotal.toLocaleString(),color:'#FF6B00'}].map(k=>(<div key={k.label} style={{ background:'#fff', padding:'16px 20px' }}><div style={{ fontSize:10, fontWeight:600, color:'#A8A29E', letterSpacing:'0.1em', marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>{k.label}</div><div style={{ fontSize:20, fontWeight:700, color:k.color, letterSpacing:'-0.02em' }}>{k.val}</div></div>))}
            </div>

            {/* Selected bar */}
            {selQ.size>0&&(<div style={{ background:'linear-gradient(135deg, #FF6B00, #FF8C40)', borderRadius:14, padding:'16px 24px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center', color:'#fff' }}>
              <div style={{ fontSize:15, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{selQ.size} үнийн санал сонгогдсон — Нийт: {selTotal.toLocaleString()}₮</div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setShowProposal(true)} style={{ background:'rgba(255,255,255,0.2)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', padding:'9px 18px', borderRadius:99, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:6 }}>📄 Proposal PDF</button>
                <button onClick={()=>setShowPayment(true)} style={{ background:'#fff', color:'#1C1917', border:'none', padding:'9px 20px', borderRadius:99, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:6 }}>💳 QPay төлбөр</button>
              </div>
            </div>)}

            {/* Filter tabs */}
            <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
              <button onClick={()=>{if(selQ.size===pendingQ.length)setSelQ(new Set());else setSelQ(new Set(pendingQ.map(q=>q.id)))}} style={{ background:'#fff', border:'1px solid #E7E5E4', borderRadius:99, padding:'7px 16px', fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", color:'#78716C' }}>{selQ.size===pendingQ.length?'Бүгдийг болих':'Бүгдийг сонгох'}</button>
              {[{key:'all',label:'Бүгд'},{key:'active',label:'Хүчинтэй'},{key:'confirmed',label:'Батлагдсан'},{key:'done',label:'Дууссан'}].map(f=>(<button key={f.key} onClick={()=>setQFilter(f.key)} style={{ background:qFilter===f.key?'#FF6B00':'#fff', color:qFilter===f.key?'#fff':'#78716C', border:qFilter===f.key?'none':'1px solid #E7E5E4', borderRadius:99, padding:'7px 16px', fontSize:12, fontWeight:qFilter===f.key?600:400, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>{f.label}</button>))}
            </div>

            {/* Quote cards */}
            {filteredQuotes.length===0?(
              <div style={{ border:'2px dashed #D6D3D1', borderRadius:16, padding:'60px 24px', textAlign:'center' }}><div style={{ fontSize:48, marginBottom:12 }}>💰</div><div style={{ fontSize:20, fontWeight:600, marginBottom:6 }}>Үнийн санал байхгүй</div><div style={{ fontSize:14, color:'#78716C', marginBottom:20 }}>Үнэ тооцоолсон бол энд харагдана</div><button onClick={()=>router.push('/quote')} style={{ background:'#1C1917', color:'#fff', border:'none', padding:'12px 28px', borderRadius:99, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Үнэ тооцоолох</button></div>
            ):(
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {filteredQuotes.map((q,qi)=>{
                  const s=gs(q.status||'draft'); const sel=selQ.has(q.id); const canSel=true
                  const qNum = q.quote_number || String(quotes.length - qi).padStart(3,'0')
                  return(
                    <div key={q.id} style={{ background:'#fff', border:sel?'2px solid #FF6B00':'1px solid #E7E5E4', borderRadius:16, padding:'20px 24px', transition:'all .15s', cursor:canSel?'pointer':'default' }} onClick={()=>canSel&&toggleQ(q.id)}>
                      {/* Top row */}
                      <div style={{ display:'flex', alignItems:'start', gap:14 }}>
                        {/* Checkbox */}
                        {canSel&&<div style={{ marginTop:4, width:24, height:24, borderRadius:8, border:sel?'2px solid #FF6B00':'2px solid #D6D3D1', background:sel?'#FF6B00':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}>{sel&&<svg width="13" height="13" fill="#fff" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}</div>}

                        {/* Quote badge */}
                        <div style={{ background:'#FF6B00', borderRadius:8, padding:'6px 10px', textAlign:'center', flexShrink:0 }}><div style={{ fontSize:9, color:'rgba(255,255,255,0.7)', fontWeight:600, fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.05em' }}>QUOTE</div><div style={{ fontSize:14, fontWeight:700, color:'#fff', fontFamily:"'DM Sans',sans-serif" }}>{qNum}</div></div>

                        {/* Info */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                            <span style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.01em' }}>{q.product_name||'Үнийн санал'}</span>
                            <span style={{ fontSize:10, padding:'2px 10px', borderRadius:99, background:s.bg, color:s.color, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{s.label}</span>
                          </div>
                          <div style={{ fontSize:12, color:'#A8A29E', fontFamily:"'DM Sans',sans-serif" }}>
                            {q.quantity||0} ш · {q.width_mm&&q.height_mm?q.width_mm+'×'+q.height_mm+'мм':'A4'} · {q.paper_gsm?q.paper_gsm+'gsm':''} · {q.color_mode||'Өнгөт'} · {q.created_at?new Date(q.created_at).toLocaleDateString():''}
                          </div>
                        </div>

                        {/* Price */}
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontSize:22, fontWeight:700, color:'#FF6B00', letterSpacing:'-0.02em' }}>{Number(q.total_price||0).toLocaleString()}₮</div>
                          {q.unit_price&&<div style={{ fontSize:11, color:'#A8A29E', fontFamily:"'DM Sans',sans-serif" }}>Нэгж: {Number(q.unit_price).toLocaleString()}₮</div>}
                        </div>
                      </div>

                      {/* Bottom row */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14, paddingTop:12, borderTop:'1px solid #F5F5F4' }}>
                        <div style={{ fontSize:12, color:'#A8A29E', fontFamily:"'DM Sans',sans-serif" }}>✓ Хүчинтэй: {q.created_at?getExpiry(q.created_at):''} хүртэл</div>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={e=>{e.stopPropagation()}} style={{ background:'#fff', border:'1px solid #E7E5E4', borderRadius:99, padding:'5px 14px', fontSize:11, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", color:'#78716C' }}>▼ Дэлгэрэнгүй</button>
                          <button onClick={e=>{e.stopPropagation()}} style={{ background:'#fff', border:'1px solid #E7E5E4', borderRadius:99, padding:'5px 14px', fontSize:11, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", color:'#78716C', display:'flex', alignItems:'center', gap:4 }}>📄 PDF</button>
                          <button onClick={e=>{e.stopPropagation(); if(!ordering){setSelQ(new Set([q.id])); setShowPayment(true)}}} style={{ background:'#059669', color:'#fff', border:'none', borderRadius:99, padding:'5px 14px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:4 }}>💳 QPay</button>
                          <button onClick={e=>{e.stopPropagation(); if(!ordering){setSelQ(new Set([q.id])); setShowPayment(true)}}} style={{ background:'#FF6B00', color:'#fff', border:'none', borderRadius:99, padding:'5px 14px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Захиалах →</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>)}

          {/* ═══ RECOMMEND ═══ */}
          {section==='recommend' && (<div>
            <div style={{ background:'linear-gradient(135deg,#1C1917,#292524)', borderRadius:16, padding:'28px 32px', marginBottom:24, color:'#fff', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:'-20px', right:'-10px', fontSize:100, opacity:0.05, transform:'rotate(-12deg)' }}>🖨️</div>
              <div style={{ fontSize:22, fontWeight:700, marginBottom:6, letterSpacing:'-0.02em', position:'relative' }}>Танд зориулсан</div>
              <div style={{ fontSize:14, color:'#A8A29E', position:'relative', fontFamily:"'DM Sans',sans-serif" }}>Хамгийн их захиалагддаг бүтээгдэхүүн, хямдралтай санал</div>
            </div>
            {products.length===0?(
              <div style={{ border:'2px dashed #D6D3D1', borderRadius:16, padding:'60px 24px', textAlign:'center' }}><div style={{ fontSize:48, marginBottom:12 }}>🏪</div><div style={{ fontSize:20, fontWeight:600, marginBottom:6 }}>Бүтээгдэхүүн удахгүй</div><div style={{ fontSize:14, color:'#78716C' }}>Тун удахгүй нэмэгдэнэ</div></div>
            ):(
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>{products.slice(0,9).map((p,i)=>{const disc=i<3?[15,20,10][i]:0;return(
                <div key={p.id} style={{ background:'#fff', border:'1px solid #E7E5E4', borderRadius:14, overflow:'hidden', transition:'all .2s', cursor:'pointer', position:'relative' }} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.06)'}} onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
                  {disc>0&&<div style={{ position:'absolute', top:10, left:10, background:'#DC2626', color:'#fff', padding:'3px 10px', borderRadius:99, fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif", zIndex:1 }}>-{disc}%</div>}
                  <div style={{ height:140, background:'linear-gradient(135deg,#F5F5F4,#E7E5E4)', display:'flex', alignItems:'center', justifyContent:'center' }}>{p.image_url?<img src={p.image_url.startsWith('http')?p.image_url:API+'/'+p.image_url} style={{ maxHeight:'100%', maxWidth:'100%', objectFit:'cover' }} alt={p.name}/>:<span style={{ fontSize:48, opacity:0.15 }}>🖨️</span>}</div>
                  <div style={{ padding:'14px 16px' }}><div style={{ fontSize:14, fontWeight:600, marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div><div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:10 }}>{disc>0?(<><span style={{ fontSize:18, fontWeight:700, color:'#DC2626' }}>₮{Math.round(Number(p.price||0)*(1-disc/100)).toLocaleString()}</span><span style={{ fontSize:12, color:'#A8A29E', textDecoration:'line-through', fontFamily:"'DM Sans',sans-serif" }}>₮{Number(p.price||0).toLocaleString()}</span></>):(<span style={{ fontSize:18, fontWeight:700 }}>₮{Number(p.price||0).toLocaleString()}</span>)}</div><button onClick={()=>router.push('/order')} style={{ width:'100%', background:'#1C1917', color:'#fff', border:'none', padding:'9px 0', borderRadius:99, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Захиалах</button></div>
                </div>
              )})}</div>
            )}
          </div>)}
        </div>
      </div>

      {/* ═══ ORDER DETAIL ═══ */}
      {detailOrder&&(<div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setDetailOrder(null)}><div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:540, maxHeight:'85vh', overflow:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.15)', padding:'28px 32px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:20 }}><div><div style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.02em', marginBottom:3 }}>{detailOrder.product_name||'Захиалга'}</div><div style={{ fontSize:13, color:'#A8A29E', fontFamily:"'DM Sans',sans-serif" }}>#{detailOrder.id.slice(0,12)} · {new Date(detailOrder.created_at).toLocaleDateString()}</div></div><button onClick={()=>setDetailOrder(null)} style={{ background:'#F5F5F4', border:'none', color:'#78716C', width:32, height:32, borderRadius:10, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button></div>
        <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:24, padding:'16px 0' }}>{STEP_LABELS.map((label,i)=>{const si2=stepIdx(detailOrder.status);const done=i<=si2;const current=i===si2;const last=i===STEP_LABELS.length-1;return(<div key={i} style={{ display:'flex', alignItems:'center', flex:last?0:1 }}><div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}><div style={{ width:28, height:28, borderRadius:'50%', background:done?(current?'#FF6B00':'#059669'):'#E7E5E4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:done?'#fff':'#A8A29E', fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>{done?'✓':(i+1)}</div><div style={{ fontSize:10, color:current?'#FF6B00':done?'#78716C':'#D6D3D1', marginTop:4, fontWeight:current?600:400, fontFamily:"'DM Sans',sans-serif" }}>{label}</div></div>{!last&&<div style={{ flex:1, height:2, background:done&&i<si2?'#059669':'#E7E5E4', minWidth:8, marginBottom:16 }}/>}</div>)})}</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 24px', fontSize:14, fontFamily:"'DM Sans',sans-serif" }}>{[{l:'Тоо ширхэг',v:detailOrder.quantity+'ш'},{l:'Нийт дүн',v:'₮'+Number(detailOrder.total_price||0).toLocaleString()},{l:'Хэмжээ',v:detailOrder.width_mm&&detailOrder.height_mm?detailOrder.width_mm+'×'+detailOrder.height_mm+'мм':'—'},{l:'Цаас',v:detailOrder.paper_gsm?detailOrder.paper_gsm+'gsm':'—'},{l:'Өнгө',v:detailOrder.color_mode||'—'},{l:'Finishing',v:detailOrder.finishing||'—'}].map(item=>(<div key={item.l} style={{ padding:'8px 0', borderBottom:'1px solid #F5F5F4' }}><span style={{ color:'#A8A29E', fontSize:12 }}>{item.l}</span><div style={{ fontWeight:500, marginTop:2 }}>{item.v}</div></div>))}</div>
      </div></div>)}

      {/* ═══ PROFILE MODAL ═══ */}
      {showProfile&&(<div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setShowProfile(false)}><div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:480, boxShadow:'0 24px 80px rgba(0,0,0,0.15)', padding:'28px 32px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}><div style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.02em' }}>Профайл засварлах</div><button onClick={()=>setShowProfile(false)} style={{ background:'#F5F5F4', border:'none', color:'#78716C', width:32, height:32, borderRadius:10, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button></div>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}><div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#FF6B00,#FF8C40)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:700 }}>{profileForm.full_name?.charAt(0)?.toUpperCase()||'U'}</div></div>
        <div style={{ display:'flex', flexDirection:'column', gap:14, fontFamily:"'DM Sans',sans-serif" }}>
          {[{key:'full_name',label:'Нэр',placeholder:'Таны бүтэн нэр',type:'text'},{key:'email',label:'И-мэйл',placeholder:'example@mail.com',type:'email'},{key:'phone',label:'Утасны дугаар',placeholder:'+976 ...',type:'tel'},{key:'company',label:'Байгууллага',placeholder:'Байгууллагын нэр (заавал биш)',type:'text'},{key:'address',label:'Хаяг',placeholder:'Хүргэлтийн хаяг',type:'text'}].map(f=>(<div key={f.key}><label style={{ fontSize:12, fontWeight:600, color:'#78716C', display:'block', marginBottom:4 }}>{f.label}</label><input type={f.type} value={(profileForm )[f.key]||''} onChange={e=>setProfileForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid #E7E5E4', fontSize:14, outline:'none', background:'#FAFAF8', boxSizing:'border-box' }} onFocus={e=>e.currentTarget.style.borderColor='#FF6B00'} onBlur={e=>e.currentTarget.style.borderColor='#E7E5E4'}/></div>))}
          <button onClick={saveProfile} style={{ width:'100%', background:'#1C1917', color:'#fff', border:'none', padding:'12px 0', borderRadius:99, fontSize:14, fontWeight:600, cursor:'pointer', marginTop:8 }}>Хадгалах</button>
        </div>
      </div></div>)}

      {showProposal && (<div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setShowProposal(false)}><div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:720, maxHeight:'90vh', overflow:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 28px', borderBottom:'1px solid #E7E5E4' }}><div style={{ fontSize:18, fontWeight:700 }}>Үнийн санал — Proposal</div><div style={{ display:'flex', gap:8 }}><button onClick={()=>{const w=window.open('','','width=800,height=600');if(w){w.document.write('<html><head><title>BizPrint Proposal</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#1C1917}table{width:100%;border-collapse:collapse}th,td{padding:10px 14px;text-align:left;border-bottom:1px solid #E7E5E4}th{background:#F5F5F4;font-size:12px;font-weight:600;color:#78716C}</style></head><body>'+document.getElementById("ppdf")?.innerHTML+'</body></html>');w.document.close();w.print()}}} style={{ background:'#1C1917', color:'#fff', border:'none', padding:'9px 20px', borderRadius:99, fontSize:13, fontWeight:600, cursor:'pointer' }}>🖨️ Хэвлэх</button><button onClick={()=>{const el=document.getElementById('ppdf');if(!el)return;const blob=new Blob(['<html><head><meta charset=utf-8><title>BizPrint Proposal</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:48px;color:#1C1917}table{width:100%;border-collapse:collapse}th{padding:10px 14px;text-align:left;font-size:11px;font-weight:600;color:#78716C;border-bottom:2px solid #E7E5E4;background:#F9F9F8}td{padding:10px 14px;font-size:13px;border-bottom:1px solid #F0F0EE}td:last-child,th:last-child{text-align:right}</style></head><body>'+el.innerHTML+'</body></html>'],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='BizPrint-Proposal-'+new Date().toISOString().slice(0,10)+'.html';a.click()}} style={{ background:'#059669', color:'#fff', border:'none', padding:'9px 20px', borderRadius:99, fontSize:13, fontWeight:600, cursor:'pointer' }}>📥 Татах</button><button onClick={()=>setShowProposal(false)} style={{ background:'#F5F5F4', border:'none', color:'#78716C', width:32, height:32, borderRadius:10, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>x</button></div></div>
        <div id="ppdf" style={{ padding:'32px 36px', fontFamily:"'DM Sans',sans-serif" }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:28, paddingBottom:16, borderBottom:'2px solid #FF6B00' }}><div><div style={{ fontSize:28, fontWeight:700 }}><span style={{ color:'#FF6B00' }}>Biz</span>Print</div><div style={{ fontSize:12, color:'#78716C' }}>BizPrint Platform</div></div><div style={{ textAlign:'right', fontSize:12, color:'#78716C' }}><div>Огноо: {new Date().toLocaleDateString()}</div><div>Дугаар #{String(Date.now()).slice(-6)}</div></div></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}><div style={{ background:'#FAFAF8', borderRadius:10, padding:'14px 18px' }}><div style={{ fontSize:10, fontWeight:600, color:'#A8A29E', textTransform:'uppercase', marginBottom:6 }}>Захиалагч</div><div style={{ fontSize:14, fontWeight:600 }}>{user?.full_name}</div><div style={{ fontSize:12, color:'#78716C' }}>{user?.email}</div></div><div style={{ background:'#FAFAF8', borderRadius:10, padding:'14px 18px' }}><div style={{ fontSize:10, fontWeight:600, color:'#A8A29E', textTransform:'uppercase', marginBottom:6 }}>Мэдээлэл</div><div style={{ fontSize:12, color:'#78716C' }}>Барааны тоо: {selectedQuotesList.length}</div><div style={{ fontSize:12, color:'#78716C' }}>3 хоног хүчинтэй</div></div></div>
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:20 }}><thead><tr>{['#','Бүтээгдэхүүн','Тоо','Тодорхойлолт','Нэгж үнэ','Нийт'].map(h=><th key={h} style={{ padding:'8px 12px', textAlign:h==='Total'||h==='Unit'?'right':'left', fontSize:11, fontWeight:600, color:'#A8A29E', borderBottom:'2px solid #E7E5E4' }}>{h}</th>)}</tr></thead><tbody>{selectedQuotesList.map((q,i)=><tr key={q.id} style={{ borderBottom:'1px solid #F5F5F4' }}><td style={{ padding:'10px 12px', fontSize:12, color:'#78716C' }}>{i+1}</td><td style={{ padding:'10px 12px' }}><div style={{ fontWeight:600, fontSize:13 }}>{q.product_name||'Item'}</div></td><td style={{ padding:'10px 12px', fontSize:12 }}>{q.quantity||0}</td><td style={{ padding:'10px 12px', fontSize:11, color:'#78716C' }}>{[q.paper_gsm?q.paper_gsm+'gsm':null,q.color_mode].filter(Boolean).join(', ')||'-'}</td><td style={{ padding:'10px 12px', textAlign:'right', fontSize:12 }}>{q.unit_price?Number(q.unit_price).toLocaleString()+'₮':'-'}</td><td style={{ padding:'10px 12px', textAlign:'right', fontSize:14, fontWeight:700, color:'#FF6B00' }}>{Number(q.total_price||0).toLocaleString()}₮</td></tr>)}</tbody></table>
          <div style={{ display:'flex', justifyContent:'flex-end' }}><div style={{ width:260 }}><div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:13, borderBottom:'1px solid #F5F5F4' }}><span style={{ color:'#78716C' }}>Нийт дүн</span><span style={{ fontWeight:600 }}>{selTotal.toLocaleString()}₮</span></div><div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:13, borderBottom:'1px solid #F5F5F4' }}><span style={{ color:'#78716C' }}>НӨАТ 10%</span><span style={{ fontWeight:600 }}>{Math.round(selTotal*0.1).toLocaleString()}₮</span></div><div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', fontSize:16 }}><span style={{ fontWeight:700 }}>Нийт</span><span style={{ fontWeight:700, color:'#FF6B00', fontSize:20 }}>{Math.round(selTotal*1.1).toLocaleString()}₮</span></div></div></div>
          <div style={{ borderTop:'1px solid #E7E5E4', paddingTop:16, marginTop:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}><div style={{ fontSize:11, color:'#A8A29E' }}>BizPrint (c) {new Date().getFullYear()}</div><button onClick={()=>{setShowProposal(false);setShowPayment(true)}} style={{ background:'#FF6B00', color:'#fff', border:'none', padding:'9px 20px', borderRadius:99, fontSize:13, fontWeight:600, cursor:'pointer' }}>💳 Төлбөр төлөх →</button></div>
        </div>
      </div></div>)}

      {showPayment && (<div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:1001, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setShowPayment(false)}><div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:460, boxShadow:'0 24px 80px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'24px 28px 16px', borderBottom:'1px solid #E7E5E4' }}><div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}><div style={{ fontSize:20, fontWeight:700 }}>Төлбөр төлөх</div><button onClick={()=>setShowPayment(false)} style={{ background:'#F5F5F4', border:'none', color:'#78716C', width:32, height:32, borderRadius:10, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>x</button></div><div style={{ background:'#1C1917', borderRadius:12, padding:'16px 20px', color:'#fff' }}><div style={{ fontSize:12, color:'#A8A29E' }}>{selectedQuotesList.length} үнийн санал · НӨАТ-тэй</div><div style={{ fontSize:28, fontWeight:700, marginTop:4 }}>{Math.round(selTotal*1.1).toLocaleString()}₮</div></div></div>
        <div style={{ padding:'20px 28px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>{[{k:'qr',l:'TDB QR',d:'QR код уншуулж төлөх',i:'phone',t:'Санал болгож буй'},{k:'bank',l:'Банк шилжүүлэг',d:'Дансруу шилжүүлэх',i:'bank',t:null},{k:'cash',l:'Бэлэн мөнгө',d:'Хүргэлтийн үед төлөх',i:'cash',t:null}].map(m=><div key={m.k} onClick={()=>setPayMethod(m.k as any)} style={{ border:payMethod===m.k?'2px solid #FF6B00':'1px solid #E7E5E4', borderRadius:12, padding:'14px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:12, background:payMethod===m.k?'#FFF7ED':'#fff' }}><div style={{ fontSize:24 }}>{m.k==='qr'?'📱':m.k==='bank'?'🏦':'💵'}</div><div style={{ flex:1 }}><div style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ fontSize:14, fontWeight:600 }}>{m.l}</span>{m.t&&<span style={{ fontSize:9, padding:'2px 6px', borderRadius:99, background:'#DCFCE7', color:'#059669', fontWeight:600 }}>{m.t}</span>}</div><div style={{ fontSize:12, color:'#A8A29E' }}>{m.d}</div></div><div style={{ width:20, height:20, borderRadius:'50%', border:payMethod===m.k?'6px solid #FF6B00':'2px solid #D6D3D1' }}/></div>)}</div>
          {payMethod==='bank'&&<div style={{ background:'#FAFAF8', borderRadius:12, padding:'14px 18px', marginBottom:16, fontSize:13 }}>{[{l:'Банк',v:'TDB'},{l:'Данс',v:'0000 0000 0000'},{l:'Эзэмшигч',v:'BizPrint LLC'},{l:'Гүйлгээний утга',v:'Order-'+String(Date.now()).slice(-6)}].map(r=><div key={r.l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #E7E5E4' }}><span style={{ color:'#A8A29E' }}>{r.l}</span><span style={{ fontWeight:600 }}>{r.v}</span></div>)}</div>}
          {payMethod==='qr' && qrInfo && (
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <div style={{ fontSize:12, color:'#A8A29E', marginBottom:6 }}>QR-г уншуулна уу</div>
              <img src={qrInfo.qrImage} alt="QR" style={{ maxWidth:'220px', margin:'0 auto', display:'block' }} />
              <div style={{ fontSize:11, color:'#78716C', marginTop:6 }}>Invoice: {qrInfo.invoiceNo}</div>
            </div>
          )}
          <button onClick={handlePayment} disabled={payLoading} style={{ width:'100%', background:'#FF6B00', color:'#fff', border:'none', padding:'14px 0', borderRadius:99, fontSize:15, fontWeight:700, cursor:payLoading?'not-allowed':'pointer' }}>{payLoading?'Үүсгэж байна...':'Баталгаажуулах'}</button>
        </div>
      </div></div>)}

    </div>
  )
}
