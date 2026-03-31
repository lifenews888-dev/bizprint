import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan } from 'typeorm';
import { ProductQr } from '../product-qr/entities/product-qr.entity';
import { Invitation } from '../invitation/entities/invitation.entity';
import { DigitalCard } from '../digital-card/entities/digital-card.entity';
import { LoyaltyProgram } from '../loyalty/entities/loyalty-program.entity';
import { UsageLog } from './entities/usage-log.entity';
import { UserAddon } from './entities/user-addon.entity';
import { SubscriptionService } from './subscription.service';
import { SubscriptionEventService } from './subscription-event.service';

export interface FeatureUsage {
  current: number;
  max: number;
  addon_bonus: number;
  effective_max: number;
  percentage: number;
  status: 'ok' | 'warning' | 'exceeded';
}

export interface UsageReport {
  qr_codes: FeatureUsage;
  invitations: FeatureUsage;
  product_qrs: FeatureUsage;
  digital_cards: FeatureUsage;
  loyalty_campaigns: FeatureUsage;
}

const FEATURE_LABELS: Record<string, string> = {
  qr_codes: 'QR код',
  invitations: 'Урилга',
  product_qrs: 'Бүтээгдэхүүн QR',
  digital_cards: 'Дижитал карт',
  loyalty_campaigns: 'Loyalty кампанит',
};

@Injectable()
export class UsageService {
  constructor(
    @InjectRepository(ProductQr)
    private qrRepo: Repository<ProductQr>,
    @InjectRepository(Invitation)
    private invRepo: Repository<Invitation>,
    @InjectRepository(DigitalCard)
    private dcRepo: Repository<DigitalCard>,
    @InjectRepository(LoyaltyProgram)
    private loyaltyRepo: Repository<LoyaltyProgram>,
    @InjectRepository(UsageLog)
    private logRepo: Repository<UsageLog>,
    @InjectRepository(UserAddon)
    private userAddonRepo: Repository<UserAddon>,
    private subService: SubscriptionService,
    private eventService: SubscriptionEventService,
  ) {}

  // ════════════════════════════════════
  //  GET USAGE
  // ════════════════════════════════════

  async getUserUsage(userId: string): Promise<UsageReport> {
    const [limits, addonBonuses, counts] = await Promise.all([
      this.subService.getUserLimits(userId),
      this.getAddonBonuses(userId),
      this.getCounts(userId),
    ]);

    const build = (key: string, limitKey: string): FeatureUsage => {
      const max = (limits as any)[limitKey] || 0;
      const bonus = addonBonuses[key] || 0;
      const effectiveMax = max + bonus;
      const current = (counts as any)[key] || 0;
      const percentage = effectiveMax > 0 ? Math.round((current / effectiveMax) * 100) : (current > 0 ? 100 : 0);
      return {
        current,
        max,
        addon_bonus: bonus,
        effective_max: effectiveMax,
        percentage,
        status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'ok',
      };
    };

    return {
      qr_codes: build('qr_codes', 'max_qr_codes'),
      invitations: build('invitations', 'max_invitations'),
      product_qrs: build('product_qrs', 'max_product_qrs'),
      digital_cards: build('digital_cards', 'max_digital_cards'),
      loyalty_campaigns: build('loyalty_campaigns', 'max_loyalty_campaigns'),
    };
  }

  // ════════════════════════════════════
  //  CHECK AND ENFORCE LIMITS
  // ════════════════════════════════════

