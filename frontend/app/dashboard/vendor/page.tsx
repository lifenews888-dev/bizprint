'use client'
import { apiFetch, getToken } from '@/lib/api'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import KpiCard from '@/components/dashboard/KpiCard'
import { useRoleGuard } from '@/lib/use-role-guard'
import { VENDOR_MENU } from '@/config/sidebar-config'

interface Job {
  id: string
  status: string
  created_at: string
  order?: { id: string; quantity: number; total_price: number }
  machine?: { id: string; name: string; machine_type: string }
}

interface Machine {
  id: string
  name: string
  machine_type: string
  current_load: number
}

interface VendorUser {
  id: string
  email?: string
  full_name?: string
  role?: string
}

const F = "'Segoe UI',system-ui,sans-serif"

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  queued:    { label: 'Дараалалд',     color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  assigned:  { label: 'Машин оноогдсон', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  printing:  { label: 'Хэвлэж байна', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  completed: { label: 'Дууссан',      color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  failed:    { label: 'Алдаатай',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
}

export default function VendorDashboard() {
  const router = useRouter()
  const { user: guardUser, loading: authLoading } = useRoleGuard(['vendor', 'admin'])
  const [jobs, setJobs] = useState<Job[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [user, setUser] = useState<VendorUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchJobs = useCallback(async (vendorId: string) => {
    try {
      const data = await apiFetch<Job[]>(`/vendor-dashboard/${vendorId}/jobs`)
      setJobs(Array.isArray(data) ? data : [])
    } catch {} finally { setLoading(false) }
  }, [])

  const fetchMachines = useCallback(async () => {
    try {
      const data = await apiFetch<Machine[]>(`/machines`)
      setMachines(Array.isArray(data) ? data : [])
    } catch {}
  }, [])

  const fetchMe = useCallback(async () => {
    try {
      const data = await apiFetch<VendorUser>(`/auth/me`)
      setUser(data)
      void fetchJobs(data.id)
      void fetchMachines()
    } catch { router.push('/login') }
  }, [fetchJobs, fetchMachines, router])

  useEffect(() => {
    if (authLoading) return
    const token = getToken()
    if (!token) { router.push('/login'); return }
    void fetchMe()
  }, [authLoading, fetchMe, router])

  async function assignMachine(jobId: string, machineId: string) {
    setActionLoading(jobId)
    try {
      await apiFetch<void>(`/vendor-dashboard/${jobId}/assign-machine`, {
        method: 'PATCH',
        body: { machine_id: machineId },
      })
      if (user) void fetchJobs(user.id)
    } catch {} finally { setActionLoading(null) }
  }

  async function startJob(jobId: string) {
    setActionLoading(jobId)
    try {
      await apiFetch<void>(`/vendor-dashboard/${jobId}/start`, {
        method: 'PATCH',
      })
      if (user) void fetchJobs(user.id)
    } catch {} finally { setActionLoading(null) }
  }

  async function finishJob(jobId: string) {
    setActionLoading(jobId)
    try {
      await apiFetch<void>(`/vendor-dashboard/${jobId}/finish`, {
        method: 'PATCH',
      })
      if (user) void fetchJobs(user.id)
    } catch {} finally { setActionLoading(null) }
  }

  const filtered = tab === 'all' ? jobs : jobs.filter(j => j.status === tab)
  const counts = {
    all: jobs.length,
    queued: jobs.filter(j => j.status === 'queued').length,
    assigned: jobs.filter(j => j.status === 'assigned').length,
    printing: jobs.filter(j => j.status === 'printing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  }

  if (authLoading) return <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Ачааллаж байна...</div>

  return (
    <DashboardLayout navGroups={VENDOR_MENU} user={user || guardUser || undefined}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Үйлдвэрийн удирдлага</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Ажлын захиалга, машин, статус хяналт</p>
      </div>

      <KpiCard items={[
        { label: 'Нийт', value: counts.all, color: 'orange', icon: '📋' },
        { label: 'Дараалалд', value: counts.queued, color: 'blue', icon: '⏳' },
        { label: 'Хэвлэж байна', value: counts.printing, color: 'purple', icon: '🖨️' },
        { label: 'Дууссан', value: counts.completed, color: 'green', icon: '✅' },
      ]} />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '16px 24px 0', borderBottom: '1px solid #1A1A1A', flexWrap: 'wrap' }}>
        {['all', 'queued', 'assigned', 'printing', 'completed'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', border: 'none', background: 'transparent',
            cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 500,
            color: tab === t ? 'var(--orange)' : '#666',
            borderBottom: `2px solid ${tab === t ? 'var(--orange)' : 'transparent'}`,
            marginBottom: -1,
          }}>
            {t === 'all' ? `Бүгд (${counts.all})` : `${STATUS[t]?.label} (${counts[t as keyof typeof counts]})`}
          </button>
        ))}
      </div>

      {/* Jobs */}
      <div style={{ padding: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Уншиж байна...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, border: '1px dashed #1A1A1A', borderRadius: 16, color: '#666' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Захиалга байхгүй</div>
            <div style={{ fontSize: 13 }}>Шинэ захиалга ирэхэд энд харагдана</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(job => {
              const st = STATUS[job.status] || { label: job.status, color: '#888', bg: 'rgba(136,136,136,0.1)' }
              return (
                <div key={job.id} style={{
                  background: '#0F0F0F', border: '1px solid #1A1A1A',
                  borderRadius: 14, padding: 20,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>
                          #{job.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 99,
                          background: st.bg, color: st.color, fontWeight: 600,
                        }}>
                          {st.label}
                        </span>
                      </div>
                      {job.order && (
                        <div style={{ fontSize: 14, color: '#F1F5F9', marginBottom: 4 }}>
                          Тоо: {job.order.quantity} ширхэг &nbsp;·&nbsp;
                          <span style={{ color: 'var(--orange)', fontWeight: 600 }}>
                            T{Number(job.order.total_price).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {job.machine && (
                        <div style={{ fontSize: 13, color: '#666' }}>
                          Машин: {job.machine.name} ({job.machine.machine_type})
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: '#444', marginTop: 4 }}>
                        {new Date(job.created_at).toLocaleString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {job.status === 'queued' && (
                        <select
                          onChange={e => e.target.value && assignMachine(job.id, e.target.value)}
                          defaultValue=""
                          style={{
                            padding: '8px 12px', background: '#1A1A1A', border: '1px solid #2A2A2A',
                            borderRadius: 8, color: '#F1F5F9', fontSize: 13, cursor: 'pointer', fontFamily: F,
                          }}>
                          <option value="" disabled>Машин сонгох</option>
                          {machines.map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.machine_type})</option>
                          ))}
                        </select>
                      )}
                      {job.status === 'assigned' && (
                        <button onClick={() => startJob(job.id)} disabled={actionLoading === job.id} style={{
                          padding: '8px 16px', background: '#3B82F6', color: '#fff',
                          border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: F,
                        }}>
                          Хэвлэл эхлэх
                        </button>
                      )}
                      {job.status === 'printing' && (
                        <button onClick={() => finishJob(job.id)} disabled={actionLoading === job.id} style={{
                          padding: '8px 16px', background: '#10B981', color: '#fff',
                          border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: F,
                        }}>
                          Дуусгах
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
