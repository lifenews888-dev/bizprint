'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { QRCodeSVG } from 'qrcode.react'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const ORANGE = '#FF6B00'

const RSVP_LABELS: Record<string, { text: string; color: string }> = {
  attending: { text: 'Ирнэ', color: '#10B981' },
  declined: { text: 'Ирэхгүй', color: '#EF4444' },
  maybe: { text: 'Магадгүй', color: '#F59E0B' },
  pending: { text: 'Хүлээгдэж буй', color: '#6B7280' },
}

export default function InvitationDetail() {
  const { id } = useParams()
  const [inv, setInv] = useState<any>(null)
  const [guests, setGuests] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [tab, setTab] = useState<'details' | 'guests' | 'analytics'>('details')
  const [guestForm, setGuestForm] = useState({ name: '', phone: '', email: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch(`/invitations/my`).then((list: any) => (Array.isArray(list) ? list : []).find((i: any) => i.id === id)),
      apiFetch(`/invitations/${id}/guests`).catch(() => []),
      apiFetch(`/invitations/${id}/rsvp-stats`).catch(() => null),
    ]).then(([i, g, s]: any[]) => { setInv(i); setGuests(g as any); setStats(s) }).finally(() => setLoading(false))
  }, [id])

  const addGuest = async () => {
    if (!guestForm.name) return
    const g = await apiFetch(`/invitations/${id}/guests`, { method: 'POST', body: guestForm })
    setGuests([...guests, g])
    setGuestForm({ name: '', phone: '', email: '' })
  }

  const publishInvitation = async () => {
    const updated = await apiFetch(`/invitations/${id}/publish`, { method: 'POST' })
    setInv(updated)
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: FONT, color: '#9CA3AF' }}>Ачааллаж байна...</div>
  if (!inv) return <div style={{ padding: 40, textAlign: 'center', fontFamily: FONT, color: '#EF4444' }}>Урилга олдсонгүй</div>

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'https://bizprint.mn')
  const inviteUrl = `${baseUrl}/invite/${inv.slug}`

  return (
    <div style={{ padding: 24, fontFamily: FONT, maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <a href="/dashboard/customer/invitations" style={{ fontSize: 13, color: ORANGE, textDecoration: 'none' }}>&larr; Бүх урилгууд</a>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 0' }}>{inv.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {inv.status === 'draft' && (
            <button onClick={publishInvitation} style={{ padding: '10px 24px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Нийтлэх</button>
          )}
          <button onClick={() => navigator.clipboard.writeText(inviteUrl)} style={{ padding: '10px 24px', background: 'var(--surface2, #F3F4F6)', color: 'var(--text, #374151)', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>Линк хуулах</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid var(--border, #E5E7EB)' }}>
        {(['details', 'guests', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: tab === t ? `2px solid ${ORANGE}` : '2px solid transparent', color: tab === t ? ORANGE : '#6B7280', fontWeight: tab === t ? 600 : 400, cursor: 'pointer', fontSize: 14 }}>
            {t === 'details' ? 'Дэлгэрэнгүй' : t === 'guests' ? `Зочид (${guests.length})` : 'Аналитик'}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {tab === 'details' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* QR + Link */}
          <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 24, border: '1px solid var(--border, #E5E7EB)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <QRCodeSVG value={inviteUrl} size={180} bgColor="#FFFFFF" fgColor="#000000" level="M" />
            <div style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', wordBreak: 'break-all' }}>{inviteUrl}</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
              <span style={{ color: '#6B7280' }}>{inv.view_count} үзсэн</span>
              <span style={{ color: '#10B981' }}>{inv.rsvp_count} хариулсан</span>
            </div>
          </div>

          {/* Event info */}
          <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 24, border: '1px solid var(--border, #E5E7EB)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Арга хэмжээ</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <Info label="Огноо" value={inv.event_date ? new Date(inv.event_date).toLocaleDateString('mn-MN') : '-'} />
              <Info label="Цаг" value={inv.event_time || '-'} />
              <Info label="Байршил" value={inv.venue_name || '-'} />
              <Info label="Хаяг" value={inv.venue_address || '-'} />
              <Info label="Статус" value={inv.status} />
            </div>
          </div>
        </div>
      )}

      {/* Guests Tab */}
      {tab === 'guests' && (
        <div>
          {/* RSVP Summary */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              <KpiBox label="Ирнэ" value={stats.attending} color="#10B981" />
              <KpiBox label="Ирэхгүй" value={stats.declined} color="#EF4444" />
              <KpiBox label="Магадгүй" value={stats.maybe} color="#F59E0B" />
              <KpiBox label="Хүлээгдэж буй" value={stats.pending} color="#6B7280" />
            </div>
          )}

          {/* Add guest */}
          <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 20, border: '1px solid var(--border, #E5E7EB)', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Зочин нэмэх</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={guestForm.name} onChange={e => setGuestForm({ ...guestForm, name: e.target.value })} placeholder="Нэр *" style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border, #E5E7EB)', fontSize: 14, background: 'var(--bg, #fff)', color: 'var(--text, #000)' }} />
              <input value={guestForm.phone} onChange={e => setGuestForm({ ...guestForm, phone: e.target.value })} placeholder="Утас" style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border, #E5E7EB)', fontSize: 14, background: 'var(--bg, #fff)', color: 'var(--text, #000)' }} />
              <button onClick={addGuest} style={{ padding: '10px 20px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Нэмэх</button>
            </div>
          </div>

          {/* Guest list */}
          <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, border: '1px solid var(--border, #E5E7EB)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--surface2, #F9FAFB)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280' }}>Нэр</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280' }}>Утас</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>RSVP</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>Үзсэн</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((g: any) => {
                  const rs = RSVP_LABELS[g.rsvp_status] || RSVP_LABELS.pending
                  return (
                    <tr key={g.id} style={{ borderTop: '1px solid var(--border, #E5E7EB)' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--text, #111)' }}>{g.name}</td>
                      <td style={{ padding: '12px 16px', color: '#6B7280' }}>{g.phone || '-'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ color: rs.color, fontWeight: 600 }}>{rs.text}</span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: '#6B7280' }}>{g.has_viewed ? 'Тийм' : 'Үгүй'}</td>
                    </tr>
                  )
                })}
                {guests.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: '#9CA3AF' }}>Зочин нэмээгүй байна</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <KpiBox label="Нийт үзсэн" value={inv.view_count} color={ORANGE} />
          <KpiBox label="RSVP хариулсан" value={inv.rsvp_count} color="#10B981" />
          <KpiBox label="Хуваалцсан" value={inv.share_count} color="#8B5CF6" />
        </div>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--text, #111)' }}>{value}</div>
    </div>
  )
}

function KpiBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: 'var(--surface, #fff)', borderRadius: 14, padding: 20, border: '1px solid var(--border, #E5E7EB)', textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{label}</div>
    </div>
  )
}
