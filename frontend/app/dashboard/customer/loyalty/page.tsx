'use client'
import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { apiFetch } from '@/lib/api'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const ORANGE = '#FF6B00'
const API = process.env.NEXT_PUBLIC_API_URL || 'https://bizprint-production.up.railway.app'

export default function MyLoyaltyCards() {
  const [cards, setCards] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'my' | 'discover'>('my')
  const [joining, setJoining] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    const headers = { Authorization: `Bearer ${token}` }
    const safeFetch = (path: string) => fetch(`${API}${path}`, { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
    Promise.all([
      safeFetch('/loyalty/my'),
      safeFetch('/loyalty/programs/discover'),
    ]).then(([c, p]) => {
      setCards(Array.isArray(c) ? c : [])
      setPrograms(Array.isArray(p) ? p : [])
    }).finally(() => setLoading(false))
  }, [])

  const joinProgram = async (programId: string) => {
    setJoining(programId)
    try {
      await apiFetch('/loyalty/scan', { method: 'POST', body: { program_id: programId } })
      // Refresh cards
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      if (token) {
        const c = await fetch(`${API}/api/loyalty/my`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => [])
        setCards(Array.isArray(c) ? c : [])
        setTab('my')
      }
    } catch {}
    setJoining(null)
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: FONT, color: '#9CA3AF' }}>Ачааллаж байна...</div>

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const myProgramIds = new Set(cards.map(c => c.program_id || c.program?.id))
  const availablePrograms = programs.filter(p => !myProgramIds.has(p.id))

  return (
    <div style={{ padding: 24, fontFamily: FONT, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Loyalty картууд</h1>
          <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>QR уншуулж тамга цуглуулаарай</p>
        </div>
        <a href="/loyalty/scan" style={{ padding: '10px 20px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          📷 QR скан
        </a>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border, #E5E7EB)' }}>
        <button onClick={() => setTab('my')} style={{
          flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 14, fontWeight: tab === 'my' ? 700 : 400,
          background: 'none', color: tab === 'my' ? ORANGE : '#6B7280',
          borderBottom: tab === 'my' ? `2px solid ${ORANGE}` : '2px solid transparent', marginBottom: -2,
        }}>
          Миний картууд ({cards.length})
        </button>
        <button onClick={() => setTab('discover')} style={{
          flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 14, fontWeight: tab === 'discover' ? 700 : 400,
          background: 'none', color: tab === 'discover' ? ORANGE : '#6B7280',
          borderBottom: tab === 'discover' ? `2px solid ${ORANGE}` : '2px solid transparent', marginBottom: -2,
        }}>
          Нээх ({availablePrograms.length})
        </button>
      </div>

      {/* MY CARDS tab */}
      {tab === 'my' && (
        <>
          {cards.length === 0 ? (
            <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid var(--border, #E5E7EB)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text, #374151)', marginBottom: 8 }}>Loyalty карт байхгүй</div>
              <p style={{ color: '#9CA3AF', fontSize: 14, margin: '0 0 20px' }}>Дэлгүүр, кофе шоп, ресторанд QR уншуулаад loyalty картаа аваарай</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <a href="/loyalty/scan" style={{ padding: '10px 24px', background: ORANGE, color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>📷 QR скан хийх</a>
                <button onClick={() => setTab('discover')} style={{ padding: '10px 24px', background: 'var(--surface2, #F3F4F6)', color: 'var(--text, #374151)', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: FONT }}>Программ нээх</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {cards.map((c: any) => {
                const prog = c.program
                if (!prog) return null
                const accent = prog.accent_color || ORANGE
                const url = `${baseUrl}/loyalty/${prog.id}`
                const pct = prog.required_stamps > 0 ? (c.current_stamps / prog.required_stamps) * 100 : 0
                const rewardReady = c.rewards > 0
                return (
                  <div key={c.id} onClick={() => window.location.href = `/loyalty/${prog.id}`}
                    style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 20, border: rewardReady ? `2px solid #10B981` : '1px solid var(--border, #E5E7EB)', cursor: 'pointer', transition: 'box-shadow 0.2s', position: 'relative' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                    {/* Reward badge */}
                    {rewardReady && (
                      <div style={{ position: 'absolute', top: -8, right: 12, background: '#10B981', color: '#fff', padding: '2px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🎁 Шагнал бэлэн!</div>
                    )}
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text, #111)' }}>{prog.name}</h3>
                        {prog.description && <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{prog.description}</div>}
                        <div style={{ fontSize: 12, color: accent, marginTop: 4, fontWeight: 600 }}>🎁 {prog.reward_description || (prog.reward_type === 'discount' ? `${prog.discount_percent}% хөнгөлөлт` : 'Үнэгүй бүтээгдэхүүн')}</div>
                      </div>
                      <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 6, border: '1px solid #E5E7EB', flexShrink: 0 }}>
                        <QRCodeSVG value={url} size={70} bgColor="#FFFFFF" fgColor="#000000" level="H" />
                      </div>
                    </div>

                    {/* Stamp circles */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                      {Array.from({ length: prog.required_stamps }).map((_, i) => (
                        <div key={i} style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: i < c.current_stamps ? accent : '#F3F4F6',
                          border: i < c.current_stamps ? `2px solid ${accent}` : '2px dashed #D1D5DB',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {i < c.current_stamps && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Progress */}
                    <div style={{ background: '#F3F4F6', borderRadius: 100, height: 6, marginBottom: 10, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: accent, borderRadius: 100, transition: 'width 0.5s' }} />
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#6B7280' }}>{c.current_stamps}/{prog.required_stamps} тамга</span>
                      {c.rewards > 0 && <span style={{ color: '#10B981', fontWeight: 600 }}>🎁 {c.rewards} шагнал</span>}
                      <span style={{ color: '#9CA3AF' }}>Нийт: {c.total_stamps}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* DISCOVER tab */}
      {tab === 'discover' && (
        <>
          {availablePrograms.length === 0 ? (
            <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid var(--border, #E5E7EB)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text, #374151)' }}>Одоогоор программ байхгүй</div>
              <p style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>Дэлгүүр, кофе шоп-уудын loyalty программ удахгүй нэмэгдэнэ</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {availablePrograms.map((prog: any) => {
                const accent = prog.accent_color || ORANGE
                return (
                  <div key={prog.id} style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 20, border: '1px solid var(--border, #E5E7EB)' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                      {prog.logo_url ? (
                        <img src={prog.logo_url} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⭐</div>
                      )}
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text, #111)' }}>{prog.name}</h3>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{prog.required_stamps} тамга = 1 шагнал</div>
                      </div>
                    </div>
                    {prog.description && <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 12px', lineHeight: 1.5 }}>{prog.description}</p>}
                    <div style={{ background: `${accent}10`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: accent, fontWeight: 600 }}>
                      🎁 {prog.reward_description || (prog.reward_type === 'discount' ? `${prog.discount_percent}% хөнгөлөлт` : 'Үнэгүй бүтээгдэхүүн')}
                    </div>
                    <button onClick={() => joinProgram(prog.id)} disabled={joining === prog.id} style={{
                      width: '100%', padding: '10px', background: accent, color: '#fff', border: 'none', borderRadius: 10,
                      fontSize: 14, fontWeight: 600, cursor: joining === prog.id ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: joining === prog.id ? 0.6 : 1,
                    }}>
                      {joining === prog.id ? 'Нэгдэж байна...' : 'Нэгдэх'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
