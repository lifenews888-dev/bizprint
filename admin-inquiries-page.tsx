'use client';
// frontend/app/admin/inquiries/page.tsx
// Admin — бүх захиалгын хүсэлтүүд + удирдах

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Inquiry {
  id: string;
  inquiry_number: string;
  status: string;
  product_name: string;
  category: string;
  quantity: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  preferred_contact: string;
  quoted_price?: number;
  assigned_to?: string;
  files: any[];
  created_at: string;
}

const STATUS_OPTS = [
  { v: '',          l: 'Бүгд' },
  { v: 'new',       l: 'Шинэ' },
  { v: 'reviewing', l: 'Хянаж байна' },
  { v: 'quoted',    l: 'Үнэ санал' },
  { v: 'confirmed', l: 'Батлагдсан' },
  { v: 'in_work',   l: 'Хэвлэж байна' },
  { v: 'completed', l: 'Бэлэн' },
  { v: 'cancelled', l: 'Цуцлагдсан' },
];

const STATUS_COLORS: Record<string, string> = {
  new:       'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  reviewing: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  quoted:    'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
  confirmed: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  in_work:   'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
  completed: 'bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  cancelled: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Шинэ', reviewing: 'Хянаж байна', quoted: 'Үнэ санал',
  confirmed: 'Батлагдсан', in_work: 'Хэвлэж байна',
  completed: 'Бэлэн', cancelled: 'Цуцлагдсан',
};

const CONTACT_ICONS: Record<string, string> = {
  chat: '💬', viber: '📱', email: '📧', phone: '📞',
};

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function AdminInquiriesPage() {
  const router = useRouter();
  const [list, setList] = useState<Inquiry[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('access_token') || '') : '';
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const load = async () => {
    setLoading(true);
    const [listRes, sumRes] = await Promise.all([
      fetch(`${API}/api/inquiries${statusFilter ? `?status=${statusFilter}` : ''}`, { headers }),
      fetch(`${API}/api/inquiries/admin/summary`, { headers }),
    ]);
    if (listRes.ok) setList(await listRes.json());
    if (sumRes.ok) setSummary(await sumRes.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateStatus = async (id: string, status: string, note?: string) => {
    await fetch(`${API}/api/inquiries/${id}/status`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ status, note }),
    });
    await load();
    setSelected(null);
  };

  const sendQuote = async (id: string) => {
    if (!quotePrice) return;
    await fetch(`${API}/api/inquiries/${id}/quote`, {
      method: 'POST', headers,
      body: JSON.stringify({ price: +quotePrice, notes: quoteNote }),
    });
    setQuotePrice(''); setQuoteNote('');
    await load();
    setSelected(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">Захиалгын хүсэлтүүд</h1>
        <button onClick={load} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">↻ Шинэчлэх</button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { l: 'Нийт', v: summary.total, c: 'text-gray-900 dark:text-gray-100' },
            { l: 'Шинэ', v: summary.new_count, c: 'text-blue-600' },
            { l: 'Хянаж байна', v: summary.reviewing, c: 'text-amber-600' },
            { l: 'Үнэ санал', v: summary.quoted, c: 'text-purple-600' },
            { l: 'Уншаагүй', v: summary.unread_messages, c: 'text-red-600' },
          ].map(s => (
            <div key={s.l} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
              <p className={`text-2xl font-medium ${s.c}`}>{s.v}</p>
              <p className="text-xs text-gray-400 mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_OPTS.map(o => (
          <button key={o.v} onClick={() => setStatusFilter(o.v)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${statusFilter === o.v ? 'bg-orange-500 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'}`}>
            {o.l}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      ) : (
        <div className="space-y-2">
          {list.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">Захиалга байхгүй байна</div>
          )}
          {list.map(inq => (
            <div key={inq.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
              onClick={() => setSelected(selected?.id === inq.id ? null : inq)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                      #{inq.inquiry_number}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[inq.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[inq.status] || inq.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {CONTACT_ICONS[inq.preferred_contact]} {inq.preferred_contact}
                    </span>
                    {inq.files?.length > 0 && (
                      <span className="text-xs text-blue-600">📎 {inq.files.length} файл</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {inq.product_name || inq.category} · {inq.quantity?.toLocaleString()} ш
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {inq.customer_name} · {inq.customer_phone}
                    {inq.customer_email && ` · ${inq.customer_email}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {inq.quoted_price && (
                    <p className="text-sm font-medium text-orange-500">{inq.quoted_price.toLocaleString()}₮</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(inq.created_at).toLocaleDateString('mn-MN')}
                  </p>
                </div>
              </div>

              {/* Expanded actions */}
              {selected?.id === inq.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3" onClick={e => e.stopPropagation()}>
                  {/* Status change */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Статус солих:</p>
                    <div className="flex gap-2 flex-wrap">
                      {['reviewing', 'quoted', 'confirmed', 'in_work', 'completed', 'cancelled'].map(s => (
                        <button key={s} onClick={() => updateStatus(inq.id, s)}
                          className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${inq.status === s ? 'border-orange-500 text-orange-600' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'}`}>
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quote */}
                  <div className="flex gap-2">
                    <input type="number" value={quotePrice} onChange={e => setQuotePrice(e.target.value)}
                      placeholder="Үнэ (₮)" className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent" />
                    <input value={quoteNote} onChange={e => setQuoteNote(e.target.value)}
                      placeholder="Тайлбар" className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent" />
                    <button onClick={() => sendQuote(inq.id)}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg text-xs font-medium">
                      Үнэ илгээх
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => router.push(`/inquiries/${inq.id}`)}
                      className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                      💬 Чат харах
                    </button>
                    {inq.customer_phone && (
                      <a href={`tel:${inq.customer_phone}`}
                        className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                        📞 Залгах
                      </a>
                    )}
                    {inq.customer_phone && (
                      <a href={`viber://chat?number=${inq.customer_phone}`}
                        className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                        📱 Viber
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
