'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

/* ═══════════════════════════════════════
 *  Meeting Scheduler & Calendar
 *  Customer can: view meetings, schedule Zoom, see calendar
 * ═══════════════════════════════════════ */

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  scheduled: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Товлосон' },
  active: { bg: '#DCFCE7', color: '#16A34A', label: 'Идэвхтэй' },
  completed: { bg: '#F3F4F6', color: '#6B7280', label: 'Дууссан' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Цуцалсан' },
}

export default function MeetingsPage() {
  const [designs, setDesigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scheduling, setScheduling] = useState<string | null>(null)
  const [scheduleTime, setScheduleTime] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/design-requests/my')
      setDesigns(Array.isArray(data) ? data : [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Filter designs that have Zoom sessions or can schedule one
  const withZoom = designs.filter(d => d.zoom_join_url)
  const canSchedule = designs.filter(d =>
    ['in_progress', 'under_review', 'updated_version', 'revision_requested'].includes(d.status) && !d.zoom_join_url
  )

  const requestZoom = async (designId: string) => {
    setSubmitting(true)
    try {
      await apiFetch(`/design-requests/${designId}/request-zoom`, {
        method: 'PATCH',
        body: JSON.stringify({ preferred_at: scheduleTime || undefined }),
      })
      setScheduling(null)
      setScheduleTime('')
      load()
    } catch (e) {
      alert('Алдаа гарлаа')
    } finally { setSubmitting(false) }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Уншиж байна...</div>

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Zoom уулзалтууд</h1>
      <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 24 }}>
        Дизайнертай Zoom уулзалт товлох, харах
      </p>

      {/* Upcoming / Active Meetings */}
      {withZoom.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Товлосон уулзалтууд</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {withZoom.map(d => {
              const sessionStatus = d.status === 'zoom_scheduled' ? 'scheduled' : 'completed'
              const st = STATUS_STYLE[sessionStatus] || STATUS_STYLE.scheduled
              return (
                <div key={d.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{d.product_name || 'Загвар'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                        Дизайнер: {d.designer_name || '—'} · {d.zoom_preferred_at ? new Date(d.zoom_preferred_at).toLocaleString('mn-MN') : 'Цаг тохироогүй'}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: st.bg, color: st.color, fontWeight: 600 }}>
                      {st.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <a
                      href={d.zoom_join_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ padding: '8px 20px', borderRadius: 8, background: '#2D8CFF', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      📹 Zoom нэгдэх
                    </a>
                    {d.zoom_password && (
                      <span style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--surface2)', fontSize: 12, color: 'var(--text2)' }}>
                        Нууц үг: <strong>{d.zoom_password}</strong>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Schedule New Meeting */}
      {canSchedule.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Уулзалт товлох</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {canSchedule.map(d => (
              <div key={d.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{d.product_name || 'Загвар'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>Дизайнер: {d.designer_name || '—'}</div>
                  </div>
                  <button
                    onClick={() => setScheduling(scheduling === d.id ? null : d.id)}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                  >
                    📹 Zoom товлох
                  </button>
                </div>

                {scheduling === d.id && (
                  <div style={{ marginTop: 12, padding: 14, background: 'var(--surface2)', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>Хүссэн цаг (заавал биш)</label>
                      <input
                        type="datetime-local"
                        value={scheduleTime}
                        onChange={e => setScheduleTime(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
                      />
                    </div>
                    <button
                      onClick={() => requestZoom(d.id)}
                      disabled={submitting}
                      style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#FF6B00', color: '#fff', fontWeight: 600, fontSize: 13, cursor: submitting ? 'wait' : 'pointer' }}
                    >
                      {submitting ? 'Илгээж байна...' : 'Хүсэлт илгээх'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {designs.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📹</div>
          <div style={{ fontSize: 14 }}>Дизайн хүсэлт байхгүй байна</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Захиалга өгсний дараа дизайнертай Zoom уулзалт товлох боломжтой</div>
        </div>
      )}

      {/* Workflow Info */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginTop: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Хэрхэн ажилладаг вэ?</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          {[
            { step: '1', icon: '📋', title: 'Захиалга өгөх', desc: 'Дизайн хүсэлт үүсгэнэ' },
            { step: '2', icon: '👩‍🎨', title: 'Дизайнер оноогдоно', desc: 'AI автоматаар тохирох дизайнер сонгоно' },
            { step: '3', icon: '📹', title: 'Zoom товлох', desc: 'Дизайнертай уулзах цаг сонгоно' },
            { step: '4', icon: '✅', title: 'Батлах', desc: 'Загвар баталвал үйлдвэрт автоматаар илгээнэ' },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', gap: 10, alignItems: 'start' }}>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Алхам {s.step}: {s.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
