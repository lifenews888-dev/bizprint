import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './order.controller';
import { OrdersService } from './order.service';
import { Order } from './entities/order.entity';
import { AuditTrail } from '../audit-trail/audit-trail.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, AuditTrail]),
    MailModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
