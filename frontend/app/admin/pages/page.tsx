'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const F = "'Segoe UI',system-ui,sans-serif"
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('access_token')||'') })

interface Page {
  id: string; title: string; slug: string; content: string
  type: string; is_published: boolean; meta_title: string; meta_description: string
}

const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:14, outline:'none', boxSizing:'border-box' }

export default function AdminPagesPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Page|null>(null)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ title:'', slug:'', content:'', type:'page', is_published:false, meta_title:'', meta_description:'' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const r = await fetch(API+'/pages', { headers: hdrs() }).catch(() => null)
    if (r?.ok) setPages(await r.json())
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm({ title:'', slug:'', content:'', type:'page', is_published:false, meta_title:'', meta_description:'' })
    setModal(true)
  }

  function openEdit(p: Page) {
    setEditing(p)
    setForm({ title:p.title, slug:p.slug, content:p.content||'', type:p.type||'page', is_published:p.is_published, meta_title:p.meta_title||'', meta_description:p.meta_description||'' })
    setModal(true)
  }

  async function save() {
    if (!form.title || !form.slug) { setMsg('Гарчиг болон slug заавал!'); return }
    const url = editing ? API+'/pages/'+editing.id : API+'/pages'
    const res = await fetch(url, { method: editing?'PATCH':'POST', headers: hdrs(), body: JSON.stringify(form) })
    if (res.ok) { setMsg('Хадгалагдлаа!'); setModal(false); load() }
    else { const e = await res.json(); setMsg('Алдаа: ' + (e.message||res.status)) }
  }

  async function remove(id: string) {
    if (!confirm('Устгах уу?')) return
    await fetch(API+'/pages/'+id, { method:'DELETE', headers: hdrs() })
    load()
  }

  async function togglePublish(p: Page) {
    await fetch(API+'/pages/'+p.id, { method:'PATCH', headers: hdrs(), body: JSON.stringify({ is_published: !p.is_published }) })
    load()
  }

  const lbl = (t: string) => <div style={{ fontSize:12, fontWeight:600, color:'var(--text3)', textTransform:'uppercase' as any, letterSpacing:'0.06em', marginBottom:6 }}>{t}</div>

  return (
    <div style={{ padding:'28px 32px', fontFamily:F, color:'var(--text)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, paddingBottom:20, borderBottom:'1px solid var(--border)' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>Хуудсууд</h1>
          <p style={{ fontSize:13, color:'var(--text3)', margin:'4px 0 0' }}>Вэбсайтын статик хуудсуудыг удирдах</p>
        </div>
        <button onClick={openNew} style={{ padding:'9px 20px', background:'var(--orange)', border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
          + Хуудас нэмэх
        </button>
      </div>

      {msg && (
        <div style={{ padding:'12px 16px', borderRadius:8, background:msg.includes('Алдаа')?'rgba(226,75,74,0.1)':'rgba(29,158,117,0.1)', color:msg.includes('Алдаа')?'#e24b4a':'#1D9E75', marginBottom:16, fontSize:13 }}>
          {msg}
        </div>
      )}

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 100px', padding:'10px 20px', background:'var(--surface2)', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase' as any }}>
          <span>Гарчиг</span><span>Slug</span><span>Төрөл</span><span>Төлөв</span><span style={{textAlign:'right' as any}}>Үйлдэл</span>
        </div>

        {loading ? (
          <div style={{ padding:40, textAlign:'center' as any, color:'var(--text3)' }}>Уншиж байна...</div>
        ) : pages.length === 0 ? (
          <div style={{ padding:48, textAlign:'center' as any, color:'var(--text3)' }}>
            <div style={{ fontSize:36, marginBottom:10 }}>📄</div>
            <div style={{ fontWeight:600 }}>Хуудас байхгүй байна</div>
          </div>
        ) : pages.map((p, i) => (
          <div key={p.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 100px', padding:'13px 20px', borderBottom:i<pages.length-1?'1px solid var(--border)':'none', alignItems:'center' }}
            onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
            <div>
              <div style={{ fontSize:14, fontWeight:600 }}>{p.title}</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>/{p.slug}</div>
            </div>
            <span style={{ fontSize:12, color:'var(--text3)', fontFamily:'monospace' }}>{p.slug}</span>
            <span style={{ fontSize:12, padding:'3px 8px', borderRadius:20, background:'rgba(59,130,246,0.1)', color:'#378ADD', fontWeight:600, width:'fit-content' }}>{p.type||'page'}</span>
            <button onClick={() => togglePublish(p)}
              style={{ fontSize:12, padding:'3px 10px', borderRadius:20, border:'1px solid', background:p.is_published?'rgba(29,158,117,0.1)':'var(--surface2)', color:p.is_published?'#1D9E75':'var(--text3)', borderColor:p.is_published?'#1D9E75':'var(--border)', cursor:'pointer', fontWeight:600, width:'fit-content' }}>
              {p.is_published?'Нийтлэгдсэн':'Ноорог'}
            </button>
            <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
              <button onClick={() => openEdit(p)} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'5px 8px', cursor:'pointer', fontSize:13 }}>✏️</button>
              <button onClick={() => remove(p.id)} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'5px 8px', cursor:'pointer', fontSize:13 }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:32, width:600, maxHeight:'90vh', overflowY:'auto' as any }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>{editing?'Хуудас засах':'Шинэ хуудас'}</h2>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:22 }}>✕</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                {lbl('Гарчиг *')}
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value,slug:f.slug||e.target.value.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')}))} placeholder="Тухай бидний" style={inp} />
              </div>
              <div>
                {lbl('Slug *')}
                <input value={form.slug} onChange={e=>setForm(f=>({...f,slug:e.target.value}))} placeholder="about" style={{...inp, fontFamily:'monospace', color:'var(--orange)'}} />
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              {lbl('Төрөл')}
              <div style={{ display:'flex', gap:8 }}>
                {['page','blog','legal','landing'].map(t => (
                  <button key={t} onClick={() => setForm(f=>({...f,type:t}))}
                    style={{ padding:'7px 16px', borderRadius:8, border:form.type===t?'2px solid var(--orange)':'1px solid var(--border)', background:form.type===t?'var(--orange-06)':'transparent', color:form.type===t?'var(--orange)':'var(--text3)', cursor:'pointer', fontSize:13 }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              {lbl('Агуулга (HTML)')}
              <textarea value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} rows={8}
                placeholder="<h1>Тухай бидний</h1><p>...</p>"
                style={{...inp, resize:'vertical' as any, fontFamily:'monospace', fontSize:12}} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                {lbl('Meta Title')}
                <input value={form.meta_title} onChange={e=>setForm(f=>({...f,meta_title:e.target.value}))} style={inp} />
              </div>
              <div>
                {lbl('Meta Description')}
                <input value={form.meta_description} onChange={e=>setForm(f=>({...f,meta_description:e.target.value}))} style={inp} />
              </div>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <button onClick={() => setForm(f=>({...f,is_published:!f.is_published}))}
                style={{ width:44, height:24, borderRadius:12, border:'none', background:form.is_published?'#1D9E75':'var(--border)', cursor:'pointer', position:'relative' as any }}>
                <span style={{ position:'absolute' as any, top:3, left:form.is_published?22:2, width:18, height:18, borderRadius:'50%', background:'#fff' }} />
              </button>
              <span style={{ fontSize:14 }}>Нийтлэх</span>
            </div>

            {msg && <div style={{ padding:'10px 14px', borderRadius:8, background:msg.includes('Алдаа')?'rgba(226,75,74,0.1)':'rgba(29,158,117,0.1)', color:msg.includes('Алдаа')?'#e24b4a':'#1D9E75', marginBottom:14, fontSize:13 }}>{msg}</div>}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(false)} style={{ padding:'10px 18px', background:'var(--surface2)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:8, fontWeight:600, fontSize:14, cursor:'pointer' }}>Болих</button>
              <button onClick={save} style={{ padding:'10px 20px', background:'var(--orange)', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer' }}>Хадгалах</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}