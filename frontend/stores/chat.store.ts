/**
 * Zustand Chat Store — single source of truth for all chat state.
 * Replaces 15+ useState hooks in the old monolithic component.
 */
import { create } from 'zustand'
import {
  ChatRoom, ChatMessage, ChatUser, normalizeMessage, normalizeRooms, normalizeUserRole,
  connectSocket, disconnectSocket, getSocket,
  fetchRooms, fetchMessages, fetchUsers, uploadFile,
} from '@/lib/services/chat.service'

/* ═══ Store State ═══ */
interface ChatState {
  /* ── Connection ── */
  connected: boolean
  userId: string
  userName: string
  userRole: string

  /* ── Data ── */
  rooms: ChatRoom[]
  messages: Record<string, ChatMessage[]>    // keyed by room_id
  users: ChatUser[]
  activeRoomId: string | null
  typingUsers: Record<string, string[]>      // keyed by room_id

  /* ── UI ── */
  loading: boolean
  searchQuery: string
  showNewChat: boolean
  previewImage: string | null
  uploading: boolean

  /* ── Actions ── */
  init: (userId: string, userName: string, role: string) => void
  cleanup: () => void
  setActiveRoom: (roomId: string) => void
  sendMessage: (content: string, type?: ChatMessage['type'], file?: ChatMessage['file']) => void
  createRoom: (participantId: string, participantName: string, participantRole: string) => void
  emitTyping: () => void
  emitStopTyping: () => void
  handleFileUpload: (file: File) => Promise<void>
  setSearchQuery: (q: string) => void
  setShowNewChat: (v: boolean) => void
  setPreviewImage: (url: string | null) => void
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}

const stringValue = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

