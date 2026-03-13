import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { PdfInspectorService } from './pdf-inspector.service'

@Controller('ai/pdf-inspector')
export class PdfInspectorController {

  constructor(private readonly service: PdfInspectorService) {}

  @Post('inspect')
  @UseInterceptors(FileInterceptor('file'))
  async inspect(@UploadedFile() file: Express.Multer.File) {

    return this.service.inspect(file.buffer)

  }

}