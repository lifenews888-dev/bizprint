'use client'

/* ═══════════════════════════════════════
 *  Creator Card — reusable across marketplace
 * ═══════════════════════════════════════ */

export interface Creator {
  id: string
  name: string
  avatar?: string
  level: 'starter' | 'pro' | 'expert' | 'elite'
  rating: number
  reviewCount: number
  tags: string[]
  startingPrice: number
  deliveryDays: number
  bio?: string
  matchScore?: number
  responseTime?: string
  completedJobs?: number
  type?: string
}

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  starter: { label: 'Starter', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  pro:     { label: 'Pro',     color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  expert:  { label: 'Expert',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  elite:   { label: 'Elite',   color: '#FF6B00', bg: 'rgba(255,107,0,0.12)' },
}

const MATCH_CONFIG: Record<string, { label: string; color: string }> = {
  top:  { label: 'Top Match', color: '#10B981' },
  good: { label: 'Good Match', color: '#3B82F6' },
}

function getMatchLabel(score?: number) {
  if (!score) return null
  if (score >= 90) return MATCH_CONFIG.top
  if (score >= 70) return MATCH_CONFIG.good
  return null
}

export default function CreatorCard({
  creator,
  onViewProfile,
}: {
  creator: Creator
  onViewProfile: (id: string) => void
}) {
  const level = LEVEL_CONFIG[creator.level] || LEVEL_CONFIG.starter
  const match = getMatchLabel(creator.matchScore)

  return (
    <div
      className="relative rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer group"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
      onClick={() => onViewProfile(creator.id)}
    >
      {/* Match score badge */}
      {match && (
        <div
          className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: match.color + '18', color: match.color }}
        >
          {match.label}
        </div>
      )}

      {/* Top section */}
      <div className="p-5 pb-3">
        <div className="flex items-start gap-3.5">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
            style={{
              background: creator.avatar ? `url(${creator.avatar}) center/cover` : 'var(--primary-gradient)',
              color: '#fff',
            }}
          >
            {!creator.avatar && creator.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
              {creator.name}
            </h3>

            {/* Level badge */}
            <span
              className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-xs font-medium"
              style={{ background: level.bg, color: level.color }}
            >
              {creator.level === 'elite' && '⭐ '}
              {level.label}
            </span>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <span style={{ color: '#F59E0B' }}>★</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {creator.rating.toFixed(1)}
              </span>
              <span className="text-xs" style={{ color: 'var(--text3)' }}>
                ({creator.reviewCount})
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {creator.tags.slice(0, 4).map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md text-xs"
              style={{ background: 'var(--surface2)', color: 'var(--text2)' }}
            >
              {tag}
            </span>
          ))}
          {creator.tags.length > 4 && (
            <span className="text-xs" style={{ color: 'var(--text3)' }}>
              +{creator.tags.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)' }} />

      {/* Bottom section */}
      <div className="px-5 py-3 flex items-center justify-between">
        <div>
          <span className="text-xs" style={{ color: 'var(--text3)' }}>Эхлэх үнэ</span>
          <p className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
            ₮{creator.startingPrice.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs" style={{ color: 'var(--text3)' }}>Хугацаа</span>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {creator.deliveryDays} хоног
          </p>
        </div>
      </div>

      {/* Hover button */}
      <div
        className="px-5 pb-4 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <button
          className="w-full py-2 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: 'var(--primary)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--primary)')}
        >
          Профайл харах
        </button>
      </div>
    </div>
  )
}
