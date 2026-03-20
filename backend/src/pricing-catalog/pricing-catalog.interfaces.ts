export type PricingUnit = 'pcs' | 'm2' | 'm' | 'sheet'

export interface PricingItem {
  category: string
  name: string
  unit: PricingUnit
  price: number
  price_vat: number | null
  size_label?: string
  material?: string
}

export interface PricingCatalogMeta {
  source: string
  vat_percent: number
}

export interface PricingCatalog {
  meta: PricingCatalogMeta
  items: PricingItem[]
}

export interface QuoteRequest {
  product_type: string
  width_mm?: number
  height_mm?: number
  quantity?: number
  area_m2?: number
  apply_vat?: boolean
}

export interface QuoteResponse {
  product_type: string
  item: PricingItem
  unit_price: number
  total: number
  total_vat?: number
  quantity: number
  area_m2?: number
  vat_percent?: number
  breakdown: {
    base_total: number
    vat?: number
  }
}
