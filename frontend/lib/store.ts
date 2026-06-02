import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: string
  productId?: string
  name: string
  price: number
  qty: number
  image?: string
  specs?: Record<string, any>
}

interface StoreState {
  // Cart
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  removeFromCart: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  cartCount: () => number
  cartTotal: () => number

  // Wishlist
  wishlist: string[]
  toggleWishlist: (id: string) => void
  isWished: (id: string) => boolean

  // Compare
  compare: string[]
  toggleCompare: (id: string) => void
  isCompared: (id: string) => boolean
  clearCompare: () => void
}

const syncCartItemPricing = (item: CartItem, qty: number): CartItem => {
  const safeQty = Math.max(1, Number(qty) || 1)
  const unitPrice = Math.round(Number(item.price) || 0)
  const totalPrice = Math.round(unitPrice * safeQty)
  const specs = item.specs || {}
  const pricing = specs.pricing && typeof specs.pricing === 'object' ? specs.pricing as Record<string, any> : {}
  const snapshot = specs.pricing_snapshot && typeof specs.pricing_snapshot === 'object' ? specs.pricing_snapshot as Record<string, any> : null

  return {
    ...item,
    qty: safeQty,
    specs: {
      ...specs,
      pricing: {
        ...pricing,
        unit_price: unitPrice,
        total_price: totalPrice,
        quantity: safeQty,
      },
      ...(snapshot ? {
        pricing_snapshot: {
          ...snapshot,
          total: totalPrice,
          unitPrice,
          spec: {
            ...(snapshot.spec && typeof snapshot.spec === 'object' ? snapshot.spec : {}),
            quantity: safeQty,
          },
        },
      } : {}),
    },
  }
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // ─── Cart ───
      cart: [],
      addToCart: (item, qty = 1) => set(s => {
        const existing = s.cart.find(c => c.id === item.id)
        if (existing) {
          return { cart: s.cart.map(c => c.id === item.id ? syncCartItemPricing({ ...c, ...item, qty: c.qty }, c.qty + qty) : c) }
        }
        return { cart: [...s.cart, syncCartItemPricing({ ...item, qty }, qty)] }
      }),
      removeFromCart: (id) => set(s => ({ cart: s.cart.filter(c => c.id !== id) })),
      updateQty: (id, qty) => set(s => ({
        cart: qty <= 0 ? s.cart.filter(c => c.id !== id) : s.cart.map(c => c.id === id ? syncCartItemPricing(c, qty) : c)
      })),
      clearCart: () => set({ cart: [] }),
      cartCount: () => get().cart.reduce((s, c) => s + c.qty, 0),
      cartTotal: () => get().cart.reduce((s, c) => s + c.price * c.qty, 0),

      // ─── Wishlist ───
      wishlist: [],
      toggleWishlist: (id) => set(s => ({
        wishlist: s.wishlist.includes(id) ? s.wishlist.filter(w => w !== id) : [...s.wishlist, id]
      })),
      isWished: (id) => get().wishlist.includes(id),

      // ─── Compare (max 4) ───
      compare: [],
      toggleCompare: (id) => set(s => {
        if (s.compare.includes(id)) return { compare: s.compare.filter(c => c !== id) }
        if (s.compare.length >= 4) return s // max 4
        return { compare: [...s.compare, id] }
      }),
      isCompared: (id) => get().compare.includes(id),
      clearCompare: () => set({ compare: [] }),
    }),
    { name: 'bizprint-store' }
  )
)
