export const colors = {
  primary: '#FF6B00',
  primaryLight: '#FFF7ED',
  primaryDark: '#E55D00',
  secondary: '#8B5CF6',
  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  bg: '#F3F4F6',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
} as const

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 } as const

export const shadows = {
  soft: '0 1px 3px rgba(0,0,0,0.06)',
  medium: '0 4px 12px rgba(0,0,0,0.08)',
  strong: '0 8px 24px rgba(0,0,0,0.12)',
} as const

export const transitions = {
  fast: { duration: 0.15 },
  normal: { duration: 0.3 },
  slow: { duration: 0.5 },
  spring: { type: 'spring' as const, stiffness: 400, damping: 25 },
  springBounce: { type: 'spring' as const, stiffness: 300, damping: 15 },
} as const
