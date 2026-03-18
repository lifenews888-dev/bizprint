'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const API = 'http://localhost:4000'
const F = "'Segoe UI',system-ui,sans-serif"

const PARTNERS = [
  {
    key: 'vendor',
    icon: '<',
    title: 'Factory / Vendor',
    desc: 'Print factory or service provider',
    perks: ['Receive orders directly', 'Track machine workload', 'Get paid to your wallet'],
    color: '#f59e0b',
  },
  {
    key: 'designer',
    icon: '<',
    title: 'Designer',
    desc: 'Professional graphic designer',
    perks: ['Get design jobs', 'Earn per approved design', 'Build your portfolio'],
    color: '#8b5cf6',
  },
  {
    key: 'courier',
    icon: '=',
    title: 'Delivery / Courier',
    desc: 'Delivery driver or courier service',
    perks: ['Flexible schedule', 'Earn per delivery', 'Real-time route tracking'],
    color: '#10b981',
  },
  {
    key: 'sales',
    icon: '=',
    title: 'Sales / Referral',
    desc: 'Sales agent or referral partner',
    perks: ['Earn commission per order', 'Use referral QR code', 'Track your earnings'],
    color: '#3b82f6',
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
    if (!selected) { setError('Please select a partner type'); return }
    if (!form.full_name || !form.email || !form.phone) { setError('Please fill in required fields'); return }
    setSubmitting(true); setError('')
    try {
      await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: Math.random().toString(36).slice(-8),
          full_name: form.full_name,
          phone: form.phone,
          company_name: form.company,
          role: selected,
        }),
      })
      setSubmitted(true)
    } catch {
      setError('Failed to submit. Please try again.')
    }
    setSubmitting(false)
  }

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}></div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#F1F5F9', margin: '0 0 12px' }}>Application Submitted!</h2>
        <p style={{ color: '#888', fontSize: 15, lineHeight: 1.7, margin: '0 0 32px' }}>
          We will review your application and contact you within 1-2 business days.
        </p>
        <button onClick={() => router.push('/')} style={{
          padding: '12px 28px', background: 'var(--orange)', color: '#fff',
          border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: F,
        }}>
          Back to Home
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', fontFamily: F, color: '#F1F5F9' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0A0A0A, #111)', borderBottom: '1px solid #1A1A1A', padding: '60px 24px 48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--orange-10)', border: '1px solid var(--orange-20)', borderRadius: 8, padding: '6px 14px', marginBottom: 20 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--orange)' }}/>
          <span style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 500 }}>JOIN THE PLATFORM</span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, margin: '0 0 16px', letterSpacing: '-1px' }}>
          Become a <span style={{ color: 'var(--orange)' }}>BizPrint Partner</span>
        </h1>
        <p style={{ fontSize: 16, color: '#666', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          Join our growing network of vendors, designers, couriers and sales agents.
        </p>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {/* Partner type selection */}
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#F1F5F9', margin: '0 0 20px' }}>Select Partner Type</h2>
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
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#F1F5F9', margin: '0 0 24px' }}>Application Form</h2>

          {error && (
            <div style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#e24b4a', marginBottom: 20 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
            {[
              { key: 'full_name', label: 'Full Name *', placeholder: 'John Doe', type: 'text' },
              { key: 'email', label: 'Email *', placeholder: 'email@example.com', type: 'email' },
              { key: 'phone', label: 'Phone *', placeholder: '+976 9900 0000', type: 'tel' },
              { key: 'company', label: 'Company Name', placeholder: 'Your company', type: 'text' },
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
            <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 500 }}>Message (optional)</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Tell us about yourself..."
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
            width: '100%', padding: '14px', background: submitting ? '#7a3300' : 'var(--orange)',
            color: submitting ? '#aaa' : '#fff', border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: F, transition: 'background 0.2s',
          }}>
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>

          <p style={{ marginTop: 16, fontSize: 12, color: '#333', textAlign: 'center' }}>
            Already have an account? <a href="/login" style={{ color: 'var(--orange)', textDecoration: 'none' }}>Login</a>
          </p>
        </div>
      </div>
    </div>
  )
}
