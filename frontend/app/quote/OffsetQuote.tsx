'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

/* ═══════════════════════════════════════════════════════════════
 *  OFFSET QUOTE — Flyer / Brochure / Poster / Business Card
 *  Calls POST /api/quote-engine/calculate-offset (reads pricing-config)
 * ═══════════════════════════════════════════════════════════════ */

const SIZES = [
  { key: 'BC',  label: 'Нэрийн хуудас (90×55)', example: '1,000ш' },
  { key: 'A6',  label: 'A6 (10×14.5)', example: '5,000ш' },
  { key: 'A5',  label: 'A5 (14.5×21)', example: '2,000ш' },
  { key: 'A4',  label: 'A4 (21×29.7)', example: '1,000ш' },
  { key: 'A3',  label: 'A3 (29.7×42)', example: '500ш' },
]

const GSM_OPTIONS = [
  { v: 80,  l: '80г — Офис' },
  { v: 100, l: '100г — Флаер' },
  { v: 130, l: '130г — Энгийн' },
  { v: 150, l: '150г — Чанартай' },
  { v: 170, l: '170г — Постер' },
  { v: 200, l: '200г — Нэрийн хуудас' },
  { v: 250, l: '250г — Зузаан' },
  { v: 300, l: '300г — Хатуу' },
]

const COLOR_MODES = [
  { v: 'full', l: '🌈 4 өнгөт (CMYK)' },
  { v: 'bw',   l: '⚫ Хар цагаан' },
]

const SIDES = [
  { v: 'single', l: 'Нэг тал' },
  { v: 'double', l: 'Хоёр тал' },
]

const FINISHINGS = [
  { v: 'none',         l: 'Ямар ч үгүй' },
  { v: 'lamination',   l: 'Ламинаци' },
  { v: 'uv',           l: 'UV өнгөлгөө' },
  { v: 'spot_uv',      l: 'Spot UV' },
  { v: 'emboss',       l: 'Emboss' },
  { v: 'foil',         l: 'Foil' },
]

const FOLDS = [
  { v: 'none',     l: 'Нугалахгүй' },
  { v: 'halffold', l: 'Хагас нугалах' },
  { v: 'trifold',  l: 'Гурвалсан нугалалт' },
  { v: 'zfold',    l: 'Z нугалалт' },
]

type PricingMode = 'retail' | 'b2b'

const PRICING_MODES: Array<{ v: PricingMode; l: string }> = [
  { v: 'retail', l: 'Жижиглэн' },
  { v: 'b2b', l: 'Бөөний B2B' },
]

interface OffsetQuoteResult {
  error?: string
  paper_cost?: number
  print_cost?: number
  setup_cost?: number
  finishing_cost?: number
  fold_cost?: number
  margin?: number
  vat?: number
  unit_price?: number
  total_price?: number
  notes?: string[]
}

const errorMessage = (error: unknown) =>
  error instanceof Error && error.message ? error.message : 'Серверт холбогдож чадсангүй'

