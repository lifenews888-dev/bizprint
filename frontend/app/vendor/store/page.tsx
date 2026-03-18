'use client';
import { useState, useEffect, useRef, CSSProperties, ChangeEvent } from 'react';

const API = 'http://localhost:4000';

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

export default function VendorStorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
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
      setError('Failed to load products');
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
      name: p.name,
      name_mn: p.name_mn,
      category: p.category,
      base_price: String(p.base_price),
      sale_price: String(p.sale_price || ''),
      stock_quantity: String(p.stock_quantity || ''),
      sku: p.sku || '',
      description: p.description || '',
      thumbnail_url: p.thumbnail_url || '',
      product_type: p.product_type,
      is_active: p.is_active,
    });
    setError('');
    setShowModal(true);
  }

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/upload/file`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      const url = data.url || data.path || data.filename;
      setForm(f => ({ ...f, thumbnail_url: url }));
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!token) return;
    if (!form.name || !form.category || !form.base_price) {
      setError('Name, category, and price are required');
      return;
    }
    setSaving(true);
    setError('');
    const body = {
      ...form,
      base_price: parseFloat(form.base_price),
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
      stock_quantity: form.stock_quantity ? parseInt(form.stock_quantity) : null,
    };
    try {
      const url = editProduct
        ? `${API}/vendor-store/products/${editProduct.id}`
        : `${API}/vendor-store/products`;
      const method = editProduct ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      setShowModal(false);
      loadProducts(token);
      loadStats(token);
    } catch {
      setError('Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token || !confirm('Delete this product?')) return;
    await fetch(`${API}/vendor-store/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    loadProducts(token);
    loadStats(token);
  }

  async function toggleActive(p: Product) {
    if (!token) return;
    await fetch(`${API}/vendor-store/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    loadProducts(token);
  }

  const imgSrc = (url: string) => url.startsWith('http') ? url : `${API}/${url}`;

  if (!token) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
      <p>Please login to access Vendor Store.</p>
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>My Store</h1>
          <p style={{ color: 'var(--text2)', margin: '4px 0 0', fontSize: 14 }}>Manage your products</p>
        </div>
        <button onClick={openCreate} style={{
          background: 'var(--orange)', color: '#fff', border: 'none',
          borderRadius: 8, padding: '10px 20px', fontWeight: 600,
          cursor: 'pointer', fontSize: 14,
        }}>
          + Add Product
        </button>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Products', value: stats.total_products },
            { label: 'Total Orders', value: stats.total_orders },
            { label: 'Revenue', value: `T${Number(stats.total_revenue).toLocaleString()}` },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '16px 20px',
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--orange)' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Loading...</div>
      ) : products.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          border: '2px dashed var(--border)', borderRadius: 16, color: 'var(--text2)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>=</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>No products yet</div>
          <div style={{ fontSize: 14 }}>Click Add Product to get started</div>
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
                  ? <img src={imgSrc(p.thumbnail_url)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 40 }}>=</span>
                }
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{p.category}</div>
                  </div>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap',
                    background: p.is_active ? '#dcfce7' : '#fee2e2',
                    color: p.is_active ? '#16a34a' : '#dc2626', fontWeight: 600,
                  }}>
                    {p.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--orange)' }}>
                    T{Number(p.base_price).toLocaleString()}
                  </span>
                  {p.sale_price && (
                    <span style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'line-through' }}>
                      T{Number(p.sale_price).toLocaleString()}
                    </span>
                  )}
                </div>
                {p.stock_quantity != null && (
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>Stock: {p.stock_quantity}</div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button onClick={() => openEdit(p)} style={{
                    flex: 1, padding: '7px 0', border: '1px solid var(--border)',
                    borderRadius: 7, background: 'transparent', cursor: 'pointer',
                    color: 'var(--text)', fontSize: 13, fontWeight: 500,
                  }}>Edit</button>
                  <button onClick={() => toggleActive(p)} style={{
                    flex: 1, padding: '7px 0', border: '1px solid var(--border)',
                    borderRadius: 7, background: 'transparent', cursor: 'pointer',
                    color: 'var(--text2)', fontSize: 13,
                  }}>{p.is_active ? 'Hide' : 'Show'}</button>
                  <button onClick={() => handleDelete(p.id)} style={{
                    padding: '7px 12px', border: '1px solid #fca5a5',
                    borderRadius: 7, background: 'transparent', cursor: 'pointer',
                    color: '#dc2626', fontSize: 13,
                  }}>Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16,
        }}>
          <div style={{
            background: 'var(--bg)', borderRadius: 16, padding: 28,
            width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                {editProduct ? 'Edit Product' : 'New Product'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{
                background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text2)',
              }}>X</button>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Product Image</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {form.thumbnail_url && (
                    <img src={imgSrc(form.thumbnail_url)} alt=""
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                  )}
                  <button onClick={() => fileRef.current?.click()} style={{
                    padding: '8px 14px', border: '1px solid var(--border)',
                    borderRadius: 8, background: 'var(--surface)', cursor: 'pointer',
                    color: 'var(--text)', fontSize: 13,
                  }}>
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Name (EN) *</label>
                  <input style={inputStyle} value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Product name" />
                </div>
                <div>
                  <label style={labelStyle}>Name (MN)</label>
                  <input style={inputStyle} value={form.name_mn}
                    onChange={e => setForm(f => ({ ...f, name_mn: e.target.value }))} placeholder="Mongolian name" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <input style={inputStyle} value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. sticker" />
                </div>
                <div>
                  <label style={labelStyle}>SKU</label>
                  <input style={inputStyle} value={form.sku}
                    onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="SKU-001" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Price *</label>
                  <input style={inputStyle} type="number" value={form.base_price}
                    onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label style={labelStyle}>Sale Price</label>
                  <input style={inputStyle} type="number" value={form.sale_price}
                    onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <label style={labelStyle}>Stock</label>
                  <input style={inputStyle} type="number" value={form.stock_quantity}
                    onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))} placeholder="0" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Product Type</label>
                <select style={inputStyle} value={form.product_type}
                  onChange={e => setForm(f => ({ ...f, product_type: e.target.value }))}>
                  <option value="ready">Ready (in stock)</option>
                  <option value="print">Print on demand</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Product description..." />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="is_active" checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <label htmlFor="is_active" style={{ fontSize: 14, color: 'var(--text)', cursor: 'pointer' }}>
                  Active (visible to customers)
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, padding: '10px 0', border: '1px solid var(--border)',
                borderRadius: 8, background: 'transparent', cursor: 'pointer',
                color: 'var(--text)', fontWeight: 500,
              }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 2, padding: '10px 0', border: 'none',
                borderRadius: 8, background: 'var(--orange)', color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600,
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'Saving...' : editProduct ? 'Save Changes' : 'Create Product'}
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
