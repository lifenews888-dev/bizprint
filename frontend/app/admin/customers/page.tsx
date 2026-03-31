'use client'

import { apiFetch } from '@/lib/api'
import { useState, useEffect, useCallback } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

function fmt(n: number) {
  return new Intl.NumberFormat('mn-MN').format(Math.round(n)) + '₮'
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('mn-MN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const TIERS = ['ALL', 'RETAIL', 'B2B', 'VIP', 'WHOLESALE'] as const
type Tier = typeof TIERS[number]

const TIER_COLORS: Record<string, { bg: string; color: string }> = {
  RETAIL: { bg: 'var(--surface2)', color: 'var(--text2)' },
  B2B: { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6' },
  VIP: { bg: 'rgba(255,107,0,0.1)', color: '#FF6B00' },
  WHOLESALE: { bg: 'rgba(16,185,129,0.1)', color: '#10B981' },
}

const TIER_LABELS: Record<string, string> = {
  ALL: 'Бүгд',
  RETAIL: 'Retail',
  B2B: 'B2B',
  VIP: 'VIP',
  WHOLESALE: 'Wholesale',
}

const INTERACTION_LABELS: Record<string, string> = {
  QUOTE_REQUESTED: 'Үнийн санал',
  ORDER_PLACED: 'Захиалга',
  EMAIL_SENT: 'Имэйл',
  CALL_NOTE: 'Дуудлага',
  COMPLAINT: 'Гомдол',
  FEEDBACK: 'Санал хүсэлт',
}

const INTERACTION_ICONS: Record<string, string> = {
  QUOTE_REQUESTED: '📋',
  ORDER_PLACED: '🛒',
  EMAIL_SENT: '✉️',
  CALL_NOTE: '📞',
  COMPLAINT: '⚠️',
  FEEDBACK: '💬',
}

const DRAWER_TABS = ['Мэдээлэл', 'Quotes', 'Харилцаа', 'Тикет'] as const
type DrawerTab = typeof DRAWER_TABS[number]

const TICKET_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  open: { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6' },
  in_progress: { bg: 'rgba(255,107,0,0.1)', color: '#FF6B00' },
  resolved: { bg: 'rgba(16,185,129,0.1)', color: '#10B981' },
  closed: { bg: 'var(--surface2)', color: 'var(--text2)' },
}

const QUOTE_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft: { bg: 'var(--surface2)', color: 'var(--text2)' },
  sent: { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6' },
  confirmed: { bg: 'rgba(16,185,129,0.1)', color: '#10B981' },
  ordered: { bg: 'rgba(255,107,0,0.1)', color: '#FF6B00' },
  expired: { bg: 'rgba(239,68,68,0.1)', color: '#DC2626' },
}

// ─── Styles ───

const font = "'DM Sans','Segoe UI',system-ui,sans-serif"

const inp: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 13,
  color: 'var(--text)',
  outline: 'none',
  fontFamily: font,
}

const btnPrimary: React.CSSProperties = {
  padding: '10px 20px',
  background: '#FF6B00',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: font,
}

const btnSecondary: React.CSSProperties = {
  padding: '10px 20px',
  background: 'var(--surface2)',
  color: 'var(--text2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: font,
}

const label: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text2)',
  marginBottom: 6,
  display: 'block',
  fontWeight: 500,
}

// ─── Main Component ───

