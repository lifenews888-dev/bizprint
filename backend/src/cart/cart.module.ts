import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Cart } from './cart.entity'
import { CartItem } from './entities/cart-item.entity'
import { Quotation } from '../quote/entities/quotation.entity'
import { QuotationItem } from '../quote/entities/quotation-item.entity'
import { Order } from '../orders/entities/order.entity'
import { OrderItem } from '../orders/entities/order-item.entity'
import { OrderVendorGroup } from '../orders/entities/order-vendor-group.entity'
import { Product } from '../products/product.entity'

import { CartService } from './cart.service'
import { CartController } from './cart.controller'
import { QuoteModule } from '../quote/quote.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cart, CartItem,
      Quotation, QuotationItem,
      Order, OrderItem, OrderVendorGroup,
      Product,
    ]),
    QuoteModule,
  ],
  providers: [CartService],
  controllers: [CartController],
})
export class CartModule {}
