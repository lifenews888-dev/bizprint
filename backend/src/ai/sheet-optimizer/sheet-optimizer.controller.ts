import { Controller, Post, Body } from '@nestjs/common'
import { SheetOptimizerService } from './sheet-optimizer.service'

@Controller('ai/sheet')
export class SheetOptimizerController {

  constructor(private readonly service: SheetOptimizerService) {}

  @Post('optimize')
  optimize(@Body() body: any) {
    return this.service.optimize(body)
  }

}