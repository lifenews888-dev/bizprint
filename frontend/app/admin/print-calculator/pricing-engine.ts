/**
 * BizPrint — Print Factory Pricing Engine
 *
 * Hybrid Logic: Quantity < 300 → Digital, >= 300 → Offset
 * Dynamic Signatures: A3=2pp, A4=4pp, B5/A5=8pp per signature
 */

// ─── Default Constants (Admin-editable) ─────────────────────────

export interface PricingConstants {
  // Offset plates
  platePrice: number              // per plate (₮)
  platesPerSignatureColor: number // 8 for 4+4 (CMYK front + back)
  platesPerSignatureBw: number    // 2 for 1+1 (black front + back)

  // Offset press fee tiers (per signature) — color
  pressFee: { min: number; max: number; price: number }[]
  // Offset press fee tiers (per signature) — BW (cheaper)
  pressFeeBw: { min: number; max: number; price: number }[]

  // Profit margin (ашгийн хувь)
  marginPercent: number           // e.g. 0.25 = 25%

  // Paper prices per sheet by GSM range
  paperPrices: { label: string; gsm: number; price: number }[]

  // Paper waste factor
  paperWaste: number              // e.g. 0.05 = 5%

  // Digital per-page prices
  digitalColorPerPage: number
  digitalBwPerPage: number

  // Pages per signature by size
  pagesPerSignature: Record<string, number>

  // Size multiplier — how many A3-equivalent signatures per page
  // Base machine size is A3, so A3=1, A2=2, A1=4, A0=8
  sizeMultiplier: Record<string, number>

  // Post-press: Folding
  foldingPrices: Record<string, number>  // per sheet

  // Post-press: UV Coating tiers
  uvTiers: { min: number; max: number; price: number }[]

  // Post-press: Die-cutting knife costs by size
  dieKnifePrices: Record<string, number>
  // Die-cutting strike costs
  dieStrikeTiers: { qty: number; price: number }[]

  // Post-press: Embossing
  embossCliche: number
  embossStrikeBase: number     // per 100 copies base
  embossStrikeMin: number      // minimum per 100

  // Post-press: Binding per copy
  bindingPrices: Record<string, number>

  // Smart routing threshold
  digitalMaxQty: number
}

export const DEFAULT_CONSTANTS: PricingConstants = {
  platePrice: 3500,
  platesPerSignatureColor: 8,  // 4+4 CMYK
  platesPerSignatureBw: 2,     // 1+1 Black

  pressFee: [
    { min: 300,  max: 500,  price: 35000 },
    { min: 501,  max: 1000, price: 30000 },
    { min: 1001, max: 2000, price: 25000 },
    { min: 2001, max: 999999, price: 20000 },
  ],

  pressFeeBw: [
    { min: 300,  max: 500,  price: 20000 },
    { min: 501,  max: 1000, price: 17000 },
    { min: 1001, max: 2000, price: 14000 },
    { min: 2001, max: 999999, price: 11000 },
  ],

  marginPercent: 0.25,  // 25% ашгийн хувь

  paperPrices: [
    { label: '80gsm (Энгийн)',    gsm: 80,  price: 60 },
    { label: '100gsm',            gsm: 100, price: 80 },
    { label: '120gsm',            gsm: 120, price: 100 },
    { label: '150gsm (Зузаан)',   gsm: 150, price: 130 },
    { label: '170gsm (Карт)',     gsm: 170, price: 160 },
    { label: '200gsm',            gsm: 200, price: 200 },
    { label: '250gsm (Хавтас)',   gsm: 250, price: 280 },
    { label: '300gsm (Картон)',   gsm: 300, price: 350 },
  ],

  paperWaste: 0.05,

  digitalColorPerPage: 120,
  digitalBwPerPage: 40,

  pagesPerSignature: {
    'A0': 2,
    'B0': 2,
    'A1': 2,
    'B1': 2,
    'A2': 2,
    'B2': 2,
    'A3': 2,
    'B3': 2,
    'A4': 4,
    'B5': 8,
    'A5': 8,
  },

  // Size multiplier: how many A3-equivalent signatures per page
  // Base machine = A3, so larger sizes cost proportionally more
  sizeMultiplier: {
    'A0': 8,    // A0 = 8× A3
    'B0': 8,
    'A1': 4,    // A1 = 4× A3
    'B1': 4,
    'A2': 2,    // A2 = 2× A3
    'B2': 2,
    'A3': 1,    // Base
    'B3': 1,
    'A4': 1,
    'B5': 1,
    'A5': 1,
  },

  foldingPrices: {
    'A3': 100,
    'B3': 130,
    'A4': 60,
    'B5': 40,
    'A5': 40,
  },

  uvTiers: [
    { min: 0,    max: 500,  price: 150000 },
    { min: 501,  max: 1000, price: 170000 },
    { min: 1001, max: 2000, price: 350000 },
    { min: 2001, max: 999999, price: 500000 },
  ],

  dieKnifePrices: {
    'A5': 50000,
    'B5': 50000,
    'A4': 70000,
    'A3': 90000,
    'B3': 90000,
  },

  dieStrikeTiers: [
    { qty: 500,  price: 40000 },
    { qty: 1000, price: 60000 },
    { qty: 2000, price: 100000 },
  ],

  embossCliche: 45000,
  embossStrikeBase: 4000,  // per 100 copies
  embossStrikeMin: 2000,

  bindingPrices: {
    'Зөөлөн хавтас': 1200,
    'Хатуу хавтас': 8500,
    'Супер хавтас': 11000,
    'Спираль': 2500,
  },

  digitalMaxQty: 299,
}

