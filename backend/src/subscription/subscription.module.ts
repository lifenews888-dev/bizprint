import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { UsageService } from './usage.service';
import { SubscriptionEventService } from './subscription-event.service';
import { SubscriptionRulesService } from './subscription-rules.service';
import { SubscriptionGuard } from './guards/subscription.guard';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { SubscriptionAddon } from './entities/subscription-addon.entity';
import { UserAddon } from './entities/user-addon.entity';
import { UsageLog } from './entities/usage-log.entity';
import { SubscriptionEvent } from './entities/subscription-event.entity';
import { ProductPricing } from './entities/product-pricing.entity';
// Import entities from other modules for count queries (avoids circular module deps)
import { ProductQr } from '../product-qr/entities/product-qr.entity';
import { Invitation } from '../invitation/entities/invitation.entity';
import { DigitalCard } from '../digital-card/entities/digital-card.entity';
import { LoyaltyProgram } from '../loyalty/entities/loyalty-program.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlan,
      UserSubscription,
      SubscriptionAddon,
      UserAddon,
      UsageLog,
      SubscriptionEvent,
      ProductPricing,
      // External entities for usage counting
      ProductQr,
      Invitation,
      DigitalCard,
      LoyaltyProgram,
    ]),
  ],
  controllers: [SubscriptionController],
  providers: [
    SubscriptionService,
    UsageService,
    SubscriptionEventService,
    SubscriptionRulesService,
    SubscriptionGuard,
  ],
  exports: [SubscriptionService, UsageService, SubscriptionEventService, SubscriptionGuard],
})
export class SubscriptionModule {}