export default function AdminCustomersPage() {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<Tier>('ALL')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<any>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (tierFilter !== 'ALL') params.set('tier', tierFilter)
      params.set('page', String(page))
      const data = await apiFetch<any>(`/admin/customers?${params}`)
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [search, tierFilter, page])

  useEffect(() => { load() }, [load])

  const openDrawer = (customer: any) => {
    setSelected(customer)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setTimeout(() => setSelected(null), 300)
  }

  const totalPages = Math.max(1, Math.ceil(total / 20))

  return (
    <div className="p-4 md:p-6">
      <AdminPageHeader title="Хэрэглэгчид" description={`Нийт ${total} хэрэглэгч`} />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
        <input
          placeholder="Хайх..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ ...inp, width: 240 }}
        />
        <select
          value={tierFilter}
          onChange={e => { setTierFilter(e.target.value as Tier); setPage(1) }}
          style={{ ...inp, width: 140 }}
        >
          {TIERS.map(t => (
            <option key={t} value={t}>{TIER_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['Нэр', 'Компани', 'Түвшин', 'Захиалга', 'Нийт зарцуулсан', 'Сүүлийн холбоо'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Хэрэглэгч олдсонгүй</td>
              </tr>
            ) : items.map(c => {
              const tier = c.pricing_tier || 'RETAIL'
              const tc = TIER_COLORS[tier] || TIER_COLORS.RETAIL
              return (
                <tr
                  key={c.id}
                  onClick={() => openDrawer(c)}
                  style={{ borderTop: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text)' }}>
                    {c.full_name || c.guest_name || c.name || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text2)' }}>
                    {c.company_name || '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 99,
                      background: tc.bg, color: tc.color, fontWeight: 600,
                    }}>{tier}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text2)' }}>
                    {c.total_orders ?? 0}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text)', fontWeight: 500 }}>
                    {fmt(c.total_spent ?? 0)}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text3)', fontSize: 12 }}>
                    {fmtDate(c.last_contact_at)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            style={{ ...btnSecondary, opacity: page <= 1 ? 0.4 : 1 }}
          >
            ←
          </button>
          <span style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text2)' }}>
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{ ...btnSecondary, opacity: page >= totalPages ? 0.4 : 1 }}
          >
            →
          </button>
        </div>
      )}

      {/* Overlay */}
      {drawerOpen && (
        <div
          onClick={closeDrawer}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
            zIndex: 99, transition: 'opacity 0.3s',
          }}
        />
      )}

      {/* Drawer */}
      {selected && (
        <CustomerDrawer
          customer={selected}
          open={drawerOpen}
          onClose={closeDrawer}
          onUpdated={() => { load() }}
        />
      )}
    </div>
  )
}

// ─── Customer Drawer ───

