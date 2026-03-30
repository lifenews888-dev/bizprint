'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiFetch, getToken } from '@/lib/api'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const ORANGE = '#FF6B00'

export default function ScanPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Ачааллаж байна...</div>}>
      <ScanContent />
    </Suspense>
  )
}

function ScanContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'login' | 'success' | 'error'>('loading')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setError('QR код буруу байна'); return }

    const jwt = getToken()
    if (!jwt) {
      // Save token and redirect to login
      sessionStorage.setItem('loyalty_scan_token', token)
      setStatus('login')
      return
    }

    // Submit scan
    scanToken(token)
  }, [token])

  const scanToken = async (t: string) => {
    setStatus('loading')
    try {
      const res: any = await apiFetch('/loyalty/scan-session', {
        method: 'POST',
        body: { token: t },
      })
      setResult(res)
      setStatus('success')
    } catch (e: any) {
      let msg: string
      try { msg = JSON.parse(e.message)?.message } catch { msg = e.message }
      setError(msg || 'Алдаа гарлаа')
      setStatus('error')
    }
  }

  // After login redirect, check for saved token
  useEffect(() => {
    const saved = sessionStorage.getItem('loyalty_scan_token')
    if (saved && getToken() && !token) {
      sessionStorage.removeItem('loyalty_scan_token')
      scanToken(saved)
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '48px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB', maxWidth: 400, width: '100%', textAlign: 'center' }}>

        {status === 'loading' && (
          <>
            <div style={{ width: 48, height: 48, border: '3px solid #E5E7EB', borderTopColor: ORANGE, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
            <div style={{ fontSize: 16, fontWeight: 500, color: '#374151' }}>Тамга нэмж байна...</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </>
        )}

        {status === 'login' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#x1F513;</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>Нэвтрэх шаардлагатай</h2>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>Тамга авахын тулд нэвтэрнэ үү</p>
            <button onClick={() => { window.location.href = `/login?redirect=${encodeURIComponent(`/loyalty/scan?token=${token}`)}` }} style={{
              width: '100%', padding: '14px', background: ORANGE, color: '#fff', border: 'none',
              borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}>
              Нэвтрэх
            </button>
          </>
        )}

        {status === 'success' && result && (
          <>
            <div style={{
              width: 100, height: 100, margin: '0 auto 20px', borderRadius: '50%',
              background: result.rewardEarned ? 'linear-gradient(135deg, #FBBF24, #F59E0B)' : '#DCFCE7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'popIn 0.4s ease',
            }}>
              {result.rewardEarned ? (
                <span style={{ fontSize: 48 }}>&#x1F389;</span>
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={result.rewardEarned ? '#fff' : '#10B981'} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: result.rewardEarned ? '#D97706' : '#10B981', margin: '0 0 8px' }}>
              {result.rewardEarned ? 'Шагнал авлаа!' : 'Тамга нэмэгдлээ!'}
            </h2>
            <p style={{ fontSize: 15, color: '#374151', margin: '0 0 20px' }}>{result.message}</p>

            {/* Stamp progress */}
            {result.card && (
              <div style={{ background: '#F9FAFB', borderRadius: 16, padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                  {Array.from({ length: result.card.program?.required_stamps || 10 }).map((_, i) => (
                    <div key={i} style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: i < result.card.current_stamps ? ORANGE : '#E5E7EB',
                      border: i < result.card.current_stamps ? `2px solid ${ORANGE}` : '2px dashed #D1D5DB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {i < result.card.current_stamps && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 14, color: '#6B7280' }}>
                  {result.card.current_stamps} / {result.card.program?.required_stamps || 10} тамга
                  {result.card.rewards > 0 && <span style={{ color: '#10B981', fontWeight: 600 }}> &middot; {result.card.rewards} шагнал</span>}
                </div>
              </div>
            )}

            <a href="/dashboard/customer/loyalty" style={{
              display: 'block', padding: '12px', background: '#F3F4F6', borderRadius: 10,
              color: '#374151', textDecoration: 'none', fontSize: 14, fontWeight: 500,
            }}>
              Миний Loyalty картууд
            </a>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: 80, height: 80, margin: '0 auto 20px', background: '#FEE2E2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#EF4444', margin: '0 0 8px' }}>Алдаа</h2>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>{error}</p>
            <a href="/dashboard/customer/loyalty" style={{
              display: 'block', padding: '12px', background: '#F3F4F6', borderRadius: 10,
              color: '#374151', textDecoration: 'none', fontSize: 14, fontWeight: 500,
            }}>
              Loyalty картууд руу буцах
            </a>
          </>
        )}
      </div>

      <style>{`@keyframes popIn { from { transform: scale(0.7); opacity: 0 } to { transform: scale(1); opacity: 1 } }`}</style>
    </div>
  )
}
