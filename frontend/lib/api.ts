/**
 * BizPrint API Client — бүх API дуудалтын нэг эх сурвалж.
 *
 * Ашиглах:
 *   import { apiFetch } from '@/lib/api'
 *   const data = await apiFetch('/cart')
 *   const order = await apiFetch('/orders', { method: 'POST', body: JSON.stringify(data) })
 *
 * Онцлогууд:
 *   - API_URL нэг газраас удирдагдана
 *   - JWT token автоматаар нэмэгдэнэ
 *   - 401 → login руу redirect
 *   - auth: false → token илгээхгүй (public endpoint)
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  auth?: boolean
  body?: BodyInit | Record<string, unknown> | null
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    null
  )
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { auth = true, body, ...rest } = options
  const token = getToken()

  const headers: Record<string, string> = {}

  // Content-Type зөвхөн FormData биш үед нэмнэ
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (auth && token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Merge user headers
  if (rest.headers) {
    const h = rest.headers as Record<string, string>
    Object.keys(h).forEach((k) => { headers[k] = h[k] })
  }

  const fetchBody =
    body && !(body instanceof FormData) && typeof body === 'object'
      ? JSON.stringify(body)
      : (body as BodyInit | null | undefined)

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers,
    body: fetchBody,
  })

  // 401 → auto logout + redirect (зөвхөн auth: true үед)
  if (res.status === 401) {
    if (auth && typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    throw new Error('Нэвтрэлт дууссан байна')
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `API алдаа: ${res.status}`)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json()
}

/**
 * FormData upload хийхэд зориулсан helper.
 * Content-Type-ыг browser автоматаар тохируулна (multipart/form-data).
 */
export async function apiUpload<T = unknown>(
  path: string,
  formData: FormData,
  method: string = 'POST',
): Promise<T> {
  return apiFetch<T>(path, {
    method,
    body: formData,
  })
}
