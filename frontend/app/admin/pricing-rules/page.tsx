'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const F = "'Segoe UI',system-ui,sans-serif"

interface PricingRule {
  id: string
  product_id?: string | null
  category_id?: string | null
  attribute_key: string
  attribute_value: string
  price_multiplier?: number | null
  price_addition?: number | null
  price_override?: number | null
  min_quantity?: number | null
  is_active: boolean
}
interface Product { id: string; name: string; name_mn: string }
interface Category { id: string; name: string; name_mn: string; slug: string }

const CALC_TYPES = [
  { k: 'multiplier', l: 'Үржигдэхүүн',     desc: 'Үндсэн үнийг үржүүлнэ',    ex: 'x1.5 +50%',   color: '#3B82F6', icon: 'x' },
  { k: 'addition',   l: 'Нэмэгдэл',         desc: 'Үндсэн үнэд нэмнэ',        ex: '+5,000T',      color: '#10B981', icon: '+' },
  { k: 'override',   l: 'Тогтмол үнэ',      desc: 'Бүрэн солих үнэ',          ex: '=50,000T',     color: '#8B5CF6', icon: '=' },
  { k: 'min_qty',    l: 'Хамгийн бага тоо', desc: 'Захиалгын доод хэмжээ',    ex: '>=100',        color: '#F59E0B', icon: '>' },
]

function authH() {
  const t = localStorage.getItem('access_token') || localStorage.getItem('token') || ''
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }
}

function formatVal(r: PricingRule) {
  if (r.price_multiplier != null) return 'x' + r.price_multiplier + ' (+' + Math.round(Number(r.price_multiplier) * 100) + '%)'
  if (r.price_addition != null)   return '+' + Number(r.price_addition).toLocaleString() + 'T'
  if (r.price_override != null)   return '=' + Number(r.price_override).toLocaleString() + 'T'
  if (r.min_quantity != null)     return '>=' + r.min_quantity + 'ш'
  return '-'
}

function getCalcType(r: PricingRule) {
  if (r.price_multiplier != null) return 'multiplier'
  if (r.price_addition != null)   return 'addition'
  if (r.price_override != null)   return 'override'
  if (r.min_quantity != null)     return 'min_qty'
  return 'multiplier'
}

