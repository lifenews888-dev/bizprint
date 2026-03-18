import { Controller, Get, Patch, Post, Param, Body, ParseIntPipe } from '@nestjs/common'
import { ProductionJobsService } from './production-jobs.service'
import { ProductionJobStatus } from './production-job.entity'

@Controller('production-jobs')
export class ProductionJobsController {
  constructor(private readonly service: ProductionJobsService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ProductionJobStatus,
  ) {
    return this.service.updateStatus(id, status)
  }

  @Post('from-order/:orderId')
  createFromOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.service.createFromOrder(orderId)
  }
}