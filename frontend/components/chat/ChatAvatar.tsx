import { getRoleConfig } from '@/lib/services/chat.service'

export default function ChatAvatar({ name, role, size = 36 }: { name: string; role?: string; size?: number }) {
  const cfg = getRoleConfig(role)
  const initials = (name || 'U').split(/[\s@]/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center font-bold"
      style={{
        width: size, height: size,
        background: cfg.bg, border: `2px solid ${cfg.color}`,
        fontSize: size * 0.35, color: cfg.color,
      }}
    >
      {initials}
    </div>
  )
}
