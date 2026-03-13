import { Controller, Post, UploadedFile, UseInterceptors, Body } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { QuoteEngineService } from './quote-engine.service'

@Controller('quote')
export class QuoteEngineController {

  constructor(private readonly quoteService: QuoteEngineService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async generateQuote(
    @UploadedFile() file: Express.Multer.File,
    @Body('quantity') quantity: number
  ) {

    return this.quoteService.calculateQuote(file, Number(quantity))

  }

}