import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext'
import { RealtimeProvider } from '@/contexts/RealtimeContext'
import LayoutShell from '@/components/LayoutShell'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Toaster } from '@/components/ui/sonner'
import FacebookPixel from '@/components/FacebookPixel'
import FacebookMessengerChat from '@/components/FacebookMessengerChat'
import { UTMTracker } from '@/components/UTMTracker'
import MobileStickyCTA from '@/components/MobileStickyCTA'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const FALLBACK_TITLE = 'Bizprint.mn — Хэвлэлийн үйлчилгээ, нэрийн хуудас, баннер, постер хэвлэх'
const FALLBACK_DESC = 'Bizprint.mn дээр нэрийн хуудас, постер, баннер, меню, стикер, ширээний туг болон бүх төрлийн хэвлэлийн захиалгаа өгнө. Дизайн, хэвлэл, хүргэлт нэг дор.'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export async function generateMetadata(): Promise<Metadata> {
  let title = FALLBACK_TITLE
  let description = FALLBACK_DESC
  let ogImage: string | undefined
  let favicon: string | undefined

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`${API}/api/cms/settings/public`, { next: { revalidate: 60 }, signal: controller.signal })
    clearTimeout(timeout)
    if (res.ok) {
      const s = await res.json()
      title = s.seo_meta_title || s.site_name || FALLBACK_TITLE
      description = s.seo_meta_description || FALLBACK_DESC
      ogImage = s.seo_og_image || undefined
      favicon = s.site_favicon || undefined
    }
  } catch {}

  return {
    title,
    description,
    manifest: '/manifest.webmanifest',
    applicationName: 'Bizprint.mn',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Bizprint',
    },
    formatDetection: {
      telephone: true,
    },
    icons: favicon ? { icon: favicon } : undefined,
    openGraph: {
      type: 'website',
      locale: 'mn_MN',
      siteName: 'Bizprint.mn',
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Bizprint" />
        <meta name="theme-color" content="#FF6B00" />
        <link rel="apple-touch-icon" href="/icons/bizprint-icon-192.png" />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
            <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');` }} />
          </>
        )}
      </head>
      <body suppressHydrationWarning>
        <ErrorBoundary />
        <RealtimeProvider>
          <SiteSettingsProvider>
            <LayoutShell>{children}</LayoutShell>
            <MobileStickyCTA />
            <PWAInstallPrompt />
            <Toaster richColors position="bottom-right" />
            <FacebookPixel />
            <FacebookMessengerChat />
            <UTMTracker />
          </SiteSettingsProvider>
        </RealtimeProvider>
      </body>
    </html>
  )
}