// ─── Input types ─────────────────────────────────────────────────

export interface CalcInput {
  quantity: number
  totalPages: number
  paperSize: string       // A3, A4, B5, A5, B3
  paperGsm: number
  colorMode: 'color' | 'bw'
  // Post-press options
  folding: boolean
  uvCoating: boolean
  dieCutting: boolean
  embossing: boolean
  bindingType: string     // '' = none, or key from bindingPrices
  // Cover
  hasCover: boolean
  coverGsm: number
  coverColorMode: 'color' | 'bw'
}

// ─── Output types ────────────────────────────────────────────────

export interface LineItem {
  key: string
  label: string
  detail: string
  amount: number
}

// Grouped line items for customer-facing view (hides cost breakdown)
export interface GroupedLine {
  key: string
  label: string
  amount: number
}

export interface CalcResult {
  method: 'digital' | 'offset'
  signatures: number
  pagesPerSig: number
  sheetsNeeded: number
  sizeMultiplier: number       // A0=8, A1=4, A2=2, A3=1
  effectiveSignatures: number  // signatures * sizeMultiplier
  lines: LineItem[]            // Full detail (admin only)
  grouped: GroupedLine[]       // Grouped for customer view
  subtotal: number
  total: number
  unitPrice: number
  warnings: string[]
}

// ─── Calculation engine ──────────────────────────────────────────

