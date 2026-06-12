'use client'
import { apiFetch } from '@/lib/api'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

const PARTNERS = [
  {
    key: 'vendor',
    icon: '🏭',
    title: 'Үйлдвэрлэгч',
    desc: 'Хэвлэлийн үйлдвэр, хэвлэлийн үйлчилгээ үзүүлэгч',
    perks: ['Захиалга шууд хүлээн авах', 'Тоног төхөөрөмжийн ачааллыг хянах', 'Хэтэвчинд орлого хүлээн авах'],
    color: '#f59e0b',
  },
  {
    key: 'designer',
    icon: '🎨',
    title: 'Дизайнер',
    desc: 'Мэргэжлийн график дизайнер',
    perks: ['Дизайны ажил хүлээн авах', 'Баталгаажсан дизайн бүрт орлого олох', 'Портфолио бүрдүүлэх'],
    color: '#8b5cf6',
  },
  {
    key: 'courier',
    icon: '🚚',
    title: 'Хүргэлтийн ажилтан',
    desc: 'Хүргэлтийн жолооч, шуудангийн үйлчилгээ',
    perks: ['Уян хатан цагийн хуваарь', 'Хүргэлт бүрт орлого', 'GPS маршрутын хяналт'],
    color: '#10b981',
  },
  {
    key: 'sales',
    icon: '💼',
    title: 'Борлуулагч',
    desc: 'Борлуулалтын төлөөлөгч, referral партнер',
    perks: ['Захиалга бүрт комисс авах', 'Referral QR код ашиглах', 'Орлогоо хянах'],
    color: '#3b82f6',
  },
]

const CONTRACT_TEXT = `ХАМТЫН АЖИЛЛАГААНЫ ГЭРЭЭ

Нэг тал: "БизПринт" ХХК (цаашид "Компани")
Нөгөө тал: Партнер (цаашид "Гүйцэтгэгч")

1. ЕРӨНХИЙ НӨХЦӨЛ
1.1. Гүйцэтгэгч нь Компанийн платформоор дамжуулан үйлчилгээ үзүүлэх эрхтэй.
1.2. Компани нь Гүйцэтгэгчийн ажлын чанарыг хянах, үнэлгээ өгөх эрхтэй.

2. ТӨЛБӨР ТООЦОО
2.1. Гүйцэтгэгч нь гүйцэтгэсэн ажил тус бүрт тохирсон хөлс авна.
2.2. Төлбөр нь платформ дахь хэтэвч рүү шилжинэ.
2.3. Хэтэвчний мөнгийг банк руу шилжүүлэх хүсэлт 1-3 ажлын өдөрт шийдвэрлэгдэнэ.

3. ҮҮРЭГ ХАРИУЦЛАГА
3.1. Гүйцэтгэгч нь ажлын чанар, хугацааг баримтлах үүрэгтэй.
3.2. Компани нь платформын хэвийн ажиллагааг хангах үүрэгтэй.
3.3. Хоёр тал хүндэтгэлтэй, мэргэжлийн түвшинд харилцана.

4. ГЭРЭЭНИЙ ХУГАЦАА
4.1. Гэрээ нь админ баталгаажуулснаар хүчин төгөлдөр болно.
4.2. Аль нэг тал 14 хоногийн өмнө мэдэгдэж гэрээг цуцлах боломжтой.

5. НУУЦЛАЛ
5.1. Хоёр тал нь хамтын ажиллагааны явцад олж мэдсэн мэдээллийг нууцлах үүрэгтэй.`

interface PartnerRegisterResponse {
  access_token?: string
  id?: string
}

const errorMessage = (error: unknown) =>
  error instanceof Error && error.message ? error.message : 'Серверт холбогдож чадсангүй. Дахин оролдоно уу.'

