'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import CommentThread from '@/components/CommentThread'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  assigned: { label: 'Хүлээгдэж буй', color: '#3B82F6' },
  in_progress: { label: 'Хийгдэж буй', color: '#FF6B00' },
  submitted: { label: 'Илгээсэн', color: '#8B5CF6' },
  revision: { label: 'Засвар хүссэн', color: '#F59E0B' },
  approved: { label: 'Батлагдсан', color: '#10B981' },
  completed: { label: 'Дууссан', color: '#6B7280' },
}

const CONTENT_LABELS: Record<string, string> = {
  poster: 'Постер', flyer: 'Флаер', banner: 'Баннер', social_post: 'Соц.Пост',
  story_reel: 'Story/Reel', logo: 'Лого', brochure: 'Брошур', business_card: 'Нэрийн хуудас',
  menu: 'Цэс', invitation: 'Урилга', video: 'Видео', photo: 'Фото', other: 'Бусад',
}

export default function CreatorProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'active' | 'done'>('active')
  const [detail, setDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    apiFetch<any[]>('/creator/projects')
      .then(d => setProjects(Array.isArray(d) ? d : []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [])

  const activeStatuses = ['assigned', 'in_progress', 'submitted', 'revision']
  const active = projects.filter(p => activeStatuses.includes(p.status))
  const done = projects.filter(p => ['approved', 'completed'].includes(p.status))
  const list = tab === 'active' ? active : done

  const startWork = async (id: string) => {
    try {
      await apiFetch(`/creator/jobs/${id}/start`, { method: 'PATCH' })
      setProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'in_progress' } : p))
      if (detail?.id === id) setDetail((d: any) => d ? { ...d, status: 'in_progress' } : d)
    } catch (e: any) { alert(e.message || 'Алдаа') }
  }

  const openDetail = async (project: any) => {
    setDetail(project)
    // Reload with full data if needed
    setDetailLoading(true)
    try {
      const full = await apiFetch<any>(`/creator/requests/${project.id}`)
      if (full) setDetail(full)
    } catch {}
    setDetailLoading(false)
  }

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Миний төслүүд</h1>
      <p className="text-sm text-[var(--text2)] mb-6">Хүлээн авсан болон дууссан ажлууд</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'active' as const, label: `Идэвхтэй (${active.length})` },
          { key: 'done' as const, label: `Дууссан (${done.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-[#FF6B00] text-white' : 'bg-[var(--surface)] text-[var(--text2)] border border-[var(--border)]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-28 bg-[var(--surface)] rounded-xl animate-pulse" />)}</div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
          <div className="text-4xl mb-3">{tab === 'active' ? '📂' : '✅'}</div>
          <div className="text-sm text-[var(--text3)]">{tab === 'active' ? 'Идэвхтэй төсөл байхгүй' : 'Дууссан төсөл байхгүй'}</div>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(p => {
            const st = STATUS_MAP[p.status] || { label: p.status, color: '#6B7280' }
            return (
              <div key={p.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 cursor-pointer hover:border-[#FF6B00]/40 transition-colors"
                onClick={() => openDetail(p)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: st.color, background: st.color + '15' }}>{st.label}</span>
                      <span className="text-xs text-[var(--text3)]">{CONTENT_LABELS[p.content_type] || p.content_type}</span>
                    </div>
                    <h3 className="text-base font-bold text-[var(--text)]">{p.title}</h3>
                    <p className="text-sm text-[var(--text2)] mt-1 line-clamp-1">{p.description}</p>
                    <div className="flex gap-3 mt-2 text-xs text-[var(--text3)]">
                      <span>👤 {p.customer_name}</span>
                      <span>🔄 Засвар: {p.revision_count}/{p.max_revisions}</span>
                      {p.deadline && <span>📅 {new Date(p.deadline).toLocaleDateString('mn-MN')}</span>}
                      {(p.reference_urls?.length > 0 || p.deliverable_urls?.length > 0) && (
                        <span>📎 {(p.reference_urls?.length || 0) + (p.deliverable_urls?.length || 0)} файл</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <div className="text-lg font-bold text-[#FF6B00]">₮{Number(p.creator_payout).toLocaleString()}</div>
                    <div className="flex gap-2 mt-2">
                      {p.status === 'assigned' && (
                        <button onClick={e => { e.stopPropagation(); startWork(p.id) }}
                          className="px-3 py-1.5 bg-[#FF6B00] text-white rounded-lg text-xs font-bold hover:bg-[#E55D00]">
                          Эхлүүлэх
                        </button>
                      )}
                      {['in_progress', 'revision'].includes(p.status) && (
                        <a href={`/creator/submit?id=${p.id}`} onClick={e => e.stopPropagation()}
                          className="px-3 py-1.5 bg-[#8B5CF6] text-white rounded-lg text-xs font-bold hover:bg-[#7C3AED]">
                          Илгээх
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                {p.status === 'revision' && p.revision_notes && (
                  <div className="mt-3 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg p-3">
                    <div className="text-xs font-bold text-[#F59E0B] mb-1">Засварын тэмдэглэл:</div>
                    <p className="text-sm text-[var(--text)]">{p.revision_notes}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ═══ PROJECT DETAIL MODAL ═══ */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 pt-[5vh] overflow-y-auto" onClick={() => setDetail(null)}>
          <div className="bg-[var(--surface)] rounded-2xl w-full max-w-2xl shadow-2xl my-4" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[var(--surface)] rounded-t-2xl px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {(() => { const st = STATUS_MAP[detail.status] || { label: detail.status, color: '#6B7280' }; return (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ color: st.color, background: st.color + '15' }}>{st.label}</span>
                )})()}
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[var(--text)] truncate">{detail.title}</h2>
                  <div className="text-xs text-[var(--text3)]">{CONTENT_LABELS[detail.content_type] || detail.content_type} · {detail.package}</div>
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="w-8 h-8 rounded-lg bg-[var(--surface2)] flex items-center justify-center text-[var(--text3)] text-lg shrink-0">✕</button>
            </div>

            {detailLoading ? (
              <div className="p-6"><div className="h-40 bg-[var(--surface2)] rounded-xl animate-pulse" /></div>
            ) : (
              <div className="p-6 space-y-5">
                {/* Info grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <InfoCard label="Захиалагч" value={detail.customer_name || '—'} icon="👤" />
                  <InfoCard label="Төлбөр" value={`₮${Number(detail.creator_payout || 0).toLocaleString()}`} icon="💰" color="#FF6B00" />
                  <InfoCard label="Тоо ширхэг" value={`${detail.quantity || 1}`} icon="📦" />
                  <InfoCard label="Засвар" value={`${detail.revision_count || 0}/${detail.max_revisions || 3}`} icon="🔄" />
                </div>

                {detail.deadline && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface2)] text-sm">
                    <span>📅</span>
                    <span className="text-[var(--text2)]">Хугацаа:</span>
                    <span className="font-medium text-[var(--text)]">{new Date(detail.deadline).toLocaleDateString('mn-MN')}</span>
                    {new Date(detail.deadline) < new Date() && (
                      <span className="text-xs font-bold text-[#EF4444] ml-2">⚠ Хугацаа дууссан</span>
                    )}
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)] mb-2">📝 Тайлбар / Шаардлага</h3>
                  <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 text-sm text-[var(--text2)] leading-relaxed whitespace-pre-wrap">
                    {detail.description || 'Тайлбар байхгүй'}
                  </div>
                </div>

                {/* Brand notes */}
                {detail.brand_notes && (
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text)] mb-2">🎨 Брэндийн зааварчилгаа</h3>
                    <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-4 text-sm text-[#92400E] leading-relaxed whitespace-pre-wrap">
                      {detail.brand_notes}
                    </div>
                  </div>
                )}

                {/* Reference files (from customer) */}
                {detail.reference_urls?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text)] mb-2">📁 Захиалагчийн файлууд ({detail.reference_urls.length})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {detail.reference_urls.map((url: string, i: number) => (
                        <FileCard key={i} url={url} index={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Deliverables (creator submitted) */}
                {detail.deliverable_urls?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text)] mb-2">✅ Илгээсэн бүтээлүүд ({detail.deliverable_urls.length})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {detail.deliverable_urls.map((url: string, i: number) => (
                        <FileCard key={i} url={url} index={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Final files */}
                {detail.final_file_urls?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text)] mb-2">🏁 Эцсийн файлууд ({detail.final_file_urls.length})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {detail.final_file_urls.map((url: string, i: number) => (
                        <FileCard key={i} url={url} index={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Prepress specs */}
                {detail.prepress_specs && (
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text)] mb-2">🖨️ Хэвлэлийн тохиргоо</h3>
                    <div className="bg-[var(--surface2)] rounded-xl p-4 text-sm text-[var(--text2)] font-mono whitespace-pre-wrap">
                      {detail.prepress_specs}
                    </div>
                  </div>
                )}

                {/* Revision notes */}
                {detail.status === 'revision' && detail.revision_notes && (
                  <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-[#F59E0B] mb-1">⚠ Засварын тэмдэглэл</h3>
                    <p className="text-sm text-[var(--text)]">{detail.revision_notes}</p>
                  </div>
                )}

                {/* Zoom info */}
                {detail.zoom_join_url && (
                  <div className="bg-[#3B82F6]/8 border border-[#3B82F6]/20 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-[#3B82F6] mb-2">📹 Zoom уулзалт</h3>
                    <div className="flex items-center gap-3">
                      <a href={detail.zoom_join_url} target="_blank" rel="noreferrer"
                        className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg text-xs font-bold hover:bg-[#2563EB]">
                        Zoom нэгдэх
                      </a>
                      {detail.zoom_password && <span className="text-xs text-[var(--text3)]">Нууц: {detail.zoom_password}</span>}
                      {detail.zoom_scheduled_at && <span className="text-xs text-[var(--text3)]">📅 {new Date(detail.zoom_scheduled_at).toLocaleString('mn-MN')}</span>}
                    </div>
                  </div>
                )}

                {/* Comment thread */}
                <div className="border border-[var(--border)] rounded-xl overflow-hidden" style={{ minHeight: 250, maxHeight: 400, display: 'flex', flexDirection: 'column' }}>
                  <CommentThread orderId={detail.id} currentRole="creator"
                    currentUserName={(() => { try { return JSON.parse(localStorage.getItem('user') || '{}').full_name || 'Creator' } catch { return 'Creator' } })()} />
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2 border-t border-[var(--border)]">
                  {detail.status === 'assigned' && (
                    <button onClick={() => { startWork(detail.id) }}
                      className="flex-1 py-3 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#E55D00] transition-colors">
                      Ажил эхлүүлэх
                    </button>
                  )}
                  {['in_progress', 'revision'].includes(detail.status) && (
                    <a href={`/creator/submit?id=${detail.id}`}
                      className="flex-1 py-3 bg-[#8B5CF6] text-white rounded-xl text-sm font-bold text-center hover:bg-[#7C3AED] transition-colors">
                      Контент илгээх
                    </a>
                  )}
                  <button onClick={() => setDetail(null)}
                    className="px-6 py-3 bg-[var(--surface2)] text-[var(--text2)] rounded-xl text-sm font-medium">
                    Хаах
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Helper components ── */

function InfoCard({ label, value, icon, color }: { label: string; value: string; icon: string; color?: string }) {
  return (
    <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] text-[var(--text3)]">{label}</span>
      </div>
      <div className="text-sm font-bold" style={{ color: color || 'var(--text)' }}>{value}</div>
    </div>
  )
}

function FileCard({ url, index }: { url: string; index: number }) {
  const name = getFileName(url)
  const img = isImage(url)
  const pdf = isPdf(url)

  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="group block rounded-xl border border-[var(--border)] overflow-hidden hover:border-[#FF6B00]/40 transition-colors">
      {img ? (
        <div className="aspect-video bg-[var(--surface2)] relative">
          <img src={url} alt={name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">Нээх ↗</span>
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-[var(--surface2)] flex flex-col items-center justify-center">
          <span className="text-2xl mb-1">{pdf ? '📄' : '📎'}</span>
          <span className="text-[10px] text-[var(--text3)] px-2 text-center truncate max-w-full">{name}</span>
        </div>
      )}
      <div className="px-2.5 py-2 flex items-center justify-between">
        <span className="text-[10px] text-[var(--text2)] truncate">{name}</span>
        <span className="text-[9px] text-[#FF6B00] shrink-0 ml-1">↗</span>
      </div>
    </a>
  )
}

function getFileName(url: string) {
  try { return decodeURIComponent(url.split('/').pop()?.split('?')[0] || `Файл`) } catch { return 'Файл' }
}

function isImage(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.split('?')[0])
}

function isPdf(url: string) {
  return /\.pdf$/i.test(url.split('?')[0])
}
