export type WidePricingSource = 'local' | 'server'

export type WidePricingResult = {
  total: number
  unitPrice: number
  source: WidePricingSource
  breakdown: {
    paper: number
    ink: number
    material: number
    print: number
    finishing: number
    setup: number
    pages: number
    vat: number
  }
  meta: {
    materialName: string
    areaM2: number
    billableAreaM2: number
    wastePct: number
    materialRateM2?: number
    printRateM2?: number
    sideMultiplier?: number
    backendTotal?: number
  }
}

export type WideServerPricingInput = {
  productId: string
  widthMm: number
  heightMm: number
  quantity: number
  sides: string
  materialName: string
  finishing: string[]
}

type WideMaterialRate = {
  material: number
  print: number
  waste: number
  setup: number
  side: number
}

type WideServerResponse = {
  total_price?: unknown
  unit_price?: unknown
  material_cost?: unknown
  print_cost?: unknown
  finishing_cost?: unknown
  setup_cost?: unknown
  vat?: unknown
  material_name?: unknown
  area_m2?: unknown
  billable_area_m2?: unknown
  waste_pct?: unknown
  material_rate_m2?: unknown
  print_rate_m2?: unknown
  side_multiplier?: unknown
}

export const MAX_WIDE_DIMENSION_MM = 1_000_000
export const MAX_WIDE_QUANTITY = 1_000_000

function matchesAny(value: string, aliases: string[]) {
  return aliases.some(alias => value.includes(alias))
}

function clampPositiveNumber(value: unknown, fallback: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(max, parsed)
}

function clampPositiveInteger(value: unknown, fallback: number, max: number) {
  return Math.round(clampPositiveNumber(value, fallback, max))
}

export function clampWideDimensionMm(value: unknown, fallback = 1000) {
  return clampPositiveNumber(value, fallback, MAX_WIDE_DIMENSION_MM)
}

export function clampWideQuantity(value: unknown, fallback = 1) {
  return clampPositiveInteger(value, fallback, MAX_WIDE_QUANTITY)
}

