export interface GangOrder {
  id: string
  width_mm: number
  height_mm: number
  quantity: number
}

export interface GangPlacement {
  order_id: string
  x: number
  y: number
  width: number
  height: number
}

export interface GangSheet {
  sheet_index: number
  placements: GangPlacement[]
}

export interface GangInput {
  sheet_width_mm: number
  sheet_height_mm: number
  orders: GangOrder[]
}

export class GangRunEngine {

  static optimize(input: GangInput): GangSheet[] {

    const sheets: GangSheet[] = []
    let currentSheet: GangSheet = { sheet_index: 1, placements: [] }

    let cursorX = 0
    let cursorY = 0
    let rowHeight = 0

    for (const order of input.orders) {

      for (let i = 0; i < order.quantity; i++) {

        if (cursorX + order.width_mm > input.sheet_width_mm) {
          cursorX = 0
          cursorY += rowHeight
          rowHeight = 0
        }

        if (cursorY + order.height_mm > input.sheet_height_mm) {
          sheets.push(currentSheet)

          currentSheet = {
            sheet_index: sheets.length + 1,
            placements: []
          }

          cursorX = 0
          cursorY = 0
          rowHeight = 0
        }

        currentSheet.placements.push({
          order_id: order.id,
          x: cursorX,
          y: cursorY,
          width: order.width_mm,
          height: order.height_mm
        })

        cursorX += order.width_mm

        if (order.height_mm > rowHeight) {
          rowHeight = order.height_mm
        }
      }

    }

    sheets.push(currentSheet)

    return sheets

  }

}