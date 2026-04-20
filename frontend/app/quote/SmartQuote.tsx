'use client'
import React, { useState, useEffect } from 'react'
import React, { apiFetch, apiUpload } from '@/lib/api'
import QuotePreview from '@/components/QuotePreview'

/* ═══════════════════════════════════════
 *  SMART QUOTE — AI-Powered Quote System
 * ═══════════════════════════════════════ */

const PRODUCT_TYPES = [
  { key: 'tovgor', label: 'Товгор үсэг', icon: '🔤' },
  { key: 'nerj', label: 'Нерж үсэг', icon: '✨' },
  { key: 'd3', label: '3D үсэг', icon: '🎯' },
  { key: 'sambar', label: 'Гэрэлт самбар', icon: '💡' },
  { key: 'pvc', label: 'PVC үсэг', icon: '🏷️' },
  { key: 'offset', label: 'Офсет хэвлэл', icon: '🖨️' },
  { key: 'wide', label: 'Баннер / Стикер', icon: '🪧' },
]

const LETTER_SIZES = [20, 30, 40, 50, 60, 70, 80, 100]

export default function SmartQuote() {
  const [productType, setProductType] = useState('tovgor')
  // 3 tier text system: Том / Дунд / Жижиг
  const [textLines, setTextLines] = useState([
    { text: '', size: 50, label: 'Том' },
    { text: '', size: 30, label: 'Дунд' },
    { text: '', size: 15, label: 'Жижиг' },
  ])
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [width, setWidth] = useState(2)
  const [height, setHeight] = useState(1)
  const [quantity, setQuantity] = useState(1)
  const [urgency, setUrgency] = useState('normal')
  const [lit, setLit] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    try { const u = JSON.parse(localStorage.getItem('user') || 'null'); if (u?.id) setUser(u) } catch {}
  }, [])

  const isTovgor = productType === 'tovgor'
  const isSign = !['offset', 'wide'].includes(productType)
  // Active text lines (текст бичсэн)
  const activeLines = textLines.filter(l => l.text.trim())
  const signText = activeLines.map(l => l.text).join(' ')
  // Нийт үсгийн тоо (бүх мөрөөс)
  const totalLetters = activeLines.reduce((sum, l) => sum + l.text.replace(/\s/g, '').length, 0)
  // Том үсгийн хэмжээ (лого харьцаанд ашиглана)
  const maxLetterSize = activeLines.length > 0 ? Math.max(...activeLines.map(l => l.size)) : 30

  // Logo: том үсгийн өндрөөс 18% том, квадрат
  const signHeightM = isTovgor ? maxLetterSize / 100 : height
  const logoHeightM = signHeightM * 1.18
  const logoWidthM = logoHeightM
  const logoArea = logoWidthM * logoHeightM
  const LOGO_RATE_PER_M2 = 500000 // ₮/м²
  const logoPrice = logoUrl ? Math.round(Math.max(logoArea * LOGO_RATE_PER_M2, 80000)) : 0
  const logoWidthCm = Math.round(logoWidthM * 100)
  const logoHeightCm = Math.round(logoHeightM * 100)

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true)
      // Multi-line тооцоолол: мөр бүрийн үсгийн тоо × тухайн хэмжээний үнэ
      apiFetch<any>('/smart-quote/calculate', {
        method: 'POST',
        body: JSON.stringify({
          product_type: productType, sign_text: signText,
          width, height, quantity,
          // Олон мөр: мөр бүрийн үсэг + хэмжээ
          text_lines: isTovgor ? activeLines.map(l => ({
            text: l.text, size: l.size,
            letter_count: l.text.replace(/\s/g, '').length,
          })) : undefined,
          letter_size_cm: isTovgor ? maxLetterSize : undefined,
          letter_count: isTovgor ? totalLetters : undefined,
          material: lit ? `${productType}_on` : undefined, urgency,
        }),
      }).then(r => { if (r) setResult(r) }).catch(() => {}).finally(() => setLoading(false))
    }, 400)
    return () => clearTimeout(t)
  }, [productType, textLines, width, height, quantity, urgency, lit])

  return (
    <div style={{ fontFamily: "'Segoe UI',system-ui,sans-serif", background: '#FAFAF8', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1C1917, #292524)', padding: '32px 20px', color: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 9, background: '#FF6B00', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>AI</span>
            <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 99 }}>SMART QUOTE</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Ухаалаг <span style={{ color: '#FF6B00' }}>үнийн санал</span></h1>
          <p style={{ fontSize: 13, color: '#A8A29E' }}>Шууд тооцоолол · 3 сонголт · Албан ёсны үнийн санал</p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px', display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* LEFT */}
        <div style={{ flex: '1 1 500px', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Products */}
          <Card title="Бүтээгдэхүүн">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRODUCT_TYPES.map(p => (
                <Chip key={p.key} active={productType === p.key} onClick={() => setProductType(p.key)}>{p.icon} {p.label}</Chip>
              ))}
            </div>
          </Card>

          {/* Text lines + Logo */}
          {isSign && (
            <Card title="Хаягны мэдээлэл">
              {/* 3-tier text inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {textLines.map((line, idx) => {
                  const colors = ['#FF6B00', '#3B82F6', '#6B7280']
                  const icons = ['🔤', '📝', '📋']
                  const count = line.text.replace(/\s/g, '').length
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 12 }}>{icons[idx]}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: colors[idx] }}>{line.label}</span>
                        <span style={{ fontSize: 10, color: '#BBB' }}>({line.size}см)</span>
                        {count > 0 && <span style={{ fontSize: 10, color: colors[idx], marginLeft: 'auto' }}>{count} үсэг</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input value={line.text}
                          onChange={e => setTextLines(prev => prev.map((l, i) => i === idx ? { ...l, text: e.target.value } : l))}
                          placeholder={idx === 0 ? '"БИЗ МАРКЕТ"' : idx === 1 ? '"Худалдааны төв"' : '"Ажиллах цаг: 09-21"'}
                          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${line.text ? colors[idx] + '40' : '#E5E7EB'}`, fontSize: idx === 0 ? 16 : idx === 1 ? 14 : 12, fontWeight: idx === 0 ? 800 : idx === 1 ? 600 : 400, background: line.text ? colors[idx] + '06' : '#fff' }} />
                        {isTovgor && (
                          <select value={line.size}
                            onChange={e => setTextLines(prev => prev.map((l, i) => i === idx ? { ...l, size: Number(e.target.value) } : l))}
                            style={{ width: 75, padding: '8px 4px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, textAlign: 'center', color: colors[idx], fontWeight: 700 }}>
                            {[15, 20, 25, 30, 40, 50, 60, 70, 80, 100].map(s => (
                              <option key={s} value={s}>{s}см</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Summary */}
              {isTovgor && totalLetters > 0 && (
                <div style={{ padding: '8px 12px', background: '#FFF7ED', borderRadius: 8, border: '1px solid #FFEDD5', marginBottom: 12, fontSize: 11 }}>
                  {activeLines.map((l, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span style={{ color: '#888' }}>{l.label}: "{l.text}" ({l.text.replace(/\s/g, '').length} үсэг × {l.size}см)</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid #FFEDD5', marginTop: 4, paddingTop: 4, fontWeight: 700, color: '#FF6B00' }}>
                    Нийт: {totalLetters} үсэг
                  </div>
                </div>
              )}

              {/* Logo upload */}
              <div>
                <Label>Лого (1 ширхэг)</Label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 8, cursor: 'pointer', border: logoUrl ? '2px solid #10B981' : '1.5px dashed #D1D5DB', background: logoUrl ? '#F0FDF4' : '#fff', fontSize: 12, color: logoUrl ? '#10B981' : '#888' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                    if (!e.target.files?.[0]) return
                    const file = e.target.files[0]
                    setLogoUrl(URL.createObjectURL(file))
                    try {
                      const fd = new FormData(); fd.append('file', file)
                      const res = await apiUpload<any>('/upload/file', fd)
                      if (res?.file_url) setLogoUrl(`http://localhost:4000${res.file_url}`)
                    } catch {}
                  }} />
                  {logoUrl ? (
                    <><img src={logoUrl} alt="" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4 }} /> ✓ Лого оруулсан</>
                  ) : '📎 Лого оруулах'}
                </label>
                {logoUrl && (
                  <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>
                    Лого хэмжээ: {logoWidthCm}×{logoHeightCm}см (том үсгийн өндрөөс 18% том) · ₮{logoPrice.toLocaleString()}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Size */}
          <Card title="Хэмжээ">
            {isTovgor ? (
              <div style={{ fontSize: 12, color: '#888', padding: '8px 0' }}>
                Үсгийн хэмжээг мөр бүрт дээрх талбараас тохируулна уу
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}><Label>Өргөн (м)</Label><NumInput value={width} onChange={setWidth} /></div>
                <div style={{ flex: 1 }}><Label>Өндөр (м)</Label><NumInput value={height} onChange={setHeight} /></div>
                {!isSign && <div style={{ flex: 1 }}><Label>Тоо</Label><NumInput value={quantity} onChange={setQuantity} min={1} step={1} /></div>}
              </div>
            )}
            {['nerj', 'd3'].includes(productType) && (
              <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                <Chip active={!lit} onClick={() => setLit(false)}>Гэрэлгүй</Chip>
                <Chip active={lit} onClick={() => setLit(true)} color="#F59E0B">💡 Гэрэлтэй</Chip>
              </div>
            )}
          </Card>

          {/* Urgency */}
          <Card title="Хугацаа">
            <div style={{ display: 'flex', gap: 6 }}>
              <Chip active={urgency === 'normal'} onClick={() => setUrgency('normal')}>Энгийн</Chip>
              <Chip active={urgency === '48h'} onClick={() => setUrgency('48h')}>48 цаг <small style={{ color: '#EF4444' }}>+15%</small></Chip>
              <Chip active={urgency === '24h'} onClick={() => setUrgency('24h')}>24 цаг <small style={{ color: '#EF4444' }}>+30%</small></Chip>
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div style={{ flex: '0 0 380px', minWidth: 340, position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Price */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Үнийн санал</h2>
            {result ? (<>
              {(() => {
                const lp = logoPrice
                const sub = (result.subtotal || 0) + lp
                const vatAmt = Math.round(sub * 0.1)
                const grand = sub + vatAmt
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                    {isTovgor ? activeLines.map((l, i) => {
                      const c = l.text.replace(/\s/g, '').length
                      return c > 0 ? <Row key={i} label={`${l.label}: ${c} үсэг × ${l.size}см`} value={`₮${(c * (result.unit_price || 0)).toLocaleString()}`} /> : null
                    }) : <Row label="Хаягны үнэ" value={`₮${(result.subtotal || 0).toLocaleString()}`} />}
                    {logoUrl && <Row label={`Лого хаяг (${logoWidthCm}×${logoHeightCm}см)`} value={`₮${logoPrice.toLocaleString()}`} />}
                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 6 }} />
                    <Row label="Дүн" value={`₮${sub.toLocaleString()}`} bold />
                    <Row label="НӨАТ (10%)" value={`₮${vatAmt.toLocaleString()}`} muted />
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '2px solid #FF6B00', marginTop: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#FF6B00' }}>НИЙТ</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: '#FF6B00' }}>₮{grand.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })()}
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 8, color: '#888' }}>Машин</div>
                  <div style={{ fontSize: 10, fontWeight: 600 }}>{result.machine_type}</div>
                </div>
                <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 8, color: '#888' }}>Хугацаа</div>
                  <div style={{ fontSize: 10, fontWeight: 600 }}>{result.production_speed}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                <button onClick={() => setShowPreview(true)} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#1C1917', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>📄 Үнийн санал харах</button>
                <button style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#FF6B00', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>📧 Илгээх</button>
              </div>
            </>) : (
              <div style={{ textAlign: 'center', padding: 24, color: '#BBB', fontSize: 13 }}>{loading ? '⏳ Тооцоолж байна...' : 'Параметр оруулна уу'}</div>
            )}
          </div>

          {/* AI */}
          {result?.ai && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 9, background: '#8B5CF6', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>AI</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Зөвлөмж</span>
              </div>
              <p style={{ fontSize: 12, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>{result.ai.recommendation}</p>
              {result.ai.upsell?.map((u: string, i: number) => (
                <div key={i} style={{ fontSize: 11, color: '#FF6B00', padding: '2px 0' }}>💡 {u}</div>
              ))}
            </div>
          )}

          {/* 3 Options */}
          {result?.options && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📊 Сонголтууд</div>
              {result.options.map((opt: any, i: number) => {
                const c = ['#6B7280', '#FF6B00', '#8B5CF6'][i]
                const l = ['Economy', 'Standard', 'Premium'][i]
                return (
                  <div key={opt.tier} style={{ padding: 10, borderRadius: 10, border: i === 1 ? '2px solid #FF6B00' : '1px solid #E5E7EB', background: i === 1 ? '#FFF7ED' : '#fff', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{l}</span>
                      {i === 1 && <span style={{ fontSize: 8, background: '#FF6B00', color: '#fff', padding: '1px 6px', borderRadius: 99, marginLeft: 6 }}>Санал болгох</span>}
                      <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>{opt.material} · {opt.delivery_days} өдөр</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: c }}>₮{Math.round(opt.price * 1.1).toLocaleString()}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showPreview && result && (
        <QuotePreview open={showPreview} onClose={() => setShowPreview(false)} data={{
          items: isTovgor ? activeLines.map(l => ({
            product: `${PRODUCT_TYPES.find(p => p.key === productType)?.label} (${l.label})`,
            text: l.text, width: l.size * l.text.replace(/\s/g, '').length / 100, height: l.size / 100, unit: 'м',
            qty: l.text.replace(/\s/g, '').length, unitPrice: result.unit_price || 0, total: 0,
            isLetterBased: true, letterSize: l.size, letterCount: l.text.replace(/\s/g, '').length,
          })) : [{
            product: PRODUCT_TYPES.find(p => p.key === productType)?.label || '', text: signText || '—',
            width, height, unit: 'м', qty: quantity, unitPrice: result.unit_price, total: result.subtotal,
          }],
          logoUrl: logoUrl || undefined, logoItem: logoUrl ? { width: logoWidthCm, height: logoHeightCm, unit: 'см', price: logoPrice } : null,
          customerName: user?.full_name || '', customerEmail: user?.email || '', customerPhone: user?.phone || '',
          subtotal: result.subtotal + logoPrice, vat: Math.round((result.subtotal + logoPrice) * 0.1), grandTotal: Math.round((result.subtotal + logoPrice) * 1.1),
          quoteNumber: 'QT-' + String(Date.now()).slice(-6), date: new Date().toLocaleDateString('mn-MN'), validDays: 7,
        }} />
      )}
    </div>
  )
}

/* ── Helper Components ── */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: 20 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8, display: 'block' }}>{title}</label>
      {children}
    </div>
  )
}
function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 4, display: 'block' }}>{children}</label>
}
function Chip({ active, onClick, children, color = '#FF6B00' }: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button onClick={onClick} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: active ? `2px solid ${color}` : '1px solid #E5E7EB', background: active ? color + '12' : '#fff', color: active ? color : '#888' }}>
      {children}
    </button>
  )
}
function NumInput({ value, onChange, min = 0.1, step = 0.1 }: { value: number; onChange: (v: number) => void; min?: number; step?: number }) {
  return <input type="number" min={min} step={step} value={value} onChange={e => onChange(Number(e.target.value) || min)}
    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14 }} />
}
function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', color: muted ? '#888' : undefined }}>
      <span style={{ fontWeight: bold ? 600 : undefined }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 600 }}>{value}</span>
    </div>
  )
}
