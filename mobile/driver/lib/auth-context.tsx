import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, useSegments } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { api, setTokens, clearTokens, getToken } from './api'

interface User { id: string; email: string; full_name: string; role: string }

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, login: async () => {}, logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => { checkAuth() }, [])

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === '(auth)'
    if (!user && !inAuth) router.replace('/(auth)/login')
    else if (user && inAuth) router.replace('/(tabs)')
  }, [user, segments, loading])

  async function checkAuth() {
    try {
      const token = await getToken()
      if (!token) { setLoading(false); return }
      const me = await api('/auth/me')
      if (me.role !== 'courier' && me.role !== 'admin') {
        await clearTokens()
        setLoading(false)
        return
      }
      setUser(me)
    } catch { await clearTokens() }
    finally { setLoading(false) }
  }

  async function login(email: string, password: string) {
    const result = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, platform: 'android', device_name: 'BizPrint Driver' }),
    })
    if (result.user.role !== 'courier' && result.user.role !== 'admin') {
      throw new Error('Зөвхөн жолоочийн бүртгэлээр нэвтэрнэ')
    }
    await setTokens(result.access_token, result.refresh_token)
    setUser(result.user)
  }

  async function logout() {
    try {
      const rt = await SecureStore.getItemAsync('refresh_token')
      if (rt) await api('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token: rt }) })
    } catch {}
    await clearTokens()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
