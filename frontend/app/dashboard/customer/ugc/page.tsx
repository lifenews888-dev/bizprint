'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, apiUpload, getToken } from '@/lib/api'

/* ═══ SERVICES CONFIG ═══ */
const SERVICES = [
  {
    key: 'social' as const, icon: '📱', label: 'Сошиал контент', color: '#FF6B00',
    desc: 'Таны брэндийн сошиал хуудсанд зориулсан пост, reel, story контент',
    longDesc: 'Мэргэжлийн бүтээгчид таны брэндэд зориулсан Instagram, Facebook, TikTok контент бэлтгэж өгнө. Zoom-р screen share хийж хамтарна.',
    forWhom: ['Бизнес эрхлэгч', 'Онлайн дэлгүүр', 'Брэнд хөгжүүлэгч'],
    benefits: ['Instagram / Facebook пост', 'Reel / Story контент', 'Caption + hashtag'],
    example: 'Шинэ бүтээгдэхүүн танилцуулах reel, хямдралын пост, engagement өсгөх контент',
  },
  {
    key: 'prepress' as const, icon: '🖨️', label: 'Хэвлэлийн эх бэлтгэл', color: '#8B5CF6',
    desc: 'Хэвлэхэд бэлэн мэргэжлийн дизайн файл',
    longDesc: 'Хэвлэхэд бэлэн мэргэжлийн дизайн файлыг таны шаардлагад нийцүүлэн бэлтгэнэ. Zoom screen share-р хамтарч, эцсийн файлаа хавсаргана.',
    forWhom: ['Компани', 'Ресторан', 'Event зохион байгуулагч'],
    benefits: ['Постер & Баннер', 'Нэрийн хуудас & Брошур', 'Print-ready PDF файл'],
    example: 'A3 постер, business card, меню дизайн, каталог',
  },
  {
    key: 'live' as const, icon: '📡', label: 'Лайв борлуулалт', color: '#EC4899',
    desc: 'Бүтээгдэхүүн танилцуулж борлуулалт нэмэгдүүлэх',
    longDesc: 'Туршлагатай live бүтээгчид таны бүтээгдэхүүнийг шууд танилцуулж, борлуулалтыг нэмэгдүүлнэ.',
    forWhom: ['Онлайн худалдаа', 'Брэнд сурталчилгаа', 'Launch event'],
    benefits: ['Facebook / TikTok live', 'Script + танилцуулга', 'Audience engagement'],
    example: 'Бараа танилцуулах live, шууд борлуулалтын нэвтрүүлэг',
  },
  {
    key: 'ai' as const, icon: '🤖', label: 'AI контент', color: '#06B6D4',
    desc: 'AI ашигладаг бүтээгчдээр зураг, видео бүтээлгэх',
    longDesc: 'AI хэрэгслүүд ашигладаг мэргэжлийн бүтээгчид зураг, видео, дурсамж контентыг бүтээж өгнө.',
    forWhom: ['Хувь хэрэглэгч', 'Брэнд', 'Контент бүтээгчид'],
    benefits: ['AI зураг (poster, art)', 'AI видео & Animation', 'Дурсамж зураг нэгтгэх', 'Avatar / Influencer'],
    example: 'Ээж хүү 2-ийн зураг нэгтгэх, хиймэл influencer зураг',
  },
]

const SERVICE_CONTENT_TYPES: Record<string, { key: string; label: string; icon: string; price: number }[]> = {
  social: [
    { key: 'poster', label: 'Постер', icon: '🖼️', price: 35000 },
    { key: 'flyer', label: 'Флаер', icon: '📄', price: 25000 },
    { key: 'banner', label: 'Баннер', icon: '🪧', price: 45000 },
    { key: 'social_post', label: 'Соц.Пост', icon: '📸', price: 15000 },
    { key: 'story_reel', label: 'Story/Reel', icon: '📱', price: 20000 },
    { key: 'logo', label: 'Лого', icon: '💎', price: 80000 },
  ],
  prepress: [
    { key: 'business_card', label: 'Нэрийн хуудас', icon: '🪪', price: 20000 },
    { key: 'brochure', label: 'Брошур', icon: '📰', price: 40000 },
    { key: 'menu', label: 'Цэс/Меню', icon: '🍽️', price: 35000 },
    { key: 'banner_print', label: 'Хэвлэл баннер', icon: '🪧', price: 50000 },
    { key: 'catalog', label: 'Каталог', icon: '📕', price: 60000 },
  ],
  live: [
    { key: 'hourly', label: '1 цаг Live', icon: '📡', price: 200000 },
    { key: 'half_hour', label: '30 мин Live', icon: '⏱️', price: 120000 },
    { key: 'product_review', label: 'Бүтээгдэхүүн review', icon: '📦', price: 150000 },
  ],
  ai: [
    { key: 'ai_image', label: 'AI зураг', icon: '🖼️', price: 30000 },
    { key: 'ai_video', label: 'AI видео', icon: '🎬', price: 100000 },
    { key: 'ai_avatar', label: 'AI аватар', icon: '🧑', price: 50000 },
    { key: 'photo_restore', label: 'Зураг сэргээх', icon: '🔄', price: 30000 },
    { key: 'memory_photo', label: 'Дурсамж зураг', icon: '📸', price: 40000 },
  ],
}

// Flatten for backward compat
const CONTENT_TYPES = Object.values(SERVICE_CONTENT_TYPES).flat()

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: 'Ноорог', color: '#6B7280' },
  open: { label: 'Нээлттэй', color: '#10B981' },
  assigned: { label: 'Creator олдсон', color: '#3B82F6' },
  in_progress: { label: 'Хийгдэж буй', color: '#FF6B00' },
  submitted: { label: 'Шалгуулахаар ирсэн', color: '#8B5CF6' },
  revision: { label: 'Засвар хүссэн', color: '#F59E0B' },
  approved: { label: 'Батлагдсан', color: '#10B981' },
  completed: { label: 'Дууссан', color: '#6B7280' },
  cancelled: { label: 'Цуцлагдсан', color: '#EF4444' },
}

const STEPS = ['Нээлттэй', 'Creator олдсон', 'Хийгдэж буй', 'Илгээсэн', 'Батлагдсан', 'Дууссан']
const STEP_KEYS = ['open', 'assigned', 'in_progress', 'submitted', 'approved', 'completed']

