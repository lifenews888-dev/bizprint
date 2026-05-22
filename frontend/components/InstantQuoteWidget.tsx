'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

const PRODUCTS = [
  { value: 'vizit_kart', label: 'Визит', w: 90, h: 54 },
  { value: 'flyar',      label: 'Флаер', w: 148, h: 210 },
  { value: 'broushur',   label: 'Брошур', w: 210, h: 297 },
  { value: 'poster',     label: 'Постер', w: 297, h: 420 },
  { value: 'sticker',    label: 'Стикер', w: 105, h: 148 },
  { value: 'banner',     label: 'Баннер', w: 1000, h: 2000 },
];

const QTYS = [100, 250, 500, 1000, 2500];

export default function InstantQuoteWidget() {
  const [product, setProduct] = useState('vizit_kart');
  const [qty, setQty] = useState(500);
  const [result, setResult] = useState<{ total: number; unitPrice: number; leadDays: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = PRODUCTS.find(p => p.value === product)!;

  const calc = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/quote/instant', {
        method: 'POST',
        auth: false,
        body: { productType: product, widthMm: selected.w, heightMm: selected.h, quantity: qty, colorMode: 'CMYK', finishing: [] },
      });
      const total = Number(data.total_price ?? data.total ?? 0);
      const unitPrice = Number(data.unit_price ?? data.unitPrice ?? (total / qty));
      const leadDays = Number(data.lead_days ?? data.leadDays ?? 3);
      setResult({ ...data, total, unitPrice, leadDays });
    } catch { setResult(null); }
    setLoading(false);
  };

  useEffect(() => { calc(); }, [product, qty]);

  return (
    <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: '#FF6B00', transform: 'translate(30%,-30%)' }} />

      <h3 className="text-lg font-medium mb-1" style={{ color: 'var(--text)' }}>Шууд үнэ мэдэх</h3>
      <p className="text-xs mb-5" style={{ color: 'var(--text4)' }}>10 секундэд үнэ тооцоолно</p>

      {/* Product select */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {PRODUCTS.map(p => (
          <button key={p.value} onClick={() => { setProduct(p.value); setResult(null); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              border: `1px solid ${product === p.value ? '#FF6B00' : 'var(--border)'}`,
              background: product === p.value ? 'rgba(255,107,0,0.08)' : 'transparent',
              color: product === p.value ? '#FF6B00' : 'var(--text3)',
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Quantity */}
      <div className="flex gap-1.5 mb-5">
        {QTYS.map(q => (
          <button key={q} onClick={() => { setQty(q); setResult(null); }}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              border: `1px solid ${qty === q ? '#FF6B00' : 'var(--border)'}`,
              background: qty === q ? 'rgba(255,107,0,0.08)' : 'transparent',
              color: qty === q ? '#FF6B00' : 'var(--text3)',
            }}>
            {q.toLocaleString()}
          </button>
        ))}
      </div>

      {/* Result */}
      {loading ? (
        <div className="py-6 text-center text-sm" style={{ color: 'var(--text4)' }}>Тооцоолж байна...</div>
      ) : result ? (
        <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--surface2)' }}>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs" style={{ color: 'var(--text4)' }}>Нийт дүн</p>
              <p className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>{result.total.toLocaleString()}₮</p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: 'var(--text4)' }}>Нэгж: {Math.round(result.unitPrice).toLocaleString()}₮</p>
              <p className="text-xs mt-0.5" style={{ color: '#059669' }}>{result.leadDays} өдөрт бэлэн</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Link href={`/quote/instant?type=${product}&qty=${qty}`}
          className="flex-1 py-2.5 text-white rounded-xl text-sm font-medium text-center transition-opacity hover:opacity-90"
          style={{ background: '#FF6B00' }}>
          Дэлгэрэнгүй үнэ
        </Link>
        <Link href="/quote/compare"
          className="py-2.5 px-4 rounded-xl text-sm text-center"
          style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}>
          Харьцуулах
        </Link>
      </div>
    </div>
  );
}
