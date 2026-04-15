'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { API_URL } from '@/lib/api'

export interface RealtimeNotification {
  id: string
  type: string
  title: string
  message: string
  timestamp: string
  read: boolean
  inquiryId?: string
}

interface DecodedUser {
  id?: string
  role?: string
}

function decodeUser(): DecodedUser {
  if (typeof window === 'undefined') return {}
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}')
    return { id: u?.id, role: u?.role }
  } catch {
    return {}
  }
}

export function useNotifications(token: string | null) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!token) return

    const { id: userId, role } = decodeUser()
    const socket = io(`${API_URL}/notifications`, {
      auth: { token },
      query: { userId, role },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      setConnected(true)
      if (userId) socket.emit('join', { userId, role })
    })
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', () => setConnected(false))

    socket.on('new_notification', (data: any) => {
      const notif: RealtimeNotification = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: data.type || 'info',
        title: data.title || 'Мэдэгдэл',
        message: data.message || '',
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
        inquiryId: data.inquiryId,
      }
      setNotifications(prev => [notif, ...prev].slice(0, 20))

      // Browser notification (if permitted)
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notif.title, { body: notif.message })
        } catch {}
      }
    })

    socketRef.current = socket
    return () => { socket.disconnect() }
  }, [token])

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return { notifications, unreadCount, connected, markRead, markAllRead }
}
