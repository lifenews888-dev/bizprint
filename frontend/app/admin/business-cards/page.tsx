'use client'
import { apiFetch, API_URL } from '@/lib/api'
import { useState, useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'

type PrintType = 'standard' | 'laminated' | 'embossed'
type EditorSide = 'front' | 'back'
type LayoutField = keyof Pick<BusinessCardLayout, 'name' | 'name_mn' | 'backgrounds' | 'front_json' | 'back_json' | 'canvas_data'>

type CanvasData = {
  accent?: string
  bg?: string
  textLight?: string
  textDark?: string
  randomVariant?: number
}

type LayoutZone = {
  key: string
  label: string
  x: number
  y: number
  w?: number
  h?: number
  fontSize?: number
  fontWeight?: 'normal' | 'bold' | string
  fill?: 'accent' | 'light' | 'dark' | string
  type?: 'logo' | 'qr' | 'social' | string
  align?: CSSProperties['textAlign']
}

type BusinessCardBackground = {
  id?: string
  name?: string
  url?: string
  side?: EditorSide | string
}

type PricingTier = Record<PrintType, number> & {
  quantity: number
  unit_price?: number
}

type BusinessCardLayout = {
  id?: string
  name?: string
  name_mn?: string
  type?: string
  is_active?: boolean
  canvas_data?: CanvasData
  front_json?: LayoutZone[]
  back_json?: LayoutZone[]
  backgrounds?: BusinessCardBackground[]
}

type BusinessCardProduct = {
  id?: string
  vat_enabled?: boolean
  layouts?: BusinessCardLayout[]
  pricingTiers?: PricingTier[]
}

type DragZoneElement = HTMLDivElement & {
  _startX?: number
  _startY?: number
}

const errorMessage = (err: unknown, fallback: string) => err instanceof Error ? err.message : fallback
const assetUrl = (url?: string) => {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url
  const normalized = url.startsWith('/') ? url : `/${url}`
  return `${API_URL}${normalized}`
}

const inp: CSSProperties = { padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, width: '100%', outline: 'none' }
const num = (v: string) => { const n = parseFloat(v); return isNaN(n) ? 0 : n }
const lbl: CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }
const btn = (bg: string, color: string): CSSProperties => ({ padding: '8px 16px', background: bg, color, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' })

function MiniPreview({ cd, zones, w = 180, h = 110 }: { cd?: CanvasData; zones?: LayoutZone[]; w?: number; h?: number }) {
  const accent = cd?.accent || '#FF6B00'
  const bg = cd?.bg || '#fff'
  const tl = cd?.textLight || '#6B7280'
  const td = cd?.textDark || '#111'
  const isDark = ['#111111','#1F2937','#0F0F1A','#0C1929','#0A1A0D','#0F1A2E','#1C1917'].includes(bg)
  const sx = w / 450, sy = h / 275

  if (zones?.length) {
    return (
      <div style={{ width: w, height: h, background: bg, borderRadius: 6, position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        {zones.map(z => {
          const x = Math.round(z.x * sx), y = Math.round(z.y * sy)
          const zw = Math.round((z.w || 100) * sx), zh = Math.round((z.h || 20) * sy)
          const fs = Math.max(4, Math.round((z.fontSize || 10) * ((sx + sy) / 2)))
          if (z.type === 'logo') return <div key={z.key} style={{ position: 'absolute', left: x, top: y, width: zw, height: zh, background: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 5, color: isDark ? 'rgba(255,255,255,0.3)' : '#bbb' }}>Logo</div>
          if (z.type === 'qr') return <div key={z.key} style={{ position: 'absolute', left: x, top: y, width: Math.min(zw, zh), height: Math.min(zw, zh), background: isDark ? 'rgba(255,255,255,0.06)' : '#f9f9f9', borderRadius: 2, border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#ddd'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '60%', height: '60%', background: `repeating-conic-gradient(${isDark ? '#555' : '#999'} 0% 25%, transparent 0% 50%) 0 0 / 3px 3px`, opacity: 0.4 }} /></div>
          if (z.type === 'social') return <div key={z.key} style={{ position: 'absolute', left: x, top: y, display: 'flex', gap: 2 }}>{['#1877F2','#E4405F','#0A66C2'].map((c,i) => <div key={i} style={{ width: Math.max(4, zh * 0.4), height: Math.max(4, zh * 0.4), borderRadius: 2, background: c }} />)}</div>
          const color = z.fill === 'accent' ? accent : z.fill === 'light' ? tl : td
          const labels: Record<string, string> = { company_name: 'Company', company_message: 'Slogan', full_name: 'Name', job_title: 'Title', email: '@mail', phone: 'Phone', address1: 'Addr', address2: 'Addr2', website: 'Web' }
          return <div key={z.key} style={{ position: 'absolute', left: x, top: y, fontSize: fs, fontWeight: z.fontWeight === 'bold' ? 700 : 400, color, whiteSpace: 'nowrap', overflow: 'hidden', lineHeight: 1.2, textAlign: z.align || 'left', width: z.align ? zw : undefined }}>{labels[z.key] || z.key}</div>
        })}
      </div>
    )
  }

  // Fallback: simple preview
  return (
    <div style={{ width: w, height: h, background: bg, borderRadius: 6, position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: 3, background: accent }} />
      <div style={{ position: 'absolute', left: 8, top: 10, fontSize: 7, fontWeight: 700, color: accent }}>Ovog Ner</div>
      <div style={{ position: 'absolute', left: 8, top: 22, fontSize: 5, color: tl }}>Zahiral</div>
      <div style={{ position: 'absolute', left: 8, bottom: 12, fontSize: 5, color: tl }}>+976 9911 2233</div>
      <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, background: isDark ? 'rgba(255,255,255,0.1)' : '#f3f3f3', borderRadius: 3 }} />
    </div>
  )
}

const DEFAULT_ZONES: LayoutZone[] = [
  { key: 'company_name', label: 'Company Name', x: 20, y: 12, w: 220, h: 26, fontSize: 14, fontWeight: 'bold', fill: 'accent' },
  { key: 'company_message', label: 'Company Message', x: 20, y: 38, w: 220, h: 20, fontSize: 11, fill: 'light' },
  { key: 'full_name', label: 'Full Name', x: 20, y: 70, w: 240, h: 30, fontSize: 22, fontWeight: 'bold', fill: 'accent' },
  { key: 'job_title', label: 'Job Title', x: 20, y: 104, w: 200, h: 20, fontSize: 12, fill: 'light' },
  { key: 'email', label: 'Email / Other', x: 20, y: 140, w: 200, h: 20, fontSize: 11, fill: 'light' },
  { key: 'phone', label: 'Phone / Other', x: 20, y: 162, w: 170, h: 20, fontSize: 11, fill: 'light' },
  { key: 'address1', label: 'Address Line 1', x: 20, y: 194, w: 220, h: 20, fontSize: 11, fill: 'light' },
  { key: 'address2', label: 'Address Line 2', x: 20, y: 216, w: 220, h: 20, fontSize: 11, fill: 'light' },
  { key: 'website', label: 'Web / Other', x: 20, y: 248, w: 170, h: 20, fontSize: 11, fill: 'light' },
  { key: 'logo', label: 'Logo', x: 350, y: 12, w: 80, h: 80, type: 'logo' },
  { key: 'social', label: 'Social', x: 350, y: 110, w: 80, h: 60, type: 'social' },
  { key: 'qr', label: 'QR', x: 360, y: 195, w: 64, h: 64, type: 'qr' },
]

const DEFAULT_BACK_ZONES: LayoutZone[] = [
  { key: 'company_name', label: 'Company Name', x: 32, y: 62, w: 386, h: 30, fontSize: 17, fontWeight: 'bold', fill: 'accent', align: 'center' },
  { key: 'company_message', label: 'Company Message', x: 72, y: 98, w: 306, h: 22, fontSize: 11, fill: 'light', align: 'center' },
  { key: 'website', label: 'Web / Other', x: 120, y: 206, w: 210, h: 22, fontSize: 12, fill: 'light', align: 'center' },
  { key: 'social', label: 'Social', x: 175, y: 132, w: 100, h: 34, type: 'social' },
  { key: 'qr', label: 'QR', x: 194, y: 172, w: 62, h: 62, type: 'qr' },
]

const cloneZones = (zones: LayoutZone[]) => zones.map(z => ({ ...z }))
const baseZonesForSide = (side: EditorSide) => cloneZones(side === 'front' ? DEFAULT_ZONES : DEFAULT_BACK_ZONES)
const zoneSignature = (zones?: LayoutZone[]) => (zones || [])
  .map(z => [z.key, Math.round(z.x), Math.round(z.y), Math.round(z.w || 0), Math.round(z.h || 0), z.fontSize || 0, z.align || ''].join(':'))
  .sort()
  .join('|')

const PRINT_SAFE_MARGIN = 12
const zoneBox = (z: LayoutZone) => ({
  x: z.x,
  y: z.y,
  w: z.w || (z.type ? 56 : 120),
  h: z.h || (z.type ? 56 : Math.max(18, (z.fontSize || 11) + 8)),
})
const overlaps = (a: LayoutZone, b: LayoutZone, gap = 2) => {
  const A = zoneBox(a)
  const B = zoneBox(b)
  return A.x < B.x + B.w + gap && A.x + A.w + gap > B.x && A.y < B.y + B.h + gap && A.y + A.h + gap > B.y
}
const hasUnsafeLayout = (zones: LayoutZone[]) => {
  const outOfCanvas = zones.some(z => {
    const box = zoneBox(z)
    return box.x < PRINT_SAFE_MARGIN || box.y < PRINT_SAFE_MARGIN || box.x + box.w > 450 - PRINT_SAFE_MARGIN || box.y + box.h > 275 - PRINT_SAFE_MARGIN
  })
  if (outOfCanvas) return true
  for (let i = 0; i < zones.length; i += 1) {
    for (let j = i + 1; j < zones.length; j += 1) {
      if (overlaps(zones[i], zones[j])) return true
    }
  }
  return false
}
const applyPreset = (base: LayoutZone[], preset: Record<string, Partial<LayoutZone>>) =>
  base.map(z => ({ ...z, ...(preset[z.key] || {}) }))

const nudgeLayout = (zones: LayoutZone[], variant: number) => {
  const dx = [-8, -4, 0, 4, 8, 2, -2, 6][variant % 8]
  const dy = [-4, 0, 4, -2, 2, 6, -6, 0][Math.floor(variant / 2) % 8]
  return zones.map(z => {
    if (z.type === 'qr' || z.type === 'logo') return z
    const box = zoneBox(z)
    return {
      ...z,
      x: Math.max(PRINT_SAFE_MARGIN, Math.min(450 - PRINT_SAFE_MARGIN - box.w, z.x + dx)),
      y: Math.max(PRINT_SAFE_MARGIN, Math.min(275 - PRINT_SAFE_MARGIN - box.h, z.y + dy)),
    }
  })
}

const mergeZoneLayout = (source: LayoutZone[], side: EditorSide, variant: number): LayoutZone[] => {
  const zones = source.length ? cloneZones(source) : baseZonesForSide(side)
  const byKey = new Map(zones.map(z => [z.key, z]))
  const ensure = (base: LayoutZone) => byKey.get(base.key) || { ...base }
  const front = baseZonesForSide('front').map(ensure)
  const back = baseZonesForSide('back').map(ensure)

  const frontLayouts: Record<string, Partial<LayoutZone>>[] = [
    {
      logo: { x: 28, y: 28, w: 76, h: 76 },
      company_name: { x: 126, y: 30, w: 260, h: 22, fontSize: 14, align: 'left' },
      company_message: { x: 126, y: 56, w: 260, h: 18, fontSize: 10, align: 'left' },
      full_name: { x: 126, y: 96, w: 276, h: 32, fontSize: 24, fontWeight: 'bold', align: 'left' },
      job_title: { x: 126, y: 132, w: 240, h: 18, fontSize: 11, align: 'left' },
      email: { x: 126, y: 170, w: 180, h: 18, fontSize: 10, align: 'left' },
      phone: { x: 126, y: 192, w: 180, h: 18, fontSize: 10, align: 'left' },
      website: { x: 126, y: 214, w: 180, h: 18, fontSize: 10, align: 'left' },
      address1: { x: 126, y: 236, w: 180, h: 18, fontSize: 10, align: 'left' },
      address2: { x: 28, y: 236, w: 80, h: 18, fontSize: 9, align: 'left' },
      social: { x: 28, y: 122, w: 76, h: 28 },
      qr: { x: 360, y: 178, w: 58, h: 58 },
    },
    {
      logo: { x: 346, y: 28, w: 72, h: 72 },
      company_name: { x: 30, y: 30, w: 260, h: 22, fontSize: 14, align: 'left' },
      company_message: { x: 30, y: 56, w: 250, h: 18, fontSize: 10, align: 'left' },
      full_name: { x: 30, y: 96, w: 278, h: 34, fontSize: 26, fontWeight: 'bold', align: 'left' },
      job_title: { x: 30, y: 134, w: 230, h: 18, fontSize: 11, align: 'left' },
      email: { x: 30, y: 178, w: 176, h: 18, fontSize: 10, align: 'left' },
      phone: { x: 30, y: 200, w: 176, h: 18, fontSize: 10, align: 'left' },
      website: { x: 30, y: 222, w: 176, h: 18, fontSize: 10, align: 'left' },
      address1: { x: 226, y: 178, w: 132, h: 18, fontSize: 9, align: 'left' },
      address2: { x: 226, y: 200, w: 132, h: 18, fontSize: 9, align: 'left' },
      social: { x: 30, y: 74, w: 92, h: 24 },
      qr: { x: 366, y: 184, w: 52, h: 52 },
    },
    {
      logo: { x: 190, y: 24, w: 70, h: 70 },
      company_name: { x: 64, y: 104, w: 322, h: 22, fontSize: 14, align: 'center' },
      company_message: { x: 84, y: 130, w: 282, h: 18, fontSize: 10, align: 'center' },
      full_name: { x: 62, y: 160, w: 326, h: 32, fontSize: 24, fontWeight: 'bold', align: 'center' },
      job_title: { x: 98, y: 196, w: 254, h: 18, fontSize: 11, align: 'center' },
      email: { x: 68, y: 226, w: 126, h: 18, fontSize: 9, align: 'center' },
      phone: { x: 206, y: 226, w: 126, h: 18, fontSize: 9, align: 'center' },
      website: { x: 160, y: 248, w: 130, h: 18, fontSize: 9, align: 'center' },
      address1: { x: 24, y: 146, w: 92, h: 18, fontSize: 8, align: 'center' },
      address2: { x: 334, y: 146, w: 92, h: 18, fontSize: 8, align: 'center' },
      social: { x: 24, y: 198, w: 70, h: 24 },
      qr: { x: 374, y: 190, w: 48, h: 48 },
    },
    {
      logo: { x: 28, y: 180, w: 58, h: 58 },
      company_name: { x: 30, y: 30, w: 340, h: 22, fontSize: 14, align: 'left' },
      company_message: { x: 30, y: 56, w: 260, h: 18, fontSize: 10, align: 'left' },
      full_name: { x: 30, y: 92, w: 330, h: 36, fontSize: 28, fontWeight: 'bold', align: 'left' },
      job_title: { x: 30, y: 134, w: 240, h: 18, fontSize: 11, align: 'left' },
      email: { x: 108, y: 180, w: 166, h: 18, fontSize: 10, align: 'left' },
      phone: { x: 108, y: 202, w: 166, h: 18, fontSize: 10, align: 'left' },
      website: { x: 108, y: 224, w: 166, h: 18, fontSize: 10, align: 'left' },
      address1: { x: 290, y: 180, w: 70, h: 18, fontSize: 8, align: 'left' },
      address2: { x: 290, y: 202, w: 70, h: 18, fontSize: 8, align: 'left' },
      social: { x: 304, y: 136, w: 82, h: 24 },
      qr: { x: 370, y: 28, w: 50, h: 50 },
    },
  ]

  const backLayouts: Record<string, Partial<LayoutZone>>[] = [
    {
      company_name: { x: 62, y: 66, w: 326, h: 30, fontSize: 20, align: 'center' },
      company_message: { x: 88, y: 106, w: 274, h: 18, fontSize: 11, align: 'center' },
      social: { x: 174, y: 140, w: 102, h: 28 },
      qr: { x: 198, y: 174, w: 52, h: 52 },
      website: { x: 95, y: 238, w: 260, h: 18, fontSize: 10, align: 'center' },
    },
    {
      logo: { x: 52, y: 88, w: 72, h: 72 },
      company_name: { x: 154, y: 84, w: 240, h: 26, fontSize: 18, align: 'left' },
      company_message: { x: 154, y: 118, w: 240, h: 18, fontSize: 10, align: 'left' },
      website: { x: 154, y: 154, w: 210, h: 18, fontSize: 10, align: 'left' },
      social: { x: 154, y: 190, w: 92, h: 26 },
      qr: { x: 360, y: 186, w: 52, h: 52 },
    },
    {
      company_name: { x: 40, y: 40, w: 370, h: 28, fontSize: 18, align: 'center' },
      company_message: { x: 66, y: 76, w: 318, h: 18, fontSize: 10, align: 'center' },
      qr: { x: 48, y: 160, w: 56, h: 56 },
      website: { x: 126, y: 176, w: 244, h: 18, fontSize: 10, align: 'left' },
      social: { x: 126, y: 206, w: 100, h: 26 },
    },
    {
      logo: { x: 188, y: 52, w: 74, h: 74 },
      social: { x: 174, y: 138, w: 102, h: 28 },
      company_name: { x: 36, y: 186, w: 378, h: 28, fontSize: 18, align: 'center' },
      company_message: { x: 58, y: 224, w: 334, h: 18, fontSize: 10, align: 'center' },
      qr: { x: 360, y: 30, w: 52, h: 52 },
      website: { x: 36, y: 30, w: 150, h: 18, fontSize: 9, align: 'left' },
    },
  ]

  const presets = side === 'front' ? frontLayouts : backLayouts
  const target = side === 'front' ? front : back
  for (let offset = 0; offset < presets.length; offset += 1) {
    const candidate = nudgeLayout(applyPreset(target, presets[(variant + offset) % presets.length]), variant + offset)
    if (!hasUnsafeLayout(candidate)) return candidate
  }
  return nudgeLayout(applyPreset(target, presets[variant % presets.length]), variant)
}

const nextUniquePair = (layout: BusinessCardLayout, allLayouts: BusinessCardLayout[]) => {
  const used = new Set(allLayouts.map(l => `${zoneSignature(l.front_json)}::${zoneSignature(l.back_json)}`).filter(Boolean))
  used.delete(`${zoneSignature(layout.front_json)}::${zoneSignature(layout.back_json)}`)
  const baseFront = layout.front_json?.length ? layout.front_json : baseZonesForSide('front')
  const baseBack = layout.back_json?.length ? layout.back_json : baseZonesForSide('back')
  const startVariant = Number.isFinite(layout.canvas_data?.randomVariant) ? Number(layout.canvas_data?.randomVariant) : -1
  for (let offset = 1; offset <= 64; offset += 1) {
    const variant = startVariant + offset
    const front = mergeZoneLayout(baseFront, 'front', variant)
    const back = mergeZoneLayout(baseBack, 'back', variant + 3)
    const signature = `${zoneSignature(front)}::${zoneSignature(back)}`
    if (!used.has(signature) && !hasUnsafeLayout(front) && !hasUnsafeLayout(back)) return { front, back, variant }
  }
  const variant = startVariant + 1
  return {
    front: mergeZoneLayout(baseFront, 'front', variant),
    back: mergeZoneLayout(baseBack, 'back', variant + 3),
    variant,
  }
}

const safeZones = (zones: LayoutZone[] | undefined, side: EditorSide, seed = 0) => {
  const value = zones?.length ? cloneZones(zones) : baseZonesForSide(side)
  return hasUnsafeLayout(value) ? mergeZoneLayout(value, side, seed) : value
}

const normalizeLayout = (layout: BusinessCardLayout, seed = 0): BusinessCardLayout => ({
  ...layout,
  backgrounds: layout.backgrounds || [],
  front_json: safeZones(layout.front_json, 'front', seed),
  back_json: safeZones(layout.back_json, 'back', seed + 3),
})

export default function AdminBusinessCardsPage() {
  const [view, setView] = useState<'grid' | 'editor' | 'pricing'>('grid')
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [allLayouts, setAllLayouts] = useState<BusinessCardLayout[]>([])
  const [productId, setProductId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [tiers, setTiers] = useState([
    { quantity: 100, standard: 30, laminated: 45, embossed: 65 },
    { quantity: 200, standard: 27.5, laminated: 40, embossed: 58 },
    { quantity: 500, standard: 24, laminated: 35, embossed: 50 },
    { quantity: 1000, standard: 20, laminated: 30, embossed: 42 },
  ])
  const [vatEnabled, setVatEnabled] = useState(true)
  const [calcQty, setCalcQty] = useState(100)
  const [calcType, setCalcType] = useState<PrintType>('standard')
  const [layoutEditorSide, setLayoutEditorSide] = useState<EditorSide>('front')
  const [selectedZoneKey, setSelectedZoneKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const d = await apiFetch<BusinessCardProduct[]>('/admin/business-cards')
      const products = Array.isArray(d) ? d : []
      // Pick the product with the most layouts
      if (products.length > 0) {
        const best = products.reduce((a, b) => ((a.layouts || []).length >= (b.layouts || []).length ? a : b), products[0])
        setProductId(best.id ?? null)
        setAllLayouts((best.layouts || []).map((l, idx) => normalizeLayout(l, idx)))
        setVatEnabled(best.vat_enabled !== false)
        if (best.pricingTiers?.length) {
          setTiers(best.pricingTiers.map(t => ({
            quantity: t.quantity,
            standard: Number(t.standard ?? t.unit_price ?? 30),
            laminated: Number(t.laminated ?? (t.unit_price ? t.unit_price * 1.5 : 45)),
            embossed: Number(t.embossed ?? (t.unit_price ? t.unit_price * 2.1 : 65)),
          })))
        }
      } else {
        setProductId(null)
        setAllLayouts([])
      }
    } catch (e: unknown) {
      setProductId(null)
      setAllLayouts([])
      setLoadError(errorMessage(e, 'Нэрийн хуудасны загваруудыг ачаалж чадсангүй'))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const createStarterProduct = async () => {
    setSaving(true)
    try {
      let pid = productId
      if (!pid) {
        const product = await apiFetch<BusinessCardProduct>('/admin/business-cards', { method: 'POST', body: {
          name: 'Business Cards',
          name_mn: 'Нэрийн хуудас',
          slug: `business-cards-${Date.now()}`,
          description: 'Нэрийн хуудасны хэвлэл, загвар сонголт',
          base_price: 3000,
          vat_enabled: true,
          is_active: true,
        }})
        pid = product?.id ?? null
      }
      if (!pid) throw new Error('Бүтээгдэхүүн үүсгэж чадсангүй')

      const layout = await apiFetch<BusinessCardLayout>(`/admin/business-cards/${pid}/layouts`, { method: 'POST', body: {
        name: `Layout ${allLayouts.length + 1}`,
        name_mn: `Загвар ${allLayouts.length + 1}`,
        type: 'business',
        canvas_data: { accent: '#FF6B00', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280' },
        front_json: DEFAULT_ZONES.map(z => ({ ...z })),
        back_json: baseZonesForSide('back'),
      }})

      await apiFetch(`/admin/business-cards/${pid}/pricing`, { method: 'POST', body: { tiers } }).catch(() => {})
      await load()
      if (layout?.id) {
        setEditIdx(allLayouts.length)
        setView('editor')
      }
    } catch (e: unknown) {
      alert(errorMessage(e, 'Анхны загвар үүсгэж чадсангүй'))
    } finally {
      setSaving(false)
    }
  }

  const updateLayout = <K extends LayoutField>(idx: number, field: K, value: BusinessCardLayout[K]) => {
    setAllLayouts(prev => { const c = [...prev]; c[idx] = { ...c[idx], [field]: value }; return c })
  }

  const saveLayout = async (idx: number) => {
    if (!productId) return
    const l = allLayouts[idx]
    if (!l?.id) return
    const safe = normalizeLayout(l, idx)
    const body = { name: safe.name, name_mn: safe.name_mn || safe.name, type: safe.type || 'business', canvas_data: safe.canvas_data, front_json: safe.front_json || [], back_json: safe.back_json || [] }
    await apiFetch(`/admin/business-cards/${productId}/layouts/${l.id}`, { method: 'PATCH', body })
  }

  const savePricing = async () => {
    if (!productId) return
    await apiFetch(`/admin/business-cards/${productId}/pricing`, { method: 'POST', body: { tiers } })
  }

  const closestTier = [...tiers].sort((a, b) => a.quantity - b.quantity).filter(t => calcQty >= t.quantity).pop() || tiers[0]
  const calcUnit = closestTier?.[calcType] || closestTier?.standard || 30
  const calcSubtotal = calcUnit * calcQty
  const calcVat = vatEnabled ? Math.round(calcSubtotal * 0.1) : 0
  const calcTotal = calcSubtotal + calcVat

  // ==================== VIEW: GRID ====================
  if (view === 'grid') {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Нэрийн хуудас</h1>
            <p style={{ fontSize: 13, color: 'var(--text3)', margin: '4px 0 0' }}>{allLayouts.length} загвар</p>
          </div>
          <button disabled={saving} onClick={async () => {
            if (!productId) {
              await createStarterProduct()
              return
            }
            try {
              const res = await apiFetch<BusinessCardLayout>(`/admin/business-cards/${productId}/layouts`, { method: 'POST', body: {
                name: `Layout ${allLayouts.length + 1}`, name_mn: `Загвар ${allLayouts.length + 1}`,
                type: 'business', canvas_data: { accent: '#FF6B00', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280' },
                front_json: baseZonesForSide('front'), back_json: baseZonesForSide('back'),
              }})
              if (res?.id) { await load(); setEditIdx(allLayouts.length); setView('editor') }
            } catch (e: unknown) { alert(errorMessage(e, 'Алдаа')) }
          }} style={{ ...btn('#FF6B00', '#fff'), opacity: saving ? 0.6 : 1 }}>{saving ? 'Үүсгэж байна...' : '+ Шинэ загвар'}</button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>Ачааллаж байна...</div>
        ) : loadError ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>!</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Загвар ачаалсангүй</div>
            <div style={{ fontSize: 12, marginTop: 6, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>{loadError}</div>
            <button onClick={load} style={{ ...btn('#FF6B00', '#fff'), marginTop: 16 }}>Дахин ачаалах</button>
          </div>
        ) : allLayouts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>□</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Загвар байхгүй</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>Анхны нэрийн хуудасны бүтээгдэхүүн болон default загварыг үүсгээд засварлаж эхэлнэ.</div>
            <button disabled={saving} onClick={createStarterProduct} style={{ ...btn('#FF6B00', '#fff'), marginTop: 16, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Үүсгэж байна...' : 'Анхны загвар үүсгэх'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {allLayouts.map((l, idx) => (
              <div
                key={l.id || idx}
                onClick={() => { setEditIdx(idx); setView('editor'); setLayoutEditorSide('front'); setSelectedZoneKey(null) }}
                style={{ cursor: 'pointer', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface)', transition: 'all .15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#FF6B00'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(255,107,0,0.15)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 8, background: 'var(--surface2)' }}>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 4, fontWeight: 700 }}>Өвөр</div>
                    <MiniPreview cd={l.canvas_data} zones={l.front_json} w={88} h={54} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 4, fontWeight: 700 }}>Ар</div>
                    <MiniPreview cd={l.canvas_data} zones={l.back_json?.length ? l.back_json : baseZonesForSide('back')} w={88} h={54} />
                  </div>
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>{l.name_mn || l.name}</div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button onClick={(e) => { e.stopPropagation(); if (!productId || !l.id) return; apiFetch(`/admin/business-cards/${productId}/layouts/${l.id}`, { method: 'PATCH', body: { is_active: !l.is_active } }).then(() => { setAllLayouts(prev => prev.map((ll, li) => li === idx ? { ...ll, is_active: !ll.is_active } : ll)) }).catch(() => {}) }}
                        title={l.is_active !== false ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: '2px', color: l.is_active !== false ? '#10B981' : '#9CA3AF' }}>
                        {l.is_active !== false ? '●' : '○'}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); if (!productId || !l.id || !confirm('Устгах уу?')) return; apiFetch(`/admin/business-cards/${productId}/layouts/${l.id}`, { method: 'DELETE' }).then(() => { setAllLayouts(prev => prev.filter((_, li) => li !== idx)) }).catch(() => {}) }}
                        title="Устгах"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: '2px', color: '#EF4444' }}>✕</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: l.is_active !== false ? 'var(--text3)' : '#EF4444', marginTop: 2 }}>{l.is_active !== false ? `${l.type} · ${(l.front_json?.length || 0)} элемент` : 'Идэвхгүй'}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ PRICING SECTION — grid доор шууд харагдана ═══ */}
        {!loading && allLayouts.length > 0 && (
          <div style={{ marginTop: 32, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Үнийн тохиргоо</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Хэвлэлийн төрөл бүрт нэгж үнэ (₮)</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => setTiers([...tiers, { quantity: 0, standard: 0, laminated: 0, embossed: 0 }])} style={btn('var(--surface2)', 'var(--text)')}>+ Шатлал</button>
                <button onClick={async () => {
                  if (!productId) return
                  try {
                    await apiFetch(`/admin/business-cards/${productId}/pricing`, { method: 'POST', body: { tiers } })
                    alert('Үнэ хадгалагдлаа!')
                  } catch (e: unknown) { alert(errorMessage(e, 'Алдаа')) }
                }} style={btn('#FF6B00', '#fff')}>Үнэ хадгалах</button>
              </div>
            </div>

            {/* 3 төрөл */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {[
                { icon: '📄', label: 'Энгийн', desc: '300гр цаас', key: 'standard' },
                { icon: '✨', label: 'Лактай', desc: 'Гялгар/Мат лак', key: 'laminated' },
                { icon: '💎', label: 'Бүрэлттэй', desc: 'Тусгай эффект', key: 'embossed' },
              ].map(ct => (
                <div key={ct.key} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'center' }}>
                  <div style={{ fontSize: 18 }}>{ct.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{ct.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{ct.desc}</div>
                </div>
              ))}
            </div>

            {/* Үнийн хүснэгт */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Тоо', '📄 Энгийн (₮)', '✨ Лактай (₮)', '💎 Бүрэлттэй (₮)', ''].map(h => (
                    <th key={h} style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tiers.map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 8 }}><input style={{ ...inp, maxWidth: 80 }} type="number" value={t.quantity} onChange={e => { const c = [...tiers]; c[i] = { ...c[i], quantity: num(e.target.value) }; setTiers(c) }} /></td>
                    <td style={{ padding: 8 }}><input style={{ ...inp, maxWidth: 80 }} type="number" step="0.5" value={t.standard} onChange={e => { const c = [...tiers]; c[i] = { ...c[i], standard: num(e.target.value) }; setTiers(c) }} /></td>
                    <td style={{ padding: 8 }}><input style={{ ...inp, maxWidth: 80 }} type="number" step="0.5" value={t.laminated} onChange={e => { const c = [...tiers]; c[i] = { ...c[i], laminated: num(e.target.value) }; setTiers(c) }} /></td>
                    <td style={{ padding: 8 }}><input style={{ ...inp, maxWidth: 80 }} type="number" step="0.5" value={t.embossed} onChange={e => { const c = [...tiers]; c[i] = { ...c[i], embossed: num(e.target.value) }; setTiers(c) }} /></td>
                    <td style={{ padding: 8 }}><button onClick={() => setTiers(tiers.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 14 }}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Тооцоолуур */}
            <div style={{ marginTop: 16, background: 'var(--surface2)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Тооцоолуур</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
                <div>
                  <label style={lbl}>Тоо</label>
                  <input style={{ ...inp, maxWidth: 100 }} type="number" value={calcQty} onChange={e => setCalcQty(num(e.target.value) || 1)} />
                </div>
                <div>
                  <label style={lbl}>Төрөл</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {([['standard', 'Энгийн'], ['laminated', 'Лактай'], ['embossed', 'Бүрэлттэй']] as const).map(([k, label]) => (
                      <button key={k} onClick={() => setCalcType(k)} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: calcType === k ? 700 : 400, border: calcType === k ? '2px solid #FF6B00' : '1px solid var(--border)', background: calcType === k ? '#FFF7ED' : 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}>{label}</button>
                    ))}
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={vatEnabled} onChange={e => setVatEnabled(e.target.checked)} /> НӨАТ (10%)
                </label>
              </div>
              {(() => {
                const closest = [...tiers].sort((a, b) => a.quantity - b.quantity).filter(t => calcQty >= t.quantity).pop() || tiers[0]
                const unit = closest?.[calcType] || closest?.standard || 30
                const sub = unit * calcQty
                const vat = vatEnabled ? Math.round(sub * 0.1) : 0
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                    <div style={{ background: 'var(--surface)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>Нэгж</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>₮{unit}</div>
                    </div>
                    <div style={{ background: 'var(--surface)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>Дүн</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>₮{sub.toLocaleString()}</div>
                    </div>
                    <div style={{ background: 'var(--surface)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>НӨАТ</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>₮{vat.toLocaleString()}</div>
                    </div>
                    <div style={{ background: '#FF6B00', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Нийт</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>₮{(sub + vat).toLocaleString()}</div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ==================== VIEW: EDITOR ====================
  if (view === 'editor' && editIdx !== null) {
    const l = allLayouts[editIdx]
    if (!l) { setEditIdx(null); setView('grid'); return null }
    const i = editIdx
    const CW = 450, CH = 275
    const canvasScale = 1.45
    const canvasDisplayW = Math.round(CW * canvasScale)
    const canvasDisplayH = Math.round(CH * canvasScale)
    const zones: LayoutZone[] = l.front_json || []
    const backZones: LayoutZone[] = l.back_json || []
    const edSide = layoutEditorSide
    const setEdSide = setLayoutEditorSide
    const currentZones = edSide === 'front' ? zones : backZones
    const zoneKey = edSide === 'front' ? 'front_json' : 'back_json'

    const addZone = (zone: LayoutZone) => {
      const existing = currentZones.find(z => z.key === zone.key)
      if (existing) return
      updateLayout(i, zoneKey, [...currentZones, { ...zone }])
    }

    const removeZone = (zIdx: number) => {
      updateLayout(i, zoneKey, currentZones.filter((_, j) => j !== zIdx))
    }

    return (
      <div style={{ padding: 16, minHeight: 'calc(100vh - 56px)', background: 'var(--bg)' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, padding: 12, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => { setView('grid'); setEditIdx(null) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface2)', cursor: 'pointer', fontSize: 13, color: 'var(--text)', fontWeight: 700 }}>
            ← Бүх загвар
            </button>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{l.name_mn || l.name || 'Нэрийн хуудасны загвар'}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{edSide === 'front' ? 'Өвөр тал' : 'Ар тал'} · {currentZones.length} элемент · 90×55 мм</div>
            </div>
          </div>
          <button onClick={() => saveLayout(i)} disabled={saving} style={{ ...btn('#FF6B00', '#fff'), minWidth: 120, opacity: saving ? 0.5 : 1 }}>{saving ? 'Хадгалж байна...' : 'Хадгалах'}</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px minmax(720px, 1fr)', gap: 16, alignItems: 'start' }}>
          {/* Left panel — zone controls */}
          <div style={{ position: 'sticky', top: 86, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', padding: 14, boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Загварын нэр</label>
              <input style={inp} value={l.name_mn || l.name || ''} onChange={e => { updateLayout(i, 'name', e.target.value); updateLayout(i, 'name_mn', e.target.value) }} />
            </div>

            {/* Side toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
              {(['front', 'back'] as const).map(s => (
                <button key={s} onClick={() => setEdSide(s)} style={{ padding: '9px 0', borderRadius: 9, border: edSide === s ? '1px solid #FF6B00' : '1px solid var(--border)', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: edSide === s ? '#FF6B00' : 'var(--surface2)', color: edSide === s ? '#fff' : 'var(--text3)' }}>
                  {s === 'front' ? 'Өвөр' : 'Ар тал'}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {(['front', 'back'] as const).map(s => (
                <button key={s} onClick={() => { setEdSide(s); setSelectedZoneKey(null) }} style={{ padding: 8, borderRadius: 10, border: edSide === s ? '2px solid #FF6B00' : '1px solid var(--border)', background: 'var(--surface2)', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontSize: 10, color: edSide === s ? '#FF6B00' : 'var(--text3)', fontWeight: 800, marginBottom: 6 }}>{s === 'front' ? 'Өвөр загвар' : 'Ар загвар'}</div>
                  <MiniPreview cd={l.canvas_data} zones={s === 'front' ? zones : backZones} w={110} h={68} />
                </button>
              ))}
            </div>

            {/* Professional print layout engine */}
            <button onClick={() => {
              setAllLayouts(prev => {
                const current = prev[i] || l
                const pair = nextUniquePair(current, prev)
                const updated = [...prev]
                updated[i] = {
                  ...current,
                  front_json: pair.front,
                  back_json: pair.back,
                  canvas_data: { ...(current.canvas_data || {}), randomVariant: pair.variant },
                }
                return updated
              })
              setLayoutEditorSide('front')
              setSelectedZoneKey(null)
            }} style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: '1px dashed #FF6B00', background: '#FFF7ED', cursor: 'pointer', fontSize: 12, fontWeight: 800, color: '#FF6B00', marginBottom: 12 }}>
              🎲 Давтагдашгүй random
            </button>

            {false && (
            <button onClick={() => {
              if (currentZones.length === 0) return
              const CW = 450, CH = 275
              const R = (a: number, b: number) => Math.round(a + Math.random() * (b - a))
              const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

              // ── Layout style ──
              const style = pick(['minimal', 'corporate', 'bold', 'centered'])
              const align = pick(['left', 'right', 'center'] as const)
              const spacing = pick(['compact', 'balanced', 'airy'])
              const pad = spacing === 'compact' ? R(15, 20) : spacing === 'balanced' ? R(20, 28) : R(28, 36)

              // ── Zone definitions ──
              const has = (k: string) => currentZones.some(z => z.key === k)
              const texts = currentZones.filter(z => !z.type)
              const nameScale = style === 'bold' ? R(24, 32) : style === 'minimal' ? R(16, 20) : R(18, 24)
              const titleScale = Math.round(nameScale * 0.55)
              const contactScale = Math.round(nameScale * 0.5)
              const companyScale = style === 'corporate' ? R(12, 16) : R(10, 13)

              // ── Font size map ──
              const fsMap: Record<string, number> = {
                full_name: nameScale, company_name: companyScale, company_message: R(9, 11),
                job_title: titleScale, email: contactScale, phone: contactScale,
                address1: contactScale, address2: contactScale, website: contactScale,
              }

              // ── Logo placement ──
              const logoS = R(55, 95)
              type Pos = { x: number; y: number }
              let logoPos: Pos = { x: pad, y: pad }
              if (align === 'right') logoPos = { x: CW - logoS - pad, y: pad }
              else if (align === 'center') logoPos = { x: Math.round((CW - logoS) / 2), y: pad }
              else logoPos = pick([{ x: pad, y: pad }, { x: pad, y: Math.round((CH - logoS) / 2) }])

              // ── Text area (opposite of logo) ──
              const logoRight = logoPos.x + logoS / 2 > CW / 2
              const logoCenter = align === 'center'
              let tX: number, tW: number
              if (logoCenter) {
                tX = pad; tW = CW - pad * 2
              } else if (logoRight) {
                tX = pad; tW = logoPos.x - pad - 12
              } else {
                tX = logoPos.x + logoS + 15; tW = CW - tX - pad
              }
              const tAlign = logoCenter ? 'center' : (logoRight ? 'left' : 'left')

              // ── Vertical rhythm ──
              const gap = spacing === 'compact' ? R(3, 5) : spacing === 'balanced' ? R(5, 8) : R(8, 14)
              const sectionGap = gap * 3
              let curY = logoCenter ? logoPos.y + logoS + sectionGap : pad

              // ── Build result ──
              const result: LayoutZone[] = []
              const place = (z: LayoutZone, x: number, y: number, w: number, h: number, extra?: Partial<LayoutZone>) => {
                result.push({ ...z, x, y, w, h, fontSize: fsMap[z.key] || z.fontSize, ...extra })
              }

              // Group 1: Branding — company name, message (top or after logo)
              for (const z of currentZones) {
                if (z.key === 'company_name') {
                  if (style === 'corporate' && !logoCenter) {
                    // Corporate: company name next to logo
                    place(z, logoCenter ? tX : logoPos.x + logoS + 12, logoPos.y + R(5, 15), 200, 22, { align: tAlign, fontWeight: 'bold', fill: 'accent' })
                  } else {
                    place(z, tX, curY, tW, 22, { align: tAlign, fontWeight: 'bold', fill: 'accent' })
                    curY += 22 + gap
                  }
                }
                if (z.key === 'company_message') {
                  if (style === 'corporate' && !logoCenter) {
                    place(z, logoPos.x + logoS + 12, logoPos.y + R(28, 38), 200, 18, { align: tAlign, fill: 'light' })
                  } else {
                    place(z, tX, curY, tW, 18, { align: tAlign, fill: 'light' })
                    curY += 18 + gap
                  }
                }
              }

              // Group 2: Primary — name, title (dominant)
              curY += style === 'bold' ? sectionGap : gap
              for (const z of currentZones) {
                if (z.key === 'full_name') {
                  place(z, tX, curY, tW, nameScale + 6, { align: tAlign, fontWeight: 'bold', fill: style === 'bold' ? 'dark' : 'accent' })
                  curY += nameScale + 6 + gap
                }
                if (z.key === 'job_title') {
                  place(z, tX, curY, tW, titleScale + 6, { align: tAlign, fill: style === 'bold' ? 'accent' : 'light' })
                  curY += titleScale + 6 + gap
                }
              }

              // Group 3: Contact — stacked below with section gap
              curY += sectionGap
              const contactKeys = ['phone', 'email', 'address1', 'address2', 'website']
              for (const z of currentZones) {
                if (contactKeys.includes(z.key)) {
                  const fs = fsMap[z.key] || contactScale
                  place(z, tX, Math.min(curY, CH - fs - 6), tW, fs + 6, { align: tAlign, fill: 'light' })
                  curY += fs + 6 + gap
                }
              }

              // Special: Logo
              for (const z of currentZones) {
                if (z.type === 'logo') place(z, logoPos.x, logoPos.y, logoS, logoS)
              }

              // Special: QR — corners only
              for (const z of currentZones) {
                if (z.type === 'qr') {
                  const qS = R(48, 65)
                  const corners: Pos[] = [{ x: CW - qS - pad, y: CH - qS - pad }, { x: pad, y: CH - qS - pad }, { x: CW - qS - pad, y: pad }, { x: pad, y: pad }]
                  // Prefer corner opposite to logo
                  const best = corners.sort((a, b) => {
                    const da = Math.abs(a.x - logoPos.x) + Math.abs(a.y - logoPos.y)
                    const db = Math.abs(b.x - logoPos.x) + Math.abs(b.y - logoPos.y)
                    return db - da
                  })[0]
                  place(z, best.x, best.y, qS, qS)
                }
              }

              // Special: Social — small, near bottom
              for (const z of currentZones) {
                if (z.type === 'social') {
                  const sw = R(70, 100), sh = R(20, 35)
                  const sx = align === 'center' ? Math.round((CW - sw) / 2) : align === 'right' ? CW - sw - pad : pad
                  place(z, sx, CH - sh - pad, sw, sh)
                }
              }

              updateLayout(i, zoneKey, result)
            }} style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: '1px dashed #FF6B00', background: '#FFF7ED', cursor: 'pointer', fontSize: 12, fontWeight: 800, color: '#FF6B00', marginBottom: 12 }}>
              🎲 2 талыг unique random
            </button>
            )}

            {/* Add zones */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>Элемент нэмэх:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 5, maxHeight: 300, overflowY: 'auto', paddingRight: 2 }}>
              {DEFAULT_ZONES.map(z => {
                const exists = currentZones.some(cz => cz.key === z.key)
                return (
                  <button key={z.key} onClick={() => addZone(z)} disabled={exists} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: exists ? 'var(--surface2)' : 'var(--surface)', cursor: exists ? 'default' : 'pointer', fontSize: 11, color: exists ? 'var(--text3)' : 'var(--text)', textAlign: 'left', opacity: exists ? 0.5 : 1 }}>
                    {exists ? '✓ ' : '+ '}{z.label}
                  </button>
                )
              })}
            </div>

            {/* Background upload */}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Фон зураг ({edSide === 'front' ? 'Өвөр' : 'Ар'}):</div>
              {l.id && productId ? (
                <label style={{ display: 'block', padding: '10px', borderRadius: 8, border: '2px dashed var(--border)', textAlign: 'center', cursor: 'pointer', fontSize: 11, color: '#FF6B00', fontWeight: 600 }}>
                  📤 Зураг оруулах
                  <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file || !productId || !l.id) return
                    const fd = new FormData()
                    fd.append('file', file)
                    fd.append('name', `${edSide}-${file.name}`)
                    fd.append('side', edSide)
                    try {
                      const result = await apiFetch<BusinessCardBackground>(`/admin/business-cards/${productId}/layouts/${l.id}/backgrounds`, { method: 'POST', body: fd })
                      if (result) { updateLayout(i, 'backgrounds', [...(l.backgrounds || []), { ...result, side: result.side || edSide }]) }
                    } catch (err: unknown) { alert('Upload алдаа: ' + errorMessage(err, '')) }
                    e.currentTarget.value = ''
                  }} />
                </label>
              ) : (
                <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', padding: 8 }}>Эхлээд хадгалж, дараа нь зураг оруулна</div>
              )}
              {/* Show uploaded bgs */}
              {(l.backgrounds || []).filter(bg => bg.side === edSide).map(bg => (
                <div key={bg.id} style={{ position: 'relative', marginTop: 6, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={assetUrl(bg.url)} alt="" style={{ width: '100%', height: 60, objectFit: 'cover' }} />
                  <button onClick={async () => {
                    if (!productId || !l.id) return
                    await apiFetch(`/admin/business-cards/${productId}/layouts/${l.id}/backgrounds/${bg.id}`, { method: 'DELETE' }).catch(() => {})
                    updateLayout(i, 'backgrounds', (l.backgrounds || []).filter(b => b.id !== bg.id))
                  }} style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 9, background: '#EF4444', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Right — visual card canvas */}
          <div style={{ minHeight: 590, borderRadius: 16, border: '1px solid var(--border)', background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface2) 100%)', padding: 18, boxShadow: '0 10px 35px rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>Design canvas</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Элементүүдийг чирж байрлуулна · scale {Math.round(canvasScale * 100)}%</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['front', 'back'] as const).map(s => (
                  <button key={s} onClick={() => setEdSide(s)} style={{ padding: '7px 12px', borderRadius: 999, border: edSide === s ? '1px solid #FF6B00' : '1px solid var(--border)', background: edSide === s ? '#FF6B00' : 'var(--surface)', color: edSide === s ? '#fff' : 'var(--text2)', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                    {s === 'front' ? 'Өвөр' : 'Ар'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: canvasDisplayH + 40 }}>
              <div style={{ width: canvasDisplayW, height: canvasDisplayH, position: 'relative' }}>
              <div
                style={{ width: CW, height: CH, background: l.canvas_data?.bg || '#fff', borderRadius: 8, position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 18px 45px rgba(15,23,42,0.18)', cursor: 'crosshair', transform: `scale(${canvasScale})`, transformOrigin: 'top left' }}
              >
                {/* Background image */}
                {(() => {
                  const bgImg = (l.backgrounds || []).find(bg => bg.side === edSide)
                  return bgImg ? <img src={assetUrl(bgImg.url)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : null
                })()}

                {/* Zones */}
                {currentZones.map((z, zIdx) => {
                  const accent = l.canvas_data?.accent || '#FF6B00'
                  const textDark = l.canvas_data?.textDark || '#111'
                  const textLight = l.canvas_data?.textLight || '#6B7280'
                  const color = z.fill === 'accent' ? accent : z.fill === 'light' ? textLight : textDark
                  const isSpecial = z.type === 'logo' || z.type === 'qr' || z.type === 'social'

                  return (
                    <div
                      key={z.key}
                      draggable
                      onClick={() => setSelectedZoneKey(selectedZoneKey === z.key ? null : z.key)}
                      onDragStart={e => {
                        e.dataTransfer.setData('zoneIdx', String(zIdx))
                        e.dataTransfer.setDragImage(e.currentTarget, 0, 0)
                        const rect = e.currentTarget.parentElement!.getBoundingClientRect()
                        const target = e.currentTarget as DragZoneElement
                        target._startX = (e.clientX - rect.left) / canvasScale - z.x
                        target._startY = (e.clientY - rect.top) / canvasScale - z.y
                      }}
                      onDrag={e => {
                        if (e.clientX === 0) return
                        const rect = e.currentTarget.parentElement!.getBoundingClientRect()
                        const target = e.currentTarget as DragZoneElement
                        const nx = Math.max(0, Math.min(CW - (z.w || 50), (e.clientX - rect.left) / canvasScale - (target._startX || 0)))
                        const ny = Math.max(0, Math.min(CH - (z.h || 20), (e.clientY - rect.top) / canvasScale - (target._startY || 0)))
                        const updated = [...currentZones]
                        updated[zIdx] = { ...z, x: Math.round(nx), y: Math.round(ny) }
                        updateLayout(i, zoneKey, updated)
                      }}
                      style={{
                        position: 'absolute', left: z.x, top: z.y, width: z.w || 'auto', height: z.h || 'auto',
                        border: selectedZoneKey === z.key ? '1.5px solid #FF6B00' : '1px dashed rgba(0,0,0,0.28)', borderRadius: 4, cursor: 'grab',
                        display: 'flex', alignItems: 'center', justifyContent: isSpecial ? 'center' : 'flex-start',
                        padding: isSpecial ? 0 : '0 4px',
                        fontSize: z.fontSize || 12, fontWeight: z.fontWeight === 'bold' ? 700 : 400, color,
                        background: isSpecial ? 'rgba(15,23,42,0.05)' : selectedZoneKey === z.key ? 'rgba(255,107,0,0.05)' : 'transparent',
                        userSelect: 'none',
                      }}
                    >
                      {isSpecial ? (
                        <span style={{ fontSize: 9, color: '#999', textAlign: 'center' }}>{z.type === 'logo' ? '📷 Лого (PNG)' : z.type === 'social' ? '🔗 Social' : '▣ QR'}</span>
                      ) : (
                        <span onClick={(e) => { e.stopPropagation(); setSelectedZoneKey(selectedZoneKey === z.key ? null : z.key) }} style={{ cursor: 'pointer', width: '100%' }}>{z.label}</span>
                      )}
                      {/* Selected zone controls */}
                      {selectedZoneKey === z.key && !isSpecial && (
                        <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: -32, left: 0, display: 'flex', gap: 3, alignItems: 'center', background: '#fff', border: '1px solid #ddd', borderRadius: 6, padding: '3px 6px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 20 }}>
                          <span style={{ fontSize: 9, color: '#999' }}>Хэмжээ:</span>
                          {[9, 11, 13, 16, 18, 22, 28].map(fs => (
                            <button key={fs} onClick={() => {
                              const updated = [...currentZones]; updated[zIdx] = { ...z, fontSize: fs }; updateLayout(i, zoneKey, updated)
                            }} style={{ width: 22, height: 22, borderRadius: 4, border: z.fontSize === fs ? '2px solid #FF6B00' : '1px solid #ddd', background: z.fontSize === fs ? '#FFF7ED' : '#fff', fontSize: 9, cursor: 'pointer', fontWeight: z.fontSize === fs ? 700 : 400, color: '#333' }}>{fs}</button>
                          ))}
                          <button onClick={() => {
                            const updated = [...currentZones]; updated[zIdx] = { ...z, fontWeight: z.fontWeight === 'bold' ? 'normal' : 'bold' }; updateLayout(i, zoneKey, updated)
                          }} style={{ width: 22, height: 22, borderRadius: 4, border: z.fontWeight === 'bold' ? '2px solid #FF6B00' : '1px solid #ddd', background: z.fontWeight === 'bold' ? '#FFF7ED' : '#fff', fontSize: 10, cursor: 'pointer', fontWeight: 700, color: '#333' }}>B</button>
                        </div>
                      )}
                      {/* Delete button */}
                      {selectedZoneKey === z.key && (
                        <button onClick={(e) => { e.stopPropagation(); removeZone(zIdx) }} style={{ position: 'absolute', top: -8, right: -8, width: 16, height: 16, borderRadius: 8, background: '#EF4444', color: '#fff', border: 'none', fontSize: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
                      )}
                    </div>
                  )
                })}
              </div>
              </div>
            </div>

            {/* Zone list with coordinates */}
            {currentZones.length > 0 && (
              <div style={{ margin: '16px auto 0', maxWidth: canvasDisplayW, maxHeight: 76, overflowY: 'auto', fontSize: 10, color: 'var(--text3)', display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {currentZones.map(z => (
                  <span key={z.key} style={{ background: 'var(--surface2)', padding: '3px 8px', borderRadius: 4 }}>{z.label}: ({z.x}, {z.y})</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ Үнэ + Хадгалах ═══ */}
        <div style={{ marginTop: 20, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Үнийн шатлал (нэгж ₮)</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['Тоо', '📄 Энгийн', '✨ Лактай', '💎 Бүрэлттэй', ''].map(h => (
                  <th key={h} style={{ padding: '8px 6px', textAlign: 'left', fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tiers.map((t, ti) => (
                <tr key={ti} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '4px 6px' }}><input style={{ ...inp, maxWidth: 70, padding: '6px 8px', fontSize: 12 }} type="number" value={t.quantity} onChange={e => { const c = [...tiers]; c[ti] = { ...c[ti], quantity: num(e.target.value) }; setTiers(c) }} /></td>
                  <td style={{ padding: '4px 6px' }}><input style={{ ...inp, maxWidth: 70, padding: '6px 8px', fontSize: 12 }} type="number" step="0.5" value={t.standard} onChange={e => { const c = [...tiers]; c[ti] = { ...c[ti], standard: num(e.target.value) }; setTiers(c) }} /></td>
                  <td style={{ padding: '4px 6px' }}><input style={{ ...inp, maxWidth: 70, padding: '6px 8px', fontSize: 12 }} type="number" step="0.5" value={t.laminated} onChange={e => { const c = [...tiers]; c[ti] = { ...c[ti], laminated: num(e.target.value) }; setTiers(c) }} /></td>
                  <td style={{ padding: '4px 6px' }}><input style={{ ...inp, maxWidth: 70, padding: '6px 8px', fontSize: 12 }} type="number" step="0.5" value={t.embossed} onChange={e => { const c = [...tiers]; c[ti] = { ...c[ti], embossed: num(e.target.value) }; setTiers(c) }} /></td>
                  <td style={{ padding: '4px 6px' }}><button onClick={() => setTiers(tiers.filter((_, j) => j !== ti))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setTiers([...tiers, { quantity: 0, standard: 0, laminated: 0, embossed: 0 }])} style={{ ...btn('var(--surface2)', 'var(--text)'), fontSize: 11, padding: '6px 12px' }}>+ Шатлал</button>
        </div>

        {/* Хадгалах */}
        <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => { setView('grid'); setEditIdx(null) }} style={btn('var(--surface2)', 'var(--text)')}>Болих</button>
          {/* Template хадгалах — zone байрлал update */}
          <button disabled={saving} onClick={async () => {
            setSaving(true)
            try {
              await saveLayout(i)
              alert('Загвар хадгалагдлаа')
              setView('grid'); setEditIdx(null)
            } catch (e: unknown) { alert(errorMessage(e, 'Алдаа')) } finally { setSaving(false) }
          }} style={{ ...btn('var(--surface2)', 'var(--text)'), opacity: saving ? 0.5 : 1 }}>
            {saving ? '...' : 'Загвар хадгалах'}
          </button>
          {/* Шинэ бүтээгдэхүүн нийтлэх — layout хуулж шинэ product үүсгэнэ */}
          <button disabled={saving} onClick={async () => {
            setSaving(true)
            try {
              // 1. Template layout хадгалах
              await saveLayout(i)
              // 2. Шинэ бүтээгдэхүүн үүсгэх
              const product = await apiFetch<BusinessCardProduct>('/admin/business-cards', { method: 'POST', body: {
                name: l.name || 'Business Card',
                name_mn: l.name_mn || l.name || 'Нэрийн хуудас',
                base_price: 3000, vat_enabled: true, is_active: true,
              }})
              const pid = product?.id
              if (!pid) throw new Error('Бүтээгдэхүүн үүсгэж чадсангүй')
              // 3. Layout хуулах (фон, zone бүгд)
              const newLayout = await apiFetch<BusinessCardLayout>(`/admin/business-cards/${pid}/layouts`, { method: 'POST', body: {
                name: l.name, name_mn: l.name_mn || l.name, type: l.type || 'business',
                canvas_data: l.canvas_data, front_json: l.front_json || [], back_json: l.back_json || [],
              }})
              // 4. Background зургуудыг хуулах (хэрэв байвал)
              if (l.backgrounds?.length && newLayout?.id) {
                for (const bg of l.backgrounds) {
                  // Background URL-г шинэ layout руу reference хийх
                  await apiFetch<BusinessCardBackground>(`/admin/business-cards/${pid}/layouts/${newLayout.id}/backgrounds`, { method: 'POST', body: { name: bg.name, url: bg.url, side: bg.side } }).catch(() => {})
                }
              }
              // 5. Үнэ хадгалах
              await apiFetch(`/admin/business-cards/${pid}/pricing`, { method: 'POST', body: { tiers } })
              // 6. Нийтлэх
              await apiFetch(`/admin/business-cards/${pid}/publish`, { method: 'PATCH' })
              alert(`"${l.name_mn || l.name}" бүтээгдэхүүн нийтлэгдлээ!`)
              await load()
              setView('grid'); setEditIdx(null)
            } catch (e: unknown) { alert(errorMessage(e, 'Алдаа гарлаа')) } finally { setSaving(false) }
          }} style={{ ...btn('#10B981', '#fff'), opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Үүсгэж байна...' : '🚀 Бүтээгдэхүүн нийтлэх'}
          </button>
        </div>
      </div>
    )
  }

  // ==================== VIEW: PRICING ====================
  if (view === 'pricing') {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={() => setView('grid')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
            ← Буцах
          </button>
          <button onClick={savePricing} disabled={saving} style={{ ...btn('#FF6B00', '#fff'), opacity: saving ? 0.5 : 1 }}>{saving ? 'Хадгалж байна...' : 'Үнэ хадгалах'}</button>
        </div>

        <div>
          {/* Print types */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Хэвлэлийн төрөл</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { key: 'standard', label: 'Энгийн', desc: '300гр цаас', icon: '📄' },
                { key: 'laminated', label: 'Лактай', desc: 'Гялгар/Мат лак', icon: '✨' },
                { key: 'embossed', label: 'Бүрэлттэй', desc: 'Тусгай эффект', icon: '💎' },
              ].map(ct => (
                <div key={ct.key} style={{ flex: 1, padding: 14, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{ct.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{ct.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{ct.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tier table */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Үнийн шатлал (нэгж үнэ ₮)</span>
            <button onClick={() => setTiers([...tiers, { quantity: 0, standard: 0, laminated: 0, embossed: 0 }])} style={btn('var(--surface2)', 'var(--text)')}>+ Шатлал нэмэх</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['Тоо', '📄 Энгийн (₮)', '✨ Лактай (₮)', '💎 Бүрэлттэй (₮)', ''].map(h => <th key={h} style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {tiers.map((t, ti) => (
                <tr key={ti} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px' }}><input style={{ ...inp, maxWidth: 80 }} type="number" value={t.quantity} onChange={e => { const c = [...tiers]; c[ti] = { ...c[ti], quantity: num(e.target.value) }; setTiers(c) }} /></td>
                  <td style={{ padding: '8px' }}><input style={{ ...inp, maxWidth: 80 }} type="number" step="0.5" value={t.standard} onChange={e => { const c = [...tiers]; c[ti] = { ...c[ti], standard: num(e.target.value) }; setTiers(c) }} /></td>
                  <td style={{ padding: '8px' }}><input style={{ ...inp, maxWidth: 80 }} type="number" step="0.5" value={t.laminated} onChange={e => { const c = [...tiers]; c[ti] = { ...c[ti], laminated: num(e.target.value) }; setTiers(c) }} /></td>
                  <td style={{ padding: '8px' }}><input style={{ ...inp, maxWidth: 80 }} type="number" step="0.5" value={t.embossed} onChange={e => { const c = [...tiers]; c[ti] = { ...c[ti], embossed: num(e.target.value) }; setTiers(c) }} /></td>
                  <td style={{ padding: '8px' }}><button onClick={() => setTiers(tiers.filter((_, j) => j !== ti))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 14 }}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Calculator */}
          <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Үнийн тооцоолуур</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              <div>
                <label style={lbl}>Тоо хэмжээ</label>
                <input style={{ ...inp, maxWidth: 120 }} type="number" value={calcQty} onChange={e => setCalcQty(num(e.target.value) || 1)} />
              </div>
              <div>
                <label style={lbl}>Төрөл</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {([['standard', 'Энгийн'], ['laminated', 'Лактай'], ['embossed', 'Бүрэлттэй']] as const).map(([k, label]) => (
                    <button key={k} onClick={() => setCalcType(k)} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: calcType === k ? 700 : 400, border: calcType === k ? '2px solid #FF6B00' : '1px solid var(--border)', background: calcType === k ? '#FFF7ED' : 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}>{label}</button>
                  ))}
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text)', cursor: 'pointer', marginTop: 16 }}>
                <input type="checkbox" checked={vatEnabled} onChange={e => setVatEnabled(e.target.checked)} /> НӨАТ (10%)
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--surface)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Дүн</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>₮{calcSubtotal.toLocaleString()}</div>
              </div>
              <div style={{ background: 'var(--surface)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>НӨАТ</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>₮{calcVat.toLocaleString()}</div>
              </div>
              <div style={{ background: '#FF6B00', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Нийт</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>₮{calcTotal.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback — should not reach here
  return null
}
