import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Order } from '../orders/entities/order.entity'
import { Payment } from '../payment/entities/payment.entity'
import { ProductionJob } from '../production/entities/production-job.entity'

import { CustomerDashboardService } from './customer-dashboard.service'
import { CustomerDashboardController } from './customer-dashboard.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      Payment,
      ProductionJob
    ])
  ],
  providers: [CustomerDashboardService],
  controllers: [CustomerDashboardController]
})
export class CustomerDashboardModule {}