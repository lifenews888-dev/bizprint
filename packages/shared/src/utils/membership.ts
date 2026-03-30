import type { Membership, MembershipStatus } from '../types/membership'

// ─── Validity Check ─────────────────────────────────

export interface ValidityResult {
  is_valid: boolean
  days_remaining: number
  hours_remaining: number
  status: MembershipStatus
  /** Human-readable: "24 өдөр", "3 цаг", "Дууссан" */
  display: string
  /** 0..1 progress (0 = just started, 1 = expired) */
  progress: number
  expires_soon: boolean       // <= 3 days
}

export function checkValidity(membership: Membership): ValidityResult {
  const now = Date.now()
  const start = new Date(membership.start_date).getTime()
  const end = new Date(membership.end_date).getTime()
  const totalDuration = end - start
  const elapsed = now - start
  const remaining = end - now

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (membership.status === 'FROZEN') {
    return {
      is_valid: false,
      days_remaining: days > 0 ? days : 0,
      hours_remaining: hours > 0 ? hours : 0,
      status: 'FROZEN',
      display: 'Түр зогссон',
      progress: totalDuration > 0 ? Math.min(1, elapsed / totalDuration) : 0,
      expires_soon: false,
    }
  }

  if (membership.status === 'CANCELLED') {
    return {
      is_valid: false, days_remaining: 0, hours_remaining: 0,
      status: 'CANCELLED', display: 'Цуцлагдсан', progress: 1, expires_soon: false,
    }
  }

  if (remaining <= 0) {
    return {
      is_valid: false, days_remaining: 0, hours_remaining: 0,
      status: 'EXPIRED', display: 'Хугацаа дууссан', progress: 1, expires_soon: false,
    }
  }

  const display = days > 0 ? `${days} өдөр ${hours} цаг` : `${hours} цаг`
  const progress = totalDuration > 0 ? Math.min(1, elapsed / totalDuration) : 0

  return {
    is_valid: true,
    days_remaining: days,
    hours_remaining: hours,
    status: 'ACTIVE',
    display,
    progress,
    expires_soon: days <= 3,
  }
}

// ─── Countdown display formatting ───────────────────

export function formatCountdown(membership: Membership): string {
  const v = checkValidity(membership)
  if (!v.is_valid) return v.display
  if (v.days_remaining > 0) return `${v.days_remaining} өдөр`
  return `${v.hours_remaining} цаг`
}

// ─── QR token generation (client-side) ──────────────
// In production, signature should come from server.
// This generates the payload structure; server validates.

export function generateQRPayload(membershipId: string, userId: string): string {
  const payload = {
    membership_id: membershipId,
    user_id: userId,
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(2, 10),
  }
  return JSON.stringify(payload)
}

/** Check if a QR payload timestamp is within the refresh window (30s) */
export function isQRValid(timestamp: number, windowMs = 30_000): boolean {
  return Date.now() - timestamp <= windowMs
}
