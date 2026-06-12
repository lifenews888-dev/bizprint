'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { fbPixel } from '@/components/FacebookPixel'
import { API_URL } from '@/lib/api'
import { calcWideFallbackPrice, clampWideDimensionMm, clampWideQuantity, fetchWideServerPrice } from '@/lib/pricing/wide'
import {
  CLIENT_ORDER_FALLBACK_ENGINE,
  CLIENT_ORDER_SERVER_PREVIEW_ENGINE,
  CLIENT_PRICING_SNAPSHOT_VERSION,
  PRICING_CONTRACT_VERSION,
} from '@/lib/pricing/snapshot'

interface OrderSize {
  label: string
  w: number
  h: number
}

interface VolumeDiscount {
  min_qty: number
  discount_percent: number
}

interface OrderConfig {
  product_type: string
  name_mn: string
  icon?: string
  sizes: OrderSize[]
  materials: string[]
  materials_mn?: string[]
  finishing_options: string[]
  finishing_options_mn?: string[]
  min_qty: number
  base_rate?: number
  double_side_multiplier?: number
  overhead_rate?: number
  platform_rate?: number
  ink_cost_per_500?: number
  finishing_cost_each?: number
  volume_discounts?: VolumeDiscount[]
}

interface EstimateBreakdown {
  material?: number
  print?: number
  finishing?: number
  overhead?: number
  platform?: number
  vat?: number
}

interface EstimateMeta {
  materialRateM2?: number
  printRateM2?: number
  sideMultiplier?: number
  backendTotal?: number
}

interface OrderEstimate {
  total: number
  unitPrice: number
  discount?: number
  originalTotal?: number | null
  source?: string
  breakdown?: EstimateBreakdown | null
  meta?: EstimateMeta | null
}

interface SavedUser {
  full_name?: string
  name?: string
  username?: string
  phone?: string
  email?: string
  company_name?: string
  company?: string
}

interface InquiryResponse {
  id?: string
  inquiry_number?: string
  message?: string
  error?: string
}

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

const FALLBACK_ORDER_CONFIGS: OrderConfig[] = [
  {
    product_type: 'business-card',
    name_mn: 'Нэрийн хуудас',
    icon: '💳',
    sizes: [{ label: '90×54мм (стандарт)', w: 90, h: 54 }, { label: '90×50мм', w: 90, h: 50 }, { label: 'Захиалгат', w: 0, h: 0 }],
    materials: ['Art card 300gsm', 'Art card 350gsm', 'Металл', 'PVC тунгалаг'],
    finishing_options: ['Матт ламинат', 'Глосс ламинат', 'Soft-touch', 'УВ лак', 'Фольг тамга'],
    min_qty: 100,
    base_rate: 340,
    double_side_multiplier: 1.7,
    overhead_rate: 0.12,
    platform_rate: 0.10,
    ink_cost_per_500: 7000,
    finishing_cost_each: 5000,
    volume_discounts: [{ min_qty: 250, discount_percent: 10 }, { min_qty: 500, discount_percent: 15 }, { min_qty: 1000, discount_percent: 25 }],
  },
  {
    product_type: 'flyer',
    name_mn: 'Флаер',
    icon: '📄',
    sizes: [{ label: 'A6 (105×148мм)', w: 105, h: 148 }, { label: 'A5 (148×210мм)', w: 148, h: 210 }, { label: 'A4 (210×297мм)', w: 210, h: 297 }, { label: 'DL (99×210мм)', w: 99, h: 210 }, { label: 'Захиалгат', w: 0, h: 0 }],
    materials: ['Glossy 130gsm', 'Glossy 170gsm', 'Matte 170gsm', 'Art card 250gsm'],
    finishing_options: ['Матт ламинат', 'Глосс ламинат', 'УВ лак'],
    min_qty: 50,
    base_rate: 180,
    double_side_multiplier: 1.7,
    overhead_rate: 0.12,
    platform_rate: 0.10,
    ink_cost_per_500: 7000,
    finishing_cost_each: 5000,
    volume_discounts: [{ min_qty: 250, discount_percent: 10 }, { min_qty: 500, discount_percent: 15 }, { min_qty: 1000, discount_percent: 25 }],
  },
  {
    product_type: 'sticker',
    name_mn: 'Стикер',
    icon: '📎',
    sizes: [{ label: 'Дугуй 50мм', w: 50, h: 50 }, { label: 'Дугуй 100мм', w: 100, h: 100 }, { label: 'Дөрвөлжин A6', w: 105, h: 148 }, { label: 'Захиалгат', w: 0, h: 0 }],
    materials: ['Vinyl цагаан', 'Vinyl тунгалаг', 'Цаасан'],
    finishing_options: ['Ламинат', 'UV coating'],
    min_qty: 100,
    base_rate: 280,
    double_side_multiplier: 1.7,
    overhead_rate: 0.12,
    platform_rate: 0.10,
    ink_cost_per_500: 7000,
    finishing_cost_each: 5000,
    volume_discounts: [{ min_qty: 250, discount_percent: 10 }, { min_qty: 500, discount_percent: 15 }, { min_qty: 1000, discount_percent: 25 }],
  },
  {
    product_type: 'banner',
    name_mn: 'Баннер',
    icon: '🏗️',
    sizes: [{ label: '1×2м', w: 1000, h: 2000 }, { label: '1×3м', w: 1000, h: 3000 }, { label: '2×3м', w: 2000, h: 3000 }, { label: '3×6м', w: 3000, h: 6000 }, { label: 'Захиалгат', w: 0, h: 0 }],
    materials: ['Vinyl 440gsm', 'Mesh баннер', 'Backlit хулдаас'],
    finishing_options: ['Гантиг гагнуур', 'Оосор нэмэх'],
    min_qty: 1,
    base_rate: 1200,
    double_side_multiplier: 1.7,
    overhead_rate: 0.12,
    platform_rate: 0.10,
    ink_cost_per_500: 7000,
    finishing_cost_each: 5000,
    volume_discounts: [],
  },
]

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

