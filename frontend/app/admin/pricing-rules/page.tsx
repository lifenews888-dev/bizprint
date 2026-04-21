'use client'

import React, { useState, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PricingRule {
  id: number
  product_id?: number | null
  category_id?: number | null
  attribute_key: string
  attribute_value: string
  price_multiplier?: number | null
  price_addition?: number | null
  price_override?: number | null
  min_quantity?: number | null
  label?: string
  is_active: boolean
  product?: { id: number; name: string }
  category?: { id: number; name: string }
}

interface Product {
  id: number
  name: string
  category_id?: number
}

interface Category {
  id: number
  name: string
  icon?: string
  parent_id?: number | null
}

type TargetType = 'product' | 'category'
type ModalMode = 'add' | 'edit' | null
type FilterScope = 'all' | 'product' | 'category'

// ─── Constants ────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const CALC_TYPES = [
  {
    key: 'price_multiplier',
    label: 'Үржигдэхүүн',
    desc: 'Үндсэн үнийг үржүүлнэ',
    example: '×1.5 → 150%',
    color: '#3B82F6',
    icon: '×',
    unit: 'x',
  },
  {
    key: 'price_addition',
    label: 'Нэмэгдэл',
    desc: 'Үндсэн үнэд нэмнэ',
    example: '+5,000₮',
    color: '#10B981',
    icon: '+',
    unit: '₮',
  },
  {
    key: 'price_override',
    label: 'Тогтмол үнэ',
    desc: 'Бүрэн солих үнэ',
    example: '= 50,000₮',
    color: '#8B5CF6',
    icon: '=',
    unit: '₮',
  },
  {
    key: 'min_quantity',
    label: 'Хамгийн бага тоо',
    desc: 'Захиалгын доод хэмжээ',
    example: '≥ 100ш',
    color: '#F59E0B',
    icon: '≥',
    unit: 'ш',
  },
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('access_token') || localStorage.getItem('token') || ''
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }
}

function formatValue(rule: PricingRule): string {
  if (rule.price_multiplier != null) return `×${rule.price_multiplier}`
  if (rule.price_addition != null)   return `+${rule.price_addition.toLocaleString()}₮`
  if (rule.price_override != null)   return `=${rule.price_override.toLocaleString()}₮`
  if (rule.min_quantity != null)     return `≥${rule.min_quantity}ш`
  return '—'
}

