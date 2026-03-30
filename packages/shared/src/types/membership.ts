// ─── Membership & Subscription Types ────────────────
// Separate from Loyalty Stamps — this is time-based access control.

export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'FROZEN' | 'CANCELLED' | 'PENDING'
export type MembershipType = 'TIME_BASED'

export interface Membership {
  id: string
  provider_id: string         // vendor/gym/club who created the membership
  provider_name: string
  provider_logo?: string
  user_id: string
  user_name?: string
  user_phone?: string
  plan_name: string           // "1 сарын эрх", "3 сарын эрх", etc.
  type: MembershipType
  status: MembershipStatus
  start_date: string          // ISO date
  end_date: string            // ISO date
  frozen_at?: string          // when frozen
  frozen_until?: string       // resume date
  price: number
  created_at: string
  updated_at: string
}

export interface MembershipPlan {
  id: string
  provider_id: string
  name: string                // "1 сарын эрх"
  duration_days: number       // 30, 90, 365
  price: number
  description?: string
  is_active: boolean
}

export interface MembershipCheckIn {
  id: string
  membership_id: string
  user_name: string
  checked_in_at: string
  checked_in_by?: string      // staff who scanned
  method: 'qr' | 'manual'
}

// ─── QR Token payload ───────────────────────────────
// Dynamic QR refreshes every 30s — contains signed token

export interface MembershipQRPayload {
  membership_id: string
  user_id: string
  timestamp: number           // unix ms — QR generated at
  nonce: string               // random per-refresh
  signature: string           // HMAC to prevent forgery
}

// ─── Check-in result (scanner response) ─────────────

export interface CheckInResult {
  valid: boolean
  membership?: Membership
  days_remaining?: number
  message: string
  already_checked_in_today?: boolean
}

// ─── Notification triggers ──────────────────────────

export const MEMBERSHIP_NOTIFICATION_TRIGGERS = {
  /** Days before expiry to send warning */
  EXPIRY_WARNING_DAYS: 3,
  /** Send on the day of expiry */
  EXPIRY_DAY: 0,
  /** Days after expiry to send final reminder */
  EXPIRED_REMINDER_DAYS: -1,
} as const

// ─── Status config ──────────────────────────────────

export const MEMBERSHIP_STATUS_CONFIG: Record<MembershipStatus, { label: string; emoji: string; color: string; bg: string }> = {
  ACTIVE:    { label: 'Идэвхтэй',     emoji: '✅', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  EXPIRED:   { label: 'Дууссан',       emoji: '⏰', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  FROZEN:    { label: 'Түр зогссон',   emoji: '❄️', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  CANCELLED: { label: 'Цуцлагдсан',   emoji: '🚫', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  PENDING:   { label: 'Хүлээгдэж байна', emoji: '⏳', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
}
