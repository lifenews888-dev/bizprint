'use client'
import { useState } from 'react'

const API = 'http://localhost:4000'
const F = "'Segoe UI',system-ui,sans-serif"

const SIZES = ['A5','A4','A3','BusinessCard','Custom']
const COLORS = [{ k:'color', l:'Өнгөт' }, { k:'bw', l:'Хар цагаан' }]
const SIDES = [{ k:'single', l:'Нэг тал' }, { k:'double', l:'Хоёр тал' }]
const GSM_OPTIONS = [80,90,115,150,200,250,300,350,400]
const FINISHING = [
  { k:'none', l:'Байхгүй' },
  { k:'laminate_matte', l:'Мат ламинат' },
  { k:'laminate_gloss', l:'Гянт ламинат' },
  { k:'soft_touch', l:'Soft touch' },
  { k:'uv', l:'UV лак' },
  { k:'fold', l:'Нугалаас' },
]
const BINDING = [
  { k:'none', l:'Байхгүй' },
  { k:'staple', l:'Хавчуур' },
  { k:'perfect', l:'Perfect binding' },
  { k:'spiral', l:'Spiral' },
  { k:'hardcover', l:'Хатуу хавтас' },
]

export default function AdminQuoteEnginePage() {
  const [form, setForm] = useState({
    quantity: 100, pages: 1, width_mm: 210, height_mm: 297,
    color_mode: 'color', sides: 'single', paper_gsm: 150,
    finishing: 'none', binding: 'none',
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'manual'|'pdf'>('manual')

  async function calculate() {
    setLoading(true)
    setResult(null)
    try {
      let res
      if (mode === 'pdf' && file) {
        const fd = new FormData()
        fd.append('file', file)
        Object.entries(form).forEach(([k,v]) => fd.append(k, String(v)))
        res = await fetch(`${API}/quote-engine/from-pdf`, { method: 'POST', body: fd })
      } else {
        res = await fetch(`${API}/quote-engine/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      const data = await res.json()
      setResult(data)
    } catch(e) {
      alert('Алдаа гарлаа')
    }
    setLoading(false)
  }

  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const sel = (label: string, key: string, opts: {k:string,l:string}[]) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' as any }}>{label}</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as any }}>
        {opts.map(o => (
          <button key={o.k} onClick={() => f(key, o.k)}
            style={{ padding: '7px 14px', borderRadius: 8, border: (form as any)[key] === o.k ? '2px solid var(--orange)' : '1px solid var(--border)', background: (form as any)[key] === o.k ? 'var(--orange-08)' : 'var(--surface2)', color: (form as any)[key] === o.k ? 'var(--orange)' : 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: (form as any)[key] === o.k ? 600 : 400 }}>
            {o.l}
          </button>
        ))}
      </div>
    </div>
  )

  const num = (label: string, key: string, min = 1, max = 99999) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' as any }}>{label}</label>
      <input type="number" min={min} max={max} value={(form as any)[key]}
        onChange={e => f(key, Number(e.target.value))}
        style={{ padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, color: 'var(--text)', outline: 'none', width: 140 }} />
    </div>
  )

  return (
    <div style={{ padding: '28px 32px', fontFamily: F, color: 'var(--text)' }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Quote Engine — Тооцоолол</h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', margin: '5px 0 0' }}>Хэвлэлийн бодит өртөг тооцоолох систем</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 32 }}>
        <div>
          {/* Mode selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {[{ k:'manual', l:'Manual параметр' }, { k:'pdf', l:'PDF upload' }].map(m => (
              <button key={m.k} onClick={() => setMode(m.k as any)}
                style={{ padding: '10px 20px', borderRadius: 10, border: mode === m.k ? '2px solid var(--orange)' : '1px solid var(--border)', background: mode === m.k ? 'var(--orange-06)' : 'var(--surface2)', color: mode === m.k ? 'var(--orange)' : 'var(--text)', cursor: 'pointer', fontSize: 14, fontWeight: mode === m.k ? 600 : 400 }}>
                {m.l}
              </button>
            ))}
          </div>

          {mode === 'pdf' && (
            <div style={{ marginBottom: 24, padding: 20, background: 'var(--surface2)', borderRadius: 12, border: '2px dashed var(--border)' }}>
              <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' as any }}>PDF файл</label>
              <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)}
                style={{ fontSize: 13, color: 'var(--text)' }} />
              {file && <div style={{ fontSize: 12, color: '#1D9E75', marginTop: 8 }}>Файл: {file.name}</div>}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              {num('Тоо ширхэг', 'quantity', 1, 100000)}
              {num('Хуудасны тоо', 'pages', 1, 9999)}
              {mode === 'manual' && num('Өргөн (мм)', 'width_mm', 10, 1200)}
              {mode === 'manual' && num('Өндөр (мм)', 'height_mm', 10, 1200)}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' as any }}>Цаасны GSM</label>
                <select value={form.paper_gsm} onChange={e => f('paper_gsm', Number(e.target.value))}
                  style={{ padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, color: 'var(--text)', outline: 'none' }}>
                  {GSM_OPTIONS.map(g => <option key={g} value={g}>{g}gsm</option>)}
                </select>
              </div>
            </div>
            <div>
              {sel('Өнгө', 'color_mode', COLORS)}
              {sel('Хэвлэлийн тал', 'sides', SIDES)}
              {sel('Finishing', 'finishing', FINISHING)}
              {sel('Binding', 'binding', BINDING)}
            </div>
          </div>

          <button onClick={calculate} disabled={loading}
            style={{ width: '100%', padding: 16, background: loading ? 'var(--border)' : 'var(--orange)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: loading ? 'default' : 'pointer', marginTop: 8 }}>
            {loading ? 'Тооцоолж байна...' : 'Үнэ тооцоолох'}
          </button>
        </div>

        {/* Result */}
        <div>
          {!result && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center' as any, color: 'var(--text3)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🖨️</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Параметрүүдийг оруулаад</div>
              <div style={{ fontSize: 13 }}>Үнэ тооцоолох товч дарна уу</div>
            </div>
          )}
          {result && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, var(--orange), #FF8C42)', padding: '20px 24px', color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>{result.size} — {result.quantity} ширхэг</div>
                <div style={{ fontSize: 40, fontWeight: 800 }}>{Number(result.total_price).toLocaleString()}₮</div>
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Нэгж: {Number(result.unit_price).toLocaleString()}₮</div>
              </div>
              <div style={{ padding: '20px 24px' }}>
                {[
                  { l: 'Хэмжээ (хэлбэр)', v: `${result.size} (${result.width_mm}×${result.height_mm}мм)` },
                  { l: 'Хуудасны тоо', v: `${result.pages} хуудас, ${result.sheets_per_copy} хуудасны цаас` },
                  { l: 'Нийт хэвлэх цаас', v: `${result.total_sheets} ш (imposition: ${result.imposition})` },
                  { l: 'Хэвлэх машин', v: `${result.machine} (${result.machine_speed}/цаг)` },
                  { l: 'Хэвлэлийн хугацаа', v: `${result.print_hours} цаг` },
                  { l: 'Цаасны зардал', v: `${Number(result.paper_cost).toLocaleString()}₮` },
                  { l: 'Хэвлэлийн зардал', v: `${Number(result.print_cost).toLocaleString()}₮` },
                  { l: 'Өнгөлгөө зардал', v: `${Number(result.finishing_cost).toLocaleString()}₮` },
                  { l: 'Хавтаслалт зардал', v: `${Number(result.binding_cost).toLocaleString()}₮` },
                  { l: 'Бэлтгэл зардал', v: `${Number(result.setup_cost).toLocaleString()}₮` },
                  { l: 'Нийт дүн', v: `${Number(result.subtotal).toLocaleString()}₮` },
                  { l: 'Нэмэлт зардал (10%)', v: `${Number(result.overhead).toLocaleString()}₮` },
                  { l: 'Ашгийн хувь (20%)', v: `${Number(result.margin).toLocaleString()}₮` },
                ].map((r, i, arr) => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 13 }}>
                    <span style={{ color: 'var(--text3)' }}>{r.l}</span>
                    <span style={{ fontWeight: 500 }}>{r.v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 8, borderTop: '2px solid var(--border)' }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>Нийт төлөх</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--orange)' }}>{Number(result.total_price).toLocaleString()}₮</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}