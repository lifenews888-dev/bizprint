'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'

export default function AnnouncementBar() {
  const [text, setText] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const DISMISS_KEY = 'announcement_dismissed_until'
    const dismissedUntil = localStorage.getItem(DISMISS_KEY)
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return

    fetch(`${API}/settings/public`)
      .then(r => r.json())
      .then(data => {
        const m: Record<string, string> = {}
        if (Array.isArray(data)) data.forEach((s: any) => { m[s.key] = s.value })
        else if (data && typeof data === 'object') Object.assign(m, data)
        const msg = m['announcement_text'] || m['announcementText']
        if (msg) { setText(msg); setVisible(true) }
      })
      .catch(() => {})
  }, [])

  const dismiss = () => {
    localStorage.setItem('announcement_dismissed_until', String(Date.now() + 24 * 60 * 60 * 1000))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      background: 'linear-gradient(90deg, #FF6B00, #e05500)',
      color: '#fff', textAlign: 'center', padding: '8px 40px 8px 16px',
      fontSize: '13px', fontWeight: 500, position: 'relative',
      fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
    }}>
      {text}
      <button onClick={dismiss} style={{
        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
        cursor: 'pointer', fontSize: '18px', lineHeight: 1,
      }}>×</button>
    </div>
  )
}
