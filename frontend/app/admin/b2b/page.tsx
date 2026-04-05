'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface B2BCompany {
  id: string; name: string; registrationNo?: string;
  phone?: string; email?: string; address?: string;
  creditLimit: number; creditUsed: number;
  paymentTerms: string; discountRate: number;
  status: string;
  members?: B2BMember[];
  createdAt: string;
}
interface B2BMember {
  id: string; userId: string; role: string;
  monthlyBudget?: number; budgetUsed: number;
  requiresApproval: boolean; canPlaceOrder: boolean;
  user?: { name: string; email: string };
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:    { bg: 'rgba(5,150,105,0.1)', text: '#059669' },
  suspended: { bg: 'rgba(220,38,38,0.1)', text: '#DC2626' },
  pending:   { bg: 'rgba(217,119,6,0.1)', text: '#D97706' },
};
const PAYMENT_LABELS: Record<string, string> = {
  prepaid: 'Урьдчилгаа', net_15: 'NET 15', net_30: 'NET 30', net_60: 'NET 60',
};

export default function AdminB2BPage() {
  const [companies, setCompanies] = useState<B2BCompany[]>([]);
  const [selected, setSelected] = useState<B2BCompany | null>(null);
  const [modal, setModal] = useState<{ open: boolean; data: Partial<B2BCompany> }>({ open: false, data: {} });
  const [creditModal, setCreditModal] = useState<{ open: boolean; company: B2BCompany | null; limit: string }>({ open: false, company: null, limit: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const data = await apiFetch<any>('/b2b/companies').catch(() => []);
    setCompanies(Array.isArray(data) ? data : []);
  }, []);

  const loadCompany = async (id: string) => {
    const data = await apiFetch<any>(`/b2b/companies/${id}`).catch(() => null);
    if (data) setSelected(data);
  };

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    const isEdit = !!modal.data.id;
    const url = isEdit ? `/b2b/companies/${modal.data.id}` : '/b2b/companies';
    await apiFetch(url, { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(modal.data), headers: { 'Content-Type': 'application/json' } }).catch(() => {});
    setSaving(false);
    setModal({ open: false, data: {} });
    load();
  };

  const saveCredit = async () => {
    if (!creditModal.company) return;
    await apiFetch(`/b2b/companies/${creditModal.company.id}`, {
      method: 'PUT',
      body: JSON.stringify({ creditLimit: +creditModal.limit }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
    setCreditModal({ open: false, company: null, limit: '' });
    load();
    if (selected?.id === creditModal.company.id) loadCompany(creditModal.company.id);
  };

  const setStatus = async (company: B2BCompany, status: string) => {
    await apiFetch(`/b2b/companies/${company.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
    load();
    if (selected?.id === company.id) loadCompany(company.id);
  };

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.registrationNo?.includes(search)
  );

  const creditPct = (c: B2BCompany) =>
    c.creditLimit > 0 ? Math.min(100, Math.round((Number(c.creditUsed) / Number(c.creditLimit)) * 100)) : 0;

  return (
    <div className="flex h-full min-h-screen">
      {/* Left — company list */}
      <div className="w-80 flex-shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--border)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-medium" style={{ color: 'var(--text)' }}>B2B компаниуд</h1>
            <button onClick={() => setModal({ open: true, data: { status: 'active', paymentTerms: 'prepaid', discountRate: 0, creditLimit: 0 } })}
              className="px-3 py-1.5 text-white rounded-lg text-xs font-medium" style={{ background: '#FF6B00' }}>
              + Нэмэх
            </button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Хайх..."
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map(c => {
            const sc = STATUS_COLORS[c.status] ?? STATUS_COLORS.pending;
            return (
              <button key={c.id} onClick={() => loadCompany(c.id)}
                className="w-full text-left p-4 transition-colors hover:opacity-80"
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: selected?.id === c.id ? 'rgba(255,107,0,0.05)' : 'transparent',
                }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{c.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text4)' }}>{c.email ?? c.registrationNo ?? '—'}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: sc.bg, color: sc.text }}>{c.status}</span>
                </div>
                {Number(c.creditLimit) > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text4)' }}>
                      <span>Кредит</span><span>{creditPct(c)}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full" style={{ width: `${creditPct(c)}%`, background: creditPct(c) > 80 ? '#DC2626' : '#059669' }} />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text4)' }}>Компани олдсонгүй</div>
          )}
        </div>
      </div>

      {/* Right — detail */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!selected ? (
          <div className="flex items-center justify-center h-64 text-sm" style={{ color: 'var(--text4)' }}>
            Компани сонгоно уу
          </div>
        ) : (
          <div className="max-w-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-medium" style={{ color: 'var(--text)' }}>{selected.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: (STATUS_COLORS[selected.status] ?? STATUS_COLORS.pending).bg, color: (STATUS_COLORS[selected.status] ?? STATUS_COLORS.pending).text }}>{selected.status}</span>
                  {selected.registrationNo && <span className="text-xs" style={{ color: 'var(--text4)' }}>РД: {selected.registrationNo}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModal({ open: true, data: { ...selected } })}
                  className="px-3 py-1.5 rounded-lg text-xs" style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}>Засах</button>
                {selected.status === 'active'
                  ? <button onClick={() => setStatus(selected, 'suspended')}
                      className="px-3 py-1.5 rounded-lg text-xs" style={{ border: '1px solid #DC262650', color: '#DC2626' }}>Түдгэлзүүлэх</button>
                  : <button onClick={() => setStatus(selected, 'active')}
                      className="px-3 py-1.5 rounded-lg text-xs" style={{ border: '1px solid #05966950', color: '#059669' }}>Идэвхжүүлэх</button>
                }
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Утас', val: selected.phone ?? '—' },
                { label: 'Э-мэйл', val: selected.email ?? '—' },
                { label: 'Хаяг', val: selected.address ?? '—' },
                { label: 'Төлбөрийн нөхцөл', val: PAYMENT_LABELS[selected.paymentTerms] ?? selected.paymentTerms },
                { label: 'Хөнгөлөлт', val: `${selected.discountRate}%` },
                { label: 'Гишүүд', val: `${selected.members?.length ?? 0} хүн` },
              ].map((row, i) => (
                <div key={i} className="rounded-xl p-3" style={{ background: 'var(--surface2)' }}>
                  <div className="text-xs mb-1" style={{ color: 'var(--text4)' }}>{row.label}</div>
                  <div className="text-sm" style={{ color: 'var(--text)' }}>{row.val}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-4 mb-6" style={{ border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium" style={{ color: 'var(--text2)' }}>Кредитийн хязгаар</span>
                <button onClick={() => setCreditModal({ open: true, company: selected, limit: String(selected.creditLimit) })}
                  className="text-xs hover:underline" style={{ color: '#378ADD' }}>Өөрчлөх</button>
              </div>
              <div className="flex items-end gap-4 mb-2">
                <div>
                  <div className="text-2xl font-medium" style={{ color: 'var(--text)' }}>{Number(selected.creditUsed).toLocaleString()}₮</div>
                  <div className="text-xs" style={{ color: 'var(--text4)' }}>ашигласан</div>
                </div>
                <div style={{ color: 'var(--text4)' }} className="mb-1">/</div>
                <div>
                  <div className="text-lg" style={{ color: 'var(--text3)' }}>{Number(selected.creditLimit).toLocaleString()}₮</div>
                  <div className="text-xs" style={{ color: 'var(--text4)' }}>хязгаар</div>
                </div>
              </div>
              {Number(selected.creditLimit) > 0 && (
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${creditPct(selected)}%`, background: creditPct(selected) > 80 ? '#DC2626' : '#059669' }} />
                </div>
              )}
            </div>

            {selected.members && selected.members.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text2)' }}>Гишүүд</h3>
                <div className="space-y-2">
                  {selected.members.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--surface2)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                        style={{ background: 'rgba(255,107,0,0.1)', color: '#FF6B00' }}>
                        {(m.user?.name ?? 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{m.user?.name ?? m.userId}</div>
                        <div className="text-xs" style={{ color: 'var(--text4)' }}>{m.user?.email}</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface3)', color: 'var(--text2)' }}>{m.role}</span>
                      {m.monthlyBudget && (
                        <span className="text-xs" style={{ color: 'var(--text4)' }}>{Number(m.monthlyBudget).toLocaleString()}₮/сар</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-xl" style={{ background: 'var(--surface)' }}>
            <h2 className="font-medium mb-5" style={{ color: 'var(--text)' }}>
              {modal.data.id ? 'Засах' : 'Шинэ компани'}
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Нэр', key: 'name', type: 'text' },
                { label: 'Регистр', key: 'registrationNo', type: 'text' },
                { label: 'Утас', key: 'phone', type: 'text' },
                { label: 'Э-мэйл', key: 'email', type: 'email' },
                { label: 'Хаяг', key: 'address', type: 'text' },
                { label: 'Хөнгөлөлт (%)', key: 'discountRate', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>{f.label}</label>
                  <input type={f.type} value={(modal.data as any)[f.key] ?? ''}
                    onChange={e => setModal(m => ({ ...m, data: { ...m.data, [f.key]: f.type === 'number' ? +e.target.value : e.target.value } }))}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
                </div>
              ))}
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Төлбөрийн нөхцөл</label>
                <select value={modal.data.paymentTerms ?? 'prepaid'}
                  onChange={e => setModal(m => ({ ...m, data: { ...m.data, paymentTerms: e.target.value } }))}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }}>
                  {Object.entries(PAYMENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal({ open: false, data: {} })}
                className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}>Цуцлах</button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50" style={{ background: '#FF6B00' }}>
                {saving ? 'Хадгалж байна...' : 'Хадгалах'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit modal */}
      {creditModal.open && creditModal.company && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-xl" style={{ background: 'var(--surface)' }}>
            <h2 className="font-medium mb-1" style={{ color: 'var(--text)' }}>Кредитийн хязгаар</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text3)' }}>{creditModal.company.name}</p>
            <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Шинэ хязгаар (₮)</label>
            <input type="number" value={creditModal.limit}
              onChange={e => setCreditModal(m => ({ ...m, limit: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm mb-5 focus:outline-none"
              style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
            <div className="flex gap-3">
              <button onClick={() => setCreditModal({ open: false, company: null, limit: '' })}
                className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}>Цуцлах</button>
              <button onClick={saveCredit}
                className="flex-1 py-2.5 text-white rounded-xl text-sm font-medium" style={{ background: '#FF6B00' }}>Хадгалах</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
