'use client'
import { apiFetch } from '@/lib/api'
import { storeAuthSession } from '@/lib/auth-session'
import { useState } from 'react'
import Link from 'next/link'
import AuthBrandPanel from '@/components/site/AuthBrandPanel'
import { useRouter, useSearchParams } from 'next/navigation'

interface LoginResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  user?: {
    role?: string
  }
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const inp: React.CSSProperties = {
    width: '100%', background: '#F5F5F5', border: '1px solid #E5E7EB',
    borderRadius: '14px', padding: '13px 16px', fontSize: '14px',
    color: '#111827', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  }

  async function login() {
    if (!email || !password) { setError('Имэйл эсвэл утас, нууц үг оруулна уу'); return }
    setLoading(true); setError('')
    try {
      const data = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST', body: { email, password }, auth: false,
      })
      if (data.access_token) {
        storeAuthSession(data)
        const next = searchParams.get('next')
        if (next?.startsWith('/') && !next.startsWith('//')) {
          router.push(next)
          return
        }
        const role = data.user?.role
        if (role === 'superadmin' || role === 'admin') router.push('/admin')
        else if (role === 'vendor') router.push('/dashboard/vendor')
        else if (role === 'designer') router.push('/designer')
        else if (role === 'sales') router.push('/sales')
        else if (role === 'courier') router.push('/courier')
        else router.push('/dashboard')
      } else { setError('Имэйл эсвэл нууц үг буруу байна') }
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Серверт холбогдож чадсангүй') }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI',system-ui,sans-serif", background: '#FFFFFF' }}>

      <AuthBrandPanel />

      {/* Баруун тал - нэвтрэх форм */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#FFFFFF' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>

          {/* Mobile лого */}
          <div className="show-mobile" style={{ marginBottom: 32, textAlign: 'center' }}>
            <Link href="/" style={{ fontSize: '22px', fontWeight: 700, color: '#111827', textDecoration: 'none' }}>
              BizPrint
            </Link>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Тавтай морил</h2>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
              Бүртгэлгүй юу? <a href="/register" style={{ color: 'var(--orange)', textDecoration: 'none', fontWeight: 500 }}>Бүртгүүлэх</a>
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#e24b4a', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '8px', fontWeight: 500 }}>Имэйл эсвэл утас</label>
            <input type="text" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com эсвэл 99001122" style={inp}
              onFocus={e => (e.target.style.borderColor = 'var(--orange)')}
              onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
              onKeyDown={e => e.key === 'Enter' && login()} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Нууц үг</label>
              <a href="/forgot-password" style={{ fontSize: '12px', color: 'var(--orange)', textDecoration: 'none', fontWeight: 500 }}>Нууц үг мартсан?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" style={{ ...inp, paddingRight: '56px' }}
                onFocus={e => (e.target.style.borderColor = 'var(--orange)')}
                onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                onKeyDown={e => e.key === 'Enter' && login()} />
              <button onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>
                {showPass ? 'НУУХ' : 'ХАРАХ'}
              </button>
            </div>
          </div>

          <button onClick={login} disabled={loading}
            style={{ width: '100%', padding: '14px', background: loading ? '#FFB27A' : 'var(--orange)', color: loading ? '#aaa' : '#fff', border: 'none', borderRadius: '9999px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', marginBottom: '20px' }}>
            {loading ? 'Нэвтэрж байна...' : 'Нэвтрэх'}
          </button>

          <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 10px' }}>Партнер болох уу?</p>
            <a href="/partner" style={{ fontSize: '13px', color: 'var(--orange)', textDecoration: 'none', fontWeight: 500, background: 'var(--orange-08)', border: '1px solid var(--orange-20)', borderRadius: '9999px', padding: '8px 18px', display: 'inline-block' }}>
              Партнер болох
            </a>
          </div>

          <p style={{ marginTop: '24px', fontSize: '11px', color: '#9CA3AF', textAlign: 'center', lineHeight: 1.6 }}>
            Нэвтрэхдээ үйлчилгээний нөхцөлийг зөвшөөрсөнд тооцно.
          </p>
        </div>
      </div>
    </div>
  )
}