function CustomerDrawer({
  customer,
  open,
  onClose,
  onUpdated,
}: {
  customer: any
  open: boolean
  onClose: () => void
  onUpdated: () => void
}) {
  const [tab, setTab] = useState<DrawerTab>('Мэдээлэл')
  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    if (!customer?.id) return
    setLoadingProfile(true)
    setTab('Мэдээлэл')
    apiFetch<any>(`/admin/customers/${customer.id}`)
      .then(d => setProfile(d))
      .catch(() => {})
      .finally(() => setLoadingProfile(false))
  }, [customer?.id])

  return (
    <div style={{
      position: 'fixed',
      top: 0, right: 0, bottom: 0,
      width: 500,
      maxWidth: '100vw',
      background: 'var(--bg)',
      borderLeft: '1px solid var(--border)',
      zIndex: 100,
      transform: open ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: font,
    }}>
      {/* Drawer Header */}
      <div style={{
        padding: '20px 24px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
            {customer.full_name || customer.guest_name || customer.name || 'Хэрэглэгч'}
          </h2>
          {customer.company_name && (
            <p style={{ fontSize: 13, color: 'var(--text2)', margin: '2px 0 0' }}>{customer.company_name}</p>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--surface2)',
            cursor: 'pointer', fontSize: 16, color: 'var(--text2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '2px solid var(--border)',
        padding: '0 24px',
      }}>
        {DRAWER_TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: tab === t ? '2px solid #FF6B00' : '2px solid transparent',
              marginBottom: -2,
              background: 'transparent',
              color: tab === t ? '#FF6B00' : 'var(--text2)',
              fontWeight: tab === t ? 600 : 400,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: font,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {loadingProfile ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>Уншиж байна...</div>
        ) : (
          <>
            {tab === 'Мэдээлэл' && <InfoTab profile={profile} customerId={customer.id} onUpdated={onUpdated} />}
            {tab === 'Quotes' && <QuotesTab customerId={customer.id} profile={profile} />}
            {tab === 'Харилцаа' && <InteractionsTab customerId={customer.id} />}
            {tab === 'Тикет' && <TicketsTab customerId={customer.id} />}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Info Tab ───

function InfoTab({ profile, customerId, onUpdated }: { profile: any; customerId: string; onUpdated: () => void }) {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    guest_email: '',
    company_name: '',
    company_register: '',
    pricing_tier: 'RETAIL',
    notes: '',
  })
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    setForm({
      full_name: profile.full_name || profile.guest_name || '',
      phone: profile.phone || '',
      guest_email: profile.guest_email || profile.email || '',
      company_name: profile.company_name || '',
      company_register: profile.company_register || '',
      pricing_tier: profile.pricing_tier || 'RETAIL',
      notes: profile.notes || '',
    })
    setTags(profile.tags || [])
  }, [profile])

  const save = async () => {
    setSaving(true)
    try {
      await apiFetch<any>(`/admin/customers/${customerId}`, {
        method: 'PUT',
        body: { ...form, tags },
      })
      onUpdated()
    } catch { /* */ }
    setSaving(false)
  }

  const addTag = () => {
    const t = newTag.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
    }
    setNewTag('')
  }

  const removeTag = (t: string) => {
    setTags(tags.filter(x => x !== t))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={label}>Нэр</label>
        <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} style={inp} />
      </div>
      <div>
        <label style={label}>Утас</label>
        <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} />
      </div>
      <div>
        <label style={label}>И-мэйл</label>
        <input value={form.guest_email} onChange={e => setForm({ ...form, guest_email: e.target.value })} style={inp} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={label}>Компани</label>
          <input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} style={inp} />
        </div>
        <div>
          <label style={label}>Регистр</label>
          <input value={form.company_register} onChange={e => setForm({ ...form, company_register: e.target.value })} style={inp} />
        </div>
      </div>
      <div>
        <label style={label}>Түвшин</label>
        <select
          value={form.pricing_tier}
          onChange={e => setForm({ ...form, pricing_tier: e.target.value })}
          style={inp}
        >
          {TIERS.filter(t => t !== 'ALL').map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label style={label}>Tags</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {tags.map(t => (
            <span key={t} style={{
              fontSize: 12, padding: '3px 10px', borderRadius: 99,
              background: 'rgba(255,107,0,0.1)', color: '#FF6B00',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {t}
              <span
                onClick={() => removeTag(t)}
                style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14, lineHeight: 1 }}
              >×</span>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTag()}
            placeholder="Шинэ tag..."
            style={{ ...inp, flex: 1 }}
          />
          <button onClick={addTag} style={{ ...btnSecondary, whiteSpace: 'nowrap' }}>+</button>
        </div>
      </div>

      <div>
        <label style={label}>Тэмдэглэл</label>
        <textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={4}
          style={{ ...inp, resize: 'vertical' }}
        />
      </div>

      <button onClick={save} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Хадгалж байна...' : 'Хадгалах'}
      </button>
    </div>
  )
}

// ─── Quotes Tab ───

function QuotesTab({ customerId, profile }: { customerId: string; profile: any }) {
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const email = profile?.guest_email || profile?.email
    const url = email
      ? `/quote/guest?email=${encodeURIComponent(email)}`
      : `/quote?customer_id=${customerId}`
    apiFetch<any>(url)
      .then(d => setQuotes(Array.isArray(d) ? d : d?.items || []))
      .catch(() => setQuotes([]))
      .finally(() => setLoading(false))
  }, [customerId, profile])

  if (loading) return <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>Уншиж байна...</div>
  if (quotes.length === 0) return <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>Quote олдсонгүй</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {quotes.map((q, i) => {
        const sc = QUOTE_STATUS_COLORS[q.status] || QUOTE_STATUS_COLORS.draft
        return (
          <div key={q.id || i} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                {q.quote_number || `#${i + 1}`}
              </span>
              <span style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 99,
                background: sc.bg, color: sc.color, fontWeight: 600,
              }}>
                {q.status || 'draft'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
              {q.product_name || q.items?.[0]?.product_name || '—'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                {fmt(q.total_price ?? q.grand_total ?? 0)}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                {fmtDate(q.created_at)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Interactions Tab ───

function InteractionsTab({ customerId }: { customerId: string }) {
  const [interactions, setInteractions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteType, setNoteType] = useState('CALL_NOTE')
  const [submitting, setSubmitting] = useState(false)

  const loadInteractions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<any>(`/admin/customers/${customerId}/interactions`)
      setInteractions(Array.isArray(data) ? data : [])
    } catch {
      setInteractions([])
    }
    setLoading(false)
  }, [customerId])

  useEffect(() => { loadInteractions() }, [loadInteractions])

  const submit = async () => {
    if (!noteContent.trim()) return
    setSubmitting(true)
    try {
      await apiFetch<any>(`/admin/customers/${customerId}/interactions`, {
        method: 'POST',
        body: {
          type: noteType,
          title: noteTitle || INTERACTION_LABELS[noteType] || noteType,
          content: noteContent,
          created_by: 'admin',
        },
      })
      setNoteContent('')
      setNoteTitle('')
      setAdding(false)
      loadInteractions()
    } catch { /* */ }
    setSubmitting(false)
  }

  if (loading) return <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>Уншиж байна...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Харилцааны түүх</span>
        <button onClick={() => setAdding(!adding)} style={btnPrimary}>
          {adding ? 'Болих' : 'Тэмдэглэл нэмэх'}
        </button>
      </div>

      {adding && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 16, marginBottom: 16,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={label}>Төрөл</label>
              <select value={noteType} onChange={e => setNoteType(e.target.value)} style={inp}>
                {Object.entries(INTERACTION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>Гарчиг</label>
              <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="Гарчиг..." style={inp} />
            </div>
          </div>
          <div>
            <label style={label}>Агуулга</label>
            <textarea
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              rows={3}
              placeholder="Тэмдэглэл бичих..."
              style={{ ...inp, resize: 'vertical' }}
            />
          </div>
          <button onClick={submit} disabled={submitting} style={{ ...btnPrimary, alignSelf: 'flex-start', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Хадгалж байна...' : 'Нэмэх'}
          </button>
        </div>
      )}

      {interactions.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>Харилцаа олдсонгүй</div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 28 }}>
          {/* Timeline line */}
          <div style={{
            position: 'absolute', left: 10, top: 6, bottom: 6,
            width: 2, background: 'var(--border)',
          }} />

          {interactions.map((item, i) => (
            <div key={item.id || i} style={{ position: 'relative', marginBottom: 20 }}>
              {/* Timeline dot */}
              <div style={{
                position: 'absolute', left: -22, top: 4,
                width: 24, height: 24, borderRadius: 99,
                background: 'var(--surface)', border: '2px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12,
              }}>
                {INTERACTION_ICONS[item.type] || '📌'}
              </div>

              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: 14,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 99,
                      background: 'rgba(255,107,0,0.1)', color: '#FF6B00', fontWeight: 600,
                    }}>
                      {INTERACTION_LABELS[item.type] || item.type}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {item.title}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {fmtDate(item.created_at)}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text2)', margin: '6px 0 0', lineHeight: 1.5 }}>
                  {item.content}
                </p>
                {item.created_by && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                    — {item.created_by}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tickets Tab ───

function TicketsTab({ customerId }: { customerId: string }) {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiFetch<any>(`/admin/customers/${customerId}/tickets`)
      .then(d => setTickets(Array.isArray(d) ? d : []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false))
  }, [customerId])

  if (loading) return <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>Уншиж байна...</div>
  if (tickets.length === 0) return <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>Тикет олдсонгүй</div>

  const PRIORITY_COLORS: Record<string, string> = {
    low: '#6B7280',
    medium: '#F59E0B',
    high: '#EF4444',
    urgent: '#DC2626',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {tickets.map((t, i) => {
        const sc = TICKET_STATUS_COLORS[t.status] || TICKET_STATUS_COLORS.open
        const pc = PRIORITY_COLORS[t.priority] || '#6B7280'
        return (
          <div key={t.id || i} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                {t.ticket_number || `#${i + 1}`}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 99,
                  background: sc.bg, color: sc.color, fontWeight: 600,
                }}>
                  {t.status}
                </span>
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 99,
                  background: pc + '18', color: pc, fontWeight: 600,
                }}>
                  {t.priority || 'medium'}
                </span>
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
              {t.subject || '—'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              {fmtDate(t.created_at)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
