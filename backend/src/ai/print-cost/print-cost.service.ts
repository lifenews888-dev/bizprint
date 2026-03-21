import { Injectable, Logger } from '@nestjs/common'
import { LayoutResult } from '../sheet-optimizer/sheet-optimizer.service'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PrintType =
  | 'digital_small'   // digital A4/SRA3 (Xerox, Konica)
  | 'digital_large'   // wide-format digital
  | 'offset_2color'   // 2-colour offset
  | 'offset_4color'   // 4-colour CMYK offset
  | 'offset_5color'   // 4C + spot/varnish
  | 'screen'          // screen printing
  | 'large_format'    // large format inkjet

export type PaperStock =
  | 'coated_90' | 'coated_130' | 'coated_170' | 'coated_250' | 'coated_300' | 'coated_350'
  | 'uncoated_80' | 'uncoated_120' | 'uncoated_200'
  | 'synthetic_100' | 'canvas'

export type FinishingOption =
  | 'none' | 'laminate_gloss' | 'laminate_matte' | 'laminate_soft_touch'
  | 'uv_spot' | 'foil_stamping' | 'embossing' | 'die_cutting'
  | 'perforation' | 'binding_saddle' | 'binding_perfect' | 'folding'

export interface PrintCostInput {
  layout: LayoutResult
  color_mode: 'CMYK' | 'RGB' | 'Grayscale' | 'Spot' | 'Unknown'
  ink_coverage_pct: number   // 0–400 CMYK sum
  print_type: PrintType
  paper_stock: PaperStock
  finishing: FinishingOption[]
  quantity: number
  is_rush?: boolean
}

export interface FinishingCost {
  option: FinishingOption
  cost: number
  unit: string
}

export interface CostBreakdown {
  paper_cost: number
  ink_cost: number
  machine_time_minutes: number
  machine_cost: number
  make_ready_cost: number
  labour_cost: number
  finishing_cost: number
  finishing_breakdown: FinishingCost[]
  overhead_cost: number
  platform_commission: number
  production_cost: number
  total_price: number
  price_per_unit: number
  currency: 'MNT'
  sheet_count: number
  machine_time_display: string
}

// ─── Price Tables (MNT) ───────────────────────────────────────────────────────

const PAPER_COST_PER_SHEET: Record<PaperStock, Record<string, number>> = {
  coated_90:      { SRA3: 120,  SRA2: 220,  SRA1: 440,  B2: 280,  B1: 520,  '700x1000': 510,  '520x740': 330,  default: 150 },
  coated_130:     { SRA3: 165,  SRA2: 300,  SRA1: 600,  B2: 380,  B1: 720,  '700x1000': 700,  '520x740': 450,  default: 200 },
  coated_170:     { SRA3: 210,  SRA2: 390,  SRA1: 780,  B2: 495,  B1: 940,  '700x1000': 920,  '520x740': 590,  default: 260 },
  coated_250:     { SRA3: 340,  SRA2: 620,  SRA1: 1240, B2: 790,  B1: 1500, '700x1000': 1470, '520x740': 940,  default: 420 },
  coated_300:     { SRA3: 410,  SRA2: 750,  SRA1: 1500, B2: 950,  B1: 1800, '700x1000': 1760, '520x740': 1120, default: 500 },
  coated_350:     { SRA3: 480,  SRA2: 880,  SRA1: 1760, B2: 1120, B1: 2120, '700x1000': 2080, '520x740': 1320, default: 590 },
  uncoated_80:    { SRA3: 80,   SRA2: 150,  SRA1: 300,  B2: 190,  B1: 360,  '700x1000': 350,  '520x740': 224,  default: 100 },
  uncoated_120:   { SRA3: 130,  SRA2: 240,  SRA1: 480,  B2: 305,  B1: 575,  '700x1000': 565,  '520x740': 360,  default: 160 },
  uncoated_200:   { SRA3: 220,  SRA2: 400,  SRA1: 800,  B2: 510,  B1: 965,  '700x1000': 945,  '520x740': 600,  default: 270 },
  synthetic_100:  { SRA3: 580,  SRA2: 1060, SRA1: 2120, B2: 1350, B1: 2560, '700x1000': 2510, '520x740': 1600, default: 710 },
  canvas:         { SRA3: 980,  SRA2: 1800, SRA1: 3600, B2: 2290, B1: 4340, '700x1000': 4250, '520x740': 2700, default: 1200 },
}

