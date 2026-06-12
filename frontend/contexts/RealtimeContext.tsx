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
import { API_URL, getToken } from '@/lib/api'

const FALLBACK_POLL_MS = 10_000

export interface RealtimePayload {
  designRequestId?: string
  orderId?: string
  previousStatus?: string
  status?: string
  updatedAt?: string
  [key: string]: unknown
}

type DesignRealtimePayload = RealtimePayload & {
  designRequestId?: string
}

type OrderRealtimePayload = RealtimePayload & {
  orderId: string
  status: string
  updatedAt: string
}

type SettingsRealtimePayload = RealtimePayload & {
  key: string
  value: unknown
}

type SettingsBulkRealtimePayload = RealtimePayload & {
  settings: Record<string, unknown>
}

type MenuRealtimePayload = RealtimePayload & {
  menu: unknown[]
}

type RealtimeEventPayloads = {
  DESIGN_FILE_UPLOADED: DesignRealtimePayload
  DESIGN_REVISION_REQUESTED: DesignRealtimePayload
  DESIGN_APPROVED: DesignRealtimePayload
  DESIGN_COMMENT_ADDED: DesignRealtimePayload
  DESIGN_ZOOM_CREATED: DesignRealtimePayload
  DESIGN_VERSION_UPDATED: DesignRealtimePayload
  DESIGN_REJECTED: DesignRealtimePayload
  DESIGN_IN_PRODUCTION: DesignRealtimePayload
  ORDER_CREATED: OrderRealtimePayload
  ORDER_PAID: OrderRealtimePayload
  ORDER_STATUS_UPDATED: OrderRealtimePayload
  ORDER_CANCELLED: OrderRealtimePayload
  PRODUCTION_UPDATED: OrderRealtimePayload
  SETTINGS_UPDATED: SettingsRealtimePayload
  SETTINGS_BULK_UPDATED: SettingsBulkRealtimePayload
  MENU_UPDATED: MenuRealtimePayload
}

type PayloadFor<EventName extends string> =
  EventName extends keyof RealtimeEventPayloads ? RealtimeEventPayloads[EventName] : RealtimePayload

type Handler<TPayload = RealtimePayload> = (data: TPayload) => void
type Unsubscribe = () => void

interface RealtimeContextType {
  connected: boolean
  subscribe: <EventName extends string>(event: EventName, handler: Handler<PayloadFor<EventName>>) => Unsubscribe
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
    const token = getToken()
    if (!token) {
      return
    }

    const socket = io(`${API_URL}/sync`, {
      auth: { token },
      transports: ['websocket', 'polling'],
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
    socket.onAny((event: string, data: unknown) => {
      const handlers = listenersRef.current.get(event)
      if (handlers) {
        handlers.forEach(h => {
          try { h(data as RealtimePayload) } catch {}
        })
      }
    })

    return () => {
      socket.disconnect()
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [])

  // ── subscribe ────────────────────────────────────────────────────────────────
  const subscribe = useCallback(<EventName extends string>(
    event: EventName,
    handler: Handler<PayloadFor<EventName>>,
  ): Unsubscribe => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set())
    }
    const storedHandler = handler as Handler
    listenersRef.current.get(event)!.add(storedHandler)
    return () => {
      listenersRef.current.get(event)?.delete(storedHandler)
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
