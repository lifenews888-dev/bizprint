'use client'
import React, { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

function getHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token') || ''}` }
}

export default function AdminBannersPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title: '', description: '', imageUrl: '', link: '', buttonText: '', isActive: true, order: 0 })
  const [uploading, setUploading] = useState(false)

  const load = () => {
    fetch(`${API}/banners`, { headers: getHeaders() }).then(r => r.json()).then(d => {
      setItems(Array.isArray(d) ? d : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const reset = () => { setEditing(null); setForm({ title: '', description: '', imageUrl: '', link: '', buttonText: '', isActive: true, order: 0 }) }

  const save = async () => {
    const method = editing ? 'PATCH' : 'POST'
    const url = editing ? `${API}/banners/${editing.id}` : `${API}/banners`
    await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(form) })
    reset(); load()
  }

  const del = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    await fetch(`${API}/banners/${id}`, { method: 'DELETE', headers: getHeaders() })
    load()
  }

  const edit = (item: any) => {
    setEditing(item)
    setForm({ title: item.title || '', description: item.description || '', imageUrl: item.imageUrl || '', link: item.link || '', buttonText: item.buttonText || '', isActive: item.isActive !== false, order: item.order || 0 })
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch(`${API}/upload/file`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('access_token') || localStorage.getItem('token') || '') },
        body: fd,
      })
      const data = await res.json()
      const rawUrl = data.url || data.path || data.fileUrl
      const filename = data.filename || data.file_name || data.name
      let fullUrl = ''
      if (rawUrl) fullUrl = rawUrl.startsWith('http') ? rawUrl : `${API}/${rawUrl}`
      else if (filename) {
        const clean = filename.replace('uploads/', '')
        fullUrl = filename.startsWith('http') ? filename : `${API}/uploads/${clean}`
      }
      if (fullUrl) setForm(f => ({ ...f, imageUrl: fullUrl }))
    } catch {}
    setUploading(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text)', outline: 'none', fontFamily: F }

  return (
    <div style={{ padding: 24, fontFamily: F }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Баннер удирдлага</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Нүүр хуудасны слайдер баннерууд</p>
        </div>
        <button onClick={() => { reset(); setEditing({}) }} style={{ padding: '10px 20px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Шинэ баннер</button>
      </div>

      {/* Form */}
      {editing !== null && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>{editing?.id ? 'Баннер засах' : 'Шинэ баннер'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="form-row">
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Гарчиг</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inp} placeholder="Баннер гарчиг" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Товч текст</label>
              <input value={form.buttonText} onChange={e => setForm({ ...form, buttonText: e.target.value })} style={inp} placeholder="Дэлгэрэнгүй" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Тайлбар</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inp, minHeight: 60, resize: 'vertical' }} placeholder="Богино тайлбар" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Зураг</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} style={{ ...inp, flex: 1 }} placeholder="Зургийн URL" />
                <label style={{ padding: '10px 16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', color: uploading ? 'var(--text3)' : '#FF6B00' }}>
                  {uploading ? '...' : '📤 Upload'}
                  <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
                </label>
              </div>
              {form.imageUrl && <img src={form.imageUrl} alt="" style={{ height: 60, borderRadius: 6, marginTop: 8, objectFit: 'cover' }} />}
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Линк</label>
              <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} style={inp} placeholder="/quote" />
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                Идэвхтэй
              </label>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)' }}>Дараалал</label>
                <input type="number" value={form.order} onChange={e => setForm({ ...form, order: +e.target.value })} style={{ ...inp, width: 70, marginLeft: 6 }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={save} style={{ padding: '10px 24px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Хадгалах</button>
            <button onClick={reset} style={{ padding: '10px 24px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Болих</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }} className="table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['Зураг', 'Гарчиг', 'Линк', 'Төлөв', 'Дараалал', 'Үйлдэл'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Баннер байхгүй</td></tr>
            ) : items.map(item => (
              <tr key={item.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 16px' }}>
                  {item.imageUrl ? <img src={item.imageUrl} alt="" style={{ width: 80, height: 40, objectFit: 'cover', borderRadius: 6 }} /> : <span style={{ color: 'var(--text3)' }}>—</span>}
                </td>
                <td style={{ padding: '10px 16px', fontWeight: 500 }}>{item.title || '—'}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{item.link || '—'}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: item.isActive !== false ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: item.isActive !== false ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                    {item.isActive !== false ? 'Идэвхтэй' : 'Идэвхгүй'}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{item.order || 0}</td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => edit(item)} style={{ padding: '5px 12px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Засах</button>
                    <button onClick={() => del(item.id)} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Устгах</button>
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
