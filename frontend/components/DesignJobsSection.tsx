'use client'
import { useState, useEffect } from 'react'

export function DesignJobsSection({ user, API, authH }: any) {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [file, setFile] = useState<File|null>(null)
  const [preview, setPreview] = useState<File|null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await fetch(`${API}/design-requests/designer/${user.id}`, { headers: authH() }).then(r=>r.json()).catch(()=>[])
    setJobs(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function submitFile() {
    if (!selectedJob || !file) { setMsg('Файл сонгоно уу'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const token = localStorage.getItem('access_token') || ''
      const r = await fetch(`${API}/upload/file`, { method:'POST', headers:{ Authorization:'Bearer '+token }, body:fd })
      const d = await r.json()
      const fileUrl = d.url || d.filename || ''

      let previewUrl = ''
      if (preview) {
        const fd2 = new FormData()
        fd2.append('file', preview)
        const r2 = await fetch(`${API}/upload/file`, { method:'POST', headers:{ Authorization:'Bearer '+token }, body:fd2 })
        const d2 = await r2.json()
        previewUrl = d2.url || d2.filename || ''
      }

      await fetch(`${API}/design-requests/${selectedJob.id}/submit`, {
        method: 'PATCH', headers: authH(),
        body: JSON.stringify({ file_url: fileUrl, preview_url: previewUrl })
      })
      setMsg('✅ Файл амжилттай илгээгдлээ! Admin шалгана.')
      setSelectedJob(null); setFile(null); setPreview(null)
      load()
    } catch { setMsg('❌ Алдаа гарлаа') }
    setUploading(false)
  }

  const STATUS_INFO: Record<string,{l:string;c:string}> = {
    pending:     { l:'Хүлээгдэж байна', c:'#F59E0B' },
    assigned:    { l:'Томилогдсон',     c:'#3B82F6' },
    in_progress: { l:'Хийгдэж байна',  c:'#8B5CF6' },
    review:      { l:'Шалгалтанд',     c:'var(--orange)' },
    approved:    { l:'Батлагдсан',      c:'#10B981' },
    rejected:    { l:'Татгалзсан',      c:'#EF4444' },
  }

  const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', background:'#F8F8F6', border:'1px solid #E5E5E0', borderRadius:8, fontSize:13, color:'#0F0F0F', outline:'none', boxSizing:'border-box' }

  if (loading) return <div style={{ padding:40, textAlign:'center' as any, color:'#888' }}>Уншиж байна...</div>

  return (
    <div>
      {msg && <div style={{ padding:'12px 16px', borderRadius:8, background:msg.includes('❌')?'rgba(239,68,68,0.08)':'rgba(16,185,129,0.08)', color:msg.includes('❌')?'#EF4444':'#10B981', marginBottom:16, fontSize:13 }}>{msg}</div>}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:700, margin:0 }}>✏️ Миний дизайн ажлууд</h1>
      </div>

      {jobs.length === 0 ? (
        <div style={{ padding:48, textAlign:'center' as any, background:'#fff', borderRadius:14, border:'1px solid #EBEBEB' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>✏️</div>
          <div style={{ fontWeight:600, marginBottom:8 }}>Дизайн ажил байхгүй байна</div>
          <div style={{ fontSize:13, color:'#888' }}>Танд ажил оноогдох үед энд харагдана</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column' as any, gap:12 }}>
          {jobs.map(j => {
            const st = STATUS_INFO[j.status] || STATUS_INFO.pending
            return (
              <div key={j.id} style={{ background:'#fff', borderRadius:14, border:'1px solid #EBEBEB', overflow:'hidden' }}>
                <div style={{ padding:'16px 20px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:16, alignItems:'start' }}>
                    <div>
                      <div style={{ fontSize:12, color:'#888', marginBottom:3 }}>Бүтээгдэхүүн</div>
                      <div style={{ fontSize:15, fontWeight:700 }}>{j.product_name||'Хэвлэл'}</div>
                      {j.requirements && <div style={{ fontSize:12, color:'#888', marginTop:4, lineHeight:1.5 }}>{j.requirements}</div>}
                    </div>
                    <div>
                      <div style={{ fontSize:12, color:'#888', marginBottom:3 }}>Захиалагч</div>
                      <div style={{ fontSize:14, fontWeight:500 }}>{j.customer_name||'—'}</div>
                      {j.customer_phone && (
                        <a href={'tel:'+j.customer_phone} style={{ fontSize:13, color:'#FF6B35', textDecoration:'none', display:'flex', alignItems:'center', gap:4, marginTop:4 }}>
                          📞 {j.customer_phone}
                        </a>
                      )}
                      {j.customer_email && (
                        <a href={'mailto:'+j.customer_email} style={{ fontSize:12, color:'#3B82F6', textDecoration:'none', display:'block', marginTop:2 }}>
                          ✉️ {j.customer_email}
                        </a>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize:12, color:'#888', marginBottom:3 }}>Холбоо барих</div>
                      {j.designer_zoom ? (
                        <a href={j.designer_zoom} target="_blank" rel="noreferrer"
                          style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', background:'#2D8CFF', color:'#fff', borderRadius:8, textDecoration:'none', fontSize:13, fontWeight:600 }}>
                          🎥 Zoom холбогдох
                        </a>
                      ) : (
                        <div style={{ fontSize:12, color:'#888' }}>Zoom тохируулагдаагүй</div>
                      )}
                    </div>
                    <div style={{ textAlign:'right' as any }}>
                      <span style={{ fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:20, background:st.c+'20', color:st.c }}>
                        {st.l}
                      </span>
                      <div style={{ fontSize:11, color:'#888', marginTop:6 }}>{new Date(j.created_at).toLocaleDateString('mn-MN')}</div>
                    </div>
                  </div>
                </div>

                {/* Upload section */}
                {(j.status === 'assigned' || j.status === 'in_progress' || j.status === 'rejected') && (
                  <div style={{ borderTop:'1px solid #F5F5F0', padding:'16px 20px', background:'#FAFAF8' }}>
                    {j.status === 'rejected' && j.reject_reason && (
                      <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.08)', borderRadius:8, fontSize:13, color:'#DC2626', marginBottom:12 }}>
                        ❌ Татгалзсан шалтгаан: {j.reject_reason}
                      </div>
                    )}

                    {selectedJob?.id === j.id ? (
                      <div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                          <div>
                            <label style={{ fontSize:12, fontWeight:600, color:'#666', display:'block', marginBottom:6 }}>Дизайн файл (PDF/AI/PSD) *</label>
                            <label style={{ display:'block', border:'2px dashed #E5E5E0', borderRadius:8, padding:'14px', textAlign:'center' as any, cursor:'pointer', background:file?'rgba(16,185,129,0.04)':'#fff' }}>
                              <div style={{ fontSize:20, marginBottom:4 }}>📁</div>
                              <div style={{ fontSize:12, color:file?'#10B981':'#888' }}>{file?file.name:'Файл сонгох'}</div>
                              <input type="file" accept=".pdf,.ai,.psd,.png,.jpg,.zip" onChange={e=>setFile(e.target.files?.[0]||null)} style={{ display:'none' }} />
                            </label>
                          </div>
                          <div>
                            <label style={{ fontSize:12, fontWeight:600, color:'#666', display:'block', marginBottom:6 }}>Preview зураг (заавал биш)</label>
                            <label style={{ display:'block', border:'2px dashed #E5E5E0', borderRadius:8, padding:'14px', textAlign:'center' as any, cursor:'pointer', background:preview?'rgba(16,185,129,0.04)':'#fff' }}>
                              <div style={{ fontSize:20, marginBottom:4 }}>🖼️</div>
                              <div style={{ fontSize:12, color:preview?'#10B981':'#888' }}>{preview?preview.name:'Preview зураг'}</div>
                              <input type="file" accept="image/*" onChange={e=>setPreview(e.target.files?.[0]||null)} style={{ display:'none' }} />
                            </label>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:10 }}>
                          <button onClick={submitFile} disabled={uploading||!file}
                            style={{ flex:1, padding:'10px', background:uploading||!file?'#ccc':'#FF6B35', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:uploading||!file?'not-allowed':'pointer' }}>
                            {uploading?'Илгээж байна...':'🚀 Дизайн илгээх'}
                          </button>
                          <button onClick={() => { setSelectedJob(null); setFile(null); setPreview(null) }}
                            style={{ padding:'10px 16px', background:'transparent', border:'1px solid #E5E5E0', borderRadius:8, fontSize:13, cursor:'pointer', color:'#666' }}>
                            Болих
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setSelectedJob(j)}
                        style={{ padding:'9px 20px', background:'#FF6B35', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                        📤 Дизайн файл илгээх
                      </button>
                    )}
                  </div>
                )}

                {/* Approved - show file */}
                {j.status === 'approved' && j.file_url && (
                  <div style={{ borderTop:'1px solid #F5F5F0', padding:'12px 20px', background:'rgba(16,185,129,0.04)', display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:13, color:'#10B981', fontWeight:600 }}>✅ Эх батлагдсан</span>
                    <a href={j.file_url.startsWith('http')?j.file_url:`${API}/uploads/${j.file_url}`} target="_blank" rel="noreferrer"
                      style={{ fontSize:13, color:'#3B82F6', textDecoration:'none' }}>📎 Файл татах</a>
                  </div>
                )}

                {/* Review pending */}
                {j.status === 'review' && (
                  <div style={{ borderTop:'1px solid #F5F5F0', padding:'12px 20px', background:'var(--orange-04)' }}>
                    <span style={{ fontSize:13, color:'#FF6B35', fontWeight:600 }}>⏳ Admin шалгаж байна...</span>
                    {j.file_url && <a href={j.file_url.startsWith('http')?j.file_url:`${API}/uploads/${j.file_url}`} target="_blank" rel="noreferrer" style={{ fontSize:13, color:'#3B82F6', textDecoration:'none', marginLeft:12 }}>📎 Илгээсэн файл</a>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}