const findConfig = (configs: OrderConfig[], productType: string) =>
  configs.find(c => c.product_type === productType)

const getSizeLabelFromParam = (config: OrderConfig | null | undefined, sizeParam: string | null): string => {
  if (!config || !sizeParam) return ''
  const normalized = sizeParam.toLowerCase().replace('×', 'x')
  const byLabel = (config.sizes || []).find(s => String(s.label).toLowerCase().replace('×', 'x') === normalized)
  if (byLabel) return byLabel.label

  const [w, h] = normalized.split('x').map((n: string) => Number(n))
  if (!w || !h) return ''
  return (config.sizes || []).find(s => Number(s.w) === w && Number(s.h) === h)?.label || ''
}

const parseFinishingParam = (value: string | null) =>
  (value || '').split(',').map(v => v.trim()).filter(Boolean)

const clampOrderQuantity = (value: unknown, fallback = 1) =>
  clampWideQuantity(value, Math.max(1, fallback))

function EstimateSourceDetails({
  estimate,
  serverPricingLoading = false,
  serverPricingError = '',
}: {
  estimate: OrderEstimate | null
  serverPricingLoading?: boolean
  serverPricingError?: string
}) {
  if (!estimate?.breakdown) return null

  const materialPrint = Number(estimate.breakdown.material || 0) + Number(estimate.breakdown.print || 0)
  const materialRateM2 = Number(estimate.meta?.materialRateM2 || 0)
  const printRateM2 = Number(estimate.meta?.printRateM2 || 0)
  const sideMultiplier = Number(estimate.meta?.sideMultiplier || 1)
  const backendTotal = Number(estimate.meta?.backendTotal || 0)
  const finishingTotal = Number(estimate.breakdown.finishing || 0)
  const vatTotal = Number(estimate.breakdown.vat || 0)

  return (
    <div className="mt-3 border-t border-orange-200/70 dark:border-orange-800/70 pt-3 text-xs text-gray-500 dark:text-gray-400 space-y-1.5">
      <div className="flex justify-between gap-3">
        <span>Үнэ бодолт</span>
        <span className={estimate.source === 'server' ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>
          {estimate.source === 'server' ? 'Backend engine' : serverPricingLoading ? 'Шалгаж байна' : 'Fallback'}
        </span>
      </div>
      {estimate.source !== 'server' && (
        <div className={`rounded-lg border px-3 py-2 ${serverPricingError ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300' : 'border-gray-200 bg-white/70 text-gray-500 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400'}`}>
          {serverPricingLoading
            ? 'Backend engine-ээс үнэ баталгаажуулж байна.'
            : serverPricingError || 'Backend engine үнэ ирээгүй тул түр fallback тооцоо харуулж байна.'}
        </div>
      )}
      {materialPrint > 0 && (
        <div className="flex justify-between gap-3">
          <span>Материал + хэвлэл</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{materialPrint.toLocaleString()}₮</span>
        </div>
      )}
      {materialRateM2 > 0 && (
        <div className="flex justify-between gap-3">
          <span>Материалын тариф</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{materialRateM2.toLocaleString()}₮/м²</span>
        </div>
      )}
      {printRateM2 > 0 && (
        <div className="flex justify-between gap-3">
          <span>Хэвлэх тариф</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {printRateM2.toLocaleString()}₮/м²{sideMultiplier > 1 ? ` × ${sideMultiplier}` : ''}
          </span>
        </div>
      )}
      {finishingTotal > 0 && (
        <div className="flex justify-between gap-3">
          <span>Боловсруулалт</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{finishingTotal.toLocaleString()}₮</span>
        </div>
      )}
      {vatTotal > 0 && (
        <div className="flex justify-between gap-3">
          <span>НӨАТ</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{vatTotal.toLocaleString()}₮</span>
        </div>
      )}
      {estimate.source === 'server' && backendTotal > 0 && (
        <div className="flex justify-between gap-3 border-t border-orange-200/70 pt-1.5 font-semibold text-gray-800 dark:border-orange-800/70 dark:text-gray-200">
          <span>Backend нийт</span>
          <span>{backendTotal.toLocaleString()}₮</span>
        </div>
      )}
    </div>
  )
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
  const requestedProductType = params.get('category') || params.get('type') || params.get('productType') || ''
  const requestedSize = params.get('size')
  const requestedMaterial = params.get('material') || ''
  const requestedSides = params.get('sides') || 'double'
  const requestedFinishing = parseFinishingParam(params.get('finishing'))
  const fallbackActiveConfig = findConfig(FALLBACK_ORDER_CONFIGS, requestedProductType) || FALLBACK_ORDER_CONFIGS[0]

  const [step, setStep] = useState(1)
  const [customW, setCustomW] = useState(0)
  const [customH, setCustomH] = useState(0)
  const [configs, setConfigs] = useState<OrderConfig[]>(FALLBACK_ORDER_CONFIGS)
  const [activeConfig, setActiveConfig] = useState<OrderConfig>(fallbackActiveConfig)

  const [spec, setSpec] = useState({
    productId: params.get('productId') || '',
    productName: params.get('name') || '',
    category: requestedProductType || fallbackActiveConfig.product_type,
    quantity: clampOrderQuantity(params.get('qty'), fallbackActiveConfig.min_qty || 1),
    sizeLabel: '',
    paperType: requestedMaterial,
    colorMode: 'CMYK',
    sides: SIDES.some(s => s.v === requestedSides) ? requestedSides : 'double',
    finishing: requestedFinishing,
    notes: '',
    hasDesign: false,
    needsDesign: false,
  })

  const [contact, setContact] = useState({
    name: '', phone: '', email: '', company: '',
    viberNumber: '', preferredContact: 'chat',
  })

  useEffect(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}') as SavedUser
      const queryName = params.get('customer_name') || params.get('name') || ''
      const queryPhone = params.get('phone') || params.get('customer_phone') || ''
      const queryEmail = params.get('email') || params.get('customer_email') || ''
      const queryCompany = params.get('company') || params.get('customer_company') || ''

      setContact(prev => ({
        ...prev,
        name: prev.name || queryName || savedUser.full_name || savedUser.name || savedUser.username || '',
        phone: prev.phone || queryPhone || savedUser.phone || '',
        email: prev.email || queryEmail || savedUser.email || '',
        company: prev.company || queryCompany || savedUser.company_name || savedUser.company || '',
        viberNumber: prev.viberNumber || queryPhone || savedUser.phone || '',
      }))
    } catch {}
  }, [params])

  const [files, setFiles] = useState<Array<{ file: File; preview?: string }>>([])
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitRequestId, setSubmitRequestId] = useState('')
  const [submitRequestIdCopied, setSubmitRequestIdCopied] = useState(false)
  const [result, setResult] = useState<{ id: string; number: string } | null>(null)
  const [serverEstimate, setServerEstimate] = useState<OrderEstimate | null>(null)
  const [serverPricingLoading, setServerPricingLoading] = useState(false)
  const [serverPricingError, setServerPricingError] = useState('')

  // Fetch quote configs from admin API
  useEffect(() => {
    fetch(`${API_URL}/api/cms/quote-config`)
      .then(r => r.ok ? r.json() as Promise<OrderConfig[]> : null)
      .then(data => {
        const nextConfigs = Array.isArray(data) && data.length > 0 ? data : FALLBACK_ORDER_CONFIGS
        setConfigs(nextConfigs)
        setActiveConfig(findConfig(nextConfigs, requestedProductType) || nextConfigs[0])
      })
      .catch(() => {
        setConfigs(FALLBACK_ORDER_CONFIGS)
        setActiveConfig(fallbackActiveConfig)
      })
  }, [])

  // Update spec when active config changes (only if not already set from URL)
  useEffect(() => {
    if (activeConfig) {
      setSpec(p => ({
        ...p,
        sizeLabel: p.sizeLabel || getSizeLabelFromParam(activeConfig, requestedSize) || activeConfig.sizes?.[0]?.label || '',
        paperType: p.paperType || requestedMaterial || activeConfig.materials?.[0] || '',
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

  const selSize = sizes.find(s => s.label === spec.sizeLabel)
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
  const calcEstimate = (): OrderEstimate | null => {
    const widthMm = isCustom ? clampWideDimensionMm(customW, 0) : clampWideDimensionMm(selSize?.w, 0)
    const heightMm = isCustom ? clampWideDimensionMm(customH, 0) : clampWideDimensionMm(selSize?.h, 0)
    const quantity = clampOrderQuantity(spec.quantity, activeConfig?.min_qty || 1)
    if (!activeConfig || !widthMm || !heightMm || !quantity) return null
    const areaM2 = (widthMm / 1000) * (heightMm / 1000)

    if (['banner', 'sticker'].includes(spec.category || activeConfig.product_type)) {
      const productType = spec.category || activeConfig.product_type
      const wideEstimate = calcWideFallbackPrice({
        productId: productType,
        widthMm,
        heightMm,
        quantity,
        sides: spec.sides,
        materialName: spec.paperType,
        finishing: spec.finishing,
      })
      return wideEstimate ? { ...wideEstimate, discount: 0, originalTotal: null } : null
    }

    const baseRate = Number(activeConfig.base_rate) || 200
    const inkCost = Number(activeConfig.ink_cost_per_500) || 7000
    const finCost = Number(activeConfig.finishing_cost_each) || 5000
    const overheadRate = Number(activeConfig.overhead_rate) || 0.12
    const platformRate = Number(activeConfig.platform_rate) || 0.10
    const sidesMult = spec.sides === 'double' ? (Number(activeConfig.double_side_multiplier) || 1.7) : 1

    const paper = baseRate * quantity * (areaM2 / 0.0623)
    const ink = inkCost * quantity / 500
    const finishing = spec.finishing.length * finCost
    const sub = (paper + ink + finishing) * sidesMult
    const overhead = sub * overheadRate
    const platform = (sub + overhead) * platformRate
    const total = Math.round(sub + overhead + platform)

    const discounts = activeConfig.volume_discounts || []
    const activeDisc = discounts
      .filter(d => quantity >= d.min_qty)
      .sort((a, b) => b.min_qty - a.min_qty)[0]

    const discounted = activeDisc
      ? Math.round(total * (1 - activeDisc.discount_percent / 100))
      : total

    return {
      total: discounted,
      unitPrice: Math.round(discounted / quantity),
      discount: activeDisc?.discount_percent || 0,
      originalTotal: activeDisc ? total : null,
    }
  }

  const fallbackEstimate = calcEstimate()

  useEffect(() => {
    if (step !== 1 || !submitError) return
    if (!getWideSubmitValidationError()) setSubmitError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customH, customW, isCustom, selSize?.h, selSize?.w, spec.category, spec.paperType, step, submitError])

  useEffect(() => {
    const widthMm = isCustom ? clampWideDimensionMm(customW, 0) : clampWideDimensionMm(selSize?.w, 0)
    const heightMm = isCustom ? clampWideDimensionMm(customH, 0) : clampWideDimensionMm(selSize?.h, 0)
    const quantity = clampOrderQuantity(spec.quantity, activeConfig?.min_qty || 1)
    const productType = spec.category || activeConfig?.product_type || ''

    if (!['banner', 'sticker'].includes(productType) || !widthMm || !heightMm || !quantity) {
      setServerEstimate(null)
      setServerPricingLoading(false)
      setServerPricingError('')
      return
    }

    const controller = new AbortController()
    setServerPricingLoading(true)
    setServerPricingError('')
    const t = window.setTimeout(() => {
      fetchWideServerPrice(API_URL, {
        productId: productType,
        widthMm,
        heightMm,
        quantity,
        materialName: spec.paperType,
        finishing: spec.finishing,
        sides: spec.sides,
      }, controller.signal)
        .then((r) => {
          setServerEstimate({ ...r, discount: 0, originalTotal: null })
          setServerPricingError('')
        })
        .catch(() => {
          setServerEstimate(null)
          setServerPricingError('Backend engine үнэ авахад алдаа гарлаа. Энэ үнэ түр fallback тооцоо тул оператор дахин баталгаажуулна.')
        })
        .finally(() => setServerPricingLoading(false))
    }, 300)

    return () => {
      window.clearTimeout(t)
      controller.abort()
      setServerPricingLoading(false)
    }
  }, [activeConfig?.product_type, customH, customW, isCustom, selSize?.h, selSize?.w, spec.category, spec.finishing, spec.paperType, spec.quantity, spec.sides])

  const serverEstimateTotal = Number(serverEstimate?.total || 0)
  const estimate = serverEstimateTotal > 0 ? serverEstimate : fallbackEstimate
  const estimateSource = serverEstimateTotal > 0 ? 'server' : estimate?.source
  const safeOrderQuantity = clampOrderQuantity(spec.quantity, activeConfig?.min_qty || 1)
  const safeWidthMm = isCustom ? clampWideDimensionMm(customW, 0) : clampWideDimensionMm(selSize?.w, 0)
  const safeHeightMm = isCustom ? clampWideDimensionMm(customH, 0) : clampWideDimensionMm(selSize?.h, 0)
  const displayTotal = estimateSource === 'server'
    ? Number(estimate?.meta?.backendTotal || estimate?.total || 0)
    : Number(estimate?.total || 0)
  const displayUnitPrice = estimateSource === 'server'
    ? Math.round(displayTotal / safeOrderQuantity)
    : Number(estimate?.unitPrice || 0)
  const displayDiscount = Number(estimate?.discount || 0)
  const quoteRetryParams = new URLSearchParams({
    product: spec.category || activeConfig?.product_type || 'flyer',
    size: `${safeWidthMm}x${safeHeightMm}`,
    material: spec.paperType,
    qty: String(safeOrderQuantity),
    sides: spec.sides,
    finishing: spec.finishing.join(','),
  })
  const quoteRetryHref = `/quote?${quoteRetryParams.toString()}`

  const getWideSubmitValidationError = () => {
    const productType = spec.category || activeConfig?.product_type || ''
    if (!['banner', 'sticker'].includes(productType)) return ''
    const widthMm = isCustom ? clampWideDimensionMm(customW, 0) : clampWideDimensionMm(selSize?.w, 0)
    const heightMm = isCustom ? clampWideDimensionMm(customH, 0) : clampWideDimensionMm(selSize?.h, 0)
    if (!widthMm || !heightMm) return 'Хэмжээний мэдээлэл дутуу байна. Хэмжээгээ сонгох эсвэл захиалгат хэмжээг бүрэн оруулна уу.'
    if (!String(spec.paperType || '').trim()) return 'Материалын мэдээлэл дутуу байна. Материалаа сонгоно уу.'
    return ''
  }

  const getStep1ValidationError = () => {
    if (!spec.quantity || spec.quantity < 1) return 'Тиражийн тоо оруулна уу.'
    if (!spec.sizeLabel) return 'Хэмжээгээ сонгоно уу.'
    return getWideSubmitValidationError()
  }

  const getSubmitErrorMessage = (error: unknown) => {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return 'Сервер хариу өгөхөд удаж байна. Интернэт холболтоо шалгаад дахин оролдоно уу.'
    }
    const message = error instanceof Error ? error.message : ''
    if (error instanceof TypeError || message.includes('Failed to fetch')) {
      return 'Сервертэй холбогдож чадсангүй. Түр хүлээгээд дахин оролдох эсвэл 72000444 руу залгана уу.'
    }
    return message || 'Захиалга илгээж чадсангүй. Дахин оролдоно уу.'
  }

  const createSubmitRequestId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `order-${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  const submit = async () => {
    setSubmitError('')
    setSubmitRequestId('')
    setSubmitRequestIdCopied(false)
    const validationError = getWideSubmitValidationError()
    if (validationError) {
      setSubmitError(validationError)
      setStep(1)
      return
    }
    setLoading(true)
    const requestId = createSubmitRequestId()
    setSubmitRequestId(requestId)
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 12000)
    try {
      const fd = new FormData()
      const widthMm = safeWidthMm
      const heightMm = safeHeightMm
      const quantity = safeOrderQuantity
      const pricingSnapshot = {
        source: estimateSource || 'fallback',
        clientSnapshotVersion: CLIENT_PRICING_SNAPSHOT_VERSION,
        pricingContractVersion: PRICING_CONTRACT_VERSION,
        pricingEngine: estimateSource === 'server'
          ? CLIENT_ORDER_SERVER_PREVIEW_ENGINE
          : CLIENT_ORDER_FALLBACK_ENGINE,
        total: displayTotal || estimate?.total || 0,
        unitPrice: displayUnitPrice || estimate?.unitPrice || 0,
        discount: estimate?.discount || 0,
        originalTotal: estimate?.originalTotal || null,
        breakdown: estimate?.breakdown || null,
        meta: estimate?.meta || null,
        product: {
          id: spec.productId,
          name: spec.productName || activeConfig?.name_mn || '',
          category: spec.category || activeConfig?.product_type || '',
        },
        spec: {
          quantity,
          sizeLabel: spec.sizeLabel,
          widthMm,
          heightMm,
          material: spec.paperType,
          colorMode: spec.colorMode,
          sides: spec.sides,
          finishing: spec.finishing,
        },
        generatedAt: new Date().toISOString(),
      }
      Object.entries({
        product_id: spec.productId,
        product_name: spec.productName || activeConfig?.name_mn || '',
        category: spec.category || activeConfig?.product_type || '',
        quantity,
        size_label: spec.sizeLabel,
        width_mm: widthMm,
        height_mm: heightMm,
        paper_type: spec.paperType,
        color_mode: spec.colorMode,
        sides: spec.sides,
        finishing: JSON.stringify(spec.finishing),
        notes: spec.notes,
        has_design: spec.hasDesign,
        needs_design: spec.needsDesign,
        estimated_price: displayTotal || estimate?.total || 0,
        pricing_snapshot: JSON.stringify(pricingSnapshot),
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
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-request-id': requestId,
        },
        body: fd,
        signal: controller.signal,
      })
      setSubmitRequestId(res.headers.get('x-request-id') || requestId)
      const text = await res.text()
      let data: InquiryResponse = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        data = { message: text }
      }
      if (!res.ok) {
        throw new Error(data?.message || data?.error || `Захиалга илгээхэд алдаа гарлаа (${res.status})`)
      }
      if (data.id) {
        const inquiryNumber = data.inquiry_number || data.id
        setResult({ id: data.id, number: inquiryNumber })
        fbPixel.purchase({
          orderId: data.id,
          value: displayTotal || estimate?.total || 0,
          productName: spec.productName || activeConfig?.name_mn,
        })
      } else {
        throw new Error('Серверээс захиалгын дугаар ирсэнгүй')
      }
    } catch (e: unknown) {
      console.error(e)
      setSubmitError(getSubmitErrorMessage(e))
    } finally {
      window.clearTimeout(timeout)
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
          <p className="text-2xl font-bold text-orange-500">{displayTotal.toLocaleString()}₮</p>
          <p className="text-xs text-gray-400">Нэгж: {displayUnitPrice.toLocaleString()}₮/ш</p>
          <p className={`mt-1 text-xs ${estimateSource === 'server' ? 'text-green-600' : 'text-amber-600'}`}>
            {estimateSource === 'server' ? 'Backend баталгаатай' : 'Ойролцоо тооцоо'}
          </p>
        </div>
      )}
      <div className="flex gap-3 justify-center">
        <button onClick={() => router.push(`/inquiries/${result.id}`)}
          className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium">
          Захиалга + чат харах
        </button>
        <button onClick={() => router.push(`/inquiries/${result.id}?tab=detail`)}
          className="px-5 py-2.5 border border-orange-200 text-orange-600 rounded-xl text-sm font-medium dark:border-orange-800 dark:text-orange-300">
          Үнийн задаргаа
        </button>
        <button onClick={() => router.push('/')}
          className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400">
          Нүүр хуудас
        </button>
      </div>
    </div>
  )

  const step1Valid = !getStep1ValidationError()
  const step3Valid = contact.name && contact.phone

  const handleStep1Next = () => {
    const validationError = getStep1ValidationError()
    if (validationError) {
      setSubmitError(validationError)
      setSubmitRequestId('')
      return
    }
    setSubmitError('')
    setSubmitRequestId('')
    setStep(2)
  }

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
          {submitError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              <p className="font-semibold mb-1">Захиалгын мэдээлэл дутуу байна</p>
              <p className="leading-6">{submitError}</p>
            </div>
          )}

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
                value={spec.quantity || ''}
                min={activeConfig?.min_qty || 1}
                onChange={e => setSpec(p => ({ ...p, quantity: clampOrderQuantity(e.target.value, activeConfig?.min_qty || 1) }))}
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
              {sizes.map(s => (
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
                  <input type="number" value={customW || ''} onChange={e => setCustomW(clampWideDimensionMm(e.target.value, 0))}
                    className="w-24 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Өндөр (мм)</p>
                  <input type="number" value={customH || ''} onChange={e => setCustomH(clampWideDimensionMm(e.target.value, 0))}
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
              <EstimateSourceDetails
                estimate={estimate}
                serverPricingLoading={serverPricingLoading}
                serverPricingError={serverPricingError}
              />
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
                  <p className="text-2xl font-bold text-orange-500">{displayTotal.toLocaleString()}₮</p>
                  {displayDiscount > 0 && (
                    <p className="text-xs text-green-600 font-medium">-{displayDiscount}% хямдрал</p>
                  )}
                </div>
                <div className="text-right text-xs text-gray-400">
                  <p>Нэгж: {displayUnitPrice.toLocaleString()}₮/ш</p>
                  <p className={`mt-0.5 text-[10px] ${estimateSource === 'server' ? 'text-green-600' : 'text-amber-600'}`}>
                    {estimateSource === 'server' ? 'Backend баталгаатай' : serverPricingLoading ? 'Backend шалгаж байна' : 'Ойролцоо тооцоо'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button onClick={handleStep1Next} aria-disabled={!step1Valid}
            className={`w-full py-3.5 text-white font-semibold rounded-xl transition-colors ${
              step1Valid ? 'bg-orange-500 hover:bg-orange-600' : 'bg-orange-400 hover:bg-orange-500'
            }`}>
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
                    <p className="text-xl font-bold text-orange-500">{displayTotal.toLocaleString()}₮</p>
                    <p className="text-xs text-gray-400">Нэгж: {displayUnitPrice.toLocaleString()}₮/ш</p>
                    <p className={`mt-1 text-xs ${estimateSource === 'server' ? 'text-green-600' : 'text-amber-600'}`}>
                      {estimateSource === 'server' ? 'Backend баталгаатай' : 'Ойролцоо тооцоо'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center">
            Захиалга илгээсний дараа бид 30 минутын дотор холбогдоно
          </p>

          {submitError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              <p className="font-semibold mb-1">Захиалга илгээж чадсангүй</p>
              <p className="leading-6">{submitError}</p>
              {submitRequestId && (
                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-red-200 bg-white/70 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-gray-950/40 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Support ID: <span className="font-mono">{submitRequestId}</span>
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(submitRequestId).catch(() => {})
                      setSubmitRequestIdCopied(true)
                      window.setTimeout(() => setSubmitRequestIdCopied(false), 1600)
                    }}
                    className="w-fit rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                  >
                    {submitRequestIdCopied ? 'Хуулагдлаа' : 'Хуулах'}
                  </button>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <a href="tel:72000444" className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white no-underline">
                  72000444 руу залгах
                </a>
                <a href={quoteRetryHref} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 no-underline dark:border-red-800 dark:text-red-300">
                  Үнийн санал дахин авах
                </a>
              </div>
            </div>
          )}

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