function clampMoney(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function sanitizeWidePricingInput(input: WideServerPricingInput): WideServerPricingInput {
  return {
    ...input,
    widthMm: clampWideDimensionMm(input.widthMm),
    heightMm: clampWideDimensionMm(input.heightMm),
    quantity: clampWideQuantity(input.quantity),
    sides: input.sides === 'double' ? 'double' : 'single',
    materialName: String(input.materialName || ''),
    finishing: Array.isArray(input.finishing) ? input.finishing.map(String).filter(Boolean) : [],
  }
}

export function resolveWideMaterialRate(productId: string, materialName = ''): WideMaterialRate {
  const normalized = materialName.toLowerCase()
  if (matchesAny(normalized, ['backlit', 'гэрэлт', 'хулдаас'])) {
    return { material: 18000, print: 8500, waste: 0.12, setup: 7000, side: 1.6 }
  }
  if (matchesAny(normalized, ['mesh', 'мэш', 'торон'])) {
    return { material: 11500, print: 7000, waste: 0.12, setup: 5000, side: 2 }
  }
  if (['backlit', 'гэрэлт', 'хулдаас'].some(alias => normalized.includes(alias))) {
    return { material: 18000, print: 8500, waste: 0.12, setup: 7000, side: 1.6 }
  }
  if (['mesh', 'мэш', 'торон'].some(alias => normalized.includes(alias))) {
    return { material: 11500, print: 7000, waste: 0.12, setup: 5000, side: 2 }
  }
  if (productId === 'sticker') return { material: 12000, print: 7500, waste: 0.15, setup: 5000, side: 1 }
  return { material: 8500, print: 6500, waste: 0.10, setup: 5000, side: 2 }
}

export function calcWideFinishingCost(finishing: string[], areaM2: number, perimeterM: number) {
  return finishing.reduce((sum, option) => {
    const key = option.toLowerCase()
    if (matchesAny(key, ['grommet', 'eyelet', 'oosor', 'оосор'])) {
      return sum + Math.round(perimeterM * 1800)
    }
    if (matchesAny(key, ['weld', 'edge', 'gagnuur', 'гагнуур', 'гантиг', 'дантиг'])) {
      return sum + Math.round(perimeterM * 1200)
    }
    if (matchesAny(key, ['laminat', 'lamination', 'ламинат'])) {
      return sum + Math.round(areaM2 * 4500)
    }
    if (['grommet', 'eyelet', 'oosor', 'оосор'].some(alias => key.includes(alias))) {
      return sum + Math.round(perimeterM * 1800)
    }
    if (['weld', 'edge', 'gagnuur', 'гагнуур', 'гантиг', 'дантиг'].some(alias => key.includes(alias))) {
      return sum + Math.round(perimeterM * 1200)
    }
    if (['laminat', 'lamination', 'ламинат'].some(alias => key.includes(alias))) {
      return sum + Math.round(areaM2 * 4500)
    }
    return sum + Math.round(areaM2 * 3000)
  }, 0)
}

export function calcWideFallbackPrice(input: {
  productId: string
  widthMm: number
  heightMm: number
  quantity: number
  sides: string
  materialName: string
  finishing: string[]
}): WidePricingResult | null {
  const safeInput = sanitizeWidePricingInput(input)

  const areaM2 = (safeInput.widthMm / 1000) * (safeInput.heightMm / 1000)
  const rate = resolveWideMaterialRate(safeInput.productId, safeInput.materialName)
  const billableAreaM2 = Math.max(areaM2, safeInput.productId === 'sticker' ? 0.5 : 1) * safeInput.quantity
  const perimeterM = ((safeInput.widthMm / 1000) + (safeInput.heightMm / 1000)) * 2 * safeInput.quantity
  const materialCost = Math.round(billableAreaM2 * rate.material * (1 + rate.waste))
  const printCost = Math.round(billableAreaM2 * rate.print * (safeInput.sides === 'double' ? rate.side : 1))
  const finishingCost = calcWideFinishingCost(safeInput.finishing, billableAreaM2, perimeterM)
  const subtotal = materialCost + printCost + finishingCost + rate.setup
  const withMargin = Math.round(subtotal * 1.45)
  const vat = Math.round(withMargin * 0.1)
  const total = withMargin + vat

  if (!Number.isFinite(total) || total <= 0) return null

  return {
    total,
    unitPrice: Math.round(total / safeInput.quantity),
    source: 'local',
    breakdown: {
      paper: materialCost,
      ink: printCost,
      material: materialCost,
      print: printCost,
      finishing: finishingCost,
      setup: rate.setup,
      pages: 0,
      vat,
    },
    meta: {
      materialName: safeInput.materialName,
      areaM2,
      billableAreaM2,
      wastePct: Math.round(rate.waste * 100),
      materialRateM2: rate.material,
      printRateM2: rate.print,
      sideMultiplier: safeInput.sides === 'double' ? rate.side : 1,
    },
  }
}

function toWideServerResult(input: WideServerPricingInput, response: WideServerResponse): WidePricingResult {
  const total = clampMoney(response.total_price)
  if (!total) throw new Error('Wide pricing response has invalid total_price')

  const unitPrice = clampMoney(response.unit_price) || Math.round(total / Math.max(1, input.quantity))

  return {
    total,
    unitPrice,
    source: 'server',
    breakdown: {
      paper: clampMoney(response.material_cost),
      ink: clampMoney(response.print_cost),
      material: clampMoney(response.material_cost),
      print: clampMoney(response.print_cost),
      finishing: clampMoney(response.finishing_cost),
      setup: clampMoney(response.setup_cost),
      pages: 0,
      vat: clampMoney(response.vat),
    },
    meta: {
      materialName: typeof response.material_name === 'string' ? response.material_name : input.materialName,
      areaM2: clampMoney(response.area_m2) || (input.widthMm / 1000) * (input.heightMm / 1000),
      billableAreaM2: clampMoney(response.billable_area_m2),
      wastePct: clampMoney(response.waste_pct),
      materialRateM2: clampMoney(response.material_rate_m2),
      printRateM2: clampMoney(response.print_rate_m2),
      sideMultiplier: clampMoney(response.side_multiplier) || 1,
      backendTotal: total,
    },
  }
}

export async function fetchWideServerPrice(
  apiUrl: string,
  input: WideServerPricingInput,
  signal?: AbortSignal,
): Promise<WidePricingResult> {
  const safeInput = sanitizeWidePricingInput(input)
  const body = {
    type: safeInput.productId,
    width: safeInput.widthMm / 1000,
    length: safeInput.heightMm / 1000,
    quantity: safeInput.quantity,
    material: safeInput.materialName,
    finishing: safeInput.finishing,
    sides: safeInput.sides,
    pricing_mode: 'retail',
  }

  const res = await fetch(`${apiUrl}/api/quote-engine/calculate-wide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    signal,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Wide pricing failed: ${res.status}`)
  }

  const data = await res.json()
  if (data?.error) throw new Error(data.error)
  if (!data || (!data.total_price && data.total_price !== 0)) {
    throw new Error('Wide pricing response missing total_price')
  }

  return toWideServerResult(safeInput, data)
}
