'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

interface NavItem { label: string; href: string; icon: string }
interface NavGroup { section: string; items: NavItem[] }

interface Props {
  children: React.ReactNode
  navGroups: NavGroup[]
  user?: { full_name?: string; email?: string; role?: string }
  onLogout?: () => void
}

export default function DashboardLayout({ children, navGroups, user, onLogout }: Props) {
  const router    = useRouter()
  const path      = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const W = collapsed ? '56px' : '224px'

  const activeLabel = navGroups.flatMap(g => g.items).find(i => i.href === path)?.label || 'Dashboard'

  const logout = () => {
    localStorage.clear()
    if (onLogout) onLogout()
    else router.push('/')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Segoe UI',system-ui,sans-serif", color: 'var(--text)' }}>
      <style>{'.sb{scrollbar-width:none}.nb:hover{background:var(--surface2)!important;color:var(--text2)!important}'}</style>

      {/* â”€â”€ SIDEBAR â”€â”€ */}
      <div style={{ width: W, minWidth: W, height: '100vh', background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', transition: 'width 0.2s', overflow: 'hidden', position: 'sticky', top: 0, zIndex: 20 }}>

        {/* Logo */}
        <div style={{ height: '54px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? '0' : '0 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '26px', height: '26px', background: 'var(--orange)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="13" height="13" fill="#fff" viewBox="0 0 18 18">
                  <rect x="2" y="2" width="6" height="6" rx="1.5"/>
                  <rect x="10" y="2" width="6" height="6" rx="1.5" opacity=".6"/>
                  <rect x="2" y="10" width="6" height="6" rx="1.5" opacity=".6"/>
                  <rect x="10" y="10" width="6" height="6" rx="1.5" opacity=".85"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1 }}>
                  <span style={{ color: 'var(--orange)' }}>Biz</span>Print
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '1px' }}>
                  {user?.role || 'Dashboard'}
                </div>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '4px', display: 'flex', borderRadius: '4px', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {collapsed ? <path d="M9 18l6-6-6-6"/> : <path d="M15 18l-6-6 6-6"/>}
            </svg>
          </button>
        </div>

        {/* User info */}
        {!collapsed && user && (
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--orange)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, flexShrink: 0 }}>
              {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.full_name || user.email}
              </div>
              <span style={{ fontSize: '10px', color: 'var(--orange)', background: 'var(--orange-10)', padding: '1px 6px', borderRadius: '20px' }}>
                {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="sb" style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
          {navGroups.map(group => (
            <div key={group.section} style={{ marginBottom: '2px' }}>
              {!collapsed && (
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text4)', letterSpacing: '0.1em', padding: '10px 10px 4px', textTransform: 'uppercase' }}>
                  {group.section}
                </div>
              )}
              {group.items.map(item => {
                const active = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href))
                return (
                  <button key={item.href}
                    onClick={() => router.push(item.href)}
                    title={collapsed ? item.label : ''}
                    className="nb"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: collapsed ? '9px 0' : '8px 10px', borderRadius: '8px', border: 'none', background: active ? 'var(--orange-10)' : 'transparent', color: active ? 'var(--orange)' : 'var(--text3)', cursor: 'pointer', fontFamily: "'Segoe UI',system-ui,sans-serif", fontSize: '13px', fontWeight: active ? 500 : 400, justifyContent: collapsed ? 'center' : 'flex-start', marginBottom: '1px', transition: 'all .15s' }}>
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <path d={item.icon}/>
                    </svg>
                    {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                    {!collapsed && active && <div style={{ marginLeft: 'auto', width: '5px', height: '5px', borderRadius: '50%', background: 'var(--orange)', flexShrink: 0 }}/>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '8px 6px', flexShrink: 0 }}>
          <button onClick={() => router.push('/')} className="nb"
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: collapsed ? '8px 0' : '8px 10px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text4)', cursor: 'pointer', fontFamily: "'Segoe UI',system-ui,sans-serif", fontSize: '13px', justifyContent: collapsed ? 'center' : 'flex-start', marginBottom: '2px', transition: 'all .15s' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            {!collapsed && <span>Ð¡Ð°Ð¹Ñ‚ Ñ…Ð°Ñ€Ð°Ñ…</span>}
          </button>
          <button onClick={logout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: collapsed ? '8px 0' : '8px 10px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text4)', cursor: 'pointer', fontFamily: "'Segoe UI',system-ui,sans-serif", fontSize: '13px', justifyContent: collapsed ? 'center' : 'flex-start', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(226,75,74,0.08)'; e.currentTarget.style.color = '#e24b4a' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text4)' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            {!collapsed && <span>Ð“Ð°Ñ€Ð°Ñ…</span>}
          </button>
        </div>
      </div>

      {/* â”€â”€ MAIN â”€â”€ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 24px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--orange-08)', border: '1px solid var(--orange-15)', borderRadius: '6px', padding: '3px 10px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--orange)' }}/>
              <span style={{ fontSize: '12px', color: 'var(--orange)', fontWeight: 500 }}>{activeLabel}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.15)', borderRadius: '6px', padding: '3px 10px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1D9E75' }}/>
              <span style={{ fontSize: '12px', color: '#1D9E75', fontWeight: 500 }}>Live</span>
            </div>
            <ThemeToggle/>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
