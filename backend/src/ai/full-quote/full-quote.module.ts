import { Module } from '@nestjs/common'
import { FullQuoteController } from './full-quote.controller'
import { FullQuoteService } from './full-quote.service'

import { PdfInspectorModule } from '../pdf-inspector/pdf-inspector.module'
import { PrintSizeModule } from '../print-size/print-size.module'
import { ImpositionModule } from '../imposition/imposition.module'
import { GangRunModule } from '../gang-run/gang-run.module'
import { MachineSelectorModule } from '../machine-selector/machine-selector.module'
import { PrintCostModule } from '../print-cost/print-cost.module'

@Module({
  imports: [
    PdfInspectorModule,
    PrintSizeModule,
    ImpositionModule,
    GangRunModule,
    MachineSelectorModule,
    PrintCostModule
  ],
  controllers: [FullQuoteController],
  providers: [FullQuoteService]
})
export class FullQuoteModule {}