'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const F = "'Segoe UI',system-ui,sans-serif"

function authH() {
  const t = localStorage.getItem('access_token') || localStorage.getItem('token') || ''
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }
}

const SOCIAL_FIELDS = [
  { key: 'social_facebook',  label: 'Facebook',  icon: '📘', placeholder: 'https://facebook.com/bizprint' },
  { key: 'social_instagram', label: 'Instagram', icon: '📷', placeholder: 'https://instagram.com/bizprint' },
  { key: 'social_twitter',   label: 'Twitter/X', icon: '🐦', placeholder: 'https://twitter.com/bizprint' },
  { key: 'social_youtube',   label: 'YouTube',   icon: '▶️', placeholder: 'https://youtube.com/@bizprint' },
  { key: 'social_tiktok',    label: 'TikTok',    icon: '🎵', placeholder: 'https://tiktok.com/@bizprint' },
  { key: 'social_facebook_page_id', label: 'Facebook Page ID', icon: '📘', placeholder: '123456789012345' },
  { key: 'social_whatsapp',  label: 'WhatsApp',  icon: '💬', placeholder: '97699XXXXXX' },
  { key: 'social_phone',     label: 'Утас',      icon: '📞', placeholder: '+97699XXXXXX' },
  { key: 'social_email',     label: 'Имэйл',     icon: '✉️', placeholder: 'info@bizprint.mn' },
]

const NOTIF_FIELDS = [
  { key: 'notif_admin_email',       label: 'Тайлан хүлээн авах admin имэйл', placeholder: 'admin@bizprint.mn' },
  { key: 'notif_daily_report_time', label: 'Өдрийн тайлан илгээх цаг',       placeholder: '18:00' },
  { key: 'notif_quote_valid_hours', label: 'Үнийн санал дуусах сануулга (цаг)', placeholder: '24' },
]

const MARKETING_FIELDS = [
  { key: 'mega_cta_title',   label: 'Mega Menu CTA гарчиг',   placeholder: 'AI-аар үнэ тооцоол' },
  { key: 'mega_cta_desc',    label: 'Mega Menu CTA тайлбар',  placeholder: 'PDF upload хийхэд автоматаар үнэ гарна' },
  { key: 'mega_cta_button',  label: 'Mega Menu CTA товч',     placeholder: 'Эхлэх →' },
  { key: 'mega_cta_url',     label: 'Mega Menu CTA URL',      placeholder: '/quote' },
  { key: 'marketing_banner_active', label: 'Announcement bar идэвхтэй', placeholder: 'true' },
  { key: 'marketing_banner_text',       label: 'Announcement bar текст',    placeholder: '🎉 Шинэ хэрэглэгчдэд 10% хямдрал!' },
  { key: 'marketing_social_proof_text', label: 'Social proof текст',         placeholder: 'Өнөөдөр 12 хэрэглэгч захиалга өглөө' },
  { key: 'marketing_referral_discount', label: 'Referral хямдрал (%)',       placeholder: '10' },
  { key: 'marketing_loyalty_rate',      label: 'Loyalty: 1000₮ = ? оноо',   placeholder: '1' },
  { key: 'marketing_loyalty_value',     label: 'Loyalty: 1 оноо = ? ₮',     placeholder: '10' },
  { key: 'marketing_facebook_pixel',    label: 'Facebook Pixel ID',          placeholder: '123456789' },
  { key: 'marketing_google_analytics',  label: 'Google Analytics ID',        placeholder: 'G-XXXXXXXXXX' },
]

export default function AdminMarketingPage() {
  const [settings, setSettings] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<'social'|'notif'|'marketing'>('social')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await fetch(`${API}/settings`, { headers: authH() }).then(r => r.json()).catch(() => [])
    const map: Record<string,string> = {}
    if (Array.isArray(data)) data.forEach((s: any) => { map[s.key] = s.value })
    setSettings(map)
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await fetch(`${API}/settings/bulk`, { method: 'POST', headers: authH(), body: JSON.stringify(settings) })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  const set = (k: string, v: string) => setSettings(p => ({ ...p, [k]: v }))

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', background: 'var(--surface2)',
    border: '1px solid var(--border)', borderRadius: 8, fontSize: 13,
    color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
  }

  const fields = tab === 'social' ? SOCIAL_FIELDS : tab === 'notif' ? NOTIF_FIELDS : MARKETING_FIELDS

  return (
    <div style={{ padding: '28px 32px', fontFamily: F, color: 'var(--text)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Маркетинг тохиргоо</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', margin: '5px 0 0' }}>Сошиал хуудас, мэдэгдэл, маркетинг хөшүүрэг</p>
        </div>
        <button onClick={save} disabled={saving}
          style={{ background: saved ? '#1D9E75' : 'var(--orange)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {saved ? '✓ Хадгалагдлаа' : saving ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { k: 'social', l: '📱 Сошиал' },
          { k: 'notif',  l: '🔔 Мэдэгдэл' },
          { k: 'marketing', l: '📣 Маркетинг' },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as any)}
            style={{ padding: '10px 20px', borderRadius: 10, border: tab === t.k ? '2px solid var(--orange)' : '1px solid var(--border)', background: tab === t.k ? 'var(--orange-06)' : 'var(--surface2)', color: tab === t.k ? 'var(--orange)' : 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.k ? 600 : 400 }}>
            {t.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' as any, color: 'var(--text3)' }}>Уншиж байна...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fields.map((f: any) => (
            <div key={f.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>{f.icon || '⚙️'}</span>
                <label style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</label>
              </div>
              {f.key === 'marketing_banner_active' ? (
                <button onClick={() => set(f.key, settings[f.key] === 'true' ? 'false' : 'true')}
                  style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: settings[f.key] === 'true' ? 'var(--orange)' : 'var(--border)', cursor: 'pointer', position: 'relative' as any }}>
                  <span style={{ position: 'absolute' as any, top: 3, left: settings[f.key] === 'true' ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </button>
              ) : (
                <input value={settings[f.key] || ''} onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder} style={inp} />
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'marketing' && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Announcement bar урьдчилан харах:</div>
          <div style={{ background: 'var(--orange)', color: '#fff', textAlign: 'center' as any, padding: 10, borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
            {settings['marketing_banner_text'] || 'Энд текст харагдана...'}
          </div>
        </div>
      )}

      {tab === 'social' && (
        <div style={{ marginTop: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Урьдчилан харах:</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as any }}>
            {SOCIAL_FIELDS.filter(f => settings[f.key]).map(f => (
              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}>
                <span>{f.icon}</span><span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}