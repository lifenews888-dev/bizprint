'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

const F = "'Segoe UI',system-ui,sans-serif"
const LEVEL_COLORS: Record<string, string> = { starter: '#6B7280', pro: '#3B82F6', expert: '#8B5CF6', elite: '#FF6B00' }

export default function MarketplaceSection() {
  const router = useRouter()
  const [creators, setCreators] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch<any[]>('/creator/leaderboard?limit=6').catch(() => []),
      apiFetch<any[]>('/creator/packages').catch(() => []),
    ]).then(([c, p]) => {
      setCreators(Array.isArray(c) ? c : [])
      setPackages(Array.isArray(p) ? p : [])
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero + AI Search */}
      <div style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', borderRadius: 16, padding: '32px', marginBottom: 24, color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -10, fontSize: 100, opacity: 0.08 }}>🎨</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, position: 'relative', fontFamily: F }}>Creator Marketplace</div>
        <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 16, position: 'relative', fontFamily: F }}>Шилдэг creator-уудаар контент бүтээлгээрэй</div>
        <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Жишээ: "3 TikTok reel, 2 хоногт"'
            style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: 'none', fontSize: 14, outline: 'none', fontFamily: F }} />
          <button onClick={() => router.push(`/marketplace${search ? '?q=' + encodeURIComponent(search) : ''}`)}
            style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: '#fff', color: '#8B5CF6', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: F }}>
            Хайх
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, position: 'relative' }}>
          <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: 99, fontWeight: 600 }}>AI</span>
          <span style={{ fontSize: 10, opacity: 0.7, fontFamily: F }}>Байгалийн хэлээр хайлт хийх боломжтой</span>
        </div>
      </div>

      {/* Top Creators */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 9, background: '#8B5CF6', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>AI</span>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: F }}>Шилдэг Creators</span>
          </div>
          <button onClick={() => router.push('/marketplace')} style={{ fontSize: 12, color: '#FF6B00', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: F }}>Бүгд →</button>
        </div>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 140, background: 'var(--surface)', borderRadius: 14 }} className="animate-pulse" />)}
          </div>
        ) : creators.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', fontFamily: F }}>Creator удахгүй нэмэгдэнэ</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
            {creators.map((c, i) => {
              const lvlColor = LEVEL_COLORS[c.level] || '#6B7280'
              return (
                <div key={`${c.creator_id}-${i}`} onClick={() => router.push(`/creators/${c.creator_id}`)}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6B00'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}>
                  {i < 3 && <div style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32', display: 'inline-block', padding: '2px 8px', borderRadius: 99, marginBottom: 8 }}>#{i + 1}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{c.name?.charAt(0)?.toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: F }}>{c.name}</div>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: lvlColor + '15', color: lvlColor }}>{(c.level || 'starter').charAt(0).toUpperCase() + (c.level || 'starter').slice(1)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', fontFamily: F }}>
                    <span>⭐ {c.rankScore}</span>
                    <span>{c.completedJobs} ажил</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick packages */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, fontFamily: F }}>Бэлэн багцууд</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {(packages.length > 0 ? packages.slice(0, 3) : [
            { name: 'UGC Starter', content_count: 4, duration_months: 1, price: 720000 },
            { name: 'UGC Business', content_count: 8, duration_months: 1, price: 1500000 },
            { name: 'UGC Pro', content_count: 12, duration_months: 1, price: 2500000 },
          ]).map((p: any, i: number) => (
            <div key={i} onClick={() => router.push('/dashboard/customer/ugc')}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6B00'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{['🎨', '💼', '🚀'][i] || '📦'}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, fontFamily: F }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, fontFamily: F }}>{p.content_count} контент • {p.duration_months} сар</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: ['#10B981', '#3B82F6', '#8B5CF6'][i] || '#FF6B00' }}>₮{Number(p.price).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => router.push('/marketplace')}
          style={{ flex: 1, padding: '14px 0', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
          Marketplace харах →
        </button>
        <button onClick={() => router.push('/dashboard/customer/ugc')}
          style={{ flex: 1, padding: '14px 0', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
          Багцаар захиалах
        </button>
      </div>
    </div>
  )
}
