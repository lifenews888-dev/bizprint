import { apiFetch } from '../api'

/**
 * Quote Service — үнийн санал
 */
export const QuoteService = {
  /** Бүх quotes (admin) */
  getAll: () => apiFetch('/quotes-v2'),

  /** Миний quotes */
  getMine: () => apiFetch('/quotes-v2/my'),

  /** Нэг quote */
  getById: (id: string) => apiFetch(`/quotes-v2/${id}`),

  /** Өнөөдрийн quotes */
  getToday: () => apiFetch('/quotes-v2/today'),

  /** Quote илгээх */
  send: (id: string) =>
    apiFetch(`/quotes-v2/${id}/send`, { method: 'POST' }),

  /** Quote батлах */
  confirm: (id: string) =>
    apiFetch(`/quotes-v2/${id}/confirm`, { method: 'PATCH' }),
}
