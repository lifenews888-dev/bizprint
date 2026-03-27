'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

const CONTENT_LABELS: Record<string, string> = {
  poster: 'Постер', flyer: 'Флаер', banner: 'Баннер', social_post: 'Соц.Пост',
  story_reel: 'Story/Reel', logo: 'Лого', brochure: 'Брошур', business_card: 'Нэрийн хуудас',
  menu: 'Цэс', invitation: 'Урилга', video: 'Видео', photo: 'Фото', other: 'Бусад',
}

const PKG_LABELS: Record<string, { label: string; color: string }> = {
  starter: { label: 'Starter', color: '#10B981' },
  growth: { label: 'Growth', color: '#3B82F6' },
  pro: { label: 'Pro', color: '#8B5CF6' },
  custom: { label: 'Custom', color: '#FF6B00' },
}

export default function CreatorJobsPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [selected, setSelected] = useState<any>(null)

  const load = () => {
    apiFetch<any[]>('/creator/jobs').then(d => setJobs(Array.isArray(d) ? d : []))
      .catch(() => setJobs([])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const acceptJob = async (id: string) => {
    setAccepting(id)
    try {
      await apiFetch(`/creator/jobs/${id}/accept`, { method: 'PATCH' })
      load()
      setSelected(null)
    } catch (e: any) {
      alert(e.message || 'Алдаа гарлаа')
    }
    setAccepting(null)
  }

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Нээлттэй ажлууд</h1>
          <p className="text-sm text-[var(--text2)]">Контент бүтээх ажлууд — сонгоод эхлээрэй</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-[var(--surface)] rounded-xl animate-pulse" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-lg font-bold text-[var(--text)] mb-1">Одоогоор нээлттэй ажил байхгүй</div>
          <p className="text-sm text-[var(--text3)]">Шинэ ажлууд нэмэгдэхэд мэдэгдэл ирнэ</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(j => {
            const pkg = PKG_LABELS[j.package] || PKG_LABELS.custom
            return (
              <div key={j.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:border-[#FF6B00] transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: pkg.color, background: pkg.color + '15' }}>{pkg.label}</span>
                      <span className="text-xs text-[var(--text3)]">{CONTENT_LABELS[j.content_type] || j.content_type}</span>
                    </div>
                    <h3 className="text-base font-bold text-[var(--text)] mb-1">{j.title}</h3>
                    <p className="text-sm text-[var(--text2)] line-clamp-2 mb-2">{j.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--text3)]">
                      <span>📦 {j.quantity} ширхэг</span>
                      {j.deadline && <span>📅 {new Date(j.deadline).toLocaleDateString('mn-MN')}</span>}
                      <span>🔄 Засвар: {j.max_revisions} хүртэл</span>
                      <span>👤 {j.customer_name}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-xl font-bold text-[#FF6B00]">₮{Number(j.creator_payout).toLocaleString()}</div>
                    <div className="text-[10px] text-[var(--text3)] mb-3">Таны орлого</div>
                    <button onClick={() => setSelected(j)}
                      className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg text-sm font-bold hover:bg-[#E55D00] transition-colors">
                      Дэлгэрэнгүй
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Job detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-[var(--surface)] rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text)]">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-[var(--text3)] hover:text-[var(--text)] text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--text2)] uppercase">Тайлбар</label>
                <p className="text-sm text-[var(--text)] mt-1">{selected.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--bg)] rounded-lg p-3">
                  <div className="text-xs text-[var(--text3)]">Төрөл</div>
                  <div className="text-sm font-bold text-[var(--text)]">{CONTENT_LABELS[selected.content_type]}</div>
                </div>
                <div className="bg-[var(--bg)] rounded-lg p-3">
                  <div className="text-xs text-[var(--text3)]">Багц</div>
                  <div className="text-sm font-bold text-[var(--text)]">{PKG_LABELS[selected.package]?.label}</div>
                </div>
                <div className="bg-[var(--bg)] rounded-lg p-3">
                  <div className="text-xs text-[var(--text3)]">Тоо ширхэг</div>
                  <div className="text-sm font-bold text-[var(--text)]">{selected.quantity}</div>
                </div>
                <div className="bg-[var(--bg)] rounded-lg p-3">
                  <div className="text-xs text-[var(--text3)]">Хугацаа</div>
                  <div className="text-sm font-bold text-[var(--text)]">{selected.deadline ? new Date(selected.deadline).toLocaleDateString('mn-MN') : 'Тодорхойгүй'}</div>
                </div>
              </div>

              {selected.brand_notes && (
                <div>
                  <label className="text-xs font-bold text-[var(--text2)] uppercase">Брэнд удирдамж</label>
                  <p className="text-sm text-[var(--text)] mt-1 bg-[var(--bg)] rounded-lg p-3">{selected.brand_notes}</p>
                </div>
              )}

              <div className="bg-[#FF6B00]/5 border border-[#FF6B00]/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[#FF6B00]">₮{Number(selected.creator_payout).toLocaleString()}</div>
                <div className="text-xs text-[var(--text3)]">Ажил хийж дуусгасны дараа олох орлого</div>
              </div>

              <button onClick={() => acceptJob(selected.id)} disabled={!!accepting}
                className="w-full py-3 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#E55D00] transition-colors disabled:opacity-50">
                {accepting === selected.id ? 'Хүлээнэ үү...' : 'Ажлыг хүлээн авах'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
