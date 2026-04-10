import type { Metadata } from 'next'

export const metadata: Metadata = { robots: 'noindex' }

export default function GalleryPage() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🖼️</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Удахгүй нээлтэй</h1>
      <p style={{ fontSize: 15, color: 'var(--text3)', maxWidth: 400, lineHeight: 1.6, marginBottom: 24 }}>
        Хэвлэлийн бүтээлүүдийн галерей удахгүй нээгдэнэ. Манай хамгийн шилдэг ажлуудыг үзнэ.
      </p>
      <a href="/shop" style={{ padding: '12px 28px', borderRadius: 10, background: '#FF6B00', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Дэлгүүр үзэх →</a>
    </div>
  )
}
