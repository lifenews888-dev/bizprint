import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { SubscriptionAddon } from './entities/subscription-addon.entity';
import { UserAddon } from './entities/user-addon.entity';
import { ProductPricing } from './entities/product-pricing.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private subRepo: Repository<UserSubscription>,
    @InjectRepository(SubscriptionAddon)
    private addonRepo: Repository<SubscriptionAddon>,
    @InjectRepository(UserAddon)
    private userAddonRepo: Repository<UserAddon>,
    @InjectRepository(ProductPricing)
    private pricingRepo: Repository<ProductPricing>,
  ) {}

  // ════════════════════════════════════
  //  PLANS
  // ════════════════════════════════════

  async getPlans() {
    return this.planRepo.find({
      where: { is_active: true },
      order: { sort_order: 'ASC' },
    });
  }

  /** Admin: all plans including inactive */
  async getAllPlans() {
    return this.planRepo.find({ order: { sort_order: 'ASC' } });
  }

  async getPlan(id: string) {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Багц олдсонгүй');
    return plan;
  }

  async createPlan(dto: Partial<SubscriptionPlan>) {
    return this.planRepo.save(this.planRepo.create(dto));
  }

  async updatePlan(id: string, dto: Partial<SubscriptionPlan>) {
    await this.planRepo.update(id, dto);
    return this.planRepo.findOne({ where: { id } });
  }

  async togglePlan(id: string) {
    const plan = await this.getPlan(id);
    plan.is_active = !plan.is_active;
    return this.planRepo.save(plan);
  }

  // ════════════════════════════════════
  //  USER SUBSCRIPTIONS
  // ════════════════════════════════════

  async getCurrentSubscription(userId: string) {
    const sub = await this.subRepo.findOne({
      where: { user_id: userId, status: 'active' as any },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });
    if (!sub) {
      // Return free tier info
      const freePlan = await this.planRepo.findOne({ where: { tier: 'free' as any } });
      return { plan: freePlan, status: 'free', is_free: true };
    }
    const days_left = Math.max(0, Math.ceil((sub.expires_at.getTime() - Date.now()) / 86400000));
    return { ...sub, days_left, is_free: false };
  }

  async subscribe(userId: string, planId: string, billingCycle: 'monthly' | 'yearly', paymentId?: string) {
    const plan = await this.getPlan(planId);

    // Cancel existing active subscription
    await this.subRepo.update(
      { user_id: userId, status: 'active' as any },
      { status: 'cancelled' as any, cancelled_at: new Date() },
    );

    const now = new Date();
    const durationMs = billingCycle === 'yearly' ? 365 * 86400000 : 30 * 86400000;
    const amount = billingCycle === 'yearly' ? Number(plan.price_yearly) : Number(plan.price_monthly);

    const sub = this.subRepo.create({
      user_id: userId,
      plan_id: planId,
      status: 'active',
      billing_cycle: billingCycle,
      amount_paid: amount,
      starts_at: now,
      expires_at: new Date(now.getTime() + durationMs),
      payment_id: paymentId,
    });
    return this.subRepo.save(sub);
  }

  async cancel(userId: string, reason?: string) {
    const sub = await this.subRepo.findOne({
      where: { user_id: userId, status: 'active' as any },
    });
    if (!sub) throw new BadRequestException('Идэвхтэй эрх олдсонгүй');
    sub.status = 'cancelled';
    sub.cancelled_at = new Date();
    sub.cancel_reason = reason;
    sub.auto_renew = false;
    return this.subRepo.save(sub);
  }

  async renew(userId: string, paymentId?: string) {
    const sub = await this.subRepo.findOne({
      where: { user_id: userId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });
    if (!sub) throw new BadRequestException('Эрх олдсонгүй');

    const now = new Date();
    const startFrom = sub.expires_at > now ? sub.expires_at : now;
    const durationMs = sub.billing_cycle === 'yearly' ? 365 * 86400000 : 30 * 86400000;
    const amount = sub.billing_cycle === 'yearly' ? Number(sub.plan.price_yearly) : Number(sub.plan.price_monthly);

    sub.status = 'active';
    sub.starts_at = startFrom;
    sub.expires_at = new Date(startFrom.getTime() + durationMs);
    sub.amount_paid = amount;
    sub.payment_id = paymentId;
    sub.renewal_count += 1;
    sub.cancelled_at = null;
    return this.subRepo.save(sub);
  }

  // ════════════════════════════════════
  //  FEATURE GATING
  // ════════════════════════════════════

  async getUserLimits(userId: string) {
    const sub = await this.getCurrentSubscription(userId);
    const plan = sub.plan || (sub as any);
    if (!plan) {
      return {
        tier: 'free', max_digital_cards: 1, max_invitations: 0,
        max_product_qrs: 0, max_qr_codes: 5, max_storage_mb: 50,
        max_loyalty_campaigns: 0,
        custom_domain: false, remove_branding: false, advanced_analytics: false,
        ai_content_generation: false, loyalty_enabled: false, qr_campaign_enabled: false,
      };
    }
    return {
      tier: plan.tier,
      max_digital_cards: plan.max_digital_cards,
      max_invitations: plan.max_invitations,
      max_product_qrs: plan.max_product_qrs,
      max_qr_codes: plan.max_qr_codes,
      max_storage_mb: plan.max_storage_mb,
      max_loyalty_campaigns: plan.max_loyalty_campaigns ?? 0,
      custom_domain: plan.custom_domain,
      remove_branding: plan.remove_branding,
      advanced_analytics: plan.advanced_analytics,
      ai_content_generation: plan.ai_content_generation,
      loyalty_enabled: plan.loyalty_enabled ?? false,
      qr_campaign_enabled: plan.qr_campaign_enabled ?? false,
    };
  }

  async checkLimit(userId: string, feature: string, currentCount: number): Promise<boolean> {
    const limits = await this.getUserLimits(userId);
    const limitKey = `max_${feature}` as keyof typeof limits;
    const max = limits[limitKey];
    if (typeof max !== 'number') return true;
    return currentCount < max;
  }

  // ════════════════════════════════════
  //  AUTO-ASSIGN FREE PLAN
  // ════════════════════════════════════

  async autoAssignFree(userId: string) {
    // Check if user already has a subscription
    const existing = await this.subRepo.findOne({
      where: { user_id: userId, status: 'active' as any },
    });
    if (existing) return existing;

    const freePlan = await this.planRepo.findOne({ where: { tier: 'free' as any } });
    if (!freePlan) return null;

    const now = new Date();
    const sub = this.subRepo.create({
      user_id: userId,
      plan_id: freePlan.id,
      status: 'active',
      billing_cycle: 'monthly',
      amount_paid: 0,
      starts_at: now,
      expires_at: new Date(now.getTime() + 365 * 10 * 86400000), // 10 years for free
    });
    return this.subRepo.save(sub);
  }

  // ════════════════════════════════════
  //  ADD-ONS
  // ════════════════════════════════════

  async getAddons() {
    return this.addonRepo.find({
      where: { is_active: true },
      order: { sort_order: 'ASC' },
    });
  }

  async getUserAddons(userId: string) {
    return this.userAddonRepo.find({
      where: { user_id: userId, is_active: true },
      relations: ['addon'],
      order: { purchased_at: 'DESC' },
    });
  }

  async purchaseAddon(userId: string, addonId: string, paymentId?: string) {
    const addon = await this.addonRepo.findOne({ where: { id: addonId, is_active: true } });
    if (!addon) throw new NotFoundException('Нэмэлт олдсонгүй');

    // Get current subscription for linking
    const sub = await this.subRepo.findOne({
      where: { user_id: userId, status: 'active' as any },
      order: { created_at: 'DESC' },
    });

    const userAddon = this.userAddonRepo.create({
      user_id: userId,
      addon_id: addonId,
      subscription_id: sub?.id,
      payment_id: paymentId,
      is_active: true,
      // Expires when subscription expires, or null for permanent
      expires_at: sub?.expires_at || null,
    });
    return this.userAddonRepo.save(userAddon);
  }

  // ════════════════════════════════════
  // ════════════════════════════════════
  //  PRODUCT PRICING (admin-controlled)
  // ════════════════════════════════════

  async getProductPricing() {
    return this.pricingRepo.find({ order: { sort_order: 'ASC' } });
  }

  async getActiveProductPricing() {
    return this.pricingRepo.find({ where: { is_active: true }, order: { sort_order: 'ASC' } });
  }

  async getProductPricingBySlug(slug: string) {
    return this.pricingRepo.findOne({ where: { slug } });
  }

  async getProductPricingByType(productType: string) {
    return this.pricingRepo.find({ where: { product_type: productType as any, is_active: true }, order: { sort_order: 'ASC' } });
  }

  async createProductPricing(dto: Partial<ProductPricing>) {
    return this.pricingRepo.save(this.pricingRepo.create(dto));
  }

  async updateProductPricing(id: string, dto: Partial<ProductPricing>) {
    await this.pricingRepo.update(id, dto);
    return this.pricingRepo.findOne({ where: { id } });
  }

  async toggleProductPricing(id: string) {
    const p = await this.pricingRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Бүтээгдэхүүний үнэ олдсонгүй');
    p.is_active = !p.is_active;
    return this.pricingRepo.save(p);
  }

  //  ADMIN
  // ════════════════════════════════════

  async expireOverdue() {
    const result = await this.subRepo.update(
      { status: 'active' as any, expires_at: LessThan(new Date()) },
      { status: 'expired' as any },
    );
    return { expired: result.affected };
  }

  async getStats() {
    const totalActive = await this.subRepo.count({ where: { status: 'active' as any } });
    const totalRevenue = await this.subRepo.createQueryBuilder('s')
      .select('SUM(s.amount_paid)', 'sum')
      .getRawOne();
    const byPlan = await this.subRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.plan', 'plan')
      .select('plan.name', 'plan_name')
      .addSelect('COUNT(*)', 'count')
      .where('s.status = :status', { status: 'active' })
      .groupBy('plan.name')
      .getRawMany();
    return {
      totalActive,
      totalRevenue: Number(totalRevenue?.sum || 0),
      byPlan,
    };
  }

  async adminListSubscriptions(page = 1, limit = 20) {
    return this.subRepo.findAndCount({
      relations: ['user', 'plan'],
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
  }
}
