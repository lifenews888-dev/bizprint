'use client'
import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/hooks/useChat'

interface Props {
  userId: string
  userName: string
  role: string
}

const API = 'http://localhost:4000'

const ROLE_CONFIG: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
  admin:    { color: '#FF6B00', bg: 'rgba(255,107,0,0.12)',  label: 'Админ',     emoji: '👑' },
  designer: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', label: 'Дизайнер',  emoji: '🎨' },
  courier:  { color: '#10B981', bg: 'rgba(16,185,129,0.12)', label: 'Жолооч',    emoji: '🚚' },
  customer: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', label: 'Хэрэглэгч', emoji: '👤' },
  vendor:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Вендор',    emoji: '🏭' },
  factory:  { color: '#EC4899', bg: 'rgba(236,72,153,0.12)', label: 'Үйлдвэр',   emoji: '🏗️' },
}

const CHAT_TARGETS = [
  { role: 'admin',    label: 'Админ',    emoji: '👑', desc: 'Тусламж, захиалгын асуудал' },
  { role: 'designer', label: 'Дизайнер', emoji: '🎨', desc: 'Дизайн, загварын асуудал' },
  { role: 'vendor',   label: 'Борлуулагч', emoji: '🏭', desc: 'Бараа, үнийн асуудал' },
  { role: 'factory',  label: 'Үйлдвэр', emoji: '🏗️', desc: 'Хэвлэлийн асуудал' },
]

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'Одоо'
  if (diff < 3600000) return Math.floor(diff / 60000) + 'мин'
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })
}

type View = 'closed' | 'list' | 'chat' | 'new'