export default function PartnerPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', company: '', password: '', password_confirm: '', message: '' })
  const [agreedContract, setAgreedContract] = useState(false)
  const [showContract, setShowContract] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setError('')
    if (!selected) { setError('Партнерийн төрлөө сонгоно уу'); return }
    if (!form.full_name || !form.email || !form.phone) { setError('Нэр, имэйл, утас бөглөнө үү'); return }
    if (!form.password || form.password.length < 8) { setError('Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой'); return }
    if (form.password !== form.password_confirm) { setError('Нууц үг таарахгүй байна'); return }
    if (!agreedContract) { setError('Гэрээний нөхцөлийг зөвшөөрнө үү'); return }

    setSubmitting(true)
    try {
      await apiFetch<PartnerRegisterResponse>(`/auth/register`, {
        method: 'POST',
        headers: {},
        body: {
          email: form.email.trim(),
          password: form.password,
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          company_name: form.company.trim() || form.full_name.trim(),
          register_number: form.company.trim() || 'pending',
          professional_bio: form.message?.trim() || undefined,
          portfolio_url: form.message?.trim() || undefined,
          role: selected,
        },
      })
      setSubmitted(true)
    } catch (e: unknown) {
      setError(errorMessage(e))
    }
    setSubmitting(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A',
    borderRadius: 10, padding: '12px 14px', fontSize: 14,
    color: '#F1F5F9', outline: 'none', boxSizing: 'border-box', fontFamily: F,
  }

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#F1F5F9', margin: '0 0 12px' }}>Бүртгэл амжилттай!</h2>
        <p style={{ color: '#888', fontSize: 15, lineHeight: 1.7, margin: '0 0 12px' }}>
          Таны хүсэлтийг хүлээн авлаа. Бид гэрээг хянаж, 1-2 ажлын өдрийн дотор холбогдоно.
        </p>
        <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 10, padding: '14px 18px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: '#eab308', fontWeight: 600 }}>⏳ Гэрээ: Хүлээгдэж байна</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Админ баталгаажуулсны дараа таны бүртгэл идэвхжинэ</div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => router.push('/login')} style={{
            padding: '12px 28px', background: '#FF6B00', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: F,
          }}>Нэвтрэх</button>
          <button onClick={() => router.push('/')} style={{
            padding: '12px 28px', background: '#1A1A1A', color: '#888',
            border: '1px solid #2A2A2A', borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: F,
          }}>Нүүр хуудас</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', fontFamily: F, color: '#F1F5F9' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0A0A0A, #111)', borderBottom: '1px solid #1A1A1A', padding: '60px 24px 48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 8, padding: '6px 14px', marginBottom: 20 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF6B00' }}/>
          <span style={{ fontSize: 12, color: '#FF6B00', fontWeight: 500 }}>ХАМТРАН АЖИЛЛАХ</span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, margin: '0 0 16px', letterSpacing: '-1px' }}>
          <span style={{ color: '#FF6B00' }}>BizPrint</span> партнер болох
        </h1>
        <p style={{ fontSize: 16, color: '#666', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
          Үйлдвэрлэгч, дизайнер, хүргэлтийн ажилтан, борлуулагч нарын нэгдсэн сүлжээнд нэгдээрэй.
        </p>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {/* Partner type selection */}
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#F1F5F9', margin: '0 0 20px' }}>Партнерийн төрөл сонгох</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
          {PARTNERS.map(p => (
            <div key={p.key} onClick={() => setSelected(p.key)} style={{
              padding: 20, borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s',
              border: `2px solid ${selected === p.key ? p.color : '#1A1A1A'}`,
              background: selected === p.key ? p.color + '12' : '#0F0F0F',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{p.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: selected === p.key ? p.color : '#F1F5F9', marginBottom: 6 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 14, lineHeight: 1.5 }}>{p.desc}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {p.perks.map(perk => (
                  <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888' }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: p.color, flexShrink: 0 }}/>
                    {perk}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Application form */}
        <div style={{ background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: 16, padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#F1F5F9', margin: '0 0 24px' }}>Бүртгэлийн маягт</h2>

          {error && (
            <div style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#e24b4a', marginBottom: 20 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
            {[
              { key: 'full_name', label: 'Бүтэн нэр *', placeholder: 'Баатар Дорж', type: 'text' },
              { key: 'email', label: 'Имэйл *', placeholder: 'email@example.com', type: 'email' },
              { key: 'phone', label: 'Утасны дугаар *', placeholder: '9911 2233', type: 'tel' },
              { key: 'company', label: 'Компани / Байгууллага', placeholder: 'Таны байгууллага', type: 'text' },
            ].map(field => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 500 }}>{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={inp}
                />
              </div>
            ))}
          </div>

          {/* Password fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 500 }}>Нууц үг * (8+ тэмдэгт)</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" style={inp} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 500 }}>Нууц үг давтах *</label>
              <input type="password" value={form.password_confirm} onChange={e => setForm(f => ({ ...f, password_confirm: e.target.value }))} placeholder="••••••••" style={inp} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 500 }}>Нэмэлт мэдээлэл</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Өөрийн тухай товч танилцуулга..."
              rows={3}
              style={{ ...inp, resize: 'vertical' }}
            />
          </div>

          {/* Contract section */}
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>📋 Хамтын ажиллагааны гэрээ</h3>
              <button onClick={() => setShowContract(!showContract)} style={{
                background: 'none', border: '1px solid #2A2A2A', borderRadius: 6, padding: '4px 12px',
                color: '#888', fontSize: 12, cursor: 'pointer', fontFamily: F,
              }}>
                {showContract ? 'Хураах' : 'Гэрээ унших'}
              </button>
            </div>

            {showContract && (
              <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 8, padding: 16, marginBottom: 14, maxHeight: 300, overflowY: 'auto' }}>
                <pre style={{ fontSize: 12, color: '#aaa', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0, fontFamily: F }}>{CONTRACT_TEXT}</pre>
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={agreedContract} onChange={e => setAgreedContract(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, accentColor: '#FF6B00' }} />
              <span style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>
                Би <strong style={{ color: '#F1F5F9' }}>хамтын ажиллагааны гэрээ</strong>-ний нөхцөлийг уншиж танилцан, зөвшөөрч байна.
                Миний бүртгэл админ баталгаажуулсны дараа идэвхжинэ.
              </span>
            </label>
          </div>

          <button onClick={submit} disabled={submitting} style={{
            width: '100%', padding: '14px', background: submitting ? '#7a3300' : '#FF6B00',
            color: submitting ? '#aaa' : '#fff', border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: F, transition: 'background 0.2s',
          }}>
            {submitting ? 'Бүртгэж байна...' : 'Бүртгэл илгээх'}
          </button>

          <p style={{ marginTop: 16, fontSize: 13, color: '#444', textAlign: 'center' }}>
            Бүртгэлтэй юу? <Link href="/login" style={{ color: '#FF6B00', textDecoration: 'none', fontWeight: 500 }}>Нэвтрэх</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
