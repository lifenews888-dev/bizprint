'use client'

import { apiFetch } from '@/lib/api'
import { useEffect, useMemo, useState } from 'react'

// Types
interface WithdrawRequest {
  id: number
  user_id: number
  amount: number
  note?: string
  status: 'pending' | 'approved' | 'rejected'
  reject_reason?: string
  created_at: string
  user?: { id: number; email: string; name?: string; role: string }
}

// Constants
const ROLE_LABEL: Record<string, { label: string; color: string }> = {
  sales:    { label: 'Борлуулагч', color: '#3B82F6' },
  designer: { label: 'Дизайнер',   color: '#8B5CF6' },
  factory:  { label: 'Үйлдвэр',    color: '#10B981' },
  courier:  { label: 'Жолооч',     color: '#F59E0B' },
  customer: { label: 'Хэрэглэгч',  color: '#FF6B35' },
}

const STATUS_CONFIG = {
  pending:  { label: 'Хүлээгдэж байна', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  approved: { label: 'Батлагдсан',      color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  rejected: { label: 'Татгалзсан',      color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
}

// Helpers
function formatDate(str: string) {
  return new Date(str).toLocaleString('mn-MN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

// Component
export default function AdminWalletRequestsPage() {
  const [requests, setRequests] = useState<WithdrawRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [roleFilter, setRoleFilter]     = useState<'all' | 'sales' | 'designer' | 'factory' | 'courier' | 'customer'>('all')
  const [search, setSearch]             = useState('')

  const [actionModal, setActionModal] = useState<{ type: 'approve' | 'reject'; request: WithdrawRequest } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing]     = useState(false)

  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total_pending_amount: 0 })

  useEffect(() => { fetchRequests() }, [])

  async function fetchRequests() {
    setLoading(true)
    try {
      const res = await apiFetch(`/wallet/withdraw-requests`)
      const data: WithdrawRequest[] = res
      setRequests(data)
      setStats({
        pending:              data.filter(r => r.status === 'pending').length,
        approved:             data.filter(r => r.status === 'approved').length,
        rejected:             data.filter(r => r.status === 'rejected').length,
        total_pending_amount: data.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0),
      })
    } catch {
      showToast('Серверээс уншихад алдаа гарлаа', 'err')
    }
    setLoading(false)
  }

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  async function approveRequest(req: WithdrawRequest) {
    setProcessing(true)
    try {
      await apiFetch(`/wallet/withdraw-requests/${req.id}/approve`, {
        method: 'PATCH',
      })
      showToast(`${req.user?.email || 'Хэрэглэгч'}-ийн ${req.amount.toLocaleString()}₮ татах хүсэлт батлагдлаа`)
      setActionModal(null)
      fetchRequests()
    } catch {
      showToast('Алдаа гарлаа', 'err')
    }
    setProcessing(false)
  }

  async function rejectRequest(req: WithdrawRequest) {
    if (!rejectReason.trim()) return
    setProcessing(true)
    try {
      await apiFetch(`/wallet/withdraw-requests/${req.id}/reject`, {
        method: 'PATCH',
        body: { reason: rejectReason },
      })
      showToast(`Татгалзлаа — ${req.user?.email}`)
      setActionModal(null)
      setRejectReason('')
      fetchRequests()
    } catch {
      showToast('Алдаа гарлаа', 'err')
    }
    setProcessing(false)
  }

  const filtered = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()
    return requests.filter(r => {
      const statusPass = statusFilter === 'all' || r.status === statusFilter
      const rolePass   = roleFilter === 'all' || r.user?.role === roleFilter
      const text = `${r.user?.email || ''} ${r.user?.name || ''} ${r.note || ''}`.toLowerCase()
      const searchPass = !searchTerm || text.includes(searchTerm)
      return statusPass && rolePass && searchPass
    })
  }, [requests, statusFilter, roleFilter, search])

  function exportCsv() {
    if (filtered.length === 0) return showToast('Экспортлох мөр алга', 'err')
    const header = ['ID','User','Email','Role','Amount','Status','Note','Created'].join(',')
    const rows = filtered.map(r => [
      r.id,
      `"${(r.user?.name || '').replace(/"/g,'""')}"`,
      r.user?.email || '',
      r.user?.role || '',
      r.amount,
      r.status,
      `"${(r.note || '').replace(/"/g,'""')}"`,
      r.created_at,
    ].join(','))
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wallet-requests-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: '28px 32px', color: 'var(--text)', fontFamily: "'DM Sans', 'Segoe UI', system-ui" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.type === 'ok' ? '#10B981' : '#EF4444',
          color: '#fff', padding: '12px 20px', borderRadius: 10,
          fontSize: 14, fontWeight: 600, boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}>
          {toast.type === 'ok' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Татах хүсэлтүүд</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, margin: '4px 0 0' }}>
            Хэтэвчний татах хүсэлтийг хянах, батлах, татгалзах
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            placeholder="Хэрэглэгч / имэйл / тэмдэглэл..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface)', minWidth: 240, color: 'var(--text)', fontSize: 13,
            }}
          />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as typeof roleFilter)}
            style={{
              padding: '9px 10px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface)', color: 'var(--text)', fontSize: 13,
            }}
          >
            <option value="all">Бүх үүрэг</option>
            <option value="sales">Борлуулагч</option>
            <option value="designer">Дизайнер</option>
            <option value="factory">Үйлдвэр</option>
            <option value="courier">Жолооч</option>
            <option value="customer">Хэрэглэгч</option>
          </select>
          <button onClick={fetchRequests} style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '9px 14px', cursor: 'pointer',
            fontSize: 13, color: 'var(--text2)',
          }}>
            ↺ Шинэчлэх
          </button>
          <button onClick={exportCsv} style={{
            background: '#111', border: '1px solid #111',
            borderRadius: 8, padding: '9px 14px', cursor: 'pointer',
            fontSize: 13, color: '#fff', fontWeight: 600,
          }}>
            ⭳ CSV Export
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          {
            label: 'Хүлээгдэж байна',
            value: stats.pending,
            sub: `${stats.total_pending_amount.toLocaleString()}₮`,
            color: '#F59E0B',
            highlight: stats.pending > 0,
            filter: 'pending' as const,
          },
          { label: 'Батлагдсан',  value: stats.approved, color: '#10B981', sub: '', highlight: false, filter: 'approved' as const },
          { label: 'Татгалзсан',  value: stats.rejected, color: '#EF4444', sub: '', highlight: false, filter: 'rejected' as const },
          { label: 'Нийт хүсэлт', value: requests.length, color: '#FF6B35', sub: '', highlight: false, filter: 'all' as const },
        ].map(s => (
          <div
            key={s.label}
            onClick={() => setStatusFilter(s.filter)}
            style={{
              background: 'var(--surface)',
              border: s.highlight ? `1px solid ${s.color}44` : '1px solid var(--border)',
              borderRadius: 12, padding: '18px 20px',
              borderLeft: `3px solid ${s.color}`,
              cursor: 'pointer',
              boxShadow: statusFilter === s.filter ? '0 8px 20px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>{s.label}</div>
            {s.sub && (
              <div style={{ fontSize: 12, color: s.color, fontWeight: 600, marginTop: 4 }}>{s.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {([
          { key: 'pending',  label: `⏳ Хүлээгдэж байна (${stats.pending})` },
          { key: 'approved', label: `✓ Батлагдсан`  },
          { key: 'rejected', label: `✕ Татгалзсан`  },
          { key: 'all',      label: `📄 Бүгд`        },
        ] as { key: typeof statusFilter; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setStatusFilter(t.key)} style={{
            background: 'none', border: 'none', padding: '10px 16px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            color: statusFilter === t.key ? '#FF6B35' : 'var(--text2)',
            borderBottom: statusFilter === t.key ? '2px solid #FF6B35' : '2px solid transparent',
            marginBottom: -1,
          }}>
            {t.label}
          </button>
        ))}
        {(roleFilter !== 'all' || search.trim()) && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {roleFilter !== 'all' && (
              <span style={{
                background: '#F3F4F6', color: '#111', padding: '6px 10px',
                borderRadius: 999, fontSize: 12, border: '1px solid #E5E7EB',
              }}>
                Үүрэг: {ROLE_LABEL[roleFilter]?.label || roleFilter}
              </span>
            )}
            {search.trim() && (
              <span style={{
                background: '#F3F4F6', color: '#111', padding: '6px 10px',
                borderRadius: 999, fontSize: 12, border: '1px solid #E5E7EB',
              }}>
                Хайлт: “{search}”
              </span>
            )}
            <button
              onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('pending') }}
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 999, padding: '6px 12px', cursor: 'pointer',
                fontSize: 12, color: 'var(--text2)',
              }}
            >
              ⌫ Цэвэрлэх
            </button>
          </div>
        )}
      </div>

      {/* Table / Empty */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: 60, textAlign: 'center',
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <div style={{ fontWeight: 600 }}>
            {statusFilter === 'pending' ? 'Хүлээгдэж буй хүсэлт алга' : 'Хүсэлт олдсонгүй'}
          </div>
          <div style={{ marginTop: 8, color: 'var(--text2)' }}>
            Шүүлтүүрээ цэвэрлээд дахин үзнэ үү.
          </div>
          <button
            onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all') }}
            style={{
              marginTop: 14,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13,
            }}
          >
            Шүүлтүүр цэвэрлэх
          </button>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1.5fr 1fr 130px 120px 130px 160px',
            padding: '10px 20px', background: 'var(--surface2)',
            borderBottom: '1px solid var(--border)',
            fontSize: 11, fontWeight: 700, color: 'var(--text2)',
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            <span>Хэрэглэгч</span>
            <span>Тайлбар</span>
            <span style={{ textAlign: 'right' }}>Дүн</span>
            <span>Төлөв</span>
            <span>Огноо</span>
            <span style={{ textAlign: 'right' }}>Үйлдэл</span>
          </div>

          {filtered.map((req, i) => {
            const roleInfo   = ROLE_LABEL[req.user?.role || ''] || { label: req.user?.role || '—', color: '#888' }
            const statusInfo = STATUS_CONFIG[req.status]

            return (
              <div key={req.id} style={{
                display: 'grid', gridTemplateColumns: '1.5fr 1fr 130px 120px 130px 160px',
                padding: '14px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                alignItems: 'center', fontSize: 14,
              }}>
                {/* User */}
                <div>
                  <div style={{ fontWeight: 500 }}>{req.user?.name || req.user?.email || `User #${req.user_id}`}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span style={{
                      background: `${roleInfo.color}18`, color: roleInfo.color,
                      borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600,
                    }}>
                      {roleInfo.label}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>#{req.id}</span>
                  </div>
                </div>

                {/* Note */}
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>
                  {req.note || '—'}
                </span>

                {/* Amount */}
                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 16, color: '#FF6B35' }}>
                  {req.amount.toLocaleString()}₮
                </div>

                {/* Status */}
                <span style={{
                  background: statusInfo.bg, color: statusInfo.color,
                  borderRadius: 6, padding: '4px 10px',
                  fontSize: 12, fontWeight: 600, width: 'fit-content',
                }}>
                  {statusInfo.label}
                </span>

                {/* Date */}
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {formatDate(req.created_at)}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  {req.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => setActionModal({ type: 'approve', request: req })}
                        style={{
                          background: 'rgba(16,185,129,0.1)', color: '#10B981',
                          border: '1px solid rgba(16,185,129,0.3)',
                          borderRadius: 6, padding: '6px 14px',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        ✓ Батлах
                      </button>
                      <button
                        onClick={() => { setActionModal({ type: 'reject', request: req }); setRejectReason('') }}
                        style={{
                          background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                          border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: 6, padding: '6px 14px',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        ✕ Татгалзах
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                      {req.status === 'approved' ? '✓ Батлагдсан' : `✕ ${req.reject_reason || 'Татгалзсан'}`}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Action modal */}
      {actionModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 32, width: 440,
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}>
            {actionModal.type === 'approve' ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Батлах уу?</h2>
                  <p style={{ color: 'var(--text2)', fontSize: 13, margin: '6px 0 0' }}>
                    Энэ үйлдлийг буцааж боломжгүй
                  </p>
                </div>

                <div style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 10, padding: '14px 18px', marginBottom: 24,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text2)', fontSize: 13 }}>Хэрэглэгч</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                      {actionModal.request.user?.email}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text2)', fontSize: 13 }}>Дүн</span>
                    <span style={{ fontWeight: 800, fontSize: 18, color: '#10B981' }}>
                      {actionModal.request.amount.toLocaleString()}₮
                    </span>
                  </div>
                  {actionModal.request.note && (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text2)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                      {actionModal.request.note}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setActionModal(null)}
                    style={{
                      flex: 1, padding: '12px',
                      background: 'var(--surface2)', color: 'var(--text)',
                      border: '1px solid var(--border)', borderRadius: 8,
                      fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    }}
                  >
                    Болих
                  </button>
                  <button
                    onClick={() => approveRequest(actionModal.request)}
                    disabled={processing}
                    style={{
                      flex: 2, padding: '12px',
                      background: processing ? 'var(--border)' : '#10B981',
                      color: '#fff', border: 'none', borderRadius: 8,
                      fontWeight: 700, fontSize: 14,
                      cursor: processing ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {processing ? 'Баталж байна...' : '✓ Тийм, батлах'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✕</div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Татгалзах уу?</h2>
                  <p style={{ color: 'var(--text2)', fontSize: 13, margin: '6px 0 0' }}>
                    {actionModal.request.user?.email} — {actionModal.request.amount.toLocaleString()}₮
                  </p>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--text2)',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
                  }}>
                    Татгалзах шалтгаан *
                  </div>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Хэрэглэгчид мэдэгдэх шалтгаан бичнэ үү..."
                    rows={3}
                    style={{
                      width: '100%', padding: '10px 12px',
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      borderRadius: 8, fontSize: 14, color: 'var(--text)',
                      outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setActionModal(null)}
                    style={{
                      flex: 1, padding: '12px',
                      background: 'var(--surface2)', color: 'var(--text)',
                      border: '1px solid var(--border)', borderRadius: 8,
                      fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    }}
                  >
                    Болих
                  </button>
                  <button
                    onClick={() => rejectRequest(actionModal.request)}
                    disabled={processing || !rejectReason.trim()}
                    style={{
                      flex: 2, padding: '12px',
                      background: processing || !rejectReason.trim() ? 'var(--border)' : '#EF4444',
                      color: '#fff', border: 'none', borderRadius: 8,
                      fontWeight: 700, fontSize: 14,
                      cursor: processing || !rejectReason.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {processing ? 'Илгээж байна...' : '✕ Татгалзах'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
