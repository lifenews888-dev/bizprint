'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'

/* ═══ Types ═══ */
interface Vendor {
  id: string; company_name: string; contact_name: string; contact_email: string; phone: string; address: string
  status: string; tier: string; capacity_tier: string; load_status: string; vendor_type: string
  score: number; capacity_per_day: number; current_load: number; total_orders: number; rating: number
  verified: boolean; is_priority: boolean; has_delivery: boolean
  services: string[]; machine_types: string[]; supported_materials: string[]
  pricing_tier: string; rush_multiplier: number; commission_rate: number; payment_terms: string
  delivery_time_hours: number; coverage_area: string; description: string
}

/* ═══ Config ═══ */
const VENDOR_TYPES = [
  { value: 'digital_print', label: 'Дижитал хэвлэл' },
  { value: 'offset_print', label: 'Офсет хэвлэл' },
  { value: 'large_format', label: 'Өргөн формат' },
  { value: 'signage', label: 'Тэмдэг & Шилдэг' },
  { value: 'packaging', label: 'Савлагаа' },
  { value: 'mixed', label: 'Холимог' },
]

const SERVICES = [
  { value: 'business_card', label: 'Нэрийн хуудас' },
  { value: 'flyer', label: 'Флаер & Постер' },
  { value: 'banner', label: 'Баннер' },
  { value: 'sticker', label: 'Стикер & Шошго' },
  { value: 'book', label: 'Ном & Каталог' },
  { value: 'brochure', label: 'Брошур' },
  { value: 'packaging', label: 'Хайрцаг & Савлагаа' },
  { value: 'signage', label: 'Тэмдэг зураг' },
  { value: 'canvas', label: 'Canvas хэвлэл' },
  { value: 'tshirt', label: 'Футболк хэвлэл' },
]

const MACHINES = [
  { value: 'digital_press', label: 'Digital Press' },
  { value: 'offset_4color', label: 'Offset 4 Color' },
  { value: 'large_format_printer', label: 'Large Format Printer' },
  { value: 'cutting_machine', label: 'Cutting Machine' },
  { value: 'binding_machine', label: 'Binding Machine' },
  { value: 'laminator', label: 'Laminator' },
  { value: 'uv_printer', label: 'UV Printer' },
  { value: 'dtg_printer', label: 'DTG (Fabric) Printer' },
]

const MATERIALS = [
  { value: 'art_paper', label: 'Art paper' },
  { value: 'coated', label: 'Coated paper' },
  { value: 'uncoated', label: 'Uncoated paper' },
  { value: 'vinyl', label: 'Vinyl' },
  { value: 'canvas', label: 'Canvas' },
  { value: 'cardboard', label: 'Cardboard' },
  { value: 'transparent', label: 'Transparent film' },
  { value: 'fabric', label: 'Fabric / Даавуу' },
  { value: 'pvc', label: 'PVC' },
  { value: 'metal', label: 'Metal plate' },
]

const CT = {
  enterprise: { label: 'ENTERPRISE', color: '#7C3AED', bg: '#F3F0FF', icon: '🏢' },
  large: { label: 'LARGE', color: '#2563EB', bg: '#EFF6FF', icon: '🏭' },
  medium: { label: 'MEDIUM', color: '#F59E0B', bg: '#FFF8EB', icon: '🔧' },
  small: { label: 'SMALL', color: '#6B7280', bg: '#F3F4F6', icon: '🔨' },
} as Record<string, any>

const LS = {
  available: { label: 'AVAILABLE', color: '#10B981', bg: '#ECFDF5' },
  busy: { label: 'BUSY', color: '#F59E0B', bg: '#FFF8EB' },
  full: { label: 'FULL', color: '#EF4444', bg: '#FEF2F2' },
} as Record<string, any>

/* ═══ Helpers ═══ */
const fmt = (n: number) => n.toLocaleString()

function ProgressBar({ value, max, height = 8 }: { value: number; max: number; height?: number }) {
  const p = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const c = p >= 85 ? '#EF4444' : p >= 60 ? '#F59E0B' : '#10B981'
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: '#F3F4F6' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p}%`, background: c }} />
    </div>
  )
}

function pct(current: number, capacity: number) {
  if (capacity <= 0) return 100
  return Math.round((current / capacity) * 100)
}

function LoadBar({ current, capacity }: { current: number; capacity: number }) {
  const p = pct(current, capacity)
  const c = p >= 90 ? '#EF4444' : p >= 60 ? '#F59E0B' : '#10B981'
  return (
    <div>
      <div className="flex justify-between text-[10px] text-[#888] mb-0.5">
        <span>{current.toLocaleString()} / {capacity.toLocaleString()}</span>
        <span className="font-bold" style={{ color: c }}>{p}%</span>
      </div>
      <div className="w-full h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(p, 100)}%`, background: c }} />
      </div>
    </div>
  )
}

