# BizPrint Pricing Consolidation Plan

## Purpose

This document defines the safe implementation plan for consolidating BizPrint pricing logic into a single backend source of truth.

## Current risk

Pricing logic currently exists in multiple places:

- `backend/src/quote/pricing.service.ts`
- `backend/src/quote-engine/quote-engine.service.ts`
- `backend/src/pricing-engine/pricing-engine.service.ts`
- `backend/src/products/product-price-calculator.service.ts`
- `backend/src/ai/smart-quote/smart-quote.service.ts`
- frontend quote/calculator components

This can cause different totals for the same product depending on whether the user comes from product card, quote page, AI quote, admin calculator, or cart quote flow.

## Canonical rule

Final customer price must be calculated by backend only.

```text
customer_price = vendor_cost * (1 + margin_rate)
platform_revenue = customer_price - vendor_cost
```

Frontend may collect inputs and display backend output, but must not be the final pricing authority.

## Target architecture

```text
Product / ProductMaster inputs
        ↓
Input normalization
        ↓
QuoteEngine / PricingService
        ↓
VAT / margin / discount / surcharge / addon breakdown
        ↓
Quote response
        ↓
PDF proposal / cart quote / order conversion
```

## Standard price input types

```ts
export type PriceInputType = 'VENDOR_WITH_VAT' | 'VENDOR_WITHOUT_VAT'
```

## Standard price breakdown

```ts
export type PriceBreakdown = {
  vendor_base: number
  vendor_vat: number
  vendor_total: number
  margin_rate: number
  platform_margin: number
  customer_base: number
  customer_vat: number
  customer_total: number
  vat_included: boolean
  currency: 'MNT'
}
```

## Refactor plan

### Phase 1 — Inventory

- Identify every method that calculates final customer totals.
- Mark each method as one of:
  - authoritative
  - adapter
  - UI-only preview
  - deprecated

### Phase 2 — Backend authority

- Keep `QuoteEngine` / `PricingService` as the final authority.
- Convert `ProductPriceCalculatorService` into an input normalization or adapter layer where possible.
- Ensure SmartQuote passes AI-detected specs to QuoteEngine, not to a separate hardcoded pricing path.

### Phase 3 — VAT consistency

- Support both vendor-with-VAT and vendor-without-VAT inputs.
- Return a full VAT breakdown to frontend/admin/PDF quote.
- Do not hide VAT assumptions inside UI components.

### Phase 4 — Discount and rush safety

Quantity discount rules must not stack accidentally.

Recommended fields:

```ts
rule_group: string
stacking_policy: 'BEST_ONLY' | 'STACKABLE' | 'EXCLUSIVE'
```

For quantity discounts, default policy should be `BEST_ONLY`.

### Phase 5 — AI quote safety

AI may extract product specs from PDF/user prompt, but must not decide final price.

If confidence is low:

```ts
if (spec.confidence < 75) {
  return {
    status: 'NEEDS_HUMAN_CONFIRMATION',
    suggested_spec: spec,
    required_fields: ['paper_gsm', 'sides', 'finishing']
  }
}
```

## Acceptance criteria

- Final quote totals come from backend.
- Frontend calculators do not become final price authority.
- AI quote routes final totals through backend QuoteEngine/PricingService.
- VAT output is explicit.
- Discount stacking behavior is safe and documented.
- Existing cart → quote → order pipeline is preserved.
