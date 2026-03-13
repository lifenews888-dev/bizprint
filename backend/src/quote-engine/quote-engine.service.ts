import { Injectable } from '@nestjs/common'
import pdfParse from 'pdf-parse'

@Injectable()
export class QuoteEngineService {

  async calculateQuote(file: Express.Multer.File, quantity: number) {

    const data = await pdfParse(file.buffer)

    const pages = data.numpages

    const width = 210
    const height = 297

    const size = this.detectSize(width, height)

    const imposition = this.calculateImposition(size)

    const sheets_needed = Math.ceil(quantity / imposition.designs_per_sheet)

    const machine = this.selectMachine(quantity, size)

    const paper_cost = sheets_needed * 100
    const print_cost = quantity * 5
    const setup_cost = 200

    const total = paper_cost + print_cost + setup_cost

    return {
      pages,
      quantity,
      width,
      height,
      detected_size: size,
      sheet_size: imposition.sheet_size,
      designs_per_sheet: imposition.designs_per_sheet,
      sheets_needed,
      machine,
      paper_cost,
      print_cost,
      setup_cost,
      total_price: total
    }

  }

  detectSize(width: number, height: number) {

    if (width <= 210 && height <= 297) return "A4"

    if (width <= 148 && height <= 210) return "A5"

    if (width <= 297 && height <= 420) return "A3"

    return "Custom"

  }

  calculateImposition(size: string) {

    if (size === "A4") {
      return {
        sheet_size: "A3",
        designs_per_sheet: 2
      }
    }

    if (size === "A5") {
      return {
        sheet_size: "A3",
        designs_per_sheet: 4
      }
    }

    if (size === "A3") {
      return {
        sheet_size: "A3",
        designs_per_sheet: 1
      }
    }

    return {
      sheet_size: "Custom",
      designs_per_sheet: 1
    }

  }

  selectMachine(quantity: number, size: string) {

    if (size === "Custom") {
      return "Large Format Printer"
    }

    if (quantity <= 500) {
      return "Digital Press"
    }

    if (quantity <= 5000) {
      return "Production Digital Press"
    }

    return "Offset Press"

  }

}