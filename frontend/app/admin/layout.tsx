'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import NotificationBell from '@/components/NotificationBell'

const NAV = [
  { section:'ҮНДСЭН', items:[
    { label:'Dashboard',    href:'/admin',             icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { label:'Хэрэглэгчид', href:'/admin/users',        icon:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm8 0a3 3 0 100-6 3 3 0 000 6zm4 10v-2a3 3 0 00-3-3' },
    { label:'Үнийн саналууд', href:'/admin/quotes', icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label:'Workflow', href:'/admin/workflow', icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { label:'Chat', href:'/admin/chat', icon:'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { label:'Захиалгууд',  href:'/admin/orders',       icon:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label:'Commission', href:'/admin/commission', icon:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label:'Vendors',     href:'/admin/vendors',      icon:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10' },
    { label:'Машинууд',   href:'/admin/machines',     icon:'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
  ]},
  { section:'КОНТЕНТ', items:[
    { label:'Mega Menu', href:'/admin/menus', icon:'M4 6h16M4 12h16M4 18h16' },
    { label:'CMS тохиргоо', href:'/admin/cms',         icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0' },
    { label:'Баннерууд',   href:'/admin/banners',      icon:'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label:'Хуудсууд',   href:'/admin/pages',        icon:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label:'Категори',   href:'/admin/categories',   icon:'M4 6h16M4 10h16M4 14h16M4 18h16' },
  ]},
  { section:'БИЗНЕС', items:[
    { label:'Бүтээгдэхүүн', href:'/admin/products',   icon:'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { label:'Payments',    href:'/admin/payments',    icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { label:'Reports',     href:'/admin/reports',     icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { label:'Цаасны төрлүүд', href:'/admin/paper-types', icon:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label:'Quote Engine', href:'/admin/quote-engine', icon:'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M12 7h.01M9 3H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2h-4M9 3a2 2 0 002 2h2a2 2 0 002-2M9 3a2 2 0 012-2h2a2 2 0 012 2' },
    { label:'Үнийн дүрмүүд', href:'/admin/pricing-rules', icon:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label:'Мөнгө татах', href:'/admin/wallet-requests', icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  ]},
  { section:'СИСТЕМ', items:[
    { label:'Маркетинг', href:'/admin/marketing', icon:'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
    { label:'Тохиргоо',   href:'/admin/settings',    icon:'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
  ]},
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const path = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [userId, setUserId] = useState<string|undefined>(undefined)
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => {
    const t = localStorage.getItem('token')
    if (t) fetch('http://localhost:4000/auth/me', {headers:{Authorization:'Bearer '+t}}).then(r=>r.json()).then(d=>setUserId(d.id)).catch(()=>{})
  }, [])
  const W = collapsed ? '56px' : '224px'

  const activeLabel = NAV.flatMap(g=>g.items).find(i=>i.href===path)?.label || 'Admin'

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'var(--bg)',fontFamily:"'Segoe UI',system-ui,sans-serif",color:'var(--text)'}}>
      <style>{'.sb{scrollbar-width:none}.nb:hover{background:var(--surface2)!important;color:var(--text2)!important}'}</style>

      {/* SIDEBAR */}
      <div style={{width:W,minWidth:W,height:'100vh',background:'var(--surface)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',transition:'all 0.25s',overflow:'hidden',position:'sticky',top:0,zIndex:20,}}>

        {/* LOGO */}
        <div style={{height:'54px',display:'flex',alignItems:'center',justifyContent:collapsed?'center':'space-between',padding:collapsed?'0':'0 14px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
          {!collapsed&&(
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <div style={{width:'26px',height:'26px',background:'var(--orange)',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="13" height="13" fill="#fff" viewBox="0 0 18 18"><rect x="2" y="2" width="6" height="6" rx="1.5"/><rect x="10" y="2" width="6" height="6" rx="1.5" opacity=".6"/><rect x="2" y="10" width="6" height="6" rx="1.5" opacity=".6"/><rect x="10" y="10" width="6" height="6" rx="1.5" opacity=".85"/></svg>
              </div>
              <div>
                <div style={{fontSize:'13px',fontWeight:600,lineHeight:1}}><span style={{color:'var(--orange)'}}>Biz</span>Print</div>
                <div style={{fontSize:'10px',color:'var(--text3)',marginTop:'1px'}}>Admin Panel</div>
              </div>
            </div>
          )}
          <button onClick={()=>setCollapsed(!collapsed)}
            style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--text3)',padding:'4px',display:'flex',borderRadius:'4px',flexShrink:0}}
            onMouseEnter={e=>(e.currentTarget.style.color='var(--text2)')}
            onMouseLeave={e=>(e.currentTarget.style.color='var(--text3)')}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {collapsed?<path d="M9 18l6-6-6-6"/>:<path d="M15 18l-6-6 6-6"/>}
            </svg>
          </button>
        </div>

        {/* NAV */}
        <div className="sb" style={{flex:1,overflowY:'auto',padding:'6px'}}>
          {NAV.map(group=>(
            <div key={group.section} style={{marginBottom:'2px'}}>
              {!collapsed&&(
                <div style={{fontSize:'10px',fontWeight:600,color:'var(--text4)',letterSpacing:'0.1em',padding:'10px 10px 4px',textTransform:'uppercase'}}>{group.section}</div>
              )}
              {group.items.map(item=>{
                const active = path===item.href || (item.href!=='/admin' && path.startsWith(item.href))
                return(
                  <button key={item.href} onClick={()=>router.push(item.href)}
                    title={collapsed?item.label:''}
                    className="nb"
                    style={{width:'100%',display:'flex',alignItems:'center',gap:'9px',padding:collapsed?'9px 0':'8px 10px',borderRadius:'8px',border:'none',background:active?'var(--orange-10)':'transparent',color:active?'var(--orange)':'var(--text3)',cursor:'pointer',fontFamily:"'Segoe UI',system-ui,sans-serif",fontSize:'13px',fontWeight:active?500:400,justifyContent:collapsed?'center':'flex-start',marginBottom:'1px',transition:'all .15s'}}>
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{flexShrink:0}}><path d={item.icon}/></svg>
                    {!collapsed&&<span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.label}</span>}
                    {!collapsed&&active&&<div style={{marginLeft:'auto',width:'5px',height:'5px',borderRadius:'50%',background:'var(--orange)',flexShrink:0}}/>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* BOTTOM */}
        <div style={{borderTop:'1px solid var(--border)',padding:'8px 6px',flexShrink:0}}>
          <button onClick={()=>router.push('/')}
            className="nb"
            style={{width:'100%',display:'flex',alignItems:'center',gap:'9px',padding:collapsed?'8px 0':'8px 10px',borderRadius:'8px',border:'none',background:'transparent',color:'var(--text4)',cursor:'pointer',fontFamily:"'Segoe UI',system-ui,sans-serif",fontSize:'13px',justifyContent:collapsed?'center':'flex-start',marginBottom:'2px',transition:'all .15s'}}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24" style={{flexShrink:0}}><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            {!collapsed&&<span>Сайт харах</span>}
          </button>
          <button onClick={()=>{localStorage.clear();router.push('/login')}}
            style={{width:'100%',display:'flex',alignItems:'center',gap:'9px',padding:collapsed?'8px 0':'8px 10px',borderRadius:'8px',border:'none',background:'transparent',color:'var(--text4)',cursor:'pointer',fontFamily:"'Segoe UI',system-ui,sans-serif",fontSize:'13px',justifyContent:collapsed?'center':'flex-start',transition:'all .15s'}}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(226,75,74,0.08)';e.currentTarget.style.color='#e24b4a'}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text4)'}}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24" style={{flexShrink:0}}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            {!collapsed&&<span>Гарах</span>}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>

        {/* TOPBAR */}
        <div style={{background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'0 24px',height:'54px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <button onClick={()=>setMobileOpen(!mobileOpen)} style={{display:'none',background:'transparent',border:'none',cursor:'pointer',color:'var(--text2)',padding:'4px',borderRadius:'6px'}} className='show-mobile'><svg width='18' height='18' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><path d='M4 6h16M4 12h16M4 18h16'/></svg></button>
              <div style={{display:'flex',alignItems:'center',gap:'6px',background:'var(--orange-08)',border:'1px solid var(--orange-15)',borderRadius:'6px',padding:'3px 10px'}}>
              <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'var(--orange)'}}/>
              <span style={{fontSize:'12px',color:'var(--orange)',fontWeight:500}}>{activeLabel}</span>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'6px',background:'rgba(29,158,117,0.08)',border:'1px solid rgba(29,158,117,0.15)',borderRadius:'6px',padding:'3px 10px'}}>
              <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'#1D9E75'}}/>
              <span style={{fontSize:'12px',color:'#1D9E75',fontWeight:500}}>Live</span>
            </div>
            <NotificationBell userId={userId}/><ThemeToggle/>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={{flex:1,overflowY:'auto'}}>
          {children}
        </div>
      </div>
    </div>
  )
}