export default function ChatBox({ userId, userName, role }: Props) {
  const { rooms, messages, activeRoom, connected, joinRoom, sendMessage, createRoom } = useChat(userId, userName, role)
  const [view, setView] = useState<View>('closed')
  const [text, setText] = useState('')
  const [rows, setRows] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [previewFile, setPreviewFile] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalUnread = rooms.reduce((s, r) => s + (r.unread_count || 0), 0)
  const activeMessages = activeRoom ? (messages[activeRoom] || []) : []
  const activeRoomData = rooms.find(r => r.room_id === activeRoom)
  const otherName = activeRoomData?.participant_names.find((n: string) => n !== userName) || 'BizPrint'
  const myCfg = ROLE_CONFIG[role] || ROLE_CONFIG.customer

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages, view])

  useEffect(() => {
    if (view === 'chat') textareaRef.current?.focus()
  }, [view])

  useEffect(() => {
    if (view === 'list' && rooms.length === 1 && !activeRoom) {
      joinRoom(rooms[0].room_id)
      setView('chat')
    }
  }, [rooms, view])

  async function uploadFile(file: File): Promise<string> {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const token = localStorage.getItem('access_token') || localStorage.getItem('token') || ''
      const res = await fetch(`${API}/upload/file`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: fd,
      })
      const data = await res.json()
      return data.url || `${API}/uploads/${data.filename}`
    } finally {
      setUploading(false)
    }
  }

  async function handleFileSend(file: File) {
    if (!activeRoom) return
    const url = await uploadFile(file)
    const isImg = file.type.startsWith('image/')
    const msg = isImg ? `[IMAGE]${url}` : `[FILE]${file.name}|${url}`
    sendMessage(activeRoom, msg)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSend(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSend(file)
  }

  function send() {
    if (!activeRoom || !text.trim()) return
    sendMessage(activeRoom, text.trim())
    setText('')
    setRows(1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function startChatWith(targetRole: string, targetLabel: string) {
    createRoom({
      type: 'support',
      participants: [userId, targetRole],
      participantNames: [userName, targetLabel],
    })
    setView('list')
    setTimeout(() => {
      const room = rooms.find(r =>
        r.participants.includes(userId) && r.participants.includes(targetRole)
      )
      if (room) { joinRoom(room.room_id); setView('chat') }
    }, 600)
  }

  function renderMessage(msg: any) {
    const isMe = msg.sender_id === userId
    const content = msg.message

    if (content.startsWith('[IMAGE]')) {
      const url = content.replace('[IMAGE]', '')
      return (
        <div style={{ maxWidth: 220 }}>
          <img
            src={url}
            alt="зураг"
            onClick={() => setPreviewFile(url)}
            style={{ width: '100%', borderRadius: 10, cursor: 'pointer', display: 'block', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
      )
    }

    if (content.startsWith('[FILE]')) {
      const parts = content.replace('[FILE]', '').split('|')
      const fileName = parts[0]
      const fileUrl = parts[1]
      const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE'
      return (
        <a href={fileUrl} target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: isMe ? 'rgba(255,255,255,0.15)' : 'var(--surface2)', borderRadius: 10, textDecoration: 'none', border: isMe ? 'none' : '1px solid var(--border)', minWidth: 180 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: isMe ? 'rgba(255,255,255,0.2)' : 'rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: isMe ? '#fff' : '#FF6B00', flexShrink: 0 }}>
            {ext}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: isMe ? '#fff' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
              {fileName}
            </div>
            <div style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text3)' }}>Татаж авах →</div>
          </div>
        </a>
      )
    }

    return (
      <div style={{
        padding: '10px 14px',
        background: isMe ? 'linear-gradient(135deg, #FF6B00, #FF8C42)' : 'var(--surface2)',
        color: isMe ? '#fff' : 'var(--text)',
        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        fontSize: 14, lineHeight: 1.6,
        border: isMe ? 'none' : '1px solid var(--border)',
        boxShadow: isMe ? '0 2px 12px rgba(255,107,0,0.2)' : 'none',
        wordBreak: 'break-word', whiteSpace: 'pre-wrap',
      }}>
        {content}
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* IMAGE PREVIEW MODAL */}
      {previewFile && (
        <div onClick={() => setPreviewFile(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', backdropFilter: 'blur(4px)' }}>
          <img src={previewFile} alt="preview" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }} />
          <button onClick={() => setPreviewFile(null)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        </div>
      )}

      {/* CHAT WINDOW */}
      {view !== 'closed' && (
        <div
          onDragOver={e => { e.preventDefault(); if (view === 'chat') setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            position: 'absolute', bottom: 70, right: 0,
            width: 380, height: 560,
            background: dragOver ? 'rgba(255,107,0,0.05)' : 'var(--surface)',
            border: dragOver ? '2px dashed #FF6B00' : '1px solid var(--border)',
            borderRadius: 20,
            boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            animation: 'chatSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            transition: 'border 0.2s, background 0.2s',
          }}>
          <style>{`
            @keyframes chatSlideUp {
              from { opacity:0; transform:translateY(20px) scale(0.95); }
              to   { opacity:1; transform:translateY(0) scale(1); }
            }
            @keyframes spin { to { transform: rotate(360deg) } }
            @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
          `}</style>

          {/* HEADER */}
          <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #FF6B00, #FF8C42)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              {view === 'chat' ? (otherName[0]?.toUpperCase() || '?') : view === 'new' ? '➕' : '💬'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>
                {view === 'chat' ? otherName : view === 'new' ? 'Шинэ чат эхлэх' : 'BizPrint Чат'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#fff' : 'rgba(255,255,255,0.4)', boxShadow: connected ? '0 0 4px #fff' : 'none' }} />
                {connected ? 'Онлайн' : 'Офлайн'}
                {dragOver && <span style={{ marginLeft: 6, fontWeight: 600 }}>📎 Файл оруулах...</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(view === 'chat' || view === 'new') && (
                <button onClick={() => setView('list')}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ←
                </button>
              )}
              <button onClick={() => setView('closed')}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>
          </div>

          {/* NEW CHAT VIEW */}
          {view === 'new' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 13, color: 'var(--text3)', margin: '0 0 8px', textAlign: 'center' }}>
                Хэнтэй харилцах вэ?
              </p>
              {CHAT_TARGETS.filter(t => t.role !== role).map(target => (
                <div key={target.role} onClick={() => startChatWith(target.role, target.label)}
                  style={{ padding: '14px 16px', background: 'var(--surface2)', borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6B00'; e.currentTarget.style.background = 'rgba(255,107,0,0.05)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface2)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: (ROLE_CONFIG[target.role]?.bg || 'rgba(255,107,0,0.1)'), border: `2px solid ${ROLE_CONFIG[target.role]?.color || '#FF6B00'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {target.emoji}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{target.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{target.desc}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', color: 'var(--text3)', fontSize: 16 }}>→</div>
                </div>
              ))}
            </div>
          )}

          {/* ROOM LIST VIEW */}
          {view === 'list' && (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {rooms.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 14 }}>💬</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 8 }}>Сайн байна уу!</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24, lineHeight: 1.6 }}>
                    Adminтай, дизайнертай, борлуулагчтай шууд харилц
                  </div>
                  <button onClick={() => setView('new')}
                    style={{ background: 'linear-gradient(135deg, #FF6B00, #FF8C42)', border: 'none', borderRadius: 12, padding: '12px 24px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, width: '100%', boxShadow: '0 4px 16px rgba(255,107,0,0.35)' }}>
                    💬 Чат эхлэх
                  </button>
                </div>
              ) : (
                <>
                  {rooms.map(room => {
                    const other = room.participant_names.find((n: string) => n !== userName) || 'Admin'
                    const initials = other.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                    return (
                      <div key={room.room_id} onClick={() => { joinRoom(room.room_id); setView('chat') }}
                        style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,107,0,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,107,0,0.1)', border: '2px solid #FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#FF6B00', flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{other}</div>
                            <div style={{ fontSize: 10, color: 'var(--text3)' }}>{room.last_message_at ? formatTime(room.last_message_at) : ''}</div>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {room.last_message?.startsWith('[IMAGE]') ? '📷 Зураг' : room.last_message?.startsWith('[FILE]') ? '📎 Файл' : room.last_message || 'Мессеж байхгүй'}
                          </div>
                        </div>
                        {(room.unread_count ?? 0) > 0 && (
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#FF6B00', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {room.unread_count}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <div style={{ padding: 12 }}>
                    <button onClick={() => setView('new')}
                      style={{ width: '100%', padding: '10px', background: 'transparent', border: '1.5px dashed var(--border2,var(--border))', borderRadius: 10, color: 'var(--text3)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                      + Шинэ чат эхлэх
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* CHAT VIEW */}
          {view === 'chat' && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeMessages.length === 0 && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>Сайн байна уу!</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>Асуухыг хүссэн зүйлээ бичнэ үү</div>
                  </div>
                )}

                {activeMessages.map((msg, i) => {
                  const isMe = msg.sender_id === userId
                  const prevMsg = activeMessages[i - 1]
                  const showName = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id)
                  const showTime = !activeMessages[i + 1] || activeMessages[i + 1].sender_id !== msg.sender_id

                  return (
                    <div key={msg.id || i}>
                      {showName && (
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#FF6B00', marginBottom: 3, marginLeft: 40 }}>
                          {msg.sender_name}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        {!isMe && (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,107,0,0.1)', border: '1.5px solid #FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#FF6B00', flexShrink: 0, alignSelf: 'flex-end', marginBottom: 2 }}>
                            {(msg.sender_name || 'U')[0]?.toUpperCase()}
                          </div>
                        )}
                        <div style={{ maxWidth: '76%' }}>
                          {renderMessage(msg)}
                          {showTime && (
                            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                              {formatTime(msg.created_at)}
                              {isMe && <span style={{ marginLeft: 4, color: '#10B981' }}>✓✓</span>}
                            </div>
                          )}
                        </div>
                        {isMe && (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: myCfg.bg, border: `1.5px solid ${myCfg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: myCfg.color, flexShrink: 0, alignSelf: 'flex-end' }}>
                            {userName[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                {uploading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ padding: '10px 14px', background: 'rgba(255,107,0,0.1)', borderRadius: 12, fontSize: 13, color: '#FF6B00', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #FF6B00', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                      Байршуулж байна...
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* INPUT */}
              <div style={{ padding: '10px 12px 12px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf,.ai,.psd,.zip,.doc,.docx" onChange={handleFileInput} style={{ display: 'none' }} />

                <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '7px 7px 7px 12px', transition: 'border-color 0.2s' }}>
                  <button onClick={() => fileInputRef.current?.click()}
                    title="Файл/зураг илгээх"
                    style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 16, flexShrink: 0, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,0,0.1)'; e.currentTarget.style.color = '#FF6B00' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text3)' }}>
                    📎
                  </button>

                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={e => { setText(e.target.value); setRows(Math.min(e.target.value.split('\n').length, 4)) }}
                    onKeyDown={handleKeyDown}
                    rows={rows}
                    placeholder="Мессеж бичнэ үү..."
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 13, outline: 'none', resize: 'none', padding: '3px 0', lineHeight: 1.5, fontFamily: 'inherit', minHeight: 24, maxHeight: 100 }}
                  />

                  <button onClick={send} disabled={!text.trim() || uploading}
                    style={{
                      width: 34, height: 34, borderRadius: 9, border: 'none', flexShrink: 0,
                      cursor: text.trim() ? 'pointer' : 'default',
                      background: text.trim() ? 'linear-gradient(135deg, #FF6B00, #FF8C42)' : 'var(--border)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                      boxShadow: text.trim() ? '0 3px 10px rgba(255,107,0,0.4)' : 'none',
                    }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                    📎 Drag & drop эсвэл товч дарж файл оруулна уу
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>Enter илгээх</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TOGGLE BUTTON */}
      <button
        onClick={() => {
          if (view === 'closed') {
            if (rooms.length === 0) setView('new')
            else if (rooms.length === 1) { joinRoom(rooms[0].room_id); setView('chat') }
            else setView('list')
          } else {
            setView('closed')
          }
        }}
        style={{
          width: 54, height: 54, borderRadius: '50%',
          background: view !== 'closed' ? 'var(--surface)' : 'linear-gradient(135deg, #FF6B00, #FF8C42)',
          border: view !== 'closed' ? '2px solid var(--border)' : 'none',
          cursor: 'pointer', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: view !== 'closed' ? '0 4px 16px rgba(0,0,0,0.15)' : '0 6px 24px rgba(255,107,0,0.45)',
          transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
        {view !== 'closed' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {totalUnread > 0 && view === 'closed' && (
          <div style={{
            position: 'absolute', top: -2, right: -2,
            width: 20, height: 20, borderRadius: '50%',
            background: '#EF4444', color: '#fff',
            fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg)',
            animation: 'pulse 2s infinite',
          }}>
            {totalUnread > 9 ? '9+' : totalUnread}
          </div>
        )}
      </button>
    </div>
  )
}
