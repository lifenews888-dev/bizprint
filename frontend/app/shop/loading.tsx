export default function ShopLoading() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ height: 32, width: 200, background: 'var(--surface2)', borderRadius: 8, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ aspectRatio: '1', background: 'var(--surface2)', animation: 'pulse 1.5s infinite' }} />
            <div style={{ padding: 14 }}>
              <div style={{ height: 14, background: 'var(--surface2)', borderRadius: 6, marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: 14, background: 'var(--surface2)', borderRadius: 6, width: '60%', animation: 'pulse 1.5s infinite' }} />
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
