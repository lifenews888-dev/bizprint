import { Controller, Post, Body } from '@nestjs/common'
import { PrintCostService } from './print-cost.service'

@Controller('ai/print-cost')
export class PrintCostController {

  constructor(private readonly service: PrintCostService) {}

  @Post('calculate')
  calculate(@Body() body: any) {
    return this.service.calculate(body)
  }

}