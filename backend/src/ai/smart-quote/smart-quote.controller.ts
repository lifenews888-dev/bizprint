import {
  Controller, Post, UploadedFile, UseInterceptors,
  Body, HttpException, HttpStatus, Get,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { SmartQuoteService } from './smart-quote.service'

@Controller('ai/smart-quote')
export class SmartQuoteController {
  constructor(private readonly service: SmartQuoteService) {}

  /**
   * POST /ai/smart-quote/from-pdf
   * PDF файл upload хийж 1 секундэд үнэ авна
   * Body (multipart/form-data):
   *   file     — PDF файл (заавал)
   *   quantity — тоо ширхэг (default: 100)
   *   urgency  — standard | rush_24h | rush_48h | rush_72h
   *   hint     — нэмэлт тайлбар "double sided, mat lamination"
   */
  @Post('from-pdf')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },   // 50MB
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === 'application/pdf') cb(null, true)
      else cb(new HttpException('Зөвхөн PDF файл зөвшөөрөгдөнө', HttpStatus.BAD_REQUEST), false)
    },
  }))
  async fromPdf(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: {
      quantity?: string
      urgency?: string
      hint?: string
      paper_gsm?: string
      color_mode?: string
      sides?: string
      finishing?: string
      binding?: string
    },
  ) {
    if (!file) throw new HttpException('PDF файл оруулна уу', HttpStatus.BAD_REQUEST)

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new HttpException(
        'ANTHROPIC_API_KEY тохируулаагүй байна. .env файлд оруулна уу.',
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }

    return this.service.processFile(file, {
      quantity:   body.quantity   ? Number(body.quantity)   : 100,
      urgency:    body.urgency    || 'standard',
      hint:       body.hint       || '',
      paper_gsm:  body.paper_gsm  ? Number(body.paper_gsm)  : undefined,
      color_mode: body.color_mode || undefined,
      sides:      body.sides      || undefined,
      finishing:  body.finishing  || undefined,
      binding:    body.binding    || undefined,
    })
  }

  /**
   * GET /ai/smart-quote/status
   * API key тохируулагдсан эсэхийг шалгана
   */
  @Get('status')
  getStatus() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    const configured = !!apiKey && apiKey !== 'your_api_key_here'
    return {
      configured,
      model: 'claude-haiku-4-5-20251001',
      endpoint: 'POST /ai/smart-quote/from-pdf',
      status: configured ? '✅ Бэлэн — PDF upload хийж үнэ авах боломжтой' : '⚠️  API key тохируулаагүй',
      usage: {
        method: 'POST',
        url: '/ai/smart-quote/from-pdf',
        content_type: 'multipart/form-data',
        fields: {
          file:     'PDF файл (заавал)',
          quantity: 'Тоо ширхэг (default: 100)',
          urgency:  'standard | rush_24h | rush_48h | rush_72h (default: standard)',
          hint:     'Нэмэлт тайлбар: "2 тал, мат ламинат" (заавал биш)',
        },
      },
    }
  }
}
