import { Module } from '@nestjs/common'
import { SmartQuoteController } from './smart-quote.controller'
import { SmartQuoteService } from './smart-quote.service'
import { QuoteEngineModule } from '../../quote-engine/quote-engine.module'
import { PdfInspectorModule } from '../pdf-inspector/pdf-inspector.module'

@Module({
  imports: [
    QuoteEngineModule,      // QuoteEngineService (calculate)
    PdfInspectorModule,     // PdfInspectorService (preflight)
  ],
  controllers: [SmartQuoteController],
  providers: [SmartQuoteService],
  exports: [SmartQuoteService],
})
export class SmartQuoteModule {}
