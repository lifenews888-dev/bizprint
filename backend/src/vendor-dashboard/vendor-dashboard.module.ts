import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ProductionJob } from '../production/entities/production-job.entity'
import { VendorDashboardService } from './vendor-dashboard.service'
import { VendorDashboardController } from './vendor-dashboard.controller'

@Module({
  imports: [TypeOrmModule.forFeature([ProductionJob])],
  providers: [VendorDashboardService],
  controllers: [VendorDashboardController]
})
export class VendorDashboardModule {}