/**
 * Chat Service — API calls + Socket.IO connection management.
 * Separates transport layer from UI/state.
 */
import { io, Socket } from 'socket.io-client'
import { apiFetch, apiUpload, API_URL } from '@/lib/api'

/* ═══ Types ═══ */
export interface ChatRoom {
  room_id: string
  type: string
  order_id?: string
  participants: string[]
  participant_names: string[]
  last_message?: string
  last_message_at?: string
  unread_count?: number
}

export type MessageType = 'text' | 'image' | 'file' | 'system'
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read'
const USER_ROLES = ['admin', 'superadmin', 'customer', 'designer', 'vendor', 'factory', 'courier', 'sales'] as const
export type UserRole = (typeof USER_ROLES)[number]

export interface ChatMessage {
  id: string
  room_id: string
  type: MessageType
  content: string
  file?: { url: string; name: string; size?: number; mime?: string }
  sender_id: string
  sender_name: string
  sender_role: UserRole
  created_at: string
  status: MessageStatus
  reply_to?: string
}

export interface CreateRoomParams {
  type: string
  participants: string[]
  participantNames: string[]
  orderId?: string
}

export interface ChatUser {
  id: string
  email: string
  full_name?: string
  name: string
  role: string
  [key: string]: unknown
}

type RawRecord = Record<string, unknown>

type UploadResponse = {
  url?: string
  filename?: string
}

const asRecord = (value: unknown): RawRecord =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as RawRecord : {}

const stringValue = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(item => stringValue(item)).filter(Boolean) : []

const normalizeMessageType = (value: unknown): MessageType => {
  const type = stringValue(value)
  return ['text', 'image', 'file', 'system'].includes(type) ? type as MessageType : 'text'
}

export const normalizeUserRole = (value: unknown): UserRole => {
  const role = stringValue(value)
  return USER_ROLES.includes(role as UserRole) ? role as UserRole : 'customer'
}

export const normalizeRooms = (value: unknown): ChatRoom[] => {
  if (!Array.isArray(value)) return []

  return value
    .map(item => {
      const room = asRecord(item)
      const roomId = stringValue(room.room_id ?? room.roomId ?? room.id)
      return {
        room_id: roomId,
        type: stringValue(room.type, 'support'),
        order_id: stringValue(room.order_id ?? room.orderId) || undefined,
        participants: stringArray(room.participants),
        participant_names: stringArray(room.participant_names ?? room.participantNames),
        last_message: stringValue(room.last_message ?? room.lastMessage) || undefined,
        last_message_at: stringValue(room.last_message_at ?? room.lastMessageAt) || undefined,
        unread_count: Number(room.unread_count ?? room.unreadCount ?? 0) || 0,
      }
    })
    .filter(room => room.room_id)
}

export const normalizeUsers = (value: unknown): ChatUser[] => {
  if (!Array.isArray(value)) return []

  return value
    .map(item => {
      const user = asRecord(item)
      const email = stringValue(user.email)
      const fullName = stringValue(user.full_name ?? user.fullName)
      const name = stringValue(user.name) || fullName || email || 'User'
      return {
        ...user,
        id: stringValue(user.id ?? user._id),
        email,
        full_name: fullName || undefined,
        name,
        role: stringValue(user.role, 'customer'),
      }
    })
    .filter(user => user.id)
}

