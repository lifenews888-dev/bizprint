# Pricing Golden Sheet

This folder protects BizPrint pricing behavior with fixed regression cases.

## Files

- `pricing-golden.cases.ts` is the editable golden price sheet.
- `pricing-golden.spec.ts` runs the sheet against the current pricing engines.

## How to Update Prices

1. Update the `expected` values in `pricing-golden.cases.ts` from the approved business price sheet.
2. Keep every expected amount in MNT.
3. Run:

```bash
npm run test:pricing
```

## What It Covers

- Product page calculator: fixed, area-based, tier-based, quote-required estimate.
- Quote engine: wide format, raised signage/hadag, offset.
- Smart quote: catalog-backed area quote, raised letters, unit conversion, minimum quantity, and material alias routing.
- VAT response shape: `total_price = subtotal_excl_vat + vat`; product prices keep `vat_included: true`.
- Cart quote flow: cart items preserve the customer-facing unit price and do not apply a second margin at quote time.

If a pricing formula changes intentionally, update the expected values in the same commit.
