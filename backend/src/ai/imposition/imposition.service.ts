import { Injectable } from '@nestjs/common'

@Injectable()
export class ImpositionService {

  private calculateFit(sheetW: number, sheetH: number, itemW: number, itemH: number) {

    const horizontal = Math.floor(sheetW / itemW)
    const vertical = Math.floor(sheetH / itemH)

    const total = horizontal * vertical

    const usedW = horizontal * itemW
    const usedH = vertical * itemH

    const wasteArea = (sheetW * sheetH) - (usedW * usedH)

    return {
      horizontal,
      vertical,
      total,
      wasteArea
    }

  }

  calculate(sheetW: number, sheetH: number, itemW: number, itemH: number) {

    const normal = this.calculateFit(sheetW, sheetH, itemW, itemH)

    const rotated = this.calculateFit(sheetW, sheetH, itemH, itemW)

    let best = normal
    let orientation = "NORMAL"

    if (rotated.total > normal.total) {
      best = rotated
      orientation = "ROTATED"
    }

    return {

      sheet: {
        width: sheetW,
        height: sheetH
      },

      item: {
        width: itemW,
        height: itemH
      },

      layouts: {
        normal,
        rotated
      },

      best_layout: {
        orientation,
        horizontal_fit: best.horizontal,
        vertical_fit: best.vertical,
        total_per_sheet: best.total,
        waste_area: best.wasteArea
      }

    }

  }

}