function StepIndicator({ status }: { status: string }) {
  const idx = STEP_KEYS.indexOf(status)
  return (
    <div className="flex items-center gap-1 mt-3">
      {STEPS.map((s, i) => (
        <div key={i} className="flex items-center gap-1">
          <div
            title={s}
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
              i <= idx ? 'bg-[#FF6B00] text-white' : 'bg-[var(--bg)] text-[var(--text3)]'
            }`}
          >
            {i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-4 h-0.5 ${i < idx ? 'bg-[#FF6B00]' : 'bg-[var(--border)]'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function CustomerUgcPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState<'all' | 'active' | 'done'>('all')
  const [pageView, setPageView] = useState<'marketplace' | 'orders'>('marketplace')
  const [topCreators, setTopCreators] = useState<any[]>([])

  /* Form state */
  const [serviceType, setServiceType] = useState<'social' | 'prepress' | 'live' | 'ai'>('social')
  const [mode, setMode] = useState<'piece' | 'package'>('piece')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contentType, setContentType] = useState('poster')
  const [selectedPkgId, setSelectedPkgId] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [deadline, setDeadline] = useState('')
  const [brandNotes, setBrandNotes] = useState('')
  const [step, setStep] = useState(1)

  /* DB packages */
  const [dbPackages, setDbPackages] = useState<any[]>([])
  const [pkgDurationTab, setPkgDurationTab] = useState<1 | 3>(1)

  /* File upload */
  const [referenceFiles, setReferenceFiles] = useState<File[]>([])
  const [referenceUrls, setReferenceUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  /* Approve/Revision modals */
  const [approveModal, setApproveModal] = useState<{ id: string; rating: number } | null>(null)
  const [revisionModal, setRevisionModal] = useState<{ id: string; notes: string } | null>(null)

  const load = () => {
    apiFetch<any[]>('/creator/my-requests')
      .then(d => setRequests(Array.isArray(d) ? d : []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const token = getToken()
    const userStr = localStorage.getItem('user')
    if (!token || !userStr) { router.push('/login'); return }
    load()
  }, [])

  /* Load packages + top creators from DB */
  useEffect(() => {
    apiFetch<any[]>('/creator/packages', { auth: false })
      .then(d => {
        const arr = Array.isArray(d) ? d : []
        setDbPackages(arr)
        if (arr.length > 0 && !selectedPkgId) {
          const popular = arr.find((p: any) => p.is_popular)
          if (popular) setSelectedPkgId(popular.id)
          else setSelectedPkgId(arr[0].id)
        }
      })
      .catch(() => {})
    apiFetch<any[]>('/creator/top-creators?limit=6', { auth: false })
      .then(d => setTopCreators(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  /* Group packages by service type + duration */
  const servicePkgs = dbPackages.filter(p => p.service_type === serviceType || (!p.service_type && serviceType === 'social'))
  const pkg1m = servicePkgs.filter(p => p.duration_months === 1)
  const pkg3m = servicePkgs.filter(p => p.duration_months === 3)
  const visiblePackages = pkgDurationTab === 1 ? pkg1m : (pkg3m.length > 0 ? pkg3m : pkg1m)

  const selectedDbPkg = dbPackages.find(p => p.id === selectedPkgId)

  const unitPrice = (SERVICE_CONTENT_TYPES[serviceType] || CONTENT_TYPES).find(c => c.key === contentType)?.price || CONTENT_TYPES.find(c => c.key === contentType)?.price || 30000
  const pieceTotal = unitPrice * quantity
  const totalPrice = mode === 'piece' ? pieceTotal : Number(selectedDbPkg?.discount_price || selectedDbPkg?.price || 0)

  const resetForm = () => {
    setTitle(''); setDescription(''); setContentType('poster'); setServiceType('social')
    setSelectedPkgId(dbPackages.find(p => p.is_popular)?.id || dbPackages[0]?.id || '')
    setQuantity(1); setDeadline(''); setBrandNotes(''); setStep(1); setMode('piece')
    setReferenceFiles([]); setReferenceUrls([]); setPkgDurationTab(1)
  }

  /* File upload handler */
  const handleFileUpload = async () => {
    if (referenceFiles.length === 0) return
    setUploading(true)
    const urls: string[] = []
    for (const file of referenceFiles) {
      const form = new FormData()
      form.append('file', file)
      try {
        const res = await apiUpload<any>('/upload', form)
        if (res?.url) urls.push(res.url)
      } catch { /* ignore */ }
    }
    setReferenceUrls(prev => [...prev, ...urls])
    setReferenceFiles([])
    setUploading(false)
  }

  const [createdRequestId, setCreatedRequestId] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('qpay')
  const [paymentInfo, setPaymentInfo] = useState<any>(null)
  const [payProcessing, setPayProcessing] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return alert('Гарчиг, тайлбар бичнэ үү')
    setSubmitting(true)
    try {
      const result = await apiFetch<any>('/creator/requests', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          content_type: contentType,
          creator_type: serviceType,
          package: mode === 'piece' ? 'per_piece' : selectedPkgId,
          quantity: mode === 'piece' ? quantity : Number(selectedDbPkg?.content_count || 1),
          budget: totalPrice,
          deadline: deadline || undefined,
          brand_notes: brandNotes || undefined,
          reference_urls: referenceUrls.length > 0 ? referenceUrls : undefined,
        }),
      })
      setCreatedRequestId(result?.id || '')
      setStep(4) // Go to payment step
    } catch (e: any) {
      alert(e.message || 'Алдаа гарлаа')
    }
    setSubmitting(false)
  }

  const approveDeliverable = async (id: string, rating: number) => {
    try {
      await apiFetch(`/creator/requests/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ rating }),
      })
      setApproveModal(null)
      load()
    } catch (e: any) { alert(e.message || 'Алдаа') }
  }

  const requestRevision = async (id: string, notes: string) => {
    if (!notes.trim()) return
    try {
      await apiFetch(`/creator/requests/${id}/revision`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      })
      setRevisionModal(null)
      load()
    } catch (e: any) { alert(e.message || 'Алдаа') }
  }

  const activeStatuses = ['open', 'assigned', 'in_progress', 'submitted', 'revision']
  const filteredRequests = tab === 'all' ? requests
    : tab === 'active' ? requests.filter(r => activeStatuses.includes(r.status))
    : requests.filter(r => ['approved', 'completed', 'cancelled'].includes(r.status))

  return (
    <div className="max-w-[1100px] mx-auto">

      {/* ═══ TOP NAV ═══ */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg)] z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-[var(--text)]">Контент Marketplace</h1>
          <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-lg p-0.5">
            <button onClick={() => setPageView('marketplace')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${pageView === 'marketplace' ? 'bg-[#FF6B00] text-white' : 'text-[var(--text2)]'}`}>
              Marketplace
            </button>
            <button onClick={() => setPageView('orders')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${pageView === 'orders' ? 'bg-[#FF6B00] text-white' : 'text-[var(--text2)]'}`}>
              Миний захиалга {requests.length > 0 && <span className="ml-1 text-[10px] bg-white/20 px-1.5 rounded-full">{requests.length}</span>}
            </button>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg text-xs font-bold hover:bg-[#E55D00] transition-colors">
          + Контент захиалах
        </button>
      </div>

      {/* ═══════════════════════════════════════
       *  MARKETPLACE VIEW
       * ═══════════════════════════════════════ */}
      {pageView === 'marketplace' && (
        <div className="px-6 py-6">

          {/* ── HERO ── */}
          <div className="bg-gradient-to-r from-[#FF6B00] to-[#EC4899] rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight">Мэргэжлийн Creator-уудаар<br/>контент бүтээлгээрэй</h2>
              <p className="text-sm opacity-90 mb-5 max-w-md">Сошиал постер, хэвлэлийн эх бэлтгэл, лайв борлуулалт — бүгд нэг дор</p>
              <div className="flex gap-6 mb-5">
                {[
                  { val: `${topCreators.length || 10}+`, label: 'Creator' },
                  { val: `${dbPackages.length || 6}`, label: 'Багц' },
                  { val: '98%', label: 'Сэтгэл ханамж' },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="text-xl font-bold">{s.val}</div>
                    <div className="text-[10px] opacity-75">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setMode('piece'); resetForm(); setShowForm(true) }}
                  className="px-5 py-2.5 bg-white text-[#FF6B00] rounded-xl text-sm font-bold hover:bg-white/90 transition-colors">
                  Ширхэгээр захиалах
                </button>
                <button onClick={() => { setMode('package'); resetForm(); setShowForm(true) }}
                  className="px-5 py-2.5 bg-white/15 text-white border border-white/30 rounded-xl text-sm font-bold hover:bg-white/25 transition-colors">
                  Багцаар захиалах
                </button>
              </div>
            </div>
          </div>

          {/* ── SERVICE TYPES ── */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-[var(--text)] mb-4">Үйлчилгээний төрөл</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SERVICES.map(s => (
                <div key={s.key} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden hover:shadow-lg hover:border-[var(--text3)] transition-all cursor-pointer group"
                  onClick={() => { resetForm(); setServiceType(s.key); setContentType(SERVICE_CONTENT_TYPES[s.key]?.[0]?.key || 'poster'); setShowForm(true) }}>
                  {/* Color header */}
                  <div className="h-2 w-full" style={{ background: s.color }} />
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: s.color + '12' }}>{s.icon}</div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-[var(--text)] mb-1 group-hover:text-[#FF6B00] transition-colors">{s.label}</h4>
                        <p className="text-xs text-[var(--text2)] leading-relaxed mb-3">{s.longDesc}</p>

                        {/* For whom */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {s.forWhom.map((w, i) => (
                            <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--bg)] text-[var(--text3)] border border-[var(--border)]">{w}</span>
                          ))}
                        </div>

                        {/* Benefits */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-3">
                          {s.benefits.map((b, i) => (
                            <div key={i} className="text-[11px] flex items-center gap-1.5" style={{ color: s.color }}>
                              <span className="text-xs">✓</span> {b}
                            </div>
                          ))}
                        </div>

                        {/* Example */}
                        <div className="text-[10px] text-[var(--text3)] italic bg-[var(--bg)] rounded-lg px-3 py-2">
                          💡 Жишээ: {s.example}
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-[var(--border)]">
                      <div className="text-[10px] text-[var(--text3)]">
                        {SERVICE_CONTENT_TYPES[s.key]?.length || 0} төрлийн контент
                      </div>
                      <div className="text-xs font-bold group-hover:translate-x-1 transition-transform" style={{ color: s.color }}>
                        Захиалах →
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── PACKAGES (All Services) ── */}
          {dbPackages.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-[var(--text)] mb-4">Багцууд</h3>

              {/* Service filter tabs */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {SERVICES.map(s => {
                  const count = dbPackages.filter(p => p.service_type === s.key).length
                  if (count === 0) return null
                  return (
                    <button key={s.key} onClick={() => setServiceType(s.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        serviceType === s.key ? 'text-white' : 'bg-[var(--surface)] text-[var(--text2)] border border-[var(--border)]'
                      }`}
                      style={serviceType === s.key ? { background: s.color } : {}}>
                      {s.icon} {s.label} <span className="opacity-60">({count})</span>
                    </button>
                  )
                })}
                {/* UGC packages (legacy) */}
                {dbPackages.filter(p => !p.service_type || p.service_type === 'ugc').length > 0 && (
                  <button onClick={() => setServiceType('social' as any)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--surface)] text-[var(--text2)] border border-[var(--border)]">
                    🎬 UGC ({dbPackages.filter(p => !p.service_type || p.service_type === 'ugc').length})
                  </button>
                )}
              </div>

              {/* Duration toggle */}
              {pkg3m.length > 0 && (
                <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-lg p-0.5 w-fit mb-4">
                  <button onClick={() => setPkgDurationTab(1)} className={`px-3 py-1 rounded-md text-xs font-medium ${pkgDurationTab === 1 ? 'bg-[#FF6B00] text-white' : 'text-[var(--text2)]'}`}>1 сар</button>
                  <button onClick={() => setPkgDurationTab(3)} className={`px-3 py-1 rounded-md text-xs font-medium ${pkgDurationTab === 3 ? 'bg-[#FF6B00] text-white' : 'text-[var(--text2)]'}`}>3 сар</button>
                </div>
              )}

              {/* Package cards */}
              <div className="grid grid-cols-3 gap-4">
                {visiblePackages.map(pkg => {
                  const svc = SERVICES.find(s => s.key === pkg.service_type) || SERVICES[0]
                  return (
                    <div key={pkg.id} className={`bg-[var(--surface)] border-2 rounded-2xl overflow-hidden transition-all hover:shadow-lg cursor-pointer ${pkg.is_popular ? 'border-[#3B82F6]' : 'border-[var(--border)]'}`}
                      onClick={() => { setMode('package'); setServiceType(pkg.service_type as any || 'social'); setSelectedPkgId(pkg.id); setShowForm(true); setStep(2) }}>
                      {pkg.is_popular && <div className="bg-[#3B82F6] text-white text-[10px] font-bold text-center py-1">Эрэлттэй</div>}
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{svc.icon}</span>
                            <h4 className="text-sm font-bold text-[var(--text)]">{pkg.name}</h4>
                          </div>
                          <span className="text-[10px] text-[var(--text3)] px-2 py-0.5 rounded-full bg-[var(--bg)]">{pkg.duration_months} сар</span>
                        </div>
                        {Number(pkg.discount_price) > 0 && Number(pkg.discount_price) < Number(pkg.price) ? (
                          <div className="mb-1">
                            <span className="text-xl font-bold text-[var(--text)]">₮{Number(pkg.discount_price).toLocaleString()}</span>
                            <span className="text-xs text-[var(--text3)] line-through ml-2">₮{Number(pkg.price).toLocaleString()}</span>
                          </div>
                        ) : (
                          <div className="text-xl font-bold text-[var(--text)] mb-1">₮{Number(pkg.price).toLocaleString()}</div>
                        )}
                        {pkg.discount_label && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#10B981] text-white inline-block mb-2">{pkg.discount_label}</span>}
                        <p className="text-xs text-[var(--text2)] mb-3">{pkg.description}</p>
                        <div className="space-y-1">
                          <div className="text-xs font-medium" style={{ color: svc.color }}>✓ {pkg.content_count} контент</div>
                          {pkg.features?.map((f: string, i: number) => (
                            <div key={i} className="text-xs text-[#10B981]">✓ {f}</div>
                          ))}
                        </div>
                        {pkg.has_brand_boost && (
                          <div className="mt-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-2.5">
                            <div className="text-[10px] font-bold text-[#10B981]">🚀 Brand Boost</div>
                            <div className="text-[9px] text-[var(--text3)]">{pkg.brand_boost_description}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {visiblePackages.length === 0 && (
                <div className="text-center py-8 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                  <div className="text-2xl mb-2">{SERVICES.find(s => s.key === serviceType)?.icon}</div>
                  <div className="text-xs text-[var(--text3)]">Энэ үйлчилгээнд багц бүртгэгдээгүй — ширхэгээр захиалах боломжтой</div>
                </div>
              )}
            </div>
          )}

          {/* ── TOP CREATORS ── */}
          {topCreators.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-[var(--text)] mb-4">Шилдэг Creators</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {topCreators.map((c, i) => (
                  <div key={c.user_id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-all">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {c.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-[var(--text)] truncate">{c.full_name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs text-[#F59E0B]">⭐ {c.rating?.toFixed(1) || '—'}</span>
                        <span className="text-[10px] text-[var(--text3)]">• {c.rating_count || 0} ажил</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {(c.capabilities?.includes('social') || c.capabilities?.includes('ugc')) && <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#FF6B00]/10 text-[#FF6B00]">📱</span>}
                        {(c.capabilities?.includes('prepress') || c.capabilities?.includes('design')) && <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#8B5CF6]/10 text-[#8B5CF6]">🖨️</span>}
                        {c.capabilities?.includes('live') && <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#EC4899]/10 text-[#EC4899]">📡</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CONTENT TYPES GRID ── */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-[var(--text)] mb-4">Контентын төрлүүд</h3>
            <div className="grid grid-cols-5 gap-3">
              {CONTENT_TYPES.map(ct => (
                <button key={ct.key} onClick={() => { setMode('piece'); setContentType(ct.key); resetForm(); setContentType(ct.key); setShowForm(true); setStep(2) }}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 text-center hover:border-[#FF6B00] hover:shadow-sm transition-all">
                  <div className="text-2xl mb-2">{ct.icon}</div>
                  <div className="text-xs font-medium text-[var(--text)]">{ct.label}</div>
                  <div className="text-[10px] text-[#FF6B00] font-bold mt-1">₮{ct.price.toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── TRUST / HOW IT WORKS ── */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-[var(--text)] mb-4">Хэрхэн ажилладаг вэ?</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { step: '01', title: 'Захиалга', desc: 'Контентын төрөл, тоо, тайлбараа бичнэ', icon: '📝', color: '#FF6B00' },
                { step: '02', title: 'Creator олдоно', desc: 'Мэргэжлийн Creator таны ажлыг хүлээн авна', icon: '🎨', color: '#3B82F6' },
                { step: '03', title: 'Zoom хамтарна', desc: 'Screen share-р хамтран ажиллана', icon: '💻', color: '#8B5CF6' },
                { step: '04', title: 'Бэлэн болно', desc: 'Контент батлагдаж, файлаа авна', icon: '✅', color: '#10B981' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl" style={{ background: s.color + '12' }}>{s.icon}</div>
                  <div className="text-[10px] font-bold mb-1" style={{ color: s.color }}>Алхам {s.step}</div>
                  <div className="text-sm font-bold text-[var(--text)] mb-1">{s.title}</div>
                  <div className="text-[10px] text-[var(--text3)] leading-relaxed">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">Бэлэн үү?</h3>
            <p className="text-sm text-[var(--text2)] mb-5 max-w-sm mx-auto">Брэндийн контентоо мэргэжлийн Creator-уудаар бүтээлгээрэй</p>
            <button onClick={() => { resetForm(); setShowForm(true) }}
              className="px-8 py-3 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#E55D00] transition-colors">
              Контент захиалах →
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
       *  ORDERS VIEW
       * ═══════════════════════════════════════ */}
      {pageView === 'orders' && (
        <div className="px-6 py-6">

      {/* Quick stats */}
      {requests.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Нийт', val: requests.length, color: '#3B82F6' },
            { label: 'Идэвхтэй', val: requests.filter(r => activeStatuses.includes(r.status)).length, color: '#FF6B00' },
            { label: 'Дууссан', val: requests.filter(r => r.status === 'completed').length, color: '#10B981' },
            { label: 'Зарцуулсан', val: `₮${requests.reduce((s, r) => s + Number(r.budget || 0), 0).toLocaleString()}`, color: '#8B5CF6' },
          ].map((s, i) => (
            <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
              <div className="text-xs text-[var(--text3)] mb-1">{s.label}</div>
              <div className="text-lg font-bold" style={{ color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tab filter */}
      {requests.length > 0 && (
        <div className="flex gap-2 mb-5">
          {([
            { key: 'all' as const, label: 'Бүгд' },
            { key: 'active' as const, label: 'Идэвхтэй' },
            { key: 'done' as const, label: 'Дууссан' },
          ]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                tab === t.key ? 'bg-[#FF6B00] text-white' : 'bg-[var(--surface)] text-[var(--text2)] border border-[var(--border)]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Requests list */}
      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-28 bg-[var(--surface)] rounded-xl animate-pulse" />)}</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
          <div className="text-4xl mb-3">📭</div>
          <h2 className="text-base font-bold text-[var(--text)] mb-1">Захиалга байхгүй</h2>
          <p className="text-sm text-[var(--text2)] mb-4">Marketplace хэсгээс контент захиалаарай</p>
          <button onClick={() => setPageView('marketplace')} className="px-5 py-2.5 bg-[#FF6B00] text-white rounded-xl text-sm font-bold">Marketplace →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map(r => {
            const st = STATUS_MAP[r.status] || { label: r.status, color: '#6B7280' }
            const ct = CONTENT_TYPES.find(c => c.key === r.content_type)
            const showDeliverables = ['submitted', 'approved', 'completed'].includes(r.status)
            return (
              <div key={r.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center text-xl shrink-0">
                      {ct?.icon || '🎨'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-bold text-[var(--text)]">{r.title}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: st.color, background: st.color + '15' }}>{st.label}</span>
                      </div>
                      <p className="text-xs text-[var(--text2)] line-clamp-1 mb-1.5">{r.description}</p>
                      <div className="flex gap-3 text-[11px] text-[var(--text3)]">
                        <span>{ct?.label || r.content_type}</span>
                        <span>•</span>
                        <span>{r.package === 'per_piece' ? `${r.quantity} ширхэг` : r.package}</span>
                        {r.creator_name && <><span>•</span><span>🎨 {r.creator_name}</span></>}
                        <span>•</span>
                        <span>{new Date(r.created_at).toLocaleDateString('mn-MN')}</span>
                      </div>
                      {/* Step indicator */}
                      <StepIndicator status={r.status} />
                    </div>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <div className="text-base font-bold text-[#FF6B00]">₮{Number(r.budget).toLocaleString()}</div>
                    <div className="flex gap-2 mt-2">
                      {r.status === 'submitted' && (
                        <>
                          <button onClick={() => setApproveModal({ id: r.id, rating: 5 })}
                            className="px-3 py-1.5 bg-[#10B981] text-white rounded-lg text-[11px] font-bold hover:bg-[#059669]">Батлах</button>
                          <button onClick={() => setRevisionModal({ id: r.id, notes: '' })}
                            className="px-3 py-1.5 bg-[#F59E0B] text-white rounded-lg text-[11px] font-bold hover:bg-[#D97706]">Засвар</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {/* Deliverable files */}
                {showDeliverables && r.deliverable_urls?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    <div className="text-[11px] font-bold text-[var(--text2)] mb-2">Хүлээлгэж өгсөн файлууд:</div>
                    <div className="flex gap-2 flex-wrap">
                      {r.deliverable_urls.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" download
                          className="text-[11px] text-[#3B82F6] bg-[#3B82F6]/10 px-3 py-1.5 rounded-lg hover:bg-[#3B82F6]/20 transition-colors inline-flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Файл {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ═══ Approve Modal ═══ */}
      {approveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setApproveModal(null)}>
          <div className="bg-[var(--surface)] rounded-2xl max-w-[400px] w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-[var(--text)] mb-4">Контент батлах</h3>
            <label className="text-sm font-bold text-[var(--text)] mb-2 block">Үнэлгээ (1-5)</label>
            <div className="flex gap-2 mb-5">
              {[1,2,3,4,5].map(r => (
                <button key={r} onClick={() => setApproveModal({ ...approveModal, rating: r })}
                  className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                    approveModal.rating === r ? 'bg-[#FF6B00] text-white' : 'bg-[var(--bg)] text-[var(--text2)] border border-[var(--border)]'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setApproveModal(null)}
                className="flex-1 py-2.5 bg-[var(--bg)] text-[var(--text2)] rounded-xl text-sm font-bold border border-[var(--border)]">Болих</button>
              <button onClick={() => approveDeliverable(approveModal.id, approveModal.rating)}
                className="flex-1 py-2.5 bg-[#10B981] text-white rounded-xl text-sm font-bold hover:bg-[#059669]">Батлах</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Revision Modal ═══ */}
      {revisionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setRevisionModal(null)}>
          <div className="bg-[var(--surface)] rounded-2xl max-w-[400px] w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-[var(--text)] mb-4">Засвар хүсэх</h3>
            <label className="text-sm font-bold text-[var(--text)] mb-2 block">Засварын тэмдэглэл</label>
            <textarea
              value={revisionModal.notes}
              onChange={e => setRevisionModal({ ...revisionModal, notes: e.target.value })}
              rows={4}
              placeholder="Ямар засвар хийх шаардлагатай вэ..."
              className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] resize-none focus:border-[#FF6B00] outline-none transition-colors mb-5"
            />
            <div className="flex gap-3">
              <button onClick={() => setRevisionModal(null)}
                className="flex-1 py-2.5 bg-[var(--bg)] text-[var(--text2)] rounded-xl text-sm font-bold border border-[var(--border)]">Болих</button>
              <button onClick={() => requestRevision(revisionModal.id, revisionModal.notes)}
                className="flex-1 py-2.5 bg-[#F59E0B] text-white rounded-xl text-sm font-bold hover:bg-[#D97706]">Засвар илгээх</button>
            </div>
          </div>
        </div>
      )}

        </div>
      )}

      {/* ═══════════════════════════════════════
       *  NEW REQUEST MODAL — 3-Step Flow
       * ═══════════════════════════════════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[var(--surface)] rounded-2xl max-w-[720px] w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-[var(--text)]">Контент захиалах</h2>
                <div className="flex gap-1">
                  {[1,2,3,4].map(s => (
                    <div key={s} className={`w-5 h-1.5 rounded-full transition-colors ${step >= s ? 'bg-[#FF6B00]' : 'bg-[var(--border)]'}`} />
                  ))}
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-[var(--bg)] flex items-center justify-center text-[var(--text3)] hover:text-[var(--text)] transition-colors">✕</button>
            </div>

            <div className="p-6">

              {/* ═══ STEP 1: Service + Mode Selection ═══ */}
              {step === 1 && (
                <div>
                  {/* Service type */}
                  <label className="text-sm font-bold text-[var(--text)] mb-3 block">Үйлчилгээ сонгох</label>
                  <div className="grid grid-cols-4 gap-2 mb-5">
                    {SERVICES.map(s => (
                      <button key={s.key} onClick={() => { setServiceType(s.key); setContentType(SERVICE_CONTENT_TYPES[s.key]?.[0]?.key || 'poster') }}
                        className={`rounded-xl p-3 text-center transition-all border-2 ${
                          serviceType === s.key ? 'shadow-md scale-[1.02]' : 'hover:shadow-sm'
                        }`}
                        style={{ borderColor: serviceType === s.key ? s.color : 'var(--border)', background: serviceType === s.key ? s.color + '08' : 'var(--surface)' }}>
                        <div className="text-2xl mb-1.5">{s.icon}</div>
                        <div className="text-xs font-bold text-[var(--text)]">{s.label}</div>
                        <div className="text-[9px] text-[var(--text3)] mt-0.5">{s.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Order mode */}
                  <label className="text-sm font-bold text-[var(--text)] mb-3 block">Захиалгын горим</label>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <button onClick={() => setMode('piece')}
                      className={`rounded-xl p-4 text-left border-2 transition-all ${
                        mode === 'piece' ? 'border-[#FF6B00] bg-[#FF6B00]/5' : 'border-[var(--border)] hover:border-[#FF6B00]/40'
                      }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">📦</span>
                        <span className="text-sm font-bold text-[var(--text)]">Ширхэгээр</span>
                      </div>
                      <p className="text-[10px] text-[var(--text2)]">Нэг нэгээр захиалах • ₮{(SERVICE_CONTENT_TYPES[serviceType]?.[0]?.price || 15000).toLocaleString()}-аас</p>
                    </button>
                    <button onClick={() => setMode('package')}
                      className={`rounded-xl p-4 text-left border-2 transition-all relative ${
                        mode === 'package' ? 'border-[#8B5CF6] bg-[#8B5CF6]/5' : 'border-[var(--border)] hover:border-[#8B5CF6]/40'
                      }`}>
                      {dbPackages.length > 0 && <div className="absolute -top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-[#8B5CF6] text-white">Хэмнэлттэй</div>}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">🎁</span>
                        <span className="text-sm font-bold text-[var(--text)]">Багцаар</span>
                      </div>
                      <p className="text-[10px] text-[var(--text2)]">Олон контент хямдаар • Багцаас сонгох</p>
                    </button>
                  </div>

                  <button onClick={() => setStep(2)}
                    className="w-full py-3 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#E55D00] transition-colors">
                    Үргэлжлүүлэх →
                  </button>
                </div>
              )}

              {/* ═══ STEP 2: Details ═══ */}
              {step === 2 && (
                <div>
                  {/* Back button */}
                  <button onClick={() => setStep(1)} className="text-xs text-[var(--text2)] hover:text-[#FF6B00] transition-colors mb-4">← Буцах</button>

                  {mode === 'piece' ? (
                    <>
                      {/* Service badge */}
                      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg" style={{ background: SERVICES.find(s => s.key === serviceType)?.color + '10' }}>
                        <span className="text-lg">{SERVICES.find(s => s.key === serviceType)?.icon}</span>
                        <span className="text-xs font-bold" style={{ color: SERVICES.find(s => s.key === serviceType)?.color }}>{SERVICES.find(s => s.key === serviceType)?.label}</span>
                        <button onClick={() => setStep(1)} className="ml-auto text-[10px] text-[var(--text3)] hover:text-[var(--text)]">Солих</button>
                      </div>

                      {/* Content type + quantity for per-piece */}
                      <div className="mb-5">
                        <label className="text-sm font-bold text-[var(--text)] mb-3 block">Контентын төрөл</label>
                        <div className={`grid gap-2 ${(SERVICE_CONTENT_TYPES[serviceType]?.length || 0) <= 4 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                          {(SERVICE_CONTENT_TYPES[serviceType] || []).map(c => (
                            <button key={c.key} onClick={() => setContentType(c.key)}
                              className={`p-3 rounded-xl text-center transition-all ${
                                contentType === c.key
                                  ? 'text-white shadow-lg scale-105'
                                  : 'bg-[var(--bg)] text-[var(--text2)] border border-[var(--border)] hover:border-[#FF6B00]'
                              }`}
                              style={contentType === c.key ? { background: SERVICES.find(s => s.key === serviceType)?.color, boxShadow: `0 4px 12px ${SERVICES.find(s => s.key === serviceType)?.color}30` } : {}}>
                              <div className="text-xl">{c.icon}</div>
                              <div className="text-[10px] font-medium mt-1">{c.label}</div>
                              <div className="text-[9px] mt-0.5 opacity-75">₮{c.price.toLocaleString()}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quantity selector */}
                      <div className="mb-5">
                        <label className="text-sm font-bold text-[var(--text)] mb-2 block">Тоо ширхэг</label>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-[var(--border)] rounded-xl overflow-hidden">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              className="w-10 h-10 flex items-center justify-center text-lg text-[var(--text2)] hover:bg-[var(--bg)] transition-colors">−</button>
                            <input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                              className="w-16 h-10 text-center text-sm font-bold text-[var(--text)] bg-transparent border-x border-[var(--border)] outline-none" />
                            <button onClick={() => setQuantity(quantity + 1)}
                              className="w-10 h-10 flex items-center justify-center text-lg text-[var(--text2)] hover:bg-[var(--bg)] transition-colors">+</button>
                          </div>
                          <div className="text-sm text-[var(--text2)]">
                            × ₮{unitPrice.toLocaleString()} = <span className="font-bold text-[#FF6B00]">₮{pieceTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Package selection — Geni.mn style */}
                      <div className="mb-5">
                        <label className="text-sm font-bold text-[var(--text)] mb-3 block">Багц сонгох</label>

                        {/* Duration tabs */}
                        <div className="flex gap-2 mb-4">
                          <button onClick={() => setPkgDurationTab(1)}
                            className={`px-5 py-2 rounded-lg text-xs font-bold transition-colors ${
                              pkgDurationTab === 1 ? 'bg-[#FF6B00] text-white' : 'bg-[var(--bg)] text-[var(--text2)] border border-[var(--border)]'
                            }`}>
                            1 сар
                          </button>
                          <button onClick={() => setPkgDurationTab(3)}
                            className={`px-5 py-2 rounded-lg text-xs font-bold transition-colors ${
                              pkgDurationTab === 3 ? 'bg-[#FF6B00] text-white' : 'bg-[var(--bg)] text-[var(--text2)] border border-[var(--border)]'
                            }`}>
                            3 сар
                          </button>
                        </div>

                        {/* Package cards grid */}
                        <div className="grid grid-cols-3 gap-3">
                          {visiblePackages.map(p => {
                            const hasDiscount = p.discount_price && Number(p.discount_price) < Number(p.price)
                            const displayPrice = hasDiscount ? Number(p.discount_price) : Number(p.price)
                            const features = Array.isArray(p.features) ? p.features : []
                            return (
                              <button key={p.id} onClick={() => setSelectedPkgId(p.id)}
                                className={`rounded-xl p-4 text-left transition-all border-2 relative ${
                                  selectedPkgId === p.id ? 'border-[#FF6B00] bg-[#FF6B00]/5 shadow-lg' : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--text3)]'
                                }`}>
                                {p.is_popular && (
                                  <div className="absolute -top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FF6B00] text-white">Эрэлттэй</div>
                                )}
                                {hasDiscount && p.discount_label && (
                                  <div className="absolute -top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#10B981] text-white">{p.discount_label}</div>
                                )}
                                <div className="text-xs font-bold text-[#FF6B00] mb-1">{p.name}</div>
                                <div className="text-[10px] text-[var(--text3)] mb-2">{p.duration_months} сарын багц</div>
                                {p.description && <p className="text-[11px] text-[var(--text2)] mb-2 line-clamp-2">{p.description}</p>}
                                <div className="flex items-baseline gap-2 mb-2">
                                  <span className="text-lg font-bold text-[var(--text)]">₮{displayPrice.toLocaleString()}</span>
                                  {hasDiscount && (
                                    <span className="text-xs text-[var(--text3)] line-through">₮{Number(p.price).toLocaleString()}</span>
                                  )}
                                </div>
                                {p.content_count && (
                                  <div className="text-[11px] text-[#FF6B00] font-medium mb-2">
                                    Reel хамтран: {p.content_count} ширхэг
                                  </div>
                                )}
                                {features.length > 0 && (
                                  <ul className="space-y-1.5 mb-2">
                                    {features.map((feat: string, i: number) => (
                                      <li key={i} className="text-[11px] text-[var(--text2)] flex items-center gap-1.5">
                                        <span className="text-[#10B981] text-xs">✓</span> {feat}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                {p.brand_boost && (
                                  <div className="mt-2 pt-2 border-t border-[var(--border)]">
                                    <div className="text-[10px] font-bold text-[#8B5CF6] mb-1">Brand Boost</div>
                                    <p className="text-[10px] text-[var(--text3)]">{p.brand_boost}</p>
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                        {visiblePackages.length === 0 && (
                          <div className="text-center py-8 text-sm text-[var(--text3)]">
                            Энэ хугацааны багц одоогоор байхгүй байна
                          </div>
                        )}
                      </div>

                      {/* Content type for package */}
                      <div className="mb-5">
                        <label className="text-sm font-bold text-[var(--text)] mb-2 block">Үндсэн контентын төрөл</label>
                        <div className="grid grid-cols-5 gap-2">
                          {CONTENT_TYPES.slice(0, 5).map(c => (
                            <button key={c.key} onClick={() => setContentType(c.key)}
                              className={`p-2.5 rounded-xl text-center text-xs transition-all ${
                                contentType === c.key ? 'bg-[#FF6B00] text-white' : 'bg-[var(--bg)] text-[var(--text2)] border border-[var(--border)] hover:border-[#FF6B00]'
                              }`}>
                              <div className="text-lg">{c.icon}</div>
                              <div className="text-[10px] mt-0.5">{c.label}</div>
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-5 gap-2 mt-2">
                          {CONTENT_TYPES.slice(5).map(c => (
                            <button key={c.key} onClick={() => setContentType(c.key)}
                              className={`p-2.5 rounded-xl text-center text-xs transition-all ${
                                contentType === c.key ? 'bg-[#FF6B00] text-white' : 'bg-[var(--bg)] text-[var(--text2)] border border-[var(--border)] hover:border-[#FF6B00]'
                              }`}>
                              <div className="text-lg">{c.icon}</div>
                              <div className="text-[10px] mt-0.5">{c.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ═══ File Upload Section ═══ */}
                  <div className="mb-5">
                    <label className="text-sm font-bold text-[var(--text)] mb-2 block">Лого, зураг, reference файл</label>
                    <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-4 bg-[var(--bg)]">
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.ai,.psd,.svg"
                        onChange={e => {
                          if (e.target.files) setReferenceFiles(Array.from(e.target.files))
                        }}
                        className="w-full text-sm text-[var(--text2)] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#FF6B00]/10 file:text-[#FF6B00] hover:file:bg-[#FF6B00]/20"
                      />
                      {referenceFiles.length > 0 && (
                        <div className="mt-3 flex gap-2 items-center">
                          <span className="text-xs text-[var(--text2)]">{referenceFiles.length} файл сонгогдсон</span>
                          <button onClick={handleFileUpload} disabled={uploading}
                            className="px-3 py-1.5 bg-[#FF6B00] text-white rounded-lg text-[11px] font-bold hover:bg-[#E55D00] disabled:opacity-50">
                            {uploading ? 'Байршуулж байна...' : 'Байршуулах'}
                          </button>
                        </div>
                      )}
                      {referenceUrls.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {referenceUrls.map((url, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-[#10B981]/10 text-[#10B981] text-[11px] font-medium px-3 py-1.5 rounded-lg">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Файл {i + 1}
                              <button onClick={() => setReferenceUrls(prev => prev.filter((_, j) => j !== i))}
                                className="ml-1 text-[#EF4444] hover:text-[#DC2626]">✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <label className="text-sm font-bold text-[var(--text)] mb-2 block">Гарчиг *</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                      placeholder="Жн: Шинэ бүтээгдэхүүний Instagram постер"
                      className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:border-[#FF6B00] outline-none transition-colors" />
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="text-sm font-bold text-[var(--text)] mb-2 block">Тайлбар *</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                      placeholder="Контентын дэлгэрэнгүй тайлбар, шаардлага, стиль..."
                      className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] resize-none focus:border-[#FF6B00] outline-none transition-colors" />
                  </div>

                  {/* Deadline + Brand notes */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className="text-sm font-bold text-[var(--text)] mb-2 block">Хугацаа</label>
                      <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                        className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:border-[#FF6B00] outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-[var(--text)] mb-2 block">Брэнд удирдамж</label>
                      <input type="text" value={brandNotes} onChange={e => setBrandNotes(e.target.value)}
                        placeholder="Өнгө, фонт, стиль..."
                        className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:border-[#FF6B00] outline-none transition-colors" />
                    </div>
                  </div>

                  {/* Next button */}
                  <button onClick={() => {
                    if (!title.trim() || !description.trim()) { alert('Гарчиг, тайлбар бичнэ үү'); return }
                    setStep(3)
                  }}
                    className="w-full py-3 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#E55D00] transition-colors">
                    Үргэлжлүүлэх →
                  </button>
                </div>
              )}

              {/* ═══ STEP 3: Confirm ═══ */}
              {step === 3 && (
                <div>
                  <button onClick={() => setStep(2)} className="text-xs text-[var(--text2)] hover:text-[#FF6B00] transition-colors mb-4">← Буцах</button>

                  <h3 className="text-base font-bold text-[var(--text)] mb-4">Захиалга баталгаажуулах</h3>

                  {/* Summary */}
                  <div className="bg-[var(--bg)] rounded-xl p-5 mb-5">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text2)]">Төрөл</span>
                        <span className="font-medium text-[var(--text)]">{mode === 'piece' ? 'Ширхэгээр' : `${selectedDbPkg?.name || 'Багц'}`}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text2)]">Контент</span>
                        <span className="font-medium text-[var(--text)]">{CONTENT_TYPES.find(c => c.key === contentType)?.label}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text2)]">Тоо</span>
                        <span className="font-medium text-[var(--text)]">{mode === 'piece' ? quantity : (selectedDbPkg?.content_count || 1)} ширхэг</span>
                      </div>
                      {mode === 'package' && selectedDbPkg?.duration_months && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--text2)]">Хугацаа</span>
                          <span className="font-medium text-[var(--text)]">{selectedDbPkg.duration_months} сар</span>
                        </div>
                      )}
                      {deadline && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--text2)]">Дуусах хугацаа</span>
                          <span className="font-medium text-[var(--text)]">{new Date(deadline).toLocaleDateString('mn-MN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text2)]">Гарчиг</span>
                        <span className="font-medium text-[var(--text)] text-right max-w-[200px] truncate">{title}</span>
                      </div>
                      {referenceUrls.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--text2)]">Хавсралт файл</span>
                          <span className="font-medium text-[#10B981]">{referenceUrls.length} файл</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-[var(--text)]">Нийт үнэ</span>
                        <span className="text-2xl font-bold text-[#FF6B00]">₮{totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] text-[var(--text3)] text-right mt-1">
                        Платформ хураамж: ₮{Math.round(totalPrice * 0.2).toLocaleString()} (20%)
                      </div>
                    </div>
                  </div>

                  {/* How it works */}
                  <div className="bg-[#FF6B00]/5 border border-[#FF6B00]/15 rounded-xl p-4 mb-5">
                    <div className="text-xs font-bold text-[#FF6B00] mb-2">Хэрхэн ажилладаг вэ?</div>
                    <div className="space-y-1.5 text-[11px] text-[var(--text2)]">
                      <div>1. Захиалга илгээгдэж, Creator-ууд хүлээн авна</div>
                      <div>2. Creator ажлыг хийж, контент илгээнэ</div>
                      <div>3. Та контентыг шалгаж, батлах эсвэл засвар хүснэ</div>
                      <div>4. Батлагдсаны дараа Creator-т төлбөр олгогдоно</div>
                    </div>
                  </div>

                  {/* Submit */}
                  <button onClick={handleSubmit} disabled={submitting}
                    className="w-full py-3.5 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#E55D00] transition-colors disabled:opacity-50">
                    {submitting ? 'Илгээж байна...' : `Захиалах — ₮${totalPrice.toLocaleString()}`}
                  </button>
                </div>
              )}

              {/* ═══ STEP 4: Payment ═══ */}
              {step === 4 && (
                <div>
                  {!paymentInfo ? (
                    <>
                      <div className="text-center mb-5">
                        <div className="text-4xl mb-2">💳</div>
                        <h3 className="text-base font-bold text-[var(--text)]">Төлбөр төлөх</h3>
                        <p className="text-xs text-[var(--text2)]">Захиалга амжилттай үүслээ. Төлбөрөө төлнө үү.</p>
                      </div>

                      <div className="bg-[var(--bg)] rounded-xl p-4 mb-5 text-center">
                        <div className="text-[10px] text-[var(--text3)]">Төлөх дүн</div>
                        <div className="text-3xl font-bold text-[#FF6B00]">₮{totalPrice.toLocaleString()}</div>
                      </div>

                      {/* Payment methods */}
                      <div className="space-y-2 mb-5">
                        <label className="text-xs font-bold text-[var(--text)] block">Төлбөрийн арга</label>
                        {[
                          { key: 'qpay', label: 'QPay', desc: 'QR код уншуулж төлөх', icon: '📱', color: '#00B14F' },
                          { key: 'socialpay', label: 'SocialPay', desc: 'SocialPay аппаар төлөх', icon: '💜', color: '#6C3BAA' },
                          { key: 'bank', label: 'Банк шилжүүлэг', desc: 'Дансруу шилжүүлэг хийх', icon: '🏦', color: '#3B82F6' },
                        ].map(m => (
                          <button key={m.key} onClick={() => setPaymentMethod(m.key)}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                              paymentMethod === m.key ? 'border-[#FF6B00] bg-[#FF6B00]/5' : 'border-[var(--border)] hover:border-[var(--text3)]'
                            }`}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: m.color + '15' }}>{m.icon}</div>
                            <div>
                              <div className="text-sm font-bold text-[var(--text)]">{m.label}</div>
                              <div className="text-[10px] text-[var(--text3)]">{m.desc}</div>
                            </div>
                            {paymentMethod === m.key && <div className="ml-auto text-[#FF6B00] text-lg">●</div>}
                          </button>
                        ))}
                      </div>

                      <button onClick={async () => {
                        if (!createdRequestId) return
                        setPayProcessing(true)
                        try {
                          const res = await apiFetch<any>(`/creator/requests/${createdRequestId}/pay`, {
                            method: 'POST',
                            body: JSON.stringify({ method: paymentMethod }),
                          })
                          setPaymentInfo(res)
                        } catch (e: any) { alert(e.message || 'Алдаа') }
                        setPayProcessing(false)
                      }} disabled={payProcessing}
                        className="w-full py-3.5 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#E55D00] disabled:opacity-50">
                        {payProcessing ? 'Боловсруулж байна...' : 'Төлбөр хийх'}
                      </button>

                      <button onClick={() => { setShowForm(false); resetForm(); setPaymentInfo(null); setCreatedRequestId(''); load(); setPageView('orders') }}
                        className="w-full py-2 text-xs text-[var(--text3)] mt-2 hover:text-[var(--text)]">
                        Дараа төлнө (захиалга хадгалагдсан)
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Payment info / QR */}
                      <div className="text-center mb-5">
                        <div className="text-4xl mb-2">{paymentMethod === 'qpay' ? '📱' : paymentMethod === 'socialpay' ? '💜' : '🏦'}</div>
                        <h3 className="text-base font-bold text-[var(--text)]">
                          {paymentMethod === 'bank' ? 'Банк шилжүүлэг' : 'QR код уншуулна уу'}
                        </h3>
                      </div>

                      {paymentMethod !== 'bank' && paymentInfo.qr_image && (
                        <div className="bg-white rounded-xl p-4 mb-4 flex justify-center border border-[var(--border)]">
                          <div className="w-48 h-48 bg-[#F3F4F6] rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-3xl mb-2">📱</div>
                              <div className="text-xs text-[#888]">QR код</div>
                              <div className="text-[10px] text-[#999] mt-1">{paymentInfo.invoice_no}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'bank' && (
                        <div className="bg-[var(--bg)] rounded-xl p-4 mb-4 space-y-2">
                          <div className="flex justify-between text-xs"><span className="text-[var(--text3)]">Банк:</span><span className="font-bold text-[var(--text)]">Хаан банк</span></div>
                          <div className="flex justify-between text-xs"><span className="text-[var(--text3)]">Данс:</span><span className="font-bold text-[var(--text)]">5000 XXXX XXXX</span></div>
                          <div className="flex justify-between text-xs"><span className="text-[var(--text3)]">Хүлээн авагч:</span><span className="font-bold text-[var(--text)]">BizPrint ХХК</span></div>
                          <div className="flex justify-between text-xs"><span className="text-[var(--text3)]">Гүйлгээний утга:</span><span className="font-bold text-[#FF6B00]">{paymentInfo.invoice_no}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-[var(--text3)]">Дүн:</span><span className="font-bold text-[#FF6B00]">₮{Number(paymentInfo.amount).toLocaleString()}</span></div>
                        </div>
                      )}

                      <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-3 mb-4">
                        <div className="text-xs text-[#92400E]">
                          {paymentMethod === 'bank'
                            ? 'Шилжүүлэг хийсний дараа баталгаажуулалт 1-2 цагийн дотор хийгдэнэ.'
                            : 'QR код уншуулсны дараа автоматаар баталгаажна.'}
                        </div>
                      </div>

                      <button onClick={() => { setShowForm(false); resetForm(); setPaymentInfo(null); setCreatedRequestId(''); load(); setPageView('orders') }}
                        className="w-full py-3 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#E55D00]">
                        Дууслаа — Захиалгууд руу буцах
                      </button>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
