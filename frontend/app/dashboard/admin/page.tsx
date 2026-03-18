'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Stats { users: number; orders: number; vendors: number; machines: number; production: number }

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetch('http://localhost:4000/admin/stats', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json()).then(d => setStats(d)).catch(() => {})
  }, [])

  const menu = [
    { label:'Хэрэглэгчид', href:'/admin/users',      desc:'Бүртгэл, эрх, баталгаажуулалт', color:'#378ADD' },
    { label:'Захиалгууд',  href:'/admin/orders',     desc:'Статус, дэлгэрэнгүй, хянах',    color:'var(--orange)' },
    { label:'Vendors',     href:'/admin/vendors',    desc:'Үйлдвэр, машин, байршил',        color:'#7F77DD' },
    { label:'Машинууд',   href:'/admin/machines',   desc:'Тоног төхөөрөмж, хүчин чадал',   color:'#1D9E75' },
    { label:'Категори',   href:'/admin/categories', desc:'Бүтээгдэхүүний ангилал',          color:'#F59E0B' },
    { label:'Тохиргоо',   href:'/admin/settings',   desc:'Системийн тохиргоо',              color:'#e24b4a' },
  ]

  const statCards = [
    { label:'Хэрэглэгч',   key:'users',      color:'#378ADD', trend:'+12%' },
    { label:'Захиалга',    key:'orders',     color:'var(--orange)', trend:'+8%'  },
    { label:'Vendor',      key:'vendors',    color:'#7F77DD', trend:'+3%'  },
    { label:'Машин',       key:'machines',   color:'#1D9E75', trend:'+5%'  },
    { label:'Үйлдвэрлэл', key:'production', color:'#e24b4a', trend:'+21%' },
  ]

  const getVal = (key: string) => {
    if (!stats) return 0
    if (key === 'users') return stats.users
    if (key === 'orders') return stats.orders
    if (key === 'vendors') return stats.vendors
    if (key === 'machines') return stats.machines
    return stats.production
  }

  const now = new Date().toLocaleDateString('mn-MN', { year:'numeric', month:'long', day:'numeric' })

  return (
    <div style={{minHeight:'100vh', background:'#0A0A0A', fontFamily:"'Segoe UI',system-ui,sans-serif", color:'#F1F5F9'}}>
      <style>{'.mc{transition:border-color .2s,transform .15s,background .2s}.mc:hover{transform:translateY(-2px)}'}</style>

      <div style={{background:'#0F0F0F', borderBottom:'1px solid #1A1A1A', padding:'0 28px', height:'54px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10}}>
        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
          <div style={{width:'28px', height:'28px', background:'var(--orange)', borderRadius:'7px', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <svg width="14" height="14" fill="#fff" viewBox="0 0 18 18"><rect x="2" y="2" width="6" height="6" rx="1.5"/><rect x="10" y="2" width="6" height="6" rx="1.5" opacity=".6"/><rect x="2" y="10" width="6" height="6" rx="1.5" opacity=".6"/><rect x="10" y="10" width="6" height="6" rx="1.5" opacity=".85"/></svg>
          </div>
          <span style={{fontSize:'14px', fontWeight:600}}><span style={{color:'var(--orange)'}}>Biz</span>Print</span>
          <span style={{color:'#222', margin:'0 6px'}}>›</span>
          <div style={{display:'flex', alignItems:'center', gap:'6px', background:'var(--orange-08)', border:'1px solid var(--orange-15)', borderRadius:'6px', padding:'3px 10px'}}>
            <div style={{width:'5px', height:'5px', borderRadius:'50%', background:'var(--orange)'}}></div>
            <span style={{fontSize:'12px', color:'var(--orange)', fontWeight:500}}>Admin</span>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <span style={{fontSize:'12px', color:'#2A2A2A'}}>{now}</span>
          <div style={{display:'flex', alignItems:'center', gap:'6px', background:'rgba(29,158,117,0.08)', border:'1px solid rgba(29,158,117,0.15)', borderRadius:'6px', padding:'3px 10px'}}>
            <div style={{width:'5px', height:'5px', borderRadius:'50%', background:'#1D9E75'}}></div>
            <span style={{fontSize:'12px', color:'#1D9E75', fontWeight:500}}>Live</span>
          </div>
          <button onClick={() => router.push('/dashboard')} style={{background:'transparent', border:'1px solid #1E1E1E', color:'#444', padding:'6px 14px', borderRadius:'7px', fontSize:'12px', cursor:'pointer', fontFamily:'inherit'}}>← Dashboard</button>
        </div>
      </div>

      <div style={{padding:'28px 32px', maxWidth:'1100px', margin:'0 auto'}}>
        <div style={{marginBottom:'28px', paddingBottom:'20px', borderBottom:'1px solid #141414'}}>
          <h1 style={{fontSize:'22px', fontWeight:600, margin:0, letterSpacing:'-0.4px'}}>Ерөнхий удирдлага</h1>
          <p style={{fontSize:'13px', color:'#444', margin:'5px 0 0'}}>BizPrint экосистемийн бүх модулийг энд удирдана</p>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'10px', marginBottom:'32px'}}>
          {statCards.map(c => (
            <div key={c.key} style={{background:'#0F0F0F', border:'1px solid #1A1A1A', borderRadius:'12px', padding:'18px 16px', position:'relative', overflow:'hidden'}}>
              <div style={{position:'absolute', top:0, left:0, right:0, height:'2px', background:c.color, opacity:0.5}}></div>
              <div style={{fontSize:'11px', color:'#444', textTransform:'uppercase' as const, letterSpacing:'0.07em', marginBottom:'10px'}}>{c.label}</div>
              <div style={{fontSize:'32px', fontWeight:600, color:c.color, lineHeight:1, letterSpacing:'-1px', marginBottom:'10px'}}>{getVal(c.key)}</div>
              <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <div style={{flex:1, height:'2px', background:'#1A1A1A', borderRadius:'1px'}}>
                  <div style={{width:'50%', height:'100%', background:c.color, opacity:0.4, borderRadius:'1px'}}></div>
                </div>
                <span style={{fontSize:'11px', color:c.color, fontWeight:500}}>{c.trend}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px'}}>
          <span style={{fontSize:'11px', color:'#2A2A2A', fontWeight:500, textTransform:'uppercase' as const, letterSpacing:'0.08em'}}>Модулиуд</span>
          <div style={{flex:1, height:'1px', background:'#141414'}}></div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px'}}>
          {menu.map(item => (
            <button key={item.href} className="mc"
              onClick={() => router.push(item.href)}
              onMouseEnter={() => setHovered(item.href)}
              onMouseLeave={() => setHovered(null)}
              style={{background:hovered===item.href?'#111':'#0F0F0F', border:'1px solid '+(hovered===item.href?item.color+'44':'#1A1A1A'), borderRadius:'12px', padding:'22px', textAlign:'left' as const, cursor:'pointer', width:'100%', fontFamily:"'Segoe UI',system-ui,sans-serif", position:'relative', overflow:'hidden'}}>
              {hovered===item.href && <div style={{position:'absolute', top:0, left:0, right:0, height:'2px', background:item.color, opacity:0.7}}></div>}
              <div style={{width:'36px', height:'36px', borderRadius:'9px', background:item.color+'15', border:'1px solid '+item.color+'25', marginBottom:'14px'}}></div>
              <div style={{fontSize:'14px', fontWeight:600, color:'#F1F5F9', marginBottom:'4px'}}>{item.label}</div>
              <div style={{fontSize:'12px', color:'#444', lineHeight:1.5}}>{item.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}