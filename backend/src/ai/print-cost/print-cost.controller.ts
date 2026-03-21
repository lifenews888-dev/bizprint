import { Controller, Post, Body } from '@nestjs/common'
import { PrintCostService } from './print-cost.service'

@Controller('ai/print-cost')
export class PrintCostController {

  constructor(private readonly service: PrintCostService) {}

  /** POST /ai/print-cost/calculate — legacy simple calculation */
  @Post('calculate')
  calculate(@Body() body: any) {
    return this.service.calculate(body)
  }

  /** POST /ai/print-cost/full — full 11-step breakdown (pass layout from sheet-optimizer) */
  @Post('full')
  full(@Body() body: any) {
    return this.service.calculateFull(body)
  }

}