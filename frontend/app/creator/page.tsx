'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'

const API = 'http://localhost:4000'
const F   = "'DM Sans','Segoe UI',system-ui,sans-serif"

interface User {
  id: string; email: string; full_name: string; role: string
  bio?: string; starting_price?: number; delivery_days?: number
  service_categories?: string; creator_tier?: string
  creator_rating?: number; creator_completed?: number
}

interface Design {
  id: string; title: string; status: string
  price?: number; sales_count?: number; created_at: string
}

interface Order {
  id: string; customer_name?: string; customer_email?: string
  product_name?: string; requirements?: string; design_fee?: number
  deadline?: string; status: string; created_at: string; file_url?: string
}

function tok()  { return localStorage.getItem('access_token') || localStorage.getItem('token') || '' }
function hdrs() { return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() } }

const inp: React.CSSProperties = {
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '9px 12px', color: 'var(--text)',
  fontSize: 13, outline: 'none', width: '100%',
}

const ORD_CLR: Record<string, string> = {
  pending: '#F59E0B', assigned: '#3B82F6', in_progress: '#8B5CF6',
  review: '#0891B2', approved: '#10B981', rejected: '#EF4444',
}
const ORD_MN: Record<string, string> = {
  pending: 'Хүлээгдэж байна', assigned: 'Хүлээн авсан',
  in_progress: 'Хийгдэж байна', review: 'Хянагдаж байна',
  approved: 'Батлагдсан', rejected: 'Татгалзагдсан',
}

const DES_CLR: Record<string, string> = {
  pending: '#F59E0B', approved: '#10B981', rejected: '#EF4444', draft: '#6B7280',
}
const DES_MN: Record<string, string> = {
  pending: 'Хүлээгдэж байна', approved: 'Батлагдсан',
  rejected: 'Татгалзагдсан', draft: 'Ноорог',
}

