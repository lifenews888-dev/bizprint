import { useChatStore } from '@/stores/chat.store'
import { getRoleConfig, type ChatUser } from '@/lib/services/chat.service'
import ChatAvatar from './ChatAvatar'

export default function NewChatModal() {
  const { showNewChat, setShowNewChat, users, userId, createRoom } = useChatStore()
  if (!showNewChat) return null

  const availableUsers = users.filter(u => u.id !== userId)

  function startChat(user: ChatUser) {
    createRoom(user.id, user.name || user.email, user.role || 'customer')
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center" onClick={() => setShowNewChat(false)}>
      <div onClick={e => e.stopPropagation()} className="bg-[var(--surface)] rounded-2xl p-6 w-[420px] max-h-[80vh] border border-[var(--border)] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-base font-bold text-[var(--text)]">Шинэ харилцаа</div>
            <div className="text-xs text-[var(--text3)] mt-0.5">Хэрэглэгч сонгоно уу</div>
          </div>
          <button
            onClick={() => setShowNewChat(false)}
            className="w-7 h-7 rounded-lg bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center text-[var(--text3)] hover:text-[var(--text)] cursor-pointer transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5">
          {availableUsers.map(user => {
            const cfg = getRoleConfig(user.role)
            return (
              <div
                key={user.id}
                onClick={() => startChat(user)}
                className="px-3 py-2.5 bg-[var(--surface2)] rounded-xl cursor-pointer flex items-center gap-3 border border-transparent hover:border-[#FF6B00] hover:bg-[rgba(255,107,0,0.03)] transition-all"
              >
                <ChatAvatar name={user.name || user.email} role={user.role} size={38} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[var(--text)] truncate">{user.name || user.email}</div>
                  <div className="text-[11px] text-[var(--text3)] truncate">{user.email}</div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                  {cfg.label}
                </span>
              </div>
            )
          })}
          {availableUsers.length === 0 && (
            <div className="text-center text-[var(--text3)] py-8 text-sm">Хэрэглэгч олдсонгүй</div>
          )}
        </div>
      </div>
    </div>
  )
}
