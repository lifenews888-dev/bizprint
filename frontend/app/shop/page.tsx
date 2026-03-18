'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  { label: 'Бүгд', value: '' },
  { label: 'Офсет хэвлэл', value: 'offset' },
  { label: 'Дижитал хэвлэл', value: 'digital' },
  { label: 'Том форматын', value: 'wide_format' },
  { label: 'Ном, каталог', value: 'book' },
  { label: 'Сурталчилгаа', value: 'promo' },
];

const getDiscountedPrice = (p: any) => {
  if (!p.discount_percent) return null;
  const now = new Date();
  const start = p.discount_start ? new Date(p.discount_start) : null;
  const end = p.discount_end ? new Date(p.discount_end) : null;
  if (start && now < start) return null;
  if (end && now > end) return null;
  return Math.round(Number(p.base_price) * (1 - p.discount_percent / 100));
};

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState(500000);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('new');

  useEffect(() => {
    fetch('http://localhost:4000/products')
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : (data.data || []);
        setProducts(arr);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let arr = [...products];
    if (activeCategory) arr = arr.filter(p => p.category === activeCategory);
    if (search) arr = arr.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.name_mn?.toLowerCase().includes(search.toLowerCase())
    );
    arr = arr.filter(p => !p.base_price || Number(p.base_price) <= maxPrice);
    if (sortBy === 'price_asc') arr.sort((a, b) => Number(a.base_price||0) - Number(b.base_price||0));
    if (sortBy === 'price_desc') arr.sort((a, b) => Number(b.base_price||0) - Number(a.base_price||0));
    setFiltered(arr);
  }, [activeCategory, search, products, maxPrice, sortBy]);

  const getCounts = (val: string) => !val ? products.length : products.filter(p => p.category === val).length;

  const getBadge = (p: any) => {
    const disc = getDiscountedPrice(p);
    if (disc) return { label: '-' + p.discount_percent + '%', bg: '#dc2626', color: '#fff' };
    if (p.sort_order <= 3) return { label: 'ШИНЭ', bg: 'var(--orange)', color: '#fff' };
    return null;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F0F0F', color: '#F1F5F9', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#141414', borderBottom: '1px solid #1E1E1E', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--orange)', fontWeight: 700, fontSize: 18 }}>BizPrint</span>
          <span style={{ color: '#333', fontSize: 13 }}>/</span>
          <span style={{ color: '#888', fontSize: 13 }}>Дэлгүүр</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8, width: 240 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="#555" strokeWidth="1.5"/>
              <path d="M10.5 10.5L14 14" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Бүтээгдэхүүн хайх..." style={{ background: 'transparent', border: 'none', outline: 'none', color: '#F1F5F9', fontSize: 13, width: '100%' }} />
          </div>
          <Link href="/cart" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 6, color: '#F1F5F9', fontSize: 13, textDecoration: 'none' }}>
            🛒 Сагс
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', maxWidth: 1280, margin: '0 auto', padding: '28px 24px', gap: 22 }}>

        {/* Sidebar */}
        <div style={{ width: 210, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 11, color: '#444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>Ангилал</div>
            {CATEGORIES.map(cat => (
              <button key={cat.value} onClick={() => setActiveCategory(cat.value)} style={{
                display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, marginBottom: 3,
                background: activeCategory === cat.value ? 'var(--orange)' : 'transparent',
                color: activeCategory === cat.value ? '#fff' : '#888',
                fontWeight: activeCategory === cat.value ? 600 : 400,
              }}>
                <span>{cat.label}</span>
                <span style={{ opacity: 0.6, fontSize: 12 }}>{getCounts(cat.value)}</span>
              </button>
            ))}
          </div>
          <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 11, color: '#444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>Үнийн хязгаар</div>
            <div style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 600, marginBottom: 8 }}>₮{maxPrice.toLocaleString()} хүртэл</div>
            <input type="range" min={0} max={500000} step={10000} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--orange)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: '#555' }}>₮0</span>
              <span style={{ fontSize: 11, color: '#555' }}>₮500,000</span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: '#555' }}>{filtered.length} бүтээгдэхүүн</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 7, color: '#F1F5F9', fontSize: 13, padding: '5px 10px', outline: 'none' }}>
              <option value="new">Шинэ эхлээд</option>
              <option value="price_asc">Үнэ: бага → их</option>
              <option value="price_desc">Үнэ: их → бага</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: '#555', padding: 80, fontSize: 14 }}>Ачааллаж байна...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#555', padding: 80, fontSize: 14 }}>Бүтээгдэхүүн олдсонгүй</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {filtered.map((p: any) => {
                const badge = getBadge(p);
                const discPrice = getDiscountedPrice(p);
                return (
                  <Link key={p.id} href={'/shop/' + p.id} style={{ textDecoration: 'none' }}>
                    <div
                      style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s', height: '100%', display: 'flex', flexDirection: 'column' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--orange)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#1E1E1E')}
                    >
                      <div style={{ background: '#1A1A1A', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                        {badge && (
                          <div style={{ position: 'absolute', top: 10, left: 10, background: badge.bg, color: badge.color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5, zIndex: 1 }}>
                            {badge.label}
                          </div>
                        )}
                        {p.thumbnail_url
                          ? <img src={p.thumbnail_url} alt={p.name_mn||p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ textAlign: 'center' }}><span style={{ fontSize: 38, opacity: 0.1 }}>🖨️</span><div style={{ fontSize: 11, color: '#333', marginTop: 4 }}>Зураг байхгүй</div></div>
                        }
                      </div>
                      <div style={{ padding: '13px 15px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 10, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>{p.category||'Хэвлэл'}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name_mn||p.name}</div>
                          <div style={{ fontSize: 12, color: '#555', marginBottom: 10 }}>{p.lead_time_days ? p.lead_time_days+' хоногт бэлэн' : 'Хугацаа тохирно'}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            {discPrice ? (
                              <>
                                <div style={{ fontSize: 11, color: '#555', textDecoration: 'line-through' }}>₮{Number(p.base_price).toLocaleString()}</div>
                                <div style={{ fontSize: 15, color: '#dc2626', fontWeight: 700 }}>₮{discPrice.toLocaleString()}</div>
                              </>
                            ) : (
                              <span style={{ color: 'var(--orange)', fontWeight: 700, fontSize: 15 }}>
                                {p.base_price ? '₮'+Number(p.base_price).toLocaleString() : 'Тооцоолох'}
                              </span>
                            )}
                          </div>
                          <span style={{ background: 'var(--orange)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 7 }}>Захиалах</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}