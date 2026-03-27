'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

/* ═══════════════════════════════════════
 *  Admin — Pricing Catalog (DB-backed)
 *  6 tabs: Materials, Machines, Finishings, Margins, Mappings, Letter Prices
 * ═══════════════════════════════════════ */

type Tab = 'materials' | 'machines' | 'finishings' | 'margins' | 'mappings' | 'letters';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'materials', label: 'Материал', icon: '🧱' },
  { key: 'machines', label: 'Машин', icon: '⚙️' },
  { key: 'finishings', label: 'Дуусгалт', icon: '✨' },
  { key: 'margins', label: 'Ашиг', icon: '💰' },
  { key: 'mappings', label: 'Холбоос', icon: '🔗' },
  { key: 'letters', label: 'Үсэг үнэ', icon: '🔤' },
];

const MATERIAL_CATEGORIES = ['signage', 'metal', 'printing', 'wide_format', 'special'];

export default function PricingCatalogPage() {
  const [tab, setTab] = useState<Tab>('materials');

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Үнийн каталог</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        Материал, машин, дуусгалт, ашгийн дүрмийг удирдах. Бүх үнийн өгөгдөл энд хадгалагдана.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 8, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: tab === t.key ? 'var(--brand)' : 'var(--surface)',
              color: tab === t.key ? '#fff' : 'var(--text)',
              fontWeight: tab === t.key ? 600 : 400, fontSize: 14,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'materials' && <MaterialsTab />}
      {tab === 'machines' && <MachinesTab />}
      {tab === 'finishings' && <FinishingsTab />}
      {tab === 'margins' && <MarginsTab />}
      {tab === 'mappings' && <MappingsTab />}
      {tab === 'letters' && <LetterPricesTab />}
    </div>
  );
}

/* ═══════════════════════════════════════
 *  Shared styles
 * ═══════════════════════════════════════ */

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)', borderRadius: 12, padding: 20,
  border: '1px solid var(--border)',
};

const tableStyle: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse', fontSize: 14,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid var(--border)',
  fontWeight: 600, color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px', borderBottom: '1px solid var(--border)',
};

const btnPrimary: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: 'var(--brand)', color: '#fff', fontWeight: 600, fontSize: 13,
};

const btnDanger: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
  background: '#e53e3e', color: '#fff', fontSize: 12,
};

const btnSmall: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)',
  cursor: 'pointer', background: 'var(--surface)', fontSize: 12,
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--surface)', width: '100%', fontSize: 14,
};

const fmt = (n: number) => n?.toLocaleString?.() || n;

/* ═══════════════════════════════════════
 *  MATERIALS TAB
 * ═══════════════════════════════════════ */

function MaterialsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const data = await apiFetch('/pricing-catalog/materials');
    setItems(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (form: any) => {
    if (form.id) {
      await apiFetch(`/pricing-catalog/materials/${form.id}`, { method: 'PATCH', body: JSON.stringify(form) });
    } else {
      await apiFetch('/pricing-catalog/materials', { method: 'POST', body: JSON.stringify(form) });
    }
    setShowForm(false); setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Устгах уу?')) return;
    await apiFetch(`/pricing-catalog/materials/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Материалууд ({items.length})</h2>
        <button style={btnPrimary} onClick={() => { setEditing(null); setShowForm(true); }}>+ Нэмэх</button>
      </div>

      {showForm && (
        <MaterialForm
          initial={editing}
          onSave={save}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Key</th>
              <th style={thStyle}>Нэр</th>
              <th style={thStyle}>Ангилал</th>
              <th style={thStyle}>₮/м²</th>
              <th style={thStyle}>Хог %</th>
              <th style={thStyle}>Идэвхтэй</th>
              <th style={thStyle}>Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {items.map(m => (
              <tr key={m.id}>
                <td style={tdStyle}><code>{m.key}</code></td>
                <td style={tdStyle}>{m.name}</td>
                <td style={tdStyle}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, background: 'var(--bg)', fontSize: 12 }}>
                    {m.category}
                  </span>
                </td>
                <td style={tdStyle}>{fmt(Number(m.rate_per_m2))}₮</td>
                <td style={tdStyle}>{(Number(m.waste_factor) * 100).toFixed(0)}%</td>
                <td style={tdStyle}>{m.is_active ? '✅' : '❌'}</td>
                <td style={tdStyle}>
                  <button style={btnSmall} onClick={() => { setEditing(m); setShowForm(true); }}>✏️</button>{' '}
                  <button style={btnDanger} onClick={() => remove(m.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MaterialForm({ initial, onSave, onCancel }: { initial: any; onSave: (f: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState(initial || { key: '', name: '', category: 'signage', rate_per_m2: 0, waste_factor: 0.10, is_active: true, sort_order: 0 });
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  return (
    <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 8, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Key</label>
        <input style={inputStyle} value={form.key} onChange={e => set('key', e.target.value)} placeholder="acrylic_5mm" />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Нэр</label>
        <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Акрил 5мм" />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Ангилал</label>
        <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)}>
          {MATERIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600 }}>₮/м²</label>
        <input style={inputStyle} type="number" value={form.rate_per_m2} onChange={e => set('rate_per_m2', Number(e.target.value))} />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Хог хаягдал (0.10 = 10%)</label>
        <input style={inputStyle} type="number" step="0.01" value={form.waste_factor} onChange={e => set('waste_factor', Number(e.target.value))} />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Дараалал</label>
        <input style={inputStyle} type="number" value={form.sort_order} onChange={e => set('sort_order', Number(e.target.value))} />
      </div>
      <div style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
        <label style={{ fontSize: 12 }}>
          <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} /> Идэвхтэй
        </label>
      </div>
      <div style={{ display: 'flex', alignItems: 'end', gap: 8, gridColumn: 'span 2' }}>
        <button style={btnPrimary} onClick={() => onSave(form)}>Хадгалах</button>
        <button style={btnSmall} onClick={onCancel}>Болих</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
 *  MACHINES TAB
 * ═══════════════════════════════════════ */

function MachinesTab() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const data = await apiFetch('/pricing-catalog/machines');
    setItems(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (form: any) => {
    if (form.id) {
      await apiFetch(`/pricing-catalog/machines/${form.id}`, { method: 'PATCH', body: JSON.stringify(form) });
    } else {
      await apiFetch('/pricing-catalog/machines', { method: 'POST', body: JSON.stringify(form) });
    }
    setShowForm(false); setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Устгах уу?')) return;
    await apiFetch(`/pricing-catalog/machines/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Машинууд ({items.length})</h2>
        <button style={btnPrimary} onClick={() => { setEditing(null); setShowForm(true); }}>+ Нэмэх</button>
      </div>

      {showForm && (
        <MachineForm initial={editing} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Нэр</th>
              <th style={thStyle}>Төрөл</th>
              <th style={thStyle}>Хурд (м²/цаг)</th>
              <th style={thStyle}>₮/цаг</th>
              <th style={thStyle}>Setup (мин)</th>
              <th style={thStyle}>Setup ₮</th>
              <th style={thStyle}>Макс хэмжээ</th>
              <th style={thStyle}>Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {items.map(m => (
              <tr key={m.id}>
                <td style={tdStyle}><strong>{m.name}</strong><br/><code style={{ fontSize: 11 }}>{m.key}</code></td>
                <td style={tdStyle}>{m.machine_type}</td>
                <td style={tdStyle}>{m.speed_m2_per_hour}</td>
                <td style={tdStyle}>{fmt(Number(m.hourly_rate))}₮</td>
                <td style={tdStyle}>{m.setup_time_min} мин</td>
                <td style={tdStyle}>{fmt(Number(m.setup_cost))}₮</td>
                <td style={tdStyle}>{m.max_width_mm}×{m.max_height_mm}мм</td>
                <td style={tdStyle}>
                  <button style={btnSmall} onClick={() => { setEditing(m); setShowForm(true); }}>✏️</button>{' '}
                  <button style={btnDanger} onClick={() => remove(m.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MachineForm({ initial, onSave, onCancel }: { initial: any; onSave: (f: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState(initial || {
    key: '', name: '', machine_type: 'cnc', speed_m2_per_hour: 1, hourly_rate: 50000,
    setup_time_min: 30, setup_cost: 15000, max_width_mm: 2400, max_height_mm: 1200, is_active: true, sort_order: 0,
  });
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  return (
    <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 8, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
      <div><label style={{ fontSize: 12, fontWeight: 600 }}>Key</label><input style={inputStyle} value={form.key} onChange={e => set('key', e.target.value)} /></div>
      <div><label style={{ fontSize: 12, fontWeight: 600 }}>Нэр</label><input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} /></div>
      <div><label style={{ fontSize: 12, fontWeight: 600 }}>Төрөл</label><input style={inputStyle} value={form.machine_type} onChange={e => set('machine_type', e.target.value)} /></div>
      <div><label style={{ fontSize: 12, fontWeight: 600 }}>Хурд (м²/цаг)</label><input style={inputStyle} type="number" step="0.1" value={form.speed_m2_per_hour} onChange={e => set('speed_m2_per_hour', Number(e.target.value))} /></div>
      <div><label style={{ fontSize: 12, fontWeight: 600 }}>₮/цаг</label><input style={inputStyle} type="number" value={form.hourly_rate} onChange={e => set('hourly_rate', Number(e.target.value))} /></div>
      <div><label style={{ fontSize: 12, fontWeight: 600 }}>Setup мин</label><input style={inputStyle} type="number" value={form.setup_time_min} onChange={e => set('setup_time_min', Number(e.target.value))} /></div>
      <div><label style={{ fontSize: 12, fontWeight: 600 }}>Setup ₮</label><input style={inputStyle} type="number" value={form.setup_cost} onChange={e => set('setup_cost', Number(e.target.value))} /></div>
      <div><label style={{ fontSize: 12, fontWeight: 600 }}>Макс өргөн (мм)</label><input style={inputStyle} type="number" value={form.max_width_mm} onChange={e => set('max_width_mm', Number(e.target.value))} /></div>
      <div><label style={{ fontSize: 12, fontWeight: 600 }}>Макс өндөр (мм)</label><input style={inputStyle} type="number" value={form.max_height_mm} onChange={e => set('max_height_mm', Number(e.target.value))} /></div>
      <div style={{ display: 'flex', alignItems: 'end', gap: 8, gridColumn: 'span 2' }}>
        <button style={btnPrimary} onClick={() => onSave(form)}>Хадгалах</button>
        <button style={btnSmall} onClick={onCancel}>Болих</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
 *  FINISHINGS TAB
 * ═══════════════════════════════════════ */

function FinishingsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const data = await apiFetch('/pricing-catalog/finishings');
    setItems(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (form: any) => {
    if (form.id) {
      await apiFetch(`/pricing-catalog/finishings/${form.id}`, { method: 'PATCH', body: JSON.stringify(form) });
    } else {
      await apiFetch('/pricing-catalog/finishings', { method: 'POST', body: JSON.stringify(form) });
    }
    setShowForm(false); setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Устгах уу?')) return;
    await apiFetch(`/pricing-catalog/finishings/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Дуусгалт / Post-process ({items.length})</h2>
        <button style={btnPrimary} onClick={() => { setEditing(null); setShowForm(true); }}>+ Нэмэх</button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 8, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          <FinishingFormInner initial={editing} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Key</th>
              <th style={thStyle}>Нэр</th>
              <th style={thStyle}>₮/м²</th>
              <th style={thStyle}>Цаг/м²</th>
              <th style={thStyle}>Идэвхтэй</th>
              <th style={thStyle}>Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {items.map(f => (
              <tr key={f.id}>
                <td style={tdStyle}><code>{f.key}</code></td>
                <td style={tdStyle}>{f.name}</td>
                <td style={tdStyle}>{fmt(Number(f.cost_per_m2))}₮</td>
                <td style={tdStyle}>{f.time_hours_per_m2}ц</td>
                <td style={tdStyle}>{f.is_active ? '✅' : '❌'}</td>
                <td style={tdStyle}>
                  <button style={btnSmall} onClick={() => { setEditing(f); setShowForm(true); }}>✏️</button>{' '}
                  <button style={btnDanger} onClick={() => remove(f.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinishingFormInner({ initial, onSave, onCancel }: { initial: any; onSave: (f: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState(initial || { key: '', name: '', cost_per_m2: 0, time_hours_per_m2: 0.3, is_active: true, sort_order: 0 });
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  return (
    <>
      <div><label style={{ fontSize: 12, fontWeight: 600 }}>Key</label><input style={inputStyle} value={form.key} onChange={e => set('key', e.target.value)} /></div>
      <div><label style={{ fontSize: 12, fontWeight: 600 }}>Нэр</label><input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} /></div>
      <div><label style={{ fontSize: 12, fontWeight: 600 }}>₮/м²</label><input style={inputStyle} type="number" value={form.cost_per_m2} onChange={e => set('cost_per_m2', Number(e.target.value))} /></div>
      <div><label style={{ fontSize: 12, fontWeight: 600 }}>Цаг/м²</label><input style={inputStyle} type="number" step="0.01" value={form.time_hours_per_m2} onChange={e => set('time_hours_per_m2', Number(e.target.value))} /></div>
      <div style={{ display: 'flex', alignItems: 'end', gap: 8, gridColumn: 'span 2' }}>
        <button style={btnPrimary} onClick={() => onSave(form)}>Хадгалах</button>
        <button style={btnSmall} onClick={onCancel}>Болих</button>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════
 *  MARGINS TAB
 * ═══════════════════════════════════════ */

function MarginsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const data = await apiFetch('/pricing-catalog/margins');
    setItems(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (form: any) => {
    if (form.id) {
      await apiFetch(`/pricing-catalog/margins/${form.id}`, { method: 'PATCH', body: JSON.stringify(form) });
    } else {
      await apiFetch('/pricing-catalog/margins', { method: 'POST', body: JSON.stringify(form) });
    }
    setShowForm(false); setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Устгах уу?')) return;
    await apiFetch(`/pricing-catalog/margins/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Ашгийн дүрэм ({items.length})</h2>
        <button style={btnPrimary} onClick={() => { setEditing(null); setShowForm(true); }}>+ Нэмэх</button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 8, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          <div><label style={{ fontSize: 12, fontWeight: 600 }}>Key</label><input style={inputStyle} value={editing?.key || ''} onChange={e => setEditing({ ...editing, key: e.target.value })} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600 }}>Нэр</label><input style={inputStyle} value={editing?.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600 }}>Ашгийн хувь (0.45=45%)</label><input style={inputStyle} type="number" step="0.01" value={editing?.margin_rate || 0} onChange={e => setEditing({ ...editing, margin_rate: Number(e.target.value) })} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600 }}>Тайлбар</label><input style={inputStyle} value={editing?.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} /></div>
          <div style={{ display: 'flex', alignItems: 'end', gap: 8, gridColumn: 'span 2' }}>
            <button style={btnPrimary} onClick={() => save(editing)}>Хадгалах</button>
            <button style={btnSmall} onClick={() => { setShowForm(false); setEditing(null); }}>Болих</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
        {items.map(m => (
          <div key={m.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{m.name}</strong>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand)' }}>{(Number(m.margin_rate) * 100).toFixed(0)}%</span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{m.description}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
              <button style={btnSmall} onClick={() => { setEditing(m); setShowForm(true); }}>✏️ Засах</button>
              <button style={btnDanger} onClick={() => remove(m.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
 *  MAPPINGS TAB (Material → Machine)
 * ═══════════════════════════════════════ */

function MappingsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ material_key: '', machine_key: '', min_quantity: 0, max_quantity: 999999, priority: 10 });

  const load = useCallback(async () => {
    const [maps, mats, machs] = await Promise.all([
      apiFetch('/pricing-catalog/mappings'),
      apiFetch('/pricing-catalog/materials'),
      apiFetch('/pricing-catalog/machines'),
    ]);
    setItems(Array.isArray(maps) ? maps : []);
    setMaterials(Array.isArray(mats) ? mats : []);
    setMachines(Array.isArray(machs) ? machs : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (form.id) {
      await apiFetch(`/pricing-catalog/mappings/${form.id}`, { method: 'PATCH', body: JSON.stringify(form) });
    } else {
      await apiFetch('/pricing-catalog/mappings', { method: 'POST', body: JSON.stringify(form) });
    }
    setShowForm(false); setForm({ material_key: '', machine_key: '', min_quantity: 0, max_quantity: 999999, priority: 10 }); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Устгах уу?')) return;
    await apiFetch(`/pricing-catalog/mappings/${id}`, { method: 'DELETE' });
    load();
  };

  const matName = (key: string) => materials.find(m => m.key === key)?.name || key;
  const machName = (key: string) => machines.find(m => m.key === key)?.name || key;

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Материал → Машин холбоос ({items.length})</h2>
        <button style={btnPrimary} onClick={() => setShowForm(true)}>+ Нэмэх</button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 8, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Материал</label>
            <select style={inputStyle} value={form.material_key} onChange={e => setForm({ ...form, material_key: e.target.value })}>
              <option value="">-- Сонгох --</option>
              {materials.map(m => <option key={m.key} value={m.key}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Машин</label>
            <select style={inputStyle} value={form.machine_key} onChange={e => setForm({ ...form, machine_key: e.target.value })}>
              <option value="">-- Сонгох --</option>
              {machines.map(m => <option key={m.key} value={m.key}>{m.name}</option>)}
            </select>
          </div>
          <div><label style={{ fontSize: 12, fontWeight: 600 }}>Мин тоо</label><input style={inputStyle} type="number" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: Number(e.target.value) })} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600 }}>Макс тоо</label><input style={inputStyle} type="number" value={form.max_quantity} onChange={e => setForm({ ...form, max_quantity: Number(e.target.value) })} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600 }}>Ач холбогдол</label><input style={inputStyle} type="number" value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })} /></div>
          <div style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
            <button style={btnPrimary} onClick={save}>Хадгалах</button>
            <button style={btnSmall} onClick={() => setShowForm(false)}>Болих</button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Материал</th>
              <th style={thStyle}>Машин</th>
              <th style={thStyle}>Тоо хэмжээ</th>
              <th style={thStyle}>Ач холбогдол</th>
              <th style={thStyle}>Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {items.map(m => (
              <tr key={m.id}>
                <td style={tdStyle}>{matName(m.material_key)}</td>
                <td style={tdStyle}>{machName(m.machine_key)}</td>
                <td style={tdStyle}>{m.min_quantity} — {m.max_quantity}</td>
                <td style={tdStyle}>{m.priority}</td>
                <td style={tdStyle}>
                  <button style={btnSmall} onClick={() => { setForm(m); setShowForm(true); }}>✏️</button>{' '}
                  <button style={btnDanger} onClick={() => remove(m.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
 *  LETTER PRICES TAB
 * ═══════════════════════════════════════ */

function LetterPricesTab() {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ size_cm: 0, price_per_letter: 0, is_active: true });

  const load = useCallback(async () => {
    const data = await apiFetch('/pricing-catalog/letter-prices');
    setItems(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (form.id) {
      await apiFetch(`/pricing-catalog/letter-prices/${form.id}`, { method: 'PATCH', body: JSON.stringify(form) });
    } else {
      await apiFetch('/pricing-catalog/letter-prices', { method: 'POST', body: JSON.stringify(form) });
    }
    setShowForm(false); setForm({ size_cm: 0, price_per_letter: 0, is_active: true }); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Устгах уу?')) return;
    await apiFetch(`/pricing-catalog/letter-prices/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Товгор үсэг үнэ ({items.length})</h2>
        <button style={btnPrimary} onClick={() => setShowForm(true)}>+ Нэмэх</button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 8, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          <div><label style={{ fontSize: 12, fontWeight: 600 }}>Хэмжээ (см)</label><input style={inputStyle} type="number" value={form.size_cm} onChange={e => setForm({ ...form, size_cm: Number(e.target.value) })} /></div>
          <div><label style={{ fontSize: 12, fontWeight: 600 }}>₮/ширхэг</label><input style={inputStyle} type="number" value={form.price_per_letter} onChange={e => setForm({ ...form, price_per_letter: Number(e.target.value) })} /></div>
          <div style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
            <button style={btnPrimary} onClick={save}>Хадгалах</button>
            <button style={btnSmall} onClick={() => setShowForm(false)}>Болих</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
        {items.map(l => (
          <div key={l.id} style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--brand)' }}>{l.size_cm}см</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{fmt(Number(l.price_per_letter))}₮</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>нэг үсэг</div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
              <button style={btnSmall} onClick={() => { setForm(l); setShowForm(true); }}>✏️</button>
              <button style={btnDanger} onClick={() => remove(l.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