const MACHINE_HOURLY_RATE: Record<PrintType, number> = {
  digital_small: 45_000, digital_large: 80_000,
  offset_2color: 120_000, offset_4color: 180_000, offset_5color: 220_000,
  screen: 95_000, large_format: 110_000,
}

const SHEETS_PER_HOUR: Record<PrintType, number> = {
  digital_small: 3_600, digital_large: 800,
  offset_2color: 8_000, offset_4color: 7_000, offset_5color: 6_000,
  screen: 1_200, large_format: 400,
}

const MAKE_READY_MINUTES: Record<PrintType, number> = {
  digital_small: 15, digital_large: 30,
  offset_2color: 60, offset_4color: 90, offset_5color: 120,
  screen: 120, large_format: 45,
}

const INK_COST_PER_1000: Record<PrintType, number> = {
  digital_small: 800, digital_large: 3_500,
  offset_2color: 1_200, offset_4color: 2_400, offset_5color: 3_000,
  screen: 1_800, large_format: 4_200,
}

const FINISHING_COST: Record<FinishingOption, { base: number; per_sheet?: number; unit: string }> = {
  none:                { base: 0,        unit: 'flat' },
  laminate_gloss:      { base: 0,        per_sheet: 45,  unit: '/sheet' },
  laminate_matte:      { base: 0,        per_sheet: 55,  unit: '/sheet' },
  laminate_soft_touch: { base: 0,        per_sheet: 85,  unit: '/sheet' },
  uv_spot:             { base: 15_000,   per_sheet: 30,  unit: 'base+/sheet' },
  foil_stamping:       { base: 35_000,   per_sheet: 80,  unit: 'base+/sheet' },
  embossing:           { base: 60_000,   per_sheet: 60,  unit: 'base+/sheet' },
  die_cutting:         { base: 45_000,   per_sheet: 25,  unit: 'base+/sheet' },
  perforation:         { base: 8_000,    per_sheet: 10,  unit: 'base+/sheet' },
  binding_saddle:      { base: 5_000,    per_sheet: 8,   unit: 'base+/sheet' },
  binding_perfect:     { base: 12_000,   per_sheet: 20,  unit: 'base+/sheet' },
  folding:             { base: 3_000,    per_sheet: 5,   unit: 'base+/sheet' },
}

