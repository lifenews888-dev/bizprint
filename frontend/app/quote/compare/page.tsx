'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface VendorQuote {
  vendorId: string; vendorName: string; tier: 'gold' | 'silver' | 'bronze';
  price: number; unitPrice: number; leadDays: number; qualityScore: number;
  onTimeRate: number; defectRate: number; capabilities: string[];
  recommended: boolean; aiReason?: string;
}

const TIER_COLORS: Record<string, string> = { gold: '#D97706', silver: '#6B7280', bronze: '#C2410C' };

function VendorCompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [quotes, setQuotes] = useState<VendorQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'price' | 'speed' | 'quality' | 'recommended'>('recommended');
  const [selected, setSelected] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);

  const spec = {
    productType: searchParams.get('productType') ?? 'flyar',
    quantity: +(searchParams.get('quantity') ?? 500),
    widthMm: +(searchParams.get('widthMm') ?? 148),
    heightMm: +(searchParams.get('heightMm') ?? 210),
    colorMode: searchParams.get('colorMode') ?? 'CMYK',
    finishing: searchParams.get('finishing')?.split(',').filter(Boolean) ?? [],
  };

  useEffect(() => {
    apiFetch<any>('/vendors/assign/candidates/' + spec.productType + '?quantity=' + spec.quantity)
      .then(data => {
        const vendors = Array.isArray(data) ? data : data?.vendors ?? [];
        setQuotes(vendors);
        const rec = vendors.find((v: VendorQuote) => v.recommended);
        if (rec) setSelected(rec.vendorId);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...quotes].sort((a, b) => {
    if (sortBy === 'recommended') return (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0);
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'speed') return a.leadDays - b.leadDays;
    if (sortBy === 'quality') return b.qualityScore - a.qualityScore;
    return 0;
  });

  const handleOrder = async () => {
    if (!selected) return;
    setOrdering(true);
    try {
      const data = await apiFetch<any>('/cart/quote/confirm', {
        method: 'POST',
        body: JSON.stringify({ ...spec, vendorId: selected }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (data.orderId) router.push(`/checkout/${data.orderId}`);
    } catch {
      router.push('/checkout');
    } finally {
      setOrdering(false);
    }
  };

  const ScoreBar = ({ value, color }: { value: number; color: string }) => (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3" />
        <p className="text-sm" style={{ color: 'var(--text3)' }}>Үйлдвэрүүдийн үнийн санал цуглуулж байна...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm mb-3 block" style={{ color: 'var(--text4)' }}>
          ← Буцах
        </button>
        <h1 className="text-xl font-medium" style={{ color: 'var(--text)' }}>Үйлдвэр сонгох</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
          {spec.productType} · {spec.quantity.toLocaleString()}ш · {spec.colorMode}
        </p>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs" style={{ color: 'var(--text3)' }}>Эрэмбэлэх:</span>
        {[
          { id: 'recommended', label: 'AI санал' },
          { id: 'price', label: 'Үнэ' },
          { id: 'speed', label: 'Хурд' },
          { id: 'quality', label: 'Чанар' },
        ].map(s => (
          <button key={s.id}
            onClick={() => setSortBy(s.id as any)}
            className="px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{
              background: sortBy === s.id ? '#FF6B00' : 'transparent',
              color: sortBy === s.id ? '#fff' : 'var(--text3)',
              border: sortBy === s.id ? 'none' : '1px solid var(--border)',
            }}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-6">
        {sorted.map(v => (
          <div
            key={v.vendorId}
            onClick={() => setSelected(v.vendorId)}
            className="rounded-2xl p-5 cursor-pointer transition-all"
            style={{
              border: `2px solid ${selected === v.vendorId ? '#FF6B00' : 'var(--border)'}`,
              background: selected === v.vendorId ? 'rgba(255,107,0,0.03)' : 'var(--surface)',
            }}
          >
            <div className="flex items-start gap-4">
              <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors"
                style={{ border: `2px solid ${selected === v.vendorId ? '#FF6B00' : 'var(--border)'}` }}>
                {selected === v.vendorId && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF6B00' }} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium" style={{ color: 'var(--text)' }}>{v.vendorName}</span>
                  <span className="text-xs font-medium" style={{ color: TIER_COLORS[v.tier] ?? 'var(--text3)' }}>
                    {v.tier.toUpperCase()}
                  </span>
                  {v.recommended && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,107,0,0.1)', color: '#FF6B00' }}>
                      AI санал болгосон
                    </span>
                  )}
                </div>

                {v.aiReason && <p className="text-xs mb-3" style={{ color: 'var(--text3)' }}>{v.aiReason}</p>}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xl font-medium" style={{ color: 'var(--text)' }}>{v.price.toLocaleString()}₮</div>
                    <div className="text-xs" style={{ color: 'var(--text4)' }}>Нийт · {Math.round(v.unitPrice).toLocaleString()}₮/ш</div>
                  </div>
                  <div>
                    <div className="text-xl font-medium" style={{ color: 'var(--text)' }}>{v.leadDays}ө</div>
                    <div className="text-xs" style={{ color: 'var(--text4)' }}>Хүргэх хугацаа</div>
                  </div>
                  <div>
                    <div className="text-xl font-medium" style={{ color: 'var(--text)' }}>{v.qualityScore}</div>
                    <div className="text-xs" style={{ color: 'var(--text4)' }}>Чанарын оноо</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text3)' }}>
                      <span>Хугацаандаа</span><span>{v.onTimeRate}%</span>
                    </div>
                    <ScoreBar value={v.onTimeRate} color="#1D9E75" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text3)' }}>
                      <span>Алдааны хувь</span><span>{v.defectRate}%</span>
                    </div>
                    <ScoreBar value={100 - v.defectRate} color={v.defectRate < 2 ? '#1D9E75' : v.defectRate < 5 ? '#BA7517' : '#E24B4A'} />
                  </div>
                </div>

                {v.capabilities?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {v.capabilities.slice(0, 4).map(c => (
                      <span key={c} className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>{c}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {quotes.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--text4)' }}>
            Энэ тохиргоонд тохирох үйлдвэр олдсонгүй
          </div>
        )}
      </div>

      {selected && (
        <div className="sticky bottom-4">
          <button onClick={handleOrder} disabled={ordering}
            className="w-full py-4 font-medium rounded-2xl disabled:opacity-50 transition-opacity shadow-lg"
            style={{ background: 'var(--text)', color: 'var(--bg)' }}>
            {ordering ? 'Захиалж байна...' : `${sorted.find(v => v.vendorId === selected)?.vendorName}-д захиалах`}
          </button>
        </div>
      )}
    </div>
  );
}

export default function VendorComparePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>}>
      <VendorCompareContent />
    </Suspense>
  );
}
