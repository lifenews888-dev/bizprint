'use client'
import { useState, useEffect } from 'react'

const API = 'http://localhost:4000'
const F = "'Segoe UI',system-ui,sans-serif"

const PAPER_NAMES = [
  'Гланц', 'Мат', 'Офсет', 'Хром', 'Картон',
  'Крафт', 'Самоклей', 'Synthetic', 'Canvas', 'Бусад'
]
const GSM_LIST = [60,70,80,90,100,115,130,150,170,200,250,300,350,400,450,500]

interface PaperType {
  id: string; name: string; name_mn: string; gsm: number
  price_per_sheet: number; description: string; is_active: boolean; sort_order: number
}

function authH() {
  const t = localStorage.getItem('access_token') || localStorage.getItem('token') || ''
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }
}

export default function AdminPaperTypesPage() {
  const [papers, setPapers] = useState<PaperType[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<PaperType | null>(null)
  const [form, setForm] = useState({
    name: '', name_mn: '', gsm: 150, price_per_sheet: 0,
    description: '', is_active: true, sort_order: 0
  })
  const [filterName, setFilterName] = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await fetch(`${API}/paper-types`, { headers: authH() }).then(r => r.json())
    setPapers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm({ name: '', name_mn: '', gsm: 150, price_per_sheet: 0, description: '', is_active: true, sort_order: 0 })
    setModal(true)
  }

  function openEdit(p: PaperType) {
    setEditing(p)
    setForm({ name: p.name, name_mn: p.name_mn, gsm: p.gsm, price_per_sheet: p.price_per_sheet, description: p.description || '', is_active: p.is_active, sort_order: p.sort_order })
    setModal(true)
  }

  async function save() {
    const body = { ...form, gsm: Number(form.gsm), price_per_sheet: Number(form.price_per_sheet), sort_order: Number(form.sort_order) }
    if (editing) {
      await fetch(`${API}/paper-types/${editing.id}`, { method: 'PATCH', headers: authH(), body: JSON.stringify(body) })
    } else {
      await fetch(`${API}/paper-types`, { method: 'POST', headers: authH(), body: JSON.stringify(body) })
    }
    setModal(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Устгах уу?')) return
    await fetch(`${API}/paper-types/${id}`, { method: 'DELETE', headers: authH() })
    load()
  }

  async function toggle(p: PaperType) {
    await fetch(`${API}/paper-types/${p.id}`, { method: 'PATCH', headers: authH(), body: JSON.stringify({ is_active: !p.is_active }) })
    load()
  }

  const names = ['all', ...Array.from(new Set(papers.map(p => p.name)))]
  const filtered = papers.filter(p => filterName === 'all' || p.name === filterName)

  return (
    <div style={{ padding: '28px 32px', fontFamily: F, color: 'var(--text)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Цаасны төрлүүд</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', margin: '5px 0 0' }}>Цаасны нэр, грамм, нэгж үнэ тохируулах</p>
        </div>
        <button onClick={openNew} style={{ background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>+ Цаас нэмэх</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Нийт төрөл', value: papers.length, color: 'var(--orange)' },
          { label: 'Идэвхтэй', value: papers.filter(p => p.is_active).length, color: '#1D9E75' },
          { label: 'Нэрийн төрөл', value: new Set(papers.map(p => p.name)).size, color: '#378ADD' },
          { label: 'Дундаж үнэ', value: papers.length ? Math.round(papers.reduce((a,p) => a + Number(p.price_per_sheet), 0) / papers.length) + '₮' : '0₮', color: '#8B5CF6' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, borderLeft: '3px solid ' + c.color }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' as any }}>
        {names.map(n => (
          <button key={n} onClick={() => setFilterName(n)}
            style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid', fontSize: 12, cursor: 'pointer', background: filterName === n ? 'var(--orange)' : 'transparent', color: filterName === n ? '#fff' : 'var(--text3)', borderColor: filterName === n ? 'var(--orange)' : 'var(--border)' }}>
            {n === 'all' ? 'Бүгд' : n}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 0.8fr 1fr 1fr 0.5fr 0.8fr', padding: '10px 20px', borderBottom: '1px solid var(--border)', gap: 12 }}>
          {['Цаасны нэр', 'GSM', 'Нэгж үнэ', 'Тайлбар', 'Нэгж үнэ/кг', 'Идэвх', 'Үйлдэл'].map(h => (
            <div key={h} style={{ fontSize: 11, color: 'var(--text4)', textTransform: 'uppercase' as any, fontWeight: 500 }}>{h}</div>
          ))}
        </div>
        {loading ? <div style={{ padding: 48, textAlign: 'center' as any, color: 'var(--text4)' }}>Уншиж байна...</div>
          : filtered.length === 0 ? (
            <div style={{ padding: 56, textAlign: 'center' as any, color: 'var(--text4)' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Цаас олдсонгүй</div>
              <div style={{ fontSize: 13 }}>+ Цаас нэмэх товч дарж эхлэнэ үү</div>
            </div>
          ) : filtered.map((p, i) => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 0.8fr 1fr 1fr 0.5fr 0.8fr', padding: '12px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', gap: 12, alignItems: 'center', opacity: p.is_active ? 1 : 0.5 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name_mn || p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text4)' }}>{p.name}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#378ADD' }}>{p.gsm}gsm</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--orange)' }}>{Number(p.price_per_sheet).toLocaleString()}₮</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.description || '-'}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                {p.gsm > 0 ? Math.round(Number(p.price_per_sheet) / (0.21 * 0.297 * p.gsm / 1000) / 1000 * 1000).toLocaleString() + '₮/кг' : '-'}
              </div>
              <button onClick={() => toggle(p)} style={{ width: 40, height: 22, borderRadius: 11, border: 'none', background: p.is_active ? '#1D9E75' : 'var(--border)', cursor: 'pointer', position: 'relative' as any }}>
                <span style={{ position: 'absolute' as any, top: 2, left: p.is_active ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </button>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(p)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #378ADD', background: 'transparent', color: '#378ADD', cursor: 'pointer' }}>Засах</button>
                <button onClick={() => remove(p.id)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #e24b4a', background: 'transparent', color: '#e24b4a', cursor: 'pointer' }}>Устгах</button>
              </div>
            </div>
          ))}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 32, width: 520, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{editing ? 'Цаас засах' : 'Шинэ цаас нэмэх'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text3)' }}>x</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Цаасны нэр (төрөл)</label>
                <select value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }}>
                  <option value="">-- Сонгох --</option>
                  {PAPER_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Монгол нэр</label>
                <input value={form.name_mn} onChange={e => setForm({ ...form, name_mn: e.target.value })} placeholder="Гланц цаас"
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' as any }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Грамм (GSM)</label>
                <select value={form.gsm} onChange={e => setForm({ ...form, gsm: Number(e.target.value) })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }}>
                  {GSM_LIST.map(g => <option key={g} value={g}>{g}gsm</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Нэгж үнэ (₮/хуудас)</label>
                <input type="number" value={form.price_per_sheet} onChange={e => setForm({ ...form, price_per_sheet: Number(e.target.value) })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' as any }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Тайлбар</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Нэмэлт мэдээлэл..."
                style={{ width: '100%', padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' as any }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <input type="checkbox" id="active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              <label htmlFor="active" style={{ fontSize: 13 }}>Идэвхтэй байх</label>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>Цуцлах</button>
              <button onClick={save} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--orange)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Хадгалах</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}