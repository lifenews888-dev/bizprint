'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

//  Types 

interface ProductionJob {
  id: string
  order_id?: string
  vendor_id?: string
  machine_id?: string
  status: 'queued' | 'assigned' | 'printing' | 'completed' | 'failed'
  start_time?: string
  end_time?: string
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

interface User {
  id: string
  email: string
  role: string
  name?: string
}

//  Constants 

const API = 'http://localhost:4000'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; next?: string; nextLabel?: string }> = {
  queued:    { label: '0@00;0;4',    color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  next: 'assign',  nextLabel: '0H8= >=>>E'   },
  assigned:  { label: '0H8= >=>>gA>=', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', next: 'start',   nextLabel: '%M2;M; ME;ME' },
  printing:  { label: '%M2;M6 109=0', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', next: 'finish',  nextLabel: 'CCA30E'       },
  completed: { label: 'CCAA0=',      color: '#10B981', bg: 'rgba(16,185,129,0.12)', },
  failed:    { label: ';400B09',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  },
}

//  Helpers 

function getToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('access_token') || ''
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() }
}

function formatDate(str?: string) {
  if (!str) return ''
  return new Date(str).toLocaleString('mn-MN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function elapsed(start?: string) {
  if (!start) return ''
  const ms = Date.now() - new Date(start).getTime()
  const m = Math.floor(ms / 60000)
  const h = Math.floor(m / 60)
  return h > 0 ? `${h}F ${m % 60}<8=` : `${m}<8=`
}

//  Main Component 

export default function VendorDashboardPage() {
  const router = useRouter()
  const [user, setUser]       = useState<User | null>(null)
  const [jobs, setJobs]       = useState<ProductionJob[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<'all' | 'queued' | 'assigned' | 'printing' | 'completed'>('all')
  const [assignModal, setAssignModal] = useState<ProductionJob | null>(null)
  const [selectedMachine, setSelectedMachine] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [toast, setToast]     = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  //  Auth 
  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/login'); return }
    const u = localStorage.getItem('user')
    if (u) setUser(JSON.parse(u))
    fetchAll()
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const u = localStorage.getItem('user')
      const userData = u ? JSON.parse(u) : null
      if (!userData?.id) return

      const [jobsRes, machinesRes] = await Promise.all([
        fetch(`${API}/vendor-dashboard/${userData.id}/jobs`, { headers: authHeaders() }),
        fetch(`${API}/machines`, { headers: authHeaders() }),
      ])
      if (jobsRes.ok)     setJobs(await jobsRes.json())
      if (machinesRes.ok) setMachines(await machinesRes.json())
    } catch {}
    setLoading(false)
  }, [])

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  //  Assign machine 
  async function assignMachine() {
    if (!assignModal || !selectedMachine) return
    setProcessing(assignModal.id)
    try {
      const res = await fetch(`${API}/vendor-dashboard/${assignModal.id}/assign-machine`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ machine_id: selectedMachine }),
      })
      if (!res.ok) throw new Error()
      showToast('0H8= >=>>g4;>>')
      setAssignModal(null)
      setSelectedMachine('')
      fetchAll()
    } catch { showToast(';400 30@;00', 'err') }
    setProcessing(null)
  }

  //  Start printing 
  async function startJob(job: ProductionJob) {
    setProcessing(job.id)
    try {
      const res = await fetch(`${API}/vendor-dashboard/${job.id}/start`, {
        method: 'PATCH', headers: authHeaders(),
      })
      if (!res.ok) throw new Error()
      showToast('%M2;M; MEM;;MM')
      fetchAll()
    } catch { showToast(';400 30@;00', 'err') }
    setProcessing(null)
  }

  //  Finish job 
  async function finishJob(job: ProductionJob) {
    if (!confirm('%M2;M; 4CCA30E CC?')) return
    setProcessing(job.id)
    try {
      const res = await fetch(`${API}/vendor-dashboard/${job.id}/finish`, {
        method: 'PATCH', headers: authHeaders(),
      })
      if (!res.ok) throw new Error()
      showToast('0E80;30 4CCAA0= 3M6 BM<4M3;M34;MM ')
      fetchAll()
    } catch { showToast(';400 30@;00', 'err') }
    setProcessing(null)
  }

  //  Stats 
  const stats = {
    queued:    jobs.filter(j => j.status === 'queued').length,
    assigned:  jobs.filter(j => j.status === 'assigned').length,
    printing:  jobs.filter(j => j.status === 'printing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  }

  const filtered = jobs.filter(j => filter === 'all' || j.status === filter)

  // 
  // RENDER
  // 

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      fontFamily: "'DM Sans', 'Segoe UI', system-ui", color: 'var(--text)',
    }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.type === 'ok' ? '#10B981' : '#EF4444',
          color: '#fff', padding: '12px 20px', borderRadius: 10,
          fontSize: 14, fontWeight: 600, boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}>
          {toast.type === 'ok' ? ' ' : ' '}{toast.msg}
        </div>
      )}

      {/*  Header  */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: '32px 48px 28px', color: '#fff',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                < 9;42M@89= EO=0;B
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
                Vendor Dashboard
              </h1>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                {user?.name || user?.email}
              </div>
            </div>
            <button
              onClick={fetchAll}
              style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', borderRadius: 8, padding: '9px 18px',
                cursor: 'pointer', fontSize: 13,
              }}
            >
               (8=MG;ME
            </button>
          </div>

          {/* Stat pills */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            {[
              { label: '0@00;0;4',     value: stats.queued,    color: '#F59E0B' },
              { label: '0H8= >=>>gA>=', value: stats.assigned,  color: '#3B82F6' },
              { label: '%M2;M6 109=0', value: stats.printing,  color: '#8B5CF6' },
              { label: 'CCAA0=',       value: stats.completed, color: '#10B981' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.08)',
                border: `1px solid ${s.color}44`,
                borderRadius: 10, padding: '10px 18px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/*  Content  */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 48px' }}>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
          {([
            { key: 'all',       label: `34 (${jobs.length})` },
            { key: 'queued',    label: ` 0@00;0;4 (${stats.queued})` },
            { key: 'assigned',  label: `=' 0H8= >=>>34A>= (${stats.assigned})` },
            { key: 'printing',  label: `= %M2;M6 109=0 (${stats.printing})` },
            { key: 'completed', label: ` CCAA0=` },
          ] as { key: typeof filter; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)} style={{
              background: 'none', border: 'none', padding: '10px 14px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              color: filter === t.key ? '#FF6B35' : 'var(--text2)',
              borderBottom: filter === t.key ? '2px solid #FF6B35' : '2px solid transparent',
              marginBottom: -1, whiteSpace: 'nowrap',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Jobs */}
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text2)' }}>#=H86 109=0...</div>
        ) : filtered.length === 0 ? (
          <div style={{
            padding: 60, textAlign: 'center',
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>=</div>
            <div style={{ fontWeight: 600 }}>0E80;30 109E39</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>
              (8=M 70E80;30 8@MEM4 M=4 E0@0340=0
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(job => {
              const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG.queued
              const isProcessing = processing === job.id

              return (
                <div key={job.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '18px 24px',
                  borderLeft: `3px solid ${sc.color}`,
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 180px', gap: 16, alignItems: 'center' }}>

                    {/* Job info */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <code style={{
                          background: 'var(--surface2)', border: '1px solid var(--border)',
                          borderRadius: 5, padding: '2px 8px', fontSize: 12,
                        }}>
                          #{job.id.slice(0, 8)}
                        </code>
                        <span style={{
                          background: sc.bg, color: sc.color,
                          borderRadius: 20, padding: '2px 10px',
                          fontSize: 11, fontWeight: 700,
                        }}>
                          {sc.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                        {job.order ? (
                          <span>0E80;30: <b>{job.order.quantity} H</b>  {Number(job.order.total_price).toLocaleString()}</span>
                        ) : (
                          <span>0E80;30 #{job.order_id?.slice(0, 8)}</span>
                        )}
                      </div>
                      {job.machine && (
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                          = {job.machine.name} ({job.machine.machine_type})
                        </div>
                      )}
                    </div>

                    {/* Timing */}
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>AAM=</div>
                      <div style={{ fontSize: 13 }}>{formatDate(job.created_at)}</div>
                      {job.start_time && (
                        <>
                          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 6, marginBottom: 2 }}>-EM;AM=</div>
                          <div style={{ fontSize: 13 }}>{formatDate(job.start_time)}</div>
                        </>
                      )}
                    </div>

                    {/* Elapsed */}
                    <div>
                      {job.status === 'printing' && job.start_time && (
                        <div style={{
                          background: 'rgba(139,92,246,0.1)',
                          border: '1px solid rgba(139,92,246,0.3)',
                          borderRadius: 8, padding: '8px 12px', textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 11, color: '#8B5CF6', marginBottom: 2 }}>%C30F00</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#8B5CF6' }}>
                            {elapsed(job.start_time)}
                          </div>
                        </div>
                      )}
                      {job.status === 'completed' && job.end_time && (
                        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                           {formatDate(job.end_time)}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {job.status === 'queued' && (
                        <button
                          onClick={() => { setAssignModal(job); setSelectedMachine('') }}
                          disabled={isProcessing}
                          style={{
                            background: '#3B82F6', color: '#fff', border: 'none',
                            borderRadius: 8, padding: '9px 16px', cursor: 'pointer',
                            fontSize: 13, fontWeight: 600,
                          }}
                        >
                          =' 0H8= >=>>E
                        </button>
                      )}
                      {job.status === 'assigned' && (
                        <button
                          onClick={() => startJob(job)}
                          disabled={isProcessing}
                          style={{
                            background: '#8B5CF6', color: '#fff', border: 'none',
                            borderRadius: 8, padding: '9px 16px', cursor: 'pointer',
                            fontSize: 13, fontWeight: 600,
                          }}
                        >
                          {isProcessing ? '...' : ' %M2;M; ME;ME'}
                        </button>
                      )}
                      {job.status === 'printing' && (
                        <button
                          onClick={() => finishJob(job)}
                          disabled={isProcessing}
                          style={{
                            background: '#10B981', color: '#fff', border: 'none',
                            borderRadius: 8, padding: '9px 16px', cursor: 'pointer',
                            fontSize: 13, fontWeight: 600,
                          }}
                        >
                          {isProcessing ? '...' : ' CCA30E'}
                        </button>
                      )}
                      {job.status === 'completed' && (
                        <span style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>
                           CCAA0=
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/*  Assign Machine Modal  */}
      {assignModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 32, width: 480,
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>0H8= >=>>E</h2>
              <button onClick={() => setAssignModal(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text2)', fontSize: 22,
              }}></button>
            </div>

            <div style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13,
              color: 'var(--text2)',
            }}>
              0E80;30: #{assignModal.id.slice(0, 8)}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: 'var(--text2)',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
              }}>
                0H8= A>=3>E
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {machines.length === 0 ? (
                  <div style={{ color: 'var(--text2)', fontSize: 13 }}>0H8= 109E39 109=0</div>
                ) : (
                  machines.map(m => (
                    <button key={m.id}
                      onClick={() => setSelectedMachine(m.id)}
                      style={{
                        padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                        border: selectedMachine === m.id ? '2px solid #3B82F6' : '1px solid var(--border)',
                        background: selectedMachine === m.id ? 'rgba(59,130,246,0.08)' : 'var(--surface2)',
                        textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: selectedMachine === m.id ? '#3B82F6' : 'var(--text)' }}>
                          {m.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{m.machine_type}</div>
                      </div>
                      <div style={{
                        fontSize: 12, fontWeight: 600,
                        color: m.current_load > 70 ? '#EF4444' : m.current_load > 40 ? '#F59E0B' : '#10B981',
                      }}>
                        {m.current_load}% 0G00;0;
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setAssignModal(null)} style={{
                flex: 1, padding: '12px',
                background: 'var(--surface2)', color: 'var(--text)',
                border: '1px solid var(--border)', borderRadius: 8,
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>
                >;8E
              </button>
              <button
                onClick={assignMachine}
                disabled={!selectedMachine || !!processing}
                style={{
                  flex: 2, padding: '12px',
                  background: !selectedMachine ? 'var(--border)' : '#3B82F6',
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontWeight: 700, fontSize: 14,
                  cursor: !selectedMachine ? 'not-allowed' : 'pointer',
                }}
              >
                {processing ? '...' : '=' =>>E'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
