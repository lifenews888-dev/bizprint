import Link from 'next/link'

const FEATURES = [
  { icon: '🎨', title: 'Өөрийн брэнд', desc: 'Лого, өнгө, домэйнийг өөрчилж болно' },
  { icon: '🏪', title: 'Өөрийн дэлгүүр', desc: 'Бүтээгдэхүүний каталог, үнэ тохируулга' },
  { icon: '💰', title: 'Орлого хуваалцах', desc: 'Захиалга бүрт шимтгэл олно' },
  { icon: '⚡', title: 'Хурдан нэвтрэх', desc: '24 цагт ажиллуулж эхлэх боломж' },
  { icon: '📊', title: 'Dashboard', desc: 'Захиалга, орлого, харилцагчдыг хянах' },
  { icon: '🤝', title: 'Дэмжлэг', desc: 'Техник болон маркетингийн дэмжлэг' },
]

export default function WhitelabelPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <span style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#8B5CF6', fontSize: 12, fontWeight: 600, borderRadius: 20, marginBottom: 16 }}>Print-as-a-Service</span>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Өөрийн хэвлэлийн платформ</h1>
        <p style={{ fontSize: 14, color: 'var(--text3)', maxWidth: 520, margin: '0 auto' }}>BizPrint-ийн технологийг ашиглан өөрийн брэндтэй хэвлэлийн онлайн дэлгүүр нээж орлого олоорой.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14, marginBottom: 40 }}>
        {FEATURES.map(f => (
          <div key={f.title} style={{ padding: 20, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{f.title}</h3>
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--surface)', marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', textAlign: 'center', marginBottom: 20 }}>Хэрхэн ажилладаг вэ</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, textAlign: 'center' }}>
          {[
            { n: '01', t: 'Бүртгүүлэх', d: 'Домэйн болон брэнд мэдээлэл оруулах' },
            { n: '02', t: 'Тохируулах', d: 'Лого, өнгө, бүтээгдэхүүн сонгох' },
            { n: '03', t: 'Нээлт хийх', d: 'Хэрэглэгчдийг урих, захиалга хүлээн авах' },
            { n: '04', t: 'Орлого олох', d: 'Захиалга бүрт шимтгэл авах' },
          ].map(s => (
            <div key={s.n}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'rgba(139,92,246,0.2)', marginBottom: 8 }}>{s.n}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{s.t}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '36px 24px', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Сонирхож байна уу?</h2>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>Манай багтай холбогдож дэлгэрэнгүй мэдээлэл авна уу</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <a href="mailto:info@bizprint.mn?subject=White-label сонирхол" style={{ padding: '12px 24px', background: '#8B5CF6', color: '#fff', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Холбогдох</a>
          <Link href="/contact" style={{ padding: '12px 24px', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text2)', textDecoration: 'none', fontSize: 14 }}>Дэлгэрэнгүй</Link>
        </div>
      </div>
    </div>
  )
}
