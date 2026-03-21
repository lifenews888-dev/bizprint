import { Controller, Post, Body, UploadedFile, UseInterceptors, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { FullQuoteService } from './full-quote.service'

@Controller('ai')
export class FullQuoteController {

  constructor(private readonly service: FullQuoteService) {}

  /** POST /ai/full-quote — PDF upload → full AI quote pipeline */
  @Post('full-quote')
  @UseInterceptors(FileInterceptor('file'))
  async quote(
    @UploadedFile() file: Express.Multer.File,
    @Query('quantity', new DefaultValuePipe(500), ParseIntPipe) quantity: number,
  ) {
    return this.service.calculate(file, quantity)
  }

  /**
   * POST /ai/full-quote/offset
   * Form-based offset quote — no PDF required.
   * Body: { size, gsm, quantity, color, sides, finish, fold, product, is_rush }
   */
  @Post('full-quote/offset')
  offsetQuote(@Body() body: any) {
    return this.service.calculateOffset(body)
  }
}
