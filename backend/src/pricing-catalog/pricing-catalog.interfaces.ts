export type PricingUnit = 'pcs' | 'm2' | 'm' | 'sheet'

export interface PricingItem {
  category:   string
  name:       string
  unit:       PricingUnit
  price:      number
  /** null  → VAT not applicable
   *  === price → price already includes VAT (extract for display)
   *  > price   → price is pre-VAT, add vatPct% on top             */
  price_vat:  number | null
  size_label?: string
  material?:  string
}

export interface PricingCatalogMeta {
  source:      string
  vat_percent: number
}

export interface PricingCatalog {
  meta:  PricingCatalogMeta
  items: PricingItem[]
}

export interface QuoteRequest {
  product_type: string
  /** Optional: exact item name to pick (overrides category-first logic) */
  item_name?:  string
  /** Optional: material keyword filter within category */
  material?:   string
  width_mm?:   number
  height_mm?:  number
  quantity?:   number
  /** Pre-calculated total area in m² (overrides w×h calculation) */
  area_m2?:    number
  apply_vat?:  boolean
}

export interface QuoteResponse {
  product_type: string
  item:         PricingItem
  unit_price:   number
  /** Total price the customer pays (incl. VAT when applied) */
  total:        number
  total_vat?:   number
  quantity:     number
  /** Total area for all pieces combined (m²), undefined for pcs items */
  area_m2?:     number
  vat_percent?: number
  breakdown: {
    base_total: number
    /** VAT amount (extracted or added, depending on item) */
    vat?:       number
    vat_mode?:  'added' | 'included'
  }
}
