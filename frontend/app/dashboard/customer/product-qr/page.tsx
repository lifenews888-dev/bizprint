'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { QRCodeSVG } from 'qrcode.react'
import UpgradeModal from '@/components/UpgradeModal'

const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif"
const ORANGE = '#FF6B00'

export default function ProductQrDashboard() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ product_name: '', description: '', price: '', category: '', company_name: '', brand: '' })
  const [imgFile, setImgFile] = useState<File | null>(null)
  const [imgPreview, setImgPreview] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoName, setVideoName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [usage, setUsage] = useState<any>(null)
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; current?: number; max?: number }>({ open: false })
  const [suggestedPlan, setSuggestedPlan] = useState<any>(null)
  const [addons, setAddons] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    const headers = { Authorization: `Bearer ${token}` }
    const safeFetch = (path: string) => fetch(`http://localhost:4000${path}`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null)
    Promise.all([
      safeFetch('/product-qr/my'),
      safeFetch('/subscription/usage'),
      safeFetch('/subscription/suggestions'),
      safeFetch('/subscription/addons'),
    ]).then(([qrs, u, sug, a]) => {
      setItems(Array.isArray(qrs) ? qrs : [])
      setUsage(u)
      setSuggestedPlan(sug?.suggested_plan || null)
      setAddons(Array.isArray(a) ? a : [])
    }).finally(() => setLoading(false))
  }, [])

  const qrUsage = usage?.product_qrs
  const pct = qrUsage ? Math.min(qrUsage.percentage, 100) : 0
  const isWarning = qrUsage?.status === 'warning'
  const isExceeded = qrUsage?.status === 'exceeded'

  const uploadFile = async (file: File): Promise<string | null> => {
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await apiFetch<any>('/upload/file', { method: 'POST', body: fd })
      return res?.file_url ? `http://localhost:4000${res.file_url}` : null
    } catch { return null }
  }

  const handleCreate = async () => {
    if (!form.product_name) return
    setUploading(true)
    try {
      const body: any = { ...form, price: Number(form.price) || 0 }
      if (imgFile) {
        const url = await uploadFile(imgFile)
        if (url) body.main_image_url = url
      }
      if (videoFile) {
        const url = await uploadFile(videoFile)
        if (url) body.video_url = url
      }
      const item = await apiFetch('/product-qr', { method: 'POST', body })
      setItems([item, ...items])
      setShowCreate(false)
      setForm({ product_name: '', description: '', price: '', category: '', company_name: '', brand: '' })
      setImgFile(null); setImgPreview(''); setVideoFile(null); setVideoName('')
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      if (token) {
        fetch('http://localhost:4000/subscription/usage', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : null).then(u => u && setUsage(u)).catch(() => {})
      }
    } catch (err: any) {
      let errData: any = null
      try { errData = JSON.parse(err.message) } catch {}
      if (errData?.code === 'SUBSCRIPTION_LIMIT_EXCEEDED' || err.message?.includes('хязгаар')) {
        setUpgradeModal({
          open: true,
          current: errData?.current ?? qrUsage?.current,
          max: errData?.max ?? qrUsage?.effective_max,
        })
      } else {
        alert(err.message || 'Алдаа гарлаа')
      }
    } finally { setUploading(false) }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: FONT, color: '#9CA3AF' }}>Ачааллаж байна...</div>

  return (
    <div style={{ padding: 24, fontFamily: FONT, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Бүтээгдэхүүн QR</h1>
          <p style={{ color: '#6B7280', fontSize: 14, margin: '4px 0 0' }}>Бүтээгдэхүүн бүрт QR код үүсгэж, дахин захиалга авах</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={{ padding: '10px 24px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          + Бүтээгдэхүүн нэмэх
        </button>
      </div>

      {/* Usage bar */}
      {qrUsage && (
        <div style={{
          background: isExceeded ? '#FEF2F2' : isWarning ? '#FFFBEB' : 'var(--surface, #fff)',
          borderRadius: 14, padding: '16px 20px', marginBottom: 20,
          border: isExceeded ? '2px solid #FCA5A5' : isWarning ? '2px solid #FDE68A' : '1px solid var(--border, #E5E7EB)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text, #374151)' }}>
                📦 Бүтээгдэхүүн QR хязгаар
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: isExceeded ? '#DC2626' : isWarning ? '#D97706' : ORANGE }}>
                {qrUsage.current} / {qrUsage.effective_max}
              </span>
            </div>
            <div style={{ height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`, borderRadius: 4, transition: 'width 0.5s ease',
                background: isExceeded ? '#DC2626' : isWarning ? '#F59E0B' : ORANGE,
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>{qrUsage.percentage}% ашиглагдсан</span>
              {qrUsage.addon_bonus > 0 && (
                <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600 }}>+{qrUsage.addon_bonus} нэмэлт</span>
              )}
            </div>
          </div>
          {isExceeded && (
            <button onClick={() => setUpgradeModal({ open: true, current: qrUsage.current, max: qrUsage.effective_max })} style={{
              padding: '10px 20px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap',
            }}>
              Багц шинэчлэх
            </button>
          )}
          {isWarning && (
            <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600, whiteSpace: 'nowrap' }}>
              ⚠️ Хязгаарт ойрхон
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 24, border: '1px solid var(--border, #E5E7EB)', marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Шинэ бүтээгдэхүүн QR</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InputField label="Нэр *" value={form.product_name} onChange={v => setForm({ ...form, product_name: v })} />
            <InputField label="Үнэ (MNT)" value={form.price} onChange={v => setForm({ ...form, price: v })} type="number" />
            <InputField label="Ангилал" value={form.category} onChange={v => setForm({ ...form, category: v })} />
            <InputField label="Брэнд" value={form.brand} onChange={v => setForm({ ...form, brand: v })} />
            <InputField label="Компани" value={form.company_name} onChange={v => setForm({ ...form, company_name: v })} />
          </div>
          <div style={{ marginTop: 12 }}>
            <InputField label="Тайлбар" value={form.description} onChange={v => setForm({ ...form, description: v })} />
          </div>

          {/* Image upload */}
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Бүтээгдэхүүний зураг</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--surface2, #F3F4F6)', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text, #374151)', border: '1px dashed var(--border, #D1D5DB)' }}>
                📷 Зураг сонгох
                <input type="file" accept="image/*" hidden onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) { setImgFile(f); setImgPreview(URL.createObjectURL(f)) }
                }} />
              </label>
              {imgPreview && (
                <div style={{ position: 'relative' }}>
                  <img src={imgPreview} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                  <button onClick={() => { setImgFile(null); setImgPreview('') }} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#EF4444', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              )}
            </div>
          </div>

          {/* Video upload */}
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Видео (MP4, WebM)</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--surface2, #F3F4F6)', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text, #374151)', border: '1px dashed var(--border, #D1D5DB)' }}>
                🎬 Видео сонгох
                <input type="file" accept="video/mp4,video/webm,video/mov" hidden onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) { setVideoFile(f); setVideoName(f.name) }
                }} />
              </label>
              {videoName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text, #374151)' }}>
                  <span>🎬 {videoName}</span>
                  <button onClick={() => { setVideoFile(null); setVideoName('') }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 14 }}>✕</button>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            <button onClick={handleCreate} disabled={uploading} style={{ padding: '10px 28px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
              {uploading ? 'Хадгалж байна...' : 'Үүсгэх'}
            </button>
            <button onClick={() => setShowCreate(false)} style={{ padding: '10px 28px', background: 'var(--surface2, #F3F4F6)', color: 'var(--text, #374151)', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>Болих</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid var(--border, #E5E7EB)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#x1F4E6;</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text, #374151)' }}>Бүтээгдэхүүн QR байхгүй</div>
          <p style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>Бүтээгдэхүүн дээрээ QR наалт үүсгээрэй</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {items.map((p: any) => {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
            const pUrl = `${baseUrl}/p/${p.slug}`
            return (
              <div key={p.id} style={{ background: 'var(--surface, #fff)', borderRadius: 16, padding: 20, border: '1px solid var(--border, #E5E7EB)' }}>
                {/* Product image or QR */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                  {/* QR code — scannable size with white bg and quiet zone */}
                  <div style={{ background: '#FFFFFF', borderRadius: 10, padding: 10, border: '1px solid #E5E7EB', flexShrink: 0 }}>
                    <QRCodeSVG value={pUrl} size={120} bgColor="#FFFFFF" fgColor="#000000" level="H" marginSize={2} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text, #111)' }}>{p.product_name}</h3>
                    {p.category && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{p.category}</div>}
                    {p.brand && <div style={{ fontSize: 12, color: '#9CA3AF' }}>{p.brand}</div>}
                    {p.price > 0 && <div style={{ fontSize: 16, fontWeight: 700, color: ORANGE, marginTop: 6 }}>{Number(p.price).toLocaleString()}₮</div>}
                    {p.company_name && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{p.company_name}</div>}
                  </div>
                </div>
                {/* Product image thumbnail */}
                {p.main_image_url && (
                  <div style={{ marginBottom: 12 }}>
                    <img src={p.main_image_url} alt={p.product_name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 10 }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>
                  <span>{p.scan_count} скан</span>
                  <span>{p.view_count} үзсэн</span>
                  <span>{p.reorder_count} дахин захиалга</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => navigator.clipboard.writeText(pUrl)} style={{ flex: 1, padding: '8px', background: 'var(--surface2, #F3F4F6)', color: 'var(--text, #374151)', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>Линк хуулах</button>
                  <button onClick={() => window.open(pUrl, '_blank')} style={{ flex: 1, padding: '8px', background: `${ORANGE}15`, color: ORANGE, border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Үзэх</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false })}
        featureKey="product_qrs"
        current={upgradeModal.current}
        max={upgradeModal.max}
        suggestedPlan={suggestedPlan}
        addons={addons}
      />
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border, #E5E7EB)', fontSize: 14, background: 'var(--bg, #fff)', color: 'var(--text, #000)' }} />
    </div>
  )
}
