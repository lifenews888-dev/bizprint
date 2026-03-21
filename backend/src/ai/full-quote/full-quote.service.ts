import { Injectable } from '@nestjs/common'

import { PdfInspectorService } from '../pdf-inspector/pdf-inspector.service'
import { PrintSizeService } from '../print-size/print-size.service'
import { ImpositionService } from '../imposition/imposition.service'
import { GangRunService } from '../gang-run/gang-run.service'
import { MachineSelectorService } from '../machine-selector/machine-selector.service'
import { PrintCostService, PrintType, PaperStock, FinishingOption } from '../print-cost/print-cost.service'
import { SheetOptimizerService } from '../sheet-optimizer/sheet-optimizer.service'

// ─── Size → mm map ────────────────────────────────────────────────────────────
const SIZE_MM: Record<string, { w: number; h: number }> = {
  BC: { w: 90,  h: 55  },
  A6: { w: 105, h: 148 },
  A5: { w: 148, h: 210 },
  A4: { w: 210, h: 297 },
  A3: { w: 297, h: 420 },
}

// ─── GSM → PaperStock ─────────────────────────────────────────────────────────
const GSM_STOCK: Record<number, PaperStock> = {
  80:  'uncoated_80',
  115: 'coated_130',
  130: 'coated_130',
  150: 'coated_170',
  170: 'coated_170',
  200: 'coated_250',
  250: 'coated_250',
  300: 'coated_300',
}

// ─── Product → ink coverage % (CMYK sum, 0–400) ───────────────────────────────
const INK_COVERAGE: Record<string, number> = {
  'Нэрийн хуудас': 80,
  'Флаер':         200,
  'Боршур':        150,
  'Постер':        300,
  'Ном':           100,
  'Каталог':       180,
  'Клендар':       150,
  'Меню':          120,
}

// ─── Finish → FinishingOption ──────────────────────────────────────────────────
const FINISH_MAP: Record<string, FinishingOption> = {
  none:  'none',
  mat:   'laminate_matte',
  gloss: 'laminate_gloss',
  uv:    'uv_spot',
  soft:  'laminate_soft_touch',
}

@Injectable()
export class FullQuoteService {

  constructor(
    private readonly pdfInspector: PdfInspectorService,
    private readonly printSize: PrintSizeService,
    private readonly imposition: ImpositionService,
    private readonly gangRun: GangRunService,
    private readonly machineSelector: MachineSelectorService,
    private readonly printCost: PrintCostService,
    private readonly sheetOptimizer: SheetOptimizerService,
  ) {}

  async calculate(file: any, quantity = 500) {

    // 1. PDF preflight + бодит хэмжээ
    const pdf = await this.pdfInspector.inspect(file.buffer)

    // 2. Бодит хуудасны хэмжээ (pdf-lib-ээс авна, 0 бол A4 fallback)
    const width  = pdf.page_width_mm  > 0 ? pdf.page_width_mm  : 210
    const height = pdf.page_height_mm > 0 ? pdf.page_height_mm : 297

    // 3. Стандарт хэмжээ таних
    const size = this.printSize.detect(width, height)

    // 4. Imposition — A3 хуудсанд хэдэн ширхэг багтах
    const layout = this.imposition.calculate(
      297,
      420,
      size.width_mm,
      size.height_mm
    )

    const perSheet = layout.best_layout.total_per_sheet

    // 5. Gang run — хуудас хэрхэн хуваарилах
    const gang = this.gangRun.optimize(
      [{ id: 1, quantity }],
      perSheet
    )

    // 6. Машин сонголт
    const machine = this.machineSelector.select({
      width:    size.width_mm,
      height:   size.height_mm,
      quantity,
    })

    // 7. Хэвлэлийн зардал
    const cost = this.printCost.calculate({
      sheet_cost:            1200,
      total_sheets:          gang.total_sheets,
      machine_cost_per_hour: 50000,
      production_minutes:    20,
    })

    return {
      pdf_analysis: {
        pages:          pdf.pages,
        page_width_mm:  pdf.page_width_mm,
        page_height_mm: pdf.page_height_mm,
        score:          pdf.score,
        risk:           pdf.risk,
        summary:        pdf.summary,
        issues:         pdf.issues,
      },

      print_size: {
        detected: size.detected_size,
        width_mm: size.width_mm,
        height_mm: size.height_mm,
      },

      layout,
      gang_run: gang,
      machine,

      cost,
      price: cost.final_price,
    }
  }

