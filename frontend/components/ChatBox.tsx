'use client'
import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/hooks/useChat'

interface Props { userId: string; userName: string; role: string }
const API = 'http://localhost:4000'
const ROLES: Record<string, { color: string; bg: string; label: string }> = {
  admin:    { color: 'var(--orange)', bg: 'var(--orange-12)',  label: 'Admin'    },
  designer: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', label: 'Designer' },
  courier:  { color: '#10B981', bg: 'rgba(16,185,129,0.12)', label: 'Courier'  },
  customer: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', label: 'Customer' },
  vendor:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Vendor'   },
  factory:  { color: '#EC4899', bg: 'rgba(236,72,153,0.12)', label: 'Factory'  },
}
const TARGETS = [
  { role: 'admin',    label: 'Admin',    desc: 'Support & orders'   },
  { role: 'designer', label: 'Designer', desc: 'Design questions'   },
  { role: 'vendor',   label: 'Vendor',   desc: 'Products & pricing' },
  { role: 'factory',  label: 'Factory',  desc: 'Print questions'    },
]
function ftime(s: string) {
  const d = new Date(s), now = new Date(), diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'now'
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm'
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}
type View = 'closed' | 'list' | 'chat' | 'new'

export default function ChatBox({ userId, userName, role }: Props) {
  const { rooms, messages, activeRoom, connected, joinRoom, sendMessage, createRoom } = useChat(userId, userName, role)
  const [view, setView] = useState<View>('closed')
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const unread = rooms.reduce((s, r) => s + (r.unread_count || 0), 0)
  const msgs = activeRoom ? (messages[activeRoom] || []) : []
  const roomData = rooms.find(r => r.room_id === activeRoom)
  const otherName = roomData?.participant_names.find((n: string) => n !== userName) || 'BizPrint'
  const myCfg = ROLES[role] || ROLES.customer

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, view])
  useEffect(() => { if (view === 'chat') taRef.current?.focus() }, [view])
  useEffect(() => {
    if (view === 'list' && rooms.length === 1 && !activeRoom) { joinRoom(rooms[0].room_id); setView('chat') }
  }, [rooms, view])

  async function uploadFile(file: File): Promise<string> {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const token = localStorage.getItem('access_token') || ''
      const res = await fetch(`${API}/upload/file`, { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: fd })
      const data = await res.json()
      return data.url || `${API}/uploads/${data.filename}`
    } finally { setUploading(false) }
  }

  async function sendFile(file: File) {
    if (!activeRoom) return
    const url = await uploadFile(file)
    const isImg = file.type.startsWith('image/')
    const msg = isImg ? ('[IMAGE]' + url) : ('[FILE]' + file.name + '|' + url)
    sendMessage(activeRoom, msg)
  }

  function send() {
    if (!activeRoom || !text.trim()) return
    sendMessage(activeRoom, text.trim())
    setText('')
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function startChatWith(targetRole: string, targetLabel: string) {
    createRoom({ type: 'support', participants: [userId, targetRole], participantNames: [userName, targetLabel] })
    setView('list')
    setTimeout(() => {
      const r = rooms.find(r => r.participants?.includes(userId) && r.participants?.includes(targetRole))
      if (r) { joinRoom(r.room_id); setView('chat') }
    }, 600)
  }

  function renderMsg(content: string, isMe: boolean) {
    if (content.startsWith('[IMAGE]')) {
      const url = content.replace('[IMAGE]', '')
      return <img src={url} alt="img" onClick={() => setPreview(url)} style={{ maxWidth: 220, borderRadius: 10, cursor: 'pointer', display: 'block', border: '1px solid rgba(255,255,255,0.1)' }} />
    }
    if (content.startsWith('[FILE]')) {
      const parts = content.replace('[FILE]', '').split('|')
      const name = parts[0], url = parts[1]
      const ext = name.split('.').pop()?.toUpperCase() || 'FILE'
      return (
        <a href={url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: isMe ? 'rgba(255,255,255,0.15)' : 'var(--surface2)', borderRadius: 10, textDecoration: 'none', border: isMe ? 'none' : '1px solid var(--border)', minWidth: 160 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--orange-15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--orange)', flexShrink: 0 }}>{ext}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: isMe ? '#fff' : 'var(--text)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text3)' }}>Download</div>
          </div>
        </a>
      )
    }
    return (
      <div style={{ padding: '10px 14px', background: isMe ? 'linear-gradient(135deg,var(--orange),#FF8C42)' : 'var(--surface2)', color: isMe ? '#fff' : 'var(--text)', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', fontSize: 14, lineHeight: 1.6, border: isMe ? 'none' : '1px solid var(--border)', boxShadow: isMe ? '0 2px 12px var(--orange-20)' : 'none', wordBreak: 'break-word', whiteSpace: 'pre-wrap', maxWidth: 260 }}>
        {content}
      </div>
    )
  }

  const headerIcon = view === 'chat' ? (otherName[0] || '?').toUpperCase() : view === 'new' ? '+' : 'ðŸ’¬'
  const headerTitle = view === 'chat' ? otherName : view === 'new' ? 'New Chat' : 'BizPrint Chat'

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(16px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
      `}</style>

      {/* Image preview */}
      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', backdropFilter: 'blur(6px)' }}>
          <img src={preview} style={{ maxWidth: '88vw', maxHeight: '88vh', borderRadius: 14 }} />
        </div>
      )}

      {/* Chat window */}
      {view !== 'closed' && (
        <div
          onDragOver={e => { e.preventDefault(); if (view === 'chat') setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) sendFile(f) }}
          style={{ position: 'absolute', bottom: 70, right: 0, width: 380, height: 560, background: dragOver ? 'var(--orange-04)' : 'var(--surface)', border: dragOver ? '2px dashed var(--orange)' : '1px solid var(--border)', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>

          {/* Header */}
          <div style={{ padding: '13px 14px', background: 'linear-gradient(135deg,var(--orange),#FF8C42)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {headerIcon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{headerTitle}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#fff' : 'rgba(255,255,255,0.4)', boxShadow: connected ? '0 0 4px #fff' : 'none' }} />
                {connected ? 'Online' : 'Offline'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {(view === 'chat' || view === 'new') && (
                <button onClick={() => setView('list')} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>â†</button>
              )}
              <button onClick={() => setView('closed')} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>âœ•</button>
            </div>
          </div>

          {/* New chat view */}
          {view === 'new' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 12, color: 'var(--text3)', margin: '0 0 6px', textAlign: 'center' }}>Who do you want to chat with?</p>
              {TARGETS.filter(t => t.role !== role).map(t => {
                const cfg = ROLES[t.role] || ROLES.customer
                return (
                  <div key={t.role} onClick={() => startChatWith(t.role, t.label)}
                    style={{ padding: '13px 14px', background: 'var(--surface2)', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.background = 'var(--orange-04)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface2)' }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: cfg.bg, border: `2px solid ${cfg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {t.label[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{t.desc}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', color: 'var(--text3)' }}>â†’</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Room list */}
          {view === 'list' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {rooms.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>ðŸ’¬</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 8 }}>Hello!</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.6 }}>Chat with Admin, Designer, or Vendor</div>
                  <button onClick={() => setView('new')} style={{ background: 'linear-gradient(135deg,var(--orange),#FF8C42)', border: 'none', borderRadius: 12, padding: '11px 22px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, width: '100%' }}>
                    Start Chat
                  </button>
                </div>
              ) : (
                <>
                  {rooms.map(room => {
                    const other = room.participant_names.find((n: string) => n !== userName) || 'Support'
                    const initials = other.split(/[\s@]/).filter(Boolean).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                    const lastMsg = room.last_message?.startsWith('[IMAGE]') ? 'ðŸ“· Image' : room.last_message?.startsWith('[FILE]') ? 'ðŸ“Ž File' : room.last_message || ''
                    return (
                      <div key={room.room_id} onClick={() => { joinRoom(room.room_id); setView('chat') }}
                        style={{ padding: '11px 13px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid var(--border)', transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--orange-04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--orange-10)', border: '2px solid var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'var(--orange)', flexShrink: 0 }}>{initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other}</div>
                            <div style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0, marginLeft: 4 }}>{room.last_message_at ? ftime(room.last_message_at) : ''}</div>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastMsg}</div>
                        </div>
                        {room.unread_count > 0 && <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--orange)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{room.unread_count}</div>}
                      </div>
                    )
                  })}
                  <div style={{ padding: 10 }}>
                    <button onClick={() => setView('new')} style={{ width: '100%', padding: '9px', background: 'transparent', border: '1.5px dashed var(--border)', borderRadius: 10, color: 'var(--text3)', cursor: 'pointer', fontSize: 13 }}>
                      + New Chat
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Chat view */}
          {view === 'chat' && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 6px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {msgs.length === 0 && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 34, marginBottom: 10 }}>ðŸ‘‹</div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>Hello!</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>Write your message below</div>
                  </div>
                )}
                {msgs.map((msg, i) => {
                  const isMe = msg.sender_id === userId
                  const prev = msgs[i - 1]
                  const next = msgs[i + 1]
                  const showName = !isMe && (!prev || prev.sender_id !== msg.sender_id)
                  const showTime = !next || next.sender_id !== msg.sender_id
                  return (
                    <div key={msg.id}>
                      {showName && <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--orange)', marginBottom: 3, marginLeft: 38 }}>{msg.sender_name}</div>}
                      <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        {!isMe && (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--orange-10)', border: '1.5px solid var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--orange)', flexShrink: 0, alignSelf: 'flex-end' }}>
                            {(msg.sender_name || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div style={{ maxWidth: '76%' }}>
                          {renderMsg(msg.message, isMe)}
                          {showTime && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>{ftime(msg.created_at)}{isMe && <span style={{ marginLeft: 4, color: '#10B981' }}>âœ“âœ“</span>}</div>}
                        </div>
                        {isMe && <div style={{ width: 28, height: 28, borderRadius: '50%', background: myCfg.bg, border: `1.5px solid ${myCfg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: myCfg.color, flexShrink: 0, alignSelf: 'flex-end' }}>{userName[0]?.toUpperCase()}</div>}
                      </div>
                    </div>
                  )
                })}
                {uploading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ padding: '8px 12px', background: 'var(--orange-08)', borderRadius: 10, fontSize: 12, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--orange)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                      Uploading...
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '8px 10px 10px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
                <input ref={fileRef} type="file" accept="image/*,.pdf,.ai,.psd,.zip,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) sendFile(f); (e.target as any).value = '' }} style={{ display: 'none' }} />
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '6px 6px 6px 11px' }}>
                  <button onClick={() => fileRef.current?.click()}
                    style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text3)', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--orange)'; e.currentTarget.style.background = 'var(--orange-08)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}>
                    ðŸ“Ž
                  </button>
                  <textarea ref={taRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={onKey}
                    rows={Math.min(text.split('\n').length, 4) || 1}
                    placeholder="Type a message..."
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 13, outline: 'none', resize: 'none', padding: '3px 0', lineHeight: 1.5, fontFamily: 'inherit', minHeight: 24, maxHeight: 90 }} />
                  <button onClick={send} disabled={!text.trim()}
                    style={{ width: 32, height: 32, borderRadius: 9, border: 'none', flexShrink: 0, cursor: text.trim() ? 'pointer' : 'default', background: text.trim() ? 'var(--orange)' : 'var(--border)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: text.trim() ? '0 3px 10px var(--orange-40)' : 'none' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>ðŸ“Ž Drag & drop or click to attach</span>
                  <span>Enter to send</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => {
        if (view === 'closed') {
          if (rooms.length === 0) setView('new')
          else if (rooms.length === 1) { joinRoom(rooms[0].room_id); setView('chat') }
          else setView('list')
        } else { setView('closed') }
      }} style={{ width: 54, height: 54, borderRadius: '50%', background: view !== 'closed' ? 'var(--surface)' : 'linear-gradient(135deg,var(--orange),#FF8C42)', border: view !== 'closed' ? '2px solid var(--border)' : 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: view !== 'closed' ? '0 4px 16px rgba(0,0,0,0.15)' : '0 6px 24px var(--orange-40)', transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {view !== 'closed'
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        }
        {unread > 0 && view === 'closed' && (
          <div style={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderRadius: '50%', background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg)', animation: 'pulse 2s infinite' }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>
    </div>
  )
}
