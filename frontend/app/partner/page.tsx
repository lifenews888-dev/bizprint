'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://bizprint-production.up.railway.app'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

const PARTNERS = [
  {
    key: 'vendor',
    icon: '🏭',
    title: 'Вендор / Үйлдвэр',
    desc: 'Хэвлэлийн үйлдвэр эсвэл үйлчилгээ үзүүлэгч',
    perks: ['Захиалга шууд хүлээн авах', 'Машиний ачааллыг хянах', 'Дансанд шилжүүлэх'],
    color: '#f59e0b',
  },
  {
    key: 'designer',
    icon: '🎨',
    title: 'Дизайнер',
    desc: 'Мэргэжлийн график дизайнер',
    perks: ['Дизайн ажил авах', 'Баталгаажсан дизайнаас орлого олох', 'Портфолио бүтээх'],
    color: '#8b5cf6',
  },
  {
    key: 'courier',
    icon: '🚚',
    title: 'Хүргэлт / Курьер',
    desc: 'Хүргэлтийн жолооч эсвэл курьер үйлчилгээ',
    perks: ['Уян хатан цагийн хуваарь', 'Хүргэлт бүрт орлого', 'Бодит цагийн замын хянах'],
    color: '#10b981',
  },
  {
    key: 'sales',
    icon: '💼',
    title: 'Борлуулалт / Referral',
    desc: 'Борлуулалтын агент эсвэл хамтрагч',
    perks: ['Захиалга бүрт шимтгэл авах', 'QR код ашиглах', 'Орлогоо хянах'],
    color: '#3b82f6',
  },
  {
    key: 'creator',
    icon: '🎨',
    title: 'Бүтээгч / Creator',
    desc: 'Контент бүтээгч, дизайн худалдагч',
    perks: ['Өөрийн дизайн зарах', 'Борлолт бүрт орлого авах', 'Брэнд бүтээх'],
    color: '#a78bfa',
  },
]

export default function PartnerPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', company: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!selected)              { setError('Түншийн төрлийг сонгоно уу'); return }
    if (!form.full_name || !form.email || !form.phone) { setError('Шаардлагатай талбаруудыг бөглөнө үү'); return }
    setSubmitting(true); setError('')
    try {
      await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:        form.email,
          password:     Math.random().toString(36).slice(-8),
          full_name:    form.full_name,
          phone:        form.phone,
          company_name: form.company,
          role:         selected,
        }),
      })
      setSubmitted(true)
    } catch {
      setError('Илгээхэд алдаа гарлаа. Дахин оролдоно уу.')
    }
    setSubmitting(false)
  }

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>✅</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#F1F5F9', margin: '0 0 12px' }}>Хүсэлт илгээгдлээ!</h2>
        <p style={{ color: '#888', fontSize: 15, lineHeight: 1.7, margin: '0 0 32px' }}>
          Таны хүсэлтийг хянаж, 1-2 ажлын өдөрт холбогдох болно.
        </p>
        <button onClick={() => router.push('/')} style={{
          padding: '12px 28px', background: '#FF6B00', color: '#fff',
          border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: F,
        }}>
          Нүүр хуудас руу →
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', fontFamily: F, color: '#F1F5F9' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0A0A0A, #111)', borderBottom: '1px solid #1A1A1A', padding: '60px 24px 48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 8, padding: '6px 14px', marginBottom: 20 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF6B00' }}/>
          <span style={{ fontSize: 12, color: '#FF6B00', fontWeight: 500 }}>ПЛАТФОРМД НЭГДЭХ</span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, margin: '0 0 16px', letterSpacing: '-1px' }}>
          <span style={{ color: '#FF6B00' }}>BizPrint</span> Түнш болох
        </h1>
        <p style={{ fontSize: 16, color: '#666', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          Вендор, дизайнер, курьер болон борлуулалтын агентуудын сүлжээнд нэгдэж орно уу.
        </p>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {/* Partner type selection */}
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#F1F5F9', margin: '0 0 20px' }}>Түнший төрлийг сонгох</h2>
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
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#F1F5F9', margin: '0 0 24px' }}>Өргөдлийн маягт</h2>

          {error && (
            <div style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#e24b4a', marginBottom: 20 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
            {[
              { key: 'full_name', label: 'Бүтэн нэр *',      placeholder: 'Нэр Овог',          type: 'text'  },
              { key: 'email',    label: 'И-мэйл *',           placeholder: 'email@example.mn',  type: 'email' },
              { key: 'phone',    label: 'Утасны дугаар *',    placeholder: '+976 9900 0000',    type: 'tel'   },
              { key: 'company',  label: 'Байгууллагын нэр',   placeholder: 'Компани (заавал биш)', type: 'text' },
            ].map(field => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 500 }}>{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={{
                    width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A',
                    borderRadius: 10, padding: '12px 14px', fontSize: 14,
                    color: '#F1F5F9', outline: 'none', boxSizing: 'border-box', fontFamily: F,
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 500 }}>Нэмэлт мэдээлэл (заавал биш)</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Өөрийнхөө тухай товч бичнэ үү..."
              rows={3}
              style={{
                width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A',
                borderRadius: 10, padding: '12px 14px', fontSize: 14,
                color: '#F1F5F9', outline: 'none', boxSizing: 'border-box',
                fontFamily: F, resize: 'vertical',
              }}
            />
          </div>

          <button onClick={submit} disabled={submitting} style={{
            width: '100%', padding: '14px', background: submitting ? '#333' : '#FF6B00',
            color: submitting ? '#aaa' : '#fff', border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: F, transition: 'background 0.2s',
          }}>
            {submitting ? 'Илгээж байна...' : 'Өргөдөл илгээх →'}
          </button>

          <p style={{ marginTop: 16, fontSize: 12, color: '#333', textAlign: 'center' }}>
            Бүртгэлтэй юу? <a href="/login" style={{ color: '#FF6B00', textDecoration: 'none' }}>Нэвтрэх</a>
          </p>
        </div>
      </div>
    </div>
  )
}
