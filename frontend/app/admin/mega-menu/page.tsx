'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

interface CategoryItem {
  id: string; name: string; icon: string | null
  children_count: number
  children: { id: string; name: string }[]
}

interface PromoConfig {
  enabled: boolean; title: string; description: string
  image: string | null; link: string
}

interface MenuConfig {
  available_categories: CategoryItem[]
  selected_columns: string[]
  promo: PromoConfig
}

export default function MegaMenuBuilder() {
  const [config, setConfig] = useState<MenuConfig | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [promo, setPromo] = useState<PromoConfig>({ enabled: true, title: '', description: '', image: null, link: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    try {
      const data = await apiFetch<MenuConfig>('/cms/mega-menu/config')
      setConfig(data)
      setColumns(data.selected_columns || [])
      setPromo(data.promo || { enabled: true, title: '', description: '', image: null, link: '' })
    } catch {}
  }

  async function saveColumns() {
    setSaving(true); setMsg('')
    try {
      await apiFetch('/cms/mega-menu/columns', { method: 'PATCH', body: JSON.stringify({ column_ids: columns }) })
      setMsg('Баганууд хадгалагдлаа ✅')
    } catch { setMsg('Алдаа гарлаа') }
    setSaving(false)
  }

  async function savePromo() {
    setSaving(true); setMsg('')
    try {
      await apiFetch('/cms/mega-menu/promo', { method: 'PATCH', body: JSON.stringify(promo) })
      setMsg('Промо хадгалагдлаа ✅')
    } catch { setMsg('Алдаа гарлаа') }
    setSaving(false)
  }

  function addColumn(catId: string) {
    if (!columns.includes(catId)) setColumns([...columns, catId])
  }

  function removeColumn(catId: string) {
    setColumns(columns.filter(id => id !== catId))
  }

  function moveColumn(idx: number, dir: -1 | 1) {
    const newCols = [...columns]
    const target = idx + dir
    if (target < 0 || target >= newCols.length) return
    ;[newCols[idx], newCols[target]] = [newCols[target], newCols[idx]]
    setColumns(newCols)
  }

  if (!config) return <div style={{ padding: 40, color: '#888' }}>Ачааллаж байна...</div>

  const available = config.available_categories.filter(c => !columns.includes(c.id))

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Mega Menu Builder</h1>
      <p style={{ color: '#888', marginBottom: 24 }}>Цэсний баганууд болон промо картыг визуалаар удирдах</p>

      {msg && <div style={{ padding: '10px 16px', background: msg.includes('✅') ? '#0f291a' : '#291a1a', borderRadius: 8, marginBottom: 16, color: msg.includes('✅') ? '#22c55e' : '#ef4444', fontSize: 14, fontWeight: 600 }}>{msg}</div>}

      {/* ═══ COLUMNS ═══ */}
      <div style={{ background: '#111', borderRadius: 12, padding: 20, border: '1px solid #222', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>📋 Цэсний баганууд ({columns.length})</h2>
          <button onClick={saveColumns} disabled={saving} style={{ background: '#f97316', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
        </div>

        {/* Selected columns */}
        {columns.length === 0 && <p style={{ color: '#555', fontSize: 14 }}>Багана нэмэгдээгүй — бүх ангилал харагдана</p>}
        {columns.map((colId, idx) => {
          const cat = config.available_categories.find(c => c.id === colId)
          if (!cat) return null
          return (
            <div key={colId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#1a1a1a', borderRadius: 8, marginBottom: 6, border: '1px solid #2a2a2a' }}>
              <span style={{ fontSize: 18 }}>{cat.icon || '📦'}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{cat.name}</span>
              <span style={{ color: '#888', fontSize: 12 }}>{cat.children_count} дэд ангилал</span>

              {/* Children preview */}
              {cat.children.length > 0 && (
                <span style={{ color: '#555', fontSize: 11 }}>
                  ({cat.children.map(c => c.name).join(', ')})
                </span>
              )}

              <button onClick={() => moveColumn(idx, -1)} disabled={idx === 0} style={{ background: '#222', border: 'none', color: '#888', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>↑</button>
              <button onClick={() => moveColumn(idx, 1)} disabled={idx === columns.length - 1} style={{ background: '#222', border: 'none', color: '#888', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>↓</button>
              <button onClick={() => removeColumn(colId)} style={{ background: '#2a1a1a', border: 'none', color: '#ef4444', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>✕</button>
            </div>
          )
        })}

        {/* Add column */}
        {available.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ color: '#666', fontSize: 12, marginBottom: 6 }}>+ Багана нэмэх:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {available.map(cat => (
                <button key={cat.id} onClick={() => addColumn(cat.id)} style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', color: '#a5b4fc', padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer' }}>
                  {cat.icon || '📦'} {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ PROMO CARD ═══ */}
      <div style={{ background: '#111', borderRadius: 12, padding: 20, border: '1px solid #222', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>🎨 Промо карт</h2>
          <button onClick={savePromo} disabled={saving} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
            Хадгалах
          </button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={promo.enabled} onChange={e => setPromo({ ...promo, enabled: e.target.checked })} />
            <span style={{ color: promo.enabled ? '#22c55e' : '#888' }}>Промо {promo.enabled ? 'идэвхтэй' : 'идэвхгүй'}</span>
          </label>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>Гарчиг</label>
            <input value={promo.title} onChange={e => setPromo({ ...promo, title: e.target.value })} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 14px', color: '#f1f5f9', fontSize: 14 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>Тайлбар</label>
            <textarea value={promo.description} onChange={e => setPromo({ ...promo, description: e.target.value })} rows={2} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 14px', color: '#f1f5f9', fontSize: 14, resize: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>Холбоос (URL)</label>
            <input value={promo.link} onChange={e => setPromo({ ...promo, link: e.target.value })} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 14px', color: '#f1f5f9', fontSize: 14 }} />
          </div>
        </div>
      </div>

      {/* ═══ PREVIEW ═══ */}
      <div style={{ background: '#111', borderRadius: 12, padding: 20, border: '1px solid #222' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>👁️ Mega Menu Preview</h2>
        <div style={{ display: 'flex', gap: 16, background: '#0a0a0a', borderRadius: 8, padding: 16, overflowX: 'auto' }}>
          {(columns.length > 0 ? columns : config.available_categories.map(c => c.id)).map(colId => {
            const cat = config.available_categories.find(c => c.id === colId)
            if (!cat) return null
            return (
              <div key={colId} style={{ minWidth: 150 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f97316', marginBottom: 8 }}>{cat.icon} {cat.name}</h3>
                {cat.children.length > 0 ? (
                  cat.children.map(ch => (
                    <div key={ch.id} style={{ fontSize: 13, color: '#888', padding: '4px 0', borderBottom: '1px solid #1a1a1a' }}>{ch.name}</div>
                  ))
                ) : (
                  <div style={{ fontSize: 12, color: '#555' }}>Дэд ангилал байхгүй</div>
                )}
              </div>
            )
          })}

          {promo.enabled && (
            <div style={{ minWidth: 180, background: '#1a1a2e', borderRadius: 8, padding: 14, border: '1px solid #2a2a4a' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#a5b4fc', marginBottom: 6 }}>{promo.title || 'Промо'}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{promo.description}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
