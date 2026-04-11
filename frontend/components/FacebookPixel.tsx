'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window { fbq: any; _fbq: any }
}

export default function FacebookPixel() {
  const pathname = usePathname()
  const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID

  useEffect(() => {
    if (!pixelId || typeof window === 'undefined') return
    if (window.fbq) return
    const n: any = (window.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    })
    if (!window._fbq) window._fbq = n
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = []
    const t = document.createElement('script')
    t.async = true
    t.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(t)
    window.fbq('init', pixelId)
    window.fbq('track', 'PageView')
  }, [pixelId])

  useEffect(() => {
    if (!pixelId || !window.fbq) return
    window.fbq('track', 'PageView')
  }, [pathname, pixelId])

  return null
}

export const fbTrack = (event: string, data?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, data)
  }
}
