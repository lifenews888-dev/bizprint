'use client'

import { useEffect } from 'react'
import { useChatStore } from '@/stores/chat.store'
import ChatSidebar from './ChatSidebar'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import NewChatModal from './NewChatModal'
import ImagePreview from './ImagePreview'

export default function ChatLayout() {
  const { activeRoomId, init, cleanup } = useChatStore()

  useEffect(() => {
    // Get current user from localStorage
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const user = raw ? JSON.parse(raw) : null
    if (!user?.id) return

    init(user.id, user.full_name || user.name || user.email || 'Admin', user.role || 'admin')
    return () => cleanup()
  }, [init, cleanup])

  return (
    <div className="flex h-[calc(100vh-54px)] overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <ImagePreview />
      <NewChatModal />
      <ChatSidebar />

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatHeader />
        <MessageList />
        {activeRoomId && <MessageInput />}
      </div>
    </div>
  )
}
