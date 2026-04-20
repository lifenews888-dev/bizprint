'use client'
import React, { useState, useEffect } from 'react'
import React, { useRouter } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'

const API = 'http://localhost:4000'
const F   = "'DM Sans','Segoe UI',system-ui,sans-serif"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  name_mn: string
  category: string
  base_price: number
  min_quantity: number
  lead_time_days: number
  product_type: 'print' | 'ready'
  description?: string
  is_active: boolean
  slug: string
  created_at: string
}

interface Order {
  id: string
  product_id?: string
  product_name?: string
  quantity: number
  total_price: number
  status: string
  customer_name?: string
  created_at: string
}

interface Stats {
  total_orders: number
  total_revenue: number
  total_products: number
}

interface WalletBalance {
  balance: number
  total_earned: number
  total_withdrawn: number
}

interface WalletTx {
  id: number
  type: string
  source: string
  amount: number
  balance_after: number
  note?: string
  created_at: string
}

interface User { id: string; email: string; full_name: string; role: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDER_STATUS_MN: Record<string, { label: string; color: string }> = {
  pending:       { label: 'Хүлээгдэж байна', color: '#F59E0B' },
  paid:          { label: 'Төлөгдсөн',       color: '#3B82F6' },
  in_production: { label: 'Үйлдвэрлэлд',    color: '#8B5CF6' },
  completed:     { label: 'Дууссан',          color: '#10B981' },
  shipped:       { label: 'Хүргэгдсэн',      color: '#06B6D4' },
  delivered:     { label: 'Хүргэсэн',        color: '#10B981' },
  cancelled:     { label: 'Цуцлагдсан',      color: '#EF4444' },
}

const CATEGORIES = [
  'Хэвлэл', 'Ном', 'Сурах бичиг', 'Каталог', 'Буклет', 'Флаер',
  'Баннер', 'Визитны карт', 'Хаяг', 'Савлагаа', 'Бусад',
]

type Tab = 'products' | 'orders' | 'wallet'

function tok() { return localStorage.getItem('access_token') || localStorage.getItem('token') || '' }
function hdrs() { return { Authorization: 'Bearer ' + tok(), 'Content-Type': 'application/json' } }

// ─── Empty form ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '', name_mn: '', category: 'Хэвлэл',
  base_price: '', min_quantity: '1', lead_time_days: '3',
  product_type: 'print' as 'print' | 'ready', description: '',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VendorDashboard() {
  const router = useRouter()

  const [user, setUser]       = useState<User | null>(null)
  const [tab, setTab]         = useState<Tab>('products')
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null)

  // Products
  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [form, setForm]         = useState({ ...EMPTY_FORM })
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Orders
  const [orders, setOrders]     = useState<Order[]>([])
  const [stats, setStats]       = useState<Stats>({ total_orders: 0, total_revenue: 0, total_products: 0 })

