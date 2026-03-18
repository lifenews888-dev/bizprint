'use client'
import { useEffect, useState } from 'react'
import { DesignJobsSection } from '@/components/DesignJobsSection'
import { useRouter } from 'next/navigation'
import ChatBox from '@/components/ChatBox'

const API = 'http://localhost:4000'
const F = "'Segoe UI',system-ui,sans-serif"

function authH() {
  const t = localStorage.getItem('access_token') || ''
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState('home')
  const [quotes, setQuotes] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [withdrawForm, setWithdrawForm] = useState({ amount:0, bank_name:'', bank_account:'', bank_account_name:'' })
  const [withdrawMsg, setWithdrawMsg] = useState('')
  const [templateForm, setTemplateForm] = useState({ title:'', title_mn:'', category:'Визит карт', price:0, royalty_rate:15, width_mm:90, height_mm:50, description:'', tags:'' })
  const [thumbFile, setThumbFile] = useState<File|null>(null)
  const [thumbPreview, setThumbPreview] = useState('')
  const [designFile, setDesignFile] = useState<File|null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/login'); return }
    fetch(API+'/auth/me', { headers: authH() })
      .then(r => r.json())
      .then(u => { setUser(u); loadAll(u) })
      .catch(() => router.push('/login'))
  }, [])

  async function loadAll(u: any) {
    setLoading(false)
    const [q, t, w, tx] = await Promise.all([
      fetch(`${API}/quotes-v2?email=${u.email}`, { headers: authH() }).then(r=>r.json()).catch(()=>[]),
      fetch(`${API}/templates/designer/${u.id}`, { headers: authH() }).then(r=>r.json()).catch(()=>[]),
      fetch(`${API}/wallet/balance`, { headers: authH() }).then(r=>r.json()).catch(()=>null),
      fetch(`${API}/wallet/transactions`, { headers: authH() }).then(r=>r.json()).catch(()=>[]),
    ])
    setQuotes(Array.isArray(q) ? q : [])
    setTemplates(Array.isArray(t) ? t : [])
    setWallet(w)
    setTransactions(Array.isArray(tx) ? tx : [])
  }

  async function submitWithdraw() {
    if (!withdrawForm.amount || !withdrawForm.bank_name || !withdrawForm.bank_account) {
      setWithdrawMsg('Бүх талбарыг бөглөнө үү'); return
    }
    const res = await fetch(`${API}/wallet/withdraw`, {
      method: 'POST', headers: authH(),
      body: JSON.stringify({ amount: withdrawForm.amount, bank_name: withdrawForm.bank_name, bank_account: withdrawForm.bank_account, bank_account_name: withdrawForm.bank_account_name })
    })
    if (res.ok) {
      setWithdrawMsg('✅ Хүсэлт амжилттай илгээгдлээ! Admin шалгасны дараа шилжүүлнэ.')
      setWithdrawForm({ amount:0, bank_name:'', bank_account:'', bank_account_name:'' })
    } else {
      setWithdrawMsg('❌ Алдаа гарлаа')
    }
  }

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    const token = localStorage.getItem('access_token') || ''
    const res = await fetch(API+'/upload/file', { method:'POST', headers:{ Authorization:'Bearer '+token }, body:fd })
    const data = await res.json()
    return data.url || data.filename || ''
  }

  async function submitTemplate() {
    if (!templateForm.title_mn) { setUploadMsg('Монгол нэр оруулна уу'); return }
    setSaving(true)
    setUploadMsg('')
    try {
      let thumbnail_url = ''
      let file_url = ''
      if (thumbFile) thumbnail_url = await uploadFile(thumbFile)
      if (designFile) file_url = await uploadFile(designFile)
      await fetch(API+'/templates', {
        method:'POST', headers: authH(),
        body: JSON.stringify({
          ...templateForm, thumbnail_url, file_url,
          designer_id: user.id, designer_name: user.name||user.email,
          price: Number(templateForm.price), royalty_rate: Number(templateForm.royalty_rate),
          width_mm: Number(templateForm.width_mm), height_mm: Number(templateForm.height_mm),
          tags: templateForm.tags ? templateForm.tags.split(',').map((t:string)=>t.trim()) : [],
        })
      })
      setUploadMsg('✅ Загвар илгээгдлээ! Admin зөвшөөрсний дараа нийтлэгдэнэ.')
      setTemplateForm({ title:'', title_mn:'', category:'Визит карт', price:0, royalty_rate:15, width_mm:90, height_mm:50, description:'', tags:'' })
      setThumbFile(null); setThumbPreview(''); setDesignFile(null)
      loadAll(user)
      setSection('templates')
    } catch { setUploadMsg('❌ Алдаа гарлаа') }
    setSaving(false)
  }

  async function createOrder(quoteId: string) {
    if (!confirm('Энэ үнийн саналыг захиалга болгох уу?')) return
    const res = await fetch(API+'/orders/from-quote', {
      method: 'POST', headers: authH(),
      body: JSON.stringify({ quote_id: quoteId, payment_method: 'bank_transfer' })
    })
    if (res.ok) {
      alert('✅ Захиалга амжилттай үүслээ! Имэйлээр баталгаажуулалт илгээгдлээ.')
      loadAll(user)
      setSection('quotes')
    } else {
      alert('❌ Алдаа гарлаа')
    }
  }

  const role = user?.role || 'customer'
  const fmt = (n: number) => Number(n).toLocaleString('mn-MN')
  const balance = Number(wallet?.balance || 0)

  const NAV = role === 'designer' ? [
    { k:'home',        icon:'🏠', label:'Нүүр' },
    { k:'templates',   icon:'🎨', label:'Загварууд' },
    { k:'upload',      icon:'➕', label:'Загвар нэмэх' },
    { k:'design_jobs', icon:'✏️', label:'Миний ажлууд' },
    { k:'wallet',      icon:'💰', label:'Wallet' },
    { k:'withdraw',    icon:'🏦', label:'Мөнгө татах' },
    { k:'profile',     icon:'👤', label:'Профайл' },
  ] : role === 'admin' ? [
    { k:'home',    icon:'🏠', label:'Нүүр' },
    { k:'quotes',  icon:'📋', label:'Quotes' },
    { k:'wallet',  icon:'💰', label:'Wallet' },
    { k:'profile', icon:'👤', label:'Профайл' },
  ] : [
    { k:'home',     icon:'🏠', label:'Нүүр' },
    { k:'quotes',   icon:'📋', label:'Үнийн саналууд' },
    { k:'wallet',   icon:'💰', label:'Wallet' },
    { k:'withdraw', icon:'🏦', label:'Мөнгө татах' },
    { k:'profile',  icon:'👤', label:'Профайл' },
  ]

  const inp: React.CSSProperties = { width:'100%', padding:'10px 12px', background:'#F8F8F6', border:'1px solid #E5E5E0', borderRadius:8, fontSize:14, color:'#0F0F0F', outline:'none', boxSizing:'border-box' }

  if (loading || !user) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:F }}>
      <div style={{ textAlign:'center' as any, color:'#888' }}>Уншиж байна...</div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#F5F5F0', fontFamily:F, display:'flex' }}>

      {/* SIDEBAR */}
      <div style={{ width:220, background:'#0F0F0F', display:'flex', flexDirection:'column' as any, position:'fixed', top:0, left:0, bottom:0, zIndex:100 }}>
        <div style={{ padding:'20px 16px', borderBottom:'1px solid #1A1A1A' }}>
          <a href="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', marginBottom:16 }}>
            <div style={{ width:30, height:30, background:'#FF6B35', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 18 18"><rect x="2" y="2" width="6" height="6" rx="1.5" fill="white"/><rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity=".5"/><rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity=".5"/><rect x="10" y="10" width="6" height="6" rx="1.5" fill="white"/></svg>
            </div>
            <span style={{ fontSize:15, fontWeight:700, color:'#fff' }}>Biz<span style={{ color:'#FF6B35' }}>Print</span></span>
          </a>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#FF6B35,#FF8C42)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'#fff', flexShrink:0 }}>
              {(user.name||user.email||'U')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#fff', lineHeight:1.3 }}>{user.name||'Хэрэглэгч'}</div>
              <div style={{ fontSize:11, color:'#FF6B35', fontWeight:600 }}>
                {role==='designer'?'🎨 Дизайнер':role==='vendor'?'🏭 Vendor':role==='admin'?'⚙️ Admin':'👤 Хэрэглэгч'}
              </div>
            </div>
          </div>
        </div>

        <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' as any }}>
          {NAV.map(item => (
            <button key={item.k} onClick={() => setSection(item.k)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, marginBottom:2, border:'none', background:section===item.k?'rgba(255,107,53,0.15)':'transparent', color:section===item.k?'#FF6B35':'#888', cursor:'pointer', fontSize:13, fontWeight:section===item.k?600:400, textAlign:'left' as any, transition:'all .15s' }}
              onMouseEnter={e=>{ if(section!==item.k){e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.color='#fff'} }}
              onMouseLeave={e=>{ if(section!==item.k){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#888'} }}>
              <span style={{ fontSize:18 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding:'10px 8px', borderTop:'1px solid #1A1A1A' }}>
          <button onClick={() => { localStorage.removeItem('access_token'); router.push('/login') }}
            style={{ width:'100%', padding:'10px 12px', background:'transparent', border:'1px solid #2A2A2A', borderRadius:8, color:'#666', fontSize:13, cursor:'pointer', textAlign:'left' as any, display:'flex', alignItems:'center', gap:8 }}>
            🚪 Гарах
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ marginLeft:220, flex:1, padding:'28px 32px', minHeight:'100vh' }}>

        {/* HOME */}
        {section === 'home' && (
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, margin:'0 0 6px', color:'#0F0F0F' }}>Сайн байна уу, {user.name||'хэрэглэгч'} 👋</h1>
            <p style={{ fontSize:13, color:'#888', margin:'0 0 24px' }}>{new Date().toLocaleDateString('mn-MN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
              {role === 'designer' ? <>
                <div onClick={() => setSection('templates')} style={{ background:'#fff', borderRadius:14, padding:20, border:'1px solid #EBEBEB', borderLeft:'3px solid #FF6B35', cursor:'pointer' }}>
                  <div style={{ fontSize:28, fontWeight:800, color:'#FF6B35' }}>{templates.length}</div>
                  <div style={{ fontSize:13, color:'#888', marginTop:4 }}>🎨 Нийт загвар</div>
                </div>
                <div onClick={() => setSection('templates')} style={{ background:'#fff', borderRadius:14, padding:20, border:'1px solid #EBEBEB', borderLeft:'3px solid #10B981', cursor:'pointer' }}>
                  <div style={{ fontSize:28, fontWeight:800, color:'#10B981' }}>{templates.filter(t=>t.status==='approved').length}</div>
                  <div style={{ fontSize:13, color:'#888', marginTop:4 }}>✅ Зөвшөөрөгдсөн</div>
                </div>
                <div onClick={() => setSection('wallet')} style={{ background:'#fff', borderRadius:14, padding:20, border:'1px solid #EBEBEB', borderLeft:'3px solid #8B5CF6', cursor:'pointer' }}>
                  <div style={{ fontSize:28, fontWeight:800, color:'#8B5CF6' }}>{fmt(balance)}₮</div>
                  <div style={{ fontSize:13, color:'#888', marginTop:4 }}>💰 Wallet үлдэгдэл</div>
                </div>
              </> : <>
                <div onClick={() => setSection('quotes')} style={{ background:'#fff', borderRadius:14, padding:20, border:'1px solid #EBEBEB', borderLeft:'3px solid #FF6B35', cursor:'pointer' }}>
                  <div style={{ fontSize:28, fontWeight:800, color:'#FF6B35' }}>{quotes.length}</div>
                  <div style={{ fontSize:13, color:'#888', marginTop:4 }}>📋 Үнийн санал</div>
                </div>
                <div onClick={() => setSection('quotes')} style={{ background:'#fff', borderRadius:14, padding:20, border:'1px solid #EBEBEB', borderLeft:'3px solid #10B981', cursor:'pointer' }}>
                  <div style={{ fontSize:28, fontWeight:800, color:'#10B981' }}>{quotes.filter(q=>q.status==='confirmed'||q.status==='ordered').length}</div>
                  <div style={{ fontSize:13, color:'#888', marginTop:4 }}>✅ Баталгаажсан</div>
                </div>
                <div onClick={() => setSection('wallet')} style={{ background:'#fff', borderRadius:14, padding:20, border:'1px solid #EBEBEB', borderLeft:'3px solid #8B5CF6', cursor:'pointer' }}>
                  <div style={{ fontSize:28, fontWeight:800, color:'#8B5CF6' }}>{fmt(balance)}₮</div>
                  <div style={{ fontSize:13, color:'#888', marginTop:4 }}>💰 Wallet үлдэгдэл</div>
                </div>
              </>}
            </div>

            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #EBEBEB', padding:20 }}>
              <h2 style={{ margin:'0 0 16px', fontSize:15, fontWeight:700 }}>⚡ Хурдан үйлдэл</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                {(role==='designer' ? [
                  { icon:'➕', label:'Загвар нэмэх', k:'upload',    color:'#FF6B35' },
                  { icon:'🎨', label:'Загварууд',    k:'templates', color:'#378ADD' },
                  { icon:'💰', label:'Орлого',       k:'wallet',    color:'#8B5CF6' },
                  { icon:'🏦', label:'Мөнгө татах',  k:'withdraw',  color:'#10B981' },
                ] : [
                  { icon:'⚡', label:'Үнэ авах',     k:'_quote',    color:'#FF6B35' },
                  { icon:'📋', label:'Захиалгууд',   k:'quotes',    color:'#378ADD' },
                  { icon:'💰', label:'Wallet',       k:'wallet',    color:'#8B5CF6' },
                  { icon:'🏦', label:'Мөнгө татах',  k:'withdraw',  color:'#10B981' },
                ]).map(a => (
                  <button key={a.k} onClick={() => a.k==='_quote' ? router.push('/quote') : setSection(a.k)}
                    style={{ display:'flex', flexDirection:'column' as any, alignItems:'center', gap:8, padding:'16px 12px', borderRadius:10, border:'1px solid #EBEBEB', background:'transparent', cursor:'pointer', textAlign:'center' as any, transition:'all .15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background=a.color+'15';e.currentTarget.style.borderColor=a.color}}
                    onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='#EBEBEB'}}>
                    <span style={{ fontSize:24 }}>{a.icon}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:'#333' }}>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* QUOTES */}
        {section === 'quotes' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h1 style={{ fontSize:20, fontWeight:700, margin:0 }}>📋 Үнийн саналууд</h1>
              <button onClick={() => router.push('/quote')} style={{ padding:'9px 18px', background:'#FF6B35', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                + Шинэ үнэ авах
              </button>
            </div>
            {quotes.length === 0 ? (
              <div style={{ padding:48, textAlign:'center' as any, background:'#fff', borderRadius:14, border:'1px solid #EBEBEB' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
                <div style={{ fontWeight:600, marginBottom:8 }}>Үнийн санал байхгүй байна</div>
                <button onClick={() => router.push('/quote')} style={{ padding:'10px 24px', background:'#FF6B35', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  Үнэ авах
                </button>
              </div>
            ) : (
              <div style={{ background:'#fff', borderRadius:14, border:'1px solid #EBEBEB', overflow:'hidden' }}>
                {quotes.map((q, i) => (
                  <div key={q.id} style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:16, padding:'16px 20px', borderBottom:i<quotes.length-1?'1px solid #F5F5F0':'none', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600 }}>{q.product_name||'Хэвлэл'}</div>
                      <div style={{ fontSize:12, color:'#888' }}>{q.quote_number} · {q.quantity} ш · {new Date(q.created_at).toLocaleDateString('mn-MN')}</div>
                    </div>
                    <div style={{ fontSize:16, fontWeight:700, color:'#FF6B35' }}>{fmt(q.total_price)}₮</div>
                    <div style={{ display:'flex', flexDirection:'column' as any, alignItems:'flex-end', gap:6 }}>
                      <span style={{ fontSize:11, padding:'4px 10px', borderRadius:20, background:q.status==='ordered'?'var(--orange-10)':q.status==='confirmed'?'rgba(16,185,129,0.1)':'rgba(59,130,246,0.1)', color:q.status==='ordered'?'#FF6B35':q.status==='confirmed'?'#10B981':'#378ADD', fontWeight:600, whiteSpace:'nowrap' as any }}>
                        {q.status==='ordered'?'Захиалга':q.status==='confirmed'?'Баталгаажсан':'Илгээгдсэн'}
                      </span>
                      {(q.status==='sent'||q.status==='confirmed') && (
                        <button onClick={() => createOrder(q.id)}
                          style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid #FF6B35', background:'var(--orange-06)', color:'#FF6B35', cursor:'pointer', fontWeight:600, whiteSpace:'nowrap' as any }}>
                          Захиалга болгох →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEMPLATES */}
        {section === 'templates' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h1 style={{ fontSize:20, fontWeight:700, margin:0 }}>🎨 Миний загварууд</h1>
              <button onClick={() => setSection('upload')} style={{ padding:'9px 18px', background:'#FF6B35', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                + Загвар нэмэх
              </button>
            </div>
            {templates.length === 0 ? (
              <div style={{ padding:48, textAlign:'center' as any, background:'#fff', borderRadius:14, border:'1px solid #EBEBEB' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🎨</div>
                <div style={{ fontWeight:600, marginBottom:8 }}>Загвар байхгүй байна</div>
                <button onClick={() => setSection('upload')} style={{ padding:'10px 24px', background:'#FF6B35', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>Загвар нэмэх</button>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
                {templates.map(t => (
                  <div key={t.id} style={{ background:'#fff', borderRadius:12, overflow:'hidden', border:'1px solid #EBEBEB' }}>
                    <div style={{ height:140, background:'linear-gradient(135deg,rgba(255,107,53,0.08),rgba(255,107,53,0.03))', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                      {t.thumbnail_url ? <img src={t.thumbnail_url.startsWith('http')?t.thumbnail_url:`${API}/uploads/${t.thumbnail_url}`} alt={t.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ fontSize:40 }}>🖼️</div>}
                      <div style={{ position:'absolute', top:8, left:8 }}>
                        <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:20, background:t.status==='approved'?'rgba(16,185,129,0.9)':t.status==='rejected'?'rgba(239,68,68,0.9)':'rgba(245,158,11,0.9)', color:'#fff' }}>
                          {t.status==='approved'?'✓ Зөвшөөрөгдсөн':t.status==='rejected'?'✕ Татгалзсан':'⏳ Хянагдаж байна'}
                        </span>
                      </div>
                    </div>
                    <div style={{ padding:'12px 14px' }}>
                      <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>{t.title_mn||t.title}</div>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:12, color:'#888' }}>{t.category}</span>
                        <span style={{ fontSize:13, fontWeight:700, color:'#FF6B35' }}>{fmt(t.price)}₮</span>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:10 }}>
                        <div style={{ background:'#F8F8F6', borderRadius:6, padding:'6px 8px', textAlign:'center' as any }}>
                          <div style={{ fontSize:14, fontWeight:700, color:'#10B981' }}>{t.use_count}</div>
                          <div style={{ fontSize:10, color:'#888' }}>Ашиглалт</div>
                        </div>
                        <div style={{ background:'#F8F8F6', borderRadius:6, padding:'6px 8px', textAlign:'center' as any }}>
                          <div style={{ fontSize:14, fontWeight:700, color:'#8B5CF6' }}>{fmt(Number(t.price)*Number(t.use_count)*(Number(t.royalty_rate)/100))}₮</div>
                          <div style={{ fontSize:10, color:'#888' }}>Орлого</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* UPLOAD */}
        {section === 'upload' && (
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, margin:'0 0 20px' }}>➕ Загвар нэмэх</h1>
            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #EBEBEB', padding:28, maxWidth:640 }}>
              {uploadMsg && <div style={{ padding:'12px 16px', borderRadius:8, background:uploadMsg.includes('❌')?'rgba(239,68,68,0.08)':'rgba(16,185,129,0.08)', color:uploadMsg.includes('❌')?'#EF4444':'#10B981', marginBottom:16, fontSize:13 }}>{uploadMsg}</div>}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:'#666', display:'block', marginBottom:5, textTransform:'uppercase' as any }}>Монгол нэр *</label>
                  <input value={templateForm.title_mn} onChange={e=>setTemplateForm(f=>({...f,title_mn:e.target.value}))} placeholder="Визит карт загвар" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:'#666', display:'block', marginBottom:5, textTransform:'uppercase' as any }}>Англи нэр</label>
                  <input value={templateForm.title} onChange={e=>setTemplateForm(f=>({...f,title:e.target.value}))} placeholder="Business Card" style={inp} />
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'#666', display:'block', marginBottom:5, textTransform:'uppercase' as any }}>Ангилал</label>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' as any }}>
                  {['Визит карт','Флаер','Постер','Баннер','Брошур','Стикер','Сошиал медиа'].map(c => (
                    <button key={c} onClick={() => setTemplateForm(f=>({...f,category:c}))}
                      style={{ padding:'6px 12px', borderRadius:20, border:templateForm.category===c?'2px solid #FF6B35':'1px solid #E5E5E0', background:templateForm.category===c?'rgba(255,107,53,0.06)':'transparent', color:templateForm.category===c?'#FF6B35':'#666', cursor:'pointer', fontSize:12 }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:'#666', display:'block', marginBottom:5, textTransform:'uppercase' as any }}>Үнэ (₮)</label>
                  <input type="number" value={templateForm.price} onChange={e=>setTemplateForm(f=>({...f,price:Number(e.target.value)}))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:'#666', display:'block', marginBottom:5, textTransform:'uppercase' as any }}>Royalty %</label>
                  <input type="number" value={templateForm.royalty_rate} onChange={e=>setTemplateForm(f=>({...f,royalty_rate:Number(e.target.value)}))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:'#666', display:'block', marginBottom:5, textTransform:'uppercase' as any }}>Хэмжээ мм</label>
                  <div style={{ display:'flex', gap:4 }}>
                    <input type="number" value={templateForm.width_mm} onChange={e=>setTemplateForm(f=>({...f,width_mm:Number(e.target.value)}))} style={{...inp, textAlign:'center' as any}} />
                    <span style={{ lineHeight:'40px', color:'#888', fontSize:12 }}>×</span>
                    <input type="number" value={templateForm.height_mm} onChange={e=>setTemplateForm(f=>({...f,height_mm:Number(e.target.value)}))} style={{...inp, textAlign:'center' as any}} />
                  </div>
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'#666', display:'block', marginBottom:5, textTransform:'uppercase' as any }}>Тайлбар</label>
                <textarea value={templateForm.description} onChange={e=>setTemplateForm(f=>({...f,description:e.target.value}))} rows={2} style={{...inp, resize:'vertical' as any}} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:'#666', display:'block', marginBottom:5, textTransform:'uppercase' as any }}>Thumbnail *</label>
                  <label style={{ display:'block', border:'2px dashed #E5E5E0', borderRadius:10, padding:16, textAlign:'center' as any, cursor:'pointer' }}>
                    {thumbPreview ? <img src={thumbPreview} alt="thumb" style={{ maxHeight:80, maxWidth:'100%', borderRadius:6 }} /> : <div><div style={{ fontSize:24, marginBottom:4 }}>🖼️</div><div style={{ fontSize:12, color:'#888' }}>Зураг сонгох</div></div>}
                    <input type="file" accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){setThumbFile(f);setThumbPreview(URL.createObjectURL(f))} }} style={{ display:'none' }} />
                  </label>
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:'#666', display:'block', marginBottom:5, textTransform:'uppercase' as any }}>Дизайн файл</label>
                  <label style={{ display:'block', border:'2px dashed #E5E5E0', borderRadius:10, padding:16, textAlign:'center' as any, cursor:'pointer' }}>
                    <div style={{ fontSize:24, marginBottom:4 }}>📁</div>
                    <div style={{ fontSize:12, color:designFile?'#10B981':'#888' }}>{designFile?designFile.name:'PDF, AI, PSD'}</div>
                    <input type="file" accept=".pdf,.ai,.psd,.png,.jpg" onChange={e=>setDesignFile(e.target.files?.[0]||null)} style={{ display:'none' }} />
                  </label>
                </div>
              </div>
              {templateForm.price > 0 && (
                <div style={{ background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:8, padding:'12px 14px', marginBottom:14, fontSize:13 }}>
                  💰 Нэг ашиглалтаас: <b style={{color:'#8B5CF6'}}>{fmt(Number(templateForm.price)*Number(templateForm.royalty_rate)/100)}₮</b>
                  <span style={{ color:'#888', marginLeft:12 }}>10 ашиглалтаас: <b style={{color:'#8B5CF6'}}>{fmt(Number(templateForm.price)*Number(templateForm.royalty_rate)/100*10)}₮</b></span>
                </div>
              )}
              <button onClick={submitTemplate} disabled={saving} style={{ width:'100%', padding:14, background:saving?'#ccc':'#FF6B35', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer' }}>
                {saving?'Илгээж байна...':'🚀 Загвар илгээх'}
              </button>
            </div>
          </div>
        )}

        {/* WALLET */}
        {section === 'wallet' && (
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, margin:'0 0 20px' }}>💰 Wallet</h1>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
              <div style={{ background:'linear-gradient(135deg,#FF6B35,#FF8C42)', borderRadius:14, padding:'24px 20px', color:'#fff' }}>
                <div style={{ fontSize:13, opacity:0.8, marginBottom:6 }}>Нийт үлдэгдэл</div>
                <div style={{ fontSize:32, fontWeight:800 }}>{fmt(balance)}₮</div>
                <button onClick={() => setSection('withdraw')} style={{ marginTop:16, padding:'8px 18px', background:'rgba(255,255,255,0.2)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  🏦 Мөнгө татах
                </button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { l:'Нийт орлого',    v:fmt(transactions.filter(t=>t.type==='credit').reduce((s:number,t:any)=>s+Number(t.amount),0))+'₮', c:'#10B981' },
                  { l:'Нийт зарлага',   v:fmt(transactions.filter(t=>t.type==='debit').reduce((s:number,t:any)=>s+Number(t.amount),0))+'₮',  c:'#EF4444' },
                  { l:'Гүйлгээний тоо', v:transactions.length+' удаа', c:'#378ADD' },
                  { l:'Хүлээгдэж байна', v:'0₮', c:'#F59E0B' },
                ].map(s => (
                  <div key={s.l} style={{ background:'#fff', borderRadius:10, padding:'14px', border:'1px solid #EBEBEB' }}>
                    <div style={{ fontSize:16, fontWeight:700, color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:11, color:'#888', marginTop:3 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #EBEBEB', padding:20 }}>
              <h2 style={{ margin:'0 0 16px', fontSize:15, fontWeight:700 }}>Гүйлгээний түүх</h2>
              {transactions.length === 0 ? (
                <div style={{ padding:32, textAlign:'center' as any, color:'#888' }}>Гүйлгээ байхгүй байна</div>
              ) : transactions.slice(0,20).map((t, i) => (
                <div key={t.id||i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:i<transactions.length-1?'1px solid #F5F5F0':'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:t.type==='credit'?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                      {t.type==='credit'?'⬇️':'⬆️'}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:500 }}>{t.description||t.type==='credit'?'Орлого':'Зарлага'}</div>
                      <div style={{ fontSize:11, color:'#888' }}>{t.created_at?new Date(t.created_at).toLocaleDateString('mn-MN'):''}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:15, fontWeight:700, color:t.type==='credit'?'#10B981':'#EF4444' }}>
                    {t.type==='credit'?'+':'-'}{fmt(t.amount)}₮
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WITHDRAW */}
        {section === 'withdraw' && (
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, margin:'0 0 20px' }}>🏦 Мөнгө татах</h1>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <div style={{ background:'#fff', borderRadius:14, border:'1px solid #EBEBEB', padding:24 }}>
                <div style={{ background:'linear-gradient(135deg,#FF6B35,#FF8C42)', borderRadius:10, padding:'16px 18px', marginBottom:20, color:'#fff' }}>
                  <div style={{ fontSize:12, opacity:0.8 }}>Татах боломжтой</div>
                  <div style={{ fontSize:28, fontWeight:800 }}>{fmt(balance)}₮</div>
                </div>
                {withdrawMsg && <div style={{ padding:'12px 14px', borderRadius:8, background:withdrawMsg.includes('❌')?'rgba(239,68,68,0.08)':'rgba(16,185,129,0.08)', color:withdrawMsg.includes('❌')?'#EF4444':'#10B981', marginBottom:16, fontSize:13 }}>{withdrawMsg}</div>}
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'#666', display:'block', marginBottom:6, textTransform:'uppercase' as any }}>Татах дүн (₮)</label>
                  <input type="number" value={withdrawForm.amount||''} onChange={e=>setWithdrawForm(f=>({...f,amount:Number(e.target.value)}))} placeholder="50000" style={inp} />
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'#666', display:'block', marginBottom:6, textTransform:'uppercase' as any }}>Банк сонгох</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {['Хаан банк','Голомт банк','Хас банк','TDB банк','Төрийн банк','Богд банк'].map(b => (
                      <button key={b} onClick={() => setWithdrawForm(f=>({...f,bank_name:b}))}
                        style={{ padding:'10px 8px', borderRadius:8, border:withdrawForm.bank_name===b?'2px solid #FF6B35':'1px solid #E5E5E0', background:withdrawForm.bank_name===b?'rgba(255,107,53,0.06)':'transparent', color:withdrawForm.bank_name===b?'#FF6B35':'#555', cursor:'pointer', fontSize:12, fontWeight:withdrawForm.bank_name===b?600:400 }}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'#666', display:'block', marginBottom:6, textTransform:'uppercase' as any }}>Дансны дугаар</label>
                  <input value={withdrawForm.bank_account} onChange={e=>setWithdrawForm(f=>({...f,bank_account:e.target.value}))} placeholder="4900XXXXXX" style={inp} />
                </div>
                <div style={{ marginBottom:20 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'#666', display:'block', marginBottom:6, textTransform:'uppercase' as any }}>Дансны нэр</label>
                  <input value={withdrawForm.bank_account_name} onChange={e=>setWithdrawForm(f=>({...f,bank_account_name:e.target.value}))} placeholder="ОВОГ НЭР" style={inp} />
                </div>
                <button onClick={submitWithdraw} disabled={balance <= 0}
                  style={{ width:'100%', padding:14, background:balance<=0?'#ccc':'#FF6B35', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:balance<=0?'not-allowed':'pointer' }}>
                  {balance<=0?'Үлдэгдэл хүрэлцэхгүй':'Мөнгө татах хүсэлт илгээх'}
                </button>
              </div>
              <div>
                <div style={{ background:'#fff', borderRadius:14, border:'1px solid #EBEBEB', padding:20, marginBottom:14 }}>
                  <h3 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700 }}>ℹ️ Мөнгө татах мэдээлэл</h3>
                  {[
                    ['Хамгийн бага дүн', '10,000₮'],
                    ['Шимтгэл',          'Үнэгүй'],
                    ['Хугацаа',          '1-2 ажлын өдөр'],
                    ['Ажлын цаг',        'Да-Ба 09:00-17:00'],
                  ].map(([l,v]) => (
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F5F5F0', fontSize:13 }}>
                      <span style={{ color:'#888' }}>{l}</span>
                      <span style={{ fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:12, padding:16, fontSize:13, color:'#92400E' }}>
                  ⚠️ Хүсэлт илгээсний дараа admin шалгаж, банкны данс руу шилжүүлнэ. Хугацаа 1-2 ажлын өдөр болно.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DESIGN JOBS */}
        {section === 'design_jobs' && (
          <DesignJobsSection user={user} API={API} authH={authH} />
        )}

        {/* PROFILE */}
        {section === 'profile' && (
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, margin:'0 0 20px' }}>👤 Профайл</h1>
            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #EBEBEB', padding:28, maxWidth:480 }}>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, paddingBottom:20, borderBottom:'1px solid #F5F5F0' }}>
                <div style={{ width:60, height:60, borderRadius:'50%', background:'linear-gradient(135deg,#FF6B35,#FF8C42)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:700, color:'#fff' }}>
                  {(user.name||user.email||'U')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:18, fontWeight:700 }}>{user.name||'Нэр байхгүй'}</div>
                  <div style={{ fontSize:13, color:'#888' }}>{user.email}</div>
                  <div style={{ fontSize:12, color:'#FF6B35', fontWeight:600, marginTop:2 }}>
                    {role==='designer'?'🎨 Дизайнер':role==='vendor'?'🏭 Vendor':role==='admin'?'⚙️ Admin':'👤 Хэрэглэгч'}
                  </div>
                </div>
              </div>
              {[
                { l:'Нэр',     v:user.name||'—' },
                { l:'Имэйл',   v:user.email||'—' },
                { l:'Утас',    v:user.phone||'—' },
                { l:'Бүртгэл', v:user.created_at?new Date(user.created_at).toLocaleDateString('mn-MN'):'—' },
              ].map(r => (
                <div key={r.l} style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #F5F5F0', fontSize:14 }}>
                  <span style={{ color:'#888' }}>{r.l}</span>
                  <span style={{ fontWeight:500 }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {user && <ChatBox userId={user.id} userName={user.name || user.email} role={user.role || 'customer'} />}
    </div>
  )
}
