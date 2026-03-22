'use client'

import { apiFetch } from '@/lib/api'
import { useState, useEffect, useCallback, Fragment } from 'react'

function fmt(n: number) {
  return new Intl.NumberFormat('mn-MN').format(Math.round(n))
}

const TABS = ['Үнийн тохиргоо', 'Quotes хяналт', 'Статистик'] as const
type Tab = typeof TABS[number]

const CATEGORY_SECTIONS = [
  { category: 'hadag', title: 'Хаяг реклам', suffix: '' },
  { category: 'khevlel', title: 'Хэвлэл', suffix: '' },
  { category: 'extra', title: 'Нэмэлт', suffix: '' },
  { category: 'margin', title: 'Margin', suffix: '%' },
  { category: 'rush', title: 'Яаралтай', suffix: '%' },
  { category: 'discount', title: 'Хөнгөлөлт', suffix: '%' },
] as const

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  sent: { bg: '#DBEAFE', color: '#1D4ED8' },
  confirmed: { bg: '#D1FAE5', color: '#065F46' },
  ordered: { bg: '#FED7AA', color: '#9A3412' },
  expired: { bg: '#F3F4F6', color: '#6B7280' },
}

const STATUS_OPTIONS = ['all', 'sent', 'confirmed', 'ordered', 'expired']
const STATUS_LABELS: Record<string, string> = {
  all: 'Бүгд',
  sent: 'Илгээсэн',
  confirmed: 'Баталсан',
  ordered: 'Захиалсан',
  expired: 'Хугацаа дууссан',
}

// ─── Main Component ───

