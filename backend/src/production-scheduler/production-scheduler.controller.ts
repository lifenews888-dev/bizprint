import { Controller, Post, Param } from '@nestjs/common';
import { ProductionSchedulerService } from './production-scheduler.service';

@Controller('scheduler')
export class ProductionSchedulerController {
  constructor(private readonly schedulerService: ProductionSchedulerService) {}

  @Post('schedule/:orderId')
  scheduleOrder(@Param('orderId') orderId: string) {
    return this.schedulerService.scheduleOrder(orderId);
  }
}