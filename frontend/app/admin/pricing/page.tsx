'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PricingRule {
  id: string
  name: string
  product_code: string | null
  rule_type: string
  condition_field: string
  condition_operator: string
  condition_value: number
  condition_value2: number | null
  effect_type: string
  effect_value: number
  priority: number
  is_active: boolean
  description: string | null
  created_at: string
}

interface PricingTier {
  id: string
  code: string
  name_mn: string
  margin_rate: number
  min_order_amount: number
  description: string | null
  is_active: boolean
}

interface CompetitorPrice {
  id: string
  factory_name: string
  product_type: string
  product_subtype: string | null
  size: string | null
  gsm: number | null
  quantity_min: number
  quantity_max: number | null
  unit_price: number
  total_price: number | null
  date_collected: string | null
  notes: string | null
  is_active: boolean
  // backward compat
  competitor_name?: string
  product_code?: string
  price?: number
  updated_at: string
}

interface SimulationResult {
  tier: string
  tier_name: string
  margin_rate: number
  base_price: number
  discounts: { name: string; amount: number }[]
  surcharges: { name: string; amount: number }[]
  margin_amount: number
  final_price: number
  unit_price: number
  rules_applied: { rule_name: string; rule_type: string; effect: string; amount: number }[]
  finishing_cost: number
  addon_cost: number
  subtotal: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API = 'http://localhost:4000'
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"

const TABS = ['Үнийн дүрэм', 'Үнийн горим (Tier)', 'Simulation', 'Өрсөлдөгчийн үнэ'] as const
type Tab = (typeof TABS)[number]

const RULE_TYPES = [
  { value: 'QUANTITY_DISCOUNT', label: 'Тоо хэмжээний хөнгөлөлт' },
  { value: 'RUSH_FEE', label: 'Яаралтай нэмэгдэл' },
  { value: 'SIZE_FACTOR', label: 'Хэмжээний коэффициент' },
  { value: 'MATERIAL_FACTOR', label: 'Материалын коэффициент' },
  { value: 'COMPETITOR_TACTIC', label: 'Өрсөлдөгчийн тактик' },
]

const OPERATORS = [
  { value: 'GTE', label: '>=' },
  { value: 'LTE', label: '<=' },
  { value: 'EQ', label: '=' },
  { value: 'BETWEEN', label: 'Хооронд' },
]

const EFFECT_TYPES = [
  { value: 'MULTIPLY', label: 'Үржүүлэх (×)' },
  { value: 'ADD', label: 'Нэмэх (+)' },
  { value: 'SUBTRACT', label: 'Хасах (-)' },
  { value: 'SET_MAX', label: 'Дээд хязгаар' },
  { value: 'SET_MIN', label: 'Доод хязгаар' },
]

const COMPETITOR_NAMES = ['Гангар', 'Омо гүн', 'Өрсөлдөгч 3', 'Өрсөлдөгч 4', 'Өрсөлдөгч 5']
const COMP_PRODUCT_TYPES = [
  { value: 'offset', label: 'Офсет хэвлэл' },
  { value: 'wide', label: 'Өргөн хэвлэл' },
  { value: 'sign', label: 'Хаяг реклам' },
]
const COMP_SUBTYPES: Record<string, string[]> = {
  offset: ['Нэрийн хуудас', 'Флаер', 'Боршур', 'Постер', 'Ном', 'Каталог', 'Клендар', 'Меню'],
  wide: ['banner', 'sticker', 'flag', 'canvas'],
  sign: ['tovgor', 'nerj', 'd3', 'sambar', 'pvc', 'epoxy', 'font', 'tmr'],
}
const COMP_SIZES: Record<string, string[]> = {
  offset: ['A6', 'A5', 'A4', 'A3', 'BC'],
  sign: ['20cm', '30cm', '40cm', '50cm', '60cm', '70cm', '80cm', '90cm', '100cm'],
}

const PRODUCT_CODES = [
  'BANNER_VINYL',
  'BANNER_MESH',
  'BANNER_BACKLIT',
  'STICKER_VINYL',
  'STICKER_ONEWAYVISION',
  'CANVAS',
  'POSTER',
  'NAMECARD',
  'BROCHURE',
  'FLYER',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('access_token') || localStorage.getItem('token') || ''
}

function fmt(n: number) {
  return new Intl.NumberFormat('mn-MN').format(Math.round(n))
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: authHeaders(), ...opts })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

