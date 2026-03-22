'use client'
import { apiFetch } from '@/lib/api'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const fmt = (n: number) => new Intl.NumberFormat('mn-MN').format(Math.round(n)) + '₮'

const URGENCY = [
  { value: 'standard', label: '📦 Стандарт', sub: '3-5 хоног' },
  { value: 'rush_72h', label: '⚡ 72 цаг',   sub: '+5%' },
  { value: 'rush_48h', label: '🔥 48 цаг',   sub: '+15%' },
  { value: 'rush_24h', label: '🚀 24 цаг',   sub: '+30%' },
]
const GSM_OPTIONS = [80, 100, 130, 150, 200, 250, 300, 350]
const FINISHING_OPTIONS = [
  { value: 'none',       label: '—  Байхгүй' },
  { value: 'mat',        label: '🌫️ Мат ламинат' },
  { value: 'gloss',      label: '✨ Глосс ламинат' },
  { value: 'uv',         label: '💫 UV лак' },
  { value: 'soft_touch', label: '🧤 Soft touch' },
]
const BINDING_OPTIONS = [
  { value: 'none',      label: '—  Байхгүй' },
  { value: 'staple',    label: '📌 Зүүгдэх' },
  { value: 'perfect',   label: '📕 Perfect bind' },
  { value: 'spiral',    label: '🌀 Spiral' },
  { value: 'hardcover', label: '📚 Хатуу хавтас' },
]

type Stage = 'idle' | 'uploading' | 'done' | 'error'

const STEPS = ['📄 PDF уншиж байна...', '🤖 Claude AI шинжлэж байна...', '💰 Үнэ тооцоолж байна...']

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: FONT,
      border: `1.5px solid ${active ? '#FF6B00' : 'var(--border)'}`,
      background: active ? '#FF6B00' : 'transparent',
      color: active ? '#fff' : 'var(--text2)', fontWeight: active ? 700 : 400,
      transition: 'all 0.15s',
    }}>{children}</button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text2)', marginBottom: 12, textTransform: 'uppercase' }}>{title}</div>
      {children}
    </div>
  )
}

