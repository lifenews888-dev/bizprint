import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ProductionQueueService } from './production-queue.service';

@Controller('production-queue')
export class ProductionQueueController {
  constructor(
    private readonly queueService: ProductionQueueService,
  ) {}

  @Post()
  addToQueue(
    @Body() body: {
      factory_id: number;
      machine_id: number;
      job_id: number;
    },
  ) {
    return this.queueService.addToQueue(
      body.factory_id,
      body.machine_id,
      body.job_id,
    );
  }

  @Get('factory/:id')
  getFactoryQueue(@Param('id') id: number) {
    return this.queueService.getFactoryQueue(Number(id));
  }

  @Get('machine/:id')
  getMachineQueue(@Param('id') id: number) {
    return this.queueService.getMachineQueue(Number(id));
  }

  @Patch(':id/start')
  startJob(@Param('id') id: number) {
    return this.queueService.startJob(Number(id));
  }

  @Patch(':id/finish')
  finishJob(@Param('id') id: number) {
    return this.queueService.finishJob(Number(id));
  }
}