import { Module } from '@nestjs/common'
import { QuoteFromFileController } from './quote-from-file.controller'
import { QuoteFromFileService } from './quote-from-file.service'

import { PdfInspectorModule } from '../pdf-inspector/pdf-inspector.module'
import { PrintSizeModule } from '../print-size/print-size.module'
import { AutoQuoteModule } from '../auto-quote/auto-quote.module'

@Module({
  imports: [
    PdfInspectorModule,
    PrintSizeModule,
    AutoQuoteModule
  ],
  controllers: [QuoteFromFileController],
  providers: [QuoteFromFileService]
})
export class QuoteFromFileModule {}