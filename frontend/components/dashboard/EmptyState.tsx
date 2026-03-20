'use client'

interface Props {
  icon?: string
  title: string
  message?: string
  ctaText?: string
  ctaHref?: string
  onCtaClick?: () => void
}

export default function EmptyState({ icon = '📭', title, message, ctaText, ctaHref, onCtaClick }: Props) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: '0 0 8px' }}>{title}</h3>
      {message && <p style={{ fontSize: 14, color: 'var(--text2)', margin: '0 0 20px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>{message}</p>}
      {ctaText && (
        ctaHref ? (
          <a href={ctaHref} style={{ display: 'inline-block', padding: '10px 24px', background: '#FF6A00', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>{ctaText}</a>
        ) : (
          <button onClick={onCtaClick} style={{ padding: '10px 24px', background: '#FF6A00', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>{ctaText}</button>
        )
      )}
    </div>
  )
}
