'use client'
import React, { useState } from 'react'
import React, { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const inp: React.CSSProperties = {
    width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A',
    borderRadius: '10px', padding: '13px 16px', fontSize: '14px',
    color: '#F1F5F9', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  }

  async function login() {
    if (!email || !password) { setError('Имэйл болон нууц үгийг оруулна уу'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('http://localhost:4000/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('user', JSON.stringify(data.user))
        const role = data.user?.role
        if (role === 'admin') router.push('/admin')
        else if (role === 'vendor') router.push('/dashboard/vendor')
        else if (role === 'designer') router.push('/designer')
        else if (role === 'sales') router.push('/sales')
        else if (role === 'courier') router.push('/courier')
        else if (role === 'factory') router.push('/dashboard/factory')
        else router.push('/dashboard')
      } else { setError('Имэйл эсвэл нууц үг буруу байна') }
    } catch { setError('Серверт холбогдож чадсангүй') }
    setLoading(false)
  }

  return (
    <main style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI',system-ui,sans-serif", background: '#0A0A0A' }}>

      {/* Left - branding (hidden on mobile) */}
      <div style={{ flex: '0 0 52%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px' }}
        className="hide-mobile">
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0A0A0A 0%, #111 100%)' }}/>
        <div style={{ position: 'absolute', top: '15%', left: '20%', width: '500px', height: '500px', background: 'var(--orange-08)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '300px', height: '300px', background: 'var(--orange-05)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }}/>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.025, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="g" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="var(--orange)" strokeWidth="1"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <a href="/" style={{ fontSize: '22px', fontWeight: 700, color: '#F1F5F9', textDecoration: 'none' }}>
            <span style={{ color: 'var(--orange)' }}>Biz</span>Print
          </a>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--orange-10)', border: '1px solid var(--orange-20)', borderRadius: '8px', padding: '6px 14px', marginBottom: '28px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--orange)' }}/>
            <span style={{ fontSize: '12px', color: 'var(--orange)', fontWeight: 500 }}>Print Industry Platform</span>
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#F1F5F9', lineHeight: 1.1, letterSpacing: '-1.5px', margin: '0 0 20px' }}>
            Таны захиалгууд<br/>
            <span style={{ color: 'var(--orange)' }}>нэг дор</span>
          </h1>
          <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.7, maxWidth: '360px', margin: '0 0 40px' }}>
            AI үнэ тооцоолол, автоматаар үйлдвэр сонгох, бодит цагийн хүргэлт хянах — бүгд нэг платформд.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { n: '01', t: 'AI Үнэ', d: 'PDF байршуулах — шуурхай үнэ тооцоолол' },
              { n: '02', t: 'Үйлдвэр сонгох', d: 'Хамгийн тохиромжтой үйлдвэрийг автоматаар' },
              { n: '03', t: 'Хүргэлт хянах', d: 'Бодит цагийн хүргэлтийн мэдээлэл' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'var(--orange-10)', border: '1px solid var(--orange-20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--orange)', flexShrink: 0 }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>{s.t}</div>
                  <div style={{ fontSize: '12px', color: '#555' }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, paddingTop: '28px', borderTop: '1px solid #1A1A1A', display: 'flex', gap: '36px' }}>
          {[{ v: '250+', l: 'Захиалга' }, { v: '3', l: 'Үйлдвэр' }, { v: '99%', l: 'Сэтгэл ханамж' }].map(st => (
            <div key={st.l}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--orange)' }}>{st.v}</div>
              <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{st.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right - login form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#111', borderLeft: '1px solid #1A1A1A' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>

          {/* Mobile logo */}
          <div className="show-mobile" style={{ display: 'none', marginBottom: 32, textAlign: 'center' }}>
            <a href="/" style={{ fontSize: '22px', fontWeight: 700, color: '#F1F5F9', textDecoration: 'none' }}>
              <span style={{ color: 'var(--orange)' }}>Biz</span>Print
            </a>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#F1F5F9', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Тавтай морил</h2>
            <p style={{ fontSize: '14px', color: '#555', margin: 0 }}>
              Бүртгэл байхгүй юу? <a href="/register" style={{ color: 'var(--orange)', textDecoration: 'none', fontWeight: 500 }}>Бүртгүүлэх</a>
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#e24b4a', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: 500 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com" style={inp}
              onFocus={e => (e.target.style.borderColor = 'var(--orange)')}
              onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
              onKeyDown={e => e.key === 'Enter' && login()} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>Password</label>
            </div>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" style={{ ...inp, paddingRight: '56px' }}
                onFocus={e => (e.target.style.borderColor = 'var(--orange)')}
                onBlur={e => (e.target.style.borderColor = '#2A2A2A')}
                onKeyDown={e => e.key === 'Enter' && login()} />
              <button onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>
                {showPass ? 'Нуух' : 'Харах'}
              </button>
            </div>
          </div>

          <button onClick={login} disabled={loading}
            style={{ width: '100%', padding: '14px', background: loading ? '#7a3300' : 'var(--orange)', color: loading ? '#aaa' : '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', marginBottom: '20px' }}>
            {loading ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
          </button>

          <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #1A1A1A' }}>
            <p style={{ fontSize: '13px', color: '#444', margin: '0 0 10px' }}>Түнш болохыг хүсэж байна уу?</p>
            <a href="/partner" style={{ fontSize: '13px', color: 'var(--orange)', textDecoration: 'none', fontWeight: 500, background: 'var(--orange-08)', border: '1px solid var(--orange-20)', borderRadius: '8px', padding: '8px 18px', display: 'inline-block' }}>
              Түнш болох
            </a>
          </div>

          <p style={{ marginTop: '24px', fontSize: '11px', color: '#333', textAlign: 'center', lineHeight: 1.6 }}>
            Нэвтэрснээр та манай <a href="/terms" style={{ color: '#555', textDecoration: 'underline' }}>үйлчилгээний нөхцөл</a>-ийг зөвшөөрч байна.
          </p>
        </div>
      </div>
    </main>
  )
}
