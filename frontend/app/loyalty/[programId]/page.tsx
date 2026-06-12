'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { apiFetch, getToken } from '@/lib/api'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"

interface LoyaltyProgram {
  accent_color?: string
  description?: string
  discount_percent?: number
  logo_url?: string
  name?: string
  required_stamps?: number
  reward_description?: string
  reward_type?: string
  vendor?: {
    full_name?: string
  }
}

interface LoyaltyCard {
  current_stamps?: number
  rewards?: number
  total_stamps?: number
}

interface LoyaltyHistoryItem {
  id: string
  action?: string
  note?: string
  created_at?: string
}

interface LoyaltyMyResponse {
  program?: LoyaltyProgram
  card?: LoyaltyCard
}

interface LoyaltyActionResponse {
  card?: LoyaltyCard
  message?: string
  rewardEarned?: boolean
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

function formatHistoryDate(value?: string) {
  return value ? new Date(value).toLocaleDateString('mn-MN') : ''
}

export default function LoyaltyPage() {
  const { programId } = useParams<{ programId: string }>()
  const [program, setProgram] = useState<LoyaltyProgram | null>(null)
  const [card, setCard] = useState<LoyaltyCard | null>(null)
  const [history, setHistory] = useState<LoyaltyHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stamping, setStamping] = useState(false)
  const [redeeming, setRedeeming] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [showReward, setShowReward] = useState(false)
  const isLoggedIn = !!getToken()

  useEffect(() => {
    loadData()
  }, [programId])

  const loadData = async () => {
    try {
      if (isLoggedIn) {
        const data = await apiFetch<LoyaltyMyResponse>(`/loyalty/my/${programId}`)
        setProgram(data.program || null)
        setCard(data.card || null)
        const hist = await apiFetch<LoyaltyHistoryItem[]>(`/loyalty/history/${programId}`).catch(() => [])
        setHistory(Array.isArray(hist) ? hist : [])
      } else {
        const prog = await apiFetch<LoyaltyProgram>(`/loyalty/program/${programId}`, { auth: false })
        setProgram(prog)
      }
    } catch {
      // program not found
    } finally {
      setLoading(false)
    }
  }

  const handleStamp = async () => {
    if (!isLoggedIn) { window.location.href = `/login?redirect=/loyalty/${programId}`; return }
    setStamping(true)
    setMessage(null)
    try {
      const res = await apiFetch<LoyaltyActionResponse>('/loyalty/scan', { method: 'POST', body: { program_id: programId } })
      setCard(res.card || null)
      setMessage({ text: res.message || 'Амжилттай', type: 'success' })
      if (res.rewardEarned) setShowReward(true)
      loadData()
    } catch (e: unknown) {
      const msg = getErrorMessage(e)
      setMessage({ text: msg || 'Алдаа гарлаа', type: 'error' })
    } finally {
      setStamping(false)
    }
  }

  const handleRedeem = async () => {
    setRedeeming(true)
    setMessage(null)
    try {
      const res = await apiFetch<LoyaltyActionResponse>('/loyalty/redeem', { method: 'POST', body: { program_id: programId } })
      setCard(res.card || null)
      setMessage({ text: res.message || 'Амжилттай', type: 'success' })
      loadData()
    } catch (e: unknown) {
      const msg = getErrorMessage(e)
      setMessage({ text: msg || 'Алдаа гарлаа', type: 'error' })
    } finally {
      setRedeeming(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, background: '#FAFAFA' }}>
      <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        Ачааллаж байна...
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )

