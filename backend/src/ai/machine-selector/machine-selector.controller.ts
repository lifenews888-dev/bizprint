import { Controller, Post, Body } from '@nestjs/common'
import { MachineSelectorService } from './machine-selector.service'

@Controller('ai/machine-selector')
export class MachineSelectorController {

  constructor(private readonly service: MachineSelectorService) {}

  @Post()
  select(@Body() body: any) {

    return this.service.select(body)

  }

}