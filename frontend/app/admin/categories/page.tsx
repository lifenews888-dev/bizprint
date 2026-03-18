'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const F = "'Segoe UI',system-ui,sans-serif"
const getToken = () => localStorage.getItem('access_token') || ''
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() })
const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

const ICONS = ['📦','🖨️','📋','🎨','📣','📷','🏷️','📰','🗂️','✉️','🎁','📖','📍','🖼️','📌']
const COLORS = ['var(--orange)','#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#84CC16','#EF4444','#6366F1']
const ATTR_TYPES = [
  { value: 'select',     label: 'Сонголт' },
  { value: 'number',     label: 'Тоо' },
  { value: 'text',       label: 'Текст' },
  { value: 'checkbox',   label: 'Чекбокс' },
  { value: 'dimensions', label: 'Хэмжээс' },
]

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: 'var(--surface2)',
  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box'
}

interface Category {
  id: string; name: string; name_mn: string; slug: string; description: string
  icon: string; color: string; parent_id: string | null; sort_order: number
  is_active: boolean; children?: Category[]
}
interface Attribute {
  id: string; product_id: string; name: string; name_mn: string; type: string
  options: string[] | null; unit: string; default_value: string; required: boolean; sort_order: number
}
interface Product { id: string; name: string; name_mn: string }

const EMPTY_CAT = { name:'', name_mn:'', slug:'', description:'', icon:'📦', color:'var(--orange)', parent_id: null as string|null, sort_order:0, is_active:true }
const EMPTY_ATTR = { product_id:'', name:'', name_mn:'', type:'select', options:[] as string[], unit:'', default_value:'', required:false, sort_order:0 }

