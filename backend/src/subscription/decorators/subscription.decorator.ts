import { SetMetadata } from '@nestjs/common';

export const REQUIRE_SUBSCRIPTION_KEY = 'requireSubscription';
export const REQUIRE_FEATURE_KEY = 'requireFeature';
export const REQUIRE_LIMIT_KEY = 'requireLimit';

/** Route requires active subscription (active or trial) */
export const RequireSubscription = () => SetMetadata(REQUIRE_SUBSCRIPTION_KEY, true);

/** Route requires a specific boolean feature (e.g., 'advanced_analytics', 'custom_domain') */
export const RequireFeature = (feature: string) => SetMetadata(REQUIRE_FEATURE_KEY, feature);

/** Route requires limit check (e.g., 'product_qrs', 'invitations') — enforced before action */
export const RequireLimit = (featureKey: string) => SetMetadata(REQUIRE_LIMIT_KEY, featureKey);
