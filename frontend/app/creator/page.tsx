'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

const STAT_CARDS = [
  { key: 'active_jobs', label: 'Идэвхтэй ажил', icon: '🎯', color: '#FF6B00' },
  { key: 'completed_jobs', label: 'Дууссан ажил', icon: '✅', color: '#10B981' },
  { key: 'total_earned', label: 'Нийт орлого', icon: '💰', color: '#8B5CF6' },
  { key: 'pending_payout', label: 'Хүлээгдэж буй', icon: '⏳', color: '#F59E0B' },
  { key: 'avg_rating', label: 'Дундаж үнэлгээ', icon: '⭐', color: '#EC4899' },
  { key: 'total_jobs', label: 'Нийт ажил', icon: '📊', color: '#3B82F6' },
]

export default function CreatorDashboard() {
  const [earnings, setEarnings] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [liveBookings, setLiveBookings] = useState<any[]>([])
  const [liveJobs, setLiveJobs] = useState<any[]>([])
  const [capabilities, setCapabilities] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Read capabilities from localStorage user
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      setCapabilities(u.creator_capabilities || [])
    } catch {}

    Promise.all([
      apiFetch<any>('/creator/earnings').catch(() => null),
      apiFetch<any[]>('/creator/projects').catch(() => []),
      apiFetch<any[]>('/creator/jobs').catch(() => []),
      apiFetch<any[]>('/creator/live/schedule').catch(() => []),
      apiFetch<any[]>('/creator/live/available').catch(() => []),
    ]).then(([e, p, j, lb, lj]) => {
      setEarnings(e)
      setProjects(Array.isArray(p) ? p : [])
      setJobs(Array.isArray(j) ? j : [])
      setLiveBookings(Array.isArray(lb) ? lb : [])
      setLiveJobs(Array.isArray(lj) ? lj : [])
    }).finally(() => setLoading(false))
  }, [])

  const fmt = (v: number) => v >= 1000 ? `₮${(v / 1000).toFixed(0)}K` : `₮${v}`

  const statusLabel: Record<string, { text: string; color: string }> = {
    open: { text: 'Нээлттэй', color: '#10B981' },
    assigned: { text: 'Хуваарилсан', color: '#3B82F6' },
    in_progress: { text: 'Хийгдэж буй', color: '#FF6B00' },
    submitted: { text: 'Илгээсэн', color: '#8B5CF6' },
    revision: { text: 'Засвар', color: '#F59E0B' },
    approved: { text: 'Батлагдсан', color: '#10B981' },
    completed: { text: 'Дууссан', color: '#6B7280' },
  }

  if (loading) return (
    <div className="p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-[var(--surface)] rounded-xl animate-pulse" />)}
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Creator Dashboard</h1>
          <p className="text-sm text-[var(--text2)]">Контент бүтээх, орлого олох</p>
        </div>
        <a href="/creator/jobs" className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg text-sm font-bold hover:bg-[#E55D00] transition-colors">
          Ажил хайх →
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map(s => (
          <div key={s.key} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-xs font-medium text-[var(--text2)]">{s.label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>
              {earnings ? (
                s.key === 'avg_rating' ? (earnings[s.key] || 0).toFixed(1)
                  : s.key.includes('earned') || s.key.includes('payout') ? fmt(earnings[s.key] || 0)
                  : earnings[s.key] || 0
              ) : '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Capabilities badges */}
      {capabilities.length > 0 && (
        <div className="flex gap-2 mb-6">
          {(capabilities.includes('social') || capabilities.includes('ugc')) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] text-xs font-bold">📱 Сошиал контент</div>
          )}
          {(capabilities.includes('prepress') || capabilities.includes('design')) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] text-xs font-bold">🖨️ Хэвлэлийн эх бэлтгэл</div>
          )}
          {capabilities.includes('live') && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EC4899]/10 text-[#EC4899] text-xs font-bold">📡 Лайв стримэр</div>
          )}
          {capabilities.includes('ai') && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#06B6D4]/10 text-[#06B6D4] text-xs font-bold">🤖 AI контент бүтээгч</div>
          )}
        </div>
      )}

      {/* Live bookings section */}
      {capabilities.includes('live') && (liveBookings.length > 0 || liveJobs.length > 0) && (
        <div className="bg-gradient-to-r from-[#EC4899]/5 to-[#8B5CF6]/5 border border-[#EC4899]/20 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2">📡 Live хуваарь</h2>
            <span className="text-xs text-[var(--text3)]">{liveBookings.length} төлөвлөгдсөн • {liveJobs.length} нээлттэй</span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {[...liveBookings, ...liveJobs].slice(0, 4).map(b => (
              <div key={b.id} className="bg-[var(--surface)] rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-[var(--text)]">{b.title}</div>
                  <div className="text-[10px] text-[var(--text3)]">{b.platform} • {b.duration_minutes} мин • {new Date(b.scheduled_at).toLocaleDateString('mn-MN')}</div>
                </div>
                <div className="text-sm font-bold text-[#EC4899]">₮{Number(b.creator_payout).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two columns */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Active projects */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--text)]">Миний төслүүд</h2>
            <a href="/creator/projects" className="text-xs text-[#FF6B00] hover:underline">Бүгд →</a>
          </div>
          {projects.length === 0 ? (
            <div className="text-center py-8 text-[var(--text3)]">
              <div className="text-3xl mb-2">📂</div>
              <div className="text-sm">Одоогоор төсөл байхгүй</div>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map(p => {
                const st = statusLabel[p.status] || { text: p.status, color: '#6B7280' }
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-[var(--bg)] rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-[var(--text)]">{p.title}</div>
                      <div className="text-xs text-[var(--text3)]">{p.content_type} • ₮{Number(p.creator_payout).toLocaleString()}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ color: st.color, background: st.color + '15' }}>{st.text}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Available jobs */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--text)]">Нээлттэй ажлууд</h2>
            <a href="/creator/jobs" className="text-xs text-[#FF6B00] hover:underline">Бүгд →</a>
          </div>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-[var(--text3)]">
              <div className="text-3xl mb-2">🔍</div>
              <div className="text-sm">Одоогоор нээлттэй ажил байхгүй</div>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map(j => (
                <a key={j.id} href={`/creator/jobs?id=${j.id}`}
                  className="flex items-center justify-between p-3 bg-[var(--bg)] rounded-lg hover:border-[#FF6B00] border border-transparent transition-colors">
                  <div>
                    <div className="text-sm font-medium text-[var(--text)]">{j.title}</div>
                    <div className="text-xs text-[var(--text3)]">{j.content_type} • {j.package}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#FF6B00]">₮{Number(j.creator_payout).toLocaleString()}</div>
                    <div className="text-[10px] text-[var(--text3)]">{j.quantity} ширхэг</div>
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
