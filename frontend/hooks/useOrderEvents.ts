'use client'

/**
 * useOrderEvents — subscribe a dashboard to live order/delivery events.
 *
 * Pattern repeats across the customer, vendor, sales, courier and admin
 * order pages: join a few rooms, listen for the same handful of events,
 * trigger a reload. Wrapping it here keeps each page short and ensures
 * we always clean up subscriptions on unmount.
 *
 * Usage:
 *   useOrderEvents({
 *     rooms: [`user:${user.id}`, `order:${orderId}`],
 *     onChange: () => load(),
 *   })
 *
 * Default events cover the full lifecycle: ORDER_CREATED, ORDER_PAID,
 * ORDER_STATUS_UPDATED, ORDER_CANCELLED. Override `events` for a narrower
 * surface (e.g. courier only cares about delivery assignment).
 */

import { useEffect } from 'react'
import { RealtimePayload, useRealtime } from '@/contexts/RealtimeContext'

const DEFAULT_EVENTS = [
  'ORDER_CREATED',
  'ORDER_PAID',
  'ORDER_STATUS_UPDATED',
  'ORDER_CANCELLED',
]

interface Options {
  rooms: string[]
  onChange: (event?: string, data?: RealtimePayload) => void
  events?: string[]
  /** Disable until prerequisites (e.g. user.id) are loaded. */
  enabled?: boolean
}

export function useOrderEvents({ rooms, onChange, events = DEFAULT_EVENTS, enabled = true }: Options) {
  const { subscribe, joinRoom, leaveRoom, onReconnect } = useRealtime()

  useEffect(() => {
    if (!enabled) return
    const validRooms = rooms.filter(Boolean)
    if (!validRooms.length) return

    validRooms.forEach(r => joinRoom(r))

    const unsubs = events.map(ev =>
      subscribe(ev, data => onChange(ev, data)),
    )
    // Re-fetch on socket reconnect so we don't miss anything that happened
    // while disconnected.
    unsubs.push(onReconnect(() => onChange('RECONNECT')))

    return () => {
      unsubs.forEach(fn => fn())
      validRooms.forEach(r => leaveRoom(r))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, rooms.join('|'), events.join('|')])
}
