'use client'

import React, { useState } from 'react'

/* ═══════════════════════════════════════
 *  Filter Panel — left sidebar filters
 * ═══════════════════════════════════════ */

export interface Filters {
  contentType: string
  priceRange: [number, number]
  deliveryDays: number
  minRating: number
  creatorLevel: string
}

const CONTENT_TYPES = [
  { value: '', label: 'Бүгд' },
  { value: 'social', label: 'Сошиал контент' },
  { value: 'print', label: 'Хэвлэл дизайн' },
  { value: 'live', label: 'Live борлуулалт' },
  { value: 'ai', label: 'AI контент' },
  { value: 'ugc', label: 'UGC контент' },
]

const LEVELS = [
  { value: '', label: 'Бүгд' },
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'expert', label: 'Expert' },
  { value: 'elite', label: 'Elite' },
]

const DELIVERY_OPTIONS = [
  { value: 0, label: 'Бүгд' },
  { value: 1, label: '24 цагийн дотор' },
  { value: 3, label: '3 хоногт' },
  { value: 7, label: '7 хоногт' },
  { value: 14, label: '14 хоногт' },
]

const RATING_OPTIONS = [
  { value: 0, label: 'Бүгд' },
  { value: 4.5, label: '4.5+' },
  { value: 4.0, label: '4.0+' },
  { value: 3.5, label: '3.5+' },
]

const DEFAULT_FILTERS: Filters = {
  contentType: '',
  priceRange: [0, 5000000],
  deliveryDays: 0,
  minRating: 0,
  creatorLevel: '',
}

export default function FilterPanel({
  filters,
  onChange,
  onReset,
  mobileOpen,
  onMobileClose,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  onReset: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}) {
  const [priceMin, setPriceMin] = useState(filters.priceRange[0].toString())
  const [priceMax, setPriceMax] = useState(filters.priceRange[1].toString())

  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)

  const panelContent = (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Шүүлтүүр</h3>
        {hasFilters && (
          <button
            className="text-xs font-medium"
            style={{ color: 'var(--primary)' }}
            onClick={onReset}
          >
            Цэвэрлэх
          </button>
        )}
      </div>

      {/* Content Type */}
      <FilterSection title="Контентийн төрөл">
        {CONTENT_TYPES.map(t => (
          <label key={t.value} className="flex items-center gap-2 cursor-pointer py-1">
            <input
              type="radio"
              name="contentType"
              checked={filters.contentType === t.value}
              onChange={() => update({ contentType: t.value })}
              className="accent-[var(--primary)]"
            />
            <span className="text-sm" style={{ color: 'var(--text2)' }}>{t.label}</span>
          </label>
        ))}
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Үнийн хүрээ">
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={e => {
              setPriceMin(e.target.value)
              update({ priceRange: [Number(e.target.value) || 0, filters.priceRange[1]] })
            }}
            className="w-full px-2.5 py-1.5 rounded-lg text-sm"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <span className="text-xs" style={{ color: 'var(--text3)' }}>—</span>
          <input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={e => {
              setPriceMax(e.target.value)
              update({ priceRange: [filters.priceRange[0], Number(e.target.value) || 5000000] })
            }}
            className="w-full px-2.5 py-1.5 rounded-lg text-sm"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>
      </FilterSection>

      {/* Delivery Time */}
      <FilterSection title="Хүргэх хугацаа">
        {DELIVERY_OPTIONS.map(d => (
          <label key={d.value} className="flex items-center gap-2 cursor-pointer py-1">
            <input
              type="radio"
              name="deliveryDays"
              checked={filters.deliveryDays === d.value}
              onChange={() => update({ deliveryDays: d.value })}
              className="accent-[var(--primary)]"
            />
            <span className="text-sm" style={{ color: 'var(--text2)' }}>{d.label}</span>
          </label>
        ))}
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Үнэлгээ">
        {RATING_OPTIONS.map(r => (
          <label key={r.value} className="flex items-center gap-2 cursor-pointer py-1">
            <input
              type="radio"
              name="rating"
              checked={filters.minRating === r.value}
              onChange={() => update({ minRating: r.value })}
              className="accent-[var(--primary)]"
            />
            <span className="text-sm" style={{ color: 'var(--text2)' }}>
              {r.value > 0 && <span style={{ color: '#F59E0B' }}>★ </span>}
              {r.label}
            </span>
          </label>
        ))}
      </FilterSection>

      {/* Creator Level */}
      <FilterSection title="Creator түвшин">
        {LEVELS.map(l => (
          <label key={l.value} className="flex items-center gap-2 cursor-pointer py-1">
            <input
              type="radio"
              name="level"
              checked={filters.creatorLevel === l.value}
              onChange={() => update({ creatorLevel: l.value })}
              className="accent-[var(--primary)]"
            />
            <span className="text-sm" style={{ color: 'var(--text2)' }}>{l.label}</span>
          </label>
        ))}
      </FilterSection>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside
        className="hidden lg:block w-64 shrink-0 rounded-2xl p-5 sticky top-24 self-start"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {panelContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <div
            className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] p-5 overflow-y-auto"
            style={{ background: 'var(--bg)' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold" style={{ color: 'var(--text)' }}>Шүүлтүүр</h3>
              <button
                onClick={onMobileClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                style={{ background: 'var(--surface2)', color: 'var(--text)' }}
              >
                ✕
              </button>
            </div>
            {panelContent}
          </div>
        </div>
      )}
    </>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase mb-2 tracking-wide" style={{ color: 'var(--text3)' }}>
        {title}
      </h4>
      {children}
    </div>
  )
}

export { DEFAULT_FILTERS }
