'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(100);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch('http://localhost:4000/products')
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : (data.data || []);
        const found = arr.find((p: any) => String(p.id) === String(id));
        setProduct(found || null);
        if (found?.min_quantity) setQuantity(found.min_quantity);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const totalPrice = product?.base_price
    ? Math.round(Number(product.base_price) * quantity / (product.min_quantity || 100))
    : 0;

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((i: any) => i.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ id: product.id, name: product.name_mn || product.name, quantity, price: totalPrice, thumbnail_url: product.thumbnail_url });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0F0F0F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      Ачааллаж байна...
    </div>
  );

  if (!product) return (
    <div style={{ minHeight: '100vh', background: '#0F0F0F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      Бүтээгдэхүүн олдсонгүй
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0F0F0F', color: '#F1F5F9', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#141414', borderBottom: '1px solid #1E1E1E', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#FF6B00', fontWeight: 700, fontSize: 18 }}>BizPrint</span>
          <span style={{ color: '#333', fontSize: 13 }}>/</span>
          <Link href="/shop" style={{ color: '#888', fontSize: 13, textDecoration: 'none' }}>Дэлгүүр</Link>
          <span style={{ color: '#333', fontSize: 13 }}>/</span>
          <span style={{ color: '#F1F5F9', fontSize: 13 }}>{product.name_mn || product.name}</span>
        </div>
        <Link href="/cart" style={{
          background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8,
          padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 6,
          color: '#F1F5F9', fontSize: 13, textDecoration: 'none'
        }}>
          🛒 Сагс
        </Link>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>

          {/* Left - Image */}
          <div>
            <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: 12, height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {product.thumbnail_url ? (
                <img src={product.thumbnail_url} alt={product.name_mn || product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 64, opacity: 0.1 }}>🖨️</div>
                  <div style={{ fontSize: 13, color: '#333', marginTop: 8 }}>Зураг байхгүй</div>
                </div>
              )}
            </div>

            {/* Info cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16 }}>
              <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Хугацаа</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9' }}>{product.lead_time_days || '—'} хоног</div>
              </div>
              <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Мин тоо</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9' }}>{product.min_quantity || '—'} ш</div>
              </div>
              <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Ангилал</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', textTransform: 'capitalize' }}>{product.category || '—'}</div>
              </div>
            </div>
          </div>

          {/* Right - Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: '#FF6B00', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
                {product.category}
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#F1F5F9', margin: '0 0 12px' }}>
                {product.name_mn || product.name}
              </h1>
              {product.description && (
                <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7, margin: 0 }}>
                  {product.description}
                </p>
              )}
            </div>

            {/* Quantity selector */}
            <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Тоо ширхэг сонгох</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <button
                  onClick={() => setQuantity(q => Math.max(product.min_quantity || 1, q - (product.min_quantity || 100)))}
                  style={{ width: 36, height: 36, background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#F1F5F9', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >−</button>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(product.min_quantity || 1, Number(e.target.value)))}
                  style={{ flex: 1, background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#F1F5F9', fontSize: 15, fontWeight: 600, padding: '8px 12px', textAlign: 'center', outline: 'none' }}
                />
                <button
                  onClick={() => setQuantity(q => q + (product.min_quantity || 100))}
                  style={{ width: 36, height: 36, background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#F1F5F9', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >+</button>
              </div>
              {product.min_quantity && (
                <div style={{ fontSize: 12, color: '#555' }}>Хамгийн бага: {product.min_quantity} ширхэг</div>
              )}
            </div>

            {/* Price & CTA */}
            <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>{quantity} ширхэгийн үнэ</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#FF6B00' }}>
                    {totalPrice ? '₮' + totalPrice.toLocaleString() : 'Тооцоолох'}
                  </div>
                </div>
                {totalPrice && quantity > 0 && (
                  <div style={{ fontSize: 13, color: '#555' }}>
                    1 ширхэг: ₮{Math.round(totalPrice / quantity).toLocaleString()}
                  </div>
                )}
              </div>
              <button
                onClick={handleAddToCart}
                style={{
                  width: '100%', padding: '13px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: added ? '#16a34a' : '#FF6B00', color: '#fff',
                  fontSize: 15, fontWeight: 700, transition: 'background 0.2s'
                }}
              >
                {added ? '✓ Сагсанд нэмэгдлээ!' : 'Сагсанд нэмэх'}
              </button>
              <Link href="/quote" style={{
                display: 'block', textAlign: 'center', marginTop: 10,
                padding: '11px', borderRadius: 8, border: '1px solid #2A2A2A',
                color: '#888', fontSize: 14, textDecoration: 'none'
              }}>
                Тусгай үнийн санал авах
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}