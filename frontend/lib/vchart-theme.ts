/**
 * BizPrint — VisActor VChart Theme Configuration
 *
 * Maps the project's CSS variable system (data-theme="dark"/"light")
 * to VisActor chart themes for seamless dark/light mode support.
 *
 * Brand palette:
 *   Primary:   #FF6B00 (orange)
 *   Secondary: #8B5CF6 (purple)
 *   Success:   #10B981
 *   Warning:   #F59E0B
 *   Danger:    #EF4444
 *   Info:      #3B82F6
 */

// ─── Color Palette ──────────────────────────────────────────────

export const BRAND = {
  primary:   '#FF6B00',
  secondary: '#8B5CF6',
  success:   '#10B981',
  warning:   '#F59E0B',
  danger:    '#EF4444',
  info:      '#3B82F6',
  pink:      '#EC4899',
  cyan:      '#06B6D4',
} as const

// Chart series colors — consistent across both themes
export const SERIES_COLORS = [
  BRAND.primary,    // orange
  BRAND.secondary,  // purple
  BRAND.info,       // blue
  BRAND.success,    // green
  BRAND.warning,    // amber
  BRAND.danger,     // red
  BRAND.pink,       // pink
  BRAND.cyan,       // cyan
]

// ─── Theme Tokens ───────────────────────────────────────────────

export interface ChartThemeTokens {
  bg: string
  surface: string
  surface2: string
  border: string
  text: string
  text2: string
  text3: string
  gridLine: string
}

const DARK_TOKENS: ChartThemeTokens = {
  bg:       '#0A0A0A',
  surface:  '#111111',
  surface2: '#1A1A1A',
  border:   '#2A2A2A',
  text:     '#F1F5F9',
  text2:    '#94A3B8',
  text3:    '#64748B',
  gridLine: 'rgba(255,255,255,0.06)',
}

const LIGHT_TOKENS: ChartThemeTokens = {
  bg:       '#FFFFFF',
  surface:  '#FFFFFF',
  surface2: '#F8F8F8',
  border:   '#E5E7EB',
  text:     '#111827',
  text2:    '#4B5563',
  text3:    '#9CA3AF',
  gridLine: 'rgba(0,0,0,0.06)',
}

export function getTokens(isDark: boolean): ChartThemeTokens {
  return isDark ? DARK_TOKENS : LIGHT_TOKENS
}

// ─── VisActor Theme Object ─────────────────────────────────────

export function buildVChartTheme(isDark: boolean) {
  const t = getTokens(isDark)

  return {
    colorScheme: {
      default: SERIES_COLORS,
    },
    series: {
      bar: {
        bar: {
          style: { cornerRadius: [4, 4, 0, 0] },
        },
      },
    },
    component: {
      axis: {
        label: {
          style: { fill: t.text3, fontSize: 11 },
        },
        tick: {
          style: { stroke: t.border },
        },
        domainLine: {
          style: { stroke: t.border },
        },
        grid: {
          style: { stroke: t.gridLine, lineDash: [3, 3] },
        },
      },
      tooltip: {
        panel: {
          style: {
            backgroundColor: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            boxShadow: isDark
              ? '0 8px 32px rgba(0,0,0,0.5)'
              : '0 8px 32px rgba(0,0,0,0.12)',
          },
        },
        titleLabel: {
          style: { fill: t.text, fontSize: 12, fontWeight: 600 },
        },
        keyLabel: {
          style: { fill: t.text2, fontSize: 11 },
        },
        valueLabel: {
          style: { fill: t.text, fontSize: 11, fontWeight: 700 },
        },
      },
      legend: {
        item: {
          label: {
            style: { fill: t.text2, fontSize: 11 },
          },
        },
      },
    },
    background: 'transparent',
  }
}

// ─── Helpers ────────────────────────────────────────────────────

/** Format number as Mongolian currency ₮ */
export function fmtCurrency(n: number): string {
  return '₮' + Math.round(n).toLocaleString('mn-MN')
}

/** Format number with K/M suffix */
export function fmtCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return String(n)
}

/** Detect current theme from DOM */
export function isDarkTheme(): boolean {
  if (typeof document === 'undefined') return true
  return document.documentElement.getAttribute('data-theme') !== 'light'
}