function getCalcType(rule: PricingRule): string {
  if (rule.price_multiplier != null) return 'price_multiplier'
  if (rule.price_addition != null)   return 'price_addition'
  if (rule.price_override != null)   return 'price_override'
  if (rule.min_quantity != null)     return 'min_quantity'
  return ''
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminPricingRulesPage() {
  const [rules, setRules]         = useState<PricingRule[]>([])
  const [products, setProducts]   = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]     = useState(true)
  const [filterScope, setFilterScope] = useState<FilterScope>('all')
  const [filterTargetId, setFilterTargetId] = useState<number | null>(null)
  const [search, setSearch]       = useState('')

  const [modal, setModal]         = useState<ModalMode>(null)
  const [editRule, setEditRule]   = useState<Partial<PricingRule>>({})
  const [targetType, setTargetType] = useState<TargetType>('product')
  const [calcType, setCalcType]   = useState<string>('price_multiplier')
  const [calcValue, setCalcValue] = useState<string>('')

  const [toast, setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [stats, setStats]         = useState({ total: 0, active: 0, product: 0, category: 0 })

  useEffect(() => { fetchAll() }, [])

  // ── Fetch ──
  async function fetchAll() {
    setLoading(true)
    try {
      const [rulesRes, prodsRes, catsRes] = await Promise.all([
        fetch(`${API}/pricing-rules`, { headers: authHeaders() }),
        fetch(`${API}/products`,      { headers: authHeaders() }),
        fetch(`${API}/categories`,    { headers: authHeaders() }),
      ])
      const r: PricingRule[] = rulesRes.ok ? await rulesRes.json() : []
      const p: Product[]     = prodsRes.ok ? await prodsRes.json() : []
      const c: Category[]    = catsRes.ok  ? await catsRes.json()  : []
      setRules(r)
      setProducts(p)
      setCategories(c)
      setStats({
        total:    r.length,
        active:   r.filter(x => x.is_active).length,
        product:  r.filter(x => x.product_id).length,
        category: r.filter(x => x.category_id).length,
      })
    } catch {}
    setLoading(false)
  }

  // ── Toast ──
  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  // ── Open modal ──
  function openAdd() {
    setEditRule({ is_active: true })
    setTargetType('product')
    setCalcType('price_multiplier')
    setCalcValue('')
    setModal('add')
  }

  function openEdit(rule: PricingRule) {
    setEditRule(rule)
    setTargetType(rule.product_id ? 'product' : 'category')
    setCalcType(getCalcType(rule))
    const ct = getCalcType(rule)
    const v = ct === 'price_multiplier' ? rule.price_multiplier
            : ct === 'price_addition'   ? rule.price_addition
            : ct === 'price_override'   ? rule.price_override
            : rule.min_quantity
    setCalcValue(v != null ? String(v) : '')
    setModal('edit')
  }

  // ── Save ──
  async function saveRule() {
    if (!editRule.attribute_key?.trim()) { showToast('Attribute key оруулна уу', 'err'); return }
    if (!calcValue)                       { showToast('Утга оруулна уу', 'err'); return }

    const body: Partial<PricingRule> = {
      product_id:       targetType === 'product'  ? (editRule.product_id  || null) : null,
      category_id:      targetType === 'category' ? (editRule.category_id || null) : null,
      attribute_key:    editRule.attribute_key,
      attribute_value:  editRule.attribute_value || '',
      label:            editRule.label,
      is_active:        editRule.is_active ?? true,
      price_multiplier: null,
      price_addition:   null,
      price_override:   null,
      min_quantity:     null,
    }
    const num = parseFloat(calcValue)
    if (isNaN(num)) { showToast('Тоо оруулна уу', 'err'); return }
    if (calcType === 'price_multiplier') body.price_multiplier = num
    if (calcType === 'price_addition')   body.price_addition   = num
    if (calcType === 'price_override')   body.price_override   = num
    if (calcType === 'min_quantity')     body.min_quantity      = Math.round(num)

    const isEdit = modal === 'edit'
    const url    = isEdit ? `${API}/pricing-rules/${editRule.id}` : `${API}/pricing-rules`
    const method = isEdit ? 'PATCH' : 'POST'
    try {
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) })
      if (!res.ok) throw new Error()
      showToast(isEdit ? 'Дүрэм шинэчлэгдлээ' : 'Дүрэм нэмэгдлээ')
      setModal(null)
      fetchAll()
    } catch { showToast('Алдаа гарлаа', 'err') }
  }

  // ── Toggle active ──
  async function toggleActive(rule: PricingRule) {
    try {
      await fetch(`${API}/pricing-rules/${rule.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_active: !rule.is_active }),
      })
      fetchAll()
    } catch {}
  }

  // ── Delete ──
  async function deleteRule(id: number) {
    if (!confirm('Дүрэм устгах уу?')) return
    try {
      const res = await fetch(`${API}/pricing-rules/${id}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) throw new Error()
      showToast('Устгагдлаа')
      fetchAll()
    } catch { showToast('Устгах боломжгүй', 'err') }
  }

  // ── Filter ──
  const filtered = rules.filter(r => {
    if (filterScope === 'product'  && !r.product_id)  return false
    if (filterScope === 'category' && !r.category_id) return false
    if (filterTargetId) {
      if (filterScope === 'product'  && r.product_id  !== filterTargetId) return false
      if (filterScope === 'category' && r.category_id !== filterTargetId) return false
    }
    if (search) {
      const s = search.toLowerCase()
      const prodName = products.find(p => p.id === r.product_id)?.name  || ''
      const catName  = categories.find(c => c.id === r.category_id)?.name || ''
      return (
        r.attribute_key.toLowerCase().includes(s)   ||
        r.attribute_value.toLowerCase().includes(s)  ||
        (r.label || '').toLowerCase().includes(s)    ||
        prodName.toLowerCase().includes(s)           ||
        catName.toLowerCase().includes(s)
      )
    }
    return true
  })

  const rootCats = categories.filter(c => !c.parent_id)

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '28px 32px', color: 'var(--text)', fontFamily: "'DM Sans', 'Segoe UI', system-ui" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.type === 'ok' ? '#10B981' : '#EF4444',
          color: '#fff', padding: '12px 20px', borderRadius: 10,
          fontSize: 14, fontWeight: 600, boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}>
          {toast.type === 'ok' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Үнийн дүрмүүд</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, margin: '4px 0 0' }}>
            Бүтээгдэхүүн болон ангилалд attribute-аар үнэ тохируулах
          </p>
        </div>
        <button onClick={openAdd} style={{
          background: '#FF6B35', color: '#fff', border: 'none',
          padding: '10px 22px', borderRadius: 8, fontWeight: 700,
          fontSize: 14, cursor: 'pointer',
        }}>
          + Дүрэм нэмэх
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Нийт дүрэм',     value: stats.total,    color: '#FF6B35', icon: '📋' },
          { label: 'Идэвхтэй',        value: stats.active,   color: '#10B981', icon: '✓'  },
          { label: 'Бүтээгдэхүүнд',   value: stats.product,  color: '#3B82F6', icon: '📦' },
          { label: 'Ангилалд',         value: stats.category, color: '#8B5CF6', icon: '🗂️' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '18px 20px',
            borderLeft: `3px solid ${s.color}`,
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center',
        marginBottom: 20, flexWrap: 'wrap',
      }}>
        {/* Scope tabs */}
        <div style={{
          display: 'flex', background: 'var(--surface2)',
          border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
        }}>
          {(['all', 'product', 'category'] as FilterScope[]).map(s => (
            <button key={s}
              onClick={() => { setFilterScope(s); setFilterTargetId(null) }}
              style={{
                background: filterScope === s ? '#FF6B35' : 'transparent',
                color: filterScope === s ? '#fff' : 'var(--text2)',
                border: 'none', padding: '8px 16px', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
              }}
            >
              {s === 'all' ? 'Бүгд' : s === 'product' ? '📦 Бүтээгдэхүүн' : '🗂️ Ангилал'}
            </button>
          ))}
        </div>

        {/* Target selector */}
        {filterScope !== 'all' && (
          <select
            value={filterTargetId || ''}
            onChange={e => setFilterTargetId(e.target.value ? Number(e.target.value) : null)}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13,
            }}
          >
            <option value="">— Бүгдийг харах —</option>
            {filterScope === 'product'
              ? products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
              : rootCats.map(c => <option key={c.id} value={c.id}>{c.icon || '📦'} {c.name}</option>)
            }
          </select>
        )}

        {/* Search */}
        <input
          placeholder="🔍 Хайх..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 14px', color: 'var(--text)',
            fontSize: 13, width: 220, outline: 'none', marginLeft: 'auto',
          }}
        />
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>
          {filtered.length} дүрэм
        </span>
      </div>

      {/* ── Calc type legend ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {CALC_TYPES.map(ct => (
          <div key={ct.key} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: `${ct.color}14`,
            border: `1px solid ${ct.color}44`,
            borderRadius: 20, padding: '4px 12px',
            fontSize: 12, color: ct.color, fontWeight: 600,
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: '50%',
              background: ct.color, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>{ct.icon}</span>
            {ct.label}
            <span style={{ color: `${ct.color}99`, fontWeight: 400 }}>— {ct.example}</span>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</div>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '200px 160px 160px 130px 90px 80px 100px',
            padding: '10px 20px',
            background: 'var(--surface2)', borderBottom: '1px solid var(--border)',
            fontSize: 11, fontWeight: 700, color: 'var(--text2)',
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            <span>Хамаарал</span>
            <span>Атрибут нэр</span>
            <span>Атрибут утга</span>
            <span>Тооцооллын төрөл</span>
            <span>Утга</span>
            <span>Идэвхтэй</span>
            <span style={{ textAlign: 'right' }}>Үйлдэл</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: 56, textAlign: 'center', color: 'var(--text2)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
              <div style={{ fontWeight: 600 }}>Дүрэм олдсонгүй</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>+ Дүрэм нэмэх товч дарж эхэлнэ үү</div>
            </div>
          ) : (
            filtered.map((rule, i) => {
              const ct = CALC_TYPES.find(c => c.key === getCalcType(rule))
              const prodName = products.find(p => p.id === rule.product_id)?.name
              const catName  = categories.find(c => c.id === rule.category_id)?.name
              const catIcon  = categories.find(c => c.id === rule.category_id)?.icon

              return (
                <div key={rule.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '200px 160px 160px 130px 90px 80px 100px',
                  padding: '13px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  alignItems: 'center',
                  opacity: rule.is_active ? 1 : 0.5,
                  transition: 'opacity 0.2s',
                }}>
                  {/* Хамаарал */}
                  <div>
                    {prodName ? (
                      <div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: 'rgba(59,130,246,0.12)', color: '#3B82F6',
                          borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600,
                        }}>
                          📦 Бүтээгдэхүүн
                        </div>
                        <div style={{ fontSize: 13, marginTop: 4, color: 'var(--text)' }}>{prodName}</div>
                      </div>
                    ) : catName ? (
                      <div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: 'rgba(139,92,246,0.12)', color: '#8B5CF6',
                          borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600,
                        }}>
                          {catIcon || '🗂️'} Ангилал
                        </div>
                        <div style={{ fontSize: 13, marginTop: 4, color: 'var(--text)' }}>{catName}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text3)', fontSize: 12 }}>Бүх бүтээгдэхүүн</span>
                    )}
                  </div>

                  {/* Attribute key */}
                  <div>
                    <code style={{
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      borderRadius: 5, padding: '2px 7px', fontSize: 12,
                      color: 'var(--text)',
                    }}>
                      {rule.attribute_key}
                    </code>
                    {rule.label && (
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3 }}>{rule.label}</div>
                    )}
                  </div>

                  {/* Attribute value */}
                  <div>
                    {rule.attribute_value ? (
                      <span style={{
                        background: 'var(--surface2)', border: '1px solid var(--border)',
                        borderRadius: 5, padding: '2px 8px', fontSize: 12,
                      }}>
                        {rule.attribute_value}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text3)', fontSize: 12 }}>Бүх утга</span>
                    )}
                  </div>

                  {/* Calc type badge */}
                  {ct ? (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: `${ct.color}15`, color: ct.color,
                      borderRadius: 6, padding: '3px 9px', fontSize: 12, fontWeight: 600,
                      width: 'fit-content',
                    }}>
                      <span style={{
                        width: 16, height: 16, borderRadius: '50%',
                        background: ct.color, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700,
                      }}>{ct.icon}</span>
                      {ct.label}
                    </div>
                  ) : <span>—</span>}

                  {/* Value */}
                  <span style={{
                    fontWeight: 700, fontSize: 15,
                    color: ct?.color || 'var(--text)',
                  }}>
                    {formatValue(rule)}
                  </span>

                  {/* Toggle */}
                  <div>
                    <button
                      onClick={() => toggleActive(rule)}
                      style={{
                        width: 40, height: 22, borderRadius: 11, border: 'none',
                        background: rule.is_active ? '#10B981' : 'var(--border2)',
                        cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 2,
                        left: rule.is_active ? 20 : 2,
                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                        transition: 'left 0.2s',
                      }} />
                    </button>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <ActionBtn icon="✏️" onClick={() => openEdit(rule)} />
                    <ActionBtn icon="🗑️" danger onClick={() => deleteRule(rule.id)} />
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL                                                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 32, width: 580,
            maxHeight: '88vh', overflowY: 'auto',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  {modal === 'add' ? '+ Үнийн дүрэм нэмэх' : 'Дүрэм засах'}
                </h2>
                <p style={{ margin: '4px 0 0', color: 'var(--text2)', fontSize: 13 }}>
                  Attribute утгатай тохирох үнийн нөхцөл тодорхойлно
                </p>
              </div>
              <button onClick={() => setModal(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text2)', fontSize: 22, lineHeight: 1,
              }}>×</button>
            </div>

            {/* ── Section 1: Target ── */}
            <SectionTitle>1. Хаана хамааруулах вэ?</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {(['product', 'category'] as TargetType[]).map(t => (
                <button key={t}
                  onClick={() => setTargetType(t)}
                  style={{
                    padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                    border: targetType === t ? '2px solid #FF6B35' : '1px solid var(--border)',
                    background: targetType === t ? 'rgba(255,107,53,0.08)' : 'var(--surface2)',
                    color: targetType === t ? '#FF6B35' : 'var(--text)',
                    fontWeight: 600, fontSize: 14, textAlign: 'left',
                  }}
                >
                  <div>{t === 'product' ? '📦 Бүтээгдэхүүн' : '🗂️ Ангилал'}</div>
                  <div style={{ fontSize: 11, fontWeight: 400, color: targetType === t ? '#FF6B35aa' : 'var(--text2)', marginTop: 3 }}>
                    {t === 'product' ? 'Тодорхой нэг бүтээгдэхүүнд' : 'Ангилалын бүх бүтээгдэхүүнд'}
                  </div>
                </button>
              ))}
            </div>

            {targetType === 'product' ? (
              <>
                <Label>Бүтээгдэхүүн сонгох</Label>
                <select
                  value={editRule.product_id || ''}
                  onChange={e => setEditRule({ ...editRule, product_id: e.target.value ? Number(e.target.value) : null })}
                  style={inputStyle}
                >
                  <option value="">— Бүтээгдэхүүн сонгох —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </>
            ) : (
              <>
                <Label>Ангилал сонгох</Label>
                <select
                  value={editRule.category_id || ''}
                  onChange={e => setEditRule({ ...editRule, category_id: e.target.value ? Number(e.target.value) : null })}
                  style={inputStyle}
                >
                  <option value="">— Ангилал сонгох —</option>
                  {rootCats.map(c => (
                    <optgroup key={c.id} label={`${c.icon || ''} ${c.name}`}>
                      <option value={c.id}>{c.icon || '📦'} {c.name} (үндсэн)</option>
                      {categories.filter(s => s.parent_id === c.id).map(s => (
                        <option key={s.id} value={s.id}>　└ {s.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </>
            )}

            {/* ── Section 2: Attribute ── */}
            <SectionTitle>2. Ямар attribute-ийн хувьд?</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Label>Атрибут нэр *</Label>
                <input
                  value={editRule.attribute_key || ''}
                  onChange={e => setEditRule({ ...editRule, attribute_key: e.target.value })}
                  placeholder="Жишээ: paper_type"
                  style={inputStyle}
                />
              </div>
              <div>
                <Label>Атрибут утга (хоосон = бүх утга)</Label>
                <input
                  value={editRule.attribute_value || ''}
                  onChange={e => setEditRule({ ...editRule, attribute_value: e.target.value })}
                  placeholder="Жишээ: glossy"
                  style={inputStyle}
                />
              </div>
            </div>

            <Label>Нэр / тайлбар (заавал биш)</Label>
            <input
              value={editRule.label || ''}
              onChange={e => setEditRule({ ...editRule, label: e.target.value })}
              placeholder="Жишээ: Glossy нэмэлт үнэ"
              style={inputStyle}
            />

            {/* ── Section 3: Calc type ── */}
            <SectionTitle>3. Тооцооллын төрөл</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {CALC_TYPES.map(ct => (
                <button key={ct.key}
                  onClick={() => { setCalcType(ct.key); setCalcValue('') }}
                  style={{
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    border: calcType === ct.key ? `2px solid ${ct.color}` : '1px solid var(--border)',
                    background: calcType === ct.key ? `${ct.color}12` : 'var(--surface2)',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: calcType === ct.key ? ct.color : 'var(--border)',
                      color: calcType === ct.key ? '#fff' : 'var(--text2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                    }}>{ct.icon}</span>
                    <span style={{
                      fontWeight: 600, fontSize: 13,
                      color: calcType === ct.key ? ct.color : 'var(--text)',
                    }}>{ct.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 5, paddingLeft: 29 }}>
                    {ct.desc} — <span style={{ color: calcType === ct.key ? ct.color : 'var(--text2)' }}>{ct.example}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* ── Section 4: Value ── */}
            <SectionTitle>4. Утга</SectionTitle>
            {(() => {
              const ct = CALC_TYPES.find(c => c.key === calcType)
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="number"
                      value={calcValue}
                      onChange={e => setCalcValue(e.target.value)}
                      placeholder={
                        calcType === 'price_multiplier' ? '1.5'
                        : calcType === 'min_quantity'   ? '100'
                        : '5000'
                      }
                      step={calcType === 'price_multiplier' ? '0.01' : '1'}
                      style={{ ...inputStyle, margin: 0, paddingRight: 40 }}
                    />
                    <span style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      color: ct?.color || 'var(--text2)', fontWeight: 700, fontSize: 13,
                    }}>
                      {ct?.unit}
                    </span>
                  </div>
                  {/* Live preview */}
                  {calcValue && (
                    <div style={{
                      background: `${ct?.color || '#FF6B35'}15`,
                      border: `1px solid ${ct?.color || '#FF6B35'}44`,
                      borderRadius: 8, padding: '10px 16px',
                      fontSize: 18, fontWeight: 800, color: ct?.color || '#FF6B35',
                      minWidth: 100, textAlign: 'center',
                    }}>
                      {calcType === 'price_multiplier' ? `×${calcValue}`
                       : calcType === 'price_addition' ? `+${Number(calcValue).toLocaleString()}₮`
                       : calcType === 'price_override' ? `=${Number(calcValue).toLocaleString()}₮`
                       : `≥${calcValue}ш`}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Active toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <button
                onClick={() => setEditRule({ ...editRule, is_active: !editRule.is_active })}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none',
                  background: editRule.is_active ? '#10B981' : 'var(--border2)',
                  cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: 3,
                  left: editRule.is_active ? 22 : 2,
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s',
                }} />
              </button>
              <span style={{ fontSize: 14 }}>Дүрэм идэвхтэй байх</span>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={cancelBtnStyle}>Болих</button>
              <button onClick={saveRule} style={saveBtnStyle}>
                {modal === 'add' ? '+ Нэмэх' : '✓ Хадгалах'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{"@keyframes fadeIn{from{opacity:0}to{opacity:1}}"}</style>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: 'var(--text2)',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 14,
      marginTop: 4,
    }}>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 600, color: 'var(--text2)',
      marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      {children}
    </div>
  )
}

function ActionBtn({ icon, onClick, danger }: { icon: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 14, lineHeight: 1,
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = danger ? '#EF4444' : '#FF6B35')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {icon}
    </button>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 14,
  outline: 'none', marginBottom: 14, boxSizing: 'border-box',
}

const saveBtnStyle: React.CSSProperties = {
  background: '#FF6B35', color: '#fff', border: 'none',
  padding: '11px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer',
}

const cancelBtnStyle: React.CSSProperties = {
  background: 'var(--surface2)', color: 'var(--text)',
  border: '1px solid var(--border)', padding: '11px 20px',
  borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
}
