'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

/* ═══════════════════════════════════════
 *  CONSTANTS
 * ═══════════════════════════════════════ */

const SKILL_LABELS: Record<string, string> = {
  graphic_design: 'График дизайн', illustration: 'Зураг', photo: 'Гэрэл зураг',
  video: 'Видео', motion: 'Motion', branding: 'Брэндинг',
  social_media: 'Соц.Медиа', print_design: 'Хэвлэл дизайн',
}

const UGC_STATUS: Record<string, { label: string; color: string }> = {
  open: { label: 'Нээлттэй', color: '#10B981' },
  assigned: { label: 'Creator олдсон', color: '#3B82F6' },
  in_progress: { label: 'Хийгдэж буй', color: '#FF6B00' },
  submitted: { label: 'Шалгуулахаар', color: '#8B5CF6' },
  revision: { label: 'Засвар', color: '#F59E0B' },
  approved: { label: 'Батлагдсан', color: '#10B981' },
  completed: { label: 'Дууссан', color: '#6B7280' },
  cancelled: { label: 'Цуцалсан', color: '#EF4444' },
}

const APP_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Хүлээгдэж буй', color: '#F59E0B' },
  approved: { label: 'Батлагдсан', color: '#10B981' },
  rejected: { label: 'Татгалзсан', color: '#EF4444' },
}

