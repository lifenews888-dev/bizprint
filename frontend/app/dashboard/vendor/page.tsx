'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

const API = 'http://localhost:4000'
const F = "'Segoe UI',system-ui,sans-serif"

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  queued:    { label: 'Дараалалд',     color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  assigned:  { label: 'Машин оноогдсон', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  printing:  { label: 'Хэвлэж байна', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  completed: { label: 'Дууссан',      color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  failed:    { label: 'Алдаатай',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
}

function getToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('token') || ''
}

export default function VendorDashboard() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/login'); return }
    fetchMe(token)
  }, [])

  async function fetchMe(token: string) {
    try {
      const res = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setUser(data)
      fetchJobs(token, data.id)
      fetchMachines(token)
    } catch { router.push('/login') }
  }

  async function fetchJobs(token: string, vendorId: string) {
    try {
      const res = await fetch(`${API}/vendor-dashboard/${vendorId}/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setJobs(Array.isArray(data) ? data : [])
    } catch {} finally { setLoading(false) }
  }

  async function fetchMachines(token: string) {
    try {
      const res = await fetch(`${API}/machines`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setMachines(Array.isArray(data) ? data : [])
    } catch {}
  }

  async function assignMachine(jobId: string, machineId: string) {
    setActionLoading(jobId)
    try {
      await fetch(`${API}/vendor-dashboard/${jobId}/assign-machine`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ machine_id: machineId }),
      })
      fetchJobs(getToken(), user.id)
    } catch {} finally { setActionLoading(null) }
  }

  async function startJob(jobId: string) {
    setActionLoading(jobId)
    try {
      await fetch(`${API}/vendor-dashboard/${jobId}/start`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      fetchJobs(getToken(), user.id)
    } catch {} finally { setActionLoading(null) }
  }

  async function finishJob(jobId: string) {
    setActionLoading(jobId)
    try {
      await fetch(`${API}/vendor-dashboard/${jobId}/finish`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      fetchJobs(getToken(), user.id)
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

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', fontFamily: F, color: '#F1F5F9' }}>
      {/* Header */}
      <div style={{ background: '#111', borderBottom: '1px solid #1A1A1A', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Үйлдвэрийн хяналт
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Vendor Dashboard</h1>
          <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{user?.email}</div>
        </div>
        <button onClick={() => fetchJobs(getToken(), user?.id)} style={{
          padding: '8px 16px', background: 'transparent', border: '1px solid #2A2A2A',
          borderRadius: 8, color: '#888', cursor: 'pointer', fontSize: 13, fontFamily: F,
        }}>
          Шинэчлэх
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, padding: '20px 24px 0' }}>
        {Object.entries(counts).map(([key, count]) => (
          <div key={key} onClick={() => setTab(key)} style={{
            padding: '14px 16px', background: tab === key ? '#1A1A1A' : '#0F0F0F',
            border: `1px solid ${tab === key ? '#333' : '#1A1A1A'}`,
            borderRadius: 12, cursor: 'pointer',
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: key === 'all' ? 'var(--orange)' : STATUS[key]?.color || '#888' }}>{count}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {key === 'all' ? 'Бүгд' : STATUS[key]?.label || key}
            </div>
          </div>
        ))}
      </div>

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
    </div>
  )
}
