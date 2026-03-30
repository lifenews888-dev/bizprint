'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const O = '#FF6B00'

const TIERS = ['free', 'pro', 'business', 'enterprise']
const TIER_COLORS: Record<string, string> = { free: '#6B7280', pro: '#2563EB', business: '#7C3AED', enterprise: '#059669' }

const LIMIT_FIELDS = [
  { key: 'max_qr_codes', label: 'QR код', icon: '📱' },
  { key: 'max_invitations', label: 'Урилга', icon: '💌' },
  { key: 'max_product_qrs', label: 'Бүтээгдэхүүн QR', icon: '📦' },
  { key: 'max_digital_cards', label: 'Дижитал карт', icon: '💳' },
  { key: 'max_loyalty_campaigns', label: 'Loyalty кампанит', icon: '⭐' },
  { key: 'max_storage_mb', label: 'Хадгалах зай (MB)', icon: '💾' },
  { key: 'max_team_members', label: 'Баг гишүүн', icon: '👥' },
]

const FEATURE_FIELDS = [
  { key: 'loyalty_enabled', label: 'Loyalty систем' },
  { key: 'qr_campaign_enabled', label: 'QR кампанит' },
  { key: 'custom_domain', label: 'Тусгай домэйн' },
  { key: 'remove_branding', label: 'Брэнд арилгах' },
  { key: 'advanced_analytics', label: 'Нарийвчилсан аналитик' },
  { key: 'priority_support', label: 'Тэргүүлэх дэмжлэг' },
  { key: 'ai_content_generation', label: 'AI контент' },
  { key: 'team_members', label: 'Баг гишүүд' },
]

const EMPTY_PLAN = {
  slug: '', name: '', description: '', tier: 'pro',
  price_monthly: 0, price_yearly: 0,
  max_digital_cards: 1, max_invitations: 0, max_product_qrs: 0, max_qr_codes: 5, max_loyalty_campaigns: 0, max_storage_mb: 50, max_team_members: 1,
  loyalty_enabled: false, qr_campaign_enabled: false,
  custom_domain: false, remove_branding: false, advanced_analytics: false, priority_support: false, ai_content_generation: false, team_members: false,
  features_list: [], is_active: true, is_popular: false, sort_order: 0,
}

