'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'

interface Category {
  id: string
  name: string
  name_mn: string
  slug: string
  description: string
  icon: string
  color: string
  parent_id: string | null
  sort_order: number
  is_active: boolean
  children?: Category[]
}

interface ProductAttribute {
  id: string
  product_id: string
  name: string
  name_mn: string
  type: string
  options: string[] | null
  unit: string
  default_value: string
  required: boolean
  sort_order: number
}

interface Product {
  id: string
  name: string
  name_mn: string
}

type Tab = 'categories' | 'attributes'

const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

const ICONS = ['📦','🖨️','📋','🎨','📣','📷','🏷️','📰','🗂️','✉️','🎁','🔖','📐','🖼️','📌']
const COLORS = ['#FF6B00','#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#84CC16','#EF4444','#6366F1']
const ATTR_TYPES = [
  { value: 'select', label: 'Сонголт' },
  { value: 'number', label: 'Тоо' },
  { value: 'text', label: 'Текст' },
  { value: 'checkbox', label: 'Чекбокс' },
  { value: 'dimensions', label: 'Хэмжээс' },
]

const EMPTY_CAT = { name:'', name_mn:'', slug:'', description:'', icon:'📦', color:'#FF6B00', parent_id: null as string|null, sort_order:0, is_active:true }
const EMPTY_ATTR = { product_id:'', name:'', name_mn:'', type:'select', options:[] as string[], unit:'', default_value:'', required:false, sort_order:0 }

const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:14, outline:'none', boxSizing:'border-box' }

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize:12, fontWeight:600, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{children}</div>
}

function ActionBtn({ label, onClick, danger, title }: { label:string; onClick:()=>void; danger?:boolean; title?:string }) {
  return (
    <button onClick={onClick} title={title}
      style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'5px 8px', cursor:'pointer', fontSize:13, lineHeight:1 }}
      onMouseEnter={e=>(e.currentTarget.style.borderColor = danger ? '#e24b4a' : '#FF6B00')}
      onMouseLeave={e=>(e.currentTarget.style.borderColor = 'var(--border)')}>
      {label}
    </button>
  )
}

