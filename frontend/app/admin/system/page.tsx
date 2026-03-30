'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const ORANGE = '#FF6B00'

export default function SystemControlCenter() {
  const [health, setHealth] = useState<any>(null)
  const [kpis, setKpis] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [dbInfo, setDbInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'modules' | 'database'>('overview')

  useEffect(() => {
    Promise.all([
      apiFetch('/system/health').catch(() => null),
      apiFetch('/system/kpis').catch(() => null),
      apiFetch('/system/modules').catch(() => []),
      apiFetch('/system/database').catch(() => null),
    ]).then(([h, k, m, d]: any[]) => { setHealth(h); setKpis(k); setModules(m as any); setDbInfo(d) }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: FONT, color: '#9CA3AF' }}>Ачааллаж байна...</div>

  return (
    <div style={{ padding: 24, fontFamily: FONT }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px' }}>System Control Center</h1>
      <p style={{ color: '#6B7280', fontSize: 14, margin: '0 0 24px' }}>Системийн мониторинг, модулууд, мэдээллийн сан</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid var(--border, #E5E7EB)' }}>
        {(['overview', 'modules', 'database'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: tab === t ? `2px solid ${ORANGE}` : '2px solid transparent', color: tab === t ? ORANGE : '#6B7280', fontWeight: tab === t ? 600 : 400, cursor: 'pointer', fontSize: 14 }}>
            {t === 'overview' ? 'Ерөнхий' : t === 'modules' ? 'Модулууд' : 'Мэдээллийн сан'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* Health */}
          {health && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              <StatusCard label="Систем" value={health.status === 'healthy' ? 'Хэвийн' : 'Анхааруулга'} color={health.status === 'healthy' ? '#10B981' : '#EF4444'} />
              <StatusCard label="Uptime" value={health.uptime_human} color="#8B5CF6" />
              <StatusCard label="Санах ой (Heap)" value={`${health.memory?.heap_used_mb}MB`} color={ORANGE} />
              <StatusCard label="DB" value={health.database === 'connected' ? 'Холбогдсон' : 'Салсан'} color={health.database === 'connected' ? '#10B981' : '#EF4444'} />
            </div>
          )}

          {/* User KPIs */}
          {kpis && (
            <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 24, border: '1px solid var(--border, #E5E7EB)', marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Хэрэглэгчид</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                <MiniKpi label="Нийт" value={kpis.users?.total} />
                <MiniKpi label="Шинэ (30 хоног)" value={kpis.users?.new_30d} />
                {kpis.users?.byRole?.map((r: any) => (
                  <MiniKpi key={r.role} label={r.role} value={Number(r.count)} />
                ))}
              </div>
            </div>
          )}

          {/* Table counts */}
          {kpis?.tables && (
            <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 24, border: '1px solid var(--border, #E5E7EB)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Хүснэгтүүд</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {Object.entries(kpis.tables).map(([table, count]) => (
                  <MiniKpi key={table} label={table} value={count as number} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'modules' && (
        <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, border: '1px solid var(--border, #E5E7EB)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--surface2, #F9FAFB)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280' }}>Модуль</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280' }}>Ангилал</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#6B7280' }}>Төлөв</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m: any) => (
                <tr key={m.id} style={{ borderTop: '1px solid var(--border, #E5E7EB)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text, #111)' }}>{m.name}</td>
                  <td style={{ padding: '12px 16px', color: '#6B7280' }}>{m.category}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ padding: '3px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: m.status === 'active' ? '#DCFCE7' : '#FEE2E2', color: m.status === 'active' ? '#166534' : '#991B1B' }}>
                      {m.status === 'active' ? 'Идэвхтэй' : 'Идэвхгүй'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'database' && dbInfo && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <StatusCard label="Нийт хүснэгт" value={String(dbInfo.total_tables)} color={ORANGE} />
            <StatusCard label="DB хэмжээ" value={dbInfo.database_size} color="#8B5CF6" />
          </div>
          <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, border: '1px solid var(--border, #E5E7EB)', overflow: 'hidden', maxHeight: 500, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface2, #F9FAFB)', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280' }}>Хүснэгт</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#6B7280' }}>Баганууд</th>
                </tr>
              </thead>
              <tbody>
                {dbInfo.tables?.map((t: any) => (
                  <tr key={t.name} style={{ borderTop: '1px solid var(--border, #F3F4F6)' }}>
                    <td style={{ padding: '8px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text, #111)' }}>{t.name}</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', color: '#6B7280' }}>{t.columns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: 'var(--surface, #fff)', borderRadius: 14, padding: 20, border: '1px solid var(--border, #E5E7EB)', textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function MiniKpi({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: 'var(--surface2, #F9FAFB)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #111)' }}>{(value || 0).toLocaleString()}</div>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{label}</div>
    </div>
  )
}
