'use client'
import { useState, useEffect, useCallback } from 'react'

const API = 'http://localhost:4000'
const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

type Setting = { id: string; key: string; value: string; group: string; label: string }
type MegaMenuItem = {
  id: string; nav_label: string; nav_url: string; nav_type: string;
  is_active: boolean; sort_order: number; columns?: string; featured?: string
}
type FooterColumn = { title: string; links: { label: string; url: string }[] }
type FeatureItem = { icon: string; title: string; desc: string }
type StatItem = { value: string; label: string }

const TABS = ['Ерөнхий', 'Header', 'Mega Menu', 'Footer', 'Нүүр хуудас', 'SEO'] as const

const font = "'DM Sans','Segoe UI',system-ui,sans-serif"

const labelStyle: React.CSSProperties = {
  fontSize: 13, color: 'var(--text2)', marginBottom: 4, display: 'block', fontWeight: 500,
}
const inputStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid var(--border2)', background: 'var(--surface2)',
  color: 'var(--text)', borderRadius: 8, width: '100%', fontSize: 13, outline: 'none',
  fontFamily: font,
}
const textareaStyle: React.CSSProperties = {
  ...inputStyle, minHeight: 80, resize: 'vertical',
}
const cardStyle: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24,
}
const primaryBtn: React.CSSProperties = {
  background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8,
  padding: '8px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: font,
}
const secondaryBtn: React.CSSProperties = {
  background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontFamily: font,
}
const dangerBtn: React.CSSProperties = {
  background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6,
  padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontFamily: font,
}
const sectionTitle: React.CSSProperties = {
  fontSize: 15, fontWeight: 600, margin: '0 0 16px', color: 'var(--text)',
}
const fieldWrap: React.CSSProperties = { marginBottom: 14 }