// ─── Shared Styles ───────────────────────────────────────────────────────────

const s = {
  page: {
    padding: '28px 32px',
    fontFamily: FONT,
    color: 'var(--text)',
    minHeight: '100vh',
  } as React.CSSProperties,
  h1: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 20,
    color: 'var(--text)',
  } as React.CSSProperties,
  tabBar: {
    display: 'flex',
    gap: 0,
    borderBottom: '2px solid var(--border)',
    marginBottom: 24,
  } as React.CSSProperties,
  tab: (active: boolean) =>
    ({
      padding: '10px 20px',
      cursor: 'pointer',
      border: 'none',
      background: 'none',
      fontFamily: FONT,
      fontSize: 14,
      fontWeight: active ? 600 : 400,
      color: active ? '#FF6B00' : 'var(--text3)',
      borderBottom: active ? '2px solid #FF6B00' : '2px solid transparent',
      marginBottom: -2,
      transition: 'all 0.15s',
    }) as React.CSSProperties,
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 13,
  } as React.CSSProperties,
  th: {
    textAlign: 'left' as const,
    padding: '10px 12px',
    borderBottom: '2px solid var(--border)',
    fontWeight: 600,
    fontSize: 12,
    color: 'var(--text3)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  } as React.CSSProperties,
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text)',
  } as React.CSSProperties,
  input: {
    padding: '8px 12px',
    border: '1px solid var(--border)',
    borderRadius: 6,
    background: 'var(--bg)',
    color: 'var(--text)',
    fontFamily: FONT,
    fontSize: 13,
    outline: 'none',
    width: '100%',
  } as React.CSSProperties,
  select: {
    padding: '8px 12px',
    border: '1px solid var(--border)',
    borderRadius: 6,
    background: 'var(--bg)',
    color: 'var(--text)',
    fontFamily: FONT,
    fontSize: 13,
    outline: 'none',
    width: '100%',
  } as React.CSSProperties,
  btnPrimary: {
    padding: '8px 18px',
    background: '#FF6B00',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  btnSuccess: {
    padding: '8px 18px',
    background: '#10B981',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  btnDanger: {
    padding: '6px 14px',
    background: '#EF4444',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  btnOutline: {
    padding: '8px 18px',
    background: 'transparent',
    color: '#FF6B00',
    border: '1px solid #FF6B00',
    borderRadius: 6,
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text3)',
    marginBottom: 4,
  } as React.CSSProperties,
  formGroup: {
    marginBottom: 12,
  } as React.CSSProperties,
  badge: (bg: string, color: string) =>
    ({
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 10,
      fontSize: 11,
      fontWeight: 600,
      background: bg,
      color,
    }) as React.CSSProperties,
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  } as React.CSSProperties,
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 12,
  } as React.CSSProperties,
  grid4: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: 12,
  } as React.CSSProperties,
  toggle: (active: boolean) =>
    ({
      width: 40,
      height: 22,
      borderRadius: 11,
      background: active ? '#10B981' : 'var(--border)',
      position: 'relative' as const,
      cursor: 'pointer',
      border: 'none',
      transition: 'background 0.2s',
    }) as React.CSSProperties,
  toggleDot: (active: boolean) =>
    ({
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: '#fff',
      position: 'absolute' as const,
      top: 3,
      left: active ? 21 : 3,
      transition: 'left 0.2s',
    }) as React.CSSProperties,
}

// ─── Tab 1: Pricing Rules ────────────────────────────────────────────────────

