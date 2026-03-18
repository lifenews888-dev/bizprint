'use client'
import { useState, useEffect, useRef } from 'react'

const API = 'http://localhost:4000'

interface Notification {
  id: string
  type: 'chat' | 'order' | 'payment' | 'system'
  title: string
  message: string
  time: string
  read: boolean
  href?: string
}

export default function NotificationBell({ userId }: { userId?: string }) {
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [permission, setPermission] = useState<string>('default')
  const ref = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    if (!userId) return
    fetchUnread()
    intervalRef.current = setInterval(fetchUnread, 15000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [userId])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchUnread() {
    if (!userId) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/chat/unread/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      const count = typeof data === 'number' ? data : (data.count || 0)

      // Browser notification if new unread
      if (count > unread && unread >= 0 && permission === 'granted') {
        new window.Notification('BizPrint', {
          body: `${count} unread message${count > 1 ? 's' : ''}`,
          icon: '/favicon.ico',
        })
      }

      setUnread(count)

      // Update notifications list
      if (count > 0) {
        const chatNotif: Notification = {
          id: 'chat-unread',
          type: 'chat',
          title: 'Unread Messages',
          message: `You have ${count} unread message${count > 1 ? 's' : ''}`,
          time: new Date().toISOString(),
          read: false,
          href: '/admin/chat',
        }
        setNotifications(prev => {
          const filtered = prev.filter(n => n.id !== 'chat-unread')
          return [chatNotif, ...filtered]
        })
      }
    } catch {}
  }

  async function requestPermission() {
    if ('Notification' in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
    }
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button onClick={() => setOpen(!open)} style={{
        background: 'transparent',
        border: '1px solid var(--border2)',
        borderRadius: 8,
        padding: '6px 10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text2)',
        position: 'relative',
        transition: 'all 0.2s',
      }}>
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute',
            top: -4, right: -4,
            width: 16, height: 16,
            borderRadius: '50%',
            background: '#ef4444',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--surface)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: 320,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          zIndex: 100,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {permission !== 'granted' && (
                <button onClick={requestPermission} style={{
                  fontSize: 11, color: 'var(--orange)', background: 'none',
                  border: 'none', cursor: 'pointer', fontWeight: 500,
                }}>
                  Enable push
                </button>
              )}
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{
                  fontSize: 11, color: 'var(--text2)', background: 'none',
                  border: 'none', cursor: 'pointer',
                }}>
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                No notifications
              </div>
            ) : notifications.map(n => (
              <div key={n.id} onClick={() => {
                setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
                if (n.href) window.location.href = n.href
                setOpen(false)
              }} style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                background: n.read ? 'transparent' : 'var(--orange-04)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                transition: 'background 0.15s',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: n.type === 'chat' ? 'var(--orange-10)' : 'var(--surface2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>
                  {n.type === 'chat' ? '💬' : n.type === 'order' ? '📦' : n.type === 'payment' ? '💳' : '🔔'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: 'var(--text)' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                    {new Date(n.time).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {!n.read && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--orange)', flexShrink: 0, marginTop: 4 }} />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          {permission === 'granted' && (
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                Push notifications enabled
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
