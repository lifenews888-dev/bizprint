'use client'
import { useStore } from '@/lib/store'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Minus, Plus, Heart, ShoppingBag, ArrowRight, Truck, Shield, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

const fmt = (n: number) => '₮' + n.toLocaleString('mn-MN')

export default function CartPage() {
  const router = useRouter()
  const { cart, removeFromCart, updateQty, clearCart, cartTotal, cartCount, toggleWishlist, isWished } = useStore()
  const [removingId, setRemovingId] = useState<string | null>(null)

  const shipping = cartTotal() >= 50000 ? 0 : 5000
  const tax = Math.round(cartTotal() * 0.1)
  const grandTotal = cartTotal() + shipping + tax

  const handleRemove = (id: string) => {
    setRemovingId(id)
    setTimeout(() => { removeFromCart(id); setRemovingId(null); toast('Сагснаас хасагдлаа') }, 300)
  }

  const moveToWishlist = (item: typeof cart[0]) => {
    toggleWishlist(item.id)
    removeFromCart(item.id)
    toast('Хадгалсан руу шилжлээ ❤️')
  }

  // Empty cart
  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[var(--bg)] px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--surface2)] flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-[var(--text3)]" strokeWidth={1} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Таны сагс хоосон байна</h1>
          <p className="text-sm text-[var(--text3)] mb-6 max-w-[300px] mx-auto">Бүтээгдэхүүн сонгоод сагсандаа нэмээрэй</p>
          <motion.a whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#FF6B00] text-white rounded-xl text-sm font-bold no-underline shadow-lg shadow-[#FF6B00]/20 hover:bg-[#E55D00] transition-colors">
            <ShoppingBag className="w-4 h-4" strokeWidth={1.5} /> Дэлгүүр хэсэх
          </motion.a>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-[1100px] mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Миний сагс</h1>
            <p className="text-sm text-[var(--text3)]">{cartCount()} бүтээгдэхүүн</p>
          </div>
          <button onClick={() => { if (confirm('Сагсыг хоослох уу?')) { clearCart(); toast('Сагс хоосолсон') } }}
            className="text-xs text-red-500 font-semibold bg-transparent border border-red-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-red-50 transition-colors flex items-center gap-1">
            <Trash2 className="w-3 h-3" strokeWidth={1.5} /> Бүгдийг хасах
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* ─── CART ITEMS ─── */}
          <div className="space-y-3">
            <AnimatePresence>
              {cart.map(item => (
                <motion.div key={item.id}
                  layout initial={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -200 }}
                  animate={{ opacity: removingId === item.id ? 0.3 : 1, x: removingId === item.id ? -50 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">

                  {/* Image */}
                  <a href={`/product/${item.id}`} className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-[var(--surface2)] no-underline">
                    {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center text-2xl">🖨️</div>}
                  </a>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <a href={`/product/${item.id}`} className="text-sm font-semibold text-[var(--text)] no-underline hover:text-[#FF6B00] transition-colors line-clamp-2">{item.name}</a>
                    <div className="text-lg font-extrabold text-[#FF6B00] mt-1">{fmt(item.price)}</div>

                    {/* Controls */}
                    <div className="flex items-center gap-3 mt-2">
                      {/* Qty */}
                      <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
                        <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-8 h-8 bg-[var(--surface2)] border-none cursor-pointer flex items-center justify-center text-[var(--text2)] hover:bg-[var(--surface3)] transition-colors">
                          <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                        <span className="w-10 h-8 flex items-center justify-center text-sm font-bold bg-[var(--surface)]">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-8 h-8 bg-[var(--surface2)] border-none cursor-pointer flex items-center justify-center text-[var(--text2)] hover:bg-[var(--surface3)] transition-colors">
                          <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <span className="text-xs text-[var(--text3)]">= {fmt(item.price * item.qty)}</span>

                      <div className="ml-auto flex items-center gap-1.5">
                        {/* Save for later */}
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => moveToWishlist(item)} title="Хадгалах"
                          className={`w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center cursor-pointer transition-colors ${isWished(item.id) ? 'text-red-500 border-red-200' : 'text-[var(--text3)] hover:text-red-500 hover:border-red-200'}`}>
                          <Heart className="w-3.5 h-3.5" strokeWidth={1.5} fill={isWished(item.id) ? 'currentColor' : 'none'} />
                        </motion.button>
                        {/* Remove */}
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleRemove(item.id)} title="Хасах"
                          className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center cursor-pointer text-[var(--text3)] hover:text-red-500 hover:border-red-200 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ─── ORDER SUMMARY (sticky glass) ─── */}
          <div className="lg:sticky lg:top-[130px]">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl p-5 space-y-4" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
              <h2 className="text-base font-bold">Захиалгын дүн</h2>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text3)]">Бараа ({cartCount()})</span>
                  <span className="font-semibold">{fmt(cartTotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text3)]">Хүргэлт</span>
                  <span className={`font-semibold ${shipping === 0 ? 'text-emerald-600' : ''}`}>{shipping === 0 ? 'Үнэгүй' : fmt(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text3)]">НӨАТ (10%)</span>
                  <span className="font-semibold">{fmt(tax)}</span>
                </div>
                <div className="border-t border-[var(--border)] pt-2.5 flex justify-between">
                  <span className="font-bold text-base">Нийт</span>
                  <span className="font-extrabold text-xl text-[#FF6B00]">{fmt(grandTotal)}</span>
                </div>
              </div>

              {shipping > 0 && (
                <div className="text-[10px] text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 font-semibold">
                  🚚 ₮50,000+ захиалгад хүргэлт ҮНЭГҮЙ! Дутуу: {fmt(50000 - cartTotal())}
                </div>
              )}

              {/* Checkout */}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/checkout')}
                className="w-full py-3.5 rounded-xl border-none bg-[#FF6B00] text-white font-bold text-sm cursor-pointer shadow-lg shadow-[#FF6B00]/20 hover:bg-[#E55D00] transition-colors flex items-center justify-center gap-2">
                Төлбөр төлөх <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </motion.button>

              <a href="/shop" className="block text-center text-xs text-[var(--text3)] no-underline hover:text-[#FF6B00] transition-colors font-semibold">
                ← Дэлгүүр үргэлжлүүлэх
              </a>

              {/* Trust */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border)]">
                {[
                  { icon: Truck, label: '1–3 өдөр' },
                  { icon: Shield, label: 'Аюулгүй' },
                  { icon: RotateCcw, label: 'Буцаалт' },
                ].map(t => (
                  <div key={t.label} className="flex flex-col items-center gap-1 text-center">
                    <t.icon className="w-4 h-4 text-[var(--text3)]" strokeWidth={1.2} />
                    <span className="text-[11px] text-[var(--text3)] font-medium">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
