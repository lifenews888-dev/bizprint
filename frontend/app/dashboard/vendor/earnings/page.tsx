'use client'
import { useState, useEffect, useMemo } from 'react'
import { apiFetch } from '@/lib/api'

interface VendorUser { id?: string }
interface CommissionLog {
  id: string
  inquiry_id?: string
  order_id?: string
  created_at: string
  commission_rate?: number | string
  status?: string
  net_amount?: number | string
  commission_amount?: number | string
}
interface CommissionSummary {
  totalGross?: number
  totalCommission?: number
  totalNet?: number
  pendingPayout?: number
}

export default function VendorEarningsPage() {
  const [logs, setLogs] = useState<CommissionLog[]>([])
  const [summary, setSummary] = useState<CommissionSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') as VendorUser : {}

  useEffect(() => {
    if (!user.id) return
    Promise.all([
      apiFetch<CommissionLog[]>(`/commission?vendor_id=${user.id}`).catch(() => []),
      apiFetch<CommissionSummary>(`/commission/summary?vendor_id=${user.id}`).catch(() => null),
    ]).then(([logData, sumData]) => {
      setLogs(Array.isArray(logData) ? logData : [])
      setSummary(sumData)
      setLoading(false)
    })
  }, [user.id])

  // Group by day for last 14 days
  const chartData = useMemo(() => {
    const map = new Map<string, { label: string; net: number }>()
    // Pre-seed last 14 days with 0
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })
      map.set(key, { label, net: 0 })
    }
    logs.forEach(log => {
      const key = new Date(log.created_at).toISOString().slice(0, 10)
      const entry = map.get(key)
      if (entry) entry.net += Number(log.net_amount || 0)
    })
    return Array.from(map.values())
  }, [logs])

  const maxNet = Math.max(1, ...chartData.map(d => d.net))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Орлогын тайлан</h1>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Сүүлийн 14 хоногийн цэвэр орлого</p>
          </div>
          <a href="/dashboard/vendor/inquiries" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>
            ← Inquiries
          </a>
        </div>

        {/* Summary cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { l: 'Нийт орлого', v: Number(summary.totalGross || 0), c: 'var(--text)' },
              { l: 'Шимтгэл', v: Number(summary.totalCommission || 0), c: '#EF4444' },
              { l: 'Цэвэр орлого', v: Number(summary.totalNet || 0), c: '#10B981' },
              { l: 'Хүлээгдэж байна', v: Number(summary.pendingPayout || 0), c: '#FF6B00' },
            ].map(s => (
              <div key={s.l} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{s.l}</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: s.c }}>{s.v.toLocaleString()}₮</p>
              </div>
            ))}
          </div>
        )}

        {/* Daily trend — inline SVG bar chart */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Өдрийн орлого (сүүлийн 14 хоног)</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, paddingTop: 10 }}>
            {chartData.map((d, i) => {
              const h = (d.net / maxNet) * 100
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <div
                    title={`${d.label}: ${d.net.toLocaleString()}₮`}
                    style={{
                      width: '100%',
                      height: `${Math.max(h, 1)}%`,
                      background: d.net > 0 ? 'linear-gradient(to top, #FF6B00, #FF8C42)' : 'var(--surface2)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 9, color: 'var(--text4)' }}>{chartData[0]?.label}</span>
            <span style={{ fontSize: 9, color: 'var(--text4)' }}>{chartData[chartData.length - 1]?.label}</span>
          </div>
        </div>

        {/* Transactions list */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Гүйлгээний түүх</p>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>Ачааллаж байна…</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>📊</p>
              <p style={{ fontSize: 13 }}>Гүйлгээ байхгүй байна</p>
            </div>
          ) : (
            <div>
              {logs.map((log, idx) => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div>
                    <p style={{ fontSize: 13, color: 'var(--text)' }}>Захиалга #{(log.inquiry_id || log.order_id || '').slice(0, 8)}</p>
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                      {new Date(log.created_at).toLocaleDateString('mn-MN')} · {log.commission_rate}% шимтгэл · {log.status}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#10B981', fontWeight: 600, fontSize: 14 }}>{Number(log.net_amount).toLocaleString()}₮</p>
                    <p style={{ fontSize: 10, color: 'var(--text4)' }}>−{Number(log.commission_amount).toLocaleString()}₮ шимтгэл</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
