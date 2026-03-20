'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'

const API = 'http://localhost:4000'

function getToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('access_token') || localStorage.getItem('token') || ''
}

function fmt(n: number) {
  return new Intl.NumberFormat('mn-MN').format(Math.round(n))
}

const TABS = ['Үнийн тохиргоо', 'Quotes', 'Статистик'] as const
type Tab = typeof TABS[number]

const LETTER_SIZES = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]
const LETTER_DEFAULTS = [35000, 45000, 60000, 75000, 95000, 140000, 180000, 235000, 290000, 330000, 360000]
const PAPER_GSM = [
  { gsm: 80, price: 60 },
  { gsm: 120, price: 90 },
  { gsm: 150, price: 120 },
  { gsm: 200, price: 160 },
  { gsm: 300, price: 220 },
]

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  sent: { bg: '#EBF5FF', color: '#2563EB' },
  confirmed: { bg: '#ECFDF5', color: '#059669' },
  ordered: { bg: '#FFF7ED', color: '#EA580C' },
  expired: { bg: '#F3F4F6', color: '#6B7280' },
  draft: { bg: '#F3F4F6', color: '#6B7280' },
}

const STATUS_OPTIONS = ['draft', 'sent', 'confirmed', 'ordered', 'expired']

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
      {tab === 'Quotes' && <QuotesListTab />}
      {tab === 'Статистик' && <StatsTab />}
    </div>
  )
}

// ─── Tab 1: Price Configuration ───

