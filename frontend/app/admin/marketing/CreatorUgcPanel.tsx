'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

const SKILL_LABELS: Record<string, string> = {
  graphic_design: 'График дизайн', illustration: 'Зураг', photo: 'Гэрэл зураг',
  video: 'Видео', motion: 'Motion', branding: 'Брэндинг',
  social_media: 'Соц.Медиа', print_design: 'Хэвлэл дизайн',
}
const UGC_STATUS: Record<string, { label: string; color: string }> = {
  open: { label: 'Нээлттэй', color: '#10B981' }, assigned: { label: 'Creator олдсон', color: '#3B82F6' },
  in_progress: { label: 'Хийгдэж буй', color: '#FF6B00' }, submitted: { label: 'Шалгуулахаар', color: '#8B5CF6' },
  revision: { label: 'Засвар', color: '#F59E0B' }, approved: { label: 'Батлагдсан', color: '#10B981' },
  completed: { label: 'Дууссан', color: '#6B7280' }, cancelled: { label: 'Цуцалсан', color: '#EF4444' },
}
const APP_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Хүлээгдэж буй', color: '#F59E0B' }, approved: { label: 'Батлагдсан', color: '#10B981' }, rejected: { label: 'Татгалзсан', color: '#EF4444' },
}
const CT_ICON: Record<string, string> = {
  poster: '🖼️', flyer: '📄', banner: '🪧', social_post: '📸', story_reel: '📱',
  logo: '💎', brochure: '📰', business_card: '🪪', menu: '🍽️', video: '🎬',
}

type SubTab = 'dashboard' | 'ugc' | 'creators' | 'packages' | 'pricing' | 'performance' | 'revenue' | 'settings'

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  starter: { label: 'Starter', color: '#6B7280', bg: '#F3F4F6' },
  pro:     { label: 'Pro',     color: '#3B82F6', bg: '#EFF6FF' },
  expert:  { label: 'Expert',  color: '#8B5CF6', bg: '#F5F3FF' },
  elite:   { label: 'Elite',   color: '#FF6B00', bg: '#FFF7ED' },
}
const LEVELS = ['starter', 'pro', 'expert', 'elite'] as const
const CAP_LABELS: Record<string, { label: string; icon: string }> = {
  social: { label: 'Сошиал', icon: '📱' },
  prepress: { label: 'Хэвлэл', icon: '🖨️' },
  live: { label: 'Live', icon: '📡' },
  ai: { label: 'AI', icon: '🤖' },
  ugc: { label: 'UGC', icon: '🎬' },
}

