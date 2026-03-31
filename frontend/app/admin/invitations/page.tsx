'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminDataTable, type Column } from '@/components/admin/AdminDataTable'
import { Badge } from '@/components/ui/badge'

export default function AdminInvitations() {
  const [invitations, setInvitations] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch('/admin/invitations').then((r: any) => { setInvitations(r[0]); setTotal(r[1]) }),
      apiFetch('/admin/invitations/stats').then(setStats),
    ]).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const columns: Column<any>[] = [
    { key: 'title', label: 'Гарчиг', render: row => <span className="font-medium text-foreground">{row.title}</span> },
    { key: 'user', label: 'Хэрэглэгч', render: row => <span className="text-muted-foreground">{row.user?.full_name || row.user?.email}</span> },
    { key: 'type', label: 'Төрөл', className: 'text-center', render: row => <span className="text-muted-foreground">{row.type}</span> },
    { key: 'status', label: 'Статус', className: 'text-center', render: row => (
      <Badge variant={row.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{row.status}</Badge>
    )},
    { key: 'view_count', label: 'Үзсэн', className: 'text-right', render: row => <span className="text-muted-foreground">{row.view_count}</span> },
  ]

  return (
    <div className="p-4 md:p-6">
      <AdminPageHeader title="Урилга удирдлага" description={`Нийт: ${total}`} />

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Нийт урилга', value: stats.total, color: '#FF6B00' },
            { label: 'Идэвхтэй', value: stats.active, color: '#10B981' },
            { label: 'Нийт зочид', value: stats.totalGuests, color: '#8B5CF6' },
            { label: 'Ирнэ гэсэн', value: stats.attending, color: '#F59E0B' },
          ].map(k => (
            <div key={k.label} className="rounded-xl border border-border bg-card p-5 text-center">
              <div className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <AdminDataTable data={invitations} columns={columns} loading={loading} searchKeys={['title']} searchPlaceholder="Урилга хайх..." emptyIcon="💌" emptyText="Урилга байхгүй" />
      </div>
    </div>
  )
}
