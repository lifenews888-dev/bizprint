'use client'
import React, { useRouter } from 'next/navigation'
import React, { useState } from 'react'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const API = 'http://localhost:4000'

const BENEFITS = [
  {
    icon: '💰',
    title: 'Тоо хэмжээний хөнгөлөлт',
    desc: '500ш+ захиалгад 10%, 1000ш+ захиалгад 20%, 5000ш+ захиалгад 30% хүртэл хямдрал авна.',
    color: '#FF6B00',
  },
  {
    icon: '🏦',
    title: 'Нэхэмжлэхийн төлбөр',
    desc: 'Бэлэн эсвэл QR-ийн оронд нэхэмжлэх гарган 30 хоногийн хугацаанд төлбөр хийх боломжтой.',
    color: '#3B82F6',
  },
  {
    icon: '👤',
    title: 'Хувийн менежер',
    desc: 'Танд тусгайлан томилогдсон аккаунт менежер бүх захиалгын дэмжлэгийг хангана.',
    color: '#8B5CF6',
  },
  {
    icon: '⚡',
    title: 'Хурдан хүргэлт',
    desc: 'Байнгын захиалагчдад хэвлэлийн эрэмбэлэлт — шаардлагатай үед онцгой давуу эрхтэй.',
    color: '#10B981',
  },
  {
    icon: '📊',
    title: 'Дэлгэрэнгүй тайлан',
    desc: 'Захиалга бүрийн зардал, хэвлэлийн хэмжээ, хугацааны нарийн тайлан, нийт зарлага авна.',
    color: '#F59E0B',
  },
  {
    icon: '🎨',
    title: 'Загварын сан',
    desc: 'Компанийн лого, брэнд гайдлайн хадгалаад хурдан дахин захиалах — шинэ файл илгээх шаардлагагүй.',
    color: '#EC4899',
  },
]

const STEPS = [
  { n: '01', title: 'Хүсэлт илгээх', desc: 'Доорх маягтыг бөглөн бизнесийн мэдээлэл оруулна уу', color: '#FF6B00' },
  { n: '02', title: 'Хянан үзнэ', desc: 'Манай sales баг 1 ажлын өдрийн дотор холбоо барина', color: '#3B82F6' },
  { n: '03', title: 'Гэрээ байгуулна', desc: 'Нэр хүнд, тоо хэмжээ, нөхцөлийг тохироно', color: '#8B5CF6' },
  { n: '04', title: 'Захиалга эхлэнэ', desc: 'B2B аккаунтаар нэвтэрч хямдруулсан үнээр захиална', color: '#10B981' },
]

const PRICING = [
  {
    name: 'Стартер',
    range: '500 – 2,000ш/сар',
    discount: '10%',
    features: ['Хувийн менежер', 'Сарын нэхэмжлэх', 'Стандарт хүргэлт', 'Email дэмжлэг'],
    color: '#FF6B00',
  },
  {
    name: 'Бизнес',
    range: '2,001 – 10,000ш/сар',
    discount: '20%',
    features: ['Хувийн менежер', '30 хоногийн хугацаатай', 'Тэргүүлэх хүргэлт', 'Утас + Email дэмжлэг', 'Загварын сан'],
    color: '#3B82F6',
    popular: true,
  },
  {
    name: 'Энтерпрайз',
    range: '10,000ш+ / сар',
    discount: '30%+',
    features: ['Хувийн менежер (24/7)', '45 хоногийн хугацаатай', 'Нэн яаралтай хүргэлт', 'Тусгай нөхцөл', 'API интеграци', 'Тайлан дашбоард'],
    color: '#8B5CF6',
  },
]

