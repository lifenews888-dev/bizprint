'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PricingSnapshotPanel from '@/components/PricingSnapshotPanel';
import {
  type PricingSnapshot,
  getPricingConfidenceBadge,
  hasPricingDelta,
  hasVerificationError,
  hasVerifiedPricing,
  isPricingActionRequired,
  pricingSourceLabel as getPricingSourceLabel,
} from '@/lib/pricing/snapshot';

interface InquiryFile {
  name?: string;
  url?: string;
  type?: string;
}

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
  estimated_price?: number;
  pricing_snapshot?: PricingSnapshot;
  width_mm?: number;
  height_mm?: number;
  paper_type?: string;
  assigned_to?: string;
  vendor_id?: string;
  vendor_accepted?: boolean;
  vendor_sla_deadline?: string;
  reassign_count?: number;
  sla_missed_vendor_id?: string;
  is_broadcast?: boolean;
  broadcast_vendor_ids?: string[];
  files: InquiryFile[];
  created_at: string;
}

interface Vendor {
  id: string;
  company_name?: string;
  user_id?: string;
  contact_email?: string;
  district?: string;
  rating?: number;
}

interface AdminSummary {
  total?: number;
  new_count?: number;
  reviewing?: number;
  quoted?: number;
  unread_messages?: number;
  pricing_verified_count?: number;
  pricing_delta_count?: number;
  pricing_delta_minor_count?: number;
  pricing_delta_warning_count?: number;
  pricing_delta_critical_count?: number;
  pricing_unverified_count?: number;
  pricing_missing_size_count?: number;
  pricing_missing_material_count?: number;
  pricing_auto_quote_ready_count?: number;
  pricing_reprice_required_count?: number;
  pricing_input_fix_required_count?: number;
  pricing_manual_review_count?: number;
  pricing_snapshot_missing_count?: number;
  pricing_action_required_count?: number;
  sla_overdue_count?: number;
}

interface ActionResponse {
  id?: string;
  estimated_price?: number;
  quoted_price?: number;
  pricing_snapshot?: PricingSnapshot;
  vendorCount?: number;
  skippedVendorCount?: number;
  message?: string;
  error?: string;
}

interface AdminInquiryFilters {
  statusFilter: string;
  pricingVerifiedOnly: boolean;
  pricingDeltaOnly: boolean;
  pricingDeltaSeverity: string;
  pricingUnverifiedOnly: boolean;
  pricingUnverifiedReason: string;
  pricingManualReviewOnly: boolean;
  pricingSnapshotMissingOnly: boolean;
  pricingActionRequiredOnly: boolean;
  slaOverdueOnly: boolean;
}

type PricingFilterKey = 'verified' | 'delta' | 'unverified' | 'manual' | 'missing' | 'action' | 'sla';
type InquiryActionKind = 'assign' | 'broadcast' | 'status' | 'quote' | 'reprice' | 'force-reassign';
type QuoteSource = 'manual' | 'auto_verified';
type ActionMessage = { inquiryId: string; type: 'error' | 'success'; text: string } | null;

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
}

const isAbortError = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';

const getInquiryActionKey = (kind: InquiryActionKind, inquiryId: string, detail = '') => {
  return [kind, inquiryId, detail].filter(Boolean).join(':');
};

const getInquiryIdFromActionKey = (actionKey: string) => {
  const [, inquiryId = ''] = actionKey.split(':');
  return inquiryId;
};

const buildAdminInquiryQuery = (filters: AdminInquiryFilters) => {
  const query = new URLSearchParams();
  if (filters.statusFilter) query.set('status', filters.statusFilter);
  if (filters.pricingVerifiedOnly) query.set('pricing_verified', 'true');
  if (filters.pricingDeltaOnly) query.set('pricing_delta', 'true');
  if (filters.pricingDeltaOnly && filters.pricingDeltaSeverity) {
    query.set('pricing_delta_severity', filters.pricingDeltaSeverity);
  }
  if (filters.pricingUnverifiedOnly) query.set('pricing_unverified', 'true');
  if (filters.pricingUnverifiedOnly && filters.pricingUnverifiedReason) {
    query.set('pricing_unverified_reason', filters.pricingUnverifiedReason);
  }
  if (filters.pricingManualReviewOnly) query.set('pricing_manual_review', 'true');
  if (filters.pricingSnapshotMissingOnly) query.set('pricing_snapshot_missing', 'true');
  if (filters.pricingActionRequiredOnly) query.set('pricing_action_required', 'true');
  if (filters.slaOverdueOnly) query.set('sla_overdue', 'true');
  return query.toString();
};

const readJsonResponse = async <T,>(res: Response, fallback: string): Promise<T> => {
  try {
    return await res.json() as T;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, fallback));
  }
};

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

const STATUS_ACTIONS = ['reviewing', 'confirmed', 'in_work', 'completed', 'cancelled'] as const;
type InquiryStatusAction = typeof STATUS_ACTIONS[number];
type InquiryStatus = 'new' | 'quoted' | InquiryStatusAction;

const STATUS_COLORS: Record<InquiryStatus, string> = {
  new:       'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  reviewing: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  quoted:    'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
  confirmed: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  in_work:   'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
  completed: 'bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  cancelled: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
};

const getStatusColor = (status?: string) => {
  if (!status) return 'bg-gray-100 text-gray-600';
  return STATUS_COLORS[status as InquiryStatus] || 'bg-gray-100 text-gray-600';
};

const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: 'Шинэ', reviewing: 'Хянаж байна', quoted: 'Үнэ санал',
  confirmed: 'Батлагдсан', in_work: 'Хэвлэж байна',
  completed: 'Бэлэн', cancelled: 'Цуцлагдсан',
};

const getStatusLabel = (status?: string) => {
  if (!status) return '';
  return STATUS_LABELS[status as InquiryStatus] || status;
};

const CONTACT_ICONS: Record<string, string> = {
  chat: '💬', viber: '📱', email: '📧', phone: '📞',
};

