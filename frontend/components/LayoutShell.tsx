'use client'

import { usePathname } from 'next/navigation'
import AnnouncementBar from '@/components/AnnouncementBar'
import ChatWidget from '@/components/ChatWidget'
import ChatbotEmbed from '@/components/ChatbotEmbed'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import SiteHeader from '@/components/site/SiteHeader'
import { Contact as SiteFooter } from '@/components/site/sections'

/** login, register зэрэг full-page хуудсуудад Nav/Footer нуугдана */
const BARE_ROUTES = ['/login', '/register', '/design/editor', '/dashboard', '/admin', '/creator', '/designer', '/courier', '/sales', '/invite', '/loyalty', '/mobile', '/start']
/** Шинэ загвартай хуудсууд: өөрийн цэс, footer-той — зөвхөн чат widget-ууд үлдэнэ */
const OWN_CHROME_ROUTES = ['/', '/print']
/** admin/chat хуудсанд ChatWidget давхардахгүй (ChatLayout ашигладаг) */
const NO_CHAT_WIDGET = ['/admin/chat']

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { settings } = useSiteSettings()
  const isBare = BARE_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const onChatPage = NO_CHAT_WIDGET.some(r => pathname === r || pathname.startsWith(r + '/'))
  // 3rd-party chatbot configured → hide internal ChatWidget on public pages so the two
  // floating buttons don't overlap at bottom-right. Staff chat is still reachable via
  // /admin/chat and /dashboard/chat.
  const hasChatbot = !!(settings?.chatbot_embed_code && String(settings.chatbot_embed_code).trim())
  const hideChatWidget = onChatPage || hasChatbot

  if (isBare) {
    return <>{children}</>
  }

  if (OWN_CHROME_ROUTES.includes(pathname)) {
    return (
      <>
        {children}
        {!hideChatWidget && <ChatWidget />}
        <ChatbotEmbed />
      </>
    )
  }

  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main>{children}</main>
      {!hideChatWidget && <ChatWidget />}
      <ChatbotEmbed />
      <SiteFooter />
    </>
  )
}
