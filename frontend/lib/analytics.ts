/**
 * Safe analytics helper for BizPrint.
 *
 * Wraps Google Analytics (gtag) and Facebook Pixel (fbq) calls so that:
 * - Missing scripts never throw
 * - SSR-safe (no `window` access on server)
 * - Calls are best-effort and silent on failure
 *
 * Usage:
 *   import { trackEvent } from '@/lib/analytics'
 *   trackEvent('cta_call_click', { location: 'mobile_sticky' })
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

export type EventParams = Record<string, string | number | boolean | undefined>

/**
 * Track a custom event in both GA4 and Facebook Pixel if available.
 * Never throws — every call is defensively wrapped.
 */
export function trackEvent(eventName: string, params: EventParams = {}): void {
  if (typeof window === 'undefined') return

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params)
    }
  } catch {}

  try {
    if (typeof window.fbq === 'function') {
      window.fbq('trackCustom', eventName, params)
    }
  } catch {}
}
