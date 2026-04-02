'use client'
import { useState, useRef, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { Bot, Send, Loader2, Sparkles, Wrench } from 'lucide-react'

interface AiMsg {
  role: 'user' | 'assistant'
  text: string
  tools?: string[]
  timestamp: string
}

function getUser() {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
}

export default function AiChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<AiMsg[]>([
    { role: 'assistant', text: 'Сайн байна уу! Би BizPrint AI туслах. Та юу хийхийг хүсэж байна?\n\n🖨️ Үнэ бодох\n📦 Захиалга шалгах\n🏭 Үйлдвэрлэлийн мэдээлэл\n💡 Бүтээгдэхүүн санал авах', tools: [], timestamp: new Date().toISOString() },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const user = getUser()
    if (!user?.id) { setMessages(prev => [...prev, { role: 'assistant', text: 'Нэвтэрсний дараа AI Agent ашиглах боломжтой.', tools: [], timestamp: new Date().toISOString() }]); return }

    setInput('')
    setMessages(prev => [...prev, { role: 'user', text, tools: [], timestamp: new Date().toISOString() }])
    setLoading(true)

    try {
      const res = await apiFetch<any>('/ai/agent/chat', {
        method: 'POST',
        body: { message: text, conversationHistory },
      })
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: res.reply || 'Хариу ирсэнгүй.',
        tools: res.toolsUsed || [],
        timestamp: new Date().toISOString(),
      }])
      // Keep last 20 messages in history to avoid token overflow
      if (res.conversationHistory) {
        const hist = res.conversationHistory.slice(-20)
        setConversationHistory(hist)
      }
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `Алдаа: ${e.message || 'Серверт холбогдож чадсангүй'}`,
        tools: [],
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E55D00] text-white shadow-lg shadow-[#FF6B00]/30 flex items-center justify-center hover:scale-105 transition-transform z-[9999] cursor-pointer">
        <Bot className="w-6 h-6" strokeWidth={1.5} />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 left-6 w-[380px] max-w-[calc(100vw-24px)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl z-[9999] flex flex-col overflow-hidden"
      style={{ height: 540, maxHeight: 'calc(100vh - 48px)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#FF6B00] to-[#E55D00] text-white shrink-0">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold">BizPrint AI</div>
          <div className="text-[10px] opacity-80">Хэвлэлийн ухаалаг туслах</div>
        </div>
        <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 cursor-pointer text-sm font-bold">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#FF6B00] text-white rounded-br-sm'
                : 'bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)] rounded-bl-sm'
            }`}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
              {msg.tools && msg.tools.length > 0 && (
                <div className={`flex flex-wrap gap-1 mt-2 pt-2 border-t ${
                  msg.role === 'user' ? 'border-white/20' : 'border-[var(--border)]'
                }`}>
                  {msg.tools.map((t, j) => (
                    <span key={j} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                      msg.role === 'user' ? 'bg-white/20 text-white' : 'bg-[#FF6B00]/10 text-[#FF6B00]'
                    }`}>
                      <Wrench className="w-2.5 h-2.5" />{t.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-xl px-4 py-3 flex items-center gap-2 text-[var(--text3)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Бодож байна...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[var(--border)] px-3 py-2.5 flex items-center gap-2">
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Асуух зүйлээ бичнэ үү..."
          disabled={loading}
          className="flex-1 h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text)] outline-none focus:border-[#FF6B00] transition-colors disabled:opacity-50" />
        <button onClick={send} disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center hover:bg-[#E55D00] transition-colors disabled:opacity-30 cursor-pointer shrink-0">
          <Send className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
