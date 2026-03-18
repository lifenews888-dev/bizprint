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