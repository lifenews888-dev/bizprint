'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { clearAuthSession } from '@/lib/auth-session'

const FONT = "'Segoe UI',system-ui,sans-serif"
const ORANGE = '#FF6B00'

const NAV = [
  { section: 'Удирдлага', items: [
    { label: 'Dashboard', href: '/dashboard/customer/home', icon: '🏠' },
    { label: 'Нэрийн хуудас', href: '/dashboard/customer/business-cards', icon: '🪪' },
    { label: 'Захиалгууд', href: '/dashboard/customer/orders', icon: '📦' },
    { label: 'Үнийн санал', href: '/dashboard/customer/quotes', icon: '💰' },
    { label: 'Нэхэмжлэх', href: '/dashboard/customer/invoices', icon: '🧾' },
    { label: 'Дижитал карт', href: '/dashboard/customer/digital-card', icon: '📱' },
    { label: 'Хэтэвч', href: '/dashboard/customer/wallet', icon: '💳' },
  ]},
  { section: 'Дижитал', items: [
    { label: 'Урилгууд', href: '/dashboard/customer/invitations', icon: '💌' },
    { label: 'Бүтээгдэхүүн QR', href: '/dashboard/customer/product-qr', icon: '📦' },
    { label: 'Loyalty карт', href: '/dashboard/customer/loyalty', icon: '⭐' },
    { label: 'Кампанит', href: '/dashboard/customer/campaigns', icon: '🎯' },
    { label: 'Эрх & Багц', href: '/dashboard/customer/subscription', icon: '💎' },
    { label: 'Аналитик', href: '/dashboard/customer/analytics', icon: '📊' },
  ]},
  { section: 'Бусад', items: [
    { label: 'Контент захиалах', href: '/dashboard/customer/ugc', icon: '🎨' },
    { label: 'Zoom уулзалт', href: '/dashboard/customer/meetings', icon: '📹' },
    { label: 'Чат', href: '/dashboard/customer/chat', icon: '💬' },
  ]},
]

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const path = usePathname()
  const [user, setUser] = useState<{ full_name?: string } | null>(null)
  const [mobileNav, setMobileNav] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    const stored = localStorage.getItem('user')
    const timer = setTimeout(() => {
      if (stored) try { setUser(JSON.parse(stored) as { full_name?: string }) } catch {}
    }, 0)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: FONT, color: 'var(--text)' }}>
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:flex" style={{ width: 224, minWidth: 224, height: '100vh', background: 'var(--surface)', borderRight: '1px solid var(--border)', flexDirection: 'column', position: 'sticky', top: 0, zIndex: 20 }}>
        {/* Logo */}
        <div onClick={() => router.push('/')} style={{ height: 54, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
          <div style={{ width: 26, height: 26, background: ORANGE, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="13" height="13" fill="#fff" viewBox="0 0 18 18"><rect x="2" y="2" width="6" height="6" rx="1.5"/><rect x="10" y="2" width="6" height="6" rx="1.5" opacity=".6"/><rect x="2" y="10" width="6" height="6" rx="1.5" opacity=".6"/><rect x="10" y="10" width="6" height="6" rx="1.5" opacity=".85"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}><span style={{ color: ORANGE }}>Biz</span>Print</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>Dashboard</div>
          </div>
        </div>

        {/* User */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: ORANGE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name || 'Хэрэглэгч'}</div>
            <span style={{ fontSize: 10, color: ORANGE, background: 'rgba(255,107,0,0.1)', padding: '1px 6px', borderRadius: 20 }}>customer</span>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '6px', overflowY: 'auto' }}>
          {NAV.map(group => (
            <div key={group.section}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text4)', letterSpacing: '0.1em', padding: '10px 10px 4px', textTransform: 'uppercase' }}>{group.section}</div>
              {group.items.map(item => {
                const active = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href))
                return (
                  <button key={item.href} onClick={() => router.push(item.href)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
                    borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, marginBottom: 1,
                    background: active ? 'rgba(255,107,0,0.1)' : 'transparent',
                    color: active ? ORANGE : 'var(--text3)',
                    fontWeight: active ? 500 : 400,
                  }}>
                    <span style={{ fontSize: 14, width: 15 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '8px 6px', flexShrink: 0 }}>
          <button onClick={() => router.push('/')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text4)', cursor: 'pointer', fontSize: 13, marginBottom: 2 }}>↗ Сайт харах</button>
          <button onClick={() => { clearAuthSession(); router.push('/') }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text4)', cursor: 'pointer', fontSize: 13 }}>🚪 Гарах</button>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-30">
        <button onClick={() => setMobileNav(!mobileNav)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text)' }}>
          {mobileNav ? '✕' : '☰'}
        </button>
        <div style={{ fontSize: 15, fontWeight: 600 }}><span style={{ color: ORANGE }}>Biz</span>Print</div>
        <div style={{ width: 28 }} />
      </div>

      {/* Mobile nav overlay */}
      {mobileNav && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileNav(false)}>
          <div className="w-[260px] h-full bg-[var(--surface)] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: ORANGE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{user?.full_name || 'Хэрэглэгч'}</div>
                <span style={{ fontSize: 10, color: ORANGE }}>customer</span>
              </div>
            </div>
            <div style={{ padding: 6 }}>
              {NAV.map(group => (
                <div key={group.section}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text4)', letterSpacing: '0.1em', padding: '10px 10px 4px', textTransform: 'uppercase' }}>{group.section}</div>
                  {group.items.map(item => {
                    const active = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href))
                    return (
                      <button key={item.href} onClick={() => { router.push(item.href); setMobileNav(false) }} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 10px',
                        borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 1,
                        background: active ? 'rgba(255,107,0,0.1)' : 'transparent',
                        color: active ? ORANGE : 'var(--text3)', fontWeight: active ? 500 : 400,
                      }}>
                        <span style={{ fontSize: 16, width: 18 }}>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', padding: '8px 6px' }}>
              <button onClick={() => router.push('/')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text4)', cursor: 'pointer', fontSize: 14 }}>↗ Сайт</button>
              <button onClick={() => { clearAuthSession(); router.push('/') }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text4)', cursor: 'pointer', fontSize: 14 }}>🚪 Гарах</button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  )
}
