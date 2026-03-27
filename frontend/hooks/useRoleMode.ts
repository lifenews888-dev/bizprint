'use client'

import { useState, useCallback, useEffect } from 'react'

/* ═══════════════════════════════════════
 *  Role Mode — customer / creator switching
 *
 *  Users with is_creator=true can toggle between
 *  customer mode and creator mode. This affects
 *  which sidebar menu and dashboard they see.
 * ═══════════════════════════════════════ */

export type RoleMode = 'customer' | 'creator'

const STORAGE_KEY = 'bizprint_role_mode'

interface UserData {
  id?: string
  role?: string
  is_creator?: boolean
  creator_status?: string
  creator_capabilities?: string[]
  full_name?: string
  email?: string
}

function getStoredUser(): UserData | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function useRoleMode() {
  const [mode, setModeState] = useState<RoleMode>('customer')
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    const u = getStoredUser()
    setUser(u)

    // Only allow creator mode if user is approved creator
    const stored = localStorage.getItem(STORAGE_KEY) as RoleMode | null
    if (stored === 'creator' && u?.is_creator) {
      setModeState('creator')
    } else {
      setModeState('customer')
    }
  }, [])

  const isCreator = !!user?.is_creator
  const creatorStatus = user?.creator_status || null

  const setMode = useCallback((newMode: RoleMode) => {
    localStorage.setItem(STORAGE_KEY, newMode)
    setModeState(newMode)
  }, [])

  const toggleMode = useCallback(() => {
    setMode(mode === 'customer' ? 'creator' : 'customer')
  }, [mode, setMode])

  return {
    mode,
    setMode,
    toggleMode,
    isCreator,
    creatorStatus,
    user,
  }
}
