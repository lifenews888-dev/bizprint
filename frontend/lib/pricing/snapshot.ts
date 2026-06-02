export interface PricingSnapshot {
  source?: string;
  verifiedBy?: string;
  serverDelta?: number | string;
  serverDeltaSeverity?: string;
  verificationError?: unknown;
  total?: number;
  clientSnapshotVersion?: string;
  pricingContractVersion?: string;
  pricingEngine?: string;
  [key: string]: unknown;
}

export const CLIENT_PRICING_SNAPSHOT_VERSION = 'client-pricing-v1';
export const PRICING_CONTRACT_VERSION = 'pricing-golden-v1';
export const CLIENT_ORDER_SERVER_PREVIEW_ENGINE = 'frontend.order-form.server-preview';
export const CLIENT_ORDER_FALLBACK_ENGINE = 'frontend.order-form.fallback';

export type PricingConfidenceLevel =
  | 'verified'
  | 'delta-critical'
  | 'delta'
  | 'verification-error'
  | 'server-preview'
  | 'client-preview'
  | 'missing';

export interface PricingConfidenceBadge {
  level: PricingConfidenceLevel;
  label: string;
  description: string;
  action: string;
  className: string;
  style: { background: string; color: string };
}

export const hasPricingDelta = (snapshot?: PricingSnapshot) => (
  snapshot?.verifiedBy === 'backend' && Math.abs(Number(snapshot?.serverDelta || 0)) > 0
);

export const hasVerificationError = (snapshot?: PricingSnapshot) => !!snapshot?.verificationError;

export const hasVerifiedPricing = (snapshot?: PricingSnapshot) => (
  snapshot?.verifiedBy === 'backend' && !hasVerificationError(snapshot) && !hasPricingDelta(snapshot)
);

export const pricingSourceLabel = (snapshot?: PricingSnapshot, backendLabel = 'Backend') => {
  if (snapshot?.source === 'server') return backendLabel;
  if (snapshot?.source === 'fallback') return 'Fallback';
  return '';
};

export const pricingDeltaLabel = (snapshot?: PricingSnapshot) => {
  if (!hasPricingDelta(snapshot)) return '';
  if (snapshot?.serverDeltaSeverity === 'critical') return 'Ноцтой зөрүү';
  if (snapshot?.serverDeltaSeverity === 'minor') return 'Бага зөрүү';
  return 'Анхаарах зөрүү';
};

export const pricingDeltaColor = (snapshot?: PricingSnapshot) => {
  if (snapshot?.serverDeltaSeverity === 'critical') return '#DC2626';
  if (snapshot?.serverDeltaSeverity === 'minor') return '#047857';
  return '#B45309';
};

export const pricingDeltaBadge = (snapshot?: PricingSnapshot) => {
  const label = pricingDeltaLabel(snapshot);
  if (!label) return null;
  if (snapshot?.serverDeltaSeverity === 'critical') {
    return { label, className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' };
  }
  if (snapshot?.serverDeltaSeverity === 'minor') {
    return { label, className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' };
  }
  return { label, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' };
};

export const getPricingConfidenceBadge = (snapshot?: PricingSnapshot): PricingConfidenceBadge => {
  if (hasVerifiedPricing(snapshot)) {
    return {
      level: 'verified',
      label: 'Авто quote OK',
      description: 'Backend үнэ баталгаажсан, client/server зөрүүгүй.',
      action: 'Шууд санал болгох боломжтой',
      className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
      style: { background: 'rgba(16,185,129,0.1)', color: '#047857' },
    };
  }

  if (hasPricingDelta(snapshot)) {
    const critical = snapshot?.serverDeltaSeverity === 'critical';
    return {
      level: critical ? 'delta-critical' : 'delta',
      label: pricingDeltaLabel(snapshot),
      description: 'Backend ба client үнэ зөрсөн тул автомат санал болгохоос өмнө дахин бодно.',
      action: 'Backend-ээр дахин бодох',
      className: critical
        ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
      style: critical
        ? { background: 'rgba(220,38,38,0.12)', color: '#DC2626' }
        : { background: 'rgba(245,158,11,0.12)', color: '#B45309' },
    };
  }

  if (hasVerificationError(snapshot)) {
    return {
      level: 'verification-error',
      label: 'Backend баталгаажаагүй',
      description: 'Үнэ бодох оролт дутуу эсвэл backend verification амжилтгүй.',
      action: 'Оролтыг засах',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
      style: { background: 'rgba(220,38,38,0.12)', color: '#DC2626' },
    };
  }

  if (snapshot?.source === 'server') {
    return {
      level: 'server-preview',
      label: 'Backend preview',
      description: 'Frontend дээр backend-ээс урьдчилсан үнэ авсан ч inquiry snapshot хараахан verified биш.',
      action: 'Backend verification хүлээх',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
      style: { background: 'rgba(245,158,11,0.12)', color: '#B45309' },
    };
  }

  if (snapshot) {
    return {
      level: 'client-preview',
      label: 'Гараар шалгах',
      description: 'Client талын түр snapshot тул оператор үнэ баталгаажуулна.',
      action: 'Гараар шалгах',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
      style: { background: 'rgba(245,158,11,0.12)', color: '#B45309' },
    };
  }

  return {
    level: 'missing',
    label: 'Snapshot алга',
    description: 'Үнийн audit snapshot байхгүй тул автомат санал болгохгүй.',
    action: 'Үнэ гараар бодох',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
    style: { background: 'rgba(148,163,184,0.14)', color: '#64748B' },
  };
};

export const isPricingActionRequired = (snapshot?: PricingSnapshot, hasEstimatedPrice = false) => {
  const level = getPricingConfidenceBadge(snapshot).level;
  if (level === 'verified') return false;
  if (level === 'missing') return hasEstimatedPrice;
  return true;
};
