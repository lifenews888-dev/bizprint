'use client'
import { useRef } from 'react'

/* ═══════════════════════════════════════
 *  QuotePreview — Албан ёсны үнийн санал
 *  Gradient-style professional quote
 * ═══════════════════════════════════════ */

interface QuoteItem {
  product: string
  text: string
  width: number
  height: number
  unit: string
  qty: number
  unitPrice: number
  total: number
  /** For letter-based products (tovgor) — price per letter */
  isLetterBased?: boolean
  letterSize?: number
  letterCount?: number
}

interface QuoteData {
  items: QuoteItem[]
  logoUrl?: string
  logoItem?: { width: number; height: number; unit: string; price: number } | null
  customerName: string
  customerEmail?: string
  customerPhone?: string
  customerCompany?: string
  notes?: string
  subtotal: number
  vat: number
  grandTotal: number
  quoteNumber: string
  date: string
  validDays: number
}

export default function QuotePreview({
  data, open, onClose, onPrint, onSend,
}: {
  data: QuoteData; open: boolean; onClose: () => void
  onPrint?: () => void; onSend?: () => void
}) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!open) return null

  const handlePrint = () => {
    if (onPrint) { onPrint(); return }
    const w = window.open('', '', 'width=900,height=1200')
    if (!w) return
    w.document.write(`<html><head><title>BizPrint Үнийн Санал</title><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>${printRef.current?.innerHTML || ''}</body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 300)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 800, maxHeight: '95vh', overflow: 'auto', position: 'relative' }}>
        {/* Toolbar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px 16px 0 0' }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Үнийн санал</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handlePrint} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#111', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🖨️ Хэвлэх</button>
            {onSend && <button onClick={onSend} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#FF6B00', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📧 Илгээх</button>}
            <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#888', fontSize: 14, cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {/* Document */}
        <div ref={printRef} style={{ padding: '0 20px 20px' }}>
          <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", color: '#111', maxWidth: 760, margin: '0 auto' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #FF6B00, #E55D00)', padding: '24px 30px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#FF6B00' }}>B</span>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>BizPrint</div>
                  <div style={{ fontSize: 10, opacity: 0.8 }}>Хэвлэлийн платформ</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>ҮНИЙН САНАЛ</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>#{data.quoteNumber}</div>
              </div>
            </div>

            {/* Info row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 30px', borderBottom: '1px solid #E5E7EB', fontSize: 12, color: '#555' }}>
              <span>{data.date}</span>
              <span>Улаанбаатар хот</span>
            </div>

            {/* Customer */}
            <div style={{ padding: '16px 30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderBottom: '1px solid #E5E7EB' }}>
              <div>
                <div style={{ fontSize: 10, color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Захиалагч</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{data.customerName || '—'}</div>
                {data.customerCompany && <div style={{ fontSize: 12, color: '#555' }}>{data.customerCompany}</div>}
                {data.customerPhone && <div style={{ fontSize: 12, color: '#555' }}>{data.customerPhone}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Мэдээлэл</div>
                <div style={{ fontSize: 12, color: '#555' }}>Хүчинтэй: {data.validDays} хоног</div>
                <div style={{ fontSize: 12, color: '#555' }}>Баталгаа: 2 жил</div>
              </div>
            </div>

            {/* Items */}
            {data.items.map((item, idx) => (
              <div key={idx} style={{ padding: '24px 30px', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase', marginBottom: 16 }}>
                  {item.product}
                </div>

                <div style={{ display: 'flex', gap: 20 }}>
                  {/* Visual preview — blueprint style */}
                  <div style={{ flex: 1 }}>
                    <div style={{ position: 'relative', paddingTop: 20, paddingRight: 40 }}>
                      {/* Width dimension line — TOP */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 40, height: 16, display: 'flex', alignItems: 'center' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                          <div style={{ width: 1, height: 10, background: '#3B82F6' }} />
                          <div style={{ flex: 1, height: 1, background: '#3B82F6' }} />
                          <span style={{ padding: '0 6px', fontSize: 11, fontWeight: 700, color: '#3B82F6', whiteSpace: 'nowrap' }}>
                            {item.width} {item.unit}
                          </span>
                          <div style={{ flex: 1, height: 1, background: '#3B82F6' }} />
                          <div style={{ width: 1, height: 10, background: '#3B82F6' }} />
                        </div>
                      </div>

                      {/* Height dimension line — RIGHT */}
                      <div style={{ position: 'absolute', top: 20, right: 0, bottom: 0, width: 30, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ height: 1, width: 10, background: '#3B82F6' }} />
                        <div style={{ flex: 1, width: 1, background: '#3B82F6' }} />
                        <span style={{ padding: '4px 0', fontSize: 10, fontWeight: 700, color: '#3B82F6', writingMode: 'vertical-rl', whiteSpace: 'nowrap' }}>
                          {item.height} {item.unit}
                        </span>
                        <div style={{ flex: 1, width: 1, background: '#3B82F6' }} />
                        <div style={{ height: 1, width: 10, background: '#3B82F6' }} />
                      </div>

                      {/* Sign body */}
                      <div style={{
                        border: '2px solid #333', borderRadius: 8, background: '#FAFAFA',
                        padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
                        minHeight: item.isLetterBased ? 90 : 80,
                      }}>
                        {/* Logo inside sign if exists */}
                        {data.logoUrl && (
                          <div style={{ width: 60, height: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={data.logoUrl} alt="" style={{ maxWidth: 56, maxHeight: 56, objectFit: 'contain' }} />
                          </div>
                        )}
                        <div style={{ fontSize: item.isLetterBased ? 34 : 28, fontWeight: 900, letterSpacing: '0.06em', color: '#1C1917', textAlign: 'center', lineHeight: 1.1 }}>
                          {item.text || '—'}
                        </div>
                      </div>
                    </div>

                    {item.isLetterBased && item.letterCount && (
                      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {(item.text || '').split('').map((char, ci) => (
                          char === ' ' ? <div key={ci} style={{ width: 6 }} /> :
                          <div key={ci} style={{ textAlign: 'center' }}>
                            <div style={{ width: 22, height: 26, borderRadius: 3, background: '#FF6B00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>{char}</div>
                            <div style={{ fontSize: 8, color: '#999', marginTop: 2 }}>{ci + 1}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {item.isLetterBased && item.letterCount && (
                      <div style={{ marginTop: 6, fontSize: 11, color: '#FF6B00', textAlign: 'center', fontWeight: 600 }}>
                        {item.letterCount} үсэг × {item.letterSize}см = ₮{(item.unitPrice * item.letterCount).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Right side — logo + price */}
                  <div style={{ width: 200, flexShrink: 0 }}>
                    {/* Logo circle */}
                    {data.logoUrl && (
                      <div style={{ width: 90, height: 90, borderRadius: '50%', border: '2px solid #E5E7EB', overflow: 'hidden', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                        <img src={data.logoUrl} alt="Logo" style={{ maxWidth: 70, maxHeight: 70, objectFit: 'contain' }} />
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#555', lineHeight: 1.8 }}>
                      <div><strong>{item.product}</strong></div>
                      {item.isLetterBased ? (
                        <>
                          <div>1 үсэг {item.letterSize}см: ₮{item.unitPrice.toLocaleString()}</div>
                          <div>{item.letterCount} үсэг</div>
                        </>
                      ) : (
                        <>
                          <div>Хэмжээ: {item.width}×{item.height} {item.unit}</div>
                          <div>Тоо: {item.qty}ш</div>
                          <div>Нэгж үнэ: ₮{item.unitPrice.toLocaleString()}</div>
                        </>
                      )}
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#FF6B00', marginTop: 6 }}>
                        Нийт: ₮{item.total.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Logo item — separate pricing with full image */}
            {data.logoItem && data.logoUrl && (
              <div style={{ padding: '24px 30px', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', marginBottom: 16 }}>ЛОГО ХАЯГ</div>
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                  {/* Logo visual with dimensions */}
                  <div style={{ flex: 1, position: 'relative', paddingTop: 18, paddingRight: 36 }}>
                    {/* Width dimension */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 36, height: 14, display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: 1, height: 8, background: '#3B82F6' }} />
                      <div style={{ flex: 1, height: 1, background: '#3B82F6' }} />
                      <span style={{ padding: '0 4px', fontSize: 10, fontWeight: 700, color: '#3B82F6' }}>{data.logoItem.width}{data.logoItem.unit}</span>
                      <div style={{ flex: 1, height: 1, background: '#3B82F6' }} />
                      <div style={{ width: 1, height: 8, background: '#3B82F6' }} />
                    </div>
                    {/* Height dimension */}
                    <div style={{ position: 'absolute', top: 18, right: 0, bottom: 0, width: 28, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ height: 1, width: 8, background: '#3B82F6' }} />
                      <div style={{ flex: 1, width: 1, background: '#3B82F6' }} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#3B82F6', writingMode: 'vertical-rl' }}>{data.logoItem.height}{data.logoItem.unit}</span>
                      <div style={{ flex: 1, width: 1, background: '#3B82F6' }} />
                      <div style={{ height: 1, width: 8, background: '#3B82F6' }} />
                    </div>
                    {/* Logo image */}
                    <div style={{ border: '2px solid #333', borderRadius: 8, overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '1/1', maxWidth: 180 }}>
                      <img src={data.logoUrl} alt="Лого" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                    </div>
                  </div>
                  {/* Price info */}
                  <div style={{ width: 180, flexShrink: 0, fontSize: 12, color: '#555', lineHeight: 1.8 }}>
                    <div><strong>Биет лого хаяг</strong></div>
                    <div>Хэмжээ: {data.logoItem.width}×{data.logoItem.height} {data.logoItem.unit}</div>
                    <div>Материал: Нерж / PVC</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#FF6B00', marginTop: 8 }}>
                      ₮{data.logoItem.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Totals */}
            <div style={{ padding: '20px 30px', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: 280 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ color: '#888' }}>Дүн</span>
                  <span style={{ fontWeight: 600 }}>₮{data.subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ color: '#888' }}>НӨАТ (10%)</span>
                  <span style={{ fontWeight: 600 }}>₮{data.vat.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, padding: '10px 0 0', fontWeight: 800, color: '#FF6B00' }}>
                  <span>НИЙТ</span>
                  <span>₮{data.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 30px', borderTop: '2px solid #FF6B00', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#555' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Төлбөр хийх</div>
                <div>BizPrint ХХК · Данс: 453304134 (ХХБ)</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div>Хийгдэх хугацаа: 3-5 өдөр</div>
                <div>Баталгаат хугацаа: 2 жил</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>Гаргасан</div>
                <div>BizPrint Platform</div>
              </div>
            </div>

            {/* Brand bar */}
            <div style={{ background: '#FF6B00', padding: '10px 30px', borderRadius: '0 0 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', fontSize: 12 }}>
              <span style={{ fontWeight: 700 }}>BIZPRINT ХЭВЛЭЛИЙН ПЛАТФОРМ</span>
              <span>📞 +976 9911-1111</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
