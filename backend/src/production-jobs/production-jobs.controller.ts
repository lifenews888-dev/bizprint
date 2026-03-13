import { Controller, Post, Body, Get, Param, Patch, ParseIntPipe } from '@nestjs/common'
import { ProductionJobsService } from './production-jobs.service'

@Controller('production-jobs')
export class ProductionJobsController {

  constructor(
    private readonly productionJobsService: ProductionJobsService
  ) {}

  // CREATE JOB
  @Post()
  createJob(@Body() body: any) {
    return this.productionJobsService.createJob(
      body.order_id,
      body.factory_id,
      body.machine_id
    )
  }

  // FACTORY QUEUE
  @Get('factory/:factoryId')
  getFactoryQueue(
    @Param('factoryId', ParseIntPipe) factoryId: number
  ) {
    return this.productionJobsService.getFactoryQueue(factoryId)
  }

  // START JOB
  @Patch(':id/start')
  startJob(@Param('id') id: string) {
    return this.productionJobsService.startJob(id)
  }

  // COMPLETE JOB
  @Patch(':id/complete')
  completeJob(@Param('id') id: string) {
    return this.productionJobsService.completeJob(id)
  }

}