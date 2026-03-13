import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common'
import { CartService } from './cart.service'

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  getCart(@Param('userId') userId: string) {
    return this.cartService.getCart(userId)
  }

  @Post('items')
  addItem(@Body() body: any) {
    return this.cartService.addItem(body.userId, body)
  }

  @Delete('items/:id')
  removeItem(@Param('id') id: string) {
    return this.cartService.removeItem(id)
  }
}