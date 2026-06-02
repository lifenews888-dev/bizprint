'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import PricingSnapshotPanel from '@/components/PricingSnapshotPanel'
import {
  type PricingSnapshot,
  getPricingConfidenceBadge,
  pricingSourceLabel,
} from '@/lib/pricing/snapshot'

type TabKey = 'new' | 'active' | 'done' | 'payout'

interface VendorInquiry {
  id: string;
  status: string;
  product_name?: string;
  category?: string;
  quantity?: number;
  size_label?: string;
  paper_type?: string;
  customer_name?: string;
  customer_phone?: string;
  estimated_price?: number;
  quoted_price?: number;
  pricing_snapshot?: PricingSnapshot;
  vendor_accepted?: boolean;
  notes?: string;
  created_at: string;
}

interface CommissionSummary {
  totalGross?: number;
  totalCommission?: number;
  totalNet?: number;
  pendingPayout?: number;
}

interface VendorUser {
  id?: string;
  company_name?: string;
  full_name?: string;
  email?: string;
}

const parseStoredUser = (): VendorUser => {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem('user') || '{}') as VendorUser
  } catch {
    return {}
  }
}

const getAcceptBlocker = (inquiry: VendorInquiry) => {
  if (inquiry.status !== 'confirmed') return 'Үнийн санал баталгаажсаны дараа хүлээн авна'
  if (!Number(inquiry.quoted_price || 0)) return 'Баталгаатай үнийн санал илгээгдээгүй байна'
  return ''
}

const getRejectBlocker = (inquiry: VendorInquiry) => {
  if (inquiry.vendor_accepted || ['in_work', 'completed', 'cancelled'].includes(inquiry.status)) {
    return 'Ажил эхэлсэн захиалгыг татгалзахгүй'
  }
  return ''
}

export default function VendorInquiriesDashboard() {
  const router = useRouter()
  const [inquiries, setInquiries] = useState<VendorInquiry[]>([])
  const [summary, setSummary] = useState<CommissionSummary | null>(null)
  const [tab, setTab] = useState<TabKey>('new')
  const [loading, setLoading] = useState(true)

  const user = useMemo(() => parseStoredUser(), [])

  const load = useCallback(async () => {
    if (!user.id) return
    setLoading(true)
    try {
      const [inqData, sumData] = await Promise.all([
        apiFetch<VendorInquiry[] | { data?: VendorInquiry[] }>('/inquiries/vendor/my').catch(() => []),
        apiFetch<CommissionSummary | null>(`/commission/summary?vendor_id=${user.id}`).catch(() => null),
      ])
      setInquiries(Array.isArray(inqData) ? inqData : inqData?.data || [])
      setSummary(sumData)
    } catch {}
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    void Promise.resolve().then(load)
  }, [load])

  // Auto-refresh every 30s when tab is visible
  useEffect(() => {
    if (!user.id) return
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, 30000)
    return () => clearInterval(interval)
  }, [load, user.id])

  // Refresh on window focus
  useEffect(() => {
    if (!user.id) return
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load, user.id])

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
  const STAT = () => ({
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
              <div key={s.l} style={STAT()}>
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
                        {pricingSourceLabel(inq.pricing_snapshot) && (
                          <p style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: inq.pricing_snapshot?.source === 'server' ? '#10B981' : '#F59E0B',
                            marginTop: 2,
                          }}>
                            {pricingSourceLabel(inq.pricing_snapshot)}
                          </p>
                        )}
                        <p style={{ fontSize: 10, color: 'var(--text4)' }}>
                          {new Date(inq.created_at).toLocaleDateString('mn-MN')}
                        </p>
                      </div>
                    </div>
                    {getPricingConfidenceBadge(inq.pricing_snapshot) && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        marginBottom: 10,
                        padding: '4px 8px',
                        borderRadius: 999,
                        ...getPricingConfidenceBadge(inq.pricing_snapshot).style,
                        fontSize: 11,
                        fontWeight: 700,
                      }}>
                        {getPricingConfidenceBadge(inq.pricing_snapshot).label}
                      </div>
                    )}
                    {inq.notes && (
                      <p style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--surface2)', borderRadius: 8, padding: 10, marginBottom: 12 }}>
                        {inq.notes}
                      </p>
                    )}
                    <div style={{ marginBottom: 12 }}>
                      <PricingSnapshotPanel
                        snapshot={inq.pricing_snapshot}
                        estimatedPrice={inq.estimated_price}
                        compact
                      />
                    </div>
                    {getAcceptBlocker(inq) && (
                      <p style={{ fontSize: 11, color: '#B45309', background: 'rgba(245,158,11,0.12)', borderRadius: 8, padding: 10, marginBottom: 12 }}>
                        {getAcceptBlocker(inq)}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => accept(inq.id)}
                        disabled={!!getAcceptBlocker(inq)}
                        style={{ flex: 1, padding: '10px 0', background: getAcceptBlocker(inq) ? 'rgba(148,163,184,0.25)' : '#10B981', color: getAcceptBlocker(inq) ? 'var(--text3)' : '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: getAcceptBlocker(inq) ? 'not-allowed' : 'pointer' }}>
                        ✓ Хүлээн авах
                      </button>
                      <button onClick={() => reject(inq.id)}
                        disabled={!!getRejectBlocker(inq)}
                        title={getRejectBlocker(inq) || 'Татгалзах'}
                        style={{ flex: 1, padding: '10px 0', border: '1px solid rgba(239,68,68,0.3)', background: getRejectBlocker(inq) ? 'rgba(148,163,184,0.12)' : 'rgba(239,68,68,0.05)', color: getRejectBlocker(inq) ? 'var(--text3)' : '#EF4444', borderRadius: 10, fontSize: 13, cursor: getRejectBlocker(inq) ? 'not-allowed' : 'pointer' }}>
                        {getRejectBlocker(inq) || '✕ Татгалзах'}
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
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
                      {pricingSourceLabel(inq.pricing_snapshot) && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: inq.pricing_snapshot?.source === 'server' ? '#10B981' : '#F59E0B',
                          background: inq.pricing_snapshot?.source === 'server' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.12)',
                          padding: '4px 10px',
                          borderRadius: 999,
                        }}>
                          {pricingSourceLabel(inq.pricing_snapshot)}
                        </span>
                      )}
                      {getPricingConfidenceBadge(inq.pricing_snapshot) && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          ...getPricingConfidenceBadge(inq.pricing_snapshot).style,
                          padding: '4px 10px',
                          borderRadius: 999,
                        }}>
                          {getPricingConfidenceBadge(inq.pricing_snapshot).label}
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <PricingSnapshotPanel
                        snapshot={inq.pricing_snapshot}
                        estimatedPrice={inq.estimated_price}
                        compact
                      />
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
