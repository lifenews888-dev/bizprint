import { Injectable } from '@nestjs/common'

import { ImpositionService } from '../imposition/imposition.service'
import { GangRunService } from '../gang-run/gang-run.service'
import { PrintCostService } from '../print-cost/print-cost.service'

@Injectable()
export class AutoQuoteService {

  constructor(
    private readonly imposition: ImpositionService,
    private readonly gangRun: GangRunService,
    private readonly printCost: PrintCostService
  ) {}

  calculate(body: any) {

    const layout = this.imposition.calculate(
      body.sheet_width,
      body.sheet_height,
      body.item_width,
      body.item_height
    )

    const perSheet = layout.best_layout.total_per_sheet

    const gang = this.gangRun.optimize(
      body.orders,
      perSheet
    )

    const cost = this.printCost.calculate({
      sheet_cost: body.sheet_cost,
      total_sheets: gang.sheets.length,
      machine_cost_per_hour: body.machine_cost_per_hour,
      production_minutes: body.production_minutes
    })

    return {
      layout,
      gang_run: gang,
      cost
    }
  }

}