import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { SalesProductsService } from './sales-products.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller()
export class SalesProductsController {
  constructor(private svc: SalesProductsService) {}

  /** Sales agent adopts a product into their storefront. */
  @Post('products/:id/adopt')
  @UseGuards(JwtAuthGuard)
  adopt(@Param('id') productId: string, @Body() body: { rate?: number; note?: string }, @Req() req: any) {
    return this.svc.adopt(req.user.id, productId, { rate: body?.rate, note: body?.note })
  }

  /** Sales agent removes a product from their storefront. */
  @Delete('products/:id/adopt')
  @UseGuards(JwtAuthGuard)
  unadopt(@Param('id') productId: string, @Req() req: any) {
    return this.svc.unadopt(req.user.id, productId)
  }

  /** Has the current sales agent adopted this product? Used by ProductCard
      to render the adopt-toggle in the right state. */
  @Get('products/:id/adopt/me')
  @UseGuards(JwtAuthGuard)
  hasAdopted(@Param('id') productId: string, @Req() req: any) {
    return this.svc.hasAdopted(req.user.id, productId)
  }

  /** Sales agent's own storefront listing. */
  @Get('sales/me/storefront')
  @UseGuards(JwtAuthGuard)
  myStorefront(@Req() req: any) {
    return this.svc.myStorefront(req.user.id)
  }

  /** Public storefront — viewed by customers via /s/{code}. No auth so
      unregistered visitors can browse and add to cart. */
  @Get('sales/storefront/:code')
  publicStorefront(@Param('code') code: string) {
    return this.svc.storefrontByCode(code)
  }
}
