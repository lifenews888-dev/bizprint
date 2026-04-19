'use client'
import React, { useState, useEffect } from 'react'
import React, { apiFetch } from '@/lib/api'
import React, { QRCodeSVG } from 'qrcode.react'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"

export default function DigitalCardDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')
  useEffect(() => {
    apiFetch('/digital-card/my')
      .then((d: any) => setData(d))
      .catch((e: any) => setError(e?.message || 'API холбогдож чадсангүй'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: FONT, color: '#9CA3AF' }}>Ачааллаж байна...</div>
  if (error) return <div style={{ padding: 40, textAlign: 'center', fontFamily: FONT, color: '#EF4444' }}>{error}</div>

  const card = data?.card
  const sub = data?.subscription
  const settings = data?.settings
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'https://bizprint.mn')
  const cardUrl = card ? `${baseUrl}/u/${card.slug}` : null

  const statusLabel: Record<string, { text: string; color: string; bg: string }> = {
    trial:   { text: 'Туршилт (Үнэгүй)', color: '#F59E0B', bg: '#FEF3C7' },
    active:  { text: 'Идэвхтэй', color: '#10B981', bg: '#DCFCE7' },
    expired: { text: 'Хугацаа дууссан', color: '#EF4444', bg: '#FEE2E2' },
    none:    { text: 'QR идэвхгүй', color: '#6B7280', bg: '#F3F4F6' },
  }
  const st = statusLabel[sub?.status || 'none']

  return (
    <div style={{ padding: 24, fontFamily: FONT, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Дижитал карт</h1>
      <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px' }}>QR код уншуулж контакт мэдээлэл хуваалцах</p>

      {!card ? (
        /* No card yet */
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#x1F4C7;</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#374151' }}>Дижитал карт байхгүй</div>
          <p style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>Нэрийн хуудас захиалахад автоматаар үүснэ. Эсвэл шинээр үүсгэнэ үү.</p>
          <button onClick={async () => {
            await apiFetch('/digital-card', { method: 'POST', body: {} })
            window.location.reload()
          }} style={{ marginTop: 16, padding: '12px 32px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Дижитал карт үүсгэх
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Left: QR + Status */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {/* QR Code */}
            {cardUrl && (sub?.status === 'trial' || sub?.status === 'active') ? (
              <div style={{ padding: 12, background: '#fff', borderRadius: 12, border: '2px solid #E5E7EB' }}>
                <QRCodeSVG value={cardUrl} size={180} bgColor="#FFFFFF" fgColor="#000000" level="M" />
              </div>
            ) : (
              <div style={{ width: 180, height: 180, background: '#F3F4F6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#9CA3AF', textAlign: 'center', padding: 20 }}>
                QR код идэвхгүй
              </div>
            )}

            {/* Status badge */}
            <div style={{ padding: '6px 16px', borderRadius: 20, background: st.bg, color: st.color, fontSize: 13, fontWeight: 600 }}>
              {st.text}
            </div>

            {sub?.days_left != null && sub.status !== 'none' && (
              <div style={{ fontSize: 12, color: '#6B7280' }}>
                {sub.days_left > 0 ? `${sub.days_left} өдөр үлдсэн` : 'Хугацаа дууссан'}
                {sub.end_date && <span> — {new Date(sub.end_date).toLocaleDateString('mn-MN')}</span>}
              </div>
            )}

            {/* Card URL */}
            {cardUrl && (
              <div style={{ width: '100%', padding: '10px 12px', background: '#F9FAFB', borderRadius: 8, fontSize: 12, color: '#374151', wordBreak: 'break-all', textAlign: 'center' }}>
                {cardUrl}
              </div>
            )}

            {/* Renew/Subscribe button */}
            {(sub?.status === 'expired' || sub?.status === 'none') && (
              <button onClick={async () => {
                try {
                  await apiFetch('/digital-card/subscribe', { method: 'POST', body: {} })
                  window.location.reload()
                } catch (e: any) { alert(e.message) }
              }} style={{ width: '100%', padding: '14px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                QR сэргээх — ₮{(settings?.qr_price_yearly || 29900).toLocaleString('mn-MN')}/жил
              </button>
            )}

            {sub?.status === 'trial' && settings?.qr_price_yearly && (
              <button onClick={async () => {
                try {
                  await apiFetch('/digital-card/subscribe', { method: 'POST', body: {} })
                  window.location.reload()
                } catch (e: any) { alert(e.message) }
              }} style={{ width: '100%', padding: '12px', background: '#fff', color: '#FF6B00', border: '2px solid #FF6B00', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                1 жилээр сунгах — ₮{settings.qr_price_yearly.toLocaleString('mn-MN')}
              </button>
            )}
          </div>

          {/* Right: Editable profile + social links */}
          <ProfileEditor card={card} onSave={() => window.location.reload()} />
        </div>
      )}

      {/* Pricing cards — clickable */}
      <div style={{ marginTop: 24, background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E5E7EB' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 12 }}>QR дижитал карт — үнийн мэдээлэл</div>
        <div style={{ display: 'flex', gap: 16 }}>
          {/* Туршилт — нэрийн хуудас захиалах руу */}
          <div
            onClick={() => window.location.href = '/business-cards'}
            style={{ flex: 1, padding: 16, background: '#FFF7ED', borderRadius: 12, border: '2px solid #FF6B0030', cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#FF6B00'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(255,107,0,0.15)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#FF6B0030'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#FF6B00' }}>Туршилт</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#111', marginTop: 4 }}>Үнэгүй</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{settings?.qr_trial_days || 90} хоног</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>Нэрийн хуудас захиалахад автоматаар идэвхжинэ</div>
            <div style={{ marginTop: 12, padding: '8px 0', background: '#FF6B00', color: '#fff', borderRadius: 8, textAlign: 'center', fontSize: 13, fontWeight: 600 }}>
              Нэрийн хуудас захиалах →
            </div>
          </div>
          {/* Жилийн эрх — төлбөр төлөх */}
          <div
            onClick={async () => {
              try {
                const tok = localStorage.getItem('access_token') || localStorage.getItem('token')
                if (!tok) { window.location.href = '/login'; return }
                // Карт байхгүй бол эхлээд үүсгэх
                if (!card) {
                  await apiFetch('/digital-card', { method: 'POST', body: {} })
                }
                await apiFetch('/digital-card/subscribe', { method: 'POST', body: {} })
                window.location.reload()
              } catch (e: any) { alert(e.message || 'Алдаа гарлаа') }
            }}
            style={{ flex: 1, padding: 16, background: '#F0FDF4', borderRadius: 12, border: '2px solid #10B98130', cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#10B981'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(16,185,129,0.15)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#10B98130'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>Жилийн эрх</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#111', marginTop: 4 }}>₮{(settings?.qr_price_yearly || 29900).toLocaleString('mn-MN')}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>12 сар</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>QR код + дижитал профайл + статистик</div>
            <div style={{ marginTop: 12, padding: '8px 0', background: '#10B981', color: '#fff', borderRadius: 8, textAlign: 'center', fontSize: 13, fontWeight: 600 }}>
              Төлбөр төлөх →
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
//  PROFILE EDITOR COMPONENT
// ══════════════════════════════════════

const SOCIAL_OPTIONS = [
  { key: 'facebook', label: 'Facebook', icon: 'f', color: '#1877F2' },
  { key: 'instagram', label: 'Instagram', icon: 'ig', color: '#E4405F' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'in', color: '#0A66C2' },
  { key: 'tiktok', label: 'TikTok', icon: 'Tk', color: '#000000' },
  { key: 'twitter', label: 'X / Twitter', icon: 'X', color: '#1DA1F2' },
  { key: 'telegram', label: 'Telegram', icon: 'Tg', color: '#0088CC' },
  { key: 'youtube', label: 'YouTube', icon: 'Yt', color: '#FF0000' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'Wa', color: '#25D366' },
]

const inp: React.CSSProperties = { width: '100%', padding: '8px 0', border: 'none', borderBottom: '1px solid #E5E7EB', fontSize: 13, color: '#111', outline: 'none', background: 'transparent' }

function ProfileEditor({ card, onSave }: { card: any; onSave: () => void }) {
  const [form, setForm] = useState({
    display_name: card.display_name || '',
    job_title: card.job_title || '',
    company_name: card.company_name || '',
    phone: card.phone || '',
    email: card.email || '',
    website: card.website || '',
    address: card.address || '',
  })
  const [socials, setSocials] = useState<{ platform: string; value: string }[]>(card.social_links || [])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const addSocial = () => {
    const used = socials.map(s => s.platform)
    const next = SOCIAL_OPTIONS.find(o => !used.includes(o.key))
    if (next) setSocials([...socials, { platform: next.key, value: '' }])
  }

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      await apiFetch(`/digital-card/${card.id}`, { method: 'PATCH', body: { ...form, social_links: socials.filter(s => s.value) } })
      setMsg('Хадгалагдлаа!')
      setTimeout(() => setMsg(''), 2000)
      onSave()
    } catch (e: any) {
      setMsg(e.message || 'Алдаа гарлаа')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Профайл засах</div>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ fontSize: 11, color: '#6B7280' }}>{card.view_count} үзсэн</span>
          <span style={{ fontSize: 11, color: '#6B7280' }}>{card.save_count} хадгалсан</span>
        </div>
      </div>

      {/* Profile fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { key: 'display_name', label: 'Нэр', placeholder: 'Бат-Эрдэнэ' },
          { key: 'job_title', label: 'Албан тушаал', placeholder: 'Захирал' },
          { key: 'company_name', label: 'Компани', placeholder: 'BizPrint LLC' },
          { key: 'phone', label: 'Утас', placeholder: '+976 9911-2233' },
          { key: 'email', label: 'Имэйл', placeholder: 'info@bizprint.mn' },
          { key: 'website', label: 'Вэбсайт', placeholder: 'www.bizprint.mn' },
          { key: 'address', label: 'Хаяг', placeholder: 'Улаанбаатар' },
        ].map(f => (
          <div key={f.key}>
            <label style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2, display: 'block' }}>{f.label}</label>
            <input value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} style={inp} />
          </div>
        ))}
      </div>

      {/* Social links */}
      <div style={{ marginTop: 16, borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Сошиал хаягууд</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {socials.map((link, idx) => {
            const opt = SOCIAL_OPTIONS.find(o => o.key === link.platform) || SOCIAL_OPTIONS[0]
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: opt.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{opt.icon}</span>
                  <select value={link.platform} onChange={e => setSocials(socials.map((s, i) => i === idx ? { ...s, platform: e.target.value } : s))}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}>
                    {SOCIAL_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </select>
                </div>
                <input value={link.value} onChange={e => setSocials(socials.map((s, i) => i === idx ? { ...s, value: e.target.value } : s))}
                  placeholder={`${opt.label} хаяг`} style={{ ...inp, flex: 1 }} />
                <button onClick={() => setSocials(socials.filter((_, i) => i !== idx))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#EF4444', padding: '0 4px' }}>x</button>
              </div>
            )
          })}
          {socials.length < 8 && (
            <button onClick={addSocial} style={{ padding: '6px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#FF6B00', fontWeight: 500, textAlign: 'left' }}>
              + Сошиал нэмэх
            </button>
          )}
        </div>
      </div>

      {/* Save */}
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={save} disabled={saving} style={{ padding: '12px 32px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
        {msg && <span style={{ fontSize: 12, color: msg.includes('Алдаа') ? '#EF4444' : '#10B981' }}>{msg}</span>}
      </div>

      {/* Preview link */}
      <a href={`/u/${card.slug}`} target="_blank" rel="noopener" style={{ display: 'block', marginTop: 12, padding: '10px', background: '#F3F4F6', color: '#374151', borderRadius: 8, textDecoration: 'none', fontSize: 12, textAlign: 'center' }}>
        Дижитал карт урьдчилан харах →
      </a>
    </div>
  )
}
