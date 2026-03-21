import { Injectable } from '@nestjs/common'

import { PdfInspectorService, PreflightIssue } from '../pdf-inspector/pdf-inspector.service'
import { PrintSizeService } from '../print-size/print-size.service'
import { AutoQuoteService } from '../auto-quote/auto-quote.service'

// Preflight issue тус бүрийн нэмэгдэл зардлын хувь
const SURCHARGE_RATES: Record<string, number> = {
  LOW_RESOLUTION:    0.20,  // +20% — дахин хэвлэх эрсдэл өндөр
  MEDIUM_RESOLUTION: 0.08,  // +8%  — урьдчилан сэрэмжлүүлэх
  RGB_COLOR:         0.15,  // +15% — CMYK хөрвүүлэлт шаардлагатай
  FONT_ISSUE:        0.10,  // +10% — фонт засах ажил
  BLEED_UNKNOWN:     0.05,  // +5%  — bleed тохируулах магадлал
}

function calcSurcharge(issues: PreflightIssue[], baseCost: number) {
  const breakdown: { type: string; rate: number; amount: number; reason: string }[] = []
  let totalRate = 0

  for (const issue of issues) {
    const rate = SURCHARGE_RATES[issue.type]
    if (!rate) continue
    totalRate += rate
    breakdown.push({
      type: issue.type,
      rate,
      amount: Math.round(baseCost * rate),
      reason: issue.message,
    })
  }

  return {
    total_rate: totalRate,
    total_amount: Math.round(baseCost * totalRate),
    breakdown,
  }
}

@Injectable()
export class QuoteFromFileService {

  constructor(
    private readonly pdfInspector: PdfInspectorService,
    private readonly printSize: PrintSizeService,
    private readonly autoQuote: AutoQuoteService
  ) {}

  async process(file: any, quantity = 100) {

    // 1. PDF preflight + бодит хэмжээ
    const preflight = await this.pdfInspector.inspect(file.buffer)

    // 2. Бодит хуудасны хэмжээ (pdf-lib-ээс) — 0 бол fallback
    const width  = preflight.page_width_mm  > 0 ? preflight.page_width_mm  : 210
    const height = preflight.page_height_mm > 0 ? preflight.page_height_mm : 297

    // 3. Стандарт хэмжээ таних (A4, A5, г.м.)
    const size = this.printSize.detect(width, height)

    // 4. Тооцоолол
    const quote = this.autoQuote.calculate({
      sheet_width:  297,
      sheet_height: 420,

      item_width:  size.width_mm,
      item_height: size.height_mm,

      orders: [{ id: 1, quantity }],

      sheet_cost:            1200,
      machine_cost_per_hour: 50000,
      production_minutes:    20,
    })

    // 5. Preflight surcharge — чанарын асуудлаас нэмэгдэх зардал
    const surcharge = calcSurcharge(preflight.issues, quote.cost.final_price)
    const final_price_with_surcharge = quote.cost.final_price + surcharge.total_amount

    return {
      // PDF шалгалтын үр дүн
      preflight: {
        pages:         preflight.pages,
        page_width_mm: preflight.page_width_mm,
        page_height_mm: preflight.page_height_mm,
        score:         preflight.score,
        risk:          preflight.risk,
        summary:       preflight.summary,
        issues:        preflight.issues,
        checks:        preflight.checks,
      },

      // Хэвлэх хэмжээ
      print_size: {
        detected: size.detected_size,
        width_mm: size.width_mm,
        height_mm: size.height_mm,
      },

      // Тооцооллын үр дүн
      quote: {
        quantity,
        layout:   quote.layout,
        gang_run: quote.gang_run,
        cost:     quote.cost,
      },

      // Нэмэгдэл зардал (preflight асуудлаас)
      surcharge,

      // Нийт эцсийн үнэ
      final_price: final_price_with_surcharge,
      final_price_breakdown: {
        base_print_cost: quote.cost.final_price,
        preflight_surcharge: surcharge.total_amount,
        total: final_price_with_surcharge,
      },
    }
  }
}
