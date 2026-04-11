'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiFetch, getToken } from '@/lib/api'

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<any>('/templates?status=approved')
      .then(data => { setTemplates(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const seed = async () => {
    try {
      const data = await apiFetch<any>('/templates/seed')
      alert(`${data?.seeded || 0} загвар нэмэгдлээ`)
      window.location.reload()
    } catch (e: any) {
      alert('Алдаа: ' + (e.message || ''))
    }
  }

  const toggleActive = async (id: string, current: boolean) => {
    await apiFetch(`/templates/${id}`, { method: 'PATCH', body: { is_active: !current } })
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, is_active: !current } : t))
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Загвар сан</h1>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{templates.length} загвар</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={seed} style={{ padding: '8px 16px', border: '1px solid #FF6B00', background: 'transparent', color: '#FF6B00', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}>
            + Seed загварууд
          </button>
          <Link href="/design/editor" style={{ padding: '8px 16px', background: '#FF6B00', color: '#fff', borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            + Шинэ загвар
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Ачааллаж байна...</div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>📐</p>
          <p style={{ color: 'var(--text3)', marginBottom: 16 }}>Загвар байхгүй байна</p>
          <button onClick={seed} style={{ padding: '10px 20px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Seed загварууд оруулах
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {templates.map(t => (
            <div key={t.id} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', opacity: t.is_active === false ? 0.5 : 1 }}>
              <div style={{ aspectRatio: '3/4', background: 'var(--surface2)', position: 'relative', overflow: 'hidden' }}>
                <img src={t.thumbnail_url || ''} alt={t.title_mn || t.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
              <div style={{ padding: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title_mn || t.title}</p>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>{t.category} · {t.use_count || 0} ашигласан</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Link href={`/design/editor?templateId=${t.id}&type=${t.category}`} style={{ flex: 1, padding: '6px 0', textAlign: 'center', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text2)', textDecoration: 'none' }}>
                    Засах
                  </Link>
                  <button onClick={() => toggleActive(t.id, t.is_active !== false)} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, border: 'none', cursor: 'pointer', background: t.is_active !== false ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: t.is_active !== false ? '#EF4444' : '#10B981' }}>
                    {t.is_active !== false ? 'Нуух' : 'Идэвхжүүлэх'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
