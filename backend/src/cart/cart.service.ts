import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Cart } from './cart.entity'
import { CartItem } from './entities/cart-item.entity'

@Injectable()
export class CartService {

  constructor(
    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,

    @InjectRepository(CartItem)
    private itemRepo: Repository<CartItem>,
  ) {}

  async getCart(userId: string) {
    return this.cartRepo.findOne({
      where: { customer_id: userId },
      relations: ['items'],
    })
  }

  async addItem(userId: string, data: any) {

    let cart = await this.cartRepo.findOne({
      where: { customer_id: userId }
    })

    if (!cart) {
      cart = await this.cartRepo.save({
        customer_id: userId
      })
    }

    const item = this.itemRepo.create({
      product_id: data.product_id,
      quantity: data.quantity,
      cart: cart
    })

    return this.itemRepo.save(item)
  }

  async removeItem(id: string) {
    return this.itemRepo.delete(id)
  }

}