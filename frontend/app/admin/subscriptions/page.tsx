'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminDataTable, type Column } from '@/components/admin/AdminDataTable'
import { Badge } from '@/components/ui/badge'

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch('/admin/subscriptions').then((r: any) => { setSubs(r[0]); setTotal(r[1]) }),
      apiFetch('/admin/subscriptions/stats').then(setStats),
    ]).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const columns: Column<any>[] = [
    { key: 'user', label: 'Хэрэглэгч', render: row => <span className="font-medium text-foreground">{row.user?.full_name || row.user?.email}</span> },
    { key: 'plan', label: 'Багц', render: row => <span className="text-muted-foreground">{row.plan?.name}</span> },
    { key: 'status', label: 'Статус', className: 'text-center', render: row => (
      <Badge variant={row.status === 'active' ? 'default' : 'destructive'} className="text-[10px]">{row.status}</Badge>
    )},
    { key: 'expires_at', label: 'Дуусах', className: 'text-right', render: row => (
      <span className="text-sm text-muted-foreground">{row.expires_at ? new Date(row.expires_at).toLocaleDateString('mn-MN') : '—'}</span>
    )},
  ]

  return (
    <div className="p-4 md:p-6">
      <AdminPageHeader title="Эрхийн удирдлага" description={`Нийт: ${total}`} />

      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Идэвхтэй эрх', value: stats.totalActive, color: '#10B981' },
            { label: 'Нийт орлого', value: `${Number(stats.totalRevenue).toLocaleString()}₮`, color: '#FF6B00' },
            { label: 'Багцаар', value: stats.byPlan?.length || 0, color: '#8B5CF6' },
          ].map(k => (
            <div key={k.label} className="rounded-xl border border-border bg-card p-5 text-center">
              <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {stats?.byPlan?.length > 0 && (
        <div className="flex gap-3 mb-6">
          {stats.byPlan.map((p: any) => (
            <div key={p.plan_name} className="flex-1 rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-xl font-bold text-foreground">{p.count}</div>
              <div className="text-xs text-muted-foreground">{p.plan_name}</div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <AdminDataTable data={subs} columns={columns} loading={loading} searchKeys={['user']} emptyIcon="💎" emptyText="Эрх байхгүй" />
      </div>
    </div>
  )
}
