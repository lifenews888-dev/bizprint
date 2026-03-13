import { Module } from '@nestjs/common'
import { ProductionSchedulerController } from './production-scheduler.controller'
import { ProductionSchedulerService } from './production-scheduler.service'

@Module({
  controllers: [ProductionSchedulerController],
  providers: [ProductionSchedulerService]
})
export class ProductionSchedulerModule {}