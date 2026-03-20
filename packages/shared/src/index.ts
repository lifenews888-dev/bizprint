// ─── Types ──────────────────────────────────────────

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  company_name?: string
  role: UserRole
  avatar_url?: string
  is_active: boolean
}

export type UserRole = 'admin' | 'customer' | 'vendor' | 'designer' | 'courier' | 'sales' | 'factory'

export interface Product {
  id: string
  name_mn: string
  name_en?: string
  base_price: number
  category: string
  subcategory?: string
  image_url?: string
  is_active: boolean
}

export interface Category {
  id: string
  name_mn: string
  name?: string
  icon?: string
  description?: string
  isActive: boolean
}

export interface Order {
  id: string
  order_number: string
  status: OrderStatus
  total_amount: number
  customer_name: string
  product_name: string
  quantity: number
  created_at: string
  updated_at: string
}

export type OrderStatus =
  | 'DRAFT' | 'CART' | 'QUOTATION' | 'CONFIRMED'
  | 'PENDING_FILE' | 'FILE_REVIEW' | 'IN_PRODUCTION'
  | 'FINISHING' | 'DISPATCHED' | 'DELIVERED' | 'COMPLETED'
  | 'CANCELLED' | 'REFUNDED'

export interface Delivery {
  id: number
  status: DeliveryStatus
  address: string
  recipient_name: string
  recipient_phone: string
  courier_name?: string
  courier_phone?: string
  lat?: number
  lng?: number
  estimated_at?: string
  created_at: string
  updated_at: string
}

export type DeliveryStatus =
  | 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT'
  | 'DELIVERED' | 'FAILED' | 'RETURNED'

export interface Quote {
  id: string
  quote_number: string
  product_name: string
  quantity: number
  total_price: number
  unit_price: number
  status: string
  created_at: string
}

export interface Notification {
  id: number
  type: string
  title: string
  message?: string
  is_read: boolean
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  user: User
}

// ─── Constants ──────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Ноорог',
  CART: 'Сагс',
  QUOTATION: 'Үнийн санал',
  CONFIRMED: 'Баталгаажсан',
  PENDING_FILE: 'Файл хүлээж байна',
  FILE_REVIEW: 'Файл шалгаж байна',
  IN_PRODUCTION: 'Үйлдвэрлэж байна',
  FINISHING: 'Дуусгаж байна',
  DISPATCHED: 'Илгээсэн',
  DELIVERED: 'Хүргэсэн',
  COMPLETED: 'Дууссан',
  CANCELLED: 'Цуцлагдсан',
  REFUNDED: 'Буцаагдсан',
}

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  PENDING: 'Хүлээгдэж байна',
  ASSIGNED: 'Жолооч томилогдсон',
  PICKED_UP: 'Авсан',
  IN_TRANSIT: 'Замд',
  DELIVERED: 'Хүргэсэн',
  FAILED: 'Амжилтгүй',
  RETURNED: 'Буцаагдсан',
}

export const BRAND_COLORS = {
  orange: '#FF6B00',
  orangeHover: '#e05d00',
  surface: '#0F0F0F',
  background: '#0A0A0A',
  text: '#F1F5F9',
  textSecondary: '#888888',
  success: '#22c55e',
  warning: '#eab308',
  error: '#ef4444',
}

// ─── API Client ─────────────────────────────────────

export const API_BASE = typeof process !== 'undefined'
  ? (process.env?.EXPO_PUBLIC_API_URL || 'http://localhost:4000')
  : 'http://localhost:4000'

export async function apiCall<T = any>(
  endpoint: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const { token, ...fetchOptions } = options || {}

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Version': '2',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions?.headers,
    },
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(json?.error?.message || json?.message || `API Error ${res.status}`)
  }

  // Handle both wrapped (v2) and raw responses
  return json?.data !== undefined ? json.data : json
}

export async function apiPost<T = any>(endpoint: string, body: any, token?: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'POST', body: JSON.stringify(body), token })
}

export async function apiGet<T = any>(endpoint: string, token?: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'GET', token })
}

export async function apiPut<T = any>(endpoint: string, body: any, token?: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), token })
}

export async function apiPatch<T = any>(endpoint: string, body: any, token?: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body), token })
}

export async function apiDelete<T = any>(endpoint: string, token?: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'DELETE', token })
}
