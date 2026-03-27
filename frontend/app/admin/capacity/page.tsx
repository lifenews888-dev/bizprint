'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'

/* ═══ Types ═══ */
interface Overview {
  total_capacity: number; used_capacity: number; remaining_capacity: number; utilization: number
  vendor_count: number; product_count: number; capability_count: number
  vendors_available: number; vendors_busy: number; vendors_full: number
  bottleneck_count: number
  bottlenecks: { product_id: string; product_name: string; total_capacity: number; used_capacity: number; utilization: number }[]
}
interface ProductCap {
  product_id: string; product_name: string; category: string; vendor_count: number
  total_capacity: number; used_capacity: number; remaining_capacity: number; utilization: number; status: string
}
interface VendorCap {
  vendor_id: string; vendor_name: string; vendor_status: string; load_status: string
  capacity_tier: string; vendor_score: number; product_count: number
  total_capacity: number; used_capacity: number; remaining_capacity: number; utilization: number; status: string
}

/* ═══ Helpers ═══ */
function utilColor(pct: number) { return pct >= 85 ? '#EF4444' : pct >= 60 ? '#F59E0B' : '#10B981' }
function utilBg(pct: number) { return pct >= 85 ? '#FEF2F2' : pct >= 60 ? '#FFF8EB' : '#ECFDF5' }
function utilLabel(pct: number) { return pct >= 85 ? '🔴 Хүнд' : pct >= 60 ? '🟡 Дунд' : '🟢 Хэвийн' }
const fmt = (n: number) => n.toLocaleString()

function ProgressBar({ value, max, height = 8 }: { value: number; max: number; height?: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: '#F3F4F6' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: utilColor(pct) }} />
    </div>
  )
}

function KpiCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: (color || '#FF6B00') + '12' }}>{icon}</div>
        <span className="text-xs text-[#888] font-medium">{label}</span>
      </div>
      <div className="text-2xl font-extrabold text-[#111] tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-[#999] mt-1">{sub}</div>}
    </div>
  )
}

