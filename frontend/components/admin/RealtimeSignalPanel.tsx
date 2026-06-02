"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { API_URL, getToken } from "@/lib/api"

type Severity = "critical" | "high" | "medium" | "low"

type SignalEvent = {
  id: string
  name: string
  ts: number
  severity: Severity
  payload: unknown
}

const EVENT_SEVERITY: Record<string, Severity> = {
  ORDER_CANCELLED: "high",
  ORDER_PAID: "low",
  ORDER_CREATED: "low",
  ORDER_STATUS_UPDATED: "medium",
  PRODUCTION_UPDATED: "medium",
  JOB_ASSIGNED: "low",
  NOTIFICATION: "low",
  VENDOR_UPDATED: "low",
  DESIGN_REJECTED: "high",
  DESIGN_REVISION_REQUESTED: "medium",
}

function ageText(ts: number): string {
  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  return `${hr}h ago`
}

function sevClass(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "bg-red-50 text-red-700 border-red-200"
    case "high":
      return "bg-orange-50 text-orange-700 border-orange-200"
    case "medium":
      return "bg-amber-50 text-amber-700 border-amber-200"
    default:
      return "bg-blue-50 text-blue-700 border-blue-200"
  }
}

export function RealtimeSignalPanel() {
  const [connected, setConnected] = useState(false)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [events, setEvents] = useState<SignalEvent[]>([])
  const [lastEventTs, setLastEventTs] = useState<number | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) return

    const socket = io(`${API_URL}/sync`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      timeout: 10000,
    })
    socketRef.current = socket

    const onAny = (eventName: string, payload: unknown) => {
      const next: SignalEvent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: eventName,
        ts: Date.now(),
        severity: EVENT_SEVERITY[eventName] || "low",
        payload,
      }
      setLastEventTs(next.ts)
      setEvents((prev) => [next, ...prev].slice(0, 80))
    }

    socket.on("connect", () => {
      setConnected(true)
      socket.emit("join", { rooms: ["admin"] })
    })
    socket.on("disconnect", () => setConnected(false))
    socket.on("connect_error", () => setConnected(false))
    socket.onAny(onAny)

    pingTimerRef.current = setInterval(() => {
      if (!socket.connected) return
      const start = performance.now()
      socket.emit("ping", (res: { pong?: boolean }) => {
        if (res?.pong) {
          setLatencyMs(Math.round(performance.now() - start))
        }
      })
    }, 10000)

    return () => {
      if (pingTimerRef.current) clearInterval(pingTimerRef.current)
      socket.offAny(onAny)
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  const status = useMemo(() => {
    if (!connected) return { label: "Disconnected", cls: "bg-red-50 text-red-700 border-red-200" }
    if (latencyMs !== null && latencyMs > 1500) return { label: "Degraded", cls: "bg-amber-50 text-amber-700 border-amber-200" }
    return { label: "Live", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
  }, [connected, latencyMs])

  return (
    <div className="rounded-xl border border-border bg-card p-5 mb-5">
      <div className="flex flex-wrap items-center gap-2 justify-between mb-3">
        <h2 className="text-sm font-bold text-foreground">📡 Realtime signals</h2>
        <div className="flex items-center gap-2 text-[10px]">
          <span className={`px-2 py-1 rounded-lg border font-bold ${status.cls}`}>{status.label}</span>
          <span className="px-2 py-1 rounded-lg bg-muted text-muted-foreground">
            RTT: {latencyMs !== null ? `${latencyMs}ms` : "—"}
          </span>
          <span className="px-2 py-1 rounded-lg bg-muted text-muted-foreground">
            Last: {lastEventTs ? ageText(lastEventTs) : "none"}
          </span>
        </div>
      </div>

      <div className="max-h-64 overflow-auto rounded-lg border border-border">
        {events.length === 0 ? (
          <div className="text-xs text-muted-foreground/60 p-4">Шинэ realtime signal хүлээж байна…</div>
        ) : (
          <div className="divide-y divide-border">
            {events.map((ev) => (
              <div key={ev.id} className="p-3 text-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${sevClass(ev.severity)}`}>
                    {ev.severity.toUpperCase()}
                  </span>
                  <span className="text-muted-foreground">{ageText(ev.ts)}</span>
                </div>
                <div className="font-semibold text-foreground mb-1">{ev.name}</div>
                <pre className="whitespace-pre-wrap break-words text-[10px] text-muted-foreground/80">
                  {JSON.stringify(ev.payload)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
