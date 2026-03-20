'use client'
import { useState, useRef, useEffect } from 'react'

const API = 'http://localhost:4000'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([
    { from: 'bot', text: 'Сайн байна уу! BizPrint-д тавтай морил. Танд юугаар туслах вэ?' },
  ])
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = () => {
    if (!input.trim()) return
    const q = input.trim()
    setMessages(prev => [...prev, { from: 'user', text: q }])
    setInput('')
    // Simple auto-reply (can be replaced with AI endpoint)
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'bot', text: 'Баярлалаа! Таны мессежийг хүлээн авлаа. Удахгүй хариулах болно.' }])
    }, 800)
  }

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(!open)} className="chat-widget" style={{
        position: 'fixed', bottom: '24px', right: '24px', width: '52px', height: '52px',
        borderRadius: '50%', background: '#FF6B00', border: 'none', cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(255,107,0,0.4)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000, transition: 'transform 0.2s',
      }}>
        <span style={{ fontSize: '22px', color: '#fff' }}>{open ? '×' : '💬'}</span>
      </button>

      {/* Chat box */}
      {open && (
        <div className="chat-box" style={{
          position: 'fixed', bottom: '88px', right: '24px', width: '360px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '16px', overflow: 'hidden', zIndex: 1000,
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column',
          maxHeight: '480px',
          fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
        }}>
          {/* Header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#fff', fontWeight: 600 }}>B</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>BizPrint</div>
              <div style={{ fontSize: '11px', color: '#10B981' }}>● Онлайн</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                <div style={{
                  padding: '10px 14px', borderRadius: '12px', fontSize: '13px', lineHeight: 1.5,
                  background: m.from === 'user' ? '#FF6B00' : 'var(--surface2)',
                  color: m.from === 'user' ? '#fff' : 'var(--text)',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Мессеж бичих..."
              style={{ flex: 1, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '13px', color: 'var(--text)', outline: 'none' }} />
            <button onClick={send} style={{ padding: '10px 16px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>→</button>
          </div>
        </div>
      )}
    </>
  )
}
