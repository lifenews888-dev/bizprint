'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

export default function AdminCommissionBatchesPage() {
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<any>('/commission/batches')
      setBatches(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const markPaid = async (batchId: string) => {
    if (!confirm(`${batchId} batch-ийг олгосон гэж тэмдэглэх үү?`)) return
    await apiFetch(`/commission/mark-paid/${batchId}`, { method: 'POST' }).catch(() => {})
    load()
  }

  const statusLabel = (s: string) => s === 'paid' ? '✓ Олгосон' : s === 'approved' ? 'Батлагдсан' : s
  const statusBg = (s: string) => s === 'paid' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'
  const statusColor = (s: string) => s === 'paid' ? '#10B981' : '#F59E0B'

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Тооцоо нийлүүлэлтийн batch</h1>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            Батлагдсан payout-ууд. "Олгосон" гэж тэмдэглэхэд commission_log-д paid_at бичигдэнэ.
          </p>
        </div>
        <a href="/admin/commission/payouts" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>
          ← Payouts
        </a>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>Ачааллаж байна…</div>
      ) : batches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>📋</p>
          <p style={{ fontSize: 14 }}>Batch байхгүй байна</p>
          <p style={{ fontSize: 11, marginTop: 4 }}>
            <a href="/admin/commission/payouts" style={{ color: '#FF6B00' }}>Payouts хуудсаас</a> тооцоо батлах товч дарна уу
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {batches.map(batch => (
            <div key={batch.batchId} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <p style={{ fontFamily: 'monospace', color: '#FF6B00', fontWeight: 700, fontSize: 14 }}>{batch.batchId}</p>
                  <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                    {batch.count} захиалга · {new Date(batch.created_at).toLocaleDateString('mn-MN')}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#10B981', fontWeight: 700, fontSize: 18 }}>
                    {Number(batch.totalNet).toLocaleString()}₮
                  </p>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: statusBg(batch.status), color: statusColor(batch.status) }}>
                    {statusLabel(batch.status)}
                  </span>
                </div>
              </div>

              {/* Vendor breakdown */}
              {batch.vendors?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {batch.vendors.map((v: any) => (
                    <div key={v.vendorId || Math.random()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{v.vendorName || 'Тодорхойгүй'}</span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>
                          {Number(v.netAmount).toLocaleString()}₮
                        </span>
                        <span style={{ color: 'var(--text4)', fontSize: 10, marginLeft: 6 }}>
                          ({v.count} захиалга)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {batch.status === 'approved' && (
                <button onClick={() => markPaid(batch.batchId)}
                  style={{ width: '100%', padding: '10px 0', background: '#10B981', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  💸 Олгосон гэж тэмдэглэх
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