export default function CreatorDashboard() {
  const router = useRouter()
  const [user,    setUser]    = useState<User | null>(null)
  const [designs, setDesigns] = useState<Design[]>([])
  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'orders' | 'designs' | 'upload' | 'earnings' | 'profile'>('orders')
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [submitUrl, setSubmitUrl]     = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [submitMsg, setSubmitMsg]     = useState('')
  const [uploadForm, setUploadForm] = useState({ title: '', price: '', description: '', file_url: '' })
  const [uploading, setUploading]   = useState(false)
  const [uploadMsg, setUploadMsg]   = useState('')
  const [profileForm, setProfileForm] = useState({
    bio: '', starting_price: '', delivery_days: '', service_categories: '',
    portfolio_url: '', creator_tier: 'Starter',
  })
  const [saving, setSaving]   = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    const ud = localStorage.getItem('user')
    const tk = tok()
    if (!ud || !tk) { router.push('/login'); return }
    const u: User = JSON.parse(ud)
    if (u.role !== 'creator' && u.role !== 'admin') { router.push('/login'); return }
    setUser(u)
    setProfileForm({
      bio: u.bio || '', starting_price: String(u.starting_price || ''),
      delivery_days: String(u.delivery_days || 3),
      service_categories: u.service_categories || '',
      portfolio_url: '', creator_tier: u.creator_tier || 'Starter',
    })
    Promise.all([loadDesigns(u.id), loadOrders(u.id)])
  }, [])

  async function loadDesigns(userId: string) {
    try {
      const r = await fetch(`${API}/templates?designer_id=${userId}`, { headers: hdrs() })
      const d = r.ok ? await r.json() : []
      setDesigns(Array.isArray(d) ? d : [])
    } catch {}
  }

  async function loadOrders(userId: string) {
    try {
      const r = await fetch(`${API}/design-requests/designer/${userId}`, { headers: hdrs() })
      const d = r.ok ? await r.json() : []
      setOrders(Array.isArray(d) ? d : [])
    } catch {}
    setLoading(false)
  }

  async function submitWork(orderId: string) {
    if (!submitUrl.trim()) { setSubmitMsg('Файлын URL оруулна уу'); return }
    setSubmitting(true); setSubmitMsg('')
    try {
      const r = await fetch(`${API}/design-requests/${orderId}/submit`, {
        method: 'PATCH', headers: hdrs(),
        body: JSON.stringify({ file_url: submitUrl }),
      })
      if (r.ok) {
        setSubmitMsg('✅ Ажил амжилттай илгээгдлээ')
        setSubmitUrl('')
        if (user) { await loadOrders(user.id); setActiveOrder(null) }
      } else { setSubmitMsg('Алдаа гарлаа') }
    } catch { setSubmitMsg('Алдаа гарлаа') }
    setSubmitting(false)
  }

  async function submitDesign() {
    if (!uploadForm.title || !uploadForm.file_url) {
      setUploadMsg('Гарчиг болон файлын URL оруулна уу'); return
    }
    setUploading(true); setUploadMsg('')
    try {
      const r = await fetch(`${API}/templates`, {
        method: 'POST', headers: hdrs(),
        body: JSON.stringify({
          title: uploadForm.title, price: Number(uploadForm.price) || 0,
          description: uploadForm.description, file_url: uploadForm.file_url,
          designer_id: user?.id, designer_name: user?.full_name, status: 'pending',
        }),
      })
      if (r.ok) {
        setUploadMsg('✅ Дизайн амжилттай илгээгдлээ')
        setUploadForm({ title: '', price: '', description: '', file_url: '' })
        if (user) loadDesigns(user.id)
        setTimeout(() => setTab('designs'), 1800)
      } else { setUploadMsg('Алдаа гарлаа') }
    } catch { setUploadMsg('Алдаа гарлаа') }
    setUploading(false)
  }

  async function saveProfile() {
    setSaving(true); setSaveMsg('')
    try {
      const r = await fetch(`${API}/users/profile`, {
        method: 'PATCH', headers: hdrs(),
        body: JSON.stringify({
          bio: profileForm.bio,
          starting_price: Number(profileForm.starting_price) || null,
          delivery_days: Number(profileForm.delivery_days) || 3,
          service_categories: profileForm.service_categories,
          portfolio_url: profileForm.portfolio_url,
          creator_tier: profileForm.creator_tier,
        }),
      })
      if (r.ok) {
        setSaveMsg('✅ Профайл хадгалагдлаа')
        const updated = await r.json()
        localStorage.setItem('user', JSON.stringify({ ...user, ...updated }))
        setUser(u => ({ ...u!, ...updated }))
      } else { setSaveMsg('Алдаа гарлаа') }
    } catch { setSaveMsg('Алдаа гарлаа') }
    setSaving(false)
  }

  const pendingOrders   = orders.filter(o => o.status === 'pending')
  const activeOrders    = orders.filter(o => ['assigned','in_progress'].includes(o.status))
  const completedOrders = orders.filter(o => o.status === 'approved')
  const totalEarnings   = completedOrders.reduce((s, o) => s + Number(o.design_fee || 0), 0)
  const totalDesignRev  = designs.reduce((s, d) => s + ((d.sales_count || 0) * (d.price || 0)), 0)
  const approvedDesigns = designs.filter(d => d.status === 'approved').length

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg)', color:'var(--text2)', fontFamily: F }}>
      Уншиж байна...
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily: F, color:'var(--text)' }}>

      {/* Topbar */}
      <div style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', padding:'0 32px', height:54, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:16, fontWeight:700 }}><span style={{ color:'#FF6B00' }}>Biz</span>Print</span>
          <span style={{ fontSize:11, background:'rgba(167,139,250,0.12)', color:'#A78BFA', border:'1px solid rgba(167,139,250,0.3)', borderRadius:20, padding:'2px 10px' }}>🎨 Бүтээгч</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:13, color:'var(--text2)' }}>{user?.full_name}</span>
          <NotificationBell userId={user?.id} />
          <button onClick={()=>{ localStorage.clear(); router.push('/') }} style={{ ...inp, width:'auto', cursor:'pointer', fontSize:12, padding:'6px 14px' }}>Гарах</button>
        </div>
      </div>

      <div style={{ padding:'28px 32px', maxWidth:1100, margin:'0 auto' }}>

        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>Бүтээгчийн самбар</h1>
          <p style={{ color:'var(--text2)', fontSize:13, margin:'4px 0 0' }}>Захиалга хүлээн авах, дизайн байршуулах, орлогоо хянах</p>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
          {[
            { label:'Шинэ захиалга',   val: pendingOrders.length,              color:'#F59E0B', dot: pendingOrders.length > 0 },
            { label:'Хийгдэж байна',   val: activeOrders.length,               color:'#8B5CF6' },
            { label:'Дууссан захиалга', val: completedOrders.length,            color:'#10B981' },
            { label:'Контент захиалгын орлого', val:'₮'+totalEarnings.toLocaleString(), color:'#FF6B00' },
            { label:'Дизайны орлого',  val:'₮'+totalDesignRev.toLocaleString(), color:'#3B82F6' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px', borderTop:'3px solid '+s.color, position:'relative' }}>
              {(s as any).dot && <div style={{ position:'absolute', top:10, right:12, width:8, height:8, borderRadius:'50%', background:'#EF4444' }}/>}
              <div style={{ fontSize:20, fontWeight:700, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:11, color:'var(--text2)', marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, marginBottom:20, borderBottom:'2px solid var(--border)' }}>
          {[
            { key:'orders',   label:'📦 Захиалгууд',         count: orders.length,   badge: pendingOrders.length > 0 ? pendingOrders.length : null },
            { key:'designs',  label:'🖼 Дизайнууд',          count: designs.length,  badge: null },
            { key:'upload',   label:'⬆️ Дизайн байршуулах',  count: null,            badge: null },
            { key:'earnings', label:'💰 Орлого',             count: null,            badge: null },
            { key:'profile',  label:'👤 Профайл тохиргоо',   count: null,            badge: null },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{
              padding:'10px 18px', border:'none',
              borderBottom: tab===t.key ? '2px solid #A78BFA' : '2px solid transparent',
              marginBottom:'-2px', background:'none', fontSize:13,
              fontWeight: tab===t.key ? 600 : 400,
              color: tab===t.key ? 'var(--text)' : 'var(--text2)', cursor:'pointer', fontFamily: F,
              display:'flex', alignItems:'center', gap:6,
            }}>
              {t.label}
              {t.count !== null && (
                <span style={{ fontSize:11, background: tab===t.key ? '#A78BFA' : 'var(--surface2)', color: tab===t.key ? '#fff' : 'var(--text2)', padding:'1px 7px', borderRadius:99 }}>
                  {t.count}
                </span>
              )}
              {t.badge !== null && (
                <span style={{ fontSize:10, background:'#EF4444', color:'#fff', padding:'1px 6px', borderRadius:99, fontWeight:700 }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── ORDERS ─── */}
        {tab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'64px 24px', textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
                <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>Захиалга байхгүй байна</div>
                <div style={{ color:'var(--text2)', fontSize:14, marginBottom:20 }}>Захиалга ирэхэд энд харагдана</div>
                <button onClick={()=>router.push('/marketplace/'+user?.id)} style={{ background:'#A78BFA', color:'#fff', border:'none', borderRadius:8, padding:'10px 24px', cursor:'pointer', fontSize:14, fontWeight:600 }}>
                  🔗 Профайл харах
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {orders.map(o => (
                  <div key={o.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:20 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15, marginBottom:3 }}>{o.product_name || 'Контент захиалга'}</div>
                        <div style={{ fontSize:13, color:'var(--text2)' }}>
                          {o.customer_name} · {new Date(o.created_at).toLocaleDateString('mn-MN')}
                          {o.deadline && <span style={{ marginLeft:8, color:'#F59E0B' }}>⏰ {new Date(o.deadline).toLocaleDateString('mn-MN')} хүртэл</span>}
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontWeight:700, color:'#FF6B00', fontSize:16 }}>₮{Number(o.design_fee||0).toLocaleString()}</span>
                        <span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, background:(ORD_CLR[o.status]||'#888')+'20', color:ORD_CLR[o.status]||'#888', fontWeight:600 }}>
                          {ORD_MN[o.status]||o.status}
                        </span>
                      </div>
                    </div>

                    {o.requirements && (
                      <div style={{ background:'var(--surface2)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'var(--text2)', marginBottom:12, lineHeight:1.5 }}>
                        📝 {o.requirements}
                      </div>
                    )}

                    {/* Action */}
                    {o.status === 'pending' && (
                      <button
                        onClick={async () => {
                          await fetch(`${API}/design-requests/${o.id}/assign`, {
                            method:'PATCH', headers:hdrs(),
                            body: JSON.stringify({ designer_id: user?.id, designer_name: user?.full_name }),
                          })
                          if (user) loadOrders(user.id)
                        }}
                        style={{ background:'#8B5CF6', color:'#fff', border:'none', borderRadius:8, padding:'8px 18px', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                        ✓ Хүлээн авах
                      </button>
                    )}

                    {(o.status === 'assigned' || o.status === 'in_progress') && (
                      <div>
                        {activeOrder?.id === o.id ? (
                          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                            {submitMsg && (
                              <div style={{ padding:'8px 12px', borderRadius:8, background: submitMsg.includes('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)', color: submitMsg.includes('✅') ? '#10B981' : '#EF4444', fontSize:13 }}>
                                {submitMsg}
                              </div>
                            )}
                            <div style={{ display:'flex', gap:8 }}>
                              <input
                                value={submitUrl}
                                onChange={e => setSubmitUrl(e.target.value)}
                                placeholder="Файлын URL (Google Drive, Dropbox...)"
                                style={{ ...inp, flex:1 }}
                              />
                              <button onClick={()=>submitWork(o.id)} disabled={submitting} style={{ background:'#10B981', color:'#fff', border:'none', borderRadius:8, padding:'8px 18px', cursor:'pointer', fontSize:13, fontWeight:600, whiteSpace:'nowrap', opacity:submitting?0.6:1 }}>
                                {submitting ? '...' : '📤 Илгээх'}
                              </button>
                              <button onClick={()=>{ setActiveOrder(null); setSubmitMsg('') }} style={{ background:'var(--surface2)', color:'var(--text2)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 14px', cursor:'pointer', fontSize:13 }}>
                                Болих
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={()=>{ setActiveOrder(o); setSubmitMsg('') }} style={{ background:'#3B82F6', color:'#fff', border:'none', borderRadius:8, padding:'8px 18px', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                            📤 Ажил илгээх
                          </button>
                        )}
                      </div>
                    )}

                    {o.status === 'approved' && o.file_url && (
                      <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#10B981', fontWeight:600 }}>
                        ✅ Батлагдсан · <a href={o.file_url} target="_blank" rel="noreferrer" style={{ color:'#10B981' }}>Файл харах</a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── DESIGNS ─── */}
        {tab === 'designs' && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
            {designs.length === 0 ? (
              <div style={{ padding:'64px 24px', textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🎨</div>
                <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>Дизайн байхгүй байна</div>
                <div style={{ color:'var(--text2)', fontSize:14, marginBottom:20 }}>Дизайн байршуулж борлуулалт эхлүүлнэ үү</div>
                <button onClick={()=>setTab('upload')} style={{ background:'#A78BFA', color:'#fff', border:'none', borderRadius:8, padding:'10px 24px', cursor:'pointer', fontSize:14, fontWeight:600 }}>
                  + Дизайн байршуулах
                </button>
              </div>
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 0.8fr 0.8fr 0.8fr', padding:'10px 20px', background:'var(--surface2)', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                  <span>Гарчиг</span><span>Үнэ</span><span>Борлуулалт</span><span>Огноо</span><span>Төлөв</span>
                </div>
                {designs.map((d, i) => (
                  <div key={d.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 0.8fr 0.8fr 0.8fr', padding:'13px 20px', borderBottom: i<designs.length-1 ? '1px solid var(--border)' : 'none', alignItems:'center', fontSize:13 }}>
                    <div style={{ fontWeight:600 }}>{d.title}</div>
                    <div style={{ color:'#FF6B00', fontWeight:600 }}>{d.price ? '₮'+Number(d.price).toLocaleString() : '—'}</div>
                    <div style={{ color:'var(--text2)' }}>{d.sales_count||0} ш</div>
                    <div style={{ color:'var(--text2)', fontSize:12 }}>{new Date(d.created_at).toLocaleDateString('mn-MN')}</div>
                    <span style={{ background:(DES_CLR[d.status]||'#888')+'20', color:DES_CLR[d.status]||'#888', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:600 }}>
                      {DES_MN[d.status]||d.status}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ─── UPLOAD ─── */}
        {tab === 'upload' && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:28, maxWidth:560 }}>
            <h2 style={{ fontSize:17, fontWeight:700, margin:'0 0 20px' }}>Шинэ дизайн байршуулах</h2>
            {uploadMsg && (
              <div style={{ background: uploadMsg.includes('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)', border:'1px solid '+(uploadMsg.includes('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'), borderRadius:8, padding:'10px 14px', fontSize:13, color: uploadMsg.includes('✅') ? '#10B981' : '#EF4444', marginBottom:18 }}>
                {uploadMsg}
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div><label style={{ fontSize:12, color:'var(--text2)', marginBottom:6, display:'block', fontWeight:500 }}>Дизайны гарчиг *</label>
                <input value={uploadForm.title} onChange={e=>setUploadForm({...uploadForm,title:e.target.value})} placeholder="Бизнесийн карт загвар" style={inp}/></div>
              <div><label style={{ fontSize:12, color:'var(--text2)', marginBottom:6, display:'block', fontWeight:500 }}>Үнэ (₮)</label>
                <input type="number" value={uploadForm.price} onChange={e=>setUploadForm({...uploadForm,price:e.target.value})} placeholder="5000" style={inp}/></div>
              <div><label style={{ fontSize:12, color:'var(--text2)', marginBottom:6, display:'block', fontWeight:500 }}>Файлын URL *</label>
                <input value={uploadForm.file_url} onChange={e=>setUploadForm({...uploadForm,file_url:e.target.value})} placeholder="https://drive.google.com/..." style={inp}/></div>
              <div><label style={{ fontSize:12, color:'var(--text2)', marginBottom:6, display:'block', fontWeight:500 }}>Тайлбар</label>
                <textarea value={uploadForm.description} onChange={e=>setUploadForm({...uploadForm,description:e.target.value})} rows={3} placeholder="Товч тайлбар..." style={{ ...inp, resize:'vertical', fontFamily: F }}/></div>
              <button onClick={submitDesign} disabled={uploading} style={{ background: uploading ? 'var(--surface2)' : '#A78BFA', color: uploading ? 'var(--text2)' : '#fff', border:'none', borderRadius:8, padding:'12px', cursor: uploading ? 'not-allowed' : 'pointer', fontSize:14, fontWeight:600 }}>
                {uploading ? 'Илгээж байна...' : '⬆️ Дизайн илгээх'}
              </button>
            </div>
          </div>
        )}

        {/* ─── EARNINGS ─── */}
        {tab === 'earnings' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:24 }}>
              <h3 style={{ fontSize:16, fontWeight:700, margin:'0 0 20px' }}>Орлогын хураангуй</h3>
              {[
                { label:'Контент захиалга (батлагдсан)',  val:'₮'+totalEarnings.toLocaleString(),   color:'#FF6B00' },
                { label:'Дизайн борлуулалтын орлого',    val:'₮'+totalDesignRev.toLocaleString(),  color:'#A78BFA' },
                { label:'Нийт орлого',                    val:'₮'+(totalEarnings+totalDesignRev).toLocaleString(), color:'#10B981' },
                { label:'Нийт захиалга',                  val: orders.length + ' ш',               color:'#3B82F6' },
                { label:'Батлагдсан дизайн',              val: approvedDesigns + ' ш',             color:'#8B5CF6' },
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:14, color:'var(--text2)' }}>{r.label}</span>
                  <span style={{ fontSize:16, fontWeight:700, color:r.color }}>{r.val}</span>
                </div>
              ))}
            </div>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:24 }}>
              <h3 style={{ fontSize:16, fontWeight:700, margin:'0 0 16px' }}>Орлого авах</h3>
              <div style={{ padding:'28px 16px', textAlign:'center', background:'var(--surface2)', borderRadius:10 }}>
                <div style={{ fontSize:32, fontWeight:800, color:'#FF6B00', marginBottom:4 }}>₮{(totalEarnings+totalDesignRev).toLocaleString()}</div>
                <div style={{ fontSize:13, color:'var(--text2)', marginBottom:20 }}>Авах боломжтой орлого</div>
                <button onClick={()=>router.push('/dashboard/customer/wallet')} style={{ background:'#FF6B00', color:'#fff', border:'none', borderRadius:8, padding:'10px 24px', cursor:'pointer', fontSize:14, fontWeight:600 }}>Wallet руу шилжих →</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── PROFILE ─── */}
        {tab === 'profile' && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:28, maxWidth:600 }}>
            <h2 style={{ fontSize:17, fontWeight:700, margin:'0 0 4px' }}>Marketplace профайл</h2>
            <p style={{ color:'var(--text2)', fontSize:13, margin:'0 0 24px' }}>
              Энэ мэдээлэл <a href="/marketplace" target="_blank" style={{ color:'#A78BFA' }}>/marketplace</a> дээр харагдана
            </p>
            {saveMsg && (
              <div style={{ background: saveMsg.includes('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)', border:'1px solid '+(saveMsg.includes('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'), borderRadius:8, padding:'10px 14px', fontSize:13, color: saveMsg.includes('✅') ? '#10B981' : '#EF4444', marginBottom:18 }}>
                {saveMsg}
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div><label style={{ fontSize:12, color:'var(--text2)', marginBottom:6, display:'block', fontWeight:500 }}>Тухай (Bio)</label>
                <textarea value={profileForm.bio} onChange={e=>setProfileForm({...profileForm,bio:e.target.value})} rows={3} placeholder="Өөрийнхөө тухай, мэргэжил, туршлага..." style={{ ...inp, resize:'vertical', fontFamily: F }}/></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label style={{ fontSize:12, color:'var(--text2)', marginBottom:6, display:'block', fontWeight:500 }}>Эхлэх үнэ (₮)</label>
                  <input type="number" value={profileForm.starting_price} onChange={e=>setProfileForm({...profileForm,starting_price:e.target.value})} placeholder="50000" style={inp}/></div>
                <div><label style={{ fontSize:12, color:'var(--text2)', marginBottom:6, display:'block', fontWeight:500 }}>Хүргэлтийн хугацаа (хоног)</label>
                  <input type="number" value={profileForm.delivery_days} onChange={e=>setProfileForm({...profileForm,delivery_days:e.target.value})} placeholder="3" style={inp}/></div>
              </div>
              <div><label style={{ fontSize:12, color:'var(--text2)', marginBottom:6, display:'block', fontWeight:500 }}>
                  Үйлчилгээний ангилал <span style={{ color:'var(--text2)', fontWeight:400 }}>(таслалаар тусгаарлах)</span>
                </label>
                <input value={profileForm.service_categories} onChange={e=>setProfileForm({...profileForm,service_categories:e.target.value})} placeholder="Сошиал контент,Хэвлэл дизайн,AI контент" style={inp}/></div>
              <div><label style={{ fontSize:12, color:'var(--text2)', marginBottom:6, display:'block', fontWeight:500 }}>Портфолио URL</label>
                <input value={profileForm.portfolio_url} onChange={e=>setProfileForm({...profileForm,portfolio_url:e.target.value})} placeholder="https://behance.net/..." style={inp}/></div>
              <div><label style={{ fontSize:12, color:'var(--text2)', marginBottom:6, display:'block', fontWeight:500 }}>Tier</label>
                <select value={profileForm.creator_tier} onChange={e=>setProfileForm({...profileForm,creator_tier:e.target.value})} style={inp}>
                  {['Starter','Pro','Expert','Elite'].map(t=><option key={t} value={t}>{t}</option>)}
                </select></div>
              <button onClick={saveProfile} disabled={saving} style={{ background: saving ? 'var(--surface2)' : '#A78BFA', color: saving ? 'var(--text2)' : '#fff', border:'none', borderRadius:8, padding:'12px', cursor: saving ? 'not-allowed' : 'pointer', fontSize:14, fontWeight:600 }}>
                {saving ? 'Хадгалж байна...' : '💾 Профайл хадгалах'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
