// ─── Socket.IO Event Names ──────────────────────────
// Shared between web, customer, driver, courier apps.
// Prevents typo-based bugs in event subscriptions.

export const SocketEvents = {
  // ─── Connection ─────────────────────────────────
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  // ─── Rooms ──────────────────────────────────────
  JOIN_ROOM: 'join',
  LEAVE_ROOM: 'leave',

  // ─── Order lifecycle ────────────────────────────
  ORDER_STATUS_UPDATED: 'order_status_updated',
  ORDER_CREATED: 'order_created',
  ORDER_FILE_UPLOADED: 'order_file_uploaded',
  PRODUCTION_UPDATED: 'production_updated',

  // ─── Delivery / Tracking ────────────────────────
  DELIVERY_UPDATED: 'delivery_updated',
  DELIVERY_ASSIGNED: 'delivery_assigned',
  DRIVER_LOCATION: 'driver_location',

  // ─── Notifications ──────────────────────────────
  NOTIFICATION: 'notification',
  NOTIFICATION_READ: 'notification_read',

  // ─── Chat ───────────────────────────────────────
  CHAT_MESSAGE: 'chat_message',
  CHAT_TYPING: 'chat_typing',

  // ─── Sync (generic) ────────────────────────────
  STATUS_CHANGED: 'status_changed',
  DATA_SYNC: 'data_sync',
} as const

// ─── Room name builders ─────────────────────────────

export const SocketRooms = {
  user: (id: string) => `user:${id}`,
  order: (id: string) => `order:${id}`,
  delivery: (id: string | number) => `delivery:${id}`,
  global: 'global',
} as const

// ─── Namespace ──────────────────────────────────────

export const SocketNamespace = {
  sync: '/sync',
  delivery: '/delivery',
  chat: '/chat',
} as const
