'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, Share2, Smartphone, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const HIDE_ON = [
  '/admin', '/dashboard', '/login', '/register', '/forgot-password',
  '/reset-password', '/checkout', '/design/editor', '/creator', '/designer',
  '/courier', '/sales', '/factory', '/mobile',
]

const DISMISS_KEY = 'bizprint_pwa_install_dismissed_until'
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000

function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

function isMobileDevice() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 768px)').matches && /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent)
}

function isIOSDevice() {
  if (typeof window === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(window.navigator.userAgent)
}

export default function PWAInstallPrompt() {
  const pathname = usePathname() || '/'
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSHelp, setShowIOSHelp] = useState(false)
  const [visible, setVisible] = useState(false)

  const hiddenRoute = useMemo(() => HIDE_ON.some(p => pathname === p || pathname.startsWith(p + '/')), [pathname])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (hiddenRoute || isStandalone() || !isMobileDevice()) return

    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || 0)
    if (dismissedUntil > Date.now()) return

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setVisible(true)
      trackEvent('pwa_install_prompt_show', { pathname, platform: 'android' })
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)

    const timer = window.setTimeout(() => {
      if (isIOSDevice()) {
        setShowIOSHelp(true)
        setVisible(true)
        trackEvent('pwa_install_prompt_show', { pathname, platform: 'ios' })
      }
    }, 2500)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.clearTimeout(timer)
    }
  }, [hiddenRoute, pathname])

  if (!visible || hiddenRoute) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS))
    setVisible(false)
    trackEvent('pwa_install_prompt_dismiss', { pathname })
  }

  const install = async () => {
    if (!deferredPrompt) {
      setShowIOSHelp(true)
      return
    }

    trackEvent('pwa_install_prompt_click', { pathname })
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    trackEvent('pwa_install_prompt_result', { pathname, outcome: choice.outcome, platform: choice.platform })
    setDeferredPrompt(null)
    setVisible(false)
  }

  return (
    <div
      className="md:hidden fixed left-3 right-3 z-[70]"
      style={{ bottom: 'calc(78px + env(safe-area-inset-bottom, 0px))' }}
      role="dialog"
      aria-label="Bizprint утсанд суулгах"
    >
      <div className="rounded-2xl border border-white/12 bg-[#111827] text-white shadow-2xl shadow-black/30">
        <div className="flex items-start gap-3 p-3">
          <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#FF6B00]">
            <Smartphone className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-black leading-tight">Bizprint-г утсандаа суулгах</div>
            <div className="mt-1 text-xs leading-snug text-white/70">
              Захиалга, үнэ тооцоолол, бүтээгдэхүүн сонголт руу browser нээхгүй шууд орно.
            </div>
            {showIOSHelp && !deferredPrompt && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-white/80">
                <Share2 className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                Safari дээр Share товч → Add to Home Screen.
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={install}
                className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-3 text-xs font-bold text-white active:scale-[0.98]"
              >
                <Download className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                Суулгах
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="h-9 rounded-lg border border-white/10 bg-white/10 px-3 text-xs font-semibold text-white/80 active:scale-[0.98]"
              >
                Дараа
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/8 text-white/70"
            aria-label="Хаах"
          >
            <X className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
