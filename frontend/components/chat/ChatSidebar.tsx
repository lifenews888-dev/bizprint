'use client'
import { useState } from 'react'
import { useChatStore } from '@/stores/chat.store'
import { getRoleConfig } from '@/lib/services/chat.service'
import ChatAvatar from './ChatAvatar'

function timeAgo(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'Одоо'
  if (diff < 3600000) return Math.floor(diff / 60000) + ' мин'
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('mn', { month: 'short', day: 'numeric' })
}

export default function ChatSidebar() {
  const { rooms, activeRoomId, connected, users, userName, setActiveRoom, setShowNewChat } = useChatStore()
  const [search, setSearch] = useState('')

  const filtered = rooms.filter(r =>
    r.participant_names.some(n => n.toLowerCase().includes(search.toLowerCase())) ||
    (r.last_message || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-[280px] flex-shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--surface)] overflow-hidden">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
            <span className="text-sm font-bold text-[var(--text)]">Мессежүүд</span>
            {rooms.length > 0 && (
              <span className="text-[10px] text-[var(--text3)] bg-[var(--surface2)] px-1.5 py-0.5 rounded-md">{rooms.length}</span>
            )}
          </div>
          <button
            onClick={() => setShowNewChat(true)}
            className="w-7 h-7 rounded-lg bg-[rgba(255,107,0,0.1)] border border-[rgba(255,107,0,0.2)] flex items-center justify-center text-[#FF6B00] text-lg cursor-pointer hover:bg-[rgba(255,107,0,0.2)] transition-colors"
          >
            +
          </button>
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Хайх..."
          className="w-full px-3 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] outline-none placeholder:text-[var(--text3)] focus:border-[#FF6B00] transition-colors"
        />
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="py-10 text-center text-[var(--text3)]">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-xs">{search ? 'Олдсонгүй' : 'Чат байхгүй'}</div>
          </div>
        )}
        {filtered.map(room => {
          const other = room.participant_names.find(n => n !== userName) || room.participant_names[0]
          const role = users.find(u => (u.name || u.email) === other)?.role || 'customer'
          const cfg = getRoleConfig(role)
          const isActive = activeRoomId === room.room_id
          const unread = room.unread_count || 0

          let lastMsg = room.last_message || ''
          if (lastMsg.startsWith('[IMAGE]')) lastMsg = '📷 Зураг'
          else if (lastMsg.startsWith('[FILE]')) lastMsg = '📎 Файл'

          return (
            <div
              key={room.room_id}
              onClick={() => setActiveRoom(room.room_id)}
              className={`px-4 py-3 flex gap-3 items-center cursor-pointer transition-all border-l-[3px] ${
                isActive
                  ? 'bg-[rgba(255,107,0,0.06)] border-l-[#FF6B00]'
                  : 'border-l-transparent hover:bg-[var(--surface2)]'
              }`}
            >
              <ChatAvatar name={other} role={role} size={38} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className={`text-[13px] truncate max-w-[130px] ${isActive ? 'font-bold text-[#FF6B00]' : 'font-medium text-[var(--text)]'}`}>{other}</span>
                  <span className="text-[10px] text-[var(--text3)] flex-shrink-0 ml-1">{timeAgo(room.last_message_at)}</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] text-[var(--text3)] truncate flex-1">{lastMsg}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    {unread > 0 && (
                      <span className="bg-[#FF6B00] text-white rounded-full w-4 h-4 text-[9px] font-bold flex items-center justify-center">{unread}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