  // ── Offset quote from form params (no PDF needed) ──────────────────────────
  /**
   * POST /ai/full-quote/offset
   *
   * Body:
   *   size        – 'BC' | 'A6' | 'A5' | 'A4' | 'A3'
   *   gsm         – 80 | 115 | 130 | 150 | 170 | 200 | 250 | 300
   *   quantity    – number of finished pieces
   *   color       – 'full' | 'bw'
   *   sides       – 'single' | 'double'
   *   finish      – 'none' | 'mat' | 'gloss' | 'uv' | 'soft'
   *   fold        – 'none' | 'tri' | 'half'
   *   product     – 'Нэрийн хуудас' | 'Флаер' | ... (optional, for ink estimate)
   *   is_rush     – boolean (optional)
   */
  calculateOffset(body: {
    size?:     string
    gsm?:      number
    quantity?: number
    color?:    string
    sides?:    string
    finish?:   string
    fold?:     string
    product?:  string
    is_rush?:  boolean
  }) {
    const size     = body.size     || 'A4'
    const gsm      = body.gsm      || 130
    const quantity = body.quantity || 100
    const color    = body.color    || 'full'
    const sides    = body.sides    || 'single'
    const finish   = body.finish   || 'none'
    const fold     = body.fold     || 'none'
    const product  = body.product  || 'Флаер'

    // 1. Item dimensions
    const dims = SIZE_MM[size] || SIZE_MM['A4']

    // 2. Press sheet layout
    const layout = this.sheetOptimizer.optimizeItem({
      width_mm:        dims.w,
      height_mm:       dims.h,
      quantity,
      bleed_mm:        3,
      gutter_mm:       4,
      is_double_sided: sides === 'double',
    })

    // 3. Determine print type by color + quantity
    let print_type: PrintType
    if (quantity < 500) {
      print_type = 'digital_small'
    } else {
      print_type = color === 'full' ? 'offset_4color' : 'offset_2color'
    }

    // 4. Paper stock
    const paper_stock: PaperStock = GSM_STOCK[gsm] || 'coated_130'

    // 5. Finishing options
    const finishing: FinishingOption[] = []
    const finishOpt = FINISH_MAP[finish] || 'none'
    if (finishOpt !== 'none') finishing.push(finishOpt)
    if (fold !== 'none') finishing.push('folding')
    if (finishing.length === 0) finishing.push('none')

    // 6. Ink coverage estimate
    const ink_coverage_pct = INK_COVERAGE[product] ?? (color === 'bw' ? 60 : 150)

    // 7. Calculate full cost
    const cost = this.printCost.calculateFull({
      layout,
      color_mode:       color === 'full' ? 'CMYK' : 'Grayscale',
      ink_coverage_pct,
      print_type,
      paper_stock,
      finishing,
      quantity,
      is_rush: body.is_rush ?? false,
    })

    return {
      layout: {
        sheet:            layout.sheet.name,
        items_per_sheet:  layout.items_per_sheet,
        columns:          layout.columns,
        rows:             layout.rows,
        orientation:      layout.orientation,
        sheet_count:      layout.sheet_count,
        waste_sheets:     layout.waste_sheets,
        total_sheets:     layout.total_sheets,
        utilization_pct:  layout.utilization_pct,
        layout_description: layout.layout_description,
      },
      cost,
      print_type,
      paper_stock,
      summary: {
        quantity,
        total_price:   cost.total_price,
        price_per_unit: cost.price_per_unit,
        currency:      'MNT',
      },
    }
  }
}
