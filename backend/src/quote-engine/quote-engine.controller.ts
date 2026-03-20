import { Controller, Post, UploadedFile, UseInterceptors, Body, Get } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { QuoteEngineService } from './quote-engine.service'

@Controller('quote-engine')
export class QuoteEngineController {
  constructor(private readonly svc: QuoteEngineService) {}

  @Post('calculate')
  async calculate(@Body() body: any) {
    return this.svc.calculate({
      quantity:    Number(body.quantity) || 100,
      pages:       Number(body.pages) || 1,
      width_mm:    Number(body.width_mm) || 210,
      height_mm:   Number(body.height_mm) || 297,
      color_mode:  body.color_mode || 'color',
      sides:       body.sides || 'single',
      paper_gsm:   Number(body.paper_gsm) || 150,
      finishing:   body.finishing || 'none',
      binding:     body.binding || 'none',
      urgency:      body.urgency || 'standard',
      express_hours: Number(body.express_hours) || 0,
      gang_run:    body.gang_run === true || body.gang_run === 'true',
      category_id: body.category_id || null,
      product_id:  body.product_id || null,
    })
  }

  @Post('from-pdf')
  @UseInterceptors(FileInterceptor('file'))
  async fromPdf(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    return this.svc.calculateFromPdf(file, {
      quantity:  Number(body.quantity) || 100,
      color_mode: body.color_mode || 'color',
      sides:     body.sides || 'single',
      paper_gsm: Number(body.paper_gsm) || 150,
      finishing: body.finishing || 'none',
      binding:   body.binding || 'none',
    })
  }
}