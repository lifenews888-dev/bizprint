'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { fbPixel } from '@/components/FacebookPixel'
import { API_URL } from '@/lib/api'

// ─── Static Mongolian label tables ─────────────────────────

const COLOR_MODES = [
  { v: 'CMYK', l: '4 өнгө (CMYK)', d: 'Бүтэн өнгөт хэвлэл' },
  { v: '1C',   l: '1 өнгө',        d: 'Нэг өнгөт хэвлэл' },
  { v: 'BW',   l: 'Хар цагаан',    d: 'Хар цагаан хэвлэл' },
]

const SIDES = [
  { v: 'single', l: 'Нэг тал',  d: 'Зөвхөн урд тал' },
  { v: 'double', l: 'Хоёр тал', d: 'Урд болон ард тал' },
]

const QTY_PRESETS = [50, 100, 250, 500, 1000, 2000, 5000]

const CONTACTS = [
  { v: 'chat',  l: 'Чат',    i: '💬', d: 'Шууд энэ сайтаар' },
  { v: 'phone', l: 'Утас',   i: '📞', d: 'Утсаар залгана' },
  { v: 'viber', l: 'Viber',  i: '📱', d: 'Viber-ээр' },
  { v: 'email', l: 'И-мэйл', i: '📧', d: 'И-мэйлээр' },
]

const FINISHING_LABELS: Record<string, string> = {
  'Матт ламинат': 'Матт ламинат',
  'Глосс ламинат': 'Гэрэлт ламинат',
  'Soft-touch': 'Зөөлөн мэдрэмж (Soft-touch)',
  'УВ лак': 'УВ лак',
  'УВ лак (бүлэг)': 'УВ лак — бүтэн',
  'УВ лак (хэсэг)': 'УВ лак — хэсэгчилсэн',
  'Фольг тамга': 'Фольг тамга',
  'Алт фольг': 'Алтан фольг тамга',
  'Мөнгө фольг': 'Мөнгөн фольг тамга',
  'Тэмдэглэлт': 'Дарж тэмдэглэх (Эмбосс)',
  'Нугалах': 'Нугалах (Fold)',
  'Die-cut': 'Хэлбэр тайрах (Die-cut)',
  'Цоолох': 'Цоолох (Perforate)',
  'Зүүгдэлт': 'Зүүгдэлт (Садл стич)',
  'Perfect bind': 'Нуруугаар наах (Perfect bind)',
  'Saddle stitch': 'Дунд зүүсэн (Saddle stitch)',
  'Wire-O': 'Утсан нуруу (Wire-O)',
  'Хатуу хавтас': 'Хатуу хавтас',
  'Ламинат': 'Ламинат',
  'UV coating': 'УВ лак',
  'Гантиг гагнуур': 'Гантиг гагнуур',
  'Оосор нэмэх': 'Оосор нэмэх',
  'Дантиг гагнуур': 'Дантиг гагнуур',
}

const PAPER_LABELS: Record<string, string> = {
  'Glossy 130gsm': 'Гялгар 130гр',
  'Glossy 170gsm': 'Гялгар 170гр',
  'Matte 130gsm': 'Матт 130гр',
  'Matte 170gsm': 'Матт 170гр',
  'Art card 250gsm': 'Арт карт 250гр',
  'Art card 300gsm': 'Арт карт 300гр',
  'Art card 350gsm': 'Арт карт 350гр',
  'Vinyl цагаан': 'Виниль (цагаан)',
  'Vinyl тунгалаг': 'Виниль (тунгалаг)',
  'Vinyl 440gsm': 'Виниль баннер 440гр',
  'Vinyl (наалт)': 'Виниль наалт',
  'Mesh баннер': 'Мэш баннер',
  'Backlit хулдаас': 'Гэрэлт хулдаас',
  'Kraft цаас': 'Крафт цаас',
  'Энгийн цагаан 80gsm': 'Энгийн цаас 80гр',
  'Хулдаасан гадна': 'Хулдаас — гадна хэрэглээ',
  'Хулдаасан дотор': 'Хулдаас — дотор хэрэглээ',
  'Glossy хавтас': 'Гялгар хавтас',
  'Matte хавтас': 'Матт хавтас',
  'Soft-touch хавтас': 'Зөөлөн хавтас',
  'Canvas': 'Даавуу (Canvas)',
  'Металл': 'Металл',
  'PVC тунгалаг': 'PVC (тунгалаг)',
  'Цаасан': 'Цаасан',
  'Синтетик (стенд суурьтай)': 'Синтетик (стенд)',
}

