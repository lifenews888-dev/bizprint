'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, API_URL } from '@/lib/api'

type TabKey = 'new' | 'active' | 'done' | 'payout'

export default function VendorInquiriesDashboard() {
  const router = useRouter()
  const [inquiries, setInquiries] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [tab, setTab] = useState<TabKey>('new')
  const [loading, setLoading] = useState(true)

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {}

  const load = async () => {
    setLoading(true)
    try {
      const [inqData, sumData] = await Promise.all([
        apiFetch<any>('/inquiries').catch(() => []),
        apiFetch<any>(`/commission/summary?vendor_id=${user.id}`).catch(() => null),
      ])
      setInquiries(Array.isArray(inqData) ? inqData : inqData?.data || [])
      setSummary(sumData)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { if (user.id) load() }, [user.id])

  // Auto-refresh every 30s when tab is visible
  useEffect(() => {
    if (!user.id) return
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  // Refresh on window focus
  useEffect(() => {
    if (!user.id) return
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  const accept = async (id: string) => {
    await apiFetch(`/inquiries/${id}/vendor-accept`, { method: 'POST' }).catch(() => {})
    load()
  }

  const reject = async (id: string) => {
    await apiFetch(`/inquiries/${id}/vendor-reject`, { method: 'POST' }).catch(() => {})
    load()
  }

  const newOrders = inquiries.filter(i =>
    (i.status === 'new' || i.status === 'reviewing' || i.status === 'confirmed') && !i.vendor_accepted
  )
  const activeOrders = inquiries.filter(i =>
    i.vendor_accepted && !['completed', 'cancelled'].includes(i.status)
  )
  const doneOrders = inquiries.filter(i => ['completed'].includes(i.status))

  const CARD = 'bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5'
  const STAT = (color: string) => ({
    padding: 16,
    borderRadius: 12,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Vendor захиалгын самбар</h1>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
              {user.company_name || user.full_name || user.email || 'Vendor'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={load} disabled={loading}
              title="Шинэчлэх"
              style={{ padding: '8px 12px', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 10, fontSize: 13, color: 'var(--text2)', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
              {loading ? '⟳' : '↻'} Шинэчлэх
            </button>
            <a href="/dashboard/vendor" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>
              ← Үйлдвэрлэлийн самбар
            </a>
          </div>
        </div>

        {/* Summary cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { l: 'Нийт орлого', v: Number(summary.totalGross || 0), c: 'var(--text)' },
              { l: 'Шимтгэл (BizPrint)', v: Number(summary.totalCommission || 0), c: '#EF4444' },
              { l: 'Цэвэр орлого', v: Number(summary.totalNet || 0), c: '#10B981' },
              { l: 'Хүлээгдэж байгаа', v: Number(summary.pendingPayout || 0), c: '#FF6B00' },
            ].map(s => (
              <div key={s.l} style={STAT(s.c)}>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{s.l}</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: s.c }}>{s.v.toLocaleString()}₮</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { k: 'new' as TabKey, l: `Шинэ (${newOrders.length})` },
            { k: 'active' as TabKey, l: `Идэвхтэй (${activeOrders.length})` },
            { k: 'done' as TabKey, l: 'Дууссан' },
            { k: 'payout' as TabKey, l: 'Тооцоо' },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              style={{
                padding: '8px 16px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                border: tab === t.k ? 'none' : '1px solid var(--border)',
                background: tab === t.k ? '#FF6B00' : 'var(--surface)',
                color: tab === t.k ? '#fff' : 'var(--text2)',
              }}>
              {t.l}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>Ачааллаж байна…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* New orders */}
            {tab === 'new' && (
              newOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
                  <p style={{ fontSize: 14 }}>Шинэ захиалга байхгүй</p>
                </div>
              ) : (
                newOrders.map(inq => (
                  <div key={inq.id} className={CARD} style={{ borderColor: 'rgba(255,107,0,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text)' }}>{inq.product_name || inq.category}</p>
                        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                          {inq.quantity?.toLocaleString()} ш · {inq.size_label} · {inq.paper_type}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text4)', marginTop: 2 }}>
                          {inq.customer_name} · {inq.customer_phone}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {Number(inq.estimated_price) > 0 && (
                          <p style={{ color: '#FF6B00', fontWeight: 700, fontSize: 17 }}>
                            {Number(inq.estimated_price).toLocaleString()}₮
                          </p>
                        )}
                        <p style={{ fontSize: 10, color: 'var(--text4)' }}>
                          {new Date(inq.created_at).toLocaleDateString('mn-MN')}
                        </p>
                      </div>
                    </div>
                    {inq.notes && (
                      <p style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--surface2)', borderRadius: 8, padding: 10, marginBottom: 12 }}>
                        {inq.notes}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => accept(inq.id)}
                        style={{ flex: 1, padding: '10px 0', background: '#10B981', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        ✓ Хүлээн авах
                      </button>
                      <button onClick={() => reject(inq.id)}
                        style={{ flex: 1, padding: '10px 0', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)', color: '#EF4444', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>
                        ✕ Татгалзах
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {/* Active orders */}
            {tab === 'active' && (
              activeOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
                  <p style={{ fontSize: 14 }}>Идэвхтэй захиалга байхгүй</p>
                </div>
              ) : (
                activeOrders.map(inq => (
                  <div key={inq.id} className={CARD}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text)' }}>{inq.product_name || inq.category}</p>
                        <p style={{ fontSize: 12, color: 'var(--text3)' }}>{inq.quantity?.toLocaleString()} ш</p>
                      </div>
                      <span style={{ fontSize: 11, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', padding: '4px 10px', borderRadius: 10 }}>
                        {inq.status}
                      </span>
                    </div>
                    <button onClick={() => router.push(`/inquiries/${inq.id}`)}
                      style={{ marginTop: 12, width: '100%', padding: '8px 0', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 10, fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>
                      Дэлгэрэнгүй харах →
                    </button>
                  </div>
                ))
              )
            )}

            {/* Done orders */}
            {tab === 'done' && (
              doneOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
                  <p style={{ fontSize: 14 }}>Дууссан захиалга байхгүй</p>
                </div>
              ) : (
                doneOrders.map(inq => (
                  <div key={inq.id} className={CARD}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{inq.product_name || inq.category}</p>
                        <p style={{ fontSize: 11, color: 'var(--text3)' }}>{inq.quantity?.toLocaleString()} ш</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: '#10B981', fontWeight: 600, fontSize: 13 }}>
                          {Number((inq.estimated_price || 0) * 0.85).toLocaleString()}₮
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--text4)' }}>цэвэр орлого</p>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

            {/* Payout tab */}
            {tab === 'payout' && (
              <div className={CARD} style={{ textAlign: 'center', padding: 32 }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>💰</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Тооцоо нийлүүлэлт
                </p>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>
                  7 хоног тутам BizPrint тооцоо нийлүүлнэ
                </p>
                <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 16 }}>
                  <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Дараагийн тооцоолол</p>
                  <p style={{ fontSize: 26, fontWeight: 800, color: '#FF6B00' }}>
                    {Number(summary?.pendingPayout || 0).toLocaleString()}₮
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
