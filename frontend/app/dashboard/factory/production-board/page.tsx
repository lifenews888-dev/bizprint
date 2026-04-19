'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import React, { useRouter } from 'next/navigation';
import React, { apiFetch } from '@/lib/api';

interface ProductionJob {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  productType: string;
  quantity: number;
  status: 'QUEUED' | 'ASSIGNED' | 'PRINTING' | 'FINISHING' | 'COMPLETED' | 'CANCELLED';
  machineId?: string;
  machineName?: string;
  estimatedMinutes?: number;
  startedAt?: string;
  completedAt?: string;
  deadline?: string;
  priority: 'low' | 'normal' | 'high' | 'rush';
  paperStock?: string;
  colorMode?: string;
  createdAt: string;
}

interface Summary {
  queued: number; assigned: number; printing: number; finishing: number;
  completedToday: number; rushJobs: number; avgCompletionHours: number;
}

interface Machine {
  id: string; name: string; type: string; status: string;
}

type ViewMode = 'kanban' | 'gantt';

const COLUMNS: { id: ProductionJob['status']; label: string; color: string }[] = [
  { id: 'QUEUED',    label: 'Хүлээгдэж буй',  color: '#888780' },
  { id: 'ASSIGNED',  label: 'Хуваарилагдсан', color: '#378ADD' },
  { id: 'PRINTING',  label: 'Хэвлэж буй',     color: '#BA7517' },
  { id: 'FINISHING', label: 'Боловсруулалт',  color: '#534AB7' },
  { id: 'COMPLETED', label: 'Дууссан',         color: '#1D9E75' },
];

const PRIORITY_COLORS: Record<string, string> = {
  rush: 'bg-red-100 text-red-800', high: 'bg-orange-100 text-orange-800',
  normal: 'bg-gray-100 text-gray-600', low: 'bg-blue-50 text-blue-600',
};
const PRIORITY_LABELS: Record<string, string> = {
  rush: 'Яаралтай', high: 'Өндөр', normal: 'Энгийн', low: 'Бага',
};
const STATUS_COLORS: Record<string, string> = {
  QUEUED: '#888780', ASSIGNED: '#378ADD', PRINTING: '#BA7517', FINISHING: '#534AB7', COMPLETED: '#1D9E75', CANCELLED: '#DC2626',
};

function ElapsedTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = Date.now() - new Date(startedAt).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setElapsed(h > 0 ? `${h}ц ${m}м` : `${m}м`);
    };
    calc();
    const i = setInterval(calc, 60000);
    return () => clearInterval(i);
  }, [startedAt]);
  return <span>{elapsed}</span>;
}

