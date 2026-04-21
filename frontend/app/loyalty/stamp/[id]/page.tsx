'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://bizprint-production.up.railway.app'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

export default function StampPage() {
  const { id } = useParams()
  const [program, setProgram] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [stage, setStage] = useState<'input' | 'result' | 'reward'>('input')

  useEffect(() => {
    fetch(`${API}/api/loyalty/program/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setProgram)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleScan = async () => {
    if (phone.length < 8) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/api/loyalty/scan-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: id, phone }),
      }).then(r => r.json())
      setResult(res)
      setStage(res.rewardEarned ? 'reward' : 'result')
    } catch { setResult({ message: 'Алдаа гарлаа' }) }
    setSubmitting(false)
  }

  const accent = program?.accent_color || '#FF6B00'

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA', fontFamily: F }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!program) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 48 }}>😕</div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>Програм олдсонгүй</div>
    </div>
  )

  const card = result?.card
  const stamps = card?.current_stamps ?? 0
  const totalStamps = card?.total_stamps ?? 0
  const rewards = card?.rewards ?? 0
  const required = program.required_stamps

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: F, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: accent, padding: '20px 24px', color: '#fff', textAlign: 'center' }}>
        {program.logo_url && <img src={program.logo_url} alt="" style={{ height: 36, borderRadius: 8, marginBottom: 8 }} />}
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{program.name}</h1>
        {program.description && <p style={{ fontSize: 13, opacity: 0.85, margin: '4px 0 0' }}>{program.description}</p>}
      </div>

      <div style={{ flex: 1, padding: '24px 20px', maxWidth: 400, margin: '0 auto', width: '100%' }}>

        {/* ═══ INPUT STAGE ═══ */}
        {stage === 'input' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>📱</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: '#1F2937' }}>Тамга авах</h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Утасны дугаараа оруулна уу</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <input
                type="tel" inputMode="numeric" value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="9911 2233"
                autoFocus
                style={{
                  width: '100%', padding: '16px 20px', fontSize: 24, fontWeight: 700,
                  border: `2px solid ${phone.length === 8 ? accent : '#E5E7EB'}`,
                  borderRadius: 16, textAlign: 'center', letterSpacing: 4,
                  outline: 'none', background: '#fff', color: '#1F2937',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            <button
              onClick={handleScan}
              disabled={phone.length < 8 || submitting}
              style={{
                width: '100%', padding: '16px', background: phone.length === 8 ? accent : '#D1D5DB',
                color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700,
                cursor: phone.length === 8 && !submitting ? 'pointer' : 'not-allowed',
                fontFamily: F, opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Илгээж байна...' : 'Тамга авах ⭐'}
            </button>

            {/* Reward info */}
            <div style={{ marginTop: 20, background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #E5E7EB', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Шагнал</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: accent }}>
                🎁 {program.reward_description || 'Үнэгүй бүтээгдэхүүн'}
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{required} тамга цуглуулаарай</div>
            </div>
          </div>
        )}

        {/* ═══ RESULT STAGE ═══ */}
        {stage === 'result' && card && (
          <div style={{ animation: 'fadeIn 0.3s ease', textAlign: 'center' }}>
            {result.alreadyScanned ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1F2937', margin: '0 0 4px' }}>Өнөөдөр авсан</h2>
                <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Маргааш дахин ирээрэй!</p>
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>⭐</div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1F2937', margin: '0 0 4px' }}>Тамга +1</h2>
                <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>{result.message}</p>
              </div>
            )}

            {/* Stamp circles */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              {Array.from({ length: required }).map((_, i) => (
                <div key={i} style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: i < stamps ? accent : '#E5E7EB',
                  border: i < stamps ? `2px solid ${accent}` : '2px dashed #D1D5DB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s',
                }}>
                  {i < stamps && <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>✓</span>}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ background: '#E5E7EB', borderRadius: 10, height: 10, marginBottom: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(stamps / required) * 100}%`, background: accent, borderRadius: 10, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
              {stamps}/{required} тамга · Нийт: {totalStamps}
            </div>

            {/* Rewards available */}
            {rewards > 0 && (
              <div style={{ background: '#F0FDF4', border: '2px solid #10B981', borderRadius: 14, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>🎁</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#059669' }}>{rewards} шагнал бэлэн!</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{program.reward_description}</div>
              </div>
            )}

            {/* Marketing block */}
            <MarketingBlock items={result?.marketing} accent={accent} />

            <button onClick={() => { setStage('input'); setResult(null) }} style={{
              width: '100%', padding: '14px', background: '#F3F4F6', color: '#374151',
              border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: F,
            }}>
              Дахин скан хийх
            </button>
          </div>
        )}

        {/* ═══ REWARD STAGE ═══ */}
        {stage === 'reward' && (
          <div style={{ animation: 'fadeIn 0.3s ease', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 12, animation: 'bounce 0.5s ease' }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: accent, margin: '0 0 8px' }}>Баяр хүргэе!</h2>
            <p style={{ fontSize: 16, color: '#1F2937', margin: '0 0 4px', fontWeight: 600 }}>Шагнал авлаа!</p>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>{program.reward_description || 'Үнэгүй бүтээгдэхүүн'}</p>

            {/* Confetti effect */}
            <div style={{ background: `linear-gradient(135deg, ${accent}15, ${accent}05)`, borderRadius: 16, padding: 24, border: `2px solid ${accent}30`, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: accent }}>🎁 Шагналаа авахдаа ажилтанд үзүүлнэ үү</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#1F2937', marginTop: 8 }}>{card?.rewards || 1}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>ашиглаагүй шагнал</div>
            </div>

            {/* Marketing block */}
            <MarketingBlock items={result?.marketing} accent={accent} />

            <button onClick={() => { setStage('input'); setResult(null); setPhone('') }} style={{
              width: '100%', padding: '14px', background: accent, color: '#fff',
              border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: F,
            }}>
              Дуусгах
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '12px', fontSize: 11, color: '#9CA3AF' }}>
        Powered by BizPrint.mn
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes bounce { 0% { transform: scale(0.5) } 50% { transform: scale(1.2) } 100% { transform: scale(1) } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

function MarketingBlock({ items, accent }: { items?: any[]; accent: string }) {
  if (!items || items.length === 0) return null
  return (
    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Санал болгох</div>
      {items.map((m: any, i: number) => {
        if (m.type === 'banner') return (
          <div key={i} style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #E5E7EB', background: '#fff' }}>
            {m.image_url && <img src={m.image_url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover' }} />}
            <div style={{ padding: 14 }}>
              {m.title && <div style={{ fontSize: 15, fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>{m.title}</div>}
              {m.description && <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 10, lineHeight: 1.4 }}>{m.description}</div>}
              {m.button_text && m.button_link && (
                <a href={m.button_link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '10px', background: accent, color: '#fff', borderRadius: 10, textAlign: 'center', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                  {m.button_text}
                </a>
              )}
            </div>
          </div>
        )
        if (m.type === 'promo') return (
          <div key={i} style={{ background: `${accent}10`, border: `1px solid ${accent}30`, borderRadius: 12, padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>🎉</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: accent }}>{m.message || m.title}</div>
            {m.description && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{m.description}</div>}
          </div>
        )
        if (m.type === 'product') return (
          <div key={i} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
            {m.image_url && <img src={m.image_url} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />}
            <div style={{ flex: 1 }}>
              {m.title && <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>{m.title}</div>}
              {m.description && <div style={{ fontSize: 12, color: '#6B7280' }}>{m.description}</div>}
            </div>
            {m.button_link && (
              <a href={m.button_link} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 14px', background: accent, color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                {m.button_text || 'Үзэх'}
              </a>
            )}
          </div>
        )
        return null
      })}
    </div>
  )
}
