'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'

const API = 'http://localhost:4000'
const BASE_URL = 'http://localhost:3000'

interface User {
  id: string
  email: string
  full_name: string
  role: string
}

interface Design {
  id: string
  title: string
  status: string
  price?: number
  sales_count?: number
  created_at: string
}

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

function tok() { return localStorage.getItem('access_token') || localStorage.getItem('token') || '' }
function hdrs() { return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() } }

const ST_CLR: Record<string, string> = {
  pending:  '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
  draft:    '#6B7280',
}
const ST_MN: Record<string, string> = {
  pending:  'Хүлээгдэж байна',
  approved: 'Батлагдсан',
  rejected: 'Татгалзагдсан',
  draft:    'Ноорог',
}

const inp: React.CSSProperties = {
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '9px 12px', color: 'var(--text)',
  fontSize: 13, outline: 'none', width: '100%',
}

export default function CreatorDashboard() {
  const router = useRouter()
  const [user, setUser]       = useState<User | null>(null)
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'designs' | 'upload' | 'earnings'>('designs')
  const [uploadForm, setUploadForm] = useState({ title: '', price: '', description: '', file_url: '' })
  const [uploading, setUploading]   = useState(false)
  const [uploadMsg, setUploadMsg]   = useState('')

  useEffect(() => {
    const ud = localStorage.getItem('user')
    const tk = tok()
    if (!ud || !tk) { router.push('/login'); return }
    const u: User = JSON.parse(ud)
    if (u.role !== 'creator' && u.role !== 'admin') { router.push('/login'); return }
    setUser(u)
    loadDesigns(u.id)
  }, [])

  async function loadDesigns(userId: string) {
    try {
      const r = await fetch(`${API}/templates?creator_id=${userId}`, { headers: hdrs() })
      const d = r.ok ? await r.json() : []
      setDesigns(Array.isArray(d) ? d : [])
    } catch {}
    setLoading(false)
  }

  async function submitDesign() {
    if (!uploadForm.title || !uploadForm.file_url) {
      setUploadMsg('Гарчиг болон файлын URL оруулна уу')
      return
    }
    setUploading(true); setUploadMsg('')
    try {
      const r = await fetch(`${API}/templates`, {
        method: 'POST',
        headers: hdrs(),
        body: JSON.stringify({
          title:       uploadForm.title,
          price:       Number(uploadForm.price) || 0,
          description: uploadForm.description,
          file_url:    uploadForm.file_url,
          creator_id:  user?.id,
          status:      'pending',
        }),
      })
      if (r.ok) {
        setUploadMsg('Дизайн амжилттай илгээгдлээ ✅')
        setUploadForm({ title: '', price: '', description: '', file_url: '' })
        if (user) loadDesigns(user.id)
        setTimeout(() => setTab('designs'), 1500)
      } else {
        setUploadMsg('Алдаа гарлаа, дахин оролдоно уу')
      }
    } catch { setUploadMsg('Алдаа гарлаа') }
    setUploading(false)
  }

  const totalSales   = designs.reduce((s, d) => s + (d.sales_count || 0), 0)
  const totalEarnings = designs.reduce((s, d) => s + ((d.sales_count || 0) * (d.price || 0)), 0)
  const approvedCount = designs.filter(d => d.status === 'approved').length

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text2)', fontFamily: F }}>
      Уншиж байна...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: F, color: 'var(--text)' }}>

      {/* Topbar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 32px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}><span style={{ color: '#FF6B00' }}>Biz</span>Print</span>
          <span style={{ fontSize: 11, background: 'rgba(167,139,250,0.12)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 20, padding: '2px 10px' }}>
            🎨 Бүтээгч
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{user?.full_name}</span>
          <NotificationBell userId={user?.id} />
          <button onClick={() => { localStorage.clear(); router.push('/') }}
            style={{ ...inp, width: 'auto', cursor: 'pointer', fontSize: 12, padding: '6px 14px' }}>
            Гарах
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Бүтээгчийн самбар</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Дизайн байршуулж, борлуулалтаа хянаарай</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Нийт дизайн',    val: designs.length,              color: '#A78BFA' },
            { label: 'Батлагдсан',      val: approvedCount,               color: '#10B981' },
            { label: 'Нийт борлуулалт', val: totalSales + ' ш',           color: '#3B82F6' },
            { label: 'Нийт орлого',     val: '₮' + totalEarnings.toLocaleString(), color: '#FF6B00' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', borderTop: '3px solid ' + s.color }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
          {[
            { key: 'designs',  label: '📁 Миний дизайнууд', count: designs.length },
            { key: 'upload',   label: '⬆️ Дизайн байршуулах', count: null },
            { key: 'earnings', label: '💰 Орлого', count: null },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{
              padding: '10px 20px', border: 'none',
              borderBottom: tab === t.key ? '2px solid #A78BFA' : '2px solid transparent',
              marginBottom: '-2px', background: 'none', fontSize: 14,
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? 'var(--text)' : 'var(--text2)', cursor: 'pointer', fontFamily: F,
            }}>
              {t.label}
              {t.count !== null && (
                <span style={{ marginLeft: 6, fontSize: 11, background: tab === t.key ? '#A78BFA' : 'var(--surface2)', color: tab === t.key ? '#fff' : 'var(--text2)', padding: '1px 7px', borderRadius: 99 }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── DESIGNS TAB ─── */}
        {tab === 'designs' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {designs.length === 0 ? (
              <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Дизайн байхгүй байна</div>
                <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>Эхний дизайнаа байршуулж борлуулалтаа эхлүүлнэ үү</div>
                <button onClick={() => setTab('upload')} style={{ background: '#A78BFA', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  + Дизайн байршуулах
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 0.8fr', padding: '10px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  <span>Гарчиг</span><span>Үнэ</span><span>Борлуулалт</span><span>Огноо</span><span>Төлөв</span>
                </div>
                {designs.map((d, i) => (
                  <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 0.8fr 0.8fr', padding: '13px 20px', borderBottom: i < designs.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', fontSize: 13 }}>
                    <div style={{ fontWeight: 600 }}>{d.title}</div>
                    <div style={{ color: '#FF6B00', fontWeight: 600 }}>{d.price ? '₮' + Number(d.price).toLocaleString() : '—'}</div>
                    <div style={{ color: 'var(--text2)' }}>{d.sales_count || 0} ш</div>
                    <div style={{ color: 'var(--text2)', fontSize: 12 }}>{new Date(d.created_at).toLocaleDateString('mn-MN')}</div>
                    <div>
                      <span style={{ background: (ST_CLR[d.status] || '#888') + '20', color: ST_CLR[d.status] || '#888', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                        {ST_MN[d.status] || d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ─── UPLOAD TAB ─── */}
        {tab === 'upload' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 560 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 20px' }}>Шинэ дизайн байршуулах</h2>

            {uploadMsg && (
              <div style={{ background: uploadMsg.includes('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)', border: '1px solid ' + (uploadMsg.includes('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'), borderRadius: 8, padding: '10px 14px', fontSize: 13, color: uploadMsg.includes('✅') ? '#10B981' : '#EF4444', marginBottom: 18 }}>
                {uploadMsg}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 500 }}>Дизайны гарчиг *</label>
                <input value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} placeholder="Жишээ: Бизнесийн карт загвар" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 500 }}>Үнэ (₮)</label>
                <input type="number" value={uploadForm.price} onChange={e => setUploadForm({ ...uploadForm, price: e.target.value })} placeholder="5000" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 500 }}>Файлын URL * <span style={{ color: 'var(--text2)', fontWeight: 400 }}>(Google Drive, Dropbox, гэх мэт)</span></label>
                <input value={uploadForm.file_url} onChange={e => setUploadForm({ ...uploadForm, file_url: e.target.value })} placeholder="https://drive.google.com/..." style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 500 }}>Тайлбар</label>
                <textarea value={uploadForm.description} onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })} rows={3} placeholder="Дизайны тухай товч тайлбар..." style={{ ...inp, resize: 'vertical', fontFamily: F }} />
              </div>
              <button onClick={submitDesign} disabled={uploading} style={{ background: uploading ? 'var(--surface2)' : '#A78BFA', color: uploading ? 'var(--text2)' : '#fff', border: 'none', borderRadius: 8, padding: '12px', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}>
                {uploading ? 'Илгээж байна...' : '⬆️ Дизайн илгээх'}
              </button>
            </div>

            <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#A78BFA', fontWeight: 600, marginBottom: 6 }}>📋 Шаардлага</div>
              <ul style={{ fontSize: 12, color: 'var(--text2)', margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
                <li>Файл: PDF, AI, PSD, PNG (300 DPI+)</li>
                <li>Өнгийн загвар: CMYK</li>
                <li>Цонхивч: 3мм+</li>
                <li>Фонт суулгагдсан байх</li>
              </ul>
            </div>
          </div>
        )}

        {/* ─── EARNINGS TAB ─── */}
        {tab === 'earnings' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>Орлогын хураангуй</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Нийт борлуулалт',       val: totalSales + ' ш',                   color: '#3B82F6' },
                  { label: 'Нийт орлого',            val: '₮' + totalEarnings.toLocaleString(), color: '#FF6B00' },
                  { label: 'Батлагдсан дизайн',      val: approvedCount + ' ширхэг',            color: '#10B981' },
                  { label: 'Хүлээгдэж буй дизайн',   val: designs.filter(d => d.status === 'pending').length + ' ширхэг', color: '#F59E0B' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14, color: 'var(--text2)' }}>{r.label}</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: r.color }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>Орлого авах</h3>
              <div style={{ padding: '32px 16px', textAlign: 'center', background: 'var(--surface2)', borderRadius: 10 }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#FF6B00', marginBottom: 4 }}>
                  ₮{totalEarnings.toLocaleString()}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Авах боломжтой орлого</div>
                <button
                  onClick={() => router.push('/dashboard/customer/wallet')}
                  style={{ background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  Wallet руу шилжих →
                </button>
              </div>
              <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                Орлого нь дизайн батлагдсаны дараа, борлуулалт бүрт автоматаар тооцогдоно.
                Wallet-аас банкны дансандаа шилжүүлэх боломжтой.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
