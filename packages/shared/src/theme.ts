// ─── BizPrint Unified Design Tokens ────────────────
// Single source of truth — synced with web app (bizprint-customer)
// All mobile apps consume these tokens for visual consistency.

// ─── Colors ─────────────────────────────────────────

export const colors = {
  // Backgrounds
  bg: '#050505',
  bg2: '#0a0a0a',

  // Surface layers (cards, sheets, modals)
  surface: '#111111',
  surface2: '#181818',
  surface3: '#1e1e1e',

  // Borders
  border: '#222222',
  border2: '#2a2a2a',

  // Text hierarchy
  text: '#f5f5f5',
  text2: '#a3a3a3',
  text3: '#666666',
  text4: '#444444',

  // Brand accent (orange) — web: #f97316
  accent: '#f97316',
  accentHover: '#ea580c',
  accentBg: 'rgba(249,115,22,0.12)',
  accentGlow: 'rgba(249,115,22,0.25)',

  // Semantic
  success: '#10B981',
  successBg: 'rgba(16,185,129,0.12)',
  error: '#EF4444',
  errorBg: 'rgba(239,68,68,0.12)',
  warning: '#F59E0B',
  warningBg: 'rgba(245,158,11,0.12)',
  info: '#3B82F6',
  infoBg: 'rgba(59,130,246,0.12)',
  purple: '#8B5CF6',
  purpleBg: 'rgba(139,92,246,0.12)',
  pink: '#EC4899',
  pinkBg: 'rgba(236,72,153,0.12)',
} as const

// ─── Spacing Scale ──────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const

// ─── Border Radius ──────────────────────────────────

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,    // cards, sheets
  full: 9999, // badges, pills, avatars
} as const

// ─── Typography ─────────────────────────────────────

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  display: 32,
} as const

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
}

// ─── Component Sizes ────────────────────────────────

export const componentSize = {
  buttonMinHeight: 48,
  inputMinHeight: 48,
  headerHeight: 56,
  tabBarHeight: 60,
  iconButton: 44,
  avatarSm: 36,
  avatarMd: 44,
  avatarLg: 80,
} as const

// ─── Timing (ms) ────────────────────────────────────

export const timing = {
  fast: 120,
  normal: 200,
  slow: 350,
} as const

// ─── App-specific primary overrides ─────────────────
// Each app can use createAppTheme() to get a full theme
// with its own primary color while sharing all other tokens.

export type AppVariant = 'customer' | 'driver' | 'courier'

const appPrimary: Record<AppVariant, { primary: string; primaryHover: string; primaryBg: string }> = {
  customer: { primary: '#f97316', primaryHover: '#ea580c', primaryBg: 'rgba(249,115,22,0.12)' },
  driver:   { primary: '#f97316', primaryHover: '#ea580c', primaryBg: 'rgba(249,115,22,0.12)' },
  courier:  { primary: '#7C3AED', primaryHover: '#6D28D9', primaryBg: 'rgba(124,58,237,0.12)' },
}

export function createAppTheme(variant: AppVariant) {
  const p = appPrimary[variant]
  return {
    colors: { ...colors, primary: p.primary, primaryHover: p.primaryHover, primaryBg: p.primaryBg },
    spacing,
    radius,
    fontSize,
    fontWeight,
    componentSize,
    timing,
  } as const
}

// Default theme (customer/driver — orange)
export const theme = createAppTheme('customer')
export type Theme = ReturnType<typeof createAppTheme>