export default function AdminCategoriesPage() {
  const [tab, setTab] = useState<'categories'|'attributes'>('categories')
  const [categories, setCategories] = useState<Category[]>([])
  const [tree, setTree] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState('')

  const [catModal, setCatModal] = useState(false)
  const [catEdit, setCatEdit] = useState<Category|null>(null)
  const [catForm, setCatForm] = useState({...EMPTY_CAT})
  const [catSaving, setCatSaving] = useState(false)

  const [attrModal, setAttrModal] = useState(false)
  const [attrEdit, setAttrEdit] = useState<Attribute|null>(null)
  const [attrForm, setAttrForm] = useState({...EMPTY_ATTR})
  const [attrSaving, setAttrSaving] = useState(false)
  const [newOption, setNewOption] = useState('')
  const [selProduct, setSelProduct] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [cR, tR, pR] = await Promise.all([
        fetch(API+'/categories', { headers: hdrs() }),
        fetch(API+'/categories/tree', { headers: hdrs() }),
        fetch(API+'/products', { headers: hdrs() }),
      ])
      if (cR.ok) setCategories(await cR.json())
      if (tR.ok) setTree(await tR.json())
      if (pR.ok) setProducts(await pR.json())
    } catch {}
    setLoading(false)
  }

  async function fetchAttrs(pid: string) {
    try {
      const r = await fetch(API+'/product-attributes?product_id='+pid, { headers: hdrs() })
      setAttributes(r.ok ? await r.json() : [])
    } catch { setAttributes([]) }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function openCatCreate(parentId?: string) {
    setCatEdit(null); setCatForm({...EMPTY_CAT, parent_id: parentId||null}); setCatModal(true)
  }
  function openCatEdit(c: Category) {
    setCatEdit(c)
    setCatForm({ name:c.name, name_mn:c.name_mn||'', slug:c.slug||'', description:c.description||'', icon:c.icon||'📦', color:c.color||'var(--orange)', parent_id:c.parent_id, sort_order:c.sort_order||0, is_active:c.is_active })
    setCatModal(true)
  }
  async function saveCat() {
    if (!catForm.name) return
    setCatSaving(true)
    const body = {...catForm, slug: catForm.slug || slugify(catForm.name)}
    try {
      const url = catEdit ? API+'/categories/'+catEdit.id : API+'/categories'
      const r = await fetch(url, { method: catEdit?'PATCH':'POST', headers: hdrs(), body: JSON.stringify(body) })
      if (r.ok) { showToast(catEdit?'Засагдлаа':'Нэмэгдлээ'); setCatModal(false); fetchAll() }
      else showToast('Алдаа гарлаа')
    } catch { showToast('Алдаа гарлаа') }
    setCatSaving(false)
  }
  async function deleteCat(id: string) {
    if (!confirm('Устгах уу?')) return
    await fetch(API+'/categories/'+id, { method:'DELETE', headers: hdrs() })
    showToast('Устгагдлаа'); fetchAll()
  }
  async function toggleCat(c: Category) {
    await fetch(API+'/categories/'+c.id, { method:'PATCH', headers: hdrs(), body: JSON.stringify({is_active: !c.is_active}) })
    fetchAll()
  }

  function openAttrCreate() {
    setAttrEdit(null); setAttrForm({...EMPTY_ATTR, product_id: selProduct}); setNewOption(''); setAttrModal(true)
  }
  function openAttrEdit(a: Attribute) {
    setAttrEdit(a)
    setAttrForm({ product_id:a.product_id, name:a.name, name_mn:a.name_mn||'', type:a.type, options:Array.isArray(a.options)?a.options:[], unit:a.unit||'', default_value:a.default_value||'', required:a.required, sort_order:a.sort_order||0 })
    setNewOption(''); setAttrModal(true)
  }
  async function saveAttr() {
    if (!attrForm.name || !attrForm.product_id) return
    setAttrSaving(true)
    try {
      const url = attrEdit ? API+'/product-attributes/'+attrEdit.id : API+'/product-attributes'
      const body = { ...attrForm, product_id: selProduct }
      const r = await fetch(url, { method: attrEdit?'PATCH':'POST', headers: hdrs(), body: JSON.stringify(body) })
      if (r.ok) { showToast(attrEdit?'Засагдлаа':'Нэмэгдлээ'); setAttrModal(false); fetchAttrs(selProduct) }
      else showToast('Алдаа гарлаа')
    } catch { showToast('Алдаа гарлаа') }
    setAttrSaving(false)
  }
  async function deleteAttr(a: Attribute) {
    if (!confirm('Устгах уу?')) return
    await fetch(API+'/product-attributes/'+a.id, { method:'DELETE', headers: hdrs() })
    showToast('Устгагдлаа'); fetchAttrs(selProduct)
  }
  function addOption() {
    if (!newOption.trim()) return
    setAttrForm(f => ({...f, options:[...(f.options||[]), newOption.trim()]}))
    setNewOption('')
  }

  const lbl = (text: string) => (
    <div style={{ fontSize:12, fontWeight:600, color:'var(--text3)', textTransform:'uppercase' as any, letterSpacing:'0.06em', marginBottom:6 }}>{text}</div>
  )

  return (
    <div style={{ padding:'28px 32px', fontFamily:F, color:'var(--text)' }}>
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background:'#1D9E75', color:'#fff', padding:'12px 20px', borderRadius:10, fontSize:14, fontWeight:600 }}>
          {toast}
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>Ангилал</h1>
          <p style={{ color:'var(--text3)', fontSize:13, margin:'4px 0 0' }}>Бүтээгдэхүүний ангилал, дэд ангилал, параметр</p>
        </div>
        {tab === 'categories' && (
          <button onClick={() => openCatCreate()} style={{ padding:'9px 20px', background:'var(--orange)', border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            + Ангилал нэмэх
          </button>
        )}
        {tab === 'attributes' && selProduct && (
          <button onClick={openAttrCreate} style={{ padding:'9px 20px', background:'var(--orange)', border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            + Параметр нэмэх
          </button>
        )}
      </div>

      <div style={{ display:'flex', gap:4, borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[['categories','Ангилалууд'],['attributes','Параметрүүд']].map(([k,lbl2]) => (
          <button key={k} onClick={() => setTab(k as any)}
            style={{ background:'none', border:'none', padding:'10px 18px', fontSize:14, fontWeight:600, cursor:'pointer', color:tab===k?'var(--orange)':'var(--text3)', borderBottom:tab===k?'2px solid var(--orange)':'2px solid transparent', marginBottom:-1 }}>
            {lbl2}
          </button>
        ))}
      </div>

      {tab === 'categories' && (
        loading ? <div style={{ padding:40, textAlign:'center' as any, color:'var(--text3)' }}>Уншиж байна...</div> : (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 120px', padding:'10px 20px', background:'var(--surface2)', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase' as any }}>
              <span>Нэр</span><span>Slug</span><span>Дэд ангилал</span><span>Төлөв</span><span style={{textAlign:'right' as any}}>Үйлдэл</span>
            </div>
            {tree.length === 0 ? (
              <div style={{ padding:48, textAlign:'center' as any, color:'var(--text3)' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🗂️</div>
                <div style={{ fontWeight:600 }}>Ангилал байхгүй байна</div>
              </div>
            ) : tree.map(cat => (
              <div key={cat.id}>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 120px', padding:'13px 20px', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {(cat.children?.length||0) > 0 ? (
                      <button onClick={() => setExpanded(e => { const n=new Set(e); n.has(cat.id)?n.delete(cat.id):n.add(cat.id); return n })}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:12 }}>
                        {expanded.has(cat.id)?'▾':'▸'}
                      </button>
                    ) : <span style={{width:16}}/>}
                    <span style={{fontSize:18}}>{cat.icon||'📦'}</span>
                    <div>
                      <div style={{fontWeight:600, fontSize:14}}>{cat.name}</div>
                      {cat.name_mn && <div style={{fontSize:11, color:'var(--text3)'}}>{cat.name_mn}</div>}
                    </div>
                  </div>
                  <span style={{fontFamily:'monospace', fontSize:12, color:'var(--text3)'}}>{cat.slug||'—'}</span>
                  <span style={{fontSize:13, color:'var(--text3)'}}>{cat.children?.length||0} дэд</span>
                  <button onClick={() => toggleCat(cat)}
                    style={{ background:cat.is_active?'rgba(29,158,117,0.15)':'var(--surface2)', color:cat.is_active?'#1D9E75':'var(--text3)', border:'1px solid', borderColor:cat.is_active?'#1D9E75':'var(--border)', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:600, cursor:'pointer', width:'fit-content' }}>
                    {cat.is_active?'Идэвхтэй':'Идэвхгүй'}
                  </button>
                  <div style={{display:'flex', gap:6, justifyContent:'flex-end'}}>
                    <button onClick={() => openCatCreate(cat.id)} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'5px 8px', cursor:'pointer', fontSize:13 }} title="Дэд нэмэх">➕</button>
                    <button onClick={() => openCatEdit(cat)} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'5px 8px', cursor:'pointer', fontSize:13 }}>✏️</button>
                    <button onClick={() => deleteCat(cat.id)} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'5px 8px', cursor:'pointer', fontSize:13 }}>🗑️</button>
                  </div>
                </div>
                {expanded.has(cat.id) && cat.children?.map(child => (
                  <div key={child.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 120px', padding:'11px 20px 11px 52px', borderBottom:'1px solid var(--border)', alignItems:'center', background:'var(--surface2)' }}>
                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                      <span style={{fontSize:16}}>{child.icon||'📦'}</span>
                      <div>
                        <div style={{fontSize:13}}>└ {child.name}</div>
                        {child.name_mn && <div style={{fontSize:11, color:'var(--text3)'}}>{child.name_mn}</div>}
                      </div>
                    </div>
                    <span style={{fontFamily:'monospace', fontSize:12, color:'var(--text3)'}}>{child.slug||'—'}</span>
                    <span style={{fontSize:13, color:'var(--text3)'}}>Дэд ангилал</span>
                    <button onClick={() => toggleCat(child)}
                      style={{ background:child.is_active?'rgba(29,158,117,0.15)':'var(--surface2)', color:child.is_active?'#1D9E75':'var(--text3)', border:'1px solid', borderColor:child.is_active?'#1D9E75':'var(--border)', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:600, cursor:'pointer', width:'fit-content' }}>
                      {child.is_active?'Идэвхтэй':'Идэвхгүй'}
                    </button>
                    <div style={{display:'flex', gap:6, justifyContent:'flex-end'}}>
                      <button onClick={() => openCatEdit(child)} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'5px 8px', cursor:'pointer', fontSize:13 }}>✏️</button>
                      <button onClick={() => deleteCat(child.id)} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'5px 8px', cursor:'pointer', fontSize:13 }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'attributes' && (
        <div style={{display:'grid', gridTemplateColumns:'260px 1fr', gap:24}}>
          <div style={{background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', height:'fit-content'}}>
            <div style={{padding:'11px 16px', background:'var(--surface2)', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase' as any}}>
              Бүтээгдэхүүн
            </div>
            {products.map(p => (
              <button key={p.id} onClick={() => { setSelProduct(p.id); fetchAttrs(p.id) }}
                style={{width:'100%', textAlign:'left' as any, background:'none', border:'none', padding:'10px 16px', cursor:'pointer', fontSize:13, color:selProduct===p.id?'var(--orange)':'var(--text)', borderLeft:selProduct===p.id?'3px solid var(--orange)':'3px solid transparent', fontWeight:selProduct===p.id?600:400}}>
                {p.name_mn||p.name}
              </button>
            ))}
          </div>
          <div>
            {!selProduct ? (
              <div style={{padding:48, textAlign:'center' as any, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, color:'var(--text3)'}}>
                <div style={{fontSize:36, marginBottom:10}}>⚙️</div>
                <div style={{fontWeight:600}}>Бүтээгдэхүүн сонгоно уу</div>
              </div>
            ) : (
              <div style={{background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden'}}>
                <div style={{display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 80px 90px', padding:'10px 20px', background:'var(--surface2)', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase' as any}}>
                  <span>Параметр</span><span>Төрөл</span><span>Сонголт / Нэгж</span><span>Заавал</span><span style={{textAlign:'right' as any}}>Үйлдэл</span>
                </div>
                {attributes.length === 0 ? (
                  <div style={{padding:40, textAlign:'center' as any, color:'var(--text3)'}}>Параметр байхгүй</div>
                ) : attributes.map(a => (
                  <div key={a.id} style={{display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 80px 90px', padding:'13px 20px', borderBottom:'1px solid var(--border)', alignItems:'center', fontSize:14}}>
                    <div>
                      <div style={{fontWeight:500}}>{a.name_mn||a.name}</div>
                      <div style={{fontSize:11, color:'var(--text3)'}}>{a.name}</div>
                    </div>
                    <span style={{background:'rgba(59,130,246,0.15)', color:'#378ADD', borderRadius:6, padding:'3px 8px', fontSize:12, fontWeight:600, width:'fit-content'}}>
                      {ATTR_TYPES.find(t=>t.value===a.type)?.label||a.type}
                    </span>
                    <span style={{fontSize:12, color:'var(--text3)'}}>
                      {Array.isArray(a.options)&&a.options.length>0 ? a.options.join(', ') : a.unit||'—'}
                    </span>
                    <span style={{fontSize:12, fontWeight:600, color:a.required?'var(--orange)':'var(--text3)'}}>
                      {a.required?'Тийм':'Үгүй'}
                    </span>
                    <div style={{display:'flex', gap:6, justifyContent:'flex-end'}}>
                      <button onClick={() => openAttrEdit(a)} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'5px 8px', cursor:'pointer', fontSize:13 }}>✏️</button>
                      <button onClick={() => deleteAttr(a)} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'5px 8px', cursor:'pointer', fontSize:13 }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {catModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:32, width:520, maxHeight:'85vh', overflowY:'auto' as any}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <h2 style={{margin:0, fontSize:18, fontWeight:700}}>{catEdit?'Ангилал засах':'Ангилал нэмэх'}</h2>
              <button onClick={() => setCatModal(false)} style={{background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:22}}>✕</button>
            </div>
            {lbl('Нэр *')}
            <input value={catForm.name} onChange={e => setCatForm(f=>({...f, name:e.target.value, slug:f.slug||slugify(e.target.value)}))} placeholder="Нэрийн хуудас" style={{...inp, marginBottom:14}} />
            {lbl('Монгол нэр')}
            <input value={catForm.name_mn} onChange={e => setCatForm(f=>({...f, name_mn:e.target.value}))} placeholder="Business Card" style={{...inp, marginBottom:14}} />
            {lbl('Slug')}
            <input value={catForm.slug} onChange={e => setCatForm(f=>({...f, slug:e.target.value}))} style={{...inp, fontFamily:'monospace', color:'var(--orange)', marginBottom:14}} />
            {lbl('Тайлбар')}
            <textarea value={catForm.description} onChange={e => setCatForm(f=>({...f, description:e.target.value}))} rows={2} style={{...inp, resize:'vertical' as any, marginBottom:14}} />
            {lbl('Эх ангилал (дэд бол)')}
            <select value={catForm.parent_id||''} onChange={e => setCatForm(f=>({...f, parent_id:e.target.value||null}))} style={{...inp, marginBottom:14}}>
              <option value="">— Үндсэн ангилал —</option>
              {categories.filter(c=>!c.parent_id&&c.id!==catEdit?.id).map(c=>(
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            {lbl('Дүрс')}
            <div style={{display:'flex', flexWrap:'wrap' as any, gap:6, marginBottom:16}}>
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setCatForm(f=>({...f, icon:ic}))}
                  style={{width:36, height:36, borderRadius:8, fontSize:18, border:catForm.icon===ic?'2px solid var(--orange)':'1px solid var(--border)', background:catForm.icon===ic?'var(--orange-12)':'var(--surface2)', cursor:'pointer'}}>
                  {ic}
                </button>
              ))}
            </div>
            {lbl('Өнгө')}
            <div style={{display:'flex', flexWrap:'wrap' as any, gap:8, marginBottom:20}}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setCatForm(f=>({...f, color:c}))}
                  style={{width:28, height:28, borderRadius:'50%', background:c, border:'none', cursor:'pointer', outline:catForm.color===c?'3px solid '+c:'none', outlineOffset:2}} />
              ))}
            </div>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:20}}>
              <button onClick={() => setCatForm(f=>({...f, is_active:!f.is_active}))}
                style={{width:44, height:24, borderRadius:12, border:'none', background:catForm.is_active?'#1D9E75':'var(--border)', cursor:'pointer', position:'relative' as any}}>
                <span style={{position:'absolute' as any, top:3, left:catForm.is_active?22:2, width:18, height:18, borderRadius:'50%', background:'#fff'}} />
              </button>
              <span style={{fontSize:14}}>Идэвхтэй</span>
            </div>
            <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
              <button onClick={() => setCatModal(false)} style={{padding:'10px 18px', background:'var(--surface2)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:8, fontWeight:600, fontSize:14, cursor:'pointer'}}>Болих</button>
              <button onClick={saveCat} disabled={catSaving} style={{padding:'10px 20px', background:catSaving?'var(--border)':'var(--orange)', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer'}}>
                {catSaving?'Хадгалж байна...':catEdit?'Хадгалах':'Нэмэх'}
              </button>
            </div>
          </div>
        </div>
      )}

      {attrModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:32, width:500, maxHeight:'85vh', overflowY:'auto' as any}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <h2 style={{margin:0, fontSize:18, fontWeight:700}}>{attrEdit?'Параметр засах':'Параметр нэмэх'}</h2>
              <button onClick={() => setAttrModal(false)} style={{background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:22}}>✕</button>
            </div>
            {lbl('Нэр *')}
            <input value={attrForm.name} onChange={e => setAttrForm(f=>({...f, name:e.target.value}))} placeholder="paper_weight" style={{...inp, marginBottom:14}} />
            {lbl('Монгол нэр')}
            <input value={attrForm.name_mn} onChange={e => setAttrForm(f=>({...f, name_mn:e.target.value}))} placeholder="Цаасны зузаан" style={{...inp, marginBottom:14}} />
            {lbl('Төрөл')}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16}}>
              {ATTR_TYPES.map(t => (
                <button key={t.value} onClick={() => setAttrForm(f=>({...f, type:t.value}))}
                  style={{padding:'9px 12px', borderRadius:8, border:attrForm.type===t.value?'2px solid var(--orange)':'1px solid var(--border)', background:attrForm.type===t.value?'var(--orange-10)':'var(--surface2)', color:attrForm.type===t.value?'var(--orange)':'var(--text)', cursor:'pointer', fontWeight:600, fontSize:13}}>
                  {t.label}
                </button>
              ))}
            </div>
            {attrForm.type === 'select' && (
              <>
                {lbl('Сонголтууд')}
                <div style={{display:'flex', gap:8, marginBottom:8}}>
                  <input value={newOption} onChange={e=>setNewOption(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addOption()} placeholder="Сонголт нэмэх (Enter)" style={{...inp, margin:0, flex:1}} />
                  <button onClick={addOption} style={{padding:'9px 14px', background:'var(--orange)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700}}>+</button>
                </div>
                <div style={{display:'flex', flexWrap:'wrap' as any, gap:6, marginBottom:16}}>
                  {attrForm.options.map((op,i) => (
                    <span key={i} style={{background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:20, padding:'4px 10px', fontSize:13, display:'flex', alignItems:'center', gap:6}}>
                      {op}
                      <button onClick={() => setAttrForm(f=>({...f, options:f.options.filter((_,j)=>j!==i)}))} style={{background:'none', border:'none', cursor:'pointer', color:'#e24b4a', fontSize:14}}>✕</button>
                    </span>
                  ))}
                </div>
              </>
            )}
            {attrForm.type === 'number' && (
              <>
                {lbl('Нэгж (мм, гр гэх мэт)')}
                <input value={attrForm.unit} onChange={e => setAttrForm(f=>({...f, unit:e.target.value}))} placeholder="мм" style={{...inp, marginBottom:14}} />
              </>
            )}
            {lbl('Үндсэн утга')}
            <input value={attrForm.default_value} onChange={e => setAttrForm(f=>({...f, default_value:e.target.value}))} style={{...inp, marginBottom:14}} />
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:20}}>
              <button onClick={() => setAttrForm(f=>({...f, required:!f.required}))}
                style={{width:44, height:24, borderRadius:12, border:'none', background:attrForm.required?'var(--orange)':'var(--border)', cursor:'pointer', position:'relative' as any}}>
                <span style={{position:'absolute' as any, top:3, left:attrForm.required?22:2, width:18, height:18, borderRadius:'50%', background:'#fff'}} />
              </button>
              <span style={{fontSize:14}}>Заавал бөглөх</span>
            </div>
            <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
              <button onClick={() => setAttrModal(false)} style={{padding:'10px 18px', background:'var(--surface2)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:8, fontWeight:600, fontSize:14, cursor:'pointer'}}>Болих</button>
              <button onClick={saveAttr} disabled={attrSaving} style={{padding:'10px 20px', background:attrSaving?'var(--border)':'var(--orange)', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer'}}>
                {attrSaving?'Хадгалж байна...':attrEdit?'Хадгалах':'Нэмэх'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}