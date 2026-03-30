// ─── Smart Commerce Logic ───────────────────────────
// Actionable insights, tier pricing, bundle upsell

// ─── Loyalty Pulse (Actionable Insights) ────────────

export interface LoyaltyInsight {
  message: string
  emoji: string
  urgency: 'low' | 'medium' | 'high'
  action?: string
}

export function getLoyaltyInsight(currentStamps: number, requiredStamps: number, rewards: number): LoyaltyInsight {
  const remaining = requiredStamps - currentStamps

  if (rewards > 0) {
    return { message: `${rewards} шагнал ашиглаагүй байна!`, emoji: '🎁', urgency: 'high', action: 'Шагнал авах' }
  }
  if (remaining <= 0) {
    return { message: 'Шагнал авах эрхтэй боллоо!', emoji: '🎉', urgency: 'high', action: 'Шагнал авах' }
  }
  if (remaining === 1) {
    return { message: 'Бараг боллоо! 1 тамга дутуу', emoji: '🔥', urgency: 'high', action: 'Захиалга өгөх' }
  }
  if (remaining <= 3) {
    return { message: `Дараагийн шагнал хүртэл ${remaining} тамга дутуу`, emoji: '⭐', urgency: 'medium', action: 'Захиалга өгөх' }
  }
  return { message: `${currentStamps}/${requiredStamps} тамга цуглуулсан`, emoji: '📊', urgency: 'low' }
}

// ─── Tier-based B2B Pricing ─────────────────────────

export type CustomerTier = 'retail' | 'small_business' | 'enterprise' | 'vip'

export const TIER_DISCOUNTS: Record<CustomerTier, { label: string; discount_percent: number; min_orders: number }> = {
  retail:         { label: 'Жижиглэн',      discount_percent: 0,   min_orders: 0 },
  small_business: { label: 'Жижиг бизнес',  discount_percent: 10,  min_orders: 5 },
  enterprise:     { label: 'Гэрээт',        discount_percent: 20,  min_orders: 20 },
  vip:            { label: 'VIP',            discount_percent: 30,  min_orders: 50 },
}

export function calculateTierPrice(basePrice: number, tier: CustomerTier): { price: number; saved: number; tier_label: string } {
  const cfg = TIER_DISCOUNTS[tier]
  const saved = Math.round(basePrice * (cfg.discount_percent / 100))
  return { price: basePrice - saved, saved, tier_label: cfg.label }
}

export function detectTier(totalOrders: number): CustomerTier {
  if (totalOrders >= 50) return 'vip'
  if (totalOrders >= 20) return 'enterprise'
  if (totalOrders >= 5) return 'small_business'
  return 'retail'
}

// ─── Bundle Upsell (Cross-sell) ─────────────────────

export interface BundleSuggestion {
  message: string
  emoji: string
  discount_percent: number
  bundle_items: string[]
}

const BUNDLE_RULES: { trigger: string; suggestion: BundleSuggestion }[] = [
  {
    trigger: 'BUSINESS_CARD',
    suggestion: {
      message: 'Стикертэй багцалж авбал 20% хямд!',
      emoji: '🏷️',
      discount_percent: 20,
      bundle_items: ['BUSINESS_CARD', 'STICKER'],
    },
  },
  {
    trigger: 'FLYER',
    suggestion: {
      message: 'Постертой хамт авбал 15% хэмнэнэ',
      emoji: '📰',
      discount_percent: 15,
      bundle_items: ['FLYER', 'BANNER'],
    },
  },
  {
    trigger: 'STICKER',
    suggestion: {
      message: 'Савлагаатай хамт захиалбал 25% хямд',
      emoji: '📦',
      discount_percent: 25,
      bundle_items: ['STICKER', 'PACKAGING'],
    },
  },
]

export function getBundleSuggestion(currentProduct: string): BundleSuggestion | null {
  const rule = BUNDLE_RULES.find(r => r.trigger === currentProduct)
  return rule?.suggestion || null
}

// ─── Quote freshness check ──────────────────────────

export interface QuoteFreshness {
  is_expired: boolean
  is_price_changed: boolean
  days_since: number
  message?: string
}

export function checkQuoteFreshness(createdAt: string, validUntil?: string): QuoteFreshness {
  const created = new Date(createdAt).getTime()
  const now = Date.now()
  const daysSince = Math.floor((now - created) / (1000 * 60 * 60 * 24))

  if (validUntil) {
    const expiry = new Date(validUntil).getTime()
    if (now > expiry) {
      return { is_expired: true, is_price_changed: true, days_since: daysSince, message: 'Хугацаа дууссан — үнэ өөрчлөгдсөн байж болно' }
    }
  }

  if (daysSince > 14) {
    return { is_expired: false, is_price_changed: true, days_since: daysSince, message: `${daysSince} хоногийн өмнөх — үнэ шинэчлэх` }
  }

  return { is_expired: false, is_price_changed: false, days_since: daysSince }
}
