'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const MESSENGER_LINK = 'https://m.me/260665651249363'

function useSettings() {
  const [map, setMap] = useState<Record<string,string>>({})
  useEffect(() => {
    fetch(`${API}/settings/public`)
      .then(r => r.json())
      .then(data => {
        const m: Record<string,string> = {}
        if (Array.isArray(data)) data.forEach((s: any) => { m[s.key] = s.value })
        else if (data && typeof data === 'object') Object.assign(m, data)
        setMap(m)
      }).catch(() => {})
  }, [])
  return map
}

export function AnnouncementBar() {
  const s = useSettings()
  const [visible, setVisible] = useState(true)
  if (!s['marketing_banner_text'] || !visible) return null
  return (
    <div style={{ background: 'linear-gradient(135deg,var(--orange),#FF8C42)', color: '#fff', textAlign: 'center', padding: '10px 48px', fontSize: 14, fontWeight: 600, position: 'relative', zIndex: 100 }}>
      {s['marketing_banner_text']}
      <button onClick={() => setVisible(false)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, opacity: 0.7 }}>✕</button>
    </div>
  )
}

export function ChatWidget() {
  const s = useSettings()
  const [open, setOpen] = useState(false)
  const waNumber = (s['social_whatsapp'] || '').replace(/[^0-9]/g, '')

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
      {open && (
        <div style={{ position: 'absolute', bottom: 72, right: 0, width: 320, borderRadius: 20, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.2)', border: '1px solid rgba(0,0,0,0.08)' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,var(--orange),#FF8C42)', padding: '20px 20px 16px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🖨️</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>BizPrint</div>
                <div style={{ fontSize: 12, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                  Онлайн байна
                </div>
              </div>
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>
              Хэвлэлийн үнэ, захиалгын талаар асуух зүйл байвал бичнэ үү!
            </div>
          </div>

          {/* Body */}
          <div style={{ background: '#f8f8f8', padding: '16px 16px 8px' }}>
            <div style={{ background: '#fff', borderRadius: '4px 16px 16px 16px', padding: '10px 14px', fontSize: 13, color: '#333', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 4, lineHeight: 1.5 }}>
              Сайн байна уу! Та ямар бүтээгдэхүүн хэвлүүлэхийг хүсэж байна вэ? 😊
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>BizPrint • Дөнгөж сая</div>
          </div>

          {/* Channel buttons */}
          <div style={{ background: '#fff', padding: '12px 16px 16px', display: 'flex', flexDirection: 'column' as any, gap: 10 }}>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' as any, letterSpacing: '0.05em' }}>Холбогдох арга сонгоно уу</div>

            {waNumber && (
              <a href={'https://wa.me/' + waNumber + '?text=' + encodeURIComponent('Сайн байна уу! Үнийн санал авмаар байна.')}
                target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #86efac', textDecoration: 'none', color: '#166534', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#dcfce7')}
                onMouseLeave={e => (e.currentTarget.style.background = '#f0fdf4')}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>💬</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>WhatsApp</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>Хурдан хариу өгнө</div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 16 }}>→</span>
              </a>
            )}

            <a href={MESSENGER_LINK} onClick={(e) => { e.preventDefault(); window.open(MESSENGER_LINK, "messenger", "width=400,height=600,left=" + (window.screen.width/2-200) + ",top=" + (window.screen.height/2-300)) }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: '#eff6ff', border: '1px solid #93c5fd', textDecoration: 'none', color: '#1e40af', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#dbeafe')}
              onMouseLeave={e => (e.currentTarget.style.background = '#eff6ff')}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#0084ff,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>💙</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Facebook Messenger</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>bizprintpro хуудас</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 16 }}>→</span>
            </a>

            <a href="tel:+97680801677"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa', textDecoration: 'none', color: '#9a3412', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#ffedd5')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff7ed')}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📞</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Утсаар залгах</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>+976 8080-1677</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 16 }}>→</span>
            </a>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button onClick={() => setOpen(!open)}
        style={{ width: 60, height: 60, borderRadius: '50%', background: open ? '#6b7280' : 'linear-gradient(135deg,var(--orange),#FF8C42)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: open ? 22 : 28, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 24px var(--orange-40)', transition: 'all 0.3s' }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
        {open ? '✕' : '💬'}
      </button>
    </div>
  )
}

export function WhatsAppButton() { return null }
export function FacebookMessenger() { return null }

export function SocialLinks() {
  const s = useSettings()
  const socials = [
    { key: 'social_facebook',  icon: '📘', label: 'Facebook' },
    { key: 'social_instagram', icon: '📷', label: 'Instagram' },
    { key: 'social_twitter',   icon: '🐦', label: 'Twitter' },
    { key: 'social_youtube',   icon: '▶️', label: 'YouTube' },
    { key: 'social_tiktok',    icon: '🎵', label: 'TikTok' },
  ].filter(sc => s[sc.key])
  if (!socials.length) return null
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {socials.map(sc => (
        <a key={sc.key} href={s[sc.key]} target="_blank" rel="noreferrer"
          style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--orange-10)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 16 }}
          title={sc.label}>{sc.icon}</a>
      ))}
    </div>
  )
}

export function SocialProofBadge() {
  const s = useSettings()
  if (!s['marketing_social_proof_text']) return null
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '6px 14px', fontSize: 13, color: '#10B981' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
      {s['marketing_social_proof_text']}
    </div>
  )
}