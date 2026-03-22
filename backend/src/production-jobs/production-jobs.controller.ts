import { Controller, Get, Patch, Post, Param, Body } from '@nestjs/common'
import { ProductionJobsService } from './production-jobs.service'
import { ProductionStatus } from '../production/entities/production-job.entity'

@Controller('production-jobs')
export class ProductionJobsController {
  constructor(private readonly service: ProductionJobsService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProductionStatus,
  ) {
    return this.service.updateStatus(id, status)
  }

  @Post('from-order/:orderId')
  createFromOrder(@Param('orderId') orderId: string) {
    return this.service.createFromOrder(orderId)
  }
}
