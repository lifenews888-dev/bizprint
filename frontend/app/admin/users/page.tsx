'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User { id: string; full_name: string; email: string; role: string; created_at: string; wallet_balance: number }

const ROLES: Record<string,{label:string;color:string;bg:string}> = {
  admin:    {label:'Admin',      color:'#e24b4a',bg:'rgba(226,75,74,0.1)'},
  customer: {label:'Захиалагч', color:'#378ADD',bg:'rgba(55,138,221,0.1)'},
  vendor:   {label:'Vendor',    color:'#7F77DD',bg:'rgba(127,119,221,0.1)'},
  designer: {label:'Дизайнер', color:'#1D9E75',bg:'rgba(29,158,117,0.1)'},
  sales:    {label:'Борлуулагч',color:'#F59E0B',bg:'rgba(245,158,11,0.1)'},
  courier:  {label:'Курьер',    color:'var(--orange)',bg:'var(--orange-10)'},
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')
  const F = "'Segoe UI',system-ui,sans-serif"

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.push('/login'); return }
    fetch('http://localhost:4000/admin/users', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => { setUsers(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { setError('Сервертэй холбогдож чадсангүй'); setLoading(false) })
  }, [])

  async function changeRole(id: string, role: string) {
    await fetch(API+'/admin/users/'+id+'/role', { method:'PATCH', headers: authH(), body: JSON.stringify({ role }) })
    loadUsers()
  }

  const filtered = users.filter(u => {
    const ms = u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    const mf = filter === 'all' || u.role === filter
    return ms && mf
  })

  return (
    <div style={{padding:'28px 32px',fontFamily:F,color:'var(--text)'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'24px',paddingBottom:'20px',borderBottom:'1px solid var(--border)'}}>
        <div>
          <h1 style={{fontSize:'22px',fontWeight:600,margin:0,letterSpacing:'-0.4px'}}>Хэрэглэгчид</h1>
          <p style={{fontSize:'13px',color:'var(--text3)',margin:'5px 0 0'}}>Нийт {users.length} хэрэглэгч</p>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Нэр, имэйлээр хайх..."
          style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'8px',padding:'8px 14px',fontSize:'13px',color:'var(--text)',outline:'none',width:'240px',fontFamily:F}}
          onFocus={e=>(e.target.style.borderColor='var(--orange)')} onBlur={e=>(e.target.style.borderColor='var(--border)')}/>
      </div>

      <div style={{display:'flex',gap:'6px',marginBottom:'20px',flexWrap:'wrap'}}>
        {['all','customer','vendor','designer','sales','courier','admin'].map(r=>(
          <button key={r} onClick={()=>setFilter(r)}
            style={{padding:'6px 14px',borderRadius:'7px',border:'1px solid',fontSize:'12px',cursor:'pointer',fontFamily:F,fontWeight:filter===r?500:400,
              background:filter===r?(r==='all'?'var(--orange)':ROLES[r]?.bg||'transparent'):'transparent',
              color:filter===r?(r==='all'?'#fff':ROLES[r]?.color||'#fff'):'var(--text3)',
              borderColor:filter===r?(r==='all'?'var(--orange)':ROLES[r]?.color||'var(--orange)'):'var(--border)'}}>
            {r==='all'?'Бүгд':ROLES[r]?.label||r}
            {r!=='all'&&<span style={{marginLeft:'6px',opacity:.7}}>({users.filter(u=>u.role===r).length})</span>}
          </button>
        ))}
      </div>

      {error&&<div style={{background:'rgba(226,75,74,0.1)',border:'1px solid rgba(226,75,74,0.2)',borderRadius:'8px',padding:'12px 16px',fontSize:'13px',color:'#e24b4a',marginBottom:'16px'}}>{error}</div>}

      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'12px',overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'0.5fr 1.2fr 1.5fr 0.8fr 0.8fr 0.8fr',padding:'12px 20px',borderBottom:'1px solid var(--border)',gap:'16px'}}>
          {['#','Нэр','Имэйл','Эрх','Үлдэгдэл','Огноо'].map(h=>(
            <div key={h} style={{fontSize:'11px',color:'var(--text4)',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:500}}>{h}</div>
          ))}
        </div>
        {loading?<div style={{padding:'48px',textAlign:'center',color:'var(--text4)',fontSize:'13px'}}>Уншиж байна...</div>
        :filtered.length===0?<div style={{padding:'48px',textAlign:'center',color:'var(--text4)',fontSize:'13px'}}>Хэрэглэгч олдсонгүй</div>
        :filtered.map((u,i)=>(
          <div key={u.id}
            style={{display:'grid',gridTemplateColumns:'0.5fr 1.2fr 1.5fr 0.8fr 0.8fr 0.8fr',padding:'14px 20px',borderBottom:i<filtered.length-1?'1px solid var(--border)':'none',gap:'16px',alignItems:'center',transition:'background .15s'}}
            onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
            <div style={{fontSize:'12px',color:'var(--text4)'}}>{i+1}</div>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <div style={{width:'30px',height:'30px',borderRadius:'50%',background:'var(--orange-15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:600,color:'var(--orange)',flexShrink:0}}>
                {u.full_name?.charAt(0)?.toUpperCase()||'?'}
              </div>
              <span style={{fontSize:'13px',fontWeight:500,color:'var(--text)'}}>{u.full_name||'—'}</span>
            </div>
            <div style={{fontSize:'13px',color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email}</div>
            <div><span style={{fontSize:'11px',fontWeight:500,padding:'4px 10px',borderRadius:'6px',background:ROLES[u.role]?.bg||'rgba(255,255,255,0.05)',color:ROLES[u.role]?.color||'var(--text2)'}}>{ROLES[u.role]?.label||u.role}</span>
                    <select value={u.role} onChange={e=>changeRole(u.id,e.target.value)}
                      style={{ marginTop:4, fontSize:11, padding:'3px 8px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', cursor:'pointer', outline:'none' }}>
                      {['customer','designer','vendor','courier','admin'].map(r=>(
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select></div>
            <div style={{fontSize:'13px',color:'var(--orange)',fontWeight:500}}>{(u.wallet_balance||0).toLocaleString('mn-MN')}₮</div>
            <div style={{fontSize:'12px',color:'var(--text4)'}}>{u.created_at?new Date(u.created_at).toLocaleDateString('mn-MN'):'—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}