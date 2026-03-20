'use client'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

export default function Footer() {
  const year = new Date().getFullYear()

  const sections = [
    {
      title: 'Бүтээгдэхүүн',
      links: [
        { label: 'Визит карт', href: '/shop?cat=business-card' },
        { label: 'Флаер & Постер', href: '/shop?cat=flyer' },
        { label: 'Баннер', href: '/shop?cat=banner' },
        { label: 'Ном & Каталог', href: '/shop?cat=book' },
        { label: 'Хайрцаг & Уут', href: '/shop?cat=packaging' },
      ],
    },
    {
      title: 'Үйлчилгээ',
      links: [
        { label: 'Үнийн санал', href: '/quote' },
        { label: 'Онлайн дизайн', href: '/designer' },
        { label: 'Хүргэлт', href: '/delivery' },
        { label: 'Партнер хөтөлбөр', href: '/partner' },
      ],
    },
    {
      title: 'Компани',
      links: [
        { label: 'Бидний тухай', href: '/about' },
        { label: 'Холбоо барих', href: '/contact' },
        { label: 'Үйлчилгээний нөхцөл', href: '/terms' },
        { label: 'Нууцлалын бодлого', href: '/privacy' },
      ],
    },
  ]

  return (
    <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', fontFamily: F, color: 'var(--text)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '40px', marginBottom: '48px' }} className="grid-4">
          {/* Brand */}
          <div>
            <a href="/" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', textDecoration: 'none', display: 'inline-block', marginBottom: '14px' }}>
              <span style={{ color: '#FF6B00' }}>Biz</span>Print
            </a>
            <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7, margin: '0 0 20px' }}>
              Хэвлэлийн салбарын бүх оролцогчдыг нэгтгэсэн нэгдсэн экосистем.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['📘', '📷', '🐦'].map((icon, i) => (
                <a key={i} href="#" style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '14px' }}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {sections.map(s => (
            <div key={s.title}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.title}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {s.links.map(l => (
                  <a key={l.href} href={l.href} style={{ fontSize: '13px', color: 'var(--text2)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FF6B00')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text2)')}>
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text3)', margin: 0 }}>© {year} BizPrint. Бүх эрх хуулиар хамгаалагдсан.</p>
          <p style={{ fontSize: '12px', color: 'var(--text3)', margin: 0 }}>Улаанбаатар, Монгол</p>
        </div>
      </div>
    </footer>
  )
}
