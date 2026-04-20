'use client'
import React, { useState, useEffect, Suspense } from 'react'
import React, { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import React, { API_URL } from '@/lib/api'

function TrackContent() {
  const params = useSearchParams()
  const [orderNum, setOrderNum] = useState(params.get('order') || '')
  const [tracking, setTracking] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!orderNum.trim()) return
    setLoading(true)
    setError('')
    setTracking(null)
    try {
      const res = await fetch(`${API_URL}/api/orders/track/${encodeURIComponent(orderNum.trim())}`)
      const data = await res.json()
      if (data.found === false || !data.order_id) {
        setError('Захиалга олдсонгүй. Дугаараа шалгаад дахин оролдоно уу.')
      } else {
        setTracking(data)
      }
    } catch {
      setError('Алдаа гарлаа. Дахин оролдоно уу.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-search if order param provided
  useEffect(() => {
    if (params.get('order')) search()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Захиалга хянах</h1>
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>Захиалгын дугаараа оруулж статусаа шалгана уу</p>
      </div>

      {/* Search */}
      <form onSubmit={search} style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <input value={orderNum} onChange={e => setOrderNum(e.target.value)}
          placeholder="Захиалгын дугаар (жш: QT-20260411-...)"
          style={{ flex: 1, padding: '14px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 14, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
        <button type="submit" disabled={loading}
          style={{ padding: '14px 24px', borderRadius: 12, background: '#FF6B00', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
          {loading ? '...' : 'Хайх'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div style={{ padding: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
          {error}
        </div>
      )}

      {/* Tracking result */}
      {tracking && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Order summary */}
          <div style={{ padding: 20, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Захиалгын дугаар</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace' }}>{tracking.order_number}</div>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)', fontSize: 13, fontWeight: 600, color: '#FF6B00' }}>
                <span>{tracking.status_icon}</span> {tracking.status_label}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              {[
                ['Бүтээгдэхүүн', tracking.product_name || '—'],
                ['Тираж', tracking.quantity ? `${Number(tracking.quantity).toLocaleString()} ш` : '—'],
                ['Нийт дүн', tracking.total_price ? `${Number(tracking.total_price).toLocaleString()}₮` : '—'],
                ['Огноо', tracking.created_at ? new Date(tracking.created_at).toLocaleDateString('mn-MN') : '—'],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ padding: 20, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>Явц</h2>
            <div style={{ position: 'relative', paddingLeft: 28 }}>
              {/* Vertical line */}
              <div style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />

              {tracking.timeline?.map((step: any, i: number) => (
                <div key={step.status} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: i < tracking.timeline.length - 1 ? 20 : 0, position: 'relative' }}>
                  {/* Dot */}
                  <div style={{
                    position: 'absolute', left: -28 + 6, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, zIndex: 1, flexShrink: 0,
                    background: step.completed ? 'rgba(16,185,129,0.15)' : step.active ? 'rgba(255,107,0,0.15)' : 'var(--surface2)',
                    border: step.active ? '2px solid #FF6B00' : step.completed ? '2px solid #10B981' : '1px solid var(--border)',
                  }}>
                    {step.completed ? '✓' : step.active ? '' : ''}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, paddingTop: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: 13, fontWeight: step.active ? 600 : 500,
                        color: step.active ? '#FF6B00' : step.completed ? 'var(--text)' : 'var(--text3)',
                      }}>
                        {step.icon} {step.label}
                      </span>
                      {step.date && (
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                          {new Date(step.date).toLocaleDateString('mn-MN')}
                        </span>
                      )}
                    </div>
                    {step.active && (
                      <div style={{ fontSize: 11, color: '#FF6B00', marginTop: 2 }}>● Одоогийн статус</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <a href="/contact" style={{ flex: 1, padding: '12px 0', border: '1px solid var(--border)', borderRadius: 12, textAlign: 'center', fontSize: 13, color: 'var(--text2)', textDecoration: 'none' }}>
              💬 Холбогдох
            </a>
            <a href="tel:+97677117700" style={{ flex: 1, padding: '12px 0', background: '#FF6B00', borderRadius: 12, textAlign: 'center', fontSize: 13, color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
              📞 7711-7700
            </a>
          </div>
        </div>
      )}

      {/* Help */}
      {!tracking && !loading && !error && (
        <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, marginTop: 20 }}>
          <p style={{ marginBottom: 8 }}>Захиалгын дугаараа мэдэхгүй байна уу?</p>
          <a href="mailto:info@bizprint.mn" style={{ color: '#FF6B00', textDecoration: 'none' }}>info@bizprint.mn руу бичнэ үү</a>
        </div>
      )}
    </div>
  )
}

export default function TrackPage() {
  return <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: 'var(--text3)' }}>Ачааллаж байна...</div>}><TrackContent /></Suspense>
}
