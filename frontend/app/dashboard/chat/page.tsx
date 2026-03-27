'use client'
import { apiFetch, API_URL } from '@/lib/api'
import { useEffect, useMemo, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

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

const ROLE_COLOR: Record<string, string> = {
  admin: '#FF6B00', designer: '#8B5CF6', courier: '#10B981',
  customer: '#3B82F6', vendor: '#F59E0B', user: '#3B82F6',
  sales: '#06B6D4', factory: '#EC4899',
}

const EMOJI_QUICK = ['👍', '❤️', '😊', '🙏', '👏', '🔥', '✅', '😂']

export default function CustomerChatPage() {
  const [me, setMe] = useState<ChatUser | null>(null)
  const [recipients, setRecipients] = useState<ChatUser[]>([])
  const [selected, setSelected] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [msgSearch, setMsgSearch] = useState('')
  const [showMsgSearch, setShowMsgSearch] = useState(false)
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const typingClearRef = useRef<NodeJS.Timeout | null>(null)

  // load me
  useEffect(() => {
    apiFetch<any>(`/auth/me`)
      .then(u => {
        if (u?.id) {
          setMe({ id: u.id, email: u.email, full_name: u.full_name, role: (u.role || 'customer') as Role })
        }
      })
      .catch(() => {})
  }, [])

  // load recipients (admin, designer, sales)
  useEffect(() => {
    async function load() {
      const roles: Role[] = ['admin', 'designer', 'sales']
      const all: ChatUser[] = []
      for (const role of roles) {
        try {
          const list = await apiFetch<any>(`/chat/users/role/${role}`)
          if (Array.isArray(list)) {
            all.push(...list.map((u: any) => ({ id: u.id, email: u.email, full_name: u.full_name, role: role })))
          }
        } catch {}
      }
      setRecipients(all)
      if (all.length) setSelected(all[0])
    }
    load()
  }, [])

  // messages when selected
  useEffect(() => {
    if (!selected || !me) return
    fetchMessages(selected.id)
  }, [selected, me])

  async function fetchMessages(userId: string) {
    if (!me) return
    const d: any[] = await apiFetch<any>(`/chat/messages?userId=${userId}&me=${me.id}`)
    if (!Array.isArray(d)) return setMessages([])
    setMessages(d.map(mapMsg))
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // WS
  useEffect(() => {
    if (!me) return
    const s = io(API_URL + '/chat', { transports: ['websocket'] })
    socketRef.current = s
    s.emit('join', { userId: me.id, userName: me.full_name || me.email, role: me.role })
    s.on('new_message', (msg: any) => {
      if (selected && msg.room_id?.includes(selected.id)) {
        setMessages(prev => [...prev, mapMsg(msg)])
        setToast(`${msg.sender_name || ''}: ${msg.message?.slice(0,80) || 'файл'}`)
        setTimeout(() => setToast(null), 3500)
      }
    })
    // Typing indicator
    s.on('user_typing', (data: { room_id: string; user_name: string; user_id: string }) => {
      if (data.user_id === me.id) return
      setTypingUser(data.user_name)
      if (typingClearRef.current) clearTimeout(typingClearRef.current)
      typingClearRef.current = setTimeout(() => setTypingUser(null), 3000)
    })
    s.on('user_stop_typing', () => {
      setTypingUser(null)
    })
    return () => { s.disconnect() }
  }, [me, selected])

  function handleTextChange(val: string) {
    setInput(val)
    if (!me || !socketRef.current) return
    socketRef.current.emit('typing', { room_id: selected?.id || '', user_id: me.id, user_name: me.full_name || me.email })
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', { room_id: selected?.id || '', user_id: me.id, user_name: me.full_name || me.email })
    }, 2000)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return recipients
    const s = search.toLowerCase()
    return recipients.filter(r =>
      (r.full_name || '').toLowerCase().includes(s) ||
      r.email.toLowerCase().includes(s) ||
      r.role.toLowerCase().includes(s)
    )
  }, [recipients, search])

  async function uploadFileIfAny(): Promise<string | undefined> {
    if (!file) return undefined
    const form = new FormData()
    form.append('file', file)
    const data = await apiFetch<any>(`/upload/file`, {
      method: 'POST',
      body: form,
    })
    return data?.file_url || undefined
  }

  async function send() {
    if (!me || !selected || (!input.trim() && !file)) return
    let content = input.trim() || (file ? file.name : '')
    // Prepend reply context
    if (replyTo) {
      content = `[REPLY:${replyTo.sender_name || replyTo.sender_id}:${replyTo.message.slice(0, 60)}]\n${content}`
    }
    setInput('')
    setFile(null)
    setReplyTo(null)
    setShowEmoji(false)
    // Stop typing
    socketRef.current?.emit('stop_typing', { room_id: selected.id, user_id: me.id, user_name: me.full_name || me.email })
    const fileUrl = await uploadFileIfAny()

    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      sender_id: me.id,
      sender_name: me.full_name || me.email,
      sender_role: me.role,
      message: content,
      file_url: fileUrl,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    await apiFetch<any>(`/chat/send`, {
      method: 'POST',
      body: {
        receiverId: selected.id,
        content,
        senderId: me.id,
        senderName: me.full_name || me.email,
        senderRole: me.role,
        fileUrl,
      },
    }).catch(() => {})
  }

  // Filter messages by search
  const filteredMessages = useMemo(() => {
    if (!msgSearch.trim()) return messages
    const q = msgSearch.toLowerCase()
    return messages.filter(m => m.message.toLowerCase().includes(q) || m.sender_name?.toLowerCase().includes(q))
  }, [messages, msgSearch])

  const displayMessages = showMsgSearch ? filteredMessages : messages

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

      {/* Left: recipients */}
      <div style={{ width: 280, minWidth: 280, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px' }}>Чат</h2>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Admin / Designer / Sales хайх..."
            style={{
              width: '100%', padding: '8px 12px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 8, fontSize: 13, color: 'var(--text)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(u => {
            const active = selected?.id === u.id
            const color = ROLE_COLOR[u.role] || '#888'
            return (
              <button
                key={u.id}
                onClick={() => setSelected(u)}
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
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 48, opacity: 0.3 }}>💬</span>
            <p style={{ color: 'var(--text3)', fontSize: 14 }}>Хэнтэй чатлахыг сонгоно уу (admin / designer / sales)</p>
          </div>
        ) : (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{selected.full_name || selected.email}</div>
              <span style={{
                padding: '3px 8px', borderRadius: 999,
                background: (ROLE_COLOR[selected.role] || '#ccc') + '20',
                color: ROLE_COLOR[selected.role] || '#666',
                fontSize: 11, fontWeight: 700,
              }}>{selected.role}</span>
              <button onClick={() => { setShowMsgSearch(!showMsgSearch); setMsgSearch('') }} style={{
                background: showMsgSearch ? 'rgba(255,107,0,0.1)' : 'transparent', border: '1px solid var(--border)',
                borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: showMsgSearch ? '#FF6B00' : 'var(--text2)',
              }}>🔍</button>
            </div>
            {showMsgSearch && (
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={msgSearch} onChange={e => setMsgSearch(e.target.value)} placeholder="Мессеж хайх..."
                  autoFocus
                  style={{ flex: 1, padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }}
                />
                {msgSearch && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{filteredMessages.length}/{messages.length}</span>}
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {displayMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text2)', marginTop: 80 }}>
                  {msgSearch ? 'Хайлтад тохирох мессеж олдсонгүй' : 'Одоогоор мессеж алга. Сайн уу? гэж эхлээрэй.'}
                </div>
              ) : displayMessages.map((m) => {
                const mine = me && (m.sender_id === me.id)
                // Parse reply
                const replyMatch = m.message.match(/^\[REPLY:(.+?):(.+?)\]\n([\s\S]*)$/)
                const replyName = replyMatch?.[1]
                const replyText = replyMatch?.[2]
                const mainText = replyMatch ? replyMatch[3] : m.message
                return (
                  <div key={m.id || Math.random()} style={{
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    maxWidth: '72%',
                    position: 'relative',
                    group: 'msg',
                  } as any}>
                    <div style={{
                      background: mine ? '#FF6B35' : 'var(--surface)',
                      color: mine ? '#fff' : 'var(--text)',
                      padding: '10px 12px',
                      borderRadius: mine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                    }}>
                      <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>
                        {m.sender_name || m.sender_id}
                      </div>
                      {replyName && (
                        <div style={{
                          padding: '6px 10px', borderRadius: 8, marginBottom: 6,
                          background: mine ? 'rgba(255,255,255,0.15)' : 'rgba(255,107,0,0.06)',
                          borderLeft: '3px solid ' + (mine ? 'rgba(255,255,255,0.5)' : '#FF6B00'),
                          fontSize: 12, color: mine ? 'rgba(255,255,255,0.85)' : 'var(--text2)',
                        }}>
                          <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 2 }}>{replyName}</div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyText}</div>
                        </div>
                      )}
                      {mainText && (
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 14 }}>{mainText}</div>
                      )}
                      {m.file_url && (
                        <a href={m.file_url} target="_blank" rel="noreferrer" style={{
                          marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6,
                          color: mine ? '#fff' : '#FF6B35', fontWeight: 600,
                        }}>
                          ⭳ Attachment
                        </a>
                      )}
                      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {m.created_at ? new Date(m.created_at).toLocaleString('mn-MN') : ''}
                        {mine && <span style={{ color: mine ? 'rgba(255,255,255,0.7)' : '#10B981' }}>✓✓</span>}
                      </div>
                    </div>
                    {/* Reply button on hover */}
                    <button onClick={() => setReplyTo(m)} title="Хариулах"
                      style={{
                        position: 'absolute', top: 4, ...(mine ? { left: -28 } : { right: -28 }),
                        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6,
                        width: 24, height: 24, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', opacity: 0.4, transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}>
                      ↩
                    </button>
                  </div>
                )
              })}
              {/* Typing indicator */}
              {typingUser && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--surface)', borderRadius: 12, fontSize: 12, color: 'var(--text3)' }}>
                  <span style={{ display: 'flex', gap: 3 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF6B00', animation: 'typingBounce 1.4s ease-in-out infinite', animationDelay: '0s' }} />
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF6B00', animation: 'typingBounce 1.4s ease-in-out infinite', animationDelay: '0.2s' }} />
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF6B00', animation: 'typingBounce 1.4s ease-in-out infinite', animationDelay: '0.4s' }} />
                  </span>
                  {typingUser} бичиж байна...
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply bar */}
            {replyTo && (
              <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', background: 'rgba(255,107,0,0.04)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, fontSize: 12, color: 'var(--text2)', borderLeft: '3px solid #FF6B00', paddingLeft: 10 }}>
                  <div style={{ fontWeight: 600, color: '#FF6B00', fontSize: 11 }}>↩ {replyTo.sender_name || replyTo.sender_id}</div>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>{replyTo.message}</div>
                </div>
                <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text3)', padding: 4 }}>✕</button>
              </div>
            )}

            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Emoji quick bar */}
              {showEmoji && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {EMOJI_QUICK.map(e => (
                    <button key={e} onClick={() => { setInput(prev => prev + e); setShowEmoji(false) }}
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 18 }}>{e}</button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button onClick={() => setShowEmoji(!showEmoji)}
                  style={{ background: showEmoji ? 'rgba(255,107,0,0.1)' : 'transparent', border: '1px solid var(--border)', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 16 }}>😊</button>
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
                  onChange={e => handleTextChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                  placeholder={replyTo ? `${replyTo.sender_name}-д хариулах...` : 'Мессеж бичих...'}
                  style={{
                    flex: 1, padding: '10px 12px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 10, fontSize: 14, color: 'var(--text)',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={send}
                  disabled={!me || !selected || (!input.trim() && !file)}
                  style={{
                    background: '#FF6B35',
                    color: '#fff', border: 'none', borderRadius: 10,
                    padding: '10px 16px', fontWeight: 700, cursor: (!me || !selected || (!input.trim() && !file)) ? 'not-allowed' : 'pointer',
                  }}
                >
                  Илгээх
                </button>
              </div>
            </div>
            <style>{`
              @keyframes typingBounce {
                0%, 80%, 100% { transform: scale(0.6); opacity: 0.4 }
                40% { transform: scale(1); opacity: 1 }
              }
            `}</style>
          </>
        )}
      </div>
    </div>
  )
}

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
