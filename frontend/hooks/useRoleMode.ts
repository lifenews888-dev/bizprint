'use client'

import { useState, useCallback } from 'react'

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
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function getInitialMode(user: UserData | null): RoleMode {
  if (typeof window === 'undefined') return 'customer'
  const stored = localStorage.getItem(STORAGE_KEY) as RoleMode | null
  return stored === 'creator' && user?.is_creator ? 'creator' : 'customer'
}

export function useRoleMode() {
  const [user] = useState<UserData | null>(() => getStoredUser())
  const [mode, setModeState] = useState<RoleMode>(() => getInitialMode(user))

  const isCreator = !!user?.is_creator
  const creatorStatus = user?.creator_status || null

  const setMode = useCallback((newMode: RoleMode) => {
    if (newMode === 'creator' && !user?.is_creator) return
    localStorage.setItem(STORAGE_KEY, newMode)
    setModeState(newMode)
  }, [user?.is_creator])

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
