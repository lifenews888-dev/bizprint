'use client'
import React, { useState, useEffect, Suspense } from 'react'
import React, { useRouter, useSearchParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function RegisterForm() {
  const router      = useRouter()
  const params      = useSearchParams()
  const refCode     = params.get('ref') || ''

  const [fullName,   setFullName]   = useState('')
  const [email,      setEmail]      = useState('')
  const [phone,      setPhone]      = useState('')
  const [password,   setPassword]   = useState('')
  const [password2,  setPassword2]  = useState('')
  const [company,    setCompany]    = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  async function register() {
    setError('')
    if (!fullName.trim())  return setError('Нэрээ оруулна уу')
    if (!email.trim())     return setError('И-мэйл оруулна уу')
    if (password.length < 8) return setError('Нууц үг хамгийн багадаа 8 тэмдэгт байна')
    if (password !== password2) return setError('Нууц үг таарахгүй байна')

    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name:    fullName.trim(),
          email:        email.trim().toLowerCase(),
          password,
          phone:        phone.trim() || undefined,
          company_name: company.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Бүртгэл амжилтгүй болсон')
        setLoading(false)
        return
      }

      // Save credentials
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Track referral if ?ref= present
      if (refCode && data.user?.id) {
        await fetch(`${API}/referral/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: refCode, referred_user_id: data.user.id }),
        }).catch(() => {}) // non-blocking
      }

      router.push('/dashboard')
    } catch {
      setError('Серверт холбогдоход алдаа гарлаа')
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A',
    borderRadius: 10, padding: '13px 16px', fontSize: 14, color: '#F1F5F9',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  }

  return (
    <main style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI',system-ui,sans-serif", background: '#0A0A0A' }}>

      {/* Left branding */}
      <div style={{ flex: '0 0 46%', background: 'linear-gradient(135deg,#0A0A0A,#111)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 56px', position: 'relative', overflow: 'hidden' }}
        className="hide-mobile">
        <div style={{ position: 'absolute', top: '15%', right: '-60px', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,107,0,0.12),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            <span style={{ color: '#FF6B00' }}>Biz</span>Print
          </div>
          <div style={{ fontSize: 13, color: '#666', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Монголын хэвлэлийн платформ</div>
        </div>
        <h2 style={{ fontSize: 34, fontWeight: 800, color: '#fff', lineHeight: 1.25, margin: '0 0 16px' }}>
          Хэвлэлийн бизнесийг<br/>
          <span style={{ color: '#FF6B00' }}>онлайнаар удирда</span>
        </h2>
        <p style={{ color: '#888', fontSize: 15, lineHeight: 1.6, margin: '0 0 36px' }}>
          Захиалга өгөх, дизайн хийх, хүргэлт хянах — бүгдийг нэг дороос.
        </p>
        {refCode && (
          <div style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 12, color: '#FF6B00', fontWeight: 600, marginBottom: 4 }}>🎁 Урилгаар бүртгүүлж байна</div>
            <div style={{ fontSize: 13, color: '#ccc' }}>Код: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#FF6B00' }}>{refCode}</span></div>
          </div>
        )}
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Бүртгэл үүсгэх</div>
            <div style={{ fontSize: 13, color: '#666' }}>
              Бүртгэлтэй бол{' '}
              <a href="/login" style={{ color: '#FF6B00', textDecoration: 'none', fontWeight: 600 }}>нэвтрэх</a>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(226,75,74,0.12)', border: '1px solid rgba(226,75,74,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#e24b4a', fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 500 }}>Бүтэн нэр *</div>
              <input value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Нэр Овог" style={inp}
                onKeyDown={e => e.key === 'Enter' && register()} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 500 }}>И-мэйл хаяг *</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="name@company.mn" style={inp}
                onKeyDown={e => e.key === 'Enter' && register()} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 500 }}>Утасны дугаар</div>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="9911 2233" style={inp}
                onKeyDown={e => e.key === 'Enter' && register()} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 500 }}>Байгууллага / Компани</div>
              <input value={company} onChange={e => setCompany(e.target.value)}
                placeholder="Компанийн нэр (заавал биш)" style={inp}
                onKeyDown={e => e.key === 'Enter' && register()} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 500 }}>Нууц үг * (хамгийн багадаа 8 тэмдэгт)</div>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" style={{ ...inp, paddingRight: 44 }}
                  onKeyDown={e => e.key === 'Enter' && register()} />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 500 }}>Нууц үг давтах *</div>
              <input type={showPass ? 'text' : 'password'} value={password2} onChange={e => setPassword2(e.target.value)}
                placeholder="••••••••" style={{ ...inp, borderColor: password2 && password2 !== password ? '#e24b4a' : '#2A2A2A' }}
                onKeyDown={e => e.key === 'Enter' && register()} />
            </div>

            {refCode && (
              <div style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.25)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🎁</span>
                <div>
                  <div style={{ fontSize: 12, color: '#FF6B00', fontWeight: 600 }}>Урилгын код: {refCode}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>Бүртгүүлснийхээ дараа автоматаар хэрэгжинэ</div>
                </div>
              </div>
            )}

            <button onClick={register} disabled={loading}
              style={{
                width: '100%', padding: '14px', marginTop: 4,
                background: loading ? '#333' : 'linear-gradient(135deg,#FF6B00,#FF8C42)',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}>
              {loading ? 'Бүртгэж байна...' : 'Бүртгүүлэх →'}
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#444', marginTop: 20 }}>
            Бүртгүүлснээр{' '}
            <a href="/terms" style={{ color: '#666', textDecoration: 'underline' }}>үйлчилгээний нөхцөл</a>
            -ийг зөвшөөрч байна.
          </p>
        </div>
      </div>
    </main>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', color:'#666' }}>Уншиж байна...</div>}>
      <RegisterForm />
    </Suspense>
  )
}
