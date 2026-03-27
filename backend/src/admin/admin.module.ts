import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AdminService } from './admin.service'
import { AdminController } from './admin.controller'
import { AdminGuard } from './admin.guard'

import { Vendor } from '../vendors/vendor.entity'
import { Order } from '../orders/entities/order.entity'
import { Machine } from '../machines/machine.entity'
import { ProductionJob } from '../production/entities/production-job.entity'
import { User } from '../users/user.entity'
import { NotificationModule } from '../notifications/notification.module'
import { MailModule } from '../mail/mail.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Vendor, Order, Machine, ProductionJob, User]),
    NotificationModule,
    MailModule,
  ],
  providers: [AdminService, AdminGuard],
  controllers: [AdminController],
  exports: [AdminGuard],
})
export class AdminModule {}
