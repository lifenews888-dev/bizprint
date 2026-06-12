'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

/* ═══════════════════════════════════════
 *  Creator Dashboard Content
 *  Reusable — used both in /creator and
 *  inline in /dashboard when in creator mode
 * ═══════════════════════════════════════ */

interface CreatorUser {
  id?: string
  creator_capabilities?: unknown
}

interface CreatorEarnings {
  active_jobs?: number
  completed_jobs?: number
  total_earned?: number
  pending_payout?: number
  avg_rating?: number
  total_jobs?: number
}

interface CreatorProject {
  id: string
  title?: string
  status: string
  content_type?: string
  creator_payout?: number | string
}

interface CreatorJob {
  id: string
  title?: string
  content_type?: string
  package?: string
  creator_payout?: number | string
  quantity?: number | string
}

interface LiveBooking {
  id: string
  title?: string
  platform?: string
  duration_minutes?: number | string
  scheduled_at: string
  creator_payout?: number | string
}

interface CreatorScoreData {
  score?: number
  level?: string
  breakdown?: {
    rating?: number
    performance?: number
    activity?: number
  }
}

interface RankData {
  rankScore?: number
}

interface LeaderboardEntry {
  creator_id: string
  name?: string
  completedJobs?: number
  totalEarned?: number
  rankScore?: number
}

function readCreatorCapabilities(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem('user') || '{}')
    const user = parsed && typeof parsed === 'object' ? parsed as CreatorUser : {}
    return Array.isArray(user.creator_capabilities)
      ? user.creator_capabilities.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return []
  }
}

const STAT_CARDS: Array<{ key: keyof CreatorEarnings; label: string; icon: string; color: string }> = [
  { key: 'active_jobs', label: 'Идэвхтэй ажил', icon: '🎯', color: '#FF6B00' },
  { key: 'completed_jobs', label: 'Дууссан ажил', icon: '✅', color: '#10B981' },
  { key: 'total_earned', label: 'Нийт орлого', icon: '💰', color: '#8B5CF6' },
  { key: 'pending_payout', label: 'Хүлээгдэж буй', icon: '⏳', color: '#F59E0B' },
  { key: 'avg_rating', label: 'Дундаж үнэлгээ', icon: '⭐', color: '#EC4899' },
  { key: 'total_jobs', label: 'Нийт ажил', icon: '📊', color: '#3B82F6' },
]

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  open: { text: 'Нээлттэй', color: '#10B981' },
  assigned: { text: 'Хуваарилсан', color: '#3B82F6' },
  in_progress: { text: 'Хийгдэж буй', color: '#FF6B00' },
  submitted: { text: 'Илгээсэн', color: '#8B5CF6' },
  revision: { text: 'Засвар', color: '#F59E0B' },
  approved: { text: 'Батлагдсан', color: '#10B981' },
  completed: { text: 'Дууссан', color: '#6B7280' },
}

