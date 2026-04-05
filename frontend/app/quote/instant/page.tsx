'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PRODUCT_TYPES = [
  { value: 'vizit_kart',  label: 'Визитийн хуудас' },
  { value: 'flyar',       label: 'Флаер' },
  { value: 'broushur',    label: 'Брошур' },
  { value: 'poster',      label: 'Постер' },
  { value: 'banner',      label: 'Баннер' },
  { value: 'sticker',     label: 'Стикер' },
  { value: 'nom',         label: 'Ном / Каталог' },
  { value: 'packaging',   label: 'Сав баглаа' },
];

const SIZES: Record<string, { label: string; w: number; h: number }[]> = {
  vizit_kart:  [{ label: '90×54мм', w: 90, h: 54 }],
  flyar:       [{ label: 'A6 (105×148мм)', w: 105, h: 148 }, { label: 'A5 (148×210мм)', w: 148, h: 210 }],
  broushur:    [{ label: 'A4 нугалсан', w: 210, h: 297 }, { label: 'A5 нугалсан', w: 148, h: 210 }],
  poster:      [{ label: 'A3 (297×420мм)', w: 297, h: 420 }, { label: 'A2 (420×594мм)', w: 420, h: 594 }],
  banner:      [{ label: '1×2м', w: 1000, h: 2000 }, { label: '1×3м', w: 1000, h: 3000 }, { label: 'Захиалгат', w: 0, h: 0 }],
  sticker:     [{ label: 'A6 (105×148мм)', w: 105, h: 148 }, { label: 'A5 (148×210мм)', w: 148, h: 210 }],
  nom:         [{ label: 'A5 (148×210мм)', w: 148, h: 210 }, { label: 'A4 (210×297мм)', w: 210, h: 297 }],
  packaging:   [{ label: 'Захиалгат', w: 0, h: 0 }],
};

const QTY_OPTIONS = [50, 100, 250, 500, 1000, 2000, 5000];
const COLOR_MODES = [
  { value: 'CMYK', label: '4 өнгө (CMYK)' },
  { value: '1C',   label: '1 өнгө' },
  { value: 'BW',   label: 'Хар цагаан' },
];

interface QuoteResult {
  total: number;
  unitPrice: number;
  breakdown: {
    paper: number;
    ink: number;
    finishing: number;
    platform: number;
  };
  leadDays: number;
}

