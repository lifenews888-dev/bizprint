'use client'

/**
 * useRealtimeOrder — Subscribe to live order status updates
 *
 * Usage:
 *   const { status, history, lastUpdate } = useRealtimeOrder(orderId)
 */

import { useEffect, useState, useCallback } from 'react'
import { useRealtime } from '../contexts/RealtimeContext'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://bizprint-production.up.railway.app'

interface OrderStatus {
  orderId: string
  status: string
  previousStatus?: string
  updatedAt: string
  [key: string]: any
}

interface UseRealtimeOrderResult {
  status: string | null
  lastUpdate: OrderStatus | null
  history: OrderStatus[]
  connected: boolean
}

export function useRealtimeOrder(orderId: string | null | undefined): UseRealtimeOrderResult {
  const { subscribe, joinRoom, leaveRoom, connected, onReconnect } = useRealtime()
  const [status, setStatus] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<OrderStatus | null>(null)
  const [history, setHistory] = useState<OrderStatus[]>([])

  const fetchOrder = useCallback(async () => {
    if (!orderId) return
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const res = await fetch(`${API}/api/orders/${orderId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.status) setStatus(data.status)
      }
    } catch {}
  }, [orderId])

  useEffect(() => {
    if (!orderId) return

    const room = `order:${orderId}`
    joinRoom(room)

    // Fetch initial status
    fetchOrder()

    const handleUpdate = (data: OrderStatus) => {
      if (data.orderId !== orderId && data.orderId !== undefined) return
      setStatus(data.status)
      setLastUpdate(data)
      setHistory(prev => [data, ...prev.slice(0, 19)]) // keep last 20
    }

    const unsubs = [
      subscribe('ORDER_STATUS_UPDATED', handleUpdate),
      subscribe('ORDER_PAID', handleUpdate),
      subscribe('ORDER_CANCELLED', handleUpdate),
      subscribe('PRODUCTION_UPDATED', handleUpdate),
      // Re-fetch on reconnect to catch any missed updates
      onReconnect(fetchOrder),
    ]

    return () => {
      leaveRoom(room)
      unsubs.forEach(fn => fn())
    }
  }, [orderId, joinRoom, leaveRoom, subscribe, onReconnect, fetchOrder])

  return { status, lastUpdate, history, connected }
}