export function calculate(input: CalcInput, C: PricingConstants): CalcResult {
  const { quantity, totalPages, paperSize, paperGsm, colorMode } = input
  const warnings: string[] = []
  const lines: LineItem[] = []

  const pagesPerSig = C.pagesPerSignature[paperSize] || 4
  const multiplier = C.sizeMultiplier?.[paperSize] || 1
  const isOffset = quantity >= (C.digitalMaxQty + 1)

  // Validate pages vs signature
  if (totalPages % pagesPerSig !== 0) {
    warnings.push(`${totalPages} нүүр нь ${paperSize} хэмжээнд ${pagesPerSig}-аар хуваагдахгүй байна. Ойролцоо утга: ${Math.ceil(totalPages / pagesPerSig) * pagesPerSig}`)
  }

  const rawSignatures = Math.ceil(totalPages / pagesPerSig)
  // Effective signatures = raw signatures × size multiplier
  // A0 page = 8 A3 signatures, A1 = 4, A2 = 2, A3 = 1
  const effectiveSignatures = rawSignatures * multiplier

  // Paper unit price lookup
  const paperEntry = C.paperPrices.find(p => p.gsm === paperGsm) || C.paperPrices[0]
  const paperUnitPrice = paperEntry.price

  if (multiplier > 1) {
    warnings.push(`${paperSize} хэмжээ: ×${multiplier} коэффициент (А3 суурь машинаас ${multiplier} дахин том)`)
  }

  if (isOffset) {
    // ═══ OFFSET CALCULATION ═══

    // 1. Plates — color mode determines plate count
    const platesPerSig = colorMode === 'color' ? C.platesPerSignatureColor : C.platesPerSignatureBw
    const plateCount = effectiveSignatures * platesPerSig
    const plateCost = plateCount * C.platePrice
    lines.push({
      key: 'plates',
      label: 'Хавтан (Plate)',
      detail: multiplier > 1
        ? `${rawSignatures} багц × ${multiplier} (${paperSize} коэфф) = ${effectiveSignatures} × ${platesPerSig} хавтан × ${C.platePrice.toLocaleString()}₮`
        : `${effectiveSignatures} багц × ${platesPerSig} хавтан × ${C.platePrice.toLocaleString()}₮`,
      amount: plateCost,
    })

    // 2. Press fee — color mode determines tier pricing
    const pressTiers = colorMode === 'color' ? C.pressFee : (C.pressFeeBw || C.pressFee)
    const pressTier = pressTiers.find(t => quantity >= t.min && quantity <= t.max) || pressTiers[pressTiers.length - 1]
    const pressCost = effectiveSignatures * pressTier.price
    lines.push({
      key: 'press',
      label: 'Машин ажиллагаа (Press)',
      detail: multiplier > 1
        ? `${effectiveSignatures} багц (${rawSignatures}×${multiplier}) × ${pressTier.price.toLocaleString()}₮ (${quantity}ш шатлал)`
        : `${effectiveSignatures} багц × ${pressTier.price.toLocaleString()}₮ (${quantity}ш шатлал)`,
      amount: pressCost,
    })

    // 3. Paper — sheets also scaled by multiplier
    const rawSheets = Math.ceil(quantity * totalPages / pagesPerSig)
    const sheetsNeeded = rawSheets * multiplier
    const sheetsWithWaste = Math.ceil(sheetsNeeded * (1 + C.paperWaste))
    const paperCost = sheetsWithWaste * paperUnitPrice
    lines.push({
      key: 'paper',
      label: `Цаас (${paperGsm}gsm)`,
      detail: multiplier > 1
        ? `${rawSheets.toLocaleString()} × ${multiplier} = ${sheetsNeeded.toLocaleString()} хуудас + ${(C.paperWaste * 100).toFixed(0)}% = ${sheetsWithWaste.toLocaleString()} × ${paperUnitPrice}₮`
        : `${sheetsNeeded.toLocaleString()} хуудас + ${(C.paperWaste * 100).toFixed(0)}% хаягдал = ${sheetsWithWaste.toLocaleString()} × ${paperUnitPrice}₮`,
      amount: paperCost,
    })

    // Cover pages (if any)
    if (input.hasCover) {
      const coverPaper = C.paperPrices.find(p => p.gsm === input.coverGsm) || C.paperPrices.find(p => p.gsm === 250) || C.paperPrices[C.paperPrices.length - 1]
      const coverSheets = Math.ceil(quantity * 1.05) * multiplier
      const coverEffSig = 1 * multiplier
      const coverPlatesPerSig = input.coverColorMode === 'color' ? C.platesPerSignatureColor : C.platesPerSignatureBw
      const coverPlates = coverEffSig * coverPlatesPerSig
      const coverPlateCost = coverPlates * C.platePrice
      const coverPressCost = coverEffSig * pressTier.price
      const coverPaperCost = coverSheets * coverPaper.price

      lines.push({
        key: 'cover_plates',
        label: 'Хавтас — Хавтан',
        detail: `${coverPlates} хавтан × ${C.platePrice.toLocaleString()}₮`,
        amount: coverPlateCost,
      })
      lines.push({
        key: 'cover_press',
        label: 'Хавтас — Машин',
        detail: `${coverEffSig} багц × ${pressTier.price.toLocaleString()}₮`,
        amount: coverPressCost,
      })
      lines.push({
        key: 'cover_paper',
        label: `Хавтас — Цаас (${input.coverGsm}gsm)`,
        detail: `${coverSheets.toLocaleString()} хуудас × ${coverPaper.price}₮`,
        amount: coverPaperCost,
      })
    }

    // ── Post-press ──

    // Folding
    if (input.folding) {
      const foldPrice = C.foldingPrices[paperSize] || C.foldingPrices['A3'] || 100
      const sheetsForFold = Math.ceil(quantity * totalPages / pagesPerSig) * multiplier
      const foldCost = sheetsForFold * foldPrice
      lines.push({
        key: 'folding',
        label: 'Бүрэлт (Folding)',
        detail: `${sheetsForFold.toLocaleString()} хуудас × ${foldPrice}₮ (${paperSize})`,
        amount: foldCost,
      })
    }

    // UV Coating
    if (input.uvCoating) {
      const uvTier = C.uvTiers.find(t => quantity >= t.min && quantity <= t.max) || C.uvTiers[C.uvTiers.length - 1]
      const uvCost = uvTier.price * multiplier
      lines.push({
        key: 'uv',
        label: 'Лак (UV Coating)',
        detail: multiplier > 1 ? `${uvTier.price.toLocaleString()}₮ × ${multiplier} (${paperSize})` : `${quantity}ш шатлал → ${uvTier.price.toLocaleString()}₮`,
        amount: uvCost,
      })
    }

    // Die-cutting
    if (input.dieCutting) {
      const knifePrice = C.dieKnifePrices[paperSize] || C.dieKnifePrices['A3'] || 70000
      const strikeTier = [...C.dieStrikeTiers].reverse().find(t => quantity <= t.qty * 1.5) || C.dieStrikeTiers[C.dieStrikeTiers.length - 1]
      const dieCost = knifePrice + strikeTier.price
      lines.push({
        key: 'die',
        label: 'Тигел (Die-cutting)',
        detail: `Хутга: ${knifePrice.toLocaleString()}₮ + Цохилт: ${strikeTier.price.toLocaleString()}₮`,
        amount: dieCost,
      })
    }

    // Embossing
    if (input.embossing) {
      const batches = Math.ceil(quantity / 100)
      const perBatch = Math.max(C.embossStrikeMin, C.embossStrikeBase - Math.floor(batches / 5) * 200)
      const embossCost = C.embossCliche + (batches * perBatch)
      lines.push({
        key: 'emboss',
        label: 'Эмбосс (Embossing)',
        detail: `Клише: ${C.embossCliche.toLocaleString()}₮ + ${batches} × ${perBatch.toLocaleString()}₮`,
        amount: embossCost,
      })
    }

    // Binding
    if (input.bindingType && C.bindingPrices[input.bindingType]) {
      const bindPrice = C.bindingPrices[input.bindingType]
      const bindCost = quantity * bindPrice
      lines.push({
        key: 'binding',
        label: `Хавтаслалт (${input.bindingType})`,
        detail: `${quantity} × ${bindPrice.toLocaleString()}₮`,
        amount: bindCost,
      })
    }

    const subtotal = lines.reduce((s, l) => s + l.amount, 0)

    // Margin (ашгийн хувь)
    const marginAmount = Math.round(subtotal * C.marginPercent)
    if (C.marginPercent > 0) {
      lines.push({
        key: 'margin',
        label: `Ашиг (${(C.marginPercent * 100).toFixed(0)}%)`,
        detail: `${subtotal.toLocaleString()}₮ × ${(C.marginPercent * 100).toFixed(0)}%`,
        amount: marginAmount,
      })
    }
    const total = subtotal + marginAmount

    // ── Grouped lines for customer view ──
    const grouped = buildGroupedLines(lines)

    return {
      method: 'offset',
      signatures: rawSignatures,
      pagesPerSig,
      sizeMultiplier: multiplier,
      effectiveSignatures,
      sheetsNeeded: Math.ceil(quantity * totalPages / pagesPerSig) * multiplier,
      lines,
      grouped,
      subtotal,
      total,
      unitPrice: Math.round(total / quantity),
      warnings,
    }
  } else {
    // ═══ DIGITAL CALCULATION ═══

    const pricePerPage = colorMode === 'color' ? C.digitalColorPerPage : C.digitalBwPerPage
    const printCost = totalPages * pricePerPage * quantity
    lines.push({
      key: 'print',
      label: `Хэвлэлт (${colorMode === 'color' ? 'Өнгөт' : 'Хар цагаан'})`,
      detail: `${totalPages} нүүр × ${pricePerPage}₮ × ${quantity}ш`,
      amount: printCost,
    })

    // Paper
    const sheetsNeeded = Math.ceil(quantity * totalPages / pagesPerSig)
    const paperCost = sheetsNeeded * paperUnitPrice
    lines.push({
      key: 'paper',
      label: `Цаас (${paperGsm}gsm)`,
      detail: `${sheetsNeeded.toLocaleString()} хуудас × ${paperUnitPrice}₮`,
      amount: paperCost,
    })

    // Cover
    if (input.hasCover) {
      const coverPaper = C.paperPrices.find(p => p.gsm === input.coverGsm) || C.paperPrices[C.paperPrices.length - 1]
      const coverPrintCost = 2 * (input.coverColorMode === 'color' ? C.digitalColorPerPage : C.digitalBwPerPage) * quantity
      const coverPaperCost = quantity * coverPaper.price
      lines.push({
        key: 'cover_print',
        label: 'Хавтас — Хэвлэлт',
        detail: `2 нүүр × ${quantity}ш`,
        amount: coverPrintCost,
      })
      lines.push({
        key: 'cover_paper',
        label: `Хавтас — Цаас (${input.coverGsm}gsm)`,
        detail: `${quantity} × ${coverPaper.price}₮`,
        amount: coverPaperCost,
      })
    }

    // Binding
    if (input.bindingType && C.bindingPrices[input.bindingType]) {
      const bindPrice = C.bindingPrices[input.bindingType]
      const bindCost = quantity * bindPrice
      lines.push({
        key: 'binding',
        label: `Хавтаслалт (${input.bindingType})`,
        detail: `${quantity} × ${bindPrice.toLocaleString()}₮`,
        amount: bindCost,
      })
    }

    const subtotal = lines.reduce((s, l) => s + l.amount, 0)

    // Margin (ашгийн хувь)
    const marginAmount = Math.round(subtotal * C.marginPercent)
    if (C.marginPercent > 0) {
      lines.push({
        key: 'margin',
        label: `Ашиг (${(C.marginPercent * 100).toFixed(0)}%)`,
        detail: `${subtotal.toLocaleString()}₮ × ${(C.marginPercent * 100).toFixed(0)}%`,
        amount: marginAmount,
      })
    }
    const total = subtotal + marginAmount
    const grouped = buildGroupedLines(lines)

    return {
      method: 'digital',
      signatures: rawSignatures,
      pagesPerSig,
      sizeMultiplier: multiplier,
      effectiveSignatures,
      sheetsNeeded,
      lines,
      grouped,
      subtotal,
      total,
      unitPrice: Math.round(total / quantity),
      warnings,
    }
  }
}

