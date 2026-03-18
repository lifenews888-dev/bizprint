'use client';
import { useState, useEffect } from 'react';

const API = 'http://localhost:4000';

interface Order {
  id: string;
  status: string;
  payment_status: string;
  product_name: string;
  quantity: number;
  total_price: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
  customer_name: string;
  invoice_no: string;
  notes: string;
  file_url: string;
}

const FLOW = [
  { key: 'pending',       label: 'Order Placed',    icon: '📝', color: '#6b7280' },
  { key: 'paid',          label: 'Payment Done',     icon: '💳', color: '#2563eb' },
  { key: 'in_production', label: 'In Production',   icon: '⚙️',  color: '#d97706' },
  { key: 'completed',     label: 'Production Done', icon: '✅', color: '#16a34a' },
  { key: 'shipped',       label: 'Shipped',         icon: '📦', color: '#7c3aed' },
  { key: 'delivered',     label: 'Delivered',       icon: '🏠', color: '#059669' },
];

const STATUS_INDEX: Record<string, number> = {
  pending: 0, paid: 1, in_production: 2,
  completed: 3, shipped: 4, delivered: 5, cancelled: -1,
};

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  pending:       { bg: '#f3f4f6', color: '#6b7280' },
  paid:          { bg: '#dbeafe', color: '#2563eb' },
  in_production: { bg: '#fef3c7', color: '#d97706' },
  completed:     { bg: '#dcfce7', color: '#16a34a' },
  shipped:       { bg: '#ede9fe', color: '#7c3aed' },
  delivered:     { bg: '#d1fae5', color: '#059669' },
  cancelled:     { bg: '#fee2e2', color: '#dc2626' },
};

export default function OrderStatusPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (t) fetchMe(t);
    else setLoading(false);
  }, []);

  async function fetchMe(t: string) {
    try {
      const res = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      setUserId(data.id);
      fetchOrders(t, data.id);
    } catch { setLoading(false); }
  }

  async function fetchOrders(t: string, uid: string) {
    try {
      const res = await fetch(`${API}/customer-dashboard/${uid}/orders`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setOrders(list);
      if (list.length > 0) setSelected(list[0]);
    } catch {}
    finally { setLoading(false); }
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const currentStep = selected ? (STATUS_INDEX[selected.status] ?? 0) : 0;
  const isCancelled = selected?.status === 'cancelled';
  const sc = selected ? (STATUS_COLOR[selected.status] || STATUS_COLOR.pending) : STATUS_COLOR.pending;

  if (!token) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
      Please login to view your orders.
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>My Orders</h1>
        <p style={{ color: 'var(--text2)', margin: '4px 0 0', fontSize: 14 }}>Track your order status in real-time</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'pending', 'paid', 'in_production', 'completed', 'delivered', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 12px', borderRadius: 99, border: '1px solid var(--border)',
            background: filter === f ? 'var(--orange)' : 'var(--surface)',
            color: filter === f ? '#fff' : 'var(--text2)',
            cursor: 'pointer', fontSize: 12, fontWeight: 500,
          }}>
            {f === 'all' ? 'All' : f.replace('_', ' ')}
            {f === 'all' ? ` (${orders.length})` : ` (${orders.filter(o => o.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Loading...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, border: '2px dashed var(--border)', borderRadius: 16, color: 'var(--text2)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 600 }}>No orders yet</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>

          {/* Order list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text2)', fontSize: 13 }}>No orders in this status</div>
            ) : filtered.map(o => {
              const s = STATUS_COLOR[o.status] || STATUS_COLOR.pending;
              return (
                <div key={o.id} onClick={() => setSelected(o)} style={{
                  padding: '14px 16px', borderRadius: 12,
                  border: `2px solid ${selected?.id === o.id ? 'var(--orange)' : 'var(--border)'}`,
                  background: selected?.id === o.id ? 'var(--orange-04)' : 'var(--surface)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: selected?.id === o.id ? 'var(--orange)' : 'var(--text)' }}>
                      #{o.id.slice(0, 8).toUpperCase()}
                    </div>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 99,
                      background: s.bg, color: s.color, fontWeight: 600,
                    }}>
                      {o.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 6, fontWeight: 500 }}>
                    {o.product_name || 'Product'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>Qty: {o.quantity}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)' }}>
                      T{Number(o.total_price).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                    {new Date(o.created_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order detail */}
          {selected && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>

              {/* Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 24, padding: '14px 18px', borderRadius: 12,
                background: isCancelled ? '#fee2e2' : sc.bg,
              }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>Order #{selected.id.slice(0, 8).toUpperCase()}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: isCancelled ? '#dc2626' : sc.color, marginTop: 2 }}>
                    {isCancelled ? 'Cancelled' : FLOW[currentStep]?.label}
                  </div>
                </div>
                <div style={{ fontSize: 32 }}>{isCancelled ? '❌' : FLOW[currentStep]?.icon}</div>
              </div>

              {/* Timeline */}
              {!isCancelled && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 14, textTransform: 'uppercase' }}>
                    Order Progress
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    {FLOW.map((step, i) => {
                      const done = i <= currentStep;
                      const active = i === currentStep;
                      return (
                        <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < FLOW.length - 1 ? 1 : 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: done ? step.color : 'var(--surface2)',
                              border: `2px solid ${done ? step.color : 'var(--border)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: done ? 14 : 12,
                              boxShadow: active ? `0 0 0 4px ${step.color}30` : 'none',
                              transition: 'all 0.2s', flexShrink: 0,
                            }}>
                              {done ? (active ? step.icon : '✓') : <span style={{ color: 'var(--text3)', fontSize: 11 }}>{i + 1}</span>}
                            </div>
                            <div style={{
                              fontSize: 10, fontWeight: active ? 700 : 400,
                              color: done ? step.color : 'var(--text3)',
                              textAlign: 'center', whiteSpace: 'nowrap',
                            }}>
                              {step.label}
                            </div>
                          </div>
                          {i < FLOW.length - 1 && (
                            <div style={{
                              flex: 1, height: 2, marginBottom: 22,
                              background: i < currentStep ? step.color : 'var(--border)',
                              transition: 'background 0.3s',
                            }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Product', value: selected.product_name || '-' },
                  { label: 'Quantity', value: selected.quantity },
                  { label: 'Unit Price', value: `T${Number(selected.unit_price || 0).toLocaleString()}` },
                  { label: 'Total', value: `T${Number(selected.total_price).toLocaleString()}` },
                  { label: 'Payment', value: selected.payment_status || 'pending' },
                  { label: 'Invoice', value: selected.invoice_no || '-' },
                  { label: 'Ordered', value: new Date(selected.created_at).toLocaleDateString() },
                  { label: 'Updated', value: new Date(selected.updated_at).toLocaleDateString() },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10,
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {selected.notes && (
                <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Notes</div>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{selected.notes}</div>
                </div>
              )}

              {selected.file_url && (
                <a href={selected.file_url} target="_blank" rel="noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8,
                  border: '1px solid var(--border)', color: 'var(--orange)',
                  textDecoration: 'none', fontSize: 13, fontWeight: 500,
                }}>
                  📎 View File
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
