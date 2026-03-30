'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"

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

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: FONT, color: '#9CA3AF' }}>Ачааллаж байна...</div>

  return (
    <div style={{ padding: 24, fontFamily: FONT }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 24px' }}>Урилга удирдлага</h1>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <Kpi label="Нийт урилга" value={stats.total} color="#FF6B00" />
          <Kpi label="Идэвхтэй" value={stats.active} color="#10B981" />
          <Kpi label="Нийт зочид" value={stats.totalGuests} color="#8B5CF6" />
          <Kpi label="Ирнэ гэсэн" value={stats.attending} color="#F59E0B" />
        </div>
      )}

      <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, border: '1px solid var(--border, #E5E7EB)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--surface2, #F9FAFB)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280' }}>Гарчиг</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280' }}>Хэрэглэгч</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>Төрөл</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>Статус</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#6B7280' }}>Үзсэн</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((inv: any) => (
              <tr key={inv.id} style={{ borderTop: '1px solid var(--border, #E5E7EB)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text, #111)' }}>{inv.title}</td>
                <td style={{ padding: '12px 16px', color: '#6B7280' }}>{inv.user?.full_name || inv.user?.email}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center', color: '#6B7280' }}>{inv.type}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: inv.status === 'active' ? '#DCFCE7' : '#F3F4F6', color: inv.status === 'active' ? '#166534' : '#6B7280' }}>{inv.status}</span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#6B7280' }}>{inv.view_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ textAlign: 'center', padding: 16, fontSize: 13, color: '#9CA3AF' }}>Нийт: {total}</div>
    </div>
  )
}

function Kpi({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: 'var(--surface, #fff)', borderRadius: 14, padding: 20, border: '1px solid var(--border, #E5E7EB)', textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{label}</div>
    </div>
  )
}
