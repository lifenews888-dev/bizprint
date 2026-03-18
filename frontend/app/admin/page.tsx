'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<string|null>(null)
  const F = "'Segoe UI',system-ui,sans-serif"

  useEffect(()=>{
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/login'); return }
    const h = { Authorization:'Bearer '+token }
    Promise.all([
      fetch('http://localhost:4000/admin/stats',{headers:h}).then(r=>r.json()).catch(()=>null),
      fetch('http://localhost:4000/admin/orders',{headers:h}).then(r=>r.json()).catch(()=>[]),
      fetch('http://localhost:4000/admin/users',{headers:h}).then(r=>r.json()).catch(()=>[]),
    ]).then(([s,o,u])=>{
      setStats(s)
      setOrders(Array.isArray(o)?o:[])
      setUsers(Array.isArray(u)?u:[])
      setLoading(false)
    })
  },[])

  const revenue = orders.reduce((a,o)=>a+(o.total_price||0),0)
  const paidOrders = orders.filter(o=>o.status==='completed'||o.status==='paid')
  const pendingOrders = orders.filter(o=>o.status==='pending')
  const byStatus = orders.reduce((a:any,o:any)=>{ a[o.status]=(a[o.status]||0)+1; return a },{})
  const byProduct = orders.reduce((a:any,o:any)=>{ if(o.product_type) a[o.product_type]=(a[o.product_type]||0)+1; return a },{})
  const topProducts = Object.entries(byProduct).sort((a:any,b:any)=>b[1]-a[1]).slice(0,5)
  const recentOrders = [...orders].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()).slice(0,6)
  const recentUsers = [...users].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()).slice(0,5)

  const statusColors:any={pending:'#F59E0B',paid:'#378ADD',production:'#7F77DD',shipped:'#1D9E75',completed:'#1D9E75',cancelled:'#e24b4a'}
  const statusLabels:any={pending:'Хүлээгдэж байна',paid:'Төлөгдсөн',production:'Үйлдвэрлэлд',shipped:'Хүргэлтэнд',completed:'Дууссан',cancelled:'Цуцлагдсан'}
  const roleColors:any={admin:'#e24b4a',customer:'#378ADD',vendor:'#7F77DD',designer:'#1D9E75',sales:'#F59E0B',courier:'var(--orange)'}

  const maxProd = topProducts[0]?.[1] as number || 1

  if(loading) return(
    <div style={{padding:'48px',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontFamily:F,fontSize:13}}>
      Уншиж байна...
    </div>
  )

  return(
    <div style={{padding:'24px 28px',fontFamily:F,color:'var(--text)',maxWidth:1400}}>

      {/* TITLE ROW */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,paddingBottom:16,borderBottom:'1px solid var(--border)'}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:600,margin:0,letterSpacing:'-0.3px'}}>Dashboard</h1>
          <p style={{fontSize:12,color:'var(--text3)',margin:'3px 0 0'}}>BizPrint Admin — Ерөнхий тойм</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>router.push('/admin/orders')}
            style={{background:'var(--orange)',color:'#fff',border:'none',borderRadius:8,padding:'7px 16px',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:F}}>
            + Захиалга харах
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10,marginBottom:20}}>
        {[
          {label:'Нийт орлого',    value:revenue.toLocaleString('mn-MN')+'₮', color:'var(--orange)', sub:'Бүх захиалгаас',       icon:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'},
          {label:'Захиалга',       value:orders.length,                         color:'#378ADD', sub:pendingOrders.length+' хүлээгдэж',  icon:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'},
          {label:'Хэрэглэгч',     value:stats?.users??0,                       color:'#7F77DD', sub:'Нийт бүртгэлтэй',     icon:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm8 0a3 3 0 100-6 3 3 0 000 6'},
          {label:'Vendor',         value:stats?.vendors??0,                     color:'#1D9E75', sub:'Үйлдвэрүүд',           icon:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z'},
          {label:'Машин',          value:stats?.machines??0,                    color:'#F59E0B', sub:'Тоног төхөөрөмж',     icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0'},
          {label:'Үйлдвэрлэл',    value:stats?.production??0,                  color:'#e24b4a', sub:'Үйлдвэрлэлд байгаа', icon:'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'},
        ].map(c=>(
          <div key={c.label}
            style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'16px 14px',position:'relative',overflow:'hidden',cursor:'pointer',transition:'all .2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=c.color+'55';e.currentTarget.style.transform='translateY(-2px)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='translateY(0)'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:c.color,opacity:.6}}/>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
              <div style={{fontSize:10,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:500}}>{c.label}</div>
              <div style={{width:24,height:24,borderRadius:6,background:c.color+'15',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="12" height="12" fill="none" stroke={c.color} strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24"><path d={c.icon}/></svg>
              </div>
            </div>
            <div style={{fontSize:24,fontWeight:700,color:c.color,letterSpacing:'-1px',lineHeight:1,marginBottom:5}}>{c.value}</div>
            <div style={{fontSize:10,color:'var(--text4)'}}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ROW 2: Status chart + Top products */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>

        {/* ORDER STATUS */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:500}}>Захиалгын статус</div>
            <button onClick={()=>router.push('/admin/orders')} style={{background:'transparent',border:'none',color:'var(--orange)',fontSize:12,cursor:'pointer',fontFamily:F}}>Бүгд →</button>
          </div>
          {orders.length===0?(
            <div style={{textAlign:'center',padding:'20px 0',color:'var(--text4)',fontSize:13}}>Захиалга байхгүй</div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {Object.entries(byStatus).map(([s,c]:any)=>{
                const pct=Math.round((c/orders.length)*100)
                return(
                  <div key={s}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:12,color:'var(--text2)'}}>{statusLabels[s]||s}</span>
                      <span style={{fontSize:12,fontWeight:600,color:statusColors[s]||'var(--text2)'}}>{c} <span style={{fontWeight:400,color:'var(--text4)'}}>({pct}%)</span></span>
                    </div>
                    <div style={{height:5,background:'var(--surface2)',borderRadius:3}}>
                      <div style={{width:pct+'%',height:'100%',background:statusColors[s]||'#555',borderRadius:3}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* TOP PRODUCTS */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:500}}>Хамгийн их захиалагдсан</div>
            <span style={{fontSize:11,color:'var(--text4)'}}>Тоогоор</span>
          </div>
          {topProducts.length===0?(
            <div style={{textAlign:'center',padding:'20px 0',color:'var(--text4)',fontSize:13}}>Өгөгдөл байхгүй</div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {topProducts.map(([name,count]:any,i)=>{
                const pct=Math.round((count/maxProd)*100)
                const colors=['var(--orange)','#378ADD','#7F77DD','#1D9E75','#F59E0B']
                return(
                  <div key={name}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontSize:11,fontWeight:700,color:colors[i],width:16}}>{i+1}</span>
                      <span style={{fontSize:12,color:'var(--text)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</span>
                      <span style={{fontSize:12,fontWeight:600,color:colors[i],flexShrink:0}}>{count}</span>
                    </div>
                    <div style={{height:4,background:'var(--surface2)',borderRadius:2,marginLeft:24}}>
                      <div style={{width:pct+'%',height:'100%',background:colors[i],borderRadius:2}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RECENT USERS */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:500}}>Сүүлийн хэрэглэгчид</div>
            <button onClick={()=>router.push('/admin/users')} style={{background:'transparent',border:'none',color:'var(--orange)',fontSize:12,cursor:'pointer',fontFamily:F}}>Бүгд →</button>
          </div>
          {recentUsers.length===0?(
            <div style={{textAlign:'center',padding:'20px 0',color:'var(--text4)',fontSize:13}}>Хэрэглэгч байхгүй</div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {recentUsers.map(u=>(
                <div key={u.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:8,background:'var(--surface2)',transition:'background .15s',cursor:'pointer'}}
                  onMouseEnter={e=>(e.currentTarget.style.background='var(--border)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='var(--surface2)')}>
                  <div style={{width:28,height:28,borderRadius:'50%',background:(roleColors[u.role]||'var(--orange)')+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:roleColors[u.role]||'var(--orange)',flexShrink:0}}>
                    {u.full_name?.charAt(0)?.toUpperCase()||'?'}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.full_name||'—'}</div>
                    <div style={{fontSize:10,color:'var(--text4)'}}>{u.email}</div>
                  </div>
                  <span style={{fontSize:10,fontWeight:500,padding:'2px 7px',borderRadius:5,background:(roleColors[u.role]||'var(--orange)')+'15',color:roleColors[u.role]||'var(--orange)',flexShrink:0}}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RECENT ORDERS TABLE */}
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:14,fontWeight:500}}>Сүүлийн захиалгууд</div>
          <button onClick={()=>router.push('/admin/orders')} style={{background:'transparent',border:'none',color:'var(--orange)',fontSize:12,cursor:'pointer',fontFamily:F}}>Бүгд харах →</button>
        </div>
        {recentOrders.length===0?(
          <div style={{padding:'40px',textAlign:'center',color:'var(--text4)',fontSize:13}}>Захиалга байхгүй байна</div>
        ):(
          <>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1.2fr 1fr 0.7fr 0.8fr 0.7fr',padding:'10px 20px',borderBottom:'1px solid var(--border)',gap:16}}>
              {['ID','Хэрэглэгч','Бүтээгдэхүүн','Дүн','Төлөв','Огноо'].map(h=>(
                <div key={h} style={{fontSize:10,color:'var(--text4)',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:500}}>{h}</div>
              ))}
            </div>
            {recentOrders.map((o,i)=>(
              <div key={o.id}
                style={{display:'grid',gridTemplateColumns:'1fr 1.2fr 1fr 0.7fr 0.8fr 0.7fr',padding:'12px 20px',borderBottom:i<recentOrders.length-1?'1px solid var(--border)':'none',gap:16,alignItems:'center',transition:'background .15s',cursor:'pointer'}}
                onClick={()=>router.push('/admin/orders')}
                onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <div style={{fontSize:11,color:'var(--text4)',fontFamily:'monospace'}}>{o.id?.slice(0,8)}...</div>
                <div style={{fontSize:12,fontWeight:500,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.user?.full_name||'—'}</div>
                <div style={{fontSize:12,color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.product_type||'—'}</div>
                <div style={{fontSize:12,fontWeight:600,color:'var(--orange)'}}>{o.total_price?.toLocaleString('mn-MN')}₮</div>
                <div><span style={{fontSize:10,fontWeight:500,padding:'3px 8px',borderRadius:5,background:statusColors[o.status]+'15'||'rgba(255,255,255,0.05)',color:statusColors[o.status]||'var(--text2)'}}>{statusLabels[o.status]||o.status}</span></div>
                <div style={{fontSize:11,color:'var(--text4)'}}>{o.created_at?new Date(o.created_at).toLocaleDateString('mn-MN'):'—'}</div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:20}}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:14}}>Хурдан үйлдэл</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
          {[
            {label:'Хэрэглэгчид', href:'/admin/users',    color:'#378ADD'},
            {label:'Захиалгууд',  href:'/admin/orders',   color:'var(--orange)'},
            {label:'Vendors',     href:'/admin/vendors',  color:'#7F77DD'},
            {label:'Машинууд',   href:'/admin/machines', color:'#1D9E75'},
            {label:'CMS',        href:'/admin/cms',      color:'#F59E0B'},
            {label:'Reports',    href:'/admin/reports',  color:'#e24b4a'},
          ].map(a=>(
            <button key={a.href} onClick={()=>router.push(a.href)}
              style={{padding:'12px 8px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:10,cursor:'pointer',fontFamily:F,fontSize:12,fontWeight:500,color:'var(--text2)',transition:'all .15s',textAlign:'center'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=a.color;e.currentTarget.style.color=a.color;e.currentTarget.style.background=a.color+'10'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text2)';e.currentTarget.style.background='var(--surface2)'}}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}