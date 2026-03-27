'use client'
import { apiFetch, apiUpload, API_URL, getToken } from '@/lib/api'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import OrderCard from '@/components/order/OrderCard'
import OrderStepper from '@/components/order/OrderStepper'
import EmptyState from '@/components/ui/EmptyState'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"
const fmt = (n: number) => new Intl.NumberFormat('mn-MN').format(Math.round(n)) + '₮'

const TABS = [
  { key: 'all',       label: 'Бүгд' },
  { key: 'active',    label: 'Идэвхтэй' },
  { key: 'completed', label: 'Дууссан' },
  { key: 'cancelled', label: 'Цуцлагдсан' },
]

const ACTIVE_STATUSES = ['draft', 'quotation_sent', 'confirmed', 'pending_file', 'file_review', 'in_production', 'finishing', 'dispatched', 'delivered']

// File upload widget for orders requiring print files
function FileUploadWidget({ order, onUploadComplete }: { order: any; onUploadComplete: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<any[]>([])

  const canUpload = ['pending_file', 'file_rejected'].includes(order.status)

  // Load existing files for this order
  useEffect(() => {
    apiFetch<any[]>(`/orders/${order.id}/files`)
      .then(d => setFiles(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [order.id])

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError('')
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiUpload<any>(`/orders/${order.id}/upload-file`, fd)
      setResult(res)
      // Refresh files list
      const updatedFiles = await apiFetch<any[]>(`/orders/${order.id}/files`).catch(() => [])
      setFiles(Array.isArray(updatedFiles) ? updatedFiles : [])
      onUploadComplete()
    } catch (e: any) {
      setError(e.message || 'Файл оруулахад алдаа гарлаа')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  const statusColors: Record<string, string> = {
    uploaded: '#F59E0B', checking: '#3B82F6', approved: '#10B981', rejected: '#EF4444', needs_fix: '#EF4444',
  }

  const statusLabels: Record<string, string> = {
    uploaded: 'Оруулсан', checking: 'Шалгаж байна', approved: 'Зөвшөөрсөн', rejected: 'Буцаагдсан', needs_fix: 'Засах шаардлагатай',
  }

  return (
    <div style={{ marginTop: 16 }}>
      {/* Existing files list */}
      {files.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>Оруулсан файлууд:</div>
          {files.map((f: any) => (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
              background: '#F9FAFB', borderRadius: 8, marginBottom: 6,
            }}>
              <span style={{ fontSize: 16 }}>
                {f.mime_type?.includes('pdf') ? '\uD83D\uDCC4' : '\uD83D\uDDBC\uFE0F'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{f.filename}</div>
                <div style={{ fontSize: 11, color: '#888' }}>
                  v{f.version} · {(f.size / 1024).toFixed(0)}KB
                  {f.analysis?.score != null && ` · Оноо: ${f.analysis.score}/100`}
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                background: (statusColors[f.status] || '#888') + '18',
                color: statusColors[f.status] || '#888',
              }}>
                {statusLabels[f.status] || f.status}
              </span>
              {f.is_final && (
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                  background: '#10B981', color: '#fff',
                }}>FINAL</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload area — only when order needs a file */}
      {canUpload && (
        <>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#FF6B00' : '#D1D5DB'}`,
              borderRadius: 12, padding: '28px 20px', textAlign: 'center',
              cursor: uploading ? 'wait' : 'pointer',
              background: dragOver ? '#FFF7ED' : '#FAFAFA',
              transition: 'all 0.2s',
            }}
          >
            <input
              ref={fileRef} type="file" hidden onChange={onFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,.ai,.eps,.tiff,.psd"
            />
            {uploading ? (
              <div>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#FF6B00' }}>Файл оруулж, шинжилж байна...</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>
                  Хэвлэх файлаа энд чирж оруулна уу
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  PDF, JPG, PNG, AI, EPS, TIFF · Хамгийн ихдээ 50MB
                </div>
                <div style={{
                  display: 'inline-block', marginTop: 12, padding: '8px 20px',
                  background: '#FF6B00', color: '#fff', borderRadius: 8,
                  fontSize: 13, fontWeight: 700,
                }}>
                  Файл сонгох
                </div>
              </div>
            )}
          </div>

          {/* Analysis result */}
          {result?.analysis && (
            <div style={{
              marginTop: 12, padding: 16, borderRadius: 10,
              background: result.analysis.score >= 80 ? '#ECFDF5' : result.analysis.score >= 60 ? '#FFFBEB' : '#FEF2F2',
              border: `1px solid ${result.analysis.score >= 80 ? '#A7F3D0' : result.analysis.score >= 60 ? '#FDE68A' : '#FECACA'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>
                  {result.analysis.score >= 80 ? '\u2705' : result.analysis.score >= 60 ? '\u26A0\uFE0F' : '\u274C'}
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    PDF шинжилгээ: {result.analysis.score}/100
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>{result.analysis.summary}</div>
                </div>
              </div>
              {result.analysis.issues?.length > 0 && (
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  {result.analysis.issues.map((i: any, idx: number) => (
                    <div key={idx} style={{ marginTop: 4 }}>
                      <span style={{
                        color: i.severity === 'error' ? '#DC2626' : i.severity === 'warning' ? '#D97706' : '#6B7280',
                        fontWeight: 600,
                      }}>
                        {i.severity === 'error' ? '❌' : i.severity === 'warning' ? '⚠️' : 'ℹ️'} {i.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {result && !result.analysis && (
            <div style={{
              marginTop: 12, padding: 12, borderRadius: 8,
              background: '#ECFDF5', border: '1px solid #A7F3D0', fontSize: 13, color: '#065F46',
            }}>
              ✅ {result.message}
            </div>
          )}

          {error && (
            <div style={{
              marginTop: 12, padding: 12, borderRadius: 8,
              background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 13, color: '#991B1B',
            }}>
              ❌ {error}
            </div>
          )}

          {/* File requirements hint */}
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 8,
            background: '#F9FAFB', fontSize: 12, color: '#888', lineHeight: 1.6,
          }}>
            <strong style={{ color: '#555' }}>Файлын шаардлага:</strong> 300 DPI, CMYK, 3мм bleed, фонт embed хийсэн PDF
          </div>
        </>
      )}
    </div>
  )
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<any[]>('/orders/my')
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = orders.filter(o => {
    if (tab === 'all') return true
    if (tab === 'active') return ACTIVE_STATUSES.includes(o.status)
    if (tab === 'completed') return o.status === 'completed'
    if (tab === 'cancelled') return o.status === 'cancelled'
    return true
  })

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', fontFamily: F }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Миний захиалгууд</h1>
        <button onClick={() => router.push('/shop')} style={{
          background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 10,
          padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: F,
        }}>
          + Шинэ захиалга
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: tab === t.key ? '#FF6B00' : 'var(--surface, #F3F4F6)',
            color: tab === t.key ? '#fff' : 'var(--text2, #666)',
            fontWeight: tab === t.key ? 700 : 500, fontSize: 13, fontFamily: F,
          }}>
            {t.label}
            {t.key !== 'all' && (() => {
              const count = orders.filter(o => {
                if (t.key === 'active') return ACTIVE_STATUSES.includes(o.status)
                if (t.key === 'completed') return o.status === 'completed'
                if (t.key === 'cancelled') return o.status === 'cancelled'
                return false
              }).length
              return count > 0 ? ` (${count})` : ''
            })()}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>Уншиж байна...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Захиалга байхгүй"
          message={tab === 'all' ? 'Та одоогоор захиалга хийгээгүй байна' : `"${TABS.find(t => t.key === tab)?.label}" захиалга байхгүй`}
          ctaText="Захиалга эхлэх"
          ctaHref="/shop"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(order => (
            <div key={order.id}>
              <OrderCard
                order={order}
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              />
              {/* Expanded details */}
              {expanded === order.id && (
                <div style={{
                  background: 'var(--surface, #FAFAFA)', border: '1px solid var(--border, #E5E7EB)',
                  borderTop: 'none', borderRadius: '0 0 14px 14px', padding: '16px 20px',
                }}>
                  <OrderStepper currentStatus={order.status} />
                  <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: '8px 24px', fontSize: 13, color: '#666' }}>
                    {order.paper_gsm && <span>Цаас: {order.paper_gsm}gsm</span>}
                    {order.color_mode && <span>Өнгө: {order.color_mode === 'color' ? 'Өнгөт' : 'ХЦ'}</span>}
                    {order.sides && <span>Тал: {order.sides === 'double' ? '2 тал' : '1 тал'}</span>}
                    {order.finishing && order.finishing !== 'none' && <span>Финиш: {order.finishing}</span>}
                  </div>
                  {order.notes && (
                    <p style={{ fontSize: 13, color: '#888', marginTop: 8 }}>{order.notes}</p>
                  )}

                  {/* File upload section — shown when order has file-related status */}
                  {['pending_file', 'file_rejected', 'file_review'].includes(order.status) && (
                    <div style={{
                      marginTop: 16, padding: '16px 20px',
                      background: order.status === 'file_rejected' ? '#FEF2F2' : order.status === 'pending_file' ? '#FFF7ED' : '#EFF6FF',
                      borderRadius: 10,
                      border: `1px solid ${order.status === 'file_rejected' ? '#FECACA' : order.status === 'pending_file' ? '#FED7AA' : '#BFDBFE'}`,
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                        {order.status === 'pending_file' && '📁 Хэвлэх файл оруулна уу'}
                        {order.status === 'file_rejected' && '❌ Файл буцаагдлаа — дахин оруулна уу'}
                        {order.status === 'file_review' && '🔍 Файл шалгагдаж байна'}
                      </div>
                      {order.status === 'file_review' && (
                        <div style={{ fontSize: 13, color: '#666' }}>
                          Таны файл шалгалтад орсон. Үр дүн удахгүй гарна.
                        </div>
                      )}
                      <FileUploadWidget
                        order={order}
                        onUploadComplete={() => {
                          apiFetch<any[]>('/orders/my')
                            .then(d => setOrders(Array.isArray(d) ? d : []))
                            .catch(() => {})
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
