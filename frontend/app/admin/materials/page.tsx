'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api';

type Tab = 'paper' | 'ink' | 'finishing';

interface PaperStock {
  id: string; name: string; size: string; weightGsm: number;
  pricePerSheet: number; stockQty: number; reorderLevel: number;
  supplier: string; isActive: boolean;
}
interface InkProfile {
  id: string; name: string; type: string;
  coverageRateMlPerM2: number; pricePerLiter: number; supplier: string; isActive: boolean;
}
interface FinishingOption {
  id: string; name: string; type: string;
  setupCost: number; unitPrice: number; timePerUnitMinutes: number; isActive: boolean;
}
interface Summary {
  paperCount: number; inkCount: number; finishingCount: number;
  lowStockPapers: PaperStock[]; totalStockValue: number;
}

type MaterialFormData = Partial<PaperStock & InkProfile & FinishingOption> & Record<string, string | number | boolean | undefined>;
type MaterialModal = { open: boolean; mode: 'create' | 'edit'; data: MaterialFormData };

const PAPER_SIZES = ['A6', 'A5', 'A4', 'A3', 'A2', 'A1', 'SRA3', 'custom'];
const GSM_OPTIONS = [70, 80, 100, 115, 130, 150, 170, 200, 250, 300, 350, 400, 510];
const INK_TYPES = ['CMYK', 'Pantone', 'UV', 'water_based', 'digital_toner'];
const FINISHING_TYPES = ['fold', 'cut', 'bind', 'laminate', 'uv_coat', 'emboss', 'foil', 'perforate', 'crease', 'staple'];
const FINISHING_LABELS: Record<string, string> = {
  fold: 'Нугалах', cut: 'Бүрэх', bind: 'Хавтаслах', laminate: 'Ламинат',
  uv_coat: 'УВ лак', emboss: 'Хэвлэлт', foil: 'Фольг', perforate: 'Цоолох',
  crease: 'Хэмлэлт', staple: 'Зүүгдэл',
};

