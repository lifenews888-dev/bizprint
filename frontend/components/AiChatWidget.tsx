'use client'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { Send, Loader2, Sparkles, Wrench, X, Megaphone } from 'lucide-react'

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

// ─── Цагаас хамааран мэндчилгээ ──────────────────────────────
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return 'Сайхан шөнө! 🌙'
  if (hour < 12) return 'Өглөөний мэнд! ☀️'
  if (hour < 17) return 'Өдрийн мэнд! 👋'
  if (hour < 21) return 'Оройн мэнд! 🌆'
  return 'Сайхан орой! 🌙'
}

// ─── Хуудаснаас хамааран контекст мэдээлэл ──────────────────
function getPageContext(pathname: string): string {
  if (pathname === '/' || pathname === '') return 'home'
  if (pathname.startsWith('/shop')) return 'shop'
  if (pathname.startsWith('/product')) return 'product'
  if (pathname.startsWith('/quote') || pathname.startsWith('/quote?tab=ai')) return 'quote'
  if (pathname.startsWith('/cart') || pathname.startsWith('/checkout')) return 'cart'
  if (pathname.startsWith('/dashboard')) return 'dashboard'
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/gallery')) return 'gallery'
  return 'other'
}

function getContextMessage(context: string, user: any): AiMsg[] {
  const name = user?.full_name || user?.name || ''
  const greeting = getGreeting()
  const nameGreet = name ? `${name}, ${greeting.toLowerCase()}` : greeting

  const msgs: Record<string, string> = {
    home: `${nameGreet}\n\nБи BizPrint AI туслах 🤖\n\n🔥 **Шинэ мэдээлэл:**\n• Офсет хэвлэлд 15% хөнгөлөлт — энэ сарын эцэс хүртэл!\n• AI үнийн тооцоолуур ашиглаж секундын дотор үнэ мэдэх боломжтой\n• Хүргэлт ҮНЭГҮЙ — 500,000₮-с дээш захиалгад\n\n💬 Та надаас:\n• 🖨️ Үнэ бодуулах\n• 📦 Бүтээгдэхүүн хайх\n• 💡 Зөвлөгөө авах`,

    shop: `${nameGreet}\n\n🛍️ Дэлгүүрээс сонголтоо хийж байна уу? Тусалъя!\n\n• Ямар бүтээгдэхүүн хайж байна?\n• Тоо ширхэг, хэмжээ хэлвэл үнэ шууд бодож өгнө\n• Хамгийн хямд сонголтыг санал болгоно`,

    product: `${nameGreet}\n\n📋 Энэ бүтээгдэхүүний талаар асуух зүйл байна уу?\n\n• Яг хэдэн ширхэг хэрэгтэй вэ?\n• Хэмжээ, өнгө, цаасны төрлөө хэлээрэй — үнэ бодож өгнө\n• Яаралтай хэрэгтэй юу? Хурдан хүргэлтийн сонголт байна`,

    quote: `${nameGreet}\n\n🧮 Үнийн тооцоолуур ашиглаж байна уу? Сайн байна!\n\nНадад тоо ширхэг, хэмжээ, нүүрний тоо хэлвэл илүү нарийн тооцоо хийж өгнө. Жишээ:\n• "500 ширхэг A4 флаер, 2 тал өнгөт"\n• "1000 ном, 64 нүүр, B5"`,

    cart: `${nameGreet}\n\n🛒 Захиалгаа баталгаажуулахаас өмнө:\n\n• Нэмэлт бүтээгдэхүүн хэрэгтэй юу?\n• Хүргэлтийн хаяг зөв үү?\n• Асуух зүйл байвал бичээрэй!`,

    dashboard: `${nameGreet}\n\n📊 Dashboard-д тавтай морил!\n\n• Захиалгын төлөв шалгах уу?\n• Шинэ захиалга хийх үү?\n• Юу ч асууж болно!`,

    admin: `${nameGreet}\n\n⚙️ Админ горим. Би тусалж чадна:\n\n• 📦 Захиалгын төлөв шилжүүлэх\n• 🏭 Үйлдвэрлэлийн ачаалал шалгах\n• 📊 Мэдээлэл харуулах\n• 🔔 Мэдэгдэл илгээх`,

    gallery: `${nameGreet}\n\n🖼️ Галлерей хэсэгт байна! Манай ажлуудтай танилцаарай.`,

    other: `${nameGreet}\n\nБи BizPrint AI туслах 🤖 Та юу хийхийг хүсэж байна?`,
  }

  return [{
    role: 'assistant',
    text: msgs[context] || msgs.other,
    tools: [],
    timestamp: new Date().toISOString(),
  }]
}

