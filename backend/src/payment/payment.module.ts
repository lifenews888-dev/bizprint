import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'
import { QPayService } from './qpay.service'
import { BonumService } from './bonum.service'
import { Payment } from './entities/payment.entity'
import { Invoice } from './entities/invoice.entity'
import { PaymentLog } from './payment-log.entity'
import { Order } from '../orders/entities/order.entity'
import { MailModule } from '../mail/mail.module'
import { ProductionJobsModule } from '../production-jobs/production-jobs.module'
import { NotificationModule } from '../notifications/notification.module'
import { WalletModule } from '../wallet/wallet.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Invoice, Order, PaymentLog]),
    MailModule,
    ProductionJobsModule,
    NotificationModule,
    WalletModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, QPayService, BonumService],
  exports: [PaymentService, QPayService, BonumService],
})
export class PaymentModule {}