function RulesTab() {
  const [rules, setRules] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    product_code: '',
    rule_type: 'QUANTITY_DISCOUNT',
    condition_field: 'quantity',
    condition_operator: 'GTE',
    condition_value: '',
    condition_value2: '',
    effect_type: 'MULTIPLY',
    effect_value: '',
    priority: '100',
    description: '',
  })
  const [saving, setSaving] = useState(false)

  const loadRules = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiFetch<PricingRule[]>('/pricing-engine/rules')
      setRules(data)
    } catch (e) {
      console.error('Failed to load rules', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRules()
  }, [loadRules])

  const toggleActive = async (rule: PricingRule) => {
    try {
      await apiFetch(`/pricing-engine/rules/${rule.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !rule.is_active }),
      })
      setRules(prev => prev.map(r => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r)))
    } catch (e) {
      console.error('Failed to toggle rule', e)
    }
  }

  const createRule = async () => {
    if (!form.name || !form.condition_value || !form.effect_value) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        product_code: form.product_code || null,
        rule_type: form.rule_type,
        condition_field: form.condition_field,
        condition_operator: form.condition_operator,
        condition_value: parseFloat(form.condition_value),
        condition_value2: form.condition_operator === 'BETWEEN' && form.condition_value2 ? parseFloat(form.condition_value2) : null,
        effect_type: form.effect_type,
        effect_value: parseFloat(form.effect_value),
        priority: parseInt(form.priority) || 100,
        description: form.description || null,
      }
      await apiFetch('/pricing-engine/rules', { method: 'POST', body: JSON.stringify(body) })
      setShowForm(false)
      setForm({
        name: '',
        product_code: '',
        rule_type: 'QUANTITY_DISCOUNT',
        condition_field: 'quantity',
        condition_operator: 'GTE',
        condition_value: '',
        condition_value2: '',
        effect_type: 'MULTIPLY',
        effect_value: '',
        priority: '100',
        description: '',
      })
      loadRules()
    } catch (e) {
      console.error('Failed to create rule', e)
    } finally {
      setSaving(false)
    }
  }

  const ruleTypeLabel = (rt: string) => RULE_TYPES.find(r => r.value === rt)?.label || rt
  const opLabel = (op: string) => OPERATORS.find(o => o.value === op)?.label || op
  const effectLabel = (et: string) => EFFECT_TYPES.find(e => e.value === et)?.label || et

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>Үнийн дүрэм ({rules.length})</h2>
        <button style={s.btnPrimary} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Хаах' : '+ Дүрэм нэмэх'}
        </button>
      </div>

      {showForm && (
        <div style={{ ...s.card, marginBottom: 20, border: '1px solid #FF6B00' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>Шинэ дүрэм нэмэх</h3>
          <div style={s.grid3}>
            <div style={s.formGroup}>
              <label style={s.label}>Нэр *</label>
              <input style={s.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Дүрмийн нэр" />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Бүтээгдэхүүн код</label>
              <select style={s.select} value={form.product_code} onChange={e => setForm(f => ({ ...f, product_code: e.target.value }))}>
                <option value="">Бүгд (сонголтгүй)</option>
                {PRODUCT_CODES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Дүрмийн төрөл *</label>
              <select style={s.select} value={form.rule_type} onChange={e => setForm(f => ({ ...f, rule_type: e.target.value }))}>
                {RULE_TYPES.map(rt => (
                  <option key={rt.value} value={rt.value}>{rt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ ...s.grid4, marginTop: 4 }}>
            <div style={s.formGroup}>
              <label style={s.label}>Нөхцөл талбар</label>
              <input style={s.input} value={form.condition_field} onChange={e => setForm(f => ({ ...f, condition_field: e.target.value }))} placeholder="quantity, rush_hours..." />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Оператор</label>
              <select style={s.select} value={form.condition_operator} onChange={e => setForm(f => ({ ...f, condition_operator: e.target.value }))}>
                {OPERATORS.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Нөхцөл утга *</label>
              <input style={s.input} type="number" value={form.condition_value} onChange={e => setForm(f => ({ ...f, condition_value: e.target.value }))} placeholder="100" />
            </div>
            {form.condition_operator === 'BETWEEN' && (
              <div style={s.formGroup}>
                <label style={s.label}>Нөхцөл утга 2</label>
                <input style={s.input} type="number" value={form.condition_value2} onChange={e => setForm(f => ({ ...f, condition_value2: e.target.value }))} placeholder="500" />
              </div>
            )}
          </div>

          <div style={s.grid3}>
            <div style={s.formGroup}>
              <label style={s.label}>Үйлдэл төрөл *</label>
              <select style={s.select} value={form.effect_type} onChange={e => setForm(f => ({ ...f, effect_type: e.target.value }))}>
                {EFFECT_TYPES.map(et => (
                  <option key={et.value} value={et.value}>{et.label}</option>
                ))}
              </select>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Үйлдэл утга *</label>
              <input style={s.input} type="number" step="0.01" value={form.effect_value} onChange={e => setForm(f => ({ ...f, effect_value: e.target.value }))} placeholder="0.9" />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Эрэмбэ (priority)</label>
              <input style={s.input} type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} placeholder="100" />
            </div>
          </div>

          <div style={s.formGroup}>
            <label style={s.label}>Тайлбар</label>
            <input style={s.input} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Нэмэлт тайлбар..." />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button style={s.btnPrimary} onClick={createRule} disabled={saving}>
              {saving ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>
            <button style={s.btnOutline} onClick={() => setShowForm(false)}>Цуцлах</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Ачаалж байна...</div>
      ) : rules.length === 0 ? (
        <div style={{ ...s.card, textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Дүрэм олдсонгүй</div>
      ) : (
        <div style={{ ...s.card, padding: 0, overflow: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Нэр</th>
                <th style={s.th}>Бүтээгдэхүүн</th>
                <th style={s.th}>Төрөл</th>
                <th style={s.th}>Нөхцөл</th>
                <th style={s.th}>Үйлдэл</th>
                <th style={s.th}>Эрэмбэ</th>
                <th style={s.th}>Идэвхтэй</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id}>
                  <td style={s.td}>
                    <div style={{ fontWeight: 600 }}>{rule.name}</div>
                    {rule.description && <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 2 }}>{rule.description}</div>}
                  </td>
                  <td style={s.td}>
                    <span style={s.badge('var(--surface2)', 'var(--text2)')}>
                      {rule.product_code || 'Бүгд'}
                    </span>
                  </td>
                  <td style={s.td}>{ruleTypeLabel(rule.rule_type)}</td>
                  <td style={s.td}>
                    <code style={{ fontSize: 12, background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4 }}>
                      {rule.condition_field} {opLabel(rule.condition_operator)} {rule.condition_value}
                      {rule.condition_operator === 'BETWEEN' && rule.condition_value2 != null ? ` ~ ${rule.condition_value2}` : ''}
                    </code>
                  </td>
                  <td style={s.td}>
                    <code style={{ fontSize: 12, background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4 }}>
                      {effectLabel(rule.effect_type)} {rule.effect_value}
                    </code>
                  </td>
                  <td style={{ ...s.td, textAlign: 'center' }}>{rule.priority}</td>
                  <td style={s.td}>
                    <button style={s.toggle(rule.is_active)} onClick={() => toggleActive(rule)}>
                      <div style={s.toggleDot(rule.is_active)} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tab 2: Pricing Tiers ────────────────────────────────────────────────────

function TiersTab() {
  const [tiers, setTiers] = useState<PricingTier[]>([])
  const [loading, setLoading] = useState(true)
  const [edits, setEdits] = useState<Record<string, { margin_rate: string; min_order_amount: string }>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const loadTiers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiFetch<PricingTier[]>('/pricing-engine/tiers')
      setTiers(data)
      const e: Record<string, { margin_rate: string; min_order_amount: string }> = {}
      data.forEach(t => {
        e[t.id] = { margin_rate: String(Number(t.margin_rate) * 100), min_order_amount: String(t.min_order_amount) }
      })
      setEdits(e)
    } catch (e) {
      console.error('Failed to load tiers', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTiers()
  }, [loadTiers])

  const saveTier = async (tier: PricingTier) => {
    const edit = edits[tier.id]
    if (!edit) return
    setSavingId(tier.id)
    try {
      const marginDecimal = parseFloat(edit.margin_rate) / 100
      await apiFetch(`/pricing-engine/tiers/${tier.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          margin_rate: marginDecimal,
          min_order_amount: parseFloat(edit.min_order_amount) || 0,
        }),
      })
      loadTiers()
    } catch (e) {
      console.error('Failed to save tier', e)
    } finally {
      setSavingId(null)
    }
  }

  const tierColorMap: Record<string, string> = {
    B2B: '#3B82F6',
    RETAIL: '#FF6B00',
    WHOLESALE: '#10B981',
    VIP: '#8B5CF6',
    PARTNER: '#F59E0B',
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Ачаалж байна...</div>

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>Үнийн горим ({tiers.length})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {tiers.map(tier => {
          const edit = edits[tier.id]
          const accentColor = tierColorMap[tier.code] || '#FF6B00'
          return (
            <div key={tier.id} style={{ ...s.card, borderTop: `3px solid ${accentColor}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <span style={s.badge(accentColor + '20', accentColor)}>{tier.code}</span>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 6, color: 'var(--text)' }}>{tier.name_mn}</h3>
                </div>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: accentColor + '15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  color: accentColor,
                }}>
                  {edit ? edit.margin_rate : Math.round(Number(tier.margin_rate) * 100)}%
                </div>
              </div>

              {tier.description && (
                <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>{tier.description}</p>
              )}

              <div style={s.grid2}>
                <div style={s.formGroup}>
                  <label style={s.label}>Маржин (%)</label>
                  <input
                    style={s.input}
                    type="number"
                    step="1"
                    value={edit?.margin_rate || ''}
                    onChange={e => setEdits(prev => ({ ...prev, [tier.id]: { ...prev[tier.id], margin_rate: e.target.value } }))}
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Доод захиалга (₮)</label>
                  <input
                    style={s.input}
                    type="number"
                    value={edit?.min_order_amount || ''}
                    onChange={e => setEdits(prev => ({ ...prev, [tier.id]: { ...prev[tier.id], min_order_amount: e.target.value } }))}
                  />
                </div>
              </div>

              <button
                style={{ ...s.btnSuccess, width: '100%', marginTop: 8 }}
                onClick={() => saveTier(tier)}
                disabled={savingId === tier.id}
              >
                {savingId === tier.id ? 'Хадгалж байна...' : 'Хадгалах'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab 3: Simulation ───────────────────────────────────────────────────────

function SimulationTab() {
  const [tiers, setTiers] = useState<PricingTier[]>([])
  const [form, setForm] = useState({
    product_code: 'BANNER_VINYL',
    quantity: '100',
    rush_hours: '0',
    pricing_tier: 'RETAIL',
  })
  const [results, setResults] = useState<SimulationResult[] | null>(null)
  const [simulating, setSimulating] = useState(false)

  useEffect(() => {
    apiFetch<PricingTier[]>('/pricing-engine/tiers').then(setTiers).catch(console.error)
  }, [])

  const simulate = async () => {
    setSimulating(true)
    try {
      const body = {
        product_code: form.product_code,
        quantity: parseInt(form.quantity) || 1,
        rush_hours: parseInt(form.rush_hours) || 0,
        pricing_tier: form.pricing_tier,
      }
      const data = await apiFetch<{ simulations: SimulationResult[] }>('/pricing-engine/simulate', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setResults(data.simulations)
    } catch (e) {
      console.error('Simulation failed', e)
    } finally {
      setSimulating(false)
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>Үнэ тооцоолох (Simulation)</h2>

      <div style={{ ...s.card, marginBottom: 20 }}>
        <div style={s.grid4}>
          <div style={s.formGroup}>
            <label style={s.label}>Бүтээгдэхүүн код</label>
            <select style={s.select} value={form.product_code} onChange={e => setForm(f => ({ ...f, product_code: e.target.value }))}>
              {PRODUCT_CODES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Тоо ширхэг</label>
            <input style={s.input} type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Яаралтай (цаг)</label>
            <select style={s.select} value={form.rush_hours} onChange={e => setForm(f => ({ ...f, rush_hours: e.target.value }))}>
              <option value="0">Энгийн (0)</option>
              <option value="24">24 цаг</option>
              <option value="48">48 цаг</option>
            </select>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Үнийн горим</label>
            <select style={s.select} value={form.pricing_tier} onChange={e => setForm(f => ({ ...f, pricing_tier: e.target.value }))}>
              {tiers.map(t => (
                <option key={t.code} value={t.code}>{t.name_mn} ({t.code})</option>
              ))}
              {tiers.length === 0 && <option value="RETAIL">Retail</option>}
            </select>
          </div>
        </div>
        <button style={s.btnPrimary} onClick={simulate} disabled={simulating}>
          {simulating ? 'Тооцоолж байна...' : 'Simulate'}
        </button>
      </div>

      {results && results.length > 0 && (
        <div style={{ ...s.card, padding: 0, overflow: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Горим</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Суурь үнэ</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Хөнгөлөлт</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Нэмэгдэл</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Маржин</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Нийт үнэ</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Нэгж үнэ</th>
                <th style={s.th}>Хэрэгжсэн дүрэм</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => {
                const discountSum = r.discounts?.reduce((acc, d) => acc + d.amount, 0) || 0
                const surchargeSum = r.surcharges?.reduce((acc, su) => acc + su.amount, 0) || 0
                return (
                  <tr key={r.tier}>
                    <td style={s.td}>
                      <div style={{ fontWeight: 600 }}>{r.tier_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text4)' }}>{r.tier} ({Math.round(Number(r.margin_rate) * 100)}%)</div>
                    </td>
                    <td style={{ ...s.td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.base_price)}₮</td>
                    <td style={{ ...s.td, textAlign: 'right', color: discountSum > 0 ? '#10B981' : 'var(--text3)' }}>
                      {discountSum > 0 ? `-${fmt(discountSum)}₮` : '-'}
                    </td>
                    <td style={{ ...s.td, textAlign: 'right', color: surchargeSum > 0 ? '#EF4444' : 'var(--text3)' }}>
                      {surchargeSum > 0 ? `+${fmt(surchargeSum)}₮` : '-'}
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }}>{fmt(r.margin_amount)}₮</td>
                    <td style={{ ...s.td, textAlign: 'right', fontWeight: 700, color: '#FF6B00' }}>{fmt(r.final_price)}₮</td>
                    <td style={{ ...s.td, textAlign: 'right' }}>{fmt(r.unit_price)}₮</td>
                    <td style={s.td}>
                      {r.rules_applied && r.rules_applied.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {r.rules_applied.map((ra, i) => (
                            <span key={i} style={s.badge('#FFF7ED', '#C2410C')}>
                              {ra.rule_name} ({ra.effect})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text4)', fontSize: 12 }}>-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {results && results.length === 0 && (
        <div style={{ ...s.card, textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Үр дүн олдсонгүй</div>
      )}
    </div>
  )
}

// ─── Tab 4: Competitor Prices ────────────────────────────────────────────────

function CompetitorTab() {
  const [competitors, setCompetitors] = useState<CompetitorPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('offset')
  const [saving, setSaving] = useState(false)

  // Form state
  const [fFactory, setFFactory] = useState('')
  const [fType, setFType] = useState('offset')
  const [fSubtype, setFSubtype] = useState('')
  const [fSize, setFSize] = useState('')
  const [fGsm, setFGsm] = useState('')
  const [fQtyMin, setFQtyMin] = useState('1')
  const [fQtyMax, setFQtyMax] = useState('')
  const [fUnitPrice, setFUnitPrice] = useState('')
  const [fTotalPrice, setFTotalPrice] = useState('')
  const [fNotes, setFNotes] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const comps = await apiFetch<CompetitorPrice[]>('/pricing-engine/competitors')
      setCompetitors(comps)
    } catch (e) {
      console.error('Failed to load competitor data', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const savePrice = async () => {
    if (!fFactory || !fUnitPrice) return
    setSaving(true)
    try {
      await apiFetch('/pricing-engine/competitors', {
        method: 'POST',
        body: JSON.stringify({
          factory_name: fFactory,
          product_type: fType,
          product_subtype: fSubtype || null,
          size: fSize || null,
          gsm: fGsm ? Number(fGsm) : null,
          quantity_min: Number(fQtyMin) || 1,
          quantity_max: fQtyMax ? Number(fQtyMax) : null,
          unit_price: parseFloat(fUnitPrice),
          total_price: fTotalPrice ? parseFloat(fTotalPrice) : null,
          notes: fNotes || null,
          date_collected: new Date().toISOString().split('T')[0],
          is_active: true,
        }),
      })
      setFFactory(''); setFSubtype(''); setFSize(''); setFGsm(''); setFQtyMin('1'); setFQtyMax(''); setFUnitPrice(''); setFTotalPrice(''); setFNotes('')
      loadData()
    } catch (e) {
      console.error('Failed to save competitor price', e)
    } finally {
      setSaving(false)
    }
  }

  const deletePrice = async (id: string) => {
    try {
      await apiFetch(`/pricing-engine/competitors/${id}`, { method: 'DELETE' })
      loadData()
    } catch (e) {
      console.error('Failed to delete', e)
    }
  }

  const toggleActive = async (cp: CompetitorPrice) => {
    try {
      await apiFetch(`/pricing-engine/competitors/${cp.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !cp.is_active }),
      })
      loadData()
    } catch (e) {
      console.error('Failed to toggle', e)
    }
  }

  const filtered = competitors.filter(c => c.product_type === filterType)
  const factories = [...new Set(competitors.map(c => c.factory_name).filter(Boolean))]

  // Group by subtype for summary
  const subtypeGroups = [...new Set(filtered.map(c => c.product_subtype).filter(Boolean))]
  const summaryRows = subtypeGroups.map(sub => {
    const items = filtered.filter(c => c.product_subtype === sub && c.is_active)
    const prices = items.map(c => Number(c.unit_price))
    const avg = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0
    const min = prices.length > 0 ? Math.min(...prices) : 0
    const max = prices.length > 0 ? Math.max(...prices) : 0
    return { subtype: sub, count: items.length, avg, min, max }
  })

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Ачаалж байна...</div>

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>Өрсөлдөгчийн үнэ</h2>

      {/* Type filter tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 20 }}>
        {COMP_PRODUCT_TYPES.map(t => (
          <button key={t.value} onClick={() => setFilterType(t.value)} style={{
            padding: '8px 16px', cursor: 'pointer', border: 'none', background: 'none', fontFamily: FONT, fontSize: 13,
            fontWeight: filterType === t.value ? 600 : 400, color: filterType === t.value ? '#FF6B00' : 'var(--text3)',
            borderBottom: filterType === t.value ? '2px solid #FF6B00' : '2px solid transparent', marginBottom: -2,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Summary cards */}
      {summaryRows.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          {summaryRows.map(row => (
            <div key={row.subtype} style={{ ...s.card, flex: '1 1 200px', minWidth: 180 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{row.subtype}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 2 }}>Дундаж: <b style={{ color: '#FF6B00' }}>{fmt(row.avg)}₮</b></div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 2 }}>Хамгийн бага: {fmt(row.min)}₮</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 2 }}>Хамгийн их: {fmt(row.max)}₮</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{row.count} мэдээлэл</div>
            </div>
          ))}
        </div>
      )}

      {/* Add price form */}
      <div style={{ ...s.card, marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>Шинэ үнийн мэдээлэл нэмэх</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ flex: '1 1 180px' }}>
            <label style={s.label}>Үйлдвэрийн нэр *</label>
            <input style={s.input} value={fFactory} onChange={e => setFFactory(e.target.value)} placeholder="Гангар принт" list="factory-list" />
            <datalist id="factory-list">{factories.map(f => <option key={f} value={f} />)}</datalist>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={s.label}>Төрөл</label>
            <select style={s.select} value={fType} onChange={e => { setFType(e.target.value); setFSubtype(''); setFSize('') }}>
              {COMP_PRODUCT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={s.label}>Дэд ангилал</label>
            <select style={s.select} value={fSubtype} onChange={e => setFSubtype(e.target.value)}>
              <option value="">Сонгох...</option>
              {(COMP_SUBTYPES[fType] || []).map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
          {COMP_SIZES[fType] && (
            <div style={{ flex: '1 1 120px' }}>
              <label style={s.label}>Хэмжээ</label>
              <select style={s.select} value={fSize} onChange={e => setFSize(e.target.value)}>
                <option value="">Бүгд</option>
                {COMP_SIZES[fType].map(sz => <option key={sz} value={sz}>{sz}</option>)}
              </select>
            </div>
          )}
          {fType === 'offset' && (
            <div style={{ flex: '1 1 100px' }}>
              <label style={s.label}>GSM</label>
              <input style={s.input} type="number" value={fGsm} onChange={e => setFGsm(e.target.value)} placeholder="130" />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 100px' }}>
            <label style={s.label}>Тоо (мин)</label>
            <input style={s.input} type="number" value={fQtyMin} onChange={e => setFQtyMin(e.target.value)} />
          </div>
          <div style={{ flex: '1 1 100px' }}>
            <label style={s.label}>Тоо (макс)</label>
            <input style={s.input} type="number" value={fQtyMax} onChange={e => setFQtyMax(e.target.value)} placeholder="∞" />
          </div>
          <div style={{ flex: '1 1 130px' }}>
            <label style={s.label}>Нэгж үнэ (₮) *</label>
            <input style={s.input} type="number" value={fUnitPrice} onChange={e => setFUnitPrice(e.target.value)} placeholder="15000" />
          </div>
          <div style={{ flex: '1 1 130px' }}>
            <label style={s.label}>Нийт үнэ (₮)</label>
            <input style={s.input} type="number" value={fTotalPrice} onChange={e => setFTotalPrice(e.target.value)} placeholder="" />
          </div>
          <div style={{ flex: '2 1 200px' }}>
            <label style={s.label}>Тэмдэглэл</label>
            <input style={s.input} value={fNotes} onChange={e => setFNotes(e.target.value)} placeholder="Нэмэлт мэдээлэл" />
          </div>
          <button style={s.btnPrimary} onClick={savePrice} disabled={saving}>
            {saving ? 'Хадгалж...' : 'Нэмэх'}
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div style={{ ...s.card, padding: 0, overflow: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Үйлдвэр</th>
                <th style={s.th}>Бүтээгдэхүүн</th>
                <th style={s.th}>Хэмжээ</th>
                <th style={s.th}>GSM</th>
                <th style={s.th}>Тоо хэмжээ</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Нэгж үнэ</th>
                <th style={s.th}>Огноо</th>
                <th style={s.th}>Идэвхтэй</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(cp => (
                <tr key={cp.id} style={{ opacity: cp.is_active ? 1 : 0.5 }}>
                  <td style={s.td}><span style={{ fontWeight: 600 }}>{cp.factory_name}</span></td>
                  <td style={s.td}><span style={s.badge('var(--surface2)', 'var(--text2)')}>{cp.product_subtype || '-'}</span></td>
                  <td style={s.td}>{cp.size || '-'}</td>
                  <td style={s.td}>{cp.gsm || '-'}</td>
                  <td style={s.td}>{cp.quantity_min}{cp.quantity_max ? `-${cp.quantity_max}` : '+'}</td>
                  <td style={{ ...s.td, textAlign: 'right', fontWeight: 600 }}>{fmt(Number(cp.unit_price))}₮</td>
                  <td style={{ ...s.td, fontSize: 12, color: 'var(--text3)' }}>
                    {cp.date_collected ? new Date(cp.date_collected).toLocaleDateString('mn-MN') : '-'}
                  </td>
                  <td style={s.td}>
                    <button onClick={() => toggleActive(cp)} style={{
                      border: 'none', background: cp.is_active ? '#22c55e' : 'var(--surface3)', color: '#fff',
                      borderRadius: 12, padding: '2px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600,
                    }}>{cp.is_active ? 'Тийм' : 'Үгүй'}</button>
                  </td>
                  <td style={s.td}>
                    <button onClick={() => deletePrice(cp.id)} style={{
                      border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                      borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 600,
                    }}>Устгах</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ ...s.card, textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
          Өрсөлдөгчийн үнэ бүртгэгдээгүй байна
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminPricingPage() {
  const [tab, setTab] = useState<Tab>('Үнийн дүрэм')

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Үнийн удирдлага</h1>

      <div style={s.tabBar}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={s.tab(tab === t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Үнийн дүрэм' && <RulesTab />}
      {tab === 'Үнийн горим (Tier)' && <TiersTab />}
      {tab === 'Simulation' && <SimulationTab />}
      {tab === 'Өрсөлдөгчийн үнэ' && <CompetitorTab />}
    </div>
  )
}
