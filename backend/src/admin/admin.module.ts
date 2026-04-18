import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AdminService } from './admin.service'
import { AdminController, MarketingController } from './admin.controller'
import { AdminGuard } from './admin.guard'

import { Vendor } from '../vendors/vendor.entity'
import { Order } from '../orders/entities/order.entity'
import { Machine } from '../machines/machine.entity'
import { ProductionJob } from '../production/entities/production-job.entity'
import { User } from '../users/user.entity'
import { Campaign } from './campaign.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Vendor, Order, Machine, ProductionJob, User, Campaign]),
  ],
  providers: [AdminService, AdminGuard],
  controllers: [AdminController, MarketingController],
  exports: [AdminGuard],
})
export class AdminModule {}
