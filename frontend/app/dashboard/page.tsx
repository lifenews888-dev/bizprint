'use client'
import { apiFetch, getToken, API_URL } from '@/lib/api'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRealtime } from '@/contexts/RealtimeContext'
import dynamic from 'next/dynamic'
import CreatorProfileModal from '@/components/CreatorProfileModal'
import MarketplaceSection from '@/components/MarketplaceSection'

const CreatorDashboardContent = dynamic(() => import('@/components/CreatorDashboardContent'), { ssr: false })
const CreatorJobsPage = dynamic(() => import('@/app/creator/jobs/page'), { ssr: false })
const CreatorProjectsPage = dynamic(() => import('@/app/creator/projects/page'), { ssr: false })
const CreatorEarningsPage = dynamic(() => import('@/app/creator/earnings/page'), { ssr: false })
const CreatorSubmitPage = dynamic(() => import('@/app/creator/submit/page'), { ssr: false })
const CreatorPortfolioPage = dynamic(() => import('@/app/creator/portfolio/page'), { ssr: false })

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
  const { joinRoom, subscribe } = useRealtime()
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
  const [quoteEmail, setQuoteEmail] = useState('')
  const [quoteEmailInput, setQuoteEmailInput] = useState('')
  const [quotesLoading, setQuotesLoading] = useState(false)
  const [showTicket, setShowTicket] = useState(false)
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketMessage, setTicketMessage] = useState('')
  const [ticketQuoteId, setTicketQuoteId] = useState('')
  const [ticketSending, setTicketSending] = useState(false)
  const [dashMode, setDashMode] = useState<'customer' | 'creator'>('customer')
  const [myTickets, setMyTickets] = useState<any[]>([])

  const loadMyTickets = () => {
    apiFetch<any>('/customer/support/my-tickets')
      .then(d => setMyTickets(Array.isArray(d) ? d : [])).catch(() => {})
  }

  const submitTicket = async () => {
    if (!ticketSubject || !ticketMessage || ticketSending) return
    setTicketSending(true)
    try {
      await apiFetch<any>('/customer/support', {
        method: 'POST',
        body: { subject: ticketSubject, message: ticketMessage, quote_id: ticketQuoteId || undefined },
      })
      show('Тикет амжилттай илгээгдлээ')
      setShowTicket(false); setTicketSubject(''); setTicketMessage(''); setTicketQuoteId('')
      loadMyTickets()
    } catch { show('Алдаа гарлаа') }
    finally { setTicketSending(false) }
  }

  const show = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  useEffect(() => {
    const ud = localStorage.getItem('user'); const tk = getToken()
    if (!ud || !tk) { router.push('/login'); return }
    const u = JSON.parse(ud)
    // Role-based redirect
    if (u.role === 'admin' || u.role === 'superadmin') { router.push('/admin'); return }
    if (u.role === 'designer') { router.push('/designer'); return }
    if (u.role === 'vendor') { router.push('/dashboard/vendor'); return }
    if (u.role === 'sales') { router.push('/sales'); return }
    if (u.role === 'courier') { router.push('/courier'); return }
    if (u.role === 'factory') { router.push('/dashboard/factory'); return }
    // Customer → customer layout
    if (u.role === 'customer' && !u.is_creator) { router.push('/dashboard/customer/orders'); return }
    // If user is creator, check saved mode preference
    if (u.is_creator && localStorage.getItem('bizprint_role_mode') === 'creator') {
      setDashMode('creator')
      setSection('c_home')
    }
    setUser(u)
    setProfileForm({ full_name: u.full_name || '', email: u.email || '', phone: u.phone || '', address: u.address || '', company: u.company || '' })
    // Join personal room so design/zoom events arrive even when not on design detail page
    joinRoom(`user:${u.id}`)
    setLoading(true)
    Promise.all([
      apiFetch<any>('/orders/customer/'+u.id).catch(()=>[]),
      apiFetch<any>('/quote/my').catch(()=>[]),
      apiFetch<any>('/products').catch(()=>[]),
    ]).then(([o,q,p]) => {
      setOrders(Array.isArray(o)?o:[]); setQuotes(Array.isArray(q)?q:[]); setProducts(Array.isArray(p)?p:[])
    }).finally(() => setLoading(false))
    // Load support tickets
    apiFetch<any>('/customer/support/my-tickets').then(d=>setMyTickets(Array.isArray(d)?d:[])).catch(()=>{})
  }, [])

  // ── Realtime: design & zoom events ────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    const unsubs = [
      subscribe('DESIGN_ZOOM_CREATED', (p: any) => {
        show('📹 Zoom уулзалт товлогдлоо! Имэйлийг шалгаарай.')
        // Reload orders to refresh status
        apiFetch<any>('/orders/customer/'+user.id).then(o => setOrders(Array.isArray(o)?o:[])).catch(()=>{})
      }),
      subscribe('DESIGN_APPROVED', () => {
        apiFetch<any>('/orders/customer/'+user.id).then(o => setOrders(Array.isArray(o)?o:[])).catch(()=>{})
      }),
      subscribe('DESIGN_FILE_UPLOADED', () => {
        apiFetch<any>('/orders/customer/'+user.id).then(o => setOrders(Array.isArray(o)?o:[])).catch(()=>{})
      }),
    ]
    return () => unsubs.forEach(u => u())
  }, [user?.id, subscribe])

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
      // 1) Бүх сонгосон quote-уудаас захиалга үүсгэх
      let lastOrder: any = null
      let combinedTotal = 0
      for (const q of selectedQuotesList) {
        const orderData = await apiFetch<any>("/orders/from-quote", { method:"POST", body: { quote_id: q.id, payment_method: payMethod } })
        lastOrder = orderData?.data || orderData
        combinedTotal += Number(lastOrder?.total_price || q.total_price || 0)
      }
      const orderId = lastOrder?.id

      // 2) Payment create — нийлбэр дүнгээр
      const payRes = await apiFetch<any>(`/payment/create`, {
        method: 'POST',
        body: { orderId, amount: combinedTotal, method: payMethod },
      })

      if (payMethod === 'qr' && payRes?.qrImage && payRes?.invoiceNo) {
        setQrInfo({ invoiceNo: payRes.invoiceNo, qrImage: payRes.qrImage, expiresAt: payRes.expiresAt })
        pollStatus(payRes.invoiceNo)
      } else if (payMethod === 'bank' && payRes) {
        // Bank шилжүүлэг — modal дотор мэдээлэл харуулна, хаахгүй
        show('Банкны мэдээлэл харагдаж байна — шилжүүлэг хийнэ үү')
      } else {
        show('Захиалга амжилттай үүслээ')
        setShowPayment(false)
      }
      setSelQ(new Set())
      // refresh
      const o = await apiFetch<any>("/orders/customer/"+user?.id).catch(()=>[])
      const q2 = await apiFetch<any>('/quote/my').catch(()=>[])
      setOrders(Array.isArray(o)?o:[]); setQuotes(Array.isArray(q2)?q2:[])
    } catch (err) {
      show("Алдаа гарлаа: " + ((err as any)?.message || ''))
    } finally {
      setOrdering(false); setPayLoading(false)
    }
  }

  const pollStatus = async (invoiceNo: string) => {
    const timer = setInterval(async () => {
      try {
        const data = await apiFetch<any>(`/payment/status/${invoiceNo}`)
        if (data?.status === 1 || data?.status === 'PAID' || data?.status === 'paid') {
          clearInterval(timer)
          show('Төлбөр амжилттай!')
          setShowPayment(false); setQrInfo(null)
          const o = await apiFetch<any>("/orders/customer/"+user?.id).catch(()=>[]); setOrders(Array.isArray(o)?o:[])
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
    for (const qid of selQ) { try { await apiFetch<any>('/orders/from-quote', { method: 'POST', body: { quote_id: qid } }) } catch {} }
    show(selQ.size + ' захиалга үүсгэгдлээ!'); setSelQ(new Set())
    const o = await apiFetch<any>('/orders/customer/'+user?.id).catch(()=>[])
    const q = await apiFetch<any>('/quote/my').catch(()=>[])
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

  const QS: Record<string, { label: string; color: string; bg: string }> = {
    sent: { label: 'Илгээсэн', color: '#2563EB', bg: '#DBEAFE' },
    confirmed: { label: 'Баталгаажсан', color: '#059669', bg: '#D1FAE5' },
    ordered: { label: 'Захиалагдсан', color: '#EA580C', bg: '#FFEDD5' },
    expired: { label: 'Хугацаа дууссан', color: '#9CA3AF', bg: '#F3F4F6' },
    draft: { label: 'Ноорог', color: '#6B7280', bg: '#F3F4F6' },
    accepted: { label: 'Зөвшөөрсөн', color: '#059669', bg: '#D1FAE5' },
    pending: { label: 'Хүлээгдэж буй', color: '#D97706', bg: '#FEF3C7' },
    rejected: { label: 'Татгалзсан', color: '#DC2626', bg: '#FEE2E2' },
  }
  const getQS = (s: string) => QS[s] || { label: s, color: '#6B7280', bg: '#F3F4F6' }

  const fetchQuotesByEmail = async (email: string) => {
    if (!email) return
    setQuotesLoading(true)
    try {
      const data = await apiFetch<any>('/quote/guest?email=' + encodeURIComponent(email))
      setQuotes(Array.isArray(data) ? data : [])
      setQuoteEmail(email)
    } catch { setQuotes([]) }
    finally { setQuotesLoading(false) }
  }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)' }}><div style={{ textAlign:'center' }}><div style={{ width:40, height:40, border:'3px solid #FF6B00', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/><div style={{ color:'var(--text2)', fontSize:14 }}>Ачааллж байна...</div></div><style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style></div>

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)', fontFamily:"'Segoe UI',system-ui,sans-serif", color:'var(--text)' }}>
      {toast && <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', background:'var(--surface)', color:'var(--text)', padding:'10px 28px', borderRadius:99, fontSize:14, fontWeight:500, zIndex:9999, boxShadow:'0 8px 30px rgba(0,0,0,0.15)', border:'1px solid var(--border)' }}>{toast}</div>}

      {/* ═══ SIDEBAR ═══ */}
      <div style={{ width:224, minWidth:224, height:'100vh', background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', position:'sticky', top:0, zIndex:20, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
        <div onClick={()=>router.push('/')} style={{ height:54, padding:'0 14px', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid var(--border)', cursor:'pointer' }}>
          <div style={{ width:26, height:26, background:'#FF6B00', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><svg width="13" height="13" fill="#fff" viewBox="0 0 18 18"><rect x="2" y="2" width="6" height="6" rx="1.5"/><rect x="10" y="2" width="6" height="6" rx="1.5" opacity=".6"/><rect x="2" y="10" width="6" height="6" rx="1.5" opacity=".6"/><rect x="10" y="10" width="6" height="6" rx="1.5" opacity=".85"/></svg></div>
          <div><div style={{ fontSize:13, fontWeight:600, lineHeight:1 }}><span style={{ color:'#FF6B00' }}>Biz</span>Print</div><div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{dashMode==='creator'?'Creator':'Dashboard'}</div></div>
        </div>
        <div onClick={() => setShowProfile(true)} style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:user?.avatar_url?`url(${user.avatar_url}) center/cover`:'#FF6B00', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600, flexShrink:0 }}>{!user?.avatar_url&&(user?.full_name?.charAt(0)?.toUpperCase()||'U')}</div>
          <div style={{ overflow:'hidden' }}>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.full_name||user?.email}</div>
            <span style={{ fontSize:10, color:'#FF6B00', background:'rgba(255,107,0,0.1)', padding:'1px 6px', borderRadius:20 }}>{dashMode==='creator'?'creator':(user?.role||'customer')}</span>
          </div>
        </div>
        {/* ── MODE SWITCHER ── */}
        {user?.is_creator && (
          <div style={{ padding:'8px 10px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
            <div style={{ display:'flex', borderRadius:8, overflow:'hidden', background:'var(--surface2)', border:'1px solid var(--border)' }}>
              <button
                onClick={()=>{setDashMode('customer');setSection('orders');localStorage.setItem('bizprint_role_mode','customer')}}
                style={{ flex:1, padding:'6px 0', border:'none', cursor:'pointer', fontSize:11, fontWeight:600, borderRadius:7, fontFamily:"'Segoe UI',system-ui,sans-serif", transition:'all .15s', background:dashMode==='customer'?'#FF6B00':'transparent', color:dashMode==='customer'?'#fff':'var(--text3)' }}>
                Захиалагч
              </button>
              <button
                onClick={()=>{setDashMode('creator');setSection('c_home');localStorage.setItem('bizprint_role_mode','creator')}}
                style={{ flex:1, padding:'6px 0', border:'none', cursor:'pointer', fontSize:11, fontWeight:600, borderRadius:7, fontFamily:"'Segoe UI',system-ui,sans-serif", transition:'all .15s', background:dashMode==='creator'?'#8B5CF6':'transparent', color:dashMode==='creator'?'#fff':'var(--text3)' }}>
                Creator
              </button>
            </div>
          </div>
        )}

        <div style={{ flex:1, padding:'6px', overflowY:'auto' }}>
          {dashMode === 'customer' ? (<>
            <div style={{ fontSize:10, fontWeight:600, color:'var(--text4)', letterSpacing:'0.1em', padding:'10px 10px 4px', textTransform:'uppercase' }}>Удирдлага</div>
            {[{key:'orders',label:'Захиалгууд',icon:'📦',count:orders.length},{key:'quotes',label:'Үнийн санал',icon:'💰',count:quotes.length},{key:'ugc',label:'Marketplace',icon:'🌐',count:null},{key:'tickets',label:'Асуулт/Тикет',icon:'🎫',count:myTickets.length},{key:'recommend',label:'Бүтээгдэхүүн',icon:'🏪',count:null},{key:'profile',label:'Профайл',icon:'👤',count:null}].map(n=>(<button key={n.key} onClick={()=>n.key==='profile'?setShowProfile(true):setSection(n.key)} style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8, border:'none', background:section===n.key?'rgba(255,107,0,0.1)':'transparent', color:section===n.key?'#FF6B00':'var(--text3)', cursor:'pointer', fontSize:13, fontWeight:section===n.key?500:400, marginBottom:1, fontFamily:"'Segoe UI',system-ui,sans-serif" }}><span style={{ fontSize:15, width:15 }}>{n.icon}</span><span>{n.label}</span>{n.count!==null&&<span style={{ marginLeft:'auto', fontSize:10, background:section===n.key?'rgba(255,107,0,0.15)':'var(--surface2)', padding:'1px 6px', borderRadius:99, fontWeight:600 }}>{n.count}</span>}</button>))}
            <div style={{ fontSize:10, fontWeight:600, color:'var(--text4)', letterSpacing:'0.1em', padding:'10px 10px 4px', textTransform:'uppercase' }}>Дижитал</div>
            {[{label:'Урилгууд',icon:'💌',href:'/dashboard/customer/invitations'},{label:'Бүтээгдэхүүн QR',icon:'📦',href:'/dashboard/customer/product-qr'},{label:'Нэхэмжлэх',icon:'🧾',href:'/dashboard/customer/invoices'},{label:'Loyalty карт',icon:'⭐',href:'/dashboard/customer/loyalty'},{label:'Кампанит',icon:'🎯',href:'/dashboard/customer/campaigns'},{label:'Эрх & Багц',icon:'💎',href:'/dashboard/customer/subscription'},{label:'Аналитик',icon:'📊',href:'/dashboard/customer/analytics'}].map(a=>(<button key={a.label} onClick={()=>router.push(a.href)} style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8, border:'none', background:'transparent', color:'var(--text3)', cursor:'pointer', fontSize:13, fontFamily:"'Segoe UI',system-ui,sans-serif", marginBottom:1 }}><span style={{ fontSize:14, width:15 }}>{a.icon}</span><span>{a.label}</span></button>))}
            <div style={{ fontSize:10, fontWeight:600, color:'var(--text4)', letterSpacing:'0.1em', padding:'10px 10px 4px', textTransform:'uppercase' }}>Түргэн үйлдэл</div>
            {[{label:'Нэрийн хуудас',icon:'🪪',href:'/dashboard/customer/business-cards'},{label:'Шинэ захиалга',icon:'➕',href:'/dashboard/customer/new-order'},{label:'Үнэ тооцоолох',icon:'🧮',href:'/dashboard/customer/quote-calc'},{label:'AI Smart Quote',icon:'🤖',href:'/dashboard/customer/smart-quote'},{label:'Дэлгүүр',icon:'🛍️',href:'/dashboard/customer/shop'},{label:'Контент захиалах',icon:'🎨',href:'/dashboard/customer/ugc'}].map(a=>(<button key={a.label} onClick={()=>router.push(a.href)} style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8, border:'none', background:'transparent', color:'var(--text3)', cursor:'pointer', fontSize:13, fontFamily:"'Segoe UI',system-ui,sans-serif", marginBottom:1 }}><span style={{ fontSize:14, width:15 }}>{a.icon}</span><span>{a.label}</span></button>))}
          </>) : (<>
            <div style={{ fontSize:10, fontWeight:600, color:'var(--text4)', letterSpacing:'0.1em', padding:'10px 10px 4px', textTransform:'uppercase' }}>Контент</div>
            {[{key:'c_home',label:'Dashboard',icon:'🏠'},{key:'c_jobs',label:'Нээлттэй ажлууд',icon:'💼'},{key:'c_projects',label:'Миний төслүүд',icon:'📁'},{key:'c_submit',label:'Контент илгээх',icon:'📤'},{key:'c_earnings',label:'Орлого',icon:'💰'},{key:'c_portfolio',label:'Портфолио',icon:'🎨'}].map(n=>(<button key={n.key} onClick={()=>setSection(n.key)} style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8, border:'none', background:section===n.key?'rgba(255,107,0,0.1)':'transparent', color:section===n.key?'#FF6B00':'var(--text3)', cursor:'pointer', fontSize:13, fontWeight:section===n.key?500:400, marginBottom:1, fontFamily:"'Segoe UI',system-ui,sans-serif" }}><span style={{ fontSize:14, width:15 }}>{n.icon}</span><span>{n.label}</span></button>))}
            <div style={{ fontSize:10, fontWeight:600, color:'var(--text4)', letterSpacing:'0.1em', padding:'10px 10px 4px', textTransform:'uppercase' }}>Бусад</div>
            {[{label:'Дэлгүүр',icon:'🛍️',href:'/shop'},{label:'Marketplace',icon:'🌐',href:'/marketplace'},{label:'Чат',icon:'💬',href:'/dashboard/chat'}].map(a=>(<button key={a.label} onClick={()=>router.push(a.href)} style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8, border:'none', background:'transparent', color:'var(--text3)', cursor:'pointer', fontSize:13, fontFamily:"'Segoe UI',system-ui,sans-serif", marginBottom:1 }}><span style={{ fontSize:14, width:15 }}>{a.icon}</span><span>{a.label}</span></button>))}
          </>)}
        </div>
        <div style={{ borderTop:'1px solid var(--border)', padding:'8px 6px', flexShrink:0 }}>
          {!user?.is_creator && (
            <button onClick={()=>router.push('/dashboard/customer/become-creator')} style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8, border:'none', background:'rgba(139,92,246,0.08)', color:'#8B5CF6', cursor:'pointer', fontSize:13, fontFamily:"'Segoe UI',system-ui,sans-serif", marginBottom:2, fontWeight:500 }}>🎨 Creator болох</button>
          )}
          <button onClick={()=>router.push('/')} style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8, border:'none', background:'transparent', color:'var(--text4)', cursor:'pointer', fontSize:13, fontFamily:"'Segoe UI',system-ui,sans-serif", marginBottom:2 }}>↗ Сайт харах</button>
          {user?.role==='admin'&&<button onClick={()=>router.push('/admin')} style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8, border:'none', background:'rgba(255,107,0,0.08)', color:'#FF6B00', cursor:'pointer', fontSize:13, fontFamily:"'Segoe UI',system-ui,sans-serif", marginBottom:2, fontWeight:500 }}>⚙️ Admin Panel</button>}
          <button onClick={()=>{localStorage.clear();router.push('/')}} style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8, border:'none', background:'transparent', color:'var(--text4)', cursor:'pointer', fontSize:13, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>🚪 Гарах</button>
        </div>
      </div>

      {/* ═══ MAIN ═══ */}
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>
        {/* Topbar */}
        <div style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', padding:'0 24px', height:54, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,107,0,0.08)', border:'1px solid rgba(255,107,0,0.15)', borderRadius:6, padding:'3px 10px' }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:'#FF6B00' }}/>
            <span style={{ fontSize:12, color:'#FF6B00', fontWeight:500 }}>{dashMode==='creator'?'Creator Dashboard':'Dashboard'}</span>
          </div>
          {user?.is_creator && (
            <div style={{ display:'flex', alignItems:'center', gap:6, background:dashMode==='creator'?'rgba(139,92,246,0.08)':'rgba(107,114,128,0.08)', border:`1px solid ${dashMode==='creator'?'rgba(139,92,246,0.15)':'rgba(107,114,128,0.15)'}`, borderRadius:6, padding:'3px 10px' }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:dashMode==='creator'?'#8B5CF6':'#6B7280' }}/>
              <span style={{ fontSize:12, color:dashMode==='creator'?'#8B5CF6':'#6B7280', fontWeight:500 }}>{dashMode==='creator'?'Creator Mode':'Customer Mode'}</span>
            </div>
          )}
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
        {dashMode === 'creator' ? (
          <div style={{ maxWidth:960, margin:'0 auto', padding:'32px 40px' }}>
            {section === 'c_home' && <CreatorDashboardContent />}
            {section === 'c_jobs' && <CreatorJobsPage />}
            {section === 'c_projects' && <CreatorProjectsPage />}
            {section === 'c_submit' && <CreatorSubmitPage />}
            {section === 'c_earnings' && <CreatorEarningsPage />}
            {section === 'c_portfolio' && <CreatorPortfolioPage />}
          </div>
        ) : (
        <div style={{ maxWidth:960, margin:'0 auto', padding:'32px 40px' }}>
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontSize:28, fontWeight:700, margin:0, letterSpacing:'-0.03em' }}>Сайн байна уу, {user?.full_name?.split(' ')[0]||'Хэрэглэгч'}</h1>
            <p style={{ color:'var(--text2)', fontSize:15, margin:'4px 0 0', fontFamily:"'DM Sans',sans-serif" }}>Таны хэвлэлийн захиалгуудын хураангуй</p>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
            {[{label:'Идэвхтэй',val:String(activeOrders.length),sub:'захиалга',color:'#FF6B00',bg:'linear-gradient(135deg,#FFF7ED,#FFEDD5)'},{label:'Үнийн санал',val:String(pendingQ.length),sub:'хүлээгдэж буй',color:'#2563EB',bg:'linear-gradient(135deg,#EFF6FF,#DBEAFE)'},{label:'Зарцуулсан',val:'₮'+totalSpent.toLocaleString(),sub:orders.length+' захиалга',color:'#047857',bg:'linear-gradient(135deg,#ECFDF5,#D1FAE5)'},{label:'Дууссан',val:String(doneOrders.length),sub:'амжилттай',color:'#7C3AED',bg:'linear-gradient(135deg,#F5F3FF,#EDE9FE)'}].map(k=>(<div key={k.label} style={{ background:k.bg, borderRadius:14, padding:'18px 20px' }}><div style={{ fontSize:12, color:k.color, fontWeight:600, marginBottom:8, fontFamily:"'DM Sans',sans-serif", textTransform:'uppercase', letterSpacing:'0.05em', opacity:0.8 }}>{k.label}</div><div style={{ fontSize:26, fontWeight:700, color:k.color, lineHeight:1, letterSpacing:'-0.02em' }}>{k.val}</div><div style={{ fontSize:12, color:k.color, opacity:0.6, marginTop:4, fontFamily:"'DM Sans',sans-serif" }}>{k.sub}</div></div>))}
          </div>

          {/* Tab bar */}
          <div style={{ display:'flex', gap:0, marginBottom:24, borderBottom:'2px solid #E7E5E4' }}>
            {[{key:'orders',label:'Захиалгууд',count:orders.length},{key:'quotes',label:'Үнийн саналууд',count:quotes.length},{key:'ugc',label:'Marketplace'},{key:'tickets',label:'Тикет',count:myTickets.length},{key:'recommend',label:'Бүтээгдэхүүн'}].map(t=>(<button key={t.key} onClick={()=>setSection(t.key)} style={{ padding:'12px 20px', border:'none', borderBottom:section===t.key?'2px solid #FF6B00':'2px solid transparent', marginBottom:'-2px', background:'none', fontSize:14, fontWeight:section===t.key?600:400, color:section===t.key?'#1C1917':'#A8A29E', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>{t.label}{t.count!==undefined&&<span style={{ marginLeft:6, fontSize:11, background:section===t.key?'#FF6B00':'#E7E5E4', color:section===t.key?'#fff':'#78716C', padding:'1px 7px', borderRadius:99 }}>{t.count}</span>}</button>))}
          </div>

          {/* ═══ ORDERS ═══ */}
          {section==='orders' && (<div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {orders.length===0?(
              <div style={{ border:'2px dashed var(--border)', borderRadius:16, padding:'60px 24px', textAlign:'center' }}><div style={{ fontSize:48, marginBottom:12 }}>📦</div><div style={{ fontSize:20, fontWeight:600, marginBottom:6 }}>Захиалга байхгүй байна</div><div style={{ fontSize:14, color:'var(--text2)', marginBottom:20 }}>Эхний захиалгаа өгөөд хэвлэлийн аялалаа эхлүүлээрэй</div><button onClick={()=>router.push('/quote')} style={{ background:'#1C1917', color:'#fff', border:'none', padding:'12px 28px', borderRadius:99, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>+ Шинэ захиалга өгөх</button></div>
            ):orders.map(o=>{const s=gs(o.status);const si=stepIdx(o.status);return(
              <div key={o.id} onClick={()=>setDetailOrder(o)} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'20px 24px', cursor:'pointer', transition:'all .2s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor='#FF6B00';e.currentTarget.style.boxShadow='0 4px 20px rgba(255,107,0,0.08)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#E7E5E4';e.currentTarget.style.boxShadow='none'}}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:16 }}><div><div style={{ fontSize:18, fontWeight:600, marginBottom:3, letterSpacing:'-0.01em' }}>{o.product_name||'Захиалга'}</div><div style={{ fontSize:13, color:'var(--text3)', fontFamily:"'DM Sans',sans-serif" }}>#{o.id.slice(0,8)} · {o.quantity}ш · {new Date(o.created_at).toLocaleDateString()}</div></div><div style={{ textAlign:'right' }}><div style={{ fontSize:20, fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em' }}>₮{Number(o.total_price||0).toLocaleString()}</div><span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, background:s.bg, color:s.color, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{s.label}</span></div></div>
                <div style={{ display:'flex', alignItems:'center', gap:0 }}>{STEP_LABELS.map((label,i)=>{const done=i<=si;const current=i===si;const last=i===STEP_LABELS.length-1;return(<div key={i} style={{ display:'flex', alignItems:'center', flex:last?0:1 }}><div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}><div style={{ width:24, height:24, borderRadius:'50%', background:done?(current?'#FF6B00':'#059669'):'#E7E5E4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:done?'#fff':'#A8A29E', fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>{done?(current?(si===5?'✓':'●'):'✓'):(i+1)}</div><div style={{ fontSize:10, color:current?'#FF6B00':done?'#78716C':'#D6D3D1', marginTop:4, fontWeight:current?600:400, fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap' }}>{label}</div></div>{!last&&<div style={{ flex:1, height:2, background:done&&i<si?'#059669':'#E7E5E4', minWidth:8, marginBottom:16 }}/>}</div>)})}</div>
                {/* Design approval CTA — show when order is in designing stage */}
                {['designing','in_design','under_review','revision_requested','updated_version','zoom_scheduled'].includes(o.status) && (
                  <div onClick={e=>e.stopPropagation()} style={{ marginTop:14, background:'linear-gradient(135deg,#F5F3FF,#EDE9FE)', border:'1px solid #8B5CF6', borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#6D28D9' }}>🎨 Дизайн батлалт шаардлагатай</div>
                      <div style={{ fontSize:11, color:'#7C3AED', marginTop:2, fontFamily:"'DM Sans',sans-serif" }}>
                        {o.status==='under_review'||o.status==='updated_version'||o.status==='zoom_scheduled' ? '⚡ Таны хариу хүлээж байна — батлах эсвэл засуулах' : 'Дизайнер загвар бэлтгэж байна'}
                      </div>
                    </div>
                    <button onClick={()=>router.push('/dashboard/customer/designs')} style={{ background:'#8B5CF6', color:'#fff', border:'none', padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontFamily:"'DM Sans',sans-serif" }}>
                      {o.status==='under_review'||o.status==='updated_version'||o.status==='zoom_scheduled' ? '✅ Батлах →' : '🎨 Харах →'}
                    </button>
                  </div>
                )}
              </div>
            )})}
          </div>)}

          {/* ═══ QUOTES (Үнийн саналууд) ═══ */}
          {section==='quotes' && (<div>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:20 }}>
              <div><h2 style={{ fontSize:24, fontWeight:700, margin:'0 0 4px', letterSpacing:'-0.02em' }}>Үнийн саналууд</h2><p style={{ fontSize:13, color:'var(--text3)', margin:0, fontFamily:"'DM Sans',sans-serif" }}>Таны авсан үнийн саналуудын түүх</p></div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>router.push('/dashboard/customer/quotes')} style={{ background:'var(--surface)', border:'1px solid var(--border)', padding:'9px 18px', borderRadius:99, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", color:'var(--text2)', display:'flex', alignItems:'center', gap:6 }}>Харангуй</button>
                <button onClick={()=>router.push('/quote')} style={{ background:'#FF6B00', color:'#fff', border:'none', padding:'9px 22px', borderRadius:99, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>+ Шинэ үнэ тооцоолох</button>
              </div>
            </div>

            {/* Email lookup for non-logged-in or additional search */}
            {!getToken() && !quoteEmail && (
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'24px', marginBottom:20, textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>Имэйл хаягаа оруулаад өмнөх үнийн саналаа харна уу</div>
                <div style={{ fontSize:13, color:'var(--text3)', marginBottom:16, fontFamily:"'DM Sans',sans-serif" }}>Бүртгэлгүй бол и-мэйл хаягаараа хайх боломжтой</div>
                <div style={{ display:'flex', gap:8, maxWidth:420, margin:'0 auto' }}>
                  <input type="email" value={quoteEmailInput} onChange={e=>setQuoteEmailInput(e.target.value)} placeholder="И-мэйл хаяг оруулна уу" style={{ flex:1, padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', fontSize:14, outline:'none', background:'#FAFAF8' }} onFocus={e=>e.currentTarget.style.borderColor='#FF6B00'} onBlur={e=>e.currentTarget.style.borderColor='#E7E5E4'} onKeyDown={e=>{if(e.key==='Enter')fetchQuotesByEmail(quoteEmailInput)}} />
                  <button onClick={()=>fetchQuotesByEmail(quoteEmailInput)} disabled={quotesLoading||!quoteEmailInput} style={{ background:'#1C1917', color:'#fff', border:'none', padding:'10px 22px', borderRadius:10, fontSize:14, fontWeight:600, cursor:quotesLoading?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", opacity:quotesLoading||!quoteEmailInput?0.5:1 }}>{quotesLoading?'Хайж байна...':'Хайх'}</button>
                </div>
              </div>
            )}

            {/* Quote KPI */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:'#E7E5E4', borderRadius:14, overflow:'hidden', marginBottom:20 }}>
              {[{label:'НИЙТ',val:String(quotes.length),color:'#FF6B00'},{label:'ХҮЧИНТЭЙ',val:String(pendingQ.length),color:'#2563EB'},{label:'НИЙТ ДҮН',val:'₮'+quotesTotal.toLocaleString(),color:'#047857'},{label:'СОНГОСОН',val:selQ.size+' / ₮'+selTotal.toLocaleString(),color:'#FF6B00'}].map(k=>(<div key={k.label} style={{ background:'var(--surface)', padding:'16px 20px' }}><div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.1em', marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>{k.label}</div><div style={{ fontSize:20, fontWeight:700, color:k.color, letterSpacing:'-0.02em' }}>{k.val}</div></div>))}
            </div>

            {/* Selected bar */}
            {selQ.size>0&&(<div style={{ background:'linear-gradient(135deg, #FF6B00, #FF8C40)', borderRadius:14, padding:'16px 24px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center', color:'#fff' }}>
              <div style={{ fontSize:15, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{selQ.size} үнийн санал сонгогдсон — Нийт: {selTotal.toLocaleString()}₮</div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setShowProposal(true)} style={{ background:'rgba(255,255,255,0.2)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', padding:'9px 18px', borderRadius:99, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:6 }}>Proposal PDF</button>
                <button onClick={()=>setShowPayment(true)} style={{ background:'var(--surface)', color:'var(--text)', border:'none', padding:'9px 20px', borderRadius:99, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:6 }}>QPay төлбөр</button>
              </div>
            </div>)}

            {/* Filter tabs */}
            <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
              <button onClick={()=>{if(selQ.size===pendingQ.length)setSelQ(new Set());else setSelQ(new Set(pendingQ.map(q=>q.id)))}} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:99, padding:'7px 16px', fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", color:'var(--text2)' }}>{selQ.size===pendingQ.length?'Бүгдийг болих':'Бүгдийг сонгох'}</button>
              {[{key:'all',label:'Бүгд'},{key:'active',label:'Хүчинтэй'},{key:'confirmed',label:'Батлагдсан'},{key:'done',label:'Дууссан'}].map(f=>(<button key={f.key} onClick={()=>setQFilter(f.key)} style={{ background:qFilter===f.key?'#FF6B00':'#fff', color:qFilter===f.key?'#fff':'#78716C', border:qFilter===f.key?'none':'1px solid #E7E5E4', borderRadius:99, padding:'7px 16px', fontSize:12, fontWeight:qFilter===f.key?600:400, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>{f.label}</button>))}
            </div>

            {/* Quote cards */}
            {quotesLoading ? (
              <div style={{ textAlign:'center', padding:'60px 24px' }}><div style={{ width:32, height:32, border:'3px solid #FF6B00', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/><div style={{ color:'var(--text2)', fontSize:14, fontFamily:"'DM Sans',sans-serif" }}>Ачааллж байна...</div></div>
            ) : filteredQuotes.length===0?(
              <div style={{ border:'2px dashed var(--border)', borderRadius:16, padding:'60px 24px', textAlign:'center' }}><div style={{ fontSize:48, marginBottom:12 }}>💰</div><div style={{ fontSize:20, fontWeight:600, marginBottom:6 }}>Үнийн санал байхгүй</div><div style={{ fontSize:14, color:'var(--text2)', marginBottom:20 }}>Шинэ тооцоолол хийх <span onClick={()=>router.push('/quote')} style={{ color:'#FF6B00', cursor:'pointer', fontWeight:600, textDecoration:'underline' }}>→</span></div><button onClick={()=>router.push('/quote')} style={{ background:'#1C1917', color:'#fff', border:'none', padding:'12px 28px', borderRadius:99, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Шинэ тооцоолол хийх →</button></div>
            ):(
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {filteredQuotes.map((q,qi)=>{
                  const qs=getQS(q.status||'draft'); const sel=selQ.has(q.id); const canSel=true
                  const qNum = q.quote_number || ('QT-' + (q.id||'').slice(0,8).toUpperCase() + '-' + String(quotes.length - qi).padStart(3,'0'))
                  const canOrder = ['sent','confirmed','accepted'].includes(q.status||'')
                  const validUntil = q.valid_until ? new Date(q.valid_until).toLocaleDateString() : (q.created_at ? getExpiry(q.created_at) : '')
                  return(
                    <div key={q.id} style={{ background:'var(--surface)', border:sel?'2px solid #FF6B00':'1px solid #E7E5E4', borderRadius:16, padding:'20px 24px', transition:'all .15s', cursor:canSel?'pointer':'default' }} onClick={()=>canSel&&toggleQ(q.id)}>
                      {/* Top row */}
                      <div style={{ display:'flex', alignItems:'start', gap:14 }}>
                        {/* Checkbox */}
                        {canSel&&<div style={{ marginTop:4, width:24, height:24, borderRadius:8, border:sel?'2px solid #FF6B00':'2px solid #D6D3D1', background:sel?'#FF6B00':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}>{sel&&<svg width="13" height="13" fill="#fff" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}</div>}

                        {/* Quote number badge */}
                        <div style={{ background:'#1C1917', borderRadius:8, padding:'6px 10px', textAlign:'center', flexShrink:0 }}><div style={{ fontSize:9, color:'rgba(255,255,255,0.5)', fontWeight:600, fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.05em' }}>QUOTE</div><div style={{ fontSize:11, fontWeight:700, color:'#fff', fontFamily:"'DM Sans',sans-serif", letterSpacing:'-0.01em' }}>{qNum.length > 16 ? qNum.slice(-7) : qNum}</div></div>

                        {/* Info */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                            <span style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.01em' }}>{q.product_name||q.product_subtype||'Үнийн санал'}</span>
                            <span style={{ fontSize:13, color:'var(--text2)', fontFamily:"'DM Sans',sans-serif" }}>{q.quantity||0} ширхэг</span>
                            <span style={{ fontSize:10, padding:'3px 10px', borderRadius:99, background:qs.bg, color:qs.color, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{qs.label}</span>
                          </div>
                          <div style={{ fontSize:12, color:'var(--text3)', fontFamily:"'DM Sans',sans-serif" }}>
                            {q.width_mm&&q.height_mm?q.width_mm+'x'+q.height_mm+'мм':'A4'} · {q.paper_gsm?q.paper_gsm+'gsm':''} · {q.color_mode||'Өнгөт'} · {q.created_at?new Date(q.created_at).toLocaleDateString():''}
                          </div>
                        </div>

                        {/* Price */}
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontSize:24, fontWeight:700, color:'#FF6B35', letterSpacing:'-0.02em' }}>{Number(q.total_price||0).toLocaleString()}₮</div>
                          {q.unit_price&&<div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Sans',sans-serif" }}>Нэгж: {Number(q.unit_price).toLocaleString()}₮</div>}
                        </div>
                      </div>

                      {/* Bottom row */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14, paddingTop:12, borderTop:'1px solid #F5F5F4' }}>
                        <div style={{ fontSize:12, fontFamily:"'DM Sans',sans-serif", color: (q.valid_until && new Date(q.valid_until) < new Date()) || q.status === 'expired' ? '#DC2626' : '#A8A29E' }}>{(q.valid_until && new Date(q.valid_until) < new Date()) || q.status === 'expired' ? 'Хугацаа дууссан' : `Хүчинтэй: ${validUntil} хүртэл`}</div>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={e=>{e.stopPropagation(); router.push('/quote?product='+encodeURIComponent(q.product_name||''))}} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:99, padding:'5px 14px', fontSize:11, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", color:'var(--text2)' }}>Дахин тооцоолох</button>
                          <button onClick={e=>{e.stopPropagation(); setTicketQuoteId(q.id); setTicketSubject('Quote '+qNum+' асуулт'); setShowTicket(true)}} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:99, padding:'5px 14px', fontSize:11, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", color:'var(--text2)' }}>Асуулт / Гомдол</button>
                          {canOrder && (
                            <button onClick={e=>{e.stopPropagation(); router.push('/checkout?quote_id='+q.id)}} style={{ background:'#FF6B35', color:'#fff', border:'none', borderRadius:99, padding:'5px 14px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Захиалга болгох →</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>)}

          {/* ═══ TICKETS ═══ */}
          {section==='tickets' && (<div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div><h2 style={{ fontSize:24, fontWeight:700, margin:'0 0 4px', letterSpacing:'-0.02em' }}>Тикетүүд</h2><p style={{ fontSize:13, color:'var(--text3)', margin:0, fontFamily:"'DM Sans',sans-serif" }}>Таны асуулт, санал хүсэлтүүд</p></div>
              <button onClick={()=>setShowTicket(true)} style={{ background:'#FF6B00', color:'#fff', border:'none', padding:'9px 22px', borderRadius:99, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>+ Шинэ тикет</button>
            </div>
            {myTickets.length===0?(<div style={{ border:'2px dashed var(--border)', borderRadius:16, padding:'60px 24px', textAlign:'center' }}><div style={{ fontSize:48, marginBottom:12 }}>🎫</div><div style={{ fontSize:20, fontWeight:600, marginBottom:6 }}>Тикет байхгүй</div><div style={{ fontSize:14, color:'var(--text2)' }}>Асуулт байвал тикет нээнэ үү</div></div>):(
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {myTickets.map(t=>{const sc:Record<string,{l:string;c:string;b:string}>={OPEN:{l:'Нээлттэй',c:'#FF6B00',b:'#FFF7ED'},IN_PROGRESS:{l:'Шийдвэрлэж буй',c:'#2563EB',b:'#DBEAFE'},RESOLVED:{l:'Шийдсэн',c:'#059669',b:'#D1FAE5'},CLOSED:{l:'Хаагдсан',c:'#6B7280',b:'#F3F4F6'}};const s=sc[t.status]||{l:t.status,c:'#6B7280',b:'#F3F4F6'};return(
                  <div key={t.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 22px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start' }}>
                      <div><div style={{ fontSize:12, color:'var(--text3)', fontFamily:"'DM Sans',sans-serif", marginBottom:4 }}>{t.ticket_number}</div><div style={{ fontSize:16, fontWeight:600, marginBottom:4 }}>{t.subject}</div><div style={{ fontSize:12, color:'var(--text3)', fontFamily:"'DM Sans',sans-serif" }}>{new Date(t.created_at).toLocaleDateString()}</div></div>
                      <span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, background:s.b, color:s.c, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{s.l}</span>
                    </div>
                    {t.messages && t.messages.length > 0 && (<div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #F5F5F4' }}>{t.messages.slice(-2).map((m:any,i:number)=>(<div key={i} style={{ fontSize:13, color:'var(--text2)', marginBottom:4 }}><span style={{ fontWeight:600, color:m.sender==='admin'?'#FF6B00':'#1C1917' }}>{m.sender}:</span> {m.content?.slice(0,100)}{m.content?.length>100?'...':''}</div>))}</div>)}
                  </div>
                )})}
              </div>
            )}
          </div>)}

          {/* ═══ UGC CONTENT ═══ */}
          {section==='ugc' && (<MarketplaceSection />)}

          {/* ═══ RECOMMEND ═══ */}
          {section==='recommend' && (<div>
            <div style={{ background:'linear-gradient(135deg,#1C1917,#292524)', borderRadius:16, padding:'28px 32px', marginBottom:24, color:'#fff', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:'-20px', right:'-10px', fontSize:100, opacity:0.05, transform:'rotate(-12deg)' }}>🖨️</div>
              <div style={{ fontSize:22, fontWeight:700, marginBottom:6, letterSpacing:'-0.02em', position:'relative' }}>Танд зориулсан</div>
              <div style={{ fontSize:14, color:'var(--text3)', position:'relative', fontFamily:"'DM Sans',sans-serif" }}>Хамгийн их захиалагддаг бүтээгдэхүүн, хямдралтай санал</div>
            </div>
            {products.length===0?(
              <div style={{ border:'2px dashed var(--border)', borderRadius:16, padding:'60px 24px', textAlign:'center' }}><div style={{ fontSize:48, marginBottom:12 }}>🏪</div><div style={{ fontSize:20, fontWeight:600, marginBottom:6 }}>Бүтээгдэхүүн удахгүй</div><div style={{ fontSize:14, color:'var(--text2)' }}>Тун удахгүй нэмэгдэнэ</div></div>
            ):(
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>{products.slice(0,9).map((p,i)=>{const disc=i<3?[15,20,10][i]:0;return(
                <div key={p.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', transition:'all .2s', cursor:'pointer', position:'relative' }} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.06)'}} onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
                  {disc>0&&<div style={{ position:'absolute', top:10, left:10, background:'#DC2626', color:'#fff', padding:'3px 10px', borderRadius:99, fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif", zIndex:1 }}>-{disc}%</div>}
                  <div style={{ height:140, background:'linear-gradient(135deg,#F5F5F4,#E7E5E4)', display:'flex', alignItems:'center', justifyContent:'center' }}>{p.image_url?<img src={p.image_url.startsWith('http')?p.image_url:API_URL+'/'+p.image_url} style={{ maxHeight:'100%', maxWidth:'100%', objectFit:'cover' }} alt={p.name}/>:<span style={{ fontSize:48, opacity:0.15 }}>🖨️</span>}</div>
                  <div style={{ padding:'14px 16px' }}><div style={{ fontSize:14, fontWeight:600, marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div><div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:10 }}>{disc>0?(<><span style={{ fontSize:18, fontWeight:700, color:'#DC2626' }}>₮{Math.round(Number(p.price||0)*(1-disc/100)).toLocaleString()}</span><span style={{ fontSize:12, color:'var(--text3)', textDecoration:'line-through', fontFamily:"'DM Sans',sans-serif" }}>₮{Number(p.price||0).toLocaleString()}</span></>):(<span style={{ fontSize:18, fontWeight:700 }}>₮{Number(p.price||0).toLocaleString()}</span>)}</div><button onClick={()=>router.push('/order')} style={{ width:'100%', background:'#1C1917', color:'#fff', border:'none', padding:'9px 0', borderRadius:99, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Захиалах</button></div>
                </div>
              )})}</div>
            )}
          </div>)}
        </div>
        )}
        </div>
      </div>

      {/* ═══ ORDER DETAIL ═══ */}
      {detailOrder&&(<div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setDetailOrder(null)}><div style={{ background:'var(--surface)', borderRadius:20, width:'100%', maxWidth:540, maxHeight:'85vh', overflow:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.15)', padding:'28px 32px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:20 }}><div><div style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.02em', marginBottom:3 }}>{detailOrder.product_name||'Захиалга'}</div><div style={{ fontSize:13, color:'var(--text3)', fontFamily:"'DM Sans',sans-serif" }}>#{detailOrder.id.slice(0,12)} · {new Date(detailOrder.created_at).toLocaleDateString()}</div></div><button onClick={()=>setDetailOrder(null)} style={{ background:'var(--surface2)', border:'none', color:'var(--text2)', width:32, height:32, borderRadius:10, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button></div>
        <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:24, padding:'16px 0' }}>{STEP_LABELS.map((label,i)=>{const si2=stepIdx(detailOrder.status);const done=i<=si2;const current=i===si2;const last=i===STEP_LABELS.length-1;return(<div key={i} style={{ display:'flex', alignItems:'center', flex:last?0:1 }}><div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}><div style={{ width:28, height:28, borderRadius:'50%', background:done?(current?'#FF6B00':'#059669'):'#E7E5E4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:done?'#fff':'#A8A29E', fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>{done?'✓':(i+1)}</div><div style={{ fontSize:10, color:current?'#FF6B00':done?'#78716C':'#D6D3D1', marginTop:4, fontWeight:current?600:400, fontFamily:"'DM Sans',sans-serif" }}>{label}</div></div>{!last&&<div style={{ flex:1, height:2, background:done&&i<si2?'#059669':'#E7E5E4', minWidth:8, marginBottom:16 }}/>}</div>)})}</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 24px', fontSize:14, fontFamily:"'DM Sans',sans-serif" }}>{[{l:'Тоо ширхэг',v:detailOrder.quantity+'ш'},{l:'Нийт дүн',v:'₮'+Number(detailOrder.total_price||0).toLocaleString()},{l:'Хэмжээ',v:detailOrder.width_mm&&detailOrder.height_mm?detailOrder.width_mm+'×'+detailOrder.height_mm+'мм':'—'},{l:'Цаас',v:detailOrder.paper_gsm?detailOrder.paper_gsm+'gsm':'—'},{l:'Өнгө',v:detailOrder.color_mode||'—'},{l:'Finishing',v:detailOrder.finishing||'—'}].map(item=>(<div key={item.l} style={{ padding:'8px 0', borderBottom:'1px solid #F5F5F4' }}><span style={{ color:'var(--text3)', fontSize:12 }}>{item.l}</span><div style={{ fontWeight:500, marginTop:2 }}>{item.v}</div></div>))}</div>
      </div></div>)}

      {/* ═══ PROFILE MODAL ═══ */}
      <CreatorProfileModal open={showProfile} onClose={() => setShowProfile(false)} user={user}
        onUserUpdate={(updated: any) => { setUser(updated); setProfileForm({ full_name: updated.full_name || '', email: updated.email || '', phone: updated.phone || '', address: updated.address || '', company: updated.company || '' }) }}
        onSave={(updated: any) => { setUser(updated); setProfileForm({ full_name: updated.full_name || '', email: updated.email || '', phone: updated.phone || '', address: updated.address || '', company: updated.company || '' }); show('Профайл хадгалагдлаа ✅'); setShowProfile(false) }} />

      {showProposal && (<div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setShowProposal(false)}><div style={{ background:'var(--surface)', borderRadius:20, width:'100%', maxWidth:720, maxHeight:'90vh', overflow:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 28px', borderBottom:'1px solid #E7E5E4' }}><div style={{ fontSize:18, fontWeight:700 }}>Үнийн санал — Proposal</div><div style={{ display:'flex', gap:8 }}><button onClick={()=>{const w=window.open('','','width=800,height=600');if(w){w.document.write('<html><head><title>BizPrint Proposal</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#1C1917}table{width:100%;border-collapse:collapse}th,td{padding:10px 14px;text-align:left;border-bottom:1px solid #E7E5E4}th{background:#F5F5F4;font-size:12px;font-weight:600;color:#78716C}</style></head><body>'+document.getElementById("ppdf")?.innerHTML+'</body></html>');w.document.close();w.print()}}} style={{ background:'#1C1917', color:'#fff', border:'none', padding:'9px 20px', borderRadius:99, fontSize:13, fontWeight:600, cursor:'pointer' }}>🖨️ Хэвлэх</button><button onClick={()=>{const el=document.getElementById('ppdf');if(!el)return;const blob=new Blob(['<html><head><meta charset=utf-8><title>BizPrint Proposal</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:48px;color:#1C1917}table{width:100%;border-collapse:collapse}th{padding:10px 14px;text-align:left;font-size:11px;font-weight:600;color:#78716C;border-bottom:2px solid #E7E5E4;background:#F9F9F8}td{padding:10px 14px;font-size:13px;border-bottom:1px solid #F0F0EE}td:last-child,th:last-child{text-align:right}</style></head><body>'+el.innerHTML+'</body></html>'],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='BizPrint-Proposal-'+new Date().toISOString().slice(0,10)+'.html';a.click()}} style={{ background:'#059669', color:'#fff', border:'none', padding:'9px 20px', borderRadius:99, fontSize:13, fontWeight:600, cursor:'pointer' }}>📥 Татах</button><button onClick={()=>setShowProposal(false)} style={{ background:'var(--surface2)', border:'none', color:'var(--text2)', width:32, height:32, borderRadius:10, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>x</button></div></div>
        <div id="ppdf" style={{ padding:'32px 36px', fontFamily:"'DM Sans',sans-serif" }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:28, paddingBottom:16, borderBottom:'2px solid #FF6B00' }}><div><div style={{ fontSize:28, fontWeight:700 }}><span style={{ color:'#FF6B00' }}>Biz</span>Print</div><div style={{ fontSize:12, color:'var(--text2)' }}>BizPrint Platform</div></div><div style={{ textAlign:'right', fontSize:12, color:'var(--text2)' }}><div>Ogнoo: {new Date().toLocaleDateString()}</div><div>Proposal #{String(Date.now()).slice(-6)}</div></div></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}><div style={{ background:'#FAFAF8', borderRadius:10, padding:'14px 18px' }}><div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', marginBottom:6 }}>Client</div><div style={{ fontSize:14, fontWeight:600 }}>{user?.full_name}</div><div style={{ fontSize:12, color:'var(--text2)' }}>{user?.email}</div></div><div style={{ background:'#FAFAF8', borderRadius:10, padding:'14px 18px' }}><div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', marginBottom:6 }}>Info</div><div style={{ fontSize:12, color:'var(--text2)' }}>Items: {selectedQuotesList.length}</div><div style={{ fontSize:12, color:'var(--text2)' }}>Valid: 3 days</div></div></div>
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:20 }}><thead><tr>{['#','Product','Qty','Specs','Unit','Total'].map(h=><th key={h} style={{ padding:'8px 12px', textAlign:h==='Total'||h==='Unit'?'right':'left', fontSize:11, fontWeight:600, color:'var(--text3)', borderBottom:'2px solid #E7E5E4' }}>{h}</th>)}</tr></thead><tbody>{selectedQuotesList.map((q,i)=><tr key={q.id} style={{ borderBottom:'1px solid #F5F5F4' }}><td style={{ padding:'10px 12px', fontSize:12, color:'var(--text2)' }}>{i+1}</td><td style={{ padding:'10px 12px' }}><div style={{ fontWeight:600, fontSize:13 }}>{q.product_name||'Item'}</div></td><td style={{ padding:'10px 12px', fontSize:12 }}>{q.quantity||0}</td><td style={{ padding:'10px 12px', fontSize:11, color:'var(--text2)' }}>{[q.paper_gsm?q.paper_gsm+'gsm':null,q.color_mode].filter(Boolean).join(', ')||'-'}</td><td style={{ padding:'10px 12px', textAlign:'right', fontSize:12 }}>{q.unit_price?Number(q.unit_price).toLocaleString()+'T':'-'}</td><td style={{ padding:'10px 12px', textAlign:'right', fontSize:14, fontWeight:700, color:'#FF6B00' }}>{Number(q.total_price||0).toLocaleString()}T</td></tr>)}</tbody></table>
          <div style={{ display:'flex', justifyContent:'flex-end' }}><div style={{ width:260 }}><div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:13, borderBottom:'1px solid #F5F5F4' }}><span style={{ color:'var(--text2)' }}>Subtotal</span><span style={{ fontWeight:600 }}>{selTotal.toLocaleString()}T</span></div><div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:13, borderBottom:'1px solid #F5F5F4' }}><span style={{ color:'var(--text2)' }}>VAT 10%</span><span style={{ fontWeight:600 }}>{Math.round(selTotal*0.1).toLocaleString()}T</span></div><div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', fontSize:16 }}><span style={{ fontWeight:700 }}>Total</span><span style={{ fontWeight:700, color:'#FF6B00', fontSize:20 }}>{Math.round(selTotal*1.1).toLocaleString()}T</span></div></div></div>
          <div style={{ borderTop:'1px solid #E7E5E4', paddingTop:16, marginTop:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}><div style={{ fontSize:11, color:'var(--text3)' }}>BizPrint (c) {new Date().getFullYear()}</div><button onClick={()=>{setShowProposal(false);setShowPayment(true)}} style={{ background:'#FF6B00', color:'#fff', border:'none', padding:'9px 20px', borderRadius:99, fontSize:13, fontWeight:600, cursor:'pointer' }}>💳 Төлбөр төлөх →</button></div>
        </div>
      </div></div>)}

      {showPayment && (<div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:1001, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setShowPayment(false)}><div style={{ background:'var(--surface)', borderRadius:20, width:'100%', maxWidth:460, boxShadow:'0 24px 80px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'24px 28px 16px', borderBottom:'1px solid #E7E5E4' }}><div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}><div style={{ fontSize:20, fontWeight:700 }}>Төлбөр төлөх</div><button onClick={()=>setShowPayment(false)} style={{ background:'var(--surface2)', border:'none', color:'var(--text2)', width:32, height:32, borderRadius:10, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>x</button></div><div style={{ background:'#1C1917', borderRadius:12, padding:'16px 20px', color:'#fff' }}><div style={{ fontSize:12, color:'var(--text3)' }}>{selectedQuotesList.length} үнийн санал · НӨАТ-тэй</div><div style={{ fontSize:28, fontWeight:700, marginTop:4 }}>{Math.round(selTotal*1.1).toLocaleString()}T</div></div></div>
        <div style={{ padding:'20px 28px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>{[{k:'qr',l:'TDB QR',d:'QR код уншуулж төлөх',i:'phone',t:'Санал болгож буй'},{k:'bank',l:'Банк шилжүүлэг',d:'Дансруу шилжүүлэх',i:'bank',t:null},{k:'cash',l:'Бэлэн мөнгө',d:'Хүргэлтийн үед төлөх',i:'cash',t:null}].map(m=><div key={m.k} onClick={()=>setPayMethod(m.k as any)} style={{ border:payMethod===m.k?'2px solid #FF6B00':'1px solid #E7E5E4', borderRadius:12, padding:'14px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:12, background:payMethod===m.k?'#FFF7ED':'#fff' }}><div style={{ fontSize:24 }}>{m.k==='qr'?'📱':m.k==='bank'?'🏦':'💵'}</div><div style={{ flex:1 }}><div style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ fontSize:14, fontWeight:600 }}>{m.l}</span>{m.t&&<span style={{ fontSize:9, padding:'2px 6px', borderRadius:99, background:'#DCFCE7', color:'#059669', fontWeight:600 }}>{m.t}</span>}</div><div style={{ fontSize:12, color:'var(--text3)' }}>{m.d}</div></div><div style={{ width:20, height:20, borderRadius:'50%', border:payMethod===m.k?'6px solid #FF6B00':'2px solid #D6D3D1' }}/></div>)}</div>
          {payMethod==='bank'&&<div style={{ background:'#FAFAF8', borderRadius:12, padding:'14px 18px', marginBottom:16, fontSize:13 }}>{[{l:'Банк',v:'Худалдаа Хөгжлийн Банк (ХХБ)'},{l:'IBAN',v:'220004000'},{l:'Данс',v:'453304134'},{l:'Эзэмшигч',v:'ЮүЭмБи Верто ХХК'},{l:'Гүйлгээний утга',v:'BP-'+String(Date.now()).slice(-6)}].map(r=><div key={r.l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #E7E5E4' }}><span style={{ color:'var(--text3)' }}>{r.l}</span><span style={{ fontWeight:600 }}>{r.v}</span></div>)}</div>}
          {payMethod==='qr' && qrInfo && (
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <div style={{ fontSize:12, color:'var(--text3)', marginBottom:6 }}>QR-г уншуулна уу</div>
              <img src={qrInfo.qrImage} alt="QR" style={{ maxWidth:'220px', margin:'0 auto', display:'block' }} />
              <div style={{ fontSize:11, color:'var(--text2)', marginTop:6 }}>Invoice: {qrInfo.invoiceNo}</div>
            </div>
          )}
          <button onClick={handlePayment} disabled={payLoading} style={{ width:'100%', background:'#FF6B00', color:'#fff', border:'none', padding:'14px 0', borderRadius:99, fontSize:15, fontWeight:700, cursor:payLoading?'not-allowed':'pointer' }}>{payLoading?'Үүсгэж байна...':'Баталгаажуулах'}</button>
        </div>
      </div></div>)}

      {showTicket && (<div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', zIndex:1002, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setShowTicket(false)}><div style={{ background:'var(--surface)', borderRadius:20, width:'100%', maxWidth:480, boxShadow:'0 24px 80px rgba(0,0,0,0.15)', padding:'28px 32px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}><div style={{ fontSize:20, fontWeight:700 }}>Тикет нээх</div><button onClick={()=>setShowTicket(false)} style={{ background:'var(--surface2)', border:'none', color:'var(--text2)', width:32, height:32, borderRadius:10, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button></div>
        <div style={{ display:'flex', flexDirection:'column', gap:14, fontFamily:"'DM Sans',sans-serif" }}>
          <div><label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:4 }}>Гарчиг *</label><input value={ticketSubject} onChange={e=>setTicketSubject(e.target.value)} placeholder="Асуултын гарчиг" style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', fontSize:14, outline:'none', background:'#FAFAF8', boxSizing:'border-box' }} /></div>
          <div><label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:4 }}>Дэлгэрэнгүй *</label><textarea value={ticketMessage} onChange={e=>setTicketMessage(e.target.value)} placeholder="Асуулт, гомдол, санал хүсэлтээ бичнэ үү..." rows={4} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', fontSize:14, outline:'none', background:'#FAFAF8', boxSizing:'border-box', resize:'vertical' }} /></div>
          <button onClick={submitTicket} disabled={ticketSending || !ticketSubject || !ticketMessage} style={{ width:'100%', background:'#FF6B00', color:'#fff', border:'none', padding:'12px 0', borderRadius:99, fontSize:14, fontWeight:600, cursor:ticketSending?'not-allowed':'pointer', opacity:ticketSending||!ticketSubject||!ticketMessage?0.6:1 }}>{ticketSending?'Илгээж байна...':'Тикет илгээх'}</button>
        </div>
      </div></div>)}

    </div>
  )
}

