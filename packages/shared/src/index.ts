export { createAuthProvider, useAuth } from './auth'
export type { AuthProviderConfig, AuthContextType } from './auth'
export { queryKeys } from './query-keys'
export { useApiQuery, useApiMutation, useOptimisticMutation } from './query-hooks'
export { calculateDistance, formatDistance, estimateMinutes } from './utils/geo'

// Design system
export { colors, spacing, radius, fontSize, fontWeight, componentSize, timing, createAppTheme, theme } from './theme'
export type { Theme, AppVariant } from './theme'

// Status config (labels + colors + emojis)
export { ORDER_STATUS_CONFIG, DELIVERY_STATUS_CONFIG, ORDER_WORKFLOW_STAGES, getOrderStatusEntry, getDeliveryStatusEntry, getWorkflowStageIndex } from './status-config'
export type { StatusEntry } from './status-config'

// Real-time constants
export { SocketEvents, SocketRooms, SocketNamespace } from './realtime-events'

// Query config
export { staleTimes, gcTimes, createQueryClient } from './query-config'
export type { CreateQueryClientOptions } from './query-config'

// UI Components
export { Skeleton, CardSkeleton, ProductGridSkeleton, OrderListSkeleton, StatsSkeleton, ScreenSkeleton } from './components'
export { BizErrorBoundary, ErrorCard, EmptyState } from './components'
export { BizImage, BizAvatar } from './components'

// System types (admin)
export type { SystemHealth, ServiceStatus, ResourceMetrics, ErrorLog, Metric, TimeSeriesPoint, TimeSeries, AdminUserEntry, GlobalConfigEntry } from './types/system'
export { useSystemStatus } from './hooks/useSystemStatus'

// Membership
export type { Membership, MembershipPlan, MembershipCheckIn, MembershipQRPayload, CheckInResult, MembershipStatus, MembershipType } from './types/membership'
export { MEMBERSHIP_NOTIFICATION_TRIGGERS, MEMBERSHIP_STATUS_CONFIG } from './types/membership'
export { checkValidity, formatCountdown, generateQRPayload, isQRValid } from './utils/membership'
export type { ValidityResult } from './utils/membership'

// Creator Economy
export { calculateCommission, calculateBatchCommissions, DEFAULT_COMMISSION_RATES } from './logic/commission'
export type { CreatorRole, CommissionRate, SaleInput, CommissionResult, CreatorWallet, WithdrawalRequest, WithdrawalStatus } from './logic/commission'

// Anti-Fraud Dynamic QR
export { generateDynamicQR, validateDynamicQR, qrSecondsRemaining, QR_REFRESH_INTERVAL_MS, QR_VALIDITY_WINDOW_MS } from './logic/dynamic-qr'
export type { DynamicQRPayload, QRPurpose, QRValidationResult } from './logic/dynamic-qr'

// Product Types
export { ProductType, PRODUCT_TYPE_CONFIG, PRODUCT_CATEGORIES } from './logic/product-types'

// Smart Commerce
export { getLoyaltyInsight, calculateTierPrice, detectTier, getBundleSuggestion, checkQuoteFreshness, TIER_DISCOUNTS } from './logic/smart-commerce'
export type { LoyaltyInsight, CustomerTier, BundleSuggestion, QuoteFreshness } from './logic/smart-commerce'
export type { ProductCategory } from './logic/product-types'

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

export interface GeoLocation {
  latitude: number
  longitude: number
  heading?: number
  accuracy?: number
  timestamp?: number
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

/** @deprecated Use `colors` from theme.ts instead */
export const BRAND_COLORS = {
  orange: '#f97316',
  orangeHover: '#ea580c',
  surface: '#111111',
  background: '#0a0a0a',
  text: '#f5f5f5',
  textSecondary: '#a3a3a3',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
}

// ─── API Client ─────────────────────────────────────

export const API_BASE = typeof process !== 'undefined'
  ? (process.env?.EXPO_PUBLIC_API_URL || 'http://localhost:4000')
  : 'http://localhost:4000'

// Token provider — platform-specific (SecureStore, localStorage, etc.)
export interface TokenProvider {
  getToken: () => Promise<string | null>
  setTokens: (access: string, refresh: string) => Promise<void>
  clearTokens: () => Promise<void>
  getRefreshToken: () => Promise<string | null>
}

let _tokenProvider: TokenProvider | null = null

export function setTokenProvider(provider: TokenProvider) {
  _tokenProvider = provider
}

export function getTokenProvider(): TokenProvider | null {
  return _tokenProvider
}

// Core API call — supports both manual token and token provider
export async function apiCall<T = any>(
  endpoint: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const { token: manualToken, ...fetchOptions } = options || {}
  const token = manualToken || (await _tokenProvider?.getToken()) || undefined

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Version': '2',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions?.headers,
    },
  })

  // Auto refresh on 401
  if (res.status === 401 && _tokenProvider) {
    const refreshed = await tryRefreshToken()
    if (refreshed) {
      const newToken = await _tokenProvider.getToken()
      const retry = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Version': '2',
          ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
          ...fetchOptions?.headers,
        },
      })
      const data = await safeJson(retry)
      if (!retry.ok) throw new Error(data?.message || data?.error?.message || `API Error ${retry.status}`)
      return data?.data !== undefined ? data.data : data
    }
    // Guest mode for GET requests
    if (!fetchOptions.method || fetchOptions.method === 'GET') return null as T
    throw new Error('Unauthorized')
  }

  const json = await safeJson(res)

  if (!res.ok) {
    throw new Error(json?.error?.message || json?.message || `API Error ${res.status}`)
  }

  return json?.data !== undefined ? json.data : json
}

async function safeJson(res: Response): Promise<any> {
  const text = await res.text()
  if (!text) return {}
  try { return JSON.parse(text) } catch { return { message: text } }
}

async function tryRefreshToken(): Promise<boolean> {
  if (!_tokenProvider) return false
  try {
    const refreshToken = await _tokenProvider.getRefreshToken()
    if (!refreshToken) return false
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return false
    const data = await res.json()
    const result = data?.data || data
    await _tokenProvider.setTokens(result.access_token, result.refresh_token)
    return true
  } catch {
    return false
  }
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
