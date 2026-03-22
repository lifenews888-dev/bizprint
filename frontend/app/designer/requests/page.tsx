'use client'
import { apiFetch, API_URL } from '@/lib/api'
import { useEffect, useState, useRef } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import KpiCard from '@/components/dashboard/KpiCard'
import EmptyState from '@/components/dashboard/EmptyState'
import DashboardTabs from '@/components/dashboard/DashboardTabs'
import { useRoleGuard } from '@/lib/use-role-guard'
import { DESIGNER_MENU } from '@/config/sidebar-config'

interface DesignJob {
  id: string; status: string; product_type?: string; notes?: string
  quantity?: number; total_price?: number; file_url?: string
  created_at: string; customer?: { full_name: string; email: string }
}

const STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Хүлээгдэж байна', color: '#F59E0B' },
  assigned: { label: 'Миний ажил', color: '#3B82F6' },
  in_progress: { label: 'Хийж байна', color: '#8B5CF6' },
  review: { label: 'Хянагдаж байна', color: '#0891B2' },
  approved: { label: 'Батлагдсан', color: '#10B981' },
  rejected: { label: 'Буцаагдсан', color: '#EF4444' },
  completed: { label: 'Дууссан', color: '#10B981' },
}

export default function DesignerRequestsPage() {
  const { user, loading: authLoading } = useRoleGuard(['designer', 'admin'])
  const [jobs, setJobs] = useState<DesignJob[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [selected, setSelected] = useState<DesignJob | null>(null)
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && user) loadJobs()
  }, [authLoading, user])

  async function loadJobs() {
    setLoading(true)
    try {
      const r = await apiFetch(`//design-requests`)
      const data = await r.json()
      setJobs(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  async function requestJob(id: string) {
    try {
      await apiFetch(`//design-requests/${id}/assign`, { method: 'PATCH'})
      setToast('Ажил хүлээн авах хүсэлт илгээгдлээ')
      setTimeout(() => setToast(''), 3000)
      loadJobs()
    } catch {}
  }

  async function uploadFile(jobId: string, file: File) {
    const fd = new FormData()
    fd.append('file', file)
    try {
      await apiFetch(`//design-requests/${jobId}/upload`, { method: 'POST', body: fd })
      setToast('Файл амжилттай илгээгдлээ')
      setTimeout(() => setToast(''), 3000)
      loadJobs()
    } catch {}
  }

  async function submitForReview(id: string) {
    try {
      await apiFetch(`//design-requests/${id}/submit`, { method: 'PATCH'})
      setToast('Хянуулахаар илгээгдлээ')
      setTimeout(() => setToast(''), 3000)
      loadJobs()
    } catch {}
  }

  const myJobs = jobs.filter(j => j.status !== 'pending')
  const pendingJobs = jobs.filter(j => j.status === 'pending')
  const filtered = tab === 'all' ? myJobs : tab === 'pending' ? pendingJobs : myJobs.filter(j => j.status === tab)

  const stats = {
    total: myJobs.length,
    inProgress: myJobs.filter(j => ['assigned', 'in_progress'].includes(j.status)).length,
    approved: myJobs.filter(j => j.status === 'approved' || j.status === 'completed').length,
    available: pendingJobs.length,
  }

  if (authLoading) return <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Ачааллаж байна...</div>

  return (
    <DashboardLayout navGroups={DESIGNER_MENU} user={user || undefined}>
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#1D9E75', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>{toast}</div>}
      <input ref={fileRef} type="file" hidden onChange={e => { if (e.target.files?.[0] && selected) uploadFile(selected.id, e.target.files[0]); e.target.value = '' }} />

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Миний ажил</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Эх бэлтгэл, дизайн хүсэлт, файл дамжуулалт</p>
      </div>

      <KpiCard items={[
        { label: 'Миний ажлууд', value: stats.total, color: 'purple', icon: '🎨' },
        { label: 'Хийж байна', value: stats.inProgress, color: 'blue', icon: '⏳' },
        { label: 'Батлагдсан', value: stats.approved, color: 'green', icon: '✅' },
        { label: 'Авах боломжтой', value: stats.available, color: 'orange', icon: '📋' },
      ]} />

      <DashboardTabs
        tabs={[
          { key: 'all', label: `Миний ажил (${myJobs.length})` },
          { key: 'pending', label: `Авах боломжтой (${pendingJobs.length})` },
          { key: 'in_progress', label: 'Хийж байна' },
          { key: 'approved', label: 'Батлагдсан' },
        ]}
        activeTab={tab} onTabChange={setTab}
      />

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 20 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>Ачааллаж байна...</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="🎨" title={tab === 'pending' ? 'Авах боломжтой ажил байхгүй' : 'Ажил байхгүй'} message="Шинэ эх бэлтгэлийн хүсэлт ирэхэд энд харагдана" />
          ) : filtered.map((job, i) => {
            const st = STATUS[job.status] || { label: job.status, color: '#888' }
            return (
              <div key={job.id} onClick={() => setSelected(selected?.id === job.id ? null : job)}
                style={{ padding: '16px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', background: selected?.id === job.id ? 'rgba(139,92,246,0.06)' : 'transparent', transition: 'background 0.15s' }}
                onMouseEnter={e => { if (selected?.id !== job.id) e.currentTarget.style.background = 'var(--surface2)' }}
                onMouseLeave={e => { if (selected?.id !== job.id) e.currentTarget.style.background = 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{job.product_type || 'Эх бэлтгэл'}</span>
                  <span style={{ background: st.color + '20', color: st.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{st.label}</span>
                </div>
                {job.customer && <div style={{ fontSize: 12, color: 'var(--text2)' }}>{job.customer.full_name}</div>}
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{new Date(job.created_at).toLocaleDateString('mn-MN')}</div>
              </div>
            )
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, height: 'fit-content', position: 'sticky', top: 74 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Дэлгэрэнгүй</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 20 }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Төрөл:</span> <span style={{ fontSize: 13 }}>{selected.product_type || '—'}</span></div>
              {selected.customer && <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Хэрэглэгч:</span> <span style={{ fontSize: 13 }}>{selected.customer.full_name} ({selected.customer.email})</span></div>}
              {selected.notes && <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Тэмдэглэл:</span> <span style={{ fontSize: 13 }}>{selected.notes}</span></div>}
              {selected.quantity && <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Тоо:</span> <span style={{ fontSize: 13 }}>{selected.quantity} ш</span></div>}
              {selected.file_url && (
                <a href={selected.file_url.startsWith('http') ? selected.file_url : `${API_URL}${selected.file_url}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#3B82F6', textDecoration: 'none' }}>
                  📥 Файл татах
                </a>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selected.status === 'pending' && (
                <button onClick={() => requestJob(selected.id)} style={{ padding: 12, background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                  📋 Ажил хүлээн авах хүсэлт
                </button>
              )}
              {['assigned', 'in_progress'].includes(selected.status) && (
                <>
                  <button onClick={() => fileRef.current?.click()} style={{ padding: 12, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    📤 Файл илгээх
                  </button>
                  <button onClick={() => submitForReview(selected.id)} style={{ padding: 12, background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                    ✅ Хянуулахаар илгээх
                  </button>
                </>
              )}
              {selected.status === 'approved' && (
                <div style={{ padding: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid #10B981', borderRadius: 8, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#10B981' }}>
                  ✓ Батлагдсан — үйлдвэрт илгээгдэх боломжтой
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
