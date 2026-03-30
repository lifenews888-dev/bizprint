import { Module } from '@nestjs/common'
import { PdfInspectorController } from './pdf-inspector.controller'
import { PdfInspectorService } from './pdf-inspector.service'
import { QuoteFromFileController } from '../quote-from-file.controller'

@Module({
  controllers: [PdfInspectorController, QuoteFromFileController],
  providers: [PdfInspectorService],
  exports: [PdfInspectorService]
})
export class PdfInspectorModule {}