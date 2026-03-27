'use client'
import { apiFetch } from '@/lib/api'
import { useState, useEffect } from 'react'

/* ═══════════════════════════════════════════════════
   CAPABILITY + EVENT TAXONOMY
   ═══════════════════════════════════════════════════ */
const CAPABILITIES = [
  {
    key: 'order_lifecycle', label: 'Захиалгын удирдлага', icon: '📋', color: '#FF6B00',
    desc: 'Захиалга үүсэх, батлагдах, үйлдвэрлэл, хүргэлт',
    events: [
      { key: 'order.created', label: 'Үүссэн' },
      { key: 'order.confirmed', label: 'Баталгаажсан' },
      { key: 'order.vendor_assigned', label: 'Vendor хуваарилагдсан' },
      { key: 'order.in_production', label: 'Үйлдвэрлэлд' },
      { key: 'order.dispatched', label: 'Илгээгдсэн' },
      { key: 'order.delivered', label: 'Хүргэгдсэн' },
      { key: 'order.completed', label: 'Дууссан' },
      { key: 'order.cancelled', label: 'Цуцлагдсан' },
    ],
  },
  {
    key: 'design_workflow', label: 'Дизайн ажлын урсгал', icon: '🎨', color: '#8B5CF6',
    desc: 'Дизайн хүсэлт, хяналт, батлалт, Zoom',
    events: [
      { key: 'design.requested', label: 'Хүсэлт ирсэн' },
      { key: 'design.assigned', label: 'Дизайнер томилогдсон' },
      { key: 'design.version_uploaded', label: 'Файл байршуулсан' },
      { key: 'design.revision_requested', label: 'Засвар хүссэн' },
      { key: 'design.approved', label: 'Батлагдсан' },
      { key: 'design.rejected', label: 'Цуцлагдсан' },
      { key: 'design.meeting.created', label: 'Zoom уулзалт' },
    ],
  },
  {
    key: 'delivery_tracking', label: 'Хүргэлт хянах', icon: '🚚', color: '#10B981',
    desc: 'Хүргэлт үүсгэх, статус, дуусгах',
    events: [
      { key: 'delivery.created', label: 'Үүссэн' },
      { key: 'delivery.status_updated', label: 'Статус шинэчлэгдсэн' },
      { key: 'delivery.completed', label: 'Хүргэгдсэн' },
    ],
  },
  {
    key: 'communication', label: 'Харилцаа холбоо', icon: '💬', color: '#3B82F6',
    desc: 'Чат, Zoom, мэдэгдэл',
    events: [
      { key: 'chat.message_sent', label: 'Чат мессеж' },
      { key: 'zoom.created', label: 'Zoom үүссэн' },
      { key: 'notification.sent', label: 'Мэдэгдэл илгээсэн' },
    ],
  },
  {
    key: 'vendor_operations', label: 'Vendor үйл ажиллагаа', icon: '🏭', color: '#F59E0B',
    desc: 'Vendor capacity, tier, assignment',
    events: [
      { key: 'vendor.capacity_changed', label: 'Хүчин чадал өөрчлөгдсөн' },
      { key: 'vendor.tier_updated', label: 'Tier шинэчлэгдсэн' },
      { key: 'vendor.order_assigned', label: 'Захиалга хуваарилагдсан' },
    ],
  },
]

const ALL_EVENTS = CAPABILITIES.flatMap(c => c.events.map(e => ({ ...e, capability: c.key, capLabel: c.label, capIcon: c.icon, capColor: c.color })))

