import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common'
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
  getCompetitors() {
    return this.service.findAllCompetitorPrices()
  }

  @Post('competitors')
  @UseGuards(JwtAuthGuard, AdminGuard)
  saveCompetitor(@Body() body: any) {
    return this.service.saveCompetitorPrice(body)
  }

  @Post('seed')
  @UseGuards(JwtAuthGuard, AdminGuard)
  seed() {
    return this.service.seed()
  }
}
