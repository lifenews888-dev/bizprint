import { useState, useEffect, useRef, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

/* ═══════════════════════════════════════
 *  usePricing — Live pricing hook
 *  Debounced 300ms, auto re-fetch on config change
 *  Calls: POST /smart-quote/calculate (DB-backed pricing engine)
 * ═══════════════════════════════════════ */

export interface PricingConfig {
  product_type: string   // business_card, flyer, poster, etc.
  material?: string      // paper_300, paper_150, vinyl, etc.
  width_mm?: number
  height_mm?: number
  quantity?: number
  urgency?: string       // normal, 48h, 24h
  post_processes?: string[]  // lamination_matt, lamination_gloss, uv_coating, etc.
  sides?: string         // single, double
  margin_type?: string   // retail, b2b, rush
}

export interface PricingResult {
  subtotal: number
  vat: number
  total_price: number
  unit_price: number
  production?: {
    material?: { material_name: string; total_cost: number; area_m2: number }
    machine?: { name: string; type: string }
    steps?: { step: string; description: string; time_hours: number; cost: number }[]
    estimated_days?: number
    cost_breakdown?: {
      material: number
      machine: number
      labor: number
      setup: number
      post_process: number
      margin: number
      margin_rate: number
    }
  }
  machine_type?: string
  production_speed?: string
  urgency_multiplier?: number
  options?: { tier: string; price: number; delivery_days: number; description: string }[]
}

export function usePricing(config: PricingConfig) {
  const [data, setData] = useState<PricingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const calculate = useCallback(async (cfg: PricingConfig) => {
    if (!cfg.product_type) return

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const result = await apiFetch('/smart-quote/calculate', {
        method: 'POST',
        body: JSON.stringify({
          product_type: mapProductType(cfg.product_type),
          material: cfg.material,
          width_mm: cfg.width_mm,
          height_mm: cfg.height_mm,
          quantity: cfg.quantity || 100,
          urgency: cfg.urgency || 'normal',
          post_processes: cfg.post_processes || [],
          margin_type: cfg.margin_type || 'retail',
        }),
        auth: false,  // pricing doesn't need auth
      })
      setData(result as PricingResult)
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setError(e.message || 'Үнэ тооцоолоход алдаа гарлаа')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced re-fetch on config change
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => calculate(config), 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [
    config.product_type, config.material, config.width_mm, config.height_mm,
    config.quantity, config.urgency, config.sides,
    JSON.stringify(config.post_processes),
    calculate,
  ])

  const recalculate = useCallback(() => calculate(config), [config, calculate])

  return { data, loading, error, recalculate }
}

// Map frontend preset keys to backend product types
function mapProductType(preset: string): string {
  const map: Record<string, string> = {
    business_card: 'digital',
    flyer: 'offset',
    poster: 'wide',
    brochure: 'offset',
    menu: 'offset',
    banner: 'wide',
    sticker: 'wide',
    invitation: 'digital',
    letterhead: 'digital',
    envelope: 'digital',
  }
  return map[preset] || preset
}
