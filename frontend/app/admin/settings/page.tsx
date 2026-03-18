'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const F = "'Segoe UI',system-ui,sans-serif"

function authH() {
  const t = localStorage.getItem('access_token') || ''
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }
}

const TABS = [
  { id: 'general',  label: 'Ерөнхий',    icon: '⚙️' },
  { id: 'contact',  label: 'Холбоо барих', icon: '📞' },
  { id: 'social',   label: 'Сошиал',      icon: '📱' },
  { id: 'seo',      label: 'SEO',         icon: '🔍' },
  { id: 'design',   label: 'Дизайн',      icon: '🎨' },
]

const FIELDS: Record<string, { key: string; label: string; placeholder?: string; type?: string }[]> = {
  general: [
    { key: 'site_name',    label: 'Сайтын нэр',    placeholder: 'BizPrint' },
    { key: 'site_tagline', label: 'Уриа үг',        placeholder: 'Хэвлэлийн шилдэг шийдэл' },
    { key: 'logo_url',     label: 'Лого URL',       placeholder: 'https://...' },
    { key: 'favicon_url',  label: 'Favicon URL',    placeholder: 'https://...' },
    { key: 'footer_text',  label: 'Footer текст',   placeholder: '© 2025 BizPrint' },
  ],
  contact: [
    { key: 'phone',         label: 'Утас 1',        placeholder: '+976-XXXX-XXXX' },
    { key: 'phone2',        label: 'Утас 2',        placeholder: '+976-XXXX-XXXX' },
    { key: 'email',         label: 'Имэйл',         placeholder: 'info@bizprint.mn' },
    { key: 'address',       label: 'Хаяг',          placeholder: 'Улаанбаатар хот...' },
    { key: 'city',          label: 'Хот',           placeholder: 'Улаанбаатар' },
    { key: 'working_hours', label: 'Ажлын цаг',     placeholder: 'Да-Ба: 09:00-18:00' },
  ],
  social: [
    { key: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/bizprint' },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/bizprint' },
    { key: 'twitter',   label: 'Twitter/X', placeholder: 'https://twitter.com/bizprint' },
    { key: 'youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@bizprint' },
    { key: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@bizprint' },
    { key: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/company/bizprint' },
  ],
  seo: [
    { key: 'meta_title',       label: 'Meta Title',       placeholder: 'BizPrint - Хэвлэлийн платформ' },
    { key: 'meta_description', label: 'Meta Description', placeholder: 'Монголын хэвлэлийн...' },
    { key: 'google_analytics', label: 'Google Analytics ID', placeholder: 'G-XXXXXXXXXX' },
  ],
  design: [
    { key: 'primary_color',   label: 'Үндсэн өнгө',    placeholder: 'var(--orange)', type: 'color' },
    { key: 'secondary_color', label: 'Дэд өнгө',       placeholder: '#0F0F0F', type: 'color' },
    { key: 'accent_color',    label: 'Онцлох өнгө',    placeholder: '#FF8C42', type: 'color' },
  ],
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState('general')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await fetch(`${API}/settings`, { headers: authH() }).then(r => r.json()).catch(() => [])
    const map: Record<string, string> = {}
    if (Array.isArray(data)) data.forEach((s: any) => { map[s.key] = s.value })
    else if (data && typeof data === 'object') Object.assign(map, data)
    setSettings(map)
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await fetch(`${API}/settings/bulk`, {
      method: 'POST', headers: authH(), body: JSON.stringify(settings)
    })
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

  return (
    <div style={{ padding: '28px 32px', fontFamily: F, color: 'var(--text)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Сайтын тохиргоо</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', margin: '5px 0 0' }}>Вэбсайтын үндсэн тохиргоо</p>
        </div>
        <button onClick={save} disabled={saving}
          style={{ background: saved ? '#1D9E75' : 'var(--orange)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {saved ? '✓ Хадгалагдлаа' : saving ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', border: 'none', borderBottom: tab === t.id ? '2px solid var(--orange)' : '2px solid transparent', background: 'transparent', color: tab === t.id ? 'var(--orange)' : 'var(--text3)', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 600 : 400, marginBottom: -1 }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' as any, color: 'var(--text3)' }}>Уншиж байна...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {(FIELDS[tab] || []).map(f => (
            <div key={f.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 8, textTransform: 'uppercase' as any }}>
                {f.label}
              </label>
              {f.type === 'color' ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="color" value={settings[f.key] || 'var(--orange)'}
                    onChange={e => set(f.key, e.target.value)}
                    style={{ width: 48, height: 40, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }} />
                  <input value={settings[f.key] || ''} onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder} style={{ ...inp, flex: 1 }} />
                </div>
              ) : (
                <input value={settings[f.key] || ''} onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder} style={inp} />
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'general' && settings['logo_url'] && (
        <div style={{ marginTop: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Лого урьдчилан харах</div>
          <img src={settings['logo_url']} alt="Logo" style={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain' }} />
        </div>
      )}

      {tab === 'design' && (
        <div style={{ marginTop: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Өнгөний урьдчилан харах</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {['primary_color', 'secondary_color', 'accent_color'].map(k => (
              <div key={k} style={{ textAlign: 'center' as any }}>
                <div style={{ width: 60, height: 60, borderRadius: 12, background: settings[k] || 'var(--orange)', border: '1px solid var(--border)', marginBottom: 6 }} />
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{settings[k] || '-'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}