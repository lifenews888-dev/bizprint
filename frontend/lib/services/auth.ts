import { apiFetch, API_URL } from '../api'

/**
 * Auth Service — нэвтрэлт, бүртгэл, хэрэглэгчийн мэдээлэл
 */
export const AuthService = {
  /** Нэвтрэх */
  login: (email: string, password: string) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    }),

  /** Бүртгүүлэх */
  register: (data: Record<string, unknown>) =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: data,
      auth: false,
    }),

  /** Одоогийн хэрэглэгч */
  me: () => apiFetch('/auth/me'),

  /** Logout */
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
  },
}
