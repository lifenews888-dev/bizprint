import { ChatMessage, getRoleConfig } from '@/lib/services/chat.service'
import { useChatStore } from '@/stores/chat.store'
import ChatAvatar from './ChatAvatar'

/* ─── Time formatting ─── */
function timeAgo(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'Одоо'
  if (diff < 3600000) return Math.floor(diff / 60000) + ' мин'
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

/* ─── Text bubble ─── */
function TextBubble({ content, isMe }: { content: string; isMe: boolean }) {
  return (
    <div className={`px-3.5 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap max-w-[480px] ${
      isMe
        ? 'bg-gradient-to-br from-[#FF6B00] to-[#FF8C42] text-white rounded-[18px_18px_4px_18px] shadow-[0_2px_12px_rgba(255,107,0,0.2)]'
        : 'bg-[var(--surface2)] text-[var(--text)] rounded-[18px_18px_18px_4px] border border-[var(--border)]'
    }`}>
      {content}
    </div>
  )
}

/* ─── Image bubble ─── */
function ImageBubble({ url, isMe }: { url: string; isMe: boolean }) {
  const setPreview = useChatStore(s => s.setPreviewImage)
  return (
    <img
      src={url} alt="img"
      onClick={() => setPreview(url)}
      className={`max-w-[260px] max-h-[200px] rounded-xl cursor-pointer border border-[var(--border)] hover:opacity-90 transition-opacity ${isMe ? 'ml-auto' : ''}`}
    />
  )
}

/* ─── File bubble ─── */
function FileBubble({ name, url, isMe }: { name: string; url: string; isMe: boolean }) {
  const ext = name.split('.').pop()?.toUpperCase() || 'FILE'
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl no-underline min-w-[180px] max-w-[260px] transition-colors ${
        isMe
          ? 'bg-white/10 border border-white/15 hover:bg-white/20'
          : 'bg-[var(--surface2)] border border-[var(--border)] hover:bg-[var(--surface3)]'
      }`}>
      <div className="w-9 h-9 rounded-lg bg-[rgba(255,107,0,0.12)] flex items-center justify-center text-[10px] font-extrabold text-[#FF6B00] flex-shrink-0">
        {ext}
      </div>
      <div className="min-w-0">
        <div className={`text-xs font-semibold truncate ${isMe ? 'text-white' : 'text-[var(--text)]'}`}>{name}</div>
        <div className={`text-[10px] ${isMe ? 'text-white/60' : 'text-[var(--text3)]'}`}>Татах</div>
      </div>
    </a>
  )
}

/* ─── System message ─── */
function SystemMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-center my-2">
      <div className="text-[11px] text-[var(--text3)] bg-[var(--surface2)] border border-[var(--border)] rounded-full px-3 py-1">
        {content}
      </div>
    </div>
  )
}

/* ═══ Main MessageItem ═══ */
interface Props {
  msg: ChatMessage
  isMe: boolean
  showAvatar: boolean
  showTime: boolean
}

export default function MessageItem({ msg, isMe, showAvatar, showTime }: Props) {
  if (msg.type === 'system') return <SystemMessage content={msg.content} />

  const roleCfg = getRoleConfig(msg.sender_role)

  return (
    <div className={`px-6 py-0.5 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      {/* Sender name + avatar */}
      {showAvatar && !isMe && (
        <div className="flex items-center gap-2 mb-1 ml-0.5">
          <ChatAvatar name={msg.sender_name} role={msg.sender_role} size={20} />
          <span className="text-[11px] font-semibold" style={{ color: roleCfg.color }}>{msg.sender_name}</span>
        </div>
      )}

      {/* Message content */}
      <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMe && !showAvatar && <div className="w-5 flex-shrink-0" />}
        <div>
          {msg.type === 'image' && msg.file?.url && <ImageBubble url={msg.file.url} isMe={isMe} />}
          {msg.type === 'file' && msg.file && <FileBubble name={msg.file.name} url={msg.file.url} isMe={isMe} />}
          {msg.type === 'text' && <TextBubble content={msg.content} isMe={isMe} />}
        </div>
      </div>

      {/* Timestamp + status */}
      {showTime && (
        <div className={`text-[10px] text-[var(--text3)] mt-0.5 ${isMe ? '' : 'ml-6'}`}>
          {timeAgo(msg.created_at)}
          {isMe && msg.status !== 'sending' && <span className="ml-1 text-emerald-500">✓✓</span>}
          {isMe && msg.status === 'sending' && <span className="ml-1 text-[var(--text3)]">⏳</span>}
        </div>
      )}
    </div>
  )
}
