import { Controller, Post, UploadedFile, UseInterceptors, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { QuoteFromFileService } from './quote-from-file.service'

@Controller('ai')
export class QuoteFromFileController {

  constructor(private readonly service: QuoteFromFileService) {}

  @Post('quote-from-file')
  @UseInterceptors(FileInterceptor('file'))
  async quote(
    @UploadedFile() file: Express.Multer.File,
    @Query('quantity', new DefaultValuePipe(100), ParseIntPipe) quantity: number,
  ) {
    return this.service.process(file, quantity)
  }
}
