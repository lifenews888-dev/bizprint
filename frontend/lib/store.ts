import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: string
  name: string
  price: number
  qty: number
  image?: string
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

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // ─── Cart ───
      cart: [],
      addToCart: (item, qty = 1) => set(s => {
        const existing = s.cart.find(c => c.id === item.id)
        if (existing) {
          return { cart: s.cart.map(c => c.id === item.id ? { ...c, qty: c.qty + qty } : c) }
        }
        return { cart: [...s.cart, { ...item, qty }] }
      }),
      removeFromCart: (id) => set(s => ({ cart: s.cart.filter(c => c.id !== id) })),
      updateQty: (id, qty) => set(s => ({
        cart: qty <= 0 ? s.cart.filter(c => c.id !== id) : s.cart.map(c => c.id === id ? { ...c, qty } : c)
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
