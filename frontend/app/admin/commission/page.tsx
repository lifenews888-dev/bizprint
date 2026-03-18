'use client';
import { useState, useEffect } from 'react';

const API = 'http://localhost:4000';
const F = "'Segoe UI',system-ui,sans-serif";

interface User {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  role: string;
}

interface WalletBalance {
  balance: number;
  total_earned: number;
  total_withdrawn: number;
}

interface WalletTx {
  id: string;
  source: string;
  amount: number;
  note: string;
  created_at: string;
}

export default function CommissionPage() {
  const [token, setToken] = useState('')
  const [activeTab, setActiveTab] = useState<'vendor' | 'payroll' | 'tax' | 'history'>('vendor')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [vendors, setVendors] = useState<User[]>([])
  const [designers, setDesigners] = useState<User[]>([])
  const [couriers, setCouriers] = useState<User[]>([])
  const [adminWallet, setAdminWallet] = useState<WalletBalance | null>(null)
  const [adminTx, setAdminTx] = useState<WalletTx[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({
    commission_rate: '15',
    designer_fee_per_job: '15000',
    courier_fee_per_delivery: '5000',
    sales_bonus_percent: '5',
    tax_nuat_percent: '10',
    tax_haoat_percent: '10',
  })
  const [vendorRates, setVendorRates] = useState<Record<string, string>>({})
  const [designerFees, setDesignerFees] = useState<Record<string, string>>({})

  useEffect(() => {
    const t = localStorage.getItem('token') || ''
    setToken(t)
    if (t) loadAll(t)
  }, [])

  async function loadAll(t: string) {
    try {
      const [sRes, uRes, wRes, tRes] = await Promise.all([
        fetch(`${API}/settings`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API}/wallet/balance`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API}/wallet/transactions`, { headers: { Authorization: `Bearer ${t}` } }),
      ])
      const sd = await sRes.json()
      const ud = await uRes.json()
      const wd = await wRes.json()
      const td = await tRes.json()

      const ns = { ...settings }
      const vr: Record<string, string> = {}
      const df: Record<string, string> = {}
      Object.entries(sd).forEach(([k, v]: [string, any]) => {
        if (k in ns) ns[k] = v
        if (k.startsWith('commission_vendor_')) vr[k.replace('commission_vendor_', '')] = v
        if (k.startsWith('designer_fee_') && k !== 'designer_fee_per_job') df[k.replace('designer_fee_', '')] = v
      })
      setSettings(ns)
      setVendorRates(vr)
      setDesignerFees(df)

      const users = Array.isArray(ud) ? ud : (ud.users || [])
      setVendors(users.filter((u: User) => u.role === 'vendor'))
      setDesigners(users.filter((u: User) => u.role === 'designer'))
      setCouriers(users.filter((u: User) => u.role === 'courier'))
      setAdminWallet(wd)
      setAdminTx(Array.isArray(td) ? td : [])
    } catch {}
  }

  async function saveSetting(key: string, value: string, label = '') {
    await fetch(`${API}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ key, value, label, type: 'number' }),
    })
  }

  async function saveAll() {
    setSaving(true); setMsg('')
    try {
      await Promise.all([
        saveSetting('commission_rate', settings.commission_rate, 'Default Commission Rate %'),
        saveSetting('designer_fee_per_job', settings.designer_fee_per_job, 'Designer Fee per Job'),
        saveSetting('courier_fee_per_delivery', settings.courier_fee_per_delivery, 'Courier Fee per Delivery'),
        saveSetting('sales_bonus_percent', settings.sales_bonus_percent, 'Sales Bonus %'),
        saveSetting('tax_nuat_percent', settings.tax_nuat_percent, 'NUAT Tax %'),
        saveSetting('tax_haoat_percent', settings.tax_haoat_percent, 'HAOAT Tax %'),
      ])
      for (const [id, rate] of Object.entries(vendorRates)) {
        if (rate) await saveSetting(`commission_vendor_${id}`, rate, `Vendor ${id} rate`)
      }
      for (const [id, fee] of Object.entries(designerFees)) {
        if (fee) await saveSetting(`designer_fee_${id}`, fee, `Designer ${id} fee`)
      }
      setMsg('All settings saved!')
    } catch { setMsg('Failed to save') }
    finally { setSaving(false) }
  }

  const setSetting = (key: string, value: string) => setSettings(s => ({ ...s, [key]: value }))

  const card = (children: React.ReactNode) => (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
      {children}
    </div>
  )

  const userRow = (u: User, color: string, extra?: React.ReactNode) => (
    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10, marginBottom: 8, border: '1px solid var(--border)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 7, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color, flexShrink: 0 }}>
        {(u.full_name || 'U')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{u.full_name || u.email}</div>
        <div style={{ fontSize: 11, color: 'var(--text2)' }}>{u.email}</div>
      </div>
      {extra}
    </div>
  )

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto', fontFamily: F }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Payroll & Commission</h1>
        <p style={{ color: 'var(--text2)', margin: '4px 0 0', fontSize: 14 }}>Manage commission, salaries and tax for all roles</p>
      </div>

      {adminWallet && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Platform Balance', value: `T${Number(adminWallet.balance).toLocaleString()}`, color: 'var(--orange)' },
            { label: 'Total Earned', value: `T${Number(adminWallet.total_earned).toLocaleString()}`, color: '#16a34a' },
            { label: 'Total Paid Out', value: `T${Number(adminWallet.total_withdrawn).toLocaleString()}`, color: '#2563eb' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {[
          { key: 'vendor', label: 'Vendor Commission' },
          { key: 'payroll', label: 'Payroll Rules' },
          { key: 'tax', label: 'Tax Settings' },
          { key: 'history', label: 'Transaction History' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{
            padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontFamily: F, fontSize: 13, fontWeight: 500, marginBottom: -1,
            color: activeTab === t.key ? 'var(--orange)' : 'var(--text2)',
            borderBottom: `2px solid ${activeTab === t.key ? 'var(--orange)' : 'transparent'}`,
          }}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'vendor' && (
        <>
          {card(<>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Default Commission Rate</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <input type="number" min="0" max="100" step="0.5" value={settings.commission_rate}
                  onChange={e => setSetting('commission_rate', e.target.value)}
                  style={{ width: 90, padding: '8px 28px 8px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface2)', color: 'var(--text)', fontSize: 18, fontWeight: 700, fontFamily: F }} />
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--orange)', fontWeight: 700 }}>%</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                Platform: {settings.commission_rate}% &nbsp;|&nbsp; Vendor: {100 - parseFloat(settings.commission_rate || '15')}%
              </div>
            </div>
          </>)}
          {card(<>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Per-Vendor Custom Rates</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>Leave empty to use default</div>
            {vendors.length === 0
              ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--text2)', fontSize: 13 }}>No vendors found</div>
              : vendors.map(v => {
                const rate = vendorRates[v.id] || ''
                const eff = rate || settings.commission_rate
                return userRow(v, '#f59e0b',
                  <>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginRight: 8 }}>P:{eff}% / V:{100 - parseFloat(eff)}%</div>
                    <div style={{ position: 'relative' }}>
                      <input type="number" min="0" max="100" step="0.5" placeholder={settings.commission_rate} value={rate}
                        onChange={e => setVendorRates(r => ({ ...r, [v.id]: e.target.value }))}
                        style={{ width: 70, padding: '6px 20px 6px 8px', border: `1px solid ${rate ? 'var(--orange)' : 'var(--border)'}`, borderRadius: 7, background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, fontFamily: F }} />
                      <span style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 11 }}>%</span>
                    </div>
                    {rate && <button onClick={() => setVendorRates(r => { const n = { ...r }; delete n[v.id]; return n })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16 }}>x</button>}
                  </>
                )
              })}
          </>)}
        </>
      )}

      {activeTab === 'payroll' && (
        <>
          {card(<>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Default Role Fees</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { key: 'designer_fee_per_job', label: 'Designer / Job', color: '#8b5cf6', suffix: 'T' },
                { key: 'courier_fee_per_delivery', label: 'Courier / Delivery', color: '#10b981', suffix: 'T' },
                { key: 'sales_bonus_percent', label: 'Sales Bonus', color: '#3b82f6', suffix: '%' },
              ].map(item => (
                <div key={item.key} style={{ padding: '12px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase' }}>{item.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="number" value={settings[item.key]} onChange={e => setSetting(item.key, e.target.value)}
                      style={{ flex: 1, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--surface)', color: item.color, fontSize: 15, fontWeight: 700, fontFamily: F }} />
                    <span style={{ color: item.color, fontWeight: 700 }}>{item.suffix}</span>
                  </div>
                </div>
              ))}
            </div>
          </>)}
          {card(<>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Per-Designer Custom Fees</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>Override default designer fee per person</div>
            {designers.length === 0
              ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--text2)', fontSize: 13 }}>No designers found</div>
              : designers.map(d => {
                const fee = designerFees[d.id] || ''
                return userRow(d, '#8b5cf6',
                  <>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginRight: 8 }}>{fee || settings.designer_fee_per_job}T</div>
                    <div style={{ position: 'relative' }}>
                      <input type="number" placeholder={settings.designer_fee_per_job} value={fee}
                        onChange={e => setDesignerFees(r => ({ ...r, [d.id]: e.target.value }))}
                        style={{ width: 90, padding: '6px 20px 6px 8px', border: `1px solid ${fee ? '#8b5cf6' : 'var(--border)'}`, borderRadius: 7, background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontFamily: F }} />
                      <span style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 11 }}>T</span>
                    </div>
                    {fee && <button onClick={() => setDesignerFees(r => { const n = { ...r }; delete n[d.id]; return n })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16 }}>x</button>}
                  </>
                )
              })}
          </>)}
          {couriers.length > 0 && card(<>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Couriers ({couriers.length})</div>
            {couriers.map(c => userRow(c, '#10b981',
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{settings.courier_fee_per_delivery}T / delivery</div>
            ))}
          </>)}
        </>
      )}

      {activeTab === 'tax' && card(<>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Tax Settings</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>Automatically deducted before crediting wallets</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { key: 'tax_nuat_percent', label: 'NUAT (Value Added Tax)', desc: 'Applied to vendor commissions' },
            { key: 'tax_haoat_percent', label: 'HAOAT (Income Tax)', desc: 'Applied to designer and courier fees' },
          ].map(item => (
            <div key={item.key} style={{ padding: '16px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 12 }}>{item.desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <input type="number" min="0" max="50" step="0.5" value={settings[item.key]}
                  onChange={e => setSetting(item.key, e.target.value)}
                  style={{ width: 80, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--surface)', color: 'var(--text)', fontSize: 18, fontWeight: 700, fontFamily: F }} />
                <span style={{ color: 'var(--orange)', fontWeight: 700, fontSize: 18 }}>%</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                100,000T income  {Math.round(100000 * parseFloat(settings[item.key] || '0') / 100).toLocaleString()}T tax deducted
              </div>
            </div>
          ))}
        </div>
      </>)}

      {activeTab === 'history' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            Platform Transactions ({adminTx.length})
          </div>
          {adminTx.length === 0
            ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}><div style={{ fontSize: 32, marginBottom: 8 }}>=</div>No transactions yet</div>
            : adminTx.map(tx => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--orange-10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>=</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{tx.note || tx.source}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{new Date(tx.created_at).toLocaleString()}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>+T{Number(tx.amount).toLocaleString()}</div>
              </div>
            ))}
        </div>
      )}

      {activeTab !== 'history' && (
        <div style={{ marginTop: 20 }}>
          {msg && <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 12, fontSize: 13, background: msg.includes('saved') ? '#dcfce7' : '#fee2e2', color: msg.includes('saved') ? '#16a34a' : '#dc2626' }}>{msg}</div>}
          <button onClick={saveAll} disabled={saving} style={{ padding: '11px 28px', background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: F, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      )}
    </div>
  )
}
