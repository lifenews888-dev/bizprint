'use client'
import ProductionTab from './components/ProductionTab'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const F = "'Segoe UI',system-ui,sans-serif"
const authH = () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('access_token')||'') })

const STAGES = [
  { k:'orders',         icon:'📋', label:'Захиалгууд',     color:'var(--orange)' },
  { k:'design',         icon:'🎨', label:'Эх бэлтгэл',     color:'#8B5CF6' },
  { k:'production',     icon:'🏭', label:'Хэвлэл',         color:'#3B82F6' },
  { k:'delivery',       icon:'🚚', label:'Хүргэлт',        color:'#10B981' },
]

const ORDER_STATUS_COLOR: Record<string,string> = {
  pending:'#F59E0B', paid:'#10B981', in_production:'#3B82F6',
  completed:'#10B981', shipped:'#8B5CF6', delivered:'#10B981', cancelled:'#EF4444'
}
const DESIGN_STATUS_COLOR: Record<string,string> = {
  pending:'#F59E0B', assigned:'#3B82F6', in_progress:'#8B5CF6',
  review:'var(--orange)', approved:'#10B981', rejected:'#EF4444'
}
const DELIVERY_STATUS_COLOR: Record<string,string> = {
  pending:'#F59E0B', assigned:'#3B82F6', picked_up:'#8B5CF6',
  on_way:'var(--orange)', delivered:'#10B981', failed:'#EF4444'
}

