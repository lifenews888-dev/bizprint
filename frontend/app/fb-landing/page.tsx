import Link from 'next/link'

export const metadata = {
  title: 'Хэвлэлийн захиалга | BizPrint',
  description: 'Нэрийн хуудас, флаер, баннер — онлайнаар захиалж хүргүүлнэ',
  openGraph: {
    title: 'Хэвлэлийн захиалга — BizPrint',
    description: '500 флаер = 89,000₮-с. 3 хоногт хүргэнэ.',
  },
}

export default function FBLandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #0A0A0A, #111)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px', textAlign: 'center' }}>
        <p style={{ color: '#FF6B00', fontWeight: 600, marginBottom: 12, fontSize: 14 }}>BizPrint — Хэвлэлийн платформ</p>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 12 }}>
          Нэрийн хуудас,<br />Флаер, Баннер
        </h1>
        <p style={{ color: '#999', fontSize: 16, marginBottom: 8 }}>онлайнаар захиалж, хаана ч хүргүүлнэ</p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32, marginBottom: 36, flexWrap: 'wrap' }}>
          {[
            { product: 'Нэрийн хуудас', price: 'Загвар үнэгүй', icon: '💳', qty: 'editor' },
            { product: 'A5 Флаер', price: '89,000₮-с', icon: '📄', qty: '500ш' },
            { product: 'Роллап', price: '85,000₮-с', icon: '🏗️', qty: '1ш' },
          ].map(p => (
            <div key={p.product} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 16, padding: 20, textAlign: 'center', minWidth: 140 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
              <p style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{p.product}</p>
              <p style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{p.qty}</p>
              <p style={{ color: '#FF6B00', fontWeight: 700, marginTop: 8, fontSize: 15 }}>{p.price}</p>
            </div>
          ))}
        </div>

        <Link href="/business-cards" style={{ display: 'inline-block', padding: '16px 48px', background: '#FF6B00', color: '#fff', fontWeight: 700, fontSize: 17, borderRadius: 16, textDecoration: 'none', boxShadow: '0 8px 24px rgba(255,107,0,0.3)' }}>
          Нэрийн хуудас үнэгүй бүтээх →
        </Link>
        <p style={{ color: '#666', fontSize: 13, marginTop: 12 }}>30 минутад хариу өгнө</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 40 }}>
          {[
            { n: '1,200+', l: 'захиалга' },
            { n: '4.8★', l: 'үнэлгээ' },
            { n: '3 хоног', l: 'хүргэлт' },
          ].map(s => (
            <div key={s.l}>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{s.n}</p>
              <p style={{ fontSize: 11, color: '#666' }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
