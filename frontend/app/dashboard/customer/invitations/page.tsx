'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import UpgradeModal from '@/components/UpgradeModal'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const ORANGE = '#FF6B00'

const TYPE_LABELS: Record<string, string> = {
  wedding: 'Хурим', birthday: 'Төрсөн өдөр', corporate: 'Байгууллага',
  baby_shower: 'Бэби шоуэр', graduation: 'Төгсөлт', anniversary: 'Ой', other: 'Бусад',
}
const INP: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border, #E5E7EB)', fontSize: 14, background: 'var(--bg, #fff)', color: 'var(--text, #000)', fontFamily: FONT }
const LBL: React.CSSProperties = { fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }

const STATUS_MAP: Record<string, { text: string; color: string; bg: string }> = {
  draft: { text: 'Ноорог', color: '#6B7280', bg: '#F3F4F6' },
  active: { text: 'Идэвхтэй', color: '#10B981', bg: '#DCFCE7' },
  expired: { text: 'Дууссан', color: '#EF4444', bg: '#FEE2E2' },
  cancelled: { text: 'Цуцалсан', color: '#6B7280', bg: '#F3F4F6' },
}

export default function InvitationsDashboard() {
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'wedding', event_date: '', event_time: '', venue_name: '', venue_address: '', rsvp_enabled: true, max_guests: 0, description: '' })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoName, setVideoName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [usage, setUsage] = useState<any>(null)
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; current?: number; max?: number }>({ open: false })
  const [suggestedPlan, setSuggestedPlan] = useState<any>(null)
  const [addons, setAddons] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    const headers = { Authorization: `Bearer ${token}` }
    const safeFetch = (path: string) => fetch(`http://localhost:4000${path}`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null)
    Promise.all([
      safeFetch('/invitations/my'),
      safeFetch('/subscription/usage'),
      safeFetch('/subscription/suggestions'),
      safeFetch('/subscription/addons'),
    ]).then(([inv, u, sug, a]) => {
      setInvitations(Array.isArray(inv) ? inv : [])
      setUsage(u)
      setSuggestedPlan(sug?.suggested_plan || null)
      setAddons(Array.isArray(a) ? a : [])
    }).finally(() => setLoading(false))
  }, [])

  const invUsage = usage?.invitations
  const pct = invUsage ? Math.min(invUsage.percentage, 100) : 0
  const isWarning = invUsage?.status === 'warning'
  const isExceeded = invUsage?.status === 'exceeded'

  const uploadFile = async (file: File): Promise<string | null> => {
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await apiFetch<any>('/upload/file', { method: 'POST', body: fd })
      return res?.file_url ? `http://localhost:4000${res.file_url}` : null
    } catch { return null }
  }

  const handleCreate = async () => {
    if (!form.title) return
    setUploading(true)
    try {
      const body: any = { ...form }
      // Upload cover image
      if (coverFile) {
        const url = await uploadFile(coverFile)
        if (url) body.cover_image_url = url
      }
      // Upload video
      if (videoFile) {
        const url = await uploadFile(videoFile)
        if (url) body.video_urls = [url]
      }
      const inv = await apiFetch('/invitations', { method: 'POST', body })
      setInvitations([inv, ...invitations])
      setShowCreate(false)
      setForm({ title: '', type: 'wedding', event_date: '', event_time: '', venue_name: '', venue_address: '', rsvp_enabled: true, max_guests: 0, description: '' })
      setCoverFile(null); setCoverPreview(''); setVideoFile(null); setVideoName('')
      // Refresh usage
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      if (token) {
        fetch('http://localhost:4000/subscription/usage', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : null).then(u => u && setUsage(u)).catch(() => {})
      }
    } catch (err: any) {
      let errData: any = null
      try { errData = JSON.parse(err.message) } catch {}
      if (errData?.code === 'SUBSCRIPTION_LIMIT_EXCEEDED' || err.message?.includes('хязгаар')) {
        setUpgradeModal({
          open: true,
          current: errData?.current ?? invUsage?.current,
          max: errData?.max ?? invUsage?.effective_max,
        })
      } else {
        alert(err.message || 'Алдаа гарлаа')
      }
    } finally { setUploading(false) }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: FONT, color: '#9CA3AF' }}>Ачааллаж байна...</div>

  return (
    <div style={{ padding: 24, fontFamily: FONT, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Урилгууд</h1>
          <p style={{ color: '#6B7280', fontSize: 14, margin: '4px 0 0' }}>Дижитал урилга үүсгэж, зочдоо удирдах</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={{ padding: '10px 24px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          + Шинэ урилга
        </button>
      </div>

      {/* Usage bar */}
      {invUsage && (
        <div style={{
          background: isExceeded ? '#FEF2F2' : isWarning ? '#FFFBEB' : 'var(--surface, #fff)',
          borderRadius: 14, padding: '16px 20px', marginBottom: 20,
          border: isExceeded ? '2px solid #FCA5A5' : isWarning ? '2px solid #FDE68A' : '1px solid var(--border, #E5E7EB)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text, #374151)' }}>
                💌 Урилгын хязгаар
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: isExceeded ? '#DC2626' : isWarning ? '#D97706' : ORANGE }}>
                {invUsage.current} / {invUsage.effective_max}
              </span>
            </div>
            <div style={{ height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`, borderRadius: 4, transition: 'width 0.5s ease',
                background: isExceeded ? '#DC2626' : isWarning ? '#F59E0B' : ORANGE,
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>{invUsage.percentage}% ашиглагдсан</span>
              {invUsage.addon_bonus > 0 && (
                <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600 }}>+{invUsage.addon_bonus} нэмэлт</span>
              )}
            </div>
          </div>
          {isExceeded && (
            <button onClick={() => setUpgradeModal({ open: true, current: invUsage.current, max: invUsage.effective_max })} style={{
              padding: '10px 20px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap',
            }}>
              Багц шинэчлэх
            </button>
          )}
          {isWarning && (
            <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600, whiteSpace: 'nowrap' }}>
              ⚠️ Хязгаарт ойрхон
            </div>
          )}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 24, border: '1px solid var(--border, #E5E7EB)', marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Шинэ урилга үүсгэх</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LBL}>Гарчиг *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Жишээ: Маналын хурим" style={INP} />
            </div>
            <div>
              <label style={LBL}>Төрөл</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={INP}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Огноо *</label>
              <input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} style={INP} />
            </div>
            <div>
              <label style={LBL}>Цаг *</label>
              <input type="time" value={form.event_time} onChange={e => setForm({ ...form, event_time: e.target.value })} style={INP} />
            </div>
            <div>
              <label style={LBL}>Байршил</label>
              <input value={form.venue_name} onChange={e => setForm({ ...form, venue_name: e.target.value })} placeholder="Шангри-Ла зочид буудал" style={INP} />
            </div>
            <div>
              <label style={LBL}>Хаяг</label>
              <input value={form.venue_address} onChange={e => setForm({ ...form, venue_address: e.target.value })} placeholder="Байршлын дэлгэрэнгүй хаяг" style={INP} />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginTop: 12 }}>
            <label style={LBL}>Тайлбар / мэндчилгээ</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Урилгын мэндчилгээ, нэмэлт мэдээлэл..." rows={3} style={{ ...INP, resize: 'vertical' }} />
          </div>

          {/* Cover image upload */}
          <div style={{ marginTop: 16 }}>
            <label style={LBL}>Нүүр зураг</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--surface2, #F3F4F6)', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text, #374151)', border: '1px dashed var(--border, #D1D5DB)' }}>
                📷 Зураг сонгох
                <input type="file" accept="image/*" hidden onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)) }
                }} />
              </label>
              {coverPreview && (
                <div style={{ position: 'relative' }}>
                  <img src={coverPreview} alt="" style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 8 }} />
                  <button onClick={() => { setCoverFile(null); setCoverPreview('') }} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#EF4444', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              )}
            </div>
          </div>

          {/* Video upload */}
          <div style={{ marginTop: 12 }}>
            <label style={LBL}>Видео (MP4, WebM)</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--surface2, #F3F4F6)', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text, #374151)', border: '1px dashed var(--border, #D1D5DB)' }}>
                🎬 Видео сонгох
                <input type="file" accept="video/mp4,video/webm,video/mov" hidden onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) { setVideoFile(f); setVideoName(f.name) }
                }} />
              </label>
              {videoName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text, #374151)' }}>
                  <span>🎬 {videoName}</span>
                  <button onClick={() => { setVideoFile(null); setVideoName('') }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 14 }}>✕</button>
                </div>
              )}
            </div>
          </div>

          {/* RSVP toggle */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text, #374151)' }}>
              <input type="checkbox" checked={form.rsvp_enabled} onChange={e => setForm({ ...form, rsvp_enabled: e.target.checked })} style={{ width: 18, height: 18, accentColor: ORANGE }} />
              Ирэх/Ирэхгүй хариу авах (RSVP)
            </label>
            {form.rsvp_enabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 13, color: '#6B7280' }}>Хамгийн их зочин:</label>
                <input type="number" min="0" value={form.max_guests} onChange={e => setForm({ ...form, max_guests: Number(e.target.value) })} style={{ width: 70, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border, #E5E7EB)', fontSize: 13, textAlign: 'center', background: 'var(--bg, #fff)', color: 'var(--text, #000)' }} />
              </div>
            )}
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            <button onClick={handleCreate} disabled={uploading} style={{ padding: '10px 28px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
              {uploading ? 'Хадгалж байна...' : 'Үүсгэх'}
            </button>
            <button onClick={() => setShowCreate(false)} style={{ padding: '10px 28px', background: 'var(--surface2, #F3F4F6)', color: 'var(--text, #374151)', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>Болих</button>
          </div>
        </div>
      )}

      {/* Invitation list */}
      {invitations.length === 0 ? (
        <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid var(--border, #E5E7EB)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#x1F48C;</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text, #374151)' }}>Урилга байхгүй</div>
          <p style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>Эхний дижитал урилгаа үүсгээрэй</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {invitations.map((inv: any) => {
            const st = STATUS_MAP[inv.status] || STATUS_MAP.draft
            return (
              <div key={inv.id} style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 20, border: '1px solid var(--border, #E5E7EB)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                onClick={() => window.location.href = `/dashboard/customer/invitations/${inv.id}`}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                {/* Cover image or placeholder */}
                <div style={{ height: 120, borderRadius: 12, background: inv.cover_image_url ? `url(${inv.cover_image_url}) center/cover` : `linear-gradient(135deg, ${inv.accent_color || ORANGE}, #F59E0B)`, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!inv.cover_image_url && <span style={{ fontSize: 32, filter: 'grayscale(0)' }}>{inv.type === 'wedding' ? '\u{1F492}' : inv.type === 'birthday' ? '\u{1F382}' : '\u{1F389}'}</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text, #111)' }}>{inv.title}</h3>
                  <span style={{ padding: '3px 10px', borderRadius: 12, background: st.bg, color: st.color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{st.text}</span>
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>{TYPE_LABELS[inv.type] || inv.type}</div>
                {inv.event_date && (
                  <div style={{ fontSize: 13, color: '#6B7280' }}>
                    {new Date(inv.event_date).toLocaleDateString('mn-MN')}
                    {inv.event_time && ` · ${inv.event_time}`}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 12, color: '#9CA3AF', flexWrap: 'wrap' }}>
                  <span>{inv.view_count || 0} үзсэн</span>
                  <span>{inv.rsvp_count || 0} хариулсан</span>
                  {inv.rsvp_enabled && <span style={{ color: '#10B981' }}>RSVP идэвхтэй</span>}
                </div>
                {/* Draft warning + publish button */}
                {inv.status === 'draft' && (
                  <div onClick={e => e.stopPropagation()} style={{ marginTop: 10, background: '#FEF3C7', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#92400E' }}>Ноорог — линк ажиллахгүй</span>
                    <button onClick={async () => {
                      try {
                        await apiFetch(`/invitations/${inv.id}/publish`, { method: 'POST' })
                        window.location.reload()
                      } catch (err: any) { alert(err.message || 'Огноо, гарчиг шаардлагатай') }
                    }} style={{ padding: '4px 14px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Нийтлэх
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false })}
        featureKey="invitations"
        current={upgradeModal.current}
        max={upgradeModal.max}
        suggestedPlan={suggestedPlan}
        addons={addons}
      />
    </div>
  )
}
