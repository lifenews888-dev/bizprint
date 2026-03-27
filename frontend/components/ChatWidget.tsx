'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { apiFetch, apiUpload, API_URL } from '@/lib/api'

interface Msg {
  id?: string
  from: string
  fromName?: string
  text: string
  type?: 'text' | 'image' | 'file'
  fileUrl?: string
  fileName?: string
  createdAt?: string
}

function getUser() {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
}
function getToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('access_token') || localStorage.getItem('token') || ''
}

function parseMsg(raw: any, myId: string): Msg {
  const senderId = raw.sender_id || raw.senderId || ''
  const content = raw.message || raw.content || ''
  let type: Msg['type'] = 'text'
  let fileUrl = raw.file_url || ''
  let fileName = ''

  if (content.startsWith('[IMAGE]')) {
    type = 'image'; fileUrl = content.replace('[IMAGE]', '')
  } else if (content.startsWith('[FILE]')) {
    type = 'file'
    const parts = content.replace('[FILE]', '').split('|')
    fileName = parts[0]; fileUrl = parts[1] || parts[0]
  } else if (fileUrl) {
    type = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl) ? 'image' : 'file'
    fileName = fileUrl.split('/').pop() || 'file'
  }

  return {
    from: senderId === myId ? 'me' : 'other',
    fromName: raw.sender_name || raw.senderName || '',
    text: type === 'text' ? content : '',
    type, fileUrl, fileName,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
  }
}

