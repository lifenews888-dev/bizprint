import type { Metadata } from 'next'
import './globals.css'
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext'
import MegaNav from '@/components/nav/MegaNav'
import AnnouncementBar from '@/components/AnnouncementBar'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'

export const metadata: Metadata = {
  title: 'BizPrint — Хэвлэл, Дизайн, Бизнес Платформ',
  description: 'AI-д суурилсан хэвлэлийн үнийн тооцоо, автомат үйлдвэр сонголт, бодит цагийн хүргэлт',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <SiteSettingsProvider>
          <AnnouncementBar />
          <MegaNav />
          <main>{children}</main>
          <ChatWidget />
          <Footer />
        </SiteSettingsProvider>
      </body>
    </html>
  )
}