export default function AdminPlanManagement() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null) // null=list, object=editing
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [featureInput, setFeatureInput] = useState({ name: '', included: true })

  const show = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  const load = () => {
    setLoading(true)
    apiFetch('/admin/subscription-plans')
      .then((d: any) => setPlans(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleSave = async () => {
    if (!editing.name || !editing.slug) { show('Нэр, slug шаардлагатай'); return }
    setSaving(true)
    try {
      if (editing.id) {
        await apiFetch(`/admin/subscription-plans/${editing.id}`, { method: 'PATCH', body: editing })
        show('Багц шинэчлэгдлээ ✓')
      } else {
        await apiFetch('/admin/subscription-plans', { method: 'POST', body: editing })
        show('Багц үүсгэгдлээ ✓')
      }
      setEditing(null)
      load()
    } catch (err: any) { show(err.message || 'Алдаа') }
    setSaving(false)
  }

  const handleToggle = async (id: string) => {
    await apiFetch(`/admin/subscription-plans/${id}/toggle`, { method: 'POST' })
    load()
  }

  const addFeature = () => {
    if (!featureInput.name) return
    setEditing((e: any) => ({
      ...e,
      features_list: [...(e.features_list || []), { ...featureInput }],
    }))
    setFeatureInput({ name: '', included: true })
  }

  const removeFeature = (idx: number) => {
    setEditing((e: any) => ({
      ...e,
      features_list: e.features_list.filter((_: any, i: number) => i !== idx),
    }))
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: F, color: '#9CA3AF' }}>Ачааллаж байна...</div>

  // ═══ EDITING VIEW ═══
  if (editing) {
    return (
      <div style={{ padding: 24, fontFamily: F, maxWidth: 800, margin: '0 auto' }}>
        {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1F2937', color: '#fff', padding: '10px 28px', borderRadius: 99, fontSize: 14, fontWeight: 500, zIndex: 9999 }}>{toast}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', color: O, fontSize: 14, cursor: 'pointer', fontFamily: F, marginBottom: 4 }}>← Буцах</button>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{editing.id ? 'Багц засах' : 'Шинэ багц'}</h1>
          </div>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 28px', background: O, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: F, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
        </div>

        {/* Basic info */}
        <Section title="Үндсэн мэдээлэл">
          <Grid>
            <Field label="Нэр *" value={editing.name} onChange={v => setEditing({ ...editing, name: v })} />
            <Field label="Slug *" value={editing.slug} onChange={v => setEditing({ ...editing, slug: v })} placeholder="жиш: pro" />
            <div>
              <label style={lbl}>Tier</label>
              <select value={editing.tier} onChange={e => setEditing({ ...editing, tier: e.target.value })} style={inp}>
                {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Field label="Эрэмбэ" value={editing.sort_order} onChange={v => setEditing({ ...editing, sort_order: Number(v) })} type="number" />
          </Grid>
          <div style={{ marginTop: 12 }}>
            <Field label="Тайлбар" value={editing.description || ''} onChange={v => setEditing({ ...editing, description: v })} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <Toggle label="Идэвхтэй" checked={editing.is_active} onChange={v => setEditing({ ...editing, is_active: v })} />
            <Toggle label="Хамгийн түгээмэл" checked={editing.is_popular} onChange={v => setEditing({ ...editing, is_popular: v })} />
          </div>
        </Section>

        {/* Pricing */}
        <Section title="Үнэ (MNT)">
          <Grid>
            <Field label="Сарын үнэ" value={editing.price_monthly} onChange={v => setEditing({ ...editing, price_monthly: Number(v) })} type="number" />
            <Field label="Жилийн үнэ" value={editing.price_yearly} onChange={v => setEditing({ ...editing, price_yearly: Number(v) })} type="number" />
          </Grid>
          {editing.price_monthly > 0 && editing.price_yearly > 0 && (
            <div style={{ fontSize: 12, color: '#10B981', marginTop: 8, fontWeight: 600 }}>
              Жилийн хэмнэлт: {Math.round((1 - editing.price_yearly / (editing.price_monthly * 12)) * 100)}%
            </div>
          )}
        </Section>

        {/* Limits */}
        <Section title="Хязгаарууд">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {LIMIT_FIELDS.map(f => (
              <div key={f.key}>
                <label style={lbl}>{f.icon} {f.label}</label>
                <input type="number" min={0} value={(editing as any)[f.key] || 0} onChange={e => setEditing({ ...editing, [f.key]: Number(e.target.value) })} style={inp} />
              </div>
            ))}
          </div>
        </Section>

        {/* Feature toggles */}
        <Section title="Функцууд">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {FEATURE_FIELDS.map(f => (
              <Toggle key={f.key} label={f.label} checked={(editing as any)[f.key]} onChange={v => setEditing({ ...editing, [f.key]: v })} />
            ))}
          </div>
        </Section>

        {/* Features list (display on customer page) */}
        <Section title="Онцлог жагсаалт (хэрэглэгч харах)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {(editing.features_list || []).map((f: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--surface2, #F3F4F6)', borderRadius: 8 }}>
                <span style={{ color: f.included ? '#10B981' : '#DC2626', fontWeight: 700 }}>{f.included ? '✓' : '✗'}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{f.name}</span>
                <button onClick={() => removeFeature(i)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 14 }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={featureInput.name} onChange={e => setFeatureInput({ ...featureInput, name: e.target.value })} placeholder="Онцлогийн нэр" style={{ ...inp, flex: 1 }} onKeyDown={e => e.key === 'Enter' && addFeature()} />
            <select value={featureInput.included ? 'yes' : 'no'} onChange={e => setFeatureInput({ ...featureInput, included: e.target.value === 'yes' })} style={{ ...inp, width: 100 }}>
              <option value="yes">✓ Орсон</option>
              <option value="no">✗ Ороогүй</option>
            </select>
            <button onClick={addFeature} style={{ padding: '8px 16px', background: O, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Нэмэх</button>
          </div>
        </Section>
      </div>
    )
  }

  // ═══ LIST VIEW ═══
  return (
    <div style={{ padding: 24, fontFamily: F }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1F2937', color: '#fff', padding: '10px 28px', borderRadius: 99, fontSize: 14, fontWeight: 500, zIndex: 9999 }}>{toast}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Багцын удирдлага</h1>
          <p style={{ color: '#6B7280', fontSize: 14, margin: '4px 0 0' }}>Үнэ, хязгаар, функцуудыг удирдах</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY_PLAN })} style={{ padding: '10px 24px', background: O, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
          + Шинэ багц
        </button>
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(plans.length || 3, 4)}, 1fr)`, gap: 16 }}>
        {plans.map((plan: any) => {
          const tc = TIER_COLORS[plan.tier] || O
          return (
            <div key={plan.id} style={{
              background: 'var(--surface, #fff)', borderRadius: 16, border: '1px solid var(--border, #E5E7EB)',
              overflow: 'hidden', opacity: plan.is_active ? 1 : 0.5, position: 'relative',
            }}>
              {/* Header */}
              <div style={{ background: `${tc}10`, padding: '20px 20px 16px', borderBottom: '1px solid var(--border, #E5E7EB)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text, #111)' }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: tc, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{plan.tier}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {plan.is_popular && <span style={{ fontSize: 10, background: O, color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Түгээмэл</span>}
                    <span style={{ fontSize: 10, background: plan.is_active ? '#D1FAE5' : '#FEE2E2', color: plan.is_active ? '#059669' : '#DC2626', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                      {plan.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                  <div>
                    <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text, #111)' }}>{Number(plan.price_monthly).toLocaleString()}₮</span>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>/сар</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>{Number(plan.price_yearly).toLocaleString()}₮/жил</div>
                </div>
              </div>

              {/* Limits */}
              <div style={{ padding: '12px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Хязгаарууд</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {LIMIT_FIELDS.slice(0, 4).map(f => (
                    <div key={f.key} style={{ fontSize: 12, color: '#6B7280', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{f.icon} {f.label}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text, #111)' }}>{(plan as any)[f.key]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div style={{ padding: '0 20px 12px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Функцууд</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {FEATURE_FIELDS.map(f => (
                    <span key={f.key} style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                      background: (plan as any)[f.key] ? '#D1FAE5' : '#F3F4F6',
                      color: (plan as any)[f.key] ? '#059669' : '#9CA3AF',
                    }}>
                      {(plan as any)[f.key] ? '✓' : '✗'} {f.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border, #E5E7EB)', display: 'flex', gap: 8 }}>
                <button onClick={() => setEditing({ ...plan })} style={{ flex: 1, padding: '8px', background: 'var(--surface2, #F3F4F6)', color: 'var(--text, #374151)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>Засах</button>
                <button onClick={() => handleToggle(plan.id)} style={{ padding: '8px 14px', background: plan.is_active ? '#FEE2E2' : '#D1FAE5', color: plan.is_active ? '#DC2626' : '#059669', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                  {plan.is_active ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══ SHARED COMPONENTS ═══

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface, #fff)', borderRadius: 14, padding: 20, border: '1px solid var(--border, #E5E7EB)', marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #111)', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: any; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inp} />
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text, #374151)' }}>
      <div onClick={() => onChange(!checked)} style={{
        width: 36, height: 20, borderRadius: 10, background: checked ? '#FF6B00' : '#D1D5DB',
        position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 2, left: checked ? 18 : 2,
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
      {label}
    </label>
  )
}

const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border, #E5E7EB)', fontSize: 14, background: 'var(--bg, #fff)', color: 'var(--text, #000)', fontFamily: "'DM Sans','Segoe UI',sans-serif" }
const lbl: React.CSSProperties = { fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }
