# BizPrint Product Catalog Cleanup Plan

## Purpose

Define a clean and scalable structure for BizPrint product and catalog system, especially for print-on-demand products.

## Current issue

There is overlap between:
- `Product`
- `ProductMaster`
- variants, attributes, and special product modules

Some fields such as pricing_mode, base_price, and category appear in multiple entities, creating ambiguity.

## Canonical roles

```text
ProductMaster = canonical print product/spec template
Product = marketplace listing/vendor offer
```

## Field ownership

| Field | Owner | Notes |
|------|------|------|
| name_mn | ProductMaster (default), Product override allowed | display name |
| category | ProductMaster | canonical classification |
| pricing_mode | ProductMaster / pricing config | not per listing unless overridden intentionally |
| price_formula | ProductMaster / QuoteEngine | do not duplicate logic |
| images | Product | marketplace display |
| vendor_id | Product | fulfillment source |
| lead_time_days | Product | vendor-specific |
| margin_percent | PricingConfig | avoid embedding business logic in ProductMaster |
| requires_dimensions | derived from input schema | avoid duplication |

## Dynamic input schema

Each ProductMaster should define required quote inputs.

Example:

```json
{
  "required_inputs_schema": {
    "fields": [
      { "key": "quantity", "label": "Тоо ширхэг", "type": "number", "required": true },
      { "key": "width_mm", "label": "Өргөн", "type": "number" },
      { "key": "height_mm", "label": "Өндөр", "type": "number" },
      { "key": "material", "label": "Материал", "type": "select" },
      { "key": "sides", "label": "Тал", "type": "select", "options": ["1 тал", "2 тал"] }
    ]
  }
}
```

## ProductCard behavior

CTA must depend on pricing_mode:

```text
fixed → add to cart
formula → calculate price
 tier → calculate by quantity
quote_required → request quote
ai_quote → upload file for quote
```

## Category normalization

Unify aliases such as:
- banner / banners
- book / books
- business-card / business-cards

Introduce canonical category slugs if needed.

## Admin creation flow (target)

```text
1. Select ProductMaster
2. Select vendor/fulfillment
3. Enter display info (name, images)
4. Configure pricing (vendor cost, margin profile)
5. Preview and test quote
```

## Acceptance criteria

- Clear separation of Product and ProductMaster responsibilities
- Reduced duplication of pricing-related fields
- ProductCard reflects pricing_mode correctly
- ProductMaster defines required inputs for quoting
- Category inconsistencies are documented or normalized
