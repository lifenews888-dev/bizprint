'use client'

import { usePathname } from 'next/navigation'
import MegaNav from '@/components/nav/MegaNav'
import AnnouncementBar from '@/components/AnnouncementBar'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import AiChatWidget from '@/components/AiChatWidget'
import MobileBottomNav from '@/components/MobileBottomNav'

/** login, register зэрэг full-page хуудсуудад Nav/Footer нуугдана */
const BARE_ROUTES = ['/login', '/register', '/design/editor', '/dashboard', '/admin', '/creator', '/designer', '/courier', '/sales', '/invite', '/loyalty', '/mobile']
/** admin/chat хуудсанд ChatWidget давхардахгүй (ChatLayout ашигладаг) */
const NO_CHAT_WIDGET = ['/admin/chat']

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isBare = BARE_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const hideChatWidget = NO_CHAT_WIDGET.some(r => pathname === r || pathname.startsWith(r + '/'))

  if (isBare) {
    return <>{children}</>
  }

  return (
    <>
      <AnnouncementBar />
      <MegaNav />
      <main>{children}</main>
      {!hideChatWidget && <ChatWidget />}
      <AiChatWidget />
      <Footer />
      <MobileBottomNav />
    </>
  )
}
