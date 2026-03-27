import { useState } from 'react'
import { useChatStore } from '@/stores/chat.store'
import { getRoleConfig } from '@/lib/services/chat.service'
import ChatAvatar from './ChatAvatar'

export default function ChatHeader() {
  const { activeRoomId, rooms, users, userId, userName, messages } = useChatStore()
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')

  if (!activeRoomId) return null

  const room = rooms.find(r => r.room_id === activeRoomId)
  const otherName = room?.participant_names.find(n => n !== userName) || ''
  const otherUser = users.find(u => (u.name || u.email) === otherName)
  const roleCfg = getRoleConfig(otherUser?.role)
  const msgCount = (messages[activeRoomId] || []).length

  return (
    <div className="h-[56px] px-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)] flex-shrink-0">
      {/* Left: avatar + info */}
      <div className="flex items-center gap-3">
        <ChatAvatar name={otherName} role={otherUser?.role} size={36} />
        <div>
          <div className="text-[15px] font-semibold text-[var(--text)]">{otherName}</div>
          <div className="text-[11px] font-semibold" style={{ color: roleCfg.color }}>{roleCfg.label}</div>
        </div>
      </div>

      {/* Right: search + count */}
      <div className="flex items-center gap-2">
        {showSearch && (
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Хайх..."
            autoFocus
            className="w-44 px-3 py-1.5 rounded-lg text-xs border border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] outline-none focus:border-[#FF6B00] transition-colors"
            onKeyDown={e => { if (e.key === 'Escape') { setShowSearch(false); setQuery('') } }}
          />
        )}
        <button
          onClick={() => { setShowSearch(!showSearch); if (showSearch) setQuery('') }}
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors ${
            showSearch ? 'bg-[rgba(255,107,0,0.1)] text-[#FF6B00]' : 'text-[var(--text3)] hover:text-[var(--text)]'
          }`}
          title="Мессеж хайх"
        >
          🔍
        </button>
        {room?.order_id && (
          <a href={`/admin/orders?id=${room.order_id}`} className="text-[11px] text-[#FF6B00] font-medium no-underline hover:underline px-2 py-1 rounded-lg bg-[rgba(255,107,0,0.06)]">
            #{room.order_id.slice(0, 8)}
          </a>
        )}
        <div className="text-[11px] text-[var(--text3)] bg-[var(--surface2)] px-2 py-1 rounded-md border border-[var(--border)]">
          {msgCount} мессеж
        </div>
      </div>
    </div>
  )
}
