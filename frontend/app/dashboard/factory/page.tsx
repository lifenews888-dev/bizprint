'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface DashboardStats {
  production: {
    queued: number;
    printing: number;
    finishing: number;
    completedToday: number;
    rushJobs: number;
    avgCompletionHours: number;
  };
  warehouse: {
    totalItems: number;
    lowStockCount: number;
    totalValue: number;
    recentMovements: number;
  };
  qa: {
    totalChecks: number;
    passedRate: number;
    openNcls: number;
    criticalNcls: number;
  };
}

const NAV_ITEMS = [
  {
    href: '/dashboard/factory/production-board',
    label: 'Үйлдвэрлэлийн самбар',
    sub: 'Kanban drag & drop',
    color: '#FF6B00',
    statKey: 'production' as const,
  },
  {
    href: '/dashboard/factory/warehouse',
    label: 'Агуулах',
    sub: 'Материалын нөөц',
    color: '#1D9E75',
    statKey: 'warehouse' as const,
  },
  {
    href: '/dashboard/factory/qa',
    label: 'Чанарын хяналт',
    sub: 'QA checkpoint, NCL',
    color: '#534AB7',
    statKey: 'qa' as const,
  },
  {
    href: '/dashboard/factory/machines',
    label: 'Машин тоног',
    sub: 'Хуваарь, засвар',
    color: '#378ADD',
    statKey: null,
  },
  {
    href: '/dashboard/factory/gang-run',
    label: 'Gang run',
    sub: 'Нэгтгэл оптимизаци',
    color: '#BA7517',
    statKey: null,
  },
  {
    href: '/dashboard/factory/jobs',
    label: 'Бүх ажлууд',
    sub: 'Жагсаалт, файлууд',
    color: '#5F5E5A',
    statKey: null,
  },
];

export default function FactoryDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<any>('/production/summary').catch(() => ({
        queued: 0, printing: 0, finishing: 0, completedToday: 0, rushJobs: 0, avgCompletionHours: 0,
      })),
      apiFetch<any>('/warehouse/summary').catch(() => ({
        totalItems: 0, lowStockCount: 0, totalValue: 0, recentMovements: 0,
      })),
      apiFetch<any>('/qa/summary').catch(() => ({
        totalChecks: 0, passedRate: 0, openNcls: 0, criticalNcls: 0,
      })),
    ]).then(([production, warehouse, qa]) => {
      setStats({ production, warehouse, qa });
    }).finally(() => setLoading(false));
  }, []);

  const getStatBadge = (key: typeof NAV_ITEMS[0]['statKey']) => {
    if (!stats || !key) return null;
    if (key === 'production') {
      const active = stats.production.queued + stats.production.printing + stats.production.finishing;
      if (stats.production.rushJobs > 0) return { val: `${stats.production.rushJobs} яаралтай`, warn: true };
      if (active > 0) return { val: `${active} идэвхтэй`, warn: false };
    }
    if (key === 'warehouse') {
      if (stats.warehouse.lowStockCount > 0) return { val: `${stats.warehouse.lowStockCount} нөөц бага`, warn: true };
    }
    if (key === 'qa') {
      if (stats.qa.criticalNcls > 0) return { val: `${stats.qa.criticalNcls} критик`, warn: true };
      if (stats.qa.openNcls > 0) return { val: `${stats.qa.openNcls} нээлттэй`, warn: false };
    }
    return null;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-medium" style={{ color: 'var(--text)' }}>
          Үйлдвэрийн удирдлагын самбар
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
          BizPrint Factory OS
        </p>
      </div>

      {/* Quick stats */}
      {stats && !loading && (
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Хэвлэж буй', val: stats.production.printing, color: '#BA7517' },
            { label: 'Өнөөдөр дууссан', val: stats.production.completedToday, color: '#1D9E75' },
            {
              label: 'Нөөц бага',
              val: stats.warehouse.lowStockCount,
              color: stats.warehouse.lowStockCount > 0 ? '#E24B4A' : '#888780',
            },
            {
              label: 'QA дундаж',
              val: `${stats.qa.passedRate}%`,
              color: stats.qa.passedRate >= 90 ? '#1D9E75' : '#BA7517',
            },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: 'var(--surface2)' }}>
              <div className="text-2xl font-medium" style={{ color: s.color }}>{s.val}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text3)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-20 mb-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
        </div>
      )}

      {/* Navigation grid */}
      <div className="grid grid-cols-2 gap-3">
        {NAV_ITEMS.map(item => {
          const badge = getStatBadge(item.statKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-4 p-4 rounded-xl hover:shadow-sm transition-all"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                style={{ backgroundColor: item.color + '18', color: item.color }}
              >
                {item.label.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                  {item.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text4)' }}>{item.sub}</div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {badge && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: badge.warn ? 'rgba(220,38,38,0.1)' : 'var(--surface2)',
                      color: badge.warn ? '#DC2626' : 'var(--text3)',
                    }}
                  >
                    {badge.val}
                  </span>
                )}
                <svg
                  className="w-4 h-4 opacity-30 group-hover:opacity-60 transition-opacity"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  style={{ color: 'var(--text3)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Performance summary */}
      {stats && stats.production.avgCompletionHours > 0 && (
        <div className="mt-6 p-4 rounded-xl" style={{ background: 'var(--surface2)' }}>
          <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text3)' }}>
            Гүйцэтгэлийн үзүүлэлт
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                {stats.production.avgCompletionHours}ц
              </span>
              <span className="ml-1.5" style={{ color: 'var(--text3)' }}>дундаж гүйцэтгэл</span>
            </div>
            <div>
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                {stats.qa.passedRate}%
              </span>
              <span className="ml-1.5" style={{ color: 'var(--text3)' }}>QA дамжилт</span>
            </div>
            <div>
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                {(stats.warehouse.totalValue / 1_000_000).toFixed(1)}M₮
              </span>
              <span className="ml-1.5" style={{ color: 'var(--text3)' }}>нөөцийн үнэ цэнэ</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
