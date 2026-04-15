'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    FB?: any
    fbAsyncInit?: () => void
  }
}

export default function FacebookMessengerChat() {
  const pathname = usePathname()
  const initialized = useRef(false)

  const PAGE_ID = process.env.NEXT_PUBLIC_FB_PAGE_ID || ''
  const APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID || ''

  // Hide on admin/staff pages to avoid clutter
  const isHidden = [
    '/admin', '/dashboard/factory', '/dashboard/vendor',
    '/designer', '/courier', '/sales', '/creator',
  ].some(p => pathname.startsWith(p))

  useEffect(() => {
    if (!PAGE_ID || isHidden || initialized.current) return
    if (typeof window === 'undefined') return
    initialized.current = true

    window.fbAsyncInit = function () {
      window.FB?.init({
        xfbml: true,
        version: 'v18.0',
        appId: APP_ID || undefined,
      })
    }

    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script')
      script.id = 'facebook-jssdk'
      script.src = 'https://connect.facebook.net/mn_MN/sdk/xfbml.customerchat.js'
      script.async = true
      script.defer = true
      script.crossOrigin = 'anonymous'
      document.body.appendChild(script)
    } else {
      window.FB?.XFBML?.parse()
    }
  }, [PAGE_ID, APP_ID, isHidden])

  if (!PAGE_ID || isHidden) return null

  return (
    <>
      <div id="fb-root" />
      <div
        className="fb-customerchat"
        // @ts-expect-error — non-standard FB SDK attrs
        attribution="biz_inbox"
        page_id={PAGE_ID}
        theme_color="#FF6B00"
        logged_in_greeting="Сайн байна уу! BizPrint-д тавтай морил 🖨️ Захиалга, үнэ тооцоолоход туслая!"
        logged_out_greeting="Сайн байна уу! BizPrint-д тавтай морил 🖨️ Захиалга, үнэ тооцоолоход туслая!"
        greeting_dialog_display="hide"
        greeting_dialog_delay="5"
      />
    </>
  )
}
