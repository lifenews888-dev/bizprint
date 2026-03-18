'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const F = "'Segoe UI',system-ui,sans-serif"

function authH() {
  const t = localStorage.getItem('access_token') || ''
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }
}

interface MenuItem {
  id?: number; label: string; label_mn: string; url: string
  icon: string; description: string; color: string
  section_title: string; parentId: number | null
  order: number; isActive: boolean; location: string; is_mega: boolean
}

const COLORS = ['#FF6B35','#3B82F6','#10B981','#8B5CF6','#F59E0B','#EF4444','#06B6D4','#EC4899']
const DEFAULT_SECTIONS = [
  { title:'Офсет хэвлэл', icon:'🖨️', color:'#FF6B35' },
  { title:'Дижитал хэвлэл', icon:'💻', color:'#3B82F6' },
  { title:'Өргөн формат', icon:'📐', color:'#10B981' },
  { title:'Гадна/Дотор хаяг', icon:'🏢', color:'#8B5CF6' },
  { title:'Савлагаа & Уут', icon:'📦', color:'#F59E0B' },
  { title:'Промо & Даавал', icon:'👕', color:'#EC4899' },
]

export default function AdminMenusPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [tab, setTab] = useState<'mega'|'header'|'footer'>('mega')
  const [form, setForm] = useState<MenuItem>({
    label:'', label_mn:'', url:'', icon:'', description:'', color:'#FF6B35',
    section_title:'', parentId:null, order:0, isActive:true, location:'header', is_mega:false
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await fetch(`${API}/menus`, { headers: authH() }).then(r => r.json()).catch(() => [])
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function saveAll() {
    setSaving(true)
    for (const item of items) {
      if (item.id) {
        await fetch(`${API}/menus/${item.id}`, { method:'PATCH', headers: authH(), body: JSON.stringify(item) })
      }
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  async function saveItem() {
    if (editing?.id) {
      await fetch(`${API}/menus/${editing.id}`, { method:'PATCH', headers: authH(), body: JSON.stringify(form) })
    } else {
      await fetch(`${API}/menus`, { method:'POST', headers: authH(), body: JSON.stringify(form) })
    }
    setModal(false)
    load()
  }

  async function removeItem(id: number) {
    if (!confirm('Устгах уу?')) return
    await fetch(`${API}/menus/${id}`, { method:'DELETE', headers: authH() })
    load()
  }

  async function seedDefaults() {
    if (!confirm('Анхдагч mega menu өгөгдлийг нэмэх үү?')) return
    const DEFAULT_ITEMS = [
      { label:'Business Card', label_mn:'Визит карт', url:'/quote?cat=offset&product=business-card', icon:'💳', description:'90×50мм, 250-400gsm', color:'#FF6B35', section_title:'Офсет хэвлэл', parentId:null, order:1, isActive:true, location:'mega', is_mega:true },
      { label:'Flyer', label_mn:'Флаер / Листовк', url:'/quote?cat=offset&product=flyer', icon:'📄', description:'A4, A5, A6 хэмжээ', color:'#FF6B35', section_title:'Офсет хэвлэл', parentId:null, order:2, isActive:true, location:'mega', is_mega:true },
      { label:'Brochure', label_mn:'Брошур', url:'/quote?cat=offset&product=brochure', icon:'📋', description:'2-48 хуудас, нугалалттай', color:'#FF6B35', section_title:'Офсет хэвлэл', parentId:null, order:3, isActive:true, location:'mega', is_mega:true },
      { label:'Catalog', label_mn:'Каталог', url:'/quote?cat=offset&product=catalog', icon:'📚', description:'Softcover, Hardcover', color:'#FF6B35', section_title:'Офсет хэвлэл', parentId:null, order:4, isActive:true, location:'mega', is_mega:true },
      { label:'Sticker', label_mn:'Стикер', url:'/quote?cat=digital&product=sticker', icon:'⭐', description:'Хайчлагдсан, Хуудас', color:'#3B82F6', section_title:'Дижитал хэвлэл', parentId:null, order:5, isActive:true, location:'mega', is_mega:true },
      { label:'Label', label_mn:'Наалт / Label', url:'/quote?cat=digital&product=label', icon:'🏷️', description:'Дугуй, Тэгш өнцөгт', color:'#3B82F6', section_title:'Дижитал хэвлэл', parentId:null, order:6, isActive:true, location:'mega', is_mega:true },
      { label:'Banner', label_mn:'Баннер', url:'/quote?cat=large&product=banner', icon:'🎌', description:'Винил, Тарпалин', color:'#10B981', section_title:'Өргөн формат', parentId:null, order:7, isActive:true, location:'mega', is_mega:true },
      { label:'Rollup', label_mn:'Роллап', url:'/quote?cat=large&product=rollup', icon:'📜', description:'850×2000мм стандарт', color:'#10B981', section_title:'Өргөн формат', parentId:null, order:8, isActive:true, location:'mega', is_mega:true },
      { label:'T-Shirt', label_mn:'Цамц хэвлэл', url:'/quote?cat=promo&product=tshirt', icon:'👕', description:'DTF, Screen print', color:'#EC4899', section_title:'Промо & Даавал', parentId:null, order:9, isActive:true, location:'mega', is_mega:true },
    ]
    for (const item of DEFAULT_ITEMS) {
      await fetch(`${API}/menus`, { method:'POST', headers: authH(), body: JSON.stringify(item) })
    }
    load()
  }

  function openNew() {
    setEditing(null)
    setForm({ label:'', label_mn:'', url:'', icon:'', description:'', color:'#FF6B35', section_title:'', parentId:null, order:0, isActive:true, location:'mega', is_mega:true })
    setModal(true)
  }

  function openEdit(item: MenuItem) {
    setEditing(item)
    setForm({ ...item })
    setModal(true)
  }

  const megaItems = items.filter(i => i.location === 'mega' || i.is_mega)
  const sections = Array.from(new Set(megaItems.map(i => i.section_title).filter(Boolean)))

  const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' }

  return (
    <div style={{ padding:'28px 32px', fontFamily:F, color:'var(--text)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, paddingBottom:20, borderBottom:'1px solid var(--border)' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:600, margin:0 }}>Mega Menu тохиргоо</h1>
          <p style={{ fontSize:13, color:'var(--text3)', margin:'5px 0 0' }}>Вэбсайтын навигаци болон mega menu удирдах</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={seedDefaults} style={{ padding:'9px 16px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', cursor:'pointer', fontSize:13 }}>
            ⚡ Анхдагч өгөгдөл нэмэх
          </button>
          <button onClick={openNew} style={{ padding:'9px 16px', borderRadius:8, border:'none', background:'var(--orange)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>
            + Цэс нэмэх
          </button>
          <button onClick={saveAll} disabled={saving} style={{ padding:'9px 16px', borderRadius:8, border:'none', background:saved?'#10B981':'#378ADD', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>
            {saved?'✓ Хадгалагдлаа':saving?'Хадгалж байна...':'Хадгалах'}
          </button>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        {[{ k:'mega', l:'🖨️ Mega Menu' }, { k:'header', l:'📌 Header' }, { k:'footer', l:'📋 Footer' }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as any)}
            style={{ padding:'8px 20px', borderRadius:10, border:tab===t.k?'2px solid var(--orange)':'1px solid var(--border)', background:tab===t.k?'var(--orange-06)':'transparent', color:tab===t.k?'var(--orange)':'var(--text3)', cursor:'pointer', fontSize:13, fontWeight:tab===t.k?600:400 }}>
            {t.l}
          </button>
        ))}
      </div>

      {loading ? <div style={{ padding:40, textAlign:'center' as any, color:'var(--text3)' }}>Уншиж байна...</div> : (
        <>
          {tab === 'mega' && (
            <div>
              {sections.length === 0 ? (
                <div style={{ padding:48, textAlign:'center' as any, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12 }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
                  <div style={{ fontWeight:600, marginBottom:8 }}>Mega menu хоосон байна</div>
                  <div style={{ fontSize:13, color:'var(--text3)', marginBottom:20 }}>⚡ Анхдагч өгөгдөл нэмэх товч дарж эхлэнэ үү</div>
                </div>
              ) : sections.map(section => (
                <div key={section} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, marginBottom:16, overflow:'hidden' }}>
                  <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--surface2)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:20 }}>{megaItems.find(i => i.section_title===section)?.icon || '📁'}</span>
                      <span style={{ fontWeight:700, fontSize:15 }}>{section}</span>
                      <span style={{ fontSize:12, color:'var(--text3)' }}>{megaItems.filter(i => i.section_title===section).length} бүтээгдэхүүн</span>
                    </div>
                    <button onClick={() => { setForm({ label:'', label_mn:'', url:'', icon:'', description:'', color:megaItems.find(i=>i.section_title===section)?.color||'#FF6B35', section_title:section, parentId:null, order:0, isActive:true, location:'mega', is_mega:true }); setEditing(null); setModal(true) }}
                      style={{ padding:'5px 12px', borderRadius:6, border:'1px solid var(--orange)', background:'transparent', color:'var(--orange)', cursor:'pointer', fontSize:12 }}>
                      + Нэмэх
                    </button>
                  </div>
                  <div style={{ padding:'12px 20px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10 }}>
                    {megaItems.filter(i => i.section_title===section).map(item => (
                      <div key={item.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <span style={{ fontSize:20 }}>{item.icon}</span>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600 }}>{item.label_mn || item.label}</div>
                            <div style={{ fontSize:11, color:'var(--text3)' }}>{item.description}</div>
                            <div style={{ fontSize:11, color:'#378ADD' }}>{item.url}</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                          <button onClick={() => { item.isActive = !item.isActive; setItems([...items]) }}
                            style={{ fontSize:11, padding:'3px 8px', borderRadius:5, border:'1px solid var(--border)', background:item.isActive?'rgba(29,158,117,0.1)':'transparent', color:item.isActive?'#1D9E75':'var(--text3)', cursor:'pointer' }}>
                            {item.isActive?'✓':'✗'}
                          </button>
                          <button onClick={() => openEdit(item)}
                            style={{ fontSize:11, padding:'3px 8px', borderRadius:5, border:'1px solid #378ADD', background:'transparent', color:'#378ADD', cursor:'pointer' }}>
                            Засах
                          </button>
                          <button onClick={() => item.id && removeItem(item.id)}
                            style={{ fontSize:11, padding:'3px 8px', borderRadius:5, border:'1px solid #e24b4a', background:'transparent', color:'#e24b4a', cursor:'pointer' }}>
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Шинэ section нэмэх */}
              <div style={{ background:'var(--surface)', border:'2px dashed var(--border)', borderRadius:12, padding:20 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Шинэ ангилал (section) нэмэх</div>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' as any }}>
                  {DEFAULT_SECTIONS.filter(s => !sections.includes(s.title)).map(s => (
                    <button key={s.title} onClick={() => { setForm({ label:'', label_mn:'', url:'', icon:s.icon, description:'', color:s.color, section_title:s.title, parentId:null, order:0, isActive:true, location:'mega', is_mega:true }); setEditing(null); setModal(true) }}
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', cursor:'pointer', fontSize:13 }}>
                      <span>{s.icon}</span>{s.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab !== 'mega' && (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
              {items.filter(i => i.location===tab).map((item, idx) => (
                <div key={item.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:18 }}>{item.icon || '📌'}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{item.label_mn || item.label}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{item.url}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => openEdit(item)} style={{ fontSize:12, padding:'4px 10px', borderRadius:6, border:'1px solid #378ADD', background:'transparent', color:'#378ADD', cursor:'pointer' }}>Засах</button>
                    <button onClick={() => item.id && removeItem(item.id)} style={{ fontSize:12, padding:'4px 10px', borderRadius:6, border:'1px solid #e24b4a', background:'transparent', color:'#e24b4a', cursor:'pointer' }}>Устгах</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Preview */}
      {tab === 'mega' && sections.length > 0 && (
        <div style={{ marginTop:24, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Урьдчилан харах</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:16 }}>
            {sections.map(section => {
              const sectionItems = megaItems.filter(i => i.section_title===section && i.isActive)
              const sectionColor = sectionItems[0]?.color || '#FF6B35'
              return (
                <div key={section}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                    <span style={{ fontSize:16 }}>{sectionItems[0]?.icon || '📁'}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:sectionColor, textTransform:'uppercase' as any }}>{section}</span>
                  </div>
                  {sectionItems.map(item => (
                    <div key={item.id} style={{ padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                      <div style={{ fontSize:13, color:'var(--text)' }}>{item.label_mn || item.label}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{item.description}</div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--surface)', borderRadius:16, padding:28, width:500, border:'1px solid var(--border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:18, fontWeight:600 }}>{editing?'Засах':'Шинэ цэс нэмэх'}</h2>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--text3)' }}>✕</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:4 }}>Монгол нэр</label>
                <input value={form.label_mn} onChange={e=>setForm({...form,label_mn:e.target.value})} style={inp} />
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:4 }}>Англи нэр</label>
                <input value={form.label} onChange={e=>setForm({...form,label:e.target.value})} style={inp} />
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:4 }}>URL хаяг</label>
                <input value={form.url} onChange={e=>setForm({...form,url:e.target.value})} placeholder="/quote?cat=offset" style={inp} />
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:4 }}>Тайлбар</label>
                <input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="A4, A5..." style={inp} />
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:4 }}>Ангилал (Section)</label>
                <input value={form.section_title} onChange={e=>setForm({...form,section_title:e.target.value})} list="sections" style={inp} />
                <datalist id="sections">
                  {sections.map(s => <option key={s} value={s} />)}
                  {DEFAULT_SECTIONS.map(s => <option key={s.title} value={s.title} />)}
                </datalist>
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:4 }}>Icon (emoji)</label>
                <input value={form.icon} onChange={e=>setForm({...form,icon:e.target.value})} placeholder="📄" style={inp} />
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Өнгө</label>
              <div style={{ display:'flex', gap:8 }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm({...form,color:c})}
                    style={{ width:28, height:28, borderRadius:'50%', background:c, border:form.color===c?'3px solid var(--text)':'2px solid transparent', cursor:'pointer' }} />
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginBottom:16 }}>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer' }}>
                <input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})} />
                Идэвхтэй
              </label>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(false)} style={{ padding:'9px 20px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text)', cursor:'pointer', fontSize:13 }}>Цуцлах</button>
              <button onClick={saveItem} style={{ padding:'9px 20px', borderRadius:8, border:'none', background:'var(--orange)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:500 }}>Хадгалах</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}