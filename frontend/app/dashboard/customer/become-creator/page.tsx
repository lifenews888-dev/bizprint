'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

/* ═══════════════════════════════════════
 *  CREATOR TYPES — 5 cards
 * ═══════════════════════════════════════ */

const CREATOR_TYPES = [
  {
    key: 'social',
    icon: '📱',
    title: 'Сошиал контент бүтээгч',
    desc: 'Instagram, TikTok, Facebook постер, reel, story бүтээх. Zoom-р screen share хийж захиалагчтай хамтарна.',
    features: ['Instagram / TikTok постер', 'Story & Reel бүтээх', 'Брэнд контент', 'Zoom хамтран ажиллах'],
    earnings: '₮100K – 500K',
    earningUnit: 'контент',
    color: '#FF6B00',
    badge: 'Zoom + Approval',
  },
  {
    key: 'prepress',
    icon: '🖨️',
    title: 'Хэвлэлийн эх бэлтгэгч',
    desc: 'Print-ready файл бэлтгэх. Zoom screen share-р хамтарч, эцсийн файлаа хавсаргана.',
    features: ['Print-ready файл', 'CMYK өнгөний удирдлага', 'Bleed & trim тохируулах', 'Zoom хамтран ажиллах'],
    earnings: '₮150K – 600K',
    earningUnit: 'ажил',
    color: '#8B5CF6',
    badge: 'Zoom + Final File',
  },
  {
    key: 'live',
    icon: '📡',
    title: 'Лайв стримэр',
    desc: 'Бүтээгдэхүүн танилцуулах Live борлуулалт хийх. Facebook, TikTok, Instagram дээр шууд дамжуулах.',
    features: ['Live борлуулалт', 'Бүтээгдэхүүн танилцуулга', 'Олон платформ дамжуулалт', 'Борлуулалтын стратеги'],
    earnings: '₮200K – 1M',
    earningUnit: 'Live',
    color: '#EC4899',
    badge: 'Live борлуулалт',
  },
  {
    key: 'ai',
    icon: '🤖',
    title: 'AI контент бүтээгч',
    desc: 'AI хэрэгслүүд ашиглан зураг, видео, аватар бүтээх. Хуучин зураг сэргээх, дурсамж зураг хийх.',
    features: ['AI зураг үүсгэх', 'Видео & аватар бүтээх', 'Зураг сэргээх / сайжруулах', 'Prompt engineering'],
    earnings: '₮20K – 300K',
    earningUnit: 'ажил',
    color: '#06B6D4',
    badge: 'AI + Creative',
  },
  {
    key: 'ugc',
    icon: '🎬',
    title: 'UGC Creator',
    desc: 'TikTok, Reels видео бүтээх. Бүтээгдэхүүний review, lifestyle контент, нүүр + дуу хоолойгоор контент хийх.',
    features: ['TikTok / Reels видео', 'Бүтээгдэхүүний review', 'Lifestyle контент', 'Нүүр + дуу хоолой контент'],
    earnings: '₮80K – 400K',
    earningUnit: 'контент',
    color: '#F59E0B',
    badge: 'Video + Voice',
  },
]

/* ═══════════════════════════════════════
 *  SKILLS — updated list
 * ═══════════════════════════════════════ */

const SKILL_OPTIONS = [
  { key: 'graphic_design', label: 'График дизайн', icon: '🎨' },
  { key: 'illustration', label: 'Зураг зурах', icon: '✏️' },
  { key: 'photo', label: 'Гэрэл зураг', icon: '📷' },
  { key: 'video', label: 'Видео', icon: '🎬' },
  { key: 'motion', label: 'Motion Graphics', icon: '🎞️' },
  { key: 'branding', label: 'Брэндинг', icon: '💎' },
  { key: 'social_media', label: 'Соц.Медиа', icon: '📱' },
  { key: 'print_design', label: 'Хэвлэл дизайн', icon: '🖨️' },
  { key: 'face_on_camera', label: 'Камерын өмнө', icon: '🤳' },
  { key: 'product_review', label: 'Бүтээгдэхүүн review', icon: '📦' },
  { key: 'voice_over', label: 'Дуу оруулах', icon: '🎙️' },
  { key: 'influencer_content', label: 'Influencer контент', icon: '⭐' },
  { key: 'tiktok_trends', label: 'TikTok trends', icon: '🔥' },
]

