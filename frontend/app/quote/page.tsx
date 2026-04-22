'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const InstantQuote = dynamic(() => import('./InstantQuote'), { ssr: false, loading: () => <Loading /> })
const DetailedQuote = dynamic(() => import('./DetailedQuote'), { ssr: false, loading: () => <Loading /> })
const SmartQuote = dynamic(() => import('./SmartQuote'), { ssr: false, loading: () => <Loading /> })
const OffsetQuote = dynamic(() => import('./OffsetQuote'), { ssr: false, loading: () => <Loading /> })

function Loading() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>
}

const TABS = [
  { key: 'quick', label: '⚡ Түргэн тооцоо', desc: 'Шууд үнэ авах' },
  { key: 'detailed', label: '🧩 Нарийвчилсан', desc: 'Бүх сонголттой' },
  { key: 'offset', label: '🖨️ Офсет хэвлэл', desc: 'Флаер, нэрийн хуудас' },
  { key: 'ai', label: '🤖 Хаяг реклам', desc: 'Товгор үсэг, самбар' },
]

function QuotePageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab = searchParams.get('tab') || 'quick'

  const setTab = (t: string) => {
    router.replace(`/quote?tab=${t}`, { scroll: false })
  }

  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Header + Tabs */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 20px 0' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Үнийн тооцоолуур</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Хэвлэлийн үнийг шууд тооцоолох</p>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '10px 20px', border: 'none', borderBottom: tab === t.key ? '2px solid #FF6B00' : '2px solid transparent',
                background: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1,
              }}>
                <span style={{ fontSize: 13, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? '#FF6B00' : 'var(--text2)' }}>{t.label}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Price hints */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', marginRight: 4 }}>Жишээ үнэ:</span>
          {[
            { name: 'Нэрийн хуудас 500ш', from: 45000 },
            { name: 'A5 Флаер 1000ш', from: 120000 },
            { name: 'Роллап баннер', from: 85000 },
            { name: 'A4 Постер 100ш', from: 35000 },
          ].map(h => (
            <span key={h.name} style={{ fontSize: 11, background: 'var(--surface2)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 20, color: 'var(--text3)' }}>
              {h.name}: <strong style={{ color: '#FF6B00' }}>₮{h.from.toLocaleString()}-аас</strong>
            </span>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {tab === 'quick' && <InstantQuote />}
        {tab === 'detailed' && <DetailedQuote />}
        {tab === 'offset' && <OffsetQuote />}
        {tab === 'ai' && <SmartQuote />}
      </div>
    </div>
  )
}

export default function QuotePage() {
  return (
    <Suspense fallback={<Loading />}>
      <QuotePageInner />
    </Suspense>
  )
}
