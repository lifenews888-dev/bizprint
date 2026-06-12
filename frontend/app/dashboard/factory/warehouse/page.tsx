'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface PaperStock {
  id: string;
  name: string;
  size: string;
  weightGsm: number;
  pricePerSheet: number;
  stockQty: number;
  reorderLevel: number;
  supplier: string;
  isActive: boolean;
}

interface WarehouseSummary {
  totalItems: number;
  lowStockCount: number;
  totalValue: number;
  recentMovements: number;
}

type ModalType = 'in' | 'out' | 'adjust' | null;

export default function WarehousePage() {
  const [papers, setPapers] = useState<PaperStock[]>([]);
  const [summary, setSummary] = useState<WarehouseSummary | null>(null);
  const [lowStock, setLowStock] = useState<PaperStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ type: ModalType; item: PaperStock | null }>({ type: null, item: null });
  const [txQty, setTxQty] = useState('');
  const [txReason, setTxReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'low'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s, l] = await Promise.all([
        apiFetch<PaperStock[]>('/materials/paper').catch(() => []),
        apiFetch<WarehouseSummary | null>('/warehouse/summary').catch(() => null),
        apiFetch<PaperStock[]>('/warehouse/low-stock').catch(() => []),
      ]);
      setPapers(Array.isArray(p) ? p : []);
      setSummary(s);
      setLowStock(Array.isArray(l) ? l : []);
    } catch (e) {
      console.error('Warehouse load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = (type: ModalType, item: PaperStock) => {
    setModal({ type, item });
    setTxQty('');
    setTxReason('');
  };

  const handleSubmit = async () => {
    if (!modal.item || !txQty) return;
    setSubmitting(true);
    try {
      const endpoint = modal.type === 'in' ? '/warehouse/stock-in'
        : modal.type === 'out' ? '/warehouse/stock-out'
        : '/warehouse/adjust';

      const body = modal.type === 'adjust'
        ? { materialId: modal.item.id, actualQty: +txQty, reason: txReason, createdById: 'current' }
        : { materialId: modal.item.id, qty: +txQty, reason: txReason, createdById: 'current' };

      await apiFetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setModal({ type: null, item: null });
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const stockColor = (item: PaperStock) => {
    const ratio = item.stockQty / item.reorderLevel;
    if (ratio <= 1) return '#DC2626';
    if (ratio <= 1.5) return '#D97706';
    return '#059669';
  };

  const stockBg = (item: PaperStock) => {
    const ratio = item.stockQty / item.reorderLevel;
    if (ratio <= 1) return 'rgba(220,38,38,0.05)';
    if (ratio <= 1.5) return 'rgba(217,119,6,0.05)';
    return 'transparent';
  };

  const displayed = activeTab === 'low' ? lowStock : papers;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-medium" style={{ color: 'var(--text)' }}>Агуулах</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text3)' }}>Материалын нөөц удирдлага</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Нийт материал', val: summary.totalItems, warn: false },
            { label: 'Нөөц бага', val: summary.lowStockCount, warn: summary.lowStockCount > 0 },
            { label: 'Нийт үнэ цэнэ', val: `${(summary.totalValue / 1_000_000).toFixed(1)}M₮`, warn: false },
            { label: '7 хоногт хөдөлгөөн', val: summary.recentMovements, warn: false },
          ].map((c, i) => (
            <div key={i} className="rounded-xl p-4" style={{
              background: c.warn ? 'rgba(220,38,38,0.06)' : 'var(--surface2)',
            }}>
              <div className="text-xl font-medium" style={{
                color: c.warn ? '#DC2626' : 'var(--text)',
              }}>
                {c.val}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text3)' }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'all' as const, label: `Бүгд (${papers.length})`, warn: false },
          { id: 'low' as const, label: `Нөөц бага (${lowStock.length})`, warn: lowStock.length > 0 },
        ].map(t => (
          <button key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="px-4 py-2 text-sm font-medium transition-colors -mb-px"
            style={{
              borderBottom: `2px solid ${activeTab === t.id ? '#FF6B00' : 'transparent'}`,
              color: activeTab === t.id ? '#FF6B00' : t.warn ? '#DC2626' : 'var(--text3)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['Материал', 'Нөөц', 'Reorder', 'Үнэ/ш', 'Нийлүүлэгч', 'Үйлдэл'].map(h => (
                <th key={h} className="px-4 py-3 text-xs uppercase tracking-wide font-medium text-left"
                  style={{ color: 'var(--text3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map(item => (
              <tr key={item.id} style={{ background: stockBg(item), borderTop: '1px solid var(--border)' }}
                className="hover:opacity-80 transition-opacity">
                <td className="px-4 py-3">
                  <div className="font-medium" style={{ color: 'var(--text)' }}>{item.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text4)' }}>{item.size} · {item.weightGsm}gsm</div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-medium" style={{ color: stockColor(item) }}>
                    {item.stockQty.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-right" style={{ color: 'var(--text3)' }}>{item.reorderLevel.toLocaleString()}</td>
                <td className="px-4 py-3 text-right" style={{ color: 'var(--text2)' }}>
                  {Number(item.pricePerSheet).toLocaleString()}₮
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text3)' }}>{item.supplier ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => openModal('in', item)}
                      className="px-2 py-1 text-xs rounded" style={{ border: '1px solid #05966950', color: '#059669' }}>
                      + Орлого
                    </button>
                    <button onClick={() => openModal('out', item)}
                      className="px-2 py-1 text-xs rounded" style={{ border: '1px solid #DC262650', color: '#DC2626' }}>
                      - Зарлага
                    </button>
                    <button onClick={() => openModal('adjust', item)}
                      className="px-2 py-1 text-xs rounded" style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}>
                      Засвар
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal.type && modal.item && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-xl" style={{ background: 'var(--surface)' }}>
            <h2 className="font-medium mb-1" style={{ color: 'var(--text)' }}>
              {modal.type === 'in' ? 'Орлого' : modal.type === 'out' ? 'Зарлага' : 'Тооллогын засвар'}
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text3)' }}>{modal.item.name}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>
                  {modal.type === 'adjust' ? 'Бодит үлдэгдэл' : 'Тоо ширхэг'}
                </label>
                <input type="number" value={txQty} onChange={e => setTxQty(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Шалтгаан</label>
                <input type="text" value={txReason} onChange={e => setTxReason(e.target.value)}
                  placeholder="Жишээ: Нийлүүлэгчээс авсан, #захиалга123..."
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal({ type: null, item: null })}
                className="flex-1 py-2 rounded-lg text-sm"
                style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}>
                Цуцлах
              </button>
              <button onClick={handleSubmit} disabled={submitting || !txQty}
                className="flex-1 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: '#FF6B00' }}>
                {submitting ? 'Хадгалж байна...' : 'Хадгалах'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
