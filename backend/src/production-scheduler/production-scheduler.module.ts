import { Module } from '@nestjs/common';
import { ProductionSchedulerService } from './production-scheduler.service';
import { ProductionSchedulerController } from './production-scheduler.controller';

@Module({
  providers: [ProductionSchedulerService],
  controllers: [ProductionSchedulerController],
})
export class ProductionSchedulerModule {}