import { Controller, Post, Body } from '@nestjs/common'
import { PrintSizeService } from './print-size.service'

@Controller('ai/print-size')
export class PrintSizeController {

  constructor(private readonly service: PrintSizeService) {}

  @Post('detect')
  detect(@Body() body: any) {

    return this.service.detect(
      Number(body.width_mm),
      Number(body.height_mm)
    )

  }

}