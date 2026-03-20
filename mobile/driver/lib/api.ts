import * as SecureStore from 'expo-secure-store'

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000'

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync('access_token')
}

export async function setTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync('access_token', access)
  await SecureStore.setItemAsync('refresh_token', refresh)
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync('access_token')
  await SecureStore.deleteItemAsync('refresh_token')
}

export async function api<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Version': '2',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (res.status === 401) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      const newToken = await getToken()
      const retry = await fetch(`${API}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Version': '2',
          ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
          ...options?.headers,
        },
      })
      const data = await retry.json()
      return data?.data !== undefined ? data.data : data
    }
    throw new Error('Unauthorized')
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || data?.error?.message || 'API Error')
  return data?.data !== undefined ? data.data : data
}

async function tryRefresh(): Promise<boolean> {
  try {
    const refreshToken = await SecureStore.getItemAsync('refresh_token')
    if (!refreshToken) return false
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return false
    const data = await res.json()
    const result = data?.data || data
    await setTokens(result.access_token, result.refresh_token)
    return true
  } catch {
    return false
  }
}

export function apiGet<T = any>(endpoint: string) { return api<T>(endpoint, { method: 'GET' }) }
export function apiPost<T = any>(endpoint: string, body: any) { return api<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }) }
export function apiPatch<T = any>(endpoint: string, body: any) { return api<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }) }

export { API }
