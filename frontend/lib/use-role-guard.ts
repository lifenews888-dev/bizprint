'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getDashboardRoute } from '@/config/sidebar-config'

interface User {
  id: string
  email: string
  full_name: string
  role: string
}

export function useRoleGuard(allowedRoles: string[]): { user: User | null; loading: boolean } {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const rolesRef = useRef(allowedRoles)
  rolesRef.current = allowedRoles
  const didRun = useRef(false)

  useEffect(() => {
    // Prevent double-run in strict mode
    if (didRun.current) return
    didRun.current = true

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      const stored = localStorage.getItem('user')

      if (!token || !stored) {
        setLoading(false)
        router.push('/login')
        return
      }

      const parsed = JSON.parse(stored)

      // superadmin & admin can access ALL pages
      const isAdmin = parsed.role === 'superadmin' || parsed.role === 'admin'
      if (!isAdmin && !rolesRef.current.includes(parsed.role)) {
        setLoading(false)
        router.push(getDashboardRoute(parsed.role))
        return
      }

      setUser(parsed)
      setLoading(false)
    } catch {
      setLoading(false)
      router.push('/login')
    }
  }, [router])

  return { user, loading }
}
