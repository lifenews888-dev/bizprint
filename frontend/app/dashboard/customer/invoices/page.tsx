'use client'
import { useState, useEffect } from 'react'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const ORANGE = '#FF6B00'
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Ноорог', color: '#6B7280', bg: '#F3F4F6' },
  issued: { label: 'Нэхэмжлэгдсэн', color: '#2563EB', bg: '#DBEAFE' },
  paid: { label: 'Төлөгдсөн', color: '#059669', bg: '#D1FAE5' },
  overdue: { label: 'Хугацаа хэтэрсэн', color: '#DC2626', bg: '#FEE2E2' },
  cancelled: { label: 'Цуцлагдсан', color: '#6B7280', bg: '#F3F4F6' },
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    fetch(`${API}/api/payment/invoices/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setInvoices(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) => `${Math.round(Number(n)).toLocaleString()}₮`

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: FONT, color: '#9CA3AF' }}>Ачааллаж байна...</div>

  // Detail view
  if (selected) {
    const st = STATUS_MAP[selected.status] || STATUS_MAP.draft
    return (
      <div style={{ padding: 24, fontFamily: FONT, maxWidth: 700, margin: '0 auto' }}>
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: ORANGE, fontSize: 14, cursor: 'pointer', marginBottom: 16, fontFamily: FONT }}>← Бүх нэхэмжлэхүүд</button>

        <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, border: '1px solid var(--border, #E5E7EB)', overflow: 'hidden' }}>
          {/* Invoice header */}
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border, #E5E7EB)', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 11, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Нэхэмжлэх</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #111)' }}>{selected.invoice_number}</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                {selected.issued_at ? new Date(selected.issued_at).toLocaleDateString('mn-MN') : ''}
              </div>
            </div>
            <span style={{ padding: '4px 14px', borderRadius: 20, background: st.bg, color: st.color, fontSize: 12, fontWeight: 600 }}>{st.label}</span>
          </div>

          {/* Line items */}
          <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border, #E5E7EB)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text, #374151)', marginBottom: 12 }}>Захиалгын мэдээлэл</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>Бүтээгдэхүүн</span>
              <span style={{ fontWeight: 600 }}>{selected.metadata?.product_name || selected.order?.product_name || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>Тоо ширхэг</span>
              <span style={{ fontWeight: 600 }}>{selected.metadata?.quantity || selected.order?.quantity || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>Төлбөрийн арга</span>
              <span style={{ fontWeight: 600 }}>{selected.metadata?.payment_method === 'tdb_qr' ? 'QPay QR' : selected.metadata?.payment_method === 'bank' ? 'Банк шилжүүлэг' : selected.metadata?.payment_method || '—'}</span>
            </div>
            {selected.metadata?.invoice_code && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
                <span style={{ color: '#6B7280' }}>Лавлах код</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{selected.metadata.invoice_code}</span>
              </div>
            )}
          </div>

          {/* Totals */}
          <div style={{ padding: '20px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#6B7280' }}>
              <span>Дүн</span><span>{fmt(selected.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#6B7280' }}>
              <span>НӨАТ (10%)</span><span>{fmt(selected.tax_amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: 20, fontWeight: 700, color: 'var(--text, #111)', borderTop: '2px solid var(--border, #E5E7EB)', marginTop: 8 }}>
              <span>Нийт</span><span style={{ color: ORANGE }}>{fmt(selected.total_amount)}</span>
            </div>
          </div>

          {/* Paid badge */}
          {selected.status === 'paid' && selected.paid_at && (
            <div style={{ padding: '16px 28px', background: '#F0FDF4', borderTop: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>Төлбөр баталгаажсан</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{new Date(selected.paid_at).toLocaleString('mn-MN')}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // List view
  return (
    <div style={{ padding: 24, fontFamily: FONT, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Нэхэмжлэхүүд</h1>
      <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px' }}>Таны төлбөрийн нэхэмжлэхүүд</p>

      {/* Stats */}
      {invoices.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          <div style={{ background: '#D1FAE5', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#059669' }}>{invoices.filter(i => i.status === 'paid').length}</div>
            <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>Төлөгдсөн</div>
          </div>
          <div style={{ background: '#DBEAFE', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#2563EB' }}>{invoices.filter(i => i.status === 'issued').length}</div>
            <div style={{ fontSize: 12, color: '#2563EB', marginTop: 4 }}>Хүлээгдэж буй</div>
          </div>
          <div style={{ background: 'var(--surface, #fff)', borderRadius: 12, padding: '16px 20px', textAlign: 'center', border: '1px solid var(--border, #E5E7EB)' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: ORANGE }}>{fmt(invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0))}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Нийт дүн</div>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid var(--border, #E5E7EB)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧾</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text, #374151)' }}>Нэхэмжлэх байхгүй</div>
          <p style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>Захиалга хийхэд автоматаар нэхэмжлэх үүснэ</p>
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
                    {inv.metadata?.product_name || 'Захиалга'} · {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString('mn-MN') : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: inv.status === 'paid' ? '#059669' : ORANGE }}>{fmt(inv.total_amount)}</div>
                  {inv.paid_at && <div style={{ fontSize: 11, color: '#9CA3AF' }}>Төлсөн: {new Date(inv.paid_at).toLocaleDateString('mn-MN')}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
