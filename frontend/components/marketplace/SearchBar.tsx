'use client'

import { useState, useRef, useEffect } from 'react'

/* ═══════════════════════════════════════
 *  AI Search Bar — natural language input
 * ═══════════════════════════════════════ */

const SUGGESTIONS = [
  'Сошиал медиа контент хийх creator',
  'Нэрийн хуудас дизайн, 2 хоногт',
  'Live борлуулалт хийх туршлагатай',
  'Лого дизайн, Pro түвшин',
  'UGC видео бүтээгч',
]

export default function SearchBar({
  value,
  onChange,
  onSearch,
}: {
  value: string
  onChange: (v: string) => void
  onSearch: (q: string) => void
}) {
  const [focused, setFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const submit = (q?: string) => {
    const query = q || value
    if (query.trim()) {
      onSearch(query.trim())
      setShowSuggestions(false)
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
        style={{
          background: 'var(--surface)',
          border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
          boxShadow: focused ? '0 0 0 3px var(--orange-10)' : 'none',
        }}
      >
        <span className="text-lg shrink-0" style={{ color: 'var(--text3)' }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => {
            onChange(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => { setFocused(true); setShowSuggestions(true) }}
          onBlur={() => setFocused(false)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Creator хайх... (жишээ: &quot;лого дизайн, 3 хоногт, Pro&quot;)"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--text)' }}
        />
        <button
          onClick={() => submit()}
          className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white shrink-0"
          style={{ background: 'var(--primary)' }}
        >
          Хайх
        </button>
      </div>

      {/* AI suggestion badge */}
      <div className="flex items-center gap-1.5 mt-2 ml-1">
        <span
          className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
          style={{ background: 'var(--secondary)', color: '#fff' }}
        >
          AI
        </span>
        <span className="text-xs" style={{ color: 'var(--text3)' }}>
          Байгалийн хэлээр хайлт хийх боломжтой
        </span>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && !value && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+4px)] rounded-xl overflow-hidden z-30"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
        >
          <p className="px-4 pt-3 pb-1 text-xs font-medium" style={{ color: 'var(--text3)' }}>
            Санал болгох хайлт
          </p>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              className="w-full text-left px-4 py-2.5 text-sm transition-colors"
              style={{ color: 'var(--text2)' }}
              onMouseDown={() => { onChange(s); submit(s) }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
