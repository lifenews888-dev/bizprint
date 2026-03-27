'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

export default function CreatorEarningsPage() {
  const [earnings, setEarnings] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch<any>('/creator/earnings').catch(() => null),
      apiFetch<any[]>('/creator/projects').catch(() => []),
    ]).then(([e, p]) => {
      setEarnings(e)
      setProjects(Array.isArray(p) ? p : [])
    }).finally(() => setLoading(false))
  }, [])

  const completed = projects.filter(p => p.status === 'completed')
  const pending = projects.filter(p => ['approved', 'submitted'].includes(p.status))

  if (loading) return (
    <div className="p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-[var(--surface)] rounded-xl animate-pulse" />)}
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Орлого</h1>
      <p className="text-sm text-[var(--text2)] mb-6">Таны контент бүтээлийн орлого, төлбөр</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Нийт олсон', value: `₮${(earnings?.total_earned || 0).toLocaleString()}`, icon: '💰', color: '#10B981' },
          { label: 'Хүлээгдэж буй', value: `₮${(earnings?.pending_payout || 0).toLocaleString()}`, icon: '⏳', color: '#F59E0B' },
          { label: 'Дууссан ажил', value: earnings?.completed_jobs || 0, icon: '✅', color: '#3B82F6' },
          { label: 'Дундаж үнэлгээ', value: `${(earnings?.avg_rating || 0).toFixed(1)} ⭐`, icon: '⭐', color: '#EC4899' },
        ].map((s, i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-xs text-[var(--text3)] mb-1">{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Withdraw button */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-[var(--text)]">Хэтэвч руу шилжүүлэх</div>
            <div className="text-xs text-[var(--text3)]">Батлагдсан орлогоо хэтэвч рүү шилжүүлж, мөнгө авна</div>
          </div>
          <a href="/dashboard/customer/wallet"
            className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg text-sm font-bold hover:bg-[#E55D00]">
            Хэтэвч →
          </a>
        </div>
      </div>

      {/* Recent payouts */}
      <h2 className="text-lg font-bold text-[var(--text)] mb-4">Сүүлийн гүйлгээнүүд</h2>
      {completed.length === 0 && pending.length === 0 ? (
        <div className="text-center py-12 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-sm text-[var(--text3)]">Одоогоор гүйлгээ байхгүй</div>
        </div>
      ) : (
        <div className="space-y-3">
          {[...pending, ...completed].map(p => (
            <div key={p.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[var(--text)]">{p.title}</div>
                <div className="text-xs text-[var(--text3)]">{p.content_type} • {p.customer_name}</div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-[#FF6B00]">₮{Number(p.creator_payout).toLocaleString()}</div>
                <div className="text-[10px]" style={{ color: p.status === 'completed' ? '#10B981' : '#F59E0B' }}>
                  {p.status === 'completed' ? 'Олгогдсон' : 'Хүлээгдэж буй'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
