'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CartPage() {
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(stored);
  }, []);

  const updateQty = (id: string, qty: number) => {
    const updated = cart.map(i => i.id === id ? { ...i, quantity: qty } : i);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const remove = (id: string) => {
    const updated = cart.filter(i => i.id !== id);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const total = cart.reduce((sum, i) => sum + (i.price || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#0F0F0F', color: '#F1F5F9', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#141414', borderBottom: '1px solid #1E1E1E', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--orange)', fontWeight: 700, fontSize: 18 }}>BizPrint</span>
          <span style={{ color: '#333', fontSize: 13 }}>/</span>
          <Link href="/shop" style={{ color: '#888', fontSize: 13, textDecoration: 'none' }}>Дэлгүүр</Link>
          <span style={{ color: '#333', fontSize: 13 }}>/</span>
          <span style={{ color: '#F1F5F9', fontSize: 13 }}>Сагс</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 28, color: '#F1F5F9' }}>Сагс</h1>

        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>🛒</div>
            <div style={{ fontSize: 16, color: '#555', marginBottom: 24 }}>Сагс хоосон байна</div>
            <Link href="/shop" style={{ background: 'var(--orange)', color: '#fff', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              Дэлгүүр рүү буцах
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cart.map(item => (
                <div key={item.id} style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: 10, padding: 18, display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 72, height: 72, background: '#1A1A1A', borderRadius: 8, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.thumbnail_url
                      ? <img src={item.thumbnail_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 28, opacity: 0.2 }}>🖨️</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#F1F5F9', marginBottom: 4 }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: '#555' }}>{item.quantity} ширхэг</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--orange)', minWidth: 100, textAlign: 'right' }}>
                      ₮{Number(item.price || 0).toLocaleString()}
                    </div>
                    <button onClick={() => remove(item.id)} style={{ background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 6, color: '#555', padding: '5px 10px', cursor: 'pointer', fontSize: 13 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: 10, padding: 22, position: 'sticky', top: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: '#F1F5F9' }}>Нийт дүн</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{item.name}</span>
                    <span style={{ color: '#F1F5F9', flexShrink: 0 }}>₮{Number(item.price||0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #1E1E1E', paddingTop: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#888' }}>Нийт</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--orange)' }}>₮{total.toLocaleString()}</span>
                </div>
              </div>
              <Link href="/checkout" style={{ display: 'block', background: 'var(--orange)', color: '#fff', textAlign: 'center', padding: '13px', borderRadius: 8, textDecoration: 'none', fontSize: 15, fontWeight: 700 }}>
                Захиалга хийх
              </Link>
              <Link href="/shop" style={{ display: 'block', textAlign: 'center', marginTop: 10, color: '#555', fontSize: 13, textDecoration: 'none' }}>
                Дэлгүүр рүү буцах
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}