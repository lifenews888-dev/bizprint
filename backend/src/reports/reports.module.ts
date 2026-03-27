import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Order } from '../orders/entities/order.entity';
import { OrderProfit } from '../orders/entities/order-profit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderProfit])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
