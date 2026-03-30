import {
  Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { UsageService } from './usage.service';
import { SubscriptionEventService } from './subscription-event.service';
import { SubscriptionRulesService } from './subscription-rules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class SubscriptionController {
  constructor(
    private readonly svc: SubscriptionService,
    private readonly usageSvc: UsageService,
    private readonly eventSvc: SubscriptionEventService,
    private readonly rulesSvc: SubscriptionRulesService,
  ) {}

  // ── Public ──
  @Get('subscription/plans')
  getPlans() {
    return this.svc.getPlans();
  }

  @Get('subscription/addons')
  getAddons() {
    return this.svc.getAddons();
  }

  @Get('subscription/product-pricing')
  getProductPricing() {
    return this.svc.getActiveProductPricing();
  }

  @Get('subscription/product-pricing/:slug')
  getProductPricingBySlug(@Param('slug') slug: string) {
    return this.svc.getProductPricingBySlug(slug);
  }

  // ── Customer ──
  @UseGuards(JwtAuthGuard)
  @Get('subscription/my')
  mySub(@Req() req) {
    return this.svc.getCurrentSubscription(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription/limits')
  myLimits(@Req() req) {
    return this.svc.getUserLimits(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription/usage')
  myUsage(@Req() req) {
    return this.usageSvc.getUserUsage(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription/overage')
  myOverage(@Req() req) {
    return this.usageSvc.getOverageCost(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription/events')
  myEvents(@Req() req, @Query('limit') limit?: number) {
    return this.eventSvc.getEventsForUser(req.user.id, limit || 20);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription/warnings')
  myWarnings(@Req() req) {
    return this.eventSvc.getUnresolvedWarnings(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription/suggestions')
  mySuggestions(@Req() req) {
    return this.rulesSvc.suggestUpgrade(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription/my-addons')
  myAddons(@Req() req) {
    return this.svc.getUserAddons(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscription/subscribe')
  subscribe(@Req() req, @Body() body: { plan_id: string; billing_cycle: 'monthly' | 'yearly'; payment_id?: string }) {
    return this.svc.subscribe(req.user.id, body.plan_id, body.billing_cycle, body.payment_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscription/cancel')
  cancel(@Req() req, @Body() body: { reason?: string }) {
    return this.svc.cancel(req.user.id, body.reason);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscription/renew')
  renew(@Req() req, @Body() body: { payment_id?: string }) {
    return this.svc.renew(req.user.id, body.payment_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscription/addons/purchase')
  purchaseAddon(@Req() req, @Body() body: { addon_id: string; payment_id?: string }) {
    return this.svc.purchaseAddon(req.user.id, body.addon_id, body.payment_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscription/evaluate-rules')
  evaluateRules(@Req() req) {
    return this.rulesSvc.evaluateRules(req.user.id);
  }

  // ── Admin ──
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('admin/subscriptions')
  adminList(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.svc.adminListSubscriptions(page, limit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('admin/subscriptions/stats')
  adminStats() {
    return this.svc.getStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Post('admin/subscriptions/expire-check')
  expireCheck() {
    return this.svc.expireOverdue();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('admin/subscription-plans')
  adminListPlans() {
    return this.svc.getAllPlans();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Post('admin/subscription-plans')
  createPlan(@Body() dto: any) {
    return this.svc.createPlan(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Patch('admin/subscription-plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updatePlan(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Post('admin/subscription-plans/:id/toggle')
  togglePlan(@Param('id') id: string) {
    return this.svc.togglePlan(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('admin/subscription-addons')
  adminListAddons() {
    return this.svc.getAddons();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Post('admin/subscriptions/evaluate-all')
  async evaluateAllRules() {
    return { message: 'Use per-user evaluation endpoint' };
  }

  // ── Product Pricing Admin ──
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('admin/product-pricing')
  adminProductPricing() {
    return this.svc.getProductPricing();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Post('admin/product-pricing')
  createProductPricing(@Body() dto: any) {
    return this.svc.createProductPricing(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Patch('admin/product-pricing/:id')
  updateProductPricing(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateProductPricing(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Post('admin/product-pricing/:id/toggle')
  toggleProductPricing(@Param('id') id: string) {
    return this.svc.toggleProductPricing(id);
  }
}
