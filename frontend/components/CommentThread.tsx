'use client'
import { useState, useEffect, useRef } from 'react'
import { apiFetch, apiUpload } from '@/lib/api'

/* ═══════════════════════════════════════
 *  CommentThread — task-based communication
 *  Used inside order/project detail
 * ═══════════════════════════════════════ */

interface Comment {
  id: string
  user_id: string
  user_name: string
  role: 'customer' | 'creator' | 'admin'
  message: string
  attachment_urls?: string[]
  action?: string
  is_system?: boolean
  created_at: string
}

interface UploadResponse {
  file_url?: string
  url?: string
}

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

const ROLE_CONFIG = {
  customer: { label: 'Захиалагч', color: '#3B82F6', bg: '#EFF6FF' },
  creator: { label: 'Creator', color: '#8B5CF6', bg: '#F5F3FF' },
  admin: { label: 'Админ', color: '#FF6B00', bg: '#FFF7ED' },
}

export default function CommentThread({
  orderId,
  currentRole,
  currentUserName,
}: {
  orderId: string
  currentRole: 'customer' | 'creator' | 'admin'
  currentUserName: string
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadComments = () => {
    apiFetch<Comment[]>(`/creator/orders/${orderId}/comments`)
      .then(d => { if (Array.isArray(d)) setComments(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadComments() }, [orderId])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [comments])

  const uploadFiles = async (): Promise<string[]> => {
    const urls: string[] = []
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await apiUpload<UploadResponse>('/upload/file', fd)
        const url = res?.file_url || res?.url
        if (url) urls.push(url)
      } catch {}
    }
    return urls
  }

  const send = async (action?: string) => {
    if (!message.trim() && files.length === 0) return
    setSending(true)

    let attachments: string[] = []
    if (files.length > 0) {
      setUploading(true)
      attachments = await uploadFiles()
      setUploading(false)
    }

    try {
      await apiFetch(`/creator/orders/${orderId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          message: message.trim(),
          role: currentRole,
          user_name: currentUserName,
          attachment_urls: attachments.length > 0 ? attachments : undefined,
          action,
        }),
      })
      setMessage('')
      setFiles([])
      loadComments()
    } catch (e: unknown) {
      alert(errorMessage(e, 'Мессеж илгээх алдаа'))
    }
    setSending(false)
  }

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.split('?')[0])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>💬 Харилцаа</div>
        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{comments.length} мессеж</div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: 12 }}>Ачааллж байна...</div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>💬</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Одоогоор мессеж байхгүй</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Эхлээд мессеж бичээрэй</div>
          </div>
        ) : (
          comments.map(c => {
            const cfg = ROLE_CONFIG[c.role] || ROLE_CONFIG.customer
            const isMe = c.role === currentRole
            return (
              <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                {/* System message */}
                {c.is_system ? (
                  <div style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--surface2)', padding: '4px 10px', borderRadius: 8, textAlign: 'center', width: '100%' }}>
                    ⚙️ {c.message}
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 9, color: cfg.color, marginBottom: 2, fontWeight: 600 }}>
                      {c.user_name || cfg.label}
                      <span style={{ fontWeight: 400, color: 'var(--text3)', marginLeft: 6 }}>
                        {new Date(c.created_at).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{
                      maxWidth: '85%', padding: '8px 12px', borderRadius: 12,
                      borderTopLeftRadius: isMe ? 12 : 4,
                      borderTopRightRadius: isMe ? 4 : 12,
                      background: isMe ? cfg.color : cfg.bg,
                      color: isMe ? '#fff' : 'var(--text)',
                      fontSize: 13, lineHeight: 1.5,
                    }}>
                      {c.message}
                      {/* Action badge */}
                      {c.action && (
                        <div style={{ marginTop: 6, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99, display: 'inline-block',
                          background: c.action === 'approval' ? '#10B98120' : '#F59E0B20',
                          color: c.action === 'approval' ? '#10B981' : '#F59E0B',
                        }}>
                          {c.action === 'approval' ? '✅ Батлагдсан' : c.action === 'revision_request' ? '🔄 Засвар хүссэн' : c.action}
                        </div>
                      )}
                    </div>
                    {/* Attachments */}
                    {c.attachment_urls && c.attachment_urls.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', maxWidth: '85%' }}>
                        {c.attachment_urls.map((url, j) => (
                          <a key={j} href={url.startsWith('http') ? url : `http://localhost:4000${url}`} target="_blank" rel="noreferrer"
                            style={{ display: 'block', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                            {isImage(url) ? (
                              <img src={url.startsWith('http') ? url : `http://localhost:4000${url}`} alt="" style={{ width: 80, height: 80, objectFit: 'cover' }} />
                            ) : (
                              <div style={{ padding: '8px 12px', fontSize: 10, color: 'var(--text2)', background: 'var(--surface2)' }}>
                                📎 {url.split('/').pop()?.slice(0, 20)}
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* File preview */}
      {files.length > 0 && (
        <div style={{ padding: '6px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'var(--surface2)', borderRadius: 6, fontSize: 10, color: 'var(--text2)' }}>
              📎 {f.name.slice(0, 15)}{f.name.length > 15 ? '...' : ''}
              <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 10, padding: 0 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <input ref={fileRef} type="file" multiple className="hidden" style={{ display: 'none' }}
          onChange={e => { if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]) }} />
        <button onClick={() => fileRef.current?.click()}
          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
          📎
        </button>
        <input value={message} onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Мессеж бичих..."
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--surface)', color: 'var(--text)' }} />
        <button onClick={() => send()} disabled={sending || (!message.trim() && files.length === 0)}
          style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#FF6B00', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: sending ? 0.6 : 1, flexShrink: 0 }}>
          {uploading ? '📤' : sending ? '...' : 'Илгээх'}
        </button>
      </div>

      {/* Quick actions for customer */}
      {currentRole === 'customer' && comments.length > 0 && (
        <div style={{ padding: '6px 16px 10px', display: 'flex', gap: 6 }}>
          <button onClick={() => { setMessage('Засвар хүсэж байна: '); }}
            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #F59E0B40', background: '#F59E0B10', color: '#F59E0B', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
            🔄 Засвар хүсэх
          </button>
          <button onClick={() => { if (confirm('Батлах уу?')) send('approval') }}
            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #10B98140', background: '#10B98110', color: '#10B981', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
            ✅ Батлах
          </button>
        </div>
      )}
    </div>
  )
}