export default function AdminQuoteEngine() {
  const [tab, setTab] = useState<Tab>('Үнийн тохиргоо')

  return (
    <div style={{ padding: '28px 32px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
        Quote Engine
      </h1>

      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 24 }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderBottom: tab === t ? '2px solid #FF6B00' : '2px solid transparent',
              marginBottom: -2,
              background: 'transparent',
              color: tab === t ? '#FF6B00' : 'var(--text2)',
              fontWeight: tab === t ? 600 : 400,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Үнийн тохиргоо' && <PriceConfigTab />}
      {tab === 'Quotes хяналт' && <QuotesListTab />}
      {tab === 'Статистик' && <StatsTab />}
    </div>
  )
}

// ─── Tab 1: Price Configuration ───

type PricingConfig = {
  id: number
  key: string
  label: string
  value: number
  category: string
}

function PriceConfigTab() {
  const [configs, setConfigs] = useState<PricingConfig[]>([])
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    apiFetch<PricingConfig[]>('/pricing-config')
      .then((data) => {
        const arr = Array.isArray(data) ? data : []
        setConfigs(arr)
        const vals: Record<string, string> = {}
        arr.forEach(c => { vals[c.key] = String(c.value) })
        setEditValues(vals)
      })
      .catch(() => {})
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function saveSingle(key: string) {
    setSavingKey(key)
    try {
      await apiFetch('/pricing-config', {
        method: 'PUT',
        body: { items: [{ key, value: Number(editValues[key]) || 0 }] },
      })
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: Number(editValues[key]) || 0 } : c))
      showToast('Амжилттай хадгаллаа')
    } catch {
      showToast('Алдаа гарлаа')
    } finally {
      setSavingKey(null)
    }
  }

  async function saveAll() {
    setSaving(true)
    try {
      const items = configs.map(c => ({
        key: c.key,
        value: Number(editValues[c.key]) || 0,
      }))
      await apiFetch('/pricing-config', {
        method: 'PUT',
        body: { items },
      })
      setConfigs(prev => prev.map(c => ({ ...c, value: Number(editValues[c.key]) || 0 })))
      showToast('Амжилттай хадгаллаа')
    } catch {
      showToast('Алдаа гарлаа')
    } finally {
      setSaving(false)
    }
  }

  function toggleCollapse(cat: string) {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  function getByCategory(cat: string) {
    return configs.filter(c => c.category === cat)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 32,
          background: toast.includes('Амжилт') ? '#059669' : '#DC2626',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {toast}
        </div>
      )}

      {CATEGORY_SECTIONS.map(section => {
        const items = getByCategory(section.category)
        if (items.length === 0) return null
        const isCollapsed = !!collapsed[section.category]

        return (
          <div
            key={section.category}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => toggleCollapse(section.category)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                {section.title}
              </span>
              <span style={{ fontSize: 18, color: 'var(--text2)', transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }}>
                &#9660;
              </span>
            </button>

            {!isCollapsed && (
              <div style={{ padding: '0 20px 16px' }}>
                {items.map(item => (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text2)', minWidth: 80, textAlign: 'right' }}>
                      {fmt(item.value)}{section.suffix}
                    </span>
                    <input
                      type="number"
                      value={editValues[item.key] ?? ''}
                      onChange={e => setEditValues(prev => ({ ...prev, [item.key]: e.target.value }))}
                      placeholder="Шинэ утга"
                      style={{ ...inputStyle, width: 120 }}
                    />
                    <button
                      onClick={() => saveSingle(item.key)}
                      disabled={savingKey === item.key}
                      title="Хадгалах"
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '6px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: savingKey === item.key ? 0.5 : 1,
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
        <button onClick={saveAll} disabled={saving} style={btnStyle}>
          {saving ? 'Хадгалж байна...' : 'Бүгдийг хадгалах'}
        </button>
      </div>
    </div>
  )
}

// ─── Tab 2: Quotes Management ───

type Quote = {
  id: number
  quoteNumber?: string
  user?: any
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  productName?: string
  product_type?: string
  quantity?: number
  totalPrice?: number
  total_price?: number
  total?: number
  status: string
  createdAt?: string
  breakdown?: any
  items?: any[]
  notes?: string
}

function QuotesListTab() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [sendingEmail, setSendingEmail] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<any>('/quotes-v2')
      setQuotes(Array.isArray(data) ? data : data.data || [])
    } catch {
      setQuotes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchQuotes() }, [fetchQuotes])

  async function changeStatus(id: number, status: string) {
    try {
      await apiFetch(`/quotes-v2/${id}`, {
        method: 'PATCH',
        body: { status },
      })
      setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q))
    } catch {}
  }

  async function resendEmail(id: number) {
    setSendingEmail(id)
    try {
      await apiFetch(`/quotes-v2/${id}/resend-email`, {
        method: 'POST',
      }).catch(() =>
        apiFetch(`/quotes-v2/${id}/send-email`, {
          method: 'POST',
        })
      )
    } catch {}
    setSendingEmail(null)
  }

  const filtered = quotes.filter(q => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      const name = (q.customerName || q.user?.name || '').toLowerCase()
      const email = (q.customerEmail || q.user?.email || '').toLowerCase()
      const num = (q.quoteNumber || `#${q.id}`).toLowerCase()
      const product = (q.productName || q.product_type || '').toLowerCase()
      if (!name.includes(s) && !email.includes(s) && !num.includes(s) && !product.includes(s)) return false
    }
    return true
  })

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Уншиж байна...</div>
  }

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            ...inputStyle,
            width: 180,
            cursor: 'pointer',
          }}
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Хайх... (нэр, имэйл, дугаар)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Quotes олдсонгүй</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['#', 'Дугаар', 'Хэрэглэгч', 'Бүтээгдэхүүн', 'Дүн', 'Статус', 'Огноо', 'Үйлдэл'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, idx) => {
                const expanded = expandedId === q.id
                const price = q.totalPrice ?? q.total_price ?? q.total ?? 0
                const userName = q.customerName || q.user?.name || q.user?.email || '-'
                const product = q.productName || q.product_type || '-'
                const statusColor = STATUS_COLORS[q.status] || { bg: '#F3F4F6', color: '#6B7280' }

                return (
                  <Fragment key={q.id}>
                    <tr
                      onClick={() => setExpandedId(expanded ? null : q.id)}
                      style={{ cursor: 'pointer', borderBottom: expanded ? 'none' : '1px solid var(--border)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <td style={tdStyle}>{idx + 1}</td>
                      <td style={tdStyle}>{q.quoteNumber || `#${q.id}`}</td>
                      <td style={tdStyle}>{userName}</td>
                      <td style={tdStyle}>{product}</td>
                      <td style={tdStyle}>{price ? `${fmt(price)}₮` : '-'}</td>
                      <td style={tdStyle}>
                        <span style={{
                          background: statusColor.bg,
                          color: statusColor.color,
                          borderRadius: 12,
                          padding: '4px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          display: 'inline-block',
                        }}>
                          {q.status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {q.createdAt ? new Date(q.createdAt).toLocaleDateString('mn-MN') : '-'}
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <select
                          value={q.status}
                          onClick={e => e.stopPropagation()}
                          onChange={e => { e.stopPropagation(); changeStatus(q.id, e.target.value) }}
                          style={{
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            padding: '4px 8px',
                            fontSize: 11,
                            color: 'var(--text)',
                            background: 'var(--bg)',
                            cursor: 'pointer',
                            marginRight: 6,
                          }}
                        >
                          {['sent', 'confirmed', 'ordered', 'expired'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button
                          onClick={e => { e.stopPropagation(); resendEmail(q.id) }}
                          disabled={sendingEmail === q.id}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 11,
                            color: 'var(--text2)',
                            cursor: 'pointer',
                          }}
                        >
                          {sendingEmail === q.id ? '...' : 'Имэйл'}
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td colSpan={8} style={{ padding: '14px 20px', background: 'var(--surface)' }}>
                          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', fontSize: 13 }}>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Холбоо барих</div>
                              <div style={{ color: 'var(--text)' }}>{q.customerName || q.user?.name || '-'}</div>
                              <div style={{ color: 'var(--text2)', fontSize: 12 }}>{q.customerEmail || q.user?.email || '-'}</div>
                              {(q.customerPhone || q.user?.phone) && (
                                <div style={{ color: 'var(--text2)', fontSize: 12 }}>{q.customerPhone || q.user?.phone}</div>
                              )}
                            </div>
                            {q.breakdown && (
                              <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Задаргаа</div>
                                <pre style={{ margin: 0, fontSize: 12, color: 'var(--text2)', whiteSpace: 'pre-wrap', background: 'var(--bg)', padding: 10, borderRadius: 8 }}>
                                  {JSON.stringify(q.breakdown, null, 2)}
                                </pre>
                              </div>
                            )}
                            {q.items && q.items.length > 0 && (
                              <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Бүтээгдэхүүнүүд</div>
                                <pre style={{ margin: 0, fontSize: 12, color: 'var(--text2)', whiteSpace: 'pre-wrap', background: 'var(--bg)', padding: 10, borderRadius: 8 }}>
                                  {JSON.stringify(q.items, null, 2)}
                                </pre>
                              </div>
                            )}
                            {q.notes && (
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Тэмдэглэл</div>
                                <div style={{ color: 'var(--text)', fontSize: 13 }}>{q.notes}</div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tab 3: Stats ───

function StatsTab() {
  const [todayCount, setTodayCount] = useState(0)
  const [totalValue, setTotalValue] = useState(0)
  const [conversionRate, setConversionRate] = useState(0)
  const [avgValue, setAvgValue] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
        Promise.all([
      apiFetch('/quotes-v2/today').catch(() => null),
      apiFetch('/quotes-v2').catch(() => null),
    ]).then(([todayData, allData]) => {
      if (todayData) {
        if (typeof todayData === 'number') setTodayCount(todayData)
        else if (todayData.count !== undefined) setTodayCount(todayData.count)
        else if (Array.isArray(todayData)) setTodayCount(todayData.length)
      }

      const all: Quote[] = Array.isArray(allData) ? allData : allData?.data || []
      const count = all.length
      setTotalCount(count)

      const sum = all.reduce((acc: number, q: any) => acc + (q.totalPrice ?? q.total_price ?? q.total ?? 0), 0)
      setTotalValue(sum)
      setAvgValue(count > 0 ? sum / count : 0)

      const ordered = all.filter((q: any) => q.status === 'ordered').length
      setConversionRate(count > 0 ? (ordered / count) * 100 : 0)

      const counts: Record<string, number> = {}
      all.forEach((q: any) => {
        counts[q.status] = (counts[q.status] || 0) + 1
      })
      setStatusCounts(counts)

      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Уншиж байна...</div>
  }

  const stats = [
    { label: 'Өнөөдрийн quote тоо', value: String(todayCount), sub: 'ширхэг' },
    { label: 'Нийт дүн', value: `${fmt(totalValue)}₮`, sub: `${totalCount} quotes` },
    { label: 'Захиалга болсон %', value: `${conversionRate.toFixed(1)}%`, sub: `ordered / total` },
    { label: 'Дундаж дүн', value: `${fmt(avgValue)}₮`, sub: 'нэг quote-д' },
  ]

  const maxCount = Math.max(...Object.values(statusCounts), 1)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {stats.map(s => (
          <div
            key={s.label}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '20px 24px',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#FF6B00' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 20,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>Статус тойм</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {['sent', 'confirmed', 'ordered', 'expired'].map(status => {
            const count = statusCounts[status] || 0
            const pct = (count / maxCount) * 100
            const colors = STATUS_COLORS[status] || { bg: '#F3F4F6', color: '#6B7280' }

            return (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text2)', width: 80, textTransform: 'capitalize', fontWeight: 500 }}>
                  {status}
                </span>
                <div style={{ flex: 1, height: 28, background: 'var(--bg)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                  <div
                    style={{
                      width: `${Math.max(pct, 2)}%`,
                      height: '100%',
                      background: colors.color,
                      borderRadius: 6,
                      transition: 'width 0.4s ease',
                      minWidth: count > 0 ? 4 : 0,
                    }}
                  />
                </div>
                <span style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: colors.color,
                  minWidth: 32,
                  textAlign: 'right',
                }}>
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Shared Styles ───

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
  background: 'var(--bg)',
  color: 'var(--text)',
}

const btnStyle: React.CSSProperties = {
  padding: '10px 24px',
  border: 'none',
  borderRadius: 8,
  background: '#FF6B00',
  color: '#fff',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text2)',
  borderBottom: '2px solid var(--border)',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'middle',
}
