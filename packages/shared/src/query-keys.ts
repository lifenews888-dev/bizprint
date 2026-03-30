// ─── Centralized React Query Keys ──────────────────
// All apps use these keys for consistent caching & invalidation

export const queryKeys = {
  // Auth / User
  auth: {
    me: ['auth', 'me'] as const,
  },

  // Orders
  orders: {
    all: ['orders'] as const,
    list: (params?: Record<string, any>) => ['orders', 'list', params] as const,
    detail: (id: string) => ['orders', id] as const,
    tracking: (id: string) => ['orders', id, 'tracking'] as const,
  },

  // Deliveries (Driver app)
  deliveries: {
    all: ['deliveries'] as const,
    active: ['deliveries', 'active'] as const,
    queue: ['deliveries', 'queue'] as const,
    history: (params?: Record<string, any>) => ['deliveries', 'history', params] as const,
    detail: (id: string | number) => ['deliveries', String(id)] as const,
    tracking: (orderId: string) => ['deliveries', 'tracking', orderId] as const,
  },

  // Products / Shop
  products: {
    all: ['products'] as const,
    list: (category?: string) => ['products', 'list', category] as const,
    detail: (id: string) => ['products', id] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
  },

  // Quotes
  quotes: {
    all: ['quotes'] as const,
    detail: (id: string) => ['quotes', id] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },

  // Courier
  courier: {
    status: ['courier', 'status'] as const,
    stats: ['courier', 'stats'] as const,
    earnings: (period?: string) => ['courier', 'earnings', period] as const,
    available: ['courier', 'available'] as const,
    claimed: ['courier', 'claimed'] as const,
  },

  // Admin
  admin: {
    health: ['admin', 'health'] as const,
    metrics: ['admin', 'metrics'] as const,
    errors: (params?: Record<string, any>) => ['admin', 'errors', params] as const,
    errorDetail: (id: string) => ['admin', 'errors', id] as const,
    users: (params?: Record<string, any>) => ['admin', 'users', params] as const,
    userDetail: (id: string) => ['admin', 'users', id] as const,
    config: ['admin', 'config'] as const,
  },

  // Loyalty
  loyalty: {
    cards: ['loyalty', 'cards'] as const,
    card: (id: string) => ['loyalty', 'cards', id] as const,
  },

  // Memberships
  memberships: {
    all: ['memberships'] as const,
    my: ['memberships', 'my'] as const,
    detail: (id: string) => ['memberships', id] as const,
    provider: (providerId: string) => ['memberships', 'provider', providerId] as const,
    checkins: (membershipId: string) => ['memberships', membershipId, 'checkins'] as const,
    plans: (providerId?: string) => ['memberships', 'plans', providerId] as const,
  },
} as const
