import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ProductionJobsService } from './production-jobs.service'
import { ProductionJobsController } from './production-jobs.controller'
import { ProductionJob } from '../production/entities/production-job.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductionJob])
  ],
  controllers: [ProductionJobsController],
  providers: [ProductionJobsService],
  exports: [ProductionJobsService]   // ← ЧУХАЛ
})
export class ProductionJobsModule {}