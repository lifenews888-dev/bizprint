import { Module } from '@nestjs/common'
import { SmartQuoteController } from './smart-quote.controller'
import { SmartQuoteService } from './smart-quote.service'
import { QuoteEngineModule } from '../../quote-engine/quote-engine.module'
import { PdfInspectorModule } from '../pdf-inspector/pdf-inspector.module'
import { MaterialsModule } from '../../materials/materials.module'

@Module({
  imports: [
    QuoteEngineModule,      // QuoteEngineService (calculate)
    PdfInspectorModule,     // PdfInspectorService (preflight)
    MaterialsModule,        // MaterialsService (real material costs)
  ],
  controllers: [SmartQuoteController],
  providers: [SmartQuoteService],
  exports: [SmartQuoteService],
})
export class SmartQuoteModule {}