  // Wallet
  const [wallet, setWallet]     = useState<WalletBalance | null>(null)
  const [txns, setTxns]         = useState<WalletTx[]>([])
  const [withdrawAmt, setWithdrawAmt] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const ud = localStorage.getItem('user')
    if (!ud || !tok()) { router.push('/login'); return }
    const u = JSON.parse(ud) as User
    if (u.role !== 'vendor' && u.role !== 'admin') { router.push('/login'); return }
    setUser(u)
    loadAll(u)
  }, [])

  async function loadAll(u: User) {
    setLoading(true)
    await Promise.all([
      loadProducts(),
      loadStats(),
      loadOrders(u),
      loadWallet(),
    ])
    setLoading(false)
  }

  async function loadProducts() {
    try {
      const r = await fetch(`${API}/vendor-store/products`, { headers: hdrs() })
      setProducts(r.ok ? await r.json() : [])
    } catch {}
  }

  async function loadStats() {
    try {
      const r = await fetch(`${API}/vendor-store/stats`, { headers: hdrs() })
      if (r.ok) setStats(await r.json())
    } catch {}
  }

  async function loadOrders(u: User) {
    try {
      // Get all orders, then filter client-side to this vendor's products
      const [prodRes, ordRes] = await Promise.all([
        fetch(`${API}/vendor-store/products`, { headers: hdrs() }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/orders`, { headers: hdrs() }).then(r => r.ok ? r.json() : []),
      ])
      const myProductIds = new Set((Array.isArray(prodRes) ? prodRes : []).map((p: Product) => p.id))
      const myOrders = (Array.isArray(ordRes) ? ordRes : []).filter(
        (o: Order) => o.product_id && myProductIds.has(o.product_id),
      )
      setOrders(myOrders)
    } catch {}
  }

  async function loadWallet() {
    try {
      const [bal, tx] = await Promise.all([
        fetch(`${API}/wallet/balance`, { headers: hdrs() }).then(r => r.ok ? r.json() : null),
        fetch(`${API}/wallet/transactions`, { headers: hdrs() }).then(r => r.ok ? r.json() : []),
      ])
      if (bal) setWallet(bal)
      setTxns(Array.isArray(tx) ? tx.slice(0, 20) : [])
    } catch {}
  }

  // ── Toast ───────────────────────────────────────────────────────────────────
  function show(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2800)
  }

  // ── Product CRUD ─────────────────────────────────────────────────────────────
  function openNew() {
    setEditId(null)
    setForm({ ...EMPTY_FORM })
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setEditId(p.id)
    setForm({
      name:           p.name,
      name_mn:        p.name_mn,
      category:       p.category,
      base_price:     String(p.base_price),
      min_quantity:   String(p.min_quantity),
      lead_time_days: String(p.lead_time_days),
      product_type:   p.product_type,
      description:    p.description || '',
    })
    setShowForm(true)
  }

  async function saveProduct() {
    if (!form.name || !form.base_price) { show('Нэр болон үнэ заавал шаардлагатай', false); return }
    setSaving(true)
    try {
      const body = {
        name:           form.name,
        name_mn:        form.name_mn || form.name,
        category:       form.category,
        base_price:     Number(form.base_price),
        min_quantity:   Number(form.min_quantity) || 1,
        lead_time_days: Number(form.lead_time_days) || 3,
        product_type:   form.product_type,
        description:    form.description,
      }
      const url    = editId ? `${API}/vendor-store/products/${editId}` : `${API}/vendor-store/products`
      const method = editId ? 'PATCH' : 'POST'
      const r = await fetch(url, { method, headers: hdrs(), body: JSON.stringify(body) })
      if (r.ok) {
        show(editId ? 'Бараа шинэчлэгдлээ ✓' : 'Бараа нэмэгдлээ ✓')
        setShowForm(false)
        await loadProducts()
        await loadStats()
      } else {
        show('Хадгалахад алдаа гарлаа', false)
      }
    } catch { show('Хадгалахад алдаа гарлаа', false) }
    setSaving(false)
  }

  async function deleteProduct(id: string) {
    if (!confirm('Бараа устгах уу?')) return
    setDeleting(id)
    try {
      const r = await fetch(`${API}/vendor-store/products/${id}`, { method: 'DELETE', headers: hdrs() })
      if (r.ok) { show('Бараа устгагдлаа'); await loadProducts(); await loadStats() }
      else show('Устгахад алдаа гарлаа', false)
    } catch { show('Устгахад алдаа гарлаа', false) }
    setDeleting(null)
  }

  async function toggleActive(p: Product) {
    try {
      const r = await fetch(`${API}/vendor-store/products/${p.id}`, {
        method: 'PATCH', headers: hdrs(),
        body: JSON.stringify({ is_active: !p.is_active }),
      })
      if (r.ok) {
        setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x))
        show(p.is_active ? 'Идэвхгүй болгосон' : 'Идэвхжүүлсэн ✓')
      }
    } catch {}
  }

  // ── Withdraw ────────────────────────────────────────────────────────────────
  async function requestWithdraw() {
    const amt = Number(withdrawAmt)
    if (!amt || amt <= 0) { show('Дүн оруулна уу', false); return }
    if (wallet && amt > wallet.balance) { show('Үлдэгдэл хүрэлцэхгүй', false); return }
    setWithdrawing(true)
    try {
      const r = await fetch(`${API}/wallet/withdraw`, {
        method: 'POST', headers: hdrs(),
        body: JSON.stringify({ amount: amt }),
      })
      if (r.ok) {
        show('Татан авах хүсэлт илгээгдлээ ✓')
        setWithdrawAmt('')
        await loadWallet()
      } else show('Хүсэлт илгээхэд алдаа гарлаа', false)
    } catch { show('Алдаа гарлаа', false) }
    setWithdrawing(false)
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
  }
  const btn = (color: string, ghost = false): React.CSSProperties => ({
    padding: '9px 16px', borderRadius: 8, border: ghost ? `1px solid ${color}` : 'none',
    background: ghost ? 'transparent' : color, color: ghost ? color : '#fff',
    cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: F,
  })

  // ── Revenue summary for orders tab ──────────────────────────────────────────
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_price), 0)
  const pendingOrders = orders.filter(o => ['pending', 'paid', 'in_production'].includes(o.status)).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: F, color: 'var(--text)' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.ok ? '#10B981' : '#EF4444', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          {toast.msg}
        </div>
      )}

      {/* Topbar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}><span style={{ color: '#FF6B00' }}>Biz</span>Print</span>
          <span style={{ fontSize: 11, background: 'rgba(255,107,0,0.1)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.3)', borderRadius: 20, padding: '2px 10px' }}>Вендор</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{user?.full_name || user?.email}</span>
          <NotificationBell userId={user?.id} />
          <button onClick={() => { localStorage.clear(); router.push('/') }}
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', color: 'var(--text)' }}>
            Гарах
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1300, margin: '0 auto' }}>

        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Вендорийн дэшбоард</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Таны бараа, захиалга, орлогын хяналт</p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Нийт бараа',      val: stats.total_products,               color: '#8B5CF6', icon: '📦', fmt: (v: number) => String(v) },
            { label: 'Нийт захиалга',   val: Number(stats.total_orders),         color: '#3B82F6', icon: '📋', fmt: (v: number) => String(v) },
            { label: 'Нийт борлуулалт', val: Number(stats.total_revenue),        color: '#FF6B00', icon: '💰', fmt: (v: number) => v.toLocaleString() + '₮' },
            { label: 'Хэтэвч',          val: wallet?.balance ?? 0,               color: '#10B981', icon: '💳', fmt: (v: number) => v.toLocaleString() + '₮' },
          ].map(c => (
            <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', borderTop: `3px solid ${c.color}` }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{loading ? '...' : c.fmt(c.val)}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24, gap: 4 }}>
          {([
            { key: 'products', label: `📦 Бараа (${products.length})` },
            { key: 'orders',   label: `📋 Захиалга (${orders.length})` },
            { key: 'wallet',   label: `💳 Хэтэвч` },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 600, color: tab === t.key ? '#FF6B00' : 'var(--text2)', borderBottom: `2px solid ${tab === t.key ? '#FF6B00' : 'transparent'}`, marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── PRODUCTS TAB ─────────────────────────────────────────────────── */}
        {tab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Миний бараа</div>
              <button onClick={openNew} style={btn('#FF6B00')}>+ Бараа нэмэх</button>
            </div>

            {/* Product form */}
            {showForm && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
                  {editId ? '✏️ Бараа засах' : '+ Шинэ бараа нэмэх'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 600 }}>Нэр (Монгол) *</div>
                    <input style={inp} value={form.name_mn} onChange={e => setForm(f => ({ ...f, name_mn: e.target.value, name: f.name || e.target.value }))} placeholder="Жишээ: A4 флаер" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 600 }}>Нэр (English)</div>
                    <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. A4 Flyer" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 600 }}>Ангилал</div>
                    <select style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 600 }}>Төрөл</div>
                    <select style={inp} value={form.product_type} onChange={e => setForm(f => ({ ...f, product_type: e.target.value as 'print' | 'ready' }))}>
                      <option value="print">Хэвлэл (print)</option>
                      <option value="ready">Бэлэн бараа (ready)</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 600 }}>Суурь үнэ (₮) *</div>
                    <input style={inp} type="number" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} placeholder="0" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 600 }}>Хамгийн бага захиалга</div>
                    <input style={inp} type="number" value={form.min_quantity} onChange={e => setForm(f => ({ ...f, min_quantity: e.target.value }))} placeholder="1" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 600 }}>Хүргэлтийн хугацаа (өдөр)</div>
                    <input style={inp} type="number" value={form.lead_time_days} onChange={e => setForm(f => ({ ...f, lead_time_days: e.target.value }))} placeholder="3" />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, fontWeight: 600 }}>Тайлбар</div>
                  <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' as const }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Барааны дэлгэрэнгүй тайлбар..." />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowForm(false)} style={btn('#888', true)}>Цуцлах</button>
                  <button onClick={saveProduct} disabled={saving} style={{ ...btn('#FF6B00'), opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Хадгалж байна...' : editId ? 'Шинэчлэх' : 'Нэмэх'}
                  </button>
                </div>
              </div>
            )}

            {/* Product list */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Уншиж байна...</div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, border: '2px dashed var(--border)', borderRadius: 16, color: 'var(--text2)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Бараа байхгүй байна</div>
                <div style={{ fontSize: 13 }}>Дээрх товчийг дарж анхны барааг нэмнэ үү</div>
              </div>
            ) : (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 0.7fr 0.6fr 120px', padding: '10px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  <span>Бараа</span><span>Ангилал</span><span>Үнэ</span><span>Min тоо</span><span>Хугацаа</span><span>Төлөв</span><span>Үйлдэл</span>
                </div>
                {products.map((p, i) => (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 0.7fr 0.6fr 120px', padding: '12px 20px', borderBottom: i < products.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name_mn || p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                        <span style={{ background: p.product_type === 'print' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)', color: p.product_type === 'print' ? '#3B82F6' : '#10B981', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                          {p.product_type === 'print' ? 'Хэвлэл' : 'Бэлэн'}
                        </span>
                      </div>
                    </div>
                    <span style={{ color: 'var(--text2)', fontSize: 12 }}>{p.category}</span>
                    <span style={{ fontWeight: 600, color: '#FF6B00' }}>{Number(p.base_price).toLocaleString()}₮</span>
                    <span style={{ color: 'var(--text2)' }}>{p.min_quantity} ш</span>
                    <span style={{ color: 'var(--text2)' }}>{p.lead_time_days} өдөр</span>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <div
                          onClick={() => toggleActive(p)}
                          style={{ width: 34, height: 20, borderRadius: 10, background: p.is_active ? '#10B981' : 'var(--border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                          <div style={{ position: 'absolute', top: 2, left: p.is_active ? 16 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                        </div>
                        <span style={{ fontSize: 11, color: p.is_active ? '#10B981' : 'var(--text3)', fontWeight: 600 }}>
                          {p.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                        </span>
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(p)}
                        style={{ padding: '5px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text)' }}>
                        ✏️
                      </button>
                      <button onClick={() => deleteProduct(p.id)} disabled={deleting === p.id}
                        style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#EF4444' }}>
                        {deleting === p.id ? '...' : '🗑'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS TAB ────────────────────────────────────────────────────── */}
        {tab === 'orders' && (
          <div>
            {/* Mini stats */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Нийт захиалга',         val: orders.length,                              color: '#3B82F6' },
                { label: 'Идэвхтэй захиалга',     val: pendingOrders,                              color: '#F59E0B' },
                { label: 'Нийт борлуулалт',       val: totalRevenue.toLocaleString() + '₮',        color: '#FF6B00' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Уншиж байна...</div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, border: '2px dashed var(--border)', borderRadius: 16, color: 'var(--text2)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Захиалга байхгүй байна</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Таны барааг захиалбал энд харагдана</div>
              </div>
            ) : (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 0.8fr 1fr 1fr 1.2fr', padding: '10px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  <span>Захиалга ID</span><span>Бараа</span><span>Тоо</span><span>Дүн</span><span>Хэрэглэгч</span><span>Төлөв</span>
                </div>
                {orders.map((o, i) => {
                  const st = ORDER_STATUS_MN[o.status] ?? { label: o.status, color: '#888' }
                  return (
                    <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 0.8fr 1fr 1fr 1.2fr', padding: '12px 20px', borderBottom: i < orders.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', fontSize: 13 }}>
                      <code style={{ fontSize: 11, color: 'var(--text2)' }}>{o.id.slice(0, 10)}...</code>
                      <span style={{ fontWeight: 500 }}>{o.product_name || '—'}</span>
                      <span>{o.quantity} ш</span>
                      <span style={{ fontWeight: 600, color: '#FF6B00' }}>{Number(o.total_price).toLocaleString()}₮</span>
                      <span style={{ color: 'var(--text2)', fontSize: 12 }}>{o.customer_name || '—'}</span>
                      <span style={{ background: st.color + '20', color: st.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, width: 'fit-content' }}>
                        {st.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── WALLET TAB ────────────────────────────────────────────────────── */}
        {tab === 'wallet' && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>

            {/* Balance card */}
            <div>
              <div style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9500)', borderRadius: 16, padding: '28px 24px', color: '#fff', marginBottom: 16 }}>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>💳 Хэтэвчийн үлдэгдэл</div>
                <div style={{ fontSize: 36, fontWeight: 800 }}>{(wallet?.balance ?? 0).toLocaleString()}₮</div>
                <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>Нийт орлого</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{(wallet?.total_earned ?? 0).toLocaleString()}₮</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>Татан авсан</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{(wallet?.total_withdrawn ?? 0).toLocaleString()}₮</div>
                  </div>
                </div>
              </div>

              {/* Withdraw form */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Мөнгө татан авах</div>
                <input
                  style={{ ...inp, marginBottom: 12 }}
                  type="number"
                  placeholder="Дүн оруулах (₮)"
                  value={withdrawAmt}
                  onChange={e => setWithdrawAmt(e.target.value)}
                />
                <button onClick={requestWithdraw} disabled={withdrawing}
                  style={{ ...btn('#FF6B00'), width: '100%', textAlign: 'center' as const, opacity: withdrawing ? 0.7 : 1 }}>
                  {withdrawing ? 'Илгээж байна...' : 'Татан авах хүсэлт'}
                </button>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10 }}>
                  Хүсэлтийг admin баталгаажуулсны дараа шилжүүлэг хийгдэнэ.
                </div>
              </div>
            </div>

            {/* Transactions */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
                Гүйлгээний түүх
              </div>
              {txns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💸</div>
                  <div>Гүйлгээ байхгүй байна</div>
                </div>
              ) : txns.map((tx, i) => {
                const isCredit = ['credit', 'commission', 'delivery_fee'].includes(tx.type)
                return (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: i < txns.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.source || tx.type}</div>
                      {tx.note && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{tx.note}</div>}
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                        {new Date(tx.created_at).toLocaleDateString('mn-MN')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isCredit ? '#10B981' : '#EF4444' }}>
                        {isCredit ? '+' : '-'}{Number(tx.amount).toLocaleString()}₮
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {Number(tx.balance_after).toLocaleString()}₮
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
