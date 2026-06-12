'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

interface NotificationData {
  order_id?: string | number
  [key: string]: unknown
}

interface NotificationItem {
  id: number
  type: string
  title: string
  message: string
  data?: NotificationData
  is_read: boolean
  created_at: string
}

const TYPE_ICONS: Record<string, string> = {
  chat: '\uD83D\uDCAC',
  order: '\uD83D\uDCE6',
  payment: '\uD83D\uDCB3',
  wallet: '\uD83D\uDCB0',
  system: '\uD83D\uDD14',
}

const TYPE_COLORS: Record<string, string> = {
  chat: '#FF6B00',
  order: '#3B82F6',
  payment: '#10B981',
  wallet: '#8B5CF6',
  system: '#6B7280',
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'Дөнгөж сая'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} мин`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} цаг`
  return `${Math.floor(seconds / 86400)} хоног`
}

const getNotificationPermission = (): NotificationPermission =>
  typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'default'

export default function NotificationBell({ userId }: { userId?: string }) {
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission)
  const [filter, setFilter] = useState<string>('all')
  const ref = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const prevUnread = useRef(0)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    try {
      // Fetch unread count
      const countData = await apiFetch<{ unread: number }>('/notifications/my/unread-count')
      const count = countData.unread || 0

      // Browser notification for new unreads
      if (count > prevUnread.current && prevUnread.current >= 0 && permission === 'granted') {
        new window.Notification('BizPrint', {
          body: `${count} шинэ мэдэгдэл`,
          icon: '/favicon.ico',
        })
      }
      prevUnread.current = count
      setUnread(count)

      // Fetch notification list
      const data = await apiFetch<NotificationItem[]>('/notifications/my?limit=30')
      setNotifications(Array.isArray(data) ? data : [])
    } catch {}
  }, [userId, permission])

  useEffect(() => {
    const timeout = setTimeout(fetchNotifications, 0)
    intervalRef.current = setInterval(fetchNotifications, 15000)
    return () => {
      clearTimeout(timeout)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchNotifications])

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function requestPermission() {
    if ('Notification' in window) {
      const result = await window.Notification.requestPermission()
      setPermission(result)
    }
  }

  async function markAllRead() {
    try {
      await apiFetch('/notifications/read-all', { method: 'PATCH' })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnread(0)
    } catch {}
  }

  async function markOneRead(id: number) {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnread(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter)

  const FILTERS = [
    { key: 'all', label: 'Бүгд' },
    { key: 'order', label: 'Захиалга' },
    { key: 'payment', label: 'Төлбөр' },
    { key: 'chat', label: 'Чат' },
    { key: 'system', label: 'Систем' },
  ]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button onClick={() => { setOpen(!open); if (!open) fetchNotifications() }} style={{
        background: 'transparent',
        border: '1px solid var(--border2, #E5E7EB)',
        borderRadius: 8,
        padding: '6px 10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text2, #666)',
        position: 'relative',
        transition: 'all 0.2s',
      }}>
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unread > 0 && (
          <div style={{
            position: 'absolute',
            top: -4, right: -4,
            minWidth: 16, height: 16, padding: '0 4px',
            borderRadius: 99,
            background: '#EF4444',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--surface, #fff)',
          }}>
            {unread > 99 ? '99+' : unread}
          </div>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: 380,
          background: 'var(--surface, #fff)',
          border: '1px solid var(--border, #E5E7EB)',
          borderRadius: 14,
          boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
          zIndex: 100,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px 10px',
            borderBottom: '1px solid var(--border, #E5E7EB)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text, #111)' }}>
                Мэдэгдэл {unread > 0 && <span style={{ color: '#EF4444' }}>({unread})</span>}
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {permission !== 'granted' && (
                  <button onClick={requestPermission} style={{
                    fontSize: 11, color: '#FF6B00', background: 'none',
                    border: 'none', cursor: 'pointer', fontWeight: 600,
                  }}>
                    Push идэвхжүүлэх
                  </button>
                )}
                {unread > 0 && (
                  <button onClick={markAllRead} style={{
                    fontSize: 11, color: 'var(--text2, #666)', background: 'none',
                    border: 'none', cursor: 'pointer',
                  }}>
                    Бүгд уншсан
                  </button>
                )}
              </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 4 }}>
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)} style={{
                  padding: '4px 10px', borderRadius: 99, border: 'none', cursor: 'pointer',
                  background: filter === f.key ? '#FF6B00' : 'var(--surface2, #F3F4F6)',
                  color: filter === f.key ? '#fff' : 'var(--text2, #666)',
                  fontSize: 11, fontWeight: filter === f.key ? 700 : 500,
                }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text2, #888)', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                Мэдэгдэл байхгүй
              </div>
            ) : filtered.map(n => (
              <div key={n.id} onClick={() => {
                if (!n.is_read) markOneRead(n.id)
                // Navigate based on notification data
                if (n.data?.order_id) window.location.href = '/dashboard/orders'
                else if (n.type === 'chat') window.location.href = '/dashboard/chat'
                else if (n.type === 'payment') window.location.href = '/dashboard/customer/wallet'
                setOpen(false)
              }} style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--border, #F3F4F6)',
                cursor: 'pointer',
                background: n.is_read ? 'transparent' : 'rgba(255,107,0,0.04)',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                transition: 'background 0.15s',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: (TYPE_COLORS[n.type] || '#6B7280') + '14',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>
                  {TYPE_ICONS[n.type] || '\uD83D\uDD14'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 700, color: 'var(--text, #111)' }}>
                    {n.title}
                  </div>
                  {n.message && (
                    <div style={{ fontSize: 12, color: 'var(--text2, #666)', marginTop: 2, lineHeight: 1.4 }}>
                      {n.message.length > 80 ? n.message.slice(0, 80) + '...' : n.message}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text3, #999)', marginTop: 4 }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
                {!n.is_read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF6B00', flexShrink: 0, marginTop: 6 }} />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 18px', borderTop: '1px solid var(--border, #E5E7EB)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: 'var(--text3, #999)' }}>
              {permission === 'granted' ? 'Push мэдэгдэл идэвхтэй' : ''}
            </span>
            <Link href="/dashboard/notifications" style={{
              fontSize: 11, fontWeight: 600, color: '#FF6B00', textDecoration: 'none',
            }}>
              Бүгдийг харах →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
