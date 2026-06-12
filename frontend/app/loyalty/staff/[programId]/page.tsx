'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { QRCodeSVG } from 'qrcode.react'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const ORANGE = '#FF6B00'
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface LoyaltyProgram {
  name?: string
}

interface LoyaltySession {
  token?: string
  seconds_left?: number
}

interface SessionStatus {
  is_used?: boolean
}

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return ''
  try {
    const parsed = JSON.parse(error.message) as { message?: string }
    return parsed.message || error.message
  } catch {
    return error.message
  }
}

export default function StaffQrPage() {
  const { programId } = useParams<{ programId: string }>()
  const [program, setProgram] = useState<LoyaltyProgram | null>(null)
  const [session, setSession] = useState<LoyaltySession | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [status, setStatus] = useState<'idle' | 'active' | 'used' | 'expired'>('idle')
  const [usedMessage, setUsedMessage] = useState('')
  const [generating, setGenerating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load program info
  useEffect(() => {
    fetch(`${API}/loyalty/program/${programId}`)
      .then(r => r.ok ? r.json() : null)
      .then(setProgram)
      .catch(() => {})
  }, [programId])

  // Countdown timer
  useEffect(() => {
    if (status !== 'active' || secondsLeft <= 0) return
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setStatus('expired')
          if (timerRef.current) clearInterval(timerRef.current)
          if (pollRef.current) clearInterval(pollRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [status])

  const generateQr = useCallback(async () => {
    setGenerating(true)
    setUsedMessage('')
    try {
      const res = await apiFetch<LoyaltySession>('/loyalty/session', {
        method: 'POST',
        body: { program_id: programId },
      })
      setSession(res)
      setSecondsLeft(res.seconds_left || 60)
      setStatus('active')

      // Poll for usage
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        try {
          const s = await fetch(`${API}/loyalty/session/${res.token}/status`).then(r => r.json() as Promise<SessionStatus>)
          if (s.is_used) {
            setStatus('used')
            setUsedMessage('Тамга амжилттай нэмэгдлээ!')
            if (pollRef.current) clearInterval(pollRef.current)
            if (timerRef.current) clearInterval(timerRef.current)
          }
        } catch {}
      }, 2000)
    } catch (e: unknown) {
      const msg = getErrorMessage(e)
      alert(msg || 'Алдаа гарлаа')
    }
    setGenerating(false)
  }, [programId])

  // Cleanup on unmount
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (pollRef.current) clearInterval(pollRef.current)
  }, [])

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const qrUrl = session?.token ? `${baseUrl}/loyalty/scan?token=${session.token}` : ''

  const progressPercent = session ? (secondsLeft / (session.seconds_left || 60)) * 100 : 0
  const ringColor = status === 'used' ? '#10B981' : status === 'expired' ? '#EF4444' : ORANGE

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: FONT, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: '#9CA3AF', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Staff Mode</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>{program?.name || 'Loyalty'}</h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>QR код үүсгэж хэрэглэгчид тамга нэмэх</p>
      </div>

      {/* QR Card */}
      <div style={{ background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB', width: '100%', maxWidth: 360, textAlign: 'center' }}>

        {status === 'idle' && (
          <>
            <div style={{ width: 180, height: 180, margin: '0 auto 24px', background: '#F3F4F6', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/><line x1="21" y1="14" x2="21" y2="21"/><line x1="14" y1="21" x2="21" y2="21"/></svg>
            </div>
            <button onClick={generateQr} disabled={generating} style={{
              width: '100%', padding: '16px', background: ORANGE, color: '#fff', border: 'none',
              borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 4px 14px ${ORANGE}40`,
            }}>
              {generating ? 'Үүсгэж байна...' : 'QR код үүсгэх'}
            </button>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 12 }}>60 секундын хугацаатай, нэг удаагийн QR</p>
          </>
        )}

        {status === 'active' && session && (
          <>
            {/* Timer ring */}
            <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 20px' }}>
              <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="100" cy="100" r="90" fill="none" stroke="#F3F4F6" strokeWidth="6" />
                <circle cx="100" cy="100" r="90" fill="none" stroke={ORANGE} strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 90}`}
                  strokeDashoffset={`${2 * Math.PI * 90 * (1 - progressPercent / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '50%' }}>
                <QRCodeSVG value={qrUrl} size={120} bgColor="#FFFFFF" fgColor="#000000" level="M" />
              </div>
            </div>

            <div style={{ fontSize: 36, fontWeight: 700, color: secondsLeft <= 10 ? '#EF4444' : '#111', fontVariantNumeric: 'tabular-nums' }}>
              {secondsLeft}<span style={{ fontSize: 16, fontWeight: 400, color: '#9CA3AF' }}>с</span>
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 20 }}>Хэрэглэгч уншуулахыг хүлээж байна...</div>

            <button onClick={generateQr} style={{
              width: '100%', padding: '12px', background: '#F3F4F6', color: '#374151', border: 'none',
              borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}>
              Шинэ QR үүсгэх
            </button>
          </>
        )}

        {status === 'used' && (
          <>
            <div style={{ width: 120, height: 120, margin: '0 auto 20px', background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#10B981', marginBottom: 4 }}>Амжилттай!</div>
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>{usedMessage}</div>
            <button onClick={() => { setStatus('idle'); setSession(null) }} style={{
              width: '100%', padding: '14px', background: ORANGE, color: '#fff', border: 'none',
              borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}>
              Дахин QR үүсгэх
            </button>
          </>
        )}

        {status === 'expired' && (
          <>
            <div style={{ width: 120, height: 120, margin: '0 auto 20px', background: '#FEE2E2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#EF4444', marginBottom: 4 }}>Хугацаа дууслаа</div>
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>QR код ашиглагдаагүй</div>
            <button onClick={() => { setStatus('idle'); setSession(null) }} style={{
              width: '100%', padding: '14px', background: ORANGE, color: '#fff', border: 'none',
              borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}>
              Шинэ QR үүсгэх
            </button>
          </>
        )}
      </div>

      {/* Stats link */}
      <a href={`/dashboard/vendor/loyalty`} style={{ marginTop: 24, fontSize: 13, color: ORANGE, textDecoration: 'none' }}>
        ← Loyalty удирдлага
      </a>
    </div>
  )
}
