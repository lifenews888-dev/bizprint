import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 80, fontWeight: 800, color: '#FF6B00', lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '16px 0 8px' }}>Хуудас олдсонгүй</h1>
        <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 28, lineHeight: 1.6 }}>Таны хайж буй хуудас байхгүй эсвэл зөөгдсөн байна.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/" style={{ padding: '12px 24px', borderRadius: 10, background: '#FF6B00', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Нүүр хуудас</Link>
          <Link href="/shop" style={{ padding: '12px 24px', borderRadius: 10, background: 'var(--surface2)', color: 'var(--text2)', textDecoration: 'none', fontSize: 14, border: '1px solid var(--border)' }}>Дэлгүүр</Link>
        </div>
      </div>
    </div>
  )
}
