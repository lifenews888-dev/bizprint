'use client'
import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
    _fbq?: any
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || ''

function FacebookPixelInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Load FB Pixel script once
  useEffect(() => {
    if (!PIXEL_ID || typeof window === 'undefined' || window.fbq) return

    const script = document.createElement('script')
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${PIXEL_ID}');
      fbq('track', 'PageView');
    `
    document.head.appendChild(script)

    // Noscript fallback
    const noscript = document.createElement('noscript')
    const img = document.createElement('img')
    img.height = 1
    img.width = 1
    img.style.display = 'none'
    img.src = `https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`
    noscript.appendChild(img)
    document.body.appendChild(noscript)
  }, [])

  // Track page views on route change
  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView')
    }
  }, [pathname, searchParams])

  return null
}

export default function FacebookPixel() {
  return (
    <Suspense fallback={null}>
      <FacebookPixelInner />
    </Suspense>
  )
}

// ═══ Tracking helpers ═══
export const fbPixel = {
  pageView: () => {
    if (typeof window !== 'undefined' && window.fbq) window.fbq('track', 'PageView')
  },

  viewContent: (data: { productId: string; name: string; price: number; category?: string }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: [data.productId],
        content_name: data.name,
        content_type: 'product',
        content_category: data.category || 'print',
        value: data.price,
        currency: 'MNT',
      })
    }
  },

  initiateCheckout: (data: { value: number; productName?: string }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        value: data.value,
        currency: 'MNT',
        content_name: data.productName,
      })
    }
  },

  purchase: (data: { orderId: string; value: number; productName?: string }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        value: data.value,
        currency: 'MNT',
        content_ids: [data.orderId],
        content_name: data.productName,
      })
    }
  },

  lead: (data?: { contentName?: string }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead', {
        content_name: data?.contentName || 'Inquiry',
      })
    }
  },

  search: (query: string) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Search', { search_string: query })
    }
  },

  addToCart: (data: { productId: string; name: string; price: number }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_ids: [data.productId],
        content_name: data.name,
        value: data.price,
        currency: 'MNT',
      })
    }
  },

  completeRegistration: () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'CompleteRegistration')
    }
  },

  custom: (eventName: string, data?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', eventName, data)
    }
  },
}

// Backwards-compat alias
export const fbTrack = (event: string, data?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, data)
  }
}
