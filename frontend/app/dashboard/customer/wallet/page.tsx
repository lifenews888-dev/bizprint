'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface WalletBalance {
  balance: number
  total_earned: number
  total_withdrawn: number
}

interface WalletTransaction {
  id: number
  type: 'credit' | 'debit' | 'withdraw' | 'commission' | 'payment'
  source: string
  amount: number
  balance_after: number
  status?: 'pending' | 'approved' | 'rejected'
  note?: string
  created_at: string
}

interface UserInfo {
  id: number
  email: string
  role: 'sales' | 'designer' | 'factory' | 'courier' | 'customer' | 'admin'
  name?: string
}

const API = 'http://localhost:4000'

const ROLE_CONFIG = {
  sales:    { title: 'Комиссын хэтэвч',   color: '#3B82F6', icon: '💼', earnLabel: 'Нийт комисс' },
  designer: { title: 'Орлогын хэтэвч',    color: '#8B5CF6', icon: '🎨', earnLabel: 'Нийт орлого' },
  factory:  { title: 'Төлбөрийн хэтэвч',  color: '#10B981', icon: '🏭', earnLabel: 'Нийт төлбөр' },
  courier:  { title: 'Хүргэлтийн орлого', color: '#F59E0B', icon: '🚚', earnLabel: 'Нийт орлого' },
  customer: { title: 'Миний хэтэвч',      color: '#FF6B35', icon: '👤', earnLabel: 'Нийт дүн'    },
  admin:    { title: 'Системийн хэтэвч',  color: '#FF6B35', icon: '⚙️', earnLabel: 'Нийт дүн'    },
} as const

const TX_LABEL: Record<string, { label: string; color: string }> = {
  credit:     { label: 'Орлого',  color: '#10B981' },
  debit:      { label: 'Зарлага', color: '#EF4444' },
  withdraw:   { label: 'Татах',   color: '#F59E0B' },
  commission: { label: 'Комисс',  color: '#3B82F6' },
  payment:    { label: 'Төлбөр',  color: '#8B5CF6' },
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Хүлээгдэж байна', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  approved: { label: 'Батлагдсан',      color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  rejected: { label: 'Татгалзсан',      color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
}

function getToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('access_token') || ''
}
function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() }
}
function formatDate(str: string) {
  return new Date(str).toLocaleString('mn-MN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function WalletPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'credit' | 'withdraw'>('all')
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawNote, setWithdrawNote] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/login'); return }
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [meRes, balRes, txRes] = await Promise.all([
        fetch(API + '/auth/me', { headers: authHeaders() }),
        fetch(API + '/wallet/balance', { headers: authHeaders() }),
        fetch(API + '/wallet/transactions', { headers: authHeaders() }),
      ])
      if (meRes.ok) setUser(await meRes.json())
      if (balRes.ok) setBalance(await balRes.json())
      if (txRes.ok) setTransactions(await txRes.json())
    } catch {}
    setLoading(false)
  }

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function submitWithdraw() {
    setWithdrawError('')
    const amount = Number(withdrawAmount)
    if (!amount || amount < 10000) { setWithdrawError('Хамгийн бага татах дүн: 10,000 төгрөг'); return }
    if (balance && amount > balance.balance) { setWithdrawError('Балансаас их дүн оруулах боломжгүй'); return }
    setWithdrawing(true)
    try {
      const res = await fetch(API + '/wallet/withdraw', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ amount, note: withdrawNote }),
      })
      if (!res.ok) throw new Error()
      showToast('Татах хүсэлт илгээгдлээ. Admin батлах хүртэл хүлээнэ үү.')
      setShowWithdraw(false)
      setWithdrawAmount('')
      setWithdrawNote('')
      fetchAll()
    } catch { setWithdrawError('Алдаа гарлаа. Дахин оролдоно уу.') }
    setWithdrawing(false)
  }

  const filtered = transactions.filter(tx => {
    if (tab === 'credit') return tx.type === 'credit' || tx.type === 'commission' || tx.type === 'payment'
    if (tab === 'withdraw') return tx.type === 'withdraw'
    return true
  })

  const roleKey = (user?.role || 'customer') as keyof typeof ROLE_CONFIG
  const rc = ROLE_CONFIG[roleKey] || ROLE_CONFIG.customer
  const pendingCount = transactions.filter(tx => tx.type === 'withdraw' && tx.status === 'pending').length

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text2)', fontFamily: "'DM Sans',system-ui" }}>
      Уншиж байна...
    </div>
  )
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans','Segoe UI',system-ui", color: 'var(--text)' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.type === 'ok' ? '#10B981' : '#EF4444', color: '#fff', padding: '14px 22px', borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: '0 4px 24px rgba(0,0,0,0.3)', maxWidth: 360, lineHeight: 1.5 }}>
          {toast.type === 'ok' ? 'checkmark ' : 'x '}{toast.msg}
        </div>
      )}

      <div style={{ background: 'linear-gradient(135deg,' + rc.color + ' 0%,' + rc.color + 'cc 100%)', padding: '40px 48px 36px', color: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{rc.icon}</div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px' }}>{rc.title}</h1>
              <div style={{ opacity: 0.85, fontSize: 14 }}>{user?.name || user?.email}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 16, padding: '20px 28px', textAlign: 'right' }}>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Боломжит баланс</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{(balance?.balance || 0).toLocaleString()}<span style={{ fontSize: 16, fontWeight: 400, marginLeft: 4 }}>₮</span></div>
              <button onClick={() => setShowWithdraw(true)} disabled={!balance?.balance || balance.balance < 10000}
                style={{ marginTop: 14, background: balance?.balance && balance.balance >= 10000 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.3)', color: balance?.balance && balance.balance >= 10000 ? rc.color : 'rgba(255,255,255,0.6)', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: balance?.balance && balance.balance >= 10000 ? 'pointer' : 'not-allowed' }}>
                Татах хүсэлт
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 28 }}>
            {[{ label: rc.earnLabel, value: balance?.total_earned || 0 }, { label: 'Нийт татсан', value: balance?.total_withdrawn || 0 }].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 16px' }}>
                <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{s.value.toLocaleString()}₮</div>
              </div>
            ))}
            {pendingCount > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 16px' }}>
                <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 3 }}>Хүлээгдэж байна</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{pendingCount} хүсэлт</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 48px' }}>
        {pendingCount > 0 && (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⏳</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#F59E0B' }}>{pendingCount} татах хүсэлт хүлээгдэж байна</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Admin батлах хүртэл 1-2 ажлын өдөр хүлээнэ үү</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
          {[{ key: 'all', label: 'Бүх гүйлгээ' }, { key: 'credit', label: 'Орлого' }, { key: 'withdraw', label: 'Татах' }].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as 'all' | 'credit' | 'withdraw')} style={{ background: 'none', border: 'none', padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: tab === t.key ? rc.color : 'var(--text2)', borderBottom: tab === t.key ? '2px solid ' + rc.color : '2px solid transparent', marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 13, color: 'var(--text2)' }}>{filtered.length} гүйлгээ</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
            <div style={{ fontWeight: 600 }}>Гүйлгээ байхгүй</div>
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 140px 140px 120px', padding: '10px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              <span>Гүйлгээ</span><span>Төрөл</span><span style={{ textAlign: 'right' }}>Дүн</span><span style={{ textAlign: 'right' }}>Баланс</span><span style={{ textAlign: 'right' }}>Огноо</span>
            </div>
            {filtered.map((tx, i) => {
              const txType = TX_LABEL[tx.type] || { label: tx.type, color: 'var(--text2)' }
              const isCredit = tx.type === 'credit' || tx.type === 'commission' || tx.type === 'payment'
              const st = tx.status ? STATUS_LABEL[tx.status] : null
              return (
                <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 140px 140px 120px', padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', fontSize: 14 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{tx.source || 'Гүйлгээ'}</div>
                    {tx.note && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{tx.note}</div>}
                    {st && <span style={{ display: 'inline-block', marginTop: 4, background: st.bg, color: st.color, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{st.label}</span>}
                  </div>
                  <span style={{ background: txType.color + '18', color: txType.color, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 600, width: 'fit-content' }}>{txType.label}</span>
                  <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, color: isCredit ? '#10B981' : '#EF4444' }}>{isCredit ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}₮</div>
                  <div style={{ textAlign: 'right', color: 'var(--text2)', fontSize: 13 }}>{tx.balance_after.toLocaleString()}₮</div>
                  <div style={{ textAlign: 'right', color: 'var(--text2)', fontSize: 12 }}>{formatDate(tx.created_at)}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showWithdraw && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, width: 460, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Мөнгө татах хүсэлт</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--text2)', fontSize: 13 }}>Admin батлах хүртэл 1-2 ажлын өдөр хүлээнэ үү</p>
              </div>
              <button onClick={() => { setShowWithdraw(false); setWithdrawError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 22 }}>x</button>
            </div>
            <div style={{ background: rc.color + '12', border: '1px solid ' + rc.color + '33', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>Боломжит баланс</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: rc.color }}>{(balance?.balance || 0).toLocaleString()}₮</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Татах дүн *</div>
              <div style={{ position: 'relative' }}>
                <input type="number" value={withdrawAmount} onChange={e => { setWithdrawAmount(e.target.value); setWithdrawError('') }} placeholder="10000"
                  style={{ width: '100%', padding: '12px 44px 12px 14px', background: 'var(--surface2)', border: '1px solid ' + (withdrawError ? '#EF4444' : 'var(--border)'), borderRadius: 8, fontSize: 16, fontWeight: 600, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text2)', fontWeight: 600 }}>₮</span>
              </div>
              {withdrawError && <div style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{withdrawError}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {[50000, 100000, 200000, 500000].filter(v => v <= (balance?.balance || 0)).map(v => (
                  <button key={v} onClick={() => setWithdrawAmount(String(v))} style={{ background: withdrawAmount === String(v) ? rc.color : 'var(--surface2)', color: withdrawAmount === String(v) ? '#fff' : 'var(--text2)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>{(v/1000).toFixed(0)}к</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Тайлбар</div>
              <input value={withdrawNote} onChange={e => setWithdrawNote(e.target.value)} placeholder="Банкны дансны мэдээлэл гэх мэт..."
                style={{ width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
              Хүсэлт илгээгдсэний дараа admin баталгаажуулна. Батлагдсаны дараа л балансаас хасагдана.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowWithdraw(false); setWithdrawError('') }} style={{ flex: 1, padding: '12px', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Болих</button>
              <button onClick={submitWithdraw} disabled={withdrawing} style={{ flex: 2, padding: '12px', background: withdrawing ? 'var(--border)' : rc.color, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: withdrawing ? 'not-allowed' : 'pointer' }}>
                {withdrawing ? 'Илгээж байна...' : 'Хүсэлт илгээх'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}