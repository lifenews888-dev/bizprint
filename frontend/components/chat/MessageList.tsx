'use client'
import { useEffect, useRef } from 'react'
import { useChatStore } from '@/stores/chat.store'
import MessageItem from './MessageItem'
import TypingIndicator from './TypingIndicator'
import ChatAvatar from './ChatAvatar'

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mx-6 my-4">
      <div className="flex-1 h-px bg-[var(--border)]" />
      <span className="text-[11px] text-[var(--text3)] font-medium px-2.5 py-0.5 bg-[var(--surface)] border border-[var(--border)] rounded-full">{label}</span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  )
}

export default function MessageList() {
  const { activeRoomId, messages, userId, typingUsers, rooms, users } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wasAtBottom = useRef(true)

  const roomMessages = activeRoomId ? (messages[activeRoomId] || []) : []
  const typing = activeRoomId ? (typingUsers[activeRoomId] || []) : []

  // Auto-scroll (only if user was at bottom)
  useEffect(() => {
    if (wasAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [roomMessages.length, typing.length])

  function handleScroll() {
    const el = containerRef.current
    if (!el) return
    wasAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  // Empty state
  if (!activeRoomId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[var(--text3)]">
        <div className="text-5xl mb-4">💬</div>
        <div className="text-xl font-bold text-[var(--text)] mb-2">BizPrint Support</div>
        <div className="text-sm text-center max-w-[320px] leading-relaxed mb-6">Харилцагчтай чат эхлүүлэх эсвэл байгаа чатаас сонгоно уу</div>
        <button onClick={() => useChatStore.getState().setShowNewChat(true)}
          className="bg-[#FF6B00] hover:bg-[#E55D00] text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-orange-500/30 transition-colors">
          + Шинэ чат
        </button>
      </div>
    )
  }

  if (!roomMessages.length) {
    const room = rooms.find(r => r.room_id === activeRoomId)
    const otherName = room?.participant_names.find(n => {
      const me = useChatStore.getState().userName
      return n !== me
    }) || ''
    const otherUser = users.find(u => (u.name || u.email) === otherName)
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[var(--text3)]">
        <ChatAvatar name={otherName} role={otherUser?.role} size={56} />
        <div className="mt-3 font-semibold text-[15px] text-[var(--text)]">{otherName}</div>
        <div className="text-xs mt-1">Харилцаа эхлүүлэх</div>
      </div>
    )
  }

  // Group by date
  const groups: { date: string; msgs: typeof roomMessages }[] = []
  roomMessages.forEach(msg => {
    const date = new Date(msg.created_at).toLocaleDateString('mn-MN', { weekday: 'long', month: 'long', day: 'numeric' })
    const last = groups[groups.length - 1]
    if (!last || last.date !== date) groups.push({ date, msgs: [msg] })
    else last.msgs.push(msg)
  })

  return (
    <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto py-4">
      {groups.map(group => (
        <div key={group.date}>
          <DateDivider label={group.date} />
          {group.msgs.map((msg, i) => {
            const prev = group.msgs[i - 1]
            const next = group.msgs[i + 1]
            const isMe = msg.sender_id === userId
            const showAvatar = !isMe && (!prev || prev.sender_id !== msg.sender_id)
            const showTime = !next || next.sender_id !== msg.sender_id
            return <MessageItem key={msg.id} msg={msg} isMe={isMe} showAvatar={showAvatar} showTime={showTime} />
          })}
        </div>
      ))}
      <TypingIndicator names={typing} />
      <div ref={bottomRef} />
    </div>
  )
}
