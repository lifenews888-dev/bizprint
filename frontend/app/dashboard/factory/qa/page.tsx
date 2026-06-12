'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

type QaTab = 'checkpoints' | 'passports' | 'ncl';

interface QaCheckpoint {
  id: string; orderId: string; stage: string; status: string;
  notes?: string; issues: string[]; photos: string[];
  checkedBy?: { name: string }; createdAt: string;
}
interface NonConformance {
  id: string; orderId: string; stage: string; description: string;
  severity: string; status: string; resolution?: string;
  reportedBy?: { name: string }; createdAt: string;
}
interface QaSummary {
  totalChecks: number; passedRate: number; openNcls: number; criticalNcls: number;
}

const STAGE_LABELS: Record<string, string> = {
  prepress: 'Prepress', printing: 'Хэвлэлт', finishing: 'Боловсруулалт',
  packaging: 'Сав баглаа', delivery: 'Хүргэлт',
};
const SEV_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  major:    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  minor:    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
};

export default function FactoryQaPage() {
  const [tab, setTab] = useState<QaTab>('checkpoints');
  const [ncls, setNcls] = useState<NonConformance[]>([]);
  const [summary, setSummary] = useState<QaSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [cpModal, setCpModal] = useState(false);
  const [cpForm, setCpForm] = useState({ orderId: '', stage: 'prepress', status: 'passed', notes: '', issues: '' });

  const [nclModal, setNclModal] = useState(false);
  const [nclForm, setNclForm] = useState({ orderId: '', stage: '', description: '', severity: 'minor' });

  const [resolveModal, setResolveModal] = useState<{ open: boolean; ncl: NonConformance | null; resolution: string }>({ open: false, ncl: null, resolution: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const sum = await apiFetch<QaSummary>('/qa/summary').catch(() => ({ totalChecks: 0, passedRate: 0, openNcls: 0, criticalNcls: 0 }));
    setSummary(sum);
    setLoading(false);
  }, []);

  const loadNcls = useCallback(async () => {
    const data = await apiFetch<NonConformance[]>('/qa/ncl/all').catch(() => []);
    setNcls(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (tab !== 'ncl') return;
    const timer = setTimeout(loadNcls, 0);
    return () => clearTimeout(timer);
  }, [tab, loadNcls]);

  const saveCheckpoint = async () => {
    setSaving(true);
    await apiFetch('/qa/checkpoints', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cpForm, issues: cpForm.issues ? cpForm.issues.split('\n').filter(Boolean) : [], checkedById: 'current' }),
    });
    setSaving(false); setCpModal(false);
    setCpForm({ orderId: '', stage: 'prepress', status: 'passed', notes: '', issues: '' });
    load();
  };

  const saveNcl = async () => {
    setSaving(true);
    await apiFetch('/qa/ncl', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...nclForm, reportedById: 'current' }),
    });
    setSaving(false); setNclModal(false);
    setNclForm({ orderId: '', stage: '', description: '', severity: 'minor' });
    loadNcls(); load();
  };

  const resolveNcl = async () => {
    if (!resolveModal.ncl) return;
    setSaving(true);
    await apiFetch(`/qa/ncl/${resolveModal.ncl.id}/resolve`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution: resolveModal.resolution, resolvedById: 'current' }),
    });
    setSaving(false);
    setResolveModal({ open: false, ncl: null, resolution: '' });
    loadNcls(); load();
  };

  const TABS = [
    { id: 'checkpoints' as QaTab, label: 'Шалгалт' },
    { id: 'passports' as QaTab, label: 'Print Passport' },
    { id: 'ncl' as QaTab, label: `NCL (${summary?.openNcls ?? 0} нээлттэй)`, warn: (summary?.openNcls ?? 0) > 0 },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium" style={{ color: 'var(--text)' }}>Чанарын хяналт</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text3)' }}>QA checkpoint, Print Passport, NCL</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setNclModal(true)}
            className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid #DC262650', color: '#DC2626' }}>
            + NCL бүртгэх
          </button>
          <button onClick={() => setCpModal(true)}
            className="px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ background: '#FF6B00' }}>
            + Шалгалт нэмэх
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Нийт шалгалт', val: summary.totalChecks, color: '#378ADD' },
            { label: 'Дамжилтын хувь', val: `${summary.passedRate}%`, color: summary.passedRate >= 90 ? '#1D9E75' : '#BA7517' },
            { label: 'Нээлттэй NCL', val: summary.openNcls, color: summary.openNcls > 0 ? '#BA7517' : '#1D9E75' },
            { label: 'Критик NCL', val: summary.criticalNcls, color: summary.criticalNcls > 0 ? '#E24B4A' : '#1D9E75' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: 'var(--surface2)' }}>
              <div className="text-2xl font-medium" style={{ color: s.color }}>{s.val}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text3)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 mb-5" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium -mb-px transition-colors"
            style={{
              borderBottom: `2px solid ${tab === t.id ? '#FF6B00' : 'transparent'}`,
              color: tab === t.id ? '#FF6B00' : t.warn ? '#D97706' : 'var(--text3)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'checkpoints' && (
        <div className="text-sm text-center py-12" style={{ color: 'var(--text3)' }}>
          Захиалгын дугаараар шалгалт хайх боломж нэмэгдэнэ.
          <br />
          <button className="mt-3 hover:underline" style={{ color: '#FF6B00' }} onClick={() => setCpModal(true)}>
            Шинэ шалгалт нэмэх
          </button>
        </div>
      )}

      {tab === 'ncl' && (
        <div className="space-y-3">
          {ncls.length === 0 && (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text4)' }}>NCL бүртгэл байхгүй</div>
          )}
          {ncls.map(ncl => (
            <div key={ncl.id} className="rounded-xl p-4" style={{
              border: `1px solid ${ncl.status === 'open' ? '#D9770640' : 'var(--border)'}`,
            }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEV_COLORS[ncl.severity]}`}>
                      {ncl.severity}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text4)' }}>{STAGE_LABELS[ncl.stage] ?? ncl.stage}</span>
                    <span className="text-xs font-mono" style={{ color: 'var(--text4)' }}>#{ncl.orderId.slice(-8)}</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>{ncl.description}</p>
                  {ncl.resolution && (
                    <p className="text-xs mt-1.5" style={{ color: '#059669' }}>Шийдэл: {ncl.resolution}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    ncl.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : ncl.status === 'open' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>{ncl.status}</span>
                  {ncl.status === 'open' && (
                    <button onClick={() => setResolveModal({ open: true, ncl, resolution: '' })}
                      className="text-xs hover:underline" style={{ color: '#378ADD' }}>Шийдэх</button>
                  )}
                </div>
              </div>
              <div className="text-xs mt-2" style={{ color: 'var(--text4)' }}>
                {new Date(ncl.createdAt).toLocaleString('mn-MN')}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'passports' && (
        <div className="text-sm text-center py-12" style={{ color: 'var(--text3)' }}>
          Захиалгын дугаараар Print Passport хайх боломж нэмэгдэнэ.
        </div>
      )}

      {/* Checkpoint modal */}
      {cpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-xl" style={{ background: 'var(--surface)' }}>
            <h2 className="font-medium mb-5" style={{ color: 'var(--text)' }}>Шалгалт нэмэх</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Захиалгын ID</label>
                <input value={cpForm.orderId} onChange={e => setCpForm(p => ({ ...p, orderId: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Шат</label>
                  <select value={cpForm.stage} onChange={e => setCpForm(p => ({ ...p, stage: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }}>
                    {Object.entries(STAGE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Үр дүн</label>
                  <select value={cpForm.status} onChange={e => setCpForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }}>
                    <option value="passed">Дамжлаа</option>
                    <option value="failed">Дамжсангүй</option>
                    <option value="needs_rework">Дахин хийх</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Тэмдэглэл</label>
                <textarea value={cpForm.notes} onChange={e => setCpForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                  className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setCpModal(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}>Цуцлах</button>
              <button onClick={saveCheckpoint} disabled={saving || !cpForm.orderId}
                className="flex-1 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50" style={{ background: '#FF6B00' }}>
                {saving ? 'Хадгалж байна...' : 'Хадгалах'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NCL modal */}
      {nclModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md shadow-xl" style={{ background: 'var(--surface)' }}>
            <h2 className="font-medium mb-5" style={{ color: 'var(--text)' }}>NCL бүртгэх</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Захиалгын ID</label>
                <input value={nclForm.orderId} onChange={e => setNclForm(p => ({ ...p, orderId: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Шат</label>
                  <input value={nclForm.stage} onChange={e => setNclForm(p => ({ ...p, stage: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Ноцтой байдал</label>
                  <select value={nclForm.severity} onChange={e => setNclForm(p => ({ ...p, severity: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }}>
                    <option value="minor">Бага (minor)</option>
                    <option value="major">Дунд (major)</option>
                    <option value="critical">Критик</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Тайлбар</label>
                <textarea value={nclForm.description} onChange={e => setNclForm(p => ({ ...p, description: e.target.value }))} rows={3}
                  className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setNclModal(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}>Цуцлах</button>
              <button onClick={saveNcl} disabled={saving || !nclForm.orderId || !nclForm.description}
                className="flex-1 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50" style={{ background: '#DC2626' }}>
                {saving ? 'Бүртгэж байна...' : 'Бүртгэх'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve modal */}
      {resolveModal.open && resolveModal.ncl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-xl" style={{ background: 'var(--surface)' }}>
            <h2 className="font-medium mb-1" style={{ color: 'var(--text)' }}>NCL шийдэх</h2>
            <p className="text-sm mb-5 line-clamp-2" style={{ color: 'var(--text3)' }}>{resolveModal.ncl.description}</p>
            <label className="block text-xs mb-1" style={{ color: 'var(--text3)' }}>Шийдлийн тайлбар</label>
            <textarea value={resolveModal.resolution}
              onChange={e => setResolveModal(m => ({ ...m, resolution: e.target.value }))} rows={3}
              className="w-full rounded-lg px-3 py-2 text-sm resize-none mb-5" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }} />
            <div className="flex gap-3">
              <button onClick={() => setResolveModal({ open: false, ncl: null, resolution: '' })}
                className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: '1px solid var(--border)', color: 'var(--text2)' }}>Цуцлах</button>
              <button onClick={resolveNcl} disabled={saving || !resolveModal.resolution}
                className="flex-1 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50" style={{ background: '#059669' }}>
                {saving ? 'Шийдэж байна...' : 'Шийдэх'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
