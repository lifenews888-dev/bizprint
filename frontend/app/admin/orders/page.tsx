'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Order { id: string; user: { full_name: string; email: string }; product_type: string; quantity: number; total_price: number; status: string; created_at: string }

const STATUS: Record<string,{label:string;color:string;bg:string}> = {
  pending:    {label:'Хүлээгдэж байна',color:'#F59E0B',bg:'rgba(245,158,11,0.1)'},
  paid:       {label:'Төлөгдсөн',      color:'#378ADD',bg:'rgba(55,138,221,0.1)'},
  production: {label:'Үйлдвэрлэлд',   color:'#7F77DD',bg:'rgba(127,119,221,0.1)'},
  shipped:    {label:'Хүргэлтэнд',     color:'#1D9E75',bg:'rgba(29,158,117,0.1)'},
  completed:  {label:'Дууссан',        color:'#1D9E75',bg:'rgba(29,158,117,0.1)'},
  cancelled:  {label:'Цуцлагдсан',     color:'#e24b4a',bg:'rgba(226,75,74,0.1)'},
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const F = "'Segoe UI',system-ui,sans-serif"

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/login'); return }
    fetch('http://localhost:4000/admin/orders', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = orders.filter(o => {
    const ms = o.user?.full_name?.toLowerCase().includes(search.toLowerCase()) || o.product_type?.toLowerCase().includes(search.toLowerCase()) || o.id?.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'all' || o.status === filter
    return ms && mf
  })

  return (
    <div style={{padding:'28px 32px',fontFamily:F,color:'var(--text)'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'24px',paddingBottom:'20px',borderBottom:'1px solid var(--border)'}}>
        <div>
          <h1 style={{fontSize:'22px',fontWeight:600,margin:0,letterSpacing:'-0.4px'}}>Захиалгууд</h1>
          <p style={{fontSize:'13px',color:'var(--text3)',margin:'5px 0 0'}}>Нийт {orders.length} захиалга</p>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Хайх..."
          style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'8px',padding:'8px 14px',fontSize:'13px',color:'var(--text)',outline:'none',width:'220px',fontFamily:F}}
          onFocus={e=>(e.target.style.borderColor='var(--orange)')} onBlur={e=>(e.target.style.borderColor='var(--border)')}/>
      </div>

      <div style={{display:'flex',gap:'6px',marginBottom:'20px',flexWrap:'wrap'}}>
        {['all','pending','paid','production','shipped','completed','cancelled'].map(s=>(
          <button key={s} onClick={()=>setFilter(s)}
            style={{padding:'6px 14px',borderRadius:'7px',border:'1px solid',fontSize:'12px',cursor:'pointer',fontFamily:F,fontWeight:filter===s?500:400,
              background:filter===s?(s==='all'?'var(--orange)':STATUS[s]?.bg||'transparent'):'transparent',
              color:filter===s?(s==='all'?'#fff':STATUS[s]?.color||'#fff'):'var(--text3)',
              borderColor:filter===s?(s==='all'?'var(--orange)':STATUS[s]?.color||'var(--orange)'):'var(--border)'}}>
            {s==='all'?'Бүгд':STATUS[s]?.label||s}
            {s!=='all'&&<span style={{marginLeft:'6px',opacity:.7}}>({orders.filter(o=>o.status===s).length})</span>}
          </button>
        ))}
      </div>

      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'12px',overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1.2fr 1fr 0.6fr 0.8fr 0.9fr 0.7fr',padding:'12px 20px',borderBottom:'1px solid var(--border)',gap:'16px'}}>
          {['ID','Хэрэглэгч','Бүтээгдэхүүн','Тоо','Үнэ','Төлөв','Огноо'].map(h=>(
            <div key={h} style={{fontSize:'11px',color:'var(--text4)',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:500}}>{h}</div>
          ))}
        </div>
        {loading?<div style={{padding:'48px',textAlign:'center',color:'var(--text4)',fontSize:'13px'}}>Уншиж байна...</div>
        :filtered.length===0?<div style={{padding:'48px',textAlign:'center',color:'var(--text4)',fontSize:'13px'}}>Захиалга олдсонгүй</div>
        :filtered.map((o,i)=>(
          <div key={o.id}
            style={{display:'grid',gridTemplateColumns:'1fr 1.2fr 1fr 0.6fr 0.8fr 0.9fr 0.7fr',padding:'14px 20px',borderBottom:i<filtered.length-1?'1px solid var(--border)':'none',gap:'16px',alignItems:'center',transition:'background .15s'}}
            onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
            <div style={{fontSize:'12px',color:'var(--text4)',fontFamily:'monospace'}}>{o.id?.slice(0,8)}...</div>
            <div>
              <div style={{fontSize:'13px',fontWeight:500,color:'var(--text)'}}>{o.user?.full_name||'—'}</div>
              <div style={{fontSize:'11px',color:'var(--text4)',marginTop:'2px'}}>{o.user?.email}</div>
            </div>
            <div style={{fontSize:'13px',color:'var(--text2)'}}>{o.product_type}</div>
            <div style={{fontSize:'13px',color:'var(--text2)'}}>{o.quantity?.toLocaleString()}</div>
            <div style={{fontSize:'13px',fontWeight:500,color:'var(--orange)'}}>{o.total_price?.toLocaleString('mn-MN')}₮</div>
            <div><span style={{fontSize:'11px',fontWeight:500,padding:'4px 10px',borderRadius:'6px',background:STATUS[o.status]?.bg||'rgba(255,255,255,0.05)',color:STATUS[o.status]?.color||'var(--text2)'}}>{STATUS[o.status]?.label||o.status}</span></div>
            <div style={{fontSize:'12px',color:'var(--text4)'}}>{o.created_at?new Date(o.created_at).toLocaleDateString('mn-MN'):'—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}