'use client'

import { apiFetch } from '@/lib/api'
import { useEffect, useState } from 'react'

type Tab = 'letter-prices' | 'materials' | 'margins' | 'finishings' | 'machines'

const TABS: { key: Tab; label: string; hint: string }[] = [
  { key: 'letter-prices', label: '🔤 Үсэгний үнэ', hint: 'Товгор үсэгний хэмжээ тус бүрийн үнэ' },
  { key: 'materials',     label: '📦 Материал',    hint: 'Акрил, пвц, нерж, цаас… м²-ын үнэ' },
  { key: 'margins',       label: '📈 Margin',      hint: 'Ашгийн хувь (retail/b2b/rush)' },
  { key: 'finishings',    label: '✨ Finishing',   hint: 'Ламинаци, UV зэрэг нэмэлт зардал' },
  { key: 'machines',      label: '⚙️ Machine',     hint: 'CNC, print, laser зэрэг цагийн хөлс' },
]

export default function PricingCatalogPage() {
  const [tab, setTab] = useState<Tab>('letter-prices')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>Үнийн каталог</h1>
      <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
        Smart Quote калькулятор энэ тохиргооноос үнэ бодно. Засвар нь шууд үйлчилнэ.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 20, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '10px 16px', border: 'none', whiteSpace: 'nowrap', cursor: 'pointer',
              borderBottom: tab === t.key ? '2px solid #FF6B00' : '2px solid transparent', marginBottom: -2,
              background: 'transparent',
              color: tab === t.key ? '#FF6B00' : 'var(--text2)',
              fontWeight: tab === t.key ? 600 : 400, fontSize: 13,
            }}>{t.label}</button>
        ))}
      </div>

      <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
        {TABS.find(t => t.key === tab)?.hint}
      </p>

      {tab === 'letter-prices' && <LetterPricesTab showToast={showToast} />}
      {tab === 'materials'     && <MaterialsTab showToast={showToast} />}
      {tab === 'margins'       && <MarginsTab showToast={showToast} />}
      {tab === 'finishings'    && <FinishingsTab showToast={showToast} />}
      {tab === 'machines'      && <MachinesTab showToast={showToast} />}

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#10B981', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 2000 }}>
          ✓ {toast}
        </div>
      )}
    </div>
  )
}

// ─── Generic table primitives ──────────────────────────────

const inp: React.CSSProperties = {
  padding: '6px 10px', background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 6, color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%',
}
const th: React.CSSProperties = {
  padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600,
  color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em',
  borderBottom: '1px solid var(--border)',
}
const td: React.CSSProperties = { padding: '8px 10px', fontSize: 13, color: 'var(--text)', borderBottom: '1px solid var(--border)' }
const btn = (bg: string, color = '#fff'): React.CSSProperties => ({
  padding: '6px 12px', background: bg, color, border: 'none', borderRadius: 6,
  fontSize: 12, fontWeight: 600, cursor: 'pointer',
})

// ─── Tab: Letter Prices ────────────────────────────────────

