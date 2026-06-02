'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import PricingSnapshotPanel from '@/components/PricingSnapshotPanel';
import { API_URL } from '@/lib/api';
import {
  type PricingSnapshot,
  getPricingConfidenceBadge,
  pricingSourceLabel,
} from '@/lib/pricing/snapshot';

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
  estimated_price?: number;
  pricing_snapshot?: PricingSnapshot;
  created_at: string;
}

type InquiryFileLink = { name: string; url: string; type?: string };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:       { label: 'Шинэ', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  reviewing: { label: 'Хянаж байна', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  quoted:    { label: 'Үнэ санал', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
  confirmed: { label: 'Батлагдсан', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  in_work:   { label: 'Хэвлэж байна', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
  completed: { label: 'Бэлэн болсон', color: 'text-green-700 bg-green-100 dark:bg-green-900/30' },
  cancelled: { label: 'Цуцлагдсан', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
};

const WORKFLOW_STEPS = [
  {
    status: 'new',
    label: 'Хүлээн авсан',
    description: 'Захиалгын мэдээлэл бүртгэгдсэн.',
  },
  {
    status: 'reviewing',
    label: 'Хянаж байна',
    description: 'Оператор эсвэл үйлдвэр материал, хэмжээ, үнийг шалгаж байна.',
  },
  {
    status: 'quoted',
    label: 'Үнэ санал',
    description: 'Баталгаажсан үнийн санал илгээгдэнэ.',
  },
  {
    status: 'confirmed',
    label: 'Баталгаажсан',
    description: 'Хэрэглэгч үнэ, нөхцөлийг зөвшөөрсөн.',
  },
  {
    status: 'in_work',
    label: 'Үйлдвэрлэл',
    description: 'Үйлдвэр захиалгыг хүлээн авч ажиллаж байна.',
  },
  {
    status: 'completed',
    label: 'Бэлэн',
    description: 'Захиалга дуусч хүлээлгэн өгөхөд бэлэн болсон.',
  },
];

const TERMINAL_STATUSES = new Set(['cancelled']);

const getWorkflowState = (status: string) => {
  if (TERMINAL_STATUSES.has(status)) {
    return {
      currentIndex: -1,
      message: 'Энэ захиалга цуцлагдсан байна.',
      next: '',
    };
  }

  const currentIndex = WORKFLOW_STEPS.findIndex(step => step.status === status);
  const currentStep = WORKFLOW_STEPS[currentIndex] || null;
  const nextStep = currentIndex >= 0 ? WORKFLOW_STEPS[currentIndex + 1] : null;

  return {
    currentIndex,
    message: currentStep?.description || 'Захиалгын төлөв шинэчлэгдэж байна.',
    next: nextStep ? `Дараагийн алхам: ${nextStep.label}` : 'Дараагийн алхам байхгүй.',
  };
};

const API = API_URL;

const getPriceSource = (snapshot?: PricingSnapshot) => pricingSourceLabel(snapshot, 'Backend engine')

const renderSystemMessage = (content: string) => {
  if (/Захиалга автоматаар\s*""\s*үйлдвэрт хуваарилагдлаа/.test(content)) {
    return 'Захиалга хүлээн авлаа. Оператор тохирох үйлдвэртэй холбож өгнө.'
  }
  return content
}

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'detail' ? 'detail' : 'chat';
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingInquiry, setLoadingInquiry] = useState(true);
  const [inquiryError, setInquiryError] = useState('');
  const [inquiryRequestId, setInquiryRequestId] = useState('');
  const [requestIdCopied, setRequestIdCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [tab, setTab] = useState<'chat' | 'detail'>(initialTab);
  const [files, setFiles] = useState<File[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const messagePollRef = useRef<NodeJS.Timeout>(null);
  const inquiryPollRef = useRef<NodeJS.Timeout>(null);
  const inquiryMissingRef = useRef(false);

  const headers = useMemo<Record<string, string>>(() => {
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('access_token') || localStorage.getItem('token') || '')
      : '';
    if (!token) return {} as Record<string, string>;
    return { Authorization: `Bearer ${token}` };
  }, []);

  const selectTab = (nextTab: 'chat' | 'detail') => {
    setTab(nextTab);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (nextTab === 'detail') {
      url.searchParams.set('tab', 'detail');
    } else {
      url.searchParams.delete('tab');
    }
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  };

  const copyCurrentLink = async () => {
    if (typeof window === 'undefined') return;
    await navigator.clipboard.writeText(window.location.href).catch(() => {});
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 1600);
  };

  const loadInquiry = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/inquiries/${id}`, { headers });
      const requestId = r.headers.get('x-request-id') || '';
      setInquiryRequestId(requestId);
      if (r.ok) {
        setInquiry(await r.json());
        setInquiryError('');
        inquiryMissingRef.current = false;
        return;
      }
      if (r.status === 404) {
        setInquiry(null);
        setInquiryError('Захиалга олдсонгүй. Линк буруу эсвэл test өгөгдөл устсан байж магадгүй.');
        inquiryMissingRef.current = true;
        setMessages([]);
        return;
      }
      setInquiryError(`Захиалгын мэдээлэл авахад алдаа гарлаа (${r.status}).`);
    } catch {
      setInquiryError('Захиалгын мэдээлэл авахад сүлжээний алдаа гарлаа.');
      setInquiryRequestId('');
    } finally {
      setLoadingInquiry(false);
    }
  }, [headers, id]);

  const loadMessages = useCallback(async () => {
    if (inquiryMissingRef.current) return;
    try {
      const r = await fetch(`${API}/api/inquiries/${id}/messages`, { headers });
      if (r.ok) setMessages(await r.json());
    } catch {
      // Keep the page quiet when a stale/deleted inquiry is open.
    }
  }, [headers, id]);

  useEffect(() => {
    inquiryMissingRef.current = false;
    setLoadingInquiry(true);
    setInquiryError('');
    setInquiryRequestId('');
    setRequestIdCopied(false);
    setLinkCopied(false);
    loadInquiry();
    loadMessages();
    messagePollRef.current = setInterval(loadMessages, 5000);
    inquiryPollRef.current = setInterval(loadInquiry, 10000);
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') {
        loadInquiry();
        loadMessages();
      }
    };
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);
    return () => {
      if (messagePollRef.current) clearInterval(messagePollRef.current);
      if (inquiryPollRef.current) clearInterval(inquiryPollRef.current);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, [loadInquiry, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() && files.length === 0) return;
    setSending(true);
    setSendError('');
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
      } else {
        const data = await r.json().catch(() => null);
        setSendError(data?.message || `Мессеж илгээхэд алдаа гарлаа (${r.status}).`);
      }
    } catch {
      setSendError('Мессеж илгээхэд сүлжээний алдаа гарлаа.');
    } finally {
      setSending(false);
    }
  };

  const downloadInquiryFile = async (file: InquiryFileLink) => {
    setDownloadError('');
    try {
      const r = await fetch(`${API}${file.url}`, { headers });
      if (!r.ok) {
        setDownloadError(r.status === 403
          ? 'Энэ файлыг татах эрхгүй байна.'
          : `Файл татахад алдаа гарлаа (${r.status}).`);
        return;
      }
      const blob = await r.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = file.name || 'bizprint-file';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      setDownloadError('Файл татахад сүлжээний алдаа гарлаа.');
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (loadingInquiry && !inquiry) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
    </div>
  );

  if (!inquiry) return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Захиалга харагдахгүй байна</p>
        <p className="mt-2 text-sm text-gray-500">{inquiryError || 'Захиалгын мэдээлэл олдсонгүй.'}</p>
        {inquiryRequestId && (
          <div className="mt-3 flex flex-col items-center gap-2 text-xs text-gray-400 sm:flex-row sm:justify-center">
            <span>
              Support ID: <span className="font-mono">{inquiryRequestId}</span>
            </span>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(inquiryRequestId).catch(() => {});
                setRequestIdCopied(true);
                window.setTimeout(() => setRequestIdCopied(false), 1600);
              }}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {requestIdCopied ? 'Хуулагдлаа' : 'Хуулах'}
            </button>
          </div>
        )}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={() => {
              setLoadingInquiry(true);
              inquiryMissingRef.current = false;
              loadInquiry();
              loadMessages();
            }}
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            Дахин шалгах
          </button>
          <Link
            href="/quote"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Үнэ авах
          </Link>
          <Link
            href="/shop"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Дэлгүүр рүү буцах
          </Link>
        </div>
      </div>
    </div>
  );

  const st = STATUS_LABELS[inquiry.status] || { label: inquiry.status, color: 'text-gray-600 bg-gray-100' };
  const workflow = getWorkflowState(inquiry.status);

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
            <span
              title={getPricingConfidenceBadge(inquiry.pricing_snapshot).description}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPricingConfidenceBadge(inquiry.pricing_snapshot).className}`}
            >
              {getPricingConfidenceBadge(inquiry.pricing_snapshot).label}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {inquiry.product_name || inquiry.category} · {inquiry.quantity?.toLocaleString()} ш
          </p>
        </div>
        {(inquiry.quoted_price || Number(inquiry.estimated_price || 0) > 0) && (
          <div className="text-right">
            <p className="text-xs text-gray-400">{inquiry.quoted_price ? 'Үнийн санал' : 'Автомат үнэ'}</p>
            <p className="text-xl font-medium text-orange-500">
              {Number(inquiry.quoted_price || inquiry.estimated_price || 0).toLocaleString()}₮
            </p>
            {getPriceSource(inquiry.pricing_snapshot) && (
              <p className={`text-xs ${inquiry.pricing_snapshot?.source === 'server' ? 'text-green-600' : 'text-amber-600'}`}>
                {getPriceSource(inquiry.pricing_snapshot)}
              </p>
            )}
            <button
              type="button"
              onClick={copyCurrentLink}
              className="mt-2 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {linkCopied ? 'Хуулагдлаа' : 'Линк хуулах'}
            </button>
          </div>
        )}
      </div>

      <div className="mb-5 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Захиалгын явц</p>
            <p className="mt-1 text-xs text-gray-500">{workflow.message}</p>
          </div>
          <span className="w-fit rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {workflow.next}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {WORKFLOW_STEPS.map((step, index) => {
            const isDone = workflow.currentIndex >= 0 && index < workflow.currentIndex;
            const isCurrent = index === workflow.currentIndex;
            const isFuture = workflow.currentIndex >= 0 && index > workflow.currentIndex;
            return (
              <div
                key={step.status}
                className={`rounded-lg border px-2 py-2 text-center ${
                  isCurrent
                    ? 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
                    : isDone
                      ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-300'
                      : isFuture
                        ? 'border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500'
                        : 'border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
                }`}
              >
                <div className="mx-auto mb-1 flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-semibold">
                  {isDone ? '✓' : index + 1}
                </div>
                <p className="text-[11px] font-medium leading-tight">{step.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-700">
        {[['chat','Чат'],['detail','Дэлгэрэнгүй']].map(([t,l]) => (
          <button key={t} onClick={() => selectTab(t as 'chat' | 'detail')}
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
                    {renderSystemMessage(m.content)}
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
                          <button key={i} type="button" onClick={() => downloadInquiryFile(a)}
                            className={`flex items-center gap-2 text-left text-xs underline ${m.sender_role === 'customer' ? 'text-orange-100' : 'text-orange-600'}`}>
                            📎 {a.name}
                          </button>
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
          {sendError && (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
              {sendError}
            </p>
          )}
          {downloadError && (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
              {downloadError}
            </p>
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
              ['Эх бэлтгэл', inquiry.has_design ? 'Бэлэн' : inquiry.needs_design ? 'Дизайн хийлгэх' : '—'],
              ['Холбоо барих', inquiry.preferred_contact],
              ['Үүсгэсэн', new Date(inquiry.created_at).toLocaleDateString('mn-MN')],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-3 text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="text-gray-900 dark:text-gray-100">{v}</span>
              </div>
            ))}
          </div>

          <PricingSnapshotPanel
            snapshot={inquiry.pricing_snapshot}
            estimatedPrice={inquiry.estimated_price}
          />

          <div className={`rounded-xl px-4 py-3 text-sm ${getPricingConfidenceBadge(inquiry.pricing_snapshot).className}`}>
            <p className="font-semibold">{getPricingConfidenceBadge(inquiry.pricing_snapshot).action}</p>
            <p className="mt-1 text-xs opacity-80">{getPricingConfidenceBadge(inquiry.pricing_snapshot).description}</p>
          </div>

          {inquiry.files && inquiry.files.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Хавсаргасан файлууд</p>
              <div className="space-y-2">
                {inquiry.files.map((f, i) => (
                  <button key={i} type="button" onClick={() => downloadInquiryFile(f)}
                    className="flex w-full items-center gap-3 rounded-xl bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800">
                    <div className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-xs font-bold text-red-600">
                      {f.type?.includes('pdf') ? 'PDF' : '🖼'}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-orange-500">↓ Татах</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {downloadError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
              {downloadError}
            </p>
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
