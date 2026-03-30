// ─── Creator Commission Calculator ──────────────────
// Handles commission logic for Creators (Designers, Livestreamers, Sellers).
// Used by both backend (payouts) and mobile (earnings display).

export type CreatorRole = 'designer' | 'livestreamer' | 'seller' | 'affiliate'

export interface CommissionRate {
  role: CreatorRole
  base_percent: number        // e.g., 15 = 15%
  bonus_percent: number       // extra for top performers
  min_payout: number          // minimum withdrawal amount (₮)
}

// ─── Default rates (can be overridden by admin config) ─────

export const DEFAULT_COMMISSION_RATES: Record<CreatorRole, CommissionRate> = {
  designer:     { role: 'designer',     base_percent: 20, bonus_percent: 5, min_payout: 10_000 },
  livestreamer: { role: 'livestreamer', base_percent: 15, bonus_percent: 10, min_payout: 20_000 },
  seller:       { role: 'seller',       base_percent: 10, bonus_percent: 3, min_payout: 5_000 },
  affiliate:    { role: 'affiliate',    base_percent: 5,  bonus_percent: 2, min_payout: 10_000 },
}

// ─── Calculate commission on a single sale ──────────

export interface SaleInput {
  amount: number              // total sale amount ₮
  role: CreatorRole
  is_top_performer?: boolean  // qualifies for bonus
  custom_rate?: number        // override base_percent
}

export interface CommissionResult {
  sale_amount: number
  commission_percent: number
  commission_amount: number
  platform_amount: number     // what BizPrint keeps
  net_creator: number         // what creator receives
}

export function calculateCommission(sale: SaleInput): CommissionResult {
  const rates = DEFAULT_COMMISSION_RATES[sale.role]
  const base = sale.custom_rate ?? rates.base_percent
  const bonus = sale.is_top_performer ? rates.bonus_percent : 0
  const totalPercent = base + bonus

  const commission = Math.round(sale.amount * (totalPercent / 100))
  const platform = sale.amount - commission

  return {
    sale_amount: sale.amount,
    commission_percent: totalPercent,
    commission_amount: commission,
    platform_amount: platform,
    net_creator: commission,
  }
}

// ─── Wallet types ───────────────────────────────────

export interface CreatorWallet {
  user_id: string
  balance: number             // current available balance ₮
  total_earned: number        // lifetime earnings
  pending_payout: number      // requested but not yet paid
  last_payout_at?: string
}

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'

export interface WithdrawalRequest {
  id: string
  user_id: string
  amount: number
  status: WithdrawalStatus
  bank_name?: string
  account_number?: string
  requested_at: string
  processed_at?: string
  processed_by?: string       // admin user ID
  rejection_reason?: string
}

// ─── Batch commission calculation ───────────────────

export function calculateBatchCommissions(sales: SaleInput[]): {
  total_sales: number
  total_commissions: number
  total_platform: number
  details: CommissionResult[]
} {
  const details = sales.map(calculateCommission)
  return {
    total_sales: details.reduce((s, d) => s + d.sale_amount, 0),
    total_commissions: details.reduce((s, d) => s + d.commission_amount, 0),
    total_platform: details.reduce((s, d) => s + d.platform_amount, 0),
    details,
  }
}
