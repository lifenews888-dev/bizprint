'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API = 'http://localhost:4000'
const F = "'Segoe UI',system-ui,sans-serif"

interface Product { id:string; name:string; name_mn:string; category:string; base_price:number; min_quantity:number; is_active:boolean; lead_time_days:number; slug:string; description:string; product_type:string; sale_price:number; stock_quantity:number; sku:string }
interface Category { id:string; name:string; name_mn:string; slug:string }
interface Attribute { id:string; product_id:string; name:string; name_mn:string; type:string; options:any; unit:string; required:boolean; sort_order:number }
interface ProductImage { id:string; url:string; alt:string; sort_order:number; is_primary:boolean }

function authH() {
  const t = localStorage.getItem('access_token')
  return { Authorization: 'Bearer ' + t }
}
function authJH() {
  const t = localStorage.getItem('access_token')
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(false)
  const [modalTab, setModalTab] = useState<'info'|'images'|'attrs'>('info')
  const [editing, setEditing] = useState<Product|null>(null)
  const [form, setForm] = useState({ name:'', name_mn:'', slug:'', category:'', description:'', base_price:0, min_quantity:100, lead_time_days:3, is_active:true, product_type:'print', sale_price:0, stock_quantity:0, sku:'' })
  const [images, setImages] = useState<ProductImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [editingAttr, setEditingAttr] = useState<Attribute|null>(null)
  const [attrForm, setAttrForm] = useState({ name:'', name_mn:'', type:'select', options:'', unit:'', required:false, sort_order:0 })

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/login'); return }
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const [p, c] = await Promise.all([
      fetch(`${API}/products`, { headers: authH() }).then(r => r.json()),
      fetch(`${API}/categories`, { headers: authH() }).then(r => r.json()),
    ])
    setProducts(Array.isArray(p) ? p : [])
    setCategories(Array.isArray(c) ? c : [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm({ name:'', name_mn:'', slug:'', category:'', description:'', base_price:0, min_quantity:100, lead_time_days:3, is_active:true, product_type:'print', sale_price:0, stock_quantity:0, sku:'' })
    setImages([]); setAttributes([])
    setModalTab('info'); setModal(true)
  }

  async function openEdit(p: Product) {
    setEditing(p)
    setForm({ name:p.name, name_mn:p.name_mn, slug:p.slug, category:p.category, description:p.description||'', base_price:p.base_price, min_quantity:p.min_quantity, lead_time_days:p.lead_time_days, is_active:p.is_active, product_type:p.product_type||'print', sale_price:p.sale_price||0, stock_quantity:p.stock_quantity||0, sku:p.sku||'' })
    setModalTab('info'); setModal(true)
    const [imgs, attrs] = await Promise.all([
      fetch(`${API}/product-images?product_id=${p.id}`, { headers: authH() }).then(r => r.json()),
      fetch(`${API}/product-attributes?product_id=${p.id}`, { headers: authH() }).then(r => r.json()),
    ])
    setImages(Array.isArray(imgs) ? imgs : [])
    setAttributes(Array.isArray(attrs) ? attrs : [])
  }

  async function save() {
    const body = { ...form, base_price: Number(form.base_price), min_quantity: Number(form.min_quantity), lead_time_days: Number(form.lead_time_days), sale_price: Number(form.sale_price), stock_quantity: Number(form.stock_quantity) }
    if (editing) {
      await fetch(`${API}/products/${editing.id}`, { method:'PATCH', headers: authJH(), body: JSON.stringify(body) })
    } else {
      await fetch(`${API}/products`, { method:'POST', headers: authJH(), body: JSON.stringify(body) })
    }
    setModal(false); loadAll()
  }

  async function remove(id: string) {
    if (!confirm('Устгах уу?')) return
    await fetch(`${API}/products/${id}`, { method:'DELETE', headers: authH() })
    loadAll()
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    if (!editing || !e.target.files?.length) return
    setUploading(true)
    const fd = new FormData()
    Array.from(e.target.files).forEach(f => fd.append('files', f))
    fd.append('product_id', editing.id)
    await fetch(`${API}/product-images/upload`, { method:'POST', headers: authH(), body: fd })
    const imgs = await fetch(`${API}/product-images?product_id=${editing.id}`, { headers: authH() }).then(r => r.json())
    setImages(Array.isArray(imgs) ? imgs : [])
    setUploading(false)
  }

  async function deleteImage(id: string) {
    await fetch(`${API}/product-images/${id}`, { method:'DELETE', headers: authH() })
    if (editing) {
      const imgs = await fetch(`${API}/product-images?product_id=${editing.id}`, { headers: authH() }).then(r => r.json())
      setImages(Array.isArray(imgs) ? imgs : [])
    }
  }

  async function saveAttr() {
    if (!editing) return
    const body = { ...attrForm, product_id: editing.id, options: attrForm.options ? attrForm.options.split(',').map((s:string) => s.trim()) : [], sort_order: Number(attrForm.sort_order) }
    if (editingAttr) {
      await fetch(`${API}/product-attributes/${editingAttr.id}`, { method:'PATCH', headers: authJH(), body: JSON.stringify(body) })
    } else {
      await fetch(`${API}/product-attributes`, { method:'POST', headers: authJH(), body: JSON.stringify(body) })
    }
    setEditingAttr(null)
    setAttrForm({ name:'', name_mn:'', type:'select', options:'', unit:'', required:false, sort_order:0 })
    const attrs = await fetch(`${API}/product-attributes?product_id=${editing.id}`, { headers: authH() }).then(r => r.json())
    setAttributes(Array.isArray(attrs) ? attrs : [])
  }

  async function deleteAttr(id: string) {
    await fetch(`${API}/product-attributes/${id}`, { method:'DELETE', headers: authH() })
    if (editing) {
      const attrs = await fetch(`${API}/product-attributes?product_id=${editing.id}`, { headers: authH() }).then(r => r.json())
      setAttributes(Array.isArray(attrs) ? attrs : [])
    }
  }

  const filtered = products.filter(p => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase()) || p.name_mn.toLowerCase().includes(search.toLowerCase())
    const mc = filter === 'all' || p.category === filter || (filter === 'print' && p.product_type === 'print') || (filter === 'ready' && p.product_type === 'ready')
    return ms && mc
  })

  const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' }

  return (
    <div style={{ padding:'28px 32px', fontFamily:F, color:'var(--text)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, paddingBottom:20, borderBottom:'1px solid var(--border)' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:600, margin:0 }}>Бүтээгдэхүүн</h1>
          <p style={{ fontSize:13, color:'var(--text3)', margin:'5px 0 0' }}>Нийт {products.length} бүтээгдэхүүн</p>
        </div>
        <button onClick={openNew} style={{ background:'var(--orange)', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:500, cursor:'pointer' }}>+ Бүтээгдэхүүн нэмэх</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { label:'Нийт', value:products.length, color:'var(--orange)' },
          { label:'Идэвхтэй', value:products.filter(p=>p.is_active).length, color:'#1D9E75' },
          { label:'Хэвлэмэл', value:products.filter(p=>p.product_type==='print'||!p.product_type).length, color:'#378ADD' },
          { label:'Бэлэн бараа', value:products.filter(p=>p.product_type==='ready').length, color:'#8B5CF6' },
        ].map(c => (
          <div key={c.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:16, borderLeft:'3px solid '+c.color }}>
            <div style={{ fontSize:24, fontWeight:600, color:c.color }}>{c.value}</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Хайх..."
          style={{ ...inp, width:240 }} />
        <div style={{ display:'flex', gap:6 }}>
          {[
            { k:'all', l:'Бүгд' },
            { k:'print', l:'🖨️ Хэвлэмэл' },
            { k:'ready', l:'📦 Бэлэн бараа' },
            ...categories.slice(0,5).map(c => ({ k:c.slug, l:c.name_mn||c.name }))
          ].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              style={{ padding:'6px 14px', borderRadius:7, border:'1px solid', fontSize:12, cursor:'pointer', background:filter===f.k?'var(--orange)':'transparent', color:filter===f.k?'#fff':'var(--text3)', borderColor:filter===f.k?'var(--orange)':'var(--border)' }}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 0.5fr 0.8fr', padding:'10px 20px', borderBottom:'1px solid var(--border)', gap:12 }}>
          {['Нэр', 'Ангилал', 'Төрөл', 'Үнэ', 'Мин тоо', 'Идэвх', 'Үйлдэл'].map(h => (
            <div key={h} style={{ fontSize:11, color:'var(--text4)', textTransform:'uppercase', fontWeight:500 }}>{h}</div>
          ))}
        </div>
        {loading ? <div style={{ padding:48, textAlign:'center', color:'var(--text4)' }}>Уншиж байна...</div>
          : filtered.map((p, i) => (
            <div key={p.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 0.5fr 0.8fr', padding:'12px 20px', borderBottom:i<filtered.length-1?'1px solid var(--border)':'none', gap:12, alignItems:'center' }}
              onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
              onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
              <div>
                <div style={{ fontSize:13, fontWeight:500 }}>{p.name_mn||p.name}</div>
                <div style={{ fontSize:11, color:'var(--text4)' }}>{p.slug}</div>
              </div>
              <div style={{ fontSize:12, color:'var(--text3)' }}>{p.category}</div>
              <div>
                <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:p.product_type==='ready'?'rgba(139,92,246,0.1)':'rgba(55,138,221,0.1)', color:p.product_type==='ready'?'#8B5CF6':'#378ADD', fontWeight:600 }}>
                  {p.product_type==='ready'?'📦 Бэлэн':'🖨️ Хэвлэмэл'}
                </span>
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--orange)' }}>{Number(p.product_type==='ready'?p.sale_price||p.base_price:p.base_price).toLocaleString()}₮</div>
              <div style={{ fontSize:12 }}>{p.min_quantity} ш</div>
              <div style={{ width:10, height:10, borderRadius:'50%', background:p.is_active?'#1D9E75':'#e24b4a', margin:'0 auto' }} />
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={()=>openEdit(p)} style={{ fontSize:11, padding:'4px 8px', borderRadius:6, border:'1px solid #378ADD', background:'transparent', color:'#378ADD', cursor:'pointer' }}>Засах</button>
                <button onClick={()=>remove(p.id)} style={{ fontSize:11, padding:'4px 8px', borderRadius:6, border:'1px solid #e24b4a', background:'transparent', color:'#e24b4a', cursor:'pointer' }}>Устгах</button>
              </div>
            </div>
          ))}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--surface)', borderRadius:16, padding:32, width:640, maxHeight:'92vh', overflowY:'auto', border:'1px solid var(--border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:18, fontWeight:600 }}>{editing?'Бүтээгдэхүүн засах':'Шинэ бүтээгдэхүүн'}</h2>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--text3)' }}>✕</button>
            </div>

            <div style={{ display:'flex', gap:8, marginBottom:20, borderBottom:'1px solid var(--border)', paddingBottom:12 }}>
              {['info','images','attrs'].map((t,i) => (
                <button key={t} onClick={()=>setModalTab(t as any)}
                  style={{ padding:'7px 16px', borderRadius:8, border:modalTab===t?'2px solid var(--orange)':'1px solid var(--border)', background:modalTab===t?'var(--orange-06)':'transparent', color:modalTab===t?'var(--orange)':'var(--text3)', cursor:'pointer', fontSize:13 }}>
                  {['Мэдээлэл','Зурагнууд ('+(images.length)+'/10)','Параметрүүд ('+(attributes.length)+')'][i]}
                </button>
              ))}
            </div>

            {modalTab==='info' && (
              <div>
                {/* Бүтээгдэхүүний төрөл */}
                <div style={{ marginBottom:20 }}>
                  <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:8, fontWeight:600, textTransform:'uppercase' as any }}>Бүтээгдэхүүний төрөл</label>
                  <div style={{ display:'flex', gap:10 }}>
                    {[
                      { k:'print', l:'🖨️ Хэвлэмэл', d:'Үнэ параметрээс хамаарна' },
                      { k:'ready', l:'📦 Бэлэн бараа', d:'Тогтмол үнэтэй' },
                    ].map(t => (
                      <button key={t.k} type="button" onClick={()=>setForm({...form, product_type:t.k})}
                        style={{ flex:1, padding:'12px', borderRadius:10, border:form.product_type===t.k?'2px solid var(--orange)':'1px solid var(--border)', background:form.product_type===t.k?'var(--orange-06)':'var(--surface2)', cursor:'pointer', textAlign:'left' as any }}>
                        <div style={{ fontSize:14, fontWeight:600, color:form.product_type===t.k?'var(--orange)':'var(--text)' }}>{t.l}</div>
                        <div style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>{t.d}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                  <div>
                    <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Нэр (MN)</label>
                    <input value={form.name_mn} onChange={e=>setForm({...form, name_mn:e.target.value})} style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Нэр (EN)</label>
                    <input value={form.name} onChange={e=>setForm({...form, name:e.target.value, slug:e.target.value.toLowerCase().replace(/\s+/g,'-')})} style={inp} />
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                  <div>
                    <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Slug</label>
                    <input value={form.slug} onChange={e=>setForm({...form, slug:e.target.value})} style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Ангилал</label>
                    <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} style={inp}>
                      <option value="">-- Сонгох --</option>
                      {categories.map(c => <option key={c.id} value={c.slug}>{c.name_mn||c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                  <div>
                    <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Үндсэн үнэ (₮)</label>
                    <input type="number" value={form.base_price} onChange={e=>setForm({...form, base_price:Number(e.target.value)})} style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Хамгийн бага тоо</label>
                    <input type="number" value={form.min_quantity} onChange={e=>setForm({...form, min_quantity:Number(e.target.value)})} style={inp} />
                  </div>
                </div>

                {form.product_type==='ready' && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
                    <div>
                      <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Борлуулах үнэ (₮)</label>
                      <input type="number" value={form.sale_price} onChange={e=>setForm({...form, sale_price:Number(e.target.value)})} style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Нөөц (ш)</label>
                      <input type="number" value={form.stock_quantity} onChange={e=>setForm({...form, stock_quantity:Number(e.target.value)})} style={inp} />
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>SKU код</label>
                      <input value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} placeholder="BP-001" style={inp} />
                    </div>
                  </div>
                )}

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                  <div>
                    <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Хугацаа (өдөр)</label>
                    <input type="number" value={form.lead_time_days} onChange={e=>setForm({...form, lead_time_days:Number(e.target.value)})} style={inp} />
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:20 }}>
                    <input type="checkbox" id="active" checked={form.is_active} onChange={e=>setForm({...form, is_active:e.target.checked})} />
                    <label htmlFor="active" style={{ fontSize:13 }}>Идэвхтэй байх</label>
                  </div>
                </div>

                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Тайлбар</label>
                  <textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} rows={3} style={{ ...inp, resize:'vertical' as any }} />
                </div>
              </div>
            )}

            {modalTab==='images' && (
              <div>
                {!editing ? <div style={{ padding:32, textAlign:'center', color:'var(--text3)' }}>Эхлээд мэдээллийг хадгална уу</div> : (
                  <>
                    <label style={{ display:'block', padding:'16px', border:'2px dashed var(--border)', borderRadius:10, textAlign:'center', cursor:'pointer', marginBottom:16, fontSize:13, color:'var(--text3)' }}>
                      {uploading ? 'Байршуулж байна...' : '+ Зураг нэмэх (хүртэл 10)'}
                      <input type="file" accept="image/*" multiple onChange={uploadImage} style={{ display:'none' }} disabled={uploading||images.length>=10} />
                    </label>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                      {images.map(img => (
                        <div key={img.id} style={{ position:'relative', borderRadius:8, overflow:'hidden', border:'1px solid var(--border)' }}>
                          <img src={img.url.startsWith('http')?img.url:`http://localhost:4000/uploads/${img.url}`} alt={img.alt} style={{ width:'100%', height:120, objectFit:'cover' }} />
                          <button onClick={()=>deleteImage(img.id)} style={{ position:'absolute', top:6, right:6, background:'rgba(226,75,74,0.9)', color:'#fff', border:'none', borderRadius:4, width:24, height:24, cursor:'pointer', fontSize:14 }}>✕</button>
                          {img.is_primary && <div style={{ position:'absolute', bottom:6, left:6, background:'var(--orange)', color:'#fff', fontSize:10, padding:'2px 6px', borderRadius:4 }}>Үндсэн</div>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {modalTab==='attrs' && (
              <div>
                {!editing ? <div style={{ padding:32, textAlign:'center', color:'var(--text3)' }}>Эхлээд мэдээллийг хадгална уу</div> : (
                  <>
                    <div style={{ background:'var(--surface2)', borderRadius:10, padding:16, marginBottom:16 }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
                        <div>
                          <label style={{ fontSize:11, color:'var(--text3)', display:'block', marginBottom:4 }}>Нэр (EN)</label>
                          <input value={attrForm.name} onChange={e=>setAttrForm({...attrForm, name:e.target.value})} style={inp} />
                        </div>
                        <div>
                          <label style={{ fontSize:11, color:'var(--text3)', display:'block', marginBottom:4 }}>Нэр (MN)</label>
                          <input value={attrForm.name_mn} onChange={e=>setAttrForm({...attrForm, name_mn:e.target.value})} style={inp} />
                        </div>
                        <div>
                          <label style={{ fontSize:11, color:'var(--text3)', display:'block', marginBottom:4 }}>Төрөл</label>
                          <select value={attrForm.type} onChange={e=>setAttrForm({...attrForm, type:e.target.value})} style={inp}>
                            <option value="select">Сонголт</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="number">Тоо</option>
                            <option value="text">Текст</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ marginBottom:10 }}>
                        <label style={{ fontSize:11, color:'var(--text3)', display:'block', marginBottom:4 }}>Сонголтууд (таслалаар)</label>
                        <input value={attrForm.options} onChange={e=>setAttrForm({...attrForm, options:e.target.value})} placeholder="Улаан, Хөх, Ногоон" style={inp} />
                      </div>
                      <button onClick={saveAttr} style={{ padding:'8px 20px', background:'var(--orange)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13 }}>
                        {editingAttr?'Хадгалах':'Нэмэх'}
                      </button>
                    </div>
                    {attributes.map(a => (
                      <div key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'var(--surface2)', borderRadius:8, marginBottom:8 }}>
                        <div>
                          <span style={{ fontSize:13, fontWeight:500 }}>{a.name_mn||a.name}</span>
                          <span style={{ fontSize:11, color:'var(--text3)', marginLeft:8 }}>{a.type}</span>
                          {Array.isArray(a.options)&&a.options.length>0&&<span style={{ fontSize:11, color:'var(--text3)', marginLeft:8 }}>{a.options.join(', ')}</span>}
                        </div>
                        <button onClick={()=>deleteAttr(a.id)} style={{ fontSize:11, padding:'3px 8px', borderRadius:6, border:'1px solid #e24b4a', background:'transparent', color:'#e24b4a', cursor:'pointer' }}>Устгах</button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:24 }}>
              <button onClick={()=>setModal(false)} style={{ padding:'9px 20px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text)', cursor:'pointer', fontSize:13 }}>Цуцлах</button>
              <button onClick={save} style={{ padding:'9px 20px', borderRadius:8, border:'none', background:'var(--orange)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:500 }}>Хадгалах</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}