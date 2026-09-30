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
import { SITE_NAME, SITE_URL, absoluteUrl, jsonLdScript } from '@/lib/seo'

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
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: '/',
      types: { 'application/rss+xml': `${SITE_URL}/posts/rss.xml` },
    },
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
      url: SITE_URL,
      locale: 'mn_MN',
      siteName: SITE_NAME,
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

/**
 * Сайтын хэмжээний бүтэцлэгдсэн өгөгдөл.
 *
 * Organization нь Google-д брэндийг танихад (knowledge panel, sitelinks),
 * WebSite + SearchAction нь хайлтын үр дүнд сайт дотоод хайлтын хэсэг
 * харуулахад хэрэглэгддэг.
 */
const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}#organization`,
      name: SITE_NAME,
      alternateName: 'BizPrint',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/icons/bizprint-icon-192.png'),
        width: 192,
        height: 192,
      },
      description:
        'Монголын хэвлэлийн онлайн платформ — нэрийн хуудас, постер, баннер, '
        + 'стикер болон бүх төрлийн хэвлэлийн захиалга, дизайн, хүргэлт.',
      areaServed: { '@type': 'Country', name: 'Mongolia' },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: 'mn-MN',
      publisher: { '@id': `${SITE_URL}#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(siteJsonLd) }}
        />
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