const OVERHEAD_PCT             = 0.12   // 12%
const PLATFORM_COMMISSION_PCT  = 0.10   // 10%
const RUSH_SURCHARGE_PCT       = 0.30   // 30%
const LABOUR_COST_PER_HOUR     = 18_000 // MNT/h

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class PrintCostService {
  private readonly logger = new Logger(PrintCostService.name)

  // ── Legacy API — backward compatible with auto-quote / full-quote ──────────
  /**
   * Simple cost calculation for legacy callers.
   * Kept for backward compatibility — use calculateFull() for new code.
   */
  calculate(data: {
    sheet_cost: number
    total_sheets: number
    machine_cost_per_hour: number
    production_minutes: number
  }) {
    const materialCost = data.sheet_cost * data.total_sheets
    const machineCost  = (data.machine_cost_per_hour / 60) * data.production_minutes
    const totalCost    = materialCost + machineCost
    const margin       = totalCost * 0.30
    const finalPrice   = totalCost + margin

    return {
      material_cost: materialCost,
      machine_cost:  machineCost,
      base_cost:     totalCost,
      margin,
      final_price:   finalPrice,
    }
  }

  // ── Full cost engine ───────────────────────────────────────────────────────
  /**
   * Full 11-step production cost engine.
   * Paper + Machine time + Ink + Labour + Finishing + Overhead + Commission.
   */
  calculateFull(input: PrintCostInput): CostBreakdown {
    this.logger.log(
      `PrintCost: ${input.print_type} | ${input.paper_stock} | ` +
      `${input.layout.total_sheets} sheets | qty ${input.quantity}`,
    )

    const { layout, print_type, paper_stock, finishing, ink_coverage_pct, is_rush } = input
    const total_sheets = layout.total_sheets
    const run_count    = layout.run_count

    // 1. Paper
    const paper_per_sheet = this.getPaperCost(paper_stock, layout.sheet.name)
    const paper_cost = Math.round(paper_per_sheet * total_sheets * run_count)

    // 2. Machine time
    const make_ready_min     = MAKE_READY_MINUTES[print_type] * run_count
    const run_speed          = SHEETS_PER_HOUR[print_type]
    const running_min        = (layout.sheet_count / run_speed) * 60 * run_count
    const machine_time_minutes = Math.ceil(make_ready_min + running_min)
    const hourly_rate        = MACHINE_HOURLY_RATE[print_type]
    const machine_cost       = Math.round((machine_time_minutes / 60) * hourly_rate)

    // 3. Make-ready cost
    const make_ready_cost = Math.round((make_ready_min / 60) * hourly_rate)

    // 4. Ink
    const ink_base       = INK_COST_PER_1000[print_type]
    const coverage_factor = ink_coverage_pct / 100
    const ink_cost       = Math.round(ink_base * (total_sheets / 1000) * coverage_factor * run_count)

    // 5. Labour
    const labour_cost = Math.round((machine_time_minutes / 60) * LABOUR_COST_PER_HOUR)

    // 6. Finishing
    const { finishing_cost, finishing_breakdown } = this.calcFinishing(finishing, total_sheets)

    // 7. Subtotal
    const subtotal = paper_cost + machine_cost + ink_cost + labour_cost + finishing_cost

    // 8. Overhead
    const overhead_cost = Math.round(subtotal * OVERHEAD_PCT)

    // 9. Production cost
    let production_cost = subtotal + overhead_cost
    if (is_rush) production_cost = Math.round(production_cost * (1 + RUSH_SURCHARGE_PCT))

    // 10. Platform commission
    const platform_commission = Math.round(production_cost * PLATFORM_COMMISSION_PCT)

    // 11. Customer price
    const total_price  = production_cost + platform_commission
    const price_per_unit = Math.round((total_price / input.quantity) * 100) / 100

    return {
      paper_cost, ink_cost,
      machine_time_minutes, machine_cost, make_ready_cost, labour_cost,
      finishing_cost, finishing_breakdown,
      overhead_cost, platform_commission,
      production_cost, total_price, price_per_unit,
      currency: 'MNT',
      sheet_count: layout.sheet_count,
      machine_time_display: this.fmtMin(machine_time_minutes),
    }
  }

  // ──────────────────────────────────────────────────────────────────────────

  private getPaperCost(stock: PaperStock, sheetName: string): number {
    const table = PAPER_COST_PER_SHEET[stock]
    if (!table) return 200
    return table[sheetName] ?? table['default'] ?? 200
  }

  private calcFinishing(
    options: FinishingOption[],
    sheet_count: number,
  ): { finishing_cost: number; finishing_breakdown: FinishingCost[] } {
    const breakdown: FinishingCost[] = []
    let total = 0
    for (const option of options) {
      if (option === 'none') continue
      const t = FINISHING_COST[option]
      if (!t) continue
      const cost = Math.round(t.base + (t.per_sheet ?? 0) * sheet_count)
      breakdown.push({ option, cost, unit: t.unit })
      total += cost
    }
    return { finishing_cost: total, finishing_breakdown: breakdown }
  }

  private fmtMin(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m}min`
    if (m === 0) return `${h}h`
    return `${h}h ${m}min`
  }
}
