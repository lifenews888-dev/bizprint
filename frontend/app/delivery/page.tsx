'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

const DEFAULTS = {
  hero_title: 'Хүргэлтийн мэдээлэл',
  hero_desc: 'Бид таны захиалгыг хурдан, найдвартай хүргэнэ',
  zones: [
    { icon: '🏙️', name: 'Улаанбаатар хот', time: '1-3 ажлын өдөр', price: '5,000₮-аас' },
    { icon: '🏔️', name: 'Аймгийн төв', time: '3-7 ажлын өдөр', price: '10,000₮-аас' },
    { icon: '📮', name: 'Сумын төв', time: '7-14 ажлын өдөр', price: '15,000₮-аас' },
  ],
  policies: [
    { icon: '🆓', title: 'Үнэгүй хүргэлт', desc: '50,000₮-с дээш захиалгад Улаанбаатар хотод үнэгүй' },
    { icon: '📦', title: 'Сав баглаа', desc: 'Бүтээгдэхүүн бүрийг найдвартай савлаж хүргэнэ' },
    { icon: '📱', title: 'Бодит цагийн хяналт', desc: 'Dashboard-аас хүргэлтийн байршлыг хянах боломжтой' },
    { icon: '🔄', title: 'Буцаалт', desc: 'Чанарын алдаатай бол 48 цагийн дотор буцаалт хүсэлт гаргана' },
  ],
}

export default function DeliveryPage() {
  const [d, setD] = useState(DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    apiFetch<any>('/pages/delivery', { auth: false })
      .then(page => {
        if (page?.metadata) {
          const m = page.metadata
          setD(prev => ({
            hero_title: m.hero_title || prev.hero_title,
            hero_desc: m.hero_desc || prev.hero_desc,
            zones: m.zones?.length ? m.zones : prev.zones,
            policies: m.policies?.length ? m.policies : prev.policies,
          }))
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded) return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 20px', textAlign: 'center' }}>
      <div style={{ color: 'var(--text3)', fontSize: 14 }}>Ачааллаж байна...</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 20px', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 99, background: 'rgba(255,107,0,0.1)', color: '#FF6B00', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>🚚 Хүргэлт</span>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>{d.hero_title}</h1>
        <p style={{ fontSize: 14, color: 'var(--text3)' }}>{d.hero_desc}</p>
      </div>

      {/* Zones */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 16, textAlign: 'center' }}>Хүргэлтийн бүсүүд</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {d.zones.map((z: any) => (
            <div key={z.name} style={{ padding: 24, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{z.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{z.name}</h3>
              <p style={{ fontSize: 13, color: '#FF6B00', fontWeight: 600, marginBottom: 4 }}>{z.time}</p>
              <p style={{ fontSize: 13, color: 'var(--text3)' }}>{z.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Policies */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 16, textAlign: 'center' }}>Хүргэлтийн нөхцөл</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {d.policies.map((p: any) => (
            <div key={p.title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: 20, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{p.icon}</div>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{p.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.5 }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: 32, borderRadius: 16, background: 'rgba(255,107,0,0.05)', border: '1px solid rgba(255,107,0,0.2)' }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Хүргэлтийн талаар асуух зүйл байна уу?</p>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Бидэнтэй холбогдоорой</p>
        <a href="/contact" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 10, background: '#FF6B00', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Холбоо барих</a>
      </div>
    </div>
  )
}
