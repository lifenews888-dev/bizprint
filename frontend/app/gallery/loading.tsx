export default function GalleryLoading() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ height: 28, width: 240, background: 'var(--surface2)', borderRadius: 8, margin: '0 auto 8px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 14, width: 180, background: 'var(--surface2)', borderRadius: 6, margin: '0 auto', animation: 'pulse 1.5s infinite' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ height: 36, width: 80, background: 'var(--surface2)', borderRadius: 20, animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
      <div style={{ columnCount: 3, columnGap: 16 }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ breakInside: 'avoid', marginBottom: 16, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ height: 160 + (i % 3) * 60, background: 'var(--surface2)', animation: 'pulse 1.5s infinite' }} />
            <div style={{ padding: 12 }}>
              <div style={{ height: 12, background: 'var(--surface2)', borderRadius: 6, marginBottom: 6, width: '70%', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: 10, background: 'var(--surface2)', borderRadius: 6, width: '50%', animation: 'pulse 1.5s infinite' }} />
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
