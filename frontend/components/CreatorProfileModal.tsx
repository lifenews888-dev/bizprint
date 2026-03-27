'use client'
import { useState, useEffect, useRef } from 'react'
import { apiFetch, apiUpload } from '@/lib/api'

/* ═══════════════════════════════════════
 *  Creator Profile Modal
 *  3 tabs: Account | Creator Profile | Payout
 * ═══════════════════════════════════════ */

const SKILL_OPTIONS = [
  { key: 'graphic_design', label: 'График дизайн', icon: '🎨' },
  { key: 'illustration', label: 'Зураг зурах', icon: '✏️' },
  { key: 'photo', label: 'Гэрэл зураг', icon: '📷' },
  { key: 'video', label: 'Видео', icon: '🎬' },
  { key: 'motion', label: 'Motion', icon: '🎞️' },
  { key: 'branding', label: 'Брэндинг', icon: '💎' },
  { key: 'social_media', label: 'Соц.Медиа', icon: '📱' },
  { key: 'print_design', label: 'Хэвлэл', icon: '🖨️' },
  { key: 'face_on_camera', label: 'Камер', icon: '🤳' },
  { key: 'product_review', label: 'Review', icon: '📦' },
  { key: 'voice_over', label: 'Дуу', icon: '🎙️' },
  { key: 'tiktok_trends', label: 'TikTok', icon: '🔥' },
]

const CAP_OPTIONS = [
  { key: 'social', label: 'Сошиал контент', icon: '📱', color: '#FF6B00' },
  { key: 'prepress', label: 'Хэвлэл дизайн', icon: '🖨️', color: '#8B5CF6' },
  { key: 'live', label: 'Live борлуулалт', icon: '📡', color: '#EC4899' },
  { key: 'ai', label: 'AI контент', icon: '🤖', color: '#06B6D4' },
  { key: 'ugc', label: 'UGC контент', icon: '🎬', color: '#F59E0B' },
]

type Tab = 'account' | 'creator' | 'payout'

export default function CreatorProfileModal({
  open, onClose, user, onSave, onUserUpdate,
}: {
  open: boolean
  onClose: () => void
  user: any
  onSave: (data: any) => void
  /** Update user without closing modal (for avatar upload) */
  onUserUpdate?: (data: any) => void
}) {
  const [tab, setTab] = useState<Tab>('account')
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', company: '', address: '' })
  const [creatorForm, setCreatorForm] = useState({
    display_name: '', bio: '', skills: [] as string[], capabilities: [] as string[],
    delivery_days: 3, response_time: '2 цаг',
  })
  const [saving, setSaving] = useState(false)
  const [scoreData, setScoreData] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)

  const uploadAvatar = async (file: File) => {
    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiUpload<any>('/upload/file', fd)
      if (res?.file_url) {
        const fullUrl = res.file_url.startsWith('http') ? res.file_url : `http://localhost:4000${res.file_url}`
        setAvatarUrl(fullUrl)
        // Save to user
        await apiFetch('/users/profile', { method: 'PATCH', body: JSON.stringify({ avatar_url: fullUrl }) }).catch(() => {})
        const updated = { ...user, avatar_url: fullUrl }
        localStorage.setItem('user', JSON.stringify(updated))
        if (onUserUpdate) onUserUpdate(updated)
        else onSave(updated)
      }
    } catch (e: any) { alert(e.message || 'Зураг байршуулах алдаа') }
    setAvatarUploading(false)
  }

  useEffect(() => {
    if (!user) return
    if (user.is_creator) {
      apiFetch<any>('/creator/score').then(d => { if (d?.score !== undefined) setScoreData(d) }).catch(() => {})
    }
    setAvatarUrl(user.avatar_url || null)
    setForm({
      full_name: user.full_name || '', email: user.email || '',
      phone: user.phone || '', company: user.company || '', address: user.address || '',
    })
    setCreatorForm({
      display_name: user.creator_display_name || user.full_name || '',
      bio: user.creator_bio || '',
      skills: user.creator_skills || [],
      capabilities: user.creator_capabilities || [],
      delivery_days: user.creator_delivery_days || 3,
      response_time: user.creator_response_time || '2 цаг',
    })
  }, [user, open])

  if (!open) return null

  const toggleSkill = (key: string) => {
    setCreatorForm(f => ({
      ...f,
      skills: f.skills.includes(key) ? f.skills.filter(s => s !== key) : [...f.skills, key],
    }))
  }

  const toggleCap = (key: string) => {
    setCreatorForm(f => ({
      ...f,
      capabilities: f.capabilities.includes(key) ? f.capabilities.filter(c => c !== key) : [...f.capabilities, key],
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      if (tab === 'account') {
        await apiFetch('/users/profile', { method: 'PATCH', body: JSON.stringify(form) }).catch(() => {})
        const updated = { ...user, ...form }
        localStorage.setItem('user', JSON.stringify(updated))
        onSave(updated)
      } else if (tab === 'creator') {
        await apiFetch('/creator/profile', { method: 'PATCH', body: JSON.stringify(creatorForm) }).catch(() => {})
        const updated = {
          ...user,
          creator_display_name: creatorForm.display_name,
          creator_bio: creatorForm.bio,
          creator_skills: creatorForm.skills,
          creator_capabilities: creatorForm.capabilities,
          creator_delivery_days: creatorForm.delivery_days,
          creator_response_time: creatorForm.response_time,
        }
        localStorage.setItem('user', JSON.stringify(updated))
        onSave(updated)
      }
    } catch {}
    setSaving(false)
  }

  const F = "'DM Sans',sans-serif"
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E7E5E4', fontSize: 14, outline: 'none', background: '#FAFAF8', boxSizing: 'border-box' as const, fontFamily: F }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.15)', padding: '28px 32px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: F }}>Профайл засварлах</div>
          <button onClick={onClose} style={{ background: 'var(--surface2)', border: 'none', color: 'var(--text2)', width: 32, height: 32, borderRadius: 10, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Avatar with upload */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]) }} />
          <div onClick={() => avatarRef.current?.click()} style={{
            width: 72, height: 72, borderRadius: '50%', cursor: 'pointer', position: 'relative',
            background: avatarUrl ? `url(${avatarUrl}) center/cover` : (tab === 'creator' ? 'linear-gradient(135deg,#8B5CF6,#EC4899)' : 'linear-gradient(135deg,#FF6B00,#FF8C40)'),
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700,
          }}>
            {!avatarUrl && (form.full_name || 'U').charAt(0).toUpperCase()}
            {/* Hover overlay */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: avatarUploading ? 1 : 0, transition: 'opacity .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
              onMouseLeave={e => { if (!avatarUploading) e.currentTarget.style.opacity = '0' }}>
              <span style={{ fontSize: 14, color: '#fff' }}>{avatarUploading ? '⏳' : '📷'}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#F3F4F6', borderRadius: 10, padding: 3 }}>
          {([
            { key: 'account' as Tab, label: '👤 Хаяг' },
            ...(user?.is_creator ? [
              { key: 'creator' as Tab, label: '🎨 Creator' },
              { key: 'payout' as Tab, label: '💰 Орлого' },
            ] : []),
          ]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: F, transition: 'all .15s',
              background: tab === t.key ? '#fff' : 'transparent',
              color: tab === t.key ? '#111' : '#888',
              boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Account tab */}
        {tab === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: F }}>
            {[
              { key: 'full_name', label: 'Нэр', placeholder: 'Таны бүтэн нэр', type: 'text' },
              { key: 'email', label: 'И-мэйл', placeholder: 'example@mail.com', type: 'email' },
              { key: 'phone', label: 'Утасны дугаар', placeholder: '+976 ...', type: 'tel' },
              { key: 'company', label: 'Байгууллага', placeholder: 'Заавал биш', type: 'text' },
              { key: 'address', label: 'Хаяг', placeholder: 'Хүргэлтийн хаяг', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input type={f.type} value={(form as any)[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
          </div>
        )}

        {/* Creator tab */}
        {tab === 'creator' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: F }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Нийтэд харагдах нэр</label>
              <input value={creatorForm.display_name} onChange={e => setCreatorForm(f => ({ ...f, display_name: e.target.value }))}
                placeholder="Public display name" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Танилцуулга</label>
              <textarea value={creatorForm.bio} onChange={e => setCreatorForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Өөрийгөө товч танилцуулна уу..." rows={3}
                style={{ ...inputStyle, resize: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Creator төрөл</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CAP_OPTIONS.map(c => {
                  const active = creatorForm.capabilities.includes(c.key)
                  return (
                    <button key={c.key} onClick={() => toggleCap(c.key)} style={{
                      padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${active ? c.color : '#E5E7EB'}`,
                      background: active ? c.color + '12' : '#fff', color: active ? c.color : '#888',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                    }}>{c.icon} {c.label}</button>
                  )
                })}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Ур чадвар</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {SKILL_OPTIONS.map(s => {
                  const active = creatorForm.skills.includes(s.key)
                  return (
                    <button key={s.key} onClick={() => toggleSkill(s.key)} style={{
                      padding: '4px 10px', borderRadius: 6, border: `1px solid ${active ? '#FF6B00' : '#E5E7EB'}`,
                      background: active ? '#FF6B00' : '#fff', color: active ? '#fff' : '#888',
                      fontSize: 10, fontWeight: 500, cursor: 'pointer', fontFamily: F,
                    }}>{s.icon} {s.label}</button>
                  )
                })}
              </div>
            </div>
            {/* Score-based level (readonly) */}
            {(() => {
              const level = scoreData?.level || user?.creator_level || 'starter'
              const score = scoreData?.score || 0
              const LEVEL_INFO: Record<string, { label: string; color: string; multiplier: string; bg: string }> = {
                starter: { label: 'Starter', color: '#6B7280', multiplier: '1.0x', bg: '#F3F4F6' },
                pro:     { label: 'Pro',     color: '#3B82F6', multiplier: '1.3x', bg: '#EFF6FF' },
                expert:  { label: 'Expert',  color: '#8B5CF6', multiplier: '1.6x', bg: '#F5F3FF' },
                elite:   { label: 'Elite',   color: '#FF6B00', multiplier: '2.0x', bg: '#FFF7ED' },
              }
              const info = LEVEL_INFO[level] || LEVEL_INFO.starter
              const bd = scoreData?.breakdown || { rating: 0, performance: 0, activity: 0 }
              return (
                <div style={{ background: info.bg, border: `1.5px solid ${info.color}30`, borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#888' }}>Таны түвшин</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: info.color }}>{info.label}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: '#888' }}>Оноо</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: info.color }}>{score}<span style={{ fontSize: 11, fontWeight: 400, color: '#888' }}>/100</span></div>
                    </div>
                  </div>
                  {/* Score bar */}
                  <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ height: '100%', width: `${score}%`, background: info.color, borderRadius: 3, transition: 'width .5s' }} />
                  </div>
                  {/* Breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
                    {[
                      { label: '⭐ Үнэлгээ', value: bd.rating, weight: '40%' },
                      { label: '⚡ Гүйцэтгэл', value: bd.performance, weight: '25%' },
                      { label: '📊 Идэвх', value: bd.activity, weight: '20%' },
                    ].map(m => (
                      <div key={m.label} style={{ textAlign: 'center', padding: '6px 0', background: '#fff', borderRadius: 8 }}>
                        <div style={{ fontSize: 9, color: '#888' }}>{m.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{m.value}</div>
                        <div style={{ fontSize: 8, color: '#BBB' }}>{m.weight}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 9, color: '#888', lineHeight: 1.5 }}>
                    Түвшин автоматаар тооцоологдоно. Үнэ = Админ багцын үнэ × {info.multiplier}
                  </div>
                </div>
              )
            })()}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Хүргэх хоног</label>
                <input type="number" value={creatorForm.delivery_days} onChange={e => setCreatorForm(f => ({ ...f, delivery_days: Number(e.target.value) }))}
                  style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Хариу цаг</label>
                <input value={creatorForm.response_time} onChange={e => setCreatorForm(f => ({ ...f, response_time: e.target.value }))}
                  placeholder="жишээ: 2 цаг" style={inputStyle} />
              </div>
            </div>
          </div>
        )}

        {/* Payout tab */}
        {tab === 'payout' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: F }}>
            <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Комисс</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#FF6B00' }}>20%</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Платформ суутгал · Таны орлогын 80% танд очно</div>
            </div>
            <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Татвар суутгал</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#EF4444' }}>10%</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>ААНОАТ · Комиссын дараах дүнгээс суутгана</div>
            </div>
            <div style={{ background: '#F0FDF4', borderRadius: 12, padding: 16, border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: 11, color: '#10B981', marginBottom: 4 }}>Жишээ тооцоо</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>Захиалгын дүн</span><span style={{ fontWeight: 600 }}>₮100,000</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#FF6B00' }}>Комисс (20%)</span><span style={{ color: '#FF6B00' }}>- ₮20,000</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#EF4444' }}>Татвар (10%)</span><span style={{ color: '#EF4444' }}>- ₮8,000</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #BBF7D0' }}><span style={{ fontWeight: 700, color: '#10B981' }}>Танд очих</span><span style={{ fontWeight: 700, fontSize: 16, color: '#10B981' }}>₮72,000</span></div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>
              Орлого хэтэвч рүү автоматаар шилжинэ. Хэтэвчээс банкны данс руу шилжүүлж болно.
              <a href="/creator/earnings" style={{ color: '#FF6B00', marginLeft: 4 }}>Орлого харах →</a>
            </div>
          </div>
        )}

        {/* Save */}
        <button onClick={save} disabled={saving} style={{
          width: '100%', background: tab === 'creator' ? '#8B5CF6' : '#1C1917', color: '#fff',
          border: 'none', padding: '12px 0', borderRadius: 99, fontSize: 14, fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer', marginTop: 20, fontFamily: F,
          opacity: saving ? 0.6 : 1,
        }}>
          {saving ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
      </div>
    </div>
  )
}