export default function B2BPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    monthly_qty: '',
    product_type: '',
    message: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!form.company || !form.name || !form.email || !form.phone) {
      setError('Компани, нэр, имэйл, утас заавал шаардлагатай')
      return
    }
    setSending(true)
    setError('')
    try {
      await fetch(`${API}/design-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: `[B2B] ${form.company} - ${form.name}`,
          customer_email: form.email,
          customer_phone: form.phone,
          product_name: 'B2B Хамтын ажиллагааны хүсэлт',
          description: `Компани: ${form.company}\nНэр: ${form.name}\nСарын тоо хэмжээ: ${form.monthly_qty || '—'}\nБүтээгдэхүүн: ${form.product_type || '—'}\n\n${form.message}`,
          type: 'b2b',
        }),
      })
      setSent(true)
    } catch {
      setError('Илгээхэд алдаа гарлаа. Дахин оролдоно уу.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ fontFamily: F, color: 'var(--text)', background: 'var(--bg)' }}>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #111 50%, #0a0a1a 100%)', padding: '80px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', right: '10%', width: 400, height: 400, background: 'rgba(59,130,246,0.08)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: 300, height: 300, background: 'rgba(255,107,0,0.06)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8, padding: '5px 14px', marginBottom: 24 }}>
            <span style={{ fontSize: 11, color: '#3B82F6', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Бизнес шийдэл</span>
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 800, color: '#F1F5F9', lineHeight: 1.1, margin: '0 0 20px', letterSpacing: '-2px' }}>
            Бизнест зориулсан<br/>
            <span style={{ color: '#3B82F6' }}>хэвлэлийн шийдэл</span>
          </h1>
          <p style={{ fontSize: 18, color: '#888', lineHeight: 1.7, maxWidth: 600, margin: '0 auto 36px' }}>
            Том тоо хэмжээний захиалга, нэхэмжлэхийн төлбөр, хувийн менежер — таны бизнесийн хэвлэлийн хэрэгцээг иж бүрнээр шийдэнэ.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#contact" style={{ padding: '14px 32px', background: '#3B82F6', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 15, fontWeight: 600 }}>
              Хамтран ажиллах →
            </a>
            <a href="/quote" style={{ padding: '14px 32px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#3B82F6', borderRadius: 10, textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>
              Үнэ тооцоолох
            </a>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 60, flexWrap: 'wrap' }}>
            {[
              { v: '30%', l: 'Хүртэл хямдрал' },
              { v: '48h', l: 'Хурдан хүргэлт' },
              { v: '24/7', l: 'Дэмжлэг' },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#3B82F6' }}>{s.v}</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.5px' }}>B2B давуу тал</h2>
          <p style={{ fontSize: 15, color: 'var(--text2)', maxWidth: 500, margin: '0 auto' }}>Байнгын бизнес түншүүдэд зориулсан онцгой нөхцөл</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {BENEFITS.map(b => (
            <div key={b.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = b.color + '40')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>{b.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px', color: 'var(--text)' }}>{b.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0, lineHeight: 1.7 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing tiers */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.5px' }}>B2B үнийн багц</h2>
            <p style={{ fontSize: 15, color: 'var(--text2)' }}>Тоо хэмжээнээс хамааран хямдрал автоматаар тооцогдоно</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="grid-3">
            {PRICING.map(p => (
              <div key={p.name} style={{ background: 'var(--bg)', border: p.popular ? `2px solid ${p.color}` : '1px solid var(--border)', borderRadius: 20, padding: 28, position: 'relative' }}>
                {p.popular && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: p.color, color: '#fff', borderRadius: 99, padding: '3px 14px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Хамгийн их сонголт
                  </div>
                )}
                <div style={{ fontSize: 12, color: p.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{p.name}</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: p.color, marginBottom: 4 }}>{p.discount}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>{p.range}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)' }}>
                      <span style={{ color: p.color, fontSize: 14, fontWeight: 700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href="#contact" style={{ display: 'block', textAlign: 'center', padding: '11px 0', background: p.popular ? p.color : 'transparent', color: p.popular ? '#fff' : p.color, border: `1px solid ${p.color}`, borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600, transition: 'all 0.15s' }}>
                  Хүсэлт илгээх →
                </a>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)', marginTop: 24 }}>
            * Энтерпрайз багцын тусгай нөхцөлийг sales баг тохиролцоно
          </p>
        </div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 48px', textAlign: 'center', letterSpacing: '-0.5px' }}>Хэрхэн ажилладаг вэ?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }} className="grid-4">
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ textAlign: 'center', position: 'relative' }}>
              {i < STEPS.length - 1 && (
                <div style={{ position: 'absolute', top: 20, left: '60%', width: '80%', height: 1, background: 'var(--border)', zIndex: 0 }} className="hide-mobile" />
              )}
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: s.color + '18', border: `2px solid ${s.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.n}</span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact form */}
      <section id="contact" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.04) 0%, rgba(255,107,0,0.04) 100%)', borderTop: '1px solid var(--border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.5px' }}>Хамтран ажиллах хүсэлт</h2>
            <p style={{ fontSize: 15, color: 'var(--text2)' }}>Маягтыг бөглөсний дараа манай sales баг 1 ажлын өдрийн дотор холбоо барина</p>
          </div>

          {sent ? (
            <div style={{ textAlign: 'center', padding: '48px 32px', background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#10B981', margin: '0 0 8px' }}>Хүсэлт амжилттай илгээгдлээ!</h3>
              <p style={{ fontSize: 14, color: 'var(--text2)', margin: '0 0 24px' }}>Манай sales баг тантай 1 ажлын өдрийн дотор холбоо барина.</p>
              <button onClick={() => router.push('/')} style={{ background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: F }}>
                Нүүр хуудас руу буцах
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: 32 }}>
              {error && (
                <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#dc2626', marginBottom: 20 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={lb}>Компанийн нэр *</label>
                    <input style={inp} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="BizPrint LLC" />
                  </div>
                  <div>
                    <label style={lb}>Холбоо барих хүний нэр *</label>
                    <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Нэр Овог" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={lb}>Имэйл хаяг *</label>
                    <input style={inp} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="name@company.mn" />
                  </div>
                  <div>
                    <label style={lb}>Утасны дугаар *</label>
                    <input style={inp} type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="9911 2233" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={lb}>Сарын хэвлэлийн тоо хэмжээ</label>
                    <select style={inp} value={form.monthly_qty} onChange={e => setForm(f => ({ ...f, monthly_qty: e.target.value }))}>
                      <option value="">Сонгоно уу...</option>
                      <option value="500-2000">500 – 2,000 ш</option>
                      <option value="2001-10000">2,001 – 10,000 ш</option>
                      <option value="10000+">10,000ш+</option>
                    </select>
                  </div>
                  <div>
                    <label style={lb}>Бүтээгдэхүүний төрөл</label>
                    <select style={inp} value={form.product_type} onChange={e => setForm(f => ({ ...f, product_type: e.target.value }))}>
                      <option value="">Сонгоно уу...</option>
                      <option value="Нэрийн хуудас">Нэрийн хуудас</option>
                      <option value="Флаер / Брошур">Флаер / Брошур</option>
                      <option value="Наклейк / Стикер">Наклейк / Стикер</option>
                      <option value="Ном / Каталог">Ном / Каталог</option>
                      <option value="Хайрцаг / Боодол">Хайрцаг / Боодол</option>
                      <option value="Бусад">Бусад</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={lb}>Нэмэлт мэдээлэл</label>
                  <textarea style={{ ...inp, height: 100, resize: 'vertical' }} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Хэвлэлийн онцлог шаардлага, тусгай нөхцөл эсвэл асуулт..." />
                </div>

                <button onClick={handleSubmit} disabled={sending} style={{ width: '100%', padding: '14px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1, fontFamily: F }}>
                  {sending ? 'Илгээж байна...' : 'Хамтран ажиллах хүсэлт илгээх →'}
                </button>

                <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', margin: 0 }}>
                  Эсвэл шууд холбоо барина уу: <a href="mailto:sales@bizprint.mn" style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 500 }}>sales@bizprint.mn</a> · <a href="tel:+97677000000" style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 500 }}>+976 7700-0000</a>
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', margin: '0 0 40px', letterSpacing: '-0.5px' }}>Түгээмэл асуулт</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { q: 'Хэдэн ширхэгээс B2B нөхцөл авах боломжтой вэ?', a: 'Сарын 500ш+ захиалгатай бизнест B2B нөхцөл олгодог. Жижиг тоо хэмжээтэй захиалга болон хувь хүнд энгийн захиалгын горим хамаарна.' },
            { q: 'Нэхэмжлэхийн төлбөрийг хэрхэн хийх вэ?', a: 'Бизнес аккаунтаар нэвтэрч захиалга хийснийхээ дараа нэхэмжлэх автоматаар үүснэ. Заасан хугацаанд (30 эсвэл 45 хоног) банкаар шилжүүлэх боломжтой.' },
            { q: 'Хэдэн хоногт хэвлэж өгдөг вэ?', a: 'Стандарт B2B захиалга 3–5 ажлын өдрийн дотор, яаралтай захиалга 24–48 цагийн дотор бэлтгэгдэнэ. Хэмжээ болон нарийн төвөгтэй байдлаас хамаарч өөрчлөгдөж болно.' },
            { q: 'Лого болон брэнд материалаа хэрхэн хадгалах вэ?', a: 'Бизнес аккаунтад загварын сан бий. Нэг удаа лого, брэнд өнгө, шрифт оруулсны дараа бүх захиалгад автоматаар хэрэглэгдэнэ.' },
            { q: 'API интеграци боломжтой юу?', a: 'Энтерпрайз багцад REST API хандалт олгогдоно. Та өөрийн систем, ERP-тэй холбон захиалгыг автоматаар дамжуулах боломжтой.' },
          ].map((item, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 8 }}>{item.q}</div>
              <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>{item.a}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

const lb: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid var(--border)',
  borderRadius: 10, background: 'var(--surface)', color: 'var(--text)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: F,
}
