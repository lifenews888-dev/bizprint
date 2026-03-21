import { Test, TestingModule } from '@nestjs/testing'
import { QuoteFromFileService } from './quote-from-file.service'
import { PdfInspectorService } from '../pdf-inspector/pdf-inspector.service'
import { PrintSizeService } from '../print-size/print-size.service'
import { AutoQuoteService } from '../auto-quote/auto-quote.service'

// PdfInspectorService mock — бодит PDF шаардахгүй
const mockPreflight = (overrides = {}) => ({
  pages: 1,
  page_width_mm: 210,
  page_height_mm: 297,
  text_length: 100,
  info: {},
  score: 100,
  risk: 'LOW',
  summary: 'Хэвлэлд бэлэн.',
  issues: [],
  checks: {
    resolution:   { status: 'pass', detail: '' },
    color_mode:   { status: 'pass', detail: '' },
    bleed:        { status: 'pass', detail: '' },
    fonts:        { status: 'pass', detail: '' },
    page_size:    { status: 'pass', detail: '' },
    transparency: { status: 'pass', detail: '' },
  },
  ...overrides,
})

describe('QuoteFromFileService', () => {
  let service: QuoteFromFileService
  let pdfInspector: jest.Mocked<PdfInspectorService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuoteFromFileService,
        PrintSizeService,
        {
          provide: PdfInspectorService,
          useValue: { inspect: jest.fn() },
        },
        {
          provide: AutoQuoteService,
          useValue: {
            calculate: jest.fn().mockReturnValue({
              layout:   { best_layout: { total_per_sheet: 4 } },
              gang_run: { sheets: [], total_sheets: 25 },
              cost: {
                material_cost: 30000,
                machine_cost:  16667,
                base_cost:     46667,
                margin:        14000,
                final_price:   60667,
              },
            }),
          },
        },
      ],
    }).compile()

    service = module.get<QuoteFromFileService>(QuoteFromFileService)
    pdfInspector = module.get(PdfInspectorService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('process() — бодит PDF хэмжээ ашиглана', () => {
    it('PDF-аас авсан хэмжээг print_size-д тусгана', async () => {
      pdfInspector.inspect.mockResolvedValue(mockPreflight({
        page_width_mm: 210,
        page_height_mm: 297,
      }) as any)

      const result = await service.process({ buffer: Buffer.from('') }, 100)

      expect(result.print_size.width_mm).toBe(210)
      expect(result.print_size.height_mm).toBe(297)
      expect(result.print_size.detected).toBe('A4')
    })

    it('PDF хэмжээ 0 бол A4 (210x297) fallback хэрэглэнэ', async () => {
      pdfInspector.inspect.mockResolvedValue(mockPreflight({
        page_width_mm: 0,
        page_height_mm: 0,
      }) as any)

      const result = await service.process({ buffer: Buffer.from('') }, 100)

      expect(result.print_size.width_mm).toBe(210)
      expect(result.print_size.height_mm).toBe(297)
    })

    it('quantity-г quote-д дамжуулна', async () => {
      pdfInspector.inspect.mockResolvedValue(mockPreflight() as any)

      const result = await service.process({ buffer: Buffer.from('') }, 250)

      expect(result.quote.quantity).toBe(250)
    })
  })

  describe('process() — preflight surcharge', () => {
    it('асуудал байхгүй бол surcharge 0', async () => {
      pdfInspector.inspect.mockResolvedValue(mockPreflight({ issues: [] }) as any)

      const result = await service.process({ buffer: Buffer.from('') }, 100)

      expect(result.surcharge.total_amount).toBe(0)
      expect(result.surcharge.breakdown).toHaveLength(0)
      expect(result.final_price).toBe(result.quote.cost.final_price)
    })

    it('RGB_COLOR асуудал → +15% нэмэгдэл', async () => {
      pdfInspector.inspect.mockResolvedValue(mockPreflight({
        issues: [{ type: 'RGB_COLOR', severity: 'warning', message: 'RGB өнгө' }],
      }) as any)

      const result = await service.process({ buffer: Buffer.from('') }, 100)

      expect(result.surcharge.total_rate).toBeCloseTo(0.15)
      expect(result.surcharge.breakdown[0].type).toBe('RGB_COLOR')
      expect(result.final_price).toBeGreaterThan(result.quote.cost.final_price)
    })

    it('LOW_RESOLUTION → +20%, RGB_COLOR → +15% хоёулаа нэмэгдэнэ', async () => {
      pdfInspector.inspect.mockResolvedValue(mockPreflight({
        issues: [
          { type: 'LOW_RESOLUTION', severity: 'error',   message: 'Нягтрал бага' },
          { type: 'RGB_COLOR',      severity: 'warning', message: 'RGB өнгө' },
        ],
      }) as any)

      const result = await service.process({ buffer: Buffer.from('') }, 100)

      expect(result.surcharge.total_rate).toBeCloseTo(0.35)
      expect(result.surcharge.breakdown).toHaveLength(2)
    })

    it('final_price = base + surcharge', async () => {
      pdfInspector.inspect.mockResolvedValue(mockPreflight({
        issues: [{ type: 'FONT_ISSUE', severity: 'warning', message: 'Фонт' }],
      }) as any)

      const result = await service.process({ buffer: Buffer.from('') }, 100)

      expect(result.final_price).toBe(
        result.final_price_breakdown.base_print_cost +
        result.final_price_breakdown.preflight_surcharge
      )
    })
  })

  describe('process() — буцаасан бүтэц', () => {
    it('preflight, print_size, quote, surcharge, final_price талбарууд байна', async () => {
      pdfInspector.inspect.mockResolvedValue(mockPreflight() as any)

      const result = await service.process({ buffer: Buffer.from('') }, 100)

      expect(result).toHaveProperty('preflight')
      expect(result).toHaveProperty('print_size')
      expect(result).toHaveProperty('quote')
      expect(result).toHaveProperty('surcharge')
      expect(result).toHaveProperty('final_price')
      expect(result).toHaveProperty('final_price_breakdown')
    })
  })
})
