import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './order.controller';
import { OrdersService } from './order.service';
import { OrdersGateway } from './orders.gateway';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderVendorGroup } from './entities/order-vendor-group.entity';
import { AuditTrail } from '../audit-trail/audit-trail.entity';
import { MailModule } from '../mail/mail.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderVendorGroup, AuditTrail]),
    MailModule,
    NotificationModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersGateway],
  exports: [OrdersService],
})
export class OrdersModule {}
