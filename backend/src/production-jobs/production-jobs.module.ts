import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ProductionJobsService } from './production-jobs.service'
import { ProductionJobsController } from './production-jobs.controller'
import { ProductionJob } from '../production/entities/production-job.entity'
import { DeliveryModule } from '../delivery/delivery.module'
import { NotificationModule } from '../notifications/notification.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductionJob]),
    DeliveryModule,
    NotificationModule,
  ],
  controllers: [ProductionJobsController],
  providers: [ProductionJobsService],
  exports: [ProductionJobsService],
})
export class ProductionJobsModule {}
