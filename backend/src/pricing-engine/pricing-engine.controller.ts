import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { PricingEngineService } from './pricing-engine.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGuard } from '../admin/admin.guard'

@Controller('pricing-engine')
export class PricingEngineController {
  constructor(private service: PricingEngineService) {}

  @Post('calculate')
  calculate(@Body() body: any) {
    return this.service.calculate(body)
  }

  @Post('simulate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  simulate(@Body() body: any) {
    return this.service.simulate(body)
  }

  @Get('rules')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getRules() {
    return this.service.findAllRules()
  }

  @Post('rules')
  @UseGuards(JwtAuthGuard, AdminGuard)
  createRule(@Body() body: any) {
    return this.service.createRule(body)
  }

  @Put('rules/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateRule(@Param('id') id: string, @Body() body: any) {
    return this.service.updateRule(id, body)
  }

  @Get('tiers')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getTiers() {
    return this.service.findAllTiers()
  }

  @Put('tiers/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateTier(@Param('id') id: string, @Body() body: any) {
    return this.service.updateTier(id, body)
  }

  @Get('competitors')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getCompetitors(
    @Query('product_type') productType?: string,
    @Query('product_subtype') productSubtype?: string,
    @Query('is_active') isActive?: string,
  ) {
    return this.service.findAllCompetitorPrices({
      product_type: productType,
      product_subtype: productSubtype,
      is_active: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    })
  }

  @Post('competitors')
  @UseGuards(JwtAuthGuard, AdminGuard)
  saveCompetitor(@Body() body: any) {
    return this.service.saveCompetitorPrice(body)
  }

  @Put('competitors/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateCompetitor(@Param('id') id: string, @Body() body: any) {
    return this.service.updateCompetitorPrice(id, body)
  }

  @Delete('competitors/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  deleteCompetitor(@Param('id') id: string) {
    return this.service.deleteCompetitorPrice(id)
  }

  // Public endpoint — no auth required
  @Get('market-analysis')
  getMarketAnalysis(
    @Query('product_type') productType: string,
    @Query('product_subtype') productSubtype?: string,
    @Query('size') size?: string,
    @Query('gsm') gsm?: string,
    @Query('quantity') quantity?: string,
  ) {
    return this.service.getMarketAnalysis({
      product_type: productType,
      product_subtype: productSubtype,
      size: size || undefined,
      gsm: gsm ? Number(gsm) : undefined,
      quantity: quantity ? Number(quantity) : undefined,
    })
  }

  @Post('seed')
  @UseGuards(JwtAuthGuard, AdminGuard)
  seed() {
    return this.service.seed()
  }
}