export default function AdminPricingRulesPage() {
  const [rules, setRules] = useState<PricingRule[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<PricingRule | null>(null)
  const [filterScope, setFilterScope] = useState('all')
  const [form, setForm] = useState({
    target: 'product', product_id: '', category_id: '',
    attribute_key: '', attribute_value: '',
    calc_type: 'multiplier', calc_value: '', is_active: true,
  })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [r, p, c] = await Promise.all([
      fetch(API + '/pricing-rules', { headers: authH() }).then(x => x.json()),
      fetch(API + '/products', { headers: authH() }).then(x => x.json()),
      fetch(API + '/categories', { headers: authH() }).then(x => x.json()),
    ])
    setRules(Array.isArray(r) ? r : [])
    setProducts(Array.isArray(p) ? p : [])
    setCategories(Array.isArray(c) ? c : [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm({ target: 'product', product_id: '', category_id: '', attribute_key: '', attribute_value: '', calc_type: 'multiplier', calc_value: '', is_active: true })
    setModal(true)
  }

  function openEdit(r: PricingRule) {
    setEditing(r)
    const ct = getCalcType(r)
    const val = ct === 'multiplier' ? r.price_multiplier : ct === 'addition' ? r.price_addition : ct === 'override' ? r.price_override : r.min_quantity
    setForm({
      target: r.product_id ? 'product' : 'category',
      product_id: r.product_id || '', category_id: r.category_id || '',
      attribute_key: r.attribute_key, attribute_value: r.attribute_value,
      calc_type: ct, calc_value: val != null ? String(val) : '', is_active: r.is_active,
    })
    setModal(true)
  }

  async function save() {
    const num = Number(form.calc_value)
    const body: any = {
      attribute_key: form.attribute_key, attribute_value: form.attribute_value, is_active: form.is_active,
      product_id: form.target === 'product' ? (form.product_id || null) : null,
      category_id: form.target === 'category' ? (form.category_id || null) : null,
      price_multiplier: form.calc_type === 'multiplier' ? num : null,
      price_addition:   form.calc_type === 'addition'   ? num : null,
      price_override:   form.calc_type === 'override'   ? num : null,
      min_quantity:     form.calc_type === 'min_qty'    ? Math.round(num) : null,
    }
    if (editing) {
      await fetch(API + '/pricing-rules/' + editing.id, { method: 'PATCH', headers: authH(), body: JSON.stringify(body) })
    } else {
      await fetch(API + '/pricing-rules', { method: 'POST', headers: authH(), body: JSON.stringify(body) })
    }
    setModal(false)
    loadAll()
  }

  async function remove(id: string) {
    if (!confirm('Устгах уу?')) return
    await fetch(API + '/pricing-rules/' + id, { method: 'DELETE', headers: authH() })
    loadAll()
  }

  async function toggle(r: PricingRule) {
    await fetch(API + '/pricing-rules/' + r.id, { method: 'PATCH', headers: authH(), body: JSON.stringify({ is_active: !r.is_active }) })
    loadAll()
  }

  const filtered = rules.filter(r => {
    if (filterScope === 'product') return !!r.product_id
    if (filterScope === 'category') return !!r.category_id
    return true
  })

  const ct = CALC_TYPES.find(c => c.k === form.calc_type)

  return (
    <div style={{ padding: '28px 32px', fontFamily: F, color: 'var(--text)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Унийн дурмуд</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', margin: '5px 0 0' }}>Бутээгдэхуун болон ангилалд attribute-аар унэ тохируулах</p>
        </div>
        <button onClick={openNew} style={{ background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>+ Дурэм нэмэх</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Нийт дурэм', value: rules.length, color: 'var(--orange)' },
          { label: 'Идэвхтэй', value: rules.filter(r => r.is_active).length, color: '#1D9E75' },
          { label: 'Бутэгдэхуунд', value: rules.filter(r => r.product_id).length, color: '#378ADD' },
          { label: 'Ангилалд', value: rules.filter(r => r.category_id).length, color: '#8B5CF6' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, borderLeft: '3px solid ' + c.color }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[{ k: 'all', l: 'Бугд' }, { k: 'product', l: 'Бутээгдэхуун' }, { k: 'category', l: 'Ангилал' }].map(s => (
          <button key={s.k} onClick={() => setFilterScope(s.k)}
            style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid', fontSize: 12, cursor: 'pointer', background: filterScope === s.k ? 'var(--orange)' : 'transparent', color: filterScope === s.k ? '#fff' : 'var(--text3)', borderColor: filterScope === s.k ? 'var(--orange)' : 'var(--border)' }}>
            {s.l}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' as any }}>
        {CALC_TYPES.map(ct => (
          <div key={ct.k} style={{ display: 'flex', alignItems: 'center', gap: 6, background: ct.color + '14', border: '1px solid ' + ct.color + '44', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: ct.color, fontWeight: 600 }}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: ct.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{ct.icon}</span>
            {ct.l} <span style={{ opacity: 0.7, fontWeight: 400 }}>-- {ct.ex}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1fr 0.5fr 0.8fr', padding: '10px 20px', borderBottom: '1px solid var(--border)', gap: 12 }}>
          {['Хамаарал', 'Attribute key', 'Attribute утга', 'Тооцооллын тoрoл', 'Утга', 'Идэвх', 'Yйлдэл'].map(h => (
            <div key={h} style={{ fontSize: 11, color: 'var(--text4)', textTransform: 'uppercase' as any, fontWeight: 500 }}>{h}</div>
          ))}
        </div>
        {loading ? <div style={{ padding: 48, textAlign: 'center' as any, color: 'var(--text4)' }}>Уншиж байна...</div>
          : filtered.length === 0 ? (
            <div style={{ padding: 56, textAlign: 'center' as any, color: 'var(--text4)' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Дурэм олдсонгуй</div>
              <div style={{ fontSize: 13 }}>+ Дурэм нэмэх товч дарж эхлэнэ уу</div>
            </div>
          ) : filtered.map((r, i) => {
            const prod = products.find(p => p.id === r.product_id)
            const cat = categories.find(c => c.id === r.category_id)
            const ctype = CALC_TYPES.find(c => c.k === getCalcType(r))
            return (
              <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1fr 0.5fr 0.8fr', padding: '12px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', gap: 12, alignItems: 'center', opacity: r.is_active ? 1 : 0.5 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div>
                  {prod && <><div style={{ fontSize: 11, color: '#378ADD', fontWeight: 600 }}>Бутээгдэхуун</div><div style={{ fontSize: 13 }}>{prod.name_mn || prod.name}</div></>}
                  {cat && <><div style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 600 }}>Ангилал</div><div style={{ fontSize: 13 }}>{cat.name_mn || cat.name}</div></>}
                  {!prod && !cat && <span style={{ fontSize: 12, color: 'var(--text4)' }}>-</span>}
                </div>
                <code style={{ fontSize: 12, background: 'var(--surface2)', padding: '2px 7px', borderRadius: 5, border: '1px solid var(--border)' }}>{r.attribute_key}</code>
                <div style={{ fontSize: 12, background: 'var(--surface2)', padding: '2px 8px', borderRadius: 5, display: 'inline-block' }}>{r.attribute_value || '-'}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: (ctype?.color || '#888') + '15', color: ctype?.color, borderRadius: 6, padding: '3px 9px', fontSize: 12, fontWeight: 600 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: ctype?.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>{ctype?.icon}</span>
                  {ctype?.l}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: ctype?.color }}>{formatVal(r)}</div>
                <button onClick={() => toggle(r)} style={{ width: 40, height: 22, borderRadius: 11, border: 'none', background: r.is_active ? '#1D9E75' : 'var(--border)', cursor: 'pointer', position: 'relative' as any }}>
                  <span style={{ position: 'absolute' as any, top: 2, left: r.is_active ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </button>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(r)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #378ADD', background: 'transparent', color: '#378ADD', cursor: 'pointer' }}>Засах</button>
                  <button onClick={() => remove(r.id)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #e24b4a', background: 'transparent', color: '#e24b4a', cursor: 'pointer' }}>Устгах</button>
                </div>
              </div>
            )
          })}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 32, width: 580, maxHeight: '92vh', overflowY: 'auto' as any, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{editing ? 'Дурэм засах' : 'Шинэ дурэм нэмэх'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text3)' }}>x</button>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' as any }}>1. Хаана хамааруулах вэ?</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {[{ k: 'product', l: 'Бутэгдэхуун', d: 'Тодорхой нэг бутэгдэхуунд' }, { k: 'category', l: 'Ангилал', d: 'Ангилалын бух бутэгдэхуунд' }].map(t => (
                  <button key={t.k} onClick={() => setForm({ ...form, target: t.k })}
                    style={{ flex: 1, padding: '12px', borderRadius: 10, border: form.target === t.k ? '2px solid var(--orange)' : '1px solid var(--border)', background: form.target === t.k ? 'var(--orange-06)' : 'var(--surface2)', cursor: 'pointer', textAlign: 'left' as any }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: form.target === t.k ? 'var(--orange)' : 'var(--text)' }}>{t.l}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{t.d}</div>
                  </button>
                ))}
              </div>
              <select value={form.target === 'product' ? form.product_id : form.category_id}
                onChange={e => setForm({ ...form, [form.target === 'product' ? 'product_id' : 'category_id']: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }}>
                <option value="">-- {form.target === 'product' ? 'Бутэгдэхуун' : 'Ангилал'} сонгох --</option>
                {form.target === 'product'
                  ? products.map(p => <option key={p.id} value={p.id}>{p.name_mn || p.name}</option>)
                  : categories.map(c => <option key={c.id} value={c.id}>{c.name_mn || c.name}</option>)
                }
              </select>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' as any }}>2. Ямар attribute-ийн хувьд?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Attribute key *</label>
                  <input value={form.attribute_key} onChange={e => setForm({ ...form, attribute_key: e.target.value })} placeholder="finish, side, paper_weight..."
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' as any }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 4 }}>Attribute утга *</label>
                  <input value={form.attribute_value} onChange={e => setForm({ ...form, attribute_value: e.target.value })} placeholder="Мат ламинат, Хоёр тал..."
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' as any }} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' as any }}>3. Тооцооллын тoрoл</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {CALC_TYPES.map(t => (
                  <button key={t.k} onClick={() => setForm({ ...form, calc_type: t.k, calc_value: '' })}
                    style={{ padding: '12px 14px', borderRadius: 10, cursor: 'pointer', border: form.calc_type === t.k ? '2px solid ' + t.color : '1px solid var(--border)', background: form.calc_type === t.k ? t.color + '10' : 'var(--surface2)', textAlign: 'left' as any }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: form.calc_type === t.k ? t.color : 'var(--border)', color: form.calc_type === t.k ? '#fff' : 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{t.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: form.calc_type === t.k ? t.color : 'var(--text)' }}>{t.l}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', paddingLeft: 29 }}>{t.desc} -- {t.ex}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' as any }}>4. Утга</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative' as any, flex: 1 }}>
                  <input type="number" value={form.calc_value} onChange={e => setForm({ ...form, calc_value: e.target.value })}
                    placeholder={form.calc_type === 'multiplier' ? '0.20' : form.calc_type === 'min_qty' ? '100' : '5000'}
                    step={form.calc_type === 'multiplier' ? '0.01' : '1'}
                    style={{ width: '100%', padding: '9px 40px 9px 12px', background: 'var(--surface2)', border: '2px solid ' + (ct?.color || 'var(--border)'), borderRadius: 8, fontSize: 14, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' as any }} />
                  <span style={{ position: 'absolute' as any, right: 12, top: '50%', transform: 'translateY(-50%)', color: ct?.color, fontWeight: 700 }}>{ct?.icon}</span>
                </div>
                {form.calc_value && (
                  <div style={{ background: (ct?.color || '#888') + '15', border: '1px solid ' + (ct?.color || '#888') + '44', borderRadius: 8, padding: '10px 16px', fontSize: 16, fontWeight: 800, color: ct?.color, minWidth: 100, textAlign: 'center' as any }}>
                    {form.calc_type === 'multiplier' ? 'x' + (1 + Number(form.calc_value)) + ' (+' + Math.round(Number(form.calc_value) * 100) + '%)'
                      : form.calc_type === 'addition'  ? '+' + Number(form.calc_value).toLocaleString() + 'T'
                      : form.calc_type === 'override'  ? '=' + Number(form.calc_value).toLocaleString() + 'T'
                      : '>=' + form.calc_value + 'ш'}
                  </div>
                )}
              </div>
              {form.calc_type === 'multiplier' && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>0.20 оруулбал +20% нэмэгдэнэ</div>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <input type="checkbox" id="active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              <label htmlFor="active" style={{ fontSize: 13 }}>Идэвхтэй байх</label>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>Цуцлах</button>
              <button onClick={save} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--orange)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Хадгалах</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}