  async checkAndEnforce(userId: string, featureKey: string): Promise<{ allowed: boolean; current: number; max: number; percentage: number }> {
    const usage = await this.getUserUsage(userId);
    const feature = (usage as any)[featureKey] as FeatureUsage | undefined;
    if (!feature) return { allowed: true, current: 0, max: 999, percentage: 0 };

    // Hard limit exceeded
    if (feature.current >= feature.effective_max && feature.effective_max > 0) {
      // Log event if not recently logged
      const hasRecent = await this.eventService.hasRecentEvent(userId, 'limit_exceeded', featureKey, 1);
      if (!hasRecent) {
        await this.eventService.logEvent({
          user_id: userId,
          event_type: 'limit_exceeded',
          severity: 'critical',
          metadata: {
            feature_key: featureKey,
            current: feature.current,
            max: feature.effective_max,
            percentage: feature.percentage,
          },
        });
      }
      const label = FEATURE_LABELS[featureKey] || featureKey;
      throw new ForbiddenException({
        message: `${label} хязгаар хэтэрсэн (${feature.current}/${feature.effective_max}). Багцаа шинэчилнэ үү.`,
        code: 'SUBSCRIPTION_LIMIT_EXCEEDED',
        feature_key: featureKey,
        current: feature.current,
        max: feature.effective_max,
      });
    }

    // 80% threshold warning
    if (feature.percentage >= 80 && feature.status === 'warning') {
      const hasRecent = await this.eventService.hasRecentEvent(userId, 'usage_threshold_reached', featureKey, 24);
      if (!hasRecent) {
        await this.eventService.logEvent({
          user_id: userId,
          event_type: 'usage_threshold_reached',
          severity: 'warning',
          metadata: {
            feature_key: featureKey,
            current: feature.current,
            max: feature.effective_max,
            percentage: feature.percentage,
          },
        });
      }
    }

    return {
      allowed: true,
      current: feature.current,
      max: feature.effective_max,
      percentage: feature.percentage,
    };
  }

  // ════════════════════════════════════
  //  USAGE LOGGING
  // ════════════════════════════════════

  async logUsage(userId: string, featureKey: string, action: 'create' | 'delete', entityId?: string) {
    const counts = await this.getCounts(userId);
    const countAfter = (counts as any)[featureKey] || 0;
    return this.logRepo.save(this.logRepo.create({
      user_id: userId,
      feature_key: featureKey,
      action,
      entity_id: entityId,
      count_after: countAfter,
    }));
  }

  // ════════════════════════════════════
  //  OVERAGE CALCULATION
  // ════════════════════════════════════

  async getOverageCost(userId: string): Promise<{ feature_key: string; overage: number; cost: number }[]> {
    const usage = await this.getUserUsage(userId);
    const overages: { feature_key: string; overage: number; cost: number }[] = [];
    // Per-unit overage prices in MNT
    const OVERAGE_PRICES: Record<string, number> = {
      qr_codes: 200,
      invitations: 500,
      product_qrs: 300,
      digital_cards: 1000,
    };

    for (const [key, data] of Object.entries(usage)) {
      if (data.current > data.effective_max && data.effective_max > 0) {
        const overage = data.current - data.effective_max;
        overages.push({
          feature_key: key,
          overage,
          cost: overage * (OVERAGE_PRICES[key] || 0),
        });
      }
    }
    return overages;
  }

  // ════════════════════════════════════
  //  PRIVATE HELPERS
  // ════════════════════════════════════

  private async getCounts(userId: string) {
    const [product_qr_count, invitations, digital_cards, loyalty_campaigns] = await Promise.all([
      this.qrRepo.count({ where: { user_id: userId } }),
      this.invRepo.count({ where: { user_id: userId } }),
      this.dcRepo.count({ where: { user_id: userId } }),
      this.loyaltyRepo.count({ where: { vendor_id: userId } }),
    ]);
    // qr_codes and product_qrs both map to the same product_qrs table
    return { qr_codes: product_qr_count, invitations, product_qrs: product_qr_count, digital_cards, loyalty_campaigns };
  }

  private async getAddonBonuses(userId: string): Promise<Record<string, number>> {
    const addons = await this.userAddonRepo.find({
      where: { user_id: userId, is_active: true },
      relations: ['addon'],
    });
    const bonuses: Record<string, number> = {};
    for (const ua of addons) {
      // Skip expired add-ons
      if (ua.expires_at && ua.expires_at < new Date()) continue;
      const key = ua.addon?.feature_key;
      if (key) {
        bonuses[key] = (bonuses[key] || 0) + (ua.addon.bonus_amount || 0);
      }
    }
    return bonuses;
  }
}
