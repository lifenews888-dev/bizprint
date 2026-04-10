import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Бидний тухай | BizPrint',
  description: 'BizPrint — Монголын анхны AI-д суурилсан хэвлэлийн B2B платформ. Бидний эрхэм зорилго, баг, түүх.',
  openGraph: {
    title: 'Бидний тухай | BizPrint',
    description: 'Монголын хамгийн хурдан хэвлэлийн платформ',
    type: 'website',
  },
}

const TEAM = [
  { name: 'Б. Батболд', role: 'Үүсгэн байгуулагч & CEO', avatar: '👨‍💼', bio: 'Хэвлэлийн салбарт 10+ жилийн туршлагатай' },
  { name: 'Д. Сарантуяа', role: 'Технологийн захирал (CTO)', avatar: '👩‍💻', bio: 'Full-stack хөгжүүлэгч, AI шийдэл' },
  { name: 'Г. Энхбаяр', role: 'Үйлдвэрлэлийн захирал', avatar: '👨‍🔧', bio: 'Офсет, дижитал хэвлэлийн мэргэжилтэн' },
]

const TIMELINE = [
  { year: '2021', title: 'Байгуулагдсан', desc: 'BizPrint хэвлэлийн платформ санаа төрсөн', icon: '🚀' },
  { year: '2022', title: 'Анхны 100 харилцагч', desc: 'Хэвлэлийн салбарт шинэ стандарт бий болгосон', icon: '🎯' },
  { year: '2023', title: 'Платформ нээлт', desc: 'Бүрэн автоматжуулсан захиалгын систем ашиглалтад орсон', icon: '💡' },
  { year: '2024', title: 'AI нэвтрүүлсэн', desc: 'AI үнэ тооцоолуур, ухаалаг үйлдвэр сонголт нэвтрүүлсэн', icon: '🤖' },
]

const VALUES = [
  { icon: '⚡', title: 'Хурд', desc: 'Захиалга өгөхөөс хүргэлт хүртэл хамгийн хурдан' },
  { icon: '🎯', title: 'Чанар', desc: 'ISO стандартын дагуу чанарын баталгаа' },
  { icon: '🤝', title: 'Итгэлцэл', desc: 'Ил тод үнэ, escrow төлбөрийн систем' },
  { icon: '🌱', title: 'Инноваци', desc: 'AI технологиор салбарыг хөгжүүлнэ' },
]

const PARTNERS = ['🏭 Монпринт', '🏢 Адмон', '📦 Хурд экспресс', '🎨 Creative Hub', '💼 Дэлгэр']

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 99, background: 'rgba(255,107,0,0.1)', color: '#FF6B00', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Бидний тухай</span>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>Хэвлэлийн <span style={{ color: '#FF6B00' }}>ирээдүйг</span> бүтээж байна</h1>
        <p style={{ fontSize: 16, color: 'var(--text3)', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
          BizPrint нь Монголын анхны AI-д суурилсан хэвлэлийн B2B платформ юм. Бид технологиор хэвлэлийн салбарыг шинэ шатанд гаргана.
        </p>
      </div>

      {/* Mission */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 56 }}>
        <div style={{ padding: 24, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Эрхэм зорилго</h3>
          <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>Хэвлэлийн үйлчилгээг хүн бүрт хүртээмжтэй, хурдан, чанартай болгох</p>
        </div>
        <div style={{ padding: 24, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔭</div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Алсын хараа</h3>
          <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>Монголын хэвлэлийн #1 дижитал платформ болох</p>
        </div>
      </div>

      {/* Values */}
      <div style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 20, textAlign: 'center' }}>Бидний үнэт зүйлс</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {VALUES.map(v => (
            <div key={v.title} style={{ padding: 20, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{v.icon}</div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{v.title}</h4>
              <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 20, textAlign: 'center' }}>Манай баг</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {TEAM.map(t => (
            <div key={t.name} style={{ padding: 24, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px' }}>{t.avatar}</div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{t.name}</h4>
              <p style={{ fontSize: 12, color: '#FF6B00', fontWeight: 600, marginBottom: 6 }}>{t.role}</p>
              <p style={{ fontSize: 12, color: 'var(--text3)' }}>{t.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 20, textAlign: 'center' }}>Бидний түүх</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {TIMELINE.map((t, i) => (
            <div key={t.year} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: 20, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{t.icon}</div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#FF6B00' }}>{t.year}</span>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{t.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.5 }}>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Partners */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Хамтрагч байгууллагууд</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          {PARTNERS.map(p => (
            <div key={p} style={{ padding: '12px 24px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>{p}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
