import { Controller, Post, Get, Body } from '@nestjs/common'
import { FactoriesService } from './factories.service'

@Controller('factories')
export class FactoriesController {
  constructor(private readonly factoriesService: FactoriesService) {}

  @Get()
  getAll(): any[] {
    return this.factoriesService.findAll()
  }

  @Post('select')
  selectFactory(@Body() body: any): any {
    const { machine_type, quantity } = body
    return this.factoriesService.selectBestFactory(machine_type, quantity)
  }
}
