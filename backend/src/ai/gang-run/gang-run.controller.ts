import { Controller, Post, Body } from '@nestjs/common'
import { GangRunService } from './gang-run.service'

@Controller('ai/gang-run')
export class GangRunController {

  constructor(private readonly service: GangRunService) {}

  @Post('optimize')
  optimize(@Body() body: any) {

    return this.service.optimize(
      body.orders,
      body.sheet_capacity
    )

  }

}