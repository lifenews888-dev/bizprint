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
export type UserRole = 'admin' | 'superadmin' | 'customer' | 'designer' | 'vendor' | 'factory' | 'courier' | 'sales'

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

/* ═══ Message normalization ═══ */
/** Convert raw backend message to our structured ChatMessage */
export function normalizeMessage(raw: any): ChatMessage {
  const id = raw.id?.toString() || raw._id || crypto.randomUUID()
  const content = raw.message || raw.content || raw.text || ''
  const fileUrl = raw.file_url || raw.fileUrl || ''

  // Detect type from legacy format or explicit field
  let type: MessageType = (raw.msg_type || raw.type || 'text') as MessageType
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
    room_id: raw.room_id || '',
    type,
    content: type === 'system' ? content.replace('[SYSTEM]', '') : (type === 'text' ? content : ''),
    file,
    sender_id: raw.sender_id || raw.senderId || '',
    sender_name: raw.sender_name || raw.senderName || '',
    sender_role: (raw.sender_role || raw.senderRole || 'customer') as UserRole,
    created_at: raw.created_at || raw.createdAt || new Date().toISOString(),
    status: raw.is_read ? 'read' : 'sent',
    reply_to: raw.reply_to,
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
    const data = await apiFetch<any>(`/chat/rooms/user/${userId}`)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function fetchMessages(roomId: string, limit = 50): Promise<ChatMessage[]> {
  try {
    const data = await apiFetch<any[]>(`/chat/messages/${roomId}?limit=${limit}`)
    return (Array.isArray(data) ? data : []).map(normalizeMessage)
  } catch {
    return []
  }
}

export async function fetchUsers(): Promise<any[]> {
  try {
    const data = await apiFetch<any[]>('/admin/users')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function uploadFile(file: File): Promise<{ url: string; filename: string }> {
  const fd = new FormData()
  fd.append('file', file)
  const data = await apiUpload<any>('/upload/file', fd)
  return { url: data.url || `${API_URL}/uploads/${data.filename}`, filename: data.filename || file.name }
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
