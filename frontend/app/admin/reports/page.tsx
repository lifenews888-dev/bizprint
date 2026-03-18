'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminReportsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const F = "'Segoe UI',system-ui,sans-serif"

  useEffect(()=>{
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/login'); return }
    Promise.all([
      fetch('http://localhost:4000/admin/stats',{headers:{Authorization:'Bearer '+token}}).then(r=>r.json()).catch(()=>null),
      fetch('http://localhost:4000/admin/orders',{headers:{Authorization:'Bearer '+token}}).then(r=>r.json()).catch(()=>[]),
    ]).then(([s,o])=>{ setStats(s); setOrders(Array.isArray(o)?o:[]) })
  },[])

  const revenue = orders.reduce((a,o)=>a+(o.total_price||0),0)
  const byStatus = orders.reduce((a:any,o:any)=>{ a[o.status]=(a[o.status]||0)+1; return a },{})
  const byProduct = orders.reduce((a:any,o:any)=>{ a[o.product_type]=(a[o.product_type]||0)+1; return a },{})
  const topProducts = Object.entries(byProduct).sort((a:any,b:any)=>b[1]-a[1]).slice(0,5)
  const statusColors:any={pending:'#F59E0B',paid:'#378ADD',production:'#7F77DD',shipped:'#1D9E75',completed:'#1D9E75',cancelled:'#e24b4a'}

  return(
    <div style={{padding:'28px 32px',fontFamily:F,color:'var(--text)'}}>
      <div style={{marginBottom:'24px',paddingBottom:'20px',borderBottom:'1px solid var(--border)'}}>
        <h1 style={{fontSize:'22px',fontWeight:600,margin:0,letterSpacing:'-0.4px'}}>Reports & Analytics</h1>
        <p style={{fontSize:'13px',color:'var(--text3)',margin:'5px 0 0'}}>Платформын үзүүлэлтүүд</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'24px'}}>
        {[
          {label:'Нийт орлого', value:revenue.toLocaleString('mn-MN')+'₮', color:'var(--orange)'},
          {label:'Захиалга',    value:orders.length,                         color:'#378ADD'},
          {label:'Хэрэглэгч',  value:stats?.users??0,                       color:'#7F77DD'},
          {label:'Vendor',      value:stats?.vendors??0,                     color:'#1D9E75'},
        ].map(c=>(
          <div key={c.label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'12px',padding:'18px 16px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:c.color,opacity:.5}}/>
            <div style={{fontSize:'11px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'8px'}}>{c.label}</div>
            <div style={{fontSize:'26px',fontWeight:600,color:c.color,letterSpacing:'-0.5px'}}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'12px',padding:'20px'}}>
          <div style={{fontSize:'14px',fontWeight:500,marginBottom:'16px'}}>Захиалгын статус</div>
          {Object.entries(byStatus).length===0?(
            <div style={{textAlign:'center',padding:'20px 0',color:'var(--text4)',fontSize:'13px'}}>Өгөгдөл байхгүй</div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {Object.entries(byStatus).map(([status,count]:any)=>{
                const pct = Math.round((count/orders.length)*100)
                return(
                  <div key={status}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
                      <span style={{fontSize:'12px',color:'var(--text2)'}}>{status}</span>
                      <span style={{fontSize:'12px',fontWeight:500,color:statusColors[status]||'var(--text2)'}}>{count} ({pct}%)</span>
                    </div>
                    <div style={{height:5,background:'var(--surface2)',borderRadius:3}}>
                      <div style={{width:pct+'%',height:'100%',background:statusColors[status]||'#555',borderRadius:3,transition:'width .3s'}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'12px',padding:'20px'}}>
          <div style={{fontSize:'14px',fontWeight:500,marginBottom:'16px'}}>Хамгийн их захиалагдсан</div>
          {topProducts.length===0?(
            <div style={{textAlign:'center',padding:'20px 0',color:'var(--text4)',fontSize:'13px'}}>Өгөгдөл байхгүй</div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {topProducts.map(([name,count]:any,i)=>(
                <div key={name} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'var(--surface2)',borderRadius:8}}>
                  <div style={{width:24,height:24,borderRadius:6,background:'var(--orange-10)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:'var(--orange)',flexShrink:0}}>{i+1}</div>
                  <span style={{fontSize:'13px',color:'var(--text)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name||'—'}</span>
                  <span style={{fontSize:'13px',fontWeight:600,color:'var(--orange)',flexShrink:0}}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'12px',padding:'20px'}}>
        <div style={{fontSize:'14px',fontWeight:500,marginBottom:'16px'}}>Системийн тоймлол</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
          {[
            {label:'Хэрэглэгч',   value:stats?.users??0,      color:'#378ADD'},
            {label:'Захиалга',    value:stats?.orders??0,     color:'var(--orange)'},
            {label:'Vendor',      value:stats?.vendors??0,    color:'#7F77DD'},
            {label:'Машин',       value:stats?.machines??0,   color:'#1D9E75'},
            {label:'Үйлдвэрлэл', value:stats?.production??0, color:'#e24b4a'},
          ].map(c=>(
            <div key={c.label} style={{textAlign:'center',padding:'16px 12px',background:'var(--surface2)',borderRadius:10,border:'1px solid var(--border)'}}>
              <div style={{fontSize:'24px',fontWeight:600,color:c.color,marginBottom:4,letterSpacing:'-0.5px'}}>{c.value}</div>
              <div style={{fontSize:'11px',color:'var(--text4)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}