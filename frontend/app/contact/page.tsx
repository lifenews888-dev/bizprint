import type { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Холбоо барих | BizPrint',
  description: 'BizPrint-тэй холбоо барих. Утас, имэйл, хаяг.',
  alternates: { canonical: 'https://bizprint.mn/contact' },
}

const INFO = [
  { icon: '📞', title: 'Утас', value: '+976 7711-7700', link: 'tel:+97677117700' },
  { icon: '📧', title: 'И-мэйл', value: 'info@bizprint.mn', link: 'mailto:info@bizprint.mn' },
  { icon: '📍', title: 'Хаяг', value: 'Улаанбаатар, Монгол', link: null },
  { icon: '🕐', title: 'Цагийн хуваарь', value: 'Даваа-Баасан: 09:00-18:00', link: null },
]

export default function ContactPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>Холбоо <span style={{ color: '#FF6B00' }}>барих</span></h1>
        <p style={{ fontSize: 14, color: 'var(--text3)', marginTop: 4 }}>Асуулт, санал хүсэлт байвал бидэнтэй холбогдоорой</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
        {INFO.map(item => (
          <div key={item.title} style={{ padding: 20, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{item.title}</p>
            {item.link ? (
              <a href={item.link} style={{ fontSize: 14, fontWeight: 600, color: '#FF6B00', textDecoration: 'none' }}>{item.value}</a>
            ) : (
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{item.value}</p>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <a href="https://facebook.com/bizprint.mn" target="_blank" rel="noopener noreferrer" style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)', textDecoration: 'none', fontSize: 13 }}>🔵 Facebook</a>
        <a href="https://instagram.com/bizprint.mn" target="_blank" rel="noopener noreferrer" style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)', textDecoration: 'none', fontSize: 13 }}>🟣 Instagram</a>
      </div>
    </div>
  )
}
