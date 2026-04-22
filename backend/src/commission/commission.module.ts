import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionLog } from './commission.entity';
import { CommissionService } from './commission.service';
import { CommissionController } from './commission.controller';
import { Vendor } from '../vendors/vendor.entity';
import { OrderVendorGroup } from '../orders/entities/order-vendor-group.entity';
import { Order } from '../orders/entities/order.entity';
import { MailModule } from '../mail/mail.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [TypeOrmModule.forFeature([CommissionLog, Vendor, OrderVendorGroup, Order]), MailModule, WalletModule],
  controllers: [CommissionController],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