export default function InstantQuotePage() {
  const router = useRouter();
  const [productType, setProductType] = useState('');
  const [sizeIdx, setSizeIdx] = useState(0);
  const [customW, setCustomW] = useState(0);
  const [customH, setCustomH] = useState(0);
  const [quantity, setQuantity] = useState(500);
  const [customQty, setCustomQty] = useState(false);
  const [colorMode, setColorMode] = useState('CMYK');
  const [finishing, setFinishing] = useState<string[]>([]);
  const [finishingOptions, setFinishingOptions] = useState<any[]>([]);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    fetch(`${API}/materials/finishing`)
      .then(r => r.json())
      .then(data => setFinishingOptions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [API]);

  const currentSizes = productType ? SIZES[productType] ?? [] : [];
  const selectedSize = currentSizes[sizeIdx];

  const calcQuote = async () => {
    if (!productType || !selectedSize) return;
    setLoading(true);
    setError('');

    const w = selectedSize.w || customW;
    const h = selectedSize.h || customH;

    try {
      const res = await fetch(`${API}/quote/instant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType,
          widthMm: w,
          heightMm: h,
          quantity,
          colorMode,
          finishing,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Алдаа гарлаа');
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = () => {
    if (!result) return;
    const w = selectedSize?.w || customW;
    const h = selectedSize?.h || customH;
    const params = new URLSearchParams({
      productType, colorMode, quantity: String(quantity),
      widthMm: String(w), heightMm: String(h),
    });
    router.push(`/quote/compare?${params}`);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-medium" style={{ color: 'var(--text)' }}>
          Үнэ тооцоолох
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text3)' }}>
          Тохиргоогоо сонгоод шууд үнэ мэдэгдэнэ
        </p>
      </div>

      {/* Product type */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text2)' }}>
          Бүтээгдэхүүний төрөл
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PRODUCT_TYPES.map(p => (
            <button
              key={p.value}
              onClick={() => { setProductType(p.value); setSizeIdx(0); setResult(null); }}
              className="p-3 rounded-xl text-sm font-medium transition-all text-center"
              style={{
                border: `1px solid ${productType === p.value ? '#FF6B00' : 'var(--border)'}`,
                background: productType === p.value ? 'rgba(255,107,0,0.08)' : 'transparent',
                color: productType === p.value ? '#FF6B00' : 'var(--text2)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {productType && (
        <>
          {/* Size */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text2)' }}>
              Хэмжээ
            </label>
            <div className="flex flex-wrap gap-2">
              {currentSizes.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSizeIdx(i)}
                  className="px-4 py-2 rounded-lg text-sm transition-all"
                  style={{
                    border: `1px solid ${sizeIdx === i ? '#FF6B00' : 'var(--border)'}`,
                    background: sizeIdx === i ? 'rgba(255,107,0,0.08)' : 'transparent',
                    color: sizeIdx === i ? '#FF6B00' : 'var(--text2)',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {selectedSize?.w === 0 && (
              <div className="flex gap-3 mt-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text3)' }}>Өргөн (мм)</label>
                  <input type="number" value={customW} onChange={e => setCustomW(+e.target.value)}
                    className="w-24 rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text3)' }}>Өндөр (мм)</label>
                  <input type="number" value={customH} onChange={e => setCustomH(+e.target.value)}
                    className="w-24 rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }} />
                </div>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text2)' }}>
              Тираж (ширхэг)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {QTY_OPTIONS.map(q => (
                <button key={q}
                  onClick={() => { setQuantity(q); setCustomQty(false); }}
                  className="px-4 py-2 rounded-lg text-sm transition-all"
                  style={{
                    border: `1px solid ${quantity === q && !customQty ? '#FF6B00' : 'var(--border)'}`,
                    background: quantity === q && !customQty ? 'rgba(255,107,0,0.08)' : 'transparent',
                    color: quantity === q && !customQty ? '#FF6B00' : 'var(--text2)',
                  }}
                >
                  {q.toLocaleString()}
                </button>
              ))}
              <button
                onClick={() => setCustomQty(true)}
                className="px-4 py-2 rounded-lg text-sm transition-all"
                style={{
                  border: `1px solid ${customQty ? '#FF6B00' : 'var(--border)'}`,
                  background: customQty ? 'rgba(255,107,0,0.08)' : 'transparent',
                  color: customQty ? '#FF6B00' : 'var(--text2)',
                }}
              >
                Бусад
              </button>
            </div>
            {customQty && (
              <input
                type="number" value={quantity}
                onChange={e => setQuantity(+e.target.value)}
                placeholder="Тоо оруулах"
                className="rounded-lg px-3 py-2 text-sm w-40"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
              />
            )}
          </div>

          {/* Color mode */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text2)' }}>
              Өнгө
            </label>
            <div className="flex gap-2">
              {COLOR_MODES.map(c => (
                <button key={c.value}
                  onClick={() => setColorMode(c.value)}
                  className="px-4 py-2 rounded-lg text-sm transition-all"
                  style={{
                    border: `1px solid ${colorMode === c.value ? '#FF6B00' : 'var(--border)'}`,
                    background: colorMode === c.value ? 'rgba(255,107,0,0.08)' : 'transparent',
                    color: colorMode === c.value ? '#FF6B00' : 'var(--text2)',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Finishing */}
          {finishingOptions.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text2)' }}>
                Боловсруулалт (заавал биш)
              </label>
              <div className="flex flex-wrap gap-2">
                {finishingOptions.map((f: any) => (
                  <button key={f.id}
                    onClick={() => setFinishing(prev =>
                      prev.includes(f.id) ? prev.filter(x => x !== f.id) : [...prev, f.id]
                    )}
                    className="px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={{
                      border: `1px solid ${finishing.includes(f.id) ? '#8B5CF6' : 'var(--border)'}`,
                      background: finishing.includes(f.id) ? 'rgba(139,92,246,0.08)' : 'transparent',
                      color: finishing.includes(f.id) ? '#8B5CF6' : 'var(--text3)',
                    }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Calculate button */}
          <button
            onClick={calcQuote}
            disabled={loading}
            className="w-full py-3 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            style={{ background: '#FF6B00' }}
          >
            {loading ? 'Тооцоолж байна...' : 'Үнэ тооцоолох'}
          </button>

          {error && (
            <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
          )}
        </>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 rounded-2xl p-5" style={{ border: '1px solid var(--border)' }}>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-sm" style={{ color: 'var(--text3)' }}>Нийт дүн</p>
              <p className="text-3xl font-medium mt-0.5" style={{ color: 'var(--text)' }}>
                {result.total.toLocaleString()}₮
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text3)' }}>
                Нэгжийн үнэ: {Math.round(result.unitPrice).toLocaleString()}₮
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: 'var(--text4)' }}>Хүргэх хугацаа</p>
              <p className="text-lg font-medium" style={{ color: 'var(--text2)' }}>
                {result.leadDays} өдөр
              </p>
            </div>
          </div>

          <div className="pt-4 mb-4" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--text3)' }}>
              Задаргаа
            </p>
            {[
              { label: 'Цаас', val: result.breakdown.paper },
              { label: 'Бүр / түвлэлт', val: result.breakdown.ink },
              { label: 'Боловсруулалт', val: result.breakdown.finishing },
              { label: 'Платформ комисс', val: result.breakdown.platform },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm py-1">
                <span style={{ color: 'var(--text3)' }}>{row.label}</span>
                <span style={{ color: 'var(--text2)' }}>
                  {row.val.toLocaleString()}₮
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleOrder}
            className="w-full py-3 font-medium rounded-xl transition-opacity hover:opacity-90"
            style={{ background: 'var(--text)', color: 'var(--bg)' }}
          >
            Энэ үнээр захиалах
          </button>
        </div>
      )}
    </div>
  );
}
