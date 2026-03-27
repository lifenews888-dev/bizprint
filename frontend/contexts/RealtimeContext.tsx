'use client'

/**
 * RealtimeContext — Single Socket.IO connection to /sync namespace
 *
 * Provides:
 *   - subscribe(event, handler) → unsubscribe fn
 *   - joinRoom(room) / leaveRoom(room)
 *   - connected (bool)
 *   - onReconnect(cb) — called each time connection is restored
 *
 * Usage:
 *   const { subscribe, joinRoom } = useRealtime()
 *   useEffect(() => {
 *     joinRoom(`order:${orderId}`)
 *     return subscribe('ORDER_STATUS_UPDATED', (data) => setState(data))
 *   }, [orderId])
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { io, Socket } from 'socket.io-client'

const SYNC_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000') + ''
const FALLBACK_POLL_MS = 10_000

type Handler = (data: any) => void
type Unsubscribe = () => void

interface RealtimeContextType {
  connected: boolean
  subscribe: (event: string, handler: Handler) => Unsubscribe
  joinRoom: (room: string | string[]) => void
  leaveRoom: (room: string) => void
  onReconnect: (cb: () => void) => Unsubscribe
}

const RealtimeContext = createContext<RealtimeContextType>({
  connected: false,
  subscribe: () => () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
  onReconnect: () => () => {},
})

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  // Map: event → Set<handler>
  const listenersRef = useRef<Map<string, Set<Handler>>>(new Map())
  // Reconnect callbacks
  const reconnectCallbacksRef = useRef<Set<() => void>>(new Set())
  // Rooms to re-join after reconnect
  const roomsRef = useRef<Set<string>>(new Set())
  // Fallback poll timer
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Init socket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(`${SYNC_URL}/sync`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
    })
    socketRef.current = socket

    // Track whether this is the first connection or a re-connection
    let hasConnectedBefore = false

    socket.on('connect', () => {
      setConnected(true)
      // Re-join all rooms after reconnect
      const rooms = Array.from(roomsRef.current)
      if (rooms.length > 0) {
        socket.emit('join', { rooms })
      }
      // Only fire reconnect callbacks on ACTUAL reconnects, not the initial connect
      if (hasConnectedBefore) {
        reconnectCallbacksRef.current.forEach(cb => cb())
      }
      hasConnectedBefore = true
      // Clear fallback polling
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    })

    socket.on('disconnect', () => {
      setConnected(false)
      // Start fallback polling timer — callers can use onReconnect to re-fetch
      if (!pollTimerRef.current) {
        pollTimerRef.current = setInterval(() => {
          reconnectCallbacksRef.current.forEach(cb => cb())
        }, FALLBACK_POLL_MS)
      }
    })

    // Forward all events from backend to local listeners
    socket.onAny((event: string, data: any) => {
      const handlers = listenersRef.current.get(event)
      if (handlers) {
        handlers.forEach(h => {
          try { h(data) } catch {}
        })
      }
    })

    return () => {
      socket.disconnect()
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [])

  // ── subscribe ────────────────────────────────────────────────────────────────
  const subscribe = useCallback((event: string, handler: Handler): Unsubscribe => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set())
    }
    listenersRef.current.get(event)!.add(handler)
    return () => {
      listenersRef.current.get(event)?.delete(handler)
    }
  }, [])

  // ── joinRoom ─────────────────────────────────────────────────────────────────
  const joinRoom = useCallback((room: string | string[]) => {
    const rooms = Array.isArray(room) ? room : [room]
    rooms.forEach(r => roomsRef.current.add(r))
    if (socketRef.current?.connected) {
      socketRef.current.emit('join', { rooms })
    }
  }, [])

  // ── leaveRoom ────────────────────────────────────────────────────────────────
  const leaveRoom = useCallback((room: string) => {
    roomsRef.current.delete(room)
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave', { room })
    }
  }, [])

  // ── onReconnect ──────────────────────────────────────────────────────────────
  const onReconnect = useCallback((cb: () => void): Unsubscribe => {
    reconnectCallbacksRef.current.add(cb)
    return () => { reconnectCallbacksRef.current.delete(cb) }
  }, [])

  return (
    <RealtimeContext.Provider value={{ connected, subscribe, joinRoom, leaveRoom, onReconnect }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export const useRealtime = () => useContext(RealtimeContext)
