'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Smartphone, X, Copy, Check, MoreVertical } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

declare global {
  interface Window {
    __bizprintInstallEvent?: BeforeInstallPromptEvent | null
  }
}

const HIDE_ON = [
  '/admin', '/dashboard', '/login', '/register', '/forgot-password',
  '/reset-password', '/checkout', '/design/editor', '/creator', '/designer',
  '/courier', '/sales', '/factory', '/mobile',
]

const DISMISS_KEY = 'bizprint_pwa_install_dismissed_until'
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000

/** Суулгасан апп дотроос нээгдсэн эсэх */
function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

function isIOS() {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  // iPadOS 13+ нь өөрийгөө Mac гэж танилцуулдаг тул мэдрэгчээр ялгана
  return /iPhone|iPad|iPod/i.test(ua)
    || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
}

/**
 * Нүүр дэлгэцэд нэмэх нь зөвхөн Safari (болон iOS Chrome)-д боломжтой.
 * Facebook, Instagram зэрэг апп доторх browser-т энэ цэс огт байдаггүй —
 * хэрэглэгч тэнд хичнээн дарсан ч суулгаж чадахгүй тул үүнийг ялгаж хэлнэ.
 */
function isIOSInAppBrowser() {
  if (typeof window === 'undefined') return false
  return /FBAN|FBAV|Instagram|Line|MicroMessenger|Twitter|Snapchat/i.test(window.navigator.userAgent)
}

function isMobileViewport() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 768px)').matches
}

function isMobileDevice() {
  if (typeof window === 'undefined') return false
  return isMobileViewport() && (/Android/i.test(window.navigator.userAgent) || isIOS())
}

export default function PWAInstallPrompt() {
  const pathname = usePathname() || '/'
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const hiddenRoute = useMemo(
    () => HIDE_ON.some(p => pathname === p || pathname.startsWith(p + '/')),
    [pathname],
  )

  useEffect(() => {
    if (hiddenRoute || isStandalone() || !isMobileDevice()) return

    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || 0)
    if (dismissedUntil > Date.now()) return

    let active = true

    const showAndroidBanner = () => {
      const event = window.__bizprintInstallEvent
      if (!active || !event) return
      setDeferredPrompt(event)
      setVisible(true)
      trackEvent('pwa_install_prompt_show', { pathname, platform: 'android' })
    }
    const onInstalled = () => { setVisible(false); setGuideOpen(false) }

    window.addEventListener('bizprint:installable', showAndroidBanner)
    window.addEventListener('bizprint:installed', onInstalled)

    // layout-ын bootstrap script эвентийг энэ компонент mount хийгдэхээс өмнө
    // барьсан байж болзошгүй — тэр тохиолдлыг нэг tick хойшлуулж шалгана
    const captured = window.setTimeout(showAndroidBanner, 0)

    // iOS дээр beforeinstallprompt гэж байхгүй — заавраар л суулгана
    const iosTimer = window.setTimeout(() => {
      if (!active || !isIOS()) return
      setVisible(true)
      trackEvent('pwa_install_prompt_show', { pathname, platform: 'ios' })
    }, 2500)

    return () => {
      active = false
      window.removeEventListener('bizprint:installable', showAndroidBanner)
      window.removeEventListener('bizprint:installed', onInstalled)
      window.clearTimeout(captured)
      window.clearTimeout(iosTimer)
    }
  }, [hiddenRoute, pathname])

  // Цэсний "Утсандаа суулгах" товчноос дуудна. Банner-ийг хойшлуулсан ч
  // хэрэглэгч хүссэн үедээ зааврыг нээж чадах ёстой.
  useEffect(() => {
    const open = () => {
      const event = window.__bizprintInstallEvent
      if (event) { setDeferredPrompt(event); void event.prompt() } else { setGuideOpen(true) }
    }
    window.addEventListener('bizprint:open-install', open)
    return () => window.removeEventListener('bizprint:open-install', open)
  }, [])

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS))
    setVisible(false)
    setGuideOpen(false)
    trackEvent('pwa_install_prompt_dismiss', { pathname })
  }, [pathname])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard хориотой бол хэрэглэгч гараар хуулна */
    }
  }

  /**
   * Android дээр жинхэнэ суулгах цонхыг нээнэ. Бусад тохиолдолд (iOS, эсвэл
   * Chrome эвентээ өгөөгүй үед) зааврыг нээнэ — өмнө нь энд юу ч болдоггүй
   * байсан тул товч "дарагдахгүй" мэт санагддаг байсан.
   */
  const install = async () => {
    if (!deferredPrompt) {
      setGuideOpen(true)
      trackEvent('pwa_install_guide_open', { pathname, platform: isIOS() ? 'ios' : 'android' })
      return
    }
    trackEvent('pwa_install_prompt_click', { pathname })
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      trackEvent('pwa_install_prompt_result', { pathname, outcome: choice.outcome, platform: choice.platform })
      window.__bizprintInstallEvent = null
      setDeferredPrompt(null)
      setVisible(false)
    } catch {
      // Эвент нэг л удаа ашиглагдана; дахин дарвал заавраар үргэлжилнэ
      setGuideOpen(true)
    }
  }

  if ((!visible && !guideOpen) || hiddenRoute) return null

  return (
    <>
      {visible && (
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
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={install}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-3 text-xs font-bold text-white active:scale-[0.98]"
                >
                  <Download className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                  {deferredPrompt ? 'Суулгах' : 'Хэрхэн суулгах вэ'}
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
      )}

      {guideOpen && (
        <InstallGuide onClose={() => setGuideOpen(false)} onCopyLink={copyLink} copied={copied} />
      )}
    </>
  )
}

