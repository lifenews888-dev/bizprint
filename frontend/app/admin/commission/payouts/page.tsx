'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

export default function AdminCommissionPayoutsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [logRes, sumRes] = await Promise.all([
        apiFetch<any>('/commission').catch(() => []),
        apiFetch<any>('/commission/summary').catch(() => null),
      ])
      setLogs(Array.isArray(logRes) ? logRes : [])
      setSummary(sumRes)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const approvePayout = async () => {
    if (!selected.length) return
    setSaving(true)
    try {
      await apiFetch('/commission/approve-payout', { method: 'POST', body: { ids: selected } })
      setSelected([])
      load()
    } finally {
      setSaving(false)
    }
  }

  const toggleSelect = (id: string) =>
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const statusLabel = (s: string) => s === 'paid' ? 'Олгосон' : s === 'approved' ? 'Батлагдсан' : 'Хүлээгдэж байна'
  const statusColor = (s: string) => s === 'paid' ? '#10B981' : s === 'approved' ? '#3B82F6' : '#F59E0B'

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Тооцоо нийлүүлэлт</h1>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Vendor-т олгох шимтгэлийн log, payout batch</p>
        </div>
        <a href="/admin/commission" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>
          ← Vendor commission-д буцах
        </a>
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { l: 'Нийт орлого', v: Number(summary.totalGross || 0), c: 'var(--text)' },
            { l: 'BizPrint шимтгэл', v: Number(summary.totalCommission || 0), c: '#FF6B00' },
            { l: 'Vendor-т олгох', v: Number(summary.totalNet || 0), c: '#10B981' },
            { l: 'Хүлээгдэж байна', v: Number(summary.pendingPayout || 0), c: '#F59E0B' },
          ].map(s => (
            <div key={s.l} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.v.toLocaleString()}₮</p>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{s.l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, marginBottom: 14, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12 }}>
          <span style={{ fontSize: 13, color: '#10B981' }}>{selected.length} захиалга сонгогдсон</span>
          <button onClick={approvePayout} disabled={saving}
            style={{ padding: '8px 16px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Батлаж байна...' : 'Тооцоо батлах'}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>Ачааллаж байна…</div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                <th style={{ padding: 12, textAlign: 'left', width: 32 }}></th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 11, color: 'var(--text3)' }}>Vendor</th>
                <th style={{ padding: 12, textAlign: 'right', fontSize: 11, color: 'var(--text3)' }}>Нийт дүн</th>
                <th style={{ padding: 12, textAlign: 'right', fontSize: 11, color: 'var(--text3)' }}>Шимтгэл</th>
                <th style={{ padding: 12, textAlign: 'right', fontSize: 11, color: 'var(--text3)' }}>Цэвэр</th>
                <th style={{ padding: 12, textAlign: 'center', fontSize: 11, color: 'var(--text3)' }}>Статус</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 11, color: 'var(--text3)' }}>Огноо</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                    Тооцоо байхгүй байна
                  </td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: 12 }}>
                    {log.status === 'pending' && (
                      <input type="checkbox" checked={selected.includes(log.id)}
                        onChange={() => toggleSelect(log.id)} />
                    )}
                  </td>
                  <td style={{ padding: 12 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{log.vendor_name || '—'}</p>
                    <p style={{ fontSize: 10, color: 'var(--text4)' }}>{(log.inquiry_id || log.order_id || '').slice(0, 8)}</p>
                  </td>
                  <td style={{ padding: 12, textAlign: 'right', fontSize: 13, color: 'var(--text)' }}>
                    {Number(log.gross_amount).toLocaleString()}₮
                  </td>
                  <td style={{ padding: 12, textAlign: 'right', fontSize: 13, color: '#FF6B00' }}>
                    −{Number(log.commission_amount).toLocaleString()}₮
                  </td>
                  <td style={{ padding: 12, textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#10B981' }}>
                    {Number(log.net_amount).toLocaleString()}₮
                  </td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: `${statusColor(log.status)}15`, color: statusColor(log.status) }}>
                      {statusLabel(log.status)}
                    </span>
                  </td>
                  <td style={{ padding: 12, fontSize: 11, color: 'var(--text4)' }}>
                    {new Date(log.created_at).toLocaleDateString('mn-MN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
