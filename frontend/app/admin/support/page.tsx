'use client'

import React, { apiFetch } from '@/lib/api'
import React, { useState, useEffect, useRef } from 'react'
import React, { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import React, { Button } from '@/components/ui/button'

// Types
interface TicketMessage {
  sender: string
  content: string
  created_at: string
}

interface Ticket {
  id: number
  ticket_number: string
  customer_id: number
  subject: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  messages: TicketMessage[]
  assigned_to: string | null
  created_at: string
  customer: { name: string; guest_email: string }
}

// Constants
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"

const STATUS_TABS: { key: string; label: string }[] = [
  { key: '', label: 'БҮГД' },
  { key: 'OPEN', label: 'OPEN' },
  { key: 'IN_PROGRESS', label: 'IN_PROGRESS' },
  { key: 'RESOLVED', label: 'RESOLVED' },
  { key: 'CLOSED', label: 'CLOSED' },
]

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:        { label: 'Нээлттэй',      color: '#FF6B00', bg: 'rgba(255,107,0,0.1)' },
  IN_PROGRESS: { label: 'Шийдвэрлэж буй', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  RESOLVED:    { label: 'Шийдвэрлэсэн',   color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  CLOSED:      { label: 'Хаагдсан',       color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
}

const PRIORITY_CFG: Record<string, { label: string; color: string; bg: string }> = {
  LOW:    { label: 'Бага',    color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  NORMAL: { label: 'Энгийн', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  HIGH:   { label: 'Өндөр',  color: '#FF6B00', bg: 'rgba(255,107,0,0.1)' },
  URGENT: { label: 'Яаралтай', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
}

const ALL_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const
const ALL_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const

// Helpers
function formatDate(str: string) {
  return new Date(str).toLocaleString('mn-MN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatTime(str: string) {
  return new Date(str).toLocaleString('mn-MN', {
    hour: '2-digit', minute: '2-digit',
    month: 'short', day: 'numeric',
  })
}

// Component
export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  // Create ticket modal
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ customer_id: '', subject: '', message: '', priority: 'NORMAL' })
  const [creating, setCreating] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Counts per status
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => { fetchTickets() }, [statusFilter])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages])

  async function fetchTickets() {
    setLoading(true)
    try {
      const data = await apiFetch<any>(`/admin/support-tickets?status=${statusFilter}`)
      const items: Ticket[] = data.items || []
      setTickets(items)
      setTotal(data.total || items.length)

      // Also fetch all to get counts
      if (statusFilter) {
        const allData = await apiFetch<any>('/admin/support-tickets?status=')
        const allItems: Ticket[] = allData?.items || (Array.isArray(allData) ? allData : [])
        const c: Record<string, number> = { '': allItems.length }
        allItems.forEach(t => { c[t.status] = (c[t.status] || 0) + 1 })
        setCounts(c)
      } else {
        const c: Record<string, number> = { '': items.length }
        items.forEach(t => { c[t.status] = (c[t.status] || 0) + 1 })
        setCounts(c)
      }
    } catch {
      showToast('Тикетүүдийг ачаалахад алдаа гарлаа', 'err')
    }
    setLoading(false)
  }

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  async function handleReply() {
    if (!selected || !replyText.trim()) return
    setSending(true)
    try {
      await apiFetch<any>(`/admin/support-tickets/${selected.id}/reply`, {
        method: 'POST',
        body: { message: replyText.trim(), sender: 'admin' },
      })
      setReplyText('')
      // Refresh ticket data
      const data = await apiFetch<any>(`/admin/support-tickets?status=${statusFilter}`)
      const refreshedItems: Ticket[] = data?.items || (Array.isArray(data) ? data : [])
      setTickets(refreshedItems)
      const refreshed = refreshedItems.find(t => t.id === selected.id)
      if (refreshed) setSelected(refreshed)
      showToast('Хариу илгээлээ')
    } catch {
      showToast('Хариу илгээхэд алдаа гарлаа', 'err')
    }
    setSending(false)
  }

  async function updateTicket(id: number, updates: Partial<{ status: string; priority: string; assigned_to: string }>) {
    setUpdating(true)
    try {
      await apiFetch<any>(`/admin/support-tickets/${id}`, {
        method: 'PUT',
        body: updates,
      })
      await fetchTickets()
      // Refresh selected
      if (selected && selected.id === id) {
        setSelected(prev => prev ? { ...prev, ...updates } as Ticket : null)
      }
      showToast('Шинэчлэгдлээ')
    } catch {
      showToast('Шинэчлэхэд алдаа гарлаа', 'err')
    }
    setUpdating(false)
  }

  async function handleCreate() {
    if (!createForm.subject.trim() || !createForm.message.trim()) return
    setCreating(true)
    try {
      await apiFetch<any>(`/admin/support-tickets`, {
        method: 'POST',
        body: {
          customer_id: createForm.customer_id ? Number(createForm.customer_id) : undefined,
          subject: createForm.subject,
          message: createForm.message,
          priority: createForm.priority,
        },
      })
      setShowCreate(false)
      setCreateForm({ customer_id: '', subject: '', message: '', priority: 'NORMAL' })
      showToast('Тикет үүсгэлээ')
      fetchTickets()
    } catch {
      showToast('Тикет үүсгэхэд алдаа гарлаа', 'err')
    }
    setCreating(false)
  }

  // --- Styles ---
  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)',
    borderRadius: 12,
    border: '1px solid var(--border)',
    overflow: 'hidden',
  }

  const badgeStyle = (color: string, bg: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    color,
    background: bg,
    whiteSpace: 'nowrap',
  })

  const btnPrimary: React.CSSProperties = {
    background: '#FF6B00',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 20px',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: FONT,
    transition: 'opacity 0.2s',
  }

  const btnSecondary: React.CSSProperties = {
    background: 'var(--surface2)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '8px 20px',
    fontWeight: 500,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: FONT,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: 14,
    fontFamily: FONT,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'auto' as const,
  }

  return (
    <div className="p-4 md:p-6">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.type === 'ok' ? '#10B981' : '#EF4444',
          color: '#fff', padding: '12px 24px', borderRadius: 10,
          fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          animation: 'fadeIn 0.3s ease',
        }}>
          {toast.msg}
        </div>
      )}

      <AdminPageHeader title="Тусламж & Тикет" description="Хэрэглэгчдийн асуулт, хүсэлт, гомдол удирдах">
        <Button size="sm" onClick={() => setShowCreate(true)}>+ Шинэ тикет</Button>
      </AdminPageHeader>

      {/* Status filter tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        background: 'var(--surface2)', borderRadius: 10, padding: 4,
        overflowX: 'auto',
      }}>
        {STATUS_TABS.map(tab => {
          const active = statusFilter === tab.key
          const count = counts[tab.key] ?? 0
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                background: active ? '#FF6B00' : 'transparent',
                color: active ? '#fff' : 'var(--text2)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {tab.label}
              <span style={{
                background: active ? 'rgba(255,255,255,0.25)' : 'var(--border)',
                padding: '1px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
          Ачааллаж байна...
        </div>
      )}

      {/* Ticket list */}
      {!loading && tickets.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
          Тикет олдсонгүй
        </div>
      )}

      {!loading && tickets.length > 0 && (
        <div style={cardStyle}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['№', 'Хэрэглэгч', 'Гарчиг', 'Төлөв', 'Ач холбогдол', 'Хариуцагч', 'Огноо'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontSize: 12, fontWeight: 600, color: 'var(--text3)',
                      textTransform: 'uppercase', letterSpacing: 0.5,
                      whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => {
                  const sc = STATUS_CFG[ticket.status]
                  const pc = PRIORITY_CFG[ticket.priority]
                  const customerName = ticket.customer?.name || ticket.customer?.guest_email || `#${ticket.customer_id}`
                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelected(ticket)}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#FF6B00', whiteSpace: 'nowrap' }}>
                        {ticket.ticket_number}
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        {customerName}
                      </td>
                      <td style={{ padding: '12px 16px', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ticket.subject}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={badgeStyle(sc?.color || '#6B7280', sc?.bg || 'rgba(107,114,128,0.1)')}>
                          {sc?.label || ticket.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={badgeStyle(pc?.color || '#6B7280', pc?.bg || 'rgba(107,114,128,0.1)')}>
                          {pc?.label || ticket.priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                        {ticket.assigned_to || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text3)', fontSize: 13, whiteSpace: 'nowrap' }}>
                        {formatDate(ticket.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket detail drawer */}
      {selected && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setSelected(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              zIndex: 1000, animation: 'fadeIn 0.2s ease',
            }}
          />
          {/* Drawer */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: '100%', maxWidth: 560,
            background: 'var(--bg)',
            zIndex: 1001,
            display: 'flex', flexDirection: 'column',
            boxShadow: '-4px 0 30px rgba(0,0,0,0.15)',
            animation: 'slideIn 0.25s ease',
          }}>
            {/* Drawer header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#FF6B00' }}>
                    {selected.ticket_number}
                  </span>
                  <span style={badgeStyle(
                    STATUS_CFG[selected.status]?.color || '#6B7280',
                    STATUS_CFG[selected.status]?.bg || 'rgba(107,114,128,0.1)',
                  )}>
                    {STATUS_CFG[selected.status]?.label || selected.status}
                  </span>
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: '4px 0 0', color: 'var(--text)' }}>
                  {selected.subject}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text3)', margin: '4px 0 0' }}>
                  {selected.customer?.name || selected.customer?.guest_email || `Хэрэглэгч #${selected.customer_id}`}
                  {' · '}
                  {formatDate(selected.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 22, color: 'var(--text3)', padding: '0 4px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Ticket controls */}
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid var(--border)',
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
            }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Төлөв
                </label>
                <select
                  value={selected.status}
                  onChange={e => updateTicket(selected.id, { status: e.target.value })}
                  disabled={updating}
                  style={{ ...selectStyle, marginTop: 4 }}
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Ач холбогдол
                </label>
                <select
                  value={selected.priority}
                  onChange={e => updateTicket(selected.id, { priority: e.target.value })}
                  disabled={updating}
                  style={{ ...selectStyle, marginTop: 4 }}
                >
                  {ALL_PRIORITIES.map(p => (
                    <option key={p} value={p}>{PRIORITY_CFG[p]?.label || p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Хариуцагч
                </label>
                <input
                  type="text"
                  value={selected.assigned_to || ''}
                  onChange={e => {
                    setSelected(prev => prev ? { ...prev, assigned_to: e.target.value } : null)
                  }}
                  onBlur={e => {
                    if (e.target.value !== (tickets.find(t => t.id === selected.id)?.assigned_to || '')) {
                      updateTicket(selected.id, { assigned_to: e.target.value })
                    }
                  }}
                  placeholder="Нэр оруулах..."
                  style={{ ...inputStyle, marginTop: 4 }}
                />
              </div>
            </div>

            {/* Message thread */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '20px 24px',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {(!selected.messages || selected.messages.length === 0) && (
                <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40, fontSize: 14 }}>
                  Мессеж байхгүй
                </div>
              )}
              {(selected.messages || []).map((msg, i) => {
                const isAdmin = msg.sender === 'admin'
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{
                      maxWidth: '80%',
                      padding: '10px 14px',
                      borderRadius: 12,
                      borderTopRightRadius: isAdmin ? 4 : 12,
                      borderTopLeftRadius: isAdmin ? 12 : 4,
                      background: isAdmin ? '#FF6B00' : 'var(--surface2)',
                      color: isAdmin ? '#fff' : 'var(--text)',
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}>
                      <div style={{
                        fontSize: 11, fontWeight: 600, marginBottom: 4,
                        color: isAdmin ? 'rgba(255,255,255,0.7)' : 'var(--text3)',
                      }}>
                        {msg.sender === 'admin' ? 'Админ' : msg.sender || 'Хэрэглэгч'}
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {msg.content}
                      </div>
                      <div style={{
                        fontSize: 11, marginTop: 6,
                        color: isAdmin ? 'rgba(255,255,255,0.6)' : 'var(--text4)',
                        textAlign: 'right',
                      }}>
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply area */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--border)',
              display: 'flex', gap: 10, alignItems: 'flex-end',
            }}>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Хариу бичих..."
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleReply()
                  }
                }}
                style={{
                  ...inputStyle,
                  minHeight: 44,
                  maxHeight: 120,
                  resize: 'vertical',
                }}
              />
              <button
                onClick={handleReply}
                disabled={sending || !replyText.trim()}
                style={{
                  ...btnPrimary,
                  opacity: sending || !replyText.trim() ? 0.5 : 1,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {sending ? '...' : 'Хариу илгээх'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create ticket modal */}
      {showCreate && (
        <>
          <div
            onClick={() => setShowCreate(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              zIndex: 2000, animation: 'fadeIn 0.2s ease',
            }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%', maxWidth: 480,
            background: 'var(--bg)',
            borderRadius: 16,
            zIndex: 2001,
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Шинэ тикет үүсгэх</h2>
              <button
                onClick={() => setShowCreate(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text3)', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>
                  Хэрэглэгч ID (заавал биш)
                </label>
                <input
                  type="number"
                  value={createForm.customer_id}
                  onChange={e => setCreateForm(f => ({ ...f, customer_id: e.target.value }))}
                  placeholder="Хэрэглэгчийн ID..."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>
                  Гарчиг *
                </label>
                <input
                  type="text"
                  value={createForm.subject}
                  onChange={e => setCreateForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Тикетийн гарчиг..."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>
                  Ач холбогдол
                </label>
                <select
                  value={createForm.priority}
                  onChange={e => setCreateForm(f => ({ ...f, priority: e.target.value }))}
                  style={selectStyle}
                >
                  {ALL_PRIORITIES.map(p => (
                    <option key={p} value={p}>{PRIORITY_CFG[p]?.label || p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>
                  Мессеж *
                </label>
                <textarea
                  value={createForm.message}
                  onChange={e => setCreateForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Эхний мессеж..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>
            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'flex-end', gap: 10,
            }}>
              <button style={btnSecondary} onClick={() => setShowCreate(false)}>
                Болих
              </button>
              <button
                style={{ ...btnPrimary, opacity: creating ? 0.5 : 1 }}
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? 'Үүсгэж байна...' : 'Үүсгэх'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes slideIn {
          from { transform: translateX(100%) }
          to { transform: translateX(0) }
        }
      `}</style>
    </div>
  )
}
