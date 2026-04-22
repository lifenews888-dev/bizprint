import { Controller, Get, Post, Delete, Body, Param, UseGuards, UseInterceptors, Req, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { LessThan, Repository, In } from 'typeorm'
import { CartService } from './cart.service'
import { Cart, CartStatus } from './cart.entity'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { IdempotencyInterceptor } from '../common/interceptors/idempotency.interceptor'

@Controller('cart')
export class CartController {
  private readonly logger = new Logger(CartController.name)

  constructor(
    private readonly cartService: CartService,
    @InjectRepository(Cart) private readonly cartRepo: Repository<Cart>,
  ) {}

  // Daily at 03:00: mark active carts that have been idle for 14 days as
  // ABANDONED and active carts older than 30 days as EXPIRED. Keeps the
  // unique-active-cart-per-customer index from blocking re-checkout and
  // gives marketing a clean signal for abandoned-cart emails later.
  @Cron('0 3 * * *')
  async expireIdleCarts() {
    const abandonAt = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    const expireAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const expired = await this.cartRepo.update(
      { status: CartStatus.ACTIVE, updated_at: LessThan(expireAt) },
      { status: CartStatus.EXPIRED },
    )
    const abandoned = await this.cartRepo.update(
      { status: In([CartStatus.ACTIVE]), updated_at: LessThan(abandonAt) },
      { status: CartStatus.ABANDONED },
    )
    if ((expired.affected || 0) + (abandoned.affected || 0) > 0) {
      this.logger.log(`Cart cleanup: ${expired.affected || 0} expired, ${abandoned.affected || 0} abandoned`)
    }
  }

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
