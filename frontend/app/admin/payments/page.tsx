'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const F = "'Segoe UI',system-ui,sans-serif"

  useEffect(()=>{
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/login'); return }
    fetch('http://localhost:4000/admin/orders',{headers:{Authorization:'Bearer '+token}})
      .then(r=>r.json())
      .then(d=>{ setOrders(Array.isArray(d)?d.filter((o:any)=>o.status!=='pending'):[]);setLoading(false) })
      .catch(()=>setLoading(false))
  },[])

  const total = orders.reduce((a,p)=>a+(p.total_price||0),0)

  return(
    <div style={{padding:'28px 32px',fontFamily:F,color:'var(--text)'}}>
      <div style={{marginBottom:'24px',paddingBottom:'20px',borderBottom:'1px solid var(--border)'}}>
        <h1 style={{fontSize:'22px',fontWeight:600,margin:0,letterSpacing:'-0.4px'}}>Payments</h1>
        <p style={{fontSize:'13px',color:'var(--text3)',margin:'5px 0 0'}}>Төлбөрийн гүйлгээнүүд</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'24px'}}>
        {[
          {label:'Нийт гүйлгээ', value:orders.length,                                                              color:'#378ADD'},
          {label:'Нийт дүн',     value:total.toLocaleString('mn-MN')+'₮',                                          color:'var(--orange)'},
          {label:'Дундаж',       value:orders.length>0?Math.round(total/orders.length).toLocaleString('mn-MN')+'₮':'0₮', color:'#1D9E75'},
        ].map(c=>(
          <div key={c.label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'12px',padding:'18px 20px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:c.color,opacity:.5}}/>
            <div style={{fontSize:'11px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'8px'}}>{c.label}</div>
            <div style={{fontSize:'22px',fontWeight:600,color:c.color,letterSpacing:'-0.5px'}}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'12px',overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1.2fr 1fr 0.8fr 0.9fr 0.7fr',padding:'12px 20px',borderBottom:'1px solid var(--border)',gap:'16px'}}>
          {['ID','Хэрэглэгч','Бүтээгдэхүүн','Дүн','Төлөв','Огноо'].map(h=>(
            <div key={h} style={{fontSize:'11px',color:'var(--text4)',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:500}}>{h}</div>
          ))}
        </div>
        {loading?<div style={{padding:'48px',textAlign:'center',color:'var(--text4)',fontSize:'13px'}}>Уншиж байна...</div>
        :orders.length===0?<div style={{padding:'48px',textAlign:'center',color:'var(--text4)',fontSize:'13px'}}>Гүйлгээ байхгүй</div>
        :orders.map((p,i)=>(
          <div key={p.id}
            style={{display:'grid',gridTemplateColumns:'1fr 1.2fr 1fr 0.8fr 0.9fr 0.7fr',padding:'13px 20px',borderBottom:i<orders.length-1?'1px solid var(--border)':'none',gap:'16px',alignItems:'center',transition:'background .15s'}}
            onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
            <div style={{fontSize:'12px',color:'var(--text4)',fontFamily:'monospace'}}>{p.id?.slice(0,8)}...</div>
            <div style={{fontSize:'13px',fontWeight:500,color:'var(--text)'}}>{p.user?.full_name||'—'}</div>
            <div style={{fontSize:'13px',color:'var(--text2)'}}>{p.product_type||'—'}</div>
            <div style={{fontSize:'13px',fontWeight:600,color:'var(--orange)'}}>{p.total_price?.toLocaleString('mn-MN')}₮</div>
            <div><span style={{fontSize:'11px',fontWeight:500,padding:'4px 10px',borderRadius:'6px',
              background:p.status==='completed'?'rgba(29,158,117,0.1)':p.status==='paid'?'rgba(55,138,221,0.1)':'rgba(245,158,11,0.1)',
              color:p.status==='completed'?'#1D9E75':p.status==='paid'?'#378ADD':'#F59E0B'}}>
              {p.status}
            </span></div>
            <div style={{fontSize:'12px',color:'var(--text4)'}}>{p.created_at?new Date(p.created_at).toLocaleDateString('mn-MN'):'—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}