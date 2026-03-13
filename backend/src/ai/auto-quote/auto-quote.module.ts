import { Module } from '@nestjs/common'
import { AutoQuoteController } from './auto-quote.controller'
import { AutoQuoteService } from './auto-quote.service'

import { ImpositionModule } from '../imposition/imposition.module'
import { GangRunModule } from '../gang-run/gang-run.module'
import { PrintCostModule } from '../print-cost/print-cost.module'

@Module({
  imports: [
    ImpositionModule,
    GangRunModule,
    PrintCostModule
  ],
  controllers: [AutoQuoteController],
  providers: [AutoQuoteService],
  exports: [AutoQuoteService]
})
export class AutoQuoteModule {}