const INTEGRATION_TYPES = [
  { key: 'webhook', label: 'Webhook', icon: '🔗', desc: 'HTTP POST endpoint руу event илгээх' },
  { key: 'internal', label: 'Дотоод сервис', icon: '⚙️', desc: 'BizPrint дотоод микросервис' },
  { key: 'external_api', label: 'Гадаад API', icon: '🌐', desc: 'Third-party API integration' },
]

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export default function AdminWebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [testing, setTesting] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [formStep, setFormStep] = useState(0)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [integrationType, setIntegrationType] = useState('webhook')
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [selectedCapabilities, setSelectedCapabilities] = useState<Set<string>>(new Set())
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set())
  const [timeout_, setTimeout_] = useState(10)
  const [maxRetries, setMaxRetries] = useState(5)

  const load = async () => {
    setLoading(true)
    try { const d = await apiFetch<any>('/delivery/webhooks/list'); setWebhooks(Array.isArray(d) ? d : []) }
    catch { setWebhooks([]) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const resetForm = () => {
    setName(''); setDescription(''); setIntegrationType('webhook'); setUrl(''); setSecret('')
    setSelectedCapabilities(new Set()); setSelectedEvents(new Set()); setTimeout_(10); setMaxRetries(5)
    setEditing(null); setShowForm(false); setFormStep(0)
  }

  const openEdit = (wh: any) => {
    setName(wh.name); setDescription(wh.description || ''); setUrl(wh.url); setSecret(wh.secret || '')
    setIntegrationType(wh.config?.type || 'webhook')
    setTimeout_(wh.config?.timeout || 10); setMaxRetries(wh.config?.max_retries || 5)
    // Derive capabilities from events
    const evts = new Set<string>(wh.events || [])
    setSelectedEvents(evts)
    const caps = new Set<string>()
    CAPABILITIES.forEach(c => { if (c.events.some(e => evts.has(e.key))) caps.add(c.key) })
    setSelectedCapabilities(caps)
    setEditing(wh); setFormStep(0); setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!name.trim() || !url.trim()) return
    const events = Array.from(selectedEvents)
    const body = { name, description, url, secret: secret || undefined, events, config: { type: integrationType, timeout: timeout_, max_retries: maxRetries, capabilities: Array.from(selectedCapabilities) } }
    if (editing) await apiFetch<any>(`/delivery/webhooks/${editing.id}`, { method: 'PATCH', body })
    else await apiFetch<any>('/delivery/webhooks', { method: 'POST', body })
    resetForm(); load()
  }

  const handleDelete = async (id: number) => { if (confirm('Устгах уу?')) { await apiFetch<any>(`/delivery/webhooks/${id}`, { method: 'DELETE' }); load() } }
  const handleToggle = async (wh: any) => { await apiFetch<any>(`/delivery/webhooks/${wh.id}`, { method: 'PATCH', body: { is_active: !wh.is_active } }); load() }
  const handleTest = async (id: number) => {
    setTesting(id); setTestResult(null)
    try { const d = await apiFetch<any>(`/delivery/webhooks/${id}/test`, { method: 'POST' }); setTestResult(d.success ? '✅ Амжилттай' : '❌ ' + (d.error || 'Алдаа')) }
    catch { setTestResult('❌ Алдаа') }
    setTesting(null); setTimeout(() => setTestResult(null), 4000)
  }

  const toggleCapability = (key: string) => {
    setSelectedCapabilities(prev => {
      const n = new Set(prev)
      const cap = CAPABILITIES.find(c => c.key === key)!
      if (n.has(key)) {
        n.delete(key)
        // Remove all events of this capability
        setSelectedEvents(prev2 => { const n2 = new Set(prev2); cap.events.forEach(e => n2.delete(e.key)); return n2 })
      } else {
        n.add(key)
        // Auto-select all events of this capability
        setSelectedEvents(prev2 => { const n2 = new Set(prev2); cap.events.forEach(e => n2.add(e.key)); return n2 })
      }
      return n
    })
  }

  const toggleEvent = (key: string) => {
    setSelectedEvents(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  // Filtered events based on selected capabilities
  const filteredEvents = CAPABILITIES.filter(c => selectedCapabilities.has(c.key))

  const STEPS = ['Интеграцийн төрөл', 'Чадамж сонгох', 'Event бүртгэл', 'Endpoint тохиргоо']

  if (loading) return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-100 rounded w-48" /><div className="h-32 bg-gray-100 rounded-xl" /></div></div>

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto">
      {/* Toast */}
      {testResult && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-xl text-sm font-semibold shadow-xl z-[9999] ${testResult.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {testResult}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111] tracking-tight">Integration Platform</h1>
          <p className="text-sm text-[#888] mt-1">Event-driven интеграцийн удирдлагын систем</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E55D00] text-white rounded-lg text-sm font-bold transition-colors">
          + Интеграц нэмэх
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-xs text-[#888]">Нийт интеграц</div>
          <div className="text-2xl font-extrabold text-[#111]">{webhooks.length}</div>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
          <div className="text-xs text-emerald-600">🟢 Идэвхтэй</div>
          <div className="text-2xl font-extrabold text-emerald-700">{webhooks.filter(w => w.is_active).length}</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <div className="text-xs text-red-600">🔴 Идэвхгүй</div>
          <div className="text-2xl font-extrabold text-red-700">{webhooks.filter(w => !w.is_active).length}</div>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <div className="text-xs text-amber-600">⚠️ Алдаатай</div>
          <div className="text-2xl font-extrabold text-amber-700">{webhooks.filter(w => w.failure_count > 0).length}</div>
        </div>
      </div>

      {/* Integration List */}
      {webhooks.length === 0 ? (
        <div className="text-center py-16 text-[#999]">
          <div className="text-5xl mb-3">🔗</div>
          <div className="text-sm mb-4">Интеграц бүртгэгдээгүй</div>
          <button onClick={() => { resetForm(); setShowForm(true) }} className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg text-sm font-bold">+ Эхний интеграц</button>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map(wh => {
            const typeInfo = INTEGRATION_TYPES.find(t => t.key === (wh.config?.type || 'webhook')) || INTEGRATION_TYPES[0]
            const whEvents = wh.events || []
            // Group events by capability
            const capCounts: Record<string, number> = {}
            whEvents.forEach((ev: string) => {
              const info = ALL_EVENTS.find(e => e.key === ev)
              if (info) capCounts[info.capability] = (capCounts[info.capability] || 0) + 1
            })

            return (
              <div key={wh.id} className={`bg-white rounded-xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow ${!wh.is_active ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-lg">{typeInfo.icon}</span>
                      <span className="text-[15px] font-bold text-[#111]">{wh.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F3F4F6] text-[#666]">{typeInfo.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${wh.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {wh.is_active ? '● Идэвхтэй' : '○ Идэвхгүй'}
                      </span>
                    </div>
                    {wh.description && <div className="text-xs text-[#888] mb-2">{wh.description}</div>}
                    <div className="text-[11px] text-[#999] font-mono mb-2 break-all">{wh.url}</div>
                    {/* Capability badges */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {Object.entries(capCounts).map(([capKey, count]) => {
                        const cap = CAPABILITIES.find(c => c.key === capKey)
                        if (!cap) return null
                        return (
                          <span key={capKey} className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: cap.color + '12', color: cap.color }}>
                            {cap.icon} {cap.label} ({count})
                          </span>
                        )
                      })}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] text-[#999]">
                      {wh.secret && <span>🔑 HMAC</span>}
                      {wh.failure_count > 0 && <span className="text-red-500">⚠️ {wh.failure_count} алдаа</span>}
                      {wh.last_triggered_at && <span>🕐 {new Date(wh.last_triggered_at).toLocaleString('mn-MN')}</span>}
                      <span>{whEvents.length} event</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => handleTest(wh.id)} disabled={testing === wh.id}
                      className="px-2.5 py-1.5 text-[11px] font-medium bg-blue-50 text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                      {testing === wh.id ? '⏳' : '🧪'}
                    </button>
                    <button onClick={() => handleToggle(wh)}
                      className={`px-2.5 py-1.5 text-[11px] font-medium rounded-lg border transition-colors ${wh.is_active ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                      {wh.is_active ? '⏸' : '▶'}
                    </button>
                    <button onClick={() => openEdit(wh)} className="px-2.5 py-1.5 text-[11px] font-medium bg-amber-50 text-amber-600 rounded-lg border border-amber-200">✏️</button>
                    <button onClick={() => handleDelete(wh.id)} className="px-2.5 py-1.5 text-[11px] font-medium bg-red-50 text-red-600 rounded-lg border border-red-200">🗑</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══ FORM MODAL — 4-step capability-driven ═══ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={resetForm}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-[600px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-[#E5E7EB] flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-[#111]">{editing ? '✏️ Интеграц засах' : '➕ Шинэ интеграц'}</h2>
                <p className="text-xs text-[#888] mt-0.5">{STEPS[formStep]}</p>
              </div>
              <button onClick={resetForm} className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[#888] text-sm cursor-pointer border-none">✕</button>
            </div>
            <div className="px-6 pt-3 pb-1 flex gap-1 flex-shrink-0">
              {STEPS.map((_, i) => <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= formStep ? 'bg-[#FF6B00]' : 'bg-[#E5E7EB]'}`} />)}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Step 0: Integration Type */}
              {formStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#555] mb-1 block">Интеграцийн нэр *</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Жишээ: Хүргэлтийн мэдэгдэл"
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#555] mb-1 block">Тайлбар</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Юунд зориулагдсан интеграц вэ"
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00] resize-none" rows={2} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#555] mb-3 block">Интеграцийн төрөл *</label>
                    <div className="space-y-2">
                      {INTEGRATION_TYPES.map(t => (
                        <div key={t.key} onClick={() => setIntegrationType(t.key)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${integrationType === t.key ? 'border-[#FF6B00] bg-orange-50/50' : 'border-[#E5E7EB] hover:border-[#FF6B00]'}`}>
                          <span className="text-2xl">{t.icon}</span>
                          <div>
                            <div className="text-sm font-semibold text-[#111]">{t.label}</div>
                            <div className="text-[11px] text-[#888]">{t.desc}</div>
                          </div>
                          {integrationType === t.key && <span className="ml-auto text-[#FF6B00] text-lg">✓</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Capabilities */}
              {formStep === 1 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-[#555]">Чадамж сонгох</label>
                    <span className="text-[10px] text-[#FF6B00] font-bold">{selectedCapabilities.size} сонгосон</span>
                  </div>
                  {CAPABILITIES.map(cap => {
                    const isSelected = selectedCapabilities.has(cap.key)
                    return (
                      <div key={cap.key} onClick={() => toggleCapability(cap.key)}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-current bg-opacity-5' : 'border-[#E5E7EB] hover:border-current'}`}
                        style={isSelected ? { borderColor: cap.color, background: cap.color + '08' } : {}}>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: cap.color + '15' }}>{cap.icon}</div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-[#111]">{cap.label}</div>
                          <div className="text-[11px] text-[#888]">{cap.desc}</div>
                          <div className="text-[10px] text-[#BBB] mt-0.5">{cap.events.length} event</div>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs flex-shrink-0 ${isSelected ? 'text-white' : 'border-[#D1D5DB]'}`}
                          style={isSelected ? { background: cap.color, borderColor: cap.color } : {}}>
                          {isSelected ? '✓' : ''}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Step 2: Events (filtered by capabilities) */}
              {formStep === 2 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-[#555]">Event бүртгэл</label>
                    <span className="text-[10px] text-[#FF6B00] font-bold">{selectedEvents.size} event</span>
                  </div>
                  {filteredEvents.length === 0 && (
                    <div className="text-center py-8 text-[#999] text-sm">
                      <div className="text-3xl mb-2">📋</div>
                      Эхлээд чадамж сонгоно уу (Алхам 2)
                    </div>
                  )}
                  {filteredEvents.map(cap => {
                    const allSelected = cap.events.every(e => selectedEvents.has(e.key))
                    return (
                      <div key={cap.key} className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer" style={{ background: cap.color + '08' }}
                          onClick={() => {
                            const keys = cap.events.map(e => e.key)
                            setSelectedEvents(prev => {
                              const n = new Set(prev)
                              if (allSelected) keys.forEach(k => n.delete(k))
                              else keys.forEach(k => n.add(k))
                              return n
                            })
                          }}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${allSelected ? 'text-white' : ''}`}
                              style={allSelected ? { background: cap.color, borderColor: cap.color } : { borderColor: '#D1D5DB' }}>
                              {allSelected ? '✓' : ''}
                            </div>
                            <span className="text-sm font-bold text-[#111]">{cap.icon} {cap.label}</span>
                          </div>
                          <span className="text-[10px] text-[#999]">{cap.events.filter(e => selectedEvents.has(e.key)).length} / {cap.events.length}</span>
                        </div>
                        <div className="px-4 py-2 space-y-0.5">
                          {cap.events.map(ev => (
                            <label key={ev.key} className="flex items-center gap-2 py-1.5 px-1 -mx-1 rounded cursor-pointer hover:bg-[#FAFAFA]">
                              <input type="checkbox" checked={selectedEvents.has(ev.key)} onChange={() => toggleEvent(ev.key)}
                                className="w-3.5 h-3.5 rounded accent-[#FF6B00]" />
                              <span className="text-xs text-[#333] flex-1">{ev.label}</span>
                              <span className="text-[10px] text-[#CCC] font-mono">{ev.key}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Step 3: Endpoint Config */}
              {formStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#555] mb-1 block">Endpoint URL *</label>
                    <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://api.example.mn/webhook"
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm font-mono outline-none focus:border-[#FF6B00]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#555] mb-1 block">Secret key (HMAC SHA256)</label>
                    <input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder="whsec_..."
                      className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#555] mb-1 block">Timeout (сек)</label>
                      <input type="number" min={1} max={30} value={timeout_} onChange={e => setTimeout_(Number(e.target.value))}
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#555] mb-1 block">Max retries</label>
                      <input type="number" min={0} max={20} value={maxRetries} onChange={e => setMaxRetries(Number(e.target.value))}
                        className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm outline-none focus:border-[#FF6B00]" />
                    </div>
                  </div>
                  {/* Summary */}
                  <div className="bg-[#111] rounded-xl p-4 text-xs">
                    <div className="text-[#888] font-mono mb-2">// Delivery config summary</div>
                    <div className="space-y-1 text-[#CCC] font-mono">
                      <div>Type: <span className="text-amber-300">{integrationType}</span></div>
                      <div>Capabilities: <span className="text-emerald-300">{selectedCapabilities.size}</span></div>
                      <div>Events: <span className="text-blue-300">{selectedEvents.size}</span></div>
                      <div>Retry: <span className="text-amber-300">exponential backoff × {maxRetries}</span></div>
                      <div>Timeout: <span className="text-amber-300">{timeout_}s</span></div>
                      <div>Security: <span className="text-emerald-300">{secret ? 'HMAC SHA256 ✓' : 'none'}</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#888]">
                    <span className="font-mono bg-[#F3F4F6] px-2 py-0.5 rounded text-[10px]">X-BizPrint-Signature: sha256=...</span>
                    <span className="font-mono bg-[#F3F4F6] px-2 py-0.5 rounded text-[10px]">X-BizPrint-Timestamp: ...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#E5E7EB] flex justify-between flex-shrink-0">
              <button onClick={() => formStep > 0 ? setFormStep(formStep - 1) : resetForm()}
                className="px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm font-medium text-[#555] hover:bg-[#F8F8F8]">
                {formStep > 0 ? '← Өмнөх' : 'Болих'}
              </button>
              {formStep < STEPS.length - 1 ? (
                <button onClick={() => setFormStep(formStep + 1)}
                  className="px-6 py-2.5 bg-[#FF6B00] hover:bg-[#E55D00] text-white rounded-lg text-sm font-bold transition-colors">
                  Дараах →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={!name.trim() || !url.trim()}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${name.trim() && url.trim() ? 'bg-[#FF6B00] hover:bg-[#E55D00] text-white' : 'bg-[#E5E7EB] text-[#999]'}`}>
                  {editing ? '✓ Хадгалах' : '✓ Бүртгэх'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* API & Payload Docs */}
      <div className="mt-8 bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-bold text-[#111]">📖 Event Payload Schema</h3>
        </div>
        <div className="p-5">
          <div className="bg-[#111] rounded-xl p-5 text-xs font-mono text-emerald-400 leading-relaxed overflow-x-auto">
            <div className="text-[#666]">// Бүх event-д хамаарах payload бүтэц:</div>
            <div className="text-white mt-1">{'{'}</div>
            <div className="pl-4">"event": <span className="text-amber-300">"order.confirmed"</span>,</div>
            <div className="pl-4">"version": <span className="text-amber-300">"1.0"</span>,</div>
            <div className="pl-4">"timestamp": <span className="text-amber-300">"2026-03-23T10:30:00Z"</span>,</div>
            <div className="pl-4">"capability": <span className="text-amber-300">"order_lifecycle"</span>,</div>
            <div className="pl-4">"data": {'{'}</div>
            <div className="pl-8">"order_id": <span className="text-amber-300">"uuid-..."</span>,</div>
            <div className="pl-8">"customer_id": <span className="text-amber-300">"uuid-..."</span>,</div>
            <div className="pl-8">"total_price": <span className="text-blue-300">150000</span>,</div>
            <div className="pl-8">"product_name": <span className="text-amber-300">"Нэрийн хуудас"</span></div>
            <div className="pl-4">{'}'}</div>
            <div className="text-white">{'}'}</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#F8F8F8] rounded-lg p-3">
              <div className="font-bold text-[#111] mb-1">🔑 Security Headers</div>
              <div className="font-mono text-[10px] text-[#666] space-y-0.5">
                <div>X-BizPrint-Signature: sha256=abc...</div>
                <div>X-BizPrint-Timestamp: 1711181400</div>
                <div>X-BizPrint-Event: order.confirmed</div>
                <div>X-BizPrint-Version: 1.0</div>
              </div>
            </div>
            <div className="bg-[#F8F8F8] rounded-lg p-3">
              <div className="font-bold text-[#111] mb-1">🔄 Retry Policy</div>
              <div className="text-[11px] text-[#666] space-y-0.5">
                <div>Exponential backoff: 1s → 2s → 4s → 8s</div>
                <div>Max attempts: тохируулах боломжтой</div>
                <div>10+ алдааны дараа автоматаар зогсоно</div>
                <div>Dead letter queue хадгалагдана</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
