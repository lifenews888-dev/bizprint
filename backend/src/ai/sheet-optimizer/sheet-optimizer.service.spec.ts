import { Injectable } from '@nestjs/common'

@Injectable()
export class SheetOptimizerService {

  optimize(body: any) {

    const sheetW = body.sheet_width_mm
    const sheetH = body.sheet_height_mm

    const itemW = body.item_width_mm
    const itemH = body.item_height_mm

    const bleed = body.bleed_mm ?? 3
    const gap = body.gap_mm ?? 5

    const w = itemW + bleed * 2
    const h = itemH + bleed * 2

    const cols = Math.floor(sheetW / (w + gap))
    const rows = Math.floor(sheetH / (h + gap))

    const total = cols * rows

    const rotatedCols = Math.floor(sheetW / (h + gap))
    const rotatedRows = Math.floor(sheetH / (w + gap))

    const rotatedTotal = rotatedCols * rotatedRows

    let best = {
      orientation: 'normal',
      cols,
      rows,
      total
    }

    if (rotatedTotal > total) {
      best = {
        orientation: 'rotated',
        cols: rotatedCols,
        rows: rotatedRows,
        total: rotatedTotal
      }
    }

    const sheetArea = sheetW * sheetH
    const usedArea = best.total * itemW * itemH

    const waste = sheetArea - usedArea
    const wastePercent = (waste / sheetArea) * 100

    return {
      layout: best,
      waste_percent: Number(wastePercent.toFixed(2))
    }

  }

}