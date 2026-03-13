import { Injectable } from '@nestjs/common'
import { CalculateGangRunDto } from './dto/calculate-gangrun.dto'

@Injectable()
export class GangrunService {

  calculate(data: CalculateGangRunDto) {

    const sheetCapacity = data.sheetCapacity
    const orders = data.orders

    if (!Array.isArray(orders)) {
      return { error: 'orders must be an array' }
    }

    const totalOrders = orders.reduce((sum, val) => sum + val, 0)

    const sheetsNeeded = Math.ceil(totalOrders / sheetCapacity)

    const waste = sheetsNeeded * sheetCapacity - totalOrders

    return {
      total_orders: totalOrders,
      sheet_capacity: sheetCapacity,
      sheets_needed: sheetsNeeded,
      waste_capacity: waste
    }

  }

}