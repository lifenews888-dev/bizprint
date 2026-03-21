import { Controller, Post, UploadedFile, UseInterceptors, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { FullQuoteService } from './full-quote.service'

@Controller('ai')
export class FullQuoteController {

  constructor(private readonly service: FullQuoteService) {}

  @Post('full-quote')
  @UseInterceptors(FileInterceptor('file'))
  async quote(
    @UploadedFile() file: Express.Multer.File,
    @Query('quantity', new DefaultValuePipe(500), ParseIntPipe) quantity: number,
  ) {
    return this.service.calculate(file, quantity)
  }
}
