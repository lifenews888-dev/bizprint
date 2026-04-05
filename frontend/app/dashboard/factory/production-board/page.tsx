'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ProductionJob {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  productType: string;
  quantity: number;
  status: 'QUEUED' | 'ASSIGNED' | 'PRINTING' | 'FINISHING' | 'COMPLETED';
  machineName?: string;
  estimatedMinutes?: number;
  startedAt?: string;
  priority: 'low' | 'normal' | 'high' | 'rush';
  paperStock?: string;
  colorMode?: string;
  createdAt: string;
}

const COLUMNS: { id: ProductionJob['status']; label: string; color: string }[] = [
  { id: 'QUEUED',    label: 'Хүлээгдэж буй',  color: '#888780' },
  { id: 'ASSIGNED',  label: 'Хуваарилагдсан', color: '#378ADD' },
  { id: 'PRINTING',  label: 'Хэвлэж буй',     color: '#BA7517' },
  { id: 'FINISHING', label: 'Боловсруулалт',  color: '#534AB7' },
  { id: 'COMPLETED', label: 'Дууссан',         color: '#1D9E75' },
];

const PRIORITY_COLORS: Record<string, string> = {
  rush:   'bg-red-100 text-red-800',
  high:   'bg-orange-100 text-orange-800',
  normal: 'bg-gray-100 text-gray-600',
  low:    'bg-blue-50 text-blue-600',
};

const PRIORITY_LABELS: Record<string, string> = {
  rush: 'Яаралтай', high: 'Өндөр', normal: 'Энгийн', low: 'Бага',
};

export default function ProductionBoardPage() {
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const router = useRouter();

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(`${API}/production`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : data.items ?? []);
    } catch (e) {
      console.error('Production jobs fetch failed', e);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 30_000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    setDragging(jobId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: ProductionJob['status']) => {
    e.preventDefault();
    if (!dragging) return;

    const job = jobs.find(j => j.id === dragging);
    if (!job || job.status === newStatus) {
      setDragging(null);
      setDragOver(null);
      return;
    }

    // Optimistic update
    setJobs(prev => prev.map(j =>
      j.id === dragging ? { ...j, status: newStatus } : j
    ));
    setDragging(null);
    setDragOver(null);

    try {
      await fetch(`${API}/production/${dragging}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      setJobs(prev => prev.map(j =>
        j.id === dragging ? { ...j, status: job.status } : j
      ));
    }
  };

  const getColumnJobs = (status: ProductionJob['status']) =>
    jobs.filter(j => j.status === status).sort((a, b) => {
      const pr: Record<string, number> = { rush: 0, high: 1, normal: 2, low: 3 };
      return (pr[a.priority] ?? 2) - (pr[b.priority] ?? 2);
    });

  const totalActive = jobs.filter(j => j.status !== 'COMPLETED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-medium" style={{ color: 'var(--text)' }}>
            Үйлдвэрлэлийн самбар
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text3)' }}>
            {totalActive} идэвхтэй ажил · Чирж байрлуулж статус өөрчилнө
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/factory/jobs/new')}
          className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ background: '#FF6B00' }}
        >
          + Шинэ ажил
        </button>
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-2 flex-1 min-h-0">
        {COLUMNS.map(col => {
          const colJobs = getColumnJobs(col.id);
          const isOver = dragOver === col.id;

          return (
            <div
              key={col.id}
              className="flex flex-col flex-shrink-0 w-64"
              onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, col.id)}
            >
              {/* Column header */}
              <div
                className="flex items-center justify-between px-3 py-2 rounded-t-lg mb-2"
                style={{ backgroundColor: col.color + '18', borderBottom: `2px solid ${col.color}` }}
              >
                <span className="text-sm font-medium" style={{ color: col.color }}>
                  {col.label}
                </span>
                <span
                  className="text-xs font-medium rounded-full px-2 py-0.5"
                  style={{ backgroundColor: col.color + '30', color: col.color }}
                >
                  {colJobs.length}
                </span>
              </div>

              {/* Cards */}
              <div
                className={`flex flex-col gap-2 flex-1 min-h-20 p-1 rounded-b-lg transition-colors ${
                  isOver ? 'bg-gray-100 dark:bg-gray-800' : ''
                }`}
              >
                {colJobs.map(job => (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={e => handleDragStart(e, job.id)}
                    onClick={() => router.push(`/dashboard/factory/jobs/${job.id}`)}
                    className={`rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md
                      transition-all select-none ${dragging === job.id ? 'opacity-50' : ''}`}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="text-xs font-mono" style={{ color: 'var(--text4)' }}>#{job.orderNumber}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[job.priority]}`}>
                        {PRIORITY_LABELS[job.priority]}
                      </span>
                    </div>

                    <p className="text-sm font-medium leading-tight mb-1" style={{ color: 'var(--text)' }}>
                      {job.productType}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text3)' }}>{job.customerName}</p>

                    <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                      <span className="text-xs" style={{ color: 'var(--text4)' }}>×{job.quantity.toLocaleString()}</span>
                      {job.colorMode && (
                        <span className="text-xs" style={{ color: 'var(--text4)' }}>{job.colorMode}</span>
                      )}
                      {job.machineName && (
                        <span className="text-xs ml-auto truncate" style={{ color: '#378ADD' }}>
                          {job.machineName}
                        </span>
                      )}
                    </div>

                    {job.estimatedMinutes && (
                      <div className="mt-1.5 text-xs" style={{ color: 'var(--text4)' }}>
                        ~{Math.round(job.estimatedMinutes / 60 * 10) / 10}ц
                      </div>
                    )}
                  </div>
                ))}

                {colJobs.length === 0 && (
                  <div
                    className="flex-1 flex items-center justify-center text-xs rounded-lg border-2 border-dashed min-h-20"
                    style={{
                      color: 'var(--text4)',
                      borderColor: isOver ? 'var(--text3)' : 'var(--border)',
                    }}
                  >
                    {isOver ? 'Энд тавих' : 'Хоосон'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
