import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Cart } from './cart.entity'
import { CartItem } from './entities/cart-item.entity'

import { CartService } from './cart.service'
import { CartController } from './cart.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem])],
  providers: [CartService],
  controllers: [CartController],
})
export class CartModule {}