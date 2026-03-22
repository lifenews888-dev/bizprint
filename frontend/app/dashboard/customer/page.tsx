'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

const QUICK_LINKS = [
  { icon: '📋', label: 'Захиалгууд', href: '/dashboard/customer/orders', color: '#3B82F6' },
  { icon: '💰', label: 'Хэтэвч', href: '/dashboard/customer/wallet', color: '#10B981' },
  { icon: '🤖', label: 'Үнийн тооцоо', href: '/quote', color: '#FF6B00' },
  { icon: '🎨', label: 'Дизайн', href: '/dashboard/customer/designs', color: '#8B5CF6' },
  { icon: '🏪', label: 'Дэлгүүр', href: '/shop', color: '#F59E0B' },
  { icon: '⚙️', label: 'Тохиргоо', href: '/dashboard/customer/settings', color: '#6B7280' },
]

const MENU_ITEMS = [
  { icon: '📋', label: 'Миний захиалгууд', href: '/dashboard/customer/orders', badge: null },
  { icon: '💰', label: 'Хэтэвч & Төлбөр', href: '/dashboard/customer/wallet', badge: null },
  { icon: '🤖', label: 'Үнийн санал авах', href: '/quote', badge: 'Шинэ' },
  { icon: '🎨', label: 'Дизайн захиалгууд', href: '/dashboard/customer/designs', badge: null },
  { icon: '📁', label: 'Миний файлууд', href: '/dashboard/customer/files', badge: null },
  { icon: '🔔', label: 'Мэдэгдлүүд', href: '/dashboard/customer/notifications', badge: null },
  { icon: '⚙️', label: 'Тохиргоо', href: '/dashboard/customer/settings', badge: null },
]

export default function CustomerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [wallet, setWallet] = useState<any>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }

    const headers = { Authorization: `Bearer ${token}` }

    Promise.all([
      apiFetch(`/auth/me`, { headers }).catch(() => null),
      apiFetch(`/orders?limit=3`, { headers }).catch(() => []),
      apiFetch(`/wallet/balance`, { headers }).catch(() => null),
    ]).then(([u, o, w]) => {
      setUser(u)
      setOrders(Array.isArray(o) ? o : (o?.data ?? []))
      setWallet(w)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const statusColor: Record<string, string> = {
    pending:    '#F59E0B',
    processing: '#3B82F6',
    completed:  '#10B981',
    cancelled:  '#EF4444',
  }

  const statusLabel: Record<string, string> = {
    pending:    'Хүлээгдэж байна',
    processing: 'Боловсруулж байна',
    completed:  'Дууссан',
    cancelled:  'Цуцлагдсан',
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #EBEBEB', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#999', fontSize: 14 }}>Уншиж байна...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F0', fontFamily: F }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EBEBEB', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 64, zIndex: 100 }}>
        <button onClick={() => setDrawerOpen(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="20" height="20" fill="none" stroke="#333" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>
            {user ? `Сайн байна уу, ${user.name?.split(' ')[0] || user.email}` : 'Миний хаяг'}
          </span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href="/dashboard/customer/notifications" style={{ width: 36, height: 36, borderRadius: '50%', background: '#F5F5F0', border: '1px solid #EBEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            <svg width="18" height="18" fill="none" stroke="#555" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </a>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
            onClick={() => setDrawerOpen(true)}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
        </div>
      </div>

      {/* ═══ LEFT DRAWER ═══ */}
      {drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600 }}>
          {/* Backdrop */}
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
          {/* Drawer */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 300, background: '#fff', boxShadow: '4px 0 20px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Profile header */}
            <div style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #e05500 100%)', padding: '40px 24px 24px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{user?.name || 'Хэрэглэгч'}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{user?.email}</div>
            </div>

            {/* Wallet summary */}
            {wallet != null && (
              <div style={{ margin: '16px 16px 0', background: '#F5F5F0', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#555' }}>Хэтэвчний үлдэгдэл</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#10B981' }}>₮{Number(wallet.balance || 0).toLocaleString()}</span>
              </div>
            )}

            {/* Menu */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
              {MENU_ITEMS.map(item => (
                <a key={item.href} href={item.href} onClick={() => setDrawerOpen(false)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 24px', textDecoration: 'none', color: '#333',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F5F5F0')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.badge && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#FF6B00', padding: '2px 7px', borderRadius: 99 }}>{item.badge}</span>
                    )}
                    <svg width="14" height="14" fill="none" stroke="#CCC" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </a>
              ))}
            </div>

            {/* Logout */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #EBEBEB' }}>
              <button onClick={() => { localStorage.removeItem('token'); router.push('/login') }} style={{
                width: '100%', padding: '12px', background: 'transparent', border: '1px solid #EBEBEB',
                borderRadius: 10, cursor: 'pointer', fontFamily: F, fontSize: 14, fontWeight: 500, color: '#555',
              }}>
                Гарах
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CONTENT ═══ */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* Quick links grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {QUICK_LINKS.map(q => (
            <a key={q.href} href={q.href} style={{
              background: '#fff', border: '1px solid #EBEBEB', borderRadius: 14,
              padding: '16px 12px', textDecoration: 'none', display: 'flex',
              flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'box-shadow 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 4px 12px ${q.color}22`)}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: q.color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {q.icon}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#444', textAlign: 'center' }}>{q.label}</span>
            </a>
          ))}
        </div>

        {/* Recent orders */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EBEBEB', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111' }}>Сүүлийн захиалгууд</h3>
            <a href="/dashboard/customer/orders" style={{ fontSize: 13, color: '#FF6B00', textDecoration: 'none', fontWeight: 500 }}>Бүгдийг үзэх</a>
          </div>
          {orders.length > 0 ? orders.map((o: any) => (
            <a key={o.id} href={`/dashboard/customer/orders/${o.id}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', borderBottom: '1px solid #F5F5F0', textDecoration: 'none', color: 'inherit',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>#{o.id?.toString().slice(-6) || o.id}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('mn-MN') : ''}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {o.totalPrice != null && (
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>₮{Number(o.totalPrice).toLocaleString()}</span>
                )}
                <span style={{ fontSize: 11, fontWeight: 600, color: statusColor[o.status] || '#999', background: (statusColor[o.status] || '#999') + '18', padding: '3px 10px', borderRadius: 99 }}>
                  {statusLabel[o.status] || o.status}
                </span>
              </div>
            </a>
          )) : (
            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
              <p style={{ color: '#999', fontSize: 14, margin: 0 }}>Захиалга байхгүй байна</p>
              <a href="/shop" style={{ display: 'inline-block', marginTop: 14, padding: '10px 24px', background: '#FF6B00', color: '#fff', borderRadius: 9, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                Захиалга өгөх
              </a>
            </div>
          )}
        </div>

        {/* Quick action — AI quote */}
        <a href="/quote" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #FF6B00 0%, #e05500 100%)',
          borderRadius: 14, padding: '18px 20px', textDecoration: 'none',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>AI Үнийн Тооцоо</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>PDF файлаа хуулаад шууд үнэ аваарай</div>
          </div>
          <div style={{ fontSize: 32 }}>🤖</div>
        </a>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