/* ═══ Message normalization ═══ */
/** Convert raw backend message to our structured ChatMessage */
export function normalizeMessage(rawInput: unknown): ChatMessage {
  const raw = asRecord(rawInput)
  const idValue = raw.id ?? raw._id
  const id = idValue !== undefined && idValue !== null ? String(idValue) : crypto.randomUUID()
  const content = stringValue(raw.message) || stringValue(raw.content) || stringValue(raw.text)
  const fileUrl = stringValue(raw.file_url) || stringValue(raw.fileUrl)

  // Detect type from legacy format or explicit field
  let type = normalizeMessageType(raw.msg_type ?? raw.type)
  let file: ChatMessage['file'] | undefined

  if (content.startsWith('[IMAGE]')) {
    type = 'image'
    file = { url: content.replace('[IMAGE]', ''), name: 'image' }
  } else if (content.startsWith('[FILE]')) {
    type = 'file'
    const parts = content.replace('[FILE]', '').split('|')
    file = { url: parts[1] || parts[0], name: parts[0] }
  } else if (content.startsWith('[SYSTEM]')) {
    type = 'system'
  } else if (fileUrl) {
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileUrl)
    type = isImage ? 'image' : 'file'
    file = { url: fileUrl, name: fileUrl.split('/').pop() || 'file' }
  }

  return {
    id,
    room_id: stringValue(raw.room_id),
    type,
    content: type === 'system' ? content.replace('[SYSTEM]', '') : (type === 'text' ? content : ''),
    file,
    sender_id: stringValue(raw.sender_id) || stringValue(raw.senderId),
    sender_name: stringValue(raw.sender_name) || stringValue(raw.senderName),
    sender_role: normalizeUserRole(raw.sender_role ?? raw.senderRole),
    created_at: stringValue(raw.created_at) || stringValue(raw.createdAt) || new Date().toISOString(),
    status: raw.is_read === true ? 'read' : 'sent',
    reply_to: stringValue(raw.reply_to) || undefined,
  }
}

/* ═══ Socket Manager ═══ */
let socket: Socket | null = null

export function getSocket(): Socket | null {
  return socket
}

export function connectSocket(userId: string, userName: string, role: string): Socket {
  if (socket?.connected) return socket

  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('access_token') || localStorage.getItem('token') || '')
    : ''

  socket = io(`${API_URL}/chat`, {
    transports: ['websocket', 'polling'],
    auth: { token },
    query: { userId, userName, role },
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10,
  })

  socket.on('connect', () => {
    socket?.emit('join', { userId, userName, role })
  })

  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}

/* ═══ REST API ═══ */
export async function fetchRooms(userId: string): Promise<ChatRoom[]> {
  try {
    const data = await apiFetch<unknown>(`/chat/rooms/user/${userId}`)
    return normalizeRooms(data)
  } catch {
    return []
  }
}

export async function fetchMessages(roomId: string, limit = 50): Promise<ChatMessage[]> {
  try {
    const data = await apiFetch<unknown>(`/chat/messages/${roomId}?limit=${limit}`)
    return (Array.isArray(data) ? data : []).map(normalizeMessage)
  } catch {
    return []
  }
}

export async function fetchUsers(): Promise<ChatUser[]> {
  try {
    const data = await apiFetch<unknown>('/admin/users')
    return normalizeUsers(data)
  } catch {
    return []
  }
}

export async function uploadFile(file: File): Promise<{ url: string; filename: string }> {
  const fd = new FormData()
  fd.append('file', file)
  const data = await apiUpload<UploadResponse>('/upload/file', fd)
  const filename = data.filename || file.name
  return { url: data.url || `${API_URL}/uploads/${filename}`, filename }
}

/* ═══ Role config ═══ */
export const ROLE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  admin:     { color: '#FF6B00', bg: 'rgba(255,107,0,0.1)',  label: 'Админ' },
  superadmin:{ color: '#FF6B00', bg: 'rgba(255,107,0,0.1)',  label: 'Супер Админ' },
  designer:  { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', label: 'Дизайнер' },
  courier:   { color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Хүргэлт' },
  customer:  { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', label: 'Хэрэглэгч' },
  vendor:    { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'Vendor' },
  factory:   { color: '#EC4899', bg: 'rgba(236,72,153,0.1)', label: 'Үйлдвэр' },
  sales:     { color: '#06B6D4', bg: 'rgba(6,182,212,0.1)',  label: 'Борлуулалт' },
}

export function getRoleConfig(role?: string) {
  return ROLE_CONFIG[role || 'customer'] || ROLE_CONFIG.customer
}
