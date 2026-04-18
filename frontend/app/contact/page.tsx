'use client'
import { useState } from 'react'

const API = 'http://localhost:4000'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const valid = form.name.trim() && form.email.trim() && form.message.trim()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`${API}/mail/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSent(true)
      } else {
        setError('Мессеж илгээхэд алдаа гарлаа. Дахин оролдоно уу.')
      }
    } catch {
      setError('Сервертэй холбогдоход алдаа гарлаа. info@bizprint.mn хаягаар холбогдоно уу.')
    }
    setSubmitting(false)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px', fontFamily: F }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 12px', color: 'var(--text)', letterSpacing: '-0.5px' }}>
          Холбоо барих
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text2)', maxWidth: 500, margin: '0 auto' }}>
          Асуулт байвал бидэнтэй холбогдоорой. Ажлын өдрүүдэд 24 цагийн дотор хариулна.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 40, alignItems: 'start' }}>
        {/* Contact info */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 24px', color: 'var(--text)' }}>Бидний мэдээлэл</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '📞', label: 'Утас', value: '+976 7711-7700', href: 'tel:+97677117700' },
              { icon: '✉️', label: 'И-мэйл', value: 'info@bizprint.mn', href: 'mailto:info@bizprint.mn' },
              { icon: '📍', label: 'Хаяг', value: 'Улаанбаатар, Монгол', href: null },
              { icon: '🕐', label: 'Ажлын цаг', value: 'Даваа–Баасан, 09:00–18:00', href: null },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 16, padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
                <div style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</div>
                  {item.href ? (
                    <a href={item.href} style={{ fontSize: 15, fontWeight: 500, color: '#FF6B00', textDecoration: 'none' }}>{item.value}</a>
                  ) : (
                    <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{item.value}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact form */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '32px 28px' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px', color: 'var(--text)' }}>Мессеж илгээгдлээ!</h3>
              <p style={{ color: 'var(--text2)', fontSize: 15 }}>Удахгүй танд хариу илгээнэ.</p>
              <button onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', message: '' }) }}
                style={{ marginTop: 20, padding: '10px 24px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                Дахин илгээх
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 24px', color: 'var(--text)' }}>Мессеж илгээх</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
                      Нэр <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input value={form.name} onChange={update('name')} placeholder="Таны нэр"
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--surface2)', color: 'var(--text)', fontFamily: F, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
                      Утас
                    </label>
                    <input value={form.phone} onChange={update('phone')} placeholder="+976 XXXX-XXXX"
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--surface2)', color: 'var(--text)', fontFamily: F, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
                    И-мэйл хаяг <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input value={form.email} onChange={update('email')} placeholder="you@example.com" type="email"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--surface2)', color: 'var(--text)', fontFamily: F, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
                    Мессеж <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <textarea value={form.message} onChange={update('message')} placeholder="Таны асуулт, санал..." rows={5}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--surface2)', color: 'var(--text)', fontFamily: F, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                {error && <div style={{ padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, color: '#DC2626' }}>{error}</div>}
                <button type="submit" disabled={!valid || submitting}
                  style={{ padding: '13px', background: valid && !submitting ? '#FF6B00' : 'var(--surface2)', color: valid && !submitting ? '#fff' : 'var(--text3)', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: valid && !submitting ? 'pointer' : 'not-allowed', fontFamily: F }}>
                  {submitting ? 'Илгээж байна...' : 'Илгээх →'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