function MultiSelect({ options, selected, onChange, label }: { options: { value: string; label: string }[]; selected: string[]; onChange: (v: string[]) => void; label: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#555] mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => {
          const active = selected.includes(o.value)
          return (
            <button key={o.value} type="button"
              onClick={() => onChange(active ? selected.filter(v => v !== o.value) : [...selected, o.value])}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                active ? 'bg-[#FF6B00] text-white border-[#FF6B00]' : 'bg-white text-[#555] border-[#E5E7EB] hover:border-[#FF6B00]'
              }`}>
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ═══ Default form ═══ */
const defaultForm = {
  company_name: '', contact_name: '', contact_email: '', phone: '', address: '', description: '',
  vendor_type: 'digital_print', services: [] as string[], machine_types: [] as string[], supported_materials: [] as string[],
  capacity_per_day: 1000, pricing_tier: 'B', rush_multiplier: 1.2, commission_rate: 15, payment_terms: '14',
  has_delivery: false, delivery_time_hours: 24, coverage_area: 'local', is_priority: false, verified: false,
}

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
/* ─── Vendor Detail types ─── */
interface VendorProduct {
  id: string; product_id: string; vendor_id: string
  daily_capacity: number; capacity_unit: string; used_capacity: number
  price_with_vat: number; lead_time_hours: number; quality_score: number
  product?: { id: string; name: string; name_mn: string; category: string }
}

/* ─── Mini donut chart (SVG) ─── */
function DonutChart({ value, max, size = 64, strokeWidth = 7, label }: { value: number; max: number; size?: number; strokeWidth?: number; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color = pct >= 85 ? '#EF4444' : pct >= 60 ? '#F59E0B' : '#10B981'
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-sm font-extrabold" style={{ color }}>{pct}%</span>
      </div>
      {label && <span className="text-[9px] text-[#888] mt-1 text-center leading-tight">{label}</span>}
    </div>
  )
}

/* ─── Horizontal bar chart ─── */
function HBarChart({ items }: { items: { label: string; value: number; max: number; unit: string }[] }) {
  if (!items.length) return <div className="text-center text-[#999] text-xs py-6">Бүтээгдэхүүн бүртгэгдээгүй</div>
  const globalMax = Math.max(...items.map(i => i.max), 1)
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        const pct = item.max > 0 ? Math.round((item.value / item.max) * 100) : 0
        const color = pct >= 85 ? '#EF4444' : pct >= 60 ? '#F59E0B' : '#10B981'
        const barWidth = item.max > 0 ? Math.max(2, (item.max / globalMax) * 100) : 2
        return (
          <div key={i}>
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-xs font-medium text-[#333] truncate max-w-[180px]">{item.label}</span>
              <span className="text-[10px] text-[#888]">{item.value.toLocaleString()} / {item.max.toLocaleString()} {item.unit}</span>
            </div>
            <div className="relative h-5 rounded-md overflow-hidden" style={{ width: `${barWidth}%`, minWidth: 60, background: '#F3F4F6' }}>
              <div className="absolute inset-y-0 left-0 rounded-md transition-all duration-500 flex items-center justify-end pr-1.5"
                style={{ width: `${pct}%`, background: color, minWidth: pct > 0 ? 20 : 0 }}>
                {pct > 15 && <span className="text-[9px] font-bold text-white">{pct}%</span>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [form, setForm] = useState({ ...defaultForm })
  const [formStep, setFormStep] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  // Vendor detail view
  const [detailVendor, setDetailVendor] = useState<Vendor | null>(null)
  const [detailProducts, setDetailProducts] = useState<VendorProduct[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  // Product capability system — Map stores per-product capacity
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Map<string, { daily_capacity: number; capacity_unit: string }>>(new Map())
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())
  const [productSearch, setProductSearch] = useState('')

  const load = () => {
    setLoading(true)
    apiFetch<any>('/vendors').then(d => setVendors(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => {
    load()
    // Load product catalog
    apiFetch<any>('/categories', { auth: false }).then(d => { if (Array.isArray(d)) setCategories(d) }).catch(() => {})
    apiFetch<any>('/products?limit=500', { auth: false }).then(d => {
      const list = Array.isArray(d) ? d : (d?.data || [])
      setProducts(list)
    }).catch(() => {})
  }, [])

  async function refreshAllTiers() {
    setRefreshing(true)
    try { await apiFetch('/vendors/tiers/refresh-all', { method: 'POST' }); load() }
    catch {} finally { setRefreshing(false) }
  }

  async function save() {
    try {
      let vendorId = editing?.id
      if (editing) {
        await apiFetch(`/vendors/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form), headers: { 'Content-Type': 'application/json' } })
      } else {
        const created = await apiFetch<any>('/vendors', { method: 'POST', body: JSON.stringify(form), headers: { 'Content-Type': 'application/json' } })
        vendorId = created?.id
      }
      // Save product capabilities with per-product capacity
      if (vendorId && selectedProducts.size > 0) {
        const prods = Array.from(selectedProducts.entries()).map(([pid, cap]) => ({
          product_id: pid, daily_capacity: cap.daily_capacity, capacity_unit: cap.capacity_unit,
        }))
        await apiFetch(`/vendors/${vendorId}/products/bulk`, {
          method: 'POST',
          body: JSON.stringify({ products: prods }),
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => {})
      }
      setShowForm(false); setEditing(null); setForm({ ...defaultForm }); setFormStep(0); setSelectedProducts(new Map()); load()
    } catch {}
  }

  function openEdit(v: Vendor) {
    setEditing(v)
    setForm({
      company_name: v.company_name || '', contact_name: v.contact_name || '', contact_email: v.contact_email || '',
      phone: v.phone || '', address: v.address || '', description: v.description || '',
      vendor_type: v.vendor_type || 'digital_print', services: v.services || [], machine_types: v.machine_types || [],
      supported_materials: v.supported_materials || [], capacity_per_day: v.capacity_per_day || 1000,
      pricing_tier: v.pricing_tier || 'B', rush_multiplier: v.rush_multiplier || 1.2,
      commission_rate: v.commission_rate || 15, payment_terms: v.payment_terms || '14',
      has_delivery: v.has_delivery || false, delivery_time_hours: v.delivery_time_hours || 24,
      coverage_area: v.coverage_area || 'local', is_priority: v.is_priority || false, verified: v.verified || false,
    })
    // Load existing vendor products with capacity
    apiFetch<any[]>(`/vendors/${v.id}/products`).then(d => {
      if (Array.isArray(d)) {
        const m = new Map<string, { daily_capacity: number; capacity_unit: string }>()
        d.forEach((pv: any) => m.set(pv.product_id, {
          daily_capacity: pv.daily_capacity || 100,
          capacity_unit: pv.capacity_unit || 'pieces',
        }))
        setSelectedProducts(m)
      }
    }).catch(() => {})
    setFormStep(0); setShowForm(true)
  }

  function openNew() {
    setEditing(null); setForm({ ...defaultForm }); setFormStep(0); setSelectedProducts(new Map()); setShowForm(true)
  }

  // Vendor detail view
  async function openDetail(v: Vendor) {
    setDetailVendor(v)
    setDetailLoading(true)
    try {
      const d = await apiFetch<any[]>(`/vendors/${v.id}/products`)
      setDetailProducts(Array.isArray(d) ? d : [])
    } catch { setDetailProducts([]) }
    finally { setDetailLoading(false) }
  }

  // Product tree helpers
  function toggleProduct(id: string) {
    setSelectedProducts(prev => {
      const n = new Map(prev)
      if (n.has(id)) n.delete(id)
      else n.set(id, { daily_capacity: 100, capacity_unit: 'pieces' })
      return n
    })
  }
  function setProductCapacity(id: string, daily_capacity: number) {
    setSelectedProducts(prev => {
      const n = new Map(prev)
      const existing = n.get(id) || { daily_capacity: 100, capacity_unit: 'pieces' }
      n.set(id, { ...existing, daily_capacity })
      return n
    })
  }
  function setProductUnit(id: string, capacity_unit: string) {
    setSelectedProducts(prev => {
      const n = new Map(prev)
      const existing = n.get(id) || { daily_capacity: 100, capacity_unit: 'pieces' }
      n.set(id, { ...existing, capacity_unit })
      return n
    })
  }
  function toggleCategory(catName: string) {
    const catProducts = products.filter(p => p.category === catName)
    const allSelected = catProducts.every(p => selectedProducts.has(p.id))
    setSelectedProducts(prev => {
      const n = new Map(prev)
      catProducts.forEach(p => {
        if (allSelected) n.delete(p.id)
        else if (!n.has(p.id)) n.set(p.id, { daily_capacity: 100, capacity_unit: 'pieces' })
      })
      return n
    })
  }
  function toggleExpandCat(catName: string) {
    setExpandedCats(prev => { const n = new Set(prev); n.has(catName) ? n.delete(catName) : n.add(catName); return n })
  }

  // Group products by category
  const productsByCategory = products.reduce((acc: Record<string, any[]>, p) => {
    const cat = p.category || 'Бусад'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  const f = (k: string) => (form as any)[k]
  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  // Vendor-role users for linking dropdown
  const [vendorUsers, setVendorUsers] = useState<any[]>([])
  useEffect(() => {
    apiFetch<any>('/users?role=vendor&limit=200').then(d => {
      const list = Array.isArray(d) ? d : (d?.data || d?.items || [])
      setVendorUsers(list)
    }).catch(() => {})
  }, [])

  // Capacity data (embedded, not separate page)
  const [capacityOverview, setCapacityOverview] = useState<any>(null)
  const [capacityProducts, setCapacityProducts] = useState<any[]>([])
  const [capacityVendors, setCapacityVendors] = useState<any[]>([])
  const [pageTab, setPageTab] = useState<'vendors' | 'capacity'>('vendors')

  useEffect(() => {
    // Fetch capacity data when on capacity tab
    if (pageTab === 'capacity') {
      apiFetch<any>('/capacity/overview').then(d => setCapacityOverview(d)).catch(() => {})
      apiFetch<any[]>('/capacity/products').then(d => setCapacityProducts(Array.isArray(d) ? d : [])).catch(() => {})
      apiFetch<any[]>('/capacity/vendors').then(d => setCapacityVendors(Array.isArray(d) ? d : [])).catch(() => {})
    }
  }, [pageTab])

  // Summary
  const totalCap = vendors.reduce((s, v) => s + v.capacity_per_day, 0)
  const avail = vendors.filter(v => (v.load_status || 'available') === 'available').length
  const busyCount = vendors.filter(v => (v.load_status) === 'busy').length
  const fullCount = vendors.filter(v => (v.load_status) === 'full').length

  const STEPS = ['Үндсэн мэдээлэл', 'Үйлчилгээ & Тоног', 'Үнэ & Санхүү', 'Хүргэлт & Тохиргоо']

  if (loading) return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-100 rounded w-48" /><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}</div></div></div>

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111] tracking-tight">Vendor Tier</h1>
          <p className="text-sm text-[#888] mt-1">Нийлүүлэгч / Үйлдвэр удирдлага & хүчин чадал</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refreshAllTiers} disabled={refreshing}
            className="px-3 py-2 text-xs font-semibold bg-white border border-[#E5E7EB] rounded-lg hover:border-[#FF6B00] transition-colors">
            {refreshing ? '⏳' : '🔄'} Tier шинэчлэх
          </button>
          <button onClick={openNew} className="px-4 py-2 text-xs font-bold bg-[#FF6B00] text-white rounded-lg hover:bg-[#E55D00] transition-colors">
            + Шинэ vendor
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-xs text-[#888]">Нийт vendor</div>
          <div className="text-2xl font-extrabold text-[#111]">{vendors.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-xs text-[#888]">Хүчин чадал</div>
          <div className="text-2xl font-extrabold text-[#111]">{totalCap.toLocaleString()}<span className="text-xs text-[#888] font-normal">/өдөр</span></div>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
          <div className="text-xs text-emerald-600">🟢 Чөлөөтэй</div>
          <div className="text-2xl font-extrabold text-emerald-700">{avail}</div>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <div className="text-xs text-amber-600">🟡 Ачаалалтай</div>
          <div className="text-2xl font-extrabold text-amber-700">{busyCount}</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <div className="text-xs text-red-600">🔴 Дүүрэн</div>
          <div className="text-2xl font-extrabold text-red-700">{fullCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-xs text-[#888]">Нийт захиалга</div>
          <div className="text-2xl font-extrabold text-[#111]">{vendors.reduce((s, v) => s + v.total_orders, 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Page tabs: Vendors | Capacity */}
      <div className="flex gap-1 mb-5">
        <button onClick={() => setPageTab('vendors')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pageTab === 'vendors' ? 'bg-[#FF6B00] text-white' : 'bg-white text-[#555] border border-[#E5E7EB] hover:border-[#FF6B00]'}`}>
          🏭 Vendor жагсаалт ({vendors.length})
        </button>
        <button onClick={() => setPageTab('capacity')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pageTab === 'capacity' ? 'bg-[#FF6B00] text-white' : 'bg-white text-[#555] border border-[#E5E7EB] hover:border-[#FF6B00]'}`}>
          📊 Хүчин чадлын хяналт
        </button>
      </div>

      {/* ═══ CAPACITY TAB ═══ */}
      {pageTab === 'capacity' && (
        <div>
          {/* Global gauge */}
          {capacityOverview && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="relative flex-shrink-0" style={{ width: 100, height: 100 }}>
                  <DonutChart value={capacityOverview.used_capacity} max={capacityOverview.total_capacity} size={100} strokeWidth={10} />
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><div className="text-xs text-[#888] mb-1">Нийт хүчин чадал</div><div className="text-xl font-extrabold text-[#111]">{fmt(capacityOverview.total_capacity)}</div></div>
                  <div><div className="text-xs text-[#888] mb-1">Ашиглагдаж буй</div><div className="text-xl font-extrabold text-[#FF6B00]">{fmt(capacityOverview.used_capacity)}</div></div>
                  <div><div className="text-xs text-[#888] mb-1">Чөлөөтэй</div><div className="text-xl font-extrabold text-emerald-600">{fmt(capacityOverview.remaining_capacity)}</div></div>
                  <div><div className="text-xs text-[#888] mb-1">Бүтээгдэхүүн</div><div className="text-xl font-extrabold text-[#111]">{capacityOverview.product_count}</div></div>
                </div>
              </div>
              <div className="mt-4"><ProgressBar value={capacityOverview.used_capacity} max={capacityOverview.total_capacity} height={10} /></div>
            </div>
          )}

          {/* Bottleneck alerts */}
          {capacityOverview?.bottlenecks?.length > 0 && (
            <div className="mb-6 space-y-2">
              {capacityOverview.bottlenecks.map((b: any) => (
                <div key={b.product_id} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔥</span>
                    <div>
                      <div className="text-sm font-bold text-red-700">{b.product_name} — {b.utilization}% ачаалалтай</div>
                      <div className="text-[11px] text-red-500">{fmt(b.used_capacity)} / {fmt(b.total_capacity)}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg">CRITICAL</span>
                </div>
              ))}
            </div>
          )}

          {/* Capacity tables side by side */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Product capacity */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E5E7EB]">
                <h3 className="text-sm font-bold text-[#111]">📦 Бүтээгдэхүүнээр</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-[10px] text-[#888] uppercase border-b border-[#E5E7EB]">
                    <th className="text-left px-4 py-2.5">Бүтээгдэхүүн</th>
                    <th className="text-right px-3 py-2.5">Чадал</th>
                    <th className="text-right px-3 py-2.5">Ашигл.</th>
                    <th className="px-4 py-2.5 w-[140px]">Ачаалал</th>
                  </tr></thead>
                  <tbody>
                    {capacityProducts.map((p: any, i: number) => (
                      <tr key={p.product_id || i} className="border-t border-[#F3F4F6] hover:bg-[#FAFAFA]">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-[#111]">{p.product_name}</div>
                          <div className="text-[9px] text-[#999]">{p.vendor_count} vendor</div>
                        </td>
                        <td className="text-right px-3 py-2.5 text-[#555]">{fmt(p.total_capacity)}</td>
                        <td className="text-right px-3 py-2.5" style={{ color: p.utilization >= 85 ? '#EF4444' : p.utilization >= 60 ? '#F59E0B' : '#10B981' }}>{fmt(p.used_capacity)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1"><ProgressBar value={p.used_capacity} max={p.total_capacity} height={5} /></div>
                            <span className="text-[10px] font-bold w-8 text-right" style={{ color: p.utilization >= 85 ? '#EF4444' : p.utilization >= 60 ? '#F59E0B' : '#10B981' }}>{p.utilization}%</span>
                            {p.status === 'critical' && <span className="text-xs">🔥</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {capacityProducts.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-[#999]">Өгөгдөл байхгүй</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vendor capacity */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E5E7EB]">
                <h3 className="text-sm font-bold text-[#111]">🏭 Vendor-ээр</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-[10px] text-[#888] uppercase border-b border-[#E5E7EB]">
                    <th className="text-left px-4 py-2.5">Vendor</th>
                    <th className="text-right px-3 py-2.5">Чадал</th>
                    <th className="text-right px-3 py-2.5">Ашигл.</th>
                    <th className="px-4 py-2.5 w-[140px]">Ачаалал</th>
                    <th className="text-center px-2 py-2.5">Статус</th>
                  </tr></thead>
                  <tbody>
                    {capacityVendors.map((v: any, i: number) => (
                      <tr key={v.vendor_id || i} className="border-t border-[#F3F4F6] hover:bg-[#FAFAFA] cursor-pointer"
                        onClick={() => { const found = vendors.find(vv => vv.id === v.vendor_id); if (found) openDetail(found) }}>
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-[#111]">{v.vendor_name}</div>
                          <div className="text-[9px] text-[#999]">{v.product_count} бүтээгдэхүүн</div>
                        </td>
                        <td className="text-right px-3 py-2.5 text-[#555]">{fmt(v.total_capacity)}</td>
                        <td className="text-right px-3 py-2.5" style={{ color: v.utilization >= 85 ? '#EF4444' : v.utilization >= 60 ? '#F59E0B' : '#10B981' }}>{fmt(v.used_capacity)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1"><ProgressBar value={v.used_capacity} max={v.total_capacity} height={5} /></div>
                            <span className="text-[10px] font-bold w-8 text-right" style={{ color: v.utilization >= 85 ? '#EF4444' : v.utilization >= 60 ? '#F59E0B' : '#10B981' }}>{v.utilization}%</span>
                          </div>
                        </td>
                        <td className="text-center px-2 py-2.5">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{
                            background: v.utilization >= 85 ? '#FEF2F2' : v.utilization >= 60 ? '#FFF8EB' : '#ECFDF5',
                            color: v.utilization >= 85 ? '#EF4444' : v.utilization >= 60 ? '#F59E0B' : '#10B981',
                          }}>{v.utilization >= 85 ? '🔴' : v.utilization >= 60 ? '🟡' : '🟢'}</span>
                        </td>
                      </tr>
                    ))}
                    {capacityVendors.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-[#999]">Өгөгдөл байхгүй</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ VENDORS TAB — Vendor Cards ═══ */}
      {pageTab === 'vendors' && (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {vendors.map(v => {
          const ct = CT[v.capacity_tier] || CT.small
          const ls = LS[v.load_status] || LS.available
          return (
            <div key={v.id} onClick={() => openDetail(v)} className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <div className="px-4 pt-4 pb-2 flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: ct.bg }}>{ct.icon}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#111] truncate">{v.company_name}</div>
                    <div className="text-[11px] text-[#888]">{v.contact_email}</div>
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); openEdit(v) }} className="text-[11px] text-[#FF6B00] font-medium hover:underline flex-shrink-0">Засах</button>
              </div>
              <div className="px-4 pb-2 flex flex-wrap gap-1">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: ct.bg, color: ct.color }}>{ct.label}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: ls.bg, color: ls.color }}>{ls.label}</span>
                {v.is_priority && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">⭐ PRIORITY</span>}
                {v.verified && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">✓ Verified</span>}
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#666]">{VENDOR_TYPES.find(t => t.value === v.vendor_type)?.label || v.vendor_type}</span>
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#666]">Шимтгэл: {v.commission_rate}%</span>
              </div>
              <div className="px-4 pb-2">
                <LoadBar current={v.current_load} capacity={v.capacity_per_day} />
              </div>
              <div className="px-4 pb-3 grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-[#F8F8F8] rounded-lg py-1.5">
                  <div className="text-[11px] font-bold text-[#111]">{v.capacity_per_day.toLocaleString()}</div>
                  <div className="text-[8px] text-[#888]">Чадал/өдөр</div>
                </div>
                <div className="bg-[#F8F8F8] rounded-lg py-1.5">
                  <div className="text-[11px] font-bold text-emerald-600">{Math.max(0, v.capacity_per_day - v.current_load).toLocaleString()}</div>
                  <div className="text-[8px] text-[#888]">Чөлөөтэй</div>
                </div>
                <div className="bg-[#F8F8F8] rounded-lg py-1.5">
                  <div className="text-[11px] font-bold text-[#111]">{Number(v.score).toFixed(0)}</div>
                  <div className="text-[8px] text-[#888]">Оноо</div>
                </div>
              </div>
              {(v.services || []).length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-1">
                  {v.services.slice(0, 4).map(s => (
                    <span key={s} className="text-[9px] text-[#888] bg-[#F3F4F6] px-1.5 py-0.5 rounded">{SERVICES.find(x => x.value === s)?.label || s}</span>
                  ))}
                  {v.services.length > 4 && <span className="text-[9px] text-[#888]">+{v.services.length - 4}</span>}
                </div>
              )}
            </div>
          )
        })}
        {vendors.length === 0 && (
          <div className="col-span-3 text-center py-16 text-[#999]"><div className="text-4xl mb-3">🏭</div><div className="text-sm">Vendor байхгүй</div></div>
        )}
      </div>
      )}

      {/* ═══ FORM MODAL — Multi-step ═══ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-[600px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="px-6 pt-5 pb-4 border-b border-[#E5E7EB] flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-[#111]">{editing ? 'Vendor засах' : 'Шинэ vendor бүртгэх'}</h2>
                <p className="text-xs text-[#888] mt-0.5">Алхам {formStep + 1} / {STEPS.length}: {STEPS[formStep]}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[#888] hover:text-[#111] text-sm cursor-pointer border-none">✕</button>
            </div>

            {/* Step indicators */}
            <div className="px-6 pt-3 pb-2 flex gap-1 flex-shrink-0">
              {STEPS.map((s, i) => (
                <button key={i} onClick={() => setFormStep(i)}
                  className={`flex-1 h-1 rounded-full transition-colors ${i <= formStep ? 'bg-[#FF6B00]' : 'bg-[#E5E7EB]'}`} />
              ))}
            </div>

            {/* Form content — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Step 0: Basic Info */}
              {formStep === 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#555] mb-1 block">Компанийн нэр *</label>
                      <input value={f('company_name')} onChange={e => set('company_name', e.target.value)}
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00] transition-colors" placeholder="Нэр" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#555] mb-1 block">Холбоо барих нэр</label>
                      <input value={f('contact_name')} onChange={e => set('contact_name', e.target.value)}
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00] transition-colors" placeholder="Менежерийн нэр" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#555] mb-1 block">И-мэйл *</label>
                      <input type="email" value={f('contact_email')} onChange={e => set('contact_email', e.target.value)}
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00] transition-colors" placeholder="email@company.mn" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#555] mb-1 block">Утас</label>
                      <input value={f('phone')} onChange={e => set('phone', e.target.value)}
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00] transition-colors" placeholder="+976 ..." />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#555] mb-1 block">Хаяг</label>
                    <input value={f('address')} onChange={e => set('address', e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00] transition-colors" placeholder="Байршил" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#555] mb-1 block">Vendor төрөл *</label>
                    <select value={f('vendor_type')} onChange={e => set('vendor_type', e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" style={{ appearance: 'auto' }}>
                      {VENDOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#555] mb-1 block">Тайлбар</label>
                    <textarea value={f('description')} onChange={e => set('description', e.target.value)} rows={2}
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00] resize-none transition-colors" placeholder="Товч тайлбар" />
                  </div>
                </div>
              )}

              {/* Step 1: Product Capabilities + Equipment */}
              {formStep === 1 && (
                <div className="space-y-5">
                  {/* ── Product Tree Selector ── */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-[#555]">Хийж чадах бүтээгдэхүүнүүд *</label>
                      <span className="text-[10px] text-[#FF6B00] font-bold">{selectedProducts.size} сонгосон</span>
                    </div>
                    {/* Search */}
                    <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Бүтээгдэхүүн хайх..."
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-xs outline-none focus:border-[#FF6B00] mb-2 transition-colors placeholder:text-[#BBB]" />
                    {/* Tree */}
                    <div className="border border-[#E5E7EB] rounded-xl max-h-[240px] overflow-y-auto">
                      {Object.entries(productsByCategory).length === 0 && (
                        <div className="text-center text-[#999] text-xs py-6">Бүтээгдэхүүн олдсонгүй</div>
                      )}
                      {Object.entries(productsByCategory).map(([catName, catProducts]) => {
                        const filtered = productSearch
                          ? (catProducts as any[]).filter(p => (p.name || p.name_mn || '').toLowerCase().includes(productSearch.toLowerCase()))
                          : catProducts as any[]
                        if (productSearch && !filtered.length) return null
                        const expanded = expandedCats.has(catName) || !!productSearch
                        const allSelected = filtered.every((p: any) => selectedProducts.has(p.id))
                        const someSelected = filtered.some((p: any) => selectedProducts.has(p.id))
                        const cat = categories.find(c => c.name === catName || c.name_mn === catName)

                        return (
                          <div key={catName} className="border-b border-[#F3F4F6] last:border-b-0">
                            {/* Category header */}
                            <div className="flex items-center gap-2 px-3 py-2 hover:bg-[#FAFAFA] cursor-pointer" onClick={() => toggleExpandCat(catName)}>
                              <span className="text-[10px] text-[#BBB] w-4 text-center">{expanded ? '▼' : '▶'}</span>
                              <button type="button" onClick={e => { e.stopPropagation(); toggleCategory(catName) }}
                                className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] flex-shrink-0 ${
                                  allSelected ? 'bg-[#FF6B00] border-[#FF6B00] text-white' : someSelected ? 'bg-orange-100 border-[#FF6B00]' : 'border-[#D1D5DB]'
                                }`}>
                                {allSelected ? '✓' : someSelected ? '−' : ''}
                              </button>
                              <span className="text-xs font-semibold text-[#333] flex-1">{cat?.icon || '📦'} {catName}</span>
                              <span className="text-[10px] text-[#999]">{filtered.length} бүтээгдэхүүн</span>
                            </div>
                            {/* Products with capacity input */}
                            {expanded && (
                              <div className="pl-8 pb-1">
                                {filtered.map((p: any) => {
                                  const isSelected = selectedProducts.has(p.id)
                                  const cap = selectedProducts.get(p.id)
                                  return (
                                    <div key={p.id} className={`rounded-lg mb-0.5 ${isSelected ? 'bg-orange-50/50' : ''}`}>
                                      <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#F8F8F8] rounded cursor-pointer">
                                        <input type="checkbox" checked={isSelected} onChange={() => toggleProduct(p.id)}
                                          className="w-3.5 h-3.5 rounded accent-[#FF6B00]" />
                                        <span className="text-xs text-[#333] flex-1">{p.name_mn || p.name}</span>
                                        {p.base_price > 0 && <span className="text-[10px] text-[#999]">₮{Number(p.base_price).toLocaleString()}</span>}
                                      </label>
                                      {/* Per-product capacity input */}
                                      {isSelected && cap && (
                                        <div className="flex items-center gap-1.5 pl-8 pr-2 pb-1.5">
                                          <span className="text-[10px] text-[#999] flex-shrink-0">Чадал:</span>
                                          <input type="number" min={1} value={cap.daily_capacity}
                                            onChange={e => setProductCapacity(p.id, Math.max(1, Number(e.target.value)))}
                                            className="w-20 px-1.5 py-0.5 border border-[#E5E7EB] rounded text-[11px] text-[#333] outline-none focus:border-[#FF6B00]"
                                            onClick={e => e.stopPropagation()} />
                                          <select value={cap.capacity_unit} onChange={e => setProductUnit(p.id, e.target.value)}
                                            className="px-1 py-0.5 border border-[#E5E7EB] rounded text-[10px] text-[#555] outline-none" style={{ appearance: 'auto' }}
                                            onClick={e => e.stopPropagation()}>
                                            <option value="pieces">ширхэг/өдөр</option>
                                            <option value="m2">м²/өдөр</option>
                                            <option value="meters">метр/өдөр</option>
                                          </select>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Equipment & Materials */}
                  <MultiSelect options={MACHINES} selected={f('machine_types')} onChange={v => set('machine_types', v)} label="Тоног төхөөрөмж" />
                  <MultiSelect options={MATERIALS} selected={f('supported_materials')} onChange={v => set('supported_materials', v)} label="Дэмжих материал" />

                  {/* Capacity */}
                  <div>
                    <label className="text-xs font-semibold text-[#555] mb-1 block">Өдрийн хүчин чадал (ширхэг)</label>
                    <input type="number" value={f('capacity_per_day')} onChange={e => set('capacity_per_day', Number(e.target.value))}
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00] transition-colors" min={1} />
                    <div className="text-[10px] text-[#999] mt-1">
                      {f('capacity_per_day') >= 50000 ? '🏢 ENTERPRISE' : f('capacity_per_day') >= 10000 ? '🏭 LARGE' : f('capacity_per_day') >= 1000 ? '🔧 MEDIUM' : '🔨 SMALL'} tier
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Pricing & Financial */}
              {formStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#555] mb-1 block">Үнийн зэрэглэл</label>
                      <select value={f('pricing_tier')} onChange={e => set('pricing_tier', e.target.value)}
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" style={{ appearance: 'auto' }}>
                        <option value="A">A — Premium (чанар өндөр, үнэ өндөр)</option>
                        <option value="B">B — Standard</option>
                        <option value="C">C — Budget (хямд)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#555] mb-1 block">Яаралтай үнийн коэффициент</label>
                      <input type="number" step="0.1" min="1" max="3" value={f('rush_multiplier')} onChange={e => set('rush_multiplier', Number(e.target.value))}
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00] transition-colors" />
                      <div className="text-[10px] text-[#999] mt-1">Жишээ: 1.5 = Яаралтай үед 50% нэмэгдэнэ</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#555] mb-1 block">BizPrint шимтгэл (%)</label>
                      <input type="number" step="0.5" min="0" max="50" value={f('commission_rate')} onChange={e => set('commission_rate', Number(e.target.value))}
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00] transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#555] mb-1 block">Төлбөрийн нөхцөл</label>
                      <select value={f('payment_terms')} onChange={e => set('payment_terms', e.target.value)}
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" style={{ appearance: 'auto' }}>
                        <option value="7">7 хоног</option>
                        <option value="14">14 хоног</option>
                        <option value="30">30 хоног</option>
                      </select>
                    </div>
                  </div>
                  {/* Floor prices per product type */}
                  <div>
                    <label className="text-xs font-semibold text-[#555] mb-2 block">Доод үнэ (₮) — бүтээгдэхүүний төрлөөр</label>
                    <div className="text-[10px] text-[#999] mb-2">Vendor-д очих цэвэр орлого энэ дүнгээс багадвал автомат хуваарилалтаас хасагдана. 0 = хязгааргүй.</div>
                    <div className="grid grid-cols-2 gap-2">
                      {['business-card', 'flyer', 'banner', 'sticker', 'brochure', 'poster', 'book'].map(pt => (
                        <div key={pt} className="flex items-center gap-2">
                          <span className="text-[11px] text-[#666] w-20 flex-shrink-0">{pt}</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={(f('floor_prices') || {})[pt] ?? ''}
                            onChange={e => set('floor_prices', { ...(f('floor_prices') || {}), [pt]: e.target.value === '' ? 0 : Number(e.target.value) })}
                            className="flex-1 px-2 py-1.5 border border-[#E5E7EB] rounded-lg text-xs outline-none focus:border-[#FF6B00]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Vendor→User linking */}
                  <div>
                    <label className="text-xs font-semibold text-[#555] mb-1 block">Холбогдсон хэрэглэгч</label>
                    <select value={f('user_id') || ''} onChange={e => set('user_id', e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" style={{ appearance: 'auto' }}>
                      <option value="">— Холбоогүй —</option>
                      {vendorUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.full_name || u.name || u.email} {u.email ? `(${u.email})` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="text-[10px] text-[#999] mt-1">
                      Энэ хэрэглэгч нэвтрэхэд vendor дашборд дээр ирсэн захиалгуудыг харна. Шимтгэлийн хувь нь энэ vendor-ийн тохиргооноос шууд уншина.
                    </div>
                  </div>
                  {/* Preview */}
                  <div className="bg-[#F8F8F8] rounded-xl p-4 mt-2">
                    <div className="text-xs font-bold text-[#555] mb-2">💰 Санхүүгийн тойм</div>
                    <div className="grid grid-cols-3 gap-3 text-center text-xs">
                      <div><div className="font-bold text-[#FF6B00]">{f('commission_rate')}%</div><div className="text-[#888]">Шимтгэл</div></div>
                      <div><div className="font-bold text-[#111]">{f('rush_multiplier')}x</div><div className="text-[#888]">Rush үнэ</div></div>
                      <div><div className="font-bold text-[#111]">{f('payment_terms')} хоног</div><div className="text-[#888]">Төлбөр</div></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Logistics & Settings */}
              {formStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-xl">
                    <div><div className="text-sm font-semibold text-[#111]">Хүргэлттэй эсэх</div><div className="text-xs text-[#888]">Vendor өөрөө хүргэлт хийдэг үү</div></div>
                    <button type="button" onClick={() => set('has_delivery', !f('has_delivery'))}
                      className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${f('has_delivery') ? 'bg-[#FF6B00]' : 'bg-[#D1D5DB]'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${f('has_delivery') ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  {f('has_delivery') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[#555] mb-1 block">Хүргэлтийн хугацаа (цаг)</label>
                        <input type="number" value={f('delivery_time_hours')} onChange={e => set('delivery_time_hours', Number(e.target.value))}
                          className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00] transition-colors" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#555] mb-1 block">Хүргэх бүс</label>
                        <select value={f('coverage_area')} onChange={e => set('coverage_area', e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" style={{ appearance: 'auto' }}>
                          <option value="local">Улаанбаатар дотор</option>
                          <option value="nationwide">Бүх Монгол</option>
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-xl">
                    <div><div className="text-sm font-semibold text-[#111]">Давуу эрхтэй vendor</div><div className="text-xs text-[#888]">Захиалга хуваарилалтад давуу эрх</div></div>
                    <button type="button" onClick={() => set('is_priority', !f('is_priority'))}
                      className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${f('is_priority') ? 'bg-[#FF6B00]' : 'bg-[#D1D5DB]'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${f('is_priority') ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-xl">
                    <div><div className="text-sm font-semibold text-[#111]">Баталгаажуулсан</div><div className="text-xs text-[#888]">Гэрээ, лиценз шалгагдсан</div></div>
                    <button type="button" onClick={() => set('verified', !f('verified'))}
                      className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${f('verified') ? 'bg-emerald-500' : 'bg-[#D1D5DB]'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${f('verified') ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="px-6 py-4 border-t border-[#E5E7EB] flex justify-between flex-shrink-0">
              <button
                onClick={() => formStep > 0 ? setFormStep(formStep - 1) : setShowForm(false)}
                className="px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#555] hover:bg-[#F8F8F8] transition-colors">
                {formStep > 0 ? '← Өмнөх' : 'Болих'}
              </button>
              {formStep < STEPS.length - 1 ? (
                <button onClick={() => setFormStep(formStep + 1)}
                  className="px-6 py-2.5 bg-[#FF6B00] hover:bg-[#E55D00] text-white rounded-lg text-sm font-bold transition-colors">
                  Дараах →
                </button>
              ) : (
                <button onClick={save}
                  className="px-6 py-2.5 bg-[#FF6B00] hover:bg-[#E55D00] text-white rounded-lg text-sm font-bold transition-colors">
                  {editing ? '✓ Хадгалах' : '✓ Vendor үүсгэх'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ VENDOR DETAIL MODAL ═══ */}
      {detailVendor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setDetailVendor(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-[700px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-[#E5E7EB] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: (CT[detailVendor.capacity_tier] || CT.small).bg }}>
                  {(CT[detailVendor.capacity_tier] || CT.small).icon}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#111]">{detailVendor.company_name}</h2>
                  <div className="flex gap-1.5 mt-0.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: (CT[detailVendor.capacity_tier] || CT.small).bg, color: (CT[detailVendor.capacity_tier] || CT.small).color }}>{(CT[detailVendor.capacity_tier] || CT.small).label}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: (LS[detailVendor.load_status] || LS.available).bg, color: (LS[detailVendor.load_status] || LS.available).color }}>{(LS[detailVendor.load_status] || LS.available).label}</span>
                    {detailVendor.verified && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">✓ Verified</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); setDetailVendor(null); openEdit(detailVendor) }}
                  className="px-3 py-1.5 text-xs font-semibold text-[#FF6B00] border border-[#FF6B00] rounded-lg hover:bg-orange-50 transition-colors">
                  ✏️ Засах
                </button>
                <button onClick={() => setDetailVendor(null)} className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[#888] hover:text-[#111] text-sm cursor-pointer border-none">✕</button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* KPI Row */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-[#F8F8F8] rounded-xl p-3 text-center">
                  <div className="text-xl font-extrabold text-[#111]">{detailVendor.capacity_per_day.toLocaleString()}</div>
                  <div className="text-[10px] text-[#888]">Нийт чадал/өдөр</div>
                </div>
                <div className="bg-[#F8F8F8] rounded-xl p-3 text-center">
                  <div className="text-xl font-extrabold text-[#FF6B00]">{detailVendor.current_load}</div>
                  <div className="text-[10px] text-[#888]">Одоогийн ачаалал</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-extrabold text-emerald-600">{Math.max(0, detailVendor.capacity_per_day - detailVendor.current_load).toLocaleString()}</div>
                  <div className="text-[10px] text-[#888]">Чөлөөтэй</div>
                </div>
                <div className="bg-[#F8F8F8] rounded-xl p-3 text-center">
                  <div className="text-xl font-extrabold text-[#111]">{Number(detailVendor.score).toFixed(0)}</div>
                  <div className="text-[10px] text-[#888]">Оноо</div>
                </div>
              </div>

              {/* Overall utilization gauge */}
              <div className="flex items-center gap-6 mb-6 bg-[#F8F8F8] rounded-xl p-5">
                <div className="relative flex-shrink-0" style={{ width: 90, height: 90 }}>
                  <DonutChart value={detailVendor.current_load} max={detailVendor.capacity_per_day} size={90} strokeWidth={9} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#111] mb-1">Нийт ачаалал</div>
                  <LoadBar current={detailVendor.current_load} capacity={detailVendor.capacity_per_day} />
                  <div className="flex gap-4 mt-3 text-xs text-[#555]">
                    <span>📦 Захиалга: <b>{detailVendor.total_orders}</b></span>
                    <span>⭐ Үнэлгээ: <b>{Number(detailVendor.rating).toFixed(1)}</b></span>
                    <span>💰 Шимтгэл: <b>{detailVendor.commission_rate}%</b></span>
                  </div>
                </div>
              </div>

              {/* Per-product capacity charts */}
              <div className="mb-4">
                <h3 className="text-sm font-bold text-[#111] mb-3">📊 Бүтээгдэхүүн тус бүрийн хүчин чадал</h3>
                {detailLoading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
                ) : detailProducts.length === 0 ? (
                  <div className="text-center text-[#999] text-sm py-8 bg-[#F8F8F8] rounded-xl">
                    <div className="text-2xl mb-2">📦</div>
                    Бүтээгдэхүүн бүртгэгдээгүй
                  </div>
                ) : (
                  <>
                    {/* Donut charts row */}
                    <div className="flex flex-wrap gap-4 mb-5 justify-center">
                      {detailProducts.slice(0, 8).map(pv => (
                        <div key={pv.id} className="relative">
                          <DonutChart
                            value={pv.used_capacity || 0}
                            max={pv.daily_capacity || 1}
                            size={72}
                            strokeWidth={7}
                            label={pv.product?.name_mn || pv.product?.name || 'Бүтээгдэхүүн'}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Horizontal bar chart */}
                    <div className="bg-[#F8F8F8] rounded-xl p-4">
                      <HBarChart items={detailProducts.map(pv => ({
                        label: pv.product?.name_mn || pv.product?.name || 'Бүтээгдэхүүн',
                        value: pv.used_capacity || 0,
                        max: pv.daily_capacity || 0,
                        unit: pv.capacity_unit === 'm2' ? 'м²' : pv.capacity_unit === 'meters' ? 'м' : 'ш',
                      }))} />
                    </div>

                    {/* Detail table */}
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-[10px] text-[#888] uppercase tracking-wider border-b border-[#E5E7EB]">
                            <th className="text-left py-2 px-2 font-semibold">Бүтээгдэхүүн</th>
                            <th className="text-right py-2 px-2 font-semibold">Чадал</th>
                            <th className="text-right py-2 px-2 font-semibold">Ашиглагдсан</th>
                            <th className="text-right py-2 px-2 font-semibold">Чөлөөтэй</th>
                            <th className="text-right py-2 px-2 font-semibold">%</th>
                            <th className="text-right py-2 px-2 font-semibold">Хугацаа</th>
                            <th className="text-right py-2 px-2 font-semibold">Чанар</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailProducts.map(pv => {
                            const cap = pv.daily_capacity || 0
                            const used = pv.used_capacity || 0
                            const rem = Math.max(0, cap - used)
                            const pctVal = cap > 0 ? Math.round((used / cap) * 100) : 0
                            const color = pctVal >= 85 ? '#EF4444' : pctVal >= 60 ? '#F59E0B' : '#10B981'
                            const unit = pv.capacity_unit === 'm2' ? 'м²' : pv.capacity_unit === 'meters' ? 'м' : 'ш'
                            return (
                              <tr key={pv.id} className="border-b border-[#F3F4F6] hover:bg-white transition-colors">
                                <td className="py-2 px-2 font-medium text-[#111]">{pv.product?.name_mn || pv.product?.name || '—'}</td>
                                <td className="text-right py-2 px-2 text-[#555]">{cap.toLocaleString()} {unit}</td>
                                <td className="text-right py-2 px-2" style={{ color }}>{used.toLocaleString()}</td>
                                <td className="text-right py-2 px-2 text-emerald-600">{rem.toLocaleString()}</td>
                                <td className="text-right py-2 px-2"><span className="font-bold px-1.5 py-0.5 rounded text-[10px]" style={{ background: color + '15', color }}>{pctVal}%</span></td>
                                <td className="text-right py-2 px-2 text-[#888]">{pv.lead_time_hours}ц</td>
                                <td className="text-right py-2 px-2 text-[#888]">{pv.quality_score}/100</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Vendor info summary */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-[#F8F8F8] rounded-xl p-3">
                  <div className="text-[10px] text-[#888] mb-1">📧 И-мэйл</div>
                  <div className="text-xs font-medium text-[#111]">{detailVendor.contact_email}</div>
                </div>
                <div className="bg-[#F8F8F8] rounded-xl p-3">
                  <div className="text-[10px] text-[#888] mb-1">📞 Утас</div>
                  <div className="text-xs font-medium text-[#111]">{detailVendor.phone || '—'}</div>
                </div>
                <div className="bg-[#F8F8F8] rounded-xl p-3">
                  <div className="text-[10px] text-[#888] mb-1">🏷️ Vendor төрөл</div>
                  <div className="text-xs font-medium text-[#111]">{VENDOR_TYPES.find(t => t.value === detailVendor.vendor_type)?.label || detailVendor.vendor_type}</div>
                </div>
                <div className="bg-[#F8F8F8] rounded-xl p-3">
                  <div className="text-[10px] text-[#888] mb-1">📍 Хаяг</div>
                  <div className="text-xs font-medium text-[#111]">{detailVendor.address || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
