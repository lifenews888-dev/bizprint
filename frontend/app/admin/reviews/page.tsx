'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

interface Review { id: string; customer_name: string; customer_company: string; rating: number; text: string; product_category: string; is_approved: boolean; created_at: string }

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<Review[]>('/reviews').then(setReviews).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const approve = async (id: string) => {
    await apiFetch(`/reviews/${id}/approve`, { method: 'PATCH' })
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: true } : r))
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Ачааллаж байна...</div>

  return (
    <div style={{ padding: '24px 20px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Сэтгэгдлүүд ({reviews.length})</h1>
      {reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>💬</div>
          <p>Сэтгэгдэл байхгүй</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map(r => (
            <div key={r.id} style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{r.customer_name}</span>
                  {r.customer_company && <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 8 }}>— {r.customer_company}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#F59E0B', fontSize: 13 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  {r.is_approved ? (
                    <span style={{ padding: '2px 10px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 11, fontWeight: 600 }}>Батлагдсан</span>
                  ) : (
                    <button onClick={() => approve(r.id)} style={{ padding: '4px 12px', borderRadius: 8, background: '#FF6B00', color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Батлах</button>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 4 }}>{r.text}</p>
              <div style={{ fontSize: 11, color: 'var(--text4)' }}>
                {r.product_category && <span>{r.product_category} • </span>}
                {new Date(r.created_at).toLocaleDateString('mn-MN')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
