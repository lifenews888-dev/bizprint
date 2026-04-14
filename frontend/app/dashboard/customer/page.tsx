'use client'
import { apiFetch, getToken } from '@/lib/api'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

const MENU_ITEMS = [
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="#3B82F6" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 8h10M7 12h10M7 16h6"/>
      </svg>
    ),
    iconBg: '#EFF6FF',
    label: 'Миний захиалгууд',
    sub: '',
    href: '/dashboard/customer/orders',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="#10B981" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><circle cx="17" cy="15" r="1.5" fill="#10B981" stroke="none"/>
      </svg>
    ),
    iconBg: '#ECFDF5',
    label: 'Хэтэвч & Төлбөр',
    sub: '',
    href: '/dashboard/customer/wallet',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="#FF6B00" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
    iconBg: '#FFF7ED',
    label: 'Үнийн санал авах',
    sub: '',
    href: '/quote',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="#8B5CF6" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
    iconBg: '#F5F3FF',
    label: 'Урамшуулал & Оноо',
    sub: '',
    href: '/dashboard/customer/rewards',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="#F59E0B" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    iconBg: '#FFFBEB',
    label: 'Эрх & Багц',
    sub: 'Membership, QR, Loyalty үнэ',
    href: '/dashboard/customer/subscription',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="#EC4899" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>
      </svg>
    ),
    iconBg: '#FDF2F8',
    label: 'Дижитал карт',
    sub: 'QR код + контакт хуваалцах',
    href: '/dashboard/customer/digital-card',
  },
]

export default function CustomerProfile() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [wallet, setWallet] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/login'); return }

    Promise.all([
      apiFetch<any>('/auth/me').catch(() => null),
      apiFetch<any>('/orders?limit=10').catch(() => []),
      apiFetch<any>('/wallet/balance').catch(() => null),
    ]).then(([u, o, w]) => {
      setUser(u)
      setOrders(Array.isArray(o) ? o : (o?.data ?? []))
      setWallet(w)

      // Set dynamic sub-text for menu items
      const orderCount = (Array.isArray(o) ? o : (o?.data ?? [])).filter((ord: any) => ord.status === 'processing').length
      MENU_ITEMS[0].sub = orderCount > 0 ? `${orderCount} боловсруулж байна` : 'Захиалга байхгүй'
      MENU_ITEMS[1].sub = `₮${Number(w?.balance || 0).toLocaleString()} үлдэгдэл`
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9F9F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
        <div style={{ width: 40, height: 40, border: '3px solid #F0F0F0', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const totalOrders = orders.length
  const points = Number(wallet?.points || 0)
  const savedItems = 0 // placeholder

  return (
    <div style={{ minHeight: '100vh', background: '#F9F9F7', fontFamily: F }}>

      {/* Header */}
      <div style={{
        background: '#fff', padding: '16px 20px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 64, zIndex: 100,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: 0 }}>Миний профайл</h1>
        <button
          onClick={() => {
            localStorage.removeItem('token')
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('user')
            router.push('/login')
          }}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 6,
          }}
        >
          <svg width="22" height="22" fill="none" stroke="#999" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>

      {/* Profile card */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px 24px' }}>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF6B00, #e8a87c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 16,
          boxShadow: '0 8px 24px rgba(255,107,0,0.25)',
        }}>
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>

        <div style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 4 }}>
          {user?.name || 'Хэрэглэгч'}
        </div>
        <div style={{ fontSize: 14, color: '#999', marginBottom: 24 }}>
          {user?.email}
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', width: '100%', maxWidth: 360,
          background: '#fff', borderRadius: 16, border: '1px solid #F0F0F0',
          overflow: 'hidden',
        }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '18px 0', borderRight: '1px solid #F0F0F0' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{totalOrders}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>Захиалга</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '18px 0', borderRight: '1px solid #F0F0F0' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FF6B00' }}>{points.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>Оноо</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '18px 0' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{savedItems}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>Хадгалсан</div>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding: '0 20px 100px', maxWidth: 480, margin: '0 auto' }}>
        {/* Upgrade banner for free users */}
        {(user?.subscription_plan || user?.plan || 'free') === 'free' && (
          <a href="/pricing" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 16, marginBottom: 16, borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(255,107,0,0.08), rgba(255,107,0,0.02))',
            border: '1px solid rgba(255,107,0,0.2)', textDecoration: 'none',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#FF6B00' }}>
                Pro болж илүү боломж нээ ✨
              </div>
              <div style={{ fontSize: 11, color: '#FF6B00', opacity: 0.8, marginTop: 2 }}>
                Editor, аналитик, loyalty болон бусад
              </div>
            </div>
            <span style={{ padding: '8px 14px', background: '#FF6B00', color: '#fff', borderRadius: 10, fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
              Upgrade →
            </span>
          </a>
        )}

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F0F0F0', overflow: 'hidden' }}>
          {MENU_ITEMS.map((item, i) => (
            <a key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', padding: '18px 20px',
              textDecoration: 'none', color: 'inherit',
              borderBottom: i < MENU_ITEMS.length - 1 ? '1px solid #FFFFFF' : 'none',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: item.iconBg, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1, marginLeft: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{item.label}</div>
                {item.sub && <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>{item.sub}</div>}
              </div>
              <svg width="16" height="16" fill="none" stroke="#CCC" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </a>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <a href="/shop" style={{
            background: '#fff', border: '1px solid #F0F0F0', borderRadius: 16,
            padding: '20px 16px', textDecoration: 'none', textAlign: 'center',
            transition: 'box-shadow 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>🛍️</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Дэлгүүр</div>
          </a>
          <a href="/quote" style={{
            background: 'linear-gradient(135deg, #FF6B00, #E55D00)', borderRadius: 16,
            padding: '20px 16px', textDecoration: 'none', textAlign: 'center',
            transition: 'box-shadow 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,107,0,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>🤖</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>AI Тооцоо</div>
          </a>
        </div>

        {/* Logout */}
        <button
          onClick={() => {
            localStorage.removeItem('token')
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('user')
            router.push('/login')
          }}
          style={{
            width: '100%', marginTop: 20, padding: '14px', background: 'transparent',
            border: '1px solid #EBEBEB', borderRadius: 14, cursor: 'pointer',
            fontFamily: F, fontSize: 14, fontWeight: 500, color: '#EF4444',
          }}
        >
          Гарах
        </button>
      </div>
    </div>
  )
}
