'use client'
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, Ruler, Package, Zap } from 'lucide-react'

const fmt = (n: number) => '₮' + n.toLocaleString('mn-MN')

interface Props {
  product: any
  onPriceChange?: (total: number, breakdown: any) => void
}

export default function PriceCalculator({ product, onPriceChange }: Props) {
  const p = product
  const formula = p.price_formula || {}
  const isArea = p.pricing_mode === 'formula' && formula.type === 'area_based'
  const isTier = p.pricing_mode === 'tier'
  const isQuote = p.pricing_mode === 'quote_required'
  const isFixed = !isArea && !isTier && !isQuote

  const [widthStr, setWidthStr] = useState('1.0')
  const [heightStr, setHeightStr] = useState('1.0')
  const [qtyStr, setQtyStr] = useState(String(p.min_quantity || 1))
  const [options, setOptions] = useState<Record<string, boolean>>({})
  const [result, setResult] = useState<any>(null)
  const [calculating, setCalculating] = useState(false)

  // Parse: meters → millimeters for API
  const widthM = Math.max(0, parseFloat(widthStr) || 0)
  const heightM = Math.max(0, parseFloat(heightStr) || 0)
  const width = Math.round(widthM * 1000) // API expects mm
  const height = Math.round(heightM * 1000)
  const qty = Math.max(1, parseInt(qtyStr) || 1)

  // Initialize options from formula
  useEffect(() => {
    if (formula.options) {
      const init: Record<string, boolean> = {}
      Object.keys(formula.options).forEach(k => { init[k] = false })
      setOptions(init)
    }
  }, [])

  // Live calculation with debounce
  const calculate = useCallback(async () => {
    if (isFixed) {
      const price = Number(p.sale_price || p.base_price || 0)
      const total = price * qty
      setResult({ total, unit_price: price, formula_used: 'fixed', notes: ['Тогтмол үнэ'], volume_discount: 0 })
      onPriceChange?.(total, { unit_price: price })
      return
    }

    setCalculating(true)
    try {
      const res = await apiFetch<any>(`/products/${p.id}/calculate`, {
        method: 'POST', auth: false,
        body: { quantity: qty, width_mm: width, height_mm: height, options },
      })
      setResult(res)
      onPriceChange?.(res.total, res)
    } catch { } finally { setCalculating(false) }
  }, [qty, width, height, options, p.id, isFixed])

  useEffect(() => {
    const timer = setTimeout(calculate, 300)
    return () => clearTimeout(timer)
  }, [calculate])

  // Fixed price products — show simple qty selector
  if (isFixed) {
    const price = Number(p.sale_price || p.base_price || 0)
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface2)]/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-[#FF6B00]" strokeWidth={1.5} />
          <span className="text-sm font-bold text-[var(--text)]">Үнэ тооцоолол</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text3)]">Тоо:</span>
          <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
            <button onClick={() => setQtyStr(String(Math.max(1, qty - 1)))} className="w-9 h-9 bg-[var(--surface2)] border-none cursor-pointer text-sm text-[var(--text2)]">−</button>
            <input type="text" inputMode="numeric" value={qtyStr} onChange={e => setQtyStr(e.target.value.replace(/[^0-9]/g, '') || '1')} className="w-12 h-9 border-none text-center text-sm font-bold bg-[var(--surface)] text-[var(--text)] outline-none" />
            <button onClick={() => setQtyStr(String(qty + 1))} className="w-9 h-9 bg-[var(--surface2)] border-none cursor-pointer text-sm text-[var(--text2)]">+</button>
          </div>
          <span className="text-xs text-[var(--text3)]">=</span>
          <motion.span key={qty} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-extrabold text-[#FF6B00]">{fmt(price * qty)}</motion.span>
        </div>
      </div>
    )
  }

  // Advanced calculator — Area/Tier/Quote
  return (
    <div className="rounded-xl border border-[#FF6B00]/20 bg-gradient-to-b from-[#FF6B00]/5 to-transparent p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center">
          <Calculator className="w-4 h-4 text-[#FF6B00]" strokeWidth={1.5} />
        </div>
        <div>
          <span className="text-sm font-bold text-[var(--text)]">Ухаалаг тооцоолуур</span>
          <span className="text-[10px] text-[var(--text3)] ml-2">{isArea ? 'М² тооцоо' : isTier ? 'Шатлалт үнэ' : 'Урьдчилсан'}</span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {/* Dimensions (for area-based) */}
        {(isArea || isQuote) && (
          <div>
            <div className="text-[10px] font-semibold text-[var(--text3)] mb-2">Хэмжээ оруулах</div>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
              <div>
                <div className="text-[9px] text-[var(--text3)] mb-1">Өргөн</div>
                <div className="relative">
                  <input type="text" inputMode="decimal" value={widthStr} placeholder="1.2"
                    onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'); setWidthStr(v) }}
                    className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 pr-8 text-base font-bold text-[var(--text)] outline-none focus:border-[#FF6B00] transition-colors" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--text3)]">м</span>
                </div>
              </div>
              <span className="text-lg text-[var(--text3)] mt-4">×</span>
              <div>
                <div className="text-[9px] text-[var(--text3)] mb-1">Өндөр</div>
                <div className="relative">
                  <input type="text" inputMode="decimal" value={heightStr} placeholder="2.5"
                    onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'); setHeightStr(v) }}
                    className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 pr-8 text-base font-bold text-[var(--text)] outline-none focus:border-[#FF6B00] transition-colors" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--text3)]">м</span>
                </div>
              </div>
            </div>
            {/* Live area calculation display */}
            <div className="mt-2 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]/50 text-xs">
              <span className="text-[var(--text3)]">{widthM > 0 ? widthM : '?'}м × {heightM > 0 ? heightM : '?'}м = </span>
              <span className="font-bold text-[var(--text)]">{widthM > 0 && heightM > 0 ? (widthM * heightM).toFixed(2) : '?'} м²</span>
              {result?.area_m2 && widthM * heightM < (formula.min_area_m2 || 0.25) && (
                <span className="text-[#F59E0B] ml-1">⚠️ мин. {formula.min_area_m2 || 0.25}м²</span>
              )}
            </div>
            <div className="text-[9px] text-[var(--text3)] mt-1">💡 Жишээ: 1.2м × 2.5м = 3.0 м². Таслалтай тоо (1.2, 0.5) оруулна уу.</div>
          </div>
        )}

        {/* Quantity */}
        <div>
          <div className="text-[10px] font-semibold text-[var(--text3)] mb-1 flex items-center gap-1"><Package className="w-3 h-3" strokeWidth={1.5} />Тоо ширхэг</div>
          <input type="text" inputMode="numeric" value={qtyStr} placeholder="1"
            onChange={e => setQtyStr(e.target.value.replace(/[^0-9]/g, '') || '1')}
            className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-base font-bold text-[var(--text)] outline-none focus:border-[#FF6B00] transition-colors" />
        </div>

        {/* Area display for result */}
        {isArea && result?.area_m2 && (
          <div className="flex items-end">
            <div className="text-xs text-[var(--text3)]">Тооцоолсон талбай: <span className="font-bold text-[var(--text)]">{result.area_m2.toFixed(2)} м²</span></div>
          </div>
        )}
      </div>

      {/* Options toggles */}
      {isArea && formula.options && Object.keys(formula.options).length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-[var(--text3)] mb-2">Нэмэлт сонголтууд:</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(formula.options).map(([key, opt]: [string, any]) => (
              <label key={key} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                options[key] ? 'border-[#FF6B00]/40 bg-[#FF6B00]/5' : 'border-[var(--border)] bg-[var(--surface)]'
              }`}>
                <input type="checkbox" checked={options[key] || false} onChange={e => setOptions({ ...options, [key]: e.target.checked })}
                  className="accent-[#FF6B00] w-4 h-4" />
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-[var(--text)] truncate">{key}</div>
                  <div className="text-[9px] text-[var(--text3)]">{opt.type === 'PER_M2' ? `₮${Number(opt.price).toLocaleString()}/м²` : `₮${Number(opt.price).toLocaleString()}`}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div key={JSON.stringify(result)} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
            {/* Price breakdown */}
            {result.material_cost > 0 && (
              <div className="space-y-1.5 mb-3 text-xs">
                {result.material_cost > 0 && <div className="flex justify-between"><span className="text-[var(--text3)]">Материал</span><span className="text-[var(--text)]">{fmt(result.material_cost)}</span></div>}
                {result.addons_cost > 0 && <div className="flex justify-between"><span className="text-[var(--text3)]">Нэмэлт</span><span className="text-[var(--text)]">{fmt(result.addons_cost)}</span></div>}
                {result.base_setup > 0 && <div className="flex justify-between"><span className="text-[var(--text3)]">Тохиргоо</span><span className="text-[var(--text)]">{fmt(result.base_setup)}</span></div>}
                {result.volume_discount > 0 && <div className="flex justify-between text-emerald-600"><span>Хөнгөлөлт</span><span>-{fmt(result.volume_discount)}</span></div>}
              </div>
            )}

            {/* Total */}
            <div className="flex items-baseline justify-between pt-2 border-t border-[var(--border)]">
              <span className="text-sm font-bold text-[var(--text)]">Нийт</span>
              <div className="text-right">
                <motion.div key={result.total} initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl font-extrabold text-[#FF6B00]">{result.total > 0 ? fmt(result.total) : 'Үнийн санал хүсэх'}</motion.div>
                {result.unit_price > 0 && qty > 1 && <div className="text-[10px] text-[var(--text3)]">Нэгж: {fmt(result.unit_price)}</div>}
              </div>
            </div>

            {/* Notes */}
            {result.notes?.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {result.notes.map((n: string, i: number) => (
                  <div key={i} className="text-[10px] text-[var(--text3)] flex items-start gap-1">
                    <span className="text-[var(--text3)]">•</span> {n}
                  </div>
                ))}
              </div>
            )}

            {calculating && <div className="text-[10px] text-[#FF6B00] mt-1 animate-pulse">Тооцоолж байна...</div>}
          </motion.div>
        )}
      </AnimatePresence>

      {isQuote && <div className="mt-3 text-center"><a href="/quote" className="text-xs font-bold text-[#FF6B00] no-underline hover:underline">📋 Үнийн санал хүсэх →</a></div>}
    </div>
  )
}
