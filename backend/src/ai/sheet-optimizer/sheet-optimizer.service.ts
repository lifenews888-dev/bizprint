import { Injectable, Logger } from '@nestjs/common'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PrintItem {
  width_mm: number
  height_mm: number
  quantity: number
  bleed_mm?: number
  gutter_mm?: number
  is_double_sided?: boolean
}

export interface SheetSpec {
  width_mm: number
  height_mm: number
  name: string
  gripper_mm?: number
  tail_mm?: number
}

export interface LayoutResult {
  sheet: SheetSpec
  items_per_sheet: number
  columns: number
  rows: number
  orientation: 'portrait' | 'landscape'
  sheet_count: number
  waste_sheets: number
  total_sheets: number
  utilization_pct: number
  used_area_mm2: number
  printable_area_mm2: number
  is_double_sided: boolean
  run_count: number
  layout_description: string
}

export interface SheetOptimizerOptions {
  candidate_sheets?: SheetSpec[]
  allow_landscape?: boolean
}

// ─── Standard Press Sheet Sizes ───────────────────────────────────────────────

export const STANDARD_SHEETS: SheetSpec[] = [
  { name: 'SRA3',       width_mm: 320,  height_mm: 450,  gripper_mm: 10, tail_mm: 10 },
  { name: 'SRA2',       width_mm: 450,  height_mm: 640,  gripper_mm: 12, tail_mm: 12 },
  { name: 'SRA1',       width_mm: 640,  height_mm: 900,  gripper_mm: 15, tail_mm: 15 },
  { name: 'B2',         width_mm: 500,  height_mm: 707,  gripper_mm: 12, tail_mm: 12 },
  { name: 'B1',         width_mm: 707,  height_mm: 1000, gripper_mm: 15, tail_mm: 15 },
  { name: '700x1000',   width_mm: 700,  height_mm: 1000, gripper_mm: 15, tail_mm: 15 },
  { name: '520x740',    width_mm: 520,  height_mm: 740,  gripper_mm: 12, tail_mm: 12 },
  { name: 'A3+',        width_mm: 329,  height_mm: 483,  gripper_mm: 10, tail_mm: 10 },
  { name: 'Digital_A3', width_mm: 303,  height_mm: 426,  gripper_mm: 5,  tail_mm: 5  },
  { name: 'Digital_A4', width_mm: 210,  height_mm: 297,  gripper_mm: 5,  tail_mm: 5  },
]

