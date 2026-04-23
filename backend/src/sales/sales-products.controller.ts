import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { SalesProductsService } from './sales-products.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller()
export class SalesProductsController {
  constructor(private svc: SalesProductsService) {}

  /** Sales agent adopts a product into their storefront. */
  @Post('products/:id/adopt')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('sales', 'admin', 'superadmin')
  adopt(
    @Param('id') productId: string,
    @Body() body: { rate?: number; note?: string },
    @Req() req: any,
  ) {
    return this.svc.adopt(req.user.id, productId, {
      rate: body?.rate,
      note: body?.note,
    })
  }

  /** Sales agent removes a product from their storefront. */
  @Delete('products/:id/adopt')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('sales', 'admin', 'superadmin')
  unadopt(@Param('id') productId: string, @Req() req: any) {
    return this.svc.unadopt(req.user.id, productId)
  }

  /**
   * Has the current sales agent adopted this product?
   * Used by ProductCard to render the adopt-toggle in the right state.
   */
  @Get('products/:id/adopt/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('sales', 'admin', 'superadmin')
  hasAdopted(@Param('id') productId: string, @Req() req: any) {
    return this.svc.hasAdopted(req.user.id, productId)
  }

  /** Sales agent's own storefront listing. */
  @Get('sales/me/storefront')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('sales', 'admin', 'superadmin')
  myStorefront(@Req() req: any) {
    return this.svc.myStorefront(req.user.id)
  }

  /**
   * Public storefront — viewed by customers via /s/{code}.
   * No auth so unregistered visitors can browse and add to cart.
   */
  @Get('sales/storefront/:code')
  publicStorefront(@Param('code') code: string) {
    return this.svc.storefrontByCode(code)
  }

  /** Agent's referred customers with lifetime-value aggregates. */
  @Get('sales/me/customers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('sales', 'admin', 'superadmin')
  myCustomers(@Req() req: any) {
    return this.svc.myCustomers(req.user.id)
  }

  /** Quotes from customers this agent referred. */
  @Get('sales/me/quotes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('sales', 'admin', 'superadmin')
  myQuotes(@Req() req: any) {
    return this.svc.myQuotes(req.user.id)
  }

  /** Orders attributed to this agent, enriched with commission status. */
  @Get('sales/me/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('sales', 'admin', 'superadmin')
  myOrders(@Req() req: any) {
    return this.svc.myOrders(req.user.id)
  }
}
