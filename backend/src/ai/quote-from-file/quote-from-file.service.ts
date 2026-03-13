import { Injectable } from '@nestjs/common'

import { PdfInspectorService } from '../pdf-inspector/pdf-inspector.service'
import { PrintSizeService } from '../print-size/print-size.service'
import { AutoQuoteService } from '../auto-quote/auto-quote.service'

@Injectable()
export class QuoteFromFileService {

  constructor(
    private readonly pdfInspector: PdfInspectorService,
    private readonly printSize: PrintSizeService,
    private readonly autoQuote: AutoQuoteService
  ) {}

  async process(file: any) {

    /* PDF анализ */
    const pdf = await this.pdfInspector.inspect(file.buffer)

    /* TEMP хэмжээ */
    const width = 90
    const height = 50

    const size = this.printSize.detect(width, height)

    const quote = this.autoQuote.calculate({

      sheet_width: 297,
      sheet_height: 420,

      item_width: size.width_mm,
      item_height: size.height_mm,

      orders: [
        { id: 1, quantity: 100 }
      ],

      sheet_cost: 1200,
      machine_cost_per_hour: 50000,
      production_minutes: 20

    })

    return {

      pdf_analysis: pdf,

      detected_size: size.detected_size,
      width_mm: size.width_mm,
      height_mm: size.height_mm,

      quote

    }

  }

}