import { apiFetch } from '../api'

/**
 * Order Service — захиалга CRUD + status
 */
export const OrderService = {
  /** Бүх захиалга (admin) */
  getAll: () => apiFetch('/orders'),

  /** Миний захиалгууд */
  getMine: () => apiFetch('/orders/my'),

  /** Customer-ийн захиалгууд */
  getByCustomer: (customerId: string) =>
    apiFetch(`/orders/customer/${customerId}`),

  /** Нэг захиалга */
  getById: (id: string) => apiFetch(`/orders/${id}`),

  /** Статус шинэчлэх */
  updateStatus: (id: string, status: string) =>
    apiFetch(`/orders/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }),

  /** Захиалга цуцлах */
  cancel: (id: string) =>
    apiFetch(`/orders/${id}/cancel`, { method: 'PATCH' }),

  /** Захиалга шинэчлэх */
  update: (id: string, data: Record<string, unknown>) =>
    apiFetch(`/orders/${id}`, {
      method: 'PATCH',
      body: data,
    }),
}
