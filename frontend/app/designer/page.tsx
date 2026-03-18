'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const F = "'Segoe UI',system-ui,sans-serif"

const CATS = ['Визит карт','Флаер','Постер','Баннер','Брошур','Стикер','Сошиал медиа','Бусад']

function authH() {
  const t = localStorage.getItem('access_token') || ''
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }
}

const STATUS_INFO: Record<string,{c:string;bg:string;l:string;icon:string}> = {
  pending:  { c:'#F59E0B', bg:'rgba(245,158,11,0.1)',  l:'Хянагдаж байна', icon:'⏳' },
  approved: { c:'#10B981', bg:'rgba(16,185,129,0.1)',  l:'Зөвшөөрөгдсөн',  icon:'✅' },
  rejected: { c:'#EF4444', bg:'rgba(239,68,68,0.1)',   l:'Татгалзсан',      icon:'❌' },
}

export default function DesignerPage() {
  const [user, setUser] = useState<any>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'templates'|'upload'|'stats'>('templates')
  const [form, setForm] = useState({ title:'', title_mn:'', description:'', category:'Визит карт', price:0, royalty_rate:15, width_mm:90, height_mm:50, tags:'' })
  const [thumbFile, setThumbFile] = useState<File|null>(null)
  const [thumbPreview, setThumbPreview] = useState('')
  const [designFile, setDesignFile] = useState<File|null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { window.location.href = '/login'; return }
    fetch(API+'/auth/me', { headers: authH() }).then(r=>r.json()).then(u => {
      setUser(u)
      loadTemplates(u.id)
    }).catch(() => { window.location.href = '/login' })
  }, [])

  async function loadTemplates(userId: string) {
    setLoading(true)
    const data = await fetch(API+'/templates/designer/'+userId, { headers: authH() }).then(r=>r.json()).catch(()=>[])
    setTemplates(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function handleThumb(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setThumbFile(f)
    setThumbPreview(URL.createObjectURL(f))
  }

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    const token = localStorage.getItem('access_token') || ''
    const res = await fetch(API+'/upload/file', { method:'POST', headers:{ Authorization:'Bearer '+token }, body:fd })
    const data = await res.json()
    return data.url || data.filename || ''
  }

  async function submit() {
    if (!form.title || !form.category) { setMsg('Гарчиг болон ангилал заавал оруулна уу'); return }
    setSaving(true)
    setMsg('')
    try {
      let thumbnail_url = ''
      let file_url = ''
      if (thumbFile) thumbnail_url = await uploadFile(thumbFile)
      if (designFile) file_url = await uploadFile(designFile)
      const body = {
        ...form,
        thumbnail_url,
        file_url,
        designer_id: user.id,
        designer_name: user.name || user.email,
        price: Number(form.price),
        royalty_rate: Number(form.royalty_rate),
        width_mm: Number(form.width_mm),
        height_mm: Number(form.height_mm),
        tags: form.tags ? form.tags.split(',').map((t:string) => t.trim()) : [],
      }
      await fetch(API+'/templates', { method:'POST', headers:authH(), body:JSON.stringify(body) })
      setMsg('✅ Загвар амжилттай илгээгдлээ! Admin хянасны дараа нийтлэгдэнэ.')
      setForm({ title:'', title_mn:'', description:'', category:'Визит карт', price:0, royalty_rate:15, width_mm:90, height_mm:50, tags:'' })
      setThumbFile(null); setThumbPreview(''); setDesignFile(null)
      loadTemplates(user.id)
      setTab('templates')
    } catch { setMsg('❌ Алдаа гарлаа. Дахин оролдоно уу.') }
    setSaving(false)
  }

  const totalEarning = templates.filter(t=>t.status==='approved').reduce((s,t) => s + Number(t.price) * Number(t.use_count) * (Number(t.royalty_rate)/100), 0)

  const inp: React.CSSProperties = { width:'100%', padding:'10px 12px', background:'#F8F8F6', border:'1px solid #E5E5E0', borderRadius:8, fontSize:14, color:'#0F0F0F', outline:'none', boxSizing:'border-box' }

  return (
    <div style={{ minHeight:'100vh', background:'#FAFAF8', fontFamily:F }}>
      {/* Header */}
      <div style={{ background:'#0F0F0F', padding:'0 32px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <a href="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
            <div style={{ width:32, height:32, background:'#FF6B35', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 18 18"><rect x="2" y="2" width="6" height="6" rx="1.5" fill="white"/><rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity=".5"/><rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity=".5"/><rect x="10" y="10" width="6" height="6" rx="1.5" fill="white"/></svg>
            </div>
            <span style={{ fontSize:16, fontWeight:700, color:'#fff' }}>Biz<span style={{ color:'#FF6B35' }}>Print</span></span>
          </a>
          <span style={{ color:'#444', fontSize:14 }}>/</span>
          <span style={{ color:'#FF6B35', fontSize:14, fontWeight:600 }}>Дизайнер портал</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {user && <span style={{ color:'#888', fontSize:13 }}>👤 {user.name||user.email}</span>}
          <a href="/dashboard" style={{ color:'#fff', fontSize:13, textDecoration:'none', padding:'7px 16px', borderRadius:8, border:'1px solid #333' }}>Dashboard</a>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 24px' }}>
        {/* Stats cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
          {[
            { l:'Нийт загвар',      v:templates.length,                                          c:'#FF6B35', icon:'🎨' },
            { l:'Зөвшөөрөгдсөн',   v:templates.filter(t=>t.status==='approved').length,          c:'#10B981', icon:'✅' },
            { l:'Хянагдаж байна',  v:templates.filter(t=>t.status==='pending').length,           c:'#F59E0B', icon:'⏳' },
            { l:'Нийт орлого',     v:totalEarning.toLocaleString()+'₮',                          c:'#8B5CF6', icon:'💰' },
          ].map(s => (
            <div key={s.l} style={{ background:'#fff', borderRadius:14, padding:'18px 20px', border:'1px solid #EBEBEB', borderLeft:'3px solid '+s.c }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
              <div style={{ fontSize:22, fontWeight:700, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:12, color:'#888', marginTop:3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:24, borderBottom:'1px solid #EBEBEB', paddingBottom:0 }}>
          {[
            { k:'templates', l:'🎨 Миний загварууд' },
            { k:'upload',    l:'+ Загвар нэмэх' },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k as any)}
              style={{ padding:'10px 20px', border:'none', borderBottom:tab===t.k?'2px solid #FF6B35':'2px solid transparent', background:'transparent', color:tab===t.k?'#FF6B35':'#666', cursor:'pointer', fontSize:14, fontWeight:tab===t.k?600:400, marginBottom:-1 }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Templates list */}
        {tab === 'templates' && (
          loading ? (
            <div style={{ padding:48, textAlign:'center' as any, color:'#888' }}>Уншиж байна...</div>
          ) : templates.length === 0 ? (
            <div style={{ padding:64, textAlign:'center' as any, background:'#fff', borderRadius:16, border:'1px solid #EBEBEB' }}>
              <div style={{ fontSize:64, marginBottom:16 }}>🎨</div>
              <div style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Загвар байхгүй байна</div>
              <div style={{ fontSize:14, color:'#888', marginBottom:24 }}>Анхны загвараа оруулаад орлого олж эхэл</div>
              <button onClick={() => setTab('upload')} style={{ padding:'12px 28px', background:'#FF6B35', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                + Загвар нэмэх
              </button>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
              {templates.map(t => {
                const st = STATUS_INFO[t.status] || STATUS_INFO.pending
                return (
                  <div key={t.id} style={{ background:'#fff', borderRadius:14, overflow:'hidden', border:'1px solid #EBEBEB', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ height:160, background:'linear-gradient(135deg,rgba(255,107,53,0.08),rgba(255,107,53,0.03))', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                      {t.thumbnail_url ? (
                        <img src={t.thumbnail_url.startsWith('http')?t.thumbnail_url:`${API}/uploads/${t.thumbnail_url}`} alt={t.title}
                          style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      ) : (
                        <div style={{ fontSize:48 }}>🖼️</div>
                      )}
                      <div style={{ position:'absolute', top:10, left:10 }}>
                        <span style={{ fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:20, background:st.bg, color:st.c }}>{st.icon} {st.l}</span>
                      </div>
                    </div>
                    <div style={{ padding:'14px 16px' }}>
                      <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{t.title_mn||t.title}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                        <span style={{ fontSize:12, color:'#888' }}>{t.category}</span>
                        <span style={{ fontSize:14, fontWeight:700, color:'#FF6B35' }}>{Number(t.price).toLocaleString()}₮</span>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                        <div style={{ background:'#F8F8F6', borderRadius:8, padding:'8px 10px', textAlign:'center' as any }}>
                          <div style={{ fontSize:16, fontWeight:700, color:'#10B981' }}>{t.use_count}</div>
                          <div style={{ fontSize:10, color:'#888' }}>Ашиглалт</div>
                        </div>
                        <div style={{ background:'#F8F8F6', borderRadius:8, padding:'8px 10px', textAlign:'center' as any }}>
                          <div style={{ fontSize:16, fontWeight:700, color:'#8B5CF6' }}>{(Number(t.price)*Number(t.use_count)*(Number(t.royalty_rate)/100)).toLocaleString()}₮</div>
                          <div style={{ fontSize:10, color:'#888' }}>Орлого</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Upload form */}
        {tab === 'upload' && (
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #EBEBEB', padding:32, maxWidth:680 }}>
            <h2 style={{ margin:'0 0 24px', fontSize:18, fontWeight:700 }}>Шинэ загвар нэмэх</h2>

            {msg && (
              <div style={{ padding:'12px 16px', borderRadius:8, background:msg.includes('❌')?'rgba(239,68,68,0.08)':'rgba(16,185,129,0.08)', color:msg.includes('❌')?'#EF4444':'#10B981', marginBottom:20, fontSize:13 }}>
                {msg}
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#666', display:'block', marginBottom:6, textTransform:'uppercase' as any }}>Монгол нэр *</label>
                <input value={form.title_mn} onChange={e=>setForm(f=>({...f,title_mn:e.target.value}))} placeholder="Визит карт загвар" style={inp} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#666', display:'block', marginBottom:6, textTransform:'uppercase' as any }}>Англи нэр</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Business Card Template" style={inp} />
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#666', display:'block', marginBottom:6, textTransform:'uppercase' as any }}>Ангилал *</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' as any }}>
                {CATS.map(c => (
                  <button key={c} onClick={() => setForm(f=>({...f,category:c}))}
                    style={{ padding:'7px 14px', borderRadius:20, border:form.category===c?'2px solid #FF6B35':'1px solid #E5E5E0', background:form.category===c?'rgba(255,107,53,0.06)':'transparent', color:form.category===c?'#FF6B35':'#666', cursor:'pointer', fontSize:13, fontWeight:form.category===c?600:400 }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#666', display:'block', marginBottom:6, textTransform:'uppercase' as any }}>Үнэ (₮)</label>
                <input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:Number(e.target.value)}))} style={inp} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#666', display:'block', marginBottom:6, textTransform:'uppercase' as any }}>Royalty %</label>
                <input type="number" value={form.royalty_rate} onChange={e=>setForm(f=>({...f,royalty_rate:Number(e.target.value)}))} style={inp} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#666', display:'block', marginBottom:6, textTransform:'uppercase' as any }}>Хэмжээ (мм)</label>
                <div style={{ display:'flex', gap:6 }}>
                  <input type="number" value={form.width_mm} onChange={e=>setForm(f=>({...f,width_mm:Number(e.target.value)}))} placeholder="W" style={{...inp,textAlign:'center' as any}} />
                  <span style={{ lineHeight:'40px', color:'#888' }}>×</span>
                  <input type="number" value={form.height_mm} onChange={e=>setForm(f=>({...f,height_mm:Number(e.target.value)}))} placeholder="H" style={{...inp,textAlign:'center' as any}} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#666', display:'block', marginBottom:6, textTransform:'uppercase' as any }}>Тайлбар</label>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} placeholder="Загварын тухай дэлгэрэнгүй тайлбар..."
                style={{...inp, resize:'vertical' as any}} />
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#666', display:'block', marginBottom:6, textTransform:'uppercase' as any }}>Таг (таслалаар)</label>
              <input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="минимал, орчин үе, бизнес" style={inp} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#666', display:'block', marginBottom:6, textTransform:'uppercase' as any }}>Thumbnail зураг *</label>
                <label style={{ display:'block', border:'2px dashed #E5E5E0', borderRadius:10, padding:'20px', textAlign:'center' as any, cursor:'pointer', background:thumbPreview?'transparent':'#FAFAF8' }}>
                  {thumbPreview ? (
                    <img src={thumbPreview} alt="thumb" style={{ maxHeight:100, maxWidth:'100%', borderRadius:6 }} />
                  ) : (
                    <div>
                      <div style={{ fontSize:28, marginBottom:8 }}>🖼️</div>
                      <div style={{ fontSize:13, color:'#888' }}>Зураг сонгох</div>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleThumb} style={{ display:'none' }} />
                </label>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#666', display:'block', marginBottom:6, textTransform:'uppercase' as any }}>Дизайн файл</label>
                <label style={{ display:'block', border:'2px dashed #E5E5E0', borderRadius:10, padding:'20px', textAlign:'center' as any, cursor:'pointer', background:'#FAFAF8' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>📁</div>
                  <div style={{ fontSize:13, color:designFile?'#10B981':'#888' }}>
                    {designFile ? designFile.name : 'PDF, AI, PSD файл'}
                  </div>
                  <input type="file" accept=".pdf,.ai,.psd,.png,.jpg" onChange={e=>setDesignFile(e.target.files?.[0]||null)} style={{ display:'none' }} />
                </label>
              </div>
            </div>

            {/* Royalty calculation preview */}
            {form.price > 0 && (
              <div style={{ background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:10, padding:'14px 16px', marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#8B5CF6', marginBottom:8 }}>💰 Орлогын тооцоо</div>
                <div style={{ display:'flex', gap:16, fontSize:13 }}>
                  <div>Нэг ашиглалтаас: <b style={{color:'#8B5CF6'}}>{(Number(form.price)*Number(form.royalty_rate)/100).toLocaleString()}₮</b></div>
                  <div>10 ашиглалтаас: <b style={{color:'#8B5CF6'}}>{(Number(form.price)*Number(form.royalty_rate)/100*10).toLocaleString()}₮</b></div>
                </div>
              </div>
            )}

            <button onClick={submit} disabled={saving}
              style={{ width:'100%', padding:'14px', background:saving?'#ccc':'#FF6B35', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:saving?'not-allowed':'pointer' }}>
              {saving ? 'Илгээж байна...' : '🚀 Загвар илгээх'}
            </button>

            <p style={{ fontSize:12, color:'#888', textAlign:'center' as any, marginTop:12 }}>
              Загвар admin-ийн зөвшөөрлийн дараа нийтлэгдэнэ. Royalty {form.royalty_rate}% автоматаар таны wallet-д орно.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}