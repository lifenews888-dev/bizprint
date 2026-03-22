'use client';
import { useState, useEffect } from 'react';

interface Delivery {
  id: number;
  status: string;
  courier_name?: string;
  courier_phone?: string;
  address?: string;
  note?: string;
  estimated_at?: string;
  created_at: string;
  updated_at: string;
  order?: {
    id: string;
    status: string;
    total_price: number;
    created_at: string;
  };
}

interface Order {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  product_name?: string;
}

const STEPS = [
  { key: 'assigned',   label: 'Assigned',    icon: '📋', desc: 'Courier assigned' },
  { key: 'picked_up',  label: 'Picked Up',   icon: '📦', desc: 'Package picked up' },
  { key: 'on_the_way', label: 'On the Way',  icon: '🚚', desc: 'Out for delivery' },
  { key: 'delivered',  label: 'Delivered',   icon: '✅', desc: 'Package delivered' },
];

const STATUS_INDEX: Record<string, number> = {
  assigned: 0, picked_up: 1, on_the_way: 2, delivered: 3, failed: -1,
};

export default function DeliveryTrackingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackLoading, setTrackLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (t) {
      fetchMe(t);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchMe(t: string) {
    try {
      const data = await apiFetch(`/auth/me`,
      });
      setUserId(data.id);
      fetchOrders(t, data.id);
    } catch {
      setLoading(false);
    }
  }

  async function fetchOrders(t: string, uid: string) {
    try {
      const data = await apiFetch(`/customer-dashboard/${uid}/orders`,
      });
      const list = Array.isArray(data) ? data : (data.orders || []);
      setOrders(list);
      if (list.length > 0) {
        selectOrder(list[0].id, t);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function selectOrder(orderId: string, t?: string) {
    const tok = t || token;
    if (!tok) return;
    setSelectedOrder(orderId);
    setDelivery(null);
    setTrackLoading(true);
    try {
      const res = await apiFetch(`/delivery/order/${orderId}`,
      });
      const data = res;
        setDelivery(data);
      } else {
        setDelivery(null);
      }
    } catch {
      setDelivery(null);
    } finally {
      setTrackLoading(false);
    }
  }

  const currentStep = delivery ? (STATUS_INDEX[delivery.status] ?? 0) : -1;
  const isFailed = delivery?.status === 'failed';

  if (!token) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
      <p>Please login to track your delivery.</p>
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Delivery Tracking</h1>
        <p style={{ color: 'var(--text2)', margin: '4px 0 0', fontSize: 14 }}>Track your order delivery status</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          border: '2px dashed var(--border)', borderRadius: 16, color: 'var(--text2)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 600 }}>No orders found</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
          {/* Order list */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Orders
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {orders.map(o => (
                <div key={o.id} onClick={() => selectOrder(o.id)} style={{
                  padding: '12px 14px', borderRadius: 10,
                  border: `2px solid ${selectedOrder === o.id ? 'var(--orange)' : 'var(--border)'}`,
                  background: selectedOrder === o.id ? 'rgba(255,107,0,0.06)' : 'var(--surface)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: selectedOrder === o.id ? 'var(--orange)' : 'var(--text)' }}>
                    Order #{o.id.slice(0, 8)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>
                    {new Date(o.created_at).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>
                    T{Number(o.total_price).toLocaleString()}
                  </div>
                  <span style={{
                    fontSize: 11, padding: '2px 7px', borderRadius: 99, marginTop: 6, display: 'inline-block',
                    background: o.status === 'delivered' ? '#dcfce7' : o.status === 'paid' ? '#dbeafe' : '#fef9c3',
                    color: o.status === 'delivered' ? '#16a34a' : o.status === 'paid' ? '#2563eb' : '#854d0e',
                    fontWeight: 600,
                  }}>
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking panel */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 24,
          }}>
            {trackLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Loading tracking info...</div>
            ) : !delivery ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🚫</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>No delivery info yet</div>
                <div style={{ fontSize: 13 }}>Delivery will appear here once assigned</div>
              </div>
            ) : (
              <>
                {/* Status header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28,
                  padding: '14px 18px', borderRadius: 12,
                  background: isFailed ? '#fee2e2' : delivery.status === 'delivered' ? '#dcfce7' : 'rgba(255,107,0,0.08)',
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>Current Status</div>
                    <div style={{
                      fontSize: 18, fontWeight: 700, marginTop: 2,
                      color: isFailed ? '#dc2626' : delivery.status === 'delivered' ? '#16a34a' : 'var(--orange)',
                    }}>
                      {isFailed ? 'Delivery Failed' : STEPS[currentStep]?.label || delivery.status}
                    </div>
                  </div>
                  <div style={{ fontSize: 32 }}>
                    {isFailed ? '❌' : STEPS[currentStep]?.icon || '📋'}
                  </div>
                </div>

                {/* Timeline */}
                {!isFailed && (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ position: 'relative', paddingLeft: 0 }}>
                      {STEPS.map((step, i) => {
                        const done = i <= currentStep;
                        const active = i === currentStep;
                        return (
                          <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: i < STEPS.length - 1 ? 0 : 0 }}>
                            {/* Line + dot column */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 16, width: 28 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                background: done ? 'var(--orange)' : 'var(--surface2)',
                                border: `2px solid ${done ? 'var(--orange)' : 'var(--border)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, color: done ? '#fff' : 'var(--text3)',
                                boxShadow: active ? '0 0 0 4px rgba(255,107,0,0.2)' : 'none',
                                transition: 'all 0.2s',
                              }}>
                                {done ? '✓' : i + 1}
                              </div>
                              {i < STEPS.length - 1 && (
                                <div style={{
                                  width: 2, height: 36,
                                  background: i < currentStep ? 'var(--orange)' : 'var(--border)',
                                  transition: 'background 0.3s',
                                }} />
                              )}
                            </div>
                            {/* Content */}
                            <div style={{ paddingBottom: i < STEPS.length - 1 ? 8 : 0, paddingTop: 4 }}>
                              <div style={{
                                fontSize: 14, fontWeight: active ? 700 : 500,
                                color: done ? 'var(--text)' : 'var(--text3)',
                              }}>
                                {step.icon} {step.label}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                                {step.desc}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Courier info */}
                {(delivery.courier_name || delivery.courier_phone) && (
                  <div style={{
                    padding: '14px 16px', borderRadius: 10,
                    border: '1px solid var(--border)', marginBottom: 16,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase' }}>
                      Courier Info
                    </div>
                    {delivery.courier_name && (
                      <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                        👤 {delivery.courier_name}
                      </div>
                    )}
                    {delivery.courier_phone && (
                      <a href={`tel:${delivery.courier_phone}`} style={{
                        fontSize: 14, color: 'var(--orange)', textDecoration: 'none', fontWeight: 600,
                      }}>
                        📞 {delivery.courier_phone}
                      </a>
                    )}
                  </div>
                )}

                {/* Delivery details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {delivery.address && (
                    <div style={{ padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Address</div>
                      <div style={{ fontSize: 13, color: 'var(--text)' }}>📍 {delivery.address}</div>
                    </div>
                  )}
                  {delivery.estimated_at && (
                    <div style={{ padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Est. Delivery</div>
                      <div style={{ fontSize: 13, color: 'var(--text)' }}>
                        🕐 {new Date(delivery.estimated_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {delivery.note && (
                    <div style={{ padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10, gridColumn: '1/-1' }}>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Note</div>
                      <div style={{ fontSize: 13, color: 'var(--text)' }}>💬 {delivery.note}</div>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 16, textAlign: 'right' }}>
                  Last updated: {new Date(delivery.updated_at).toLocaleString()}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
