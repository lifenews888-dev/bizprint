'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'

const STATUS_CLR: Record<string, { label: string; color: string }> = {
  available: { label: 'Бэлэн', color: '#10B981' },
  busy: { label: 'Ачаалалтай', color: '#F59E0B' },
  maintenance: { label: 'Засвартай', color: '#EF4444' },
  offline: { label: 'Офлайн', color: '#888' },
}

export default function AdminMachinesPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', type: '', speed_per_hour: 0, sheet_width_mm: 0, sheet_height_mm: 0, hour_rate: 0, factory_id: '', status: 'available' })

  const load = () => { apiFetch('/machines').then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(load, [])

  const reset = () => { setEditing(null); setForm({ name: '', type: '', speed_per_hour: 0, sheet_width_mm: 0, sheet_height_mm: 0, hour_rate: 0, factory_id: '', status: 'available' }) }
  const save = async () => {
    const method = editing?.id ? 'PATCH' : 'POST'
    const url = editing?.id ? `/machines/${editing.id}` : `/machines`
    await apiFetch(url, { method: , body: form })
    reset(); load()
  }
  const del = async (id: number) => { if (!confirm('Устгах уу?')) return; await apiFetch(`/machines/${id}`, { method: 'DELETE'); load() }
  const edit = (m: any) => { setEditing(m); setForm({ name: m.name || '', type: m.type || '', speed_per_hour: m.speed_per_hour || 0, sheet_width_mm: m.sheet_width_mm || 0, sheet_height_mm: m.sheet_height_mm || 0, hour_rate: m.hour_rate || 0, factory_id: m.factory_id || '', status: m.status || 'available' }) }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }

  const totalMachines = items.length
  const available = items.filter(m => m.status === 'available').length
  const busy = items.filter(m => m.status === 'busy').length

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Тоног төхөөрөмж</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Хэвлэлийн машин, принтер удирдлага</p>
        </div>
        <button onClick={() => { reset(); setEditing({}) }} style={{ padding: '10px 20px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Шинэ машин</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Нийт', value: totalMachines, color: '#FF6B00' },
          { label: 'Бэлэн', value: available, color: '#10B981' },
          { label: 'Ачаалалтай', value: busy, color: '#F59E0B' },
          { label: 'Засвартай', value: items.filter(m => m.status === 'maintenance').length, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      {editing !== null && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>{editing?.id ? 'Машин засах' : 'Шинэ машин'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }} className="form-row">
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Нэр</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inp} placeholder="Epson L1300" /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Төрөл</label><input value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={inp} placeholder="Inkjet / Offset / Digital" /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Төлөв</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} style={inp}>
                <option value="available">Бэлэн</option><option value="busy">Ачаалалтай</option><option value="maintenance">Засвартай</option><option value="offline">Офлайн</option>
              </select>
            </div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Хурд (хуудас/цаг)</label><input type="number" value={form.speed_per_hour} onChange={e => setForm({...form, speed_per_hour: +e.target.value})} style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Хуудас өргөн (мм)</label><input type="number" value={form.sheet_width_mm} onChange={e => setForm({...form, sheet_width_mm: +e.target.value})} style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Хуудас өндөр (мм)</label><input type="number" value={form.sheet_height_mm} onChange={e => setForm({...form, sheet_height_mm: +e.target.value})} style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Цагийн төлбөр (₮)</label><input type="number" value={form.hour_rate} onChange={e => setForm({...form, hour_rate: +e.target.value})} style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Үйлдвэр ID</label><input value={form.factory_id} onChange={e => setForm({...form, factory_id: e.target.value})} style={inp} /></div>
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
          <thead><tr style={{ background: 'var(--surface2)' }}>{['Нэр', 'Төрөл', 'Хурд', 'Хэмжээ (мм)', 'Цагийн төлбөр', 'Төлөв', 'Үйлдэл'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</td></tr>
            : items.length === 0 ? <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Машин бүртгэгдээгүй</td></tr>
            : items.map(m => {
              const st = STATUS_CLR[m.status] || { label: m.status, color: '#888' }
              return (
                <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 500 }}>{m.name || '—'}</td>
                  <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>{m.type || '—'}</span></td>
                  <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{m.speed_per_hour ? `${m.speed_per_hour} хуудас/цаг` : '—'}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{m.sheet_width_mm && m.sheet_height_mm ? `${m.sheet_width_mm}×${m.sheet_height_mm}` : '—'}</td>
                  <td style={{ padding: '10px 16px', color: '#FF6B00', fontWeight: 600 }}>₮{Number(m.hour_rate || 0).toLocaleString()}</td>
                  <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: st.color + '15', color: st.color, fontWeight: 600 }}>{st.label}</span></td>
                  <td style={{ padding: '10px 16px' }}><div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => edit(m)} style={{ padding: '5px 12px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Засах</button>
                    <button onClick={() => del(m.id)} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Устгах</button>
                  </div></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
