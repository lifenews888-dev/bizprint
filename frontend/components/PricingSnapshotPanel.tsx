'use client'

import { useMemo, useState } from 'react'

type SnapshotValue = string | number | boolean | null | undefined

interface PricingSnapshotPanelProps {
  snapshot?: any
  estimatedPrice?: number | string | null
  compact?: boolean
}

const money = (value: SnapshotValue) => {
  const n = Number(value || 0)
  return n > 0 ? `${n.toLocaleString()}₮` : '—'
}

const text = (value: SnapshotValue) => {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

const severityStyle = (severity: string) => {
  if (severity === 'critical') return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300'
  if (severity === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300'
  return 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300'
}

const severityLabel = (severity: string) => {
  if (severity === 'critical') return 'Ноцтой зөрүү'
  if (severity === 'warning') return 'Анхаарах зөрүү'
  if (severity === 'minor') return 'Бага зөрүү'
  return 'Зөрүүгүй'
}

const triggerLabel = (trigger: string) => {
  if (trigger === 'manual_reprice') return 'Админ дахин бодсон'
  if (trigger === 'create') return 'Анх үүсэхэд'
  return ''
}

export default function PricingSnapshotPanel({ snapshot, estimatedPrice, compact = false }: PricingSnapshotPanelProps) {
  const [copied, setCopied] = useState(false)
  const breakdown = snapshot?.breakdown || {}
  const meta = snapshot?.meta || {}
  const serverResult = snapshot?.serverResult || {}
  const spec = snapshot?.spec || {}
  const product = snapshot?.product || {}
  const materialPrint = Number(breakdown.material || 0) + Number(breakdown.print || 0)
  const materialRateM2 = Number(meta.materialRateM2 ?? serverResult.materialRateM2 ?? 0)
  const printRateM2 = Number(meta.printRateM2 ?? serverResult.printRateM2 ?? 0)
  const wastePct = Number(meta.wastePct ?? serverResult.wastePct ?? 0)
  const sideMultiplier = Number(meta.sideMultiplier ?? serverResult.sideMultiplier ?? 1)
  const total = snapshot?.total ?? estimatedPrice
  const source = snapshot?.source === 'server' ? 'Backend engine' : snapshot?.source === 'fallback' ? 'Fallback' : 'Тодорхойгүй'
  const clientSnapshotVersion = typeof snapshot?.clientSnapshotVersion === 'string' ? snapshot.clientSnapshotVersion : ''
  const pricingContractVersion = typeof snapshot?.pricingContractVersion === 'string' ? snapshot.pricingContractVersion : ''
  const pricingEngine = typeof snapshot?.pricingEngine === 'string' ? snapshot.pricingEngine : ''
  const auditVersion = pricingContractVersion || clientSnapshotVersion
  const serverDelta = Number(snapshot?.serverDelta || 0)
  const serverDeltaPct = Number(snapshot?.serverDeltaPct || 0)
  const serverDeltaSeverity = snapshot?.serverDeltaSeverity || (serverDelta === 0 ? 'none' : 'warning')
  const hasServerAudit = snapshot?.verifiedBy === 'backend' && Number.isFinite(serverDelta)
  const verificationMessage = snapshot?.verificationMessage || ''
  const copyText = useMemo(() => {
    const lines = [
      'Үнийн тооцооны snapshot',
      `Нийт үнэ: ${money(total)}`,
      `Эх сурвалж: ${source}`,
      triggerLabel(snapshot?.pricingTrigger) ? `Триггер: ${triggerLabel(snapshot.pricingTrigger)}` : '',
      pricingContractVersion ? `Contract: ${pricingContractVersion}` : '',
      !pricingContractVersion && clientSnapshotVersion ? `Client snapshot: ${clientSnapshotVersion}` : '',
      pricingEngine ? `Engine: ${pricingEngine}` : '',
      '',
      'Оролт',
      `Бүтээгдэхүүн: ${text(product.name || product.category)}`,
      `Хэмжээ: ${text(spec.sizeLabel || (spec.widthMm && spec.heightMm ? `${spec.widthMm}x${spec.heightMm}мм` : ''))}`,
      `Материал: ${text(spec.material)}`,
      `Тоо / тал: ${text(spec.quantity)} / ${spec.sides === 'double' ? '2 тал' : '1 тал'}`,
      Array.isArray(spec.finishing) && spec.finishing.length > 0 ? `Боловсруулалт: ${spec.finishing.join(', ')}` : '',
      '',
      'Задаргаа',
      materialPrint > 0 ? `Материал + хэвлэл: ${money(materialPrint)}` : '',
      materialRateM2 > 0 ? `Материалын тариф: ${materialRateM2.toLocaleString()}₮/м²` : '',
      printRateM2 > 0 ? `Хэвлэх тариф: ${printRateM2.toLocaleString()}₮/м²${sideMultiplier > 1 ? ` × ${sideMultiplier}` : ''}` : '',
      wastePct > 0 ? `Хаягдал: ${wastePct}%` : '',
      Number(breakdown.finishing || 0) > 0 ? `Боловсруулалт: ${money(breakdown.finishing)}` : '',
      Number(breakdown.setup || 0) > 0 ? `Setup: ${money(breakdown.setup)}` : '',
      Number(breakdown.vat || 0) > 0 ? `НӨАТ: ${money(breakdown.vat)}` : '',
      `Нэгж үнэ: ${money(snapshot?.unitPrice)}`,
      hasServerAudit
        ? serverDelta === 0
          ? 'Backend баталгаажуулалт: client болон server үнэ таарсан.'
          : `Backend баталгаажуулалт: client үнэ ${money(snapshot?.clientTotal)}, server үнэ ${money(total)}. Зөрүү ${money(Math.abs(serverDelta))}${serverDeltaPct ? ` (${Math.abs(serverDeltaPct).toLocaleString()}%)` : ''}.`
        : verificationMessage ? `Backend баталгаажуулалт хийгдээгүй: ${verificationMessage}` : '',
    ]
    return lines.filter(Boolean).join('\n')
  }, [breakdown, clientSnapshotVersion, hasServerAudit, materialPrint, materialRateM2, pricingContractVersion, pricingEngine, printRateM2, product, serverDelta, serverDeltaPct, sideMultiplier, snapshot, source, spec, total, verificationMessage, wastePct])

  if (!snapshot && !Number(estimatedPrice || 0)) return null

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4 text-sm dark:border-orange-900/60 dark:bg-orange-950/20">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">Үнийн тооцооны snapshot</p>
          {!compact && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Захиалга илгээх үеийн үнэ бодсон оролт ба задаргаа
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-orange-600">{money(total)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{source}</p>
          {triggerLabel(snapshot?.pricingTrigger) && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{triggerLabel(snapshot.pricingTrigger)}</p>
          )}
          {(auditVersion || pricingEngine) && (
            <p className="mt-1 max-w-[180px] text-xs text-gray-400 dark:text-gray-500">
              {[auditVersion, pricingEngine].filter(Boolean).join(' · ')}
            </p>
          )}
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(copyText).catch(() => {})
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1600)
            }}
            className="mt-2 rounded-lg border border-orange-200 px-2 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950/40"
          >
            {copied ? 'Хуулагдлаа' : 'Задаргаа хуулах'}
          </button>
        </div>
      </div>

      {verificationMessage && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
          <span className="font-semibold">Backend баталгаажуулалт хийгдээгүй. </span>
          {verificationMessage}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg bg-white/70 p-3 dark:bg-gray-900/50">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Оролт</p>
          <dl className="space-y-1.5 text-xs">
            <div className="flex justify-between gap-3"><dt className="text-gray-500">Бүтээгдэхүүн</dt><dd className="text-right text-gray-800 dark:text-gray-200">{text(product.name || product.category)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-gray-500">Хэмжээ</dt><dd className="text-right text-gray-800 dark:text-gray-200">{text(spec.sizeLabel || (spec.widthMm && spec.heightMm ? `${spec.widthMm}x${spec.heightMm}мм` : ''))}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-gray-500">Материал</dt><dd className="text-right text-gray-800 dark:text-gray-200">{text(spec.material)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-gray-500">Тоо / тал</dt><dd className="text-right text-gray-800 dark:text-gray-200">{text(spec.quantity)} / {spec.sides === 'double' ? '2 тал' : '1 тал'}</dd></div>
            {Array.isArray(spec.finishing) && spec.finishing.length > 0 && (
              <div className="flex justify-between gap-3"><dt className="text-gray-500">Боловсруулалт</dt><dd className="text-right text-gray-800 dark:text-gray-200">{spec.finishing.join(', ')}</dd></div>
            )}
          </dl>
        </div>

        <div className="rounded-lg bg-white/70 p-3 dark:bg-gray-900/50">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Задаргаа</p>
          <dl className="space-y-1.5 text-xs">
            {materialPrint > 0 && <div className="flex justify-between gap-3"><dt className="text-gray-500">Материал + хэвлэл</dt><dd className="font-medium text-gray-800 dark:text-gray-200">{money(materialPrint)}</dd></div>}
            {materialRateM2 > 0 && <div className="flex justify-between gap-3"><dt className="text-gray-500">Материалын тариф</dt><dd className="font-medium text-gray-800 dark:text-gray-200">{materialRateM2.toLocaleString()}₮/м²</dd></div>}
            {printRateM2 > 0 && <div className="flex justify-between gap-3"><dt className="text-gray-500">Хэвлэх тариф</dt><dd className="font-medium text-gray-800 dark:text-gray-200">{printRateM2.toLocaleString()}₮/м²{sideMultiplier > 1 ? ` × ${sideMultiplier}` : ''}</dd></div>}
            {wastePct > 0 && <div className="flex justify-between gap-3"><dt className="text-gray-500">Хаягдал</dt><dd className="font-medium text-gray-800 dark:text-gray-200">{wastePct}%</dd></div>}
            {Number(breakdown.finishing || 0) > 0 && <div className="flex justify-between gap-3"><dt className="text-gray-500">Боловсруулалт</dt><dd className="font-medium text-gray-800 dark:text-gray-200">{money(breakdown.finishing)}</dd></div>}
            {Number(breakdown.setup || 0) > 0 && <div className="flex justify-between gap-3"><dt className="text-gray-500">Setup</dt><dd className="font-medium text-gray-800 dark:text-gray-200">{money(breakdown.setup)}</dd></div>}
            {Number(breakdown.vat || 0) > 0 && <div className="flex justify-between gap-3"><dt className="text-gray-500">НӨАТ</dt><dd className="font-medium text-gray-800 dark:text-gray-200">{money(breakdown.vat)}</dd></div>}
            <div className="border-t border-orange-100 pt-1.5 dark:border-orange-900/60">
              <div className="flex justify-between gap-3"><dt className="text-gray-600">Нэгж үнэ</dt><dd className="font-semibold text-gray-900 dark:text-gray-100">{money(snapshot?.unitPrice)}</dd></div>
            </div>
          </dl>
        </div>
      </div>

      {hasServerAudit && !verificationMessage && (
        <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${severityStyle(serverDeltaSeverity)}`}>
          <span className="font-semibold">{severityLabel(serverDeltaSeverity)}. </span>
          {serverDelta === 0
            ? 'Backend баталгаажуулалт: client болон server үнэ таарсан.'
            : `Backend баталгаажуулалт: client үнэ ${money(snapshot?.clientTotal)}, server үнэ ${money(total)}. Зөрүү ${money(Math.abs(serverDelta))}${serverDeltaPct ? ` (${Math.abs(serverDeltaPct).toLocaleString()}%)` : ''}.`}
        </div>
      )}
    </div>
  )
}
