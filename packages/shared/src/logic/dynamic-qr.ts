// ─── Anti-Fraud Dynamic QR System ───────────────────
// Prevents screenshot sharing of loyalty/membership QR codes.
// QR payload refreshes every N seconds with a new nonce.
// Server validates: timestamp freshness + nonce uniqueness.

// ─── Constants ──────────────────────────────────────

export const QR_REFRESH_INTERVAL_MS = 10_000;  // 10 seconds
export const QR_VALIDITY_WINDOW_MS = 15_000;   // 15 seconds (buffer for scan delay)

// ─── QR Payload Types ───────────────────────────────

export type QRPurpose = 'loyalty_stamp' | 'membership_checkin' | 'payment'

export interface DynamicQRPayload {
  /** What this QR is for */
  purpose: QRPurpose;
  /** User who generated the QR */
  user_id: string;
  /** Associated resource (loyalty card ID, membership ID, etc.) */
  resource_id: string;
  /** Unix timestamp ms — when QR was generated */
  ts: number;
  /** Random nonce — unique per refresh, prevents replay */
  nonce: string;
}

// ─── Generate ───────────────────────────────────────

/** Generate a fresh QR payload string (to be rendered as QR code) */
export function generateDynamicQR(
  purpose: QRPurpose,
  userId: string,
  resourceId: string,
): string {
  const payload: DynamicQRPayload = {
    purpose,
    user_id: userId,
    resource_id: resourceId,
    ts: Date.now(),
    nonce: generateNonce(),
  };
  return JSON.stringify(payload);
}

/** Generate cryptographic-quality random nonce */
function generateNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ─── Validate (Scanner side) ────────────────────────

export interface QRValidationResult {
  valid: boolean;
  payload?: DynamicQRPayload;
  error?: 'EXPIRED' | 'MALFORMED' | 'WRONG_PURPOSE';
  age_ms?: number;
}

/** Parse and validate a scanned QR string */
export function validateDynamicQR(
  raw: string,
  expectedPurpose?: QRPurpose,
  windowMs: number = QR_VALIDITY_WINDOW_MS,
): QRValidationResult {
  let payload: DynamicQRPayload;

  try {
    payload = JSON.parse(raw);
  } catch {
    return { valid: false, error: 'MALFORMED' };
  }

  // Check required fields
  if (!payload.user_id || !payload.resource_id || !payload.ts || !payload.nonce) {
    return { valid: false, error: 'MALFORMED' };
  }

  // Check purpose
  if (expectedPurpose && payload.purpose !== expectedPurpose) {
    return { valid: false, error: 'WRONG_PURPOSE', payload };
  }

  // Check timestamp freshness
  const age = Date.now() - payload.ts;
  if (age > windowMs || age < -5000) { // allow 5s clock skew
    return { valid: false, error: 'EXPIRED', payload, age_ms: age };
  }

  return { valid: true, payload, age_ms: age };
}

// ─── Countdown helper (for UI timer display) ────────

/** Returns seconds remaining until QR expires, for countdown UI */
export function qrSecondsRemaining(generatedAt: number): number {
  const elapsed = Date.now() - generatedAt;
  const remaining = QR_REFRESH_INTERVAL_MS - elapsed;
  return Math.max(0, Math.ceil(remaining / 1000));
}
