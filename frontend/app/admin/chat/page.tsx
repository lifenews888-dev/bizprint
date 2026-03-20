'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const API = 'http://localhost:4000'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

type Role = 'admin' | 'customer' | 'designer' | 'factory' | 'sales' | 'courier' | 'vendor' | 'user'

interface ChatUser { id: string; email: string; full_name?: string; role: Role }
interface ChatMessage {
  id?: string
  sender_id: string
  sender_name?: string
  sender_role?: Role | string
  message: string
  file_url?: string
  created_at?: string
}

interface Notification {
  id?: number
  title: string
  message?: string
  created_at?: string
  is_read?: boolean
  data?: any
}

const ROLE_COLOR: Record<string, string> = {
  admin: '#FF6B00', designer: '#8B5CF6', courier: '#10B981',
  customer: '#3B82F6', vendor: '#F59E0B', user: '#3B82F6',
  sales: '#06B6D4', factory: '#EC4899',
}

function getToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('token') || localStorage.getItem('access_token') || ''
}

export default function AdminChatPage() {
  const [users, setUsers] = useState<ChatUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [sending, setSending] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const unreadCount = notifs.filter(n => !n.is_read).length

  // Load user list (admin only view)
  useEffect(() => {
    setLoadingUsers(true)
    fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => Array.isArray(d) && setUsers(d))
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false))

    // initial notifications
    fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => Array.isArray(d) && setNotifs(d))
      .catch(() => {})
  }, [])

  // Load messages for selected user
  useEffect(() => {
    if (!selectedUser) return
    fetchMessages(selectedUser.id)
  }, [selectedUser])

  async function fetchMessages(userId: string) {
    const res = await fetch(`${API}/chat/messages?userId=${userId}&me=admin`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    const d: any[] = await res.json()
    if (!Array.isArray(d)) return setMessages([])
    const mapped = d.map(m => ({
      id: m.id,
      sender_id: m.sender_id,
      sender_name: m.sender_name,
      sender_role: m.sender_role,
      message: m.message,
      file_url: m.file_url,
      created_at: m.created_at,
    }))
    setMessages(mapped)
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const filtered = useMemo(() => {
    if (!search.trim()) return users
    const s = search.toLowerCase()
    return users.filter(u =>
      (u.full_name || '').toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.role.toLowerCase().includes(s)
    )
  }, [users, search])

  // WebSocket realtime
  useEffect(() => {
    const s = io(API + '/chat', { transports: ['websocket'] })
    socketRef.current = s
    s.emit('join', { userId: 'admin', userName: 'Admin', role: 'admin' })
    s.on('new_message', (msg: any) => {
      // only append if in current room (direct admin-user)
      if (selectedUser && msg.room_id?.includes(selectedUser.id)) {
        setMessages(prev => [...prev, mapMsg(msg)])
      }
    })
    s.on('notify', (payload: any) => {
      if (payload?.type === 'chat') {
        setToast(`Шинэ чат: ${payload.sender_name || ''} — ${payload.message?.slice(0,80) || 'файл'}`)
        setTimeout(() => setToast(null), 4000)
        // push to notifications list
        setNotifs(prev => [
          {
            id: Math.random(),
            title: payload.sender_name || 'Шинэ чат',
            message: payload.message,
            created_at: payload.created_at,
            is_read: false,
            data: payload,
          },
          ...prev,
        ].slice(0, 50))
      }
    })
    return () => { s.disconnect() }
  }, [selectedUser])

  function mapMsg(m: any): ChatMessage {
    return {
      id: m.id,
      sender_id: m.sender_id,
      sender_name: m.sender_name,
      sender_role: m.sender_role,
      message: m.message,
      file_url: m.file_url,
      created_at: m.created_at,
    }
  }

  async function uploadFileIfAny(): Promise<string | undefined> {
    if (!file) return undefined
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API}/upload/file`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form,
    })
    const data = await res.json()
    return data?.file_url || undefined
  }

  async function send() {
    if (!selectedUser || (!input.trim() && !file)) return
    setSending(true)
    try {
      const fileUrl = await uploadFileIfAny()
      const content = input.trim() || (file ? file.name : '')
      setInput('')
      setFile(null)

      // optimistic
      const optimistic: ChatMessage = {
        id: `tmp-${Date.now()}`,
        sender_id: 'admin',
        sender_name: 'Admin',
        sender_role: 'admin',
        message: content,
        file_url: fileUrl,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, optimistic])

      await fetch(`${API}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content,
          senderId: 'admin',
          senderName: 'Admin',
          senderRole: 'admin',
          fileUrl,
        }),
      })
    } catch (e) {
      // revert optimistic on failure? simple reload
      setMessages(prev => prev.filter(m => !String(m.id).startsWith('tmp-')))
    } finally {
      setSending(false)
      // reload to ensure order
      if (selectedUser) {
        fetch(`${API}/chat/messages?userId=${selectedUser.id}&me=admin`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
          .then(r => r.json())
          .then((d: any[]) => Array.isArray(d) && setMessages(d))
          .catch(() => {})
      }
    }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)', fontFamily: F }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 2000,
          background: '#111', color: '#fff', padding: '10px 14px',
          borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          fontSize: 13, maxWidth: 320,
        }}>
          {toast}
        </div>
      )}
      {/* Notification bell */}
      <div style={{ position: 'fixed', top: 14, right: 16, zIndex: 1900 }}>
        <button
          onClick={() => setNotifOpen(o => !o)}
          style={{
            position: 'relative',
            background: '#fff', border: '1px solid var(--border)', borderRadius: 999,
            padding: '6px 10px', cursor: 'pointer', fontSize: 13,
            boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
          }}
        >
          🔔
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              background: '#EF4444', color: '#fff', borderRadius: 999,
              padding: '2px 6px', fontSize: 11, fontWeight: 700,
            }}>{unreadCount}</span>
          )}
        </button>
        {notifOpen && (
          <div style={{
            position: 'absolute', top: 40, right: 0, width: 320,
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
            boxShadow: '0 12px 32px rgba(0,0,0,0.16)', padding: 10, maxHeight: 380, overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong>Мэдэгдэл</strong>
              <button
                onClick={() => {
                  fetch(`${API}/notifications/read-all`, { method: 'PATCH', headers: { Authorization: `Bearer ${getToken()}` } })
                  setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
                }}
                style={{ border: 'none', background: 'transparent', color: '#FF6B35', cursor: 'pointer', fontSize: 12 }}
              >
                Бүгдийг уншсан
              </button>
            </div>
            {notifs.length === 0 ? (
              <div style={{ color: 'var(--text2)', fontSize: 13, padding: 12 }}>Мэдэгдэл алга</div>
            ) : notifs.map(n => (
              <div key={n.id} style={{
                padding: 8, marginBottom: 6, borderRadius: 8,
                background: n.is_read ? 'var(--surface2)' : 'rgba(255,107,53,0.08)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{n.title}</div>
                {n.message && <div style={{ fontSize: 12, color: 'var(--text2)' }}>{n.message}</div>}
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                  {n.created_at ? new Date(n.created_at).toLocaleString('mn-MN') : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Left: user list */}
      <div style={{ width: 300, minWidth: 300, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px' }}>Chat</h2>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            style={{
              width: '100%', padding: '8px 12px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 8, fontSize: 13, color: 'var(--text)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingUsers ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>No users found</div>
          ) : filtered.map(u => {
            const active = selectedUser?.id === u.id
            const color = ROLE_COLOR[u.role] || '#888'
            return (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', border: 'none', borderBottom: '1px solid var(--border)',
                  background: active ? 'rgba(255,107,0,0.08)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', fontFamily: F, transition: 'background 0.15s',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: color + '18',
                  border: `2px solid ${color}`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 13, fontWeight: 700, color, flexShrink: 0,
                }}>
                  {(u.full_name || u.email).charAt(0).toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {u.full_name || u.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: color + '15', color, fontWeight: 600 }}>{u.role}</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        {!selectedUser ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 48, opacity: 0.3 }}>💬</span>
            <p style={{ color: 'var(--text3)', fontSize: 14 }}>Select a user to start chatting</p>
          </div>
        ) : (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedUser.full_name || selectedUser.email}</div>
              <span style={{
                padding: '3px 8px', borderRadius: 999,
                background: (ROLE_COLOR[selectedUser.role] || '#ccc') + '20',
                color: ROLE_COLOR[selectedUser.role] || '#666',
                fontSize: 11, fontWeight: 700,
              }}>{selectedUser.role}</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text2)', marginTop: 80 }}>
                  No messages yet. Say hello!
                </div>
              ) : messages.map((m) => {
                const mine = m.sender_role === 'admin' || m.sender_id === 'admin'
                return (
                  <div key={m.id || Math.random()} style={{
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    maxWidth: '72%',
                    background: mine ? '#FF6B35' : 'var(--surface)',
                    color: mine ? '#fff' : 'var(--text)',
                    padding: '10px 12px',
                    borderRadius: mine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                  }}>
                    <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>
                      {m.sender_name || m.sender_id}
                    </div>
                    {m.message && (
                      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 14 }}>{m.message}</div>
                    )}
                    {m.file_url && (
                      <a href={m.file_url} target="_blank" rel="noreferrer" style={{
                        marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6,
                        color: mine ? '#fff' : '#FF6B35', fontWeight: 600,
                      }}>
                        ⭳ Attachment
                      </a>
                    )}
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>
                      {m.created_at ? new Date(m.created_at).toLocaleString('mn-MN') : ''}
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
              <label style={{
                border: '1px dashed var(--border)', padding: '8px 10px',
                borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2)',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                📎 Файл
                <input
                  type="file"
                  style={{ display: 'none' }}
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </label>
              {file && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{file.name}</span>}
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder="Type a message..."
                style={{
                  flex: 1, padding: '10px 12px',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, fontSize: 14, color: 'var(--text)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                onClick={send}
                disabled={sending || (!input.trim() && !file)}
                style={{
                  background: sending ? 'var(--border)' : '#FF6B35',
                  color: '#fff', border: 'none', borderRadius: 10,
                  padding: '10px 16px', fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer',
                }}
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
