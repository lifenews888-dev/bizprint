'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Inquiry {
  id: string;
  inquiry_number: string;
  status: string;
  product_name: string;
  category: string;
  quantity: number;
  customer_name: string;
  customer_phone: string;
  estimated_price?: number;
  vendor_id?: string;
  vendor_accepted?: boolean;
  vendor_assigned_at?: string;
  vendor_sla_deadline?: string;
  reassign_count?: number;
  created_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || '';

function timeAgo(iso?: string) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min} мин`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}ц ${min % 60}м`;
  return `${Math.floor(hr / 24)} өдөр`;
}

function overdueByMin(deadline?: string) {
  if (!deadline) return null;
  const ms = Date.now() - new Date(deadline).getTime();
  return Math.floor(ms / 60000);
}

export default function SlaMonitorPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API}/api/print-inquiries?sla_overdue=true&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.data || data?.items || []);
      setItems(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const forceReassign = async (id: string) => {
    if (!confirm('Дараагийн vendor-т дахин хуваарилах уу?')) return;
    setBusyId(id);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API}/api/print-inquiries/${id}/force-reassign`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Алдаа');
      await load();
    } catch (e: any) {
      alert(e.message || 'Алдаа гарлаа');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>⏰ SLA Monitor</h1>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            30 минутаас хэтэрсэн, vendor хүлээж аваагүй захиалгууд (60 секунд тутамд шинэчлэгдэнэ)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{
            padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 8,
            background: 'var(--surface)', color: 'var(--text)', fontSize: 12, cursor: 'pointer',
          }}>🔄 Дахин ачаалах</button>
          <Link href="/admin/inquiries" style={{
            padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 8,
            background: 'var(--surface)', color: 'var(--text)', fontSize: 12, textDecoration: 'none',
          }}>← Бүх захиалга</Link>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Ачаалж байна...</div>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60, border: '1px solid var(--border)',
          borderRadius: 12, background: 'var(--surface)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 14, color: 'var(--text3)' }}>SLA хэтэрсэн захиалга байхгүй</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(it => {
            const over = overdueByMin(it.vendor_sla_deadline);
            const tries = it.reassign_count || 0;
            const maxedOut = tries >= 3;
            return (
              <div key={it.id} style={{
                border: '1px solid #ef4444', background: 'var(--surface)',
                borderRadius: 12, padding: 16,
                display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>#{it.inquiry_number}</span>
                    <span style={{
                      fontSize: 10, padding: '3px 8px', borderRadius: 6,
                      background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 600,
                    }}>
                      {over !== null && over > 0 ? `${over} мин хэтэрсэн` : 'SLA хэтэрсэн'}
                    </span>
                    <span style={{
                      fontSize: 10, padding: '3px 8px', borderRadius: 6,
                      background: 'var(--surface2)', color: 'var(--text3)',
                    }}>
                      Дахин хуваарилалт: {tries}/3
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
                    {it.product_name} · {it.quantity} ширхэг
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {it.customer_name} · {it.customer_phone}
                    {it.estimated_price ? ` · ${Number(it.estimated_price).toLocaleString()}₮` : ''}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 4 }}>
                    Хуваарилсан: {timeAgo(it.vendor_assigned_at)} · Vendor: {it.vendor_id?.slice(0, 8) || '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button
                    onClick={() => forceReassign(it.id)}
                    disabled={busyId === it.id || maxedOut}
                    style={{
                      padding: '8px 14px', border: 'none', borderRadius: 8,
                      background: maxedOut ? 'var(--surface2)' : '#FF6B00',
                      color: maxedOut ? 'var(--text3)' : 'white',
                      fontSize: 12, fontWeight: 600,
                      cursor: maxedOut ? 'not-allowed' : 'pointer',
                      opacity: busyId === it.id ? 0.5 : 1,
                    }}
                  >
                    {maxedOut ? 'Хязгаар' : busyId === it.id ? '...' : '🔄 Re-assign'}
                  </button>
                  <Link
                    href={`/admin/inquiries?focus=${it.id}`}
                    style={{
                      padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 8,
                      fontSize: 11, color: 'var(--text)', textDecoration: 'none', textAlign: 'center',
                    }}
                  >
                    Дэлгэрэнгүй
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