export const useChatStore = create<ChatState>((set, get) => ({
  /* ── Initial state ── */
  connected: false,
  userId: '',
  userName: '',
  userRole: '',
  rooms: [],
  messages: {},
  users: [],
  activeRoomId: null,
  typingUsers: {},
  loading: true,
  searchQuery: '',
  showNewChat: false,
  previewImage: null,
  uploading: false,

  /* ═══════════════════════════════════════
     INITIALIZE — connect socket, fetch data
     ═══════════════════════════════════════ */
  init: (userId, userName, role) => {
    set({ userId, userName, userRole: role, loading: true })

    // Fetch initial data
    Promise.all([
      fetchRooms(userId),
      fetchUsers(),
    ]).then(([rooms, users]) => {
      set({ rooms, users, loading: false })
    })

    // Connect socket
    const socket = connectSocket(userId, userName, role)

    socket.on('connect', () => set({ connected: true }))
    socket.on('disconnect', () => set({ connected: false }))

    // Room list update
    socket.on('room_list', (data: unknown) => {
      const rooms = normalizeRooms(data)
      if (rooms.length > 0) set({ rooms })
    })

    // New room created
    socket.on('room_created', (room: ChatRoom) => {
      set(s => {
        if (s.rooms.some(r => r.room_id === room.room_id)) return s
        return { rooms: [room, ...s.rooms] }
      })
    })

    // Incoming message — listen to both event names (backend emits both)
    const handleIncoming = (raw: unknown) => {
      const msg = normalizeMessage(raw)
      const rawRecord = asRecord(raw)
      const roomId = msg.room_id || stringValue(rawRecord.room_id)
      if (!roomId) return

      set(s => {
        const existing = s.messages[roomId] || []
        // Deduplicate
        if (existing.some(m => m.id === msg.id)) return s

        const updated = { ...s.messages, [roomId]: [...existing, msg] }

        // Update room's last message
        const rooms = s.rooms.map(r =>
          r.room_id === roomId
            ? { ...r, last_message: msg.content || msg.file?.name || '', last_message_at: msg.created_at, unread_count: s.activeRoomId === roomId ? 0 : (r.unread_count || 0) + 1 }
            : r
        )

        return { messages: updated, rooms }
      })
    }
    socket.on('message', handleIncoming)
    socket.on('new_message', handleIncoming)

    // Also listen to 'joined' event with room list
    socket.on('joined', (data: unknown) => {
      const rooms = normalizeRooms(asRecord(data).rooms)
      if (rooms.length > 0) set({ rooms })
    })

    // Message history for a room
    socket.on('room_messages', (data: unknown) => {
      const payload = asRecord(data)
      const roomId = stringValue(payload.room_id) || stringValue(payload.roomId)
      const source = Array.isArray(payload.messages) ? payload.messages : Array.isArray(data) ? data : []
      const msgs = source.map(normalizeMessage)
      if (roomId) {
        set(s => ({ messages: { ...s.messages, [roomId]: msgs } }))
      }
    })

    // Typing
    socket.on('user_typing', (data: unknown) => {
      const payload = asRecord(data)
      const room_id = stringValue(payload.room_id)
      const name = stringValue(payload.userName)
      if (!room_id || !name) return
      set(s => {
        const current = s.typingUsers[room_id] || []
        if (current.includes(name)) return s
        return { typingUsers: { ...s.typingUsers, [room_id]: [...current, name] } }
      })
      // Auto-clear after 3s
      setTimeout(() => {
        set(s => {
          const current = s.typingUsers[room_id] || []
          return { typingUsers: { ...s.typingUsers, [room_id]: current.filter(n => n !== name) } }
        })
      }, 3000)
    })

    socket.on('user_stop_typing', (data: unknown) => {
      const payload = asRecord(data)
      const room_id = stringValue(payload.room_id)
      const name = stringValue(payload.userName)
      if (!room_id) return
      set(s => {
        const current = s.typingUsers[room_id] || []
        return { typingUsers: { ...s.typingUsers, [room_id]: current.filter(n => n !== name) } }
      })
    })
  },

  /* ═══ CLEANUP ═══ */
  cleanup: () => {
    disconnectSocket()
    set({ connected: false, rooms: [], messages: {}, activeRoomId: null })
  },

  /* ═══ SET ACTIVE ROOM ═══ */
  setActiveRoom: async (roomId) => {
    const socket = getSocket()
    set({ activeRoomId: roomId })

    // Join socket room
    socket?.emit('join_room', { room_id: roomId })

    // Fetch history if not loaded
    const state = get()
    if (!state.messages[roomId]) {
      const msgs = await fetchMessages(roomId)
      set(s => ({ messages: { ...s.messages, [roomId]: msgs } }))
    }

    // Mark as read
    socket?.emit('mark_read', { room_id: roomId, user_id: state.userId })
    set(s => ({
      rooms: s.rooms.map(r => r.room_id === roomId ? { ...r, unread_count: 0 } : r),
    }))
  },

  /* ═══ SEND MESSAGE ═══ */
  sendMessage: (content, type = 'text', file) => {
    const { activeRoomId, userId, userName, userRole } = get()
    if (!activeRoomId || (!content.trim() && !file)) return

    const socket = getSocket()
    const tempId = crypto.randomUUID()

    // Build message content for backend compatibility
    let backendContent = content
    if (type === 'image' && file) backendContent = `[IMAGE]${file.url}`
    else if (type === 'file' && file) backendContent = `[FILE]${file.name}|${file.url}`

    // Optimistic local update
    const optimistic: ChatMessage = {
      id: tempId,
      room_id: activeRoomId,
      type,
      content,
      file,
      sender_id: userId,
      sender_name: userName,
      sender_role: normalizeUserRole(userRole),
      created_at: new Date().toISOString(),
      status: 'sending',
    }

    set(s => ({
      messages: {
        ...s.messages,
        [activeRoomId]: [...(s.messages[activeRoomId] || []), optimistic],
      },
    }))

    // Emit to server
    socket?.emit('send_message', {
      room_id: activeRoomId,
      message: backendContent,
      sender_id: userId,
      sender_name: userName,
      sender_role: userRole,
      file_url: file?.url,
    })

    // Stop typing
    get().emitStopTyping()
  },

  /* ═══ CREATE ROOM ═══ */
  createRoom: (participantId, participantName, participantRole) => {
    const { userId, userName } = get()
    const socket = getSocket()

    socket?.emit('create_room', {
      type: 'support',
      participants: [userId, participantId],
      participantNames: [userName, participantName],
    })

    // Auto-join the new room when created
    const handler = (room: ChatRoom) => {
      if (room.participants?.includes(participantId)) {
        get().setActiveRoom(room.room_id)
        set({ showNewChat: false })
        socket?.off('room_created', handler)
      }
    }
    socket?.on('room_created', handler)
    // Cleanup timeout
    setTimeout(() => socket?.off('room_created', handler), 5000)
  },

  /* ═══ TYPING ═══ */
  emitTyping: () => {
    const { activeRoomId, userId, userName } = get()
    if (!activeRoomId) return
    getSocket()?.emit('typing', { room_id: activeRoomId, userId, userName })
  },

  emitStopTyping: () => {
    const { activeRoomId, userId, userName } = get()
    if (!activeRoomId) return
    getSocket()?.emit('stop_typing', { room_id: activeRoomId, userId, userName })
  },

  /* ═══ FILE UPLOAD ═══ */
  handleFileUpload: async (file) => {
    set({ uploading: true })
    try {
      const { url, filename } = await uploadFile(file)
      const isImage = file.type.startsWith('image/')
      get().sendMessage(
        isImage ? '' : filename,
        isImage ? 'image' : 'file',
        { url, name: filename || file.name, size: file.size, mime: file.type },
      )
    } finally {
      set({ uploading: false })
    }
  },

  /* ═══ UI Actions ═══ */
  setSearchQuery: (q) => set({ searchQuery: q }),
  setShowNewChat: (v) => set({ showNewChat: v }),
  setPreviewImage: (url) => set({ previewImage: url }),
}))