const CONTENT_ICONS: Record<string, string> = {
  poster: '🖼️', flyer: '📄', banner: '🪧', social_post: '📸', story_reel: '📱',
  logo: '💎', brochure: '📰', business_card: '🪪', menu: '🍽️', video: '🎬',
}

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  starter: { label: 'Starter', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  pro:     { label: 'Pro',     color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  expert:  { label: 'Expert',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  elite:   { label: 'Elite',   color: '#FF6B00', bg: 'rgba(255,107,0,0.12)' },
}

const LEVELS = ['starter', 'pro', 'expert', 'elite'] as const

/* ═══════════════════════════════════════
 *  MAIN PAGE
 * ═══════════════════════════════════════ */

type MainTab = 'overview' | 'ugc' | 'creators' | 'analytics' | 'visibility'
type CreatorLevel = typeof LEVELS[number]

interface CreatorApplication {
  id: string
  status: string
  level?: CreatorLevel
  name?: string
  email?: string
  skills?: string[]
  portfolio?: string[]
  completedJobs?: number
  avgRating?: number
  totalEarned?: number
  user?: { name?: string; email?: string }
}

interface UgcRequest {
  id: string
  status: string
  title?: string
  contentType?: string
  budget?: number
  payout?: number
  package?: string
  description?: string
  customer?: { name?: string }
  creator?: { name?: string }
}

export default function AdminCreatorsPage() {
  const [mainTab, setMainTab] = useState<MainTab>('overview')
  const [applications, setApplications] = useState<CreatorApplication[]>([])
  const [allApplications, setAllApplications] = useState<CreatorApplication[]>([])
  const [ugcRequests, setUgcRequests] = useState<UgcRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedUgc, setSelectedUgc] = useState<UgcRequest | null>(null)

  // Sub-filters
  const [ugcFilter, setUgcFilter] = useState('all')
  const [creatorFilter, setCreatorFilter] = useState('pending')

  // Level assignment
  const [levelModal, setLevelModal] = useState<CreatorApplication | null>(null)
  const [newLevel, setNewLevel] = useState('')

  // Visibility
  const [visibilitySettings, setVisibilitySettings] = useState({
    showOnMarketplace: true,
    allowDirectHire: true,
    showRatings: true,
    showEarnings: false,
    showCompletedJobs: true,
    minLevelForMarketplace: 'starter' as string,
    requirePortfolio: true,
    minPortfolioItems: 3,
  })

  const loadData = () => {
    setLoading(true)
    Promise.all([
      apiFetch<CreatorApplication[]>('/creator/applications').catch(() => []),
      apiFetch<CreatorApplication[]>('/creator/applications?status=pending').catch(() => []),
      apiFetch<UgcRequest[]>('/creator/all-requests').catch(() => []),
    ]).then(([allApps, pendingApps, reqs]) => {
      setAllApplications(Array.isArray(allApps) ? allApps : [])
      setApplications(Array.isArray(pendingApps) ? pendingApps : [])
      setUgcRequests(Array.isArray(reqs) ? reqs : [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = window.setTimeout(() => loadData(), 0)
    return () => window.clearTimeout(timer)
  }, [])

  // Reload filtered applications when filter changes
  useEffect(() => {
    const timer = window.setTimeout(() => {
    if (creatorFilter === 'all') {
      setApplications(allApplications)
    } else {
      apiFetch<CreatorApplication[]>(`/creator/applications?status=${creatorFilter}`)
        .then(d => setApplications(Array.isArray(d) ? d : []))
        .catch(() => setApplications([]))
    }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [creatorFilter, allApplications])

  /* ── Actions ── */
  const handleApprove = async (id: string) => {
    setProcessing(true)
    try {
      await apiFetch(`/creator/applications/${id}/approve`, { method: 'PATCH' })
      loadData()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : ''
      alert(message || 'Алдаа')
    }
    setProcessing(false)
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Татгалзах шалтгаан:')
    if (!reason) return
    setProcessing(true)
    try {
      await apiFetch(`/creator/applications/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) })
      loadData()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : ''
      alert(message || 'Алдаа')
    }
    setProcessing(false)
  }

  const handleAssignLevel = async () => {
    if (!levelModal || !newLevel) return
    setProcessing(true)
    try {
      await apiFetch(`/creator/applications/${levelModal.id}/level`, {
        method: 'PATCH',
        body: JSON.stringify({ level: newLevel }),
      })
      loadData()
      setLevelModal(null)
      setNewLevel('')
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : ''
      alert(message || 'Алдаа')
    }
    setProcessing(false)
  }

  const handleReleasePayment = async (id: string) => {
    setProcessing(true)
    try {
      await apiFetch(`/creator/requests/${id}/release-payment`, { method: 'POST' })
      loadData()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : ''
      alert(message || 'Алдаа')
    }
    setProcessing(false)
  }

  /* ── Computed ── */
  const approvedCreators = allApplications.filter(a => a.status === 'approved')
  const pendingCount = allApplications.filter(a => a.status === 'pending').length
  const ugcByStatus = Object.keys(UGC_STATUS).reduce((acc, s) => {
    acc[s] = ugcRequests.filter(r => r.status === s).length; return acc
  }, {} as Record<string, number>)
  const totalRevenue = ugcRequests.filter(r => r.status === 'completed').reduce((sum, r) => sum + Number(r.budget || 0), 0)
  const totalPayouts = ugcRequests.filter(r => ['completed', 'approved'].includes(r.status)).reduce((sum, r) => sum + (Number(r.payout || 0) || Number(r.budget || 0) * 0.7), 0)

  const filteredUgc = ugcFilter === 'all'
    ? ugcRequests
    : ugcRequests.filter(r => r.status === ugcFilter)

  /* ── Tab config ── */
  const TABS: { key: MainTab; label: string; badge?: number }[] = [
    { key: 'overview', label: 'Тойм' },
    { key: 'ugc', label: 'UGC контент', badge: ugcRequests.length },
    { key: 'creators', label: 'Creators', badge: pendingCount || undefined },
    { key: 'analytics', label: 'Аналитик' },
    { key: 'visibility', label: 'Тохиргоо' },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Creator удирдлага</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
          Creator-уудыг удирдах, түвшин тохируулах, харагдах байдал удирдах
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 overflow-x-auto pb-px mb-6"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setMainTab(t.key)}
            className="px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative"
            style={{
              color: mainTab === t.key ? 'var(--primary)' : 'var(--text3)',
              borderBottom: mainTab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
            }}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span
                className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold text-white"
                style={{ background: '#EF4444' }}
              >
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      )}

      {/* ═══════ OVERVIEW ═══════ */}
      {mainTab === 'overview' && !loading && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <KpiCard label="Нийт UGC" value={ugcRequests.length.toString()} sub={`${ugcByStatus.in_progress || 0} идэвхтэй`} color="var(--primary)" />
            <KpiCard label="Creators" value={approvedCreators.length.toString()} sub={`${pendingCount} хүлээгдэж буй`} color="#8B5CF6" />
            <KpiCard label="Нийт орлого" value={`₮${totalRevenue.toLocaleString()}`} sub="UGC-ээс" color="#10B981" />
            <KpiCard label="Төлбөр" value={`₮${totalPayouts.toLocaleString()}`} sub="Creator-уудад" color="#3B82F6" />
          </div>

          {/* Pipeline */}
          <div
            className="rounded-xl p-5 mb-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>UGC Pipeline</h3>
            <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3" style={{ background: 'var(--surface2)' }}>
              {Object.entries(UGC_STATUS).map(([key, cfg]) => {
                const pct = ugcRequests.length > 0 ? (ugcByStatus[key] || 0) / ugcRequests.length * 100 : 0
                return pct > 0 ? (
                  <div key={key} style={{ width: `${pct}%`, background: cfg.color }} title={`${cfg.label}: ${ugcByStatus[key]}`} />
                ) : null
              })}
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(UGC_STATUS).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text2)' }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
                  {cfg.label}: {ugcByStatus[key] || 0}
                </div>
              ))}
            </div>
          </div>

          {/* Top creators */}
          <div
            className="rounded-xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>Шилдэг Creator-ууд</h3>
            {approvedCreators.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text3)' }}>Creator байхгүй</p>
            ) : (
              <div className="space-y-2">
                {approvedCreators
                  .sort((a, b) => (b.completedJobs || 0) - (a.completedJobs || 0))
                  .slice(0, 5)
                  .map((c, i) => {
                    const lvl = LEVEL_CONFIG[c.level || 'starter']
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                        style={{ background: 'var(--surface2)' }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold w-5" style={{ color: i < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][i] : 'var(--text3)' }}>
                            {i + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{c.user?.name || c.name || 'Creator'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                style={{ background: lvl?.bg, color: lvl?.color }}
                              >
                                {lvl?.label}
                              </span>
                              <span className="text-xs" style={{ color: 'var(--text3)' }}>
                                ★ {(c.avgRating || 0).toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{c.completedJobs || 0} ажил</p>
                          <p className="text-xs" style={{ color: 'var(--text3)' }}>₮{(c.totalEarned || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════ UGC CONTENT ═══════ */}
      {mainTab === 'ugc' && !loading && (
        <>
          {/* Filter bar */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {['all', ...Object.keys(UGC_STATUS)].map(s => (
              <button
                key={s}
                onClick={() => setUgcFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
                style={{
                  background: ugcFilter === s ? 'var(--orange-10)' : 'var(--surface)',
                  color: ugcFilter === s ? 'var(--primary)' : 'var(--text2)',
                  border: `1px solid ${ugcFilter === s ? 'var(--primary)' : 'var(--border)'}`,
                }}
              >
                {s === 'all' ? 'Бүгд' : UGC_STATUS[s]?.label}
                {s === 'all' ? ` (${ugcRequests.length})` : ` (${ugcByStatus[s] || 0})`}
              </button>
            ))}
          </div>

          {/* UGC grid */}
          {filteredUgc.length === 0 ? (
            <Empty text="UGC контент байхгүй" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredUgc.map(r => {
                const st = UGC_STATUS[r.status] || UGC_STATUS.open
                return (
                  <div
                    key={r.id}
                    className="rounded-xl p-4 cursor-pointer transition-colors hover:border-[var(--primary)]"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    onClick={() => setSelectedUgc(r)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-lg">{CONTENT_ICONS[r.contentType || ''] || '📦'}</span>
                      <span
                        className="px-2 py-0.5 rounded-md text-xs font-medium"
                        style={{ background: st.color + '18', color: st.color }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{r.title || r.contentType}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
                      {r.customer?.name || 'Захиалагч'} · ₮{(r.budget || 0).toLocaleString()}
                    </p>
                    {r.creator && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text2)' }}>
                        Creator: {r.creator.name}
                      </p>
                    )}
                    {['approved', 'submitted'].includes(r.status) && (
                      <button
                        onClick={e => { e.stopPropagation(); handleReleasePayment(r.id) }}
                        className="mt-2 px-3 py-1 rounded-lg text-xs font-medium text-white"
                        style={{ background: '#10B981' }}
                        disabled={processing}
                      >
                        Төлбөр чөлөөлөх
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ═══════ CREATORS ═══════ */}
      {mainTab === 'creators' && !loading && (
        <>
          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {Object.entries({ pending: 'Хүлээгдэж буй', approved: 'Батлагдсан', all: 'Бүгд', rejected: 'Татгалзсан' }).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setCreatorFilter(k)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: creatorFilter === k ? 'var(--orange-10)' : 'var(--surface)',
                  color: creatorFilter === k ? 'var(--primary)' : 'var(--text2)',
                  border: `1px solid ${creatorFilter === k ? 'var(--primary)' : 'var(--border)'}`,
                }}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Creator list */}
          {applications.length === 0 ? (
            <Empty text="Creator байхгүй" />
          ) : (
            <div className="space-y-3">
              {applications.map(app => {
                const st = APP_STATUS[app.status] || APP_STATUS.pending
                const lvl = LEVEL_CONFIG[app.level || 'starter']
                return (
                  <div
                    key={app.id}
                    className="rounded-xl p-4"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ background: 'var(--primary-gradient)', color: '#fff' }}
                        >
                          {(app.user?.name || app.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                              {app.user?.name || app.name || 'Creator'}
                            </p>
                            <span
                              className="px-2 py-0.5 rounded-md text-xs font-medium"
                              style={{ background: st.color + '18', color: st.color }}
                            >
                              {st.label}
                            </span>
                            {app.level && (
                              <span
                                className="px-2 py-0.5 rounded-md text-xs font-medium"
                                style={{ background: lvl?.bg, color: lvl?.color }}
                              >
                                {lvl?.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                            {app.user?.email || app.email || ''}
                          </p>
                          {/* Skills */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(app.skills || []).slice(0, 4).map((s: string) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded text-[10px] font-medium"
                                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
                              >
                                {SKILL_LABELS[s] || s}
                              </span>
                            ))}
                          </div>
                          {/* Stats for approved */}
                          {app.status === 'approved' && (
                            <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--text3)' }}>
                              <span>Ажил: {app.completedJobs || 0}</span>
                              <span>★ {(app.avgRating || 0).toFixed(1)}</span>
                              <span>₮{(app.totalEarned || 0).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 shrink-0">
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(app.id)}
                              disabled={processing}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-60"
                              style={{ background: '#10B981' }}
                            >
                              Батлах
                            </button>
                            <button
                              onClick={() => handleReject(app.id)}
                              disabled={processing}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-60"
                              style={{ background: '#EF4444' }}
                            >
                              Татгалзах
                            </button>
                          </>
                        )}
                        {app.status === 'approved' && (
                          <button
                            onClick={() => { setLevelModal(app); setNewLevel(app.level || 'starter') }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' }}
                          >
                            Түвшин өөрчлөх
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ═══════ ANALYTICS ═══════ */}
      {mainTab === 'analytics' && !loading && (
        <div className="space-y-6">
          {/* Level distribution */}
          <div
            className="rounded-xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>Түвшингийн тархалт</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {LEVELS.map(l => {
                const count = approvedCreators.filter(c => (c.level || 'starter') === l).length
                const cfg = LEVEL_CONFIG[l]
                return (
                  <div key={l} className="text-center p-4 rounded-xl" style={{ background: cfg.bg }}>
                    <p className="text-2xl font-bold" style={{ color: cfg.color }}>{count}</p>
                    <p className="text-xs font-medium mt-1" style={{ color: cfg.color }}>{cfg.label}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Content type distribution */}
          <div
            className="rounded-xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>Контентийн төрөл</h3>
            <div className="space-y-2">
              {Object.entries(CONTENT_ICONS).map(([key, icon]) => {
                const count = ugcRequests.filter(r => r.contentType === key).length
                const pct = ugcRequests.length > 0 ? (count / ugcRequests.length * 100) : 0
                if (count === 0) return null
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-6 text-center">{icon}</span>
                    <span className="text-sm w-28" style={{ color: 'var(--text2)' }}>{key}</span>
                    <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--surface2)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
                    </div>
                    <span className="text-xs w-8 text-right" style={{ color: 'var(--text3)' }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Revenue over time placeholder */}
          <div
            className="rounded-xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>Орлогын чиг хандлага</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>Энэ сард</p>
                <p className="text-lg font-bold" style={{ color: 'var(--primary)' }}>₮{totalRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>Дундаж захиалга</p>
                <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                  ₮{ugcRequests.length > 0 ? Math.round(totalRevenue / ugcRequests.length).toLocaleString() : '0'}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>Биелэлтийн хувь</p>
                <p className="text-lg font-bold" style={{ color: '#10B981' }}>
                  {ugcRequests.length > 0 ? Math.round((ugcByStatus.completed || 0) / ugcRequests.length * 100) : 0}%
                </p>
              </div>
            </div>
            <div
              className="h-40 rounded-lg flex items-center justify-center text-sm"
              style={{ background: 'var(--surface2)', color: 'var(--text3)' }}
            >
              📊 Графикийн дэлгэрэнгүй удахгүй нэмэгдэнэ
            </div>
          </div>
        </div>
      )}

      {/* ═══════ VISIBILITY SETTINGS ═══════ */}
      {mainTab === 'visibility' && !loading && (
        <div className="space-y-4 max-w-2xl">
          <div
            className="rounded-xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>Marketplace тохиргоо</h3>
            <div className="space-y-4">
              <Toggle
                label="Marketplace-д харуулах"
                desc="Creator-уудыг нийтэд нээлттэй харуулах"
                checked={visibilitySettings.showOnMarketplace}
                onChange={v => setVisibilitySettings(s => ({ ...s, showOnMarketplace: v }))}
              />
              <Toggle
                label="Шууд захиалга зөвшөөрөх"
                desc="Захиалагчид creator-г шууд сонгож захиалах"
                checked={visibilitySettings.allowDirectHire}
                onChange={v => setVisibilitySettings(s => ({ ...s, allowDirectHire: v }))}
              />
              <Toggle
                label="Үнэлгээ харуулах"
                desc="Creator-ийн үнэлгээг нийтэд харуулах"
                checked={visibilitySettings.showRatings}
                onChange={v => setVisibilitySettings(s => ({ ...s, showRatings: v }))}
              />
              <Toggle
                label="Орлого харуулах"
                desc="Creator-ийн нийт орлогыг харуулах"
                checked={visibilitySettings.showEarnings}
                onChange={v => setVisibilitySettings(s => ({ ...s, showEarnings: v }))}
              />
              <Toggle
                label="Дууссан ажлын тоо"
                desc="Хэдэн ажил дуусгасныг харуулах"
                checked={visibilitySettings.showCompletedJobs}
                onChange={v => setVisibilitySettings(s => ({ ...s, showCompletedJobs: v }))}
              />
              <Toggle
                label="Портфолио шаардах"
                desc="Marketplace-д гарахын тулд портфолио заавал байх"
                checked={visibilitySettings.requirePortfolio}
                onChange={v => setVisibilitySettings(s => ({ ...s, requirePortfolio: v }))}
              />
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>Хамгийн бага шаардлага</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text2)' }}>
                  Marketplace-д гарах хамгийн бага түвшин
                </label>
                <select
                  value={visibilitySettings.minLevelForMarketplace}
                  onChange={e => setVisibilitySettings(s => ({ ...s, minLevelForMarketplace: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-sm"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  {LEVELS.map(l => (
                    <option key={l} value={l}>{LEVEL_CONFIG[l].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text2)' }}>
                  Хамгийн бага портфолио тоо
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={visibilitySettings.minPortfolioItems}
                  onChange={e => setVisibilitySettings(s => ({ ...s, minPortfolioItems: Number(e.target.value) }))}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-sm"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              apiFetch('/admin/creator-settings', {
                method: 'PUT',
                body: JSON.stringify(visibilitySettings),
              }).then(() => alert('Хадгалагдлаа')).catch(() => alert('Алдаа'))
            }}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}
          >
            Хадгалах
          </button>
        </div>
      )}

      {/* ═══════ Level assignment modal ═══════ */}
      {levelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setLevelModal(null)} />
          <div
            className="relative w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)' }}>
              Түвшин тохируулах
            </h3>
            <p className="text-sm mb-3" style={{ color: 'var(--text2)' }}>
              {levelModal.user?.name || levelModal.name || 'Creator'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {LEVELS.map(l => {
                const cfg = LEVEL_CONFIG[l]
                return (
                  <button
                    key={l}
                    onClick={() => setNewLevel(l)}
                    className="px-3 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: newLevel === l ? cfg.bg : 'var(--surface2)',
                      border: `2px solid ${newLevel === l ? cfg.color : 'transparent'}`,
                      color: newLevel === l ? cfg.color : 'var(--text2)',
                    }}
                  >
                    {l === 'elite' && '⭐ '}{cfg.label}
                  </button>
                )
              })}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setLevelModal(null)}
                className="px-4 py-2 rounded-xl text-sm"
                style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
              >
                Болих
              </button>
              <button
                onClick={handleAssignLevel}
                disabled={processing}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'var(--primary)' }}
              >
                Хадгалах
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UGC detail modal */}
      {selectedUgc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedUgc(null)} />
          <div
            className="relative w-full max-w-md rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold" style={{ color: 'var(--text)' }}>UGC дэлгэрэнгүй</h3>
              <button onClick={() => setSelectedUgc(null)} className="text-lg" style={{ color: 'var(--text3)' }}>✕</button>
            </div>
            <div className="space-y-3">
              <Row label="Төрөл" value={`${CONTENT_ICONS[selectedUgc.contentType || ''] || '📦'} ${selectedUgc.contentType || ''}`} />
              <Row label="Статус" value={UGC_STATUS[selectedUgc.status]?.label || selectedUgc.status} />
              <Row label="Захиалагч" value={selectedUgc.customer?.name || '—'} />
              <Row label="Creator" value={selectedUgc.creator?.name || 'Оноогдоогүй'} />
              <Row label="Төсөв" value={`₮${(selectedUgc.budget || 0).toLocaleString()}`} />
              <Row label="Багц" value={selectedUgc.package || '—'} />
              {selectedUgc.description && (
                <>
                  <p className="text-xs font-medium mt-3" style={{ color: 'var(--text3)' }}>Тайлбар</p>
                  <p className="text-sm" style={{ color: 'var(--text2)' }}>{selectedUgc.description}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Helper components ── */

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-medium" style={{ color: 'var(--text3)' }}>{label}</p>
      <p className="text-xl font-bold mt-1" style={{ color }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{sub}</p>
    </div>
  )
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</p>
        <p className="text-xs" style={{ color: 'var(--text3)' }}>{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="w-11 h-6 rounded-full p-0.5 transition-colors shrink-0"
        style={{ background: checked ? 'var(--primary)' : 'var(--border2)' }}
      >
        <div
          className="w-5 h-5 rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: 'var(--text3)' }}>{label}</span>
      <span className="font-medium" style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-3xl mb-2">📭</p>
      <p className="text-sm" style={{ color: 'var(--text3)' }}>{text}</p>
    </div>
  )
}
