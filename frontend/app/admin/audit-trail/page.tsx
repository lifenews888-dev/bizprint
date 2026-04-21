'use client'
import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://bizprint-production.up.railway.app'
const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const tok = () => localStorage.getItem('access_token') || localStorage.getItem('token') || ''
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` })

interface AuditEntry {
  id: string
  order_id: string
  user: string
  action: string
  file?: string
  created_at: string
}

export default function AuditTrailPage() {
  const [entries,  setEntries]  = useState<AuditEntry[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [detail,   setDetail]   = useState<AuditEntry | null>(null)

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    load(debouncedSearch)
  }, [debouncedSearch])

  async function load(q: string) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (q.trim()) params.set('search', q.trim())
      const res = await fetch(`${API}/audit-trail?${params}`, { headers: hdrs() })
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  const ACTION_COLOR: Record<string, string> = {
    created:    '#3B82F6',
    updated:    '#F59E0B',
    deleted:    '#EF4444',
    paid:       '#10B981',
    shipped:    '#8B5CF6',
    completed:  '#059669',
    cancelled:  '#EF4444',
  }

  function actionColor(action: string) {
    const key = Object.keys(ACTION_COLOR).find(k => action.toLowerCase().includes(k))
    return key ? ACTION_COLOR[key] : '#888'
  }

  return (
    <div style={{ padding: '24px 28px', fontFamily: F, maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Аудит мөр</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>
          Системийн үйлдлүүдийн дэлгэрэнгүй бүртгэл
        </p>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Захиалга №, хэрэглэгч, үйлдлээр хайх..."
          style={{
            flex: 1, maxWidth: 460, padding: '10px 14px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, fontSize: 14, color: 'var(--text)', outline: 'none',
          }}
        />
        <div style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
          {entries.length} бичлэг
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</div>
      ) : entries.length === 0 ? (
        <div style={{ padding: '60px 40px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: 16, color: 'var(--text2)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Бичлэг олдсонгүй</div>
          <div style={{ fontSize: 13 }}>Хайлтаа өөрчилж дахин үзнэ үү</div>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr auto', gap: 0, borderBottom: '1px solid var(--border)', padding: '10px 16px', background: 'var(--surface2)' }}>
            {['Огноо', 'Захиалга №', 'Хэрэглэгч / Үйлдэл', ''].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {entries.map((e, i) => (
            <div key={e.id}
              onClick={() => setDetail(e)}
              style={{
                display: 'grid', gridTemplateColumns: '180px 1fr 1fr auto',
                gap: 0, padding: '12px 16px', cursor: 'pointer',
                borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.12s',
              }}
              onMouseEnter={el => (el.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={el => (el.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                {new Date(e.created_at).toLocaleString('mn-MN')}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text2)' }}>
                #{e.order_id?.slice(0, 14) || '—'}
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{e.user}</div>
                <span style={{
                  fontSize: 11, padding: '1px 7px', borderRadius: 99,
                  background: actionColor(e.action) + '18',
                  color: actionColor(e.action),
                  fontWeight: 600, display: 'inline-block', marginTop: 2,
                }}>
                  {e.action}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                {e.file ? '📎' : ''} →
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setDetail(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 460, border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Аудит дэлгэрэнгүй</div>
              <button onClick={() => setDetail(null)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: 'var(--text2)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['ID',         detail.id],
                ['Захиалга №', detail.order_id || '—'],
                ['Хэрэглэгч',  detail.user],
                ['Үйлдэл',     detail.action],
                ['Огноо',      new Date(detail.created_at).toLocaleString('mn-MN')],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 100, fontSize: 12, color: 'var(--text3)', fontWeight: 600, flexShrink: 0 }}>{label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', wordBreak: 'break-all' }}>{value}</div>
                </div>
              ))}
              {detail.file && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 100, fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>Файл</div>
                  <a href={detail.file.startsWith('http') ? detail.file : `${API}/${detail.file}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: 13, color: '#3B82F6', wordBreak: 'break-all' }}>
                    📎 {detail.file.split('/').pop()}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
