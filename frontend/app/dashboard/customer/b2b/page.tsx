'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface B2BCompany {
  id: string; name: string; paymentTerms: string;
  discountRate: number; creditLimit: number; creditUsed: number; status: string;
}
interface B2BMember {
  id: string; role: string; monthlyBudget?: number; budgetUsed: number;
  requiresApproval: boolean; canPlaceOrder: boolean;
}
interface PendingApproval {
  id: string; orderId: string; status: string;
  requestedById: string; createdAt: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  prepaid: 'Урьдчилгаа', net_15: 'NET 15', net_30: 'NET 30', net_60: 'NET 60',
};

export default function CustomerB2BPage() {
  const router = useRouter();
  const [company, setCompany] = useState<B2BCompany | null>(null);
  const [member, setMember] = useState<B2BMember | null>(null);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [notMember, setNotMember] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<any>('/b2b/my-company');
      if (!data?.id) { setNotMember(true); setLoading(false); return; }
      setCompany(data);

      const [mem, appr] = await Promise.all([
        apiFetch<any>('/b2b/my-membership').catch(() => null),
        apiFetch<any>(`/b2b/companies/${data.id}/approvals/pending`).catch(() => []),
      ]);
      setMember(mem);
      setApprovals(Array.isArray(appr) ? appr : []);
    } catch {
      setNotMember(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const creditPct = company && Number(company.creditLimit) > 0
    ? Math.min(100, Math.round((Number(company.creditUsed) / Number(company.creditLimit)) * 100)) : 0;

  const budgetPct = member?.monthlyBudget && member.monthlyBudget > 0
    ? Math.min(100, Math.round((member.budgetUsed / member.monthlyBudget) * 100)) : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
    </div>
  );

  if (notMember) return (
    <div className="max-w-md mx-auto py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl" style={{ background: 'var(--surface2)' }}>
        🏢
      </div>
      <h2 className="text-lg font-medium mb-2" style={{ color: 'var(--text)' }}>B2B эрх байхгүй</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text3)' }}>
        Та одоогоор ямар нэг B2B компанийн гишүүн биш байна. Компанийн эзэн таныг нэмснийн дараа энэ хуудас ашиглагдана.
      </p>
      <button onClick={() => router.push('/dashboard/customer')}
        className="px-6 py-2.5 text-white rounded-xl text-sm font-medium" style={{ background: '#FF6B00' }}>
        Буцах
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-xl font-medium" style={{ color: 'var(--text)' }}>B2B Portal</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text3)' }}>{company?.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Миний үүрэг', val: member?.role ?? '—' },
          { label: 'Төлбөрийн нөхцөл', val: PAYMENT_LABELS[company?.paymentTerms ?? ''] ?? '—' },
          { label: 'Компанийн хөнгөлөлт', val: `${company?.discountRate ?? 0}%` },
          { label: 'Захиалга батлуулах', val: member?.requiresApproval ? 'Тийм' : 'Үгүй' },
        ].map((r, i) => (
          <div key={i} className="rounded-xl p-4" style={{ background: 'var(--surface2)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text4)' }}>{r.label}</div>
            <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{r.val}</div>
          </div>
        ))}
      </div>

      {company && Number(company.creditLimit) > 0 && (
        <div className="rounded-xl p-5 mb-5" style={{ border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: 'var(--text2)' }}>Кредитийн хязгаар</span>
            <span className="text-xs font-medium" style={{ color: creditPct > 80 ? '#DC2626' : '#059669' }}>
              {creditPct}% ашигласан
            </span>
          </div>
          <div className="flex items-end gap-3 mb-3">
            <div>
              <div className="text-2xl font-medium" style={{ color: 'var(--text)' }}>{Number(company.creditUsed).toLocaleString()}₮</div>
              <div className="text-xs" style={{ color: 'var(--text4)' }}>ашигласан</div>
            </div>
            <div className="mb-1 text-lg" style={{ color: 'var(--text4)' }}>/</div>
            <div>
              <div className="text-lg" style={{ color: 'var(--text3)' }}>{Number(company.creditLimit).toLocaleString()}₮</div>
              <div className="text-xs" style={{ color: 'var(--text4)' }}>хязгаар</div>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${creditPct}%`, background: creditPct > 80 ? '#DC2626' : '#059669' }} />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text4)' }}>
            Үлдэгдэл: {(Number(company.creditLimit) - Number(company.creditUsed)).toLocaleString()}₮
          </p>
        </div>
      )}

      {member?.monthlyBudget && member.monthlyBudget > 0 && (
        <div className="rounded-xl p-5 mb-5" style={{ border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: 'var(--text2)' }}>Сарын төсөв</span>
            <span className="text-xs font-medium" style={{ color: budgetPct > 80 ? '#DC2626' : '#378ADD' }}>
              {budgetPct}% зарцуулсан
            </span>
          </div>
          <div className="flex items-end gap-3 mb-3">
            <div>
              <div className="text-2xl font-medium" style={{ color: 'var(--text)' }}>{Number(member.budgetUsed).toLocaleString()}₮</div>
              <div className="text-xs" style={{ color: 'var(--text4)' }}>зарцуулсан</div>
            </div>
            <div className="mb-1 text-lg" style={{ color: 'var(--text4)' }}>/</div>
            <div>
              <div className="text-lg" style={{ color: 'var(--text3)' }}>{Number(member.monthlyBudget).toLocaleString()}₮</div>
              <div className="text-xs" style={{ color: 'var(--text4)' }}>сарын хязгаар</div>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${budgetPct}%`, background: budgetPct > 80 ? '#DC2626' : '#378ADD' }} />
          </div>
        </div>
      )}

      {approvals.length > 0 && (
        <div>
          <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text2)' }}>
            Батлуулах хүлээгдэж буй ({approvals.length})
          </h2>
          <div className="space-y-2">
            {approvals.map(a => (
              <div key={a.id} className="flex items-center justify-between p-4 rounded-xl"
                style={{ border: '1px solid #D9770640', background: 'rgba(217,119,6,0.04)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    Захиалга #{a.orderId.slice(-8)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text4)' }}>
                    {new Date(a.createdAt).toLocaleString('mn-MN')}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(217,119,6,0.1)', color: '#D97706' }}>
                  Хүлээгдэж байна
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