export default function OffsetQuote() {
  const [sizeCode, setSizeCode] = useState('A4')
  const [pages, setPages] = useState(1)
  const [quantity, setQuantity] = useState(500)
  const [gsm, setGsm] = useState(130)
  const [colorMode, setColorMode] = useState('full')
  const [sides, setSides] = useState('single')
  const [finishing, setFinishing] = useState('none')
  const [fold, setFold] = useState('none')
  const [pricingMode, setPricingMode] = useState<PricingMode>('retail')

  const [result, setResult] = useState<OffsetQuoteResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true)
      setError('')
      apiFetch<OffsetQuoteResult>('/quote-engine/calculate-offset', {
        method: 'POST',
        auth: false,
        body: {
          size_code: sizeCode,
          pages,
          quantity,
          gsm,
          color_mode: colorMode,
          sides,
          finishing,
          fold,
          pricing_mode: pricingMode,
        },
      }).then(r => {
        if (!r) { setError('Сервер хариу буцаасангүй'); return }
        if (r.error) { setError(r.error); setResult(null); return }
        if (!r.total_price && r.total_price !== 0) {
          setError('Үнэ буцаагаагүй. Админ /admin/quote-engine дээрээс offset_* тохиргоог шалгана уу.')
          setResult(null); return
        }
        setResult(r)
      }).catch((e: unknown) => {
        setError(errorMessage(e))
        setResult(null)
      }).finally(() => setLoading(false))
    }, 400)
    return () => clearTimeout(t)
  }, [sizeCode, pages, quantity, gsm, colorMode, sides, finishing, fold, pricingMode])

  return (
    <div style={{ fontFamily: "'Segoe UI',system-ui,sans-serif", maxWidth: 1100, margin: '0 auto', padding: '20px 16px' }}>
      {/* Mobile: stack inputs above the price sidebar; desktop keeps the
          1fr + 360px split. The CSS class ships the breakpoint so the inline
          fallback stays as desktop. */}
      <style>{`
        .offset-grid { display: grid; grid-template-columns: 1fr 360px; gap: 20px; align-items: flex-start; }
        @media (max-width: 900px) {
          .offset-grid { grid-template-columns: 1fr; gap: 14px; }
        }
      `}</style>
      <div className="offset-grid">
        {/* LEFT — inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Pricing mode */}
          <Card title="Хэрэглэгчийн төрөл">
            <div style={{ display: 'flex', gap: 8 }}>
              {PRICING_MODES.map(p => (
                <Chip key={p.v} active={pricingMode === p.v} onClick={() => setPricingMode(p.v)}>{p.l}</Chip>
              ))}
            </div>
          </Card>

          {/* Size */}
          <Card title="Хэмжээ">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
              {SIZES.map(s => (
                <button key={s.key} onClick={() => setSizeCode(s.key)}
                  style={{ ...boxBtn, ...(sizeCode === s.key ? activeBox : {}) }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>Жишээ: {s.example}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Qty + pages */}
          <Card title="Тоо хэмжээ">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Тоо ширхэг">
                <input type="number" value={quantity} min={1}
                  onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  style={inp} />
              </Field>
              <Field label="Хуудасны тоо">
                <input type="number" value={pages} min={1}
                  onChange={e => setPages(Math.max(1, Number(e.target.value) || 1))}
                  style={inp} />
              </Field>
            </div>
          </Card>

          {/* Paper */}
          <Card title="Цаасны нягт">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
              {GSM_OPTIONS.map(g => (
                <button key={g.v} onClick={() => setGsm(g.v)}
                  style={{ ...smallBtn, ...(gsm === g.v ? activeSmall : {}) }}>
                  {g.l}
                </button>
              ))}
            </div>
          </Card>

          {/* Color + sides */}
          <Card title="Өнгө ба тал">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={lblStyle}>Өнгөний горим</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {COLOR_MODES.map(c => (
                    <button key={c.v} onClick={() => setColorMode(c.v)}
                      style={{ ...smallBtn, textAlign: 'left', ...(colorMode === c.v ? activeSmall : {}) }}>
                      {c.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={lblStyle}>Тал</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {SIDES.map(s => (
                    <button key={s.v} onClick={() => setSides(s.v)}
                      style={{ ...smallBtn, textAlign: 'left', ...(sides === s.v ? activeSmall : {}) }}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Finishing + fold */}
          <Card title="Нэмэлт боловсруулалт">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Finishing">
                <select value={finishing} onChange={e => setFinishing(e.target.value)} style={inp}>
                  {FINISHINGS.map(f => <option key={f.v} value={f.v}>{f.l}</option>)}
                </select>
              </Field>
              <Field label="Нугалалт">
                <select value={fold} onChange={e => setFold(e.target.value)} style={inp}>
                  {FOLDS.map(f => <option key={f.v} value={f.v}>{f.l}</option>)}
                </select>
              </Field>
            </div>
          </Card>
        </div>

        {/* RIGHT — result */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--text)' }}>Үнийн санал</h2>

            {error ? (
              <div style={{ padding: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, fontSize: 12, color: '#B91C1C' }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠ Тооцоолол хийгдсэнгүй</div>
                <div>{error}</div>
              </div>
            ) : loading ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>Тооцоолж байна…</div>
            ) : result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <Row label="Цаасны зардал" value={fmt(result.paper_cost)} />
                <Row label="Хэвлэл" value={fmt(result.print_cost)} />
                <Row label="Тохиргоо (setup)" value={fmt(result.setup_cost)} />
                {Number(result.finishing_cost || 0) > 0 && <Row label="Finishing" value={fmt(result.finishing_cost)} />}
                {Number(result.fold_cost || 0) > 0 && <Row label="Нугалалт" value={fmt(result.fold_cost)} />}
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                {Number(result.margin || 0) > 0 && <Row label="Margin" value={fmt(result.margin)} />}
                <Row label="VAT (10%)" value={fmt(result.vat)} />
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                <Row label="Нэгж үнэ" value={fmt(result.unit_price) + '/ш'} />
                <div style={{ padding: '14px 12px', background: 'linear-gradient(135deg, #FF6B00, #F97316)', borderRadius: 10, color: '#fff', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, opacity: 0.9 }}>НИЙТ</div>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 2 }}>{fmt(result.total_price)}</div>
                </div>
                {(result.notes?.length ?? 0) > 0 && (
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6 }}>
                    {(result.notes || []).map((n, i) => <div key={i}>• {n}</div>)}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div style={{ marginTop: 10, fontSize: 10, color: 'var(--text3)', textAlign: 'center' }}>
            Үнэ → <a href="/admin/quote-engine" style={{ color: '#FF6B00' }}>/admin/quote-engine</a> дээрээс тохируулна
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .offset-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────

const fmt = (n?: number | string | null) => '₮' + Math.round(Number(n) || 0).toLocaleString('mn-MN')

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: 'var(--surface2)',
  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)',
  fontSize: 13, outline: 'none',
}
const lblStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 6 }

const boxBtn: React.CSSProperties = {
  padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10,
  background: 'var(--surface2)', cursor: 'pointer', textAlign: 'left',
  color: 'var(--text)', transition: 'all 0.15s',
}
const activeBox: React.CSSProperties = {
  borderColor: '#FF6B00', background: 'rgba(255,107,0,0.08)',
}

const smallBtn: React.CSSProperties = {
  padding: '8px 12px', fontSize: 12, border: '1px solid var(--border)',
  borderRadius: 8, background: 'var(--surface2)', color: 'var(--text2)',
  cursor: 'pointer', transition: 'all 0.15s',
}
const activeSmall: React.CSSProperties = {
  borderColor: '#FF6B00', background: 'rgba(255,107,0,0.08)', color: '#FF6B00', fontWeight: 600,
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={lblStyle}>{label}</div>
      {children}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      style={{
        padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
        border: active ? '1.5px solid #FF6B00' : '1px solid var(--border)',
        background: active ? 'rgba(255,107,0,0.08)' : 'var(--surface2)',
        color: active ? '#FF6B00' : 'var(--text2)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}>
      {children}
    </button>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--text3)' }}>{label}</span>
      <span style={{ color: 'var(--text)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}
