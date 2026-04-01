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
  platesPerSignature: number      // 8 for 4+4 color

  // Offset press fee tiers (per signature)
  pressFee: { min: number; max: number; price: number }[]

  // Paper prices per sheet by GSM range
  paperPrices: { label: string; gsm: number; price: number }[]

  // Paper waste factor
  paperWaste: number              // e.g. 0.05 = 5%

  // Digital per-page prices
  digitalColorPerPage: number
  digitalBwPerPage: number

  // Pages per signature by size
  pagesPerSignature: Record<string, number>

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
  platesPerSignature: 8,

  pressFee: [
    { min: 300,  max: 500,  price: 35000 },
    { min: 501,  max: 1000, price: 30000 },
    { min: 1001, max: 2000, price: 25000 },
    { min: 2001, max: 999999, price: 20000 },
  ],

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
    'A3': 2,
    'B3': 2,
    'A4': 4,
    'B5': 8,
    'A5': 8,
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

export interface CalcResult {
  method: 'digital' | 'offset'
  signatures: number
  pagesPerSig: number
  sheetsNeeded: number
  lines: LineItem[]
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
  const isOffset = quantity >= (C.digitalMaxQty + 1)

  // Validate pages vs signature
  if (totalPages % pagesPerSig !== 0) {
    warnings.push(`${totalPages} нүүр нь ${paperSize} хэмжээнд ${pagesPerSig}-аар хуваагдахгүй байна. Ойролцоо утга: ${Math.ceil(totalPages / pagesPerSig) * pagesPerSig}`)
  }

  const signatures = Math.ceil(totalPages / pagesPerSig)

  // Paper unit price lookup
  const paperEntry = C.paperPrices.find(p => p.gsm === paperGsm) || C.paperPrices[0]
  const paperUnitPrice = paperEntry.price

  if (isOffset) {
    // ═══ OFFSET CALCULATION ═══

    // 1. Plates
    const plateCount = signatures * C.platesPerSignature
    const plateCost = plateCount * C.platePrice
    lines.push({
      key: 'plates',
      label: 'Хавтан (Plate)',
      detail: `${signatures} багц × ${C.platesPerSignature} хавтан × ${C.platePrice.toLocaleString()}₮`,
      amount: plateCost,
    })

    // 2. Press fee (per signature, tiered by quantity)
    const pressTier = C.pressFee.find(t => quantity >= t.min && quantity <= t.max) || C.pressFee[C.pressFee.length - 1]
    const pressCost = signatures * pressTier.price
    lines.push({
      key: 'press',
      label: 'Машин ажиллагаа (Press)',
      detail: `${signatures} багц × ${pressTier.price.toLocaleString()}₮ (${quantity}ш шатлал)`,
      amount: pressCost,
    })

    // 3. Paper
    const sheetsNeeded = Math.ceil(quantity * totalPages / pagesPerSig)
    const sheetsWithWaste = Math.ceil(sheetsNeeded * (1 + C.paperWaste))
    const paperCost = sheetsWithWaste * paperUnitPrice
    lines.push({
      key: 'paper',
      label: `Цаас (${paperGsm}gsm)`,
      detail: `${sheetsNeeded.toLocaleString()} хуудас + ${(C.paperWaste * 100).toFixed(0)}% хаягдал = ${sheetsWithWaste.toLocaleString()} × ${paperUnitPrice}₮`,
      amount: paperCost,
    })

    // Cover pages (if any)
    if (input.hasCover) {
      const coverPaper = C.paperPrices.find(p => p.gsm === input.coverGsm) || C.paperPrices.find(p => p.gsm === 250) || C.paperPrices[C.paperPrices.length - 1]
      const coverSheets = Math.ceil(quantity * 1.05) // 1 sheet per copy + waste
      const coverPlates = 1 * C.platesPerSignature // 1 signature for cover
      const coverPlateCost = coverPlates * C.platePrice
      const coverPressCost = pressTier.price
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
        detail: `1 багц × ${pressTier.price.toLocaleString()}₮`,
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
      const foldPrice = C.foldingPrices[paperSize] || 100
      const sheetsForFold = Math.ceil(quantity * totalPages / pagesPerSig)
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
      lines.push({
        key: 'uv',
        label: 'Лак (UV Coating)',
        detail: `${quantity}ш шатлал → ${uvTier.price.toLocaleString()}₮`,
        amount: uvTier.price,
      })
    }

    // Die-cutting
    if (input.dieCutting) {
      const knifePrice = C.dieKnifePrices[paperSize] || 70000
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
    return {
      method: 'offset',
      signatures,
      pagesPerSig,
      sheetsNeeded: Math.ceil(quantity * totalPages / pagesPerSig),
      lines,
      subtotal,
      total: subtotal,
      unitPrice: Math.round(subtotal / quantity),
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
    return {
      method: 'digital',
      signatures,
      pagesPerSig,
      sheetsNeeded,
      lines,
      subtotal,
      total: subtotal,
      unitPrice: Math.round(subtotal / quantity),
      warnings,
    }
  }
}
