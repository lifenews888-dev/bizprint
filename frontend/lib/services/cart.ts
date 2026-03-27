import { apiFetch } from '../api'

/**
 * Cart Service — Canonical Pipeline Step 1
 * POST /cart/items → POST /cart/quote → POST /cart/quote/confirm
 */
export const CartService = {
  /** Active cart авах (JWT-ээс customer тодорхойлно) */
  get: () => apiFetch('/cart'),

  /** Сагсанд бараа нэмэх */
  addItem: (data: { product_id: string; quantity: number; specs?: Record<string, unknown> }) =>
    apiFetch('/cart/items', { method: 'POST', body: data }),

  /** Сагснаас бараа хасах */
  removeItem: (itemId: string) =>
    apiFetch(`/cart/items/${itemId}`, { method: 'DELETE' }),

  /** Сагснаас үнийн санал үүсгэх */
  generateQuote: () =>
    apiFetch('/cart/quote', { method: 'POST' }),

  /** Үнийн санал батлаж захиалга үүсгэх */
  confirmQuote: (quotationId: string, paymentMethod?: string) =>
    apiFetch('/cart/quote/confirm', {
      method: 'POST',
      body: { quotation_id: quotationId, payment_method: paymentMethod },
    }),
}
