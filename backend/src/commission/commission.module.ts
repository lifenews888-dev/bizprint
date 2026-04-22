import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionLog } from './commission.entity';
import { SalesCommission } from './sales-commission.entity';
import { CommissionService } from './commission.service';
import { CommissionController } from './commission.controller';
import { Vendor } from '../vendors/vendor.entity';
import { OrderVendorGroup } from '../orders/entities/order-vendor-group.entity';
import { Order } from '../orders/entities/order.entity';
import { Referral } from '../referral/referral.entity';
import { MailModule } from '../mail/mail.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommissionLog, SalesCommission, Vendor, OrderVendorGroup, Order, Referral]),
    MailModule,
    WalletModule,
    NotificationModule,
  ],
  controllers: [CommissionController],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