// ─── Маркетингийн мэдэгдлүүд ──────────────────────────────
const PROMOS = [
  { text: '🔥 Офсет хэвлэлд 15% хөнгөлөлт!', delay: 10000 },
  { text: '📦 500,000₮+ захиалгад ҮНЭГҮЙ хүргэлт', delay: 30000 },
  { text: '⚡ AI-тай секундын дотор үнэ бодоорой', delay: 60000 },
]

export default function AiChatWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [promoVisible, setPromoVisible] = useState(false)
  const [promoText, setPromoText] = useState('')
  const [promoIdx, setPromoIdx] = useState(0)
  const [hasGreeted, setHasGreeted] = useState(false)

  const user = getUser()
  const context = getPageContext(pathname)

  const [messages, setMessages] = useState<AiMsg[]>(() => getContextMessage(context, user))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Update greeting when page changes
  useEffect(() => {
    if (!open) {
      setMessages(getContextMessage(context, user))
      setConversationHistory([])
    }
  }, [context])

  // Promo bubble — show after delay, cycle through promos
  useEffect(() => {
    if (open) { setPromoVisible(false); return }
    const timer = setTimeout(() => {
      if (!open) {
        setPromoText(PROMOS[promoIdx % PROMOS.length].text)
        setPromoVisible(true)
        // Auto-hide after 8s
        setTimeout(() => setPromoVisible(false), 8000)
        setPromoIdx(prev => prev + 1)
      }
    }, PROMOS[promoIdx % PROMOS.length]?.delay || 15000)
    return () => clearTimeout(timer)
  }, [open, promoIdx])

  // Auto-open greeting after 5s on first visit
  useEffect(() => {
    if (hasGreeted) return
    const shown = sessionStorage.getItem('ai_greeted')
    if (shown) { setHasGreeted(true); return }
    const timer = setTimeout(() => {
      setPromoText(`${getGreeting()} BizPrint-д тавтай морил!`)
      setPromoVisible(true)
      setHasGreeted(true)
      sessionStorage.setItem('ai_greeted', '1')
      setTimeout(() => setPromoVisible(false), 8000)
    }, 5000)
    return () => clearTimeout(timer)
  }, [hasGreeted])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const u = getUser()
    if (!u?.id) {
      setMessages(prev => [...prev, {
        role: 'assistant', text: 'Нэвтэрсний дараа AI Agent ашиглах боломжтой.\n\n👉 [Нэвтрэх](/login) | [Бүртгүүлэх](/register)',
        tools: [], timestamp: new Date().toISOString(),
      }])
      return
    }

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
      if (res.conversationHistory) {
        setConversationHistory(res.conversationHistory.slice(-20))
      }
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `Алдаа: ${e.message || 'Серверт холбогдож чадсангүй'}`,
        tools: [], timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  // ─── Floating button + promo bubble ─────────────────────────
  if (!open) {
    return (
      <div className="ai-chat-btn fixed bottom-6 left-6 z-[9999] flex flex-col items-start gap-2">
        {/* Promo bubble */}
        {promoVisible && (
          <div className="relative bg-white dark:bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 shadow-lg max-w-[260px] animate-in slide-in-from-bottom-2 fade-in duration-300">
            <button onClick={() => setPromoVisible(false)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--text3)] cursor-pointer hover:bg-[var(--surface)]">
              <X className="w-3 h-3" />
            </button>
            <div className="flex items-start gap-2">
              <Megaphone className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-[12px] text-[var(--text)] leading-relaxed">{promoText}</p>
            </div>
            <button onClick={() => { setOpen(true); setPromoVisible(false) }}
              className="mt-2 text-[11px] font-semibold text-[#FF6B00] hover:underline cursor-pointer">
              💬 Дэлгэрэнгүй →
            </button>
          </div>
        )}

        {/* AI Button */}
        <button onClick={() => { setOpen(true); setPromoVisible(false) }}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E55D00] text-white shadow-lg shadow-[#FF6B00]/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer group">
          <Sparkles className="w-6 h-6 group-hover:animate-pulse" strokeWidth={1.5} />
        </button>
      </div>
    )
  }

  // ─── Chat panel ─────────────────────────────────────────────
  return (
    <div className="ai-chat-panel fixed bottom-6 left-6 w-[380px] max-w-[calc(100vw-24px)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl z-[9999] flex flex-col overflow-hidden"
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

      {/* Quick actions */}
      <div className="shrink-0 px-3 pb-1 flex gap-1.5 flex-wrap">
        {['🖨️ Үнэ бодох', '📦 Захиалга шалгах', '💡 Санал болгох'].map(q => (
          <button key={q} onClick={() => { setInput(q.slice(3)); send() }}
            className="text-[10px] px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--surface2)] text-[var(--text2)] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors cursor-pointer">
            {q}
          </button>
        ))}
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
