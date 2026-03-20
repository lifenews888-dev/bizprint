import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, useSegments } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { api, setTokens, clearTokens, getToken } from './api'

interface User {
  id: string; email: string; full_name: string; role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; full_name: string; phone?: string }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true,
  login: async () => {}, register: async () => {}, logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [user, segments, loading])

  async function checkAuth() {
    try {
      const token = await getToken()
      if (!token) { setLoading(false); return }
      const me = await api('/auth/me')
      setUser(me)
    } catch {
      await clearTokens()
    } finally {
      setLoading(false)
    }
  }

  async function login(email: string, password: string) {
    const result = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, platform: 'android' }),
    })
    await setTokens(result.access_token, result.refresh_token)
    setUser(result.user)
  }

  async function register(data: { email: string; password: string; full_name: string; phone?: string }) {
    const result = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, platform: 'android' }),
    })
    await setTokens(result.access_token, result.refresh_token)
    setUser(result.user)
  }

  async function logout() {
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token')
      if (refreshToken) {
        await api('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) })
      }
    } catch {}
    await clearTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
