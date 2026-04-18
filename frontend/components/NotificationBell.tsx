'use client'
import { useState, useEffect, useRef } from 'react'

const API = 'http://localhost:4000'

interface Notif {
  id: number
  type: 'chat' | 'order' | 'payment' | 'wallet' | 'system'
  title: string
  message: string
  is_read: boolean
  created_at: string
  data?: any
}

const TYPE_ICON: Record<string, string> = {
  chat: '💬', order: '📦', payment: '💳', wallet: '💰', system: '🔔',
}
const TYPE_COLOR: Record<string, string> = {
  chat: '#FF6B00', order: '#3B82F6', payment: '#10B981', wallet: '#8B5CF6', system: '#6B7280',
}

function tok() { return localStorage.getItem('access_token') || localStorage.getItem('token') || '' }

export default function NotificationBell({ userId }: { userId?: string }) {
  const [notifs, setNotifs]   = useState<Notif[]>([])
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const ref                   = useRef<HTMLDivElement>(null)
  const timerRef              = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!userId) return
    fetchNotifs()
    timerRef.current = setInterval(fetchNotifs, 15_000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [userId])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function fetchNotifs() {
    if (!userId) return
    const t = tok()
    if (!t) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/notifications?userId=${userId}&limit=30`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (res.ok) {
        const data = await res.json()
        setNotifs(Array.isArray(data) ? data : [])
      }
    } catch {} finally { setLoading(false) }
  }

  async function markRead(id: number) {
    const t = tok()
    if (!t) return
    await fetch(`${API}/notifications/${id}/read`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${t}` },
    })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    const t = tok()
    if (!t || !userId) return
    await fetch(`${API}/notifications/read-all?userId=${userId}`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${t}` },
    })
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unread = notifs.filter(n => !n.is_read).length

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifs() }}
        style={{
          background: 'transparent', border: '1px solid var(--border2, var(--border))',
          borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text2)', position: 'relative', transition: 'all 0.2s',
        }}
        title="Мэдэгдэл"
      >
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unread > 0 && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 16, height: 16, borderRadius: '50%',
            background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--surface)',
          }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 340, background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 200, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              Мэдэгдэл {unread > 0 && <span style={{ color: '#ef4444' }}>({unread})</span>}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={fetchNotifs} style={{ fontSize: 11, color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer' }}>
                ↻ Шинэчлэх
              </button>
              {unread > 0 && (
                <button onClick={markAllRead} style={{ fontSize: 11, color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Бүгдийг уншсан
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {loading && notifs.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
                Уншиж байна...
              </div>
            ) : notifs.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                Мэдэгдэл байхгүй байна
              </div>
            ) : notifs.map(n => (
              <div key={n.id}
                onClick={() => { if (!n.is_read) markRead(n.id) }}
                style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--border)',
                  cursor: n.is_read ? 'default' : 'pointer',
                  background: n.is_read ? 'transparent' : 'rgba(255,107,0,0.04)',
                  display: 'flex', gap: 10, alignItems: 'flex-start', transition: 'background 0.15s',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: (TYPE_COLOR[n.type] || '#888') + '15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>
                  {TYPE_ICON[n.type] || '🔔'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: 'var(--text)', lineHeight: 1.3 }}>
                    {n.title}
                  </div>
                  {n.message && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.message}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                    {new Date(n.created_at).toLocaleString('mn-MN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {!n.is_read && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF6B00', flexShrink: 0, marginTop: 5 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
