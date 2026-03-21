import { Injectable } from '@nestjs/common'

import { PdfInspectorService } from '../pdf-inspector/pdf-inspector.service'
import { PrintSizeService } from '../print-size/print-size.service'
import { ImpositionService } from '../imposition/imposition.service'
import { GangRunService } from '../gang-run/gang-run.service'
import { MachineSelectorService } from '../machine-selector/machine-selector.service'
import { PrintCostService } from '../print-cost/print-cost.service'

@Injectable()
export class FullQuoteService {

  constructor(
    private readonly pdfInspector: PdfInspectorService,
    private readonly printSize: PrintSizeService,
    private readonly imposition: ImpositionService,
    private readonly gangRun: GangRunService,
    private readonly machineSelector: MachineSelectorService,
    private readonly printCost: PrintCostService
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
}
