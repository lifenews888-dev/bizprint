import { apiFetch } from '../api'

/**
 * Product Service — бүтээгдэхүүн
 */
export const ProductService = {
  /** Бүх бүтээгдэхүүн */
  getAll: (params?: string) =>
    apiFetch(`/products${params ? '?' + params : ''}`, { auth: false }),

  /** Нэг бүтээгдэхүүн */
  getById: (id: string) => apiFetch(`/products/${id}`, { auth: false }),

  /** Attributes */
  getAttributes: (productId: string) =>
    apiFetch(`/product-attributes?product_id=${productId}`, { auth: false }),

  /** Categories */
  getCategories: () => apiFetch('/categories', { auth: false }),
}
