'use client'
import { apiFetch } from '@/lib/api'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import KpiCard from '@/components/dashboard/KpiCard'
import EmptyState from '@/components/dashboard/EmptyState'
import { useRoleGuard } from '@/lib/use-role-guard'
import { DESIGNER_MENU } from '@/config/sidebar-config'

interface WalletTx { id: string; amount: number; type: string; reference?: string; description?: string; created_at: string }

export default function DesignerEarningsPage() {
  const { user, loading: authLoading } = useRoleGuard(['designer', 'admin'])
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<WalletTx[]>([])
  const [royalties, setRoyalties] = useState<any[]>([])
  const [royaltySummary, setRoyaltySummary] = useState<{ pendingAmount: number; paidAmount: number; totalOrders: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankName, setBankName] = useState('')
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!authLoading && user) loadData()
  }, [authLoading, user])

  async function loadData() {
    setLoading(true)
    try {
      const bData = await apiFetch<any>(`/wallet/balance`)
      setBalance(bData?.balance || bData || 0)
    } catch {}
    try {
      const tData = await apiFetch<any>(`/wallet/transactions`)
      setTransactions(Array.isArray(tData) ? tData : [])
    } catch {}
    try {
      const rData = await apiFetch<any>('/commission/designer/me').catch(() => [])
      setRoyalties(Array.isArray(rData) ? rData : [])
      const sum = await apiFetch<any>('/commission/designer/me/summary').catch(() => null)
      if (sum) setRoyaltySummary(sum)
    } catch {}
    setLoading(false)
  }

  async function requestWithdraw() {
    const amount = Number(withdrawAmount)
    if (!amount || amount < 1000) { setToast('Хамгийн бага 1,000₮'); setTimeout(() => setToast(''), 3000); return }
    if (amount > Number(balance)) { setToast('Үлдэгдэл хүрэлцэхгүй'); setTimeout(() => setToast(''), 3000); return }
    if (!bankAccount || !bankName) { setToast('Банкны мэдээлэл оруулна уу'); setTimeout(() => setToast(''), 3000); return }
    try {
      await apiFetch<any>(`/wallet/withdraw`, {
        method: 'POST',
        body: { amount, bank_name: bankName, bank_account: bankAccount },
      })
      setToast('Татан авах хүсэлт илгээгдлээ')
      setShowWithdraw(false)
      setWithdrawAmount(''); setBankAccount(''); setBankName('')
      loadData()
    } catch { setToast('Алдаа гарлаа') }
    setTimeout(() => setToast(''), 3000)
  }

  const totalEarned = transactions.filter(t => t.type === 'credit' || t.amount > 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalWithdrawn = transactions.filter(t => t.type === 'debit' || t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const TAX_RATE = 0.10

  if (authLoading) return <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Ачааллаж байна...</div>

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }

  return (
    <DashboardLayout navGroups={DESIGNER_MENU} user={user || undefined}>
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#1D9E75', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>{toast}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Орлого & Хэтэвч</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Орлого хянах, банкны данс руу татах</p>
        </div>
        <button onClick={() => setShowWithdraw(!showWithdraw)} style={{ padding: '10px 20px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          💳 Татан авах
        </button>
      </div>

      <KpiCard items={[
        { label: 'Одоогийн үлдэгдэл', value: Number(balance).toLocaleString() + '₮', color: 'green', icon: '💰' },
        { label: 'Нийт олсон', value: totalEarned.toLocaleString() + '₮', color: 'purple', icon: '📈' },
        { label: 'Татан авсан', value: totalWithdrawn.toLocaleString() + '₮', color: 'blue', icon: '🏦' },
        { label: 'Татвар (10%)', value: Math.round(totalEarned * TAX_RATE).toLocaleString() + '₮', color: 'orange', icon: '📋' },
      ]} />

      {/* Template royalty — separate from wallet balance so designers can
          track earnings from template usage before they're released. */}
      {(royalties.length > 0 || royaltySummary) && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>🎨 Загварын royalty</h3>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>48 цагийн hold хугацаа</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
            <div style={{ padding: 12, background: 'var(--surface2)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Ашигласан захиалга</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{royaltySummary?.totalOrders ?? royalties.length}</div>
            </div>
            <div style={{ padding: 12, background: 'var(--surface2)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Хүлээгдэж буй</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#F59E0B', marginTop: 2 }}>₮{(royaltySummary?.pendingAmount || 0).toLocaleString()}</div>
            </div>
            <div style={{ padding: 12, background: 'var(--surface2)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Олсон royalty</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#10B981', marginTop: 2 }}>₮{(royaltySummary?.paidAmount || 0).toLocaleString()}</div>
            </div>
          </div>
          {royalties.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflow: 'auto' }}>
              {royalties.slice(0, 10).map((r: any) => (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 100px', gap: 12, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 6, fontSize: 12, alignItems: 'center' }}>
                  <span style={{ color: 'var(--text2)' }}>{r.template_name || r.template_id?.slice(0, 8)}</span>
                  <span style={{ textAlign: 'right' }}>₮{Number(r.order_total).toLocaleString()}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text3)' }}>{r.royalty_rate}%</span>
                  <span style={{ textAlign: 'right', fontWeight: 600, color: r.status === 'approved' || r.status === 'paid' ? '#10B981' : '#F59E0B' }}>
                    ₮{Number(r.royalty_amount).toLocaleString()} {r.status === 'pending' ? '⏳' : '✓'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Withdraw form */}
      {showWithdraw && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Татан авах хүсэлт</h3>
          <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#eab308' }}>
            ⚠️ Татвар 10% суутгагдсан дүн таны банкны данс руу шилжинэ. Хүсэлт 1-3 ажлын өдөрт шийдвэрлэгдэнэ.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Дүн (₮)</label><input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="50000" style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Банк</label><input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Хаан банк" style={inp} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Данс</label><input value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="5000123456" style={inp} /></div>
          </div>
          {withdrawAmount && Number(withdrawAmount) > 0 && (
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
              Татвар суутгасан дүн: <strong style={{ color: '#10B981' }}>{Math.round(Number(withdrawAmount) * (1 - TAX_RATE)).toLocaleString()}₮</strong>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={requestWithdraw} style={{ padding: '10px 20px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Хүсэлт илгээх</button>
            <button onClick={() => setShowWithdraw(false)} style={{ padding: '10px 20px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Болих</button>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 15 }}>Гүйлгээний түүх</div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>Ачааллаж байна...</div>
        ) : transactions.length === 0 ? (
          <EmptyState icon="💳" title="Гүйлгээ байхгүй" message="Загвар борлуулах, эх бэлтгэл хийхэд орлого орно" />
        ) : transactions.map((tx, i) => {
          const isCredit = tx.type === 'credit' || tx.amount > 0
          return (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: i < transactions.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{tx.description || (isCredit ? 'Орлого' : 'Татан авалт')}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{new Date(tx.created_at).toLocaleDateString('mn-MN')}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: isCredit ? '#10B981' : '#EF4444' }}>
                {isCredit ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}₮
              </div>
            </div>
          )
        })}
      </div>
    </DashboardLayout>
  )
}