  if (!program) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, background: '#FAFAFA', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 48 }}>&#x1F50D;</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: '#374151' }}>Програм олдсонгүй</div>
    </div>
  )

  const accent = program.accent_color || '#FF6B00'
  const stamps = card?.current_stamps || 0
  const rewards = card?.rewards || 0
  const required = Math.max(1, program.required_stamps || 1)
  const totalStamps = card?.total_stamps || 0

  return (
    <div style={{ minHeight: '100vh', fontFamily: FONT, background: `linear-gradient(180deg, ${accent}08 0%, #FAFAFA 40%)` }}>
      {/* Reward celebration overlay */}
      {showReward && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowReward(false)}>
          <div style={{ background: '#fff', borderRadius: 24, padding: '48px 40px', textAlign: 'center', maxWidth: 360, margin: 16, animation: 'popIn 0.4s ease' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>&#x1F389;</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1F2937', margin: '0 0 8px' }}>Баяр хүргэе!</h2>
            <p style={{ fontSize: 16, color: '#6B7280', margin: '0 0 16px' }}>Шагнал авлаа!</p>
            <div style={{ fontSize: 18, fontWeight: 600, color: accent, background: `${accent}10`, padding: '12px 24px', borderRadius: 12, marginBottom: 24 }}>
              {program.reward_description || (program.reward_type === 'free' ? 'Үнэгүй бүтээгдэхүүн' : `${program.discount_percent}% хөнгөлөлт`)}
            </div>
            <button onClick={() => setShowReward(false)} style={{ padding: '12px 32px', background: accent, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Ойлголоо</button>
          </div>
          <style>{`@keyframes popIn { from { transform: scale(0.8); opacity: 0 } to { transform: scale(1); opacity: 1 } }`}</style>
        </div>
      )}

      <div style={{ maxWidth: 420, margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {program.logo_url && <img src={program.logo_url} alt="" style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', margin: '0 auto 12px', display: 'block' }} />}
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1F2937', margin: '0 0 4px' }}>{program.name}</h1>
          {program.description && <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>{program.description}</p>}
          {program.vendor?.full_name && <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>{program.vendor.full_name}</div>}
        </div>

        {/* Loyalty Card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB', marginBottom: 16 }}>
          {/* Stamp grid */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(required, 5)}, 1fr)`, gap: 10, marginBottom: 20 }}>
            {Array.from({ length: required }).map((_, i) => {
              const filled = i < stamps
              return (
                <div key={i} style={{
                  aspectRatio: '1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: filled ? accent : '#F3F4F6',
                  border: filled ? `2px solid ${accent}` : '2px dashed #D1D5DB',
                  transition: 'all 0.3s ease',
                  transform: filled ? 'scale(1)' : 'scale(0.9)',
                }}>
                  {filled ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>{i + 1}</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Progress text */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: '#6B7280' }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: accent }}>{stamps}</span>
              <span style={{ fontSize: 16, color: '#9CA3AF' }}> / {required}</span>
            </div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
              {required - stamps > 0 ? `${required - stamps} тамга дутуу` : 'Шагнал бэлэн!'}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ background: '#F3F4F6', borderRadius: 100, height: 8, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{
              width: `${(stamps / required) * 100}%`,
              height: '100%', background: `linear-gradient(90deg, ${accent}, ${accent}CC)`,
              borderRadius: 100, transition: 'width 0.5s ease',
            }} />
          </div>

          {/* Stamp button */}
          <button onClick={handleStamp} disabled={stamping} style={{
            width: '100%', padding: '16px', background: accent, color: '#fff', border: 'none',
            borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: stamping ? 'wait' : 'pointer',
            opacity: stamping ? 0.7 : 1, transition: 'all 0.2s',
            boxShadow: `0 4px 14px ${accent}40`,
          }}>
            {stamping ? 'Тамга нэмж байна...' : !isLoggedIn ? 'Нэвтрэх & Тамга авах' : 'Тамга авах'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: '14px 18px', borderRadius: 12, marginBottom: 16, fontSize: 14, fontWeight: 500,
            background: message.type === 'success' ? '#DCFCE7' : '#FEE2E2',
            color: message.type === 'success' ? '#166534' : '#991B1B',
            animation: 'fadeIn 0.3s ease',
          }}>
            {message.text}
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }`}</style>
          </div>
        )}

        {/* Rewards section */}
        {rewards > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: `2px solid ${accent}30`, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1F2937' }}>
                  &#x1F381; {rewards} шагнал бэлэн
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                  {program.reward_description || (program.reward_type === 'free' ? 'Үнэгүй бүтээгдэхүүн' : `${program.discount_percent}% хөнгөлөлт`)}
                </div>
              </div>
              <button onClick={handleRedeem} disabled={redeeming} style={{
                padding: '10px 20px', background: '#10B981', color: '#fff', border: 'none',
                borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: redeeming ? 'wait' : 'pointer',
                whiteSpace: 'nowrap',
              }}>
                {redeeming ? '...' : 'Ашиглах'}
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        {isLoggedIn && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            <StatBox label="Нийт тамга" value={totalStamps} color={accent} />
            <StatBox label="Шагнал" value={rewards} color="#10B981" />
            <StatBox label="Зорилго" value={required} color="#6B7280" />
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: '#1F2937' }}>Түүх</h3>
            {history.slice(0, 10).map((log) => (
              <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{log.action === 'stamp' ? '\u2B50' : '\u{1F381}'}</span>
                  <span style={{ color: '#374151' }}>{log.action === 'stamp' ? 'Тамга' : 'Шагнал'}</span>
                  {log.note && <span style={{ color: '#9CA3AF' }}>— {log.note}</span>}
                </div>
                <span style={{ color: '#9CA3AF', fontSize: 12 }}>{formatHistoryDate(log.created_at)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: '#9CA3AF' }}>
          BizPrint QR Loyalty
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 14, border: '1px solid #E5E7EB', textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{label}</div>
    </div>
  )
}
