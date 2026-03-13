import { Injectable } from '@nestjs/common'

@Injectable()
export class PrintCostService {

  calculate(data: any) {

    const sheetCost = data.sheet_cost
    const sheets = data.total_sheets

    const machineCostPerHour = data.machine_cost_per_hour
    const productionMinutes = data.production_minutes

    const materialCost = sheetCost * sheets

    const machineCost =
      (machineCostPerHour / 60) * productionMinutes

    const totalCost = materialCost + machineCost

    const margin = totalCost * 0.30

    const finalPrice = totalCost + margin

    return {

      material_cost: materialCost,

      machine_cost: machineCost,

      base_cost: totalCost,

      margin: margin,

      final_price: finalPrice

    }

  }

}