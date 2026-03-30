'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"

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

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: FONT, color: '#9CA3AF' }}>Ачааллаж байна...</div>

  return (
    <div style={{ padding: 24, fontFamily: FONT }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 24px' }}>Эрхийн удирдлага</h1>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          <Kpi label="Идэвхтэй эрх" value={stats.totalActive} color="#10B981" />
          <Kpi label="Нийт орлого" value={`${Number(stats.totalRevenue).toLocaleString()}₮`} color="#FF6B00" />
          <Kpi label="Багцаар" value={stats.byPlan?.length || 0} color="#8B5CF6" />
        </div>
      )}

      {stats?.byPlan?.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {stats.byPlan.map((p: any) => (
            <div key={p.plan_name} style={{ background: 'var(--surface, #fff)', borderRadius: 12, padding: 16, border: '1px solid var(--border, #E5E7EB)', flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #111)' }}>{p.count}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{p.plan_name}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, border: '1px solid var(--border, #E5E7EB)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--surface2, #F9FAFB)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280' }}>Хэрэглэгч</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280' }}>Багц</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>Статус</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#6B7280' }}>Дуусах</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s: any) => (
              <tr key={s.id} style={{ borderTop: '1px solid var(--border, #E5E7EB)' }}>
                <td style={{ padding: '12px 16px', color: 'var(--text, #111)' }}>{s.user?.full_name || s.user?.email}</td>
                <td style={{ padding: '12px 16px', color: '#6B7280' }}>{s.plan?.name}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: s.status === 'active' ? '#DCFCE7' : '#FEE2E2', color: s.status === 'active' ? '#166534' : '#991B1B' }}>{s.status}</span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#6B7280', fontSize: 13 }}>{s.expires_at ? new Date(s.expires_at).toLocaleDateString('mn-MN') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Kpi({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: 'var(--surface, #fff)', borderRadius: 14, padding: 20, border: '1px solid var(--border, #E5E7EB)', textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{label}</div>
    </div>
  )
}
