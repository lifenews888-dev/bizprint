'use client'
import { useState } from 'react'
import Link from 'next/link'
import { API_URL } from '@/lib/api'

const BENEFITS = [
  { icon: '💰', title: 'Тусгай үнэ', desc: 'Байнгын харилцагчдад 5-25% хямдрал' },
  { icon: '📋', title: 'Нэгдсэн тооцоо', desc: 'Сар бүр нэгдсэн нэхэмжлэх' },
  { icon: '⚡', title: 'Тэргүүлэх захиалга', desc: 'Захиалга хурдан боловсруулагдана' },
  { icon: '🤝', title: 'Тусгай менежер', desc: 'Хувийн account менежер хуваарилагдана' },
  { icon: '💳', title: 'Зээлийн нөхцөл', desc: '30-60 хоног хүртэл зээлийн нөхцөл' },
  { icon: '📊', title: 'Захиалгын тайлан', desc: 'Сарын захиалгын дэлгэрэнгүй тайлан' },
]

const INDUSTRIES = [
  'Хэвлэл мэдээлэл', 'Ресторан, хоол', 'Жижиглэнгийн дэлгүүр',
  'Үйлдвэрлэл', 'Барилга', 'Зочид буудал', 'Эрүүл мэнд',
  'Боловсрол', 'Санхүү, банк', 'Технологи', 'Бусад',
]

export default function B2BPage() {
  const [step, setStep] = useState<'info' | 'form' | 'success'>('info')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '', registrationNo: '', phone: '', email: '', address: '',
    industry: '', contactName: '', contactPosition: '',
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch(`${API_URL}/api/b2b/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setStep('success')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'success') return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '64px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Өргөдөл хүлээн авлаа!</h2>
      <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 8 }}>Бид 1-2 ажлын өдрийн дотор тантай холбогдоно.</p>
      <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 32 }}>{form.email} рүү баталгаажуулах имэйл илгээлээ.</p>
      <Link href="/" style={{ display: 'inline-block', padding: '12px 32px', background: '#FF6B00', color: '#fff', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Нүүр хуудас</Link>
    </div>
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px' }}>
      {step === 'info' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)', color: '#FF6B00', fontSize: 12, fontWeight: 600, borderRadius: 20, marginBottom: 16 }}>B2B харилцагч</span>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Байгууллагын харилцагч болох</h1>
            <p style={{ fontSize: 14, color: 'var(--text3)', maxWidth: 520, margin: '0 auto' }}>Тогтмол хэвлэлийн захиалгатай байгууллагуудад тусгай нөхцөл, хямдрал, зээлийн нөхцөл санал болгодог.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14, marginBottom: 36 }}>
            {BENEFITS.map(b => (
              <div key={b.title} style={{ padding: 20, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{b.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{b.title}</h3>
                <p style={{ fontSize: 12, color: 'var(--text3)' }}>{b.desc}</p>
              </div>
            ))}
          </div>

          {/* Discount tiers */}
          <div style={{ padding: 24, borderRadius: 16, background: 'rgba(255,107,0,0.04)', border: '1px solid rgba(255,107,0,0.15)', marginBottom: 36 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', textAlign: 'center', marginBottom: 16 }}>Хямдралын нөхцөл</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Жижиг', spend: '500K₮/сар', disc: '5%' },
                { label: 'Дунд', spend: '1M₮/сар', disc: '10%' },
                { label: 'Том', spend: '3M₮/сар', disc: '15%' },
                { label: 'Корпорэйт', spend: '5M₮+/сар', disc: '25%' },
              ].map(t => (
                <div key={t.label} style={{ textAlign: 'center', padding: 16, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#FF6B00' }}>{t.disc}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t.spend}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button onClick={() => setStep('form')} style={{ padding: '14px 40px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Өргөдөл гаргах →</button>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>Хариуг 1-2 өдрийн дотор өгнө</p>
          </div>
        </>
      )}

      {step === 'form' && (
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <button onClick={() => setStep('info')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13, marginBottom: 20 }}>← Буцах</button>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 24 }}>B2B өргөдлийн маягт</h2>

          <form onSubmit={submit}>
            <div style={{ padding: 20, borderRadius: 16, border: '1px solid var(--border)', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Байгууллагын мэдээлэл</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Нэр *</label>
                  <input required value={form.name} onChange={e => set('name', e.target.value)} style={inputSt} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>ААН регистр</label>
                  <input value={form.registrationNo} onChange={e => set('registrationNo', e.target.value)} placeholder="1234567" style={inputSt} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Салбар</label>
                  <select value={form.industry} onChange={e => set('industry', e.target.value)} style={inputSt}>
                    <option value="">Сонгоно уу</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Хаяг</label>
                  <input value={form.address} onChange={e => set('address', e.target.value)} style={inputSt} />
                </div>
              </div>
            </div>

            <div style={{ padding: 20, borderRadius: 16, border: '1px solid var(--border)', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Холбоо барих</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Нэр *</label>
                  <input required value={form.contactName} onChange={e => set('contactName', e.target.value)} style={inputSt} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Албан тушаал</label>
                  <input value={form.contactPosition} onChange={e => set('contactPosition', e.target.value)} style={inputSt} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Утас *</label>
                  <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9900 0000" style={inputSt} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>И-мэйл *</label>
                  <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="name@company.mn" style={inputSt} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={submitting} style={{ width: '100%', padding: '14px 0', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.5 : 1 }}>
              {submitting ? 'Илгээж байна...' : 'Өргөдөл илгээх →'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

const inputSt: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }
