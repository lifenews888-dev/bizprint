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

  async calculate(file: any) {

    /* PDF analyze */

    const pdf = await this.pdfInspector.inspect(file.buffer)

    /* temporary demo size */

    const width = 90
    const height = 50

    const size = this.printSize.detect(width, height)

    /* imposition */

    const layout = this.imposition.calculate(
      297,
      420,
      size.width_mm,
      size.height_mm
    )

    const perSheet = layout.best_layout.total_per_sheet

    /* gang run */

    const gang = this.gangRun.optimize(
      [{ id: 1, quantity: 5000 }],
      perSheet
    )

    /* machine selector */

    const machine = this.machineSelector.select({
      width: size.width_mm,
      height: size.height_mm,
      quantity: 5000
    })

    /* print cost */

    const cost = this.printCost.calculate({
      sheet_cost: 1200,
      total_sheets: gang.total_sheets || gang.sheets || 100,
      machine_cost_per_hour: 50000,
      production_minutes: 20
    })

    /* RESPONSE */

    return {

      pdf_analysis: pdf,

      size,

      layout,

      gang_run: gang,

      machine,

      cost,

      price: cost.final_price

    }

  }

}