'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Vendor { id: string; name: string; location: string; rating: number; status: string; machines: any[]; created_at: string }

const STATUS: Record<string,{label:string;color:string;bg:string}> = {
  active:   {label:'Идэвхтэй', color:'#1D9E75',bg:'rgba(29,158,117,0.1)'},
  inactive: {label:'Идэвхгүй',color:'#e24b4a',bg:'rgba(226,75,74,0.1)'},
  pending:  {label:'Хүлээгдэж',color:'#F59E0B',bg:'rgba(245,158,11,0.1)'},
}

export default function AdminVendorsPage() {
  const router = useRouter()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const F = "'Segoe UI',system-ui,sans-serif"

  useEffect(()=>{
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/login'); return }
    fetch('http://localhost:4000/admin/vendors',{headers:{Authorization:'Bearer '+token}})
      .then(r=>r.json())
      .then(d=>{setVendors(Array.isArray(d)?d:[]);setLoading(false)})
      .catch(()=>{setError('Сервертэй холбогдож чадсангүй');setLoading(false)})
  },[])

  const filtered = vendors.filter(v=>
    v.name?.toLowerCase().includes(search.toLowerCase())||
    v.location?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{padding:'28px 32px',fontFamily:F,color:'var(--text)'}}>

      {/* HEADER */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'24px',paddingBottom:'20px',borderBottom:'1px solid var(--border)'}}>
        <div>
          <h1 style={{fontSize:'22px',fontWeight:600,margin:0,letterSpacing:'-0.4px'}}>Vendors</h1>
          <p style={{fontSize:'13px',color:'var(--text3)',margin:'5px 0 0'}}>Нийт {vendors.length} үйлдвэр</p>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Нэр, байршлаар хайх..."
          style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'8px',padding:'8px 14px',fontSize:'13px',color:'var(--text)',outline:'none',width:'240px',fontFamily:F}}
          onFocus={e=>(e.target.style.borderColor='var(--orange)')}
          onBlur={e=>(e.target.style.borderColor='var(--border)')}/>
      </div>

      {/* STAT CARDS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'24px'}}>
        {[
          {label:'Нийт vendors', value:vendors.length,                                       color:'#7F77DD'},
          {label:'Идэвхтэй',     value:vendors.filter(v=>v.status==='active').length,        color:'#1D9E75'},
          {label:'Нийт машин',   value:vendors.reduce((a,v)=>a+(v.machines?.length||0),0),   color:'var(--orange)'},
        ].map(c=>(
          <div key={c.label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'12px',padding:'18px 20px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:c.color,opacity:.5}}/>
            <div style={{fontSize:'11px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'8px'}}>{c.label}</div>
            <div style={{fontSize:'28px',fontWeight:600,color:c.color,letterSpacing:'-1px'}}>{c.value}</div>
          </div>
        ))}
      </div>

      {error&&<div style={{background:'rgba(226,75,74,0.1)',border:'1px solid rgba(226,75,74,0.2)',borderRadius:'8px',padding:'12px 16px',fontSize:'13px',color:'#e24b4a',marginBottom:'16px'}}>{error}</div>}

      {/* TABLE */}
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'12px',overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'0.4fr 1.4fr 1.2fr 0.6fr 0.7fr 0.7fr 0.8fr',padding:'12px 20px',borderBottom:'1px solid var(--border)',gap:'16px'}}>
          {['#','Нэр','Байршил','Машин','Rating','Төлөв','Огноо'].map(h=>(
            <div key={h} style={{fontSize:'11px',color:'var(--text4)',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:500}}>{h}</div>
          ))}
        </div>
        {loading?(
          <div style={{padding:'48px',textAlign:'center',color:'var(--text4)',fontSize:'13px'}}>Уншиж байна...</div>
        ):filtered.length===0?(
          <div style={{padding:'48px',textAlign:'center',color:'var(--text4)',fontSize:'13px'}}>Vendor олдсонгүй</div>
        ):filtered.map((v,i)=>(
          <div key={v.id}
            style={{display:'grid',gridTemplateColumns:'0.4fr 1.4fr 1.2fr 0.6fr 0.7fr 0.7fr 0.8fr',padding:'14px 20px',borderBottom:i<filtered.length-1?'1px solid var(--border)':'none',gap:'16px',alignItems:'center',transition:'background .15s'}}
            onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
            <div style={{fontSize:'12px',color:'var(--text4)'}}>{i+1}</div>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <div style={{width:'30px',height:'30px',borderRadius:'8px',background:'rgba(127,119,221,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="14" height="14" fill="none" stroke="#7F77DD" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
              </div>
              <span style={{fontSize:'13px',fontWeight:500,color:'var(--text)'}}>{v.name||'—'}</span>
            </div>
            <div style={{fontSize:'13px',color:'var(--text2)'}}>{v.location||'—'}</div>
            <div style={{fontSize:'13px',color:'var(--text2)'}}>{v.machines?.length||0}</div>
            <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
              <svg width="12" height="12" fill="#F59E0B" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span style={{fontSize:'13px',color:'#F59E0B',fontWeight:500}}>{v.rating?.toFixed(1)||'—'}</span>
            </div>
            <div>
              <span style={{fontSize:'11px',fontWeight:500,padding:'4px 10px',borderRadius:'6px',background:STATUS[v.status]?.bg||'rgba(255,255,255,0.05)',color:STATUS[v.status]?.color||'var(--text2)'}}>
                {STATUS[v.status]?.label||v.status||'—'}
              </span>
            </div>
            <div style={{fontSize:'12px',color:'var(--text4)'}}>{v.created_at?new Date(v.created_at).toLocaleDateString('mn-MN'):'—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}