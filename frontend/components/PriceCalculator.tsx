'use client'
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, Ruler, Package } from 'lucide-react'

const fmt = (n: number) => '₮' + n.toLocaleString('mn-MN')

interface Props {
  product: any
  onPriceChange?: (total: number, breakdown: any) => void
}

export default function PriceCalculator({ product, onPriceChange }: Props) {
  const p = product
  const formula = p.price_formula || {}
  // Auto-detect area_based (price_formula null үед unit/category-аас шалгана)
  const unit = (p.compare_specs?.unit || '').toLowerCase()
  const category = (p.category || '').toLowerCase()
  const autoAreaBased = !formula.type && (
    unit === 'мкв' || unit === 'м2' || unit === 'm2' ||
    category.includes('хэвлэл') || category.includes('баннер') || category.includes('самбар')
  )
  const isArea = p.pricing_mode === 'formula' && (formula.type === 'area_based' || autoAreaBased)
  const isTier = p.pricing_mode === 'tier'
  const needsDimensions = p.requires_dimensions || isArea
  const doubleSideMultiplier = Number(formula.double_side_multiplier ?? p.double_side_multiplier ?? 0)
  const sidesEnabled = doubleSideMultiplier > 1

  const [widthStr, setWidthStr] = useState('1')
  const [heightStr, setHeightStr] = useState('1')
  const [qtyStr, setQtyStr] = useState(String(p.min_quantity || 1))
  const [options, setOptions] = useState<Record<string, boolean>>({})
  const [sides, setSides] = useState<'single' | 'double'>('single')
  const [result, setResult] = useState<any>(null)
  const [calculating, setCalculating] = useState(false)

  const widthM = Math.max(0, parseFloat(widthStr) || 0)
  const heightM = Math.max(0, parseFloat(heightStr) || 0)
  const width = Math.round(widthM * 1000)
  const height = Math.round(heightM * 1000)
  const qty = Math.max(1, parseInt(qtyStr) || 1)
  const areaM2 = widthM * heightM

  // Init options
  useEffect(() => {
    if (formula.options) {
      const init: Record<string, boolean> = {}
      Object.keys(formula.options).forEach(k => { init[k] = false })
      setOptions(init)
    }
  }, [])

  // Calculate
  const calculate = useCallback(async () => {
    const effectiveSides = sidesEnabled ? sides : 'single'
    const sidesMultiplier = effectiveSides === 'double' ? doubleSideMultiplier : 1
    const sidesPctLabel = doubleSideMultiplier === 2 ? '×2 талбай' : `+${Math.round((doubleSideMultiplier - 1) * 100)}%`
    const sidesNote = effectiveSides === 'double' ? `Хоёр талын хэвлэл (${sidesPctLabel})` : 'Нэг талын хэвлэл'
    const basePrice = Number(p.sale_price || p.base_price || 0)

    // Fixed price — no API needed
    if (!isArea && !isTier) {
      const total = Math.round(basePrice * qty * sidesMultiplier)
      const r = { total, unit_price: Math.round(total / qty), formula_used: 'fixed', notes: [sidesNote], volume_discount: 0, quantity: qty, is_estimate: false }
      setResult(r)
      onPriceChange?.(total, r)
      return
    }

    // Need valid dimensions for area
    if (needsDimensions && (widthM <= 0 || heightM <= 0)) {
      setResult(null)
      onPriceChange?.(0, null)
      return
    }

    setCalculating(true)
    try {
      const res = await apiFetch<any>(`/products/${p.id}/calculate`, {
        method: 'POST', auth: false,
        body: { quantity: qty, width_mm: width, height_mm: height, options, sides } as any,
      })
      const apiTotal = Number(res?.total) || 0
      const apiUnit = Number(res?.unit_price) || 0
      const adjusted = {
        ...res,
        total: Math.round(apiTotal * sidesMultiplier),
        unit_price: Math.round(apiUnit * sidesMultiplier),
        notes: [...(res?.notes || []), sidesNote],
      }
      setResult(adjusted)
      onPriceChange?.(adjusted.total, adjusted)
    } catch {
      // Fallback: client-side calc using base_price and area/qty
      const pricePerM2 = Number(formula.price_per_m2 || basePrice)
      const effectiveArea = Math.max(areaM2, Number(formula.min_area_m2) || 0)
      const fallbackTotal = isArea
        ? Math.round(pricePerM2 * effectiveArea * qty * sidesMultiplier)
        : Math.round(basePrice * qty * sidesMultiplier)
      const r = { total: fallbackTotal, unit_price: Math.round(fallbackTotal / qty), formula_used: 'fallback', notes: [sidesNote, '⚠ Серверийн алдаа — суурь үнээр тооцоолсон'], volume_discount: 0, quantity: qty, is_estimate: true }
      setResult(r)
      onPriceChange?.(fallbackTotal, r)
    } finally {
      setCalculating(false)
    }
  }, [qty, width, height, options, sides, sidesEnabled, doubleSideMultiplier, p.id, isArea, isTier, needsDimensions, widthM, heightM])

  // Debounce 300ms
  useEffect(() => {
    const t = setTimeout(calculate, 300)
    return () => clearTimeout(t)
  }, [calculate])

  // Sanitize decimal input (allow one dot only)
  const sanitize = (v: string) => v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')

  // ═══ AREA-BASED (Самбар) — Өргөн × Өндөр ═══
  if (needsDimensions) {
    return (
      <div className="rounded-xl border border-[#FF6B00]/20 bg-gradient-to-b from-[#FF6B00]/5 to-transparent p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center">
            <Calculator className="w-3.5 h-3.5 text-[#FF6B00]" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-bold text-[var(--text)]">М² тооцоолуур</span>
        </div>

        {sidesEnabled && (
        <div className="mb-3">
          <div className="text-[10px] text-[var(--text3)] mb-1.5 font-semibold uppercase tracking-wide">Хэвлэх тал</div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { v: 'single', l: 'Нэг тал', d: 'Зөвхөн урд', icon: '▢' },
              { v: 'double', l: 'Хоёр тал', d: 'Урд + ард', icon: '▣' },
            ].map(s => (
              <button
                key={s.v}
                onClick={() => setSides(s.v as 'single' | 'double')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                  sides === s.v
                    ? 'border-[#FF6B00] bg-[#FF6B00]/8 text-[var(--text)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text2)]'
                }`}>
                <span className="text-lg leading-none">{s.icon}</span>
                <div>
                  <div className="text-xs font-semibold leading-tight">{s.l}</div>
                  <div className="text-[9px] text-[var(--text3)]">{s.d}{s.v === 'double' ? (doubleSideMultiplier === 2 ? ' · ×2 талбай' : ` · +${Math.round((doubleSideMultiplier - 1) * 100)}%`) : ''}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Dimensions */}
        <div className="grid grid-cols-[1fr_24px_1fr] gap-1.5 items-end mb-2">
          <div>
            <div className="text-[10px] text-[var(--text3)] mb-1 font-semibold">Өргөн</div>
            <div className="relative">
              <input type="text" inputMode="decimal" value={widthStr} placeholder="1.2"
                onChange={e => setWidthStr(sanitize(e.target.value))}
                className="w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 pr-8 text-lg font-bold text-[var(--text)] outline-none focus:border-[#FF6B00] transition-colors" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text3)]">м</span>
            </div>
          </div>
          <span className="text-center text-lg text-[var(--text3)] pb-2">×</span>
          <div>
            <div className="text-[10px] text-[var(--text3)] mb-1 font-semibold">Өндөр</div>
            <div className="relative">
              <input type="text" inputMode="decimal" value={heightStr} placeholder="2.5"
                onChange={e => setHeightStr(sanitize(e.target.value))}
                className="w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 pr-8 text-lg font-bold text-[var(--text)] outline-none focus:border-[#FF6B00] transition-colors" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text3)]">м</span>
            </div>
          </div>
        </div>

        {/* Live area */}
        <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)]/50 px-3 py-2 mb-3 text-sm">
          {widthM > 0 && heightM > 0 ? (
            <span><span className="text-[var(--text3)]">{widthM}м × {heightM}м = </span><span className="font-bold text-[var(--text)]">{areaM2.toFixed(2)} м²</span>
              {areaM2 < (formula.min_area_m2 || 0.25) && <span className="text-[#F59E0B] text-xs ml-2">⚠ мин. {formula.min_area_m2 || 0.25}м²</span>}
            </span>
          ) : <span className="text-[var(--text3)]">Өргөн, өндрийг оруулна уу</span>}
        </div>

        {/* Quantity */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-[var(--text3)]">Тоо:</span>
          <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
            <button onClick={() => setQtyStr(String(Math.max(1, qty - 1)))} className="w-9 h-9 bg-[var(--surface2)] border-none cursor-pointer text-sm text-[var(--text2)]">−</button>
            <input type="text" inputMode="numeric" value={qtyStr} onChange={e => setQtyStr(e.target.value.replace(/[^0-9]/g, '') || '1')}
              className="w-12 h-9 border-none text-center text-sm font-bold bg-[var(--surface)] text-[var(--text)] outline-none" />
            <button onClick={() => setQtyStr(String(qty + 1))} className="w-9 h-9 bg-[var(--surface2)] border-none cursor-pointer text-sm text-[var(--text2)]">+</button>
          </div>
        </div>

        {/* Options */}
        {formula.options && Object.keys(formula.options).length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] font-semibold text-[var(--text3)] mb-1.5">Нэмэлт сонголт:</div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(formula.options).map(([key, opt]: [string, any]) => (
                <label key={key} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-xs ${
                  options[key] ? 'border-[#FF6B00]/40 bg-[#FF6B00]/5' : 'border-[var(--border)] bg-[var(--surface)]'
                }`}>
                  <input type="checkbox" checked={options[key] || false} onChange={e => setOptions({ ...options, [key]: e.target.checked })}
                    className="accent-[#FF6B00] w-3.5 h-3.5" />
                  <div>
                    <div className="font-semibold text-[var(--text)]">{key}</div>
                    <div className="text-[9px] text-[var(--text3)]">{opt.type === 'PER_M2' ? `₮${Number(opt.price).toLocaleString()}/м²` : `₮${Number(opt.price).toLocaleString()}`}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        <AnimatePresence mode="wait">
          {calculating ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4 text-center">
              <div className="text-sm text-[#FF6B00] animate-pulse">Тооцоолж байна...</div>
            </motion.div>
          ) : result && result.total > 0 ? (
            <motion.div key="result" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4">
              {result.material_cost > 0 && (
                <div className="space-y-1 mb-2 text-xs">
                  <div className="flex justify-between"><span className="text-[var(--text3)]">Материал</span><span>{fmt(result.material_cost)}</span></div>
                  {result.addons_cost > 0 && <div className="flex justify-between"><span className="text-[var(--text3)]">Нэмэлт</span><span>{fmt(result.addons_cost)}</span></div>}
                  {result.volume_discount > 0 && <div className="flex justify-between text-emerald-600"><span>Хөнгөлөлт</span><span>-{fmt(result.volume_discount)}</span></div>}
                </div>
              )}
              <div className="flex items-baseline justify-between pt-2 border-t border-[var(--border)]">
                <span className="text-sm font-bold">Нийт</span>
                <motion.span key={result.total} initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl font-extrabold text-[#FF6B00]">{fmt(result.total)}</motion.span>
              </div>
              {result.unit_price > 0 && qty > 1 && <div className="text-[10px] text-[var(--text3)] text-right">Нэгж: {fmt(result.unit_price)} × {qty}ш</div>}
              {sidesEnabled && sides === 'double' && (
                <div className="text-[9px] text-amber-500 mt-0.5">▣ Хоёр талын хэвлэл тооцоологдсон</div>
              )}
              {result.notes?.map((n: string, i: number) => <div key={i} className="text-[9px] text-[var(--text3)] mt-0.5">• {n}</div>)}
            </motion.div>
          ) : widthM > 0 && heightM > 0 ? (
            <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4 text-center text-sm text-[var(--text3)]">
              Тооцоолж байна...
            </div>
          ) : null}
        </AnimatePresence>

        <div className="text-[8px] text-[var(--text3)] mt-2">💡 Жишээ: 1.2м × 2.5м = 3.0м². Таслалтай тоо (1.2, 0.5) оруулна уу.</div>
      </div>
    )
  }

  // ═══ FIXED / TIER — Тоо ширхэг ═══
  const price = Number(p.sale_price || p.base_price || 0)
  const sidesMult = sidesEnabled && sides === 'double' ? doubleSideMultiplier : 1
  const displayTotal = result?.total ?? Math.round(price * qty * sidesMult)
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface2)]/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-[#FF6B00]" strokeWidth={1.5} />
        <span className="text-sm font-bold text-[var(--text)]">Үнэ тооцоолол</span>
      </div>

      {sidesEnabled && (
      <div className="mb-3">
        <div className="text-[10px] text-[var(--text3)] mb-1.5 font-semibold uppercase tracking-wide">Хэвлэх тал</div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { v: 'single', l: 'Нэг тал', d: 'Зөвхөн урд', icon: '▢' },
            { v: 'double', l: 'Хоёр тал', d: 'Урд + ард', icon: '▣' },
          ].map(s => (
            <button
              key={s.v}
              onClick={() => setSides(s.v as 'single' | 'double')}
              className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                sides === s.v
                  ? 'border-[#FF6B00] bg-[#FF6B00]/8 text-[var(--text)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text2)]'
              }`}>
              <span className="text-lg leading-none">{s.icon}</span>
              <div>
                <div className="text-xs font-semibold leading-tight">{s.l}</div>
                <div className="text-[9px] text-[var(--text3)]">{s.d}{s.v === 'double' ? (doubleSideMultiplier === 2 ? ' · ×2' : ` · +${Math.round((doubleSideMultiplier - 1) * 100)}%`) : ''}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-xs text-[var(--text3)]">Тоо:</span>
        <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
          <button onClick={() => setQtyStr(String(Math.max(1, qty - 1)))} className="w-9 h-9 bg-[var(--surface2)] border-none cursor-pointer text-sm text-[var(--text2)]">−</button>
          <input type="text" inputMode="numeric" value={qtyStr} onChange={e => setQtyStr(e.target.value.replace(/[^0-9]/g, '') || '1')}
            className="w-12 h-9 border-none text-center text-sm font-bold bg-[var(--surface)] text-[var(--text)] outline-none" />
          <button onClick={() => setQtyStr(String(qty + 1))} className="w-9 h-9 bg-[var(--surface2)] border-none cursor-pointer text-sm text-[var(--text2)]">+</button>
        </div>
        <span className="text-xs text-[var(--text3)]">=</span>
        <motion.span key={displayTotal} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          className="text-lg font-extrabold text-[#FF6B00]">{fmt(displayTotal)}</motion.span>
      </div>
      {sidesEnabled && sides === 'double' && (
        <div className="text-[9px] text-amber-500 mt-1">▣ Хоёр талын хэвлэл тооцоологдсон</div>
      )}
      {result?.volume_discount > 0 && <div className="text-[10px] text-emerald-600 mt-1">📦 Хөнгөлөлт: -{fmt(result.volume_discount)}</div>}
    </div>
  )
}
