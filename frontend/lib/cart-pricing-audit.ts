export type CartPricingAudit = {
  source: string
  status: string
  label: string
  detail: string
  color: string
  background: string
}

export type CartPricingAuditSummary = {
  total_items: number
  accepted_count: number
  adjusted_count: number
  missing_count: number
  dynamic_count: number
  catalog_count: number
  has_adjustments: boolean
  all_priced: boolean
}

type PricedCartItem = {
  price?: number
  unit_price?: number
  specs?: Record<string, unknown>
}

const asRecord = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}

const fmtMoney = (value: number) =>
  new Intl.NumberFormat('mn-MN').format(Math.round(value)) + '₮'

export const getCartPricingAudit = (item: PricedCartItem): CartPricingAudit => {
  const specs = asRecord(item.specs)
  const pricing = asRecord(specs.pricing)
  const snapshot = asRecord(specs.pricing_snapshot)
  const validation = asRecord(pricing.pricing_validation)
  const source = String(validation.source || pricing.source || snapshot.source || 'unknown')
  const status = String(validation.status || '')
  const sourceLabel: Record<string, string> = {
    catalog: 'Catalog үнэ',
    'pricing-catalog': 'Backend тооцоолол',
    'ai-upload': 'AI файл тооцоо',
    server: 'Server үнэ',
    quote: 'Quote үнэ',
    inquiry: 'Inquiry үнэ',
    unknown: 'Үнэний эх сурвалж',
  }

  if (status === 'adjusted') {
    const submitted = Number(validation.submitted_unit_price || 0)
    const accepted = Number(validation.accepted_unit_price || item.price || item.unit_price || 0)
    return {
      source,
      status,
      label: 'Үнэ backend дээр засагдсан',
      detail: submitted > 0 ? `${fmtMoney(submitted)} → ${fmtMoney(accepted)}` : `${fmtMoney(accepted)} батлагдсан`,
      color: '#92400E',
      background: '#FFFBEB',
    }
  }

  if (status === 'accepted') {
    return {
      source,
      status,
      label: `${sourceLabel[source] || sourceLabel.unknown} OK`,
      detail: 'Checkout үнэ серверээр баталгаажсан',
      color: '#047857',
      background: '#ECFDF5',
    }
  }

  if (snapshot.pricingContractVersion || pricing.pricingContractVersion) {
    return {
      source,
      status: 'snapshot',
      label: sourceLabel[source] || sourceLabel.unknown,
      detail: String(snapshot.pricingContractVersion || pricing.pricingContractVersion),
      color: '#1D4ED8',
      background: '#EFF6FF',
    }
  }

  return {
    source,
    status: 'missing',
    label: 'Үнэний audit дутуу',
    detail: 'Сервер sync хийсний дараа баталгаажна',
    color: '#64748B',
    background: '#F8FAFC',
  }
}

export const summarizeCartPricingAudit = (items: PricedCartItem[]): CartPricingAuditSummary => {
  const summary: CartPricingAuditSummary = {
    total_items: items.length,
    accepted_count: 0,
    adjusted_count: 0,
    missing_count: 0,
    dynamic_count: 0,
    catalog_count: 0,
    has_adjustments: false,
    all_priced: true,
  }

  for (const item of items) {
    const audit = getCartPricingAudit(item)
    if (audit.source === 'catalog') summary.catalog_count += 1
    if (['pricing-catalog', 'ai-upload', 'server', 'quote', 'inquiry'].includes(audit.source)) {
      summary.dynamic_count += 1
    }
    if (audit.status === 'accepted') summary.accepted_count += 1
    else if (audit.status === 'adjusted') summary.adjusted_count += 1
    else summary.missing_count += 1
  }

  summary.has_adjustments = summary.adjusted_count > 0
  summary.all_priced = summary.missing_count === 0
  return summary
}

export const getCartPricingAuditSummaryMessage = (summary?: Partial<CartPricingAuditSummary> | null, fallbackTotal = 0) => {
  if (!summary) return { message: '', tone: 'info' as const }
  if (summary.has_adjustments) {
    return {
      message: `Backend ${summary.adjusted_count || 0} мөрийн үнийг catalog үнээр зассан.`,
      tone: 'warning' as const,
    }
  }
  if (summary.all_priced) {
    return {
      message: `Үнэ баталгаажсан: ${summary.accepted_count || 0}/${summary.total_items || fallbackTotal} мөр.`,
      tone: 'success' as const,
    }
  }
  return {
    message: `Үнэний audit дутуу: ${summary.missing_count || 0} мөр. Checkout үед сервер баталгаажуулна.`,
    tone: 'info' as const,
  }
}
