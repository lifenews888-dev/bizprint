import { Controller, Post, Body } from '@nestjs/common'
import { PrintEngineService } from './print-engine.service'

@Controller('ai/print-engine')
export class PrintEngineController {

  constructor(
    private readonly service: PrintEngineService
  ) {}

  @Post()
  run(@Body() body: any) {
    return this.service.run(body)
  }

}