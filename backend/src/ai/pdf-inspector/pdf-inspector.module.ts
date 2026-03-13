import { Module } from '@nestjs/common'
import { PdfInspectorController } from './pdf-inspector.controller'
import { PdfInspectorService } from './pdf-inspector.service'

@Module({
  controllers: [PdfInspectorController],
  providers: [PdfInspectorService],
  exports: [PdfInspectorService]
})
export class PdfInspectorModule {}