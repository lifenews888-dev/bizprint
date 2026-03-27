'use client'
import { apiFetch, getToken } from '@/lib/api'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface Template {
  id: string
  title: string
  description?: string
  price?: number
  category?: string
  thumbnail_url?: string
  download_count?: number
  designer_name?: string
}

const fmt = (n: number) => n.toLocaleString('mn-MN') + '₮'

function TemplatesShopInner() {
  const search = useSearchParams()
  const catFilter = search.get('category') || 'all'

  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState('')
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    const token = getToken()
    apiFetch<any>(`/templates`, { auth: false })
      .then(d => setTemplates(Array.isArray(d) ? d : []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false))

    if (token) {
      apiFetch<any>(`/auth/me`)
        .then(u => {
          if (u?.id) {
            setUser(u)
            return apiFetch<any>(`/templates/my/purchases`)
          }
        })
        .then(ids => {
          if (Array.isArray(ids)) setOwnedIds(new Set(ids))
        })
        .catch(() => {})
    }
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const categories = useMemo(() => {
    const set = new Set<string>()
    templates.forEach(t => t.category && set.add(t.category))
    return ['all', ...Array.from(set)]
  }, [templates])

  const filtered = useMemo(() => {
    return templates.filter(t => catFilter === 'all' || t.category === catFilter)
  }, [templates, catFilter])

  async function handlePurchase(templateId: string) {
    if (!user?.id) {
      alert('Нэвтэрч орно уу')
      return
    }
    setPurchasing(templateId)
    try {
      await apiFetch<any>(`/templates/${templateId}/purchase`, {
        method: 'POST',
      })
      setOwnedIds(prev => new Set([...prev, templateId]))
      showToast('Амжилттай худалдан авлаа!')
    } catch {
      showToast('Худалдан авахад алдаа гарлаа')
    }
    setPurchasing(null)
  }

  async function handleDownload(templateId: string) {
    if (!user?.id) {
      alert('Нэвтэрч орно уу')
      return
    }
    setDownloading(templateId)
    try {
      const data = await apiFetch<any>(`/templates/${templateId}/download`)
      if (data.file_url) {
        window.open(data.file_url, '_blank')
      } else {
        showToast('Файлын хаяг олдсонгүй')
      }
    } catch {
      showToast('Татан авахад алдаа гарлаа')
    }
    setDownloading(null)
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 16, right: 16, background: '#10B981', color: '#fff',
          padding: '10px 14px', borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          zIndex: 2000, fontSize: 13, pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Загварын дэлгүүр</h1>
          <div style={{ color: '#6B7280', fontSize: 13 }}>
            {loading ? 'Ачааллаж байна...' : `Нийт ${filtered.length} загвар`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map(c => (
            <a
              key={c}
              href={c === 'all' ? '/shop/templates' : `/shop/templates?category=${encodeURIComponent(c)}`}
              style={{
                padding: '8px 12px', borderRadius: 999,
                border: catFilter === c ? '2px solid #FF6B00' : '1px solid #E5E7EB',
                background: catFilter === c ? '#FFF7ED' : '#fff',
                color: '#1C1917', fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}
            >
              {c === 'all' ? 'Бүгд' : c}
            </a>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Уншиж байна...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Загвар олдсонгүй</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
          {filtered.map(t => {
            const priceNum = Number(t.price ?? 0)
            const owned = ownedIds.has(t.id)
            const isPurchasing = purchasing === t.id
            const isDownloading = downloading === t.id
            return (
              <div
                key={t.id}
                style={{
                  border: '1px solid #E5E7EB', borderRadius: 16, background: '#fff',
                  overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.04)',
                  transition: 'transform .15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
              >
                <div style={{ height: 160, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {t.thumbnail_url
                    ? <img src={t.thumbnail_url} alt={t.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#FFF7ED,#F3F4F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 40 }}>🎨</div>}
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#111' }}>{t.title || 'Загвар'}</div>
                  {t.designer_name && (
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>by {t.designer_name}</div>
                  )}
                  <div style={{ color: '#FF6B00', fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{fmt(priceNum)}</div>
                  {t.description && (
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                      {t.description}
                    </div>
                  )}
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{t.category || 'Төрөлгүй'}</span>
                    {owned ? (
                      <button
                        onClick={() => handleDownload(t.id)}
                        disabled={isDownloading}
                        style={{
                          background: '#10B981', color: '#fff', border: 'none',
                          padding: '8px 12px', borderRadius: 10, fontSize: 12,
                          fontWeight: 700, cursor: isDownloading ? 'not-allowed' : 'pointer',
                          opacity: isDownloading ? 0.6 : 1,
                        }}
                      >
                        {isDownloading ? 'Татаж байна...' : '⬇️ Татан авах'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePurchase(t.id)}
                        disabled={isPurchasing}
                        style={{
                          background: '#FF6B00', color: '#fff', border: 'none',
                          padding: '8px 12px', borderRadius: 10, fontSize: 12,
                          fontWeight: 700, cursor: isPurchasing ? 'not-allowed' : 'pointer',
                          opacity: isPurchasing ? 0.6 : 1,
                        }}
                      >
                        {isPurchasing ? 'Худалдаж байна...' : '💳 Худалдан авах'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function TemplatesShopPage() {
  return <Suspense><TemplatesShopInner /></Suspense>
}
