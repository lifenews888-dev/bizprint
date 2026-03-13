import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Order } from './order.entity'
import { OrdersService } from './orders.service'
import { OrdersController } from './orders.controller'
import { CartModule } from './cart.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), CartModule],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}