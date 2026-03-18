import type { Metadata } from 'next'
import './globals.css'
import { AnnouncementBar, ChatWidget } from '@/components/marketing'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'BizPrint',
  description: 'Print Factory Operating System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" data-theme="dark">
      <body>
        <AnnouncementBar />
        {children}
        <ChatWidget />
        <Footer />
      </body>
    </html>
  )
}