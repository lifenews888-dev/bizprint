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

  useEffect(() => {
    let mounted = true

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      const stored = localStorage.getItem('user')

      if (!token || !stored) {
        router.push('/login')
        return
      }

      const parsed = JSON.parse(stored)

      if (!rolesRef.current.includes(parsed.role)) {
        router.push(getDashboardRoute(parsed.role))
        return
      }

      if (mounted) {
        setUser(parsed)
        setLoading(false)
      }
    } catch {
      router.push('/login')
    }

    return () => { mounted = false }
  }, [router])

  return { user, loading }
}
