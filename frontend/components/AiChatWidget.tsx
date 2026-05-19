'use client'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { apiFetch, API_URL } from '@/lib/api'
import { Send, Loader2, Sparkles, Wrench, X, Megaphone } from 'lucide-react'

interface ProductCard {
  id: string
  name: string
  name_mn: string
  category: string
  base_price: number
  thumbnail_url?: string
  lead_time_days?: number
  slug?: string
}

interface PriceResult {
  total: number
  unitPrice: number
  total_price?: number
  unit_price?: number
  leadTimeDays?: number
  leadDays?: number
  lead_days?: number
  productType: string
  quantity: number
  breakdown?: Record<string, number>
}

interface AiMsg {
  role: 'user' | 'assistant'
  text: string
  tools?: string[]
  timestamp: string
  products?: ProductCard[]
  priceResult?: PriceResult
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

// ─── Inline product card ───────────────────────────────────
function ChatProductCard({ product, onOrder }: { product: ProductCard; onOrder: (p: ProductCard) => void }) {
  const cat = product.category || ''
  const icon = cat.includes('banner') ? '🏗️' :
               cat.includes('business') ? '💳' :
               cat.includes('flyer') ? '📄' :
               cat.includes('sticker') ? '📎' :
               cat.includes('book') ? '📕' :
               cat.includes('brochure') ? '📋' :
               cat.includes('poster') ? '🖼️' : '🖨️'

  return (
    <div
      onClick={() => onOrder(product)}
      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[#FF6B00] cursor-pointer transition-all group mt-2">
      <div className="w-11 h-11 rounded-lg bg-[var(--surface2)] flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
        {product.thumbnail_url
          ? <img src={product.thumbnail_url} alt="" className="w-full h-full object-cover rounded-lg" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : <span>{icon}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-[var(--text)] truncate leading-tight">
          {product.name_mn || product.name}
        </p>
        <p className="text-[11px] text-[#FF6B00] font-semibold mt-0.5">
          {Number(product.base_price).toLocaleString()}₮-с
        </p>
        {product.lead_time_days && (
          <p className="text-[10px] text-[var(--text3)]">{product.lead_time_days}х хоног</p>
        )}
      </div>
      <div className="text-[10px] bg-[#FF6B00] text-white px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        Захиалах →
      </div>
    </div>
  )
}

// ─── Inline price calculation result ──────────────────────
function ChatPriceCard({ result, onOrder }: { result: PriceResult; onOrder: () => void }) {
  const leadDays = result.leadTimeDays ?? result.lead_days ?? result.leadDays ?? 3
  const breakdownLabels: Record<string, string> = {
    paper: 'Цаас', printing: 'Хэвлэлт', finishing: 'Боловсруулалт',
    overhead: 'Нэмэгдэл', platform: 'Платформ', ink: 'Бэх',
  }
  return (
    <div className="mt-2 rounded-xl border border-[#FF6B00]/30 bg-[#FF6B00]/5 overflow-hidden">
      <div className="px-3 py-2 border-b border-[#FF6B00]/20">
        <p className="text-[10px] text-[var(--text3)]">Тооцоолсон үнэ</p>
        <p className="text-[22px] font-bold text-[#FF6B00] leading-tight">
          {result.total?.toLocaleString()}₮
        </p>
        <p className="text-[10px] text-[var(--text3)]">
          {result.quantity?.toLocaleString()} ш · нэгж {result.unitPrice?.toLocaleString()}₮ · {leadDays}х хоног
        </p>
      </div>
      {result.breakdown && Object.keys(result.breakdown).length > 0 && (
        <div className="px-3 py-2 space-y-1">
          {Object.entries(result.breakdown).map(([k, v]) => Number(v) > 0 && (
            <div key={k} className="flex justify-between text-[10px]">
              <span className="text-[var(--text3)]">{breakdownLabels[k] || k}</span>
              <span className="text-[var(--text2)]">{Number(v).toLocaleString()}₮</span>
            </div>
          ))}
        </div>
      )}
      <div className="px-3 pb-3">
        <button onClick={onOrder}
          className="w-full py-2 bg-[#FF6B00] hover:bg-[#E55D00] text-white rounded-lg text-[11px] font-semibold transition-colors">
          Захиалах →
        </button>
      </div>
    </div>
  )
}

// ─── Smart detection: product search or price calculation ────
async function detectAndFetch(text: string): Promise<{ products?: ProductCard[]; priceResult?: PriceResult } | null> {
  const lower = text.toLowerCase()

  const productKeywords = ['нэрийн хуудас', 'флаер', 'баннер', 'стикер', 'брошур', 'постер', 'ном', 'роллап', 'бүтээгдэхүүн', 'дэлгүүр', 'харуулаарай', 'юу байна', 'жагсаалт', 'catalog']
  const priceKeywords = ['хэд вэ', 'үнэ', 'тооцоол', 'ширхэг', 'хэдэн', 'захиалбал', 'хэд болох']

  const isPriceQuery = priceKeywords.some(k => lower.includes(k))
  const isProductSearch = productKeywords.some(k => lower.includes(k)) && !isPriceQuery

  const detectCat = (): string => {
    if (lower.includes('нэрийн')) return 'business-card'
    if (lower.includes('флаер')) return 'flyer'
    if (lower.includes('баннер') || lower.includes('роллап')) return 'banner'
    if (lower.includes('стикер')) return 'sticker'
    if (lower.includes('ном')) return 'book'
    if (lower.includes('брошур')) return 'brochure'
    if (lower.includes('постер')) return 'poster'
    return ''
  }

  if (isProductSearch) {
    const cat = detectCat()
    try {
      const url = cat
        ? `${API_URL}/api/products?category=${cat}&limit=6`
        : `${API_URL}/api/products?limit=6`
      const res = await fetch(url)
      const products = await res.json()
      if (Array.isArray(products) && products.length > 0) {
        return { products: products.slice(0, 4) }
      }
    } catch { }
  }

  if (isPriceQuery) {
    const qtyMatch = text.match(/(\d{2,6})/)
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 500
    const productType = detectCat() || 'flyer'

    const sizeMap: Record<string, { w: number; h: number }> = {
      'business-card': { w: 90, h: 54 },
      'flyer': { w: 148, h: 210 },
      'banner': { w: 1000, h: 2000 },
      'sticker': { w: 100, h: 100 },
      'brochure': { w: 210, h: 297 },
      'poster': { w: 297, h: 420 },
      'book': { w: 148, h: 210 },
    }
    const size = sizeMap[productType] || { w: 148, h: 210 }

    try {
      const res = await fetch(`${API_URL}/api/quote/instant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType, quantity: qty,
          widthMm: size.w, heightMm: size.h,
          colorMode: 'CMYK', sides: 'single', finishing: [],
        }),
      })
      const data = await res.json()
      const total = Number(data.total_price ?? data.total ?? 0)
      if (total > 0) {
        const unitPrice = Number(data.unit_price ?? data.unitPrice ?? (total / qty))
        return { priceResult: { ...data, total, unitPrice, quantity: qty, productType } }
      }
    } catch { }
  }

  return null
}

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

    setInput('')
    setMessages(prev => [...prev, { role: 'user', text, tools: [], timestamp: new Date().toISOString() }])
    setLoading(true)

    // Smart detection — show products or price inline (no auth required)
    const detected = await detectAndFetch(text)
    if (detected?.products && detected.products.length > 0) {
      setLoading(false)
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `${detected.products!.length} бүтээгдэхүүн олдлоо:`,
        tools: ['product_search'],
        products: detected.products,
        timestamp: new Date().toISOString(),
      }])
      setTimeout(() => inputRef.current?.focus(), 100)
      return
    }
    if (detected?.priceResult) {
      setLoading(false)
      const pr = detected.priceResult
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `${pr.quantity?.toLocaleString()} ширхэг ${pr.productType} тооцоолол:`,
        tools: ['price_calc'],
        priceResult: pr,
        timestamp: new Date().toISOString(),
      }])
      setTimeout(() => inputRef.current?.focus(), 100)
      return
    }

    // Full AI agent requires login
    const u = getUser()
    if (!u?.id) {
      setLoading(false)
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Энэ асуултад AI Agent хариулахын тулд нэвтрэх шаардлагатай.\n\n👉 [Нэвтрэх](/login) | [Бүртгүүлэх](/register)',
        tools: [], timestamp: new Date().toISOString(),
      }])
      return
    }

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

              {/* Product cards */}
              {msg.products && msg.products.length > 0 && (
                <div className="mt-1">
                  {msg.products.map(p => (
                    <ChatProductCard key={p.id} product={p}
                      onOrder={(product) => {
                        window.location.href = `/orders/new?productId=${product.id}&name=${encodeURIComponent(product.name_mn || product.name)}&price=${product.base_price}`
                      }} />
                  ))}
                  <a href="/shop" className="block text-center text-[10px] text-[#FF6B00] mt-2 hover:underline">
                    Бүх бүтээгдэхүүн харах →
                  </a>
                </div>
              )}

              {/* Price result */}
              {msg.priceResult && (
                <ChatPriceCard result={msg.priceResult}
                  onOrder={() => {
                    const pr = msg.priceResult!
                    window.location.href = `/orders/new?productType=${pr.productType}&qty=${pr.quantity}&price=${pr.total}`
                  }} />
              )}

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
        {messages.length <= 1 ? (
          [
            { label: '💳 Нэрийн хуудас', msg: 'Нэрийн хуудас харуулаарай' },
            { label: '📄 Флаер үнэ', msg: '500 ширхэг флаер хэд вэ?' },
            { label: '🏗️ Баннер', msg: 'Баннер харуулаарай' },
            { label: '📦 Бүх бүтээгдэхүүн', msg: 'Бүтээгдэхүүн жагсаалт харуулаарай' },
          ].map(qr => (
            <button key={qr.label}
              onClick={() => { setInput(qr.msg); setTimeout(() => send(), 50) }}
              className="text-[10px] px-2.5 py-1 rounded-full border border-[#FF6B00]/40 bg-[#FF6B00]/5 text-[#FF6B00] hover:bg-[#FF6B00]/10 transition-colors cursor-pointer">
              {qr.label}
            </button>
          ))
        ) : (
          ['🖨️ Үнэ бодох', '📦 Захиалга шалгах', '💡 Санал болгох'].map(q => (
            <button key={q} onClick={() => { setInput(q.slice(3)); }}
              className="text-[10px] px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--surface2)] text-[var(--text2)] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors cursor-pointer">
              {q}
            </button>
          ))
        )}
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
