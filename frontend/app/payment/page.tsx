'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import React, { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const fmt = (n: number) => Number(n).toLocaleString('mn-MN') + '₮'

type Method = 'qr' | 'bank' | 'cash'
type QrState = 'idle' | 'loading' | 'ready' | 'polling' | 'paid' | 'error'

const BANK_INFO = {
  name:        'BizPrint LLC',
  account:     '490077330',
  bank:        'Хаан банк',
  bankCode:    'KHAN',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentPage() {
  const router = useRouter()

  const [orderId, setOrderId]   = useState('')
  const [amount, setAmount]     = useState(0)
  const [method, setMethod]     = useState<Method>('qr')
  const [qrState, setQrState]   = useState<QrState>('idle')
  const [qrImage, setQrImage]   = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [copied, setCopied]     = useState<string | null>(null)
  const [cashDone, setCashDone] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Read order_id and amount from URL
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const oid = p.get('order_id') || ''
    const amt = Number(p.get('amount') || 0)
    setOrderId(oid)
    setAmount(amt)
  }, [])

  // Auto-generate QR when amount+orderId ready and tab = qr
  useEffect(() => {
    if (method === 'qr' && orderId && amount && qrState === 'idle') {
      generateQr()
    }
  }, [method, orderId, amount]) // eslint-disable-line

  // Cleanup poll on unmount
  useEffect(() => () => stopPoll(), [])

  function stopPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  // ── Generate QR ────────────────────────────────────────────────────────────

  async function generateQr() {
    if (!orderId || !amount) return
    stopPoll()
    setQrState('loading')
    setError(null)
    try {
      const res = await fetch(`${API}/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount, method: 'qr' }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'QR үүсгэхэд алдаа')
      setQrImage(data.qrImage || '')
      setInvoiceNo(data.invoiceNo || '')
      setExpiresAt(data.expiresAt || null)
      setQrState('ready')
      startPoll(data.invoiceNo)
    } catch (e: any) {
      setError(e?.message || 'QR үүсгэхэд алдаа гарлаа')
      setQrState('error')
    }
  }

  // ── Poll status ────────────────────────────────────────────────────────────

  function startPoll(inv: string) {
    stopPoll()
    setQrState('polling')
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/payment/status/${inv}`)
        const data = await res.json()
        if (data.status === 1 || data.status === 'PAID' || data.status === 'paid') {
          stopPoll()
          setQrState('paid')
          setTimeout(() => router.push('/order'), 2500)
        }
      } catch { /* ignore */ }
    }, 3000)
  }

  // ── Cash confirm ───────────────────────────────────────────────────────────

  async function confirmCash() {
    try {
      await fetch(`${API}/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount, method: 'cash' }),
      })
      setCashDone(true)
      setTimeout(() => router.push('/order'), 2500)
    } catch { /* ignore */ }
  }

  // ── Copy helper ────────────────────────────────────────────────────────────

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(null), 1800)
  }

  // ── Tab switch ─────────────────────────────────────────────────────────────

  function switchMethod(m: Method) {
    setMethod(m)
    if (m !== 'qr') { stopPoll(); setQrState('idle') }
    if (m === 'qr' && qrState === 'idle') {
      // Will trigger in useEffect above, but be explicit:
      setTimeout(generateQr, 50)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #F8F7F4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: F }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💳</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', color: 'var(--text, #111)' }}>Төлбөр төлөх</h1>
          {orderId && (
            <div style={{ fontSize: 13, color: 'var(--text2, #888)' }}>
              Захиалга <span style={{ fontWeight: 700, color: 'var(--text, #111)' }}>#{orderId.slice(0, 8).toUpperCase()}</span>
            </div>
          )}
          {amount > 0 && (
            <div style={{ fontSize: 28, fontWeight: 800, color: '#FF6B00', marginTop: 6 }}>
              {fmt(amount)}
            </div>
          )}
        </div>

        <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border, #E5E7EB)', borderRadius: 20, overflow: 'hidden' }}>

          {/* Method tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid var(--border, #E5E7EB)' }}>
            {([
              ['qr',   '📱 QR'],
              ['bank', '🏦 Банк'],
              ['cash', '💵 Бэлэн'],
            ] as [Method, string][]).map(([m, label]) => (
              <button
                key={m}
                onClick={() => switchMethod(m)}
                style={{ padding: '14px 8px', border: 'none', background: method === m ? 'rgba(255,107,0,0.06)' : 'transparent', color: method === m ? '#FF6B00' : 'var(--text2, #888)', fontWeight: method === m ? 700 : 400, fontSize: 13, cursor: 'pointer', borderBottom: method === m ? '2px solid #FF6B00' : '2px solid transparent', fontFamily: F, transition: 'all 0.15s' }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ padding: 28 }}>

            {/* ══ QR tab ══ */}
            {method === 'qr' && (
              <>
                {qrState === 'paid' ? (
                  /* Success */
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 64, marginBottom: 12, animation: 'pop 0.4s ease' }}>✅</div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#10B981', margin: '0 0 8px' }}>Төлбөр амжилттай!</h3>
                    <p style={{ fontSize: 14, color: 'var(--text2, #888)', margin: 0 }}>Захиалга руу шилжиж байна...</p>
                  </div>
                ) : qrState === 'error' ? (
                  /* Error */
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ padding: '14px', background: '#FEF2F2', borderRadius: 10, color: '#B91C1C', fontSize: 13, marginBottom: 16 }}>
                      ⚠️ {error}
                    </div>
                    <button onClick={generateQr} style={btnSt}>🔄 Дахин оролдох</button>
                  </div>
                ) : qrState === 'loading' ? (
                  /* Loading */
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                    <div style={{ fontSize: 14, color: 'var(--text2, #888)' }}>QR код үүсгэж байна...</div>
                  </div>
                ) : (
                  /* QR ready / polling */
                  <div style={{ textAlign: 'center' }}>
                    {qrImage ? (
                      <div style={{ display: 'inline-block', padding: 12, background: '#fff', borderRadius: 12, border: '2px solid var(--border, #E5E7EB)', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        <img
                          src={`data:image/png;base64,${qrImage}`}
                          alt="QR Code"
                          style={{ width: 200, height: 200, display: 'block' }}
                        />
                      </div>
                    ) : (
                      <div style={{ width: 224, height: 224, background: 'var(--surface2, #F3F4F6)', borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 13, color: 'var(--text2, #888)' }}>
                        QR байхгүй
                      </div>
                    )}

                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text, #111)', marginBottom: 6 }}>
                      Утасны банкны аппаар уншуулна уу
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2, #888)', marginBottom: 16 }}>
                      TDB, Хаан банк, Голомт, М-банк болон бусад банк дэмжинэ
                    </div>

                    {qrState === 'polling' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: '#3B82F6', marginBottom: 16 }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', animation: 'pulse 1.2s infinite' }} />
                        Төлбөр хүлээж байна...
                      </div>
                    )}

                    {expiresAt && (
                      <div style={{ fontSize: 12, color: 'var(--text2, #888)', marginBottom: 16 }}>
                        Хүчинтэй: {new Date(expiresAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })} хүртэл
                      </div>
                    )}

                    <button onClick={generateQr} style={{ ...btnSt, fontSize: 12, padding: '7px 16px', marginTop: 0 }}>
                      🔄 QR дахин авах
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ══ Bank transfer tab ══ */}
            {method === 'bank' && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text, #111)', marginBottom: 16 }}>
                  Дараах дансанд шилжүүлнэ үү
                </div>

                {[
                  { label: 'Дансны нэр',       value: BANK_INFO.name,    key: 'name' },
                  { label: 'Дансны дугаар',     value: BANK_INFO.account, key: 'acct' },
                  { label: 'Банк',              value: BANK_INFO.bank,    key: 'bank' },
                  { label: 'Гүйлгээний утга',  value: orderId ? `Order ${orderId.slice(0, 8).toUpperCase()}` : '—', key: 'ref' },
                  { label: 'Дүн',               value: fmt(amount),       key: 'amt'  },
                ].map(row => (
                  <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border, #F3F4F6)' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text2, #888)', fontWeight: 600, marginBottom: 2 }}>{row.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text, #111)' }}>{row.value}</div>
                    </div>
                    <button
                      onClick={() => copy(row.value, row.key)}
                      style={{ padding: '5px 12px', background: copied === row.key ? 'rgba(16,185,129,0.1)' : 'var(--surface2, #F3F4F6)', color: copied === row.key ? '#10B981' : 'var(--text2, #888)', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s' }}
                    >
                      {copied === row.key ? '✓ Хуулагдлаа' : 'Хуулах'}
                    </button>
                  </div>
                ))}

                <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, fontSize: 13, color: '#92400E' }}>
                  ⚠️ Гүйлгээний утгыг зөв бичнэ үү — захиалгын дугаарыг оруулсан байх ёстой.
                </div>

                <button onClick={() => router.push('/order')} style={{ ...btnSt, marginTop: 20 }}>
                  Захиалгыг харах →
                </button>
              </div>
            )}

            {/* ══ Cash tab ══ */}
            {method === 'cash' && (
              <div style={{ textAlign: 'center' }}>
                {cashDone ? (
                  <div style={{ padding: '20px 0' }}>
                    <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#10B981', margin: '0 0 8px' }}>Баталгаажлаа!</h3>
                    <p style={{ fontSize: 13, color: 'var(--text2, #888)' }}>Захиалга руу шилжиж байна...</p>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: 'var(--text, #111)' }}>
                      Оффист ирж бэлнээр төлнэ үү
                    </h3>
                    <div style={{ fontSize: 13, color: 'var(--text2, #888)', lineHeight: 1.6, marginBottom: 20 }}>
                      <p style={{ margin: '0 0 6px' }}>📍 Улаанбаатар хот, Сүхбаатар дүүрэг</p>
                      <p style={{ margin: '0 0 6px' }}>🕐 Даваа–Баасан, 09:00–18:00</p>
                      <p style={{ margin: '0 0 6px' }}>📞 <strong>+976 7700-0000</strong></p>
                    </div>
                    <div style={{ padding: '14px', background: 'rgba(255,107,0,0.06)', borderRadius: 12, marginBottom: 20 }}>
                      <div style={{ fontSize: 13, color: 'var(--text2, #888)', marginBottom: 4 }}>Төлөх дүн</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#FF6B00' }}>{fmt(amount)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2, #888)', marginTop: 4 }}>
                        Захиалга #{orderId.slice(0, 8).toUpperCase()}
                      </div>
                    </div>
                    <button onClick={confirmCash} style={btnSt}>
                      Бэлнээр төлнө ✓
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={() => router.push('/order')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text2, #888)', fontFamily: F }}
          >
            ← Захиалга руу буцах
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes pop   { 0%{transform:scale(0.5);opacity:0} 80%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  )
}

const btnSt: React.CSSProperties = {
  width: '100%', padding: '13px', background: '#FF6B00', color: '#fff',
  border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
  cursor: 'pointer', fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
}
