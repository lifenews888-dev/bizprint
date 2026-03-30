import { Injectable } from '@nestjs/common';
import { UsageService, UsageReport } from './usage.service';
import { SubscriptionService } from './subscription.service';
import { SubscriptionEventService } from './subscription-event.service';

interface RuleContext {
  userId: string;
  usage: UsageReport;
  subscription: any;
}

interface SubscriptionRule {
  name: string;
  condition: (ctx: RuleContext) => boolean;
  action: (ctx: RuleContext, eventService: SubscriptionEventService) => Promise<void>;
}

const RULES: SubscriptionRule[] = [
  // Rule 1: 80% usage warning for any feature
  {
    name: 'usage_80_percent_warning',
    condition: (ctx) => {
      return Object.values(ctx.usage).some(
        (f) => f.status === 'warning' && f.effective_max > 0,
      );
    },
    action: async (ctx, eventService) => {
      for (const [key, f] of Object.entries(ctx.usage)) {
        if (f.status === 'warning' && f.effective_max > 0) {
          const hasRecent = await eventService.hasRecentEvent(ctx.userId, 'usage_threshold_reached', key, 24);
          if (!hasRecent) {
            await eventService.logEvent({
              user_id: ctx.userId,
              event_type: 'usage_threshold_reached',
              severity: 'warning',
              message: `${key}: ${f.current}/${f.effective_max} (${f.percentage}%)`,
              metadata: { feature_key: key, current: f.current, max: f.effective_max, percentage: f.percentage },
            });
          }
        }
      }
    },
  },

  // Rule 2: Limit exceeded for any feature
  {
    name: 'limit_exceeded',
    condition: (ctx) => {
      return Object.values(ctx.usage).some(
        (f) => f.status === 'exceeded' && f.effective_max > 0,
      );
    },
    action: async (ctx, eventService) => {
      for (const [key, f] of Object.entries(ctx.usage)) {
        if (f.status === 'exceeded' && f.effective_max > 0) {
          const hasRecent = await eventService.hasRecentEvent(ctx.userId, 'limit_exceeded', key, 1);
          if (!hasRecent) {
            await eventService.logEvent({
              user_id: ctx.userId,
              event_type: 'limit_exceeded',
              severity: 'critical',
              message: `${key}: ${f.current}/${f.effective_max} хэтэрсэн`,
              metadata: { feature_key: key, current: f.current, max: f.effective_max, percentage: f.percentage },
            });
          }
        }
      }
    },
  },

  // Rule 3: Expired subscription
  {
    name: 'subscription_expired',
    condition: (ctx) => {
      return ctx.subscription?.status === 'expired' || (
        !ctx.subscription?.is_free &&
        ctx.subscription?.expires_at &&
        new Date(ctx.subscription.expires_at) < new Date()
      );
    },
    action: async (ctx, eventService) => {
      const hasRecent = await eventService.hasRecentEvent(ctx.userId, 'subscription_expired', 'subscription', 24);
      if (!hasRecent) {
        await eventService.logEvent({
          user_id: ctx.userId,
          event_type: 'subscription_expired',
          severity: 'critical',
          metadata: { plan: ctx.subscription?.plan?.name },
        });
      }
    },
  },

  // Rule 4: Past due grace period
  {
    name: 'past_due_warning',
    condition: (ctx) => ctx.subscription?.status === 'past_due',
    action: async (ctx, eventService) => {
      const hasRecent = await eventService.hasRecentEvent(ctx.userId, 'payment_failed', 'subscription', 24);
      if (!hasRecent) {
        await eventService.logEvent({
          user_id: ctx.userId,
          event_type: 'payment_failed',
          severity: 'critical',
          message: 'Төлбөр хийгдээгүй. 7 хоногийн дотор төлбөр хийгдэхгүй бол эрх цуцлагдана.',
          metadata: { plan: ctx.subscription?.plan?.name },
        });
      }
    },
  },

  // Rule 5: Trial ending soon (3 days)
  {
    name: 'trial_ending_soon',
    condition: (ctx) => {
      if (!ctx.subscription?.is_trial) return false;
      const daysLeft = ctx.subscription.days_left ?? 999;
      return daysLeft <= 3 && daysLeft > 0;
    },
    action: async (ctx, eventService) => {
      const hasRecent = await eventService.hasRecentEvent(ctx.userId, 'usage_threshold_reached', 'trial', 24);
      if (!hasRecent) {
        await eventService.logEvent({
          user_id: ctx.userId,
          event_type: 'usage_threshold_reached',
          severity: 'warning',
          title: 'Туршилтын хугацаа дуусаж байна',
          message: `${ctx.subscription.days_left} өдөр үлдсэн`,
          metadata: { feature_key: 'trial', days_left: ctx.subscription.days_left },
        });
      }
    },
  },
];

@Injectable()
export class SubscriptionRulesService {
  constructor(
    private usageService: UsageService,
    private subService: SubscriptionService,
    private eventService: SubscriptionEventService,
  ) {}

  async evaluateRules(userId: string): Promise<{ triggered: string[] }> {
    const [usage, subscription] = await Promise.all([
      this.usageService.getUserUsage(userId),
      this.subService.getCurrentSubscription(userId),
    ]);

    const ctx: RuleContext = { userId, usage, subscription };
    const triggered: string[] = [];

    for (const rule of RULES) {
      try {
        if (rule.condition(ctx)) {
          await rule.action(ctx, this.eventService);
          triggered.push(rule.name);
        }
      } catch {
        // Rule failed silently — don't break other rules
      }
    }

    return { triggered };
  }

  /** Suggest upgrade based on usage patterns */
  async suggestUpgrade(userId: string) {
    const [usage, subscription, plans] = await Promise.all([
      this.usageService.getUserUsage(userId),
      this.subService.getCurrentSubscription(userId),
      this.subService.getPlans(),
    ]);

    const currentTier = subscription?.plan?.tier || 'free';
    const tierOrder = ['free', 'pro', 'business', 'enterprise'];
    const currentIdx = tierOrder.indexOf(currentTier);

    // Find features at 80%+
    const nearLimit: { key: string; current: number; max: number; percentage: number }[] = [];
    for (const [key, f] of Object.entries(usage)) {
      if (f.percentage >= 80 && f.effective_max > 0) {
        nearLimit.push({ key, current: f.current, max: f.effective_max, percentage: f.percentage });
      }
    }

    if (nearLimit.length === 0) {
      return { should_upgrade: false, reason: null, suggested_plan: null, near_limit: [] };
    }

    // Find next tier plan
    const nextPlan = plans.find((p: any) => {
      const idx = tierOrder.indexOf(p.tier);
      return idx > currentIdx;
    });

    // Build reason message
    const featureNames = nearLimit.map(f => {
      const labels: Record<string, string> = {
        qr_codes: 'QR код',
        invitations: 'Урилга',
        product_qrs: 'Бүтээгдэхүүн QR',
        digital_cards: 'Дижитал карт',
      };
      return labels[f.key] || f.key;
    });

    return {
      should_upgrade: true,
      reason: `${featureNames.join(', ')} хязгаарт ойрхон байна`,
      suggested_plan: nextPlan || null,
      near_limit: nearLimit,
      current_tier: currentTier,
    };
  }
}
