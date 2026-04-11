'use client'
import { useState } from 'react'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

export default function AnnouncementBar() {
  const { settings } = useSiteSettings()
  const [dismissed, setDismissed] = useState(false)

  const active = settings.header_announcement_active === true
  const text = settings.header_announcement || ''
  const color = settings.header_announcement_color || '#FF6B35'

  if (!active || !text || dismissed) return null

  return (
    <div style={{
      background: `linear-gradient(90deg, ${color}, ${color}dd)`,
      color: '#fff', textAlign: 'center', padding: '6px 40px 6px 16px',
      fontSize: '12px', fontWeight: 500, position: 'relative',
      fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
    }}>
      {text}
      <button onClick={() => setDismissed(true)} style={{
        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
        cursor: 'pointer', fontSize: '18px', lineHeight: 1,
      }}>×</button>
    </div>
  )
}
