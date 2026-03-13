import { Module } from '@nestjs/common'
import { PrintCostController } from './print-cost.controller'
import { PrintCostService } from './print-cost.service'

@Module({
  controllers: [PrintCostController],
  providers: [PrintCostService],
  exports: [PrintCostService]
})
export class PrintCostModule {}