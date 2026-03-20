import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'
import { Payment } from './entities/payment.entity'
import { Order } from '../orders/entities/order.entity'
import { MailModule } from '../mail/mail.module'
import { ProductionJobsModule } from '../production-jobs/production-jobs.module'
import { NotificationModule } from '../notifications/notification.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Order]),
    MailModule,
    ProductionJobsModule,
    NotificationModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
