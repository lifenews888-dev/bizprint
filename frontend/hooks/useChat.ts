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
  function normalise(m: any): Message {
    return {
      id: m.id,
      room_id: m.room_id,
      sender_id: m.sender_id || m.senderId || '',
      sender_name: m.sender_name || m.senderName,
      sender_role: m.sender_role || m.senderRole,
      message: m.message || m.content || m.text || '',
      type: m.msg_type || m.type || 'text',
      created_at: m.created_at || m.timestamp || new Date().toISOString(),
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
        if (Array.isArray(data)) setRooms(data)
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
    socket.on('joined', (data: { rooms: Room[] }) => {
      if (Array.isArray(data.rooms)) setRooms(data.rooms)
    })

    socket.on('room_created', (data: { room: Room }) => {
      if (!data.room) return
      setRooms(prev => {
        if (prev.find(r => r.room_id === data.room.room_id)) return prev
        return [data.room, ...prev]
      })
    })

    // Backend emits 'new_message' (primary) and 'message' (compat)
    const handleIncomingMessage = (data: any) => {
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
      (data: { room_id: string; messages: any[] }) => {
        if (data.room_id && Array.isArray(data.messages)) {
          setMessages(prev => ({
            ...prev,
            [data.room_id]: data.messages.map(normalise),
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