export default function AdminWorkflowPage() {
  const [stage, setStage] = useState('orders')
  const [orders, setOrders] = useState<any[]>([])
  const [designs, setDesigns] = useState<any[]>([])
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [designers, setDesigners] = useState<any[]>([])
  const [couriers, setCouriers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [modal, setModal] = useState('')
  const [form, setForm] = useState<any>({})
  const [msg, setMsg] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [o, d, del, users] = await Promise.all([
      fetch(API+'/orders', { headers: authH() }).then(r=>r.json()).catch(()=>[]),
      fetch(API+'/design-requests', { headers: authH() }).then(r=>r.json()).catch(()=>[]),
      fetch(API+'/delivery', { headers: authH() }).then(r=>r.json()).catch(()=>[]),
      fetch(API+'/admin/users', { headers: authH() }).then(r=>r.json()).catch(()=>[]),
    ])
    setOrders(Array.isArray(o) ? o : [])
    setDesigns(Array.isArray(d) ? d : [])
    setDeliveries(Array.isArray(del) ? del : [])
    if (Array.isArray(users)) {
      setDesigners(users.filter((u:any) => u.role === 'designer'))
      setCouriers(users.filter((u:any) => u.role === 'courier'))
    }
    setLoading(false)
  }

  async function createDesignRequest(order: any) {
    await fetch(API+'/design-requests', {
      method: 'POST', headers: authH(),
      body: JSON.stringify({
        order_id: order.id, customer_id: order.customer_id,
        customer_name: order.customer_name, customer_email: order.customer_email,
        customer_phone: order.customer_phone, product_name: order.product_name,
        requirements: order.notes || '',
      })
    })
    await fetch(API+'/orders/'+order.id+'/status', { method:'PATCH', headers: authH(), body: JSON.stringify({ status:'in_design' }) })
    showMsg('✅ Эх бэлтгэлийн хүсэлт үүслээ')
    loadAll()
  }

  async function assignDesigner(designId: string) {
    if (!form.designer_id) { showMsg('Дизайнер сонгоно уу'); return }
    const d = designers.find(d => d.id === form.designer_id)
    await fetch(API+'/design-requests/'+designId+'/assign', {
      method: 'PATCH', headers: authH(),
      body: JSON.stringify({ designer_id: form.designer_id, designer_name: d?.name||d?.email, designer_phone: d?.phone, designer_zoom: form.designer_zoom })
    })
    showMsg('✅ Дизайнер томилогдлоо')
    setModal(''); loadAll()
  }

  async function approveDesign(designId: string, orderId: string) {
    await fetch(API+'/design-requests/'+designId+'/approve', { method:'PATCH', headers: authH() })
    await fetch(API+'/orders/'+orderId+'/status', { method:'PATCH', headers: authH(), body: JSON.stringify({ status:'in_production' }) })
    showMsg('✅ Эх батлагдлаа — хэвлэлд орлоо')
    loadAll()
  }

  async function rejectDesign(designId: string) {
    if (!form.reason) { showMsg('Шалтгаан оруулна уу'); return }
    await fetch(API+'/design-requests/'+designId+'/reject', { method:'PATCH', headers: authH(), body: JSON.stringify({ reason: form.reason }) })
    showMsg('Эх татгалзагдлаа')
    setModal(''); loadAll()
  }

  async function createDelivery(order: any) {
    await fetch(API+'/delivery', {
      method: 'POST', headers: authH(),
      body: JSON.stringify({
        order_id: order.id, customer_name: order.customer_name,
        customer_phone: order.customer_phone, delivery_address: form.address || '',
        district: form.district || '', delivery_fee: Number(form.fee || 5000),
        notes: form.notes || '',
      })
    })
    await fetch(API+'/orders/'+order.id+'/status', { method:'PATCH', headers: authH(), body: JSON.stringify({ status:'shipped' }) })
    showMsg('✅ Хүргэлт үүслээ')
    setModal(''); loadAll()
  }

  async function assignCourier(deliveryId: string) {
    if (!form.courier_id) { showMsg('Жолооч сонгоно уу'); return }
    const c = couriers.find(c => c.id === form.courier_id)
    await fetch(API+'/delivery/'+deliveryId+'/assign', {
      method: 'PATCH', headers: authH(),
      body: JSON.stringify({ courier_id: form.courier_id, courier_name: c?.name||c?.email, courier_phone: c?.phone })
    })
    showMsg('✅ Жолооч томилогдлоо')
    setModal(''); loadAll()
  }

  async function updateDeliveryStatus(deliveryId: string, status: string) {
    await fetch(API+'/delivery/'+deliveryId+'/status', { method:'PATCH', headers: authH(), body: JSON.stringify({ status }) })
    if (status === 'delivered') {
      const del = deliveries.find(d => d.id === deliveryId)
      if (del) await fetch(API+'/orders/'+del.order_id+'/status', { method:'PATCH', headers: authH(), body: JSON.stringify({ status:'delivered' }) })
    }
    showMsg('✅ Статус шинэчлэгдлээ')
    loadAll()
  }

  function showMsg(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000) }
  const fmt = (n: number) => Number(n).toLocaleString('mn-MN')

  const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' }

  return (
    <div style={{ padding:'28px 32px', fontFamily:F, color:'var(--text)' }}>
      {msg && <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background:'#1D9E75', color:'#fff', padding:'12px 20px', borderRadius:10, fontSize:14, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>{msg}</div>}

      <div style={{ marginBottom:24, paddingBottom:20, borderBottom:'1px solid var(--border)' }}>
        <h1 style={{ fontSize:22, fontWeight:600, margin:0 }}>Захиалгын workflow</h1>
        <p style={{ fontSize:13, color:'var(--text3)', margin:'5px 0 0' }}>Захиалга → Дизайн → Хэвлэл → Хүргэлт</p>
      </div>

      {/* Pipeline stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
        {STAGES.map(s => (
          <button key={s.k} onClick={() => setStage(s.k)}
            style={{ background:'var(--surface)', border:stage===s.k?'2px solid '+s.color:'1px solid var(--border)', borderRadius:12, padding:'16px 20px', textAlign:'left' as any, cursor:'pointer', borderLeft:'3px solid '+s.color }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:20, fontWeight:700, color:s.color }}>
              {s.k==='orders'?orders.length:s.k==='design'?designs.length:s.k==='delivery'?deliveries.length:0}
            </div>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* ORDERS */}
      {stage === 'orders' && (
        <div>
          <h2 style={{ fontSize:16, fontWeight:600, margin:'0 0 16px' }}>📋 Захиалгууд</h2>
          {loading ? <div style={{ padding:40, textAlign:'center' as any, color:'var(--text3)' }}>Уншиж байна...</div>
          : orders.length === 0 ? (
            <div style={{ padding:48, textAlign:'center' as any, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, color:'var(--text3)' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>📋</div>
              <div style={{ fontWeight:600 }}>Захиалга байхгүй байна</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column' as any, gap:10 }}>
              {orders.map(o => (
                <div key={o.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:16, alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginBottom:2 }}>Захиалга</div>
                      <div style={{ fontSize:14, fontWeight:600 }}>{o.product_name||'Хэвлэл'}</div>
                      <div style={{ fontSize:12, color:'var(--text3)' }}>{o.quantity} ш</div>
                    </div>
                    <div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginBottom:2 }}>Хэрэглэгч</div>
                      <div style={{ fontSize:13, fontWeight:500 }}>{o.customer_name||'—'}</div>
                      <div style={{ fontSize:12, color:'var(--text3)' }}>{o.customer_phone||o.customer_email||'—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginBottom:2 }}>Дүн</div>
                      <div style={{ fontSize:16, fontWeight:700, color:'var(--orange)' }}>{fmt(o.total_price)}₮</div>
                    </div>
                    <div>
                      <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background:(ORDER_STATUS_COLOR[o.status]||'#888')+'20', color:ORDER_STATUS_COLOR[o.status]||'#888' }}>
                        {o.status}
                      </span>
                      <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{new Date(o.created_at).toLocaleDateString('mn-MN')}</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column' as any, gap:6 }}>
                      {o.status === 'pending' && (
                        <button onClick={() => createDesignRequest(o)}
                          style={{ padding:'7px 12px', borderRadius:7, border:'1px solid #8B5CF6', background:'rgba(139,92,246,0.06)', color:'#8B5CF6', cursor:'pointer', fontSize:12, fontWeight:600, whiteSpace:'nowrap' as any }}>
                          🎨 Дизайнд явуулах
                        </button>
                      )}
                      {o.status === 'in_production' && (
                        <button onClick={() => { setSelected(o); setForm({}); setModal('delivery') }}
                          style={{ padding:'7px 12px', borderRadius:7, border:'1px solid #10B981', background:'rgba(16,185,129,0.06)', color:'#10B981', cursor:'pointer', fontSize:12, fontWeight:600, whiteSpace:'nowrap' as any }}>
                          🚚 Хүргэлт үүсгэх
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DESIGN */}
      {stage === 'design' && (
        <div>
          <h2 style={{ fontSize:16, fontWeight:600, margin:'0 0 16px' }}>🎨 Эх бэлтгэлийн хүсэлтүүд</h2>
          {designs.length === 0 ? (
            <div style={{ padding:48, textAlign:'center' as any, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, color:'var(--text3)' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🎨</div>
              <div style={{ fontWeight:600 }}>Эх бэлтгэлийн хүсэлт байхгүй</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column' as any, gap:10 }}>
              {designs.map(d => (
                <div key={d.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:16, alignItems:'start' }}>
                    <div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginBottom:2 }}>Бүтээгдэхүүн</div>
                      <div style={{ fontSize:14, fontWeight:600 }}>{d.product_name||'—'}</div>
                      <div style={{ fontSize:12, color:'var(--text3)' }}>{d.requirements||''}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginBottom:2 }}>Хэрэглэгч</div>
                      <div style={{ fontSize:13, fontWeight:500 }}>{d.customer_name||'—'}</div>
                      <div style={{ fontSize:12, color:'var(--text3)' }}>{d.customer_phone||'—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginBottom:2 }}>Дизайнер</div>
                      {d.designer_name ? (
                        <>
                          <div style={{ fontSize:13, fontWeight:500 }}>{d.designer_name}</div>
                          {d.designer_phone && <div style={{ fontSize:12, color:'var(--text3)' }}>📞 {d.designer_phone}</div>}
                          {d.designer_zoom && <a href={d.designer_zoom} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'#3B82F6' }}>🔗 Zoom холбоо</a>}
                        </>
                      ) : <div style={{ fontSize:12, color:'#F59E0B' }}>Томилогдоогүй</div>}
                    </div>
                    <div>
                      <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background:(DESIGN_STATUS_COLOR[d.status]||'#888')+'20', color:DESIGN_STATUS_COLOR[d.status]||'#888' }}>
                        {d.status==='pending'?'Хүлээгдэж байна':d.status==='assigned'?'Томилогдсон':d.status==='in_progress'?'Хийгдэж байна':d.status==='review'?'Шалгалтанд':d.status==='approved'?'Батлагдсан':'Татгалзсан'}
                      </span>
                      {d.file_url && <div style={{ marginTop:6 }}><a href={d.file_url.startsWith('http')?d.file_url:`${API}/uploads/${d.file_url}`} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'#3B82F6' }}>📎 Файл харах</a></div>}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column' as any, gap:6 }}>
                      {d.status === 'pending' && (
                        <button onClick={() => { setSelected(d); setForm({}); setModal('assign_designer') }}
                          style={{ padding:'7px 12px', borderRadius:7, border:'1px solid #8B5CF6', background:'rgba(139,92,246,0.06)', color:'#8B5CF6', cursor:'pointer', fontSize:12, fontWeight:600, whiteSpace:'nowrap' as any }}>
                          👤 Дизайнер томилох
                        </button>
                      )}
                      {d.status === 'review' && (
                        <>
                          <button onClick={() => approveDesign(d.id, d.order_id)}
                            style={{ padding:'7px 12px', borderRadius:7, border:'1px solid #10B981', background:'rgba(16,185,129,0.06)', color:'#10B981', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                            ✓ Батлах
                          </button>
                          <button onClick={() => { setSelected(d); setForm({}); setModal('reject_design') }}
                            style={{ padding:'7px 12px', borderRadius:7, border:'1px solid #EF4444', background:'rgba(239,68,68,0.06)', color:'#EF4444', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                            ✕ Татгалзах
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DELIVERY */}
      {stage === 'delivery' && (
        <div>
          <h2 style={{ fontSize:16, fontWeight:600, margin:'0 0 16px' }}>🚚 Хүргэлтүүд</h2>
          {deliveries.length === 0 ? (
            <div style={{ padding:48, textAlign:'center' as any, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, color:'var(--text3)' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🚚</div>
              <div style={{ fontWeight:600 }}>Хүргэлт байхгүй байна</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column' as any, gap:10 }}>
              {deliveries.map(d => (
                <div key={d.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:16, alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginBottom:2 }}>Tracking</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--orange)', fontFamily:'monospace' }}>{d.tracking_code||'—'}</div>
                      <div style={{ fontSize:12, color:'var(--text3)' }}>{fmt(d.delivery_fee)}₮</div>
                    </div>
                    <div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginBottom:2 }}>Хэрэглэгч</div>
                      <div style={{ fontSize:13, fontWeight:500 }}>{d.customer_name||'—'}</div>
                      <div style={{ fontSize:12, color:'var(--text3)' }}>{d.customer_phone||'—'}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{d.delivery_address||'—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginBottom:2 }}>Жолооч</div>
                      {d.courier_name ? (
                        <>
                          <div style={{ fontSize:13, fontWeight:500 }}>{d.courier_name}</div>
                          <div style={{ fontSize:12, color:'var(--text3)' }}>📞 {d.courier_phone||'—'}</div>
                        </>
                      ) : <div style={{ fontSize:12, color:'#F59E0B' }}>Томилогдоогүй</div>}
                    </div>
                    <div>
                      <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background:(DELIVERY_STATUS_COLOR[d.status]||'#888')+'20', color:DELIVERY_STATUS_COLOR[d.status]||'#888' }}>
                        {d.status==='pending'?'Хүлээгдэж байна':d.status==='assigned'?'Томилогдсон':d.status==='picked_up'?'Авсан':d.status==='on_way'?'Замдаа':d.status==='delivered'?'Хүргэгдсэн':'Амжилтгүй'}
                      </span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column' as any, gap:6 }}>
                      {d.status === 'pending' && (
                        <button onClick={() => { setSelected(d); setForm({}); setModal('assign_courier') }}
                          style={{ padding:'7px 12px', borderRadius:7, border:'1px solid #10B981', background:'rgba(16,185,129,0.06)', color:'#10B981', cursor:'pointer', fontSize:12, fontWeight:600, whiteSpace:'nowrap' as any }}>
                          👤 Жолооч томилох
                        </button>
                      )}
                      {d.status === 'assigned' && (
                        <button onClick={() => updateDeliveryStatus(d.id, 'picked_up')}
                          style={{ padding:'7px 12px', borderRadius:7, border:'1px solid #3B82F6', background:'rgba(59,130,246,0.06)', color:'#3B82F6', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                          📦 Авсан
                        </button>
                      )}
                      {d.status === 'picked_up' && (
                        <button onClick={() => updateDeliveryStatus(d.id, 'on_way')}
                          style={{ padding:'7px 12px', borderRadius:7, border:'1px solid var(--orange)', background:'var(--orange-06)', color:'var(--orange)', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                          🚚 Замдаа
                        </button>
                      )}
                      {d.status === 'on_way' && (
                        <button onClick={() => updateDeliveryStatus(d.id, 'delivered')}
                          style={{ padding:'7px 12px', borderRadius:7, border:'1px solid #10B981', background:'rgba(16,185,129,0.06)', color:'#10B981', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                          ✓ Хүргэгдсэн
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PRODUCTION tab */}
      {stage === 'production' && <ProductionTab />}

      {/* MODALS */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--surface)', borderRadius:16, padding:28, width:460, border:'1px solid var(--border)' }}>

            {modal === 'assign_designer' && (
              <>
                <h2 style={{ margin:'0 0 20px', fontSize:18, fontWeight:600 }}>👤 Дизайнер томилох</h2>
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Дизайнер сонгох</label>
                  {designers.length === 0 ? (
                    <div style={{ padding:'12px', background:'rgba(245,158,11,0.1)', borderRadius:8, fontSize:13, color:'#92400E' }}>
                      ⚠️ Бүртгэлтэй дизайнер байхгүй байна. Admin/Users хуудсаас role=designer хэрэглэгч нэмнэ үү.
                    </div>
                  ) : (
                    <select value={form.designer_id||''} onChange={e=>setForm((f:any)=>({...f,designer_id:e.target.value}))} style={inp}>
                      <option value="">-- Сонгох --</option>
                      {designers.map(d => <option key={d.id} value={d.id}>{d.name||d.email} {d.phone?'('+d.phone+')':''}</option>)}
                    </select>
                  )}
                </div>
                <div style={{ marginBottom:20 }}>
                  <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Zoom/Meet холбоос (заавал биш)</label>
                  <input value={form.designer_zoom||''} onChange={e=>setForm((f:any)=>({...f,designer_zoom:e.target.value}))} placeholder="https://zoom.us/j/..." style={inp} />
                </div>
              </>
            )}

            {modal === 'reject_design' && (
              <>
                <h2 style={{ margin:'0 0 20px', fontSize:18, fontWeight:600 }}>✕ Эх татгалзах</h2>
                <div style={{ marginBottom:20 }}>
                  <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Татгалзах шалтгаан</label>
                  <textarea value={form.reason||''} onChange={e=>setForm((f:any)=>({...f,reason:e.target.value}))} rows={3} placeholder="Дизайны алдаа, өнгө буруу..." style={{...inp, resize:'vertical' as any}} />
                </div>
              </>
            )}

            {modal === 'delivery' && (
              <>
                <h2 style={{ margin:'0 0 20px', fontSize:18, fontWeight:600 }}>🚚 Хүргэлт үүсгэх</h2>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                  <div>
                    <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Хаяг</label>
                    <input value={form.address||''} onChange={e=>setForm((f:any)=>({...f,address:e.target.value}))} placeholder="Дүүрэг, хороо, байр..." style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Дүүрэг</label>
                    <input value={form.district||''} onChange={e=>setForm((f:any)=>({...f,district:e.target.value}))} placeholder="БЗД, ЧД..." style={inp} />
                  </div>
                </div>
                <div style={{ marginBottom:20 }}>
                  <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Хүргэлтийн төлбөр (₮)</label>
                  <input type="number" value={form.fee||5000} onChange={e=>setForm((f:any)=>({...f,fee:e.target.value}))} style={inp} />
                </div>
              </>
            )}

            {modal === 'assign_courier' && (
              <>
                <h2 style={{ margin:'0 0 20px', fontSize:18, fontWeight:600 }}>🚚 Жолооч томилох</h2>
                <div style={{ marginBottom:20 }}>
                  <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Жолооч сонгох</label>
                  {couriers.length === 0 ? (
                    <div style={{ padding:'12px', background:'rgba(245,158,11,0.1)', borderRadius:8, fontSize:13, color:'#92400E' }}>
                      ⚠️ Бүртгэлтэй жолооч байхгүй байна. Users хуудсаас role=courier хэрэглэгч нэмнэ үү.
                    </div>
                  ) : (
                    <select value={form.courier_id||''} onChange={e=>setForm((f:any)=>({...f,courier_id:e.target.value}))} style={inp}>
                      <option value="">-- Сонгох --</option>
                      {couriers.map(c => <option key={c.id} value={c.id}>{c.name||c.email} {c.phone?'('+c.phone+')':''}</option>)}
                    </select>
                  )}
                </div>
              </>
            )}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => { setModal(''); setForm({}) }} style={{ padding:'9px 20px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text)', cursor:'pointer', fontSize:13 }}>Болих</button>
              <button onClick={() => {
                if (modal==='assign_designer') assignDesigner(selected.id)
                else if (modal==='reject_design') rejectDesign(selected.id)
                else if (modal==='delivery') createDelivery(selected)
                else if (modal==='assign_courier') assignCourier(selected.id)
              }} style={{ padding:'9px 20px', borderRadius:8, border:'none', background:'var(--orange)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                Хадгалах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}