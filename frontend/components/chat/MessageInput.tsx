'use client'
import { useState, useRef, useCallback } from 'react'
import { useChatStore } from '@/stores/chat.store'

export default function MessageInput() {
  const { activeRoomId, sendMessage, emitTyping, emitStopTyping, handleFileUpload, uploading } = useChatStore()
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSend = useCallback(() => {
    if (!text.trim() || !activeRoomId) return
    sendMessage(text)
    setText('')
    inputRef.current?.focus()
  }, [text, activeRoomId, sendMessage])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleChange(value: string) {
    setText(value)
    if (value.trim()) {
      emitTyping()
      if (typingTimer.current) clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(emitStopTyping, 2000)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFileUpload(f)
    e.target.value = ''
  }

  if (!activeRoomId) return null

  const rows = Math.min(Math.max(text.split('\n').length, 1), 4)

  return (
    <div className="px-4 pb-3 pt-1 flex-shrink-0">
      <input ref={fileRef} type="file" accept="image/*,.pdf,.ai,.psd,.zip,.doc,.docx,.eps" onChange={onFileChange} className="hidden" />

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden flex items-end gap-0">
        {/* Attach button */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-shrink-0 w-9 h-9 ml-1 mb-0.5 rounded-lg flex items-center justify-center text-[var(--text3)] hover:text-[#FF6B00] hover:bg-[rgba(255,107,0,0.08)] transition-colors text-base"
          title="Файл хавсаргах"
        >
          📎
        </button>

        {/* Input */}
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Мессеж бичих..."
          rows={1}
          className="flex-1 px-2 py-2.5 bg-transparent text-sm text-[var(--text)] outline-none resize-none leading-snug placeholder:text-[var(--text3)]"
          style={{ maxHeight: 80, minHeight: 36 }}
        />

        {/* Upload indicator */}
        {uploading && (
          <div className="flex-shrink-0 flex items-center gap-1 text-[10px] text-[#FF6B00] mr-1 mb-2">
            <div className="w-3 h-3 rounded-full border-2 border-[#FF6B00] border-t-transparent animate-spin" />
          </div>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className={`flex-shrink-0 w-8 h-8 mr-1 mb-0.5 rounded-lg flex items-center justify-center transition-all ${
            text.trim()
              ? 'bg-[#FF6B00] text-white shadow-sm shadow-orange-500/20 hover:bg-[#E55D00]'
              : 'bg-[var(--border)] text-[var(--text3)] cursor-default'
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
