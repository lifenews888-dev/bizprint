'use client'
import { useState, useEffect, useRef } from 'react'
import { useChat } from '@/hooks/useChat'

const ADMIN_ID   = 'admin'
const ADMIN_NAME = 'Admin'

const ROLE_CFG: Record<string, { color: string; bg: string; label: string }> = {
  admin:    { color: '#FF6B00', bg: 'rgba(255,107,0,0.1)',   label: 'Admin'    },
  designer: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',  label: 'Designer' },
  courier:  { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  label: 'Courier'  },
  customer: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  label: 'Customer' },
  vendor:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  label: 'Vendor'   },
  factory:  { color: '#EC4899', bg: 'rgba(236,72,153,0.1)',  label: 'Factory'  },
}

function timeAgo(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm'
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function Avatar({ name, role, size = 32 }: { name: string; role?: string; size?: number }) {
  const cfg = ROLE_CFG[role || 'customer'] || ROLE_CFG.customer
  const initials = (name || 'U').split(/[\s@]/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: cfg.bg, border: `2px solid ${cfg.color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: cfg.color,
    }}>
      {initials}
    </div>
  )
}

export default function AdminChatPage() {
  const { rooms, messages, activeRoom, connected, joinRoom, sendMessage, createRoom } = useChat(ADMIN_ID, ADMIN_NAME, 'admin')
  const [text, setText] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('http://localhost:4000/admin/users', {
      headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || localStorage.getItem('token') || '') }
    }).then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeRoom])

  useEffect(() => {
    if (activeRoom) inputRef.current?.focus()
  }, [activeRoom])

  async function handleFile(file: File) {
    if (!activeRoom) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('http://localhost:4000/upload/file', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || localStorage.getItem('token') || '') },
        body: fd,
      })
      const data = await res.json()
      const url = data.url || 'http://localhost:4000/uploads/' + data.filename
      const msg = file.type.startsWith('image/') ? '[IMAGE]' + url : '[FILE]' + file.name + '|' + url
      sendMessage(activeRoom, msg)
    } finally {
      setUploading(false)
    }
  }

  function send() {
    if (!activeRoom || !text.trim()) return
    sendMessage(activeRoom, text)
    setText('')
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function startChat(user: any) {
    createRoom({ type: 'support', participants: [ADMIN_ID, user.id], participantNames: [ADMIN_NAME, user.name || user.email] })
    setShowNew(false)
  }

  function renderMsg(content: string, isMe: boolean) {
    if (content.startsWith('[IMAGE]')) {
      const url = content.replace('[IMAGE]', '')
      return (
        <img src={url} alt="img" onClick={() => setPreviewImg(url)}
          style={{ maxWidth: 240, maxHeight: 200, borderRadius: 12, cursor: 'pointer', display: 'block', border: '1px solid var(--border)' }} />
      )
    }
    if (content.startsWith('[FILE]')) {
      const [name, url] = content.replace('[FILE]', '').split('|')
      const ext = name.split('.').pop()?.toUpperCase() || 'FILE'
      return (
        <a href={url} target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: isMe ? 'rgba(255,255,255,0.12)' : 'var(--surface2)', borderRadius: 12, textDecoration: 'none', border: isMe ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--border)', minWidth: 160, maxWidth: 240 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,107,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#FF6B00', flexShrink: 0 }}>{ext}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: isMe ? '#fff' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text3)' }}>Download</div>
          </div>
        </a>
      )
    }
    return (
      <div style={{
        padding: '10px 14px', fontSize: 14, lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap',
        background: isMe ? 'linear-gradient(135deg,#FF6B00,#FF8C42)' : 'var(--surface2)',
        color: isMe ? '#fff' : 'var(--text)',
        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        border: isMe ? 'none' : '1px solid var(--border)',
        boxShadow: isMe ? '0 2px 12px rgba(255,107,0,0.2)' : 'none',
        maxWidth: 480,
      }}>
        {content}
      </div>
    )
  }

  const activeMessages = activeRoom ? (messages[activeRoom] || []) : []
  const activeRoomData = rooms.find(r => r.room_id === activeRoom)
  const otherName   = activeRoomData?.participant_names.find((n: string) => n !== ADMIN_NAME) || ''
  const otherUser   = users.find((u: any) => (u.name || u.email) === otherName)
  const otherCfg    = ROLE_CFG[otherUser?.role || 'customer'] || ROLE_CFG.customer

  const filteredRooms = rooms.filter(r =>
    r.participant_names.some((n: string) => n.toLowerCase().includes(search.toLowerCase())) ||
    (r.last_message || '').toLowerCase().includes(search.toLowerCase())
  )

  // Group messages by date
  const grouped: { date: string; msgs: typeof activeMessages }[] = []
  activeMessages.forEach(msg => {
    const date = new Date(msg.created_at).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
    const last = grouped[grouped.length - 1]
    if (!last || last.date !== date) grouped.push({ date, msgs: [msg] })
    else last.msgs.push(msg)
  })

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 54px)', overflow: 'hidden', background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>

      {/* Image preview overlay */}
      {previewImg && (
        <div onClick={() => setPreviewImg(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', backdropFilter: 'blur(6px)' }}>
          <img src={previewImg} style={{ maxWidth: '88vw', maxHeight: '88vh', borderRadius: 14, boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }} />
          <button onClick={() => setPreviewImg(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'var(--surface)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 12px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#10B981' : '#EF4444', boxShadow: connected ? '0 0 5px #10B981' : 'none' }} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Messages</span>
            </div>
            <button onClick={() => setShowNew(true)}
              style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)', cursor: 'pointer', color: '#FF6B00', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 300 }}>
              +
            </button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            style={{ width: '100%', padding: '7px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Room list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredRooms.length === 0 && (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text3)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 12 }}>No conversations yet</div>
            </div>
          )}
          {filteredRooms.map(room => {
            const other = room.participant_names.find((n: string) => n !== ADMIN_NAME) || room.participant_names[0]
            const role  = users.find((u: any) => (u.name || u.email) === other)?.role || 'customer'
            const cfg   = ROLE_CFG[role] || ROLE_CFG.customer
            const isActive = activeRoom === room.room_id
            const lastMsg = room.last_message?.startsWith('[IMAGE]') ? '📷 Image'
              : room.last_message?.startsWith('[FILE]') ? '📎 File'
              : room.last_message || ''
            return (
              <div key={room.room_id} onClick={() => joinRoom(room.room_id)}
                style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', gap: 9, alignItems: 'center', background: isActive ? 'rgba(255,107,0,0.06)' : 'transparent', borderLeft: `3px solid ${isActive ? '#FF6B00' : 'transparent'}`, transition: 'all 0.12s' }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface2)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                <Avatar name={other} role={role} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <div style={{ fontWeight: isActive ? 700 : 500, fontSize: 13, color: isActive ? '#FF6B00' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{other}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0, marginLeft: 4 }}>{room.last_message_at ? timeAgo(room.last_message_at) : ''}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{lastMsg}</div>
                    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                      <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: cfg.bg, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                      {(room.unread_count ?? 0) > 0 && <span style={{ background: '#FF6B00', color: '#fff', borderRadius: '50%', width: 15, height: 15, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{room.unread_count}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT - Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>

        {!activeRoom ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>💬</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>BizPrint Support</div>
            <div style={{ fontSize: 14, marginBottom: 24, maxWidth: 320, textAlign: 'center', lineHeight: 1.6 }}>
              Select a conversation or start a new one with your team
            </div>
            <button onClick={() => setShowNew(true)}
              style={{ background: '#FF6B00', border: 'none', borderRadius: 12, padding: '11px 24px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 16px rgba(255,107,0,0.35)' }}>
              + New Conversation
            </button>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={otherName} role={otherUser?.role} size={34} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{otherName}</div>
                  <div style={{ fontSize: 11, color: otherCfg.color, fontWeight: 600 }}>{otherCfg.label}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--surface2)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                {activeMessages.length} messages
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}>
              {activeMessages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)' }}>
                  <Avatar name={otherName} role={otherUser?.role} size={52} />
                  <div style={{ marginTop: 14, fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{otherName}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Start the conversation</div>
                </div>
              )}

              {grouped.map(group => (
                <div key={group.date}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 24px 16px' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, padding: '2px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20 }}>
                      {group.date}
                    </div>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>

                  {group.msgs.map((msg, i) => {
                    const isMe       = msg.sender_id === ADMIN_ID
                    const prev       = group.msgs[i - 1]
                    const next       = group.msgs[i + 1]
                    const showAvatar = !isMe && (!prev || prev.sender_id !== msg.sender_id)
                    const showTime   = !next || next.sender_id !== msg.sender_id

                    return (
                      <div key={msg.id || i} style={{ padding: '2px 24px', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        {showAvatar && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, marginLeft: 2 }}>
                            <Avatar name={msg.sender_name || ''} role={msg.sender_role} size={20} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: (ROLE_CFG[msg.sender_role || ''] || ROLE_CFG.customer).color }}>
                              {msg.sender_name}
                            </span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                          {!isMe && !showAvatar && <div style={{ width: 20, flexShrink: 0 }} />}
                          <div style={{ maxWidth: '72%' }}>
                            {renderMsg(msg.message, isMe)}
                          </div>
                        </div>
                        {showTime && (
                          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3, marginLeft: isMe ? 0 : 26 }}>
                            {timeAgo(msg.created_at)}{isMe && <span style={{ marginLeft: 4, color: '#10B981' }}>✓✓</span>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}

              {uploading && (
                <div style={{ padding: '2px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ padding: '8px 14px', background: 'rgba(255,107,0,0.08)', borderRadius: 12, fontSize: 12, color: '#FF6B00', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(255,107,0,0.15)' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #FF6B00', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                    Uploading...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '16px 24px 20px', flexShrink: 0 }}>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <input ref={fileRef as any} type="file" accept="image/*,.pdf,.ai,.psd,.zip,.doc,.docx"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); (e.target as any).value = '' }}
                style={{ display: 'none' }} />

              <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <textarea value={text} ref={inputRef} onChange={e => setText(e.target.value)} onKeyDown={handleKey}
                  placeholder={`Message ${otherName}...`}
                  rows={text.split('\n').length > 3 ? 4 : Math.max(1, text.split('\n').length)}
                  style={{ padding: '14px 16px', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'none', lineHeight: 1.6, fontFamily: 'inherit', maxHeight: 120, minHeight: 46 }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => (fileRef.current as any)?.click()}
                      style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text3)', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,0,0.08)'; e.currentTarget.style.color = '#FF6B00' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text3)' }}
                      title="Attach file or image">
                      📎
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>Enter to send</span>
                    <button onClick={send} disabled={!text.trim()}
                      style={{ width: 32, height: 32, borderRadius: 9, border: 'none', cursor: text.trim() ? 'pointer' : 'default', background: text.trim() ? '#FF6B00' : 'var(--border)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: text.trim() ? '0 2px 8px rgba(255,107,0,0.4)' : 'none' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* NEW CHAT MODAL */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 18, padding: 24, width: 400, border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>New Conversation</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Select a user to message</div>
              </div>
              <button onClick={() => setShowNew(false)}
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                ✕
              </button>
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {users.filter((u: any) => u.id !== ADMIN_ID).map((user: any) => {
                const cfg = ROLE_CFG[user.role] || ROLE_CFG.customer
                return (
                  <div key={user.id} onClick={() => startChat(user)}
                    style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid transparent', transition: 'all 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6B00'; e.currentTarget.style.background = 'rgba(255,107,0,0.03)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'var(--surface2)' }}>
                    <Avatar name={user.name || user.email} role={user.role} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || user.email}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: cfg.bg, color: cfg.color, fontWeight: 600, flexShrink: 0 }}>{cfg.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
