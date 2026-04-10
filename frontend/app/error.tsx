'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Алдаа гарлаа</h2>
        <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 24 }}>Уучлаарай, ямар нэг алдаа гарлаа.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={reset} style={{ padding: '12px 24px', borderRadius: 10, background: '#FF6B00', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Дахин оролдох</button>
          <Link href="/" style={{ padding: '12px 24px', borderRadius: 10, background: 'var(--surface2)', color: 'var(--text2)', textDecoration: 'none', fontSize: 14, border: '1px solid var(--border)' }}>Нүүр хуудас</Link>
        </div>
      </div>
    </div>
  )
}
