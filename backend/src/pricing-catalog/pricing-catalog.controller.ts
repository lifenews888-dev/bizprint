import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { PricingCatalogService } from './pricing-catalog.service'
import { QuoteRequest, QuoteResponse, PricingItem } from './pricing-catalog.interfaces'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('pricing-catalog')
export class PricingCatalogController {
  constructor(private readonly svc: PricingCatalogService) {}

  /** Calculate a quote for any catalog item */
  @Post('quote')
  quote(@Body() body: QuoteRequest): QuoteResponse {
    return this.svc.quote(body)
  }

  /** List all catalog items, optionally filtered by category */
  @Get('items')
  items(@Query('category') category?: string): PricingItem[] {
    return this.svc.listItems(category)
  }

  /** List all distinct categories */
  @Get('categories')
  categories() {
    return this.svc.listCategories()
  }

  /** Force-reload catalog.manual.json from disk (admin only) */
  @Post('reload')
  @UseGuards(JwtAuthGuard)
  reload() {
    return this.svc.reloadCatalog()
  }
}
