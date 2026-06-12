'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Calculator, Settings, FileText, Download, Send,
  ChevronDown, ChevronUp, AlertTriangle, Printer,
  Zap, BookOpen, Scissors, Stamp, Layers,
  RotateCcw, Sparkles, PenLine,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  type PricingConstants, type CalcInput, type CalcResult, type LineItem,
  DEFAULT_CONSTANTS, calculate,
} from './pricing-engine'

const fmt = (n: number) => '₮' + Math.round(n).toLocaleString('mn-MN')
type NumericConstantKey = {
  [K in keyof PricingConstants]: PricingConstants[K] extends number ? K : never
}[keyof PricingConstants]
const colorModeFrom = (value: string): CalcInput['colorMode'] => value === 'bw' ? 'bw' : 'color'

// ─── Main Page ───────────────────────────────────────────────────

export default function PrintCalculatorPage() {
  const [constants, setConstants] = useState<PricingConstants>(DEFAULT_CONSTANTS)
  const [showSettings, setShowSettings] = useState(false)

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

  // Admin overrides: key → manual amount
  const [overrides, setOverrides] = useState<Record<string, number>>({})
  const [editingKey, setEditingKey] = useState<string | null>(null)

  const set = <K extends keyof CalcInput>(k: K, v: CalcInput[K]) => setInput(prev => ({ ...prev, [k]: v }))

  // Calculate result
  const result: CalcResult = useMemo(() => calculate(input, constants), [input, constants])

  // Apply overrides to get final lines
  const finalLines = useMemo(() => {
    return result.lines.map(line => ({
      ...line,
      amount: overrides[line.key] !== undefined ? overrides[line.key] : line.amount,
      isOverridden: overrides[line.key] !== undefined,
    }))
  }, [result.lines, overrides])

  const finalTotal = finalLines.reduce((s, l) => s + l.amount, 0)
  const finalUnitPrice = input.quantity > 0 ? Math.round(finalTotal / input.quantity) : 0

  const clearOverrides = () => { setOverrides({}); setEditingKey(null) }

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-[#FF6B00]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">Хэвлэлийн үнийн калькулятор</h1>
            <p className="text-xs text-[var(--text3)]">Офсет + Дижитал Hybrid Logic</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {Object.keys(overrides).length > 0 && (
            <button onClick={clearOverrides}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Засварууд арилгах
            </button>
          )}
          <button onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[var(--text2)] bg-[var(--surface2)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface)] transition-colors">
            <Settings className="w-3.5 h-3.5" strokeWidth={1.5} />
            Тохиргоо {showSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Admin Settings Panel */}
      {showSettings && <AdminSettings constants={constants} setConstants={setConstants} />}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* ═══ LEFT: Input Form ═══ */}
        <div className="space-y-4">
          {/* Method indicator */}
          <div className={`rounded-xl border p-3 flex items-center gap-3 ${
            result.method === 'offset'
              ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
              : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              result.method === 'offset' ? 'bg-purple-100 dark:bg-purple-800' : 'bg-blue-100 dark:bg-blue-800'
            }`}>
              {result.method === 'offset'
                ? <Printer className="w-4 h-4 text-purple-600" strokeWidth={1.5} />
                : <Zap className="w-4 h-4 text-blue-600" strokeWidth={1.5} />}
            </div>
            <div>
              <div className={`text-sm font-bold ${result.method === 'offset' ? 'text-purple-700 dark:text-purple-300' : 'text-blue-700 dark:text-blue-300'}`}>
                {result.method === 'offset' ? 'Офсет хэвлэл' : 'Дижитал хэвлэл'}
              </div>
              <div className="text-[11px] text-[var(--text3)]">
                {result.method === 'offset'
                  ? `${input.quantity}ш ≥ 300 → Офсет | ${result.signatures} багц × ${result.pagesPerSig} нүүр${result.sizeMultiplier > 1 ? ` × ${result.sizeMultiplier} коэфф (${input.paperSize}) = ${result.effectiveSignatures} нийт багц` : ''}`
                  : `${input.quantity}ш < 300 → Дижитал хэвлэл`}
              </div>
            </div>
          </div>

          {/* Core inputs */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <h3 className="text-sm font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#FF6B00]" strokeWidth={1.5} />
              Үндсэн мэдээлэл
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <InputField label="Тоо ширхэг" value={input.quantity} type="number" min={1}
                onChange={v => set('quantity', Math.max(1, +v))} />
              <InputField label="Нийт нүүр" value={input.totalPages} type="number" min={1}
                onChange={v => set('totalPages', Math.max(1, +v))} />
              <SelectField label="Хэмжээ" value={input.paperSize}
                options={Object.keys(constants.pagesPerSignature).map(k => {
                  const mult = constants.sizeMultiplier?.[k] || 1
                  return { value: k, label: mult > 1 ? `${k} (×${mult})` : k }
                })}
                onChange={v => set('paperSize', v)} />
              <SelectField label="Цаасны GSM" value={String(input.paperGsm)}
                options={constants.paperPrices.map(p => ({ value: String(p.gsm), label: p.label }))}
                onChange={v => set('paperGsm', +v)} />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <SelectField label="Өнгө" value={input.colorMode}
                options={[{ value: 'color', label: 'Өнгөт (4+4)' }, { value: 'bw', label: 'Хар цагаан (1+1)' }]}
                onChange={v => set('colorMode', colorModeFrom(v))} />
              <SelectField label="Хавтаслалт" value={input.bindingType}
                options={[{ value: '', label: 'Байхгүй' }, ...Object.keys(constants.bindingPrices).map(k => ({ value: k, label: k }))]}
                onChange={v => set('bindingType', v)} />
            </div>
          </div>

          {/* Cover */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input type="checkbox" checked={input.hasCover} onChange={e => set('hasCover', e.target.checked)}
                className="accent-[#FF6B00] w-4 h-4" />
              <Layers className="w-4 h-4 text-[#FF6B00]" strokeWidth={1.5} />
              <span className="text-sm font-bold text-[var(--text)]">Хавтас (Cover)</span>
            </label>
            {input.hasCover && (
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Хавтасны GSM" value={String(input.coverGsm)}
                  options={constants.paperPrices.filter(p => p.gsm >= 200).map(p => ({ value: String(p.gsm), label: p.label }))}
                  onChange={v => set('coverGsm', +v)} />
                <SelectField label="Хавтас өнгө" value={input.coverColorMode}
                  options={[{ value: 'color', label: 'Өнгөт' }, { value: 'bw', label: 'Хар цагаан' }]}
                  onChange={v => set('coverColorMode', colorModeFrom(v))} />
              </div>
            )}
          </div>

          {/* Post-press options (offset only) */}
          {result.method === 'offset' && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
              <h3 className="text-sm font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#FF6B00]" strokeWidth={1.5} />
                Нэмэлт ажилбар (Post-press)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <ToggleChip label="Бүрэлт" icon={<Layers className="w-3.5 h-3.5" />} active={input.folding} onClick={() => set('folding', !input.folding)} />
                <ToggleChip label="Лак (UV)" icon={<Sparkles className="w-3.5 h-3.5" />} active={input.uvCoating} onClick={() => set('uvCoating', !input.uvCoating)} />
                <ToggleChip label="Тигел" icon={<Scissors className="w-3.5 h-3.5" />} active={input.dieCutting} onClick={() => set('dieCutting', !input.dieCutting)} />
                <ToggleChip label="Эмбосс" icon={<Stamp className="w-3.5 h-3.5" />} active={input.embossing} onClick={() => set('embossing', !input.embossing)} />
              </div>
            </div>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 dark:bg-amber-900/20 dark:border-amber-800">
              {result.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
                  {w}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Result Panel ═══ */}
        <div className="space-y-4">
          {/* Total card */}
          <div className="bg-gradient-to-br from-[#FF6B00] to-[#FF8C42] rounded-xl p-5 text-white">
            <div className="text-xs font-semibold opacity-80 mb-1">Нийт дүн</div>
            <div className="text-3xl font-extrabold tracking-tight">{fmt(finalTotal)}</div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20 text-sm">
              <span className="opacity-80">Нэгж үнэ:</span>
              <span className="font-bold">{fmt(finalUnitPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-80">Тираж:</span>
              <span className="font-bold">{input.quantity} ширхэг</span>
            </div>
            {Object.keys(overrides).length > 0 && (
              <div className="mt-2 text-[11px] opacity-70 flex items-center gap-1">
                <PenLine className="w-3 h-3" /> {Object.keys(overrides).length} зүйл гараар засагдсан
              </div>
            )}
          </div>

          {/* Line items */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF6B00]" strokeWidth={1.5} />
                Үнийн задаргаа
              </h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {finalLines.map(line => (
                <EditableLineItem key={line.key} line={line}
                  isEditing={editingKey === line.key}
                  onStartEdit={() => setEditingKey(line.key)}
                  onSave={(val) => {
                    setOverrides(prev => ({ ...prev, [line.key]: val }))
                    setEditingKey(null)
                  }}
                  onCancel={() => setEditingKey(null)}
                  onReset={() => {
                    setOverrides(prev => { const n = { ...prev }; delete n[line.key]; return n })
                    setEditingKey(null)
                  }}
                />
              ))}
            </div>
            {/* Total row */}
            <div className="p-4 bg-[var(--surface2)] flex items-center justify-between border-t-2 border-[#FF6B00]/30">
              <span className="font-bold text-sm text-[var(--text)]">Нийт</span>
              <span className="text-lg font-extrabold text-[#FF6B00]">{fmt(finalTotal)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => toast.success('PDF үүсгэж байна...')}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--surface2)] border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text)] hover:bg-[var(--surface)] transition-colors cursor-pointer">
              <Download className="w-4 h-4" strokeWidth={1.5} /> PDF татах
            </button>
            <button onClick={() => toast.success('Захиалга илгээгдлээ!')}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#FF6B00] rounded-xl text-sm font-bold text-white hover:bg-[#E86000] transition-colors cursor-pointer">
              <Send className="w-4 h-4" strokeWidth={1.5} /> Захиалга илгээх
            </button>
          </div>

          {/* Technical info */}
          <div className="bg-[var(--surface2)] rounded-xl p-4 text-xs text-[var(--text3)] space-y-1">
            <div>Хэвлэлийн арга: <strong className="text-[var(--text)]">{result.method === 'offset' ? 'Офсет' : 'Дижитал'}</strong></div>
            <div>Багцын тоо: <strong className="text-[var(--text)]">{result.signatures}</strong> ({result.pagesPerSig} нүүр/багц)
              {result.sizeMultiplier > 1 && <> · Коэфф: <strong className="text-[#FF6B00]">×{result.sizeMultiplier}</strong> · Нийт: <strong className="text-[#FF6B00]">{result.effectiveSignatures} багц</strong></>}
            </div>
            <div>Шаардлагатай хуудас: <strong className="text-[var(--text)]">{result.sheetsNeeded.toLocaleString()}</strong></div>
            <div>Хэмжээ: <strong className="text-[var(--text)]">{input.paperSize}</strong> · Цаас: <strong className="text-[var(--text)]">{input.paperGsm}gsm</strong></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Editable Line Item ──────────────────────────────────────────

function EditableLineItem({ line, isEditing, onStartEdit, onSave, onCancel, onReset }: {
  line: LineItem & { isOverridden?: boolean }
  isEditing: boolean
  onStartEdit: () => void
  onSave: (val: number) => void
  onCancel: () => void
  onReset: () => void
}) {
  const [val, setVal] = useState(String(line.amount))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      void Promise.resolve().then(() => {
        setVal(String(line.amount))
        setTimeout(() => inputRef.current?.select(), 50)
      })
    }
  }, [isEditing, line.amount])

  if (isEditing) {
    return (
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20">
        <div className="text-xs font-semibold text-[var(--text)] mb-1">{line.label}</div>
        <div className="flex items-center gap-2">
          <input ref={inputRef} type="number" value={val} onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSave(+val); if (e.key === 'Escape') onCancel() }}
            className="flex-1 px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-sm font-bold text-[var(--text)] outline-none focus:border-[#FF6B00]" />
          <button onClick={() => onSave(+val)} className="px-2 py-1.5 bg-[#FF6B00] text-white rounded-lg text-xs font-bold">OK</button>
          {line.isOverridden && (
            <button onClick={onReset} className="px-2 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-xs font-bold">Буцаах</button>
          )}
          <button onClick={onCancel} className="text-xs text-[var(--text3)] hover:text-[var(--text)]">✕</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[var(--surface2)] transition-colors group ${
      line.isOverridden ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''
    }`} onClick={onStartEdit} title="Дарж үнэ өөрчлөх">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[var(--text)] flex items-center gap-1.5">
          {line.label}
          {line.isOverridden && <PenLine className="w-3 h-3 text-amber-500" />}
        </div>
        <div className="text-[11px] text-[var(--text3)] truncate">{line.detail}</div>
      </div>
      <div className={`text-sm font-bold whitespace-nowrap ml-4 ${
        line.isOverridden ? 'text-amber-600' : 'text-[var(--text)]'
      }`}>
        {fmt(line.amount)}
      </div>
    </div>
  )
}

// ─── Admin Settings Panel ────────────────────────────────────────

function AdminSettings({ constants, setConstants }: {
  constants: PricingConstants; setConstants: (c: PricingConstants) => void
}) {
  const upd = (key: NumericConstantKey, value: number) => setConstants({ ...constants, [key]: value })

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-[var(--text)] mb-4 flex items-center gap-2">
        <Settings className="w-4 h-4 text-[var(--text3)]" strokeWidth={1.5} />
        Тогтмол үнүүд (Constants)
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <SettingInput label="Ашгийн хувь (%)" value={Math.round(constants.marginPercent * 100)} onChange={v => upd('marginPercent', +v / 100)} />
        <SettingInput label="Хавтан (₮)" value={constants.platePrice} onChange={v => upd('platePrice', +v)} />
        <SettingInput label="Хавтан/багц (Өнгөт)" value={constants.platesPerSignatureColor} onChange={v => upd('platesPerSignatureColor', +v)} />
        <SettingInput label="Хавтан/багц (ХЦ)" value={constants.platesPerSignatureBw} onChange={v => upd('platesPerSignatureBw', +v)} />
        <SettingInput label="Дижитал өнгөт (₮/нүүр)" value={constants.digitalColorPerPage} onChange={v => upd('digitalColorPerPage', +v)} />
        <SettingInput label="Дижитал ХЦ (₮/нүүр)" value={constants.digitalBwPerPage} onChange={v => upd('digitalBwPerPage', +v)} />
        <SettingInput label="Хаягдал (%)" value={Math.round(constants.paperWaste * 100)} onChange={v => upd('paperWaste', +v / 100)} />
        <SettingInput label="Дижитал хязгаар" value={constants.digitalMaxQty} onChange={v => upd('digitalMaxQty', +v)} />
      </div>

      {/* Press fee tiers — Color */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--text3)] mb-2">Машин ажиллагаа — Өнгөт (шатлал)</div>
        <div className="grid grid-cols-4 gap-2">
          {constants.pressFee.map((tier, i) => (
            <div key={i} className="bg-[var(--surface2)] rounded-lg p-2">
              <div className="text-[10px] text-[var(--text3)]">{tier.min}-{tier.max === 999999 ? '∞' : tier.max}</div>
              <input type="number" value={tier.price} onChange={e => {
                const newFees = [...constants.pressFee]; newFees[i] = { ...tier, price: +e.target.value }
                setConstants({ ...constants, pressFee: newFees })
              }} className="w-full mt-1 px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-xs font-bold text-[var(--text)] outline-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Press fee tiers — BW */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--text3)] mb-2">Машин ажиллагаа — Хар цагаан (шатлал)</div>
        <div className="grid grid-cols-4 gap-2">
          {constants.pressFeeBw.map((tier, i) => (
            <div key={i} className="bg-[var(--surface2)] rounded-lg p-2">
              <div className="text-[10px] text-[var(--text3)]">{tier.min}-{tier.max === 999999 ? '∞' : tier.max}</div>
              <input type="number" value={tier.price} onChange={e => {
                const newFees = [...constants.pressFeeBw]; newFees[i] = { ...tier, price: +e.target.value }
                setConstants({ ...constants, pressFeeBw: newFees })
              }} className="w-full mt-1 px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-xs font-bold text-[var(--text)] outline-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Binding prices */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-[var(--text3)] mb-2">Хавтаслалт (₮/ширхэг)</div>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(constants.bindingPrices).map(([key, price]) => (
            <div key={key} className="bg-[var(--surface2)] rounded-lg p-2">
              <div className="text-[10px] text-[var(--text3)]">{key}</div>
              <input type="number" value={price} onChange={e => {
                setConstants({ ...constants, bindingPrices: { ...constants.bindingPrices, [key]: +e.target.value } })
              }} className="w-full mt-1 px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-xs font-bold text-[var(--text)] outline-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Paper prices */}
      <div>
        <div className="text-xs font-semibold text-[var(--text3)] mb-2">Цаасны үнэ (₮/хуудас)</div>
        <div className="grid grid-cols-4 gap-2">
          {constants.paperPrices.map((p, i) => (
            <div key={i} className="bg-[var(--surface2)] rounded-lg p-2">
              <div className="text-[10px] text-[var(--text3)]">{p.label}</div>
              <input type="number" value={p.price} onChange={e => {
                const newPrices = [...constants.paperPrices]; newPrices[i] = { ...p, price: +e.target.value }
                setConstants({ ...constants, paperPrices: newPrices })
              }} className="w-full mt-1 px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-xs font-bold text-[var(--text)] outline-none" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button onClick={() => { setConstants(DEFAULT_CONSTANTS); toast.success('Анхны тохиргоо сэргээгдлээ') }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--text3)] bg-[var(--surface2)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface)] transition-colors">
          <RotateCcw className="w-3 h-3" /> Анхны утга
        </button>
      </div>
    </div>
  )
}

// ─── Reusable UI components ──────────────────────────────────────

function InputField({ label, value, type, min, onChange }: {
  label: string; value: number; type?: string; min?: number; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-[var(--text3)] mb-1">{label}</label>
      <input type={type || 'text'} value={value} min={min}
        onChange={e => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm font-bold text-[var(--text)] outline-none focus:border-[#FF6B00] transition-colors" />
    </div>
  )
}

function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-[var(--text3)] mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm font-bold text-[var(--text)] outline-none focus:border-[#FF6B00] transition-colors appearance-none cursor-pointer">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function ToggleChip({ label, icon, active, onClick }: {
  label: string; icon: React.ReactNode; active: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
        active
          ? 'border-[#FF6B00]/40 bg-[#FF6B00]/5 text-[#FF6B00]'
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text3)]'
      }`}>
      {icon} {label}
    </button>
  )
}

function SettingInput({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-[var(--text3)] mb-1">{label}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-bold text-[var(--text)] outline-none focus:border-[#FF6B00]" />
    </div>
  )
}
