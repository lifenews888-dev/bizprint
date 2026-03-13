import { Body, Controller, Post } from '@nestjs/common'
import { GangrunService } from './gangrun.service'
import { CalculateGangRunDto } from './dto/calculate-gangrun.dto'

@Controller('gangrun')
export class GangrunController {

  constructor(private readonly gangrunService: GangrunService) {}

  @Post('calculate')
  calculate(@Body() data: CalculateGangRunDto) {
    return this.gangrunService.calculate(data)
  }

}