# BizPrint Chat UI Setup
$FRONT = "C:\Users\User\projects\bizprint\frontend"
$ADMIN = "C:\Users\User\projects\bizprint\frontend\app\admin"
$DASH = "C:\Users\User\projects\bizprint\frontend\app\dashboard"
$COMP = "C:\Users\User\projects\bizprint\frontend\components"

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  BizPrint Chat UI Setup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

function Write-File($path, $content) {
    $dir = Split-Path $path
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
    Write-Host "  [OK] $path" -ForegroundColor Green
}

# ============================================================
# 1. Shared Chat Hook
# ============================================================
Write-Host ""
Write-Host "[1/3] Shared useChat hook..." -ForegroundColor Yellow

Write-File "$FRONT\hooks\useChat.ts" @"
'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

export interface ChatMessage {
  id: number
  room_id: string
  sender_id: string
  sender_name: string
  sender_role: string
  message: string
  file_url?: string
  is_read: boolean
  created_at: string
}

export interface ChatRoom {
  id: number
  room_id: string
  type: string
  order_id?: string
  participants: string[]
  participant_names: string[]
  last_message?: string
  last_message_at?: string
  unread_count: number
}

export function useChat(userId: string, userName: string, role: string) {
  const socketRef = useRef<Socket | null>(null)
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({})
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!userId) return
    const socket = io('http://localhost:4000/chat', { transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join', { userId, userName, role })
    })

    socket.on('joined', (data: { rooms: ChatRoom[] }) => {
      setRooms(data.rooms)
    })

    socket.on('room_messages', (data: { room_id: string; messages: ChatMessage[] }) => {
      setMessages(prev => ({ ...prev, [data.room_id]: data.messages }))
    })

    socket.on('new_message', (msg: ChatMessage) => {
      setMessages(prev => ({
        ...prev,
        [msg.room_id]: [...(prev[msg.room_id] || []), msg],
      }))
      setRooms(prev => prev.map(r =>
        r.room_id === msg.room_id
          ? { ...r, last_message: msg.message, last_message_at: msg.created_at }
          : r
      ))
    })

    socket.on('room_created', (room: ChatRoom) => {
      setRooms(prev => {
        const exists = prev.find(r => r.room_id === room.room_id)
        return exists ? prev : [room, ...prev]
      })
    })

    socket.on('disconnect', () => setConnected(false))

    return () => { socket.disconnect() }
  }, [userId, userName, role])

  const joinRoom = useCallback((room_id: string) => {
    setActiveRoom(room_id)
    socketRef.current?.emit('join_room', { room_id })
    socketRef.current?.emit('mark_read', { room_id, user_id: userId })
  }, [userId])

  const sendMessage = useCallback((room_id: string, message: string) => {
    if (!message.trim()) return
    socketRef.current?.emit('send_message', {
      room_id, sender_id: userId, sender_name: userName, sender_role: role, message,
    })
  }, [userId, userName, role])

  const createRoom = useCallback((params: {
    type: string
    participants: string[]
    participantNames: string[]
    orderId?: string
  }) => {
    socketRef.current?.emit('create_room', params)
  }, [])

  return { rooms, messages, activeRoom, connected, joinRoom, sendMessage, createRoom, setActiveRoom }
}
"@

# ============================================================
# 2. Admin Chat Page
# ============================================================
Write-Host "[2/3] Admin chat page..." -ForegroundColor Yellow

Write-File "$ADMIN\chat\page.tsx" @"
'use client'
import { useState, useEffect, useRef } from 'react'
import { useChat } from '@/hooks/useChat'

const ADMIN_ID = 'admin'
const ADMIN_NAME = 'Admin'

