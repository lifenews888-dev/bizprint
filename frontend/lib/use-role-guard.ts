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

interface RoleGuardState {
  user: User | null
  redirectTo: string | null
}

function getInitialRoleGuardState(allowedRoles: string[]): RoleGuardState {
  if (typeof window === 'undefined') {
    return { user: null, redirectTo: null }
  }

  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    const stored = localStorage.getItem('user')

    if (!token || !stored) {
      return { user: null, redirectTo: '/login' }
    }

    const parsed = JSON.parse(stored) as User

    // superadmin & admin can access ALL pages
    const isAdmin = parsed.role === 'superadmin' || parsed.role === 'admin'
    if (!isAdmin && !allowedRoles.includes(parsed.role)) {
      return { user: null, redirectTo: getDashboardRoute(parsed.role) }
    }

    return { user: parsed, redirectTo: null }
  } catch {
    return { user: null, redirectTo: '/login' }
  }
}

export function useRoleGuard(allowedRoles: string[]): { user: User | null; loading: boolean } {
  const router = useRouter()
  const [guardState] = useState(() => getInitialRoleGuardState(allowedRoles))

  useEffect(() => {
    if (guardState.redirectTo) {
      router.push(guardState.redirectTo)
    }
  }, [guardState.redirectTo, router])

  return { user: guardState.user, loading: !guardState.user }
}
