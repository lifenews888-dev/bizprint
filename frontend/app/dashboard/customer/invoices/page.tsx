'use client'
import { useState, useEffect } from 'react'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const ORANGE = '#FF6B00'
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'ÐÐ¾Ð¾ÑÐ¾Ð³', color: '#6B7280', bg: '#F3F4F6' },
  issued: { label: 'ÐÑÑÑÐ¼Ð¶Ð»ÑÐ³Ð´ÑÑÐ½', color: '#2563EB', bg: '#DBEAFE' },
  paid: { label: 'Ð¢Ó©Ð»Ó©Ð³Ð´ÑÓ©Ð½', color: '#059669', bg: '#D1FAE5' },
  overdue: { label: 'Ð¥ÑÐ³Ð°ÑÐ°Ð° ÑÑÑÑÑÑÑÐ½', color: '#DC2626', bg: '#FEE2E2' },
  cancelled: { label: 'Ð¦ÑÑÐ»Ð°Ð³Ð´ÑÐ°Ð½', color: '#6B7280', bg: '#F3F4F6' },
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [history, setHistory] = useState<Record<string, any>>({})

  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    fetch(`${API}/api/payment/invoices/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setInvoices(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
    // Fetch payment history for timeline
    fetch(`${API}/api/payment/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((d: any[]) => {
        const map: Record<string, any> = {}
        if (Array.isArray(d)) d.forEach(h => { map[h.invoice_id] = h })
        setHistory(map)
      })
      .catch(() => {})
  }, [])

  const fmt = (n: number) => `${Math.round(Number(n)).toLocaleString()}â®`

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: FONT, color: '#9CA3AF' }}>ÐÑÐ°Ð°Ð»Ð»Ð°Ð¶ Ð±Ð°Ð¹Ð½Ð°...</div>

  // Detail view
  if (selected) {
    const st = STATUS_MAP[selected.status] || STATUS_MAP.draft
    return (
      <div style={{ padding: 24, fontFamily: FONT, maxWidth: 700, margin: '0 auto' }}>
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: ORANGE, fontSize: 14, cursor: 'pointer', marginBottom: 16, fontFamily: FONT }}>â ÐÒ¯Ñ Ð½ÑÑÑÐ¼Ð¶Ð»ÑÑÒ¯Ò¯Ð´</button>

        <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, border: '1px solid var(--border, #E5E7EB)', overflow: 'hidden' }}>
          {/* Invoice header */}
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border, #E5E7EB)', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 11, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>ÐÑÑÑÐ¼Ð¶Ð»ÑÑ</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #111)' }}>{selected.invoice_number}</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                {selected.issued_at ? new Date(selected.issued_at).toLocaleDateString('mn-MN') : ''}
              </div>
            </div>
            <span style={{ padding: '4px 14px', borderRadius: 20, background: st.bg, color: st.color, fontSize: 12, fontWeight: 600 }}>{st.label}</span>
          </div>

          {/* Line items */}
          <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border, #E5E7EB)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text, #374151)', marginBottom: 12 }}>ÐÐ°ÑÐ¸Ð°Ð»Ð³ÑÐ½ Ð¼ÑÐ´ÑÑÐ»ÑÐ»</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>ÐÒ¯ÑÑÑÐ³Ð´ÑÑÒ¯Ò¯Ð½</span>
              <span style={{ fontWeight: 600 }}>{selected.metadata?.product_name || selected.order?.product_name || 'â'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>Ð¢Ð¾Ð¾ ÑÐ¸ÑÑÑÐ³</span>
              <span style={{ fontWeight: 600 }}>{selected.metadata?.quantity || selected.order?.quantity || 'â'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>Ð¢Ó©Ð»Ð±Ó©ÑÐ¸Ð¹Ð½ Ð°ÑÐ³Ð°</span>
              <span style={{ fontWeight: 600 }}>{selected.metadata?.payment_method === 'tdb_qr' ? 'QPay QR' : selected.metadata?.payment_method === 'bank' ? 'ÐÐ°Ð½Ðº ÑÐ¸Ð»Ð¶Ò¯Ò¯Ð»ÑÐ³' : selected.metadata?.payment_method || 'â'}</span>
            </div>
            {selected.metadata?.invoice_code && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
                <span style={{ color: '#6B7280' }}>ÐÐ°Ð²Ð»Ð°Ñ ÐºÐ¾Ð´</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{selected.metadata.invoice_code}</span>
              </div>
            )}
          </div>

          {/* Totals */}
          <div style={{ padding: '20px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#6B7280' }}>
              <span>ÐÒ¯Ð½</span><span>{fmt(selected.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#6B7280' }}>
              <span>ÐÓ¨ÐÐ¢ (10%)</span><span>{fmt(selected.tax_amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: 20, fontWeight: 700, color: 'var(--text, #111)', borderTop: '2px solid var(--border, #E5E7EB)', marginTop: 8 }}>
              <span>ÐÐ¸Ð¹Ñ</span><span style={{ color: ORANGE }}>{fmt(selected.total_amount)}</span>
            </div>
          </div>

          {/* Paid badge */}
          {selected.status === 'paid' && selected.paid_at && (
            <div style={{ padding: '16px 28px', background: '#F0FDF4', borderTop: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>â</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>Ð¢Ó©Ð»Ð±Ó©Ñ Ð±Ð°ÑÐ°Ð»Ð³Ð°Ð°Ð¶ÑÐ°Ð½</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{new Date(selected.paid_at).toLocaleString('mn-MN')}</div>
              </div>
            </div>

          {/* Payment Status Timeline — paid → escrow → released */}
          {(() => {
            const histItem = history[selected.id]
            if (!histItem) return null
            const steps = histItem.status_steps || []
            const STEP_LABELS: Record<string, string> = {
              paid: 'Төлөгдсөн', held: 'Escrow (Барьцаа)', released: 'Суллагдсан',
            }
            const STEP_COLORS: Record<string, string> = {
              paid: '#22c55e', held: '#f59e0b', released: '#3b82f6',
            }
            return (
              <div style={{ margin: '20px 0', padding: '16px 20px', background: 'var(--surface, #f9fafb)', borderRadius: 12, border: '1px solid var(--border, #e5e7eb)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text, #111)', marginBottom: 14, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Төлбөрийн статус</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  {steps.map((s: any, idx: number) => {
                    const done = !!s.at
                    const color = done ? STEP_COLORS[s.step] : '#d1d5db'
                    return (
                      <div key={s.step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#fff', fontWeight: 700, boxShadow: done ? '0 0 0 4px ' + color + '33' : 'none' }}>
                            {done ? '✓' : (idx + 1)}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color, marginTop: 6, textAlign: 'center' }}>{STEP_LABELS[s.step]}</div>
                          {s.at && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{new Date(s.at).toLocaleDateString('mn-MN')}</div>}
                        </div>
                        {idx < steps.length - 1 && (
                          <div style={{ flex: 1, height: 3, background: steps[idx + 1]?.at ? STEP_COLORS[steps[idx + 1]?.step] : '#e5e7eb', marginBottom: 24, borderRadius: 2 }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
          )}
        </div>
      </div>
    )
  }

  // List view
  return (
    <div style={{ padding: 24, fontFamily: FONT, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>ÐÑÑÑÐ¼Ð¶Ð»ÑÑÒ¯Ò¯Ð´</h1>
      <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px' }}>Ð¢Ð°Ð½Ñ ÑÓ©Ð»Ð±Ó©ÑÐ¸Ð¹Ð½ Ð½ÑÑÑÐ¼Ð¶Ð»ÑÑÒ¯Ò¯Ð´</p>

      {/* Stats */}
      {invoices.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          <div style={{ background: '#D1FAE5', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#059669' }}>{invoices.filter(i => i.status === 'paid').length}</div>
            <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>Ð¢Ó©Ð»Ó©Ð³Ð´ÑÓ©Ð½</div>
          </div>
          <div style={{ background: '#DBEAFE', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#2563EB' }}>{invoices.filter(i => i.status === 'issued').length}</div>
            <div style={{ fontSize: 12, color: '#2563EB', marginTop: 4 }}>Ð¥Ò¯Ð»ÑÑÐ³Ð´ÑÐ¶ Ð±ÑÐ¹</div>
          </div>
          <div style={{ background: 'var(--surface, #fff)', borderRadius: 12, padding: '16px 20px', textAlign: 'center', border: '1px solid var(--border, #E5E7EB)' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: ORANGE }}>{fmt(invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0))}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>ÐÐ¸Ð¹Ñ Ð´Ò¯Ð½</div>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid var(--border, #E5E7EB)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>ð§¾</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text, #374151)' }}>ÐÑÑÑÐ¼Ð¶Ð»ÑÑ Ð±Ð°Ð¹ÑÐ³Ò¯Ð¹</div>
          <p style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>ÐÐ°ÑÐ¸Ð°Ð»Ð³Ð° ÑÐ¸Ð¹ÑÑÐ´ Ð°Ð²ÑÐ¾Ð¼Ð°ÑÐ°Ð°Ñ Ð½ÑÑÑÐ¼Ð¶Ð»ÑÑ Ò¯Ò¯ÑÐ½Ñ</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {invoices.map((inv: any) => {
            const st = STATUS_MAP[inv.status] || STATUS_MAP.draft
            return (
              <div key={inv.id} onClick={() => setSelected(inv)} style={{
                background: 'var(--surface, #fff)', borderRadius: 14, padding: '18px 22px',
                border: '1px solid var(--border, #E5E7EB)', cursor: 'pointer', transition: 'box-shadow 0.2s',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text, #111)', fontFamily: 'monospace' }}>{inv.invoice_number}</span>
                    <span style={{ padding: '2px 10px', borderRadius: 20, background: st.bg, color: st.color, fontSize: 11, fontWeight: 600 }}>{st.label}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>
                    {inv.metadata?.product_name || 'ÐÐ°ÑÐ¸Ð°Ð»Ð³Ð°'} Â· {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString('mn-MN') : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: inv.status === 'paid' ? '#059669' : ORANGE }}>{fmt(inv.total_amount)}</div>
                  {inv.paid_at && <div style={{ fontSize: 11, color: '#9CA3AF' }}>Ð¢Ó©Ð»ÑÓ©Ð½: {new Date(inv.paid_at).toLocaleDateString('mn-MN')}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
