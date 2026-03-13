import { Injectable } from '@nestjs/common'

type SheetItem = {
  order_id: number
  qty: number
}

@Injectable()
export class GangRunService {

  optimize(orders: any[], sheetCapacity: number) {

    const result: SheetItem[][] = []
    let currentSheet: SheetItem[] = []
    let remaining = sheetCapacity

    for (const order of orders) {

      let qty = order.quantity

      while (qty > 0) {

        if (qty <= remaining) {

          currentSheet.push({
            order_id: order.id,
            qty: qty
          })

          remaining -= qty
          qty = 0

        } else {

          currentSheet.push({
            order_id: order.id,
            qty: remaining
          })

          qty -= remaining

          result.push(currentSheet)

          currentSheet = []
          remaining = sheetCapacity
        }

      }

    }

    if (currentSheet.length > 0) {
      result.push(currentSheet)
    }

    return {
      sheet_capacity: sheetCapacity,
      sheets: result,
      total_sheets: result.length
    }

  }

}