'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const F = "'Segoe UI',system-ui,sans-serif"

function authH() {
  const t = localStorage.getItem('access_token') || localStorage.getItem('token') || ''
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }
}

interface Quote {
  id: string; quote_number: string; customer_name: string; customer_phone: string
  customer_email: string; product_name: string; quantity: number
  total_price: number; unit_price: number; size: string; pages: number
  paper_gsm: number; color_mode: string; sides: string; finishing: string
  binding: string; status: string; valid_until: string; created_at: string
  email_sent: boolean; breakdown: any; notes: string
}

const STATUS: Record<string, { l: string; c: string; bg: string }> = {
  sent:      { l: 'Илгээгдсэн',      c: '#3B82F6', bg: 'rgba(59,130,246,0.1)'  },
  confirmed: { l: 'Баталгаажсан',    c: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  ordered:   { l: 'Захиалга болсон', c: 'var(--orange)', bg: 'var(--orange-10)'   },
  expired:   { l: 'Дууссан',         c: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  draft:     { l: 'Ноорог',          c: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
}

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await fetch(`${API}/quotes-v2`, { headers: authH() }).then(r => r.json()).catch(() => [])
    setQuotes(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`${API}/quotes-v2/${id}`, { method: 'PATCH', headers: authH(), body: JSON.stringify({ status }) })
    load()
  }

  async function sendDailyReport() {
    setSending(true)
    setSendResult('')
    const adminEmail = 'bizprintpro@gmail.com'
    const res = await fetch(`${API}/quotes-v2/daily-report`, {
      method: 'POST', headers: authH(),
      body: JSON.stringify({ admin_email: adminEmail }),
    }).then(r => r.json()).catch(() => ({ error: true }))
    setSendResult(res.error ? 'Алдаа гарлаа' : `${res.sent} quote имэйлээр илгээгдлээ`)
    setSending(false)
  }

  const fmt = (n: number) => Number(n).toLocaleString('mn-MN')

  const filtered = quotes.filter(q => {
    if (filter !== 'all' && q.status !== filter) return false
    if (search && !q.customer_name.toLowerCase().includes(search.toLowerCase()) &&
        !q.customer_email.toLowerCase().includes(search.toLowerCase()) &&
        !q.quote_number.toLowerCase().includes(search.toLowerCase()) &&
        !(q.product_name || '').toLowerCase().includes(search.toLowerCase())) return false
    if (dateFilter && !q.created_at.startsWith(dateFilter)) return false
    return true
  })

  const todayTotal = quotes.filter(q => q.created_at.startsWith(new Date().toISOString().slice(0,10))).reduce((s,q) => s + Number(q.total_price), 0)
  const totalAll = quotes.reduce((s,q) => s + Number(q.total_price), 0)

  return (
    <div style={{ padding: '28px 32px', fontFamily: F, color: 'var(--text)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Үнийн саналууд</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', margin: '5px 0 0' }}>Бүх хэрэглэгчийн үнийн саналуудын удирдлага</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {sendResult && <span style={{ fontSize: 13, color: sendResult.includes('Алдаа') ? '#e24b4a' : '#10B981', padding: '6px 12px', borderRadius: 6, background: sendResult.includes('Алдаа') ? 'rgba(226,75,74,0.1)' : 'rgba(16,185,129,0.1)' }}>{sendResult}</span>}
          <button onClick={sendDailyReport} disabled={sending}
            style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>
            {sending ? 'Илгээж байна...' : '📧 Өдрийн тайлан'}
          </button>
          <button onClick={load} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>
            ↺ Шинэчлэх
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { l: 'Нийт',         v: quotes.length,                                                    c: 'var(--orange)' },
          { l: 'Өнөөдөр',      v: quotes.filter(q => q.created_at.startsWith(new Date().toISOString().slice(0,10))).length, c: '#3B82F6' },
          { l: 'Хүчинтэй',     v: quotes.filter(q => q.status === 'sent').length,                   c: '#10B981' },
          { l: 'Өнөөдрийн дүн', v: fmt(todayTotal) + '₮',                                          c: '#8B5CF6' },
          { l: 'Нийт дүн',     v: fmt(totalAll) + '₮',                                              c: '#F59E0B' },
        ].map(c => (
          <div key={c.l} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, borderLeft: '3px solid ' + c.c }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase' as any, marginBottom: 4, fontWeight: 600 }}>{c.l}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: c.c }}>{c.v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' as any, alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Хэрэглэгч, имэйл, quote # хайх..."
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, outline: 'none', width: 260 }} />
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ k: 'all', l: 'Бүгд' }, { k: 'sent', l: 'Хүчинтэй' }, { k: 'confirmed', l: 'Баталгаажсан' }, { k: 'ordered', l: 'Захиалга' }, { k: 'expired', l: 'Дууссан' }].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid', fontSize: 12, cursor: 'pointer', fontWeight: filter === f.k ? 600 : 400, background: filter === f.k ? 'var(--orange)' : 'transparent', color: filter === f.k ? '#fff' : 'var(--text3)', borderColor: filter === f.k ? 'var(--orange)' : 'var(--border)' }}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 0.8fr 0.8fr 0.8fr 0.6fr 1fr', padding: '10px 16px', borderBottom: '1px solid var(--border)', gap: 8 }}>
          {['Quote #', 'Хэрэглэгч', 'Бүтээгдэхүүн', 'Тоо', 'Нийт үнэ', 'Огноо', 'Статус', 'Үйлдэл'].map(h => (
            <div key={h} style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase' as any, fontWeight: 600 }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' as any, color: 'var(--text3)' }}>Уншиж байна...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' as any, color: 'var(--text3)' }}>Quote олдсонгүй</div>
        ) : filtered.map((q, i) => {
          const st = STATUS[q.status] || STATUS.draft
          const isExp = expanded === q.id
          return (
            <div key={q.id}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 0.8fr 0.8fr 0.8fr 0.6fr 1fr', padding: '12px 16px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', gap: 8, alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)' }}>{q.quote_number}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{q.customer_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{q.customer_email}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{q.customer_phone}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13 }}>{q.product_name || '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{q.size} / {q.pages}х / {q.paper_gsm}gsm</div>
                </div>
                <div style={{ fontSize: 13 }}>{fmt(q.quantity)} ш</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--orange)' }}>{fmt(q.total_price)}₮</div>
                <div>
                  <div style={{ fontSize: 12 }}>{new Date(q.created_at).toLocaleDateString('mn-MN')}</div>
                  <div style={{ fontSize: 11, color: q.email_sent ? '#10B981' : 'var(--text3)' }}>{q.email_sent ? '✓ Имэйл' : '✗ Имэйл'}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: st.bg, color: st.c }}>{st.l}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as any }}>
                  <button onClick={() => setExpanded(isExp ? null : q.id)}
                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>
                    {isExp ? '▲' : '▼'}
                  </button>
                  {q.status === 'sent' && (
                    <button onClick={() => updateStatus(q.id, 'confirmed')}
                      style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #10B981', background: 'transparent', color: '#10B981', cursor: 'pointer' }}>
                      ✓ Баталгаажуулах
                    </button>
                  )}
                  {(q.status === 'sent' || q.status === 'confirmed') && (
                    <button onClick={() => updateStatus(q.id, 'ordered')}
                      style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--orange)', background: 'transparent', color: 'var(--orange)', cursor: 'pointer' }}>
                      Захиалга болгох
                    </button>
                  )}
                </div>
              </div>

              {isExp && (
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 12 }}>
                    {[
                      { l: 'Цаасны зардал',   v: fmt(q.breakdown?.paper_cost || 0) + '₮' },
                      { l: 'Хэвлэлийн зардал', v: fmt(q.breakdown?.print_cost || 0) + '₮' },
                      { l: 'Өнгөлгөө',        v: fmt(q.breakdown?.finishing_cost || 0) + '₮' },
                      { l: 'Бэлтгэл зардал',  v: fmt(q.breakdown?.setup_cost || 0) + '₮' },
                      { l: 'Нэмэлт (10%)',    v: fmt(q.breakdown?.overhead || 0) + '₮' },
                      { l: 'Margin (20%)',     v: fmt(q.breakdown?.margin || 0) + '₮' },
                      { l: 'Нэгж үнэ',        v: fmt(q.unit_price) + '₮' },
                      { l: 'Хүчинтэй хүртэл', v: new Date(q.valid_until).toLocaleDateString('mn-MN') },
                    ].map(r => (
                      <div key={r.l} style={{ background: 'var(--surface)', borderRadius: 8, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>{r.l}</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{r.v}</div>
                      </div>
                    ))}
                  </div>
                  {q.notes && <div style={{ fontSize: 13, color: 'var(--text2)', padding: '10px 14px', background: 'var(--surface)', borderRadius: 8 }}>📝 {q.notes}</div>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}