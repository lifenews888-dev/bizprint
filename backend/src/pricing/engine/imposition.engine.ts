export interface ImpositionInput {
  sheet_width_mm: number
  sheet_height_mm: number
  product_width_mm: number
  product_height_mm: number
  bleed_mm?: number
}

export interface ImpositionResult {
  per_sheet: number
  columns: number
  rows: number
  rotated: boolean
}

export class ImpositionEngine {

  static calculate(input: ImpositionInput): ImpositionResult {

    const bleed = input.bleed_mm || 0

    const productWidth = input.product_width_mm + bleed * 2
    const productHeight = input.product_height_mm + bleed * 2

    // normal orientation
    const colsNormal = Math.floor(input.sheet_width_mm / productWidth)
    const rowsNormal = Math.floor(input.sheet_height_mm / productHeight)

    const normalCount = colsNormal * rowsNormal

    // rotated orientation
    const colsRot = Math.floor(input.sheet_width_mm / productHeight)
    const rowsRot = Math.floor(input.sheet_height_mm / productWidth)

    const rotatedCount = colsRot * rowsRot

    if (rotatedCount > normalCount) {
      return {
        per_sheet: rotatedCount,
        columns: colsRot,
        rows: rowsRot,
        rotated: true
      }
    }

    return {
      per_sheet: normalCount,
      columns: colsNormal,
      rows: rowsNormal,
      rotated: false
    }

  }

}