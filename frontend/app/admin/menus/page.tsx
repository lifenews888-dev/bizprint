'use client'
import React, { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://bizprint-production.up.railway.app'
const tok = () => localStorage.getItem('access_token') || localStorage.getItem('token') || ''
const getHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` })

export default function AdminMenusPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title: '', url: '', icon: '', location: 'main', section_title: '', is_mega: false, isActive: true, order: 0 })

  const load = () => { fetch(`${API}/menus`, { headers: getHeaders() }).then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(load, [])

  const reset = () => { setEditing(null); setForm({ title: '', url: '', icon: '', location: 'main', section_title: '', is_mega: false, isActive: true, order: 0 }) }
  const save = async () => {
    const method = editing?.id ? 'PATCH' : 'POST'
    const url = editing?.id ? `${API}/menus/${editing.id}` : `${API}/menus`
    await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(form) })
    reset(); load()
  }
  const del = async (id: string) => { if (!confirm('Устгах уу?')) return; await fetch(`${API}/menus/${id}`, { method: 'DELETE', headers: getHeaders() }); load() }
  const edit = (item: any) => { setEditing(item); setForm({ title: item.title || '', url: item.url || '', icon: item.icon || '', location: item.location || 'main', section_title: item.section_title || '', is_mega: !!item.is_mega, isActive: item.isActive !== false, order: item.order || 0 }) }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Цэс удирдлага</h1><p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Навигацийн цэсний зүйлс</p></div>
        <button onClick={() => { reset(); setEditing({}) }} style={{ padding: '10px 20px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Шинэ цэс</button>
      </div>

      {editing !== null && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>{editing?.id ? 'Засах' : 'Шинэ цэс'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="form-row">
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Нэр</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>URL</label><input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} style={inp} placeholder="/shop" /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Icon</label><input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} style={inp} placeholder="🖨️" /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Байрлал</label>
              <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={inp}>
                <option value="main">Main</option><option value="mega">Mega</option><option value="footer">Footer</option>
              </select>
            </div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Section title (mega)</label><input value={form.section_title} onChange={e => setForm({ ...form, section_title: e.target.value })} style={inp} /></div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><input type="checkbox" checked={form.is_mega} onChange={e => setForm({ ...form, is_mega: e.target.checked })} />Mega цэс</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />Идэвхтэй</label>
              <div><label style={{ fontSize: 12, color: 'var(--text2)' }}>Дараалал</label><input type="number" value={form.order} onChange={e => setForm({ ...form, order: +e.target.value })} style={{ ...inp, width: 70, marginLeft: 6 }} /></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={save} style={{ padding: '10px 24px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Хадгалах</button>
            <button onClick={reset} style={{ padding: '10px 24px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Болих</button>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }} className="table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--surface2)' }}>{['Icon', 'Нэр', 'URL', 'Байрлал', 'Төлөв', 'Үйлдэл'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500 }}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</td></tr>
            : items.length === 0 ? <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Цэс байхгүй</td></tr>
            : items.map(item => (
              <tr key={item.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 16px', fontSize: 18 }}>{item.icon || '—'}</td>
                <td style={{ padding: '10px 16px', fontWeight: 500 }}>{item.title}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)', fontFamily: 'monospace' }}>{item.url}</td>
                <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>{item.location}</span></td>
                <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: item.isActive !== false ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: item.isActive !== false ? '#10B981' : '#EF4444', fontWeight: 600 }}>{item.isActive !== false ? 'On' : 'Off'}</span></td>
                <td style={{ padding: '10px 16px' }}><div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => edit(item)} style={{ padding: '5px 12px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Засах</button>
                  <button onClick={() => del(item.id)} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Устгах</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
