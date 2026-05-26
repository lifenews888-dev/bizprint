'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import MegaNav from '@/components/nav/MegaNav'
import AnnouncementBar from '@/components/AnnouncementBar'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import ChatbotEmbed from '@/components/ChatbotEmbed'
import MobileBottomNav from '@/components/MobileBottomNav'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

/** login, register зэрэг full-page хуудсуудад Nav/Footer нуугдана */
const BARE_ROUTES = ['/login', '/register', '/design/editor', '/dashboard', '/admin', '/creator', '/designer', '/courier', '/sales', '/invite', '/loyalty', '/mobile', '/start']
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

  return (
    <>
      <AnnouncementBar />
      <MegaNav />
      <main>{children}</main>
      {!hideChatWidget && <ChatWidget />}
      <ChatbotEmbed />
      {!pathname.startsWith('/quote') && <StickyCTA />}
      <Footer />
      <MobileBottomNav />
    </>
  )
}

function StickyCTA() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  return (
    <a href="/quote" className="sticky-cta" style={{
      position: 'fixed', bottom: 90, right: 16, zIndex: 900,
      padding: '12px 20px', borderRadius: 12,
      background: '#FF6B00', color: '#fff', textDecoration: 'none',
      fontSize: 13, fontWeight: 700, boxShadow: '0 4px 20px rgba(255,107,0,0.4)',
      opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.3s, transform 0.3s',
      pointerEvents: show ? 'auto' : 'none',
    }}>
      Үнэ авах →
    </a>
  )
}
