const pulse = { animation: 'pulse 1.5s infinite' }

export function ProductCardSkeleton() {
  return (
    <div>
      <div style={{ aspectRatio: '1', background: 'var(--surface2)', borderRadius: 14, marginBottom: 10, ...pulse }} />
      <div style={{ height: 12, background: 'var(--surface2)', borderRadius: 6, marginBottom: 6, width: '75%', ...pulse }} />
      <div style={{ height: 12, background: 'var(--surface2)', borderRadius: 6, width: '50%', ...pulse }} />
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }} className="stack-mobile">
        <div style={{ aspectRatio: '4/3.5', background: 'var(--surface2)', borderRadius: 16, ...pulse }} />
        <div>
          <div style={{ height: 20, background: 'var(--surface2)', borderRadius: 8, marginBottom: 12, width: '60%', ...pulse }} />
          <div style={{ height: 14, background: 'var(--surface2)', borderRadius: 6, marginBottom: 8, width: '40%', ...pulse }} />
          <div style={{ height: 48, background: 'var(--surface2)', borderRadius: 12, marginBottom: 16, ...pulse }} />
          <div style={{ height: 120, background: 'var(--surface2)', borderRadius: 12, marginBottom: 16, ...pulse }} />
          <div style={{ height: 44, background: 'var(--surface2)', borderRadius: 10, ...pulse }} />
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