export default function AdminCategoriesPage() {
  const [tab, setTab] = useState<Tab>('categories')
  const [categories, setCategories] = useState<Category[]>([])
  const [tree, setTree] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [attributes, setAttributes] = useState<ProductAttribute[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const [catModal, setCatModal] = useState(false)
  const [catEdit, setCatEdit] = useState<Category|null>(null)
  const [catForm, setCatForm] = useState({...EMPTY_CAT})
  const [catSaving, setCatSaving] = useState(false)

  const [attrModal, setAttrModal] = useState(false)
  const [attrEdit, setAttrEdit] = useState<ProductAttribute|null>(null)
  const [attrForm, setAttrForm] = useState({...EMPTY_ATTR})
  const [attrSaving, setAttrSaving] = useState(false)
  const [newOption, setNewOption] = useState('')
  const [selProduct, setSelProduct] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [cR, tR, pR] = await Promise.all([
        apiFetch('/categories'),
        apiFetch('/categories/tree'),
        apiFetch('/products'),
      ])
      if (cR.ok) setCategories(await cR.json())
      if (tR.ok) setTree(await tR.json())
      if (pR.ok) setProducts(await pR.json())
    } catch {}
    setLoading(false)
  }

  async function fetchAttrs(pid: string) {
    try {
      const r = await apiFetch('/products/'+pid+'/attributes')
      setAttributes(r)
    } catch { setAttributes([]) }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(()=>setToast(''), 3000) }

  function openCatCreate(parentId?: string) {
    setCatEdit(null); setCatForm({...EMPTY_CAT, parent_id: parentId||null}); setCatModal(true)
  }
  function openCatEdit(c: Category) {
    setCatEdit(c)
    setCatForm({ name:c.name, name_mn:c.name_mn||'', slug:c.slug||'', description:c.description||'', icon:c.icon||'📦', color:c.color||'#FF6B00', parent_id:c.parent_id, sort_order:c.sort_order||0, is_active:c.is_active })
    setCatModal(true)
  }
  async function saveCat() {
    if (!catForm.name) return
    setCatSaving(true)
    const body = {...catForm, slug: catForm.slug || slugify(catForm.name)}
    try {
      const path = catEdit ? `/categories/${catEdit.id}` : '/categories'
      await apiFetch(path, { method: catEdit?'PATCH':'POST', body: body })
      showToast(catEdit?'Засагдлаа':'Нэмэгдлээ'); setCatModal(false); fetchAll()
    } catch { showToast('Алдаа гарлаа') }
    setCatSaving(false)
  }
  async function deleteCat(id: string) {
    if (!confirm('Устгах уу?')) return
    await apiFetch('/categories/'+id, { method:'DELETE'})
    showToast('Устгагдлаа'); fetchAll()
  }
  async function toggleActive(c: Category) {
    await apiFetch('/categories/'+c.id, { method:'PATCH', body: {is_active: !c.is_active} })
    fetchAll()
  }

  function openAttrCreate() {
    setAttrEdit(null); setAttrForm({...EMPTY_ATTR, product_id: selProduct}); setNewOption(''); setAttrModal(true)
  }
  function openAttrEdit(a: ProductAttribute) {
    setAttrEdit(a)
    setAttrForm({ product_id:a.product_id, name:a.name, name_mn:a.name_mn||'', type:a.type, options:Array.isArray(a.options)?a.options:[], unit:a.unit||'', default_value:a.default_value||'', required:a.required, sort_order:a.sort_order||0 })
    setNewOption(''); setAttrModal(true)
  }
  async function saveAttr() {
    if (!attrForm.name || !attrForm.product_id) return
    setAttrSaving(true)
    try {
      const path = attrEdit ? `/products/${attrForm.product_id}/attributes/${attrEdit.id}` : `/products/${attrForm.product_id}/attributes`
      await apiFetch(path, { method: attrEdit?'PATCH':'POST', body: attrForm })
      showToast(attrEdit?'Засагдлаа':'Нэмэгдлээ'); setAttrModal(false); fetchAttrs(selProduct)
    } catch { showToast('Алдаа гарлаа') }
    setAttrSaving(false)
  }
  async function deleteAttr(a: ProductAttribute) {
    if (!confirm('Устгах уу?')) return
    await apiFetch('/products/'+a.product_id+'/attributes/'+a.id, { method:'DELETE'})
    showToast('Устгагдлаа'); fetchAttrs(selProduct)
  }
  function addOption() {
    if (!newOption.trim()) return
    setAttrForm(f=>({...f, options:[...(f.options||[]), newOption.trim()]})); setNewOption('')
  }

  return (
    <div style={{ padding:'28px 32px', fontFamily:"'Segoe UI',system-ui,sans-serif", color:'var(--text)' }}>

      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background:'#1D9E75', color:'#fff', padding:'12px 20px', borderRadius:10, fontSize:14, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>Ангилал</h1>
          <p style={{ color:'var(--text2)', fontSize:13, margin:'4px 0 0' }}>Бүтээгдэхүүний ангилал, дэд ангилал, параметр</p>
        </div>
        {tab === 'categories' && (
          <button onClick={()=>openCatCreate()} style={{ padding:'9px 20px', background:'#FF6B00', border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            + Ангилал нэмэх
          </button>
        )}
        {tab === 'attributes' && selProduct && (
          <button onClick={openAttrCreate} style={{ padding:'9px 20px', background:'#FF6B00', border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            + Параметр нэмэх
          </button>
        )}
      </div>

      <div style={{ display:'flex', gap:4, borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {([['categories','Ангилалууд'],['attributes','Параметрүүд']] as [Tab,string][]).map(([k,lbl])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ background:'none', border:'none', padding:'10px 18px', fontSize:14, fontWeight:600, cursor:'pointer', color:tab===k?'#FF6B00':'var(--text2)', borderBottom:tab===k?'2px solid #FF6B00':'2px solid transparent', marginBottom:-1 }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ── CATEGORIES TAB ── */}
      {tab === 'categories' && (
        loading ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--text2)' }}>Уншиж байна...</div>
        ) : (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 120px', padding:'10px 20px', background:'var(--surface2)', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.07em' }}>
              <span>Нэр</span><span>Slug</span><span>Дэд ангилал</span><span>Төлөв</span><span style={{textAlign:'right'}}>Үйлдэл</span>
            </div>
            {tree.length === 0 ? (
              <div style={{ padding:48, textAlign:'center', color:'var(--text2)' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🗂️</div>
                <div style={{ fontWeight:600 }}>Ангилал байхгүй байна</div>
              </div>
            ) : tree.map(cat => (
              <div key={cat.id}>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 120px', padding:'13px 20px', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {(cat.children?.length||0) > 0 ? (
                      <button onClick={()=>setExpanded(e=>{ const n=new Set(e); n.has(cat.id)?n.delete(cat.id):n.add(cat.id); return n })}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text2)', fontSize:12, padding:0, lineHeight:1 }}>
                        {expanded.has(cat.id)?'▾':'▸'}
                      </button>
                    ) : <span style={{width:16}}/>}
                    <span style={{fontSize:18}}>{cat.icon||'📦'}</span>
                    <div>
                      <div style={{fontWeight:600, fontSize:14}}>{cat.name}</div>
                      {cat.name_mn && <div style={{fontSize:11, color:'var(--text2)'}}>{cat.name_mn}</div>}
                    </div>
                    {(cat.children?.length||0) > 0 && (
                      <span style={{ background:'rgba(255,107,0,0.15)', color:'#FF6B00', borderRadius:20, padding:'2px 8px', fontSize:11, fontWeight:600 }}>
                        {cat.children!.length}
                      </span>
                    )}
                  </div>
                  <span style={{fontFamily:'monospace', fontSize:12, color:'var(--text2)'}}>{cat.slug||'—'}</span>
                  <span style={{fontSize:13, color:'var(--text2)'}}>{cat.children?.length||0} дэд</span>
                  <button onClick={()=>toggleActive(cat)} style={{ background:cat.is_active?'rgba(29,158,117,0.15)':'var(--surface2)', color:cat.is_active?'#1D9E75':'var(--text2)', border:'1px solid', borderColor:cat.is_active?'#1D9E75':'var(--border)', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:600, cursor:'pointer', width:'fit-content' }}>
                    {cat.is_active?'Идэвхтэй':'Идэвхгүй'}
                  </button>
                  <div style={{display:'flex', gap:6, justifyContent:'flex-end'}}>
                    <ActionBtn label="➕" title="Дэд нэмэх" onClick={()=>openCatCreate(cat.id)} />
                    <ActionBtn label="✏️" onClick={()=>openCatEdit(cat)} />
                    <ActionBtn label="🗑️" danger onClick={()=>deleteCat(cat.id)} />
                  </div>
                </div>
                {expanded.has(cat.id) && cat.children?.map(child=>(
                  <div key={child.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 120px', padding:'11px 20px 11px 52px', borderBottom:'1px solid var(--border)', alignItems:'center', background:'var(--surface2)' }}>
                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                      <span style={{fontSize:16}}>{child.icon||'📦'}</span>
                      <div>
                        <div style={{fontSize:13}}>└ {child.name}</div>
                        {child.name_mn && <div style={{fontSize:11, color:'var(--text2)'}}>{child.name_mn}</div>}
                      </div>
                    </div>
                    <span style={{fontFamily:'monospace', fontSize:12, color:'var(--text2)'}}>{child.slug||'—'}</span>
                    <span style={{fontSize:13, color:'var(--text3)'}}>Дэд ангилал</span>
                    <button onClick={()=>toggleActive(child)} style={{ background:child.is_active?'rgba(29,158,117,0.15)':'var(--surface2)', color:child.is_active?'#1D9E75':'var(--text2)', border:'1px solid', borderColor:child.is_active?'#1D9E75':'var(--border)', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:600, cursor:'pointer', width:'fit-content' }}>
                      {child.is_active?'Идэвхтэй':'Идэвхгүй'}
                    </button>
                    <div style={{display:'flex', gap:6, justifyContent:'flex-end'}}>
                      <ActionBtn label="✏️" onClick={()=>openCatEdit(child)} />
                      <ActionBtn label="🗑️" danger onClick={()=>deleteCat(child.id)} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      )}

      {/* ── ATTRIBUTES TAB ── */}
      {tab === 'attributes' && (
        <div style={{display:'grid', gridTemplateColumns:'260px 1fr', gap:24}}>
          <div style={{background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', height:'fit-content'}}>
            <div style={{padding:'11px 16px', background:'var(--surface2)', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.07em'}}>
              Бүтээгдэхүүн
            </div>
            {products.length === 0 ? (
              <div style={{padding:20, color:'var(--text2)', fontSize:13, textAlign:'center'}}>Бүтээгдэхүүн байхгүй</div>
            ) : products.map(p=>(
              <button key={p.id} onClick={()=>{setSelProduct(p.id); fetchAttrs(p.id)}}
                style={{width:'100%', textAlign:'left', background:'none', border:'none', padding:'10px 16px', cursor:'pointer', fontSize:13, color:selProduct===p.id?'#FF6B00':'var(--text)', borderLeft:selProduct===p.id?'3px solid #FF6B00':'3px solid transparent', fontWeight:selProduct===p.id?600:400}}>
                {p.name_mn||p.name}
              </button>
            ))}
          </div>
          <div>
            {!selProduct ? (
              <div style={{padding:48, textAlign:'center', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, color:'var(--text2)'}}>
                <div style={{fontSize:36, marginBottom:10}}>⚙️</div>
                <div style={{fontWeight:600}}>Бүтээгдэхүүн сонгоно уу</div>
              </div>
            ) : (
              <div style={{background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden'}}>
                <div style={{display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 80px 90px', padding:'10px 20px', background:'var(--surface2)', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.07em'}}>
                  <span>Параметр</span><span>Төрөл</span><span>Сонголт / Нэгж</span><span>Заавал</span><span style={{textAlign:'right'}}>Үйлдэл</span>
                </div>
                {attributes.length === 0 ? (
                  <div style={{padding:40, textAlign:'center', color:'var(--text2)'}}>Параметр байхгүй</div>
                ) : attributes.map(a=>(
                  <div key={a.id} style={{display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 80px 90px', padding:'13px 20px', borderBottom:'1px solid var(--border)', alignItems:'center', fontSize:14}}>
                    <div>
                      <div style={{fontWeight:500}}>{a.name}</div>
                      {a.name_mn && <div style={{fontSize:11, color:'var(--text2)'}}>{a.name_mn}</div>}
                    </div>
                    <span style={{background:'rgba(59,130,246,0.15)', color:'#378ADD', borderRadius:6, padding:'3px 8px', fontSize:12, fontWeight:600, width:'fit-content'}}>
                      {ATTR_TYPES.find(t=>t.value===a.type)?.label||a.type}
                    </span>
                    <span style={{fontSize:12, color:'var(--text2)'}}>
                      {Array.isArray(a.options)&&a.options.length>0 ? a.options.join(', ') : a.unit||'—'}
                    </span>
                    <span style={{fontSize:12, fontWeight:600, color:a.required?'#FF6B00':'var(--text3)'}}>
                      {a.required?'Тийм':'Үгүй'}
                    </span>
                    <div style={{display:'flex', gap:6, justifyContent:'flex-end'}}>
                      <ActionBtn label="✏️" onClick={()=>openAttrEdit(a)} />
                      <ActionBtn label="🗑️" danger onClick={()=>deleteAttr(a)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CATEGORY MODAL ── */}
      {catModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:32, width:520, maxHeight:'85vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <h2 style={{margin:0, fontSize:18, fontWeight:700}}>{catEdit?'Ангилал засах':'Ангилал нэмэх'}</h2>
              <button onClick={()=>setCatModal(false)} style={{background:'none', border:'none', cursor:'pointer', color:'var(--text2)', fontSize:22}}>×</button>
            </div>
            <Label>Нэр *</Label>
            <input value={catForm.name} onChange={e=>setCatForm(f=>({...f, name:e.target.value, slug:f.slug||slugify(e.target.value)}))} placeholder="Нэрийн хуудас" style={{...inp, marginBottom:14}} />
            <Label>Монгол нэр</Label>
            <input value={catForm.name_mn} onChange={e=>setCatForm(f=>({...f, name_mn:e.target.value}))} placeholder="Business Card" style={{...inp, marginBottom:14}} />
            <Label>Slug</Label>
            <input value={catForm.slug} onChange={e=>setCatForm(f=>({...f, slug:e.target.value}))} style={{...inp, fontFamily:'monospace', color:'#FF6B00', marginBottom:14}} />
            <Label>Тайлбар</Label>
            <textarea value={catForm.description} onChange={e=>setCatForm(f=>({...f, description:e.target.value}))} rows={2} style={{...inp, resize:'vertical', marginBottom:14}} />
            <Label>Эх ангилал (дэд бол)</Label>
            <select value={catForm.parent_id||''} onChange={e=>setCatForm(f=>({...f, parent_id:e.target.value||null}))} style={{...inp, marginBottom:14}}>
              <option value="">— Үндсэн ангилал —</option>
              {categories.filter(c=>!c.parent_id&&c.id!==catEdit?.id).map(c=>(
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            <Label>Дүрс</Label>
            <div style={{display:'flex', flexWrap:'wrap', gap:6, marginBottom:16}}>
              {ICONS.map(ic=>(
                <button key={ic} onClick={()=>setCatForm(f=>({...f, icon:ic}))}
                  style={{width:36, height:36, borderRadius:8, fontSize:18, border:catForm.icon===ic?'2px solid #FF6B00':'1px solid var(--border)', background:catForm.icon===ic?'rgba(255,107,0,0.12)':'var(--surface2)', cursor:'pointer'}}>
                  {ic}
                </button>
              ))}
            </div>
            <Label>Өнгө</Label>
            <div style={{display:'flex', flexWrap:'wrap', gap:8, marginBottom:20}}>
              {COLORS.map(c=>(
                <button key={c} onClick={()=>setCatForm(f=>({...f, color:c}))}
                  style={{width:28, height:28, borderRadius:'50%', background:c, border:'none', cursor:'pointer', outline:catForm.color===c?'3px solid '+c:'none', outlineOffset:2}} />
              ))}
            </div>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:20}}>
              <button onClick={()=>setCatForm(f=>({...f, is_active:!f.is_active}))}
                style={{width:44, height:24, borderRadius:12, border:'none', background:catForm.is_active?'#1D9E75':'var(--border)', cursor:'pointer', position:'relative', transition:'background 0.2s'}}>
                <span style={{position:'absolute', top:3, left:catForm.is_active?22:2, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s'}} />
              </button>
              <span style={{fontSize:14}}>Идэвхтэй</span>
            </div>
            <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
              <button onClick={()=>setCatModal(false)} style={{padding:'10px 18px', background:'var(--surface2)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:8, fontWeight:600, fontSize:14, cursor:'pointer'}}>Болих</button>
              <button onClick={saveCat} disabled={catSaving} style={{padding:'10px 20px', background:catSaving?'var(--border)':'#FF6B00', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:catSaving?'not-allowed':'pointer'}}>
                {catSaving?'Хадгалж байна...':catEdit?'Хадгалах':'Нэмэх'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ATTRIBUTE MODAL ── */}
      {attrModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:32, width:500, maxHeight:'85vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <h2 style={{margin:0, fontSize:18, fontWeight:700}}>{attrEdit?'Параметр засах':'Параметр нэмэх'}</h2>
              <button onClick={()=>setAttrModal(false)} style={{background:'none', border:'none', cursor:'pointer', color:'var(--text2)', fontSize:22}}>×</button>
            </div>
            <Label>Нэр *</Label>
            <input value={attrForm.name} onChange={e=>setAttrForm(f=>({...f, name:e.target.value}))} placeholder="Цаасны зузаан" style={{...inp, marginBottom:14}} />
            <Label>Монгол нэр</Label>
            <input value={attrForm.name_mn} onChange={e=>setAttrForm(f=>({...f, name_mn:e.target.value}))} placeholder="Цаасны зузаан" style={{...inp, marginBottom:14}} />
            <Label>Төрөл</Label>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16}}>
              {ATTR_TYPES.map(t=>(
                <button key={t.value} onClick={()=>setAttrForm(f=>({...f, type:t.value}))}
                  style={{padding:'9px 12px', borderRadius:8, border:attrForm.type===t.value?'2px solid #FF6B00':'1px solid var(--border)', background:attrForm.type===t.value?'rgba(255,107,0,0.1)':'var(--surface2)', color:attrForm.type===t.value?'#FF6B00':'var(--text)', cursor:'pointer', fontWeight:600, fontSize:13}}>
                  {t.label}
                </button>
              ))}
            </div>
            {attrForm.type === 'select' && (
              <>
                <Label>Сонголтууд</Label>
                <div style={{display:'flex', gap:8, marginBottom:8}}>
                  <input value={newOption} onChange={e=>setNewOption(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addOption()} placeholder="Сонголт нэмэх (Enter)" style={{...inp, margin:0, flex:1}} />
                  <button onClick={addOption} style={{padding:'9px 14px', background:'#FF6B00', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700}}>+</button>
                </div>
                <div style={{display:'flex', flexWrap:'wrap', gap:6, marginBottom:16}}>
                  {attrForm.options.map((op,i)=>(
                    <span key={i} style={{background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:20, padding:'4px 10px', fontSize:13, display:'flex', alignItems:'center', gap:6}}>
                      {op}
                      <button onClick={()=>setAttrForm(f=>({...f, options:f.options.filter((_,j)=>j!==i)}))} style={{background:'none', border:'none', cursor:'pointer', color:'#e24b4a', fontSize:14, lineHeight:1}}>×</button>
                    </span>
                  ))}
                </div>
              </>
            )}
            {attrForm.type === 'number' && (
              <>
                <Label>Нэгж (мм, гр гэх мэт)</Label>
                <input value={attrForm.unit} onChange={e=>setAttrForm(f=>({...f, unit:e.target.value}))} placeholder="мм" style={{...inp, marginBottom:14}} />
              </>
            )}
            <Label>Үндсэн утга</Label>
            <input value={attrForm.default_value} onChange={e=>setAttrForm(f=>({...f, default_value:e.target.value}))} placeholder="Үндсэн утга" style={{...inp, marginBottom:14}} />
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:20}}>
              <button onClick={()=>setAttrForm(f=>({...f, required:!f.required}))}
                style={{width:44, height:24, borderRadius:12, border:'none', background:attrForm.required?'#FF6B00':'var(--border)', cursor:'pointer', position:'relative', transition:'background 0.2s'}}>
                <span style={{position:'absolute', top:3, left:attrForm.required?22:2, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s'}} />
              </button>
              <span style={{fontSize:14}}>Заавал бөглөх</span>
            </div>
            <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
              <button onClick={()=>setAttrModal(false)} style={{padding:'10px 18px', background:'var(--surface2)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:8, fontWeight:600, fontSize:14, cursor:'pointer'}}>Болих</button>
              <button onClick={saveAttr} disabled={attrSaving} style={{padding:'10px 20px', background:attrSaving?'var(--border)':'#FF6B00', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:attrSaving?'not-allowed':'pointer'}}>
                {attrSaving?'Хадгалж байна...':attrEdit?'Хадгалах':'Нэмэх'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
