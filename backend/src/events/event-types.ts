// ─── BizPrint Centralized Event Types ─────────────────────────────────────────
// All real-time events flow through EventBus → SyncGateway → Connected clients
// ──────────────────────────────────────────────────────────────────────────────

export const BizEvent = {
  // CMS
  SETTINGS_UPDATED:       'cms.settings.updated',
  SETTINGS_BULK_UPDATED:  'cms.settings.bulk_updated',
  MENU_UPDATED:           'cms.menu.updated',
  BANNER_UPDATED:         'cms.banner.updated',
  PAGE_UPDATED:           'cms.page.updated',

  // Orders
  ORDER_CREATED:          'order.created',
  ORDER_STATUS_UPDATED:   'order.status.updated',
  ORDER_PAID:             'order.paid',
  ORDER_CANCELLED:        'order.cancelled',

  // Products
  PRODUCT_CREATED:        'product.created',
  PRODUCT_UPDATED:        'product.updated',
  PRODUCT_DELETED:        'product.deleted',

  // Production / Vendor
  PRODUCTION_UPDATED:     'production.status.updated',
  JOB_ASSIGNED:           'vendor.job.assigned',
  VENDOR_UPDATED:         'vendor.updated',

  // Notifications
  NOTIFICATION:           'notification.created',

  // Users
  USER_UPDATED:           'user.updated',

  // QR & Loyalty
  QR_SCANNED:                  'qr.scanned',
  LOYALTY_STAMP_ADDED:         'loyalty.stamp.added',
  LOYALTY_REWARD_EARNED:       'loyalty.reward.earned',

  // Delivery
  DELIVERY_PICKUP_READY:       'delivery.pickup.ready',
  DELIVERY_OUT_FOR_DELIVERY:   'delivery.out.for.delivery',
  DELIVERY_COMPLETED:          'delivery.completed',

  // Revenue / Payout
  REVENUE_GENERATED:           'revenue.generated',
  PAYOUT_TRIGGERED:            'payout.triggered',

  // Design Approval Workflow
  DESIGN_FILE_UPLOADED:        'design.file.uploaded',
  DESIGN_REVISION_REQUESTED:   'design.revision.requested',
  DESIGN_VERSION_UPDATED:      'design.version.updated',
  DESIGN_ZOOM_CREATED:         'design.zoom.created',
  DESIGN_APPROVED:             'design.approved',
  DESIGN_REJECTED:             'design.rejected',
  DESIGN_IN_PRODUCTION:        'design.in_production',
  DESIGN_COMMENT_ADDED:        'design.comment.added',
} as const

export type BizEventName = typeof BizEvent[keyof typeof BizEvent]

// ── Payload interfaces ────────────────────────────────────────────────────────

export interface SettingsPayload {
  key: string
  value: any
}

export interface SettingsBulkPayload {
  settings: Record<string, any>
}

export interface OrderPayload {
  orderId: string
  userId: string
  vendorId?: string
  status?: string
  previousStatus?: string
  data?: Record<string, any>
}

export interface ProductPayload {
  productId: string
  vendorId?: string
  data?: Record<string, any>
}

export interface ProductionPayload {
  orderId: string
  jobId: string
  vendorId: string
  status: string
  data?: Record<string, any>
}

export interface NotificationPayload {
  userId: string
  notification: {
    id?: string
    type: string
    title: string
    body: string
    data?: Record<string, any>
  }
}

export interface VendorJobPayload {
  vendorId: string
  jobId: string
  orderId: string
  data?: Record<string, any>
}

export interface QRScanPayload {
  scannedBy: string // userId or 'courier' or 'factory'
  qrType: 'product' | 'loyalty' | 'order' | 'card'
  entityId: string
  actions: string[] // ['loyalty.stamp', 'inventory.deduct', 'status.update']
}

export interface DeliveryPayload {
  orderId: string
  courierId?: string
  customerId: string
  status: string
  location?: { lat: number; lng: number }
}

export interface RevenuePayload {
  orderId: string
  totalAmount: number
  vendorPayout: number
  platformRevenue: number
  salesCommission: number
  creatorRoyalty: number
}
