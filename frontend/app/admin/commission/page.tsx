'use client';
import { useState, useEffect } from 'react';

const API = 'http://localhost:4000';
const F = "'DM Sans','Segoe UI',system-ui,sans-serif";
const getToken = () => localStorage.getItem('access_token') || localStorage.getItem('token') || '';

interface Vendor {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  role: string;
}

interface CommissionRule {
  vendor_id: string;
  vendor_name: string;
  rate: number;
}

interface WalletTx {
  id: string;
  type: string;
  source: string;
  amount: number;
  balance_after: number;
  note: string;
  status: string;
  created_at: string;
}

interface WalletBalance {
  balance: number;
  total_earned: number;
  total_withdrawn: number;
}

export default function CommissionPage() {
  const [token, setToken] = useState('');
  const [defaultRate, setDefaultRate] = useState('15');
  const [roleRates, setRoleRates] = useState({
    designer: '20',
    sales: '10',
    factory: '50',
    delivery: '10',
    admin: '10',
  });
  const [saving, setSaving] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [rules, setRules] = useState<Record<string, string>>({});
  const [adminWallet, setAdminWallet] = useState<WalletBalance | null>(null);
  const [adminTx, setAdminTx] = useState<WalletTx[]>([]);
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
    setToken(t);
    if (t) {
      loadSettings(t);
      loadVendors(t);
      loadAdminWallet(t);
    }
  }, []);

  async function loadSettings(t: string) {
    try {
      const res = await fetch(`${API}/settings`, { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      if (data.commission_rate) setDefaultRate(data.commission_rate);
      setRoleRates(r => ({
        designer: data.commission_role_designer || r.designer,
        sales: data.commission_role_sales || r.sales,
        factory: data.commission_role_factory || r.factory,
        delivery: data.commission_role_delivery || r.delivery,
        admin: data.commission_role_admin || r.admin,
      }));
      // Per-vendor rules
      const vendorRules: Record<string, string> = {};
      Object.keys(data).forEach(k => {
        if (k.startsWith('commission_vendor_')) {
          const vendorId = k.replace('commission_vendor_', '');
          vendorRules[vendorId] = data[k];
        }
      });
      setRules(vendorRules);
    } catch {}
  }

  async function loadVendors(t: string) {
    try {
      const res = await fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.users || []);
      setVendors(list.filter((u: Vendor) => u.role === 'vendor'));
    } catch {}
  }

  async function loadAdminWallet(t: string) {
    try {
      const res = await fetch(`${API}/wallet/balance`, { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      setAdminWallet(data);
      const txRes = await fetch(`${API}/wallet/transactions`, { headers: { Authorization: `Bearer ${t}` } });
      const txData = await txRes.json();
      setAdminTx(Array.isArray(txData) ? txData.filter((tx: WalletTx) => tx.source === 'platform_commission' || tx.source === 'order_commission') : []);
    } catch {}
  }

  async function saveSettings() {
    setSaving(true);
    setMsg('');
    try {
      // Save default rate
      await fetch(`${API}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ key: 'commission_rate', value: defaultRate, label: 'Default Commission Rate %', type: 'number' }),
      });

      // Save role splits
      for (const [role, rate] of Object.entries(roleRates)) {
        await fetch(`${API}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({
            key: `commission_role_${role}`,
            value: rate,
            label: `Commission split for ${role}`,
            type: 'number',
          }),
        });
      }

      // Save per-vendor rates
      for (const [vendorId, rate] of Object.entries(rules)) {
        if (rate) {
          await fetch(`${API}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({
              key: `commission_vendor_${vendorId}`,
              value: rate,
              label: `Vendor ${vendorId} commission rate`,
              type: 'number',
            }),
          });
        }
      }
      setMsg('Тохиргоо амжилттай хадгалагдлаа!');
    } catch {
      setMsg('Хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  }

  const effectiveRate = (vendorId: string) => rules[vendorId] || defaultRate;
  const roleTotal = ['designer', 'sales', 'factory', 'delivery', 'admin']
    .reduce((s, k) => s + parseFloat(roleRates[k as keyof typeof roleRates] || '0'), 0);

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto', fontFamily: F }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Комисс систем</h1>
        <p style={{ color: 'var(--text2)', margin: '4px 0 0', fontSize: 14 }}>
          Платформын комисс хувь болон вендорын орлогыг удирдах
        </p>
      </div>

      {/* Admin wallet stats */}
      {adminWallet && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Платформ баланс', value: `₮${Number(adminWallet.balance).toLocaleString()}`, color: 'var(--orange)' },
            { label: 'Нийт орлого', value: `₮${Number(adminWallet.total_earned).toLocaleString()}`, color: '#16a34a' },
            { label: 'Нийт татсан', value: `₮${Number(adminWallet.total_withdrawn).toLocaleString()}`, color: '#2563eb' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '16px 20px',
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[
          { key: 'settings', label: 'Комисс дүрэм' },
          { key: 'history', label: 'Гүйлгээний түүх' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{
            padding: '8px 16px', border: 'none', background: 'transparent',
            cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 500,
            color: activeTab === t.key ? 'var(--orange)' : 'var(--text2)',
            borderBottom: `2px solid ${activeTab === t.key ? 'var(--orange)' : 'transparent'}`,
            marginBottom: -1,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'settings' && (
        <div>
          {/* Default rate */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 20, marginBottom: 20,
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
              Үндсэн комисс хувь
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="number" min="0" max="100" step="0.5"
                  value={defaultRate}
                  onChange={e => setDefaultRate(e.target.value)}
                  style={{
                    width: 100, padding: '10px 32px 10px 12px',
                    border: '1px solid var(--border)', borderRadius: 8,
                    background: 'var(--surface2)', color: 'var(--text)',
                    fontSize: 18, fontWeight: 700, fontFamily: F,
                  }}
                />
                <span style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--orange)', fontWeight: 700, fontSize: 16,
                }}>%</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                Тусгай хувь тогтоогдоогүй бүх вендорт хамаарна
                <br />
                <span style={{ color: 'var(--text3)', fontSize: 12 }}>
                  Вендор авах: {100 - parseFloat(defaultRate || '15')}% &nbsp;|&nbsp;
                  Платформ авах: {defaultRate || '15'}%
                </span>
              </div>
            </div>
          </div>

          {/* Role-based splits */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 20, marginBottom: 20,
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
              Role-based distribution
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text2)' }}>
              Дизайнер / Борлуулагч / Үйлдвэр / Хүргэлт / Админ хувь. Нийт 100% байх ёстой.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10 }}>
              {[
                { key: 'designer', label: 'Дизайнер' },
                { key: 'sales', label: 'Борлуулагч' },
                { key: 'factory', label: 'Үйлдвэр' },
                { key: 'delivery', label: 'Хүргэлт' },
                { key: 'admin', label: 'Админ' },
              ].map(r => (
                <div key={r.key} style={{ position: 'relative' }}>
                  <label style={{ fontSize: 12, color: 'var(--text2)' }}>{r.label}</label>
                  <input
                    type="number" min="0" max="100" step="0.5"
                    value={roleRates[r.key as keyof typeof roleRates]}
                    onChange={e => setRoleRates(prev => ({ ...prev, [r.key]: e.target.value }))}
                    style={{
                      width: '100%', padding: '8px 26px 8px 10px',
                      border: '1px solid var(--border)', borderRadius: 8,
                      background: 'var(--surface2)', color: 'var(--text)',
                      fontWeight: 600, fontSize: 14,
                    }}
                  />
                  <span style={{
                    position: 'absolute', right: 10, bottom: 10,
                    fontWeight: 700, color: 'var(--text3)'
                  }}>%</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: roleTotal === 100 ? '#16a34a' : '#dc2626' }}>
              Нийт: {roleTotal}% {roleTotal === 100 ? '(OK)' : '(100% болгоно уу)'}
            </div>
          </div>

          {/* Per-vendor rates */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 20, marginBottom: 20,
          }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
              Вендор тус бүрийн тусгай хувь
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text2)' }}>
              Хоосон орхивол үндсэн хувь хэрэглэгдэнэ
            </p>

            {vendors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text2)', fontSize: 13 }}>
                Вендор олдсонгүй
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {vendors.map(v => {
                  const rate = rules[v.id] || '';
                  const effective = rate || defaultRate;
                  const vendorShare = 100 - parseFloat(effective);
                  return (
                    <div key={v.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', background: 'var(--surface2)',
                      borderRadius: 10, border: '1px solid var(--border)',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: 'var(--orange-10)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: 'var(--orange)', flexShrink: 0,
                      }}>
                        {(v.full_name || v.email || 'V')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                          {v.full_name || v.email}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                          {v.company_name || v.email} &nbsp;·&nbsp;
                          Платформ {effective}% / Вендор {vendorShare}%
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 12, color: 'var(--text2)' }}>Тусгай хувь:</div>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="number" min="0" max="100" step="0.5"
                            placeholder={defaultRate}
                            value={rate}
                            onChange={e => setRules(r => ({ ...r, [v.id]: e.target.value }))}
                            style={{
                              width: 80, padding: '6px 24px 6px 10px',
                              border: `1px solid ${rate ? 'var(--orange)' : 'var(--border)'}`,
                              borderRadius: 7, background: 'var(--surface)',
                              color: 'var(--text)', fontSize: 14, fontWeight: 600, fontFamily: F,
                            }}
                          />
                          <span style={{
                            position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
                            color: rate ? 'var(--orange)' : 'var(--text3)', fontWeight: 700, fontSize: 13,
                          }}>%</span>
                        </div>
                        {rate && (
                          <button onClick={() => setRules(r => { const nr = { ...r }; delete nr[v.id]; return nr; })} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text3)', fontSize: 16, padding: '0 4px',
                          }}>×</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {msg && (
            <div style={{
              padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13,
              background: msg.includes('амжилт') ? '#dcfce7' : '#fee2e2',
              color: msg.includes('амжилт') ? '#16a34a' : '#dc2626',
            }}>
              {msg}
            </div>
          )}

          <button onClick={saveSettings} disabled={saving || roleTotal !== 100} style={{
            padding: '11px 28px', background: 'var(--orange)', color: '#fff',
            border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14,
            cursor: saving || roleTotal !== 100 ? 'not-allowed' : 'pointer', fontFamily: F,
            opacity: saving || roleTotal !== 100 ? 0.7 : 1,
          }}>
            {saving ? 'Хадгалж байна...' : 'Комисс дүрэм хадгалах'}
          </button>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            Платформын комисс гүйлгээнүүд
          </div>
          {adminTx.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💰</div>
              Комисс гүйлгээ байхгүй байна
            </div>
          ) : (
            <div>
              {adminTx.map(tx => (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px', borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'var(--orange-10)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 14,
                  }}>
                    💳
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{tx.note || tx.source}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                      {new Date(tx.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>
                    +₮{Number(tx.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
