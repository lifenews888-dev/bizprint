import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from '../subscription.service';
import { UsageService } from '../usage.service';
import {
  REQUIRE_SUBSCRIPTION_KEY,
  REQUIRE_FEATURE_KEY,
  REQUIRE_LIMIT_KEY,
} from '../decorators/subscription.decorator';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subService: SubscriptionService,
    private usageService: UsageService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireSub = this.reflector.getAllAndOverride<boolean>(REQUIRE_SUBSCRIPTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requireFeature = this.reflector.getAllAndOverride<string>(REQUIRE_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requireLimit = this.reflector.getAllAndOverride<string>(REQUIRE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No subscription requirements on this route
    if (!requireSub && !requireFeature && !requireLimit) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) throw new ForbiddenException('Нэвтэрнэ үү');

    const subscription = await this.subService.getCurrentSubscription(userId);

    // Check active subscription
    if (requireSub) {
      const status = subscription?.status || (subscription as any)?.is_free ? 'free' : 'none';
      if (!['active', 'trial', 'free'].includes(status) && !(subscription as any)?.is_free) {
        throw new ForbiddenException({
          message: 'Идэвхтэй эрх шаардлагатай',
          code: 'SUBSCRIPTION_REQUIRED',
        });
      }
    }

    // Check boolean feature
    if (requireFeature) {
      const limits = await this.subService.getUserLimits(userId);
      const featureValue = (limits as any)[requireFeature];
      if (!featureValue) {
        throw new ForbiddenException({
          message: `Энэ функц таны багцад ороогүй байна. Багцаа шинэчилнэ үү.`,
          code: 'FEATURE_NOT_AVAILABLE',
          feature: requireFeature,
        });
      }
    }

    // Check usage limit (this will throw if exceeded)
    if (requireLimit) {
      await this.usageService.checkAndEnforce(userId, requireLimit);
    }

    return true;
  }
}
