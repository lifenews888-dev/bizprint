'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const F = "'Segoe UI',system-ui,sans-serif"
const authH = () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('access_token')||'') })

const CATS = ['Визит карт','Флаер','Постер','Баннер','Брошур','Стикер','Сошиал медиа','Бусад']
const STATUS_COLORS: Record<string,{c:string;bg:string;l:string}> = {
  pending:  { c:'#F59E0B', bg:'rgba(245,158,11,0.1)',  l:'Хүлээгдэж байна' },
  approved: { c:'#10B981', bg:'rgba(16,185,129,0.1)',  l:'Зөвшөөрөгдсөн' },
  rejected: { c:'#EF4444', bg:'rgba(239,68,68,0.1)',   l:'Татгалзсан' },
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<any>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await fetch(API+'/templates?status=all', { headers: authH() }).then(r=>r.json()).catch(()=>[])
    setTemplates(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function approve(id: string) {
    await fetch(API+'/templates/'+id+'/approve', { method:'PATCH', headers: authH() })
    load()
  }

  async function reject(id: string) {
    await fetch(API+'/templates/'+id+'/reject', { method:'PATCH', headers: authH() })
    load()
  }

  async function remove(id: string) {
    if (!confirm('Устгах уу?')) return
    await fetch(API+'/templates/'+id, { method:'DELETE', headers: authH() })
    load()
  }

  const filtered = templates.filter(t => {
    const ms = filter==='all' || t.status===filter
    const mq = !search || (t.title||'').toLowerCase().includes(search.toLowerCase()) || (t.designer_name||'').toLowerCase().includes(search.toLowerCase())
    return ms && mq
  })

  const counts = {
    all: templates.length,
    pending: templates.filter(t=>t.status==='pending').length,
    approved: templates.filter(t=>t.status==='approved').length,
    rejected: templates.filter(t=>t.status==='rejected').length,
  }

  return (
    <div style={{ padding:'28px 32px', fontFamily:F, color:'var(--text)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, paddingBottom:20, borderBottom:'1px solid var(--border)' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:600, margin:0 }}>Загварын сан</h1>
          <p style={{ fontSize:13, color:'var(--text3)', margin:'5px 0 0' }}>Дизайнерын оруулсан загваруудыг хянах, зөвшөөрөх</p>
        </div>
        <button onClick={load} style={{ padding:'9px 16px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', cursor:'pointer', fontSize:13 }}>
          ↺ Шинэчлэх
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { k:'all',      l:'Нийт',             v:counts.all,      c:'var(--orange)' },
          { k:'pending',  l:'Хүлээгдэж байна',  v:counts.pending,  c:'#F59E0B' },
          { k:'approved', l:'Зөвшөөрөгдсөн',    v:counts.approved, c:'#10B981' },
          { k:'rejected', l:'Татгалзсан',        v:counts.rejected, c:'#EF4444' },
        ].map(s => (
          <button key={s.k} onClick={() => setFilter(s.k)}
            style={{ background:'var(--surface)', border:filter===s.k?'2px solid '+s.c:'1px solid var(--border)', borderRadius:12, padding:16, textAlign:'left' as any, cursor:'pointer', borderLeft:'3px solid '+s.c }}>
            <div style={{ fontSize:24, fontWeight:700, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>{s.l}</div>
          </button>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Загвар, дизайнер хайх..."
          style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontSize:13, outline:'none', width:260 }} />
      </div>

      {loading ? (
        <div style={{ padding:48, textAlign:'center' as any, color:'var(--text3)' }}>Уншиж байна...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:48, textAlign:'center' as any, color:'var(--text3)', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🎨</div>
          <div style={{ fontWeight:600, marginBottom:8 }}>Загвар байхгүй байна</div>
          <div style={{ fontSize:13 }}>Дизайнерууд загвар оруулсны дараа энд харагдана</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {filtered.map(t => {
            const st = STATUS_COLORS[t.status] || STATUS_COLORS.pending
            return (
              <div key={t.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
                {/* Thumbnail */}
                <div style={{ height:180, background:'linear-gradient(135deg,var(--orange-10),var(--orange-05))', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', cursor:'pointer' }}
                  onClick={() => setPreview(t)}>
                  {t.thumbnail_url ? (
                    <img src={t.thumbnail_url.startsWith('http')?t.thumbnail_url:`${API}/uploads/${t.thumbnail_url}`} alt={t.title}
                      style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  ) : (
                    <div style={{ fontSize:48 }}>🎨</div>
                  )}
                  <div style={{ position:'absolute', top:10, left:10 }}>
                    <span style={{ fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:20, background:st.bg, color:st.c }}>{st.l}</span>
                  </div>
                  {t.price > 0 && (
                    <div style={{ position:'absolute', top:10, right:10, background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:12, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>
                      {Number(t.price).toLocaleString()}₮
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding:'14px 16px' }}>
                  <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{t.title_mn||t.title}</div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginBottom:4 }}>👤 {t.designer_name||'Дизайнер'}</div>
                  <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' as any }}>
                    {t.category && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'rgba(59,130,246,0.1)', color:'#378ADD' }}>{t.category}</span>}
                    {t.use_count > 0 && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'rgba(16,185,129,0.1)', color:'#10B981' }}>{t.use_count} удаа ашиглагдсан</span>}
                  </div>

                  <div style={{ display:'flex', gap:8 }}>
                    {t.status === 'pending' && (
                      <>
                        <button onClick={() => approve(t.id)}
                          style={{ flex:1, padding:'7px', borderRadius:7, border:'1px solid #10B981', background:'rgba(16,185,129,0.06)', color:'#10B981', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                          ✓ Зөвшөөрөх
                        </button>
                        <button onClick={() => reject(t.id)}
                          style={{ flex:1, padding:'7px', borderRadius:7, border:'1px solid #EF4444', background:'rgba(239,68,68,0.06)', color:'#EF4444', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                          ✕ Татгалзах
                        </button>
                      </>
                    )}
                    {t.status === 'approved' && (
                      <button onClick={() => reject(t.id)}
                        style={{ flex:1, padding:'7px', borderRadius:7, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text3)', cursor:'pointer', fontSize:12 }}>
                        Идэвхгүй болгох
                      </button>
                    )}
                    {t.status === 'rejected' && (
                      <button onClick={() => approve(t.id)}
                        style={{ flex:1, padding:'7px', borderRadius:7, border:'1px solid #10B981', background:'rgba(16,185,129,0.06)', color:'#10B981', cursor:'pointer', fontSize:12 }}>
                        Зөвшөөрөх
                      </button>
                    )}
                    <button onClick={() => remove(t.id)}
                      style={{ padding:'7px 10px', borderRadius:7, border:'1px solid #EF4444', background:'transparent', color:'#EF4444', cursor:'pointer', fontSize:12 }}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setPreview(null)}>
          <div style={{ background:'var(--surface)', borderRadius:16, padding:28, width:560, maxHeight:'90vh', overflowY:'auto' as any, border:'1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h2 style={{ margin:0, fontSize:18, fontWeight:600 }}>{preview.title_mn||preview.title}</h2>
              <button onClick={() => setPreview(null)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--text3)' }}>✕</button>
            </div>
            {preview.thumbnail_url && (
              <img src={preview.thumbnail_url.startsWith('http')?preview.thumbnail_url:`${API}/uploads/${preview.thumbnail_url}`}
                alt={preview.title} style={{ width:'100%', borderRadius:8, marginBottom:16 }} />
            )}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { l:'Дизайнер',    v:preview.designer_name||'—' },
                { l:'Ангилал',     v:preview.category||'—' },
                { l:'Үнэ',         v:preview.price>0?Number(preview.price).toLocaleString()+'₮':'Үнэгүй' },
                { l:'Royalty',     v:preview.royalty_rate+'%' },
                { l:'Хэмжээ',      v:preview.width_mm&&preview.height_mm?`${preview.width_mm}×${preview.height_mm}мм`:'—' },
                { l:'Ашиглагдсан', v:preview.use_count+' удаа' },
              ].map(r => (
                <div key={r.l} style={{ background:'var(--surface2)', borderRadius:8, padding:'10px 14px' }}>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:3 }}>{r.l}</div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{r.v}</div>
                </div>
              ))}
            </div>
            {preview.description && (
              <div style={{ marginTop:12, padding:'12px 14px', background:'var(--surface2)', borderRadius:8, fontSize:13, color:'var(--text3)' }}>
                {preview.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}