'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { API_URL } from '@/lib/api'

const SOCKET_URL = API_URL
const API = API_URL

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Room {
  room_id: string
  participants: string[]
  participant_names: string[]
  last_message?: string
  last_message_at?: string
  unread_count?: number
}

export interface Message {
  id?: string
  room_id?: string
  sender_id: string
  sender_name?: string
  sender_role?: string
  message: string
  type?: 'text' | 'image' | 'system'
  created_at: string
}

type MessageType = NonNullable<Message['type']>

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}

const stringValue = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(item => stringValue(item)).filter(Boolean) : []

const normaliseType = (value: unknown): MessageType => {
  const type = stringValue(value)
  return ['text', 'image', 'system'].includes(type) ? type as MessageType : 'text'
}

function normaliseRoom(value: unknown): Room | null {
  const room = asRecord(value)
  const roomId = stringValue(room.room_id ?? room.roomId ?? room.id)
  if (!roomId) return null

  return {
    room_id: roomId,
    participants: stringArray(room.participants),
    participant_names: stringArray(room.participant_names ?? room.participantNames),
    last_message: stringValue(room.last_message ?? room.lastMessage) || undefined,
    last_message_at: stringValue(room.last_message_at ?? room.lastMessageAt) || undefined,
    unread_count: Number(room.unread_count ?? room.unreadCount ?? 0) || 0,
  }
}

