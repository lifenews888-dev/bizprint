type AuthUser = {
  id?: string
  email?: string
  full_name?: string
  role?: string
  is_creator?: boolean
  creator_status?: string | null
  creator_capabilities?: unknown[]
}

type AuthSession = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  user?: AuthUser
}

const AUTH_STORAGE_KEYS = [
  'access_token',
  'token',
  'refresh_token',
  'user',
  'bizprint_role_mode',
]

const AUTH_COOKIE_KEYS = [
  'access_token',
  'token',
  'user_role',
]

function cookieAttributes(maxAge: number) {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
  return `Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
}

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; ${cookieAttributes(maxAge)}`
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; ${cookieAttributes(0)}`
}

export function storeAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') return
  if (!session.access_token) return

  const maxAge = Number(session.expires_in || 900)
  localStorage.setItem('access_token', session.access_token)
  localStorage.setItem('token', session.access_token)
  if (session.refresh_token) localStorage.setItem('refresh_token', session.refresh_token)
  if (session.user) localStorage.setItem('user', JSON.stringify(session.user))

  setCookie('access_token', session.access_token, maxAge)
  setCookie('token', session.access_token, maxAge)
  if (session.user?.role) setCookie('user_role', session.user.role, maxAge)
}

export function clearAuthSession() {
  if (typeof window !== 'undefined') {
    AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
  }
  AUTH_COOKIE_KEYS.forEach(deleteCookie)
}
