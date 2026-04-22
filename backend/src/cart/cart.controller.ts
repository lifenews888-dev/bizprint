import { Controller, Get, Post, Delete, Body, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common'
import { CartService } from './cart.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { IdempotencyInterceptor } from '../common/interceptors/idempotency.interceptor'

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getCart(@Req() req: any) {
    return this.cartService.getCart(req.user.id)
  }

  /** POST /cart/items — Add item to cart */
  @Post('items')
  @UseGuards(JwtAuthGuard)
  addItem(@Req() req: any, @Body() body: { product_id: string; quantity: number; specs?: Record<string, any> }) {
    return this.cartService.addItem(req.user.id, body)
  }

  /** DELETE /cart/items/:id — Remove item from cart */
  @Delete('items/:id')
  @UseGuards(JwtAuthGuard)
  removeItem(@Param('id') id: string) {
    return this.cartService.removeItem(id)
  }

  /** POST /cart/quote — Generate quote from cart */
  @Post('quote')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(IdempotencyInterceptor)
  generateQuote(@Req() req: any) {
    return this.cartService.generateQuote(req.user.id)
  }

  /** POST /cart/quote/confirm — Convert quote to order (DRAFT) */
  @Post('quote/confirm')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(IdempotencyInterceptor)
  confirmQuote(@Req() req: any, @Body() body: { quotation_id: string; payment_method?: string }) {
    return this.cartService.confirmQuote(req.user.id, body.quotation_id, body.payment_method)
  }
}