// ─── Build grouped lines for customer view (hides cost details) ──────────

const PRINT_KEYS = ['plates', 'press', 'paper', 'print', 'cover_plates', 'cover_press', 'cover_paper', 'cover_print']
const POSTPRESS_KEYS = ['folding', 'uv', 'die', 'emboss']
const BINDING_KEYS = ['binding']

function buildGroupedLines(lines: LineItem[]): GroupedLine[] {
  const grouped: GroupedLine[] = []

  const printTotal = lines.filter(l => PRINT_KEYS.includes(l.key)).reduce((s, l) => s + l.amount, 0)
  if (printTotal > 0) {
    grouped.push({ key: 'printing', label: 'Үндсэн хэвлэлт', amount: printTotal })
  }

  const postTotal = lines.filter(l => POSTPRESS_KEYS.includes(l.key)).reduce((s, l) => s + l.amount, 0)
  if (postTotal > 0) {
    grouped.push({ key: 'postpress', label: 'Нэмэлт ажилбарууд', amount: postTotal })
  }

  const bindTotal = lines.filter(l => BINDING_KEYS.includes(l.key)).reduce((s, l) => s + l.amount, 0)
  if (bindTotal > 0) {
    grouped.push({ key: 'binding', label: 'Хавтаслалт', amount: bindTotal })
  }

  // Ашгийг grouped view-д нуух — нийт дүнд шингэсэн байна
  // Хэрэглэгчид зөвхөн хэвлэл, нэмэлт, хавтаслалт харагдана

  return grouped
}
