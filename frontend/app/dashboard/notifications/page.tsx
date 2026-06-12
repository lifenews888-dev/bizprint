'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'

interface NotificationItem {
  id: number
  type: string
  title: string
  message: string
  data?: {
    action?: string
    order_id?: string | number
    design_request_id?: string | number
    [key: string]: unknown
  }
  is_read: boolean
  created_at: string
}

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  order:   { icon: '\uD83D\uDCE6', color: '#3B82F6', bg: '#EFF6FF', label: 'Захиалга' },
  payment: { icon: '\uD83D\uDCB3', color: '#10B981', bg: '#ECFDF5', label: 'Төлбөр' },
  chat:    { icon: '\uD83D\uDCAC', color: '#FF6B00', bg: '#FFF7ED', label: 'Чат' },
  wallet:  { icon: '\uD83D\uDCB0', color: '#8B5CF6', bg: '#F5F3FF', label: 'Хэтэвч' },
  system:  { icon: '\uD83D\uDD14', color: '#6B7280', bg: '#F9FAFB', label: 'Систем' },
}

const FILTERS = [
  { key: 'all', label: 'Бүгд' },
  { key: 'unread', label: 'Уншаагүй' },
  { key: 'order', label: 'Захиалга' },
  { key: 'payment', label: 'Төлбөр' },
  { key: 'chat', label: 'Чат' },
  { key: 'system', label: 'Систем' },
]

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'Дөнгөж сая'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} минутын өмнө`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} цагийн өмнө`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} хоногийн өмнө`
  return new Date(date).toLocaleDateString('mn-MN')
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    apiFetch<NotificationItem[]>('/notifications/my?limit=100')
      .then(d => setNotifications(Array.isArray(d) ? d : []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.is_read
    return n.type === filter
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  async function markRead(id: number) {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch {}
  }

  async function markAllRead() {
    try {
      await apiFetch('/notifications/read-all', { method: 'PATCH' })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {}
  }

  function getHref(n: NotificationItem): string {
    if (n.data?.action === 'pending_file' && n.data?.order_id) return `/dashboard/orders?highlight=${n.data.order_id}`
    if (n.data?.design_request_id) return `/dashboard/customer/design/${n.data.design_request_id}`
    if (n.data?.order_id) return '/dashboard/orders'
    if (n.type === 'chat') return '/dashboard/chat'
    if (n.type === 'payment' || n.type === 'wallet') return '/dashboard/customer/wallet'
    return '#'
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px', fontFamily: F }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text, #111)' }}>
            Мэдэгдлүүд
          </h1>
          <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>
            {unreadCount > 0 ? `${unreadCount} уншаагүй мэдэгдэл` : 'Бүгд уншсан'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{
            background: 'var(--surface2, #F3F4F6)', color: 'var(--text, #333)',
            border: 'none', borderRadius: 10, padding: '10px 20px',
            fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: F,
          }}>
            Бүгдийг уншсан гэж тэмдэглэх
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const count = f.key === 'all'
            ? notifications.length
            : f.key === 'unread'
            ? unreadCount
            : notifications.filter(n => n.type === f.key).length
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: filter === f.key ? '#FF6B00' : 'var(--surface2, #F3F4F6)',
              color: filter === f.key ? '#fff' : 'var(--text2, #666)',
              fontWeight: filter === f.key ? 700 : 500, fontSize: 13, fontFamily: F,
            }}>
              {f.label}{count > 0 ? ` (${count})` : ''}
            </button>
          )
        })}
      </div>

      {/* Notifications list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>Уншиж байна...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>Мэдэгдэл байхгүй</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            {filter === 'unread' ? 'Бүх мэдэгдлийг уншсан байна' : 'Одоогоор мэдэгдэл ирээгүй байна'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system
            return (
              <div key={n.id} onClick={() => {
                if (!n.is_read) markRead(n.id)
                const href = getHref(n)
                if (href !== '#') window.location.href = href
              }} style={{
                display: 'flex', gap: 14, padding: '14px 18px',
                background: n.is_read ? 'var(--surface, #fff)' : 'rgba(255,107,0,0.04)',
                border: '1px solid var(--border, #E5E7EB)',
                borderRadius: 12, cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: cfg.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 20,
                }}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: n.is_read ? 500 : 700, color: 'var(--text, #111)' }}>
                      {n.title}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                      background: cfg.bg, color: cfg.color,
                    }}>
                      {cfg.label}
                    </span>
                    {!n.is_read && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF6B00' }} />
                    )}
                  </div>
                  {n.message && (
                    <div style={{ fontSize: 13, color: 'var(--text2, #666)', lineHeight: 1.4 }}>
                      {n.message}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text3, #999)', marginTop: 4 }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
