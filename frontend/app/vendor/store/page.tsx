'use client';
import { useState, useEffect, useRef, CSSProperties, ChangeEvent } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://bizprint-production.up.railway.app';
const F = "'DM Sans','Segoe UI',system-ui,sans-serif";

interface Product {
  id: string;
  name: string;
  name_mn: string;
  category: string;
  base_price: number;
  sale_price?: number;
  stock_quantity?: number;
  thumbnail_url?: string;
  is_active: boolean;
  product_type: string;
  description?: string;
  sku?: string;
  created_at: string;
}

interface Stats {
  total_orders: string;
  total_revenue: string;
  total_products: string;
}

const EMPTY_FORM = {
  name: '',
  name_mn: '',
  category: '',
  base_price: '',
  sale_price: '',
  stock_quantity: '',
  sku: '',
  description: '',
  thumbnail_url: '',
  product_type: 'ready',
  is_active: true,
};

const tok = () =>
  (typeof window !== 'undefined'
    ? localStorage.getItem('access_token') || localStorage.getItem('token')
    : '') || '';

export default function VendorStorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,    setError]    = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = tok();
    if (t) {
      loadProducts(t);
      loadStats(t);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadProducts(t: string) {
    setLoading(true);
    try {
      const res = await fetch(`${API}/vendor-store/products`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setError('Бүтээгдэхүүн ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }

  async function loadStats(t: string) {
    try {
      const res = await fetch(`${API}/vendor-store/stats`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setStats(data);
    } catch {}
  }

  function openCreate() {
    setEditProduct(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditProduct(p);
    setForm({
      name:           p.name,
      name_mn:        p.name_mn,
      category:       p.category,
      base_price:     String(p.base_price),
      sale_price:     String(p.sale_price || ''),
      stock_quantity: String(p.stock_quantity || ''),
      sku:            p.sku || '',
      description:    p.description || '',
      thumbnail_url:  p.thumbnail_url || '',
      product_type:   p.product_type,
      is_active:      p.is_active,
    });
    setError('');
    setShowModal(true);
  }

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const t = tok();
    if (!file || !t) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/upload/file`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
        body: fd,
      });
      const data = await res.json();
      const url = data.url || data.path || data.filename;
      setForm(f => ({ ...f, thumbnail_url: url }));
    } catch {
      setError('Зураг байршуулахад алдаа гарлаа');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    const t = tok();
    if (!t) return;
    if (!form.name || !form.category || !form.base_price) {
      setError('Нэр, ангилал болон үнэ шаардлагатай');
      return;
    }
    setSaving(true);
    setError('');
    const body = {
      ...form,
      base_price:     parseFloat(form.base_price),
      sale_price:     form.sale_price     ? parseFloat(form.sale_price)     : null,
      stock_quantity: form.stock_quantity ? parseInt(form.stock_quantity)   : null,
    };
    try {
      const url    = editProduct ? `${API}/vendor-store/products/${editProduct.id}` : `${API}/vendor-store/products`;
      const method = editProduct ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      setShowModal(false);
      loadProducts(t);
      loadStats(t);
    } catch {
      setError('Хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const t = tok();
    if (!t || !confirm('Энэ бүтээгдэхүүнийг устгах уу?')) return;
    await fetch(`${API}/vendor-store/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${t}` },
    });
    loadProducts(t);
    loadStats(t);
  }

  async function toggleActive(p: Product) {
    const t = tok();
    if (!t) return;
    await fetch(`${API}/vendor-store/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    loadProducts(t);
  }

  const imgSrc = (url: string) => url.startsWith('http') ? url : `${API}/${url}`;

  if (!tok()) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)', fontFamily: F }}>
      <p>Нэвтрэнэ үү.</p>
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto', fontFamily: F }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Миний дэлгүүр</h1>
          <p style={{ color: 'var(--text2)', margin: '4px 0 0', fontSize: 14 }}>Бүтээгдэхүүнүүдийг удирдах</p>
        </div>
        <button onClick={openCreate} style={{
          background: '#FF6B00', color: '#fff', border: 'none',
          borderRadius: 8, padding: '10px 20px', fontWeight: 600,
          cursor: 'pointer', fontSize: 14, fontFamily: F,
        }}>
          + Бүтээгдэхүүн нэмэх
        </button>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Нийт бүтээгдэхүүн', value: stats.total_products },
            { label: 'Нийт захиалга',      value: stats.total_orders },
            { label: 'Орлого',             value: `${Number(stats.total_revenue).toLocaleString()}₮` },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '16px 20px',
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#FF6B00' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Уншиж байна...</div>
      ) : products.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          border: '2px dashed var(--border)', borderRadius: 16, color: 'var(--text2)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Бүтээгдэхүүн байхгүй</div>
          <div style={{ fontSize: 14 }}>«Бүтээгдэхүүн нэмэх» дарж эхлэнэ үү</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {products.map(p => (
            <div key={p.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, overflow: 'hidden', opacity: p.is_active ? 1 : 0.6,
            }}>
              <div style={{
                height: 160, background: 'var(--surface2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                {p.thumbnail_url
                  ? <img src={imgSrc(p.thumbnail_url)} alt={p.name_mn || p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 40 }}>🖼</span>
                }
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15 }}>{p.name_mn || p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{p.category}</div>
                  </div>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap',
                    background: p.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                    color: p.is_active ? '#10B981' : '#EF4444', fontWeight: 600,
                  }}>
                    {p.is_active ? 'Идэвхтэй' : 'Нуугдсан'}
                  </span>
                </div>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#FF6B00' }}>
                    {Number(p.base_price).toLocaleString()}₮
                  </span>
                  {p.sale_price && (
                    <span style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'line-through' }}>
                      {Number(p.sale_price).toLocaleString()}₮
                    </span>
                  )}
                </div>
                {p.stock_quantity != null && (
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>Нөөц: {p.stock_quantity}</div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button onClick={() => openEdit(p)} style={{
                    flex: 1, padding: '7px 0', border: '1px solid var(--border)',
                    borderRadius: 7, background: 'transparent', cursor: 'pointer',
                    color: 'var(--text)', fontSize: 13, fontWeight: 500, fontFamily: F,
                  }}>Засах</button>
                  <button onClick={() => toggleActive(p)} style={{
                    flex: 1, padding: '7px 0', border: '1px solid var(--border)',
                    borderRadius: 7, background: 'transparent', cursor: 'pointer',
                    color: 'var(--text2)', fontSize: 13, fontFamily: F,
                  }}>{p.is_active ? 'Нуух' : 'Харуулах'}</button>
                  <button onClick={() => handleDelete(p.id)} style={{
                    padding: '7px 12px', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 7, background: 'transparent', cursor: 'pointer',
                    color: '#EF4444', fontSize: 13, fontFamily: F,
                  }}>Устгах</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16,
        }}>
          <div style={{
            background: 'var(--bg)', borderRadius: 16, padding: 28,
            width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                {editProduct ? 'Бүтээгдэхүүн засах' : 'Шинэ бүтээгдэхүүн'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
                width: 32, height: 32, fontSize: 16, cursor: 'pointer', color: 'var(--text2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>

            {error && (
              <div style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Зураг</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {form.thumbnail_url && (
                    <img src={imgSrc(form.thumbnail_url)} alt=""
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                  )}
                  <button onClick={() => fileRef.current?.click()} style={{
                    padding: '8px 14px', border: '1px solid var(--border)',
                    borderRadius: 8, background: 'var(--surface)', cursor: 'pointer',
                    color: 'var(--text)', fontSize: 13, fontFamily: F,
                  }}>
                    {uploading ? 'Байршуулж байна...' : 'Зураг оруулах'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Нэр (EN) *</label>
                  <input style={inputStyle} value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Бүтээгдэхүүний нэр" />
                </div>
                <div>
                  <label style={labelStyle}>Нэр (MN)</label>
                  <input style={inputStyle} value={form.name_mn}
                    onChange={e => setForm(f => ({ ...f, name_mn: e.target.value }))} placeholder="Монгол нэр" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Ангилал *</label>
                  <input style={inputStyle} value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="жнэ: sticker" />
                </div>
                <div>
                  <label style={labelStyle}>SKU</label>
                  <input style={inputStyle} value={form.sku}
                    onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="SKU-001" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Үнэ *</label>
                  <input style={inputStyle} type="number" value={form.base_price}
                    onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label style={labelStyle}>Хямдарсан үнэ</label>
                  <input style={inputStyle} type="number" value={form.sale_price}
                    onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label style={labelStyle}>Нөөц</label>
                  <input style={inputStyle} type="number" value={form.stock_quantity}
                    onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))} placeholder="0" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Бүтээгдэхүүний төрөл</label>
                <select style={inputStyle} value={form.product_type}
                  onChange={e => setForm(f => ({ ...f, product_type: e.target.value }))}>
                  <option value="ready">Бэлэн (нөөцтэй)</option>
                  <option value="print">Хэвлэлийн захиалга</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Тайлбар</label>
                <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Бүтээгдэхүүний тайлбар..." />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="is_active" checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <label htmlFor="is_active" style={{ fontSize: 14, color: 'var(--text)', cursor: 'pointer' }}>
                  Идэвхтэй (харагдах)
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, padding: '10px 0', border: '1px solid var(--border)',
                borderRadius: 8, background: 'transparent', cursor: 'pointer',
                color: 'var(--text)', fontWeight: 500, fontFamily: F,
              }}>Болих</button>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 2, padding: '10px 0', border: 'none',
                borderRadius: 8, background: '#FF6B00', color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600,
                opacity: saving ? 0.7 : 1, fontFamily: F,
              }}>
                {saving ? 'Хадгалж байна...' : editProduct ? 'Хадгалах' : 'Үүсгэх'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em',
};

const inputStyle: CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border)',
  borderRadius: 8, background: 'var(--surface)', color: 'var(--text)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
