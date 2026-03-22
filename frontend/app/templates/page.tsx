'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

const CATEGORIES = [
  { id: 'all',           label: 'Бүгд',          icon: '✨' },
  { id: 'business_card', label: 'Нэрийн хуудас', icon: '🪪' },
  { id: 'flyer',         label: 'Флаер & Постер', icon: '📄' },
  { id: 'banner',        label: 'Баннер',         icon: '🪧' },
  { id: 'sticker',       label: 'Стикер',         icon: '🏷️' },
  { id: 'book',          label: 'Ном & Каталог',  icon: '📗' },
  { id: 'social',        label: 'Сошиал медиа',   icon: '📱' },
  { id: 'invitation',    label: 'Урилга',         icon: '✉️' },
]

const CAT_COLORS: Record<string, string> = {
  business_card: '#FF6B00', flyer: '#8B5CF6', banner: '#3B82F6',
  sticker: '#10B981', book: '#F59E0B', social: '#EC4899', invitation: '#6366F1',
}

export default function TemplatesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)

  const activeCategory = searchParams.get('category') || 'all'

  const load = useCallback(() => {
    setLoading(true)
    const q = activeCategory !== 'all' ? `&category=${activeCategory}` : ''
    apiFetch(`//templates?status=active${q}`)
      .then(r => r.json())
      .then(d => setTemplates(Array.isArray(d) ? d : (d?.data ?? [])))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false))
  }, [activeCategory])

  useEffect(() => { load() }, [load])

  const useTemplate = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    try { await apiFetch(`//templates/${id}/use`, { method: 'PATCH' }) } catch {}
    router.push(`/designer?template_id=${id}`)
  }

  const filtered = activeCategory === 'all'
    ? templates
    : templates.filter(t => t.category === activeCategory)

  return (
    <div style={{ fontFamily: F, background: '#F8F8F5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EBEBEB' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px 0' }}>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
              🎨 Загвар сан
            </h1>
            <p style={{ fontSize: 14, color: '#666', margin: 0 }}>
              Мянга мянган бэлэн загвараас сонгоод хэдхэн минутад хэвлүүлэх файл бэлэн болго
            </p>
          </div>
          {/* Category filter pills */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 1 }}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id
              const color = CAT_COLORS[cat.id] || '#FF6B00'
              return (
                <button key={cat.id}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    if (cat.id === 'all') params.delete('category')
                    else params.set('category', cat.id)
                    router.push(`/templates?${params.toString()}`)
                  }}
                  style={{
                    flexShrink: 0, padding: '8px 16px', borderRadius: 999, border: isActive ? `2px solid ${color}` : '2px solid #EBEBEB',
                    background: isActive ? color : '#fff', color: isActive ? '#fff' : '#555',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                  }}
                >
                  <span>{cat.icon}</span>{cat.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px 60px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #EBEBEB' }}>
                <div style={{ height: 200, background: '#F0F0EC', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ padding: 14 }}>
                  <div style={{ height: 12, background: '#F0F0EC', borderRadius: 6, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ height: 10, background: '#F0F0EC', borderRadius: 6, width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#999' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#444', marginBottom: 8 }}>Загвар олдсонгүй</div>
            <div style={{ fontSize: 14 }}>Өөр ангилал сонгоно уу</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
              <strong style={{ color: '#111' }}>{filtered.length}</strong> загвар олдлоо
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {filtered.map((t: any) => {
                const color = CAT_COLORS[t.category] || '#FF6B00'
                const isHov = hoveredId === t.id
                const isPrev = previewId === t.id
                return (
                  <div key={t.id}
                    style={{ background: '#fff', borderRadius: 14, border: '1px solid #EBEBEB', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s', boxShadow: isHov ? '0 8px 24px rgba(0,0,0,0.10)' : 'none', transform: isHov ? 'translateY(-3px)' : 'none' }}
                    onMouseEnter={() => setHoveredId(t.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Preview image */}
                    <div style={{ height: 200, position: 'relative', background: t.preview_url ? 'transparent' : `linear-gradient(135deg, ${color}18, ${color}35)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {t.preview_url
                        ? <img src={t.preview_url} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 52 }}>🖨️</span>}
                      {/* Hover overlay */}
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: isHov ? 1 : 0, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <button
                          onClick={() => setPreviewId(isPrev ? null : t.id)}
                          style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: F }}>
                          👁 Урьдчилан харах
                        </button>
                        <button
                          onClick={e => useTemplate(e, t.id)}
                          style={{ background: '#FF6B00', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: 9, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: F }}>
                          Ашиглах →
                        </button>
                      </div>
                    </div>
                    {/* Info */}
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color, background: color + '15', padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {CATEGORIES.find(c => c.id === t.category)?.label || t.category}
                        </span>
                        {t.is_premium ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', background: '#FEF3C7', padding: '2px 8px', borderRadius: 999 }}>⭐ Premium</span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981', background: '#D1FAE5', padding: '2px 8px', borderRadius: 999 }}>✓ Үнэгүй</span>
                        )}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name || 'Нэргүй загвар'}</div>
                      {t.description && <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {t.downloads != null && <span style={{ fontSize: 11, color: '#BBB' }}>{t.downloads} ашигласан</span>}
                        <button
                          onClick={e => useTemplate(e, t.id)}
                          style={{ marginLeft: 'auto', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
                          Ашиглах
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Preview modal */}
      {previewId && (() => {
        const t = filtered.find(x => x.id === previewId)
        if (!t) return null
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setPreviewId(null)}>
            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', maxWidth: 600, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ height: 360, background: '#F5F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {t.preview_url
                  ? <img src={t.preview_url} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <span style={{ fontSize: 72 }}>🖨️</span>}
              </div>
              <div style={{ padding: '20px 24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 4 }}>{t.name}</div>
                  {t.description && <div style={{ fontSize: 13, color: '#777' }}>{t.description}</div>}
                </div>
                <button onClick={e => useTemplate(e, t.id)} style={{ background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: F, whiteSpace: 'nowrap' }}>
                  Ашиглах →
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  )
}
