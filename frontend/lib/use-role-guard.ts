'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDashboardRoute } from '@/config/sidebar-config'

interface User {
  id: string
  email: string
  full_name: string
  role: string
}

/**
 * Hook that checks if the current user has the required role.
 * Redirects to login if no auth, or to their correct dashboard if wrong role.
 * Returns { user, loading } — render nothing until loading is false.
 */
export function useRoleGuard(allowedRoles: string[]): { user: User | null; loading: boolean } {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    const stored = localStorage.getItem('user')

    if (!token || !stored) {
      router.push('/login')
      return
    }

    try {
      const parsed = JSON.parse(stored)
      if (!allowedRoles.includes(parsed.role)) {
        // Wrong role — redirect to their correct dashboard
        router.push(getDashboardRoute(parsed.role))
        return
      }
      setUser(parsed)
    } catch {
      router.push('/login')
      return
    }

    setLoading(false)
  }, [allowedRoles, router])

  return { user, loading }
}
