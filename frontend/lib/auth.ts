export function getToken(): string {
  if (typeof window === 'undefined') return ''
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    ''
  )
}

export function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

export function authH() {
  return { Authorization: `Bearer ${getToken()}` }
}