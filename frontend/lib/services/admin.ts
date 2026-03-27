import { apiFetch } from '../api'

/**
 * Admin Service — admin panel CRUD
 */
export const AdminService = {
  /** Users */
  getUsers: () => apiFetch('/admin/users'),
  getCustomers: (params?: string) =>
    apiFetch(`/admin/customers${params ? '?' + params : ''}`),
  getVendors: () => apiFetch('/admin/vendors'),

  /** Products */
  getProductsMaster: (params?: string) =>
    apiFetch(`/admin/products-master${params ? '?' + params : ''}`),
  getShopProducts: (params?: string) =>
    apiFetch(`/admin/shop-products${params ? '?' + params : ''}`),

  /** Support */
  getTickets: (status?: string) =>
    apiFetch(`/admin/support-tickets${status ? '?status=' + status : ''}`),
}
