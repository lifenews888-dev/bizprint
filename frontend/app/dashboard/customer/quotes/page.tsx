'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = 'http://localhost:4000'
const BANK_ACCOUNT = '4900123456'
const BANK_NAME = 'Хаан банк'
const ACCOUNT_NAME = 'БизПринт ХХК'

interface Quote {
  id: string; quote_number: string; customer_name: string; customer_email: string
  product_name: string; quantity: number; total_price: number; unit_price: number
  size: string; pages: number; paper_gsm: number; color_mode: string; sides: string
  finishing: string; binding: string; status: string; valid_until: string
  created_at: string; breakdown: any; notes: string
}

const STATUS: Record<string, {l:string; c:string; bg:string}> = {
  sent:      { l: 'Илгээгдсэн',      c: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  confirmed: { l: 'Баталгаажсан',    c: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  ordered:   { l: 'Захиалга болсон', c: 'var(--orange)', bg: 'var(--orange-12)'  },
  expired:   { l: 'Дууссан',         c: '#6B7280', bg: 'rgba(0,0,0,0.06)'      },
}

export default function DashboardQuotesPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [dark, setDark] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [payModal, setPayModal] = useState<Quote | null>(null)
  const [qrData, setQrData] = useState<any>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  function logout() { localStorage.clear(); router.push('/login') }

  const bg = dark ? '#0A0A0A' : '#F8F7F4'
  const surface = dark ? '#111' : '#fff'
  const surface2 = dark ? '#1A1A1A' : '#F3F4F6'
  const border = dark ? '#222' : '#E5E7EB'
  const text = dark ? '#F1F5F9' : '#111'
  const text2 = dark ? '#888' : '#6B7280'
  const text3 = dark ? '#555' : '#9CA3AF'

  useEffect(() => {
    const tk = localStorage.getItem('access_token') || localStorage.getItem('token')
    if (!tk) { router.push('/login'); return }
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const email = user.email
    if (!email) { setLoading(false); return }
    fetch(`${API}/quotes-v2?email=${encodeURIComponent(email)}`, { headers: { Authorization: 'Bearer ' + tk } })
      .then(r => r.json())
      .then(data => { setQuotes(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = quotes.filter(q => filter === 'all' || q.status === filter)
  const fmt = (n: number) => Number(n).toLocaleString('mn-MN')

  function toggleSelect(id: string) {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }

  function selectAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(q => q.id)))
  }

  const selectedQuotes = quotes.filter(q => selected.has(q.id))
  const selectedTotal = selectedQuotes.reduce((s, q) => s + Number(q.total_price), 0)

  async function createQR(q: Quote) {
    setPayModal(q)
    setQrLoading(true)
    setQrData(null)
    try {
      const tk = localStorage.getItem('access_token') || localStorage.getItem('token')
      const res = await fetch(`${API}/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tk },
        body: JSON.stringify({ amount: Number(q.total_price), orderId: q.quote_number }),
      })
      const data = await res.json()
      setQrData(data)
    } catch { setQrData({ error: true }) }
    setQrLoading(false)
  }

  function generateProposalPDF() {
    const quotes = selectedQuotes.length > 0 ? selectedQuotes : filtered
    if (!quotes.length) return
    const total = quotes.reduce((s, q) => s + Number(q.total_price), 0)
    const customer = quotes[0]
    const date = new Date().toLocaleDateString('mn-MN')
    const rows = quotes.map((q, i) => `
      <tr style="background:${i%2===0?'#f9fafb':'#fff'}">
        <td style="padding:10px 14px;font-size:13px;font-weight:600;color:var(--orange)">${q.quote_number}</td>
        <td style="padding:10px 14px;font-size:13px">${q.product_name || 'Хэвлэл'}</td>
        <td style="padding:10px 14px;font-size:13px;text-align:center">${fmt(q.quantity)}</td>
        <td style="padding:10px 14px;font-size:13px;text-align:center">${q.size || 'A4'} / ${q.pages}хуудас</td>
        <td style="padding:10px 14px;font-size:13px;text-align:center">${q.paper_gsm}gsm</td>
        <td style="padding:10px 14px;font-size:13px;text-align:center">${q.color_mode==='color'?'Өнгөт':'Х/Ц'}</td>
        <td style="padding:10px 14px;font-size:13px;text-align:right;font-weight:600">${fmt(q.unit_price)}₮</td>
        <td style="padding:10px 14px;font-size:13px;text-align:right;font-weight:700;color:var(--orange)">${fmt(q.total_price)}₮</td>
      </tr>`).join('')
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>BizPrint Proposal</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; color: #111; background: #fff; }
  @media print { .no-print { display:none!important; } }
</style></head><body>
<div style="max-width:800px;margin:0 auto;padding:40px">
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:24px;border-bottom:3px solid var(--orange)">
    <div>
      <div style="font-size:32px;font-weight:800;color:var(--orange);letter-spacing:-1px">Biz<span style="color:#111">Print</span></div>
      <div style="font-size:12px;color:#6b7280;margin-top:4px">Монголын хэвлэлийн платформ</div>
      <div style="font-size:12px;color:#6b7280">bizprintpro@gmail.com | +976-XXXX-XXXX</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:700;color:#111">ҮНИЙН САНАЛ</div>
      <div style="font-size:13px;color:#6b7280;margin-top:4px">Огноо: ${date}</div>
      <div style="font-size:13px;color:#6b7280">Хүчинтэй: 3 хоног</div>
    </div>
  </div>

  <!-- Customer info -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px">
    <div style="background:#f9fafb;border-radius:8px;padding:20px;border:1px solid #e5e7eb">
      <div style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;margin-bottom:10px">Хүлээн авагч</div>
      <div style="font-size:15px;font-weight:700">${customer.customer_name}</div>
      <div style="font-size:13px;color:#6b7280;margin-top:4px">${customer.customer_email}</div>
    </div>
    <div style="background:#fff7ed;border-radius:8px;padding:20px;border:1px solid #fed7aa">
      <div style="font-size:11px;color:#9a3412;font-weight:600;text-transform:uppercase;margin-bottom:10px">Нийт үнэ</div>
      <div style="font-size:28px;font-weight:800;color:var(--orange)">${fmt(total)}₮</div>
      <div style="font-size:12px;color:#9a3412;margin-top:4px">${quotes.length} бүтээгдэхүүн</div>
    </div>
  </div>

  <!-- Table -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
    <thead>
      <tr style="background:#111;color:#fff">
        <th style="padding:12px 14px;text-align:left;font-size:12px">Quote #</th>
        <th style="padding:12px 14px;text-align:left;font-size:12px">Бүтээгдэхүүн</th>
        <th style="padding:12px 14px;text-align:center;font-size:12px">Тоо</th>
        <th style="padding:12px 14px;text-align:center;font-size:12px">Хэмжээ</th>
        <th style="padding:12px 14px;text-align:center;font-size:12px">Цаас</th>
        <th style="padding:12px 14px;text-align:center;font-size:12px">Өнгө</th>
        <th style="padding:12px 14px;text-align:right;font-size:12px">Нэгж үнэ</th>
        <th style="padding:12px 14px;text-align:right;font-size:12px">Нийт</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr style="border-top:2px solid #e5e7eb">
        <td colspan="7" style="padding:14px;font-weight:700;font-size:15px">Нийт дүн</td>
        <td style="padding:14px;text-align:right;font-weight:800;font-size:20px;color:var(--orange)">${fmt(total)}₮</td>
      </tr>
    </tfoot>
  </table>

  <!-- Payment info -->
  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin-bottom:24px">
    <div style="font-size:13px;font-weight:700;color:#166534;margin-bottom:10px">Төлбөрийн мэдээлэл</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
      <div><span style="color:#6b7280">Банк:</span> <strong>${BANK_NAME}</strong></div>
      <div><span style="color:#6b7280">Данс:</span> <strong>${BANK_ACCOUNT}</strong></div>
      <div><span style="color:#6b7280">Хүлээн авагч:</span> <strong>${ACCOUNT_NAME}</strong></div>
      <div><span style="color:#6b7280">Гүйлгээний утга:</span> <strong>BizPrint + таны нэр</strong></div>
    </div>
  </div>

  <!-- Why BizPrint -->
  <div style="border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px">
    <div style="font-size:13px;font-weight:700;margin-bottom:12px">Яагаад BizPrint?</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
      ${[
        ['⚡', 'Хурдан', 'Захиалгаа 3-5 хоногт хүргэнэ'],
        ['✓', 'Чанар', 'ISO баталгааны чанар'],
        ['🚚', 'Хүргэлт', 'Улаанбаатар хотоор хүргэнэ'],
      ].map(([icon,title,desc]) => `
        <div style="text-align:center;padding:12px;background:#f9fafb;border-radius:6px">
          <div style="font-size:20px;margin-bottom:6px">${icon}</div>
          <div style="font-size:13px;font-weight:600">${title}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px">${desc}</div>
        </div>`).join('')}
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding-top:20px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px">
    <strong style="color:var(--orange)">BizPrint</strong> — Монголын нэгдүгээр хэвлэлийн платформ<br>
    Энэхүү үнийн санал ${date} өдөр үүсгэгдсэн бөгөөд 3 хоног хүчинтэй байна.
  </div>

  <div class="no-print" style="margin-top:24px;text-align:center">
    <button onclick="window.print()" style="background:var(--orange);color:#fff;padding:12px 32px;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer">PDF хэвлэх / Хадгалах</button>
  </div>
</div>
<script>setTimeout(() => window.print(), 500)</script>
</body></html>`)
    w.document.close()
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: "'Segoe UI',system-ui,sans-serif", color: text, transition: 'all 0.3s' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>Үнийн саналууд</h1>
            <p style={{ fontSize: 14, color: text2, margin: '6px 0 0' }}>Таны авсан үнийн саналуудын түүх</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={() => setDark(!dark)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid ' + border, background: surface2, color: text, cursor: 'pointer', fontSize: 13 }}>
              {dark ? '☀️ Цайвар' : '🌙 Харанхуй'}
            </button>
            <a href="/quote" style={{ padding: '9px 18px', borderRadius: 8, background: 'var(--orange)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
              + Шинэ үнэ тооцоолох
            </a>
            <button onClick={logout} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid ' + border, background: 'transparent', color: text2, cursor: 'pointer', fontSize: 13 }}>Гарах</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { l: 'Нийт', v: quotes.length, c: 'var(--orange)' },
            { l: 'Хүчинтэй', v: quotes.filter(q => q.status === 'sent').length, c: '#10B981' },
            { l: 'Нийт дүн', v: fmt(quotes.reduce((s,q) => s+Number(q.total_price),0)) + '₮', c: '#3B82F6' },
            { l: 'Сонгосон', v: selected.size + ' / ' + fmt(selectedTotal) + '₮', c: '#8B5CF6' },
          ].map(c => (
            <div key={c.l} style={{ background: surface, border: '1px solid ' + border, borderRadius: 12, padding: 16, borderLeft: '3px solid ' + c.c }}>
              <div style={{ fontSize: 11, color: text3, textTransform: 'uppercase' as any, marginBottom: 6, fontWeight: 600 }}>{c.l}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: c.c }}>{c.v}</div>
            </div>
          ))}
        </div>

        {/* Actions bar */}
        {selected.size > 0 && (
          <div style={{ background: 'linear-gradient(135deg,var(--orange),#FF8C42)', borderRadius: 12, padding: '14px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {selected.size} үнийн санал сонгогдсон — Нийт: {fmt(selectedTotal)}₮
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={generateProposalPDF} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                📄 Proposal PDF
              </button>
              <button onClick={() => {
                const merged = { ...selectedQuotes[0], quote_number: selectedQuotes.map(q=>q.quote_number).join('+'), total_price: selectedTotal, product_name: selectedQuotes.length + ' бүтээгдэхүүн' }; createQR(merged as any)
              }} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#fff', color: 'var(--orange)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                💳 QPay төлбөр
              </button>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
          <button onClick={selectAll} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid ' + border, background: surface2, color: text2, cursor: 'pointer', fontSize: 12 }}>
            {selected.size === filtered.length && filtered.length > 0 ? 'Болих' : 'Бүгдийг сонгох'}
          </button>
          <div style={{ width: 1, height: 20, background: border }} />
          {[{ k:'all', l:'Бүгд' }, { k:'sent', l:'Хүчинтэй' }, { k:'confirmed', l:'Баталгаажсан' }, { k:'expired', l:'Дууссан' }].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid ' + (filter===f.k ? 'var(--orange)' : border), background: filter===f.k ? 'var(--orange)' : 'transparent', color: filter===f.k ? '#fff' : text2, cursor: 'pointer', fontSize: 12, fontWeight: filter===f.k ? 600 : 400 }}>
              {f.l}
            </button>
          ))}
        </div>

        {/* Quote list */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' as any, color: text3 }}>Уншиж байна...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center' as any, background: surface, border: '1px solid ' + border, borderRadius: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 18 }}>Үнийн санал байхгүй байна</div>
            <div style={{ fontSize: 14, color: text2, marginBottom: 24 }}>Үнэ тооцоолоод үнийн санал аваарай</div>
            
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' as any, gap: 12 }}>
            {filtered.map(q => {
              const st = STATUS[q.status] || STATUS.sent
              const isExpired = new Date(q.valid_until) < new Date()
              const isSel = selected.has(q.id)
              return (
                <div key={q.id} style={{ background: surface, border: '2px solid ' + (isSel ? 'var(--orange)' : border), borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                  <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Checkbox */}
                    <div onClick={() => toggleSelect(q.id)} style={{ width: 22, height: 22, borderRadius: 6, border: '2px solid ' + (isSel ? 'var(--orange)' : border), background: isSel ? 'var(--orange)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}>
                      {isSel && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>}
                    </div>

                    {/* Quote number badge */}
                    <div style={{ background: 'var(--orange-10)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' as any, flexShrink: 0 }}>
                      <div style={{ fontSize: 10, color: 'var(--orange)', fontWeight: 700 }}>QUOTE</div>
                      <div style={{ fontSize: 14, color: 'var(--orange)', fontWeight: 800 }}>{q.quote_number.split('-').slice(-1)[0]}</div>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' as any }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: text }}>{q.product_name || 'Хэвлэл'}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.c }}>{isExpired && q.status==='sent' ? 'Дууссан' : st.l}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: text2, flexWrap: 'wrap' as any }}>
                        <span>{fmt(q.quantity)} ш</span>
                        <span>{q.size || 'A4'}</span>
                        <span>{q.pages} хуудас</span>
                        <span>{q.paper_gsm}gsm</span>
                        <span>{q.color_mode==='color'?'Өнгөт':'Х/Ц'}</span>
                        <span style={{ color: text3 }}>{new Date(q.created_at).toLocaleDateString('mn-MN')}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div style={{ textAlign: 'right' as any, flexShrink: 0 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--orange)' }}>{fmt(q.total_price)}₮</div>
                      <div style={{ fontSize: 12, color: text2 }}>Нэгж: {fmt(q.unit_price)}₮</div>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div style={{ borderTop: '1px solid ' + border, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: dark ? '#0D0D0D' : '#FAFAFA' }}>
                    <div style={{ fontSize: 12, color: text3 }}>
                      {isExpired ? '⏰ Хугацаа дууссан' : `✓ Хүчинтэй: ${new Date(q.valid_until).toLocaleDateString('mn-MN')} хүртэл`}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                        style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid ' + border, background: 'transparent', color: text2, cursor: 'pointer', fontSize: 12 }}>
                        {expanded === q.id ? '▲ Хаах' : '▼ Дэлгэрэнгүй'}
                      </button>
                      <button onClick={() => generateProposalPDF()}
                        style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid ' + border, background: 'transparent', color: text, cursor: 'pointer', fontSize: 12 }}>
                        📄 PDF
                      </button>
                      <button onClick={() => createQR(q)}
                        style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#10B981', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        💳 QPay
                      </button>
                      {!isExpired && q.status !== 'ordered' && (
                        <a href="/order" style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--orange)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                          Захиалах →
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Breakdown */}
                  {expanded === q.id && (
                    <div style={{ padding: '20px', borderTop: '1px solid ' + border }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                        {[
                          { l: 'Цаасны зардал', v: fmt(q.breakdown?.paper_cost||0) + '₮' },
                          { l: 'Хэвлэлийн зардал', v: fmt(q.breakdown?.print_cost||0) + '₮' },
                          { l: 'Өнгөлгөө', v: fmt(q.breakdown?.finishing_cost||0) + '₮' },
                          { l: 'Хавтаслалт', v: fmt(q.breakdown?.binding_cost||0) + '₮' },
                          { l: 'Бэлтгэл', v: fmt(q.breakdown?.setup_cost||0) + '₮' },
                          { l: 'Нэмэлт (10%)', v: fmt(q.breakdown?.overhead||0) + '₮' },
                        ].map(r => (
                          <div key={r.l} style={{ background: surface2, borderRadius: 8, padding: '10px 14px' }}>
                            <div style={{ fontSize: 11, color: text3, marginBottom: 3 }}>{r.l}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{r.v}</div>
                          </div>
                        ))}
                      </div>
                      {q.notes && <div style={{ fontSize: 13, color: text2, background: surface2, borderRadius: 8, padding: '10px 14px' }}>📝 {q.notes}</div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Upsell section */}
        <div style={{ marginTop: 40, background: dark ? 'linear-gradient(135deg,#1A0A00,#2A1000)' : 'linear-gradient(135deg,#fff7ed,#fff)', border: '1px solid var(--orange-20)', borderRadius: 16, padding: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>🎯 Танд санал болгох бүтээгдэхүүнүүд</div>
          <div style={{ fontSize: 13, color: text2, marginBottom: 20 }}>Үнийн саналтайгаа хамт захиалбал хямдрал авна</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { name: 'Визитний карт', desc: '500 ш — 45,000₮-аас', icon: '🪪', discount: '-15%' },
              { name: 'Флаер A5', desc: '1000 ш — 80,000₮-аас', icon: '📄', discount: '-10%' },
              { name: 'Ролл-ап баннер', desc: '1 ш — 45,000₮-аас', icon: '🏳️', discount: '-5%' },
            ].map(p => (
              <div key={p.name} style={{ background: surface, border: '1px solid ' + border, borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28 }}>{p.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: text2 }}>{p.desc}</div>
                </div>
                <div style={{ background: 'var(--orange)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>{p.discount}</div>
              </div>
            ))}
          </div>
          <a href="/products" style={{ display: 'inline-block', marginTop: 16, fontSize: 13, color: 'var(--orange)', textDecoration: 'none', fontWeight: 600 }}>Бүх бүтээгдэхүүн харах →</a>
        </div>
      </div>

      {/* QPay Modal */}
      {payModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: surface, borderRadius: 20, padding: 32, width: '100%', maxWidth: 480, border: '1px solid ' + border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: text }}>QPay төлбөр</h2>
              <button onClick={() => { setPayModal(null); setQrData(null) }} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: text2 }}>✕</button>
            </div>

            <div style={{ background: 'var(--orange-08)', borderRadius: 12, padding: 20, marginBottom: 20, textAlign: 'center' as any }}>
              <div style={{ fontSize: 13, color: text2, marginBottom: 4 }}>{payModal.quote_number}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--orange)' }}>{fmt(payModal.total_price)}₮</div>
            </div>

            {qrLoading && <div style={{ textAlign: 'center' as any, padding: 32, color: text2 }}>QR үүсгэж байна...</div>}

            {qrData && !qrData.error && (
              <div>
                <div style={{ background: surface2, borderRadius: 12, padding: 20, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: text3, marginBottom: 12, textAlign: 'center' as any }}>Банкны апп-аар скан хийж төлнө үү</div>
                  {qrData.data?.qrImage ? (
                    <img src={'data:image/png;base64,' + qrData.data.qrImage} alt="QR" style={{ width: '100%', maxWidth: 200, display: 'block', margin: '0 auto', borderRadius: 8 }} />
                  ) : (
                    <div style={{ background: '#fff', border: '2px solid #e5e7eb', borderRadius: 8, padding: 20, textAlign: 'center' as any }}>
                      <div style={{ fontSize: 48, marginBottom: 8 }}>📱</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Invoice: {qrData.data?.invoice || payModal.quote_number}</div>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: text3, textAlign: 'center' as any, marginBottom: 16 }}>
                  Invoice дугаар: <strong style={{ color: text }}>{qrData.data?.invoice || '-'}</strong>
                </div>
              </div>
            )}

            {/* Manual bank transfer */}
            <div style={{ background: surface2, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: text, marginBottom: 10 }}>Банк шилжүүлгээр төлөх</div>
              <div style={{ display: 'flex', flexDirection: 'column' as any, gap: 6, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: text2 }}>Банк:</span>
                  <strong style={{ color: text }}>{BANK_NAME}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: text2 }}>Данс:</span>
                  <strong style={{ color: 'var(--orange)', fontSize: 16 }}>{BANK_ACCOUNT}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: text2 }}>Хүлээн авагч:</span>
                  <strong style={{ color: text }}>{ACCOUNT_NAME}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: text2 }}>Гүйлгээний утга:</span>
                  <strong style={{ color: text }}>{payModal.quote_number}</strong>
                </div>
              </div>
            </div>

            <button onClick={() => { setPayModal(null); setQrData(null) }}
              style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid ' + border, background: 'transparent', color: text, cursor: 'pointer', fontSize: 14 }}>
              Хаах
            </button>
          </div>
        </div>
      )}
    </div>
  )
}