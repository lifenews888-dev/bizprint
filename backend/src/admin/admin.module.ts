import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AdminService } from './admin.service'
import { AdminController } from './admin.controller'

import { Vendor } from '../vendors/vendor.entity'
import { Order } from '../orders/entities/order.entity'
import { Machine } from '../machines/machine.entity'
import { ProductionJob } from '../production/entities/production-job.entity'
import { User } from '../users/user.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vendor,
      Order,
      Machine,
      ProductionJob,
      User
    ])
  ],
  providers: [AdminService],
  controllers: [AdminController]
})
export class AdminModule {}