const getContactIcon = (contact?: string) => CONTACT_ICONS[contact || ''] || '•';
const getContactLabel = (contact?: string) => contact || 'Холбоо тодорхойгүй';
const formatCustomerContact = (inquiry: Inquiry) => {
  return [inquiry.customer_name, inquiry.customer_phone, inquiry.customer_email]
    .map(value => String(value || '').trim())
    .filter(Boolean)
    .join(' · ') || 'Харилцагчийн мэдээлэл дутуу';
};
const formatInquiryProductLine = (inquiry: Inquiry) => {
  const product = String(inquiry.product_name || inquiry.category || '').trim() || 'Бүтээгдэхүүн тодорхойгүй';
  const qty = toPositiveNumber(inquiry.quantity);
  return qty > 0 ? `${product} · ${qty.toLocaleString()} ш` : product;
};
const getPhoneHrefValue = (phone?: string) => {
  const raw = String(phone || '').trim();
  const digits = raw.replace(/\D/g, '');
  const value = `${raw.startsWith('+') ? '+' : ''}${digits}`;
  return digits.length >= 6 ? value : '';
};
const getTelHref = (phone?: string) => {
  const value = getPhoneHrefValue(phone);
  return value ? `tel:${value}` : '';
};
const getViberHref = (phone?: string) => {
  const value = getPhoneHrefValue(phone);
  return value ? `viber://chat?number=${encodeURIComponent(value)}` : '';
};
const getEmailHrefValue = (email?: string) => {
  const value = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : '';
};
const getMailtoHref = (email?: string) => {
  const value = getEmailHrefValue(email);
  return value ? `mailto:${encodeURIComponent(value)}` : '';
};
const toPositiveNumber = (value?: unknown) => {
  const normalized = String(value ?? '').trim().replace(/[^\d.-]/g, '');
  const amount = Number(normalized || 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};
const toCount = (value?: unknown) => {
  const amount = toPositiveNumber(value);
  return amount > 0 ? Math.floor(amount) : 0;
};
const getCountValue = (value?: unknown, fallback: unknown = 0) => toCount(value ?? fallback);
const formatCount = (value?: unknown, fallback: unknown = 0) => getCountValue(value, fallback).toLocaleString();
const firstPositiveNumber = (...values: unknown[]) => {
  for (const value of values) {
    const amount = toPositiveNumber(value);
    if (amount > 0) return amount;
  }
  return 0;
};
const formatMoney = (value?: unknown) => {
  const amount = toPositiveNumber(value);
  return amount > 0 ? `${amount.toLocaleString()}₮` : '';
};
const getInquiryEstimatedPrice = (inquiry: Pick<Inquiry, 'estimated_price' | 'pricing_snapshot'>) => {
  return firstPositiveNumber(inquiry.estimated_price, inquiry.pricing_snapshot?.total);
};
const getInquiryDisplayPrice = (inquiry: Pick<Inquiry, 'quoted_price' | 'estimated_price' | 'pricing_snapshot'>) => {
  return firstPositiveNumber(inquiry.quoted_price, inquiry.estimated_price, inquiry.pricing_snapshot?.total);
};
const getQuoteInputValue = (value?: unknown) => {
  const amount = toPositiveNumber(value);
  return amount > 0 ? String(Math.round(amount)) : '';
};
const getAutoQuoteNote = (snapshot?: PricingSnapshot) => {
  const source = getPricingSourceLabel(snapshot);
  return source ? `Баталгаатай автомат тооцоолол (${source})` : 'Баталгаатай автомат тооцоолол';
};
const normalizeQuoteNote = (note?: string) => String(note || '').trim();

const API = process.env.NEXT_PUBLIC_API_URL || '';

const isWideInquiry = (inquiry: Inquiry) => {
  const value = `${inquiry.category || ''} ${inquiry.product_name || ''}`.toLowerCase();
  return value.includes('banner') || value.includes('баннер') || value.includes('sticker') || value.includes('стикер');
}

const getRepriceBlocker = (inquiry: Inquiry) => {
  if (!isWideInquiry(inquiry)) return '';
  if (!['new', 'reviewing', 'quoted'].includes(inquiry.status)) return 'Энэ төлөвт дахин үнэ бодохгүй';
  if (!Number(inquiry.width_mm || 0) || !Number(inquiry.height_mm || 0)) return 'Хэмжээний мэдээлэл дутуу';
  if (!String(inquiry.paper_type || '').trim()) return 'Материалын мэдээлэл дутуу';
  return '';
}

const getAutoQuoteBlocker = (inquiry: Inquiry) => {
  const price = getInquiryEstimatedPrice(inquiry);
  if (price <= 0) return '';
  const confidence = getPricingConfidenceBadge(inquiry.pricing_snapshot);
  if (confidence.level !== 'verified') return confidence.action;
  return '';
}

const getStatusBlocker = (inquiry: Inquiry, status: InquiryStatusAction) => {
  if (inquiry.status === 'cancelled' && status !== 'cancelled') {
    return 'Цуцлагдсан захиалга';
  }
  if (inquiry.status === 'completed' && status !== 'completed') {
    return 'Дууссан захиалга';
  }
  if (status === 'cancelled' && inquiry.status === 'in_work') {
    return 'Үйлдвэрлэл эхэлсэн';
  }
  if (status === 'confirmed' && !toPositiveNumber(inquiry.quoted_price)) {
    return 'Эхлээд үнийн санал илгээнэ';
  }
  if (status === 'in_work' && inquiry.status !== 'confirmed') {
    return 'Эхлээд баталгаажуулна';
  }
  if (status === 'completed' && inquiry.status !== 'in_work') {
    return 'Эхлээд үйлдвэрлэлд оруулна';
  }
  return '';
}

const getQuoteBlocker = (price: unknown, inquiry?: Inquiry) => {
  if (inquiry && !['new', 'reviewing', 'quoted'].includes(inquiry.status)) {
    return 'Энэ төлөвт үнэ дахин илгээхгүй';
  }
  if (!toPositiveNumber(price)) return '0-ээс их үнэ оруулна';
  return '';
}

const isSlaOverdue = (inquiry: Inquiry) => {
  if (!inquiry.vendor_id || inquiry.vendor_accepted || !inquiry.vendor_sla_deadline) return false;
  return new Date(inquiry.vendor_sla_deadline).getTime() < Date.now();
}

const isAssignableVendor = (vendor: Vendor) => {
  if (!vendor?.id) return false;
  if (!String(vendor.company_name || '').trim()) return false;
  return !!(String(vendor.user_id || '').trim() || String(vendor.contact_email || '').trim());
}

const readActionResponse = async <T extends ActionResponse = ActionResponse>(res: Response, fallback: string): Promise<T> => {
  const text = await res.text();
  let data: ActionResponse = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `${fallback} (${res.status})`);
  }
  return data as T;
}