export default function SmartQuotePage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  // Options
  const [quantity, setQuantity] = useState(100)
  const [urgency, setUrgency] = useState('standard')
  const [hint, setHint] = useState('')
  const [paperGsm, setPaperGsm] = useState<number | null>(null)
  const [colorMode, setColorMode] = useState<string | null>(null)
  const [sides, setSides] = useState<string | null>(null)
  const [finishing, setFinishing] = useState<string | null>(null)
  const [binding, setBinding] = useState<string | null>(null)

  const [stage, setStage] = useState<Stage>('idle')
  const [stepIdx, setStepIdx] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') { setError('Зөвхөн PDF файл зөвшөөрөгдөнө'); return }
    setFile(f); setError(''); setResult(null); setStage('idle')
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const analyze = async () => {
    if (!file) return
    setStage('uploading'); setError(''); setResult(null); setStepIdx(0)

    let si = 0
    const iv = setInterval(() => { si = Math.min(si + 1, STEPS.length - 1); setStepIdx(si) }, 2000)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('quantity', String(quantity))
      fd.append('urgency', urgency)
      if (hint)       fd.append('hint', hint)
      if (paperGsm)   fd.append('paper_gsm', String(paperGsm))
      if (colorMode)  fd.append('color_mode', colorMode)
      if (sides)      fd.append('sides', sides)
      if (finishing)  fd.append('finishing', finishing)
      if (binding)    fd.append('binding', binding)

      const res = await apiFetch(`//ai/smart-quote/from-pdf`, { method: 'POST', body: fd })
      clearInterval(iv)
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.message || 'Серверт алдаа гарлаа')
      }
      const data = await res.json()
      setResult(data.data || data)
      setStage('done')
    } catch (e: any) {
      clearInterval(iv)
      setError(e.message || 'Алдаа гарлаа')
      setStage('error')
    }
  }

  const reset = () => { setFile(null); setResult(null); setStage('idle'); setError('') }

  const ai = result?.ai_analysis
  const q  = result?.quote

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: FONT }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#FF6B00,#FF8C38)', padding: '48px 24px 40px', textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🤖</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', letterSpacing: -0.5 }}>AI Smart Quote</h1>
        <p style={{ fontSize: 14, opacity: 0.9, margin: 0 }}>PDF файл upload → Claude AI шинжлэнэ → Хэвлэлийн үнэ 3 секундэд</p>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '28px 20px' }}>
        {(stage === 'idle' || stage === 'error') && (
          <>
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2.5px dashed ${drag ? '#FF6B00' : file ? '#10B981' : 'var(--border2)'}`,
                borderRadius: 16, padding: '36px 24px', textAlign: 'center',
                background: drag ? '#FFF7ED' : file ? '#F0FDF4' : 'var(--surface)',
                cursor: 'pointer', transition: 'all 0.2s', marginBottom: 14,
              }}
            >
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {file ? (
                <div>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#059669' }}>{file.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB · PDF</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 48, marginBottom: 10 }}>📄</div>
                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>PDF файл оруулна уу</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>Drag & Drop эсвэл дарж сонгоно уу</div>
                  <span style={{ background: '#FF6B00', color: '#fff', padding: '9px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>📂 Файл сонгох</span>
                </div>
              )}
            </div>

            {/* 2 column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Left column */}
              <div>
                {/* Quantity */}
                <Section title="ТОО ШИРХЭГ">
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[50, 100, 250, 500, 1000, 2000].map(q => (
                      <Chip key={q} active={quantity === q} onClick={() => setQuantity(q)}>{q}</Chip>
                    ))}
                    <input type="number" min={1} value={quantity}
                      onChange={e => setQuantity(Number(e.target.value))}
                      style={{ width: 72, padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13 }}
                    />
                  </div>
                </Section>

                {/* Color mode */}
                <Section title="ӨНГӨ">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Chip active={colorMode === null} onClick={() => setColorMode(null)}>🤖 AI тодорхойлно</Chip>
                    <Chip active={colorMode === 'color'} onClick={() => setColorMode('color')}>🎨 Өнгөт</Chip>
                    <Chip active={colorMode === 'bw'} onClick={() => setColorMode('bw')}>⬛ Хар цагаан</Chip>
                  </div>
                </Section>

                {/* Sides */}
                <Section title="ТАЛ">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Chip active={sides === null} onClick={() => setSides(null)}>🤖 AI тодорхойлно</Chip>
                    <Chip active={sides === 'single'} onClick={() => setSides('single')}>1 тал</Chip>
                    <Chip active={sides === 'double'} onClick={() => setSides('double')}>2 тал</Chip>
                  </div>
                </Section>

                {/* Urgency */}
                <Section title="ЯАРАЛТАЙ БАЙДАЛ">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {URGENCY.map(u => (
                      <button key={u.value} onClick={() => setUrgency(u.value)} style={{
                        padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                        border: `1.5px solid ${urgency === u.value ? '#FF6B00' : 'var(--border)'}`,
                        background: urgency === u.value ? '#FFF7ED' : 'transparent',
                        color: urgency === u.value ? '#FF6B00' : 'var(--text2)', fontFamily: FONT,
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{u.label}</div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>{u.sub}</div>
                      </button>
                    ))}
                  </div>
                </Section>
              </div>

              {/* Right column */}
              <div>
                {/* Paper GSM */}
                <Section title="ЦААСНЫ ГРАММАЖ (GSM)">
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Chip active={paperGsm === null} onClick={() => setPaperGsm(null)}>🤖 AI</Chip>
                    {GSM_OPTIONS.map(g => (
                      <Chip key={g} active={paperGsm === g} onClick={() => setPaperGsm(g)}>{g}</Chip>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
                    <b>80-100</b> Хэвлэлийн цаас · <b>130-150</b> Флаер · <b>200-250</b> Визит карт · <b>300-350</b> Зузаан
                  </div>
                </Section>

                {/* Finishing */}
                <Section title="FINISHING / ЛААЗ">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Chip active={finishing === null} onClick={() => setFinishing(null)}>🤖 AI тодорхойлно</Chip>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {FINISHING_OPTIONS.map(f => (
                        <Chip key={f.value} active={finishing === f.value} onClick={() => setFinishing(f.value)}>{f.label}</Chip>
                      ))}
                    </div>
                  </div>
                </Section>

                {/* Binding */}
                <Section title="ХАВЧИХ / BINDING">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <Chip active={binding === null} onClick={() => setBinding(null)}>🤖 AI</Chip>
                    {BINDING_OPTIONS.map(b => (
                      <Chip key={b.value} active={binding === b.value} onClick={() => setBinding(b.value)}>{b.label}</Chip>
                    ))}
                  </div>
                </Section>

                {/* Hint */}
                <Section title="НЭМЭЛТ ТАЙЛБАР">
                  <textarea value={hint} onChange={e => setHint(e.target.value)}
                    placeholder='жш: "A4 флаер, Монгол хэл, хоёр хэл"'
                    rows={3} style={{
                      width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)',
                      borderRadius: 8, background: 'var(--surface2)', color: 'var(--text)',
                      fontSize: 13, resize: 'none', fontFamily: FONT, boxSizing: 'border-box',
                    }}
                  />
                </Section>
              </div>
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '14px 18px', marginBottom: 14, color: '#DC2626', fontSize: 14 }}>
                ⚠️ {error}
              </div>
            )}

            <button onClick={analyze} disabled={!file} style={{
              width: '100%', padding: '16px', fontSize: 16, fontWeight: 700, fontFamily: FONT,
              background: file ? 'linear-gradient(135deg,#FF6B00,#FF8C38)' : 'var(--border)',
              color: file ? '#fff' : 'var(--text2)', border: 'none', borderRadius: 14, cursor: file ? 'pointer' : 'default',
            }}>
              🤖 AI-аар үнэ тооцоолох
            </button>
          </>
        )}

        {/* Loading */}
        {stage === 'uploading' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '56px 32px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, border: '5px solid #FF6B00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 24px' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ fontWeight: 700, fontSize: 20, margin: '0 0 10px' }}>{STEPS[stepIdx]}</p>
            <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}>claude-haiku-4-5 · BizPrint Quote Engine</p>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 8 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i <= stepIdx ? '#FF6B00' : 'var(--border)', transition: 'background 0.3s' }} />
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {stage === 'done' && result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* AI Analysis */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 15, fontWeight: 700 }}>🤖 AI Шинжилгээ</h3>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                  {ai?.confidence}% итгэлтэй
                </span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'Бүтээгдэхүүн', value: ai?.product_name_mn || '—', icon: '📦' },
                    { label: 'Хэмжээ',        value: `${ai?.width_mm}×${ai?.height_mm}мм`, icon: '📐' },
                    { label: 'Хуудас',        value: `${ai?.pages} хуудас`, icon: '📄' },
                    { label: 'Цаас',           value: `${ai?.paper_gsm} GSM`, icon: '🗒️' },
                    { label: 'Өнгө',           value: ai?.color_mode === 'color' ? 'Өнгөт' : 'Хар цагаан', icon: '🎨' },
                    { label: 'Тал',            value: ai?.sides === 'double' ? '2 тал' : '1 тал', icon: '↔️' },
                    { label: 'Finishing',      value: ai?.finishing !== 'none' ? ai?.finishing?.toUpperCase() : '—', icon: '✨' },
                    { label: 'Binding',        value: ai?.binding !== 'none' ? ai?.binding : '—', icon: '📌' },
                  ].map(item => (
                    <div key={item.label} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 3 }}>{item.icon} {item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                {ai?.reasoning && (
                  <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#3730A3', lineHeight: 1.6 }}>
                    💬 {ai.reasoning}
                  </div>
                )}
              </div>
            </div>

            {/* Preflight */}
            {result.preflight && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>🔍 PDF Чанарын шалгалт</h3>
                  <span style={{
                    padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                    background: result.preflight.risk === 'LOW' ? '#D1FAE5' : result.preflight.risk === 'MEDIUM' ? '#FEF3C7' : '#FEE2E2',
                    color: result.preflight.risk === 'LOW' ? '#059669' : result.preflight.risk === 'MEDIUM' ? '#D97706' : '#DC2626',
                  }}>
                    {result.preflight.risk === 'LOW' ? '✅ Сайн' : result.preflight.risk === 'MEDIUM' ? '⚠️ Дунд' : '❌ Асуудалтай'} · {result.preflight.score}/100
                  </span>
                </div>
                <div style={{ padding: '12px 18px' }}>
                  {result.preflight.issues?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {result.preflight.issues.map((issue: any, i: number) => (
                        <div key={i} style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', gap: 8 }}>
                          <span>{issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
                          <span>{issue.message}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 13, color: '#059669' }}>✅ Асуудал илрэгдсэнгүй — хэвлэхэд бэлэн</p>
                  )}
                </div>
              </div>
            )}

            {/* Quote */}
            <div style={{ background: 'var(--surface)', border: '2px solid #FF6B00', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg,#FF6B00,#FF8C38)', padding: '18px 22px' }}>
                <h3 style={{ margin: '0 0 2px', color: '#fff', fontSize: 15, fontWeight: 700 }}>💰 Үнийн тооцоолол</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>{result.file?.name} · {q?.quantity} ширхэг · {result.processing_ms}мс</p>
              </div>
              <div style={{ padding: '20px 22px' }}>
                {/* Main price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Нэгжийн үнэ (1 ширхэг)</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#FF6B00', lineHeight: 1 }}>{fmt(q?.unit_price || 0)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Нийт ({q?.quantity} ш)</div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(q?.total_price || 0)}</div>
                  </div>
                </div>

                {/* Cost breakdown */}
                <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text2)', marginBottom: 12, textTransform: 'uppercase' }}>Зардлын задаргаа</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {[
                      { label: '🖨️ Машин', value: q?.machine },
                      { label: '📄 Цаасны зардал', value: q?.paper_cost != null ? fmt(q.paper_cost) : null },
                      { label: '🖨️ Хэвлэлийн зардал', value: q?.print_cost != null ? fmt(q.print_cost) : null },
                      { label: '✨ Finishing зардал', value: q?.finishing_cost != null && q.finishing_cost > 0 ? fmt(q.finishing_cost) : null },
                      { label: '📌 Binding зардал', value: q?.binding_cost != null && q.binding_cost > 0 ? fmt(q.binding_cost) : null },
                      { label: '🔧 Тохируулгын зардал', value: q?.setup_cost != null ? fmt(q.setup_cost) : null },
                    ].filter(r => r.value).map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'var(--text2)' }}>{label}</span>
                        <span style={{ fontWeight: 600 }}>{value}</span>
                      </div>
                    ))}
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                    {/* Smart adjustments */}
                    {q?.smart_adjustments?.map((adj: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: adj.type === 'discount' ? '#059669' : adj.type === 'fee' ? 'var(--text2)' : '#DC2626' }}>
                          {adj.type === 'discount' ? '✅' : adj.type === 'fee' ? '📊' : '⬆️'} {adj.name === 'quantity_discount' ? 'Тоо ширхэгийн хөнгөлөлт' : adj.name === 'overhead' ? 'Нэмэлт зардал' : adj.name === 'margin' ? 'Ашиг' : adj.name}
                        </span>
                        <span style={{ fontWeight: 700, color: adj.type === 'discount' ? '#059669' : adj.type === 'fee' ? 'var(--text)' : '#DC2626' }}>
                          {adj.type === 'discount' ? '-' : '+'}{fmt(Math.abs(adj.value))}
                        </span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, paddingTop: 4 }}>
                      <span>Нийт</span>
                      <span style={{ color: '#FF6B00' }}>{fmt(q?.total_price || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Print specs summary */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                  {[
                    `📐 ${ai?.width_mm}×${ai?.height_mm}мм`,
                    `🗒️ ${ai?.paper_gsm}gsm`,
                    `🎨 ${ai?.color_mode === 'color' ? 'Өнгөт' : 'Хар цагаан'}`,
                    `↔️ ${ai?.sides === 'double' ? '2 тал' : '1 тал'}`,
                    ai?.finishing !== 'none' ? `✨ ${ai?.finishing}` : null,
                    ai?.binding !== 'none' ? `📌 ${ai?.binding}` : null,
                  ].filter(Boolean).map(tag => (
                    <span key={tag!} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 99, padding: '4px 12px', fontSize: 12, color: 'var(--text2)' }}>{tag}</span>
                  ))}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={reset} style={{ flex: 1, padding: '13px', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: FONT }}>
                    ↩️ Дахин тооцоолох
                  </button>
                  <button onClick={() => router.push('/checkout')} style={{ flex: 2, padding: '13px', background: 'linear-gradient(135deg,#FF6B00,#FF8C38)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: FONT }}>
                    🛍️ Захиалах
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