export default function AdminMaterialsPage() {
  const [tab, setTab] = useState<Tab>('paper');
  const [papers, setPapers] = useState<PaperStock[]>([]);
  const [inks, setInks] = useState<InkProfile[]>([]);
  const [finishingList, setFinishingList] = useState<FinishingOption[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [modal, setModal] = useState<MaterialModal>({ open: false, mode: 'create', data: {} });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, i, f, s] = await Promise.all([
      apiFetch<PaperStock[]>('/materials/paper').catch(() => []),
      apiFetch<InkProfile[]>('/materials/ink').catch(() => []),
      apiFetch<FinishingOption[]>('/materials/finishing').catch(() => []),
      apiFetch<Summary | null>('/materials/summary').catch(() => null),
    ]);
    setPapers(Array.isArray(p) ? p : []);
    setInks(Array.isArray(i) ? i : []);
    setFinishingList(Array.isArray(f) ? f : []);
    if (s) setSummary(s);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filteredPapers = useMemo(() => {
    let list = papers;
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.supplier?.toLowerCase().includes(search.toLowerCase()));
    if (sizeFilter) list = list.filter(p => p.size === sizeFilter);
    return list;
  }, [papers, search, sizeFilter]);

  const filteredInks = useMemo(() => {
    if (!search) return inks;
    return inks.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.type.toLowerCase().includes(search.toLowerCase()));
  }, [inks, search]);

  const filteredFinishing = useMemo(() => {
    if (!search) return finishingList;
    return finishingList.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.type.toLowerCase().includes(search.toLowerCase()));
  }, [finishingList, search]);

  const openCreate = () => {
    const defaults: Record<Tab, MaterialFormData> = {
      paper: { size: 'A4', weightGsm: 130, pricePerSheet: 120, stockQty: 1000, reorderLevel: 100, isActive: true },
      ink: { type: 'CMYK', coverageRateMlPerM2: 2.5, pricePerLiter: 45000, isActive: true },
      finishing: { type: 'laminate', setupCost: 5000, unitPrice: 80, timePerUnitMinutes: 0.1, isActive: true },
    };
    setModal({ open: true, mode: 'create', data: defaults[tab] });
  };

  const openEdit = (item: PaperStock | InkProfile | FinishingOption) => setModal({ open: true, mode: 'edit', data: { ...item } });

  const save = async () => {
    setSaving(true);
    const endpoint = { paper: '/materials/paper', ink: '/materials/ink', finishing: '/materials/finishing' }[tab];
    const url = modal.mode === 'edit' ? `${endpoint}/${modal.data.id}` : endpoint;
    await apiFetch(url, { method: modal.mode === 'edit' ? 'PUT' : 'POST', body: JSON.stringify(modal.data), headers: { 'Content-Type': 'application/json' } }).catch(() => {});
    setSaving(false);
    setModal({ open: false, mode: 'create', data: {} });
    load();
  };

  const handleDelete = async (id: string) => {
    const endpoint = { paper: '/materials/paper', ink: '/materials/ink', finishing: '/materials/finishing' }[tab];
    await apiFetch(`${endpoint}/${id}`, { method: 'DELETE' }).catch(() => {});
    setDeleteConfirm(null);
    load();
  };

  const seed = async () => {
    setSeeding(true);
    await apiFetch('/materials/seed', { method: 'POST' }).catch(() => {});
    setSeeding(false);
    load();
  };

  const lowStockCount = summary?.lowStockPapers?.length ?? papers.filter(p => p.stockQty <= p.reorderLevel).length;

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'paper', label: 'Цаас', count: papers.length },
    { id: 'ink', label: 'Бүр', count: inks.length },
    { id: 'finishing', label: 'Боловсруулалт', count: finishingList.length },
  ];

  const uniqueSizes = [...new Set(papers.map(p => p.size))].sort();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium" style={{ color: 'var(--text)' }}>Материалын удирдлага</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text3)' }}>Цаас, бүр, боловсруулалтын үнэ, нөөц</p>
        </div>
        <div className="flex gap-2">
          <button onClick={seed} disabled={seeding}
            className="px-4 py-2 rounded-lg text-sm disabled:opacity-50" style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}>
            {seeding ? 'Seed хийж байна...' : 'Default seed'}
          </button>
          <button onClick={openCreate}
            className="px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ background: '#FF6B00' }}>
            + Нэмэх
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Цаас', value: papers.length, suffix: 'төрөл', color: '#059669' },
          { label: 'Бүр', value: inks.length, suffix: 'төрөл', color: '#8B5CF6' },
          { label: 'Боловсруулалт', value: finishingList.length, suffix: 'төрөл', color: '#D97706' },
          { label: 'Нөөц бага', value: lowStockCount, suffix: 'анхааруулга', color: lowStockCount > 0 ? '#DC2626' : '#059669' },
        ].map(c => (
          <div key={c.label} className="rounded-xl p-4" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text3)' }}>{c.label}</p>
            <p className="text-2xl font-semibold" style={{ color: c.color }}>{c.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text4)' }}>{c.suffix}</p>
          </div>
        ))}
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="rounded-xl p-4 mb-5 flex items-start gap-3" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}>
          <span className="text-lg">⚠</span>
          <div>
            <p className="text-sm font-medium" style={{ color: '#DC2626' }}>Нөөц багатай материалууд ({lowStockCount})</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
              {(summary?.lowStockPapers ?? papers.filter(p => p.stockQty <= p.reorderLevel))
                .slice(0, 5)
                .map(p => `${p.name} (${p.stockQty}ш)`)
                .join(', ')}
              {lowStockCount > 5 && ` ...+${lowStockCount - 5}`}
            </p>
          </div>
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex items-center justify-between mb-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSearch(''); setSizeFilter(''); }}
              className="px-4 py-2.5 text-sm font-medium -mb-px transition-colors flex items-center gap-2"
              style={{
                borderBottom: `2px solid ${tab === t.id ? '#FF6B00' : 'transparent'}`,
                color: tab === t.id ? '#FF6B00' : 'var(--text3)',
              }}>
              {t.label}
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>{t.count}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 -mb-px pb-2">
          {tab === 'paper' && (
            <select value={sizeFilter} onChange={e => setSizeFilter(e.target.value)}
              className="rounded-lg px-3 py-1.5 text-xs" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)' }}>
              <option value="">Бүх хэмжээ</option>
              {uniqueSizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <input placeholder="Хайх..." value={search} onChange={e => setSearch(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs w-48 focus:outline-none" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
        </div>
      </div>

      {/* Paper table */}
      {tab === 'paper' && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Нэр', 'Хэмжээ', 'GSM', 'Үнэ/хуудас', 'Нөөц', 'Reorder', 'Нийлүүлэгч', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs uppercase tracking-wide font-medium text-left" style={{ color: 'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPapers.map(p => (
                <tr key={p.id} className={`transition-opacity ${!p.isActive ? 'opacity-40' : ''}`} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>
                    {p.name}
                    {p.stockQty <= p.reorderLevel && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: 'rgba(220,38,38,0.1)', color: '#DC2626' }}>БАГА</span>}
                  </td>
                  <td className="px-4 py-3 text-center" style={{ color: 'var(--text3)' }}>{p.size}</td>
                  <td className="px-4 py-3 text-center" style={{ color: 'var(--text3)' }}>{p.weightGsm}</td>
                  <td className="px-4 py-3 text-right" style={{ color: 'var(--text2)' }}>{Number(p.pricePerSheet).toLocaleString()}₮</td>
                  <td className="px-4 py-3 text-right font-medium" style={{ color: p.stockQty <= p.reorderLevel ? '#DC2626' : '#059669' }}>
                    {p.stockQty.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right" style={{ color: 'var(--text4)' }}>{p.reorderLevel.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text3)' }}>{p.supplier ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-xs hover:underline" style={{ color: '#378ADD' }}>Засах</button>
                      {deleteConfirm === p.id
                        ? <button onClick={() => handleDelete(p.id)} className="text-xs font-medium" style={{ color: '#DC2626' }}>Устгах?</button>
                        : <button onClick={() => setDeleteConfirm(p.id)} className="text-xs hover:underline" style={{ color: 'var(--text4)' }}>Устгах</button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPapers.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text4)' }}>Цаас олдсонгүй</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Ink table */}
      {tab === 'ink' && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Нэр', 'Төрөл', 'Зарцуулалт мл/м²', 'Үнэ/литр', 'Нийлүүлэгч', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs uppercase tracking-wide font-medium text-left" style={{ color: 'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInks.map(i => (
                <tr key={i.id} className={!i.isActive ? 'opacity-40' : ''} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>{i.name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>{i.type}</span></td>
                  <td className="px-4 py-3 text-right" style={{ color: 'var(--text3)' }}>{i.coverageRateMlPerM2}</td>
                  <td className="px-4 py-3 text-right" style={{ color: 'var(--text2)' }}>{Number(i.pricePerLiter).toLocaleString()}₮</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text3)' }}>{i.supplier ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(i)} className="text-xs hover:underline" style={{ color: '#378ADD' }}>Засах</button>
                      {deleteConfirm === i.id
                        ? <button onClick={() => handleDelete(i.id)} className="text-xs font-medium" style={{ color: '#DC2626' }}>Устгах?</button>
                        : <button onClick={() => setDeleteConfirm(i.id)} className="text-xs hover:underline" style={{ color: 'var(--text4)' }}>Устгах</button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInks.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text4)' }}>Бүр олдсонгүй</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Finishing table */}
      {tab === 'finishing' && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Нэр', 'Төрөл', 'Setup', 'Нэгж үнэ', 'Хугацаа/мин', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs uppercase tracking-wide font-medium text-left" style={{ color: 'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredFinishing.map(f => (
                <tr key={f.id} className={!f.isActive ? 'opacity-40' : ''} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>{f.name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(217,119,6,0.1)', color: '#D97706' }}>{FINISHING_LABELS[f.type] ?? f.type}</span></td>
                  <td className="px-4 py-3 text-right" style={{ color: 'var(--text3)' }}>{Number(f.setupCost).toLocaleString()}₮</td>
                  <td className="px-4 py-3 text-right" style={{ color: 'var(--text2)' }}>{Number(f.unitPrice).toLocaleString()}₮</td>
                  <td className="px-4 py-3 text-right" style={{ color: 'var(--text4)' }}>{f.timePerUnitMinutes}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(f)} className="text-xs hover:underline" style={{ color: '#378ADD' }}>Засах</button>
                      {deleteConfirm === f.id
                        ? <button onClick={() => handleDelete(f.id)} className="text-xs font-medium" style={{ color: '#DC2626' }}>Устгах?</button>
                        : <button onClick={() => setDeleteConfirm(f.id)} className="text-xs hover:underline" style={{ color: 'var(--text4)' }}>Устгах</button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFinishing.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text4)' }}>Боловсруулалт олдсонгүй</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock value footer */}
      {summary && (
        <div className="mt-4 text-right text-xs" style={{ color: 'var(--text4)' }}>
          Нийт нөөцийн үнэлгээ: <span className="font-medium" style={{ color: 'var(--text2)' }}>{summary.totalStockValue.toLocaleString()}₮</span>
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModal({ open: false, mode: 'create', data: {} })}>
          <div className="rounded-2xl p-6 w-full max-w-lg shadow-xl" style={{ background: 'var(--surface)' }} onClick={e => e.stopPropagation()}>
            <h2 className="font-medium mb-5" style={{ color: 'var(--text)' }}>
              {modal.mode === 'create' ? 'Шинэ' : 'Засах'} — {tab === 'paper' ? 'цаас' : tab === 'ink' ? 'бүр' : 'боловсруулалт'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Нэр</label>
                <input value={modal.data.name ?? ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, name: e.target.value } }))}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
              </div>

              {tab === 'paper' && <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Хэмжээ</label>
                    <select value={modal.data.size} onChange={e => setModal(m => ({ ...m, data: { ...m.data, size: e.target.value } }))}
                      className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }}>
                      {PAPER_SIZES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>GSM</label>
                    <select value={String(modal.data.weightGsm)} onChange={e => setModal(m => ({ ...m, data: { ...m.data, weightGsm: +e.target.value } }))}
                      className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }}>
                      {GSM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: 'Үнэ/хуудас (₮)', key: 'pricePerSheet' }, { label: 'Нөөц (ш)', key: 'stockQty' }].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>{f.label}</label>
                      <input type="number" value={Number(modal.data[f.key] ?? 0)} onChange={e => setModal(m => ({ ...m, data: { ...m.data, [f.key]: +e.target.value } }))}
                        className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Reorder level</label>
                    <input type="number" value={modal.data.reorderLevel} onChange={e => setModal(m => ({ ...m, data: { ...m.data, reorderLevel: +e.target.value } }))}
                      className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Нийлүүлэгч</label>
                    <input value={modal.data.supplier ?? ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, supplier: e.target.value } }))}
                      className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
                  </div>
                </div>
              </>}

              {tab === 'ink' && <>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Төрөл</label>
                  <select value={modal.data.type} onChange={e => setModal(m => ({ ...m, data: { ...m.data, type: e.target.value } }))}
                    className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }}>
                    {INK_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: 'Зарцуулалт мл/м²', key: 'coverageRateMlPerM2' }, { label: 'Үнэ/литр (₮)', key: 'pricePerLiter' }].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>{f.label}</label>
                      <input type="number" value={Number(modal.data[f.key] ?? 0)} onChange={e => setModal(m => ({ ...m, data: { ...m.data, [f.key]: +e.target.value } }))}
                        className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Нийлүүлэгч</label>
                  <input value={modal.data.supplier ?? ''} onChange={e => setModal(m => ({ ...m, data: { ...m.data, supplier: e.target.value } }))}
                    className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
                </div>
              </>}

              {tab === 'finishing' && <>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Төрөл</label>
                  <select value={modal.data.type} onChange={e => setModal(m => ({ ...m, data: { ...m.data, type: e.target.value } }))}
                    className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }}>
                    {FINISHING_TYPES.map(o => <option key={o} value={o}>{FINISHING_LABELS[o] ?? o}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[{ label: 'Setup (₮)', key: 'setupCost' }, { label: 'Нэгж үнэ (₮)', key: 'unitPrice' }, { label: 'Хугацаа (мин)', key: 'timePerUnitMinutes' }].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>{f.label}</label>
                      <input type="number" value={Number(modal.data[f.key] ?? 0)} onChange={e => setModal(m => ({ ...m, data: { ...m.data, [f.key]: +e.target.value } }))}
                        className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
                    </div>
                  ))}
                </div>
              </>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal({ open: false, mode: 'create', data: {} })}
                className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}>Цуцлах</button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50" style={{ background: '#FF6B00' }}>
                {saving ? 'Хадгалж байна...' : 'Хадгалах'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
