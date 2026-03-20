'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

const WS_URL = 'ws://localhost:4000'
const API = 'http://localhost:4000'

interface Room {
  room_id: string
  participants: string[]
  participant_names: string[]
  last_message?: string
  last_message_at?: string
  unread_count?: number
}

interface Message {
  id?: string
  room_id?: string
  sender_id: string
  sender_name?: string
  content: string
  type?: 'text' | 'image' | 'system'
  created_at: string
}

export function useChat(userId: string, userName: string, role: string) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  // Load rooms from API
  useEffect(() => {
    if (!userId) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
    fetch(`${API}/chat/rooms`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setRooms(data)
      })
      .catch(() => {})
  }, [userId])

  // WebSocket connection
  useEffect(() => {
    if (!userId) return
    try {
      const ws = new WebSocket(`${WS_URL}/chat?userId=${userId}&userName=${encodeURIComponent(userName)}&role=${role}`)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)
      ws.onclose = () => setConnected(false)
      ws.onerror = () => setConnected(false)

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'room_list' && Array.isArray(data.rooms)) {
            setRooms(data.rooms)
          } else if (data.type === 'room_created' && data.room) {
            setRooms(prev => {
              if (prev.find(r => r.room_id === data.room.room_id)) return prev
              return [data.room, ...prev]
            })
          } else if (data.type === 'message' || data.sender_id) {
            const msg: Message = {
              id: data.id,
              room_id: data.room_id,
              sender_id: data.sender_id || data.senderId,
              sender_name: data.sender_name || data.senderName,
              content: data.content || data.text,
              type: data.msg_type || data.type || 'text',
              created_at: data.created_at || data.timestamp || new Date().toISOString(),
            }
            if (msg.room_id) {
              setMessages(prev => ({
                ...prev,
                [msg.room_id!]: [...(prev[msg.room_id!] || []), msg]
              }))
              setRooms(prev => prev.map(r =>
                r.room_id === msg.room_id
                  ? { ...r, last_message: msg.content, last_message_at: msg.created_at }
                  : r
              ))
            }
          } else if (data.type === 'history' && data.room_id && Array.isArray(data.messages)) {
            setMessages(prev => ({ ...prev, [data.room_id]: data.messages }))
          }
        } catch {}
      }

      return () => { ws.close() }
    } catch {
      setConnected(false)
    }
  }, [userId, userName, role])

  const joinRoom = useCallback((roomId: string) => {
    setActiveRoom(roomId)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'join_room', room_id: roomId }))
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
    fetch(`${API}/chat/rooms/${roomId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(prev => ({ ...prev, [roomId]: data }))
        }
      })
      .catch(() => {})
    setRooms(prev => prev.map(r =>
      r.room_id === roomId ? { ...r, unread_count: 0 } : r
    ))
  }, [])

  const sendMessage = useCallback((content: string, type: string = 'text') => {
    if (!activeRoom || !content.trim()) return
    const msg = {
      type: 'message',
      room_id: activeRoom,
      sender_id: userId,
      sender_name: userName,
      content: content.trim(),
      msg_type: type,
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }

    const localMsg: Message = {
      room_id: activeRoom,
      sender_id: userId,
      sender_name: userName,
      content: content.trim(),
      type: type as any,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => ({
      ...prev,
      [activeRoom]: [...(prev[activeRoom] || []), localMsg]
    }))
    setRooms(prev => prev.map(r =>
      r.room_id === activeRoom
        ? { ...r, last_message: content.trim(), last_message_at: localMsg.created_at }
        : r
    ))
  }, [activeRoom, userId, userName])

  const createRoom = useCallback((targetId: string, targetName: string) => {
    const roomId = [userId, targetId].sort().join('_')

    const existing = rooms.find(r => r.room_id === roomId || (
      r.participants?.includes(userId) && r.participants?.includes(targetId)
    ))
    if (existing) {
      joinRoom(existing.room_id)
      return
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'create_room',
        room_id: roomId,
        participants: [userId, targetId],
        participant_names: [userName, targetName],
      }))
    }

    const newRoom: Room = {
      room_id: roomId,
      participants: [userId, targetId],
      participant_names: [userName, targetName],
    }
    setRooms(prev => [newRoom, ...prev])
    setActiveRoom(roomId)
  }, [userId, userName, rooms, joinRoom])

  return { rooms, messages, activeRoom, connected, joinRoom, sendMessage, createRoom }
}