/* ═══════════════════════════════════════
 *  PAGE
 * ═══════════════════════════════════════ */

export default function BecomeCreatorPage() {
  const [existing, setExisting] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [capabilities, setCapabilities] = useState<string[]>([])
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [motivation, setMotivation] = useState('')

  useEffect(() => {
    apiFetch<any>('/creator/application')
      .then(d => { if (d) setExisting(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleSkill = (key: string) => {
    setSkills(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key])
  }

  const toggleCapability = (key: string) => {
    setCapabilities(prev =>
      prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
    )
  }

  const handleSubmit = async () => {
    if (!bio.trim()) return alert('Танилцуулга бичнэ үү')
    if (capabilities.length === 0) return alert('Дор хаяж 1 creator төрөл сонгоно уу')

    setSubmitting(true)
    try {
      await apiFetch('/creator/apply', {
        method: 'POST',
        body: JSON.stringify({ bio, skills, capabilities, portfolio_url: portfolioUrl, motivation }),
      })
      setSuccess(true)
    } catch (e: any) {
      alert(e.message || 'Алдаа гарлаа')
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin text-3xl">⏳</div>
    </div>
  )

  // Already approved
  if (existing?.status === 'approved') return (
    <div className="p-6 max-w-lg mx-auto text-center py-16">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Та Creator боллоо!</h2>
      <p className="text-sm text-[var(--text2)] mb-6">Creator dashboard руугаа орж ажил эхлээрэй</p>
      <a href="/creator" className="px-6 py-3 bg-[#FF6B00] text-white rounded-xl text-sm font-bold">Creator Dashboard →</a>
    </div>
  )

  // Pending application
  if (existing?.status === 'pending') return (
    <div className="p-6 max-w-lg mx-auto text-center py-16">
      <div className="text-5xl mb-4">⏳</div>
      <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Өргөдөл хянагдаж байна</h2>
      <p className="text-sm text-[var(--text2)] mb-2">Таны Creator өргөдлийг бид шалгаж байна</p>
      <p className="text-xs text-[var(--text3)]">Илгээсэн: {new Date(existing.created_at).toLocaleDateString('mn-MN')}</p>
    </div>
  )

  // Success
  if (success) return (
    <div className="p-6 max-w-lg mx-auto text-center py-16">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Өргөдөл амжилттай илгээгдлээ!</h2>
      <p className="text-sm text-[var(--text2)] mb-6">Бид таны өргөдлийг шалгаж, 1-2 өдрийн дотор хариу өгнө</p>
      <a href="/dashboard" className="px-6 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text)]">Dashboard руу буцах</a>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 max-w-[900px] mx-auto">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🎨</div>
        <h1 className="text-3xl font-extrabold text-[var(--text)] mb-2">Creator болох</h1>
        <p className="text-base text-[var(--text2)] max-w-md mx-auto">
          Контент бүтээж, орлого олоорой. Нэг эсвэл хэд хэдэн чиглэлээр бүртгүүлнэ.
        </p>
      </div>

      {/* Creator Types — 5 cards, multi-select */}
      <div className="mb-3">
        <label className="text-sm font-bold text-[var(--text)] mb-1 block">
          Creator төрөл сонгох *
          <span className="font-normal text-[var(--text3)] ml-2">
            (олон сонголт боломжтой)
          </span>
        </label>
        {capabilities.length > 0 && (
          <p className="text-xs text-[var(--primary)] mb-2">
            {capabilities.length} төрөл сонгосон
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-8">
        {CREATOR_TYPES.map(c => {
          const active = capabilities.includes(c.key)
          return (
            <button
              key={c.key}
              onClick={() => toggleCapability(c.key)}
              className={`rounded-2xl p-4 text-left transition-all border-2 relative ${
                active ? 'shadow-lg scale-[1.02]' : 'hover:shadow-md'
              }`}
              style={{
                borderColor: active ? c.color : 'var(--border)',
                background: active ? c.color + '08' : 'var(--surface)',
              }}
            >
              {/* Selected indicator */}
              {active && (
                <div
                  className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                  style={{ background: c.color }}
                >
                  ✓
                </div>
              )}

              <div className="flex items-start justify-between mb-2.5">
                <span className="text-2xl">{c.icon}</span>
              </div>

              <div className="text-sm font-bold text-[var(--text)] mb-1.5 pr-5">
                {c.title}
              </div>

              <p className="text-[11px] text-[var(--text2)] mb-3 leading-relaxed">
                {c.desc}
              </p>

              {/* Features */}
              <ul className="space-y-1 mb-3">
                {c.features.map(f => (
                  <li key={f} className="text-[10px] flex items-center gap-1.5" style={{ color: 'var(--text2)' }}>
                    <span style={{ color: c.color }}>•</span> {f}
                  </li>
                ))}
              </ul>

              {/* Badge */}
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mb-2"
                style={{ background: c.color + '15', color: c.color }}
              >
                {c.badge}
              </span>

              {/* Earnings */}
              <div
                className="rounded-lg px-2.5 py-1.5 mt-1"
                style={{ background: 'var(--surface2)' }}
              >
                <p className="text-[10px] text-[var(--text3)]">Таамаг орлого</p>
                <p className="text-xs font-bold" style={{ color: c.color }}>
                  {c.earnings}
                  <span className="font-normal text-[var(--text3)]"> /{c.earningUnit}</span>
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {existing?.status === 'rejected' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <div className="text-sm font-bold text-red-500 mb-1">Өмнөх өргөдөл татгалзагдсан</div>
          {existing.reject_reason && <p className="text-sm text-[var(--text2)]">Шалтгаан: {existing.reject_reason}</p>}
          <p className="text-xs text-[var(--text3)] mt-1">Та дахин өргөдөл илгээж болно</p>
        </div>
      )}

      {/* Application Form */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="text-lg font-bold text-[var(--text)] mb-5">Өргөдлийн маягт</h2>

        {/* Bio */}
        <div className="mb-5">
          <label className="text-sm font-bold text-[var(--text)] mb-2 block">Танилцуулга *</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Өөрийгөө товч танилцуулна уу..."
            className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] resize-none focus:border-[#FF6B00] outline-none" />
        </div>

        {/* Skills */}
        <div className="mb-5">
          <label className="text-sm font-bold text-[var(--text)] mb-2 block">
            Ур чадвар *
            {skills.length > 0 && (
              <span className="font-normal text-[var(--text3)] ml-2">{skills.length} сонгосон</span>
            )}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {SKILL_OPTIONS.map(s => (
              <button key={s.key} onClick={() => toggleSkill(s.key)}
                className={`p-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                  skills.includes(s.key)
                    ? 'bg-[#FF6B00] text-white border-2 border-[#FF6B00]'
                    : 'bg-[var(--bg)] text-[var(--text2)] border-2 border-[var(--border)] hover:border-[#FF6B00]'
                }`}>
                <span className="text-base block mb-0.5">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Portfolio URL */}
        <div className="mb-5">
          <label className="text-sm font-bold text-[var(--text)] mb-2 block">Портфолио линк</label>
          <input type="url" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)}
            placeholder="https://behance.net/..."
            className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:border-[#FF6B00] outline-none" />
        </div>

        {/* Motivation */}
        <div className="mb-6">
          <label className="text-sm font-bold text-[var(--text)] mb-2 block">Яагаад Creator болмоор байна вэ?</label>
          <textarea value={motivation} onChange={e => setMotivation(e.target.value)} rows={2} placeholder="Та яагаад контент бүтээх хүсэлтэй байна..."
            className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] resize-none focus:border-[#FF6B00] outline-none" />
        </div>

        {/* Summary before submit */}
        {capabilities.length > 0 && (
          <div className="mb-5 p-3 rounded-xl" style={{ background: 'var(--surface2)' }}>
            <p className="text-xs font-medium text-[var(--text3)] mb-1.5">Сонгосон төрлүүд:</p>
            <div className="flex flex-wrap gap-1.5">
              {capabilities.map(key => {
                const t = CREATOR_TYPES.find(c => c.key === key)
                if (!t) return null
                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{ background: t.color + '15', color: t.color }}
                  >
                    {t.icon} {t.title}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full py-3 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#E55D00] transition-colors disabled:opacity-50">
          {submitting ? 'Илгээж байна...' : 'Өргөдөл илгээх'}
        </button>
      </div>
    </div>
  )
}
