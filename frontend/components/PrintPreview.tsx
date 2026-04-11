'use client'

interface PrintPreviewProps {
  productType: string
  width: number
  height: number
  sides: string
  material?: string
  qty?: number
  className?: string
}

const MATERIAL_BG: Record<string, string> = {
  'Art card 300gsm': '#f5f0eb',
  'Art card 350gsm': '#f5f0eb',
  'Glossy 130gsm': '#f8f8ff',
  'Glossy 170gsm': '#f0f4ff',
  'Matte 170gsm': '#f2f0ed',
  'Art card 250gsm': '#f3f0ec',
  'Vinyl цагаан': '#ffffff',
  'Vinyl тунгалаг': '#e8f0fe',
  'Vinyl 440gsm': '#e8f0fe',
  'Цаасан': '#faf8f5',
  'Металл': '#d4d4d8',
  'PVC тунгалаг': '#e0ecff',
}

const TYPE_EMOJI: Record<string, string> = {
  'business-card': '💳', 'flyer': '📄', 'banner': '🏗️',
  'sticker': '📎', 'book': '📕', 'brochure': '📋', 'poster': '🖼️',
}

export default function PrintPreview({ productType, width, height, sides, material, qty, className = '' }: PrintPreviewProps) {
  const aspect = width > 0 && height > 0 ? width / height : 0.63
  const bg = (material && MATERIAL_BG[material]) || '#f5f5f5'
  const isGlossy = material?.toLowerCase().includes('gloss') || false
  const emoji = TYPE_EMOJI[productType] || '🖨️'

  const frontW = aspect >= 1 ? 140 : Math.round(140 * aspect)
  const frontH = aspect >= 1 ? Math.round(140 / aspect) : 140
  const backW = Math.round(frontW * 0.75)
  const backH = Math.round(frontH * 0.75)

  return (
    <div className={className} style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Урьдчилан харах</div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
        {/* Front */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: frontW, height: frontH, borderRadius: 6, overflow: 'hidden', position: 'relative',
            background: bg,
            boxShadow: isGlossy
              ? '0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.6)'
              : '0 4px 15px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            {/* Color gradient overlay */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.15, background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4 50%, #FFEAA7)' }} />
            {/* Icon */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 28, opacity: 0.3 }}>{emoji}</span>
            </div>
            {/* Glossy reflection */}
            {isGlossy && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%', opacity: 0.2, background: 'linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)' }} />}
            {/* Label */}
            <div style={{ position: 'absolute', bottom: 3, right: 5, fontSize: 9, opacity: 0.35, fontWeight: 500 }}>урд</div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>Урд тал</div>
        </div>

        {/* Back */}
        {sides === 'double' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: backW, height: backH, borderRadius: 5, overflow: 'hidden', position: 'relative',
              background: bg, opacity: 0.6,
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 20, opacity: 0.2 }}>{emoji}</span>
              </div>
              <div style={{ position: 'absolute', bottom: 2, right: 4, fontSize: 8, opacity: 0.35 }}>ард</div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>Ард тал</div>
          </div>
        )}
      </div>

      {/* Spec pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center', marginTop: 12 }}>
        {width > 0 && height > 0 && (
          <span style={{ fontSize: 11, background: 'var(--surface2)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: 20, color: 'var(--text3)' }}>{width}×{height}мм</span>
        )}
        {material && (
          <span style={{ fontSize: 11, background: 'var(--surface2)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: 20, color: 'var(--text3)' }}>{material}</span>
        )}
        <span style={{ fontSize: 11, background: 'var(--surface2)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: 20, color: 'var(--text3)' }}>
          {sides === 'double' ? 'Хоёр тал' : 'Нэг тал'}
        </span>
        {qty && qty > 0 && (
          <span style={{ fontSize: 11, background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)', padding: '3px 10px', borderRadius: 20, color: '#FF6B00', fontWeight: 600 }}>
            {qty.toLocaleString()} ш
          </span>
        )}
      </div>
    </div>
  )
}
