'use client'

import { apiFetch, getToken } from '@/lib/api'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useRoleGuard } from '@/lib/use-role-guard'
import { SALES_MENU } from '@/config/sidebar-config'

interface CustomerRow {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: string
  company_name: string | null
  avatar_url: string | null
  created_at: string
  referral_code_used: string | null
  order_count: number
  lifetime_value: number
  last_order_at: string | null
}

const ROLE_MN: Record<string, string> = {
  customer: 'Хэрэглэгч',
  vendor: 'Нийлүүлэгч',
  designer: 'Дизайнер',
  creator: 'Контент бүтээгч',
  sales: 'Борлуулагч',
  factory: 'Үйлдвэр',
  courier: 'Хүргэгч',
  admin: 'Админ',
  superadmin: 'Супер админ',
}

type SortKey = 'ltv' | 'orders' | 'recent' | 'name'

export default function SalesCustomersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useRoleGuard(['sales', 'admin'])
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('recent')
  const [activeOnly, setActiveOnly] = useState(false)

  const load = useCallback(() => {
    apiFetch<CustomerRow[]>('/sales/me/customers')
      .then(d => setCustomers(Array.isArray(d) ? d : []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!getToken()) { router.push('/login'); return }
    load()
  }, [authLoading, load, router])

  const processed = useMemo(() => {
    let list = customers.slice()
    if (activeOnly) list = list.filter(c => c.order_count > 0)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(c =>
        (c.full_name || '').toLowerCase().includes(s) ||
        (c.email || '').toLowerCase().includes(s) ||
        (c.phone || '').toLowerCase().includes(s) ||
        (c.company_name || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      if (sortBy === 'ltv') return Number(b.lifetime_value) - Number(a.lifetime_value)
      if (sortBy === 'orders') return b.order_count - a.order_count
      if (sortBy === 'name') return (a.full_name || '').localeCompare(b.full_name || '')
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return list
  }, [customers, search, sortBy, activeOnly])

  const totalLtv = customers.reduce((s, c) => s + Number(c.lifetime_value || 0), 0)
  const activeCustomers = customers.filter(c => c.order_count > 0).length
  const totalOrders = customers.reduce((s, c) => s + c.order_count, 0)
  const avgLtv = activeCustomers ? totalLtv / activeCustomers : 0

  if (authLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Ачаалж байна...</div>

  return (
    <DashboardLayout navGroups={SALES_MENU} user={user || undefined}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Миний хэрэглэгчид</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>
          Таны referral-аар бүртгүүлсэн бүх хэрэглэгчид, тэдний захиалгын түүх
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <Kpi label="Нийт хэрэглэгч" value={customers.length.toString()} color="#FF6B00" icon="👥" />
        <Kpi label="Идэвхтэй (захиалгатай)" value={activeCustomers.toString()} color="#10B981" icon="✓" />
        <Kpi label="Нийт захиалга" value={totalOrders.toString()} color="#378ADD" icon="📦" />
        <Kpi label="Нийт LTV" value={totalLtv.toLocaleString() + '₮'} color="#8B5CF6" icon="💰" />
        <Kpi label="Дундаж LTV" value={Math.round(avgLtv).toLocaleString() + '₮'} color="#F59E0B" icon="📊" />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Нэр, и-мэйл, утас, компаниар хайх..."
          style={{ flex: 1, minWidth: 240, padding: '9px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>
          <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} />
          Зөвхөн захиалгатай
        </label>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
          style={{ padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)' }}>
          <option value="recent">Эрэмблэх: Шинэ бүртгэл</option>
          <option value="ltv">LTV өндрөөр</option>
          <option value="orders">Захиалгын тоогоор</option>
          <option value="name">Нэрээр</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</div>
      ) : processed.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--text2)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
          <div style={{ fontWeight: 600 }}>{customers.length === 0 ? 'Хэрэглэгч байхгүй байна' : 'Хайлтад тохирох хэрэглэгч олдсонгүй'}</div>
          {customers.length === 0 && (
            <div style={{ fontSize: 13, marginTop: 6, color: 'var(--text3)' }}>
              Таны referral линкээр бүртгүүлсэн хэрэглэгчид энд харагдана
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {processed.map(c => (
            <div key={c.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: c.avatar_url ? `url(${c.avatar_url}) center/cover` : 'linear-gradient(135deg,#FF6B00,#FFA25C)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 16, flexShrink: 0,
                }}>
                  {!c.avatar_url && (c.full_name || c.email || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.full_name || 'Нэргүй'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.email}
                  </div>
                </div>
                <span style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 700 }}>
                  {ROLE_MN[c.role] || c.role}
                </span>
              </div>

              {c.company_name && (
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>🏢 {c.company_name}</div>
              )}
              {c.phone && (
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>📱 {c.phone}</div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Захиалга</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: c.order_count > 0 ? '#10B981' : 'var(--text3)' }}>
                    {c.order_count}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>LTV</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FF6B00' }}>
                    {Number(c.lifetime_value || 0).toLocaleString()}₮
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--border)', fontSize: 11, color: 'var(--text3)' }}>
                <span>Бүртгүүлсэн: {new Date(c.created_at).toLocaleDateString('mn-MN')}</span>
                {c.last_order_at && <span>Сүүл: {new Date(c.last_order_at).toLocaleDateString('mn-MN')}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}

function Kpi({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)' }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
      </div>
    </div>
  )
}
