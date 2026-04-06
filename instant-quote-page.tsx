'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PRODUCT_TYPES = [
  { value: 'vizit_kart',  label: 'Нэрийн хуудас',   icon: '▪' },
  { value: 'flyar',       label: 'Флаер',             icon: '▪' },
  { value: 'broushur',    label: 'Брошур',            icon: '▪' },
  { value: 'poster',      label: 'Постер',            icon: '▪' },
  { value: 'banner',      label: 'Баннер',            icon: '▪' },
  { value: 'sticker',     label: 'Стикер',            icon: '▪' },
  { value: 'nom',         label: 'Ном / Каталог',     icon: '▪' },
  { value: 'packaging',   label: 'Сав баглаа',        icon: '▪' },
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
  currency: string;
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

  useEffect(() => {
    fetch('/api/materials/finishing')
      .then(r => r.json())
      .then(data => setFinishingOptions(Array.isArray(data) ? data : []));
  }, []);

  const currentSizes = productType ? SIZES[productType] ?? [] : [];
  const selectedSize = currentSizes[sizeIdx];

  const calcQuote = async () => {
    if (!productType || !selectedSize) return;
    setLoading(true);
    setError('');

    const w = selectedSize.w || customW;
    const h = selectedSize.h || customH;

    try {
      const res = await fetch('/api/quote/instant', {
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
    const params = new URLSearchParams({
      productType, colorMode, quantity: String(quantity),
      total: String(result.total),
    });
    router.push(`/checkout?${params}`);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">
          Үнэ тооцоолох
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Тохиргоогоо сонгоод шууд үнэ мэдэгдэнэ
        </p>
      </div>

      {/* Product type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Бүтээгдэхүүний төрөл
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PRODUCT_TYPES.map(p => (
            <button
              key={p.value}
              onClick={() => { setProductType(p.value); setSizeIdx(0); setResult(null); }}
              className={`p-3 rounded-xl border text-sm font-medium transition-all text-center
                ${productType === p.value
                  ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Хэмжээ
            </label>
            <div className="flex flex-wrap gap-2">
              {currentSizes.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSizeIdx(i)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all
                    ${sizeIdx === i
                      ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {selectedSize?.w === 0 && (
              <div className="flex gap-3 mt-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Өргөн (мм)</label>
                  <input type="number" value={customW} onChange={e => setCustomW(+e.target.value)}
                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Өндөр (мм)</label>
                  <input type="number" value={customH} onChange={e => setCustomH(+e.target.value)}
                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Тираж (ширхэг)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {QTY_OPTIONS.map(q => (
                <button key={q}
                  onClick={() => { setQuantity(q); setCustomQty(false); }}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all
                    ${quantity === q && !customQty
                      ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                >
                  {q.toLocaleString()}
                </button>
              ))}
              <button
                onClick={() => setCustomQty(true)}
                className={`px-4 py-2 rounded-lg border text-sm transition-all
                  ${customQty
                    ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
              >
                Бусад
              </button>
            </div>
            {customQty && (
              <input
                type="number" value={quantity}
                onChange={e => setQuantity(+e.target.value)}
                placeholder="Тоо оруулах"
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm w-40"
              />
            )}
          </div>

          {/* Color mode */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Өнгө
            </label>
            <div className="flex gap-2">
              {COLOR_MODES.map(c => (
                <button key={c.value}
                  onClick={() => setColorMode(c.value)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all
                    ${colorMode === c.value
                      ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Finishing */}
          {finishingOptions.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Боловсруулалт (заавал биш)
              </label>
              <div className="flex flex-wrap gap-2">
                {finishingOptions.map(f => (
                  <button key={f.id}
                    onClick={() => setFinishing(prev =>
                      prev.includes(f.id) ? prev.filter(x => x !== f.id) : [...prev, f.id]
                    )}
                    className={`px-3 py-1.5 rounded-lg border text-xs transition-all
                      ${finishing.includes(f.id)
                        ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
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
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50
              text-white font-medium rounded-xl transition-colors"
          >
            {loading ? 'Тооцоолж байна...' : 'Үнэ тооцоолох'}
          </button>

          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
          )}
        </>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Нийт дүн</p>
              <p className="text-3xl font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                {result.total.toLocaleString()}₮
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                Нэгжийн үнэ: {Math.round(result.unitPrice).toLocaleString()}₮
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Хүргэх хугацаа</p>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {result.leadDays} өдөр
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Задаргаа
            </p>
            {[
              { label: 'Цаас', val: result.breakdown.paper },
              { label: 'Бэх / хэвлэлт', val: result.breakdown.ink },
              { label: 'Боловсруулалт', val: result.breakdown.finishing },
              { label: 'Платформ комисс', val: result.breakdown.platform },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm py-1">
                <span className="text-gray-500">{row.label}</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {row.val.toLocaleString()}₮
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleOrder}
            className="w-full py-3 bg-gray-900 dark:bg-white dark:text-gray-900
              text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            Энэ үнээр захиалах
          </button>
        </div>
      )}
    </div>
  );
}
