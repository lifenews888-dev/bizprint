import { Controller, Post, Body, Patch, Param } from '@nestjs/common'
import { ProductionService } from './production.service'

@Controller('production')
export class ProductionController {

  constructor(private readonly productionService: ProductionService) {}

  @Post()
  create(@Body() body: any) {

    return this.productionService.createJob(body.order_id)

  }

  @Patch(':id/start')
  start(@Param('id') id: string) {

    return this.productionService.startJob(id)

  }

  @Patch(':id/complete')
  complete(@Param('id') id: string) {

    return this.productionService.completeJob(id)

  }

}