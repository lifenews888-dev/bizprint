'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

interface QuoteConfig {
  id?: string
  product_type: string
  name_mn: string
  icon: string
  base_rate: number
  double_side_multiplier: number
  overhead_rate: number
  platform_rate: number
  ink_cost_per_500: number
  finishing_cost_each: number
  sizes: Array<{ label: string; w: number; h: number }>
  materials: string[]
  materials_mn?: string[]
  finishing_options: string[]
  finishing_options_mn?: string[]
  min_qty: number
  is_active: boolean
  sort_order: number
  volume_discounts: Array<{ min_qty: number; discount_percent: number }>
}

interface SeedQuoteConfigResponse {
  seeded?: number
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : ''
}

export default function AdminQuoteConfigPage() {
  const [configs, setConfigs] = useState<QuoteConfig[]>([])
  const [selected, setSelected] = useState<QuoteConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<QuoteConfig[]>('/cms/quote-config', { auth: false })
      setConfigs(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const seed = async () => {
    try {
      const res = await apiFetch<SeedQuoteConfigResponse>('/cms/quote-config/seed')
      alert(`${res?.seeded || 0} төрөл нэмэгдлээ`)
      load()
    } catch (e: unknown) {
      alert('Алдаа: ' + errorMessage(e))
    }
  }

  const save = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await apiFetch(`/cms/quote-config/${selected.product_type}`, {
        method: 'PUT',
        body: { ...selected } as Record<string, unknown>,
      })
      await load()
      alert('Хадгалагдлаа ✅')
    } catch (e: unknown) {
      alert('Алдаа: ' + errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const upd = <K extends keyof QuoteConfig>(key: K, val: QuoteConfig[K]) =>
    setSelected(p => p ? { ...p, [key]: val } : p)

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Тооцоолуурын үнэ тохиргоо</h1>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Instant Quote тооцоолуурын үнэ, материал, размер</p>
        </div>
        <button onClick={seed} style={{ padding: '8px 16px', border: '1px solid #FF6B00', background: 'transparent', color: '#FF6B00', borderRadius: 10, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
          + Seed анхны өгөгдөл
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Ачааллаж байна...</div>
      ) : configs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: 36, marginBottom: 8 }}>💰</p>
          <p style={{ color: 'var(--text3)', marginBottom: 16 }}>Тохиргоо байхгүй байна</p>
          <button onClick={seed} style={{ padding: '10px 20px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Seed ажиллуулах
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
          {/* Left: product list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {configs.map(c => (
              <button key={c.product_type} onClick={() => setSelected({ ...c })}
                style={{
                  padding: '12px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                  border: selected?.product_type === c.product_type ? '1.5px solid #FF6B00' : '1px solid var(--border)',
                  background: selected?.product_type === c.product_type ? 'rgba(255,107,0,0.08)' : 'var(--surface)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: selected?.product_type === c.product_type ? '#FF6B00' : 'var(--text)' }}>
                    {c.name_mn}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {Number(c.base_rate).toLocaleString()}₮ · мин {c.min_qty}ш
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Right: edit form */}
          <div>
            {!selected ? (
              <div style={{ padding: 48, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 16, color: 'var(--text3)' }}>
                Зүүн талаас бүтээгдэхүүн сонгоно уу
              </div>
            ) : (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>
                  {selected.icon} {selected.name_mn}
                </h2>

                {/* Pricing inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  {([
                    { k: 'base_rate', label: 'Base rate (₮)' },
                    { k: 'min_qty', label: 'Хамгийн бага тираж' },
                    { k: 'double_side_multiplier', label: '2 тал үржүүлэгч', step: 0.01 },
                    { k: 'overhead_rate', label: 'Overhead (0-1)', step: 0.01 },
                    { k: 'platform_rate', label: 'Platform % (0-1)', step: 0.01 },
                    { k: 'ink_cost_per_500', label: 'Бэхний зардал/500ш' },
                    { k: 'finishing_cost_each', label: 'Finishing/сонголт' },
                    { k: 'sort_order', label: 'Эрэмбэ' },
                  ] as const).map(f => (
                    <div key={f.k}>
                      <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>{f.label}</label>
                      <input type="number" step={'step' in f ? f.step : 1}
                        value={selected[f.k] ?? ''}
                        onChange={e => upd(f.k, parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </div>

                {/* Materials — internal key + Mongolian label side by side */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>
                    Материал (зүүн: дотоод нэр, баруун: монгол орчуулга — мөр бүр нэг)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <textarea rows={5} value={selected.materials?.join('\n') || ''}
                      onChange={e => upd('materials', e.target.value.split('\n').filter(Boolean))}
                      placeholder="Glossy 170gsm"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', outline: 'none', resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box' }} />
                    <textarea rows={5} value={selected.materials_mn?.join('\n') || ''}
                      onChange={e => upd('materials_mn', e.target.value.split('\n').filter(Boolean))}
                      placeholder="Гялгар 170гр"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', outline: 'none', resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box' }} />
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
                    Зүүн талын мөр бүр баруун талын мөртэй тохирох ёстой
                  </p>
                </div>

                {/* Finishing options — same paired layout */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>
                    Finishing сонголтууд (зүүн: дотоод нэр, баруун: монгол орчуулга)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <textarea rows={4} value={selected.finishing_options?.join('\n') || ''}
                      onChange={e => upd('finishing_options', e.target.value.split('\n').filter(Boolean))}
                      placeholder="Soft-touch"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', outline: 'none', resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box' }} />
                    <textarea rows={4} value={selected.finishing_options_mn?.join('\n') || ''}
                      onChange={e => upd('finishing_options_mn', e.target.value.split('\n').filter(Boolean))}
                      placeholder="Зөөлөн мэдрэмж (Soft-touch)"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', outline: 'none', resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box' }} />
                  </div>
                </div>

                {/* Volume discounts */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>
                    Тиражийн хямдрал
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(selected.volume_discounts || []).map((d, i) => (
                      <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input type="number" placeholder="Хамгийн бага" value={d.min_qty}
                          onChange={e => {
                            const nd = [...selected.volume_discounts]
                            nd[i] = { ...nd[i], min_qty: +e.target.value }
                            upd('volume_discounts', nd)
                          }}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', outline: 'none' }} />
                        <input type="number" placeholder="Хямдрал %" value={d.discount_percent}
                          onChange={e => {
                            const nd = [...selected.volume_discounts]
                            nd[i] = { ...nd[i], discount_percent: +e.target.value }
                            upd('volume_discounts', nd)
                          }}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', outline: 'none' }} />
                        <button onClick={() => upd('volume_discounts', selected.volume_discounts.filter((_, j) => j !== i))}
                          style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#EF4444', fontSize: 11, cursor: 'pointer' }}>
                          ✕
                        </button>
                      </div>
                    ))}
                    <button onClick={() => upd('volume_discounts', [...(selected.volume_discounts || []), { min_qty: 500, discount_percent: 10 }])}
                      style={{ padding: '6px 0', background: 'none', border: 'none', color: '#FF6B00', fontSize: 11, cursor: 'pointer', textAlign: 'left' }}>
                      + Хямдрал нэмэх
                    </button>
                  </div>
                </div>

                {/* Save */}
                <button onClick={save} disabled={saving}
                  style={{ width: '100%', padding: '12px 0', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
                  {saving ? 'Хадгалж байна...' : '💾 Хадгалах'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
