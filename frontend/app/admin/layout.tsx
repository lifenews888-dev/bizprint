'use client'
import React, { useState, useEffect } from 'react'
import React, { useRouter, usePathname } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import NotificationBell from '@/components/NotificationBell'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

const NAV = [
  { section: 'Хяналт', items: [
    { label: 'Хяналтын самбар', href: '/admin',      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' },
    { label: 'Тайлан',    href: '/admin/reports',    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { label: 'Маркетинг', href: '/admin/marketing',  icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
  ]},
  { section: 'Захиалга & Workflow', items: [
    { label: 'Захиалгууд',      href: '/admin/orders',          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Дизайн хүсэлт',   href: '/admin/design-requests', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    { label: 'Үнийн санал',     href: '/admin/pricing-rules',   icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { label: 'Ажлын урсгал',    href: '/admin/workflow',        icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    { label: 'Тоног төхөөрөмж', href: '/admin/machines',        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573' },
  ]},
  { section: 'Бүтээгдэхүүн & Үнэ', items: [
    { label: 'Бүтээгдэхүүн', href: '/admin/products',      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { label: 'Ангилал',      href: '/admin/categories',    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { label: 'Загвар',       href: '/admin/templates',     icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { label: 'Quote буулгагч', href: '/admin/quote-engine', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01' },
  ]},
  { section: 'Хэрэглэгч & Партнер', items: [
    { label: 'Хэрэглэгчид', href: '/admin/users',       icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197' },
    { label: 'Вендорууд',   href: '/admin/vendors',     icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  ]},
  { section: 'Санхүү', items: [
    { label: 'Комисс',         href: '/admin/commission',       icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    { label: 'Wallet хүсэлт', href: '/admin/wallet-requests',  icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  ]},
  { section: 'Контент & CMS', items: [
    { label: 'Баннер',    href: '/admin/banners',  icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Хуудсууд', href: '/admin/pages',    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Цэс',      href: '/admin/menus',    icon: 'M4 6h16M4 12h16M4 18h16' },
    { label: 'Тохиргоо', href: '/admin/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ]},
  { section: 'Харилцаа', items: [
    { label: 'Чат',      href: '/admin/chat',     icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { label: 'Webhooks', href: '/admin/webhooks', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
  ]},
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const path = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [roleReqCount, setRoleReqCount] = useState(0)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('token')) : null
    if (!token) { router.push('/login'); return }
    const stored = localStorage.getItem('user')
    if (stored) { try { setUser(JSON.parse(stored)) } catch {} }
    // Fetch pending role requests count
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://bizprint-production.up.railway.app'}/admin/role-requests', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setRoleReqCount(Array.isArray(d) ? d.length : 0))
      .catch(() => {})
  }, [])

  const W = collapsed ? '56px' : '230px'
  const activeItem = NAV.flatMap(g => g.items).find(i => i.href === path)
  const activeLabel = activeItem?.label || 'Хяналтын самбар'

  const logout = () => { localStorage.clear(); router.push('/') }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: F, color: 'var(--text)' }}>
      <style>{`
        .sb{scrollbar-width:none}
        .nb{transition:all .15s}
        .nb:hover{background:var(--surface2)!important}
      `}</style>

      {mobileOpen && <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />}

      {/* ── Sidebar ── */}
      <div style={{
        width: W, minWidth: W, height: '100vh', background: 'var(--surface)',
        borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s', overflow: 'hidden', position: 'sticky', top: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ height: '52px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? '0' : '0 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {!collapsed && (
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <div style={{ width: '26px', height: '26px', background: '#FF6B00', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>B</span>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>
                  <span style={{ color: '#FF6B00' }}>Biz</span>Print
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Admin Panel</div>
              </div>
            </a>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '4px', borderRadius: '4px', flexShrink: 0 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
            </svg>
          </button>
        </div>

        {/* User info */}
        {!collapsed && (
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B00, #FF8C42)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
              {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text)' }}>
                {user?.full_name || 'Системийн Админ'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || 'admin@bizprint.mn'}
              </div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <div className="sb" style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
          {NAV.map(group => (
            <div key={group.section} style={{ marginBottom: '4px' }}>
              {!collapsed && (
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text4)', letterSpacing: '0.1em', padding: '10px 10px 4px', textTransform: 'uppercase' }}>
                  {group.section}
                </div>
              )}
              {group.items.map(item => {
                const active = path === item.href || (item.href !== '/admin' && path.startsWith(item.href))
                return (
                  <button key={item.href} onClick={() => { router.push(item.href); setMobileOpen(false) }}
                    title={collapsed ? item.label : ''} className="nb"
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
                      padding: collapsed ? '9px 0' : '8px 10px', borderRadius: '8px', border: 'none',
                      background: active ? 'rgba(255,107,0,0.1)' : 'transparent',
                      color: active ? '#FF6B00' : 'var(--text3)',
                      cursor: 'pointer', fontFamily: F, fontSize: '13px',
                      fontWeight: active ? 500 : 400,
                      justifyContent: collapsed ? 'center' : 'flex-start', marginBottom: '1px',
                    }}>
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <path d={item.icon} />
                    </svg>
                    {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                    {!collapsed && roleReqCount > 0 && item.href === '/admin/users' && (
                      <span style={{ marginLeft: 'auto', fontSize: 10, background: '#EF4444', color: '#fff', padding: '1px 6px', borderRadius: 99, fontWeight: 700, flexShrink: 0 }}>{roleReqCount}</span>
                    )}
                    {!collapsed && active && item.href !== '/admin/users' && <div style={{ marginLeft: 'auto', width: '5px', height: '5px', borderRadius: '50%', background: '#FF6B00', flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Bottom actions */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '8px 6px', flexShrink: 0 }}>
          <button onClick={() => router.push('/')} className="nb" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: collapsed ? '8px 0' : '8px 10px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text4)', cursor: 'pointer', fontFamily: F, fontSize: '13px', justifyContent: collapsed ? 'center' : 'flex-start', marginBottom: '2px' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            {!collapsed && <span>Сайт харах</span>}
          </button>
          <button onClick={logout} className="nb" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: collapsed ? '8px 0' : '8px 10px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text4)', cursor: 'pointer', fontFamily: F, fontSize: '13px', justifyContent: collapsed ? 'center' : 'flex-start' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(226,75,74,0.08)'; e.currentTarget.style.color = '#e24b4a' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text4)' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {!collapsed && <span>Гарах</span>}
          </button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 24px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setMobileOpen(true)} style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '4px' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.15)', borderRadius: '6px', padding: '3px 10px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#FF6B00' }} />
              <span style={{ fontSize: '12px', color: '#FF6B00', fontWeight: 500 }}>{activeLabel}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.15)', borderRadius: '6px', padding: '3px 10px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1D9E75' }} />
              <span style={{ fontSize: '12px', color: '#1D9E75', fontWeight: 500 }}>Live</span>
            </div>
            <NotificationBell userId={user?.id} />
            <ThemeToggle />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
