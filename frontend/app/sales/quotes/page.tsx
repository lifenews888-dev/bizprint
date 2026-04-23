'use client'

import { apiFetch, getToken } from '@/lib/api'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useRoleGuard } from '@/lib/use-role-guard'
import { SALES_MENU } from '@/config/sidebar-config'

interface QuoteRow {
  id: string
  quote_number: string
  customer_id: string
  customer_name: string | null
  customer_email: string | null
  product_name: string | null
  product_type: string | null
  quantity: number
  total_price: number
  status: string
  created_at: string
  valid_until?: string | null
}

const ST_MN: Record<string, string> = {
  draft: 'Ноорог',
  sent: 'Илгээсэн',
  confirmed: 'Зөвшөөрсөн',
  ordered: 'Захиалсан',
  expired: 'Хугацаа дууссан',
}
const ST_CLR: Record<string, string> = {
  draft: '#888', sent: '#378ADD', confirmed: '#8B5CF6', ordered: '#10B981', expired: '#EF4444',
}

export default function SalesQuotesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useRoleGuard(['sales', 'admin'])
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const load = useCallback(() => {
    apiFetch<QuoteRow[]>('/sales/me/quotes')
      .then(d => setQuotes(Array.isArray(d) ? d : []))
      .catch(() => setQuotes([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!getToken()) { router.push('/login'); return }
    load()
  }, [authLoading, load, router])

  const filtered = quotes.filter(q => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return (q.quote_number || '').toLowerCase().includes(s)
        || (q.customer_name || '').toLowerCase().includes(s)
        || (q.customer_email || '').toLowerCase().includes(s)
        || (q.product_name || '').toLowerCase().includes(s)
    }
    return true
  })

  const byStatus: Record<string, number> = {}
  for (const q of quotes) byStatus[q.status] = (byStatus[q.status] || 0) + 1
  const totalValue = quotes.reduce((s, q) => s + Number(q.total_price || 0), 0)
  const confirmedValue = quotes
    .filter(q => q.status === 'confirmed' || q.status === 'ordered')
    .reduce((s, q) => s + Number(q.total_price || 0), 0)

  if (authLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Ачаалж байна...</div>

  return (
    <DashboardLayout navGroups={SALES_MENU} user={user || undefined}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Үнийн санал</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>
          Таны хөтлөсөн хэрэглэгчдийн үүсгэсэн үнийн саналууд
        </p>
      </div>

      {/* Stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="Нийт санал" value={quotes.length.toString()} color="#FF6B00" icon="📋" />
        <StatCard label="Илгээсэн" value={(byStatus['sent'] || 0).toString()} color="#378ADD" icon="📤" />
        <StatCard label="Захиалсан" value={(byStatus['ordered'] || 0).toString()} color="#10B981" icon="✓" />
        <StatCard label="Нийт дүн" value={totalValue.toLocaleString() + '₮'} color="#8B5CF6" icon="💰" />
        <StatCard label="Батлагдсан дүн" value={confirmedValue.toLocaleString() + '₮'} color="#10B981" icon="🎯" />
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Санал, хэрэглэгч, бүтээгдэхүүнээр хайх..."
          style={{ flex: 1, minWidth: 240, padding: '9px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)' }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { k: 'all', label: 'Бүгд' },
            { k: 'draft', label: 'Ноорог' },
            { k: 'sent', label: 'Илгээсэн' },
            { k: 'confirmed', label: 'Зөвшөөрсөн' },
            { k: 'ordered', label: 'Захиалсан' },
            { k: 'expired', label: 'Хугацаа дууссан' },
          ].map(t => {
            const active = statusFilter === t.k
            return (
              <button key={t.k} onClick={() => setStatusFilter(t.k)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid ' + (active ? '#FF6B00' : 'var(--border)'),
                  background: active ? 'rgba(255,107,0,0.1)' : 'var(--surface)',
                  color: active ? '#FF6B00' : 'var(--text)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '120px 1fr 1fr 80px 110px 100px 110px',
          padding: '10px 20px',
          background: 'var(--surface2)',
          borderBottom: '1px solid var(--border)',
          fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          <span>Санал №</span><span>Хэрэглэгч</span><span>Бүтээгдэхүүн</span><span style={{textAlign:'right'}}>Тоо</span><span style={{textAlign:'right'}}>Дүн</span><span style={{textAlign:'center'}}>Төлөв</span><span style={{textAlign:'right'}}>Огноо</span>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text2)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <div style={{ fontWeight: 600 }}>{quotes.length === 0 ? 'Үнийн санал байхгүй байна' : 'Хайлтад тохирох санал олдсонгүй'}</div>
            {quotes.length === 0 && (
              <div style={{ fontSize: 13, marginTop: 6, color: 'var(--text3)' }}>Таны linkээр бүртгүүлсэн хэрэглэгч үнийн санал үүсгэмэгц энд харагдана</div>
            )}
          </div>
        ) : filtered.map((q, i) => (
          <div key={q.id} style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr 1fr 80px 110px 100px 110px',
            padding: '12px 20px',
            borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
            alignItems: 'center',
            fontSize: 13,
          }}>
            <code style={{ fontSize: 12, color: '#FF6B00', fontWeight: 700 }}>{q.quote_number}</code>
            <div>
              <div style={{ fontWeight: 600 }}>{q.customer_name || '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{q.customer_email || '—'}</div>
            </div>
            <div>
              <div>{q.product_name || '—'}</div>
              {q.product_type && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{q.product_type}</div>}
            </div>
            <span style={{ textAlign: 'right' }}>{Number(q.quantity || 0).toLocaleString()} ш</span>
            <span style={{ textAlign: 'right', fontWeight: 700, color: '#FF6B00' }}>{Number(q.total_price || 0).toLocaleString()}₮</span>
            <span style={{ justifySelf: 'center', background: (ST_CLR[q.status] || '#888') + '20', color: ST_CLR[q.status] || '#888', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
              {ST_MN[q.status] || q.status}
            </span>
            <span style={{ textAlign: 'right', color: 'var(--text2)', fontSize: 12 }}>{new Date(q.created_at).toLocaleDateString('mn-MN')}</span>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
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
