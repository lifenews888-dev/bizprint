'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Machine { id: string; name: string; type: string; vendor: { name: string }; max_sheet_size: string; speed_per_hour: number; setup_cost: number; status: string }

const STATUS: Record<string,{label:string;color:string;bg:string}> = {
  active:      {label:'Идэвхтэй',  color:'#1D9E75',bg:'rgba(29,158,117,0.1)'},
  inactive:    {label:'Идэвхгүй', color:'#e24b4a',bg:'rgba(226,75,74,0.1)'},
  maintenance: {label:'Засвартай',color:'#F59E0B',bg:'rgba(245,158,11,0.1)'},
}

const TYPES: Record<string,{label:string;color:string}> = {
  offset:       {label:'Offset',       color:'#378ADD'},
  digital:      {label:'Digital',      color:'#7F77DD'},
  large_format: {label:'Large Format', color:'#1D9E75'},
  screen:       {label:'Screen',       color:'#F59E0B'},
}

export default function AdminMachinesPage() {
  const router = useRouter()
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')
  const F = "'Segoe UI',system-ui,sans-serif"

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/login'); return }
    fetch('http://localhost:4000/admin/machines', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => { setMachines(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { setError('Сервертэй холбогдож чадсангүй'); setLoading(false) })
  }, [])

  const filtered = machines.filter(m => {
    const ms = m.name?.toLowerCase().includes(search.toLowerCase()) || m.vendor?.name?.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'all' || m.type === filter
    return ms && mf
  })

  return (
    <div style={{padding:'28px 32px',fontFamily:F,color:'var(--text)'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'24px',paddingBottom:'20px',borderBottom:'1px solid var(--border)'}}>
        <div>
          <h1 style={{fontSize:'22px',fontWeight:600,margin:0,letterSpacing:'-0.4px'}}>Машинууд</h1>
          <p style={{fontSize:'13px',color:'var(--text3)',margin:'5px 0 0'}}>Нийт {machines.length} тоног төхөөрөмж</p>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Нэр, vendor-аар хайх..."
          style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'8px',padding:'8px 14px',fontSize:'13px',color:'var(--text)',outline:'none',width:'240px',fontFamily:F}}
          onFocus={e=>(e.target.style.borderColor='var(--orange)')} onBlur={e=>(e.target.style.borderColor='var(--border)')}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'20px'}}>
        {[
          {label:'Нийт машин', value:machines.length,                                      color:'#1D9E75'},
          {label:'Идэвхтэй',   value:machines.filter(m=>m.status==='active').length,       color:'#378ADD'},
          {label:'Засвартай',  value:machines.filter(m=>m.status==='maintenance').length,  color:'#F59E0B'},
          {label:'Идэвхгүй',  value:machines.filter(m=>m.status==='inactive').length,     color:'#e24b4a'},
        ].map(c=>(
          <div key={c.label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'12px',padding:'16px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:c.color,opacity:.5}}/>
            <div style={{fontSize:'11px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'8px'}}>{c.label}</div>
            <div style={{fontSize:'26px',fontWeight:600,color:c.color,letterSpacing:'-1px'}}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:'6px',marginBottom:'16px'}}>
        {['all','offset','digital','large_format','screen'].map(t=>(
          <button key={t} onClick={()=>setFilter(t)}
            style={{padding:'6px 14px',borderRadius:'7px',border:'1px solid',fontSize:'12px',cursor:'pointer',fontFamily:F,fontWeight:filter===t?500:400,
              background:filter===t?(t==='all'?'var(--orange)':TYPES[t]?.color+'22'||'transparent'):'transparent',
              color:filter===t?(t==='all'?'#fff':TYPES[t]?.color||'#fff'):'var(--text3)',
              borderColor:filter===t?(t==='all'?'var(--orange)':TYPES[t]?.color||'var(--orange)'):'var(--border)'}}>
            {t==='all'?'Бүгд':TYPES[t]?.label||t}
            {t!=='all'&&<span style={{marginLeft:'6px',opacity:.7}}>({machines.filter(m=>m.type===t).length})</span>}
          </button>
        ))}
      </div>

      {error&&<div style={{background:'rgba(226,75,74,0.1)',border:'1px solid rgba(226,75,74,0.2)',borderRadius:'8px',padding:'12px 16px',fontSize:'13px',color:'#e24b4a',marginBottom:'16px'}}>{error}</div>}

      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'12px',overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'0.4fr 1.2fr 0.8fr 1fr 0.8fr 0.7fr 0.8fr',padding:'12px 20px',borderBottom:'1px solid var(--border)',gap:'16px'}}>
          {['#','Нэр','Төрөл','Vendor','Хэмжээ','Хурд','Төлөв'].map(h=>(
            <div key={h} style={{fontSize:'11px',color:'var(--text4)',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:500}}>{h}</div>
          ))}
        </div>
        {loading?<div style={{padding:'48px',textAlign:'center',color:'var(--text4)',fontSize:'13px'}}>Уншиж байна...</div>
        :filtered.length===0?<div style={{padding:'48px',textAlign:'center',color:'var(--text4)',fontSize:'13px'}}>Машин олдсонгүй</div>
        :filtered.map((m,i)=>(
          <div key={m.id}
            style={{display:'grid',gridTemplateColumns:'0.4fr 1.2fr 0.8fr 1fr 0.8fr 0.7fr 0.8fr',padding:'14px 20px',borderBottom:i<filtered.length-1?'1px solid var(--border)':'none',gap:'16px',alignItems:'center',transition:'background .15s'}}
            onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
            <div style={{fontSize:'12px',color:'var(--text4)'}}>{i+1}</div>
            <div style={{fontSize:'13px',fontWeight:500,color:'var(--text)'}}>{m.name||'—'}</div>
            <div><span style={{fontSize:'11px',fontWeight:500,padding:'3px 8px',borderRadius:'5px',background:(TYPES[m.type]?.color||'#888')+'18',color:TYPES[m.type]?.color||'var(--text2)'}}>{TYPES[m.type]?.label||m.type||'—'}</span></div>
            <div style={{fontSize:'13px',color:'var(--text2)'}}>{m.vendor?.name||'—'}</div>
            <div style={{fontSize:'12px',color:'var(--text3)'}}>{m.max_sheet_size||'—'}</div>
            <div style={{fontSize:'13px',color:'var(--text2)'}}>{m.speed_per_hour?.toLocaleString()||'—'}</div>
            <div><span style={{fontSize:'11px',fontWeight:500,padding:'4px 10px',borderRadius:'6px',background:STATUS[m.status]?.bg||'rgba(255,255,255,0.05)',color:STATUS[m.status]?.color||'var(--text2)'}}>{STATUS[m.status]?.label||m.status||'—'}</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}