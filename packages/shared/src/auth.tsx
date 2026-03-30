import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, useSegments } from 'expo-router'
import { apiCall, getTokenProvider, type User } from './index'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register?: (data: { email: string; password: string; full_name: string; phone?: string }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, login: async () => {}, logout: async () => {},
})

export interface AuthProviderConfig {
  /** Allowed roles — if set, other roles are rejected on login/checkAuth */
  allowedRoles?: string[]
  /** Platform identifier sent with login/register */
  platform?: string
  /** Device name sent with login */
  deviceName?: string
  /** Enable guest mode (unauthenticated users can browse tabs) */
  guestMode?: boolean
  /** Enable register functionality */
  enableRegister?: boolean
  /** Called after successful login */
  onLogin?: (user: User) => void
  /** Called after logout */
  onLogout?: (userId?: string) => void
  /** Called after auth check on app start */
  onAuthReady?: (user: User | null) => void
}

export function createAuthProvider(config: AuthProviderConfig = {}) {
  const {
    allowedRoles,
    platform = 'android',
    deviceName,
    guestMode = false,
    enableRegister = false,
    onLogin,
    onLogout,
    onAuthReady,
  } = config

  function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const segments = useSegments()
    const router = useRouter()
    const tp = getTokenProvider()

    useEffect(() => { checkAuth() }, [])

    useEffect(() => {
      if (loading) return
      // Delay navigation to ensure Root Layout is mounted
      const timer = setTimeout(() => {
        const inAuth = segments[0] === '(auth)'
        if (user && inAuth) {
          router.replace('/(tabs)')
        } else if (!user && !inAuth && !guestMode) {
          router.replace('/(auth)/login')
        }
      }, 100)
      return () => clearTimeout(timer)
    }, [user, segments, loading])

    async function checkAuth() {
      try {
        const token = await tp?.getToken()
        if (!token) { setLoading(false); onAuthReady?.(null); return }
        const me = await apiCall<User>('/auth/me')
        if (allowedRoles && !allowedRoles.includes(me.role)) {
          await tp?.clearTokens()
          setLoading(false)
          onAuthReady?.(null)
          return
        }
        setUser(me)
        onAuthReady?.(me)
      } catch {
        await tp?.clearTokens()
      } finally {
        setLoading(false)
      }
    }

    async function login(email: string, password: string) {
      const body: any = { email, password, platform }
      if (deviceName) body.device_name = deviceName
      const result = await apiCall<any>('/auth/login', {
        method: 'POST', body: JSON.stringify(body),
      })
      if (allowedRoles && !allowedRoles.includes(result.user.role)) {
        throw new Error('Энэ бүртгэлээр нэвтрэх боломжгүй')
      }
      await tp?.setTokens(result.access_token, result.refresh_token)
      setUser(result.user)
      onLogin?.(result.user)
    }

    async function register(data: { email: string; password: string; full_name: string; phone?: string }) {
      const result = await apiCall<any>('/auth/register', {
        method: 'POST', body: JSON.stringify({ ...data, platform }),
      })
      await tp?.setTokens(result.access_token, result.refresh_token)
      setUser(result.user)
      onLogin?.(result.user)
    }

    async function logout() {
      const userId = user?.id
      try {
        const rt = await tp?.getRefreshToken()
        if (rt) await apiCall('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token: rt }) })
      } catch {}
      await tp?.clearTokens()
      setUser(null)
      onLogout?.(userId)
    }

    const value: AuthContextType = {
      user, loading, login, logout,
      ...(enableRegister ? { register } : {}),
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  }

  return AuthProvider
}

export const useAuth = () => useContext(AuthContext)
export type { AuthContextType }
