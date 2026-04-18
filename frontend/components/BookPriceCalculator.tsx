'use client'
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, Lock, Download, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import {
  type PricingConstants, type CalcInput,
  DEFAULT_CONSTANTS, calculate,
} from '@/app/admin/print-calculator/pricing-engine'

const fmt = (n: number) => '₮' + Math.round(n).toLocaleString('mn-MN')

interface Props {
  product: any
  onPriceChange?: (total: number, breakdown: any) => void
  isAdminView?: boolean
}

export default function BookPriceCalculator({ product, onPriceChange, isAdminView = false }: Props) {
  const [constants] = useState<PricingConstants>(DEFAULT_CONSTANTS)
  const [expanded, setExpanded] = useState(false)
  const [isCustomSize, setIsCustomSize] = useState(false)
  const [customW, setCustomW] = useState(210)
  const [customH, setCustomH] = useState(297)
  const [input, setInput] = useState<CalcInput>({
    quantity: 500,
    totalPages: 64,
    paperSize: 'A3',
    paperGsm: 80,
    colorMode: 'color',
    folding: true,
    uvCoating: false,
    dieCutting: false,
    embossing: false,
    bindingType: 'Зөөлөн хавтас',
    hasCover: true,
    coverGsm: 250,
    coverColorMode: 'color',
  })

  const set = (k: keyof CalcInput, v: any) => setInput(prev => ({ ...prev, [k]: v }))

  // Custom хэмжээг A3 (420×297мм) талбайтай харьцуулан sizeMultiplier тооцоолох
  const effectiveInput = useMemo(() => {
    if (!isCustomSize) return input
    const customAreaMm2 = customW * customH
    const a3AreaMm2 = 420 * 297
    const customMultiplier = Math.max(0.25, Math.round((customAreaMm2 / a3AreaMm2) * 100) / 100)
    const customConstants = {
      ...constants,
      sizeMultiplier: { ...constants.sizeMultiplier, __CUSTOM__: customMultiplier },
      pagesPerSignature: { ...constants.pagesPerSignature, __CUSTOM__: 2 },
    }
    return { ...input, paperSize: '__CUSTOM__' as any, _customConstants: customConstants }
  }, [input, isCustomSize, customW, customH, constants])

  const activeConstants = (effectiveInput as any)._customConstants || constants
  const result = useMemo(() => calculate(effectiveInput, activeConstants), [effectiveInput, activeConstants])
  const total = result.total
  const unitPrice = result.unitPrice

  // Notify parent of price changes
  useEffect(() => {
    onPriceChange?.(total, {
      total, unit_price: unitPrice, quantity: input.quantity,
      formula_used: result.method, notes: result.warnings,
      is_estimate: false,
    })
  }, [total, unitPrice, input.quantity])

  const isLoggedIn = typeof window !== 'undefined' && !!(localStorage.getItem('access_token') || localStorage.getItem('token'))

  return (
    <div className="rounded-xl border border-[#FF6B00]/20 bg-gradient-to-b from-[#FF6B00]/5 to-transparent p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center">
            <Calculator className="w-3.5 h-3.5 text-[#FF6B00]" strokeWidth={1.5} />
          </div>
          <div>
            <span className="text-sm font-bold text-[var(--text)]">Номын үнэ тооцоолуур</span>
            <div className="text-[10px] text-[var(--text3)]">
              {result.method === 'offset' ? '🖨️ Офсет хэвлэл' : '⚡ Дижитал хэвлэл'} · {result.signatures} багц
              {result.sizeMultiplier > 1 && ` × ${result.sizeMultiplier} (${input.paperSize})`}
            </div>
          </div>
        </div>
        <motion.div
          key={total}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-right"
        >
          <div className="text-lg font-extrabold text-[#FF6B00]">{fmt(total)}</div>
          <div className="text-[10px] text-[var(--text3)]">Нэгж: {fmt(unitPrice)}</div>
        </motion.div>
      </div>

      {/* Core inputs — always visible */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <div className="text-[10px] text-[var(--text3)] mb-1 font-semibold">Тоо ширхэг</div>
          <input type="number" min={1} value={input.quantity}
            onChange={e => set('quantity', Math.max(1, +e.target.value))}
            className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-bold text-[var(--text)] outline-none focus:border-[#FF6B00] transition-colors" />
        </div>
        <div>
          <div className="text-[10px] text-[var(--text3)] mb-1 font-semibold">Нийт нүүр</div>
          <input type="number" min={1} value={input.totalPages}
            onChange={e => set('totalPages', Math.max(1, +e.target.value))}
            className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-bold text-[var(--text)] outline-none focus:border-[#FF6B00] transition-colors" />
        </div>
      </div>

      {/* Method badge */}
      <div className={`rounded-lg px-3 py-2 mb-2 text-xs font-semibold flex items-center gap-2 ${
        result.method === 'offset'
          ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
          : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
      }`}>
        {result.method === 'offset' ? '🖨️' : '⚡'}
        {input.quantity}ш → {result.method === 'offset' ? 'Офсет' : 'Дижитал'} · {result.signatures} багц × {result.pagesPerSig} нүүр
        {result.sizeMultiplier > 1 && ` · ×${result.sizeMultiplier} коэфф`}
      </div>

      {/* Expand toggle */}
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-[#FF6B00] bg-[#FF6B00]/5 rounded-lg border border-[#FF6B00]/10 cursor-pointer mb-2 hover:bg-[#FF6B00]/10 transition-colors">
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {expanded ? 'Хураах' : 'Дэлгэрэнгүй тохиргоо'}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Size & Paper */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <div className="text-[10px] text-[var(--text3)] mb-1 font-semibold">Хэмжээ</div>
                <select
                  value={isCustomSize ? '__CUSTOM__' : input.paperSize}
                  onChange={e => {
                    if (e.target.value === '__CUSTOM__') { setIsCustomSize(true) }
                    else { setIsCustomSize(false); set('paperSize', e.target.value) }
                  }}
                  className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-bold text-[var(--text)] outline-none focus:border-[#FF6B00] cursor-pointer">
                  {Object.keys(constants.pagesPerSignature).map(k => {
                    const mult = constants.sizeMultiplier?.[k] || 1
                    return <option key={k} value={k}>{k}{mult > 1 ? ` (×${mult})` : ''}</option>
                  })}
                  <option value="__CUSTOM__">📐 Custom хэмжээ</option>
                </select>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text3)] mb-1 font-semibold">Цаасны GSM</div>
                <select value={String(input.paperGsm)} onChange={e => set('paperGsm', +e.target.value)}
                  className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-bold text-[var(--text)] outline-none focus:border-[#FF6B00] cursor-pointer">
                  {constants.paperPrices.map(p => <option key={p.gsm} value={p.gsm}>{p.label}</option>)}
                </select>
              </div>
            </div>

            {/* Custom size inputs */}
            {isCustomSize && (
              <div className="grid grid-cols-2 gap-2 mb-2 bg-[#FF6B00]/5 border border-[#FF6B00]/20 rounded-lg p-2">
                <div>
                  <div className="text-[10px] text-[var(--text3)] mb-1 font-semibold">Өргөн (мм)</div>
                  <input type="number" min={50} max={2000} value={customW}
                    onChange={e => setCustomW(Math.max(50, +e.target.value))}
                    className="w-full h-8 rounded border border-[var(--border)] bg-[var(--surface)] px-2 text-[11px] font-bold text-[var(--text)] outline-none focus:border-[#FF6B00]" />
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text3)] mb-1 font-semibold">Өндөр (мм)</div>
                  <input type="number" min={50} max={2000} value={customH}
                    onChange={e => setCustomH(Math.max(50, +e.target.value))}
                    className="w-full h-8 rounded border border-[var(--border)] bg-[var(--surface)] px-2 text-[11px] font-bold text-[var(--text)] outline-none focus:border-[#FF6B00]" />
                </div>
                <div className="col-span-2 text-[10px] text-[var(--text3)]">
                  Талбай: {customW}×{customH}мм = {(customW * customH / 1_000_000).toFixed(3)} м²
                  · Коэфф: ×{(Math.round((customW * customH / (420 * 297)) * 100) / 100).toFixed(2)}
                </div>
              </div>
            )}

            {/* Color & Binding */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <div className="text-[10px] text-[var(--text3)] mb-1 font-semibold">Өнгө</div>
                <select value={input.colorMode} onChange={e => set('colorMode', e.target.value)}
                  className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-bold text-[var(--text)] outline-none focus:border-[#FF6B00] cursor-pointer">
                  <option value="color">Өнгөт (4+4)</option>
                  <option value="bw">Хар цагаан</option>
                </select>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text3)] mb-1 font-semibold">Хавтаслалт</div>
                <select value={input.bindingType} onChange={e => set('bindingType', e.target.value)}
                  className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-bold text-[var(--text)] outline-none focus:border-[#FF6B00] cursor-pointer">
                  <option value="">Байхгүй</option>
                  {Object.keys(constants.bindingPrices).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>

            {/* Post-press options */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { key: 'hasCover', label: 'Хавтас' },
                { key: 'folding', label: 'Бүрэлт', offset: true },
                { key: 'uvCoating', label: 'UV лак', offset: true },
                { key: 'dieCutting', label: 'Тигел', offset: true },
                { key: 'embossing', label: 'Эмбосс', offset: true },
              ].filter(o => !o.offset || result.method === 'offset').map(opt => {
                const val = (input as any)[opt.key]
                return (
                  <button key={opt.key} onClick={() => set(opt.key as any, !val)}
                    className={`px-2.5 py-1.5 rounded-md text-[10px] font-semibold border cursor-pointer transition-all ${
                      val ? 'border-[#FF6B00]/40 bg-[#FF6B00]/5 text-[#FF6B00]' : 'border-[var(--border)] text-[var(--text3)]'
                    }`}>
                    {opt.label}
                  </button>
                )
              })}
            </div>

            {/* Cover config */}
            {input.hasCover && (
              <div className="grid grid-cols-2 gap-2 mb-2 bg-[var(--surface2)] rounded-lg p-2">
                <div>
                  <div className="text-[10px] text-[var(--text3)] mb-1 font-semibold">Хавтас GSM</div>
                  <select value={String(input.coverGsm)} onChange={e => set('coverGsm', +e.target.value)}
                    className="w-full h-8 rounded border border-[var(--border)] bg-[var(--surface)] px-2 text-[11px] font-bold text-[var(--text)] outline-none cursor-pointer">
                    {constants.paperPrices.filter(p => p.gsm >= 200).map(p => <option key={p.gsm} value={p.gsm}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text3)] mb-1 font-semibold">Хавтас өнгө</div>
                  <select value={input.coverColorMode} onChange={e => set('coverColorMode', e.target.value)}
                    className="w-full h-8 rounded border border-[var(--border)] bg-[var(--surface)] px-2 text-[11px] font-bold text-[var(--text)] outline-none cursor-pointer">
                    <option value="color">Өнгөт</option><option value="bw">Хар цагаан</option>
                  </select>
                </div>
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="flex items-start gap-1.5 text-[10px] text-amber-600 bg-amber-50 rounded-lg p-2 mb-2 dark:bg-amber-900/20">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>{result.warnings.map((w, i) => <div key={i}>{w}</div>)}</div>
              </div>
            )}

            {/* Price breakdown — ADMIN: full detail, CUSTOMER: grouped */}
            <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] overflow-hidden mb-2">
              <div className="px-3 py-2 text-[10px] font-bold text-[var(--text3)] bg-[var(--surface2)]">Үнийн задаргаа</div>
              {isAdminView ? (
                /* ═══ ADMIN VIEW: Full line-by-line detail ═══ */
                result.lines.map((line, i) => (
                  <div key={line.key} className="px-3 py-1.5 flex justify-between items-start text-[11px]" style={{ borderBottom: i < result.lines.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <div className="font-semibold text-[var(--text)]">{line.label}</div>
                      <div className="text-[9px] text-[var(--text3)]">{line.detail}</div>
                    </div>
                    <span className="font-bold text-[var(--text)] whitespace-nowrap ml-2">{fmt(line.amount)}</span>
                  </div>
                ))
              ) : (
                /* ═══ CUSTOMER VIEW: Grouped (hides cost breakdown) ═══ */
                result.grouped.map((group, i) => (
                  <div key={group.key} className="px-3 py-2 flex justify-between items-center text-[12px]" style={{ borderBottom: i < result.grouped.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span className="font-semibold text-[var(--text)]">{group.label}</span>
                    <span className="font-bold text-[var(--text)] whitespace-nowrap">{fmt(group.amount)}</span>
                  </div>
                ))
              )}
              <div className="px-3 py-2 flex justify-between items-center bg-[var(--surface2)] border-t-2 border-[#FF6B00]/20">
                <span className="text-xs font-bold text-[var(--text)]">Нийт</span>
                <span className="text-base font-extrabold text-[#FF6B00]">{fmt(total)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result summary — always visible */}
      <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-3 mb-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-bold">Нийт дүн</span>
          <motion.span key={total} initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-xl font-extrabold text-[#FF6B00]">{fmt(total)}</motion.span>
        </div>
        <div className="flex justify-between text-[10px] text-[var(--text3)] mt-1">
          <span>Нэгж: {fmt(unitPrice)} × {input.quantity}ш</span>
          <span>{result.method === 'offset' ? 'Офсет' : 'Дижитал'} · {input.paperSize}{result.sizeMultiplier > 1 ? ` (×${result.sizeMultiplier})` : ''} · {input.totalPages}нүүр</span>
        </div>
      </div>

      {/* PDF download — login required */}
      <button
        onClick={() => {
          if (!isLoggedIn) {
            toast.error('Нэвтэрч орсны дараа PDF татах боломжтой')
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
            return
          }
          toast.success('Үнийн санал PDF үүсгэж байна...')
          // TODO: call backend PDF generation endpoint
        }}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all border border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--surface)] mb-1.5"
      >
        {isLoggedIn ? <Download className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />}
        {isLoggedIn ? 'Үнийн санал PDF татах' : 'Нэвтэрч PDF татах'}
      </button>

      <div className="text-[8px] text-[var(--text3)] text-center">
        💡 Тоо ширхэг, нүүр, цаасны GSM-ээс хамаарч үнэ автоматаар бодогдоно
      </div>
    </div>
  )
}
