import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SalesProduct } from './sales-product.entity'
import { Product } from '../products/product.entity'
import { User } from '../users/user.entity'
import { Referral } from '../referral/referral.entity'
import { Order } from '../orders/entities/order.entity'
import { Quotation } from '../quote/entities/quotation.entity'
import { SalesCommission } from '../commission/sales-commission.entity'
import { SalesProductsService } from './sales-products.service'
import { SalesProductsController } from './sales-products.controller'

@Module({
  imports: [TypeOrmModule.forFeature([SalesProduct, Product, User, Referral, Order, Quotation, SalesCommission])],
  controllers: [SalesProductsController],
  providers: [SalesProductsService],
  exports: [SalesProductsService],
})
export class SalesModule {}
