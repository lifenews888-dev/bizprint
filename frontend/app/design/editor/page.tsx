'use client'
import { useState, useRef, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface TextElement {
  id: string
  type: 'text'
  content: string
  x: number
  y: number
  fontSize: number
  fontWeight: string
  color: string
}

type CanvasElement = TextElement

const CARD_W = 90
const CARD_H = 54
const SCALE = 4

const BG_COLORS = ['#FFFFFF', '#1a1a2e', '#FF6B00', '#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#0A0A0A', '#C4A882']

function EditorContent() {
  const params = useSearchParams()
  const router = useRouter()
  const productType = params.get('type') || 'business-card'

  const canvasW = CARD_W * SCALE
  const canvasH = CARD_H * SCALE
  const canvasRef = useRef<HTMLDivElement>(null)

  const [elements, setElements] = useState<CanvasElement[]>([
    { id: '1', type: 'text', content: 'Таны нэр', x: 24, y: 40, fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
    { id: '2', type: 'text', content: 'Албан тушаал', x: 24, y: 68, fontSize: 12, fontWeight: '400', color: '#666666' },
    { id: '3', type: 'text', content: '+976 9900 0000', x: 24, y: 130, fontSize: 11, fontWeight: '500', color: '#FF6B00' },
    { id: '4', type: 'text', content: 'info@company.mn', x: 24, y: 150, fontSize: 10, fontWeight: '400', color: '#666666' },
    { id: '5', type: 'text', content: 'www.company.mn', x: 24, y: 168, fontSize: 10, fontWeight: '400', color: '#999999' },
  ])

  const [selected, setSelected] = useState<string | null>(null)
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null)
  const [bg, setBg] = useState('#FFFFFF')

  const selectedEl = elements.find(e => e.id === selected) as TextElement | undefined

  const updateElement = useCallback((id: string, updates: Partial<TextElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
  }, [])

  const addText = () => {
    const id = Date.now().toString()
    setElements(prev => [...prev, { id, type: 'text', content: 'Шинэ текст', x: 40 + Math.random() * 60, y: 80 + Math.random() * 40, fontSize: 14, fontWeight: '400', color: '#1a1a1a' }])
    setSelected(id)
  }

  const deleteSelected = () => {
    if (!selected) return
    setElements(prev => prev.filter(e => e.id !== selected))
    setSelected(null)
  }

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setSelected(id)
    const el = elements.find(el => el.id === id)
    if (!el) return
    setDragging({ id, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y })
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragging.startX
    const dy = e.clientY - dragging.startY
    updateElement(dragging.id, {
      x: Math.max(0, Math.min(canvasW - 20, dragging.elX + dx)),
      y: Math.max(0, Math.min(canvasH - 10, dragging.elY + dy)),
    })
  }, [dragging, canvasW, canvasH, updateElement])

  const handleMouseUp = useCallback(() => setDragging(null), [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Toolbar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13 }}>← Буцах</button>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Live Editor — Нэрийн хуудас</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={addText} style={{ padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>+ Текст</button>
          <button onClick={() => router.push(`/orders/new?productType=${productType}&hasDesign=true`)}
            style={{ padding: '6px 16px', border: 'none', borderRadius: 8, background: '#FF6B00', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Захиалах →
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 48px)' }}>
        {/* Left panel — Properties */}
        <div style={{ width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)', padding: 16, overflowY: 'auto', flexShrink: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Арын өнгө</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 20 }}>
            {BG_COLORS.map(c => (
              <button key={c} onClick={() => setBg(c)}
                style={{ width: 28, height: 28, borderRadius: 6, background: c, border: bg === c ? '2px solid #FF6B00' : '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.1s', transform: bg === c ? 'scale(1.1)' : 'none' }} />
            ))}
          </div>

          {selectedEl ? (
            <>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Текст засах</p>
              <textarea value={selectedEl.content}
                onChange={e => updateElement(selected!, { content: e.target.value })}
                rows={2}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--surface2)', color: 'var(--text)', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />

              <p style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Хэмжээ: {selectedEl.fontSize}px</p>
              <input type="range" min={8} max={48} value={selectedEl.fontSize}
                onChange={e => updateElement(selected!, { fontSize: +e.target.value })}
                style={{ width: '100%', marginBottom: 10 }} />

              <p style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Зузаан</p>
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {[{ v: '400', l: 'Нимгэн' }, { v: '600', l: 'Дундаж' }, { v: '700', l: 'Зузаан' }].map(w => (
                  <button key={w.v} onClick={() => updateElement(selected!, { fontWeight: w.v })}
                    style={{ flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                      border: selectedEl.fontWeight === w.v ? '1.5px solid #FF6B00' : '1px solid var(--border)',
                      background: selectedEl.fontWeight === w.v ? 'rgba(255,107,0,0.08)' : 'var(--surface)',
                      color: selectedEl.fontWeight === w.v ? '#FF6B00' : 'var(--text3)' }}>
                    {w.l}
                  </button>
                ))}
              </div>

              <p style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Өнгө</p>
              <input type="color" value={selectedEl.color}
                onChange={e => updateElement(selected!, { color: e.target.value })}
                style={{ width: '100%', height: 32, borderRadius: 6, cursor: 'pointer', border: 'none', marginBottom: 12 }} />

              <button onClick={deleteSelected}
                style={{ width: '100%', padding: '7px 0', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, background: 'rgba(239,68,68,0.05)', color: '#EF4444', fontSize: 11, cursor: 'pointer' }}>
                Устгах
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: 40 }}>
              <p style={{ fontSize: 12, color: 'var(--text3)' }}>Элемент дарж засна уу</p>
            </div>
          )}
        </div>

        {/* Center — Canvas */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
          onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--text3)' }}>{CARD_W}×{CARD_H}мм — Нэрийн хуудас</p>
            <div ref={canvasRef}
              style={{ width: canvasW, height: canvasH, background: bg, position: 'relative', boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.08)', cursor: 'default', userSelect: 'none' }}
              onClick={() => setSelected(null)}>
              {elements.map(el => (
                <div key={el.id}
                  style={{
                    position: 'absolute', left: el.x, top: el.y, cursor: 'move', userSelect: 'none',
                    fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color, lineHeight: 1.3, whiteSpace: 'pre',
                    outline: selected === el.id ? '2px solid #FF6B00' : 'none', outlineOffset: 2,
                    padding: '1px 2px',
                  }}
                  onClick={e => { e.stopPropagation(); setSelected(el.id) }}
                  onMouseDown={e => handleMouseDown(e, el.id)}>
                  {el.content}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 10, color: 'var(--text3)' }}>Элемент дарж чирнэ үү</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}>
      <EditorContent />
    </Suspense>
  )
}
