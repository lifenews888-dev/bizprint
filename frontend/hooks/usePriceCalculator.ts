import { useState, useEffect, useCallback, useRef } from 'react'
import { apiFetch } from '@/lib/api'

export interface PriceInput {
  quantity: number
  width_mm?: number
  height_mm?: number
  options?: Record<string, boolean>
}

export interface PriceBreakdown {
  base_setup: number
  material_cost: number
  area_m2?: number
  addons_cost: number
  addons_detail: { name: string; cost: number; type: string }[]
  subtotal: number
  volume_discount: number
  discount_rate: number
  total: number
  unit_price: number
  quantity: number
  currency: string
  formula_used: string
  notes: string[]
  is_estimate: boolean
}

/**
 * usePriceCalculator — Real-time үнэ тооцоолох hook
 *
 * 300ms debounce-тэй, API руу POST /products/:id/calculate илгээнэ
 * Fixed price бүтээгдэхүүнд API дуудахгүй, client-side тооцоолно
 */
export function usePriceCalculator(productId: string | null, product: any) {
  const [input, setInput] = useState<PriceInput>({ quantity: 1 })
  const [result, setResult] = useState<PriceBreakdown | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isFixed = !product?.pricing_mode || product?.pricing_mode === 'fixed'

  const calculate = useCallback(async (newInput: PriceInput) => {
    if (!productId || !product) return

    // Fixed price — client-side calculation (no API needed)
    if (isFixed) {
      const price = Number(product.sale_price || product.base_price || 0)
      const qty = Math.max(1, newInput.quantity)
      setResult({
        base_setup: 0, material_cost: price * qty, addons_cost: 0, addons_detail: [],
        subtotal: price * qty, volume_discount: 0, discount_rate: 0,
        total: price * qty, unit_price: price, quantity: qty,
        currency: 'MNT', formula_used: 'fixed', notes: ['Тогтмол үнэ'], is_estimate: false,
      })
      return
    }

    // Dynamic price — API call with debounce
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<PriceBreakdown>(`/products/${productId}/calculate`, {
        method: 'POST', auth: false,
        body: newInput as any,
      })
      setResult(res)
    } catch (e: any) {
      setError(e.message || 'Тооцоолох боломжгүй')
    } finally {
      setLoading(false)
    }
  }, [productId, product, isFixed])

  // Debounced input change
  const updateInput = useCallback((partial: Partial<PriceInput>) => {
    setInput(prev => {
      const next = { ...prev, ...partial }

      // 300ms debounce
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => calculate(next), 300)

      return next
    })
  }, [calculate])

  // Initial calculation
  useEffect(() => {
    calculate(input)
  }, [productId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  return {
    input,
    result,
    loading,
    error,
    updateInput,
    recalculate: () => calculate(input),
  }
}
