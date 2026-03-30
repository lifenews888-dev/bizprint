'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface PageData {
  id: string; title: string; slug: string; content: string
  template: string; thumbnail: string; metadata: any; is_published: boolean
}

export default function DynamicPage() {
  const { slug } = useParams()
  const [page, setPage] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/pages/${slug}`).then(r => r.ok ? r.json() : null)
      .then(d => { setPage(d?.data || d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Ачааллаж байна...</div>
  if (!page) return <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
    <div style={{ fontSize: 48 }}>404</div>
    <div style={{ color: '#888' }}>Хуудас олдсонгүй</div>
  </div>

  // Template-based rendering
  if (page.template === 'contact') return <ContactTemplate page={page} />
  if (page.template === 'services') return <ServicesTemplate page={page} />
  if (page.template === 'landing') return <LandingTemplate page={page} />

  // Default template
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>{page.title}</h1>
      {page.content && <div dangerouslySetInnerHTML={{ __html: page.content }} style={{ fontSize: 16, lineHeight: 1.8, color: '#374151' }} />}
    </div>
  )
}

function ContactTemplate({ page }: { page: PageData }) {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{page.title}</h1>
      {page.content && <div dangerouslySetInnerHTML={{ __html: page.content }} style={{ marginBottom: 24, color: '#555', lineHeight: 1.7 }} />}
      <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <input placeholder="Нэр" style={inputStyle} />
          <input placeholder="Имэйл" type="email" style={inputStyle} />
          <input placeholder="Утас" style={inputStyle} />
          <textarea placeholder="Мессеж" rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
          <button style={{ background: '#f97316', color: '#fff', border: 'none', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Илгээх</button>
        </div>
      </div>
    </div>
  )
}

function ServicesTemplate({ page }: { page: PageData }) {
  const services = page.metadata?.services || []
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>{page.title}</h1>
      {page.content && <p style={{ textAlign: 'center', color: '#888', marginBottom: 32 }}>{page.content}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
        {services.map((s: any, i: number) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon || '📦'}</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{s.title}</h3>
            <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function LandingTemplate({ page }: { page: PageData }) {
  return (
    <div>
      <div style={{ background: '#f97316', color: '#fff', padding: '60px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>{page.title}</h1>
        {page.metadata?.subtitle && <p style={{ fontSize: 18, opacity: 0.9 }}>{page.metadata.subtitle}</p>}
      </div>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        {page.content && <div dangerouslySetInnerHTML={{ __html: page.content }} style={{ fontSize: 16, lineHeight: 1.8, color: '#374151' }} />}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, background: '#fff' }
