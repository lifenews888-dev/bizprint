'use client';

import { useState, useEffect, useCallback } from 'react';

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
  const [txNote, setTxNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'low'>('all');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    const [papersRes, summaryRes, lowRes] = await Promise.all([
      fetch('/api/materials/paper', { headers }),
      fetch('/api/warehouse/summary', { headers }),
      fetch('/api/warehouse/low-stock', { headers }),
    ]);
    const [p, s, l] = await Promise.all([papersRes.json(), summaryRes.json(), lowRes.json()]);
    setPapers(Array.isArray(p) ? p : []);
    setSummary(s);
    setLowStock(Array.isArray(l) ? l : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = (type: ModalType, item: PaperStock) => {
    setModal({ type, item });
    setTxQty('');
    setTxReason('');
    setTxNote('');
  };

  const handleSubmit = async () => {
    if (!modal.item || !txQty) return;
    setSubmitting(true);
    try {
      const endpoint = modal.type === 'in' ? '/api/warehouse/stock-in'
        : modal.type === 'out' ? '/api/warehouse/stock-out'
        : '/api/warehouse/adjust';

      const body = modal.type === 'adjust'
        ? { materialId: modal.item.id, actualQty: +txQty, reason: txReason, createdById: 'current' }
        : { materialId: modal.item.id, qty: +txQty, reason: txReason, createdById: 'current' };

      await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
      setModal({ type: null, item: null });
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const stockColor = (item: PaperStock) => {
    const ratio = item.stockQty / item.reorderLevel;
    if (ratio <= 1) return 'text-red-600 dark:text-red-400';
    if (ratio <= 1.5) return 'text-amber-600 dark:text-amber-400';
    return 'text-green-600 dark:text-green-400';
  };

  const stockBg = (item: PaperStock) => {
    const ratio = item.stockQty / item.reorderLevel;
    if (ratio <= 1) return 'bg-red-50 dark:bg-red-900/10';
    if (ratio <= 1.5) return 'bg-amber-50 dark:bg-amber-900/10';
    return '';
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
        <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">Агуулах</h1>
        <p className="text-sm text-gray-500 mt-0.5">Материалын нөөц хяналт</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Нийт материал', val: summary.totalItems },
            { label: 'Нөөц бага', val: summary.lowStockCount, warn: summary.lowStockCount > 0 },
            { label: 'Нийт үнэ цэнэ', val: `${(summary.totalValue / 1_000_000).toFixed(1)}M₮` },
            { label: '7 хоногт хөдөлгөөн', val: summary.recentMovements },
          ].map((c, i) => (
            <div key={i} className={`rounded-xl p-4 ${c.warn ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
              <div className={`text-xl font-medium ${c.warn ? 'text-red-700 dark:text-red-300' : 'text-gray-900 dark:text-gray-100'}`}>
                {c.val}
              </div>
              <div className="text-xs text-gray-500 mt-1">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'all' as const, label: `Бүгд (${papers.length})` },
          { id: 'low' as const, label: `Нөөц бага (${lowStock.length})`, warn: lowStock.length > 0 },
        ].map(t => (
          <button key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px
              ${activeTab === t.id
                ? 'border-orange-500 text-orange-600'
                : `border-transparent ${t.warn ? 'text-red-600' : 'text-gray-500'} hover:text-gray-700`
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left font-medium">Материал</th>
              <th className="px-4 py-3 text-right font-medium">Нөөц</th>
              <th className="px-4 py-3 text-right font-medium">Reorder</th>
              <th className="px-4 py-3 text-right font-medium">Үнэ/ш</th>
              <th className="px-4 py-3 text-left font-medium">Нийлүүлэгч</th>
              <th className="px-4 py-3 text-center font-medium">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {displayed.map(item => (
              <tr key={item.id} className={`${stockBg(item)} hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors`}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                  <div className="text-xs text-gray-400">{item.size} · {item.weightGsm}gsm</div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-medium ${stockColor(item)}`}>
                    {item.stockQty.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-500">{item.reorderLevel.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                  {Number(item.pricePerSheet).toLocaleString()}₮
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{item.supplier ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => openModal('in', item)}
                      className="px-2 py-1 text-xs rounded border border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400">
                      + Орлого
                    </button>
                    <button onClick={() => openModal('out', item)}
                      className="px-2 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400">
                      - Зарлага
                    </button>
                    <button onClick={() => openModal('adjust', item)}
                      className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700">
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
              {modal.type === 'in' ? 'Орлого' : modal.type === 'out' ? 'Зарлага' : 'Тооллогын засвар'}
            </h2>
            <p className="text-sm text-gray-500 mb-5">{modal.item.name}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {modal.type === 'adjust' ? 'Бодит үлдэгдэл' : 'Тоо ширхэг'}
                </label>
                <input type="number" value={txQty} onChange={e => setTxQty(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Шалтгаан</label>
                <input type="text" value={txReason} onChange={e => setTxReason(e.target.value)}
                  placeholder="Жишээ: Нийлүүлэгчээс авсан, #захиалга123..."
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal({ type: null, item: null })}
                className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                Цуцлах
              </button>
              <button onClick={handleSubmit} disabled={submitting || !txQty}
                className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                {submitting ? 'Хадгалж байна...' : 'Хадгалах'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