/* ═══ MAIN PAGE ═══ */
export default function CapacityDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [products, setProducts] = useState<ProductCap[]>([])
  const [vendors, setVendors] = useState<VendorCap[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'products' | 'vendors'>('products')

  async function fetchAll() {
    setLoading(true)
    try {
      const [ov, pr, ve] = await Promise.all([
        apiFetch<Overview>('/capacity/overview').catch(() => null),
        apiFetch<ProductCap[]>('/capacity/products').catch(() => []),
        apiFetch<VendorCap[]>('/capacity/vendors').catch(() => []),
      ])
      setOverview(ov)
      setProducts(Array.isArray(pr) ? pr : [])
      setVendors(Array.isArray(ve) ? ve : [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  // Auto refresh every 30s
  useEffect(() => {
    const t = setInterval(fetchAll, 30000)
    return () => clearInterval(t)
  }, [])

  const o = overview

  if (loading && !o) return (
    <div className="p-6"><div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-100 rounded w-64" />
      <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}</div>
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div></div>
  )

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111] tracking-tight">Хүчин чадлын хяналт</h1>
          <p className="text-sm text-[#888] mt-1">Бүх үйлдвэрүүдийн бодит цагийн ачаалал</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-[#999] bg-[#F3F4F6] px-2 py-1 rounded">30 секунд тутам шинэчлэгдэнэ</div>
          <button onClick={fetchAll} className="px-3 py-2 text-xs font-semibold bg-white border border-[#E5E7EB] rounded-lg hover:border-[#FF6B00] transition-colors">
            🔄 Шинэчлэх
          </button>
        </div>
      </div>

      {/* ═══ GLOBAL KPI ═══ */}
      {o && (
        <>
          {/* Main utilization gauge */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Gauge */}
              <div className="flex-shrink-0 w-32 h-32 relative">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={utilColor(o.utilization)} strokeWidth="10"
                    strokeDasharray={`${o.utilization * 3.27} 327`} strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold" style={{ color: utilColor(o.utilization) }}>{o.utilization}%</span>
                  <span className="text-[10px] text-[#999]">ачаалал</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-[#888] mb-1">Нийт хүчин чадал</div>
                  <div className="text-xl font-extrabold text-[#111]">{fmt(o.total_capacity)}</div>
                  <div className="text-[10px] text-[#999]">нэгж/өдөр</div>
                </div>
                <div>
                  <div className="text-xs text-[#888] mb-1">Ашиглагдаж буй</div>
                  <div className="text-xl font-extrabold text-[#FF6B00]">{fmt(o.used_capacity)}</div>
                  <div className="text-[10px] text-[#999]">нэгж/өдөр</div>
                </div>
                <div>
                  <div className="text-xs text-[#888] mb-1">Чөлөөтэй</div>
                  <div className="text-xl font-extrabold text-emerald-600">{fmt(o.remaining_capacity)}</div>
                  <div className="text-[10px] text-[#999]">нэгж/өдөр</div>
                </div>
                <div>
                  <div className="text-xs text-[#888] mb-1">Бүтээгдэхүүн / Vendor</div>
                  <div className="text-xl font-extrabold text-[#111]">{o.product_count} / {o.vendor_count}</div>
                </div>
              </div>
            </div>
            {/* Full-width bar */}
            <div className="mt-4">
              <ProgressBar value={o.used_capacity} max={o.total_capacity} height={12} />
            </div>
          </div>

          {/* Status cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <KpiCard icon="🏭" label="Нийт vendor" value={String(o.vendor_count)} />
            <KpiCard icon="🟢" label="Чөлөөтэй" value={String(o.vendors_available)} color="#10B981" />
            <KpiCard icon="🟡" label="Ачаалалтай" value={String(o.vendors_busy)} color="#F59E0B" />
            <KpiCard icon="🔴" label="Дүүрэн" value={String(o.vendors_full)} color="#EF4444" />
            <KpiCard icon="🔥" label="Bottleneck" value={String(o.bottleneck_count)} sub={o.bottleneck_count > 0 ? 'Шуурхай анхааруулга!' : 'Бүгд хэвийн'} color={o.bottleneck_count > 0 ? '#EF4444' : '#10B981'} />
          </div>

          {/* Bottleneck alerts */}
          {o.bottlenecks.length > 0 && (
            <div className="mb-6 space-y-2">
              {o.bottlenecks.map(b => (
                <div key={b.product_id} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔥</span>
                    <div>
                      <div className="text-sm font-bold text-red-700">{b.product_name} — {b.utilization}% ачаалалтай</div>
                      <div className="text-[11px] text-red-500">{fmt(b.used_capacity)} / {fmt(b.total_capacity)} нэгж ашиглагдсан</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg">CRITICAL</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ TABS ═══ */}
      <div className="flex gap-1 mb-4">
        {[
          { key: 'products' as const, label: '📦 Бүтээгдэхүүнээр', count: products.length },
          { key: 'vendors' as const, label: '🏭 Vendor-ээр', count: vendors.length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-[#FF6B00] text-white' : 'bg-white text-[#555] border border-[#E5E7EB] hover:border-[#FF6B00]'
            }`}>
            {t.label} <span className="text-[10px] opacity-75">({t.count})</span>
          </button>
        ))}
      </div>

      {/* ═══ PRODUCT TABLE ═══ */}
      {tab === 'products' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-[#888] uppercase tracking-wider border-b border-[#E5E7EB]">
                  <th className="text-left px-5 py-3 font-semibold">Бүтээгдэхүүн</th>
                  <th className="text-right px-3 py-3 font-semibold">Vendor</th>
                  <th className="text-right px-3 py-3 font-semibold">Нийт чадал</th>
                  <th className="text-right px-3 py-3 font-semibold">Ашиглагдсан</th>
                  <th className="text-right px-3 py-3 font-semibold">Чөлөөтэй</th>
                  <th className="px-5 py-3 font-semibold w-[200px]">Ачаалал</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={p.product_id || i} className="border-t border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-[#111]">{p.product_name}</div>
                      {p.category && <div className="text-[10px] text-[#999]">{p.category}</div>}
                    </td>
                    <td className="text-right px-3 py-3 text-[#555]">{p.vendor_count}</td>
                    <td className="text-right px-3 py-3 font-medium text-[#111]">{fmt(p.total_capacity)}</td>
                    <td className="text-right px-3 py-3" style={{ color: utilColor(p.utilization) }}>{fmt(p.used_capacity)}</td>
                    <td className="text-right px-3 py-3 text-emerald-600">{fmt(p.remaining_capacity)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1"><ProgressBar value={p.used_capacity} max={p.total_capacity} height={6} /></div>
                        <span className="text-xs font-bold w-10 text-right" style={{ color: utilColor(p.utilization) }}>{p.utilization}%</span>
                        {p.status === 'critical' && <span className="text-sm">🔥</span>}
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-[#999] text-sm">Бүтээгдэхүүний capacity тохируулаагүй байна</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ VENDOR TABLE ═══ */}
      {tab === 'vendors' && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-[#888] uppercase tracking-wider border-b border-[#E5E7EB]">
                  <th className="text-left px-5 py-3 font-semibold">Vendor</th>
                  <th className="text-right px-3 py-3 font-semibold">Бүтээгдэхүүн</th>
                  <th className="text-right px-3 py-3 font-semibold">Нийт чадал</th>
                  <th className="text-right px-3 py-3 font-semibold">Ашиглагдсан</th>
                  <th className="text-right px-3 py-3 font-semibold">Чөлөөтэй</th>
                  <th className="px-5 py-3 font-semibold w-[200px]">Ачаалал</th>
                  <th className="text-center px-3 py-3 font-semibold">Статус</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v, i) => (
                  <tr key={v.vendor_id || i} className="border-t border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-[#111]">{v.vendor_name}</div>
                      <div className="flex gap-1 mt-0.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#666]">{(v.capacity_tier || 'small').toUpperCase()}</span>
                        <span className="text-[9px] font-medium text-[#999]">Score: {v.vendor_score}</span>
                      </div>
                    </td>
                    <td className="text-right px-3 py-3 text-[#555]">{v.product_count}</td>
                    <td className="text-right px-3 py-3 font-medium text-[#111]">{fmt(v.total_capacity)}</td>
                    <td className="text-right px-3 py-3" style={{ color: utilColor(v.utilization) }}>{fmt(v.used_capacity)}</td>
                    <td className="text-right px-3 py-3 text-emerald-600">{fmt(v.remaining_capacity)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1"><ProgressBar value={v.used_capacity} max={v.total_capacity} height={6} /></div>
                        <span className="text-xs font-bold w-10 text-right" style={{ color: utilColor(v.utilization) }}>{v.utilization}%</span>
                      </div>
                    </td>
                    <td className="text-center px-3 py-3">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ background: utilBg(v.utilization), color: utilColor(v.utilization) }}>
                        {utilLabel(v.utilization)}
                      </span>
                    </td>
                  </tr>
                ))}
                {vendors.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-[#999] text-sm">Vendor capacity тохируулаагүй байна</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