export default function ProductionBoardPage() {
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [assignModal, setAssignModal] = useState<{ open: boolean; jobId: string | null }>({ open: false, jobId: null });
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const [jobsData, summaryData, machinesData] = await Promise.all([
      apiFetch<any>('/production').catch(() => []),
      apiFetch<any>('/production/summary').catch(() => null),
      apiFetch<any>('/machines').catch(() => []),
    ]);
    setJobs(Array.isArray(jobsData) ? jobsData : jobsData?.items ?? []);
    if (summaryData) setSummary(summaryData);
    setMachines(Array.isArray(machinesData) ? machinesData : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    setDragging(jobId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: ProductionJob['status']) => {
    e.preventDefault();
    if (!dragging) return;
    const job = jobs.find(j => j.id === dragging);
    if (!job || job.status === newStatus) { setDragging(null); setDragOver(null); return; }

    const prev = job.status;
    setJobs(p => p.map(j => j.id === dragging ? { ...j, status: newStatus } : j));
    setDragging(null); setDragOver(null);

    try {
      await apiFetch(`/production/${job.id}/status`, {
        method: 'PATCH', body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      setJobs(p => p.map(j => j.id === job.id ? { ...j, status: prev } : j));
    }
  };

  const assignMachine = async (machineId: string, machineName: string) => {
    if (!assignModal.jobId) return;
    await apiFetch(`/production/${assignModal.jobId}/assign`, {
      method: 'PATCH', body: JSON.stringify({ machineId, machineName }),
    }).catch(() => {});
    setAssignModal({ open: false, jobId: null });
    fetchData();
  };

  const getColumnJobs = (status: ProductionJob['status']) =>
    jobs.filter(j => j.status === status).sort((a, b) => {
      const pr: Record<string, number> = { rush: 0, high: 1, normal: 2, low: 3 };
      return (pr[a.priority] ?? 2) - (pr[b.priority] ?? 2);
    });

  const totalActive = jobs.filter(j => j.status !== 'COMPLETED' && j.status !== 'CANCELLED').length;

  // Gantt data
  const ganttJobs = useMemo(() =>
    jobs.filter(j => j.status !== 'CANCELLED').sort((a, b) => {
      const pr: Record<string, number> = { rush: 0, high: 1, normal: 2, low: 3 };
      return (pr[a.priority] ?? 2) - (pr[b.priority] ?? 2);
    }),
  [jobs]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>;
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-medium" style={{ color: 'var(--text)' }}>Үйлдвэрлэлийн самбар</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text3)' }}>
            {totalActive} идэвхтэй ажил · {viewMode === 'kanban' ? 'Чирж статус өөрчилнө' : 'Timeline харагдац'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {(['kanban', 'gantt'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ background: viewMode === v ? '#FF6B00' : 'transparent', color: viewMode === v ? '#fff' : 'var(--text3)' }}>
                {v === 'kanban' ? 'Kanban' : 'Gantt'}
              </button>
            ))}
          </div>
          <button onClick={() => router.push('/dashboard/factory/jobs/new')}
            className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90" style={{ background: '#FF6B00' }}>
            + Шинэ ажил
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-6 gap-3 flex-shrink-0">
          {[
            { label: 'Хүлээгдэж', value: summary.queued, color: '#888780' },
            { label: 'Хуваарилагдсан', value: summary.assigned, color: '#378ADD' },
            { label: 'Хэвлэж буй', value: summary.printing, color: '#BA7517' },
            { label: 'Боловсруулалт', value: summary.finishing, color: '#534AB7' },
            { label: 'Өнөөдөр дууссан', value: summary.completedToday, color: '#1D9E75' },
            { label: 'Яаралтай', value: summary.rushJobs, color: '#DC2626' },
          ].map(c => (
            <div key={c.label} className="rounded-xl p-3" style={{ background: c.color + '10', border: `1px solid ${c.color}25` }}>
              <p className="text-xs" style={{ color: 'var(--text4)' }}>{c.label}</p>
              <p className="text-xl font-semibold mt-0.5" style={{ color: c.color }}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-2 flex-1 min-h-0">
          {COLUMNS.map(col => {
            const colJobs = getColumnJobs(col.id);
            const isOver = dragOver === col.id;
            return (
              <div key={col.id} className="flex flex-col flex-shrink-0 w-64"
                onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => handleDrop(e, col.id)}>
                <div className="flex items-center justify-between px-3 py-2 rounded-t-lg mb-2"
                  style={{ backgroundColor: col.color + '18', borderBottom: `2px solid ${col.color}` }}>
                  <span className="text-sm font-medium" style={{ color: col.color }}>{col.label}</span>
                  <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ backgroundColor: col.color + '30', color: col.color }}>{colJobs.length}</span>
                </div>
                <div className={`flex flex-col gap-2 flex-1 min-h-20 p-1 rounded-b-lg transition-colors ${isOver ? 'bg-gray-100 dark:bg-gray-800' : ''}`}>
                  {colJobs.map(job => (
                    <div key={job.id} draggable onDragStart={e => handleDragStart(e, job.id)}
                      className={`rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all select-none ${dragging === job.id ? 'opacity-50' : ''}`}
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-xs font-mono" style={{ color: 'var(--text4)' }}>#{job.orderNumber}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[job.priority]}`}>
                          {PRIORITY_LABELS[job.priority]}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-tight mb-1" style={{ color: 'var(--text)' }}>{job.productType}</p>
                      <p className="text-xs" style={{ color: 'var(--text3)' }}>{job.customerName}</p>

                      <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                        <span className="text-xs" style={{ color: 'var(--text4)' }}>{job.quantity.toLocaleString()}ш</span>
                        {job.colorMode && <span className="text-xs" style={{ color: 'var(--text4)' }}>{job.colorMode}</span>}
                        {job.machineName ? (
                          <span className="text-xs ml-auto truncate" style={{ color: '#378ADD' }}>{job.machineName}</span>
                        ) : job.status === 'QUEUED' ? (
                          <button onClick={e => { e.stopPropagation(); setAssignModal({ open: true, jobId: job.id }); }}
                            className="text-xs ml-auto hover:underline" style={{ color: '#FF6B00' }}>Машин сонгох</button>
                        ) : null}
                      </div>

                      {job.startedAt && !job.completedAt && (
                        <div className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#BA7517' }}>
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#BA7517' }} />
                          <ElapsedTimer startedAt={job.startedAt} />
                        </div>
                      )}
                      {job.estimatedMinutes && !job.startedAt && (
                        <div className="mt-1.5 text-xs" style={{ color: 'var(--text4)' }}>~{Math.round(job.estimatedMinutes / 60 * 10) / 10}ц</div>
                      )}
                    </div>
                  ))}
                  {colJobs.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-xs rounded-lg border-2 border-dashed min-h-20"
                      style={{ color: 'var(--text4)', borderColor: isOver ? 'var(--text3)' : 'var(--border)' }}>
                      {isOver ? 'Энд тавих' : 'Хоосон'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Gantt View */}
      {viewMode === 'gantt' && (
        <div className="flex-1 overflow-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
          <div className="min-w-[800px]">
            {/* Gantt header */}
            <div className="flex items-center px-4 py-2 text-xs font-medium" style={{ background: 'var(--surface2)', color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>
              <div className="w-48 flex-shrink-0">Захиалга</div>
              <div className="w-24 flex-shrink-0 text-center">Статус</div>
              <div className="w-24 flex-shrink-0 text-center">Машин</div>
              <div className="flex-1 flex">
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="flex-1 text-center text-[10px]" style={{ color: 'var(--text4)' }}>{String(i).padStart(2, '0')}</div>
                ))}
              </div>
            </div>
            {/* Gantt rows */}
            {ganttJobs.map(job => {
              const startHour = job.startedAt ? new Date(job.startedAt).getHours() + new Date(job.startedAt).getMinutes() / 60 : 8;
              const duration = (job.estimatedMinutes ?? 60) / 60;
              const barLeft = (startHour / 24) * 100;
              const barWidth = Math.min((duration / 24) * 100, 100 - barLeft);
              const barColor = STATUS_COLORS[job.status] ?? '#888';

              return (
                <div key={job.id} className="flex items-center px-4 py-2 hover:bg-[var(--surface2)] transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="w-48 flex-shrink-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>#{job.orderNumber} {job.productType}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text4)' }}>{job.customerName} · {job.quantity.toLocaleString()}ш</p>
                  </div>
                  <div className="w-24 flex-shrink-0 text-center">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: barColor + '20', color: barColor }}>
                      {COLUMNS.find(c => c.id === job.status)?.label ?? job.status}
                    </span>
                  </div>
                  <div className="w-24 flex-shrink-0 text-center">
                    <span className="text-[10px]" style={{ color: job.machineName ? '#378ADD' : 'var(--text4)' }}>
                      {job.machineName ?? '—'}
                    </span>
                  </div>
                  <div className="flex-1 relative h-6">
                    <div className="absolute inset-0 flex">
                      {Array.from({ length: 24 }, (_, i) => (
                        <div key={i} className="flex-1" style={{ borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }} />
                      ))}
                    </div>
                    <div className="absolute top-1 h-4 rounded-full" style={{
                      left: `${barLeft}%`, width: `${Math.max(barWidth, 2)}%`,
                      background: barColor, opacity: job.status === 'COMPLETED' ? 0.4 : 0.8,
                    }}>
                      {barWidth > 5 && (
                        <span className="text-[9px] text-white font-medium px-1.5 leading-4 truncate block">
                          {job.estimatedMinutes ? `${Math.round(job.estimatedMinutes / 60 * 10) / 10}ц` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {ganttJobs.length === 0 && (
              <div className="py-12 text-center text-sm" style={{ color: 'var(--text4)' }}>Ажил байхгүй</div>
            )}
          </div>
        </div>
      )}

      {/* Machine assign modal */}
      {assignModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAssignModal({ open: false, jobId: null })}>
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-xl" style={{ background: 'var(--surface)' }} onClick={e => e.stopPropagation()}>
            <h2 className="font-medium mb-4" style={{ color: 'var(--text)' }}>Машин хуваарилах</h2>
            <div className="space-y-2 max-h-60 overflow-auto">
              {machines.length > 0 ? machines.map(m => (
                <button key={m.id} onClick={() => assignMachine(m.id, m.name)}
                  className="w-full flex items-center justify-between p-3 rounded-xl text-left hover:shadow-sm transition-shadow"
                  style={{ border: '1px solid var(--border)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{m.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text4)' }}>{m.type}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    background: m.status === 'idle' ? 'rgba(5,150,105,0.1)' : 'rgba(186,117,23,0.1)',
                    color: m.status === 'idle' ? '#059669' : '#BA7517',
                  }}>
                    {m.status === 'idle' ? 'Чөлөөтэй' : 'Ажиллаж буй'}
                  </span>
                </button>
              )) : (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text4)' }}>Машин бүртгэгдээгүй</p>
              )}
            </div>
            <button onClick={() => setAssignModal({ open: false, jobId: null })}
              className="w-full py-2.5 rounded-xl text-sm mt-4" style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}>Хаах</button>
          </div>
        </div>
      )}
    </div>
  );
}
