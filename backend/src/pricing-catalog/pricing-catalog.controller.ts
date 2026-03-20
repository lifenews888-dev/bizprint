import { Body, Controller, Post } from '@nestjs/common'
import { PricingCatalogService } from './pricing-catalog.service'
import { QuoteRequest, QuoteResponse } from './pricing-catalog.interfaces'

@Controller('pricing-catalog')
export class PricingCatalogController {
  constructor(private readonly svc: PricingCatalogService) {}

  @Post('quote')
  quote(@Body() body: QuoteRequest): QuoteResponse {
    return this.svc.quote(body)
  }
}
