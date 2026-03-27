'use client'
import { usePathname } from 'next/navigation'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

const TABS = [
  {
    label: 'Нүүр',
    href: '/',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill={active ? '#FF6B00' : 'none'} stroke={active ? '#FF6B00' : '#999'} strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
        <path d="M9 21V12h6v9" fill="none" stroke={active ? '#fff' : '#999'} strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    label: 'Дэлгүүр',
    href: '/shop',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" stroke={active ? '#FF6B00' : '#999'} strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
    ),
  },
  {
    label: 'Хадгалсан',
    href: '/dashboard/customer/saved',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill={active ? '#FF6B00' : 'none'} stroke={active ? '#FF6B00' : '#999'} strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
      </svg>
    ),
    center: true,
  },
  {
    label: 'Захиалга',
    href: '/dashboard/customer/orders',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" stroke={active ? '#FF6B00' : '#999'} strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <path d="M7 8h10M7 12h10M7 16h6"/>
      </svg>
    ),
  },
  {
    label: 'Профайл',
    href: '/dashboard/customer',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill={active ? '#FF6B00' : 'none'} stroke={active ? '#FF6B00' : '#999'} strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" fill="none"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Spacer */}
      <div style={{ height: 72 }} className="mobile-bottom-spacer" />

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500,
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'stretch',
        fontFamily: F, height: 72,
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
      }} className="mobile-bottom-nav">
        {TABS.map(tab => {
          const active = isActive(tab.href)

          if (tab.center) {
            return (
              <a key={tab.href} href={tab.href} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', textDecoration: 'none', position: 'relative',
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  background: active ? '#FF6B00' : 'linear-gradient(135deg, #FF6B00, #e8a87c)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: -22,
                  boxShadow: '0 6px 20px rgba(255,107,0,0.35)',
                  transition: 'transform 0.2s',
                }}>
                  <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                  </svg>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#FF6B00', marginTop: 4 }}>{tab.label}</span>
              </a>
            )
          }

          return (
            <a key={tab.href} href={tab.href} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', textDecoration: 'none', gap: 4, paddingTop: 4,
              position: 'relative',
            }}>
              {active && (
                <div style={{
                  position: 'absolute', top: 0, width: 24, height: 3,
                  borderRadius: '0 0 3px 3px', background: '#FF6B00',
                }} />
              )}
              {tab.icon(active)}
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 500,
                color: active ? '#FF6B00' : '#999',
                transition: 'color 0.15s',
              }}>
                {tab.label}
              </span>
            </a>
          )
        })}
      </nav>

      <style>{`
        .mobile-bottom-nav { display: none !important; }
        .mobile-bottom-spacer { display: none !important; }
        @media (max-width: 768px) {
          .mobile-bottom-nav { display: flex !important; }
          .mobile-bottom-spacer { display: block !important; }
        }
      `}</style>
    </>
  )
}