/** iOS-ийн Share тэмдэг — lucide-д байхгүй тул inline SVG */
function ShareGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v13" />
      <path d="m8 7 4-4 4 4" />
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
    </svg>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#FF6B00] text-[11px] font-black text-white">
        {n}
      </span>
      <span className="text-[13px] leading-relaxed text-white/85">{children}</span>
    </li>
  )
}

function InstallGuide({
  onClose, onCopyLink, copied,
}: { onClose: () => void; onCopyLink: () => void; copied: boolean }) {
  const ios = isIOS()
  const inApp = ios && isIOSInAppBrowser()

  return (
    <div className="fixed inset-0 z-[90] flex items-end" role="dialog" aria-modal="true" aria-label="Суулгах заавар">
      <button
        type="button"
        aria-label="Хаах"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div
        className="relative w-full rounded-t-2xl border-t border-white/10 bg-[#111827] p-5 text-white"
        style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-base font-black">Утсандаа суулгах</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Хаах"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/70"
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>

        {inApp ? (
          <>
            <p className="mb-4 text-[13px] leading-relaxed text-white/75">
              Та Facebook/Instagram зэрэг аппын дотоод browser-ээр нээсэн байна.
              Эндээс утсанд суулгах боломжгүй — хаягийг хуулаад{' '}
              <strong className="text-white">Safari</strong> дээр нээнэ үү.
            </p>
            <button
              type="button"
              onClick={onCopyLink}
              className="mb-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B00] text-sm font-bold text-white active:scale-[0.99]"
            >
              {copied ? <><Check className="h-4 w-4" />Хуулагдлаа</> : <><Copy className="h-4 w-4" />bizprint.mn хаягийг хуулах</>}
            </button>
            <p className="text-[12px] leading-relaxed text-white/60">
              Safari нээгээд хаягийг буулгаад, доорх алхмуудыг дагана уу.
            </p>
            <ol className="mt-3 space-y-2.5">
              <Step n={1}>Доод талын <ShareGlyph /> <strong className="text-white">Share</strong> товчийг дарна</Step>
              <Step n={2}>Жагсаалтыг гүйлгээд <strong className="text-white">&laquo;Add to Home Screen&raquo;</strong> (Нүүр дэлгэцэд нэмэх) сонгоно</Step>
              <Step n={3}>Баруун дээд буланд <strong className="text-white">&laquo;Add&raquo;</strong> дарна</Step>
            </ol>
          </>
        ) : ios ? (
          <>
            <p className="mb-4 text-[13px] leading-relaxed text-white/75">
              iPhone дээр суулгах товч байдаггүй — Safari-гийн Share цэснээс нэмнэ.
              3 алхам:
            </p>
            <ol className="space-y-3">
              <Step n={1}>
                Дэлгэцийн доод талд байрлах <span className="mx-0.5 inline-flex h-6 w-6 translate-y-1.5 items-center justify-center rounded-md bg-white/10"><ShareGlyph /></span> <strong className="text-white">Share</strong> товчийг дарна
              </Step>
              <Step n={2}>
                Нээгдсэн жагсаалтыг доош гүйлгээд <strong className="text-white">&laquo;Add to Home Screen&raquo;</strong> эсвэл <strong className="text-white">&laquo;Нүүр дэлгэцэд нэмэх&raquo;</strong>-ийг сонгоно
              </Step>
              <Step n={3}>
                Баруун дээд буланд гарах <strong className="text-white">&laquo;Add&raquo;</strong> (Нэмэх)-ийг дарна
              </Step>
            </ol>
            <p className="mt-4 rounded-lg bg-white/5 p-3 text-[12px] leading-relaxed text-white/60">
              Share товч харагдахгүй бол дэлгэцээ бага зэрэг доош гүйлгэнэ үү — Safari-гийн
              хэрэглүүрийн мөр нуугдсан байж болно.
            </p>
          </>
        ) : (
          <>
            <p className="mb-4 text-[13px] leading-relaxed text-white/75">
              Chrome-ын цэснээс суулгана:
            </p>
            <ol className="space-y-3">
              <Step n={1}>
                Баруун дээд буланд байрлах <span className="mx-0.5 inline-flex h-6 w-6 translate-y-1.5 items-center justify-center rounded-md bg-white/10"><MoreVertical className="h-3.5 w-3.5" /></span> цэсийг дарна
              </Step>
              <Step n={2}>
                <strong className="text-white">&laquo;Install app&raquo;</strong> эсвэл <strong className="text-white">&laquo;Add to Home screen&raquo;</strong>-ийг сонгоно
              </Step>
              <Step n={3}>
                <strong className="text-white">&laquo;Install&raquo;</strong> дарж баталгаажуулна
              </Step>
            </ol>
            <p className="mt-4 rounded-lg bg-white/5 p-3 text-[12px] leading-relaxed text-white/60">
              Энэ сонголт харагдахгүй бол аппыг аль хэдийн суулгасан байж магадгүй —
              утасныхаа нүүр дэлгэцээс шалгана уу.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
