'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'

export default function AdminTemplatesPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'pending'>('all')

  const load = () => {
    const url = tab === 'pending' ? `/templates/pending` : `/templates`
    apiFetch(url).then(d => setItems(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(load, [tab])

  const approve = async (id: string) => { await apiFetch(`/templates/${id}/approve`, { method: 'PATCH'}); load() }
  const reject = async (id: string) => { if (!confirm('Татгалзах уу?')) return; await apiFetch(`/templates/${id}/reject`, { method: 'PATCH'}); load() }
  const del = async (id: string) => { if (!confirm('Устгах уу?')) return; await apiFetch(`/templates/${id}`, { method: 'DELETE' }); load() }

  const STATUS_COLOR: Record<string, string> = { approved: '#10B981', pending: '#F59E0B', rejected: '#EF4444' }

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Загварууд</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Дизайнеруудын оруулсан загвар templates</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'pending'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setLoading(true) }} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: tab === t ? '#FF6B00' : 'var(--surface2)', color: tab === t ? '#fff' : 'var(--text2)' }}>
            {t === 'all' ? 'Бүгд' : 'Хүлээгдэж буй'}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }} className="table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--surface2)' }}>{['Нэр', 'Дизайнер', 'Ангилал', 'Үнэ', 'Төлөв', 'Үйлдэл'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 500 }}>{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</td></tr>
            : items.length === 0 ? <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text2)' }}>Загвар байхгүй</td></tr>
            : items.map(t => (
              <tr key={t.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 16px', fontWeight: 500 }}>{t.name || '—'}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{t.designer_name || t.designerId?.slice(0, 8) || '—'}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text2)' }}>{t.category || '—'}</td>
                <td style={{ padding: '10px 16px', color: '#FF6B00', fontWeight: 600 }}>₮{Number(t.price || 0).toLocaleString()}</td>
                <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: (STATUS_COLOR[t.status] || '#888') + '15', color: STATUS_COLOR[t.status] || '#888', fontWeight: 600 }}>{t.status || '—'}</span></td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {t.status === 'pending' && <button onClick={() => approve(t.id)} style={{ padding: '5px 12px', background: 'rgba(16,185,129,0.1)', color: '#10B981', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Зөвшөөрөх</button>}
                    {t.status === 'pending' && <button onClick={() => reject(t.id)} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Татгалзах</button>}
                    <button onClick={() => del(t.id)} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Устгах</button>
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