// Lookup Mongolian label first from active config's parallel array (admin-managed),
// then fall back to the static map, then to the raw key.
const lookupLabel = (key: string, keys: string[] | undefined, labels: string[] | undefined, staticMap: Record<string, string>): string => {
  if (Array.isArray(keys) && Array.isArray(labels)) {
    const idx = keys.indexOf(key)
    if (idx !== -1 && labels[idx]) return labels[idx]
  }
  return staticMap[key] || key
}

export default function NewOrderPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>}>
      <NewOrderPage />
    </Suspense>
  )
}

function NewOrderPage() {
  const router = useRouter()
  const params = useSearchParams()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [customW, setCustomW] = useState(0)
  const [customH, setCustomH] = useState(0)
  const [configs, setConfigs] = useState<any[]>([])
  const [activeConfig, setActiveConfig] = useState<any>(null)

  const [spec, setSpec] = useState({
    productId: params.get('productId') || '',
    productName: params.get('name') || '',
    category: params.get('category') || params.get('type') || params.get('productType') || '',
    quantity: +(params.get('qty') || 500),
    sizeLabel: '',
    paperType: '',
    colorMode: 'CMYK',
    sides: 'double',
    finishing: [] as string[],
    notes: '',
    hasDesign: false,
    needsDesign: false,
  })

  const [contact, setContact] = useState({
    name: '', phone: '', email: '', company: '',
    viberNumber: '', preferredContact: 'chat',
  })

  const [files, setFiles] = useState<Array<{ file: File; preview?: string }>>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ id: string; number: string } | null>(null)

  // Fetch quote configs from admin API
  useEffect(() => {
    fetch(`${API_URL}/api/cms/quote-config`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setConfigs(data)
          const productType = params.get('type') || params.get('category') || params.get('productType') || ''
          const matched = data.find((c: any) => c.product_type === productType)
          setActiveConfig(matched || data[0])
        }
      })
      .catch(() => {})
  }, [])

  // Update spec when active config changes (only if not already set from URL)
  useEffect(() => {
    if (activeConfig) {
      setSpec(p => ({
        ...p,
        sizeLabel: p.sizeLabel || activeConfig.sizes?.[0]?.label || '',
        paperType: p.paperType || activeConfig.materials?.[0] || '',
        category: p.category || activeConfig.product_type,
        productName: p.productName || activeConfig.name_mn,
      }))
    }
  }, [activeConfig])

  const sizes = activeConfig?.sizes || []
  const papers = activeConfig?.materials || []
  const finishings = activeConfig?.finishing_options || []

  // Admin-managed translations override hardcoded fallback maps
  const getPaperLabel = (p: string) =>
    lookupLabel(p, activeConfig?.materials, activeConfig?.materials_mn, PAPER_LABELS)
  const getFinishingLabel = (f: string) =>
    lookupLabel(f, activeConfig?.finishing_options, activeConfig?.finishing_options_mn, FINISHING_LABELS)

  const selSize = sizes.find((s: any) => s.label === spec.sizeLabel)
  const isCustom = selSize?.w === 0

  const toggleFin = (v: string) => setSpec(p => ({
    ...p,
    finishing: p.finishing.includes(v) ? p.finishing.filter(f => f !== v) : [...p.finishing, v],
  }))

  const addFiles = (fl: FileList | null) => {
    if (!fl) return
    const arr = Array.from(fl).slice(0, 5 - files.length).map(f => ({
      file: f,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }))
    setFiles(p => [...p, ...arr])
  }

  // Calculate estimated price using active config
  const calcEstimate = () => {
    if (!activeConfig || !selSize?.w || !selSize?.h || !spec.quantity) return null
    const areaM2 = (selSize.w / 1000) * (selSize.h / 1000)
    const baseRate = Number(activeConfig.base_rate) || 200
    const inkCost = Number(activeConfig.ink_cost_per_500) || 7000
    const finCost = Number(activeConfig.finishing_cost_each) || 5000
    const overheadRate = Number(activeConfig.overhead_rate) || 0.12
    const platformRate = Number(activeConfig.platform_rate) || 0.10
    const sidesMult = spec.sides === 'double' ? (Number(activeConfig.double_side_multiplier) || 1.7) : 1

    const paper = baseRate * spec.quantity * (areaM2 / 0.0623)
    const ink = inkCost * spec.quantity / 500
    const finishing = spec.finishing.length * finCost
    const sub = (paper + ink + finishing) * sidesMult
    const overhead = sub * overheadRate
    const platform = (sub + overhead) * platformRate
    const total = Math.round(sub + overhead + platform)

    const discounts = activeConfig.volume_discounts || []
    const activeDisc = discounts
      .filter((d: any) => spec.quantity >= d.min_qty)
      .sort((a: any, b: any) => b.min_qty - a.min_qty)[0]

    const discounted = activeDisc
      ? Math.round(total * (1 - activeDisc.discount_percent / 100))
      : total

    return {
      total: discounted,
      unitPrice: Math.round(discounted / spec.quantity),
      discount: activeDisc?.discount_percent || 0,
      originalTotal: activeDisc ? total : null,
    }
  }

  const estimate = calcEstimate()

  const submit = async () => {
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries({
        product_id: spec.productId,
        product_name: spec.productName || activeConfig?.name_mn || '',
        category: spec.category || activeConfig?.product_type || '',
        quantity: spec.quantity,
        size_label: spec.sizeLabel,
        width_mm: isCustom ? customW : (selSize?.w || 0),
        height_mm: isCustom ? customH : (selSize?.h || 0),
        paper_type: spec.paperType,
        color_mode: spec.colorMode,
        sides: spec.sides,
        finishing: JSON.stringify(spec.finishing),
        notes: spec.notes,
        has_design: spec.hasDesign,
        needs_design: spec.needsDesign,
        estimated_price: estimate?.total || 0,
      }).forEach(([k, v]) => fd.append(k, String(v)))

      Object.entries({
        customer_name: contact.name,
        customer_phone: contact.phone,
        customer_email: contact.email,
        customer_company: contact.company,
        viber_number: contact.viberNumber,
        preferred_contact: contact.preferredContact,
      }).forEach(([k, v]) => fd.append(k, v))

      files.forEach(f => fd.append('files', f.file))

      const token = localStorage.getItem('access_token') || ''
      const res = await fetch(`${API_URL}/api/inquiries`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      const data = await res.json()
      if (data.id) {
        setResult({ id: data.id, number: data.inquiry_number })
        fbPixel.purchase({
          orderId: data.id,
          value: estimate?.total || 0,
          productName: spec.productName || activeConfig?.name_mn,
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // ─── Success screen ─────────────────────────────────────
  if (result) return (
    <div className="max-w-md mx-auto py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-5 text-3xl">
        ✅
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Захиалга амжилттай!
      </h2>
      <p className="text-sm text-gray-500 mb-1">Захиалгын дугаар</p>
      <p className="text-3xl font-mono font-bold text-orange-500 mb-3">{result.number}</p>
      <p className="text-xs text-gray-400 mb-4">
        Бид 30 минутын дотор тантай{' '}
        {contact.preferredContact === 'viber' ? 'Viber-ээр' :
         contact.preferredContact === 'email' ? 'и-мэйлээр' :
         contact.preferredContact === 'phone' ? 'утсаар' : 'чатаар'} холбогдоно.
      </p>
      {estimate && (
        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-400 mb-1">Тооцоолсон үнэ</p>
          <p className="text-2xl font-bold text-orange-500">{estimate.total.toLocaleString()}₮</p>
          <p className="text-xs text-gray-400">Нэгж: {estimate.unitPrice.toLocaleString()}₮/ш</p>
        </div>
      )}
      <div className="flex gap-3 justify-center">
        <button onClick={() => router.push(`/inquiries/${result.id}`)}
          className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium">
          Захиалга + чат харах
        </button>
        <button onClick={() => router.push('/')}
          className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400">
          Нүүр хуудас
        </button>
      </div>
    </div>
  )

  const step1Valid = spec.quantity > 0 && spec.sizeLabel
  const step3Valid = contact.name && contact.phone

  const STEPS = ['Тодорхойлолт', 'Файл', 'Холбоо барих', 'Батлах']

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
        {spec.productName || activeConfig?.name_mn || 'Захиалгын хүсэлт'}
      </h1>
      <p className="text-sm text-gray-500 mb-6">Бүтээлийг бөглөж илгээнэ үү</p>

      {/* Product type tabs — only when no specific product selected */}
      {!params.get('productId') && configs.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {configs.map(c => (
            <button key={c.product_type}
              onClick={() => {
                setActiveConfig(c)
                setSpec(p => ({
                  ...p,
                  category: c.product_type,
                  productName: c.name_mn,
                  sizeLabel: c.sizes?.[0]?.label || '',
                  paperType: c.materials?.[0] || '',
                  finishing: [],
                }))
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-colors ${
                activeConfig?.product_type === c.product_type
                  ? 'bg-orange-500 text-white'
                  : 'border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-orange-300'
              }`}>
              <span>{c.icon}</span>
              {c.name_mn}
            </button>
          ))}
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center mb-8 gap-1">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
              step > i + 1 ? 'bg-green-500 text-white' :
              step === i + 1 ? 'bg-orange-500 text-white' :
              'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-xs hidden sm:block truncate ${step === i + 1 ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-400'}`}>
              {s}
            </span>
            {i < 3 && <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 mx-1" />}
          </div>
        ))}
      </div>

      {/* ─── STEP 1: Specification ─── */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Quantity */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Тираж <span className="text-red-500">*</span>
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {QTY_PRESETS.filter(q => !activeConfig || q >= activeConfig.min_qty).map(q => (
                <button key={q} onClick={() => setSpec(p => ({ ...p, quantity: q }))}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    spec.quantity === q
                      ? 'bg-orange-500 text-white'
                      : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-300'
                  }`}>
                  {q.toLocaleString()} ш
                </button>
              ))}
              <input type="number"
                placeholder="Бусад тоо"
                min={activeConfig?.min_qty || 1}
                onChange={e => e.target.value && setSpec(p => ({ ...p, quantity: +e.target.value }))}
                className="w-28 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-orange-400" />
            </div>
            {activeConfig?.min_qty > 0 && (
              <p className="text-xs text-gray-400">Хамгийн бага тираж: {activeConfig.min_qty} ширхэг</p>
            )}
          </div>

          {/* Size */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Хэмжээ</p>
            <div className="flex flex-wrap gap-1.5">
              {sizes.map((s: any) => (
                <button key={s.label} onClick={() => setSpec(p => ({ ...p, sizeLabel: s.label }))}
                  className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    spec.sizeLabel === s.label
                      ? 'bg-orange-500 text-white'
                      : 'border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-orange-300'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
            {isCustom && (
              <div className="flex gap-3 mt-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Өргөн (мм)</p>
                  <input type="number" value={customW || ''} onChange={e => setCustomW(+e.target.value)}
                    className="w-24 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Өндөр (мм)</p>
                  <input type="number" value={customH || ''} onChange={e => setCustomH(+e.target.value)}
                    className="w-24 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-orange-400" />
                </div>
              </div>
            )}
          </div>

          {/* Paper */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Цаасны төрөл</p>
            <div className="flex flex-wrap gap-1.5">
              {papers.map((p: string) => (
                <button key={p} onClick={() => setSpec(prev => ({ ...prev, paperType: p }))}
                  className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    spec.paperType === p
                      ? 'bg-orange-500 text-white'
                      : 'border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-orange-300'
                  }`}>
                  {getPaperLabel(p)}
                </button>
              ))}
            </div>
          </div>

          {/* Color mode */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Өнгийн горим</p>
            <div className="flex gap-2">
              {COLOR_MODES.map(c => (
                <button key={c.v} onClick={() => setSpec(p => ({ ...p, colorMode: c.v }))}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-colors border ${
                    spec.colorMode === c.v
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-600'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-orange-300'
                  }`}>
                  <div className="font-semibold">{c.l}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{c.d}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sides */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Хэвлэх тал</p>
            <div className="flex gap-2">
              {SIDES.map(s => (
                <button key={s.v} onClick={() => setSpec(p => ({ ...p, sides: s.v }))}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-colors border ${
                    spec.sides === s.v
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-600'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-orange-300'
                  }`}>
                  <div className="font-semibold">{s.l}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{s.d}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Finishing */}
          {finishings.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Боловсруулалт <span className="text-xs text-gray-400 font-normal">(заавал биш)</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {finishings.map((f: string) => (
                  <button key={f} onClick={() => toggleFin(f)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      spec.finishing.includes(f)
                        ? 'bg-orange-500 text-white'
                        : 'border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-orange-300'
                    }`}>
                    {getFinishingLabel(f)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Design */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Эх бэлтгэл</p>
            <div className="flex gap-2">
              <button onClick={() => setSpec(p => ({ ...p, hasDesign: true, needsDesign: false }))}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors border ${
                  spec.hasDesign
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-600'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500'
                }`}>
                ✅ Бэлэн байна
              </button>
              <button onClick={() => setSpec(p => ({ ...p, needsDesign: true, hasDesign: false }))}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors border ${
                  spec.needsDesign
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-600'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500'
                }`}>
                🎨 Дизайн хийлгэх
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Нэмэлт тайлбар</p>
            <textarea value={spec.notes} onChange={e => setSpec(p => ({ ...p, notes: e.target.value }))}
              rows={3} placeholder="Тусгай шаардлага, лого өнгө, хэвлэлийн тэмдэглэл..."
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-transparent resize-none focus:outline-none focus:border-orange-400" />
          </div>

          {/* Price estimate preview */}
          {estimate && (
            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-2xl p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Тооцоолсон үнэ</p>
                  {estimate.originalTotal && (
                    <p className="text-sm text-gray-400 line-through">{estimate.originalTotal.toLocaleString()}₮</p>
                  )}
                  <p className="text-2xl font-bold text-orange-500">{estimate.total.toLocaleString()}₮</p>
                  {estimate.discount > 0 && (
                    <p className="text-xs text-green-600 font-medium">-{estimate.discount}% хямдрал</p>
                  )}
                </div>
                <div className="text-right text-xs text-gray-400">
                  <p>Нэгж: {estimate.unitPrice.toLocaleString()}₮/ш</p>
                  <p className="mt-0.5 text-[10px]">Ойролцоо тооцоо</p>
                </div>
              </div>
            </div>
          )}

          <button onClick={() => setStep(2)} disabled={!step1Valid}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors">
            Дараах →
          </button>
        </div>
      )}

      {/* ─── STEP 2: File upload ─── */}
      {step === 2 && (
        <div className="space-y-5">
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files) }}
            className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center cursor-pointer hover:border-orange-400 transition-colors">
            <div className="text-4xl mb-3">📁</div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Эх файлаа оруулна уу
            </p>
            <p className="text-xs text-gray-400">PDF, AI, PSD, JPG, PNG — 50МБ хүртэл</p>
            <p className="text-xs text-gray-400 mt-1">Файл чирж тавих эсвэл дарж сонгох</p>
            <input ref={fileRef} type="file" multiple
              accept=".pdf,.ai,.psd,.jpg,.jpeg,.png,.webp,.eps,.zip,.svg"
              className="hidden"
              onChange={e => addFiles(e.target.files)} />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl">
                  {f.preview
                    ? <img src={f.preview} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg flex-shrink-0">📄</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{f.file.name}</p>
                    <p className="text-xs text-gray-400">{(f.file.size / 1024 / 1024).toFixed(1)} МБ</p>
                  </div>
                  <button onClick={() => setFiles(p => p.filter((_, j) => j !== i))}
                    className="text-gray-400 hover:text-red-500 transition-colors text-lg">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)}
              className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400">
              ← Буцах
            </button>
            <button onClick={() => setStep(3)}
              className="flex-1 py-3 bg-orange-500 text-white font-medium rounded-xl">
              {files.length > 0 ? 'Дараах →' : 'Файлгүйгээр үргэлжлэх →'}
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Contact ─── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Нэр *</label>
              <input value={contact.name} onChange={e => setContact(p => ({ ...p, name: e.target.value }))}
                placeholder="Таны нэр"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Утас *</label>
              <input value={contact.phone} onChange={e => setContact(p => ({ ...p, phone: e.target.value }))}
                placeholder="9900 0000" type="tel"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">И-мэйл</label>
              <input value={contact.email} onChange={e => setContact(p => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com" type="email"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Байгууллага</label>
              <input value={contact.company} onChange={e => setContact(p => ({ ...p, company: e.target.value }))}
                placeholder="Компанийн нэр"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:border-orange-400" />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Холбоо барих хэлбэр</p>
            <div className="grid grid-cols-2 gap-2">
              {CONTACTS.map(c => (
                <button key={c.v}
                  onClick={() => setContact(p => ({ ...p, preferredContact: c.v }))}
                  className={`flex items-center gap-2 p-3 rounded-xl text-sm border transition-colors ${
                    contact.preferredContact === c.v
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-600'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500'
                  }`}>
                  <span>{c.i}</span>
                  <div className="text-left">
                    <div className="text-xs font-medium">{c.l}</div>
                    <div className="text-[10px] opacity-60">{c.d}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {contact.preferredContact === 'viber' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Viber дугаар</label>
              <input value={contact.viberNumber} onChange={e => setContact(p => ({ ...p, viberNumber: e.target.value }))}
                placeholder="Viber дугаар"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:border-orange-400" />
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)}
              className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400">
              ← Буцах
            </button>
            <button onClick={() => setStep(4)} disabled={!step3Valid}
              className="flex-1 py-3 bg-orange-500 text-white font-medium rounded-xl disabled:opacity-50">
              Дараах →
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 4: Confirm ─── */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-2xl divide-y divide-gray-100 dark:divide-gray-800">
            {([
              ['Бүтээгдэхүүн', activeConfig?.name_mn || spec.productName],
              ['Тираж', `${spec.quantity.toLocaleString()} ширхэг`],
              ['Хэмжээ', isCustom ? `${customW}×${customH}мм` : spec.sizeLabel],
              ['Цаас', getPaperLabel(spec.paperType)],
              ['Өнгө', COLOR_MODES.find(c => c.v === spec.colorMode)?.l || spec.colorMode],
              ['Тал', SIDES.find(s => s.v === spec.sides)?.l || spec.sides],
              ...(spec.finishing.length > 0 ? [['Боловсруулалт', spec.finishing.map(getFinishingLabel).join(', ')]] : []),
              ...(spec.notes ? [['Тэмдэглэл', spec.notes]] : []),
              ['Холбоо барих', CONTACTS.find(c => c.v === contact.preferredContact)?.l || ''],
              ['Нэр', contact.name],
              ['Утас', contact.phone],
            ] as Array<[string, string]>).map(([k, v]) => (
              <div key={k} className="flex justify-between items-start px-4 py-3">
                <span className="text-sm text-gray-500 flex-shrink-0">{k}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white text-right ml-4">{v}</span>
              </div>
            ))}

            {estimate && (
              <div className="px-4 py-3 bg-orange-50 dark:bg-orange-900/10">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-gray-500">Тооцоолсон үнэ</span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-orange-500">{estimate.total.toLocaleString()}₮</p>
                    <p className="text-xs text-gray-400">Нэгж: {estimate.unitPrice.toLocaleString()}₮/ш</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center">
            Захиалга илгээсний дараа бид 30 минутын дотор холбогдоно
          </p>

          <div className="flex gap-3">
            <button onClick={() => setStep(3)}
              className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400">
              ← Буцах
            </button>
            <button onClick={submit} disabled={loading}
              className="flex-1 py-3.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-bold rounded-xl disabled:opacity-50 transition-colors">
              {loading ? 'Илгээж байна...' : '✓ Захиалга илгээх'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