export default function CreatorDashboardContent() {
  const [earnings, setEarnings] = useState<CreatorEarnings | null>(null)
  const [projects, setProjects] = useState<CreatorProject[]>([])
  const [jobs, setJobs] = useState<CreatorJob[]>([])
  const [liveBookings, setLiveBookings] = useState<LiveBooking[]>([])
  const [liveJobs, setLiveJobs] = useState<LiveBooking[]>([])
  const [capabilities] = useState<string[]>(() => readCreatorCapabilities())
  const [loading, setLoading] = useState(true)
  const [scoreData, setScoreData] = useState<CreatorScoreData | null>(null)
  const [rankData, setRankData] = useState<RankData | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    Promise.all([
      apiFetch<CreatorEarnings>('/creator/earnings').catch(() => null),
      apiFetch<CreatorProject[]>('/creator/projects').catch(() => []),
      apiFetch<CreatorJob[]>('/creator/jobs').catch(() => []),
      apiFetch<LiveBooking[]>('/creator/live/schedule').catch(() => []),
      apiFetch<LiveBooking[]>('/creator/live/available').catch(() => []),
      apiFetch<CreatorScoreData>('/creator/score').catch(() => null),
      apiFetch<RankData>('/creator/rank').catch(() => null),
      apiFetch<LeaderboardEntry[]>('/creator/leaderboard?limit=5').catch(() => []),
    ]).then(([e, p, j, lb, lj, sc, rk, ld]) => {
      setEarnings(e)
      setProjects(Array.isArray(p) ? p : [])
      setJobs(Array.isArray(j) ? j : [])
      setLiveBookings(Array.isArray(lb) ? lb : [])
      setLiveJobs(Array.isArray(lj) ? lj : [])
      if (sc) setScoreData(sc)
      if (rk) setRankData(rk)
      if (Array.isArray(ld)) setLeaderboard(ld)
    }).finally(() => setLoading(false))
  }, [])

  const fmt = (v: number) => v >= 1000 ? `₮${(v / 1000).toFixed(0)}K` : `₮${v}`

  if (loading) return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 112, background: 'var(--surface)', borderRadius: 12 }} className="animate-pulse" />)}
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0, fontFamily: "'DM Sans',sans-serif" }}>Creator Dashboard</h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', margin: '4px 0 0', fontFamily: "'DM Sans',sans-serif" }}>Контент бүтээх, орлого олох</p>
        </div>
        <a href="/creator/jobs" style={{ padding: '8px 16px', background: '#FF6B00', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: "'DM Sans',sans-serif" }}>
          Ажил хайх →
        </a>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {STAT_CARDS.map(s => (
          <div key={s.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', fontFamily: "'DM Sans',sans-serif" }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "'DM Sans',sans-serif" }}>
              {earnings ? (
                s.key === 'avg_rating' ? (earnings[s.key] || 0).toFixed(1)
                  : s.key.includes('earned') || s.key.includes('payout') ? fmt(earnings[s.key] || 0)
                  : earnings[s.key] || 0
              ) : '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Capabilities */}
      {capabilities.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {(capabilities.includes('social') || capabilities.includes('ugc')) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 99, background: 'rgba(255,107,0,0.1)', color: '#FF6B00', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>📱 Сошиал контент</span>
          )}
          {(capabilities.includes('prepress') || capabilities.includes('design')) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 99, background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>🖨️ Хэвлэлийн эх бэлтгэл</span>
          )}
          {capabilities.includes('live') && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 99, background: 'rgba(236,72,153,0.1)', color: '#EC4899', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>📡 Лайв стримэр</span>
          )}
          {capabilities.includes('ai') && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 99, background: 'rgba(6,182,212,0.1)', color: '#06B6D4', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>🤖 AI контент</span>
          )}
        </div>
      )}

      {/* Rank & Score card */}
      {(scoreData || rankData) && (
        <div style={{ display: 'grid', gridTemplateColumns: leaderboard.length > 0 ? '1fr 1fr' : '1fr', gap: 24, marginBottom: 24 }}>
          {/* My score */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0, fontFamily: "'DM Sans',sans-serif" }}>Миний оноо</h3>
              {(() => {
                const level = scoreData?.level || 'starter'
                const colors: Record<string, string> = { starter: '#6B7280', pro: '#3B82F6', expert: '#8B5CF6', elite: '#FF6B00' }
                return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: (colors[level] || '#6B7280') + '15', color: colors[level] || '#6B7280' }}>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
              })()}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', fontFamily: "'DM Sans',sans-serif" }}>{scoreData?.score || 0}</span>
              <span style={{ fontSize: 14, color: 'var(--text3)' }}>/100</span>
            </div>
            {/* Score bar */}
            <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ height: '100%', width: `${scoreData?.score || 0}%`, background: '#FF6B00', borderRadius: 4 }} />
            </div>
            {/* Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: '⭐ Үнэлгээ', value: scoreData?.breakdown?.rating || 0, max: 100, color: '#F59E0B' },
                { label: '⚡ Гүйцэтгэл', value: scoreData?.breakdown?.performance || 0, max: 100, color: '#10B981' },
                { label: '📊 Идэвх', value: scoreData?.breakdown?.activity || 0, max: 100, color: '#3B82F6' },
              ].map(m => (
                <div key={m.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4, fontFamily: "'DM Sans',sans-serif" }}>{m.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: m.color, fontFamily: "'DM Sans',sans-serif" }}>{m.value}</div>
                  <div style={{ height: 3, background: 'var(--surface2)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${m.value}%`, background: m.color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
            {rankData && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,107,0,0.06)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text2)', fontFamily: "'DM Sans',sans-serif" }}>Долоо хоногийн rank оноо</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#FF6B00', fontFamily: "'DM Sans',sans-serif" }}>{rankData.rankScore}/100</span>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 16px', fontFamily: "'DM Sans',sans-serif" }}>🏆 Шилдэг Creators</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {leaderboard.map((c, i) => {
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`
                  const isMe = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}').id === c.creator_id } catch { return false } })()
                  return (
                    <div key={c.creator_id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8,
                      background: isMe ? 'rgba(255,107,0,0.08)' : 'var(--bg)',
                      border: isMe ? '1px solid rgba(255,107,0,0.2)' : '1px solid transparent',
                    }}>
                      <span style={{ fontSize: i < 3 ? 18 : 12, width: 24, textAlign: 'center', fontWeight: 700, color: i >= 3 ? 'var(--text3)' : undefined }}>{medal}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: isMe ? 700 : 500, color: isMe ? '#FF6B00' : 'var(--text)', fontFamily: "'DM Sans',sans-serif" }}>
                          {c.name} {isMe && <span style={{ fontSize: 9, color: '#FF6B00' }}>(Та)</span>}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Sans',sans-serif" }}>
                          {c.completedJobs} ажил · ₮{(c.totalEarned || 0).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: "'DM Sans',sans-serif" }}>{c.rankScore}</div>
                        <div style={{ fontSize: 9, color: 'var(--text3)' }}>оноо</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live bookings */}
      {capabilities.includes('live') && (liveBookings.length > 0 || liveJobs.length > 0) && (
        <div style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.05), rgba(139,92,246,0.05))', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0, fontFamily: "'DM Sans',sans-serif" }}>📡 Live хуваарь</h2>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Sans',sans-serif" }}>{liveBookings.length} төлөвлөгдсөн • {liveJobs.length} нээлттэй</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {[...liveBookings, ...liveJobs].slice(0, 4).map(b => (
              <div key={b.id} style={{ background: 'var(--surface)', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: "'DM Sans',sans-serif" }}>{b.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Sans',sans-serif" }}>{b.platform} • {b.duration_minutes} мин • {new Date(b.scheduled_at).toLocaleDateString('mn-MN')}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#EC4899', fontFamily: "'DM Sans',sans-serif" }}>₮{Number(b.creator_payout).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {/* Active projects */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0, fontFamily: "'DM Sans',sans-serif" }}>Миний төслүүд</h2>
            <a href="/creator/projects" style={{ fontSize: 12, color: '#FF6B00', textDecoration: 'none', fontFamily: "'DM Sans',sans-serif" }}>Бүгд →</a>
          </div>
          {projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
              <div style={{ fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>Одоогоор төсөл байхгүй</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {projects.slice(0, 5).map(p => {
                const st = STATUS_LABEL[p.status] || { text: p.status, color: '#6B7280' }
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: "'DM Sans',sans-serif" }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Sans',sans-serif" }}>{p.content_type} • ₮{Number(p.creator_payout).toLocaleString()}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 99, color: st.color, background: st.color + '15', fontFamily: "'DM Sans',sans-serif" }}>{st.text}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Available jobs */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0, fontFamily: "'DM Sans',sans-serif" }}>Нээлттэй ажлууд</h2>
            <a href="/creator/jobs" style={{ fontSize: 12, color: '#FF6B00', textDecoration: 'none', fontFamily: "'DM Sans',sans-serif" }}>Бүгд →</a>
          </div>
          {jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>Одоогоор нээлттэй ажил байхгүй</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {jobs.slice(0, 5).map(j => (
                <a key={j.id} href={`/creator/jobs?id=${j.id}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--bg)', borderRadius: 8, textDecoration: 'none', border: '1px solid transparent' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: "'DM Sans',sans-serif" }}>{j.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Sans',sans-serif" }}>{j.content_type} • {j.package}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FF6B00', fontFamily: "'DM Sans',sans-serif" }}>₮{Number(j.creator_payout).toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Sans',sans-serif" }}>{j.quantity} ширхэг</div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
