import { Injectable, Logger } from '@nestjs/common'
import Anthropic from '@anthropic-ai/sdk'
import pdfParse from 'pdf-parse'
import { PDFDocument } from 'pdf-lib'
import { QuoteEngineService } from '../../quote-engine/quote-engine.service'
import { PdfInspectorService } from '../pdf-inspector/pdf-inspector.service'
import { MaterialsService } from '../../materials/materials.service'

// Claude-аас буцаж ирэх print specs
export interface PrintSpec {
  product_type: string       // vizit_kart | flyar | broushur | poster | banner | ном | sticker | бусад
  product_name_mn: string    // Монгол нэр
  color_mode: string         // color | bw
  sides: string              // single | double
  pages: number
  paper_gsm: number          // 80 | 100 | 130 | 150 | 200 | 250 | 300 | 350
  finishing: string          // none | mat | gloss | uv | soft_touch | spot_uv
  binding: string            // none | staple | perfect | spiral | hardcover
  width_mm: number
  height_mm: number
  confidence: number         // 0-100 хэр итгэлтэй байгаа
  reasoning: string          // Claude-ийн тайлбар
}

@Injectable()
export class SmartQuoteService {
  private readonly logger = new Logger(SmartQuoteService.name)
  private anthropic: Anthropic

  constructor(
    private readonly quoteEngine: QuoteEngineService,
    private readonly pdfInspector: PdfInspectorService,
    private readonly materialsService: MaterialsService,
  ) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'your_api_key_here') {
      this.logger.warn('⚠️  ANTHROPIC_API_KEY тохируулаагүй байна — smart quote ажиллахгүй')
    }
    this.anthropic = new Anthropic({ apiKey: apiKey || 'not-set' })
  }

  // ── PDF metadata задлах ──────────────────────────────────────────────────────
  private async extractPdfMeta(buffer: Buffer) {
    let pages = 1
    let width_mm = 210
    let height_mm = 297
    let color_space = 'unknown'
    let file_size_kb = Math.round(buffer.length / 1024)
    let has_images = false

    // pdf-parse → хуудасны тоо
    try {
      const parsed = await pdfParse(buffer)
      pages = parsed.numpages || 1
    } catch { /* */ }

    // pdf-lib → хуудасны хэмжээ, өнгөний орон зай
    try {
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const page = pdfDoc.getPage(0)
      const { width, height } = page.getSize()
      // PDF units → mm (1 pt = 0.352778 mm)
      width_mm  = Math.round(width  * 0.352778)
      height_mm = Math.round(height * 0.352778)
    } catch { /* */ }

    // Resolution таамаглал — хэмжээнд харьцуулсан файлын жин
    const area_mm2 = width_mm * height_mm
    const bytes_per_mm2 = buffer.length / area_mm2
    const estimated_dpi = bytes_per_mm2 > 10 ? 'HIGH (300+)' : bytes_per_mm2 > 2 ? 'MEDIUM (150-300)' : 'LOW (<150)'
    has_images = buffer.length > 200 * 1024 // 200KB+ бол зураг байна гэж тооцно

    return { pages, width_mm, height_mm, file_size_kb, estimated_dpi, has_images, color_space }
  }

  // ── Claude-д PDF metadata илгээж print spec авах ─────────────────────────────
  async analyzePdfWithClaude(meta: ReturnType<typeof this.extractPdfMeta> extends Promise<infer T> ? T : never, extraHint = ''): Promise<PrintSpec> {
    const prompt = `Та нэг хэвлэлийн компанийн мэргэжилтэн. PDF файлын техник мэдээллийг үндэслэж хэвлэлийн параметрийг тодорхойл.

PDF ФАЙЛЫН МЭДЭЭЛЭЛ:
- Хуудасны тоо: ${meta.pages}
- Хуудасны хэмжээ: ${meta.width_mm}×${meta.height_mm}мм
- Файлын жин: ${meta.file_size_kb}KB
- Тооцоолсон DPI: ${meta.estimated_dpi}
- Зураг агуулна: ${meta.has_images ? 'тийм' : 'үгүй'}
${extraHint ? `- Нэмэлт мэдээлэл: ${extraHint}` : ''}

ХЭМЖЭЭНИЙ ЛАВЛАГАА:
- Визит карт: 90×50мм (эсвэл 85×55)
- Флаер A6: 105×148мм
- Флаер A5: 148×210мм
- Флаер A4: 210×297мм
- A3: 297×420мм
- Брошур: ихэвчлэн 2+ хуудас, A5 эсвэл A4
- Ном/каталог: 8+ хуудас
- Баннер: нэг тал 500мм+ их
- Стикер: дурын хэмжээ, ихэвчлэн жижиг

Дараах JSON форматаар ЗӨВХӨн JSON объект буцаа, тайлбар хэрэггүй:

{
  "product_type": "vizit_kart|flyar|broushur|poster|banner|nom|sticker|бусад",
  "product_name_mn": "Монгол нэр (жш: Визит карт, Флаер, Брошур...)",
  "color_mode": "color|bw",
  "sides": "single|double",
  "pages": <тоо>,
  "paper_gsm": <80|100|130|150|200|250|300|350>,
  "finishing": "none|mat|gloss|uv|soft_touch",
  "binding": "none|staple|perfect|spiral|hardcover",
  "width_mm": <тоо>,
  "height_mm": <тоо>,
  "confidence": <0-100>,
  "reasoning": "Яагаад ийм дүгнэлт хийсэн тайлбар"
}`

    const msg = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',   // Хамгийн хурдан, хямд модель
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''

    // JSON задлах
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Claude буруу формат буцаав')

    const spec: PrintSpec = JSON.parse(jsonMatch[0])

    // Хэмжээ override — PDF-ийн бодит хэмжээг ашиглана
    if (meta.width_mm > 0 && meta.height_mm > 0) {
      spec.width_mm  = meta.width_mm
      spec.height_mm = meta.height_mm
    }

    return spec
  }

  // ── Бүрэн pipeline: PDF → Claude → Quote ────────────────────────────────────
  async processFile(file: Express.Multer.File, opts: {
    quantity?: number
    urgency?: string
    hint?: string
    // Хэрэглэгчийн тодорхой сонголт (Claude-г override хийнэ)
    paper_gsm?: number
    color_mode?: string
    sides?: string
    finishing?: string
    binding?: string
  } = {}) {
    const startMs = Date.now()

    const quantity = opts.quantity || 100
    const urgency  = opts.urgency  || 'standard'

    // 1. PDF metadata задлах
    const meta = await this.extractPdfMeta(file.buffer)

    // 2. PDF preflight шалгалт (чанарын дүгнэлт)
    let preflight: any = null
    try {
      preflight = await this.pdfInspector.inspect(file.buffer)
    } catch { /* preflight алдааг дарна */ }

    // 3. Claude-д PDF spec тодорхойлуулах
    // Хэрэглэгчийн сонголтыг hint-д нэмж Claude-г чиглүүлнэ
    let combinedHint = opts.hint || ''
    if (opts.paper_gsm) combinedHint += ` paper_gsm:${opts.paper_gsm}gsm`
    if (opts.color_mode) combinedHint += ` color:${opts.color_mode}`
    if (opts.sides) combinedHint += ` sides:${opts.sides}`
    if (opts.finishing && opts.finishing !== 'none') combinedHint += ` finishing:${opts.finishing}`

    let spec: PrintSpec
    try {
      spec = await this.analyzePdfWithClaude(meta, combinedHint.trim())
    } catch (e: any) {
      this.logger.error('Claude analyzePdf error: ' + e.message)
      throw e
    }

    // Хэрэглэгчийн тодорхой сонголтоор Claude-г override хийнэ
    if (opts.paper_gsm)  spec.paper_gsm  = opts.paper_gsm
    if (opts.color_mode) spec.color_mode = opts.color_mode
    if (opts.sides)      spec.sides      = opts.sides
    if (opts.finishing)  spec.finishing  = opts.finishing
    if (opts.binding)    spec.binding    = opts.binding

    // 4. Quote engine-д дамжуулах
    const quoteInput = {
      quantity,
      pages:      spec.pages,
      width_mm:   spec.width_mm,
      height_mm:  spec.height_mm,
      color_mode: spec.color_mode,
      sides:      spec.sides,
      paper_gsm:  spec.paper_gsm,
      finishing:  spec.finishing,
      binding:    spec.binding,
      urgency,
      category_id: this.productTypeToCategory(spec.product_type),
    }

    let quote: any
    try {
      quote = await this.quoteEngine.calculate(quoteInput)
    } catch (e: any) {
      this.logger.error('QuoteEngine error: ' + e.message)
      throw e
    }

    const elapsed_ms = Date.now() - startMs

    return {
      // Файлын мэдээлэл
      file: {
        name: file.originalname,
        size_kb: Math.round(file.size / 1024),
      },

      // Claude-ийн дүн шинжилгээ
      ai_analysis: {
        product_type:    spec.product_type,
        product_name_mn: spec.product_name_mn,
        color_mode:      spec.color_mode,
        sides:           spec.sides,
        pages:           spec.pages,
        paper_gsm:       spec.paper_gsm,
        finishing:       spec.finishing,
        binding:         spec.binding,
        width_mm:        spec.width_mm,
        height_mm:       spec.height_mm,
        confidence:      spec.confidence,
        reasoning:       spec.reasoning,
      },

      // PDF чанарын шалгалт
      preflight: preflight ? {
        score:   preflight.score,
        risk:    preflight.risk,
        issues:  preflight.issues,
        summary: preflight.summary,
      } : null,

      // Үнийн тооцоолол
      quote: {
        quantity,
        unit_price:        quote.unit_price,
        total_price:       quote.total_price,
        currency:          'MNT',
        // Зардлын задаргаа
        paper_cost:        quote.paper_cost,
        print_cost:        quote.print_cost,
        finishing_cost:    quote.finishing_cost,
        binding_cost:      quote.binding_cost,
        setup_cost:        quote.setup_cost,
        overhead:          quote.overhead,
        subtotal:          quote.subtotal,
        // Машин
        machine:           quote.machine,
        total_sheets:      quote.total_sheets,
        print_hours:       quote.print_hours,
        // Тохируулгууд
        smart_adjustments: quote.smart_adjustments,
        breakdown:         quote.breakdown,
      },

      // Хурд
      processing_ms: elapsed_ms,
      powered_by: 'Claude claude-haiku-4-5-20251001 + BizPrint Quote Engine',
    }
  }

  // Бүтээгдэхүүний төрлөөс category_id буцаах (future use)
  private productTypeToCategory(_type: string): null {
    // TODO: categories table-тай холбох
    return null
  }

  // ── Бодит материалын үнэ ашиглах метод ───────────────────────────────────────
  async calculateWithRealMaterials(printSpec: PrintSpec & { quantity?: number }): Promise<{
    aiEstimate: number;
    materialCost: any;
    finalPrice: number;
    breakdown: any;
  }> {
    const quantity = printSpec.quantity ?? 100

    const paperDefaults: Record<string, { size: string; gsm: number }> = {
      vizit_kart:  { size: 'A4', gsm: 300 },
      flyar:       { size: 'A4', gsm: 130 },
      broushur:    { size: 'A4', gsm: 170 },
      poster:      { size: 'A4', gsm: 170 },
      banner:      { size: 'custom', gsm: 510 },
      sticker:     { size: 'A4', gsm: 130 },
      nom:         { size: 'A4', gsm: 80 },
      packaging:   { size: 'custom', gsm: 250 },
    }

    const def = paperDefaults[printSpec.product_type] ?? { size: 'A4', gsm: 130 }

    let paper: any = null
    let ink: any = null
    try {
      paper = await this.materialsService.findPaperBySpec(def.size, printSpec.paper_gsm || def.gsm)
      const inks = await this.materialsService.findAllInk()
      ink = inks.find(i => i.type === 'CMYK') ?? inks[0]
    } catch { /* materials not seeded yet */ }

    if (!paper || !ink) {
      // Materials seed хийгдээгүй — fallback estimate
      const base = quantity * 80
      return {
        aiEstimate: base,
        materialCost: null,
        finalPrice: base,
        breakdown: { total: base, note: 'Materials DB seed хийгдээгүй — approximate estimate' },
      }
    }

    // Бодит өртөг тооцоолох
    const materialCost = await this.materialsService.calcMaterialCost({
      paperStockId: paper.id,
      inkProfileId: ink.id,
      finishingOptionIds: [],
      quantity,
      widthMm: printSpec.width_mm ?? 210,
      heightMm: printSpec.height_mm ?? 297,
      colorMode: printSpec.color_mode === 'bw' ? 'BW' : 'CMYK',
    })

    // Markup + platform commission
    const markup = 1.25  // 25% markup
    const platform = 0.05 // 5% commission
    const finalPrice = Math.round(materialCost.subtotal * markup * (1 + platform))

    return {
      aiEstimate: finalPrice,
      materialCost,
      finalPrice,
      breakdown: {
        paper: Math.round(materialCost.paperCost),
        ink: Math.round(materialCost.inkCost),
        finishing: Math.round(materialCost.finishingCost),
        markup: Math.round(materialCost.subtotal * (markup - 1)),
        platform: Math.round(materialCost.subtotal * markup * platform),
        total: finalPrice,
      },
    }
  }
}