export default function CreatorUgcPanel() {
  const [sub, setSub] = useState<SubTab>('dashboard')
  const [allApps, setAllApps] = useState<any[]>([])
  const [ugc, setUgc] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [ugcFilter, setUgcFilter] = useState('all')
  const [creatorFilter, setCreatorFilter] = useState('pending')
  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [selectedUgc, setSelectedUgc] = useState<any>(null)
  const [packages, setPackages] = useState<any[]>([])
  const [ratingAnalytics, setRatingAnalytics] = useState<any>(null)
  const [topCreators, setTopCreators] = useState<any[]>([])
  const [pricing, setPricing] = useState<any[]>([])
  const [pricingTab, setPricingTab] = useState<'social' | 'prepress' | 'live' | 'ai'>('social')
  const [editPrice, setEditPrice] = useState<any>(null)
  const [levelModal, setLevelModal] = useState<any>(null)
  const [newLevel, setNewLevel] = useState('')
  const [creatorSearch, setCreatorSearch] = useState('')
  const [creatorSort, setCreatorSort] = useState<'earned' | 'jobs' | 'rating' | 'recent'>('earned')
  const [settings, setSettings] = useState({
    commissionPercent: 20,
    minLevelForMarketplace: 'starter',
    requirePortfolio: true,
    minPortfolioItems: 3,
    showRatings: true,
    showEarnings: false,
    allowDirectHire: true,
    autoApproveThreshold: 0,
  })
  const [showPkgForm, setShowPkgForm] = useState(false)
  const [editingPkg, setEditingPkg] = useState<any>(null)
  const [pkgForm, setPkgForm] = useState({
    name: '', slug: '', description: '', price: 720000, discount_price: 0,
    discount_label: '', duration_months: 1, content_count: 4, content_types: [] as string[],
    features: [] as string[], has_brand_boost: false, brand_boost_description: '',
    brand_boost_price: 0, is_active: true, is_popular: false, sort_order: 0,
    target_audience: '',
  })

  const load = () => {
    setLoading(true)
    Promise.all([
      apiFetch<any[]>('/creator/applications').catch(() => []),
      apiFetch<any[]>('/creator/all-requests').catch(() => []),
      apiFetch<any[]>('/creator/packages?all=true').catch(() => []),
      apiFetch<any>('/creator/rating-analytics').catch(() => null),
      apiFetch<any[]>('/creator/top-creators?limit=5').catch(() => []),
      apiFetch<any[]>('/creator/pricing').catch(() => []),
    ]).then(([apps, reqs, pkgs, ra, tc, pr]) => {
      setAllApps(Array.isArray(apps) ? apps : [])
      setUgc(Array.isArray(reqs) ? reqs : [])
      setPackages(Array.isArray(pkgs) ? pkgs : [])
      setRatingAnalytics(ra)
      setTopCreators(Array.isArray(tc) ? tc : [])
      setPricing(Array.isArray(pr) ? pr : [])
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const approve = async (id: string) => {
    setProcessing(true)
    try { await apiFetch(`/creator/applications/${id}/approve`, { method: 'PATCH' }); load(); setSelectedApp(null) } catch (e: any) { alert(e.message || 'Алдаа') }
    setProcessing(false)
  }
  const reject = async (id: string) => {
    const reason = prompt('Татгалзах шалтгаан:'); if (!reason) return
    setProcessing(true)
    try { await apiFetch(`/creator/applications/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }); load(); setSelectedApp(null) } catch (e: any) { alert(e.message || 'Алдаа') }
    setProcessing(false)
  }
  const release = async (id: string) => {
    if (!confirm('Төлбөр гаргах уу?')) return
    try { await apiFetch(`/creator/requests/${id}/release`, { method: 'PATCH' }); load() } catch (e: any) { alert(e.message || 'Алдаа') }
  }

  const promoteCreator = async (id: string, level: string) => {
    setProcessing(true)
    try { await apiFetch(`/creator/applications/${id}/level`, { method: 'PATCH', body: JSON.stringify({ level }) }); load(); setLevelModal(null) }
    catch (e: any) { alert(e.message || 'Алдаа') }
    setProcessing(false)
  }
  const suspendCreator = async (id: string) => {
    if (!confirm('Creator-г идэвхгүй болгох уу?')) return
    setProcessing(true)
    try { await apiFetch(`/creator/applications/${id}/suspend`, { method: 'PATCH' }); load() }
    catch (e: any) { alert(e.message || 'Алдаа') }
    setProcessing(false)
  }
  const saveSettings = async () => {
    try { await apiFetch('/admin/creator-settings', { method: 'PUT', body: JSON.stringify(settings) }); alert('Хадгалагдлаа') }
    catch { alert('Алдаа') }
  }

  const resetPkgForm = () => {
    setPkgForm({ name: '', slug: '', description: '', price: 720000, discount_price: 0,
      discount_label: '', duration_months: 1, content_count: 4, content_types: [],
      features: [], has_brand_boost: false, brand_boost_description: '',
      brand_boost_price: 0, is_active: true, is_popular: false, sort_order: 0,
      target_audience: '' })
    setEditingPkg(null)
  }

  const savePkg = async () => {
    if (!pkgForm.name || !pkgForm.slug) return alert('Нэр, slug бөглөнө үү')
    try {
      if (editingPkg) {
        await apiFetch(`/creator/packages/${editingPkg.id}`, { method: 'PATCH', body: JSON.stringify(pkgForm) })
      } else {
        await apiFetch('/creator/packages', { method: 'POST', body: JSON.stringify(pkgForm) })
      }
      setShowPkgForm(false); resetPkgForm(); load()
    } catch (e: any) { alert(e.message || 'Алдаа') }
  }

  const deletePkg = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    try { await apiFetch(`/creator/packages/${id}`, { method: 'DELETE' }); load() }
    catch (e: any) { alert(e.message || 'Алдаа') }
  }

  const editPkg = (pkg: any) => {
    setPkgForm({
      name: pkg.name || '', slug: pkg.slug || '', description: pkg.description || '',
      price: Number(pkg.price) || 0, discount_price: Number(pkg.discount_price) || 0,
      discount_label: pkg.discount_label || '', duration_months: pkg.duration_months || 1,
      content_count: pkg.content_count || 4, content_types: pkg.content_types || [],
      features: pkg.features || [], has_brand_boost: pkg.has_brand_boost || false,
      brand_boost_description: pkg.brand_boost_description || '',
      brand_boost_price: Number(pkg.brand_boost_price) || 0,
      is_active: pkg.is_active !== false, is_popular: pkg.is_popular || false,
      sort_order: pkg.sort_order || 0, target_audience: pkg.target_audience || '',
    })
    setEditingPkg(pkg)
    setShowPkgForm(true)
  }

  const pending = allApps.filter(a => a.status === 'pending')
  const creators = allApps.filter(a => a.status === 'approved')
  const activeUgc = ugc.filter(r => !['completed', 'cancelled'].includes(r.status))
  const completedUgc = ugc.filter(r => r.status === 'completed')
  const revenue = ugc.reduce((s, r) => s + Number(r.platform_fee || 0), 0)

  const filteredUgc = ugcFilter === 'all' ? ugc : ugcFilter === 'active' ? activeUgc
    : ugcFilter === 'completed' ? completedUgc
    : ugc.filter(r => r.status === ugcFilter)

  const filteredApps = creatorFilter === 'all' ? allApps
    : allApps.filter(a => a.status === creatorFilter)

  const creatorStats = creators.map(c => {
    const jobs = ugc.filter(r => r.creator_id === c.user_id)
    const done = jobs.filter(j => j.status === 'completed')
    return { ...c, jobs: jobs.length, done: done.length, earned: done.reduce((s: number, j: any) => s + Number(j.creator_payout || 0), 0),
      rating: done.filter((j: any) => j.rating).length > 0 ? done.filter((j: any) => j.rating).reduce((s: number, j: any) => s + j.rating, 0) / done.filter((j: any) => j.rating).length : 0 }
  }).sort((a, b) => b.done - a.done)

  // Sorted/filtered creator list for Creator tab
  const sortedCreators = [...creatorStats]
    .filter(c => !creatorSearch || (c.full_name || '').toLowerCase().includes(creatorSearch.toLowerCase()))
    .sort((a, b) => {
      if (creatorSort === 'earned') return b.earned - a.earned
      if (creatorSort === 'jobs') return b.done - a.done
      if (creatorSort === 'rating') return (b.rating || 0) - (a.rating || 0)
      return 0
    })

  // Performance categories
  const inactiveCreators = creatorStats.filter(c => c.jobs === 0)
  const lowPerformers = creatorStats.filter(c => c.done > 0 && c.rating > 0 && c.rating < 3.5)
  const topPerformers = creatorStats.filter(c => c.done >= 5 && c.rating >= 4.5).slice(0, 10)
  const newCreators = allApps.filter(a => a.status === 'approved' && a.created_at && (Date.now() - new Date(a.created_at).getTime() < 30 * 86400000))

  // Revenue
  const totalCreatorPayouts = ugc.filter(r => r.status === 'completed').reduce((s, r) => s + Number(r.creator_payout || 0), 0)
  const totalPlatformRevenue = revenue
  const avgOrderValue = ugc.length > 0 ? ugc.reduce((s, r) => s + Number(r.budget || 0), 0) / ugc.length : 0

  /* ═══ SUB-TAB NAVIGATION ═══ */
  const SUBS: { key: SubTab; label: string; badge?: number }[] = [
    { key: 'dashboard', label: 'Хяналт' },
    { key: 'ugc', label: 'UGC контент', badge: activeUgc.length || undefined },
    { key: 'creators', label: 'Creators', badge: pending.length || undefined },
    { key: 'performance', label: 'Гүйцэтгэл' },
    { key: 'revenue', label: 'Орлого' },
    { key: 'packages', label: 'Багцууд' },
    { key: 'pricing', label: 'Үнэ тохируулга' },
    { key: 'settings', label: 'Тохиргоо' },
  ]

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-2 mb-5">
        {SUBS.map(t => (
          <button key={t.key} onClick={() => setSub(t.key)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${sub === t.key ? 'bg-[#8B5CF6] text-white' : 'bg-white text-[#555] border border-[#E5E7EB] hover:border-[#8B5CF6]'}`}>
            {t.label} {t.badge ? <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* ═══ DASHBOARD ═══ */}
      {sub === 'dashboard' && (
        <div>
          {/* KPIs — clickable */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'UGC захиалга', value: ugc.length, sub: `${activeUgc.length} идэвхтэй`, icon: '🎨', color: '#FF6B00', tab: 'ugc' as SubTab },
              { label: 'Creators', value: creators.length, sub: `${pending.length} хүлээгдэж буй`, icon: '👥', color: '#8B5CF6', tab: 'creators' as SubTab },
              { label: 'Платформ орлого', value: `₮${revenue.toLocaleString()}`, sub: `${completedUgc.length} дууссан`, icon: '💰', color: '#10B981', tab: 'revenue' as SubTab },
              { label: 'Дундаж үнэ', value: ugc.length > 0 ? `₮${Math.round(ugc.reduce((s, r) => s + Number(r.budget || 0), 0) / ugc.length).toLocaleString()}` : '₮0', sub: 'захиалгад', icon: '📊', color: '#3B82F6', tab: 'revenue' as SubTab },
            ].map((k, i) => (
              <div key={i} onClick={() => setSub(k.tab)} className="bg-white rounded-xl border border-[#E5E7EB] p-4 cursor-pointer hover:shadow-md hover:border-[#FF6B00]/30 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{k.icon}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: k.color, background: k.color + '12' }}>{k.sub}</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
                <div className="text-[11px] text-[#888] flex items-center gap-1">{k.label} <span className="text-[#CCC]">→</span></div>
              </div>
            ))}
          </div>

          {/* Active jobs — full detail */}
          {activeUgc.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#111]">🔥 Идэвхтэй ажлууд ({activeUgc.length})</h3>
                <button onClick={() => setSub('ugc')} className="text-[11px] text-[#FF6B00] hover:underline font-medium">Бүгд →</button>
              </div>
              <div className="space-y-2">
                {activeUgc.slice(0, 5).map(r => {
                  const st = UGC_STATUS[r.status] || { label: r.status, color: '#6B7280' }
                  return (
                    <div key={r.id} onClick={() => setSelectedUgc(r)} className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFAFA] hover:bg-[#F3F4F6] cursor-pointer transition-colors">
                      <span className="text-xl">{CT_ICON[r.content_type] || '🎨'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[#111] truncate">{r.title}</div>
                        <div className="text-[10px] text-[#888] flex gap-2 mt-0.5">
                          <span>👤 {r.customer_name || '—'}</span>
                          <span>→ 🎨 {r.creator_name || 'Оноогдоогүй'}</span>
                          {r.deadline && <span>📅 {new Date(r.deadline).toLocaleDateString('mn-MN')}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ color: st.color, background: st.color + '12' }}>{st.label}</span>
                        <div className="text-xs font-bold text-[#FF6B00] mt-1">₮{Number(r.budget || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-5">
            {/* Pipeline */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#111]">UGC Pipeline</h3>
                <button onClick={() => setSub('ugc')} className="text-[11px] text-[#FF6B00] hover:underline">Бүгд →</button>
              </div>
              {[
                { label: 'Нээлттэй', count: ugc.filter(r => r.status === 'open').length, color: '#10B981', filter: 'open' },
                { label: 'Хийгдэж буй', count: ugc.filter(r => ['assigned', 'in_progress'].includes(r.status)).length, color: '#FF6B00', filter: 'in_progress' },
                { label: 'Шалгуулахаар', count: ugc.filter(r => r.status === 'submitted').length, color: '#8B5CF6', filter: 'submitted' },
                { label: 'Батлагдсан', count: ugc.filter(r => r.status === 'approved').length, color: '#3B82F6', filter: 'approved' },
                { label: 'Дууссан', count: completedUgc.length, color: '#6B7280', filter: 'completed' },
              ].map((s, i) => {
                const pct = ugc.length > 0 ? (s.count / ugc.length) * 100 : 0
                return (
                  <div key={i} onClick={() => { setSub('ugc'); setUgcFilter(s.filter) }} className="flex items-center gap-3 mb-2 cursor-pointer hover:bg-[#FAFAFA] rounded-lg px-1 py-0.5 -mx-1 transition-colors">
                    <div className="w-20 text-[11px] text-[#888]">{s.label}</div>
                    <div className="flex-1 h-4 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(pct, 3)}%`, background: s.color }} />
                    </div>
                    <div className="w-6 text-[11px] font-bold text-right" style={{ color: s.color }}>{s.count}</div>
                  </div>
                )
              })}
            </div>

            {/* Pending apps */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#111]">Creator өргөдлүүд</h3>
                <button onClick={() => setSub('creators')} className="text-[11px] text-[#FF6B00] hover:underline">Бүгд →</button>
              </div>
              {pending.length === 0 ? (
                <div className="text-center py-6 text-[#999] text-xs">✅ Хүлээгдэж буй өргөдөл байхгүй</div>
              ) : pending.slice(0, 4).map(app => (
                <div key={app.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#FAFAFA] mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/12 flex items-center justify-center text-xs font-bold text-[#8B5CF6]">{app.full_name?.charAt(0)?.toUpperCase()}</div>
                    <div>
                      <div className="text-xs font-medium text-[#111]">{app.full_name}</div>
                      <div className="text-[10px] text-[#999]">{app.skills?.slice(0, 2).map((s: string) => SKILL_LABELS[s] || s).join(', ')}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => approve(app.id)} disabled={processing} className="w-6 h-6 rounded bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-[10px] hover:bg-[#10B981]/20">✓</button>
                    <button onClick={() => reject(app.id)} disabled={processing} className="w-6 h-6 rounded bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center text-[10px] hover:bg-[#EF4444]/20">✕</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Top creators — with rank, level, actions */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#111]">🏆 Шилдэг Creators</h3>
                <button onClick={() => setSub('performance')} className="text-[11px] text-[#FF6B00] hover:underline font-medium">Бүгд →</button>
              </div>
              {creatorStats.length === 0 ? (
                <div className="text-center py-6 text-[#999] text-xs">👥 Creator байхгүй</div>
              ) : creatorStats.slice(0, 5).map((c, i) => {
                const lvl = LEVEL_CONFIG[(c as any).level || 'starter']
                return (
                  <div key={c.id} onClick={() => { setLevelModal(c); setNewLevel((c as any).level || 'starter') }}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#FAFAFA] cursor-pointer mb-1 transition-colors">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#F3F4F6', color: i < 3 ? '#fff' : '#999' }}>{i + 1}</div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-white text-[10px] font-bold">{c.full_name?.charAt(0)?.toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#111] truncate">{c.full_name}</span>
                        {lvl && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: lvl.bg, color: lvl.color }}>{lvl.label}</span>}
                      </div>
                      <div className="text-[10px] text-[#999]">{c.done} ажил • ⭐{c.rating > 0 ? c.rating.toFixed(1) : '—'}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-[#10B981]">₮{c.earned.toLocaleString()}</div>
                      <div className="text-[8px] text-[#CCC]">дарж харах →</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Recent activity — clickable with more detail */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#111]">Сүүлийн UGC</h3>
                <button onClick={() => setSub('ugc')} className="text-[11px] text-[#FF6B00] hover:underline font-medium">Бүгд →</button>
              </div>
              {ugc.length === 0 ? (
                <div className="text-center py-6 text-[#999] text-xs">📭 Контент захиалга байхгүй</div>
              ) : ugc.slice(0, 5).map(r => {
                const st = UGC_STATUS[r.status] || { label: r.status, color: '#6B7280' }
                return (
                  <div key={r.id} onClick={() => setSelectedUgc(r)} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#FAFAFA] cursor-pointer mb-1 transition-colors">
                    <span className="text-xl">{CT_ICON[r.content_type] || '🎨'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#111] truncate">{r.title}</div>
                      <div className="text-[10px] text-[#999] flex gap-2">
                        <span>👤 {r.customer_name}</span>
                        {r.creator_name && <span>→ 🎨 {r.creator_name}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ color: st.color, background: st.color + '12' }}>{st.label}</span>
                      <div className="text-[10px] font-bold text-[#FF6B00] mt-1">₮{Number(r.budget || 0).toLocaleString()}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Rating Analytics */}
          {ratingAnalytics && ratingAnalytics.totalCount > 0 && (
            <div className="mt-5 bg-white rounded-xl border border-[#E5E7EB] p-5">
              <h3 className="text-sm font-bold text-[#111] mb-4">⭐ Үнэлгээний тойм</h3>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#FF6B00]">{ratingAnalytics.avgRating}</div>
                  <div className="text-[10px] text-[#888]">Дундаж үнэлгээ</div>
                  <div className="flex justify-center gap-0.5 mt-1">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`text-sm ${s <= Math.round(ratingAnalytics.avgRating) ? 'text-[#F59E0B]' : 'text-[#E5E7EB]'}`}>★</span>
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#3B82F6]">{ratingAnalytics.totalCount}</div>
                  <div className="text-[10px] text-[#888]">Нийт үнэлгээ</div>
                </div>
                {ratingAnalytics.byType?.ugc && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#FF6B00]">{ratingAnalytics.byType.ugc.avg.toFixed(1)}</div>
                    <div className="text-[10px] text-[#888]">🎬 UGC ({ratingAnalytics.byType.ugc.count})</div>
                  </div>
                )}
                {ratingAnalytics.byType?.design && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#8B5CF6]">{ratingAnalytics.byType.design.avg.toFixed(1)}</div>
                    <div className="text-[10px] text-[#888]">🎨 Design ({ratingAnalytics.byType.design.count})</div>
                  </div>
                )}
                {ratingAnalytics.byType?.live && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#EC4899]">{ratingAnalytics.byType.live.avg.toFixed(1)}</div>
                    <div className="text-[10px] text-[#888]">📡 Live ({ratingAnalytics.byType.live.count})</div>
                  </div>
                )}
              </div>
              {/* Distribution bars */}
              <div className="flex items-end gap-2 h-16">
                {ratingAnalytics.distribution?.map((count: number, i: number) => {
                  const maxCount = Math.max(...(ratingAnalytics.distribution || [1]))
                  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className="text-[9px] font-bold text-[#888] mb-1">{count}</div>
                      <div className="w-full rounded-t" style={{ height: `${Math.max(pct, 4)}%`, background: i >= 3 ? '#10B981' : i >= 1 ? '#F59E0B' : '#EF4444', minHeight: 2 }} />
                      <div className="text-[9px] text-[#999] mt-1">{i + 1}★</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top Rated Creators */}
          {topCreators.length > 0 && (
            <div className="mt-5 bg-white rounded-xl border border-[#E5E7EB] p-5">
              <h3 className="text-sm font-bold text-[#111] mb-4">🏆 Шилдэг Creators (үнэлгээгээр)</h3>
              <div className="space-y-2">
                {topCreators.map((c: any, i: number) => (
                  <div key={c.user_id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#FAFAFA]">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#F3F4F6', color: i < 3 ? '#fff' : '#999' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-[#111]">{c.full_name}</div>
                      <div className="flex gap-1 mt-0.5">
                        {(c.capabilities?.includes('social') || c.capabilities?.includes('ugc')) && <span className="text-[8px] px-1 rounded bg-[#FF6B00]/10 text-[#FF6B00]">Сошиал</span>}
                        {(c.capabilities?.includes('prepress') || c.capabilities?.includes('design')) && <span className="text-[8px] px-1 rounded bg-[#8B5CF6]/10 text-[#8B5CF6]">Эх бэлтгэл</span>}
                        {c.capabilities?.includes('live') && <span className="text-[8px] px-1 rounded bg-[#EC4899]/10 text-[#EC4899]">Лайв</span>}
                        {c.capabilities?.includes('ai') && <span className="text-[8px] px-1 rounded bg-[#06B6D4]/10 text-[#06B6D4]">🤖 AI</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#F59E0B]">⭐ {c.rating.toFixed(1)}</div>
                      <div className="text-[9px] text-[#999]">{c.rating_count} үнэлгээ</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ UGC TAB ═══ */}
      {sub === 'ugc' && (
        <div>
          <div className="flex gap-2 mb-4">
            {[
              { key: 'all', label: 'Бүгд', count: ugc.length },
              { key: 'active', label: 'Идэвхтэй', count: activeUgc.length },
              { key: 'submitted', label: 'Шалгуулахаар', count: ugc.filter(r => r.status === 'submitted').length },
              { key: 'approved', label: 'Батлагдсан', count: ugc.filter(r => r.status === 'approved').length },
              { key: 'completed', label: 'Дууссан', count: completedUgc.length },
            ].map(f => (
              <button key={f.key} onClick={() => setUgcFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium ${ugcFilter === f.key ? 'bg-[#FF6B00] text-white' : 'bg-white text-[#555] border border-[#E5E7EB]'}`}>
                {f.label} ({f.count})
              </button>
            ))}
          </div>
          {loading ? (
            <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="h-44 bg-[#F3F4F6] rounded-xl animate-pulse" />)}</div>
          ) : filteredUgc.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-xl border border-[#E5E7EB]">
              <div className="text-3xl mb-2">📭</div>
              <div className="text-sm font-bold text-[#111] mb-1">UGC контент байхгүй</div>
              <div className="text-xs text-[#999]">Хэрэглэгчид контент захиалга үүсгэхэд энд харагдана</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredUgc.map(r => {
                const st = UGC_STATUS[r.status] || { label: r.status, color: '#6B7280' }
                return (
                  <div key={r.id} className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden hover:shadow-md hover:border-[#FF6B00]/30 transition-all cursor-pointer" onClick={() => setSelectedUgc(r)}>
                    <div className="h-16 flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${st.color}08, ${st.color}03)` }}>
                      <span className="text-3xl">{CT_ICON[r.content_type] || '🎨'}</span>
                      <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white border" style={{ color: st.color, borderColor: st.color + '30' }}>{st.label}</span>
                    </div>
                    <div className="p-3.5">
                      <h4 className="text-xs font-bold text-[#111] truncate mb-0.5">{r.title}</h4>
                      <p className="text-[10px] text-[#888] line-clamp-1 mb-2">{r.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] text-[#999]">{r.customer_name} • {r.content_type}</div>
                        <div className="text-xs font-bold text-[#FF6B00]">₮{Number(r.budget).toLocaleString()}</div>
                      </div>
                      {r.creator_name && <div className="text-[10px] text-[#999] mt-1">🎨 {r.creator_name}</div>}
                    </div>
                    {r.status === 'approved' && !r.is_released && (
                      <div className="px-3.5 pb-3">
                        <button onClick={e => { e.stopPropagation(); release(r.id) }}
                          className="w-full py-1.5 bg-[#10B981]/10 text-[#10B981] rounded-lg text-[11px] font-bold hover:bg-[#10B981]/20">Төлбөр гаргах</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ CREATORS TAB ═══ */}
      {sub === 'creators' && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex gap-2">
              {[
                { key: 'pending', label: 'Өргөдлүүд', count: pending.length },
                { key: 'approved', label: 'Идэвхтэй', count: creators.length },
                { key: 'all', label: 'Бүгд', count: allApps.length },
                { key: 'rejected', label: 'Татгалзсан', count: allApps.filter(a => a.status === 'rejected').length },
              ].map(f => (
                <button key={f.key} onClick={() => setCreatorFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium ${creatorFilter === f.key ? 'bg-[#8B5CF6] text-white' : 'bg-white text-[#555] border border-[#E5E7EB]'}`}>
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
            {creatorFilter === 'approved' && (
              <input type="text" placeholder="Creator хайх..." value={creatorSearch} onChange={e => setCreatorSearch(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[11px] outline-none focus:border-[#8B5CF6] w-48 ml-auto" />
            )}
          </div>
          {loading ? (
            <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="h-40 bg-[#F3F4F6] rounded-xl animate-pulse" />)}</div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-xl border border-[#E5E7EB]">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-sm font-bold text-[#111]">{creatorFilter === 'pending' ? 'Хүлээгдэж буй өргөдөл байхгүй' : 'Creator байхгүй'}</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {(creatorFilter === 'approved' ? sortedCreators : filteredApps).map(app => {
                const st = APP_STATUS[app.status] || { label: app.status, color: '#6B7280' }
                const stats = creatorStats.find(c => c.user_id === app.user_id)
                return (
                  <div key={app.id} className="bg-white border border-[#E5E7EB] rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-white text-sm font-bold">{app.full_name?.charAt(0)?.toUpperCase()}</div>
                        <div>
                          <div className="text-xs font-bold text-[#111]">{app.full_name}</div>
                          <div className="text-[10px] text-[#999]">{app.email}</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: st.color, background: st.color + '12' }}>{st.label}</span>
                    </div>
                    {/* Capabilities */}
                    {app.capabilities?.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-2">
                        {(app.capabilities.includes('social') || app.capabilities.includes('ugc')) && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] font-bold">📱 Сошиал</span>}
                        {(app.capabilities.includes('prepress') || app.capabilities.includes('design')) && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] font-bold">🖨️ Эх бэлтгэл</span>}
                        {app.capabilities.includes('live') && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#EC4899]/10 text-[#EC4899] font-bold">📡 Лайв</span>}
                        {app.capabilities.includes('ai') && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#06B6D4]/10 text-[#06B6D4] font-bold">🤖 AI</span>}
                      </div>
                    )}
                    {/* Skills */}
                    {app.skills?.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-3">
                        {app.skills.slice(0, 3).map((s: string) => (
                          <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#666]">{SKILL_LABELS[s] || s}</span>
                        ))}
                      </div>
                    )}
                    {app.status === 'approved' && stats && (<>
                      {/* Level badge */}
                      {(() => { const lvl = LEVEL_CONFIG[(app as any).level || 'starter']; return (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: lvl.bg, color: lvl.color }}>{lvl.label}</span>
                        </div>
                      )})()}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-1.5 bg-[#F9FAFB] rounded-lg"><div className="text-xs font-bold text-[#3B82F6]">{stats.done}</div><div className="text-[8px] text-[#999]">Ажил</div></div>
                        <div className="text-center p-1.5 bg-[#F9FAFB] rounded-lg"><div className="text-xs font-bold text-[#F59E0B]">{stats.rating > 0 ? `⭐${stats.rating.toFixed(1)}` : '—'}</div><div className="text-[8px] text-[#999]">Үнэлгээ</div></div>
                        <div className="text-center p-1.5 bg-[#F9FAFB] rounded-lg"><div className="text-xs font-bold text-[#10B981]">₮{((stats.earned || 0) / 1000).toFixed(0)}K</div><div className="text-[8px] text-[#999]">Орлого</div></div>
                      </div>
                      {/* Actions for approved */}
                      <div className="flex gap-1.5 pt-2 border-t border-[#E5E7EB]">
                        <button onClick={() => { setLevelModal(app); setNewLevel((app as any).level || 'starter') }}
                          className="flex-1 py-1.5 bg-[#F3F4F6] text-[#555] rounded-lg text-[10px] font-medium hover:bg-[#E5E7EB]">Түвшин</button>
                        <button onClick={() => setSelectedApp(app)}
                          className="flex-1 py-1.5 bg-[#F3F4F6] text-[#555] rounded-lg text-[10px] font-medium hover:bg-[#E5E7EB]">Дэлгэрэнгүй</button>
                        <button onClick={() => suspendCreator(app.id)}
                          className="py-1.5 px-2 bg-[#EF4444]/8 text-[#EF4444] rounded-lg text-[10px] font-medium hover:bg-[#EF4444]/15">Зогсоох</button>
                      </div>
                    </>)}
                    {app.status === 'pending' && (
                      <div className="flex gap-2 pt-2 border-t border-[#E5E7EB]">
                        <button onClick={() => approve(app.id)} disabled={processing} className="flex-1 py-1.5 bg-[#10B981] text-white rounded-lg text-[11px] font-bold disabled:opacity-50">Батлах</button>
                        <button onClick={() => reject(app.id)} disabled={processing} className="flex-1 py-1.5 bg-white text-[#EF4444] border border-[#EF4444]/20 rounded-lg text-[11px] font-bold disabled:opacity-50">Татгалзах</button>
                        <button onClick={() => setSelectedApp(app)} className="py-1.5 px-2 bg-[#F9FAFB] text-[#999] rounded-lg text-[11px]">⋯</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ PACKAGES TAB ═══ */}
      {sub === 'packages' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-[#888]">{packages.length} багц бүртгэлтэй</div>
            <button onClick={() => { resetPkgForm(); setShowPkgForm(true) }}
              className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg text-xs font-bold hover:bg-[#E55D00]">+ Шинэ багц</button>
          </div>

          {packages.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-xl border border-[#E5E7EB]">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-sm font-bold text-[#111] mb-1">UGC багц байхгүй</div>
              <div className="text-xs text-[#999] mb-4">Багц үүсгэж хэрэглэгчдэд санал болгоорой</div>
              <button onClick={() => { resetPkgForm(); setShowPkgForm(true) }}
                className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg text-xs font-bold">Багц үүсгэх</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {packages.map(pkg => (
                <div key={pkg.id} className={`bg-white border rounded-xl overflow-hidden transition-all ${pkg.is_popular ? 'border-[#3B82F6] shadow-md' : 'border-[#E5E7EB]'}`}>
                  {pkg.is_popular && <div className="bg-[#3B82F6] text-white text-[10px] font-bold text-center py-1">Эрэлттэй</div>}
                  {pkg.discount_label && <div className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#10B981] text-white">{pkg.discount_label}</div>}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-bold text-[#111]">{pkg.name}</h3>
                      <span className="text-[10px] text-[#888]">{pkg.duration_months} сар</span>
                    </div>
                    <div className="text-2xl font-bold text-[#111] mb-1">
                      ₮{Number(pkg.discount_price || pkg.price).toLocaleString()}
                    </div>
                    {pkg.discount_price > 0 && pkg.discount_price < pkg.price && (
                      <div className="text-xs text-[#999] line-through">₮{Number(pkg.price).toLocaleString()}</div>
                    )}
                    <p className="text-xs text-[#888] mt-2 mb-3 line-clamp-2">{pkg.description || pkg.target_audience}</p>
                    <div className="space-y-1.5 mb-3">
                      <div className="text-xs text-[#10B981] flex items-center gap-1.5">
                        <span>✓</span> Reel хамтран: {pkg.content_count} ширхэг
                      </div>
                      {pkg.features?.map((f: string, i: number) => (
                        <div key={i} className="text-xs text-[#10B981] flex items-center gap-1.5">
                          <span>✓</span> {f}
                        </div>
                      ))}
                    </div>
                    {pkg.has_brand_boost && (
                      <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-2.5 mb-3">
                        <div className="text-[10px] font-bold text-[#10B981] mb-0.5">&quot;Онцгой Брэнд boost&quot; багц</div>
                        <div className="text-[10px] text-[#666]">{pkg.brand_boost_description}</div>
                        {pkg.brand_boost_price > 0 && <div className="text-[10px] text-[#FF6B00] font-bold mt-1">Нийт үнэ: ₮{Number(pkg.brand_boost_price).toLocaleString()}</div>}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-[#E5E7EB]">
                      <button onClick={() => editPkg(pkg)} className="flex-1 py-1.5 bg-[#F3F4F6] text-[#555] rounded-lg text-[11px] font-medium hover:bg-[#E5E7EB]">Засах</button>
                      <button onClick={() => deletePkg(pkg.id)} className="py-1.5 px-3 bg-[#FEE2E2] text-[#EF4444] rounded-lg text-[11px] font-medium hover:bg-[#FECACA]">Устгах</button>
                      <div className={`py-1.5 px-2 rounded-lg text-[10px] font-bold ${pkg.is_active ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-[#F3F4F6] text-[#999]'}`}>
                        {pkg.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Package form modal */}
          {showPkgForm && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { setShowPkgForm(false); resetPkgForm() }}>
              <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#111]">{editingPkg ? 'Багц засах' : 'Шинэ багц'}</h2>
                  <button onClick={() => { setShowPkgForm(false); resetPkgForm() }} className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[#999] text-sm">✕</button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#888] uppercase mb-1 block">Нэр *</label>
                      <input value={pkgForm.name} onChange={e => setPkgForm({...pkgForm, name: e.target.value})} placeholder="Starter"
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#888] uppercase mb-1 block">Slug *</label>
                      <input value={pkgForm.slug} onChange={e => setPkgForm({...pkgForm, slug: e.target.value})} placeholder="starter"
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#888] uppercase mb-1 block">Тайлбар</label>
                    <textarea value={pkgForm.description} onChange={e => setPkgForm({...pkgForm, description: e.target.value})} rows={2} placeholder="Эхлэж буй бизнес хэрэглэгчдэд зориулав."
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00] resize-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#888] uppercase mb-1 block">Зорилтот хэрэглэгч</label>
                    <input value={pkgForm.target_audience} onChange={e => setPkgForm({...pkgForm, target_audience: e.target.value})} placeholder="Жижиг бизнес эрхлэгчид"
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#888] uppercase mb-1 block">Үнэ (₮)</label>
                      <input type="number" value={pkgForm.price} onChange={e => setPkgForm({...pkgForm, price: Number(e.target.value)})}
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#888] uppercase mb-1 block">Хямдралтай үнэ</label>
                      <input type="number" value={pkgForm.discount_price} onChange={e => setPkgForm({...pkgForm, discount_price: Number(e.target.value)})}
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#888] uppercase mb-1 block">Хямдрал шошго</label>
                      <input value={pkgForm.discount_label} onChange={e => setPkgForm({...pkgForm, discount_label: e.target.value})} placeholder="5% OFF"
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#888] uppercase mb-1 block">Хугацаа (сар)</label>
                      <input type="number" min={1} value={pkgForm.duration_months} onChange={e => setPkgForm({...pkgForm, duration_months: Number(e.target.value)})}
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#888] uppercase mb-1 block">Контент тоо</label>
                      <input type="number" min={1} value={pkgForm.content_count} onChange={e => setPkgForm({...pkgForm, content_count: Number(e.target.value)})}
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#888] uppercase mb-1 block">Эрэмбэ</label>
                      <input type="number" value={pkgForm.sort_order} onChange={e => setPkgForm({...pkgForm, sort_order: Number(e.target.value)})}
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#888] uppercase mb-1 block">Онцлогууд (мөр бүрт нэг)</label>
                    <textarea value={pkgForm.features.join('\n')} onChange={e => setPkgForm({...pkgForm, features: e.target.value.split('\n').filter(Boolean)})} rows={3}
                      placeholder={'Нэмэлт үнэ цэн\nUGC Маркетингийн гарын авлага\nБрэндүүдийн хаалттай community'}
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00] resize-none" />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={pkgForm.is_active} onChange={e => setPkgForm({...pkgForm, is_active: e.target.checked})} className="w-4 h-4 rounded accent-[#FF6B00]" />
                      <span className="text-xs text-[#555]">Идэвхтэй</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={pkgForm.is_popular} onChange={e => setPkgForm({...pkgForm, is_popular: e.target.checked})} className="w-4 h-4 rounded accent-[#3B82F6]" />
                      <span className="text-xs text-[#555]">Эрэлттэй</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={pkgForm.has_brand_boost} onChange={e => setPkgForm({...pkgForm, has_brand_boost: e.target.checked})} className="w-4 h-4 rounded accent-[#10B981]" />
                      <span className="text-xs text-[#555]">Brand Boost</span>
                    </label>
                  </div>
                  {pkgForm.has_brand_boost && (
                    <div className="grid grid-cols-2 gap-3 bg-[#F0FDF4] rounded-lg p-3">
                      <div>
                        <label className="text-[10px] font-bold text-[#10B981] uppercase mb-1 block">Boost тайлбар</label>
                        <input value={pkgForm.brand_boost_description} onChange={e => setPkgForm({...pkgForm, brand_boost_description: e.target.value})} placeholder="Онцлох брэнд нийтлэл..."
                          className="w-full px-3 py-2 border border-[#BBF7D0] rounded-lg text-xs outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#10B981] uppercase mb-1 block">Boost үнэ (₮)</label>
                        <input type="number" value={pkgForm.brand_boost_price} onChange={e => setPkgForm({...pkgForm, brand_boost_price: Number(e.target.value)})}
                          className="w-full px-3 py-2 border border-[#BBF7D0] rounded-lg text-xs outline-none" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-6 py-4 border-t border-[#E5E7EB] flex justify-end gap-2">
                  <button onClick={() => { setShowPkgForm(false); resetPkgForm() }} className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-xs text-[#555]">Болих</button>
                  <button onClick={savePkg} className="px-6 py-2 bg-[#FF6B00] text-white rounded-lg text-xs font-bold hover:bg-[#E55D00]">
                    {editingPkg ? 'Хадгалах' : 'Үүсгэх'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ PRICING TAB ═══ */}
      {sub === 'pricing' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {[
                { key: 'social' as const, label: '📱 Сошиал' },
                { key: 'prepress' as const, label: '🖨️ Эх бэлтгэл' },
                { key: 'live' as const, label: '📡 Лайв' },
                { key: 'ai' as const, label: '🤖 AI контент' },
              ].map(t => (
                <button key={t.key} onClick={() => setPricingTab(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium ${pricingTab === t.key ? 'bg-[#FF6B00] text-white' : 'bg-white text-[#555] border border-[#E5E7EB]'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {pricing.length === 0 && (
                <button onClick={async () => { await apiFetch('/creator/pricing/seed', { method: 'POST' }); load() }}
                  className="px-3 py-1.5 bg-[#10B981] text-white rounded-lg text-[11px] font-bold">Анхны үнэ оруулах</button>
              )}
              <button onClick={() => setEditPrice({ service_type: pricingTab, content_type: '', label: '', base_price: 0, margin_percent: 25, rush_multiplier: 1.5, revision_cost: 0, free_revisions: 2, bonus_commission: 0, min_duration: 60, is_active: true, sort_order: 0 })}
                className="px-3 py-1.5 bg-[#FF6B00] text-white rounded-lg text-[11px] font-bold">+ Шинэ үнэ</button>
            </div>
          </div>

          {(() => {
            const filtered = pricing.filter(p => p.service_type === pricingTab)
            return filtered.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-[#E5E7EB]">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-sm font-bold text-[#111] mb-1">Үнэ тохируулга байхгүй</div>
                <div className="text-xs text-[#999]">"Анхны үнэ оруулах" эсвэл "+ Шинэ үнэ" дарна уу</div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                      <th className="text-left py-3 px-4 text-[10px] font-bold text-[#888] uppercase w-8"></th>
                      <th className="text-left py-3 px-4 text-[10px] font-bold text-[#888] uppercase">Контент</th>
                      <th className="text-right py-3 px-4 text-[10px] font-bold text-[#888] uppercase">Суурь үнэ</th>
                      <th className="text-right py-3 px-4 text-[10px] font-bold text-[#888] uppercase">Margin %</th>
                      <th className="text-right py-3 px-4 text-[10px] font-bold text-[#888] uppercase">Эцсийн үнэ</th>
                      <th className="text-right py-3 px-4 text-[10px] font-bold text-[#888] uppercase">Rush ×</th>
                      <th className="text-right py-3 px-4 text-[10px] font-bold text-[#888] uppercase">Засвар үнэ</th>
                      <th className="text-right py-3 px-4 text-[10px] font-bold text-[#888] uppercase">Үнэгүй</th>
                      {pricingTab === 'live' && <th className="text-right py-3 px-4 text-[10px] font-bold text-[#888] uppercase">Bonus %</th>}
                      <th className="text-right py-3 px-4 text-[10px] font-bold text-[#888] uppercase">Үйлдэл</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className={`border-b border-[#E5E7EB] hover:bg-[#FAFAFA] ${!p.is_active ? 'opacity-40' : ''}`}>
                        <td className="py-3 px-4">
                          <button onClick={async () => { await apiFetch('/creator/pricing', { method: 'POST', body: JSON.stringify({ id: p.id, is_active: !p.is_active }) }); load() }}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] transition-colors ${p.is_active ? 'border-[#10B981] bg-[#10B981] text-white' : 'border-[#D1D5DB] text-transparent'}`}>
                            ✓
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#111]">{p.label}</div>
                          <div className="text-[9px] text-[#999]">{p.content_type}</div>
                        </td>
                        <td className="py-3 px-4 text-right text-[#3B82F6] font-bold">₮{Number(p.base_price).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-[#888]">{Number(p.margin_percent)}%</td>
                        <td className="py-3 px-4 text-right text-[#FF6B00] font-bold">₮{Number(p.final_price).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-[#888]">{Number(p.rush_multiplier)}×</td>
                        <td className="py-3 px-4 text-right text-[#888]">₮{Number(p.revision_cost).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-[#888]">{p.free_revisions}</td>
                        {pricingTab === 'live' && <td className="py-3 px-4 text-right text-[#10B981] font-bold">{Number(p.bonus_commission)}%</td>}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setEditPrice({...p})} className="px-2 py-1 text-[10px] text-[#3B82F6] bg-[#3B82F6]/8 rounded hover:bg-[#3B82F6]/15">Засах</button>
                            <button onClick={async () => { if (!confirm('Устгах уу?')) return; await apiFetch(`/creator/pricing/${p.id}`, { method: 'DELETE' }); load() }}
                              className="px-2 py-1 text-[10px] text-[#EF4444] bg-[#EF4444]/8 rounded hover:bg-[#EF4444]/15">Устгах</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Summary row */}
                <div className="px-4 py-3 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-between">
                  <div className="text-[10px] text-[#888]">{filtered.length} үнэ • {filtered.filter(p => p.is_active).length} идэвхтэй</div>
                  <div className="text-[10px] text-[#888]">
                    Дундаж margin: {filtered.length > 0 ? Math.round(filtered.reduce((s: number, p: any) => s + Number(p.margin_percent), 0) / filtered.length) : 0}%
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Edit / Create pricing modal */}
          {editPrice && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditPrice(null)}>
              <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
                  <h2 className="text-base font-bold text-[#111]">{editPrice.id ? `Засах: ${editPrice.label}` : 'Шинэ үнэ нэмэх'}</h2>
                  <button onClick={() => setEditPrice(null)} className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[#999] text-sm hover:bg-[#E5E7EB]">✕</button>
                </div>
                <div className="p-6 space-y-4">
                  {/* Name & slug (only for new) */}
                  {!editPrice.id && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-[#888] uppercase mb-1 block">Нэр *</label>
                        <input value={editPrice.label || ''} onChange={e => setEditPrice({...editPrice, label: e.target.value})} placeholder="Жн: Постер"
                          className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#888] uppercase mb-1 block">Код (content_type) *</label>
                        <input value={editPrice.content_type || ''} onChange={e => setEditPrice({...editPrice, content_type: e.target.value})} placeholder="Жн: poster"
                          className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" />
                      </div>
                    </div>
                  )}

                  {/* Price controls */}
                  <div>
                    <label className="text-[10px] font-bold text-[#888] uppercase mb-2 block">Суурь үнэ (Creator-д олгох)</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditPrice({...editPrice, base_price: Math.max(0, Number(editPrice.base_price) - 5000)})}
                        className="w-9 h-9 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-lg text-[#888] hover:bg-[#F3F4F6]">−</button>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#888]">₮</span>
                        <input type="number" value={editPrice.base_price} onChange={e => setEditPrice({...editPrice, base_price: Number(e.target.value)})}
                          className="w-full pl-8 pr-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm font-bold text-[#3B82F6] outline-none focus:border-[#FF6B00] text-center" />
                      </div>
                      <button onClick={() => setEditPrice({...editPrice, base_price: Number(editPrice.base_price) + 5000})}
                        className="w-9 h-9 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-lg text-[#888] hover:bg-[#F3F4F6]">+</button>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {[5000, 10000, 20000, 50000, 100000].map(v => (
                        <button key={v} onClick={() => setEditPrice({...editPrice, base_price: v})}
                          className={`flex-1 py-1 rounded text-[9px] font-medium border transition-colors ${Number(editPrice.base_price) === v ? 'border-[#3B82F6] bg-[#3B82F6]/8 text-[#3B82F6]' : 'border-[#E5E7EB] text-[#888] hover:border-[#3B82F6]'}`}>
                          ₮{(v/1000)}K
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Margin slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-bold text-[#888] uppercase">Платформ Margin</label>
                      <span className="text-sm font-bold text-[#FF6B00]">{Number(editPrice.margin_percent)}%</span>
                    </div>
                    <input type="range" min={0} max={100} step={5} value={editPrice.margin_percent}
                      onChange={e => setEditPrice({...editPrice, margin_percent: Number(e.target.value)})}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#FF6B00]"
                      style={{ background: `linear-gradient(to right, #FF6B00 ${editPrice.margin_percent}%, #E5E7EB ${editPrice.margin_percent}%)` }} />
                    <div className="flex justify-between text-[8px] text-[#999] mt-1">
                      <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                    </div>
                  </div>

                  {/* Auto-calculated final price */}
                  <div className="bg-gradient-to-r from-[#FFF7ED] to-[#FEF3C7] border border-[#FFEDD5] rounded-xl p-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-[9px] text-[#888] uppercase">Creator авах</div>
                        <div className="text-base font-bold text-[#3B82F6]">₮{Number(editPrice.base_price).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-[#888] uppercase">Платформ орлого</div>
                        <div className="text-base font-bold text-[#10B981]">₮{Math.round(Number(editPrice.base_price) * Number(editPrice.margin_percent) / 100).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-[#888] uppercase">Хэрэглэгч төлөх</div>
                        <div className="text-base font-bold text-[#FF6B00]">₮{Math.round(Number(editPrice.base_price) * (1 + Number(editPrice.margin_percent) / 100)).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Additional settings */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#888] uppercase mb-1 block">Rush үржвэр</label>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditPrice({...editPrice, rush_multiplier: Math.max(1, Number(editPrice.rush_multiplier) - 0.1)})}
                          className="w-8 h-8 rounded border border-[#E5E7EB] flex items-center justify-center text-sm text-[#888]">−</button>
                        <input type="number" step="0.1" value={editPrice.rush_multiplier} onChange={e => setEditPrice({...editPrice, rush_multiplier: Number(e.target.value)})}
                          className="flex-1 px-2 py-2 border border-[#E5E7EB] rounded-lg text-sm text-center outline-none" />
                        <button onClick={() => setEditPrice({...editPrice, rush_multiplier: Number(editPrice.rush_multiplier) + 0.1})}
                          className="w-8 h-8 rounded border border-[#E5E7EB] flex items-center justify-center text-sm text-[#888]">+</button>
                      </div>
                      <div className="text-[9px] text-[#999] mt-1">Rush үнэ: ₮{Math.round(Number(editPrice.base_price) * (1 + Number(editPrice.margin_percent) / 100) * Number(editPrice.rush_multiplier)).toLocaleString()}</div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#888] uppercase mb-1 block">Засвар үнэ</label>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditPrice({...editPrice, revision_cost: Math.max(0, Number(editPrice.revision_cost) - 1000)})}
                          className="w-8 h-8 rounded border border-[#E5E7EB] flex items-center justify-center text-sm text-[#888]">−</button>
                        <input type="number" value={editPrice.revision_cost} onChange={e => setEditPrice({...editPrice, revision_cost: Number(e.target.value)})}
                          className="flex-1 px-2 py-2 border border-[#E5E7EB] rounded-lg text-sm text-center outline-none" />
                        <button onClick={() => setEditPrice({...editPrice, revision_cost: Number(editPrice.revision_cost) + 1000})}
                          className="w-8 h-8 rounded border border-[#E5E7EB] flex items-center justify-center text-sm text-[#888]">+</button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#888] uppercase mb-1 block">Үнэгүй засвар</label>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditPrice({...editPrice, free_revisions: Math.max(0, Number(editPrice.free_revisions) - 1)})}
                          className="w-8 h-8 rounded border border-[#E5E7EB] flex items-center justify-center text-sm text-[#888]">−</button>
                        <input type="number" value={editPrice.free_revisions} onChange={e => setEditPrice({...editPrice, free_revisions: Number(e.target.value)})}
                          className="flex-1 px-2 py-2 border border-[#E5E7EB] rounded-lg text-sm text-center outline-none" />
                        <button onClick={() => setEditPrice({...editPrice, free_revisions: Number(editPrice.free_revisions) + 1})}
                          className="w-8 h-8 rounded border border-[#E5E7EB] flex items-center justify-center text-sm text-[#888]">+</button>
                      </div>
                    </div>
                    {pricingTab === 'live' && (
                      <div>
                        <label className="text-[10px] font-bold text-[#888] uppercase mb-1 block">Bonus комисс %</label>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditPrice({...editPrice, bonus_commission: Math.max(0, Number(editPrice.bonus_commission) - 1)})}
                            className="w-8 h-8 rounded border border-[#E5E7EB] flex items-center justify-center text-sm text-[#888]">−</button>
                          <input type="number" value={editPrice.bonus_commission} onChange={e => setEditPrice({...editPrice, bonus_commission: Number(e.target.value)})}
                            className="flex-1 px-2 py-2 border border-[#E5E7EB] rounded-lg text-sm text-center outline-none" />
                          <button onClick={() => setEditPrice({...editPrice, bonus_commission: Number(editPrice.bonus_commission) + 1})}
                            className="w-8 h-8 rounded border border-[#E5E7EB] flex items-center justify-center text-sm text-[#888]">+</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editPrice.is_active !== false} onChange={e => setEditPrice({...editPrice, is_active: e.target.checked})}
                      className="w-4 h-4 rounded accent-[#10B981]" />
                    <span className="text-xs text-[#555]">Идэвхтэй</span>
                  </label>
                </div>

                <div className="px-6 py-4 border-t border-[#E5E7EB] flex gap-2">
                  <button onClick={() => setEditPrice(null)} className="flex-1 py-2.5 border border-[#E5E7EB] rounded-lg text-xs text-[#555]">Болих</button>
                  <button onClick={async () => {
                    if (!editPrice.id && (!editPrice.label || !editPrice.content_type)) { alert('Нэр, код бөглөнө үү'); return }
                    await apiFetch('/creator/pricing', { method: 'POST', body: JSON.stringify(editPrice) })
                    setEditPrice(null); load()
                  }} className="flex-1 py-2.5 bg-[#FF6B00] text-white rounded-lg text-xs font-bold hover:bg-[#E55D00]">
                    {editPrice.id ? 'Хадгалах' : 'Үүсгэх'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ MODALS ═══ */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedApp(null)}>
          <div className="bg-white rounded-2xl max-w-[600px] w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-base font-bold text-[#111]">Creator өргөдөл — шалгах</h2>
              <button onClick={() => setSelectedApp(null)} className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[#999] text-sm hover:bg-[#E5E7EB]">✕</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-white text-2xl font-bold shrink-0">
                  {selectedApp.full_name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div className="text-lg font-bold text-[#111]">{selectedApp.full_name}</div>
                  <div className="text-xs text-[#999]">{selectedApp.email}{selectedApp.phone ? ` • ${selectedApp.phone}` : ''}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{
                      color: APP_STATUS[selectedApp.status]?.color || '#6B7280',
                      background: (APP_STATUS[selectedApp.status]?.color || '#6B7280') + '12'
                    }}>{APP_STATUS[selectedApp.status]?.label || selectedApp.status}</span>
                    <span className="text-[9px] text-[#999]">• {new Date(selectedApp.created_at).toLocaleDateString('mn-MN')}</span>
                  </div>
                </div>
              </div>

              {/* Capabilities (what they're applying for) */}
              {selectedApp.capabilities?.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2 block">Бүтээгчийн чиглэл</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'social', label: 'Сошиал контент', icon: '📱', color: '#FF6B00', aliases: ['ugc'] },
                      { key: 'prepress', label: 'Хэвлэлийн эх бэлтгэл', icon: '🖨️', color: '#8B5CF6', aliases: ['design'] },
                      { key: 'live', label: 'Лайв стримэр', icon: '📡', color: '#EC4899', aliases: [] },
                      { key: 'ai', label: 'AI контент бүтээгч', icon: '🤖', color: '#06B6D4', aliases: [] },
                    ].filter(c => selectedApp.capabilities.includes(c.key) || c.aliases?.some((a: string) => selectedApp.capabilities.includes(a))).map(c => (
                      <div key={c.key} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: c.color + '40', background: c.color + '08' }}>
                        <span className="text-lg">{c.icon}</span>
                        <span className="text-xs font-bold" style={{ color: c.color }}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {selectedApp.bio && (
                <div>
                  <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1.5 block">Танилцуулга</label>
                  <div className="text-sm text-[#111] bg-[#F9FAFB] rounded-xl p-4 leading-relaxed">{selectedApp.bio}</div>
                </div>
              )}

              {/* Skills */}
              {selectedApp.skills?.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1.5 block">Ур чадвар</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedApp.skills.map((s: string) => (
                      <span key={s} className="text-[11px] px-3 py-1 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] font-medium">{SKILL_LABELS[s] || s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio */}
              {selectedApp.portfolio_url && (
                <div>
                  <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1.5 block">Портфолио</label>
                  <a href={selectedApp.portfolio_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-sm text-[#3B82F6] hover:bg-[#DBEAFE] transition-colors">
                    <span>🔗</span>
                    <span className="truncate">{selectedApp.portfolio_url}</span>
                    <span className="ml-auto text-[10px]">↗</span>
                  </a>
                </div>
              )}

              {/* Sample works */}
              {selectedApp.sample_urls?.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1.5 block">Жишээ ажлууд ({selectedApp.sample_urls.length})</label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedApp.sample_urls.map((url: string, i: number) => {
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
                      return isImage ? (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="aspect-video bg-[#F3F4F6] rounded-xl overflow-hidden border border-[#E5E7EB] hover:border-[#8B5CF6] transition-colors">
                          <img src={url} alt={`Sample ${i + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <a key={i} href={url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 px-3 py-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] hover:border-[#8B5CF6] text-xs text-[#3B82F6] transition-colors">
                          <span>📎</span>
                          <span className="truncate">Файл {i + 1}</span>
                          <span className="ml-auto">↗</span>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Motivation */}
              {selectedApp.motivation && (
                <div>
                  <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1.5 block">Яагаад Creator болмоор байна вэ?</label>
                  <div className="text-sm text-[#111] bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl p-4 leading-relaxed italic">"{selectedApp.motivation}"</div>
                </div>
              )}

              {/* Admin notes for rejected */}
              {selectedApp.status === 'rejected' && selectedApp.reject_reason && (
                <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-xl p-4">
                  <label className="text-[10px] font-bold text-[#EF4444] uppercase tracking-wider mb-1 block">Татгалзсан шалтгаан</label>
                  <div className="text-xs text-[#991B1B]">{selectedApp.reject_reason}</div>
                </div>
              )}

              {/* Action buttons */}
              {selectedApp.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => approve(selectedApp.id)} disabled={processing}
                    className="flex-1 py-3 bg-[#10B981] text-white rounded-xl text-sm font-bold hover:bg-[#059669] disabled:opacity-50 transition-colors">
                    ✓ Батлах
                  </button>
                  <button onClick={() => reject(selectedApp.id)} disabled={processing}
                    className="flex-1 py-3 bg-white text-[#EF4444] border-2 border-[#EF4444] rounded-xl text-sm font-bold hover:bg-[#FEE2E2] disabled:opacity-50 transition-colors">
                    ✕ Татгалзах
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ PERFORMANCE TAB ═══ */}
      {sub === 'performance' && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <div className="text-[10px] text-[#888] mb-1">Шилдэг (⭐4.5+)</div>
              <div className="text-2xl font-bold text-[#10B981]">{topPerformers.length}</div>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <div className="text-[10px] text-[#888] mb-1">Шинэ (30 хоног)</div>
              <div className="text-2xl font-bold text-[#3B82F6]">{newCreators.length}</div>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <div className="text-[10px] text-[#888] mb-1">Бага гүйцэтгэл</div>
              <div className="text-2xl font-bold text-[#F59E0B]">{lowPerformers.length}</div>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <div className="text-[10px] text-[#888] mb-1">Идэвхгүй</div>
              <div className="text-2xl font-bold text-[#EF4444]">{inactiveCreators.length}</div>
            </div>
          </div>

          {/* Top performers */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-bold text-[#111] mb-4">🏆 Шилдэг Creators (⭐4.5+, 5+ ажил)</h3>
            {topPerformers.length === 0 ? (
              <div className="text-center py-8 text-[#999] text-xs">Шалгуурт нийцэх creator байхгүй</div>
            ) : (
              <div className="space-y-2">
                {topPerformers.map((c, i) => {
                  const lvl = LEVEL_CONFIG[(c as any).level || 'starter']
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FAFAFA]">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ background: i < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][i] : '#F3F4F6', color: i < 3 ? '#fff' : '#999' }}>{i + 1}</div>
                      <div className="w-9 h-9 rounded-full bg-[#8B5CF6]/12 flex items-center justify-center text-sm font-bold text-[#8B5CF6]">{c.full_name?.charAt(0)?.toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[#111]">{c.full_name}</span>
                          {lvl && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: lvl.bg, color: lvl.color }}>{lvl.label}</span>}
                        </div>
                        <div className="text-[10px] text-[#999]">{c.done} ажил · ⭐{(c.rating || 0).toFixed(1)} · ₮{c.earned.toLocaleString()}</div>
                      </div>
                      <button onClick={() => { setLevelModal(c); setNewLevel((c as any).level || 'starter') }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-[#F3F4F6] text-[#555] hover:bg-[#E5E7EB]">Түвшин</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Low performers */}
          {lowPerformers.length > 0 && (
            <div className="bg-white rounded-xl border border-[#FED7AA] p-5">
              <h3 className="text-sm font-bold text-[#111] mb-4">⚠️ Бага гүйцэтгэлтэй (⭐3.5-ээс доош)</h3>
              <div className="space-y-2">
                {lowPerformers.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#FFFBEB]">
                    <div className="w-9 h-9 rounded-full bg-[#F59E0B]/12 flex items-center justify-center text-sm font-bold text-[#F59E0B]">{c.full_name?.charAt(0)?.toUpperCase()}</div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-[#111]">{c.full_name}</div>
                      <div className="text-[10px] text-[#999]">{c.done} ажил · ⭐{(c.rating || 0).toFixed(1)}</div>
                    </div>
                    <button onClick={() => suspendCreator(c.id)} className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20">Түр зогсоох</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inactive */}
          {inactiveCreators.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <h3 className="text-sm font-bold text-[#111] mb-4">😴 Идэвхгүй Creators (0 ажил)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {inactiveCreators.map(c => (
                  <div key={c.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F9FAFB]">
                    <div className="w-8 h-8 rounded-full bg-[#6B7280]/10 flex items-center justify-center text-[10px] font-bold text-[#6B7280]">{c.full_name?.charAt(0)?.toUpperCase()}</div>
                    <div className="text-xs text-[#888] truncate">{c.full_name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ REVENUE TAB ═══ */}
      {sub === 'revenue' && (
        <div className="space-y-5">
          {/* Revenue KPIs */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <div className="text-[10px] text-[#888] mb-1">Нийт орлого (UGC)</div>
              <div className="text-xl font-bold text-[#111]">₮{(totalCreatorPayouts + totalPlatformRevenue).toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <div className="text-[10px] text-[#888] mb-1">Платформ орлого</div>
              <div className="text-xl font-bold text-[#10B981]">₮{totalPlatformRevenue.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <div className="text-[10px] text-[#888] mb-1">Creator-уудад</div>
              <div className="text-xl font-bold text-[#8B5CF6]">₮{totalCreatorPayouts.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <div className="text-[10px] text-[#888] mb-1">Дундаж захиалга</div>
              <div className="text-xl font-bold text-[#3B82F6]">₮{Math.round(avgOrderValue).toLocaleString()}</div>
            </div>
          </div>

          {/* Revenue by creator */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-bold text-[#111] mb-4">💰 Creator тус бүрийн орлого</h3>
            {creatorStats.length === 0 ? (
              <div className="text-center py-8 text-[#999] text-xs">Өгөгдөл байхгүй</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-[#888] uppercase tracking-wider">
                    <th className="text-left py-2 px-2">#</th>
                    <th className="text-left py-2 px-2">Creator</th>
                    <th className="text-left py-2 px-2">Төрөл</th>
                    <th className="text-right py-2 px-2">Ажил</th>
                    <th className="text-right py-2 px-2">Нийт орлого</th>
                    <th className="text-right py-2 px-2">Платформ авсан</th>
                    <th className="text-right py-2 px-2">Үнэлгээ</th>
                  </tr>
                </thead>
                <tbody>
                  {creatorStats.sort((a, b) => b.earned - a.earned).map((c, i) => {
                    const platformCut = Math.round(c.earned * (settings.commissionPercent / (100 - settings.commissionPercent)))
                    const caps = ((c as any).capabilities || []) as string[]
                    return (
                      <tr key={c.id} className="border-t border-[#F3F4F6] hover:bg-[#FAFAFA]">
                        <td className="py-2.5 px-2 text-xs text-[#888]">{i + 1}</td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#8B5CF6]/12 flex items-center justify-center text-[10px] font-bold text-[#8B5CF6]">{c.full_name?.charAt(0)?.toUpperCase()}</div>
                            <span className="text-xs font-medium text-[#111]">{c.full_name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="flex gap-1">{caps.slice(0, 2).map(cap => {
                            const cfg = CAP_LABELS[cap]
                            return cfg ? <span key={cap} className="text-[9px] px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#555]">{cfg.icon} {cfg.label}</span> : null
                          })}</div>
                        </td>
                        <td className="py-2.5 px-2 text-right text-xs font-medium text-[#111]">{c.done}</td>
                        <td className="py-2.5 px-2 text-right text-xs font-bold text-[#8B5CF6]">₮{c.earned.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right text-xs font-medium text-[#10B981]">₮{platformCut.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right text-xs">{c.rating > 0 ? <span className="text-[#F59E0B]">★ {c.rating.toFixed(1)}</span> : <span className="text-[#CCC]">—</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Commission summary */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-bold text-[#111] mb-3">📊 Комиссийн тойм</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-4 bg-[#F3F4F6] rounded-full overflow-hidden flex">
                <div className="h-full bg-[#8B5CF6] rounded-l-full" style={{ width: `${100 - settings.commissionPercent}%` }} />
                <div className="h-full bg-[#10B981] rounded-r-full" style={{ width: `${settings.commissionPercent}%` }} />
              </div>
              <div className="flex gap-4 text-[10px] shrink-0">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#8B5CF6]" />Creator {100 - settings.commissionPercent}%</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#10B981]" />Платформ {settings.commissionPercent}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SETTINGS TAB ═══ */}
      {sub === 'settings' && (<GovernancePanel settings={settings} setSettings={setSettings} saveSettings={saveSettings}
        creatorStats={creatorStats} allApps={allApps} processing={processing}
        updatePermissions={(id: string, data: any) => apiFetch(`/creator/permissions/${id}`, { method: 'PATCH', body: JSON.stringify(data) })}
        addPenalty={(data: any) => apiFetch('/creator/penalties', { method: 'POST', body: JSON.stringify(data) })}
        calculatePayout={(amount: number) => settings}
      />)}

      {/* ═══ LEVEL MODAL (Score-based + Admin override) ═══ */}
      {levelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setLevelModal(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-[#111] mb-1">Creator түвшин</h3>
            <p className="text-xs text-[#888] mb-4">{levelModal.full_name}</p>

            {/* Current score display */}
            <div className="bg-[#F9FAFB] rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-[#888]">Системийн оноо</span>
                <span className="text-lg font-bold text-[#111]">{(levelModal as any).score || '—'}<span className="text-xs font-normal text-[#888]">/100</span></span>
              </div>
              <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full bg-[#FF6B00] transition-all" style={{ width: `${(levelModal as any).score || 0}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white rounded-lg p-2"><div className="text-[9px] text-[#888]">⭐ Үнэлгээ</div><div className="text-xs font-bold">{(levelModal as any).rating?.toFixed(1) || '—'}</div></div>
                <div className="bg-white rounded-lg p-2"><div className="text-[9px] text-[#888]">📦 Ажил</div><div className="text-xs font-bold">{(levelModal as any).done || 0}</div></div>
                <div className="bg-white rounded-lg p-2"><div className="text-[9px] text-[#888]">💰 Орлого</div><div className="text-xs font-bold">₮{((levelModal as any).earned || 0).toLocaleString()}</div></div>
              </div>
            </div>

            {/* Auto-refresh button */}
            <button onClick={async () => {
              try {
                const result = await apiFetch<any>(`/creator/score/${levelModal.user_id || levelModal.id}/refresh`, { method: 'POST' })
                if (result) { setNewLevel(result.level); alert(`Шинэ оноо: ${result.score}, Түвшин: ${result.level}`) }
                load()
              } catch (e: any) { alert(e.message || 'Алдаа') }
            }} className="w-full py-2 bg-[#3B82F6] text-white rounded-xl text-xs font-bold mb-3 hover:bg-[#2563EB]">
              🔄 Оноо дахин тооцоолох (автомат)
            </button>

            {/* Admin override */}
            <div className="border-t border-[#E5E7EB] pt-3 mb-3">
              <p className="text-[10px] text-[#888] mb-2">⚠️ Админ override (онцгой тохиолдолд)</p>
              <div className="grid grid-cols-4 gap-1.5">
                {LEVELS.map(l => {
                  const cfg = LEVEL_CONFIG[l]
                  return (
                    <button key={l} onClick={() => setNewLevel(l)}
                      className="px-2 py-2 rounded-lg text-[11px] font-medium transition-all"
                      style={{ background: newLevel === l ? cfg.bg : '#F9FAFB', border: `1.5px solid ${newLevel === l ? cfg.color : 'transparent'}`, color: newLevel === l ? cfg.color : '#888' }}>
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setLevelModal(null)} className="flex-1 py-2.5 bg-[#F3F4F6] text-[#555] rounded-xl text-sm font-medium">Болих</button>
              <button onClick={() => promoteCreator(levelModal.id, newLevel)} disabled={processing}
                className="flex-1 py-2.5 bg-[#FF6B00] text-white rounded-xl text-sm font-bold disabled:opacity-50">Override хадгалах</button>
            </div>
          </div>
        </div>
      )}

      {selectedUgc && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedUgc(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><span className="text-2xl">{CT_ICON[selectedUgc.content_type] || '🎨'}</span><div><h2 className="text-base font-bold text-[#111]">{selectedUgc.title}</h2><div className="text-[10px] text-[#999]">{selectedUgc.content_type} • {selectedUgc.package}</div></div></div>
              <button onClick={() => setSelectedUgc(null)} className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[#999] text-sm">✕</button>
            </div>
            <div className="bg-[#F9FAFB] rounded-lg p-3 mb-3 text-xs text-[#111]">{selectedUgc.description}</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[{ l: 'Захиалагч', v: selectedUgc.customer_name }, { l: 'Creator', v: selectedUgc.creator_name || '—' }, { l: 'Нийт үнэ', v: `₮${Number(selectedUgc.budget).toLocaleString()}` }, { l: 'Засвар', v: `${selectedUgc.revision_count || 0}/${selectedUgc.max_revisions}` }].map((s, i) => (
                <div key={i} className="bg-[#F9FAFB] rounded-lg p-2.5"><div className="text-[9px] text-[#999]">{s.l}</div><div className="text-xs font-bold text-[#111]">{s.v}</div></div>
              ))}
            </div>
            {selectedUgc.deliverable_urls?.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-3">{selectedUgc.deliverable_urls.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" rel="noreferrer" className="text-[10px] text-[#3B82F6] bg-[#3B82F6]/8 px-2.5 py-1 rounded-lg">📎 Файл {i + 1}</a>
              ))}</div>
            )}
            {selectedUgc.status === 'approved' && !selectedUgc.is_released && (
              <button onClick={() => { release(selectedUgc.id); setSelectedUgc(null) }} className="w-full py-2.5 bg-[#10B981] text-white rounded-xl text-xs font-bold">Төлбөр гаргах</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════
 *  GOVERNANCE PANEL — sub-component
 * ═══════════════════════════════════════ */

type GovTab = 'general' | 'permissions' | 'contracts' | 'tax' | 'penalties'

function GovernancePanel({ settings, setSettings, saveSettings, creatorStats, allApps, processing, updatePermissions, addPenalty }: {
  settings: any; setSettings: (fn: any) => void; saveSettings: () => void
  creatorStats: any[]; allApps: any[]; processing: boolean
  updatePermissions: (id: string, data: any) => Promise<any>
  addPenalty: (data: any) => Promise<any>
  calculatePayout: (amount: number) => any
}) {
  const [govTab, setGovTab] = useState<GovTab>('general')
  const [selectedCreator, setSelectedCreator] = useState<any>(null)
  const [permData, setPermData] = useState<any>(null)
  const [penaltyForm, setPenaltyForm] = useState({ type: 'warning', reason: 'other', description: '' })
  const [payoutPreview, setPayoutPreview] = useState(100000)

  const GOV_TABS: { key: GovTab; label: string; icon: string }[] = [
    { key: 'general', label: 'Ерөнхий', icon: '⚙️' },
    { key: 'permissions', label: 'Эрх', icon: '🔒' },
    { key: 'contracts', label: 'Гэрээ', icon: '📜' },
    { key: 'tax', label: 'Татвар & Төлбөр', icon: '💰' },
    { key: 'penalties', label: 'Шийтгэл', icon: '⚖️' },
  ]

  const approved = allApps.filter((a: any) => a.status === 'approved')
  const commRate = settings.commissionPercent || 20
  const taxRate = 10
  const previewCommission = Math.round(payoutPreview * (commRate / 100))
  const previewAfterComm = payoutPreview - previewCommission
  const previewTax = Math.round(previewAfterComm * (taxRate / 100))
  const previewCreatorGets = previewAfterComm - previewTax

  const loadPerms = async (creatorId: string) => {
    try {
      const p = await apiFetch<any>(`/creator/permissions/${creatorId}`)
      setPermData(p)
    } catch { setPermData({ can_receive_orders: true, can_show_profile: true, can_withdraw: true, can_create_packages: true, can_access_marketplace: true, can_go_live: true }) }
  }

  const togglePerm = async (key: string) => {
    if (!selectedCreator || !permData) return
    const updated = { ...permData, [key]: !permData[key] }
    setPermData(updated)
    await updatePermissions(selectedCreator.user_id || selectedCreator.id, { [key]: updated[key] }).catch(() => {})
  }

  const submitPenalty = async () => {
    if (!selectedCreator || !penaltyForm.description) return alert('Тайлбар бичнэ үү')
    await addPenalty({ creator_id: selectedCreator.user_id || selectedCreator.id, ...penaltyForm }).catch((e: any) => alert(e.message || 'Алдаа'))
    setPenaltyForm({ type: 'warning', reason: 'other', description: '' })
  }

  return (
    <div>
      {/* Gov sub-tabs */}
      <div className="flex gap-1.5 mb-5 bg-[#F9FAFB] p-1 rounded-xl inline-flex">
        {GOV_TABS.map(t => (
          <button key={t.key} onClick={() => setGovTab(t.key)}
            className={`px-3 py-2 rounded-lg text-[11px] font-medium transition-colors ${govTab === t.key ? 'bg-white text-[#111] shadow-sm' : 'text-[#888] hover:text-[#555]'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── GENERAL ── */}
      {govTab === 'general' && (
        <div className="max-w-2xl space-y-5">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-bold text-[#111] mb-4">Комисс & Орлого</h3>
            <div className="mb-4">
              <label className="text-[11px] font-medium text-[#555] mb-1 block">Платформ комисс (%)</label>
              <input type="number" min={0} max={50} value={settings.commissionPercent}
                onChange={e => setSettings((s: any) => ({ ...s, commissionPercent: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-sm focus:border-[#FF6B00] outline-none" />
              <div className="text-[10px] text-[#999] mt-1">Creator: {100 - settings.commissionPercent}% · Платформ: {settings.commissionPercent}%</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-bold text-[#111] mb-4">Marketplace тохиргоо</h3>
            <div className="space-y-4">
              {[
                { key: 'allowDirectHire', label: 'Шууд захиалга', desc: 'Захиалагч creator-г шууд сонгох' },
                { key: 'showRatings', label: 'Үнэлгээ харуулах', desc: 'Creator үнэлгээг нийтэд' },
                { key: 'showEarnings', label: 'Орлого харуулах', desc: 'Creator орлогыг профайлд' },
                { key: 'requirePortfolio', label: 'Портфолио шаардах', desc: 'Marketplace-д гарахад заавал' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between gap-4">
                  <div><div className="text-xs font-medium text-[#111]">{item.label}</div><div className="text-[10px] text-[#999]">{item.desc}</div></div>
                  <button onClick={() => setSettings((s: any) => ({ ...s, [item.key]: !(s as any)[item.key] }))}
                    className="w-10 h-5 rounded-full p-0.5 transition-colors" style={{ background: (settings as any)[item.key] ? '#FF6B00' : '#D1D5DB' }}>
                    <div className="w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: (settings as any)[item.key] ? 'translateX(20px)' : 'translateX(0)' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-bold text-[#111] mb-4">Түвшин & Шаардлага</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-[#555] mb-1 block">Marketplace-д гарах хамгийн бага түвшин</label>
                <select value={settings.minLevelForMarketplace} onChange={e => setSettings((s: any) => ({ ...s, minLevelForMarketplace: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-sm focus:border-[#FF6B00] outline-none">
                  {(['starter','pro','expert','elite'] as const).map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[#555] mb-1 block">Хамгийн бага портфолио тоо</label>
                <input type="number" min={0} max={20} value={settings.minPortfolioItems}
                  onChange={e => setSettings((s: any) => ({ ...s, minPortfolioItems: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-sm focus:border-[#FF6B00] outline-none" />
              </div>
            </div>
          </div>
          <button onClick={saveSettings} className="px-6 py-2.5 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#E55D00] transition-colors">Хадгалах</button>
        </div>
      )}

      {/* ── PERMISSIONS ── */}
      {govTab === 'permissions' && (
        <div className="grid md:grid-cols-[280px_1fr] gap-5">
          {/* Creator list */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 max-h-[70vh] overflow-y-auto">
            <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Creator сонгох</h4>
            {approved.length === 0 ? (
              <div className="text-center py-8 text-[#999] text-xs">Creator байхгүй</div>
            ) : approved.map((c: any) => (
              <button key={c.id} onClick={() => { setSelectedCreator(c); loadPerms(c.user_id || c.id) }}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg mb-1 text-left transition-colors ${
                  selectedCreator?.id === c.id ? 'bg-[#FF6B00]/8 border border-[#FF6B00]/20' : 'hover:bg-[#FAFAFA]'}`}>
                <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/12 flex items-center justify-center text-[10px] font-bold text-[#8B5CF6]">{c.full_name?.charAt(0)?.toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[#111] truncate">{c.full_name}</div>
                  <div className="text-[9px] text-[#999]">{c.email}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Permission toggles */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            {!selectedCreator ? (
              <div className="text-center py-16 text-[#999]">
                <div className="text-3xl mb-2">🔒</div>
                <div className="text-sm">Creator сонгоно уу</div>
              </div>
            ) : !permData ? (
              <div className="text-center py-16 text-[#999] text-sm">Ачааллж байна...</div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E5E7EB]">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-white text-lg font-bold">{selectedCreator.full_name?.charAt(0)?.toUpperCase()}</div>
                  <div>
                    <div className="text-base font-bold text-[#111]">{selectedCreator.full_name}</div>
                    <div className="text-xs text-[#999]">{selectedCreator.email}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { key: 'can_receive_orders', label: 'Захиалга авах', desc: 'Шинэ ажлын захиалга хүлээн авах', icon: '📥' },
                    { key: 'can_show_profile', label: 'Профайл харуулах', desc: 'Marketplace дээр профайл харагдах', icon: '👤' },
                    { key: 'can_withdraw', label: 'Мөнгө авах', desc: 'Орлогоосоо мөнгө авах эрх', icon: '💸' },
                    { key: 'can_create_packages', label: 'Багц үүсгэх', desc: 'Өөрийн үнийн багц нэмэх', icon: '📦' },
                    { key: 'can_access_marketplace', label: 'Marketplace хандах', desc: 'Marketplace-д харагдах', icon: '🌐' },
                    { key: 'can_go_live', label: 'Live хийх', desc: 'Live борлуулалт хийх эрх', icon: '📡' },
                  ].map(p => (
                    <div key={p.key} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[#F9FAFB]">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{p.icon}</span>
                        <div><div className="text-xs font-medium text-[#111]">{p.label}</div><div className="text-[10px] text-[#999]">{p.desc}</div></div>
                      </div>
                      <button onClick={() => togglePerm(p.key)} className="w-10 h-5 rounded-full p-0.5 transition-colors"
                        style={{ background: permData[p.key] ? '#10B981' : '#EF4444' }}>
                        <div className="w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: permData[p.key] ? 'translateX(20px)' : 'translateX(0)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CONTRACTS ── */}
      {govTab === 'contracts' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-bold text-[#111] mb-4">📜 Гэрээний систем</h3>
            <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl p-4 mb-4">
              <div className="text-xs font-medium text-[#92400E] mb-1">Гэрээний нөхцөл</div>
              <div className="text-[11px] text-[#A16207] leading-relaxed">
                Creator нь BizPrint платформын гэрээг зөвшөөрч, контент бүтээх үйлчилгээ үзүүлнэ.
                Платформ {settings.commissionPercent}% комисс суутгана. Татварын {taxRate}% суутгалт Creator-ийн орлогоос автоматаар хасагдана.
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-[#F0FDF4] rounded-xl text-center">
                <div className="text-lg font-bold text-[#10B981]">{approved.length}</div>
                <div className="text-[10px] text-[#6B7280]">Идэвхтэй гэрээ</div>
              </div>
              <div className="p-3 bg-[#F9FAFB] rounded-xl text-center">
                <div className="text-lg font-bold text-[#6B7280]">v1.0</div>
                <div className="text-[10px] text-[#6B7280]">Гэрээний хувилбар</div>
              </div>
              <div className="p-3 bg-[#F9FAFB] rounded-xl text-center">
                <div className="text-lg font-bold text-[#3B82F6]">{settings.commissionPercent}%</div>
                <div className="text-[10px] text-[#6B7280]">Комисс</div>
              </div>
            </div>
          </div>

          {/* Creator contract list */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-bold text-[#111] mb-4">Creator гэрээнүүд</h3>
            {approved.length === 0 ? (
              <div className="text-center py-8 text-[#999] text-xs">Гэрээтэй creator байхгүй</div>
            ) : (
              <div className="space-y-2">
                {approved.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAFB]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/12 flex items-center justify-center text-[10px] font-bold text-[#8B5CF6]">{c.full_name?.charAt(0)?.toUpperCase()}</div>
                      <div>
                        <div className="text-xs font-medium text-[#111]">{c.full_name}</div>
                        <div className="text-[9px] text-[#999]">Бүртгүүлсэн: {c.created_at ? new Date(c.created_at).toLocaleDateString('mn-MN') : '—'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/12 text-[#10B981]">Идэвхтэй</span>
                      <span className="text-[9px] text-[#999]">{settings.commissionPercent}% комисс</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAX & PAYOUT ── */}
      {govTab === 'tax' && (
        <div className="max-w-2xl space-y-5">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-bold text-[#111] mb-4">💰 Татвар & Төлбөрийн тооцоо</h3>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3 bg-[#F9FAFB] rounded-xl">
                <div className="text-[10px] text-[#888] mb-1">Платформ комисс</div>
                <div className="text-xl font-bold text-[#FF6B00]">{settings.commissionPercent}%</div>
              </div>
              <div className="p-3 bg-[#F9FAFB] rounded-xl">
                <div className="text-[10px] text-[#888] mb-1">Татвар суутгал</div>
                <div className="text-xl font-bold text-[#EF4444]">{taxRate}%</div>
              </div>
            </div>
          </div>

          {/* Payout calculator */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-bold text-[#111] mb-4">🧮 Төлбөр тооцоолуур</h3>
            <label className="text-[11px] font-medium text-[#555] mb-1 block">Захиалгын дүн (₮)</label>
            <input type="number" value={payoutPreview} onChange={e => setPayoutPreview(Number(e.target.value) || 0)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-sm focus:border-[#FF6B00] outline-none mb-4" />

            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-[#F9FAFB] rounded-xl">
                <span className="text-xs text-[#888]">Захиалгын дүн</span>
                <span className="text-sm font-bold text-[#111]">₮{payoutPreview.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-[#FFF7ED] rounded-xl">
                <span className="text-xs text-[#FF6B00]">Платформ комисс ({commRate}%)</span>
                <span className="text-sm font-bold text-[#FF6B00]">- ₮{previewCommission.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-[#FEF2F2] rounded-xl">
                <span className="text-xs text-[#EF4444]">Татвар ({taxRate}%)</span>
                <span className="text-sm font-bold text-[#EF4444]">- ₮{previewTax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-[#F0FDF4] rounded-xl border-2 border-[#10B981]/30">
                <span className="text-xs font-bold text-[#10B981]">Creator-д очих дүн</span>
                <span className="text-lg font-bold text-[#10B981]">₮{previewCreatorGets.toLocaleString()}</span>
              </div>
            </div>

            {/* Visual bar */}
            <div className="mt-4 h-6 rounded-full overflow-hidden flex text-[9px] font-bold text-white">
              <div className="flex items-center justify-center" style={{ width: `${(previewCreatorGets/payoutPreview)*100}%`, background: '#10B981' }}>Creator</div>
              <div className="flex items-center justify-center" style={{ width: `${(previewCommission/payoutPreview)*100}%`, background: '#FF6B00' }}>Комисс</div>
              <div className="flex items-center justify-center" style={{ width: `${(previewTax/payoutPreview)*100}%`, background: '#EF4444' }}>Татвар</div>
            </div>
          </div>
        </div>
      )}

      {/* ── PENALTIES ── */}
      {govTab === 'penalties' && (
        <div className="grid md:grid-cols-[280px_1fr] gap-5">
          {/* Creator list */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 max-h-[70vh] overflow-y-auto">
            <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Creator сонгох</h4>
            {approved.length === 0 ? (
              <div className="text-center py-8 text-[#999] text-xs">Creator байхгүй</div>
            ) : approved.map((c: any) => (
              <button key={c.id} onClick={() => setSelectedCreator(c)}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg mb-1 text-left transition-colors ${
                  selectedCreator?.id === c.id ? 'bg-[#EF4444]/8 border border-[#EF4444]/20' : 'hover:bg-[#FAFAFA]'}`}>
                <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/12 flex items-center justify-center text-[10px] font-bold text-[#8B5CF6]">{c.full_name?.charAt(0)?.toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[#111] truncate">{c.full_name}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Penalty panel */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            {!selectedCreator ? (
              <div className="text-center py-16 text-[#999]">
                <div className="text-3xl mb-2">⚖️</div>
                <div className="text-sm">Creator сонгоно уу</div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E5E7EB]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-white font-bold">{selectedCreator.full_name?.charAt(0)?.toUpperCase()}</div>
                  <div>
                    <div className="text-sm font-bold text-[#111]">{selectedCreator.full_name}</div>
                    <div className="text-[10px] text-[#999]">{selectedCreator.email}</div>
                  </div>
                </div>

                {/* Strike info */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="p-3 bg-[#FFFBEB] rounded-xl text-center">
                    <div className="text-2xl">⚠️</div>
                    <div className="text-[10px] text-[#888] mt-1">Warning</div>
                  </div>
                  <div className="p-3 bg-[#FEF2F2] rounded-xl text-center">
                    <div className="text-2xl">🔴</div>
                    <div className="text-[10px] text-[#888] mt-1">Strike</div>
                  </div>
                  <div className="p-3 bg-[#F3F4F6] rounded-xl text-center">
                    <div className="text-2xl">🚫</div>
                    <div className="text-[10px] text-[#888] mt-1">Suspend</div>
                  </div>
                </div>

                {/* Add penalty form */}
                <div className="bg-[#F9FAFB] rounded-xl p-4 mb-4">
                  <h4 className="text-xs font-bold text-[#111] mb-3">Шийтгэл нэмэх</h4>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="text-[10px] text-[#888] mb-1 block">Төрөл</label>
                      <select value={penaltyForm.type} onChange={e => setPenaltyForm(f => ({ ...f, type: e.target.value }))}
                        className="w-full px-2.5 py-2 rounded-lg border border-[#E5E7EB] text-xs outline-none">
                        <option value="warning">⚠️ Warning</option>
                        <option value="strike">🔴 Strike</option>
                        <option value="suspend">🚫 Suspend</option>
                        <option value="visibility_reduce">👁️ Харагдалт бууруулах</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#888] mb-1 block">Шалтгаан</label>
                      <select value={penaltyForm.reason} onChange={e => setPenaltyForm(f => ({ ...f, reason: e.target.value }))}
                        className="w-full px-2.5 py-2 rounded-lg border border-[#E5E7EB] text-xs outline-none">
                        <option value="deadline_missed">Хугацаа хоцорсон</option>
                        <option value="low_quality">Чанар муу</option>
                        <option value="customer_complaint">Гомдол ирсэн</option>
                        <option value="contract_violation">Гэрээ зөрчсөн</option>
                        <option value="inactivity">Идэвхгүй</option>
                        <option value="other">Бусад</option>
                      </select>
                    </div>
                  </div>
                  <textarea value={penaltyForm.description} onChange={e => setPenaltyForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Дэлгэрэнгүй тайлбар..."
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs resize-none mb-3 outline-none" rows={2} />
                  <button onClick={submitPenalty} className="w-full py-2 bg-[#EF4444] text-white rounded-lg text-xs font-bold hover:bg-[#DC2626]">
                    Шийтгэл бүртгэх
                  </button>
                </div>

                {/* Strike system explanation */}
                <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl p-3">
                  <div className="text-[10px] font-bold text-[#92400E] mb-2">Strike систем</div>
                  <div className="space-y-1 text-[10px] text-[#A16207]">
                    <div className="flex items-center gap-2"><span className="w-16 font-bold">1 Strike</span> → Warning мэдэгдэл</div>
                    <div className="flex items-center gap-2"><span className="w-16 font-bold">2 Strike</span> → Marketplace-аас нуугдана</div>
                    <div className="flex items-center gap-2"><span className="w-16 font-bold">3 Strike</span> → Бүх эрх хаагдана (auto-suspend)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
