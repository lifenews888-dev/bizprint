'use client'
import { useState, useEffect, useRef } from 'react'
import { useChat } from '@/hooks/useChat'

const ADMIN_ID = 'admin'
const ADMIN_NAME = 'Admin'

const ROLE_CFG: Record<string, { color: string; bg: string; label: string }> = {
  admin:    { color: 'var(--orange)', bg: 'var(--orange-10)',   label: 'Admin'    },
  designer: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',  label: 'Designer' },
  courier:  { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  label: 'Courier'  },
  customer: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  label: 'Customer' },
  vendor:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  label: 'Vendor'   },
  factory:  { color: '#EC4899', bg: 'rgba(236,72,153,0.1)',  label: 'Factory'  },
  sales:    { color: '#06B6D4', bg: 'rgba(6,182,212,0.1)',   label: 'Sales'    },
}

function ftime(s: string) {
  if (!s) return ''
  const d = new Date(s), now = new Date(), diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'now'
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm'
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function Av({ name, role, size = 34 }: { name: string; role?: string; size?: number }) {
  const cfg = ROLE_CFG[role || 'customer'] || ROLE_CFG.customer
  const init = (name || 'U').split(/[\s@.]/).filter(Boolean).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: cfg.bg, border: `2px solid ${cfg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 700, color: cfg.color }}>
      {init}
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
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('http://localhost:4000/admin/users', {
      headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') }
    }).then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeRoom])

  useEffect(() => {
    if (activeRoom) setTimeout(() => inputRef.current?.focus(), 100)
  }, [activeRoom])

  async function handleFile(file: File) {
    if (!activeRoom) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('http://localhost:4000/upload/file', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') },
        body: fd,
      })
      const data = await res.json()
      const url = data.url || 'http://localhost:4000/uploads/' + data.filename
      const msg = file.type.startsWith('image/') ? '[IMAGE]' + url : '[FILE]' + file.name + '|' + url
      sendMessage(activeRoom, msg)
    } finally { setUploading(false) }
  }

  function send() {
    if (!activeRoom || !text.trim()) return
    sendMessage(activeRoom, text)
    setText('')
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function startChat(user: any) {
    createRoom({ type: 'support', participants: [ADMIN_ID, user.id], participantNames: [ADMIN_NAME, user.full_name || user.email] })
    setShowNew(false)
  }

  function renderMsg(content: string, isMe: boolean) {
    if (content.startsWith('[IMAGE]')) {
      const url = content.replace('[IMAGE]', '')
      return <img src={url} alt="img" onClick={() => setPreviewImg(url)} style={{ maxWidth: 260, maxHeight: 220, borderRadius: 12, cursor: 'pointer', display: 'block', border: '1px solid var(--border)' }} />
    }
    if (content.startsWith('[FILE]')) {
      const [name, url] = content.replace('[FILE]', '').split('|')
      const ext = (name.split('.').pop() || 'FILE').toUpperCase()
      return (
        <a href={url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: isMe ? 'rgba(255,255,255,0.12)' : 'var(--surface2)', borderRadius: 12, textDecoration: 'none', border: isMe ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--border)', minWidth: 160, maxWidth: 260 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--orange-12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--orange)', flexShrink: 0 }}>{ext}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: isMe ? '#fff' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text3)' }}>Download</div>
          </div>
        </a>
      )
    }
    return (
      <div style={{ padding: '10px 14px', background: isMe ? 'linear-gradient(135deg,var(--orange),#FF8C42)' : 'var(--surface2)', color: isMe ? '#fff' : 'var(--text)', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', fontSize: 14, lineHeight: 1.6, border: isMe ? 'none' : '1px solid var(--border)', boxShadow: isMe ? '0 2px 10px var(--orange-20)' : 'none', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
        {content}
      </div>
    )
  }

  const activeMessages = activeRoom ? (messages[activeRoom] || []) : []
  const activeRoomData = rooms.find(r => r.room_id === activeRoom)
  const otherName = activeRoomData?.participant_names.find((n: string) => n !== ADMIN_NAME) || ''
  const otherUser = users.find((u: any) => u.id === activeRoomData?.participants?.find((p: string) => p !== ADMIN_ID))
  const otherCfg = ROLE_CFG[otherUser?.role || 'customer'] || ROLE_CFG.customer

  const filteredRooms = rooms.filter(r =>
    r.participant_names.some((n: string) => n.toLowerCase().includes(search.toLowerCase())) ||
    (r.last_message || '').toLowerCase().includes(search.toLowerCase())
  )

  const grouped: { date: string; msgs: typeof activeMessages }[] = []
  activeMessages.forEach(msg => {
    const date = new Date(msg.created_at).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
    const last = grouped[grouped.length - 1]
    if (!last || last.date !== date) grouped.push({ date, msgs: [msg] })
    else last.msgs.push(msg)
  })

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 54px)', overflow: 'hidden', background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Segoe UI',system-ui,sans-serif" }}>

      {/* Image preview */}
      {previewImg && (
        <div onClick={() => setPreviewImg(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', backdropFilter: 'blur(6px)' }}>
          <img src={previewImg} style={{ maxWidth: '88vw', maxHeight: '88vh', borderRadius: 14 }} />
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'var(--surface)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#10B981' : '#EF4444', boxShadow: connected ? '0 0 5px #10B981' : 'none' }} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Messages</span>
              {rooms.reduce((s, r) => s + (r.unread_count || 0), 0) > 0 && (
                <span style={{ background: 'var(--orange)', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
                  {rooms.reduce((s, r) => s + (r.unread_count || 0), 0)}
                </span>
              )}
            </div>
            <button onClick={() => setShowNew(true)} style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--orange-10)', border: '1px solid var(--orange-20)', cursor: 'pointer', color: 'var(--orange)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>+</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            style={{ width: '100%', padding: '7px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredRooms.length === 0 && (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text3)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 12 }}>No conversations yet</div>
            </div>
          )}
          {filteredRooms.map(room => {
            const otherId = room.participants?.find((p: string) => p !== ADMIN_ID)
            const user = users.find((u: any) => u.id === otherId)
            const other = user?.full_name || user?.email || room.participant_names.find((n: string) => n !== ADMIN_NAME) || room.participant_names[0]
            const role = user?.role || 'customer'
            const cfg = ROLE_CFG[role] || ROLE_CFG.customer
            const isActive = activeRoom === room.room_id
            const lastMsg = room.last_message?.startsWith('[IMAGE]') ? '[Image]' : room.last_message?.startsWith('[FILE]') ? '[File]' : room.last_message || ''
            return (
              <div key={room.room_id} onClick={() => joinRoom(room.room_id)}
                style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', gap: 9, alignItems: 'center', background: isActive ? 'var(--orange-06)' : 'transparent', borderLeft: `3px solid ${isActive ? 'var(--orange)' : 'transparent'}`, transition: 'all 0.12s' }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface2)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                <Av name={other} role={role} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <div style={{ fontWeight: isActive ? 700 : 500, fontSize: 13, color: isActive ? 'var(--orange)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{other}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>{room.last_message_at ? ftime(room.last_message_at) : ''}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{lastMsg}</div>
                    <div style={{ display: 'flex', gap: 3, flexShrink: 0, alignItems: 'center' }}>
                      <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: cfg.bg, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                      {room.unread_count > 0 && <span style={{ background: 'var(--orange)', color: '#fff', borderRadius: '50%', width: 15, height: 15, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{room.unread_count}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT - Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {!activeRoom ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>💬</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>BizPrint Support</div>
            <div style={{ fontSize: 13, marginBottom: 22, textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>Select a conversation or start a new one</div>
            <button onClick={() => setShowNew(true)} style={{ background: 'var(--orange)', border: 'none', borderRadius: 12, padding: '11px 24px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 16px var(--orange-35)' }}>
              + New Conversation
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '11px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Av name={otherName} role={otherUser?.role} size={34} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{otherUser?.full_name || otherUser?.email || otherName}</div>
                  <div style={{ fontSize: 11, color: otherCfg.color, fontWeight: 600 }}>{otherCfg.label}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--surface2)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                {activeMessages.length} messages
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {activeMessages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)' }}>
                  <Av name={otherName} role={otherUser?.role} size={50} />
                  <div style={{ marginTop: 14, fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{otherUser?.full_name || otherUser?.email || otherName}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Start the conversation</div>
                </div>
              )}
              {grouped.map(group => (
                <div key={group.date}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 14px' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, padding: '2px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20 }}>{group.date}</div>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>
                  {group.msgs.map((msg, i) => {
                    const isMe = msg.sender_id === ADMIN_ID
                    const prev = group.msgs[i - 1]
                    const next = group.msgs[i + 1]
                    const showAvatar = !isMe && (!prev || prev.sender_id !== msg.sender_id)
                    const showTime = !next || next.sender_id !== msg.sender_id
                    const cfg = ROLE_CFG[msg.sender_role] || ROLE_CFG.customer
                    return (
                      <div key={msg.id} style={{ marginBottom: 2 }}>
                        {showAvatar && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, marginLeft: 2 }}>
                            <Av name={msg.sender_name} role={msg.sender_role} size={18} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color }}>{msg.sender_name}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                          {!isMe && <div style={{ width: 18, flexShrink: 0 }} />}
                          <div style={{ maxWidth: '65%' }}>
                            {renderMsg(msg.message, isMe)}
                            {showTime && (
                              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                                {ftime(msg.created_at)}{isMe && <span style={{ marginLeft: 4, color: '#10B981' }}>âœ“âœ“</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
              {uploading && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <div style={{ padding: '8px 14px', background: 'var(--orange-08)', borderRadius: 10, fontSize: 12, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--orange)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                    Uploading...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 20px 16px', flexShrink: 0, borderTop: '1px solid var(--border)' }}>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <input ref={fileRef as any} type="file" accept="image/*,.pdf,.ai,.psd,.zip,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); (e.target as any).value = '' }} style={{ display: 'none' }} />
              <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={onKey}
                  placeholder={`Message ${otherUser?.full_name || otherUser?.email || otherName}...`}
                  rows={Math.min(Math.max(1, text.split('\n').length), 4)}
                  style={{ padding: '12px 14px', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'none', lineHeight: 1.6, fontFamily: 'inherit', minHeight: 44, maxHeight: 110 }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => (fileRef.current as any)?.click()}
                    style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text3)', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--orange-08)'; e.currentTarget.style.color = 'var(--orange)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text3)' }}>
                    [File]
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>Enter to send</span>
                    <button onClick={send} disabled={!text.trim()}
                      style={{ width: 32, height: 32, borderRadius: 9, border: 'none', cursor: text.trim() ? 'pointer' : 'default', background: text.trim() ? 'var(--orange)' : 'var(--border)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: text.trim() ? '0 2px 8px var(--orange-40)' : 'none' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
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
          <div style={{ background: 'var(--surface)', borderRadius: 18, padding: 22, width: 400, border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>New Conversation</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Select a user to message</div>
              </div>
              <button onClick={() => setShowNew(false)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>x</button>
            </div>
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {users.filter((u: any) => u.id !== ADMIN_ID).map((user: any) => {
                const cfg = ROLE_CFG[user.role] || ROLE_CFG.customer
                return (
                  <div key={user.id} onClick={() => startChat(user)}
                    style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid transparent', transition: 'all 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.background = 'var(--orange-03)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'var(--surface2)' }}>
                    <Av name={user.full_name || user.email} role={user.role} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name || user.email}</div>
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