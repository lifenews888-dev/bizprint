import { Controller, Post, Body } from '@nestjs/common'
import { ImpositionService } from './imposition.service'

@Controller('ai/imposition')
export class ImpositionController {

  constructor(private readonly service: ImpositionService) {}

  @Post('calculate')
  calculate(@Body() body: any) {

    return this.service.calculate(
      Number(body.sheet_width),
      Number(body.sheet_height),
      Number(body.item_width),
      Number(body.item_height)
    )

  }

}