function normaliseRooms(value: unknown): Room[] {
  return Array.isArray(value)
    ? value.map(normaliseRoom).filter((room): room is Room => room !== null)
    : []
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useChat(userId: string, userName: string, role: string) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const socketRef = useRef<Socket | null>(null)
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({})

  // ── Helper: read auth token from either key ────────────────────────────────
  function token() {
    if (typeof window === 'undefined') return ''
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      ''
    )
  }

  // ── Normalise raw backend message object to Message interface ──────────────
  function normalise(value: unknown): Message {
    const m = asRecord(value)
    return {
      id: stringValue(m.id) || undefined,
      room_id: stringValue(m.room_id),
      sender_id: stringValue(m.sender_id) || stringValue(m.senderId),
      sender_name: stringValue(m.sender_name) || stringValue(m.senderName) || undefined,
      sender_role: stringValue(m.sender_role) || stringValue(m.senderRole) || undefined,
      message: stringValue(m.message) || stringValue(m.content) || stringValue(m.text),
      type: normaliseType(m.msg_type ?? m.type),
      created_at: stringValue(m.created_at) || stringValue(m.timestamp) || new Date().toISOString(),
    }
  }

  // ── Prefetch rooms from REST API ───────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    fetch(`${API}/api/chat/rooms`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(data => {
        const nextRooms = normaliseRooms(data)
        if (nextRooms.length > 0) setRooms(nextRooms)
      })
      .catch(() => {})
  }, [userId])

  // ── Socket.IO connection ───────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return

    const socket = io(`${SOCKET_URL}/chat`, {
      auth: { token: token() },
      query: { userId, userName, role },
      transports: ['websocket'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      // Register user with server so admin-notify and room joins are set up
      socket.emit('join', { userId, userName, role })
    })

    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', () => setConnected(false))

    // After 'join' the server sends back the user's rooms
    socket.on('joined', (data: unknown) => {
      const nextRooms = normaliseRooms(asRecord(data).rooms)
      if (nextRooms.length > 0) setRooms(nextRooms)
    })

    socket.on('room_created', (data: unknown) => {
      const room = normaliseRoom(asRecord(data).room)
      if (!room) return
      setRooms(prev => {
        if (prev.find(r => r.room_id === room.room_id)) return prev
        return [room, ...prev]
      })
    })

    // Backend emits 'new_message' (primary) and 'message' (compat)
    const handleIncomingMessage = (data: unknown) => {
      const msg = normalise(data)
      if (!msg.room_id) return
      setMessages(prev => ({
        ...prev,
        [msg.room_id!]: [...(prev[msg.room_id!] || []), msg],
      }))
      setRooms(prev =>
        prev.map(r =>
          r.room_id === msg.room_id
            ? { ...r, last_message: msg.message, last_message_at: msg.created_at }
            : r,
        ),
      )
    }
    socket.on('new_message', handleIncomingMessage)
    socket.on('message', handleIncomingMessage)

    // Room history after joining a room
    socket.on(
      'room_messages',
      (data: unknown) => {
        const payload = asRecord(data)
        const roomId = stringValue(payload.room_id)
        const source = Array.isArray(payload.messages) ? payload.messages : []
        if (roomId && source.length > 0) {
          setMessages(prev => ({
            ...prev,
            [roomId]: source.map(normalise),
          }))
        }
      },
    )

    // Typing indicator events
    socket.on(
      'user_typing',
      (data: { room_id: string; user_name: string; user_id: string }) => {
        if (data.user_id === userId) return
        setTypingUsers(prev => {
          const current = prev[data.room_id] || []
          if (current.includes(data.user_name)) return prev
          return { ...prev, [data.room_id]: [...current, data.user_name] }
        })
        const key = `${data.room_id}_${data.user_id}`
        if (typingTimeoutRef.current[key])
          clearTimeout(typingTimeoutRef.current[key])
        typingTimeoutRef.current[key] = setTimeout(() => {
          setTypingUsers(prev => {
            const current = prev[data.room_id] || []
            return {
              ...prev,
              [data.room_id]: current.filter(n => n !== data.user_name),
            }
          })
        }, 3000)
      },
    )

    socket.on(
      'user_stop_typing',
      (data: { room_id: string; user_name: string }) => {
        setTypingUsers(prev => {
          const current = prev[data.room_id] || []
          return {
            ...prev,
            [data.room_id]: current.filter(n => n !== data.user_name),
          }
        })
      },
    )

    return () => {
      socket.disconnect()
    }
  }, [userId, userName, role])

  // ── joinRoom ───────────────────────────────────────────────────────────────
  const joinRoom = useCallback((roomId: string) => {
    setActiveRoom(roomId)
    socketRef.current?.emit('join_room', { room_id: roomId })
    fetch(`${API}/api/chat/rooms/${roomId}/messages`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(prev => ({ ...prev, [roomId]: data.map(normalise) }))
        }
      })
      .catch(() => {})
    setRooms(prev =>
      prev.map(r => (r.room_id === roomId ? { ...r, unread_count: 0 } : r)),
    )
  }, [])

  // ── sendMessage(roomId, content) ───────────────────────────────────────────
  const sendMessage = useCallback(
    (roomId: string, content: string) => {
      if (!roomId || !content.trim()) return
      socketRef.current?.emit('send_message', {
        room_id: roomId,
        sender_id: userId,
        sender_name: userName,
        sender_role: role,
        message: content.trim(),
      })
      // Optimistic UI update
      const localMsg: Message = {
        room_id: roomId,
        sender_id: userId,
        sender_name: userName,
        sender_role: role,
        message: content.trim(),
        type: 'text',
        created_at: new Date().toISOString(),
      }
      setMessages(prev => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), localMsg],
      }))
      setRooms(prev =>
        prev.map(r =>
          r.room_id === roomId
            ? { ...r, last_message: content.trim(), last_message_at: localMsg.created_at }
            : r,
        ),
      )
    },
    [userId, userName, role],
  )

  // ── createRoom({ type, participants, participantNames }) ───────────────────
  const createRoom = useCallback(
    (params: {
      type: string
      participants: string[]
      participantNames: string[]
    }) => {
      const { type, participants, participantNames } = params
      const roomId = [...participants].sort().join('_')
      const existing = rooms.find(
        r =>
          r.room_id === roomId ||
          participants.every(p => r.participants?.includes(p)),
      )
      if (existing) {
        joinRoom(existing.room_id)
        return
      }
      socketRef.current?.emit('create_room', {
        room_id: roomId,
        type,
        participants,
        participant_names: participantNames,
      })
      const newRoom: Room = {
        room_id: roomId,
        participants,
        participant_names: participantNames,
      }
      setRooms(prev => [newRoom, ...prev])
      setActiveRoom(roomId)
    },
    [rooms, joinRoom],
  )

  // ── emitTyping ────────────────────────────────────────────────────────────
  const emitTyping = useCallback(
    (roomId: string) => {
      socketRef.current?.emit('typing', {
        room_id: roomId,
        user_id: userId,
        user_name: userName,
      })
    },
    [userId, userName],
  )

  const emitStopTyping = useCallback(
    (roomId: string) => {
      socketRef.current?.emit('stop_typing', {
        room_id: roomId,
        user_id: userId,
        user_name: userName,
      })
    },
    [userId, userName],
  )

  // ── searchMessages ─────────────────────────────────────────────────────────
  const searchMessages = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const getFilteredMessages = useCallback(
    (roomId: string) => {
      const msgs = messages[roomId] || []
      if (!searchQuery.trim()) return msgs
      const q = searchQuery.toLowerCase()
      return msgs.filter(
        m =>
          m.message.toLowerCase().includes(q) ||
          m.sender_name?.toLowerCase().includes(q),
      )
    },
    [messages, searchQuery],
  )

  return {
    rooms,
    messages,
    activeRoom,
    connected,
    joinRoom,
    sendMessage,
    createRoom,
    typingUsers,
    emitTyping,
    emitStopTyping,
    searchQuery,
    searchMessages,
    getFilteredMessages,
  }
}
