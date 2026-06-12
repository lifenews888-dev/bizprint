'use client'

import { usePricing, PricingConfig } from '@/hooks/usePricing'

/* ═══════════════════════════════════════
 *  LivePricePanel — Editor sidebar pricing
 *  Real-time price display from backend
 * ═══════════════════════════════════════ */

const fmt = (n: number) => Math.round(n).toLocaleString('mn-MN')

const MATERIALS = [
  { key: 'paper_300', label: 'Art paper 300gsm' },
  { key: 'paper_200', label: 'Art paper 200gsm' },
  { key: 'paper_150', label: 'Coated 150gsm' },
  { key: 'paper_100', label: 'Uncoated 100gsm' },
  { key: 'vinyl', label: 'Винил' },
  { key: 'sticker', label: 'Стикер' },
]

const FINISHES = [
  { key: 'lamination_matt', label: 'Матт ламинаци' },
  { key: 'lamination_gloss', label: 'Гялгар ламинаци' },
  { key: 'uv_coating', label: 'UV хамгаалалт' },
]

const QTY_PRESETS = [50, 100, 250, 500, 1000, 2500, 5000]

export default function LivePricePanel({
  config,
  onConfigChange,
}: {
  config: PricingConfig
  onConfigChange: (cfg: Partial<PricingConfig>) => void
}) {
  const { data, loading, error } = usePricing(config)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Price Display */}
      <div style={{ background: '#1a1a2e', borderRadius: 10, padding: 14, border: '1px solid #2a2a4a' }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Нийт үнэ</div>
        {loading ? (
          <div style={{ fontSize: 24, fontWeight: 700, color: '#FF6B00' }}>...</div>
        ) : error ? (
          <div style={{ fontSize: 12, color: '#EF4444' }}>{error}</div>
        ) : data ? (
          <>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#FF6B00', lineHeight: 1 }}>₮{fmt(data.total_price)}</div>
            <div style={{ fontSize: 12, color: '#10B981', marginTop: 4 }}>₮{fmt(data.unit_price)} / нэгж</div>
            {data.production_speed && (
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>⏱ {data.production_speed}</div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 14, color: '#666' }}>Тохиргоо сонгоно уу</div>
        )}
      </div>

      {/* Cost Breakdown */}
      {data?.production?.cost_breakdown && !loading && (
        <div style={{ background: '#1a1a2e', borderRadius: 10, padding: 12, border: '1px solid #2a2a4a' }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 8, textTransform: 'uppercase' }}>Задаргаа</div>
          {[
            { label: 'Материал', value: data.production.cost_breakdown.material },
            { label: 'Машин', value: data.production.cost_breakdown.machine },
            { label: 'Хөдөлмөр', value: data.production.cost_breakdown.labor },
            { label: 'Тохируулга', value: data.production.cost_breakdown.setup },
            { label: 'Дуусгалт', value: data.production.cost_breakdown.post_process },
            { label: 'НӨАТ (10%)', value: data.vat },
          ].filter(r => r.value > 0).map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', color: '#aaa' }}>
              <span>{r.label}</span>
              <span>₮{fmt(r.value)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #2a2a4a', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#fff' }}>
            <span>Нийт</span>
            <span style={{ color: '#FF6B00' }}>₮{fmt(data.total_price)}</span>
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Тоо ширхэг</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {QTY_PRESETS.map(q => (
            <button key={q} onClick={() => onConfigChange({ quantity: q })} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: 'none',
              background: config.quantity === q ? '#FF6B00' : '#1a1a2e', color: config.quantity === q ? '#fff' : '#aaa',
              fontWeight: config.quantity === q ? 700 : 400,
            }}>{q}</button>
          ))}
        </div>
        <input type="number" value={config.quantity || 100} onChange={e => onConfigChange({ quantity: Number(e.target.value) || 100 })} min={1}
          style={{ width: '100%', marginTop: 6, padding: '6px 10px', borderRadius: 6, border: '1px solid #2a2a4a', background: '#0f0f1a', color: '#fff', fontSize: 12 }} />
      </div>

      {/* Material */}
      <div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Материал</div>
        <select value={config.material || 'paper_300'} onChange={e => onConfigChange({ material: e.target.value })}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #2a2a4a', background: '#0f0f1a', color: '#fff', fontSize: 12 }}>
          {MATERIALS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
      </div>

      {/* Finishing */}
      <div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Дуусгалт</div>
        {FINISHES.map(f => {
          const active = (config.post_processes || []).includes(f.key)
          return (
            <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#ccc', marginBottom: 4, cursor: 'pointer' }}>
              <input type="checkbox" checked={active} onChange={() => {
                const procs = config.post_processes || []
                onConfigChange({ post_processes: active ? procs.filter(p => p !== f.key) : [...procs, f.key] })
              }} />
              {f.label}
            </label>
          )
        })}
      </div>

      {/* Urgency */}
      <div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Яаралтай байдал</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { key: 'normal', label: 'Энгийн' },
            { key: '48h', label: '48 цаг' },
            { key: '24h', label: '24 цаг' },
          ].map(u => (
            <button key={u.key} onClick={() => onConfigChange({ urgency: u.key })} style={{
              flex: 1, padding: '6px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: 'none',
              background: config.urgency === u.key ? (u.key === '24h' ? '#EF4444' : u.key === '48h' ? '#F59E0B' : '#10B981') : '#1a1a2e',
              color: config.urgency === u.key ? '#fff' : '#888',
              fontWeight: config.urgency === u.key ? 700 : 400,
            }}>{u.label}</button>
          ))}
        </div>
      </div>

      {/* 3-tier options */}
      {data?.options && !loading && (
        <div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Сонголтууд</div>
          {data.options.map((opt) => (
            <div key={opt.tier} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${opt.tier === 'standard' ? '#FF6B00' : '#2a2a4a'}`, background: opt.tier === 'standard' ? '#FF6B0010' : '#1a1a2e', marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>{opt.tier}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#FF6B00' }}>₮{fmt(opt.price)}</span>
              </div>
              <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{opt.delivery_days} хоног · {opt.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
