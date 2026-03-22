'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'

const EVENT_OPTIONS = [
  { key: 'delivery_created', label: 'Хүргэлт үүссэн', icon: '📦' },
  { key: 'status_changed', label: 'Статус шилжсэн', icon: '🔄' },
  { key: 'delivery_completed', label: 'Хүргэлт дууссан', icon: '✅' },
]

const PROVIDERS = [
  { key: 'delgermoron', label: 'Дэлгэрмөрөн', color: '#2563EB' },
  { key: 'hidel', label: 'HiDel', color: '#7C3AED' },
  { key: 'ubcab', label: 'UB Cab Delivery', color: '#059669' },
  { key: 'custom', label: 'Custom / Бусад', color: '#6B7280' },
]

export default function AdminWebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [testing, setTesting] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [provider, setProvider] = useState('custom')
  const [events, setEvents] = useState<string[]>(['delivery_created', 'status_changed', 'delivery_completed'])

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/delivery/webhooks/list')
      setWebhooks(Array.isArray(data) ? data : [])
    } catch { setWebhooks([]) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const resetForm = () => {
    setName(''); setUrl(''); setSecret(''); setProvider('custom')
    setEvents(['delivery_created', 'status_changed', 'delivery_completed'])
    setEditing(null); setShowForm(false)
  }

  const openEdit = (wh: any) => {
    setName(wh.name); setUrl(wh.url); setSecret(wh.secret || ''); setProvider(wh.provider || 'custom')
    setEvents(wh.events || []); setEditing(wh); setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!name.trim() || !url.trim()) return

    const body = { name, url, secret: secret || undefined, provider, events }

    if (editing) {
      await apiFetch(`/delivery/webhooks/${editing.id}`, { method: 'PATCH', body: body })
    } else {
      await apiFetch('/delivery/webhooks', { method: 'POST', body: body })
    }

    resetForm(); load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Устгах уу?')) return
    await apiFetch(`/delivery/webhooks/${id}`, { method: 'DELETE')
    load()
  }

  const handleToggle = async (wh: any) => {
    await apiFetch(`/delivery/webhooks/${wh.id}`, { method: 'PATCH', body: { is_active: !wh.is_active } })
    load()
  }

  const handleTest = async (id: number) => {
    setTesting(id); setTestResult(null)
    try {
      const data = await apiFetch(`/delivery/webhooks/${id}/test`, { method: 'POST'})
      setTestResult(data.success ? '✅ Тест амжилттай илгээгдлээ' : '❌ Алдаа: ' + (data.error || 'Unknown'))
    } catch (e) {
      setTestResult('❌ Тест илгээхэд алдаа гарлаа')
    }
    setTesting(null)
    setTimeout(() => setTestResult(null), 4000)
  }

  const toggleEvent = (key: string) => {
    setEvents(prev => prev.includes(key) ? prev.filter(e => e !== key) : [...prev, key])
  }

  const getProviderInfo = (key: string) => PROVIDERS.find(p => p.key === key) || PROVIDERS[3]

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text2)' }}>Ачааллж байна...</div>

  return (
    <div style={{ padding: 24, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", maxWidth: 960, margin: '0 auto' }}>

      <style>{`
        .wh-card { transition: all 0.15s; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); }
        .wh-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .wh-btn { border: none; border-radius: 6px; padding: 6px 14px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.12s; }
        .wh-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
        .wh-btn:active { transform: scale(0.98); }
        .wh-input { background: var(--surface2); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 10px 14px; font-size: 13px; outline: none; width: 100%; font-family: inherit; }
        .wh-input:focus { border-color: #FF6B00; }
        .wh-input::placeholder { color: var(--text3); }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .wh-animate { animation: fadeIn 0.3s ease; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Webhook удирдлага</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>
            Гадны хүргэлтийн апп-уудтай холбогдох webhook бүртгэл
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="wh-btn"
          style={{ background: '#FF6B00', color: '#fff', padding: '10px 20px', fontSize: 13, fontWeight: 600 }}>
          + Webhook нэмэх
        </button>
      </div>

      {/* Toast */}
      {testResult && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: testResult.startsWith('✅') ? '#dcfce7' : '#fee2e2',
          color: testResult.startsWith('✅') ? '#166534' : '#991b1b',
          padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 9999
        }}>
          {testResult}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Нийт', value: webhooks.length, color: '#6B7280' },
          { label: 'Идэвхтэй', value: webhooks.filter(w => w.is_active).length, color: '#10B981' },
          { label: 'Идэвхгүй', value: webhooks.filter(w => !w.is_active).length, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 18px', borderLeft: `3px solid ${s.color}` }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: s.color, marginRight: 6 }}>{s.value}</span>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Webhook List */}
      {webhooks.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
          <div style={{ fontSize: 14, marginBottom: 8 }}>Webhook бүртгэгдээгүй байна</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Гадны хүргэлтийн апп-тай холбогдохын тулд webhook нэмнэ үү</div>
          <button onClick={() => { resetForm(); setShowForm(true) }} className="wh-btn"
            style={{ background: '#FF6B00', color: '#fff', padding: '10px 20px' }}>
            + Эхний webhook нэмэх
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {webhooks.map((wh, i) => {
            const prov = getProviderInfo(wh.provider)
            return (
              <div key={wh.id} className="wh-card wh-animate" style={{ padding: '16px 20px', animationDelay: `${i * 0.05}s`, opacity: wh.is_active ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{wh.name}</span>
                      <span style={{ fontSize: 10, background: prov.color + '15', color: prov.color, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{prov.label}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 600, background: wh.is_active ? '#dcfce7' : '#fee2e2', color: wh.is_active ? '#166534' : '#991b1b' }}>
                        {wh.is_active ? '● Идэвхтэй' : '○ Идэвхгүй'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'monospace', marginBottom: 6, wordBreak: 'break-all' }}>{wh.url}</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                      {(wh.events || []).map((ev: string) => {
                        const evInfo = EVENT_OPTIONS.find(e => e.key === ev)
                        return <span key={ev} style={{ fontSize: 10, background: 'var(--surface2)', color: 'var(--text2)', padding: '2px 8px', borderRadius: 4 }}>{evInfo?.icon} {evInfo?.label || ev}</span>
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text3)' }}>
                      {wh.secret && <span>🔑 Secret тохируулсан</span>}
                      {wh.failure_count > 0 && <span style={{ color: '#EF4444' }}>⚠️ {wh.failure_count} алдаа</span>}
                      {wh.last_triggered_at && <span>🕐 Сүүлд: {new Date(wh.last_triggered_at).toLocaleString()}</span>}
                      <span>📅 Үүсгэсэн: {new Date(wh.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 12 }}>
                    <button onClick={() => handleTest(wh.id)} disabled={testing === wh.id} className="wh-btn"
                      style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
                      {testing === wh.id ? '⏳' : '🧪 Тест'}
                    </button>
                    <button onClick={() => handleToggle(wh)} className="wh-btn"
                      style={{ background: wh.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: wh.is_active ? '#EF4444' : '#10B981' }}>
                      {wh.is_active ? '⏸ Зогсоох' : '▶ Идэвхжүүлэх'}
                    </button>
                    <button onClick={() => openEdit(wh)} className="wh-btn"
                      style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(wh.id)} className="wh-btn"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => resetForm()}>
          <div className="wh-animate" style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 500, border: '1px solid var(--border)', padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>{editing ? '✏️ Webhook засах' : '➕ Шинэ Webhook'}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 4, display: 'block' }}>Нэр</label>
                <input className="wh-input" value={name} onChange={e => setName(e.target.value)} placeholder="Жишээ: Дэлгэрмөрөн webhook" />
              </div>

              {/* Provider */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 4, display: 'block' }}>Хүргэлтийн апп</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {PROVIDERS.map(p => (
                    <button key={p.key} onClick={() => setProvider(p.key)} className="wh-btn"
                      style={{ background: provider === p.key ? p.color : p.color + '12', color: provider === p.key ? '#fff' : p.color, fontSize: 12 }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* URL */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 4, display: 'block' }}>Webhook URL</label>
                <input className="wh-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://api.example.mn/webhook/bizprint" style={{ fontFamily: 'monospace' }} />
              </div>

              {/* Secret */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 4, display: 'block' }}>Secret key (заавал биш)</label>
                <input className="wh-input" value={secret} onChange={e => setSecret(e.target.value)} placeholder="HMAC SHA256 signature-д ашиглагдана" type="password" />
              </div>

              {/* Events */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Events (ямар үйл явдалд мэдэгдэх)</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {EVENT_OPTIONS.map(ev => (
                    <button key={ev.key} onClick={() => toggleEvent(ev.key)} className="wh-btn"
                      style={{ background: events.includes(ev.key) ? '#FF6B00' : 'var(--surface2)', color: events.includes(ev.key) ? '#fff' : 'var(--text2)', fontSize: 12 }}>
                      {ev.icon} {ev.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={resetForm} className="wh-btn" style={{ background: 'var(--surface2)', color: 'var(--text2)', padding: '10px 20px' }}>Цуцлах</button>
              <button onClick={handleSubmit} className="wh-btn" disabled={!name.trim() || !url.trim()}
                style={{ background: (name.trim() && url.trim()) ? '#FF6B00' : 'var(--surface2)', color: (name.trim() && url.trim()) ? '#fff' : 'var(--text3)', padding: '10px 24px', fontWeight: 600 }}>
                {editing ? 'Хадгалах' : 'Бүртгэх'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Documentation */}
      <div style={{ marginTop: 32, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: 'var(--text2)' }}>📖 API Documentation — Гадны апп-д зориулсан</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { method: 'POST', path: '/delivery/provider/assign', desc: 'Хүргэлт оноох (order_id, provider, courier_name)', color: '#10B981' },
            { method: 'POST', path: '/delivery/provider/callback', desc: 'Статус шинэчлэх (provider_order_id, status, lat, lng)', color: '#10B981' },
            { method: 'GET', path: '/delivery/:id/tracking', desc: 'Tracking мэдээлэл авах', color: '#3B82F6' },
          ].map((api, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: api.color, background: api.color + '15', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>{api.method}</span>
              <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text)', fontWeight: 500 }}>{api.path}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>{api.desc}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: 12, background: 'var(--surface2)', borderRadius: 8, fontSize: 11, fontFamily: 'monospace', color: 'var(--text3)', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>Webhook payload жишээ:</div>
          {`{
  "event": "status_changed",
  "timestamp": "2026-03-19T10:30:00Z",
  "data": {
    "delivery_id": 1,
    "order_id": "abc-123",
    "previous_status": "assigned",
    "new_status": "picked_up"
  }
}`}
        </div>
      </div>
    </div>
  )
}
