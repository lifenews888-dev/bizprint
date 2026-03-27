'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Хүлээгдэж буй', color: '#F59E0B' },
  confirmed: { label: 'Баталгаажсан', color: '#3B82F6' },
  in_progress: { label: 'Live явагдаж буй', color: '#EF4444' },
  completed: { label: 'Дууссан', color: '#10B981' },
  cancelled: { label: 'Цуцалсан', color: '#6B7280' },
}

export default function CreatorLivePage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [available, setAvailable] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'schedule' | 'available'>('schedule')

  useEffect(() => {
    Promise.all([
      apiFetch<any[]>('/creator/live/schedule').catch(() => []),
      apiFetch<any[]>('/creator/live/available').catch(() => []),
    ]).then(([s, a]) => {
      setBookings(Array.isArray(s) ? s : [])
      setAvailable(Array.isArray(a) ? a : [])
    }).finally(() => setLoading(false))
  }, [])

  const acceptBooking = async (id: string) => {
    try {
      await apiFetch(`/creator/live/${id}/accept`, { method: 'PATCH' })
      setAvailable(prev => prev.filter(b => b.id !== id))
      const updated = await apiFetch<any[]>('/creator/live/schedule').catch(() => [])
      setBookings(Array.isArray(updated) ? updated : bookings)
    } catch (e: any) { alert(e.message || 'Алдаа') }
  }

  const list = tab === 'schedule' ? bookings : available

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Live хуваарь</h1>
      <p className="text-sm text-[var(--text2)] mb-6">Live борлуулалтын хуваарь, захиалга</p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('schedule')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'schedule' ? 'bg-[#EC4899] text-white' : 'bg-[var(--surface)] text-[var(--text2)] border border-[var(--border)]'}`}>
          Миний хуваарь ({bookings.length})
        </button>
        <button onClick={() => setTab('available')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'available' ? 'bg-[#FF6B00] text-white' : 'bg-[var(--surface)] text-[var(--text2)] border border-[var(--border)]'}`}>
          Нээлттэй ({available.length})
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-[var(--surface)] rounded-xl animate-pulse" />)}</div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
          <div className="text-4xl mb-3">{tab === 'schedule' ? '📡' : '🔍'}</div>
          <div className="text-sm text-[var(--text3)]">{tab === 'schedule' ? 'Төлөвлөсөн Live байхгүй' : 'Нээлттэй Live захиалга байхгүй'}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(b => {
            const st = STATUS_MAP[b.status] || { label: b.status, color: '#6B7280' }
            return (
              <div key={b.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: st.color, background: st.color + '15' }}>{st.label}</span>
                      <span className="text-xs text-[var(--text3)]">{b.platform}</span>
                    </div>
                    <h3 className="text-base font-bold text-[var(--text)]">{b.title}</h3>
                    <div className="flex gap-3 mt-2 text-xs text-[var(--text3)]">
                      <span>📅 {b.scheduled_at ? new Date(b.scheduled_at).toLocaleString('mn-MN') : '—'}</span>
                      <span>⏱ {b.duration_minutes} мин</span>
                      {b.customer_name && <span>👤 {b.customer_name}</span>}
                    </div>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <div className="text-lg font-bold text-[#EC4899]">₮{Number(b.creator_payout || 0).toLocaleString()}</div>
                    {tab === 'available' && (
                      <button onClick={() => acceptBooking(b.id)}
                        className="mt-2 px-3 py-1.5 bg-[#FF6B00] text-white rounded-lg text-xs font-bold hover:bg-[#E55D00]">
                        Хүлээн авах
                      </button>
                    )}
                    {b.status === 'confirmed' && b.stream_url && (
                      <a href={b.stream_url} target="_blank" rel="noreferrer"
                        className="mt-2 inline-block px-3 py-1.5 bg-[#EF4444] text-white rounded-lg text-xs font-bold">
                        🔴 Live эхлэх
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
