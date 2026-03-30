import { useState, useEffect, useRef, useCallback } from 'react'
import { API_BASE } from '../index'
import type { SystemHealth, TimeSeries } from '../types/system'

interface UseSystemStatusOptions {
  /** Polling interval in ms (default: 5000) */
  interval?: number
  /** Auth token for admin endpoints */
  token?: string | null
}

interface SystemStatusResult {
  health: SystemHealth | null
  cpuHistory: TimeSeries | null
  rpmHistory: TimeSeries | null
  loading: boolean
  error: string | null
  refetch: () => void
  lastUpdated: Date | null
}

export function useSystemStatus(opts: UseSystemStatusOptions = {}): SystemStatusResult {
  const { interval = 5000, token } = opts
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [cpuHistory, setCpuHistory] = useState<TimeSeries | null>(null)
  const [rpmHistory, setRpmHistory] = useState<TimeSeries | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async () => {
    if (!token) return
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }

      const [healthRes, metricsRes] = await Promise.all([
        fetch(`${API_BASE}/system/health`, { headers }),
        fetch(`${API_BASE}/system/metrics`, { headers }),
      ])

      if (healthRes.ok) {
        const data = await healthRes.json()
        setHealth(data?.data || data)
      }

      if (metricsRes.ok) {
        const data = await metricsRes.json()
        const m = data?.data || data
        if (m.cpu) setCpuHistory(m.cpu)
        if (m.rpm) setRpmHistory(m.rpm)
      }

      setError(null)
      setLastUpdated(new Date())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchStatus()
    timerRef.current = setInterval(fetchStatus, interval)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [fetchStatus, interval])

  return { health, cpuHistory, rpmHistory, loading, error, refetch: fetchStatus, lastUpdated }
}