function PriceConfigTab() {
  const [letterPrices, setLetterPrices] = useState<number[]>([...LETTER_DEFAULTS])
  const [b2bMargin, setB2bMargin] = useState(20)
  const [retailMargin, setRetailMargin] = useState(45)
  const [paperPrices, setPaperPrices] = useState<number[]>(PAPER_GSM.map(p => p.price))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch(`${API}/settings`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: any[]) => {
        if (!Array.isArray(data)) return
        const map: Record<string, string> = {}
        data.forEach((s: any) => { map[s.key] = s.value })

        const loaded = LETTER_SIZES.map((sz, i) => {
          const v = map[`letter_price_${sz}cm`]
          return v ? Number(v) : LETTER_DEFAULTS[i]
        })
        setLetterPrices(loaded)

        if (map['b2b_margin']) setB2bMargin(Number(map['b2b_margin']))
        if (map['retail_margin']) setRetailMargin(Number(map['retail_margin']))

        const lp = PAPER_GSM.map((p, i) => {
          const v = map[`paper_price_${p.gsm}gsm`]
          return v ? Number(v) : PAPER_GSM[i].price
        })
        setPaperPrices(lp)
      })
      .catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true)
    setMsg('')
    const pairs: { key: string; value: string }[] = []

    LETTER_SIZES.forEach((sz, i) => {
      pairs.push({ key: `letter_price_${sz}cm`, value: String(letterPrices[i]) })
    })
    pairs.push({ key: 'b2b_margin', value: String(b2bMargin) })
    pairs.push({ key: 'retail_margin', value: String(retailMargin) })
    PAPER_GSM.forEach((p, i) => {
      pairs.push({ key: `paper_price_${p.gsm}gsm`, value: String(paperPrices[i]) })
    })

    try {
      const res = await fetch(`${API}/settings/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(pairs),
      })
      if (!res.ok) throw new Error('Save failed')
      setMsg('Амжилттай хадгаллаа')
    } catch {
      setMsg('Алдаа гарлаа')
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(''), 3000)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Letter prices */}
      <Section title="Товгор үсэг үнэ (см)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
          {LETTER_SIZES.map((sz, i) => (
            <label key={sz} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{sz} см</span>
              <input
                type="number"
                value={letterPrices[i]}
                onChange={e => {
                  const next = [...letterPrices]
                  next[i] = Number(e.target.value) || 0
                  setLetterPrices(next)
                }}
                style={inputStyle}
              />
            </label>
          ))}
        </div>
      </Section>

      {/* Margin settings */}
      <Section title="Margin тохиргоо">
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>B2B margin (%)</span>
            <input
              type="number"
              value={b2bMargin}
              onChange={e => setB2bMargin(Number(e.target.value) || 0)}
              style={{ ...inputStyle, width: 120 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Retail margin (%)</span>
            <input
              type="number"
              value={retailMargin}
              onChange={e => setRetailMargin(Number(e.target.value) || 0)}
              style={{ ...inputStyle, width: 120 }}
            />
          </label>
        </div>
      </Section>

      {/* Paper / print prices */}
      <Section title="Хэвлэлийн үнэ">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {PAPER_GSM.map((p, i) => (
            <label key={p.gsm} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{p.gsm} GSM (₮/хуудас)</span>
              <input
                type="number"
                value={paperPrices[i]}
                onChange={e => {
                  const next = [...paperPrices]
                  next[i] = Number(e.target.value) || 0
                  setPaperPrices(next)
                }}
                style={{ ...inputStyle, width: 130 }}
              />
            </label>
          ))}
        </div>
      </Section>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={handleSave} disabled={saving} style={btnStyle}>
          {saving ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
        {msg && (
          <span style={{ fontSize: 13, color: msg.includes('Амжилт') ? '#059669' : '#DC2626', fontWeight: 500 }}>
            {msg}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Tab 2: Quotes List ───

type Quote = {
  id: number
  quoteNumber?: string
  user?: any
  customerName?: string
  customerEmail?: string
  productName?: string
  product_type?: string
  quantity?: number
  totalPrice?: number
  total?: number
  status: string
  createdAt?: string
  breakdown?: any
  items?: any[]
}

function QuotesListTab() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [sendingEmail, setSendingEmail] = useState<number | null>(null)

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/quotes-v2`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
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
      await fetch(`${API}/quotes-v2/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status }),
      })
      setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q))
    } catch {}
  }

  async function resendEmail(id: number) {
    setSendingEmail(id)
    try {
      await fetch(`${API}/quotes-v2/${id}/send-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
    } catch {}
    setSendingEmail(null)
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Уншиж байна...</div>
  }

  if (!quotes.length) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Quotes олдсонгүй</div>
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {['Quote#', 'Хэрэглэгч', 'Бүтээгдэхүүн', 'Тоо', 'Нийт үнэ', 'Статус', 'Огноо', ''].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {quotes.map(q => {
            const expanded = expandedId === q.id
            const price = q.totalPrice ?? q.total ?? 0
            const userName = q.customerName || q.user?.name || q.user?.email || '-'
            const product = q.productName || q.product_type || '-'
            const statusColor = STATUS_COLORS[q.status] || STATUS_COLORS.draft

            return (
              <Fragment key={q.id}>
                <tr
                  onClick={() => setExpandedId(expanded ? null : q.id)}
                  style={{ cursor: 'pointer', borderBottom: expanded ? 'none' : '1px solid var(--border)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={tdStyle}>{q.quoteNumber || `#${q.id}`}</td>
                  <td style={tdStyle}>{userName}</td>
                  <td style={tdStyle}>{product}</td>
                  <td style={tdStyle}>{q.quantity ?? '-'}</td>
                  <td style={tdStyle}>{price ? `${fmt(price)}₮` : '-'}</td>
                  <td style={tdStyle}>
                    <select
                      value={q.status}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); changeStatus(q.id, e.target.value) }}
                      style={{
                        background: statusColor.bg,
                        color: statusColor.color,
                        border: 'none',
                        borderRadius: 12,
                        padding: '4px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        appearance: 'auto' as any,
                      }}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    {q.createdAt ? new Date(q.createdAt).toLocaleDateString('mn-MN') : '-'}
                  </td>
                  <td style={tdStyle}>
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
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sendingEmail === q.id ? '...' : 'Имэйл дахин илгээх'}
                    </button>
                  </td>
                </tr>
                {expanded && (
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td colSpan={8} style={{ padding: '12px 16px', background: 'var(--surface)' }}>
                      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', fontSize: 13 }}>
                        <div>
                          <strong style={{ color: 'var(--text2)' }}>Холбоо барих:</strong>
                          <div>{q.customerName || q.user?.name || '-'}</div>
                          <div>{q.customerEmail || q.user?.email || '-'}</div>
                        </div>
                        {q.breakdown && (
                          <div>
                            <strong style={{ color: 'var(--text2)' }}>Задаргаа:</strong>
                            <pre style={{ margin: '4px 0', fontSize: 12, color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>
                              {JSON.stringify(q.breakdown, null, 2)}
                            </pre>
                          </div>
                        )}
                        {q.items && q.items.length > 0 && (
                          <div>
                            <strong style={{ color: 'var(--text2)' }}>Бүтээгдэхүүнүүд:</strong>
                            <pre style={{ margin: '4px 0', fontSize: 12, color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>
                              {JSON.stringify(q.items, null, 2)}
                            </pre>
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
  )
}

// ─── Tab 3: Stats ───

function StatsTab() {
  const [todayCount, setTodayCount] = useState(0)
  const [totalValue, setTotalValue] = useState(0)
  const [conversionRate, setConversionRate] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` }

    Promise.all([
      fetch(`${API}/quotes-v2/today`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/quotes-v2`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([todayData, allData]) => {
      // Today count
      if (todayData) {
        if (typeof todayData === 'number') setTodayCount(todayData)
        else if (todayData.count !== undefined) setTodayCount(todayData.count)
        else if (Array.isArray(todayData)) setTodayCount(todayData.length)
      }

      // All quotes stats
      const all: Quote[] = Array.isArray(allData) ? allData : allData?.data || []
      setTotalCount(all.length)

      const sum = all.reduce((acc: number, q: any) => acc + (q.totalPrice ?? q.total ?? 0), 0)
      setTotalValue(sum)

      const ordered = all.filter((q: any) => q.status === 'ordered').length
      setConversionRate(all.length > 0 ? (ordered / all.length) * 100 : 0)

      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Уншиж байна...</div>
  }

  const stats = [
    { label: 'Өнөөдрийн quotes', value: String(todayCount), sub: 'ширхэг' },
    { label: 'Нийт дүн', value: `${fmt(totalValue)}₮`, sub: `${totalCount} quotes` },
    { label: 'Conversion rate', value: `${conversionRate.toFixed(1)}%`, sub: 'ordered / total' },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
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

      {/* Simple bar chart visualization */}
      <Section title="Статус тойм">
        <StatusBarChart />
      </Section>
    </div>
  )
}

function StatusBarChart() {
  const [data, setData] = useState<{ status: string; count: number }[]>([])

  useEffect(() => {
    fetch(`${API}/quotes-v2`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then((raw: any) => {
        const all: any[] = Array.isArray(raw) ? raw : raw?.data || []
        const counts: Record<string, number> = {}
        STATUS_OPTIONS.forEach(s => { counts[s] = 0 })
        all.forEach((q: any) => {
          counts[q.status] = (counts[q.status] || 0) + 1
        })
        setData(Object.entries(counts).map(([status, count]) => ({ status, count })))
      })
      .catch(() => {})
  }, [])

  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', height: 160, padding: '16px 0' }}>
      {data.map(d => {
        const colors = STATUS_COLORS[d.status] || STATUS_COLORS.draft
        const pct = (d.count / max) * 100
        return (
          <div key={d.status} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{d.count}</span>
            <div
              style={{
                width: '100%',
                maxWidth: 60,
                height: `${Math.max(pct, 4)}%`,
                background: colors.color,
                borderRadius: '6px 6px 0 0',
                minHeight: 4,
                transition: 'height 0.3s',
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'capitalize' }}>{d.status}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Shared UI ───

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 20,
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, color: 'var(--text)' }}>{title}</h3>
      {children}
    </div>
  )
}

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