export default function AdminInquiriesPage() {
  const router = useRouter();
  const [list, setList] = useState<Inquiry[]>([]);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [pricingVerifiedOnly, setPricingVerifiedOnly] = useState(false);
  const [pricingDeltaOnly, setPricingDeltaOnly] = useState(false);
  const [pricingDeltaSeverity, setPricingDeltaSeverity] = useState('');
  const [pricingUnverifiedOnly, setPricingUnverifiedOnly] = useState(false);
  const [pricingUnverifiedReason, setPricingUnverifiedReason] = useState('');
  const [pricingManualReviewOnly, setPricingManualReviewOnly] = useState(false);
  const [pricingSnapshotMissingOnly, setPricingSnapshotMissingOnly] = useState(false);
  const [pricingActionRequiredOnly, setPricingActionRequiredOnly] = useState(false);
  const [slaOverdueOnly, setSlaOverdueOnly] = useState(false);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  const [quoteSource, setQuoteSource] = useState<QuoteSource>('manual');
  const [quoteDraftDirty, setQuoteDraftDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorLoadError, setVendorLoadError] = useState('');
  const [assignVendorId, setAssignVendorId] = useState('');
  const [, bumpActiveActionVersion] = useState(0);
  const [actionMessage, setActionMessage] = useState<ActionMessage>(null);
  const [broadcastMode, setBroadcastMode] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const loadSeqRef = useRef(0);
  const loadAbortRef = useRef<AbortController | null>(null);
  const activeActionSetRef = useRef<Set<string>>(new Set());
  const activeInquirySetRef = useRef<Set<string>>(new Set());

  const headers = useMemo(() => {
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('access_token') || '') : '';
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, []);

  const load = useCallback(async () => {
    const requestId = loadSeqRef.current + 1;
    loadSeqRef.current = requestId;
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    const isLatestRequest = () => loadSeqRef.current === requestId;
    setLoading(true);
    setLoadError('');
    try {
      const queryString = buildAdminInquiryQuery({
        statusFilter,
        pricingVerifiedOnly,
        pricingDeltaOnly,
        pricingDeltaSeverity,
        pricingUnverifiedOnly,
        pricingUnverifiedReason,
        pricingManualReviewOnly,
        pricingSnapshotMissingOnly,
        pricingActionRequiredOnly,
        slaOverdueOnly,
      });
      const [listResult, sumResult] = await Promise.allSettled([
        fetch(`${API}/api/inquiries${queryString ? `?${queryString}` : ''}`, { headers, signal: controller.signal }),
        fetch(`${API}/api/inquiries/admin/summary`, { headers, signal: controller.signal }),
      ]);
      if (!isLatestRequest()) return;
      if (listResult.status === 'fulfilled' && listResult.value.ok) {
        try {
          const nextList = await readJsonResponse<Inquiry[]>(listResult.value, 'Захиалгын жагсаалтын JSON уншихад алдаа гарлаа');
          if (isLatestRequest()) setList(nextList);
        } catch (error: unknown) {
          if (isLatestRequest()) {
            setLoadError(getErrorMessage(error, 'Захиалгын жагсаалтын JSON уншихад алдаа гарлаа'));
          }
        }
      } else if (listResult.status === 'fulfilled') {
        if (isLatestRequest()) setLoadError(`Захиалгын жагсаалт авахад алдаа гарлаа (${listResult.value.status})`);
      } else {
        if (!isAbortError(listResult.reason) && isLatestRequest()) {
          setLoadError(getErrorMessage(listResult.reason, 'Захиалгын жагсаалт авахад алдаа гарлаа'));
        }
      }
      if (sumResult.status === 'fulfilled' && sumResult.value.ok) {
        try {
          const nextSummary = await readJsonResponse<AdminSummary>(sumResult.value, 'Dashboard summary JSON уншихад алдаа гарлаа');
          if (isLatestRequest()) setSummary(nextSummary);
        } catch (error: unknown) {
          if (isLatestRequest()) {
            setLoadError(prev => prev || getErrorMessage(error, 'Dashboard summary JSON уншихад алдаа гарлаа'));
          }
        }
      } else if (sumResult.status === 'fulfilled') {
        if (isLatestRequest()) setLoadError(prev => prev || `Dashboard summary авахад алдаа гарлаа (${sumResult.value.status})`);
      } else {
        if (!isAbortError(sumResult.reason) && isLatestRequest()) {
          setLoadError(prev => prev || getErrorMessage(sumResult.reason, 'Dashboard summary авахад алдаа гарлаа'));
        }
      }
    } catch (e: unknown) {
      if (isAbortError(e)) return;
      if (isLatestRequest()) {
        setLoadError(getErrorMessage(e, 'Захиалгын мэдээлэл авахад алдаа гарлаа'));
      }
    } finally {
      if (loadAbortRef.current === controller) loadAbortRef.current = null;
      if (isLatestRequest()) setLoading(false);
    }
  }, [headers, pricingActionRequiredOnly, pricingDeltaOnly, pricingDeltaSeverity, pricingManualReviewOnly, pricingSnapshotMissingOnly, pricingUnverifiedOnly, pricingUnverifiedReason, pricingVerifiedOnly, slaOverdueOnly, statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => () => {
    loadAbortRef.current?.abort();
  }, []);

  const loadVendors = useCallback(async (signal?: AbortSignal) => {
    setVendorLoadError('');
    setVendorLoading(true);
    try {
      const res = await fetch(`${API}/api/vendors`, { headers, signal });
      if (!res.ok) {
        throw new Error(`Vendor жагсаалт авахад алдаа гарлаа (${res.status})`);
      }
      const data = await readJsonResponse<Vendor[] | { data?: Vendor[] }>(res, 'Vendor жагсаалтын JSON уншихад алдаа гарлаа');
      setVendors(Array.isArray(data) ? data : data.data || []);
    } catch (error: unknown) {
      if (isAbortError(error)) return;
      setVendorLoadError(getErrorMessage(error, 'Vendor жагсаалт авахад алдаа гарлаа'));
    } finally {
      if (!signal?.aborted) setVendorLoading(false);
    }
  }, [headers]);

  // Load vendors once for the assignment dropdown
  useEffect(() => {
    const controller = new AbortController();
    void loadVendors(controller.signal);
    return () => controller.abort();
  }, [loadVendors]);

  const clearActionMessage = () => {
    setActionMessage(null);
  };

  const showActionSuccess = (inquiryId: string, text: string) => {
    setActionMessage({ inquiryId, type: 'success', text });
  };

  const showActionError = (inquiryId: string, text: string) => {
    setActionMessage({ inquiryId, type: 'error', text });
  };

  const refreshActiveActionUi = () => {
    bumpActiveActionVersion(value => value + 1);
  };

  const markInquiryBusy = (inquiryId: string) => {
    if (inquiryId) activeInquirySetRef.current.add(inquiryId);
  };

  const clearInquiryBusy = (inquiryId: string) => {
    if (inquiryId) activeInquirySetRef.current.delete(inquiryId);
  };

  const markActionActive = (actionKey: string, inquiryId: string) => {
    activeActionSetRef.current.add(actionKey);
    markInquiryBusy(inquiryId);
    refreshActiveActionUi();
  };

  const clearActiveAction = (actionKey: string, inquiryId: string) => {
    activeActionSetRef.current.delete(actionKey);
    clearInquiryBusy(inquiryId);
    refreshActiveActionUi();
  };

  const isActionBlocked = (actionKey: string, inquiryId: string) => {
    if (activeActionSetRef.current.has(actionKey)) return true;
    if (!inquiryId) return false;
    return activeInquirySetRef.current.has(inquiryId);
  };

  const runInquiryAction = async (actionKey: string, fallback: string, work: () => Promise<void>) => {
    const inquiryId = getInquiryIdFromActionKey(actionKey);
    if (isActionBlocked(actionKey, inquiryId)) return;
    markActionActive(actionKey, inquiryId);
    clearActionMessage();
    try {
      await work();
    } catch (e: unknown) {
      showActionError(inquiryId, getErrorMessage(e, fallback));
    } finally {
      clearActiveAction(actionKey, inquiryId);
    }
  };

  const resetVendorAssignmentState = () => {
    setAssignVendorId('');
    setSelectedVendors([]);
    setBroadcastMode(false);
  };

  const resetQuoteDraft = (price = '', note = '') => {
    setQuotePrice(price);
    setQuoteNote(note);
    setQuoteSource('manual');
    setQuoteDraftDirty(false);
  };

  const syncCleanQuoteDraft = (price = '', note = '') => {
    setQuotePrice(current => (current === price ? current : price));
    setQuoteNote(current => (current === note ? current : note));
    setQuoteSource(current => (current === 'manual' ? current : 'manual'));
    setQuoteDraftDirty(current => (current ? false : current));
  };

  const setQuoteDraftAmount = (price: unknown, source: QuoteSource, note?: string) => {
    const value = getQuoteInputValue(price);
    if (value) setQuotePrice(value);
    setQuoteSource(source);
    if (note !== undefined) setQuoteNote(note);
    setQuoteDraftDirty(true);
  };

  const updateManualQuotePrice = (price: string) => {
    setQuotePrice(price);
    setQuoteSource('manual');
    setQuoteDraftDirty(true);
  };

  const updateManualQuoteNote = (note: string) => {
    setQuoteNote(note);
    setQuoteSource('manual');
    setQuoteDraftDirty(true);
  };

  const resetInquiryFormState = (inquiry?: Inquiry | null) => {
    resetQuoteDraft(inquiry ? getQuoteInputValue(inquiry.quoted_price) : '');
    clearActionMessage();
    resetVendorAssignmentState();
  };

  useEffect(() => {
    if (!selected?.id) return;
    const latest = list.find(inquiry => inquiry.id === selected.id);
    if (!latest) {
      setSelected(null);
      resetInquiryFormState(null);
      return;
    }
    setSelected(current => (current?.id === latest.id && current !== latest ? latest : current));
    if (!quoteDraftDirty) {
      syncCleanQuoteDraft(getQuoteInputValue(latest.quoted_price));
    }
  }, [list, quoteDraftDirty, selected?.id]);

  const assignVendor = async (inquiryId: string) => {
    const vendorId = assignVendorId;
    if (!vendorId) return;
    if (!assignableVendorIdSet.has(vendorId)) {
      setAssignVendorId('');
      showActionError(inquiryId, 'Сонгосон vendor ашиглах боломжгүй байна');
      return;
    }
    const actionKey = getInquiryActionKey('assign', inquiryId);
    await runInquiryAction(actionKey, 'Vendor хуваарилж чадсангүй', async () => {
      const vendorName = assignableVendors.find(v => v.id === vendorId)?.company_name || 'Vendor';
      const res = await fetch(`${API}/api/inquiries/${inquiryId}/assign-vendor`, {
        method: 'POST', headers,
        body: JSON.stringify({ vendorId }),
      });
      await readActionResponse(res, 'Vendor хуваарилахад алдаа гарлаа');
      resetVendorAssignmentState();
      await load();
      showActionSuccess(inquiryId, `${vendorName} үйлдвэрт амжилттай хуваариллаа`);
    });
  };

  const broadcast = async (inquiryId: string) => {
    const vendorIds = selectedVendors.filter(vendorId => assignableVendorIdSet.has(vendorId));
    if (vendorIds.length === 0) {
      setSelectedVendors([]);
      showActionError(inquiryId, 'Broadcast илгээх боломжтой vendor сонгоно');
      return;
    }
    if (vendorIds.length !== selectedVendors.length) {
      setSelectedVendors(vendorIds);
    }
    const actionKey = getInquiryActionKey('broadcast', inquiryId);
    await runInquiryAction(actionKey, 'Broadcast илгээж чадсангүй', async () => {
      const res = await fetch(`${API}/api/inquiries/${inquiryId}/broadcast`, {
        method: 'POST', headers,
        body: JSON.stringify({ vendorIds }),
      });
      const data = await readActionResponse(res, 'Broadcast илгээхэд алдаа гарлаа');
      resetVendorAssignmentState();
      await load();
      const skippedCount = getCountValue(data?.skippedVendorCount);
      showActionSuccess(inquiryId, `${formatCount(data?.vendorCount)} үйлдвэрт broadcast илгээлээ${skippedCount > 0 ? `, ${formatCount(skippedCount)} vendor алгассан` : ''}`);
    });
  };

  const updateStatus = async (id: string, status: InquiryStatusAction) => {
    const actionKey = getInquiryActionKey('status', id, status);
    await runInquiryAction(actionKey, 'Статус солиж чадсангүй', async () => {
      const res = await fetch(`${API}/api/inquiries/${id}/status`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ status }),
      });
      await readActionResponse(res, 'Статус солиход алдаа гарлаа');
      await load();
      showActionSuccess(id, `Статус "${getStatusLabel(status)}" боллоо`);
    });
  };

  const sendQuote = async (id: string) => {
    const inquiry = list.find(item => item.id === id) || selected || undefined;
    const quoteAmount = toPositiveNumber(quotePrice);
    const quotePayload = {
      price: quoteAmount,
      notes: normalizeQuoteNote(quoteNote),
      source: quoteSource,
    };
    const blocker = getQuoteBlocker(quoteAmount, inquiry);
    if (blocker) {
      showActionError(id, blocker);
      return;
    }
    const actionKey = getInquiryActionKey('quote', id);
    await runInquiryAction(actionKey, 'Үнэ илгээж чадсангүй', async () => {
      const res = await fetch(`${API}/api/inquiries/${id}/quote`, {
        method: 'POST', headers,
        body: JSON.stringify(quotePayload),
      });
      await readActionResponse(res, 'Үнэ илгээхэд алдаа гарлаа');
      resetQuoteDraft();
      await load();
      showActionSuccess(id, 'Үнийн санал амжилттай илгээгдлээ');
    });
  };

  const repriceInquiry = async (id: string) => {
    const actionKey = getInquiryActionKey('reprice', id);
    await runInquiryAction(actionKey, 'Дахин үнэ бодож чадсангүй', async () => {
      const res = await fetch(`${API}/api/inquiries/${id}/reprice`, {
        method: 'POST',
        headers,
      });
      const updated = await readActionResponse<Inquiry>(res, 'Дахин үнэ бодоход алдаа гарлаа');
      await load();
      if (updated?.id) {
        setSelected(updated);
        const price = getInquiryEstimatedPrice(updated);
        resetQuoteDraft(getQuoteInputValue(firstPositiveNumber(price, updated.quoted_price)), 'Backend дахин тооцоолол');
        const formattedPrice = formatMoney(price);
        showActionSuccess(id, price > 0 ? `Backend үнэ амжилттай шинэчлэгдлээ: ${formattedPrice}` : 'Backend үнэ амжилттай шинэчлэгдлээ');
      }
    });
  };

  const forceReassign = async (id: string) => {
    const actionKey = getInquiryActionKey('force-reassign', id);
    await runInquiryAction(actionKey, 'Дахин хуваарилж чадсангүй', async () => {
      const res = await fetch(`${API}/api/inquiries/${id}/force-reassign`, {
        method: 'POST',
        headers,
      });
      await readActionResponse(res, 'Дахин хуваарилахад алдаа гарлаа');
      await load();
      showActionSuccess(id, 'SLA force reassign амжилттай илгээгдлээ');
    });
  };

  const applyEstimatedQuote = (inquiry: Inquiry) => {
    const blocker = getAutoQuoteBlocker(inquiry);
    if (blocker) {
      showActionError(inquiry.id, blocker);
      return;
    }
    const price = getInquiryEstimatedPrice(inquiry);
    setQuoteDraftAmount(price, 'auto_verified', normalizeQuoteNote(quoteNote) || getAutoQuoteNote(inquiry.pricing_snapshot));
  };

  const pricingCounts = useMemo(() => {
    const fallback = list.reduce((counts, inquiry) => {
      const confidenceLevel = getPricingConfidenceBadge(inquiry.pricing_snapshot).level;
      const hasEstimatedPrice = getInquiryEstimatedPrice(inquiry) > 0;
      if (hasPricingDelta(inquiry.pricing_snapshot)) counts.delta += 1;
      if (hasVerifiedPricing(inquiry.pricing_snapshot)) counts.verified += 1;
      if (hasVerificationError(inquiry.pricing_snapshot)) counts.unverified += 1;
      if (confidenceLevel === 'server-preview' || confidenceLevel === 'client-preview') counts.manualReview += 1;
      if (confidenceLevel === 'missing') counts.snapshotMissing += 1;
      if (isPricingActionRequired(inquiry.pricing_snapshot, hasEstimatedPrice)) counts.actionRequired += 1;
      if (isSlaOverdue(inquiry)) counts.slaOverdue += 1;
      return counts;
    }, {
      delta: 0,
      verified: 0,
      unverified: 0,
      manualReview: 0,
      snapshotMissing: 0,
      actionRequired: 0,
      slaOverdue: 0,
    });

    const delta = getCountValue(summary?.pricing_delta_count, fallback.delta);
    const verified = getCountValue(summary?.pricing_verified_count, fallback.verified);
    const unverified = getCountValue(summary?.pricing_unverified_count, fallback.unverified);
    return {
      delta,
      verified,
      unverified,
      deltaMinor: getCountValue(summary?.pricing_delta_minor_count),
      deltaWarning: getCountValue(summary?.pricing_delta_warning_count),
      deltaCritical: getCountValue(summary?.pricing_delta_critical_count),
      missingMaterial: getCountValue(summary?.pricing_missing_material_count),
      missingSize: getCountValue(summary?.pricing_missing_size_count),
      autoQuoteReady: getCountValue(summary?.pricing_auto_quote_ready_count, verified),
      repriceRequired: getCountValue(summary?.pricing_reprice_required_count, delta),
      inputFixRequired: getCountValue(summary?.pricing_input_fix_required_count, unverified),
      manualReview: getCountValue(summary?.pricing_manual_review_count, fallback.manualReview),
      snapshotMissing: getCountValue(summary?.pricing_snapshot_missing_count, fallback.snapshotMissing),
      actionRequired: getCountValue(summary?.pricing_action_required_count, fallback.actionRequired),
      slaOverdue: getCountValue(summary?.sla_overdue_count, fallback.slaOverdue),
    };
  }, [list, summary]);
  const pricingDeltaCount = pricingCounts.delta;
  const pricingVerifiedCount = pricingCounts.verified;
  const pricingUnverifiedCount = pricingCounts.unverified;
  const pricingDeltaMinorCount = pricingCounts.deltaMinor;
  const pricingDeltaWarningCount = pricingCounts.deltaWarning;
  const pricingDeltaCriticalCount = pricingCounts.deltaCritical;
  const pricingMissingMaterialCount = pricingCounts.missingMaterial;
  const pricingMissingSizeCount = pricingCounts.missingSize;
  const pricingAutoQuoteReadyCount = pricingCounts.autoQuoteReady;
  const pricingRepriceRequiredCount = pricingCounts.repriceRequired;
  const pricingInputFixRequiredCount = pricingCounts.inputFixRequired;
  const pricingManualReviewCount = pricingCounts.manualReview;
  const pricingSnapshotMissingCount = pricingCounts.snapshotMissing;
  const pricingActionRequiredCount = pricingCounts.actionRequired;
  const slaOverdueCount = pricingCounts.slaOverdue;
  const assignableVendors = useMemo(() => vendors.filter(isAssignableVendor), [vendors]);
  const assignableVendorIdSet = useMemo(() => new Set(assignableVendors.map(vendor => vendor.id)), [assignableVendors]);
  const incompleteVendorCount = Math.max(0, vendors.length - assignableVendors.length);
  useEffect(() => {
    setAssignVendorId(current => (current && !assignableVendorIdSet.has(current) ? '' : current));
    setSelectedVendors(current => {
      const next = current.filter(vendorId => assignableVendorIdSet.has(vendorId));
      return next.length === current.length ? current : next;
    });
  }, [assignableVendorIdSet]);
  const visibleList = list;
  const clearPricingFilters = () => {
    setPricingVerifiedOnly(false);
    setPricingDeltaOnly(false);
    setPricingDeltaSeverity('');
    setPricingUnverifiedOnly(false);
    setPricingUnverifiedReason('');
    setPricingManualReviewOnly(false);
    setPricingSnapshotMissingOnly(false);
    setPricingActionRequiredOnly(false);
    setSlaOverdueOnly(false);
  };
  const clearAllFilters = () => {
    setStatusFilter('');
    clearPricingFilters();
  };
  const selectPricingFilter = (filter: PricingFilterKey) => {
    clearPricingFilters();
    if (filter === 'verified') setPricingVerifiedOnly(true);
    if (filter === 'delta') setPricingDeltaOnly(true);
    if (filter === 'unverified') setPricingUnverifiedOnly(true);
    if (filter === 'manual') setPricingManualReviewOnly(true);
    if (filter === 'missing') setPricingSnapshotMissingOnly(true);
    if (filter === 'action') setPricingActionRequiredOnly(true);
    if (filter === 'sla') setSlaOverdueOnly(true);
  };
  const togglePricingFilter = (filter: PricingFilterKey, active: boolean) => {
    if (active) {
      clearPricingFilters();
      return;
    }
    selectPricingFilter(filter);
  };
  const activePricingFilterLabel = pricingVerifiedOnly
    ? 'Auto quote OK'
    : pricingActionRequiredOnly
      ? 'Action шаардсан'
      : pricingDeltaOnly
        ? pricingDeltaSeverity ? `Үнийн зөрүү: ${pricingDeltaSeverity}` : 'Дахин бодох'
        : pricingUnverifiedOnly
          ? pricingUnverifiedReason ? `Оролт засах: ${pricingUnverifiedReason}` : 'Оролт засах'
          : pricingManualReviewOnly
            ? 'Гараар шалгах'
            : pricingSnapshotMissingOnly
              ? 'Snapshot алга'
              : slaOverdueOnly
                ? 'SLA хэтэрсэн'
                : '';
  const activeStatusFilterLabel = statusFilter
    ? `Төлөв: ${getStatusLabel(statusFilter)}`
    : '';
  const hasAnyActiveFilter = !!(activeStatusFilterLabel || activePricingFilterLabel);
  const isActionActive = (kind: InquiryActionKind, inquiryId: string, detail = '') => {
    return activeActionSetRef.current.has(getInquiryActionKey(kind, inquiryId, detail));
  };
  const isInquiryBusy = (inquiryId: string) => {
    return activeInquirySetRef.current.has(inquiryId);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">Захиалгын хүсэлтүүд</h1>
        <button onClick={load} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">↻ Шинэчлэх</button>
      </div>

      {loadError && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="w-fit rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-gray-950 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            {loading ? 'Ачаалж байна...' : 'Дахин оролдох'}
          </button>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3 mb-6">
          {[
            { l: 'Нийт', v: summary.total, c: 'text-gray-900 dark:text-gray-100' },
            { l: 'Шинэ', v: summary.new_count, c: 'text-blue-600' },
            { l: 'Хянаж байна', v: summary.reviewing, c: 'text-amber-600' },
            { l: 'Үнэ санал', v: summary.quoted, c: 'text-purple-600' },
            { l: 'Уншаагүй', v: summary.unread_messages, c: 'text-red-600' },
            { l: 'Үнэ баталгаатай', v: pricingVerifiedCount, c: 'text-green-600' },
            { l: 'Үнийн зөрүү', v: pricingDeltaCount, c: 'text-amber-600' },
            { l: 'Үнэ баталгаажаагүй', v: pricingUnverifiedCount, c: 'text-red-600' },
            { l: 'SLA хэтэрсэн', v: slaOverdueCount, c: 'text-red-600' },
          ].map((s, index) => (
            <button
              key={s.l}
              type="button"
              onClick={index === 5 ? () => selectPricingFilter('verified') : index === 6 ? () => selectPricingFilter('delta') : index === 7 ? () => selectPricingFilter('unverified') : index === 8 ? () => selectPricingFilter('sla') : undefined}
              className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center ${index === 5 ? 'cursor-pointer hover:border-green-300 dark:hover:border-green-700' : index === 6 ? 'cursor-pointer hover:border-amber-300 dark:hover:border-amber-700' : index === 7 || index === 8 ? 'cursor-pointer hover:border-red-300 dark:hover:border-red-700' : 'cursor-default'}`}
            >
              <p className={`text-2xl font-medium ${s.c}`}>{formatCount(s.v)}</p>
              <p className="text-xs text-gray-400 mt-1">{s.l}</p>
            </button>
          ))}
        </div>
      )}

      {summary && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            { l: 'Action шаардсан', v: pricingActionRequiredCount, c: 'text-red-700', bg: 'bg-red-50 dark:bg-red-950/20', activeClass: 'border-red-500 ring-red-200 dark:border-red-500 dark:ring-red-900/50', filter: 'action' as const, active: pricingActionRequiredOnly },
            { l: 'Auto quote OK', v: pricingAutoQuoteReadyCount, c: 'text-green-700', bg: 'bg-green-50 dark:bg-green-950/20', activeClass: 'border-green-500 ring-green-200 dark:border-green-500 dark:ring-green-900/50', filter: 'verified' as const, active: pricingVerifiedOnly },
            { l: 'Дахин бодох', v: pricingRepriceRequiredCount, c: 'text-amber-700', bg: 'bg-amber-50 dark:bg-amber-950/20', activeClass: 'border-amber-500 ring-amber-200 dark:border-amber-500 dark:ring-amber-900/50', filter: 'delta' as const, active: pricingDeltaOnly },
            { l: 'Оролт засах', v: pricingInputFixRequiredCount, c: 'text-red-700', bg: 'bg-red-50 dark:bg-red-950/20', activeClass: 'border-red-500 ring-red-200 dark:border-red-500 dark:ring-red-900/50', filter: 'unverified' as const, active: pricingUnverifiedOnly },
            { l: 'Гараар шалгах', v: pricingManualReviewCount, c: 'text-amber-700', bg: 'bg-amber-50 dark:bg-amber-950/20', activeClass: 'border-amber-500 ring-amber-200 dark:border-amber-500 dark:ring-amber-900/50', filter: 'manual' as const, active: pricingManualReviewOnly },
            { l: 'Snapshot алга', v: pricingSnapshotMissingCount, c: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-900', activeClass: 'border-gray-500 ring-gray-200 dark:border-gray-500 dark:ring-gray-800', filter: 'missing' as const, active: pricingSnapshotMissingOnly },
          ].map(item => {
            const active = item.active;
            return (
              <button
                key={item.l}
                type="button"
                aria-pressed={active}
                onClick={() => selectPricingFilter(item.filter)}
                className={`rounded-xl border px-4 py-3 text-left transition-colors hover:border-gray-400 dark:hover:border-gray-500 ${item.bg} ${
                  active ? `${item.activeClass} ring-2` : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <p className={`text-xl font-semibold ${item.c}`}>{formatCount(item.v)}</p>
                <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{item.l}</p>
              </button>
            );
          })}
        </div>
      )}

      {pricingActionRequiredCount > 0 && (
        <button
          type="button"
          onClick={() => selectPricingFilter('action')}
          className="mb-4 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300"
        >
          <span className="font-semibold">Үнэний action queue байна: </span>
          {formatCount(pricingActionRequiredCount)} захиалга. Дарж дахин бодох, оролт засах, гараар шалгах болон snapshot дутуу бүх захиалгыг нэг дор харна.
        </button>
      )}

      {pricingDeltaCriticalCount > 0 && (
        <button
          type="button"
          onClick={() => { selectPricingFilter('delta'); setPricingDeltaSeverity('critical'); }}
          className="mb-4 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300"
        >
          <span className="font-semibold">Ноцтой үнийн зөрүү байна: </span>
          {formatCount(pricingDeltaCriticalCount)} захиалга. Дарж зөвхөн ноцтой зөрүүтэй захиалгыг харна.
        </button>
      )}

      {pricingUnverifiedCount > 0 && (
        <button
          type="button"
          onClick={() => selectPricingFilter('unverified')}
          className="mb-4 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-left text-sm text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:bg-gray-900 dark:text-red-300 dark:hover:bg-red-950/20"
        >
          <span className="font-semibold">Backend үнэ баталгаажаагүй захиалга байна: </span>
          {formatCount(pricingUnverifiedCount)} захиалга. Дарж материал/хэмжээ дутуу эсэхийг шалгана.
        </button>
      )}

      {slaOverdueCount > 0 && (
        <button
          type="button"
          onClick={() => selectPricingFilter('sla')}
          className="mb-4 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300"
        >
          <span className="font-semibold">Үйлдвэр SLA хэтэрсэн захиалга байна: </span>
          {formatCount(slaOverdueCount)} захиалга. Дарж force reassign хийх шаардлагатай захиалгыг харна.
        </button>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_OPTS.map(o => (
          <button key={o.v} onClick={() => setStatusFilter(o.v)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${statusFilter === o.v ? 'bg-orange-500 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'}`}>
            {o.l}
          </button>
        ))}
        <button
          onClick={() => togglePricingFilter('verified', pricingVerifiedOnly)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pricingVerifiedOnly ? 'bg-green-600 text-white' : 'border border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/60 dark:text-green-300 dark:hover:bg-green-950/20'}`}
        >
          Үнэ баталгаатай ({pricingVerifiedCount})
        </button>
        <button
          onClick={() => togglePricingFilter('delta', pricingDeltaOnly)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pricingDeltaOnly ? 'bg-amber-500 text-white' : 'border border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/60 dark:text-amber-300 dark:hover:bg-amber-950/20'}`}
        >
          Үнийн зөрүү ({pricingDeltaCount})
        </button>
        <button
          onClick={() => togglePricingFilter('unverified', pricingUnverifiedOnly)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pricingUnverifiedOnly ? 'bg-red-500 text-white' : 'border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/20'}`}
        >
          Үнэ баталгаажаагүй ({pricingUnverifiedCount})
        </button>
        <button
          onClick={() => togglePricingFilter('sla', slaOverdueOnly)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${slaOverdueOnly ? 'bg-red-600 text-white' : 'border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/20'}`}
        >
          SLA хэтэрсэн ({slaOverdueCount})
        </button>
        {hasAnyActiveFilter && (
          <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            {[activeStatusFilterLabel, activePricingFilterLabel].filter(Boolean).join(' · ')}
            {activePricingFilterLabel && (
              <button
                type="button"
                onClick={clearPricingFilters}
                className="rounded-md px-1 text-gray-400 hover:bg-white hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              >
                Pricing цэвэрлэх
              </button>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="rounded-md px-1 text-gray-400 hover:bg-white hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            >
              Бүгдийг цэвэрлэх
            </button>
          </span>
        )}
        {pricingUnverifiedOnly && [
          { v: '', l: 'Бүх шалтгаан', count: pricingUnverifiedCount },
          { v: 'missing_material', l: 'Материал дутуу', count: pricingMissingMaterialCount },
          { v: 'missing_size', l: 'Хэмжээ дутуу', count: pricingMissingSizeCount },
        ].map(o => (
          <button
            key={o.v}
            onClick={() => setPricingUnverifiedReason(o.v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pricingUnverifiedReason === o.v ? 'bg-red-600 text-white' : 'border border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700'}`}
          >
            {o.l} ({formatCount(o.count)})
          </button>
        ))}
        {pricingDeltaOnly && [
          { v: '', l: 'Бүх зөрүү' },
          { v: 'critical', l: 'Ноцтой' },
          { v: 'warning', l: 'Анхаарах' },
          { v: 'minor', l: 'Бага' },
        ].map(o => (
          <button
            key={o.v}
            onClick={() => setPricingDeltaSeverity(o.v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pricingDeltaSeverity === o.v ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'border border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700'}`}
          >
            {o.l} ({formatCount(o.v === 'critical' ? pricingDeltaCriticalCount : o.v === 'warning' ? pricingDeltaWarningCount : o.v === 'minor' ? pricingDeltaMinorCount : pricingDeltaCount)})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      ) : (
        <div className="space-y-2">
          {visibleList.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">Захиалга байхгүй байна</div>
          )}
          {visibleList.map(inq => {
            const inquiryBusy = isInquiryBusy(inq.id);
            const quoteBlocker = getQuoteBlocker(quotePrice, inq);
            const quoteDisabled = inquiryBusy || !!quoteBlocker;
            const quoteActive = isActionActive('quote', inq.id);
            const autoQuoteBlocker = getAutoQuoteBlocker(inq);
            const repriceBlocker = getRepriceBlocker(inq);
            const repriceActive = isActionActive('reprice', inq.id);
            const forceReassignActive = isActionActive('force-reassign', inq.id);
            const assignActive = isActionActive('assign', inq.id);
            const broadcastActive = isActionActive('broadcast', inq.id);
            const estimatedPrice = getInquiryEstimatedPrice(inq);
            const slaOverdue = isSlaOverdue(inq);
            const pricingConfidence = getPricingConfidenceBadge(inq.pricing_snapshot);
            const pricingSource = getPricingSourceLabel(inq.pricing_snapshot);
            const telHref = getTelHref(inq.customer_phone);
            const viberHref = getViberHref(inq.customer_phone);
            const mailtoHref = getMailtoHref(inq.customer_email);
            const displayPrice = formatMoney(getInquiryDisplayPrice(inq));
            const scopedActionMessage = actionMessage?.inquiryId === inq.id ? actionMessage : null;
            return (
            <div key={inq.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
              onClick={() => {
                const next = selected?.id === inq.id ? null : inq;
                setSelected(next);
                resetInquiryFormState(next);
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                      #{inq.inquiry_number}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(inq.status)}`}>
                      {getStatusLabel(inq.status)}
                    </span>
                    {pricingConfidence && (
                      <span
                        title={pricingConfidence.description}
                        className={`text-xs px-2 py-0.5 rounded-full ${pricingConfidence.className}`}
                      >
                        {pricingConfidence.label}
                      </span>
                    )}
                    {slaOverdue && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                        SLA хэтэрсэн
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {getContactIcon(inq.preferred_contact)} {getContactLabel(inq.preferred_contact)}
                    </span>
                    {inq.files?.length > 0 && (
                      <span className="text-xs text-blue-600">📎 {inq.files.length} файл</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {formatInquiryProductLine(inq)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatCustomerContact(inq)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {displayPrice && (
                    <p className="text-sm font-medium text-orange-500">{displayPrice}</p>
                  )}
                  {pricingSource && (
                    <p className={`mt-1 text-[10px] font-semibold ${inq.pricing_snapshot?.source === 'server' ? 'text-green-600' : 'text-amber-600'}`}>
                      {pricingSource}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(inq.created_at).toLocaleDateString('mn-MN')}
                  </p>
                </div>
              </div>

              {selected?.id === inq.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3" onClick={e => e.stopPropagation()}>
                  {isWideInquiry(inq) && (
                    <button
                      onClick={() => repriceInquiry(inq.id)}
                      disabled={inquiryBusy || !!repriceBlocker}
                      className="w-full rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300"
                    >
                      {repriceBlocker || (repriceActive ? 'Дахин бодож байна...' : 'Backend-ээр дахин үнэ бодох')}
                    </button>
                  )}

                  {slaOverdue && (
                    <button
                      onClick={() => forceReassign(inq.id)}
                      disabled={inquiryBusy}
                      className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300"
                    >
                      {forceReassignActive ? 'Дахин хуваарилж байна...' : 'SLA хэтэрсэн: дараагийн үйлдвэрт force reassign хийх'}
                    </button>
                  )}

                  {scopedActionMessage?.type === 'error' && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
                      {scopedActionMessage.text}
                    </div>
                  )}

                  {scopedActionMessage?.type === 'success' && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300">
                      {scopedActionMessage.text}
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-500 mb-2">Статус солих:</p>
                    <div className="flex gap-2 flex-wrap">
                      {STATUS_ACTIONS.map(s => {
                        const blocker = getStatusBlocker(inq, s);
                        const statusActive = isActionActive('status', inq.id, s);
                        const statusDisabled = !!blocker || inquiryBusy;
                        return (
                          <button
                            key={s}
                            onClick={() => updateStatus(inq.id, s)}
                            disabled={statusDisabled}
                            title={blocker || getStatusLabel(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                              statusDisabled && !statusActive
                                ? 'cursor-not-allowed border-gray-200 text-gray-300 dark:border-gray-800 dark:text-gray-600'
                                : inq.status === s
                                  ? 'border-orange-500 text-orange-600'
                                  : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {statusActive ? 'Солиж байна...' : (blocker || getStatusLabel(s))}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input type="number" value={quotePrice} onChange={e => updateManualQuotePrice(e.target.value)}
                      disabled={inquiryBusy}
                      placeholder="Үнэ (₮)" className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent" />
                    <input value={quoteNote} onChange={e => updateManualQuoteNote(e.target.value)}
                      disabled={inquiryBusy}
                      placeholder="Тайлбар" className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent" />
                    <button
                      onClick={() => sendQuote(inq.id)}
                      disabled={quoteDisabled}
                      className={`px-4 py-2 rounded-lg text-xs font-medium ${
                        quoteDisabled
                          ? 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                          : 'bg-purple-500 text-white'
                      }`}
                    >
                      {quoteActive ? 'Илгээж байна...' : (quoteBlocker || 'Үнэ илгээх')}
                    </button>
                  </div>

                  {estimatedPrice > 0 && (
                    <div className="space-y-2">
                      <div className={`rounded-lg px-3 py-2 text-xs ${pricingConfidence.className}`}>
                        <p className="font-semibold">{pricingConfidence.action}</p>
                        <p className="mt-1 opacity-80">{pricingConfidence.description}</p>
                      </div>
                      <button
                        onClick={() => applyEstimatedQuote(inq)}
                        disabled={inquiryBusy || !!autoQuoteBlocker}
                        className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                          inquiryBusy || autoQuoteBlocker
                            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-500'
                            : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300'
                        }`}
                      >
                        {inquiryBusy ? 'Action ажиллаж байна...' : (autoQuoteBlocker || 'Баталгаатай автомат үнийг санал болгох үнэ рүү оруулах')}
                      </button>
                      {autoQuoteBlocker && (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">
                          Гараар үнэ шалгаад илгээх боломжтой. Автомат quote товч зөвхөн backend-ээр баталгаатай, зөрүүгүй үед идэвхтэй байна.
                        </p>
                      )}
                    </div>
                  )}

                  <PricingSnapshotPanel
                    snapshot={inq.pricing_snapshot}
                    estimatedPrice={inq.estimated_price}
                    compact
                  />

                  {/* Vendor assignment — single or broadcast race */}
                  <div>
                    {vendorLoadError && (
                      <div className="mb-2 flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300 sm:flex-row sm:items-center sm:justify-between">
                        <span>{vendorLoadError}</span>
                        <button
                          type="button"
                          onClick={() => loadVendors()}
                          disabled={vendorLoading}
                          className="w-fit rounded-md border border-amber-200 bg-white px-2 py-1 font-semibold text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:bg-gray-950 dark:text-amber-300 dark:hover:bg-amber-950/30"
                        >
                          {vendorLoading ? 'Ачаалж байна...' : 'Дахин оролдох'}
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => setBroadcastMode(false)}
                        disabled={inquiryBusy}
                        className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${!broadcastMode ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-600' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                      >
                        Нэг vendor
                      </button>
                      <button
                        onClick={() => setBroadcastMode(true)}
                        disabled={inquiryBusy}
                        className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${broadcastMode ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 text-blue-600' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                      >
                        📡 Broadcast (race)
                      </button>
                    </div>

                    {!broadcastMode ? (
                      <div className="flex gap-2">
                        <select value={assignVendorId} onChange={e => setAssignVendorId(e.target.value)}
                          disabled={vendorLoading || inquiryBusy}
                          className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent">
                          <option value="">{vendorLoading ? 'Vendor жагсаалт ачаалж байна...' : '— Vendor сонгох —'}</option>
                          {assignableVendors.map(v => (
                            <option key={v.id} value={v.id}>
                              {v.company_name}{v.district ? ` (${v.district})` : ''}{v.rating ? ` ⭐${v.rating}` : ''}
                            </option>
                          ))}
                        </select>
                        <button onClick={() => assignVendor(inq.id)}
                          disabled={!assignVendorId || inquiryBusy}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50">
                          {assignActive ? '...' : 'Хуваарилах'}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="space-y-1 mb-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                          {vendorLoading && (
                            <p className="p-2 text-xs text-gray-500">Vendor жагсаалт ачаалж байна...</p>
                          )}
                          {assignableVendors.map(v => (
                            <label key={v.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                              <input type="checkbox"
                                disabled={inquiryBusy}
                                checked={selectedVendors.includes(v.id)}
                                onChange={e => setSelectedVendors(p => e.target.checked ? [...p, v.id] : p.filter(x => x !== v.id))} />
                              <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">{v.company_name}</span>
                              {Number(v.rating || 0) > 0 && <span className="text-xs text-gray-400">⭐{Number(v.rating).toFixed(1)}</span>}
                            </label>
                          ))}
                          {!vendorLoading && assignableVendors.length === 0 && (
                            <p className="p-2 text-xs text-red-600">Холбогдох боломжтой vendor алга</p>
                          )}
                        </div>
                        <button onClick={() => broadcast(inq.id)}
                          disabled={selectedVendors.length === 0 || inquiryBusy}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50">
                          {broadcastActive ? 'Broadcast илгээж байна...' : `📡 ${selectedVendors.length} vendor-т илгээх (эхлэгч нь авна)`}
                        </button>
                      </div>
                    )}
                    {incompleteVendorCount > 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        {incompleteVendorCount} vendor компанийн нэр эсвэл холбоо барих мэдээлэл дутуу тул нуусан.
                      </p>
                    )}
                    {inq.vendor_id && !inq.is_broadcast && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Хуваарилагдсан: {vendors.find(v => v.id === inq.vendor_id)?.company_name || inq.vendor_id.slice(0, 8)}
                      </p>
                    )}
                    {inq.is_broadcast && !inq.vendor_accepted && (
                      <p className="text-xs text-blue-600 mt-1">
                        📡 Broadcast идэвхтэй — {inq.broadcast_vendor_ids?.length || 0} vendor-т илгээгдсэн
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => router.push(`/inquiries/${inq.id}`)}
                      className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                      💬 Чат харах
                    </button>
                    {telHref && (
                      <a href={telHref}
                        className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                        📞 Залгах
                      </a>
                    )}
                    {viberHref && (
                      <a href={viberHref}
                        className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                        📱 Viber
                      </a>
                    )}
                    {mailtoHref && (
                      <a href={mailtoHref}
                        className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                        📧 Email
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