function LetterPricesTab({ showToast }: { showToast: (m: string) => void }) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState({ size_cm: '', price_per_letter: '', material_type: 'acrylic' })

  const load = () => {
    setLoading(true)
    apiFetch<any[]>('/pricing-catalog/letter-prices').then(setRows).catch(() => setRows([])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    const size_cm = Number(draft.size_cm)
    const price_per_letter = Number(draft.price_per_letter)
    if (!size_cm || !price_per_letter) return showToast('Хэмжээ ба үнэ шаардлагатай')
    await apiFetch('/pricing-catalog/letter-prices', {
      method: 'POST',
      body: { size_cm, price_per_letter, material_type: draft.material_type, is_active: true },
    })
    showToast('Нэмэгдлээ')
    setDraft({ size_cm: '', price_per_letter: '', material_type: 'acrylic' })
    load()
  }

  const update = async (row: any, field: string, value: any) => {
    const body: any = { [field]: field === 'size_cm' || field === 'price_per_letter' ? Number(value) : value }
    await apiFetch(`/pricing-catalog/letter-prices/${row.id}`, { method: 'PATCH', body })
    showToast('Шинэчлэгдлээ')
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    await apiFetch(`/pricing-catalog/letter-prices/${id}`, { method: 'DELETE' })
    showToast('Устгагдлаа')
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input placeholder="Хэмжээ (см)" type="number" value={draft.size_cm}
          onChange={e => setDraft({ ...draft, size_cm: e.target.value })} style={{ ...inp, width: 120 }} />
        <input placeholder="Үнэ/үсэг (₮)" type="number" value={draft.price_per_letter}
          onChange={e => setDraft({ ...draft, price_per_letter: e.target.value })} style={{ ...inp, width: 140 }} />
        <select value={draft.material_type}
          onChange={e => setDraft({ ...draft, material_type: e.target.value })} style={{ ...inp, width: 150 }}>
          <option value="acrylic">Акрил</option>
          <option value="pvc">PVC</option>
          <option value="stainless">Нерж</option>
          <option value="wood">Мод</option>
        </select>
        <button onClick={save} style={btn('#FF6B00')}>+ Нэмэх</button>
      </div>

      {loading ? <p>Ачаалж байна…</p> : rows.length === 0 ? (
        <p style={{ color: 'var(--text3)', fontSize: 13 }}>Одоогоор үсэгний үнэ оруулаагүй байна.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={th}>Хэмжээ (см)</th>
            <th style={th}>Үнэ/үсэг (₮)</th>
            <th style={th}>Материал</th>
            <th style={th}>Идэвхтэй</th>
            <th style={th}></th>
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={td}>
                  <input type="number" defaultValue={r.size_cm} style={{ ...inp, width: 100 }}
                    onBlur={e => Number(e.target.value) !== r.size_cm && update(r, 'size_cm', e.target.value)} />
                </td>
                <td style={td}>
                  <input type="number" defaultValue={r.price_per_letter} style={{ ...inp, width: 130 }}
                    onBlur={e => Number(e.target.value) !== Number(r.price_per_letter) && update(r, 'price_per_letter', e.target.value)} />
                </td>
                <td style={td}>
                  <select defaultValue={r.material_type || 'acrylic'} style={{ ...inp, width: 130 }}
                    onChange={e => update(r, 'material_type', e.target.value)}>
                    <option value="acrylic">Акрил</option>
                    <option value="pvc">PVC</option>
                    <option value="stainless">Нерж</option>
                    <option value="wood">Мод</option>
                  </select>
                </td>
                <td style={td}>
                  <input type="checkbox" defaultChecked={r.is_active}
                    onChange={e => update(r, 'is_active', e.target.checked)} />
                </td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <button onClick={() => del(r.id)} style={btn('#EF4444')}>Устгах</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── Tab: Materials ────────────────────────────────────────

function MaterialsTab({ showToast }: { showToast: (m: string) => void }) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState({ key: '', name: '', category: 'signage', rate_per_m2: '', waste_factor: '0.1' })

  const load = () => {
    setLoading(true)
    apiFetch<any[]>('/pricing-catalog/materials').then(setRows).catch(() => setRows([])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!draft.key || !draft.name || !draft.rate_per_m2) return showToast('Бүх талбар шаардлагатай')
    await apiFetch('/pricing-catalog/materials', {
      method: 'POST',
      body: {
        key: draft.key, name: draft.name, category: draft.category,
        rate_per_m2: Number(draft.rate_per_m2), waste_factor: Number(draft.waste_factor) || 0.1,
        is_active: true,
      },
    })
    showToast('Нэмэгдлээ')
    setDraft({ key: '', name: '', category: 'signage', rate_per_m2: '', waste_factor: '0.1' })
    load()
  }

  const update = async (row: any, field: string, value: any) => {
    await apiFetch(`/pricing-catalog/materials/${row.id}`, {
      method: 'PATCH',
      body: { [field]: ['rate_per_m2', 'waste_factor'].includes(field) ? Number(value) : value },
    })
    showToast('Шинэчлэгдлээ'); load()
  }

  const del = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    await apiFetch(`/pricing-catalog/materials/${id}`, { method: 'DELETE' })
    showToast('Устгагдлаа'); load()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <input placeholder="key (acrylic_5mm)" value={draft.key}
          onChange={e => setDraft({ ...draft, key: e.target.value })} style={{ ...inp, width: 170 }} />
        <input placeholder="Нэр (Акрил 5мм)" value={draft.name}
          onChange={e => setDraft({ ...draft, name: e.target.value })} style={{ ...inp, width: 180 }} />
        <select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} style={{ ...inp, width: 140 }}>
          <option value="signage">Хаяг реклам</option>
          <option value="printing">Хэвлэл</option>
          <option value="wide_format">Өргөн формат</option>
          <option value="metal">Металл</option>
        </select>
        <input placeholder="₮/м²" type="number" value={draft.rate_per_m2}
          onChange={e => setDraft({ ...draft, rate_per_m2: e.target.value })} style={{ ...inp, width: 120 }} />
        <input placeholder="Алдагдал (0.1)" type="number" step="0.01" value={draft.waste_factor}
          onChange={e => setDraft({ ...draft, waste_factor: e.target.value })} style={{ ...inp, width: 120 }} />
        <button onClick={save} style={btn('#FF6B00')}>+ Нэмэх</button>
      </div>

      {loading ? <p>Ачаалж байна…</p> : rows.length === 0 ? (
        <p style={{ color: 'var(--text3)', fontSize: 13 }}>Материал оруулаагүй байна.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={th}>Key</th><th style={th}>Нэр</th><th style={th}>Ангилал</th>
            <th style={th}>₮/м²</th><th style={th}>Алдагдал</th><th style={th}>Идэвхтэй</th><th style={th}></th>
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={td}><code style={{ fontSize: 11 }}>{r.key}</code></td>
                <td style={td}>
                  <input defaultValue={r.name} style={inp} onBlur={e => e.target.value !== r.name && update(r, 'name', e.target.value)} />
                </td>
                <td style={td}>
                  <select defaultValue={r.category} style={{ ...inp, width: 130 }} onChange={e => update(r, 'category', e.target.value)}>
                    <option value="signage">Хаяг</option>
                    <option value="printing">Хэвлэл</option>
                    <option value="wide_format">Өргөн</option>
                    <option value="metal">Металл</option>
                  </select>
                </td>
                <td style={td}>
                  <input type="number" defaultValue={r.rate_per_m2} style={{ ...inp, width: 110 }}
                    onBlur={e => Number(e.target.value) !== Number(r.rate_per_m2) && update(r, 'rate_per_m2', e.target.value)} />
                </td>
                <td style={td}>
                  <input type="number" step="0.01" defaultValue={r.waste_factor} style={{ ...inp, width: 90 }}
                    onBlur={e => Number(e.target.value) !== Number(r.waste_factor) && update(r, 'waste_factor', e.target.value)} />
                </td>
                <td style={td}>
                  <input type="checkbox" defaultChecked={r.is_active}
                    onChange={e => update(r, 'is_active', e.target.checked)} />
                </td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <button onClick={() => del(r.id)} style={btn('#EF4444')}>Устгах</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── Tab: Margins ──────────────────────────────────────────

function MarginsTab({ showToast }: { showToast: (m: string) => void }) {
  const [rows, setRows] = useState<any[]>([])
  const [draft, setDraft] = useState({ key: '', name: '', margin_rate: '' })

  const load = () => apiFetch<any[]>('/pricing-catalog/margins').then(setRows).catch(() => setRows([]))
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!draft.key || !draft.name || !draft.margin_rate) return showToast('Бүх талбар шаардлагатай')
    await apiFetch('/pricing-catalog/margins', {
      method: 'POST',
      body: { key: draft.key, name: draft.name, margin_rate: Number(draft.margin_rate), is_active: true },
    })
    showToast('Нэмэгдлээ'); setDraft({ key: '', name: '', margin_rate: '' }); load()
  }

  const update = async (r: any, f: string, v: any) => {
    await apiFetch(`/pricing-catalog/margins/${r.id}`, { method: 'PATCH', body: { [f]: f === 'margin_rate' ? Number(v) : v } })
    showToast('Шинэчлэгдлээ'); load()
  }

  const del = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    await apiFetch(`/pricing-catalog/margins/${id}`, { method: 'DELETE' })
    showToast('Устгагдлаа'); load()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <input placeholder="key (retail/b2b)" value={draft.key}
          onChange={e => setDraft({ ...draft, key: e.target.value })} style={{ ...inp, width: 150 }} />
        <input placeholder="Нэр" value={draft.name}
          onChange={e => setDraft({ ...draft, name: e.target.value })} style={{ ...inp, width: 180 }} />
        <input placeholder="0.45 (=45%)" type="number" step="0.01" value={draft.margin_rate}
          onChange={e => setDraft({ ...draft, margin_rate: e.target.value })} style={{ ...inp, width: 130 }} />
        <button onClick={save} style={btn('#FF6B00')}>+ Нэмэх</button>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>💡 0.45 = 45% margin (retail). 0.25 = 25% (b2b).</p>

      {rows.length === 0 ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>Margin оруулаагүй.</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>Key</th><th style={th}>Нэр</th><th style={th}>Rate</th><th style={th}>%</th><th style={th}>Идэвхтэй</th><th style={th}></th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={td}><code style={{ fontSize: 11 }}>{r.key}</code></td>
                <td style={td}><input defaultValue={r.name} style={inp} onBlur={e => e.target.value !== r.name && update(r, 'name', e.target.value)} /></td>
                <td style={td}>
                  <input type="number" step="0.01" defaultValue={r.margin_rate} style={{ ...inp, width: 110 }}
                    onBlur={e => Number(e.target.value) !== Number(r.margin_rate) && update(r, 'margin_rate', e.target.value)} />
                </td>
                <td style={td}>{Math.round(Number(r.margin_rate) * 100)}%</td>
                <td style={td}>
                  <input type="checkbox" defaultChecked={r.is_active} onChange={e => update(r, 'is_active', e.target.checked)} />
                </td>
                <td style={{ ...td, textAlign: 'right' }}><button onClick={() => del(r.id)} style={btn('#EF4444')}>Устгах</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── Tab: Finishings ───────────────────────────────────────

function FinishingsTab({ showToast }: { showToast: (m: string) => void }) {
  const [rows, setRows] = useState<any[]>([])
  const [draft, setDraft] = useState({ key: '', name: '', cost_per_m2: '', time_hours_per_m2: '0.3' })

  const load = () => apiFetch<any[]>('/pricing-catalog/finishings').then(setRows).catch(() => setRows([]))
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!draft.key || !draft.name || !draft.cost_per_m2) return showToast('Бүх талбар шаардлагатай')
    await apiFetch('/pricing-catalog/finishings', {
      method: 'POST',
      body: {
        key: draft.key, name: draft.name,
        cost_per_m2: Number(draft.cost_per_m2),
        time_hours_per_m2: Number(draft.time_hours_per_m2) || 0.3,
        is_active: true,
      },
    })
    showToast('Нэмэгдлээ'); setDraft({ key: '', name: '', cost_per_m2: '', time_hours_per_m2: '0.3' }); load()
  }

  const update = async (r: any, f: string, v: any) => {
    await apiFetch(`/pricing-catalog/finishings/${r.id}`, {
      method: 'PATCH',
      body: { [f]: ['cost_per_m2', 'time_hours_per_m2'].includes(f) ? Number(v) : v },
    })
    showToast('Шинэчлэгдлээ'); load()
  }

  const del = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    await apiFetch(`/pricing-catalog/finishings/${id}`, { method: 'DELETE' })
    showToast('Устгагдлаа'); load()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <input placeholder="key (lamination_matt)" value={draft.key}
          onChange={e => setDraft({ ...draft, key: e.target.value })} style={{ ...inp, width: 200 }} />
        <input placeholder="Нэр (Мат ламинаци)" value={draft.name}
          onChange={e => setDraft({ ...draft, name: e.target.value })} style={{ ...inp, width: 200 }} />
        <input placeholder="₮/м²" type="number" value={draft.cost_per_m2}
          onChange={e => setDraft({ ...draft, cost_per_m2: e.target.value })} style={{ ...inp, width: 120 }} />
        <input placeholder="Цаг/м²" type="number" step="0.1" value={draft.time_hours_per_m2}
          onChange={e => setDraft({ ...draft, time_hours_per_m2: e.target.value })} style={{ ...inp, width: 120 }} />
        <button onClick={save} style={btn('#FF6B00')}>+ Нэмэх</button>
      </div>

      {rows.length === 0 ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>Finishing оруулаагүй.</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>Key</th><th style={th}>Нэр</th><th style={th}>₮/м²</th><th style={th}>Цаг/м²</th><th style={th}>Идэвхтэй</th><th style={th}></th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={td}><code style={{ fontSize: 11 }}>{r.key}</code></td>
                <td style={td}><input defaultValue={r.name} style={inp} onBlur={e => e.target.value !== r.name && update(r, 'name', e.target.value)} /></td>
                <td style={td}><input type="number" defaultValue={r.cost_per_m2} style={{ ...inp, width: 110 }}
                  onBlur={e => Number(e.target.value) !== Number(r.cost_per_m2) && update(r, 'cost_per_m2', e.target.value)} /></td>
                <td style={td}><input type="number" step="0.1" defaultValue={r.time_hours_per_m2} style={{ ...inp, width: 90 }}
                  onBlur={e => Number(e.target.value) !== Number(r.time_hours_per_m2) && update(r, 'time_hours_per_m2', e.target.value)} /></td>
                <td style={td}><input type="checkbox" defaultChecked={r.is_active} onChange={e => update(r, 'is_active', e.target.checked)} /></td>
                <td style={{ ...td, textAlign: 'right' }}><button onClick={() => del(r.id)} style={btn('#EF4444')}>Устгах</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── Tab: Machines ─────────────────────────────────────────

function MachinesTab({ showToast }: { showToast: (m: string) => void }) {
  const [rows, setRows] = useState<any[]>([])
  const [draft, setDraft] = useState({ key: '', name: '', machine_type: 'cnc', speed_m2_per_hour: '', hourly_rate: '' })

  const load = () => apiFetch<any[]>('/pricing-catalog/machines').then(setRows).catch(() => setRows([]))
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!draft.key || !draft.name || !draft.hourly_rate) return showToast('Бүх талбар шаардлагатай')
    await apiFetch('/pricing-catalog/machines', {
      method: 'POST',
      body: {
        key: draft.key, name: draft.name, machine_type: draft.machine_type,
        speed_m2_per_hour: Number(draft.speed_m2_per_hour) || 1,
        hourly_rate: Number(draft.hourly_rate),
        is_active: true,
      },
    })
    showToast('Нэмэгдлээ'); setDraft({ key: '', name: '', machine_type: 'cnc', speed_m2_per_hour: '', hourly_rate: '' }); load()
  }

  const update = async (r: any, f: string, v: any) => {
    await apiFetch(`/pricing-catalog/machines/${r.id}`, {
      method: 'PATCH',
      body: { [f]: ['speed_m2_per_hour', 'hourly_rate'].includes(f) ? Number(v) : v },
    })
    showToast('Шинэчлэгдлээ'); load()
  }

  const del = async (id: string) => {
    if (!confirm('Устгах уу?')) return
    await apiFetch(`/pricing-catalog/machines/${id}`, { method: 'DELETE' })
    showToast('Устгагдлаа'); load()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <input placeholder="key (cnc_router)" value={draft.key}
          onChange={e => setDraft({ ...draft, key: e.target.value })} style={{ ...inp, width: 160 }} />
        <input placeholder="Нэр" value={draft.name}
          onChange={e => setDraft({ ...draft, name: e.target.value })} style={{ ...inp, width: 170 }} />
        <select value={draft.machine_type} onChange={e => setDraft({ ...draft, machine_type: e.target.value })} style={{ ...inp, width: 130 }}>
          <option value="cnc">CNC</option>
          <option value="laser">Laser</option>
          <option value="uv_print">UV Print</option>
          <option value="offset">Offset</option>
          <option value="digital">Digital</option>
          <option value="wide">Wide Format</option>
          <option value="led">LED</option>
        </select>
        <input placeholder="м²/цаг" type="number" value={draft.speed_m2_per_hour}
          onChange={e => setDraft({ ...draft, speed_m2_per_hour: e.target.value })} style={{ ...inp, width: 100 }} />
        <input placeholder="₮/цаг" type="number" value={draft.hourly_rate}
          onChange={e => setDraft({ ...draft, hourly_rate: e.target.value })} style={{ ...inp, width: 120 }} />
        <button onClick={save} style={btn('#FF6B00')}>+ Нэмэх</button>
      </div>

      {rows.length === 0 ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>Машин оруулаагүй.</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>Key</th><th style={th}>Нэр</th><th style={th}>Төрөл</th><th style={th}>м²/цаг</th><th style={th}>₮/цаг</th><th style={th}>Идэвхтэй</th><th style={th}></th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={td}><code style={{ fontSize: 11 }}>{r.key}</code></td>
                <td style={td}><input defaultValue={r.name} style={inp} onBlur={e => e.target.value !== r.name && update(r, 'name', e.target.value)} /></td>
                <td style={td}>{r.machine_type}</td>
                <td style={td}><input type="number" defaultValue={r.speed_m2_per_hour} style={{ ...inp, width: 90 }}
                  onBlur={e => Number(e.target.value) !== Number(r.speed_m2_per_hour) && update(r, 'speed_m2_per_hour', e.target.value)} /></td>
                <td style={td}><input type="number" defaultValue={r.hourly_rate} style={{ ...inp, width: 110 }}
                  onBlur={e => Number(e.target.value) !== Number(r.hourly_rate) && update(r, 'hourly_rate', e.target.value)} /></td>
                <td style={td}><input type="checkbox" defaultChecked={r.is_active} onChange={e => update(r, 'is_active', e.target.checked)} /></td>
                <td style={{ ...td, textAlign: 'right' }}><button onClick={() => del(r.id)} style={btn('#EF4444')}>Устгах</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