function Field({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div style={fieldWrap}>
      <label style={labelStyle}>{label}</label>
      {type === 'textarea' ? (
        <textarea style={textareaStyle} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      ) : type === 'color' ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="color" value={value || '#FF6B00'} onChange={e => onChange(e.target.value)}
            style={{ width: 40, height: 34, border: 'none', cursor: 'pointer', background: 'none' }} />
          <input style={{ ...inputStyle, flex: 1 }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        </div>
      ) : (
        <input type={type} style={inputStyle} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div onClick={() => onChange(!value)} style={{
        width: 42, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
        background: value ? '#FF6B00' : 'var(--surface3)',
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
          left: value ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, background: '#22c55e', color: '#fff',
      padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: font,
      zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    }}>
      {message}
    </div>
  )
}

export default function AdminCmsPage() {
  const [tab, setTab] = useState(0)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [allSettings, setAllSettings] = useState<Setting[]>([])
  const [menuItems, setMenuItems] = useState<MegaMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState<Record<string, string>>({})
  const [menuForm, setMenuForm] = useState<Partial<MegaMenuItem> | null>(null)
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API}/cms/settings`, { headers: getHeaders() })
      const data: Setting[] = await res.json()
      setAllSettings(Array.isArray(data) ? data : [])
      const map = (Array.isArray(data) ? data : []).reduce<Record<string, string>>((acc, s) => {
        acc[s.key] = s.value ?? ''
        return acc
      }, {})
      setSettings(map)
      setForm(map)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  const loadMenu = useCallback(async () => {
    try {
      const res = await fetch(`${API}/cms/mega-menu`, { headers: getHeaders() })
      const data = await res.json()
      setMenuItems(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadSettings(); loadMenu() }, [loadSettings, loadMenu])

  const f = (key: string) => form[key] ?? ''
  const sf = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }))
  const fb = (key: string) => form[key] === 'true' || form[key] === '1'
  const sfb = (key: string, val: boolean) => sf(key, val ? 'true' : 'false')

  const saveBulk = async (keys: string[]) => {
    const items = keys.map(key => ({ key, value: form[key] ?? '' }))
    try {
      await fetch(`${API}/cms/settings/bulk`, {
        method: 'POST', headers: getHeaders(), body: JSON.stringify({ items }),
      })
      setToast('Амжилттай хадгалагдлаа!')
      loadSettings()
    } catch {
      setToast('Алдаа гарлаа')
    }
  }

  // Mega menu helpers
  const saveMenuItem = async () => {
    if (!menuForm) return
    const url = editingMenuId ? `${API}/cms/mega-menu/${editingMenuId}` : `${API}/cms/mega-menu`
    const method = editingMenuId ? 'PUT' : 'POST'
    try {
      await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(menuForm) })
      setMenuForm(null)
      setEditingMenuId(null)
      setToast('Амжилттай хадгалагдлаа!')
      loadMenu()
    } catch {
      setToast('Алдаа гарлаа')
    }
  }

  const deleteMenuItem = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    await fetch(`${API}/cms/mega-menu/${id}`, { method: 'DELETE', headers: getHeaders() })
    loadMenu()
  }

  const updateSortOrder = async (id: string, sort_order: number) => {
    await fetch(`${API}/cms/mega-menu/${id}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify({ sort_order }),
    })
    loadMenu()
  }

  // Footer columns helper
  const getFooterColumns = (): FooterColumn[] => {
    try { return JSON.parse(form.footer_columns || '[]') } catch { return [] }
  }
  const setFooterColumns = (cols: FooterColumn[]) => sf('footer_columns', JSON.stringify(cols))

  // Homepage helpers
  const getFeatures = (): FeatureItem[] => {
    try { return JSON.parse(form.home_features_items || '[]') } catch { return [] }
  }
  const setFeatures = (items: FeatureItem[]) => sf('home_features_items', JSON.stringify(items))
  const getStats = (): StatItem[] => {
    try { return JSON.parse(form.home_stats_items || '[]') } catch { return [] }
  }
  const setStats = (items: StatItem[]) => sf('home_stats_items', JSON.stringify(items))

  const SaveButton = ({ onClick }: { onClick: () => void }) => (
    <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
      <button onClick={onClick} style={primaryBtn}>Хадгалах</button>
    </div>
  )

  // ===================== TAB 1: General =====================
  const renderGeneral = () => {
    const keys = [
      'site_name', 'site_phone', 'site_email', 'site_address',
      'site_logo', 'site_favicon',
      'social_facebook', 'social_instagram', 'social_youtube',
      'site_primary_color', 'site_maintenance',
    ]
    return (
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Сайтын мэдээлэл</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          <Field label="Сайтын нэр" value={f('site_name')} onChange={v => sf('site_name', v)} placeholder="BizPrint" />
          <Field label="Утасны дугаар" value={f('site_phone')} onChange={v => sf('site_phone', v)} placeholder="+976 ..." />
          <Field label="И-мэйл" value={f('site_email')} onChange={v => sf('site_email', v)} placeholder="info@bizprint.mn" />
          <Field label="Хаяг" value={f('site_address')} onChange={v => sf('site_address', v)} placeholder="Улаанбаатар" />
          <Field label="Лого URL" value={f('site_logo')} onChange={v => sf('site_logo', v)} placeholder="https://..." />
          <Field label="Favicon URL" value={f('site_favicon')} onChange={v => sf('site_favicon', v)} placeholder="https://..." />
        </div>

        <h3 style={{ ...sectionTitle, marginTop: 24 }}>Сошиал хаягууд</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          <Field label="Facebook URL" value={f('social_facebook')} onChange={v => sf('social_facebook', v)} />
          <Field label="Instagram URL" value={f('social_instagram')} onChange={v => sf('social_instagram', v)} />
          <Field label="YouTube URL" value={f('social_youtube')} onChange={v => sf('social_youtube', v)} />
        </div>

        <h3 style={{ ...sectionTitle, marginTop: 24 }}>Дизайн & Горим</h3>
        <Field label="Үндсэн өнгө" value={f('site_primary_color')} onChange={v => sf('site_primary_color', v)} type="color" placeholder="#FF6B00" />
        <Toggle label="Засвар горим (Maintenance mode)" value={fb('site_maintenance')} onChange={v => sfb('site_maintenance', v)} />

        <SaveButton onClick={() => saveBulk(keys)} />
      </div>
    )
  }

  // ===================== TAB 2: Header =====================
  const renderHeader = () => {
    const keys = [
      'header_logo', 'header_announcement_enabled', 'header_announcement_text',
      'header_announcement_color', 'header_cta_text', 'header_cta_url',
      'header_show_search', 'header_show_login',
    ]
    return (
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Лого</h3>
        <Field label="Header лого URL" value={f('header_logo')} onChange={v => sf('header_logo', v)} placeholder="https://..." />

        <h3 style={{ ...sectionTitle, marginTop: 24 }}>Зарлал (Announcement)</h3>
        <Toggle label="Зарлал харуулах" value={fb('header_announcement_enabled')} onChange={v => sfb('header_announcement_enabled', v)} />
        <Field label="Зарлалын текст" value={f('header_announcement_text')} onChange={v => sf('header_announcement_text', v)} placeholder="Урамшуулал..." />
        <Field label="Зарлалын өнгө" value={f('header_announcement_color')} onChange={v => sf('header_announcement_color', v)} type="color" placeholder="#FF6B00" />

        <h3 style={{ ...sectionTitle, marginTop: 24 }}>CTA товч</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          <Field label="CTA текст" value={f('header_cta_text')} onChange={v => sf('header_cta_text', v)} placeholder="Захиалга өгөх" />
          <Field label="CTA URL" value={f('header_cta_url')} onChange={v => sf('header_cta_url', v)} placeholder="/quote" />
        </div>

        <h3 style={{ ...sectionTitle, marginTop: 24 }}>Тохиргоо</h3>
        <Toggle label="Хайлт харуулах" value={fb('header_show_search')} onChange={v => sfb('header_show_search', v)} />
        <Toggle label="Нэвтрэх товч харуулах" value={fb('header_show_login')} onChange={v => sfb('header_show_login', v)} />

        <SaveButton onClick={() => saveBulk(keys)} />
      </div>
    )
  }

  // ===================== TAB 3: Mega Menu =====================
  const renderMegaMenu = () => {
    const mf = menuForm || {}
    const navType = mf.nav_type || 'LINK'
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ ...sectionTitle, margin: 0 }}>Цэсний жагсаалт</h3>
          <button style={primaryBtn} onClick={() => {
            setMenuForm({ nav_label: '', nav_url: '', nav_type: 'LINK', is_active: true, sort_order: menuItems.length })
            setEditingMenuId(null)
          }}>+ Нэмэх</button>
        </div>

        {menuForm && (
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px' }}>
              {editingMenuId ? 'Цэс засах' : 'Шинэ цэс нэмэх'}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
              <Field label="Нэр (label)" value={mf.nav_label || ''} onChange={v => setMenuForm({ ...mf, nav_label: v })} placeholder="Бүтээгдэхүүн" />
              <Field label="URL" value={mf.nav_url || ''} onChange={v => setMenuForm({ ...mf, nav_url: v })} placeholder="/products" />
              <div style={fieldWrap}>
                <label style={labelStyle}>Төрөл</label>
                <select style={inputStyle} value={navType} onChange={e => setMenuForm({ ...mf, nav_type: e.target.value })}>
                  <option value="LINK">LINK</option>
                  <option value="MEGA">MEGA</option>
                  <option value="DROPDOWN">DROPDOWN</option>
                </select>
              </div>
            </div>
            {(navType === 'MEGA' || navType === 'DROPDOWN') && (
              <>
                <Field label="Columns JSON" value={mf.columns || '[]'} onChange={v => setMenuForm({ ...mf, columns: v })} type="textarea" placeholder='[{"title":"...", "items":[...]}]' />
              </>
            )}
            {navType === 'MEGA' && (
              <Field label="Featured JSON" value={mf.featured || '[]'} onChange={v => setMenuForm({ ...mf, featured: v })} type="textarea" placeholder='[{"title":"...", "image":"..."}]' />
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button style={primaryBtn} onClick={saveMenuItem}>Хадгалах</button>
              <button style={secondaryBtn} onClick={() => { setMenuForm(null); setEditingMenuId(null) }}>Болих</button>
            </div>
          </div>
        )}

        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Дараалал', 'Нэр', 'URL', 'Төрөл', 'Идэвхтэй', 'Үйлдэл'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {menuItems.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Цэс байхгүй</td></tr>
              ) : menuItems.sort((a, b) => a.sort_order - b.sort_order).map(item => (
                <tr key={item.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 14px' }}>
                    <input type="number" value={item.sort_order} style={{ ...inputStyle, width: 60 }}
                      onChange={e => updateSortOrder(item.id, Number(e.target.value))} />
                  </td>
                  <td style={{ padding: '8px 14px', fontWeight: 500 }}>{item.nav_label}</td>
                  <td style={{ padding: '8px 14px', color: 'var(--text2)' }}>{item.nav_url}</td>
                  <td style={{ padding: '8px 14px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      background: item.nav_type === 'MEGA' ? 'rgba(255,107,0,0.1)' : item.nav_type === 'DROPDOWN' ? 'rgba(59,130,246,0.1)' : 'var(--surface3)',
                      color: item.nav_type === 'MEGA' ? '#FF6B00' : item.nav_type === 'DROPDOWN' ? '#3B82F6' : 'var(--text2)',
                    }}>{item.nav_type}</span>
                  </td>
                  <td style={{ padding: '8px 14px' }}>
                    <Toggle label="" value={item.is_active} onChange={async (v) => {
                      await fetch(`${API}/cms/mega-menu/${item.id}`, {
                        method: 'PUT', headers: getHeaders(), body: JSON.stringify({ is_active: v }),
                      })
                      loadMenu()
                    }} />
                  </td>
                  <td style={{ padding: '8px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ ...secondaryBtn, padding: '5px 12px', fontSize: 12 }} onClick={() => {
                        setMenuForm({ ...item })
                        setEditingMenuId(item.id)
                      }}>Засах</button>
                      <button style={dangerBtn} onClick={() => deleteMenuItem(item.id)}>Устгах</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ===================== TAB 4: Footer =====================
  const renderFooter = () => {
    const keys = [
      'footer_logo', 'footer_description', 'footer_copyright', 'footer_location',
      'footer_show_social', 'footer_show_location', 'footer_columns',
    ]
    const columns = getFooterColumns()

    const updateColumn = (idx: number, col: FooterColumn) => {
      const next = [...columns]
      next[idx] = col
      setFooterColumns(next)
    }
    const addColumn = () => setFooterColumns([...columns, { title: '', links: [] }])
    const removeColumn = (idx: number) => setFooterColumns(columns.filter((_, i) => i !== idx))
    const addLink = (colIdx: number) => {
      const next = [...columns]
      next[colIdx].links.push({ label: '', url: '' })
      setFooterColumns(next)
    }
    const removeLink = (colIdx: number, linkIdx: number) => {
      const next = [...columns]
      next[colIdx].links = next[colIdx].links.filter((_, i) => i !== linkIdx)
      setFooterColumns(next)
    }
    const updateLink = (colIdx: number, linkIdx: number, field: 'label' | 'url', val: string) => {
      const next = [...columns]
      next[colIdx].links[linkIdx][field] = val
      setFooterColumns(next)
    }

    return (
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Footer мэдээлэл</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          <Field label="Footer лого URL" value={f('footer_logo')} onChange={v => sf('footer_logo', v)} />
          <Field label="Copyright" value={f('footer_copyright')} onChange={v => sf('footer_copyright', v)} placeholder="© 2026 BizPrint" />
        </div>
        <Field label="Тайлбар" value={f('footer_description')} onChange={v => sf('footer_description', v)} type="textarea" />
        <Field label="Байршил" value={f('footer_location')} onChange={v => sf('footer_location', v)} placeholder="Улаанбаатар, Монгол" />
        <Toggle label="Сошиал линкүүд харуулах" value={fb('footer_show_social')} onChange={v => sfb('footer_show_social', v)} />
        <Toggle label="Байршил харуулах" value={fb('footer_show_location')} onChange={v => sfb('footer_show_location', v)} />

        <h3 style={{ ...sectionTitle, marginTop: 24 }}>Footer баганууд</h3>
        {columns.map((col, ci) => (
          <div key={ci} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Багана {ci + 1}</span>
              <button style={dangerBtn} onClick={() => removeColumn(ci)}>Устгах</button>
            </div>
            <Field label="Гарчиг" value={col.title} onChange={v => updateColumn(ci, { ...col, title: v })} />
            {col.links.map((link, li) => (
              <div key={li} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...labelStyle, fontSize: 11 }}>Нэр</label>
                  <input style={inputStyle} value={link.label} onChange={e => updateLink(ci, li, 'label', e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ ...labelStyle, fontSize: 11 }}>URL</label>
                  <input style={inputStyle} value={link.url} onChange={e => updateLink(ci, li, 'url', e.target.value)} />
                </div>
                <button style={{ ...dangerBtn, marginBottom: 0 }} onClick={() => removeLink(ci, li)}>✕</button>
              </div>
            ))}
            <button style={{ ...secondaryBtn, fontSize: 12, marginTop: 4 }} onClick={() => addLink(ci)}>+ Линк нэмэх</button>
          </div>
        ))}
        <button style={{ ...secondaryBtn, marginTop: 4 }} onClick={addColumn}>+ Багана нэмэх</button>

        <SaveButton onClick={() => saveBulk(keys)} />
      </div>
    )
  }

  // ===================== TAB 5: Homepage =====================
  const renderHomepage = () => {
    const keys = [
      'home_hero_title', 'home_hero_subtitle',
      'home_hero_cta1_text', 'home_hero_cta1_url', 'home_hero_cta2_text', 'home_hero_cta2_url',
      'home_hero_bg_type', 'home_hero_bg_value',
      'home_features_enabled', 'home_features_title', 'home_features_items',
      'home_stats_enabled', 'home_stats_items',
      'home_cta_enabled', 'home_cta_title', 'home_cta_subtitle', 'home_cta_btn_text', 'home_cta_btn_url',
    ]
    const features = getFeatures()
    const stats = getStats()

    return (
      <div style={cardStyle}>
        {/* Hero */}
        <h3 style={sectionTitle}>Hero хэсэг</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          <Field label="Гарчиг" value={f('home_hero_title')} onChange={v => sf('home_hero_title', v)} />
          <Field label="Дэд гарчиг" value={f('home_hero_subtitle')} onChange={v => sf('home_hero_subtitle', v)} />
          <Field label="CTA1 текст" value={f('home_hero_cta1_text')} onChange={v => sf('home_hero_cta1_text', v)} />
          <Field label="CTA1 URL" value={f('home_hero_cta1_url')} onChange={v => sf('home_hero_cta1_url', v)} />
          <Field label="CTA2 текст" value={f('home_hero_cta2_text')} onChange={v => sf('home_hero_cta2_text', v)} />
          <Field label="CTA2 URL" value={f('home_hero_cta2_url')} onChange={v => sf('home_hero_cta2_url', v)} />
          <Field label="Background төрөл (image/video/gradient)" value={f('home_hero_bg_type')} onChange={v => sf('home_hero_bg_type', v)} />
          <Field label="Background утга (URL эсвэл CSS)" value={f('home_hero_bg_value')} onChange={v => sf('home_hero_bg_value', v)} />
        </div>

        {/* Features */}
        <h3 style={{ ...sectionTitle, marginTop: 28 }}>Давуу тал (Features)</h3>
        <Toggle label="Features хэсэг харуулах" value={fb('home_features_enabled')} onChange={v => sfb('home_features_enabled', v)} />
        <Field label="Features гарчиг" value={f('home_features_title')} onChange={v => sf('home_features_title', v)} />
        {features.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 8 }}>
            <div style={{ flex: 0.5 }}>
              <label style={{ ...labelStyle, fontSize: 11 }}>Icon</label>
              <input style={inputStyle} value={item.icon} onChange={e => {
                const next = [...features]; next[i] = { ...item, icon: e.target.value }; setFeatures(next)
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, fontSize: 11 }}>Гарчиг</label>
              <input style={inputStyle} value={item.title} onChange={e => {
                const next = [...features]; next[i] = { ...item, title: e.target.value }; setFeatures(next)
              }} />
            </div>
            <div style={{ flex: 1.5 }}>
              <label style={{ ...labelStyle, fontSize: 11 }}>Тайлбар</label>
              <input style={inputStyle} value={item.desc} onChange={e => {
                const next = [...features]; next[i] = { ...item, desc: e.target.value }; setFeatures(next)
              }} />
            </div>
            <button style={dangerBtn} onClick={() => setFeatures(features.filter((_, fi) => fi !== i))}>✕</button>
          </div>
        ))}
        <button style={{ ...secondaryBtn, fontSize: 12, marginTop: 4 }} onClick={() => setFeatures([...features, { icon: '', title: '', desc: '' }])}>+ Нэмэх</button>

        {/* Stats */}
        <h3 style={{ ...sectionTitle, marginTop: 28 }}>Статистик (Stats)</h3>
        <Toggle label="Stats хэсэг харуулах" value={fb('home_stats_enabled')} onChange={v => sfb('home_stats_enabled', v)} />
        {stats.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, fontSize: 11 }}>Тоо</label>
              <input style={inputStyle} value={item.value} onChange={e => {
                const next = [...stats]; next[i] = { ...item, value: e.target.value }; setStats(next)
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, fontSize: 11 }}>Label</label>
              <input style={inputStyle} value={item.label} onChange={e => {
                const next = [...stats]; next[i] = { ...item, label: e.target.value }; setStats(next)
              }} />
            </div>
            <button style={dangerBtn} onClick={() => setStats(stats.filter((_, si) => si !== i))}>✕</button>
          </div>
        ))}
        <button style={{ ...secondaryBtn, fontSize: 12, marginTop: 4 }} onClick={() => setStats([...stats, { value: '', label: '' }])}>+ Нэмэх</button>

        {/* CTA Section */}
        <h3 style={{ ...sectionTitle, marginTop: 28 }}>CTA хэсэг</h3>
        <Toggle label="CTA хэсэг харуулах" value={fb('home_cta_enabled')} onChange={v => sfb('home_cta_enabled', v)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          <Field label="Гарчиг" value={f('home_cta_title')} onChange={v => sf('home_cta_title', v)} />
          <Field label="Дэд гарчиг" value={f('home_cta_subtitle')} onChange={v => sf('home_cta_subtitle', v)} />
          <Field label="Товчны текст" value={f('home_cta_btn_text')} onChange={v => sf('home_cta_btn_text', v)} />
          <Field label="Товчны URL" value={f('home_cta_btn_url')} onChange={v => sf('home_cta_btn_url', v)} />
        </div>

        <SaveButton onClick={() => saveBulk(keys)} />
      </div>
    )
  }

  // ===================== TAB 6: SEO =====================
  const renderSeo = () => {
    const keys = ['seo_meta_title', 'seo_meta_description', 'seo_og_image']
    return (
      <div style={cardStyle}>
        <h3 style={sectionTitle}>SEO тохиргоо</h3>
        <Field label="Meta гарчиг" value={f('seo_meta_title')} onChange={v => sf('seo_meta_title', v)} placeholder="BizPrint - Хэвлэлийн үйлчилгээ" />
        <Field label="Meta тайлбар" value={f('seo_meta_description')} onChange={v => sf('seo_meta_description', v)} type="textarea" placeholder="Монголын хамгийн том хэвлэлийн платформ..." />
        <Field label="OG зураг URL" value={f('seo_og_image')} onChange={v => sf('seo_og_image', v)} placeholder="https://..." />
        <SaveButton onClick={() => saveBulk(keys)} />
      </div>
    )
  }

  const tabRenderers = [renderGeneral, renderHeader, renderMegaMenu, renderFooter, renderHomepage, renderSeo]

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', fontFamily: font, color: 'var(--text2)' }}>
        Уншиж байна...
      </div>
    )
  }

  return (
    <div style={{ padding: 24, fontFamily: font }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text)' }}>CMS тохиргоо</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Сайтын агуулга, дизайн тохиргоо</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: font, transition: 'all 0.15s',
            background: tab === i ? '#FF6B00' : 'var(--surface2)',
            color: tab === i ? '#fff' : 'var(--text2)',
          }}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      {tabRenderers[tab]()}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
