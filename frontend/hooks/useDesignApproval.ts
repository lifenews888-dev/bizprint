'use client'

/**
 * useDesignApproval — Live design request state for frontend
 *
 * Joins the design:{id} room and subscribes to all design events.
 *
 * Usage:
 *   const { design, loading, refresh } = useDesignApproval(designRequestId)
 */

import { useEffect, useState, useCallback } from 'react'
import { RealtimePayload, useRealtime } from '../contexts/RealtimeContext'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface DesignApprovalData {
  id?: string
  status?: string
  [key: string]: unknown
}

interface UseDesignApprovalResult {
  design: DesignApprovalData | null
  loading: boolean
  connected: boolean
  refresh: () => void
  lastEvent: { type: string; data: RealtimePayload } | null
}

export function useDesignApproval(designRequestId: string | null | undefined): UseDesignApprovalResult {
  const { subscribe, joinRoom, leaveRoom, connected, onReconnect } = useRealtime()
  const [design, setDesign] = useState<DesignApprovalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastEvent, setLastEvent] = useState<{ type: string; data: RealtimePayload } | null>(null)

  const fetchDesign = useCallback(async () => {
    if (!designRequestId) return
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const res = await fetch(`${API}/api/design-requests/${designRequestId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json() as DesignApprovalData
        setDesign(data)
      }
    } catch {}
    finally { setLoading(false) }
  }, [designRequestId])

  useEffect(() => {
    if (!designRequestId) return

    const room = `design:${designRequestId}`
    joinRoom(room)
    fetchDesign()

    const handleEvent = (type: string) => (data: RealtimePayload) => {
      if (data.designRequestId !== designRequestId) return
      setLastEvent({ type, data })
      fetchDesign()
    }

    const unsubs = [
      subscribe('DESIGN_FILE_UPLOADED',       handleEvent('DESIGN_FILE_UPLOADED')),
      subscribe('DESIGN_REVISION_REQUESTED',  handleEvent('DESIGN_REVISION_REQUESTED')),
      subscribe('DESIGN_VERSION_UPDATED',     handleEvent('DESIGN_VERSION_UPDATED')),
      subscribe('DESIGN_ZOOM_CREATED',        handleEvent('DESIGN_ZOOM_CREATED')),
      subscribe('DESIGN_APPROVED',            handleEvent('DESIGN_APPROVED')),
      subscribe('DESIGN_REJECTED',            handleEvent('DESIGN_REJECTED')),
      subscribe('DESIGN_IN_PRODUCTION',       handleEvent('DESIGN_IN_PRODUCTION')),
      subscribe('DESIGN_COMMENT_ADDED',       handleEvent('DESIGN_COMMENT_ADDED')),
      onReconnect(fetchDesign),
    ]

    return () => {
      leaveRoom(room)
      unsubs.forEach(fn => fn())
    }
  }, [designRequestId])

  return { design, loading, connected, refresh: fetchDesign, lastEvent }
}
