import type { Metadata } from 'next'
import './globals.css'
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext'
import { RealtimeProvider } from '@/contexts/RealtimeContext'
import LayoutShell from '@/components/LayoutShell'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Toaster } from '@/components/ui/sonner'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`${API}/cms/settings/public`, { next: { revalidate: 60 }, signal: controller.signal })
    clearTimeout(timeout)
    if (res.ok) {
      const s = await res.json()
      return {
        title: s.seo_meta_title || s.site_name || 'BizPrint — Хэвлэл, Дизайн, Бизнес Платформ',
        description: s.seo_meta_description || 'AI-д суурилсан хэвлэлийн үнийн тооцоо, автомат үйлдвэр сонголт',
        openGraph: s.seo_og_image ? { images: [{ url: s.seo_og_image }] } : undefined,
        icons: s.site_favicon ? { icon: s.site_favicon } : undefined,
      }
    }
  } catch {}
  return {
    title: 'BizPrint — Хэвлэл, Дизайн, Бизнес Платформ',
    description: 'AI-д суурилсан хэвлэлийн үнийн тооцоо, автомат үйлдвэр сонголт, бодит цагийн хүргэлт',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <ErrorBoundary />
        <RealtimeProvider>
          <SiteSettingsProvider>
            <LayoutShell>{children}</LayoutShell>
            <Toaster richColors position="bottom-right" />
          </SiteSettingsProvider>
        </RealtimeProvider>
      </body>
    </html>
  )
}