function formatTime(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'Одоо'
  if (diff < 3600000) return Math.floor(diff / 60000) + ' мин'
  return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [rooms, setRooms] = useState<any[]>([])
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const [view, setView] = useState<'list' | 'chat'>('list')
  const [uploading, setUploading] = useState(false)
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const userRef = useRef(getUser())
  const activeRoomRef = useRef<string | null>(null)

  // Keep ref in sync
  useEffect(() => { activeRoomRef.current = activeRoom }, [activeRoom])

  // Connect socket
  useEffect(() => {
    const u = getUser()
    userRef.current = u
    if (!u?.id) return

    const s = io(`${API_URL}/chat`, {
      transports: ['websocket', 'polling'],
      auth: { token: getToken() },
      query: { userId: u.id, userName: u.full_name || u.name || u.email, role: u.role || 'customer' },
      reconnection: true,
      reconnectionDelay: 2000,
    })
    socketRef.current = s

    s.on('connect', () => {
      setConnected(true)
      s.emit('join', { userId: u.id, userName: u.full_name || u.name || u.email, role: u.role })
    })
    s.on('disconnect', () => setConnected(false))

    // Room list
    s.on('room_list', (data: any[]) => { if (Array.isArray(data)) setRooms(data) })
    s.on('joined', (data: any) => { if (data?.rooms) setRooms(data.rooms) })

    // Fetch rooms via REST too
    apiFetch<any[]>(`/chat/rooms/user/${u.id}`).then(d => {
      if (Array.isArray(d) && d.length) setRooms(d)
    }).catch(() => {})

    s.on('room_created', (room: any) => {
      setRooms(prev => prev.some(r => r.room_id === room.room_id) ? prev : [room, ...prev])
    })

    // Incoming message (listen to BOTH event names)
    const handleIncoming = (raw: any) => {
      const roomId = raw.room_id
      const senderId = raw.sender_id || raw.senderId
      const senderName = raw.sender_name || raw.senderName || ''
      const content = raw.message || raw.content || ''

      // Update room's last message
      setRooms(prev => prev.map(r =>
        r.room_id === roomId
          ? { ...r, last_message: content, last_message_at: new Date().toISOString(), unread_count: activeRoomRef.current === roomId ? 0 : (r.unread_count || 0) + 1 }
          : r
      ))

      // If viewing this room, add message directly
      if (activeRoomRef.current === roomId && senderId !== u.id) {
        const msg = parseMsg(raw, u.id)
        setMessages(prev => [...prev, msg])
      }

      // Unread + notification if from someone else
      if (senderId !== u.id) {
        setUnread(prev => prev + 1)
        // Browser notification
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('BizPrint — Шинэ мессеж', {
            body: `${senderName}: ${content.substring(0, 80)}`,
            icon: '/logo.png',
            tag: 'bizprint-chat-' + roomId,
          })
        }
        // Audio beep
        try { new Audio('data:audio/wav;base64,UklGRl9vT19teleVFRhdAEAAB...').play().catch(() => {}) } catch {}
      }
    }
    s.on('message', handleIncoming)
    s.on('new_message', handleIncoming)

    // Admin notifications
    s.on('notify', (data: any) => {
      if (data?.type === 'chat' && data.sender_id !== u.id) {
        setUnread(prev => prev + 1)
      }
    })

    return () => { s.disconnect(); socketRef.current = null }
  }, [])

  // Request notification permission
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Scroll to bottom
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Open room
  const openRoom = useCallback((roomId: string) => {
    const u = userRef.current
    setActiveRoom(roomId)
    setView('chat')
    setMessages([])

    apiFetch<any[]>(`/chat/messages/${roomId}?limit=50`).then(d => {
      if (Array.isArray(d)) setMessages(d.map(m => parseMsg(m, u?.id || '')))
    }).catch(() => {})

    socketRef.current?.emit('join_room', { room_id: roomId })
    socketRef.current?.emit('mark_read', { room_id: roomId, user_id: u?.id })
    setRooms(prev => prev.map(r => r.room_id === roomId ? { ...r, unread_count: 0 } : r))
  }, [])

  // Send text
  const send = useCallback(() => {
    if (!input.trim() || !activeRoom) return
    const u = userRef.current
    socketRef.current?.emit('send_message', {
      room_id: activeRoom,
      message: input.trim(),
      sender_id: u?.id,
      sender_name: u?.full_name || u?.name || u?.email || '',
      sender_role: u?.role || 'customer',
    })
    setMessages(prev => [...prev, { from: 'me', text: input.trim(), type: 'text', createdAt: new Date().toISOString() }])
    setInput('')
  }, [input, activeRoom])

  // Send file
  async function handleFile(file: File) {
    if (!activeRoom) return
    const u = userRef.current
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const data = await apiUpload<any>('/upload/file', fd)
      const url = data.url || `${API_URL}/uploads/${data.filename}`
      const isImage = file.type.startsWith('image/')
      const msgText = isImage ? `[IMAGE]${url}` : `[FILE]${file.name}|${url}`

      socketRef.current?.emit('send_message', {
        room_id: activeRoom,
        message: msgText,
        sender_id: u?.id,
        sender_name: u?.full_name || u?.name || u?.email || '',
        sender_role: u?.role || 'customer',
        file_url: url,
      })

      setMessages(prev => [...prev, {
        from: 'me', text: '', type: isImage ? 'image' : 'file',
        fileUrl: url, fileName: file.name, createdAt: new Date().toISOString(),
      }])
    } finally { setUploading(false) }
  }

  const toggle = () => { setOpen(!open); if (!open) setUnread(0) }

  const otherName = (room: any) => {
    const u = userRef.current
    const myName = u?.full_name || u?.name || u?.email
    return room?.participant_names?.find((n: string) => n !== myName) || room?.participant_names?.[0] || 'Чат'
  }

  // Render message content
  function MsgContent({ m }: { m: Msg }) {
    if (m.type === 'image' && m.fileUrl) {
      return (
        <img
          src={m.fileUrl} alt="img"
          onClick={() => setPreviewImg(m.fileUrl!)}
          className="max-w-[200px] max-h-[160px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
        />
      )
    }
    if (m.type === 'file' && m.fileUrl) {
      const ext = (m.fileName || '').split('.').pop()?.toUpperCase() || 'FILE'
      return (
        <a href={m.fileUrl} target="_blank" rel="noreferrer"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg no-underline ${m.from === 'me' ? 'bg-white/15' : 'bg-[#F3F4F6]'}`}>
          <div className="w-8 h-8 rounded bg-[rgba(255,107,0,0.12)] flex items-center justify-center text-[9px] font-extrabold text-[#FF6B00] flex-shrink-0">{ext}</div>
          <div className="min-w-0">
            <div className={`text-xs font-medium truncate ${m.from === 'me' ? 'text-white' : 'text-[#333]'}`}>{m.fileName || 'Файл'}</div>
            <div className={`text-[10px] ${m.from === 'me' ? 'text-white/60' : 'text-[#999]'}`}>Татах</div>
          </div>
        </a>
      )
    }
    return <span>{m.text}</span>
  }

  return (
    <>
      {/* Image preview */}
      {previewImg && (
        <div onClick={() => setPreviewImg(null)} className="fixed inset-0 bg-black/90 z-[2000] flex items-center justify-center cursor-zoom-out backdrop-blur-sm">
          <img src={previewImg} className="max-w-[90vw] max-h-[90vh] rounded-xl" alt="" />
          <button onClick={() => setPreviewImg(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center text-lg border-none cursor-pointer">✕</button>
        </div>
      )}

      {/* Toggle button + badge */}
      <button onClick={toggle}
        className="chat-widget fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#FF6B00] hover:bg-[#E55D00] border-none cursor-pointer shadow-lg shadow-orange-500/30 flex items-center justify-center z-[1000] transition-all hover:scale-105">
        <span className="text-white text-xl">{open ? '✕' : '💬'}</span>
        {unread > 0 && !open && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1 animate-bounce">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="chat-box fixed bottom-20 right-6 w-[360px] max-h-[520px] bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden z-[1000] shadow-2xl flex flex-col">
          <input ref={fileRef} type="file" accept="image/*,.pdf,.ai,.psd,.eps,.zip,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} className="hidden" />

          {/* Header */}
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between bg-gradient-to-r from-[#FF6B00] to-[#FF8C42] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              {view === 'chat' && (
                <button onClick={() => { setView('list'); setActiveRoom(null) }} className="text-white/80 hover:text-white text-base mr-0.5 bg-transparent border-none cursor-pointer">←</button>
              )}
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {view === 'chat' && activeRoom ? (otherName(rooms.find(r => r.room_id === activeRoom)) || 'U')[0].toUpperCase() : 'B'}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-white truncate max-w-[160px]">
                  {view === 'chat' && activeRoom ? otherName(rooms.find(r => r.room_id === activeRoom)) : 'BizPrint'}
                </div>
                <div className="text-[10px] text-white/70 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-300' : 'bg-red-300'}`} />
                  {connected ? 'Онлайн' : 'Холболтгүй'}
                </div>
              </div>
            </div>
          </div>

          {/* Room list */}
          {view === 'list' && (
            <div className="flex-1 overflow-y-auto max-h-[420px]">
              {rooms.length === 0 ? (
                <div className="py-12 text-center text-[#999] text-sm">
                  <div className="text-3xl mb-2">💬</div>
                  Чат байхгүй
                </div>
              ) : rooms.map(room => {
                let lastMsg = room.last_message || ''
                if (lastMsg.startsWith('[IMAGE]')) lastMsg = '📷 Зураг'
                else if (lastMsg.startsWith('[FILE]')) lastMsg = '📎 Файл'
                return (
                  <div key={room.room_id} onClick={() => openRoom(room.room_id)}
                    className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-[#F8F8F8] border-b border-[#F3F4F6] transition-colors">
                    <div className="w-9 h-9 rounded-full bg-blue-50 border-2 border-blue-400 flex items-center justify-center text-xs font-bold text-blue-500 flex-shrink-0">
                      {(otherName(room))[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <span className="text-[13px] font-semibold text-[#111] truncate">{otherName(room)}</span>
                        <span className="text-[10px] text-[#999] flex-shrink-0 ml-2">{formatTime(room.last_message_at)}</span>
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span className="text-[11px] text-[#999] truncate">{lastMsg}</span>
                        {(room.unread_count || 0) > 0 && (
                          <span className="flex-shrink-0 bg-[#FF6B00] text-white rounded-full min-w-[16px] h-4 text-[9px] font-bold flex items-center justify-center px-1 ml-1">
                            {room.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Chat view */}
          {view === 'chat' && activeRoom && (
            <>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 max-h-[360px]">
                {messages.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-[#BBB] py-8">
                    <div className="text-3xl mb-2">👋</div>
                    <div className="text-xs">Харилцаа эхлүүлэх</div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`max-w-[82%] ${m.from === 'me' ? 'self-end' : 'self-start'}`}>
                    {m.from !== 'me' && m.fromName && i > 0 && messages[i-1]?.from === 'me' && (
                      <div className="text-[10px] text-[#999] mb-0.5 ml-1">{m.fromName}</div>
                    )}
                    <div className={`px-3 py-2 text-[13px] leading-relaxed ${
                      m.from === 'me'
                        ? 'bg-[#FF6B00] text-white rounded-[14px_14px_4px_14px]'
                        : 'bg-[#F3F4F6] text-[#333] rounded-[14px_14px_14px_4px]'
                    }`}>
                      <MsgContent m={m} />
                    </div>
                    <div className={`text-[9px] text-[#CCC] mt-0.5 ${m.from === 'me' ? 'text-right mr-1' : 'ml-1'}`}>
                      {formatTime(m.createdAt)}
                    </div>
                  </div>
                ))}
                {uploading && (
                  <div className="self-end px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-xs text-[#FF6B00] flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full border-2 border-[#FF6B00] border-t-transparent animate-spin" />
                    Илгээж байна...
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input + file button */}
              <div className="p-2 border-t border-[#E5E7EB] flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => fileRef.current?.click()}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#999] hover:text-[#FF6B00] hover:bg-orange-50 transition-colors text-sm bg-transparent border-none cursor-pointer flex-shrink-0"
                  title="Файл хавсаргах">
                  📎
                </button>
                <input
                  value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder="Мессеж бичих..."
                  className="flex-1 px-3 py-2 bg-[#F8F8F8] border border-[#E5E7EB] rounded-lg text-[13px] text-[#333] outline-none focus:border-[#FF6B00] transition-colors placeholder:text-[#BBB]"
                />
                <button onClick={send} disabled={!input.trim()}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border-none cursor-pointer transition-colors flex-shrink-0 ${
                    input.trim() ? 'bg-[#FF6B00] hover:bg-[#E55D00] text-white' : 'bg-[#E5E7EB] text-[#999] cursor-default'
                  }`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
