'use client'
import Link from 'next/link'
import { useSyncExternalStore } from 'react'

interface ProGateProps {
  feature: string
  description?: string
  children: React.ReactNode
  plan?: 'basic' | 'pro' | 'business'
}

const PLAN_LEVELS: Record<string, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  business: 3,
}

const subscribeStorage = (onStoreChange: () => void) => {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', onStoreChange)
  window.addEventListener('bizprint-storage', onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener('bizprint-storage', onStoreChange)
  }
}

const getUserSnapshot = () =>
  typeof window === 'undefined' ? null : localStorage.getItem('user') || ''

const getServerUserSnapshot = () => null

function getUserPlan(snapshot: string | null): string | null {
  if (snapshot === null) return null
  try {
    const user = JSON.parse(snapshot || '{}') as Record<string, unknown>
    return String(user.subscription_plan || user.plan || 'free')
  } catch {
    return 'free'
  }
}

const PLAN_LABEL: Record<string, string> = {
  basic: 'Basic',
  pro: 'Pro',
  business: 'Business',
}

export default function ProGate({ feature, description, children, plan = 'basic' }: ProGateProps) {
  const userSnapshot = useSyncExternalStore(subscribeStorage, getUserSnapshot, getServerUserSnapshot)
  const userPlan = getUserPlan(userSnapshot)

  // Prevent hydration mismatch — render children on server
  if (userPlan === null) return <>{children}</>

  const hasAccess = PLAN_LEVELS[userPlan] >= PLAN_LEVELS[plan]
  if (hasAccess) return <>{children}</>

  return (
    <div style={{ position: 'relative' }}>
      {/* Blurred preview */}
      <div style={{ pointerEvents: 'none', userSelect: 'none', opacity: 0.3, filter: 'blur(3px)' }}>
        {children}
      </div>

      {/* Lock overlay */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, textAlign: 'center', maxWidth: 360, width: '100%', boxShadow: '0 20px 48px rgba(0,0,0,0.15)' }}>
          <div style={{ width: 48, height: 48, background: 'rgba(255,107,0,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="22" height="22" fill="none" stroke="#FF6B00" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{feature}</h3>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
            {description || `Энэ боломжийг ашиглахад ${PLAN_LABEL[plan]} төлөвлөгөө шаардлагатай`}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/pricing" style={{ flex: 1, padding: '10px 0', background: '#FF6B00', color: '#fff', borderRadius: 12, fontSize: 12, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>
              Upgrade
            </Link>
            <Link href="/pricing" style={{ flex: 1, padding: '10px 0', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12, color: 'var(--text2)', textAlign: 'center', textDecoration: 'none' }}>
              Харах
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
