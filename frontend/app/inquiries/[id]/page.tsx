'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

interface Message {
  id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  attachments?: Array<{ name: string; url: string; type: string }>;
  is_system: boolean;
  created_at: string;
}

interface Inquiry {
  id: string;
  inquiry_number: string;
  status: string;
  product_name: string;
  category: string;
  quantity: number;
  size_label: string;
  paper_type: string;
  color_mode: string;
  sides: string;
  finishing: string[];
  notes: string;
  has_design: boolean;
  needs_design: boolean;
  files: Array<{ name: string; url: string; type: string }>;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  preferred_contact: string;
  quoted_price: number;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:       { label: 'Шинэ', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  reviewing: { label: 'Хянаж байна', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  quoted:    { label: 'Үнэ санал', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
  confirmed: { label: 'Батлагдсан', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  in_work:   { label: 'Хэвлэж байна', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
  completed: { label: 'Бэлэн болсон', color: 'text-green-700 bg-green-100 dark:bg-green-900/30' },
  cancelled: { label: 'Цуцлагдсан', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
};

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<'chat' | 'detail'>('chat');
  const [files, setFiles] = useState<File[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<NodeJS.Timeout>(null);

  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('access_token') || localStorage.getItem('token') || '')
    : '';
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const loadInquiry = async () => {
    const r = await fetch(`${API}/api/inquiries/${id}`, { headers });
    if (r.ok) setInquiry(await r.json());
  };

  const loadMessages = async () => {
    const r = await fetch(`${API}/api/inquiries/${id}/messages`, { headers });
    if (r.ok) setMessages(await r.json());
  };

  useEffect(() => {
    loadInquiry();
    loadMessages();
    pollRef.current = setInterval(loadMessages, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current) };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() && files.length === 0) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('content', text);
      fd.append('sender_name', 'Харилцагч');
      files.forEach(f => fd.append('attachments', f));

      const r = await fetch(`${API}/api/inquiries/${id}/messages`, {
        method: 'POST',
        headers,
        body: fd,
      });
      if (r.ok) {
        setText('');
        setFiles([]);
        await loadMessages();
      }
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (!inquiry) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
    </div>
  );

  const st = STATUS_LABELS[inquiry.status] || { label: inquiry.status, color: 'text-gray-600 bg-gray-100' };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              #{inquiry.inquiry_number}
            </h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>
              {st.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {inquiry.product_name || inquiry.category} · {inquiry.quantity?.toLocaleString()} ш
          </p>
        </div>
        {inquiry.quoted_price && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Үнийн санал</p>
            <p className="text-xl font-medium text-orange-500">{inquiry.quoted_price.toLocaleString()}₮</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-700">
        {[['chat','Чат'],['detail','Дэлгэрэнгүй']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${tab === t ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* CHAT TAB */}
      {tab === 'chat' && (
        <div className="flex flex-col" style={{ height: 480 }}>
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
            {messages.length === 0 && (
              <div className="text-center text-sm text-gray-400 py-8">
                Одоохондоо мессеж байхгүй байна
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`flex flex-col ${m.is_system ? 'items-center' : m.sender_role === 'customer' ? 'items-end' : 'items-start'}`}>
                {m.is_system ? (
                  <div className="bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs px-3 py-1.5 rounded-full max-w-sm text-center">
                    {m.content}
                  </div>
                ) : (
                  <div className={`max-w-xs lg:max-w-md ${m.sender_role === 'customer' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'} rounded-2xl px-4 py-2.5`}>
                    {m.sender_role !== 'customer' && (
                      <p className="text-xs font-medium mb-1 text-orange-600 dark:text-orange-400">{m.sender_name}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {m.attachments.map((a, i) => (
                          <a key={i} href={`${API}${a.url}`} target="_blank"
                            className={`flex items-center gap-2 text-xs underline ${m.sender_role === 'customer' ? 'text-orange-100' : 'text-orange-600'}`}>
                            📎 {a.name}
                          </a>
                        ))}
                      </div>
                    )}
                    <p className={`text-xs mt-1 ${m.sender_role === 'customer' ? 'text-orange-200' : 'text-gray-400'}`}>
                      {new Date(m.created_at).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {files.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg px-2.5 py-1.5 text-xs">
                  📎 {f.name}
                  <button onClick={() => setFiles(p => p.filter((_,j) => j !== i))} className="text-gray-400 hover:text-red-500 ml-1">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 border border-gray-200 dark:border-gray-700 rounded-2xl p-2">
            <button onClick={() => fileRef.current?.click()} className="p-2 text-gray-400 hover:text-orange-500 flex-shrink-0">
              📎
            </button>
            <input ref={fileRef} type="file" multiple className="hidden"
              onChange={e => e.target.files && setFiles(p => [...p, ...Array.from(e.target.files!)])} />
            <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey}
              rows={1} placeholder="Мессеж бичнэ үү... (Enter илгээх)"
              className="flex-1 bg-transparent text-sm resize-none focus:outline-none max-h-24" />
            <button onClick={send} disabled={sending || (!text.trim() && files.length === 0)}
              className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex-shrink-0">
              {sending ? '...' : 'Илгээх'}
            </button>
          </div>

          {inquiry.preferred_contact === 'viber' && (
            <p className="text-xs text-gray-400 mt-2 text-center">Viber-ээр ч холбогдох боломжтой</p>
          )}
          {inquiry.preferred_contact === 'email' && (
            <p className="text-xs text-gray-400 mt-2 text-center">design@bizprint.mn имэйлд хариу орно</p>
          )}
        </div>
      )}

      {/* DETAIL TAB */}
      {tab === 'detail' && (
        <div className="space-y-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-2xl divide-y divide-gray-100 dark:divide-gray-800">
            {[
              ['Бүтээгдэхүүн', inquiry.product_name || inquiry.category],
              ['Тираж', inquiry.quantity?.toLocaleString() + ' ш'],
              ['Хэмжээ', inquiry.size_label],
              ['Цаас', inquiry.paper_type || '—'],
              ['Өнгө', inquiry.color_mode],
              ['Тал', inquiry.sides === 'double' ? 'Хоёр тал' : 'Нэг тал'],
              ['Боловсруулалт', inquiry.finishing?.join(', ') || '—'],
              ['Эх бэлгүүл', inquiry.has_design ? 'Бэлэн' : inquiry.needs_design ? 'Дизайн шийлгүүл' : '—'],
              ['Холбоо барих', inquiry.preferred_contact],
              ['Үүсгэсэн', new Date(inquiry.created_at).toLocaleDateString('mn-MN')],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-3 text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="text-gray-900 dark:text-gray-100">{v}</span>
              </div>
            ))}
          </div>

          {inquiry.files && inquiry.files.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Хавсаргасан файлууд</p>
              <div className="space-y-2">
                {inquiry.files.map((f, i) => (
                  <a key={i} href={`${API}${f.url}`} target="_blank"
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-xs font-bold text-red-600">
                      {f.type?.includes('pdf') ? 'PDF' : '🖼'}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-orange-500">↓ Татах</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {inquiry.notes && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium mb-1">Тэмдэглэл</p>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">{inquiry.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
