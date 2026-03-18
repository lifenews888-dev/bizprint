'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const F = "'Segoe UI',system-ui,sans-serif"
const authH = () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('access_token')||'') })

export default function AdminWalletRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectId, setRejectId] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [filter, setFilter] = useState('pending')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await fetch(`${API}/wallet/withdraw-requests`, { headers: authH() }).then(r=>r.json()).catch(()=>[])
    setRequests(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function approve(id: string) {
    if (!confirm('Зөвшөөрөх үү? Хэрэглэгчийн дансны үлдэгдэлд тооцогдоно.')) return
    await fetch(`${API}/wallet/withdraw-requests/${id}/approve`, { method:'PATCH', headers: authH() })
    load()
  }

  async function reject(id: string) {
    if (!rejectReason) { alert('Шалтгаан оруулна уу'); return }
    await fetch(`${API}/wallet/withdraw-requests/${id}/reject`, { method:'PATCH', headers: authH(), body: JSON.stringify({ reason: rejectReason }) })
    setRejectId(''); setRejectReason('')
    load()
  }

  const filtered = requests.filter(r => filter === 'all' || r.status === filter)
  const fmt = (n: number) => Number(n).toLocaleString('mn-MN')

  const counts = {
    pending:  requests.filter(r=>r.status==='pending').length,
    approved: requests.filter(r=>r.status==='approved').length,
    rejected: requests.filter(r=>r.status==='rejected').length,
  }

  return (
    <div style={{ padding:'28px 32px', fontFamily:F, color:'var(--text)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, paddingBottom:20, borderBottom:'1px solid var(--border)' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:600, margin:0 }}>Мөнгө татах хүсэлтүүд</h1>
          <p style={{ fontSize:13, color:'var(--text3)', margin:'5px 0 0' }}>Хэрэглэгчдийн wallet withdrawal хүсэлтүүд</p>
        </div>
        <button onClick={load} style={{ padding:'9px 16px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', cursor:'pointer', fontSize:13 }}>↺ Шинэчлэх</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { k:'all',      l:'Нийт',          v:requests.length,    c:'var(--orange)' },
          { k:'pending',  l:'Хүлээгдэж байна', v:counts.pending,  c:'#F59E0B' },
          { k:'approved', l:'Зөвшөөрөгдсөн',  v:counts.approved,  c:'#10B981' },
          { k:'rejected', l:'Татгалзсан',      v:counts.rejected,  c:'#EF4444' },
        ].map(s => (
          <button key={s.k} onClick={() => setFilter(s.k)}
            style={{ background:'var(--surface)', border:filter===s.k?'2px solid '+s.c:'1px solid var(--border)', borderRadius:12, padding:16, textAlign:'left' as any, cursor:'pointer', borderLeft:'3px solid '+s.c }}>
            <div style={{ fontSize:24, fontWeight:700, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>{s.l}</div>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:48, textAlign:'center' as any, color:'var(--text3)' }}>Уншиж байна...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:48, textAlign:'center' as any, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, color:'var(--text3)' }}>
          <div style={{ fontSize:40, marginBottom:10 }}>🏦</div>
          <div style={{ fontWeight:600 }}>Хүсэлт байхгүй байна</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column' as any, gap:12 }}>
          {filtered.map(r => (
            <div key={r.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'20px 24px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:16, alignItems:'start' }}>

                <div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4, textTransform:'uppercase' as any, fontWeight:600 }}>Хэрэглэгч</div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{r.wallet?.user?.name || r.wallet?.user?.email || '—'}</div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>{r.wallet?.user?.email || ''}</div>
                </div>

                <div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4, textTransform:'uppercase' as any, fontWeight:600 }}>Дүн</div>
                  <div style={{ fontSize:20, fontWeight:800, color:'var(--orange)' }}>{fmt(r.amount)}₮</div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>{new Date(r.created_at).toLocaleDateString('mn-MN')}</div>
                </div>

                <div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4, textTransform:'uppercase' as any, fontWeight:600 }}>Банкны мэдээлэл</div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{r.bank_name || r.note || '—'}</div>
                  <div style={{ fontSize:13, color:'var(--orange)', fontFamily:'monospace' }}>{r.bank_account || '—'}</div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>{r.bank_account_name || '—'}</div>
                </div>

                <div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4, textTransform:'uppercase' as any, fontWeight:600 }}>Статус</div>
                  <span style={{ fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:20,
                    background:r.status==='pending'?'rgba(245,158,11,0.1)':r.status==='approved'?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)',
                    color:r.status==='pending'?'#F59E0B':r.status==='approved'?'#10B981':'#EF4444' }}>
                    {r.status==='pending'?'⏳ Хүлээгдэж байна':r.status==='approved'?'✓ Зөвшөөрөгдсөн':'✕ Татгалзсан'}
                  </span>
                  {r.reject_reason && <div style={{ fontSize:11, color:'#EF4444', marginTop:4 }}>Шалтгаан: {r.reject_reason}</div>}
                </div>

                {r.status === 'pending' && (
                  <div style={{ display:'flex', flexDirection:'column' as any, gap:6 }}>
                    <button onClick={() => approve(r.id)}
                      style={{ padding:'8px 16px', borderRadius:7, border:'1px solid #10B981', background:'rgba(16,185,129,0.06)', color:'#10B981', cursor:'pointer', fontSize:12, fontWeight:600, whiteSpace:'nowrap' as any }}>
                      ✓ Зөвшөөрөх
                    </button>
                    <button onClick={() => setRejectId(r.id)}
                      style={{ padding:'8px 16px', borderRadius:7, border:'1px solid #EF4444', background:'rgba(239,68,68,0.06)', color:'#EF4444', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                      ✕ Татгалзах
                    </button>
                  </div>
                )}
              </div>

              {rejectId === r.id && (
                <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid var(--border)', display:'flex', gap:10 }}>
                  <input value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Татгалзах шалтгаан..."
                    style={{ flex:1, padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:13, color:'var(--text)', outline:'none' }} />
                  <button onClick={() => reject(r.id)} style={{ padding:'9px 16px', borderRadius:8, border:'none', background:'#EF4444', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>Татгалзах</button>
                  <button onClick={() => setRejectId('')} style={{ padding:'9px 16px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text)', cursor:'pointer', fontSize:13 }}>Болих</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}