export default function AdminChatPage() {
  const { rooms, messages, activeRoom, connected, joinRoom, sendMessage, createRoom } = useChat(ADMIN_ID, ADMIN_NAME, 'admin')
  const [text, setText] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [showNew, setShowNew] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('http://localhost:4000/admin/users', {
      headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || '') }
    }).then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeRoom])

  function send() {
    if (!activeRoom || !text.trim()) return
    sendMessage(activeRoom, text)
    setText('')
  }

  function startChat(user: any) {
    const roomParams = {
      type: 'support',
      participants: [ADMIN_ID, user.id],
      participantNames: [ADMIN_NAME, user.name || user.email],
    }
    createRoom(roomParams)
    setShowNew(false)
    setSelectedUser(user)
  }

  const activeMessages = activeRoom ? (messages[activeRoom] || []) : []
  const activeRoomData = rooms.find(r => r.room_id === activeRoom)

  const roleColor: Record<string, string> = {
    admin: '#FF6B00', designer: '#8B5CF6', courier: '#10B981',
    customer: '#3B82F6', vendor: '#F59E0B',
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 54px)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit' }}>

      {/* Sidebar */}
      <div style={{ width: 300, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Чат</div>
            <div style={{ fontSize: 11, color: connected ? '#10B981' : '#EF4444', marginTop: 2 }}>
              {connected ? 'Холбогдсон' : 'Холбогдоогүй'}
            </div>
          </div>
          <button onClick={() => setShowNew(true)}
            style={{ background: '#FF6B00', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            + Шинэ
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {rooms.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              Чат байхгүй байна
            </div>
          )}
          {rooms.map(room => {
            const otherName = room.participant_names.find(n => n !== ADMIN_NAME) || room.participant_names[0]
            const isActive = activeRoom === room.room_id
            return (
              <div key={room.room_id} onClick={() => joinRoom(room.room_id)}
                style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: isActive ? 'rgba(255,107,0,0.08)' : 'transparent', borderLeft: isActive ? '3px solid #FF6B00' : '3px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{otherName}</div>
                  {room.unread_count > 0 && (
                    <span style={{ background: '#FF6B00', color: '#fff', borderRadius: 10, padding: '2px 7px', fontSize: 11, fontWeight: 700 }}>
                      {room.unread_count}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {room.last_message || 'Мессеж байхгүй'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                  {room.type === 'support' ? 'Тусламж' : room.type === 'order' ? 'Захиалга' : room.type}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!activeRoom ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Чат сонгоно уу</div>
              <div style={{ fontSize: 13 }}>Зүүн талаас чат сонгох эсвэл шинэ чат үүсгэнэ үү</div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700 }}>
                  {activeRoomData?.participant_names.find(n => n !== ADMIN_NAME)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{activeRoomData?.type}</div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeMessages.map(msg => {
                const isMe = msg.sender_id === ADMIN_ID
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '70%' }}>
                      {!isMe && (
                        <div style={{ fontSize: 11, color: roleColor[msg.sender_role] || 'var(--text3)', marginBottom: 3, fontWeight: 600 }}>
                          {msg.sender_name} · {msg.sender_role}
                        </div>
                      )}
                      <div style={{
                        background: isMe ? '#FF6B00' : 'var(--surface)',
                        color: isMe ? '#fff' : 'var(--text)',
                        padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        fontSize: 14, lineHeight: 1.5, border: isMe ? 'none' : '1px solid var(--border)',
                      }}>
                        {msg.message}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                        {new Date(msg.created_at).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Мессеж бичнэ үү..."
                style={{ flex: 1, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 14, outline: 'none' }}
              />
              <button onClick={send}
                style={{ background: '#FF6B00', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                Илгээх
              </button>
            </div>
          </>
        )}
      </div>

      {/* New chat modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, width: 400, border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Шинэ чат үүсгэх</h3>
            <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {users.filter(u => u.id !== ADMIN_ID).map(user => (
                <div key={user.id} onClick={() => startChat(user)}
                  style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name || user.email}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{user.email}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: (roleColor[user.role] || '#888') + '20', color: roleColor[user.role] || '#888', fontWeight: 600 }}>
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowNew(false)}
              style={{ marginTop: 16, width: '100%', padding: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', cursor: 'pointer' }}>
              Болих
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
"@

# ============================================================
# 3. Dashboard Chat Widget
# ============================================================
Write-Host "[3/3] Dashboard chat widget..." -ForegroundColor Yellow

Write-File "$COMP\ChatBox.tsx" @"
'use client'
import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/hooks/useChat'

interface Props {
  userId: string
  userName: string
  role: string
}

export default function ChatBox({ userId, userName, role }: Props) {
  const { rooms, messages, activeRoom, connected, joinRoom, sendMessage, createRoom } = useChat(userId, userName, role)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const totalUnread = rooms.reduce((s, r) => s + (r.unread_count || 0), 0)

  useEffect(() => {
    if (open && !activeRoom && rooms.length > 0) {
      joinRoom(rooms[0].room_id)
    }
  }, [open, rooms])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeRoom])

  function send() {
    if (!activeRoom || !text.trim()) return
    sendMessage(activeRoom, text)
    setText('')
  }

  function startSupportChat() {
    createRoom({
      type: 'support',
      participants: [userId, 'admin'],
      participantNames: [userName, 'Admin'],
    })
  }

  const activeMessages = activeRoom ? (messages[activeRoom] || []) : []

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999 }}>
      {open && (
        <div style={{ position: 'absolute', bottom: 70, right: 0, width: 360, height: 500, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '14px 16px', background: '#FF6B00', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>BizPrint Чат</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>{connected ? 'Онлайн' : 'Холбогдоогүй'}</div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '4px 8px', color: '#fff', cursor: 'pointer', fontSize: 16 }}>
              ✕
            </button>
          </div>

          {/* Room list */}
          {!activeRoom ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rooms.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text3)', paddingTop: 40 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
                  <div style={{ fontSize: 14, marginBottom: 16 }}>Чат байхгүй байна</div>
                  <button onClick={startSupportChat}
                    style={{ background: '#FF6B00', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                    Тусламж авах
                  </button>
                </div>
              )}
              {rooms.map(room => (
                <div key={room.room_id} onClick={() => joinRoom(room.room_id)}
                  style={{ padding: '12px', background: 'var(--surface2)', borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {room.participant_names.find(n => n !== userName) || 'Admin'}
                    </div>
                    {room.unread_count > 0 && (
                      <span style={{ background: '#FF6B00', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>
                        {room.unread_count}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {room.last_message || 'Мессеж байхгүй'}
                  </div>
                </div>
              ))}
              {rooms.length > 0 && (
                <button onClick={startSupportChat}
                  style={{ background: 'var(--surface2)', border: '1px dashed var(--border)', borderRadius: 10, padding: '10px', color: 'var(--text3)', cursor: 'pointer', fontSize: 13 }}>
                  + Тусламж авах
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => joinRoom('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 18, padding: 0 }}>
                  ←
                </button>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {rooms.find(r => r.room_id === activeRoom)?.participant_names.find(n => n !== userName) || 'Чат'}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeMessages.map(msg => {
                  const isMe = msg.sender_id === userId
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '80%', padding: '8px 12px',
                        background: isMe ? '#FF6B00' : 'var(--surface2)',
                        color: isMe ? '#fff' : 'var(--text)',
                        borderRadius: isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                        fontSize: 13, lineHeight: 1.5,
                        border: isMe ? 'none' : '1px solid var(--border)',
                      }}>
                        {msg.message}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder="Мессеж..."
                  style={{ flex: 1, padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none' }}
                />
                <button onClick={send}
                  style={{ background: '#FF6B00', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => setOpen(!open)}
        style={{ width: 52, height: 52, borderRadius: '50%', background: '#FF6B00', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(255,107,0,0.4)', position: 'relative' }}>
        <span style={{ fontSize: 22 }}>{open ? '✕' : '💬'}</span>
        {totalUnread > 0 && !open && (
          <span style={{ position: 'absolute', top: -4, right: -4, background: '#EF4444', color: '#fff', borderRadius: '50%', width: 20, height: 20, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {totalUnread}
          </span>
        )}
      </button>
    </div>
  )
}
"@

# ============================================================
# Add Chat to Admin sidebar
# ============================================================
$adminLayout = "$FRONT\app\admin\layout.tsx"
$al = [System.IO.File]::ReadAllText($adminLayout, [System.Text.Encoding]::UTF8)
if ($al -notmatch "admin/chat") {
    $al = $al -replace "(\{ label:'Workflow'.*?\})", "`$1,`n    { label:'Чат', href:'/admin/chat', icon:'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }"
    [System.IO.File]::WriteAllText($adminLayout, $al, [System.Text.Encoding]::UTF8)
    Write-Host "  [OK] Chat added to admin sidebar" -ForegroundColor Green
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  CHAT UI DONE!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin chat: http://localhost:3000/admin/chat" -ForegroundColor Yellow
Write-Host "Dashboard:  ChatBox component dashboard-d nemne" -ForegroundColor Yellow
Write-Host ""
