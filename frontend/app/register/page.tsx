'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const e = params.get('email')
    if (e) setEmail(e)
  }, [])

  const inp: React.CSSProperties = {
    width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A',
    borderRadius: '10px', padding: '13px 16px', fontSize: '14px',
    color: '#F1F5F9', outline: 'none', boxSizing: 'border-box',
  }

  async function register() {
    if (!fullName || !email || !password) { setError('Бүх талбарыг бөглөнө үү'); return }
    if (password.length < 8) { setError('Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой'); return }
    if (password !== confirm) { setError('Нууц үг таарахгүй байна'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('http://localhost:4000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName, role: 'customer' }),
      })
      const data = await res.json()
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('user', JSON.stringify(data.user))
        router.push('/dashboard/quotes')
      } else {
        setError(data.message || 'Бүртгэл амжилтгүй болсон')
      }
    } catch {
      setError('Серверт холбогдож чадсангүй')
    }
    setLoading(false)
  }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthColor = ['#333', '#e24b4a', '#F59E0B', '#10B981'][strength]
  const strengthLabel = ['', 'Сул', 'Дунд', 'Хүчтэй'][strength]

  return (
    <main style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI',system-ui,sans-serif", background: '#0A0A0A' }}>
      <div style={{ flex: '0 0 44%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px', background: '#0D0D0D' }}>
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: '400px', height: '400px', background: 'var(--orange-07)', borderRadius: '50%', filter: 'blur(100px)' }}/>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <a href="/" style={{ fontSize: '22px', fontWeight: 700, color: '#F1F5F9', textDecoration: 'none', display: 'block', marginBottom: '48px' }}>
            <span style={{ color: 'var(--orange)' }}>Biz</span>Print
          </a>
          <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#F1F5F9', lineHeight: 1.2, margin: '0 0 16px' }}>
            Хэвлэлийн<br/>үйлчилгээний<br/><span style={{ color: 'var(--orange)' }}>платформ</span>
          </h2>
          <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.7, marginBottom: '40px' }}>
            Бизнесийн хэвлэлийн захиалгаа онлайнаар хийж, хугацаандаа хүргүүлээрэй.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: '⚡', title: 'Хурдан үнэ тооцоолол', desc: 'AI технологиор хэдхэн секундэд' },
              { icon: '🖨️', title: 'Мэргэжлийн хэвлэл', desc: 'Баталгаатай чанар, хугацаа' },
              { icon: '🚚', title: 'Хаалганд хүргэлт', desc: 'Улаанбаатар хотоор хүргэнэ' },
            ].map(b => (
              <div key={b.title} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--orange-10)', border: '1px solid var(--orange-15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                  {b.icon}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>{b.title}</div>
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: '0 0 56%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: '#111', borderLeft: '1px solid #1A1A1A' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#F1F5F9', margin: '0 0 6px' }}>Бүртгүүлэх</h2>
            <p style={{ fontSize: '14px', color: '#555', margin: 0 }}>
              Бүртгэлтэй юу? <a href="/login" style={{ color: 'var(--orange)', textDecoration: 'none', fontWeight: 500 }}>Нэвтрэх</a>
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#e24b4a', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: 500 }}>Бүтэн нэр</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Таны бүтэн нэр" style={inp}
              onFocus={e => (e.target.style.borderColor = 'var(--orange)')} onBlur={e => (e.target.style.borderColor = '#2A2A2A')} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: 500 }}>Имэйл</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" style={inp}
              onFocus={e => (e.target.style.borderColor = 'var(--orange)')} onBlur={e => (e.target.style.borderColor = '#2A2A2A')} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: 500 }}>Нууц үг</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Хамгийн багадаа 8 тэмдэгт" style={{ ...inp, paddingRight: '56px' }}
                onFocus={e => (e.target.style.borderColor = 'var(--orange)')} onBlur={e => (e.target.style.borderColor = '#2A2A2A')} />
              <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '11px', fontWeight: 600 }}>
                {showPass ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            {password && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '3px', background: '#2A2A2A', borderRadius: '2px' }}>
                  <div style={{ width: strength === 1 ? '33%' : strength === 2 ? '66%' : strength === 3 ? '100%' : '0', height: '100%', background: strengthColor, borderRadius: '2px', transition: 'all 0.3s' }}/>
                </div>
                <span style={{ fontSize: '11px', color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: 500 }}>Нууц үг давтах</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Нууц үгээ давтан оруулна уу" style={{ ...inp, borderColor: confirm && confirm !== password ? '#e24b4a' : '#2A2A2A' }}
              onKeyDown={e => e.key === 'Enter' && register()} />
            {confirm && confirm !== password && (
              <div style={{ fontSize: '12px', color: '#e24b4a', marginTop: '6px' }}>Нууц үг таарахгүй байна</div>
            )}
          </div>

          <button onClick={register} disabled={loading}
            style={{ width: '100%', padding: '14px', background: loading ? '#7a3300' : 'var(--orange)', color: loading ? '#aaa' : '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '20px' }}>
            {loading ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
          </button>

          <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #1A1A1A' }}>
            <p style={{ fontSize: '13px', color: '#444', margin: '0 0 10px' }}>Түнш болох уу?</p>
            <a href="/partner" style={{ fontSize: '13px', color: 'var(--orange)', textDecoration: 'none', fontWeight: 500, background: 'var(--orange-08)', border: '1px solid var(--orange-20)', borderRadius: '8px', padding: '8px 18px', display: 'inline-block' }}>
              Түнш болох өргөдөл →
            </a>
          </div>

          <p style={{ marginTop: '20px', fontSize: '11px', color: '#333', textAlign: 'center', lineHeight: 1.6 }}>
            Бүртгүүлснээр үйлчилгээний нөхцөлийг зөвшөөрч байна
          </p>
        </div>
      </div>
    </main>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{background:'#0A0A0A',minHeight:'100vh'}}/>}>
      <RegisterForm />
    </Suspense>
  )
}