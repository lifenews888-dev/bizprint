// ─── BizPrint Product Type Ecosystem ────────────────
// All product categories across the Super App.

export enum ProductType {
  // Print
  BUSINESS_CARD = 'BUSINESS_CARD',
  FLYER = 'FLYER',
  BANNER = 'BANNER',
  STICKER = 'STICKER',
  PACKAGING = 'PACKAGING',

  // Digital
  QR_CODE = 'QR_CODE',
  DIGITAL_CARD = 'DIGITAL_CARD',
  LANDING_PAGE = 'LANDING_PAGE',

  // Marketing
  LOYALTY_PROGRAM = 'LOYALTY_PROGRAM',
  MEMBERSHIP_PLAN = 'MEMBERSHIP_PLAN',
  CAMPAIGN = 'CAMPAIGN',

  // B2B
  BULK_ORDER = 'BULK_ORDER',
  CUSTOM_DESIGN = 'CUSTOM_DESIGN',
  WHITE_LABEL = 'WHITE_LABEL',
}

export const PRODUCT_TYPE_CONFIG: Record<ProductType, { label: string; emoji: string; category: string }> = {
  [ProductType.BUSINESS_CARD]:  { label: 'Нэрийн хуудас',   emoji: '💳', category: 'print' },
  [ProductType.FLYER]:          { label: 'Зар сурталчилгаа', emoji: '📄', category: 'print' },
  [ProductType.BANNER]:         { label: 'Баннер',          emoji: '🪧', category: 'print' },
  [ProductType.STICKER]:        { label: 'Стикер',          emoji: '🏷️', category: 'print' },
  [ProductType.PACKAGING]:      { label: 'Савлагаа',        emoji: '📦', category: 'print' },
  [ProductType.QR_CODE]:        { label: 'QR код',           emoji: '📱', category: 'digital' },
  [ProductType.DIGITAL_CARD]:   { label: 'Дижитал карт',    emoji: '🎴', category: 'digital' },
  [ProductType.LANDING_PAGE]:   { label: 'Landing хуудас',  emoji: '🌐', category: 'digital' },
  [ProductType.LOYALTY_PROGRAM]:{ label: 'Loyalty програм',  emoji: '⭐', category: 'marketing' },
  [ProductType.MEMBERSHIP_PLAN]:{ label: 'Гишүүнчлэл',      emoji: '🎫', category: 'marketing' },
  [ProductType.CAMPAIGN]:       { label: 'Кампейн',         emoji: '📢', category: 'marketing' },
  [ProductType.BULK_ORDER]:     { label: 'Бөөний захиалга', emoji: '🏭', category: 'b2b' },
  [ProductType.CUSTOM_DESIGN]:  { label: 'Захиалгат дизайн', emoji: '🎨', category: 'b2b' },
  [ProductType.WHITE_LABEL]:    { label: 'White Label',     emoji: '🏢', category: 'b2b' },
}

export const PRODUCT_CATEGORIES = ['print', 'digital', 'marketing', 'b2b'] as const
export type ProductCategory = typeof PRODUCT_CATEGORIES[number]
