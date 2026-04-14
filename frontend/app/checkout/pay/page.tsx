'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { API_URL } from '@/lib/api'
import { fbPixel } from '@/components/FacebookPixel'

function CheckoutPayContent() {
  const params = useSearchParams()
  const router = useRouter()
  const orderId = params.get('orderId') || params.get('order') || ''
  const amount = parseInt(params.get('amount') || '0')
  const description = decodeURIComponent(params.get('desc') || 'BizPrint захиалга')

  const [loading, setLoading] = useState(false)
  const [invoice, setInvoice] = useState<{ invoiceId: string; followUpLink: string } | null>(null)
  const [error, setError] = useState('')
  const [paid, setPaid] = useState(false)
  const [checking, setChecking] = useState(false)

  const createInvoice = async () => {
    if (!orderId || !amount) { setError('Захиалгын мэдээлэл дутуу байна'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_URL}/api/payment/bonum/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount, description }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else {
        setInvoice(data)
        fbPixel.initiateCheckout({ value: amount, productName: description })
      }
    } catch { setError('Сервертэй холбогдож чадсангүй') }
    finally { setLoading(false) }
  }

  const checkPayment = async () => {
    if (!invoice?.invoiceId) return
    setChecking(true)
    try {
      const res = await fetch(`${API_URL}/api/payment/bonum/status/${invoice.invoiceId}`)
      const data = await res.json()
      if (data.paid) {
        setPaid(true)
        fbPixel.purchase({ orderId, value: amount, productName: description })
      } else {
        alert('Төлбөр бүртгэгдсэнгүй. QPay эсвэл банкны апп-аар төлсөн эсэхийг шалгана уу.')
      }
    } catch { alert('Шалгахад алдаа гарлаа') }
    finally { setChecking(false) }
  }

  useEffect(() => { if (orderId && amount > 0) createInvoice() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (paid) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 40 }}>✅</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Төлбөр амжилттай!</h1>
        <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 24 }}>Захиалга #{orderId.slice(0, 8).toUpperCase()} баталгаажлаа</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => router.push('/track?order=' + orderId)}
            style={{ padding: '10px 20px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Захиалга хянах
          </button>
          <button onClick={() => router.push('/')}
            style={{ padding: '10px 20px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)', borderRadius: 12, fontSize: 13, cursor: 'pointer' }}>
            Нүүр хуудас
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ maxWidth: 420, width: '100%', background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', textAlign: 'center', marginBottom: 4 }}>Төлбөр төлөх</h1>
        <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>{description}</p>

        <div style={{ background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 16, padding: 20, textAlign: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Нийт дүн</p>
          <p style={{ fontSize: 36, fontWeight: 800, color: '#FF6B00' }}>{amount.toLocaleString()}₮</p>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Захиалга #{orderId.slice(0, 8).toUpperCase()}</p>
        </div>

        {error && (
          <div style={{ padding: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
            {error}
            <button onClick={createInvoice} style={{ display: 'block', margin: '8px auto 0', background: 'none', border: 'none', color: '#EF4444', fontSize: 11, textDecoration: 'underline', cursor: 'pointer' }}>Дахин оролдох</button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: '#FF6B00', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>Төлбөрийн холбоос үүсгэж байна...</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {invoice && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <a href={invoice.followUpLink} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '16px 0', background: '#FF6B00', color: '#fff', fontWeight: 700, borderRadius: 12, fontSize: 16, textDecoration: 'none' }}>
              Төлбөр төлөх →
            </a>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 0' }}>
              {['QPay', 'Visa', 'Mastercard', 'SonoShop'].map(m => (
                <span key={m} style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--surface2)', padding: '4px 8px', borderRadius: 6, fontWeight: 500 }}>{m}</span>
              ))}
            </div>

            <button onClick={checkPayment} disabled={checking}
              style={{ width: '100%', padding: '12px 0', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)', borderRadius: 12, fontSize: 13, cursor: 'pointer', opacity: checking ? 0.5 : 1 }}>
              {checking ? 'Шалгаж байна...' : '✓ Төлбөр шалгах'}
            </button>

            <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>
              Төлбөр хийсний дараа "Төлбөр шалгах" дарна уу
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CheckoutPayPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}>
      <CheckoutPayContent />
    </Suspense>
  )
}