const DEFAULT_BLEED_MM  = 3
const DEFAULT_GUTTER_MM = 4
const MAKE_READY_SHEETS = 20
const SPOILAGE_PCT      = 0.02

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class SheetOptimizerService {
  private readonly logger = new Logger(SheetOptimizerService.name)

  /**
   * POST /ai/sheet/optimize — accepts both formats:
   *   New: { width_mm, height_mm, quantity, bleed_mm?, gutter_mm?, is_double_sided? }
   *   Legacy: { item_width_mm, item_height_mm, sheet_width_mm, sheet_height_mm, ... }
   *
   * Automatically finds the best standard press sheet — no need to specify sheet size.
   */
  optimize(body: any, options: SheetOptimizerOptions = {}): LayoutResult {
    const item: PrintItem = body.width_mm != null
      ? {
          width_mm:        body.width_mm,
          height_mm:       body.height_mm,
          quantity:        body.quantity ?? 100,
          bleed_mm:        body.bleed_mm,
          gutter_mm:       body.gutter_mm ?? body.gap_mm,
          is_double_sided: body.is_double_sided ?? body.double_sided ?? false,
        }
      : {
          // Legacy format
          width_mm:        body.item_width_mm  ?? body.item_width  ?? 90,
          height_mm:       body.item_height_mm ?? body.item_height ?? 55,
          quantity:        body.quantity ?? 100,
          bleed_mm:        body.bleed_mm,
          gutter_mm:       body.gap_mm,
          is_double_sided: false,
        }

    return this.optimizeItem(item, options)
  }

  /**
   * Find the most efficient press-sheet layout.
   * Tries all standard sheet sizes in both orientations — returns the best utilization.
   */
  optimizeItem(item: PrintItem, options: SheetOptimizerOptions = {}): LayoutResult {
    const {
      candidate_sheets = STANDARD_SHEETS,
      allow_landscape  = true,
    } = options

    const bleed_mm        = item.bleed_mm  ?? DEFAULT_BLEED_MM
    const gutter_mm       = item.gutter_mm ?? DEFAULT_GUTTER_MM
    const is_double_sided = item.is_double_sided ?? false

    const item_w = item.width_mm  + bleed_mm * 2
    const item_h = item.height_mm + bleed_mm * 2

    let best: LayoutResult | null = null

    for (const sheet of candidate_sheets) {
      const portrait = this.tryLayout(item, item_w, item_h, sheet, gutter_mm, is_double_sided, 'portrait')
      if (portrait && portrait.utilization_pct > (best?.utilization_pct ?? 0)) best = portrait

      if (allow_landscape) {
        const landscape = this.tryLayout(item, item_h, item_w, sheet, gutter_mm, is_double_sided, 'landscape')
        if (landscape && landscape.utilization_pct > (best?.utilization_pct ?? 0)) best = landscape
      }
    }

    if (!best) {
      this.logger.warn('No optimal sheet found, falling back to SRA1')
      best = this.tryLayout(item, item_w, item_h, STANDARD_SHEETS[2], gutter_mm, is_double_sided, 'portrait')!
    }

    this.logger.log(
      `Best layout: ${best.sheet.name} | ${best.items_per_sheet} up | ` +
      `${best.sheet_count} sheets | ${best.utilization_pct.toFixed(1)}% utilized`,
    )

    return best
  }

  /** Return all candidate layouts ranked by utilization (for admin inspection). */
  rankLayouts(item: PrintItem): LayoutResult[] {
    const bleed_mm  = item.bleed_mm  ?? DEFAULT_BLEED_MM
    const gutter_mm = item.gutter_mm ?? DEFAULT_GUTTER_MM
    const item_w = item.width_mm  + bleed_mm * 2
    const item_h = item.height_mm + bleed_mm * 2

    const results: LayoutResult[] = []
    for (const sheet of STANDARD_SHEETS) {
      const p = this.tryLayout(item, item_w, item_h, sheet, gutter_mm, item.is_double_sided ?? false, 'portrait')
      if (p) results.push(p)
      const l = this.tryLayout(item, item_h, item_w, sheet, gutter_mm, item.is_double_sided ?? false, 'landscape')
      if (l) results.push(l)
    }
    return results
      .filter(r => r.utilization_pct > 0)
      .sort((a, b) => b.utilization_pct - a.utilization_pct)
  }

  // ──────────────────────────────────────────────────────────────────────────

  private tryLayout(
    item: PrintItem,
    item_w: number,
    item_h: number,
    sheet: SheetSpec,
    gutter_mm: number,
    is_double_sided: boolean,
    orientation: 'portrait' | 'landscape',
  ): LayoutResult | null {
    const gripper = sheet.gripper_mm ?? 10
    const tail    = sheet.tail_mm    ?? 10

    const printable_w = sheet.width_mm
    const printable_h = sheet.height_mm - gripper - tail

    if (printable_w <= 0 || printable_h <= 0) return null
    if (item_w > printable_w || item_h > printable_h) return null

    const cols = Math.floor((printable_w + gutter_mm) / (item_w + gutter_mm))
    const rows = Math.floor((printable_h + gutter_mm) / (item_h + gutter_mm))

    if (cols <= 0 || rows <= 0) return null

    const items_per_sheet = cols * rows
    const run_count       = is_double_sided ? 2 : 1
    const net_sheets      = Math.ceil(item.quantity / items_per_sheet)
    const running_waste   = Math.ceil(net_sheets * SPOILAGE_PCT)
    const waste_sheets    = MAKE_READY_SHEETS + running_waste
    const total_sheets    = net_sheets + waste_sheets
    const used_area       = items_per_sheet * item_w * item_h
    const printable_area  = printable_w * printable_h
    const utilization_pct = Math.round((used_area / printable_area) * 1000) / 10

    return {
      sheet,
      items_per_sheet,
      columns: cols,
      rows,
      orientation,
      sheet_count: net_sheets,
      waste_sheets,
      total_sheets,
      utilization_pct,
      used_area_mm2: used_area,
      printable_area_mm2: printable_area,
      is_double_sided,
      run_count,
      layout_description:
        `${cols}×${rows} (${items_per_sheet} up) on ${sheet.name} ${orientation} — ` +
        `${utilization_pct}% utilized, ${net_sheets} sheets + ${waste_sheets} waste`,
    }
  }
}
