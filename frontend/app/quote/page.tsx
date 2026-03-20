'use client';

import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';

const API = 'http://localhost:4000';
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";

/* ───────── types ───────── */

interface Material {
  code: string;
  name_mn: string;
  name_en?: string;
  price_per_unit?: number;
}

interface Size {
  code: string;
  name_mn: string;
  width_m?: number;
  height_m?: number;
  is_custom?: boolean;
}

interface Finishing {
  code: string;
  name_mn: string;
  price?: number;
}

interface Addon {
  code: string;
  name_mn: string;
  price?: number;
}

interface Product {
  code: string;
  name_mn: string;
  name_en?: string;
  category: string;
  subcategory?: string;
  unit_type?: string;
  materials: Material[];
  sizes: Size[];
  finishings?: Finishing[];
  addons?: Addon[];
}

interface CatalogProduct {
  code: string;
  name_mn: string;
  name_en?: string;
  category: string;
  subcategory?: string;
  unit_type?: string;
  materials: Material[];
  sizes: Size[];
}

interface PriceResult {
  base_price: number;
  final_price: number;
  unit_price: number;
  price_breakdown: { label: string; amount: number }[];
  rules_applied: string[];
  discounts: { label: string; amount: number }[];
  surcharges: { label: string; amount: number }[];
  finishing_cost: number;
  addon_cost: number;
  margin_amount: number;
  vs_market_pct: number | null;
  tactic_applied: boolean;
  novat_note: string;
  validity_hours: number;
}

/* ───────── helpers ───────── */

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US') + '₮';
}

const CATEGORY_MAP: Record<string, string> = {
  HADAG_REKLAM: 'Хаяг реклам', KHEVLEL: 'Хэвлэл', PROMO: 'Промо', AWARD: 'Шагнал',
  'Хаяг реклам': 'Хаяг реклам', 'Хэвлэл': 'Хэвлэл', 'Промо': 'Промо', 'Шагнал': 'Шагнал',
};
const CATEGORY_ORDER = ['Хаяг реклам', 'Хэвлэл', 'Промо', 'Шагнал'];
const CATEGORY_ICONS: Record<string, string> = {
  'Хаяг реклам': '\u{1F3E2}',
  'Хэвлэл': '\u{1F4C4}',
  'Промо': '\u{1F381}',
  'Шагнал': '\u{1F3C6}',
};

const RUSH_OPTIONS = [
  { label: 'Энгийн', hours: 0 },
  { label: '48цаг', hours: 48 },
  { label: '24цаг', hours: 24 },
] as const;

/* ───────── fallback catalog when DB is empty ───────── */

const FALLBACK_CATALOG: CatalogProduct[] = [
  {
    code: 'TOVGOR', name_mn: 'Товгор үсэг', name_en: 'Channel Letters', category: 'Хаяг реклам', subcategory: 'tovgor_usen', unit_type: 'PIECE',
    materials: [
      { code: 'PVC_3MM', name_mn: 'PVC 3мм', price_per_unit: 15000 },
      { code: 'PVC_5MM', name_mn: 'PVC 5мм', price_per_unit: 20000 },
      { code: 'ACRYLIC', name_mn: 'Акрил', price_per_unit: 35000 },
    ],
    sizes: [
      { code: '20CM', name_mn: '20 см', width_m: 0.2, height_m: 0.2 },
      { code: '30CM', name_mn: '30 см', width_m: 0.3, height_m: 0.3 },
      { code: '40CM', name_mn: '40 см', width_m: 0.4, height_m: 0.4 },
      { code: '50CM', name_mn: '50 см', width_m: 0.5, height_m: 0.5 },
      { code: '60CM', name_mn: '60 см', width_m: 0.6, height_m: 0.6 },
      { code: '80CM', name_mn: '80 см', width_m: 0.8, height_m: 0.8 },
      { code: '100CM', name_mn: '100 см', width_m: 1.0, height_m: 1.0 },
      { code: 'CUSTOM', name_mn: 'Тусгай хэмжээ', is_custom: true },
    ],
  },
  {
    code: 'NERJ_USEG', name_mn: 'Нерж үсэг', name_en: 'Stainless Steel Letters', category: 'Хаяг реклам', subcategory: 'nerj_usen', unit_type: 'M2',
    materials: [
      { code: 'NERJ_304', name_mn: 'Нерж 304', price_per_unit: 450000 },
      { code: 'NERJ_201', name_mn: 'Нерж 201', price_per_unit: 350000 },
    ],
    sizes: [
      { code: 'NO_LED', name_mn: 'Асдаггүй' },
      { code: 'LED', name_mn: 'Асдаг LED' },
      { code: 'CUSTOM', name_mn: 'Тусгай хэмжээ', is_custom: true },
    ],
  },
  {
    code: '3D_USEG', name_mn: '3D үсэг', name_en: '3D Letters', category: 'Хаяг реклам', subcategory: '3d_usen', unit_type: 'M2',
    materials: [{ code: 'FOAM_PVC', name_mn: 'Хөөс PVC', price_per_unit: 350000 }],
    sizes: [
      { code: 'NO_LIGHT', name_mn: 'Гэрэлгүй' },
      { code: 'LED', name_mn: 'Гэрэлтэй LED' },
    ],
  },
  {
    code: 'GERELT_SAMBAR', name_mn: 'Гэрэлт самбар', name_en: 'Light Box', category: 'Хаяг реклам', subcategory: 'sambar', unit_type: 'M2',
    materials: [{ code: 'ALUM_FRAME', name_mn: 'Хөнгөн цагаан хүрээ', price_per_unit: 180000 }],
    sizes: [
      { code: 'DOTOR_4CM', name_mn: 'Дотор 4см' },
      { code: 'DOTOR_6CM', name_mn: 'Дотор 6см' },
      { code: 'DOTOR_8CM', name_mn: 'Дотор 8см' },
      { code: 'GADNA_BULANTAI', name_mn: 'Гадна булантай' },
      { code: 'GADNA_SOKHDOG', name_mn: 'Гадна сөхдөг' },
    ],
  },
  {
    code: 'OFFSET_A4', name_mn: 'Офсет хэвлэл', name_en: 'Offset Printing', category: 'Хэвлэл', subcategory: 'offset', unit_type: 'PIECE',
    materials: [
      { code: '80GSM', name_mn: '80гр цаас', price_per_unit: 60 },
      { code: '120GSM', name_mn: '120гр цаас', price_per_unit: 90 },
      { code: '150GSM', name_mn: '150гр цаас', price_per_unit: 120 },
      { code: '200GSM', name_mn: '200гр цаас', price_per_unit: 160 },
      { code: '300GSM', name_mn: '300гр цаас', price_per_unit: 220 },
    ],
    sizes: [
      { code: 'A4', name_mn: 'A4 (210×297мм)', width_m: 0.21, height_m: 0.297 },
      { code: 'A3', name_mn: 'A3 (297×420мм)', width_m: 0.297, height_m: 0.42 },
      { code: 'A5', name_mn: 'A5 (148×210мм)', width_m: 0.148, height_m: 0.21 },
      { code: 'BUSINESS_CARD', name_mn: 'Визит карт (90×50мм)', width_m: 0.09, height_m: 0.05 },
    ],
  },
  {
    code: 'WIDE_FORMAT', name_mn: 'Өргөн хэвлэл', name_en: 'Wide Format Printing', category: 'Хэвлэл', subcategory: 'wide', unit_type: 'M2',
    materials: [
      { code: 'BANNER', name_mn: 'Баннер', price_per_unit: 5000 },
      { code: 'STICKER', name_mn: 'Стикер', price_per_unit: 8000 },
      { code: 'FLAG', name_mn: 'Даавуу туг', price_per_unit: 12000 },
      { code: 'CANVAS', name_mn: 'Canvas', price_per_unit: 15000 },
    ],
    sizes: [
      { code: '1x1', name_mn: '1м × 1м', width_m: 1, height_m: 1 },
      { code: '2x1', name_mn: '2м × 1м', width_m: 2, height_m: 1 },
      { code: '3x1', name_mn: '3м × 1м', width_m: 3, height_m: 1 },
      { code: 'CUSTOM', name_mn: 'Тусгай хэмжээ', is_custom: true },
    ],
  },
  {
    code: 'PROMO_ITEMS', name_mn: 'Промо бараа', name_en: 'Promotional Items', category: 'Промо', subcategory: 'promo', unit_type: 'PIECE',
    materials: [
      { code: 'PEN', name_mn: 'Үзэг', price_per_unit: 1500 },
      { code: 'NOTEBOOK', name_mn: 'Дэвтэр', price_per_unit: 5000 },
      { code: 'MUG', name_mn: 'Аяга', price_per_unit: 7000 },
      { code: 'TSHIRT', name_mn: 'Футболк', price_per_unit: 12000 },
    ],
    sizes: [{ code: 'STANDARD', name_mn: 'Стандарт' }],
  },
  {
    code: 'AWARDS', name_mn: 'Шагнал', name_en: 'Awards & Trophies', category: 'Шагнал', subcategory: 'award', unit_type: 'PIECE',
    materials: [
      { code: 'CRYSTAL', name_mn: 'Болор', price_per_unit: 25000 },
      { code: 'WOOD', name_mn: 'Мод', price_per_unit: 18000 },
      { code: 'MEDAL', name_mn: 'Медаль', price_per_unit: 6000 },
      { code: 'BADGE', name_mn: 'Тэмдэг', price_per_unit: 4000 },
    ],
    sizes: [
      { code: 'SMALL', name_mn: 'Жижиг' },
      { code: 'MEDIUM', name_mn: 'Дунд' },
      { code: 'LARGE', name_mn: 'Том' },
    ],
  },
];

const FALLBACK_PRICES: Record<string, Record<string, number>> = {
  TOVGOR: { '20CM': 35000, '30CM': 45000, '40CM': 60000, '50CM': 75000, '60CM': 95000, '80CM': 180000, '100CM': 290000, 'CUSTOM': 280000 },
  NERJ_USEG: { 'NO_LED': 850000, 'LED': 1300000, 'CUSTOM': 850000 },
  '3D_USEG': { 'NO_LIGHT': 850000, 'LED': 1250000 },
  GERELT_SAMBAR: { 'DOTOR_4CM': 280000, 'DOTOR_6CM': 320000, 'DOTOR_8CM': 350000, 'GADNA_BULANTAI': 380000, 'GADNA_SOKHDOG': 450000 },
  OFFSET_A4: { 'A4': 150, 'A3': 280, 'A5': 90, 'BUSINESS_CARD': 60 },
  WIDE_FORMAT: { '1x1': 8000, '2x1': 16000, '3x1': 24000, 'CUSTOM': 8000 },
  PROMO_ITEMS: { 'STANDARD': 2500 },
  AWARDS: { 'SMALL': 8000, 'MEDIUM': 25000, 'LARGE': 45000 },
};

const FALLBACK_FINISHINGS: Finishing[] = [
  { code: 'MAT_LAM', name_mn: 'Мат ламинаци', price: 15 },
  { code: 'GLOSS_LAM', name_mn: 'Гялгар ламинаци', price: 12 },
  { code: 'UV', name_mn: 'UV лак', price: 20 },
  { code: 'SOFT_TOUCH', name_mn: 'Soft touch', price: 25 },
  { code: 'FOIL', name_mn: 'Фойл тамга', price: 50 },
];

const FALLBACK_ADDONS: Addon[] = [
  { code: 'CRANE_1H', name_mn: 'Кран 1 цаг', price: 200000 },
  { code: 'CRANE_8H', name_mn: 'Кран 8 цаг', price: 600000 },
  { code: 'RELE', name_mn: 'Реле', price: 25000 },
  { code: 'TOG_BUURUULAGCH', name_mn: 'Тог бууруулагч', price: 45000 },
  { code: 'DESIGN', name_mn: 'Дизайн ажил', price: 50000 },
  { code: 'DELIVERY', name_mn: 'Хүргэлт', price: 15000 },
  { code: 'INSTALL', name_mn: 'Суурилуулалт м²', price: 80000 },
];

const MARGIN_RATES: Record<string, number> = { b2b: 0.20, retail: 0.45 };
const RUSH_RATES: Record<number, number> = { 24: 0.30, 48: 0.15, 0: 0 };
const QTY_DISCOUNTS = [
  { min: 5000, pct: 0.20 },
  { min: 1000, pct: 0.15 },
  { min: 500, pct: 0.10 },
  { min: 100, pct: 0.05 },
];

function localCalculate(params: {
  productCode: string; sizeCode: string; materialPrice: number;
  quantity: number; finishingCodes: string[]; addonCodes: string[];
  rushHours: number; tier: string;
}): PriceResult {
  const { productCode, sizeCode, materialPrice, quantity, finishingCodes: fc, addonCodes: ac, rushHours, tier } = params;
  const sizePrice = FALLBACK_PRICES[productCode]?.[sizeCode] || materialPrice || 0;
  let base = sizePrice * quantity;
  const discounts: { label: string; amount: number }[] = [];
  const surcharges: { label: string; amount: number }[] = [];

  // quantity discount
  for (const d of QTY_DISCOUNTS) {
    if (quantity >= d.min) {
      const amt = Math.round(base * d.pct);
      discounts.push({ label: `${d.min}+ ширхэг ${d.pct * 100}%`, amount: amt });
      base -= amt;
      break;
    }
  }
  // rush
  const rushRate = RUSH_RATES[rushHours] || 0;
  if (rushRate > 0) {
    const amt = Math.round(base * rushRate);
    surcharges.push({ label: `${rushHours} цагийн яаралтай`, amount: amt });
    base += amt;
  }
  // finishing
  let fCost = 0;
  for (const code of fc) {
    const f = FALLBACK_FINISHINGS.find(x => x.code === code);
    if (f) fCost += (f.price || 0) * quantity;
  }
  // addon
  let aCost = 0;
  for (const code of ac) {
    const a = FALLBACK_ADDONS.find(x => x.code === code);
    if (a) aCost += (a.price || 0);
  }
  const subtotal = base + fCost + aCost;
  const marginRate = MARGIN_RATES[tier] || 0.45;
  const marginAmount = Math.round(subtotal * marginRate);
  const finalPrice = Math.round(subtotal + marginAmount);
  const unitPrice = quantity > 0 ? Math.round(finalPrice / quantity) : 0;

  const breakdown: { label: string; amount: number }[] = [
    { label: 'Суурь үнэ', amount: sizePrice * quantity },
  ];
  if (discounts.length) breakdown.push({ label: 'Хөнгөлөлт', amount: -discounts[0].amount });
  if (surcharges.length) breakdown.push({ label: 'Яаралтай', amount: surcharges[0].amount });
  if (fCost) breakdown.push({ label: 'Finishing', amount: fCost });
  if (aCost) breakdown.push({ label: 'Нэмэлт', amount: aCost });
  breakdown.push({ label: `Маржин (${Math.round(marginRate * 100)}%)`, amount: marginAmount });
  breakdown.push({ label: 'Нийт', amount: finalPrice });

  return {
    base_price: sizePrice * quantity,
    final_price: finalPrice,
    unit_price: unitPrice,
    price_breakdown: breakdown,
    rules_applied: [],
    discounts,
    surcharges,
    finishing_cost: fCost,
    addon_cost: aCost,
    margin_amount: marginAmount,
    vs_market_pct: null,
    tactic_applied: false,
    novat_note: 'НӨАТ ороогүй',
    validity_hours: 72,
  };
}

/* ───────── component ───────── */

export default function QuotePage() {
  /* catalog */
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  /* selected product */
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(false);

  /* form params */
  const [materialCode, setMaterialCode] = useState<string>('');
  const [sizeCode, setSizeCode] = useState<string>('');
  const [customWidth, setCustomWidth] = useState(1);
  const [customHeight, setCustomHeight] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [finishingCodes, setFinishingCodes] = useState<string[]>([]);
  const [addonCodes, setAddonCodes] = useState<string[]>([]);
  const [rushIdx, setRushIdx] = useState(0);
  const [pricingTier, setPricingTier] = useState<'b2b' | 'retail'>('b2b');

  /* pricing result */
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  /* submit form */
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ quote_number: string } | null>(null);

  /* debounce ref */
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── fetch catalog on mount (fallback if empty) ── */
  useEffect(() => {
    setCatalogLoading(true);
    fetch(`${API}/products/catalog`)
      .then(r => r.json())
      .then((data: CatalogProduct[]) => {
        const items = Array.isArray(data) && data.length > 0 ? data : FALLBACK_CATALOG;
        setCatalog(items);
      })
      .catch(() => setCatalog(FALLBACK_CATALOG))
      .finally(() => setCatalogLoading(false));
  }, []);

  /* ── fetch product details when selected ── */
  useEffect(() => {
    if (!selectedCode) {
      setProduct(null);
      return;
    }
    setProductLoading(true);
    setPriceResult(null);

    const applyProduct = (data: Product) => {
      setProduct(data);
      if (data.materials?.length) setMaterialCode(data.materials[0].code);
      else setMaterialCode('');
      if (data.sizes?.length) setSizeCode(data.sizes[0].code);
      else setSizeCode('');
      setCustomWidth(1);
      setCustomHeight(1);
      setQuantity(1);
      setFinishingCodes([]);
      setAddonCodes([]);
      setRushIdx(0);
    };

    const fallbackProduct = (): Product | null => {
      const cp = FALLBACK_CATALOG.find(c => c.code === selectedCode);
      if (!cp) return null;
      return { ...cp, finishings: FALLBACK_FINISHINGS, addons: FALLBACK_ADDONS };
    };

    fetch(`${API}/products/catalog/${selectedCode}`)
      .then(r => r.json())
      .then((data: Product) => {
        if (data && data.code) {
          applyProduct(data);
        } else {
          const fb = fallbackProduct();
          if (fb) applyProduct(fb);
          else setProduct(null);
        }
      })
      .catch(() => {
        const fb = fallbackProduct();
        if (fb) applyProduct(fb);
        else setProduct(null);
      })
      .finally(() => setProductLoading(false));
  }, [selectedCode]);

  /* ── calculate price (debounced) ── */
  const calculate = useCallback(() => {
    if (!product || !selectedCode) return;

    const selectedSize = product.sizes?.find(s => s.code === sizeCode);
    const isCustom = selectedSize?.is_custom;
    const selectedMaterial = product.materials?.find(m => m.code === materialCode);

    /* build finishing_data and addon_data for the API */
    const finishing_data = (product.finishings || [])
      .filter(f => finishingCodes.includes(f.code))
      .map(f => ({ code: f.code, name_mn: f.name_mn, price: f.price || 0 }));
    const addon_data = (product.addons || [])
      .filter(a => addonCodes.includes(a.code))
      .map(a => ({ code: a.code, name_mn: a.name_mn, price: a.price || 0 }));

    const w = isCustom ? customWidth : (selectedSize?.width_m || 0);
    const h = isCustom ? customHeight : (selectedSize?.height_m || 0);
    const area = w && h ? w * h : undefined;

    const body = {
      product_code: selectedCode,
      material_code: materialCode || undefined,
      size_code: sizeCode || undefined,
      custom_width_m: isCustom ? customWidth : undefined,
      custom_height_m: isCustom ? customHeight : undefined,
      quantity,
      finishing_codes: finishingCodes.length ? finishingCodes : undefined,
      addon_codes: addonCodes.length ? addonCodes : undefined,
      rush_hours: RUSH_OPTIONS[rushIdx].hours,
      pricing_tier: pricingTier,
      apply_competitor_tactic: true,
      base_price: selectedMaterial?.price_per_unit || 0,
      material_cost: selectedMaterial?.price_per_unit || 0,
      finishing_data: finishing_data.length ? finishing_data : undefined,
      addon_data: addon_data.length ? addon_data : undefined,
      area_m2: area,
      unit_type: product.unit_type,
    };

    const doLocalFallback = () => {
      const result = localCalculate({
        productCode: selectedCode,
        sizeCode,
        materialPrice: selectedMaterial?.price_per_unit || 0,
        quantity,
        finishingCodes,
        addonCodes,
        rushHours: RUSH_OPTIONS[rushIdx].hours,
        tier: pricingTier,
      });
      setPriceResult(result);
    };

    setPriceLoading(true);
    fetch(`${API}/pricing-engine/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(r => r.json())
      .then((data: PriceResult) => {
        if (data && data.final_price != null) {
          setPriceResult(data);
        } else {
          doLocalFallback();
        }
      })
      .catch(() => doLocalFallback())
      .finally(() => setPriceLoading(false));
  }, [product, selectedCode, materialCode, sizeCode, customWidth, customHeight, quantity, finishingCodes, addonCodes, rushIdx, pricingTier]);

  /* debounce trigger */
  useEffect(() => {
    if (!product) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(calculate, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [calculate, product]);

  /* ── toggle helpers ── */
  function toggleFinishing(code: string) {
    setFinishingCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  }
  function toggleAddon(code: string) {
    setAddonCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  }

  /* ── submit quote ── */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formName || !formEmail || !priceResult || !product) return;
    setSubmitting(true);
    try {
      const body = {
        customer_name: formName,
        customer_email: formEmail,
        customer_phone: formPhone || undefined,
        company_name: formCompany || undefined,
        notes: formNotes || undefined,
        product_code: selectedCode,
        product_name: product.name_mn,
        material_code: materialCode || undefined,
        size_code: sizeCode || undefined,
        custom_width_m: customWidth,
        custom_height_m: customHeight,
        quantity,
        finishing_codes: finishingCodes.length ? finishingCodes : undefined,
        addon_codes: addonCodes.length ? addonCodes : undefined,
        rush_hours: RUSH_OPTIONS[rushIdx].hours,
        pricing_tier: pricingTier,
        base_price: priceResult.base_price,
        total_price: priceResult.final_price,
        unit_price: priceResult.unit_price,
        discount_amount: priceResult.discounts?.reduce((s, d) => s + d.amount, 0) || 0,
        finishing_cost: priceResult.finishing_cost,
        addon_cost: priceResult.addon_cost,
        price_breakdown: priceResult.price_breakdown,
      };
      const res = await fetch(`${API}/quotes-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setSubmitResult({ quote_number: data.quote_number || data.id || '' });
      setSubmitted(true);
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  }

  /* ── group catalog by category ── */
  const grouped = catalog.reduce<Record<string, CatalogProduct[]>>((acc, p) => {
    const cat = CATEGORY_MAP[p.category] || p.category || 'Бусад';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  /* ── styles ── */
  const s = {
    page: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '32px 24px 64px',
      fontFamily: FONT,
      color: 'var(--text)',
    } as React.CSSProperties,
    h1: {
      fontSize: 28,
      fontWeight: 700,
      marginBottom: 4,
    } as React.CSSProperties,
    subtitle: {
      color: 'var(--text2)',
      fontSize: 15,
      marginBottom: 32,
    } as React.CSSProperties,
    twoCol: {
      display: 'flex',
      gap: 32,
      alignItems: 'flex-start',
    } as React.CSSProperties,
    leftCol: {
      flex: '1 1 60%',
      minWidth: 0,
    } as React.CSSProperties,
    rightCol: {
      flex: '0 0 38%',
      position: 'sticky' as const,
      top: 24,
    } as React.CSSProperties,
    card: {
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 24,
      marginBottom: 20,
    } as React.CSSProperties,
    label: {
      display: 'block',
      color: 'var(--text2)',
      fontSize: 13,
      marginBottom: 6,
      fontWeight: 500,
    } as React.CSSProperties,
    input: {
      width: '100%',
      padding: '10px 14px',
      borderRadius: 8,
      border: '1px solid var(--border)',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontSize: 15,
      fontFamily: 'inherit',
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,
    pillGroup: {
      display: 'flex',
      gap: 0,
      borderRadius: 8,
      overflow: 'hidden',
      border: '1px solid var(--border)',
    } as React.CSSProperties,
    btnPrimary: {
      background: '#FF6B00',
      color: '#fff',
      border: 'none',
      borderRadius: 8,
      padding: '12px 28px',
      fontSize: 15,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit',
    } as React.CSSProperties,
    row: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '7px 0',
      fontSize: 15,
    } as React.CSSProperties,
    checkbox: {
      accentColor: '#FF6B00',
      marginRight: 8,
      width: 16,
      height: 16,
    } as React.CSSProperties,
  };

  const pill = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    background: active ? '#FF6B00' : 'var(--surface)',
    color: active ? '#fff' : 'var(--text)',
    border: 'none',
    fontFamily: 'inherit',
    transition: 'background .15s',
    textAlign: 'center',
  });

  const productCard = (isSelected: boolean): React.CSSProperties => ({
    padding: '14px 18px',
    borderRadius: 10,
    border: isSelected ? '2px solid #FF6B00' : '1px solid var(--border)',
    background: isSelected ? 'rgba(255,107,0,0.06)' : 'var(--surface)',
    cursor: 'pointer',
    transition: 'all .15s',
    textAlign: 'left' as const,
  });

  const radioBtn = (active: boolean): React.CSSProperties => ({
    padding: '10px 16px',
    borderRadius: 8,
    border: active ? '2px solid #FF6B00' : '1px solid var(--border)',
    background: active ? 'rgba(255,107,0,0.06)' : 'var(--surface)',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    color: active ? '#FF6B00' : 'var(--text)',
    fontFamily: 'inherit',
    transition: 'all .15s',
    textAlign: 'center' as const,
  });

  const checkBtn = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    borderRadius: 8,
    border: active ? '2px solid #FF6B00' : '1px solid var(--border)',
    background: active ? 'rgba(255,107,0,0.06)' : 'var(--surface)',
    cursor: 'pointer',
    fontSize: 14,
    color: active ? '#FF6B00' : 'var(--text)',
    fontFamily: 'inherit',
    transition: 'all .15s',
  });

  /* ── success screen ── */
  if (submitted) {
    return (
      <div style={{ ...s.page, maxWidth: 640, textAlign: 'center' }}>
        <div style={{ ...s.card, padding: 48 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#22c55e', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <span style={{ color: '#fff', fontSize: 32, lineHeight: 1 }}>&#10003;</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Амжилттай!</h2>
          {submitResult?.quote_number && (
            <p style={{ color: 'var(--text2)', fontSize: 18, marginBottom: 8 }}>
              Үнийн санал: <strong style={{ color: '#FF6B00' }}>#{submitResult.quote_number}</strong>
            </p>
          )}
          <p style={{ color: 'var(--text3)', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
            Таны үнийн санал хүлээн авлаа. {formEmail} хаяг руу мэдэгдэл илгээгдсэн.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              style={s.btnPrimary}
              onClick={() => {
                setSubmitted(false);
                setShowForm(false);
                setSubmitResult(null);
                setSelectedCode(null);
                setProduct(null);
                setPriceResult(null);
                setFormName('');
                setFormEmail('');
                setFormPhone('');
                setFormCompany('');
                setFormNotes('');
              }}
            >
              Шинэ тооцоо
            </button>
            <a
              href="/dashboard/customer/quotes"
              style={{
                ...s.btnPrimary,
                background: 'var(--surface)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Дашбоард харах
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ── price panel ── */
  function renderPricePanel() {
    const selectedSize = product?.sizes?.find(sz => sz.code === sizeCode);
    const isCustom = selectedSize?.is_custom;

    return (
      <div style={{ ...s.card, border: '2px solid #FF6B00', position: 'relative' }}>
        {priceLoading && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(var(--bg),0.5)',
            backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', borderRadius: 12, zIndex: 2,
          }}>
            <div style={{ width: 24, height: 24, border: '3px solid var(--border)', borderTopColor: '#FF6B00', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          </div>
        )}
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>
          Үнийн задаргаа
        </h3>

        {!priceResult && !priceLoading && (
          <p style={{ color: 'var(--text3)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
            Бүтээгдэхүүн сонгоход үнэ тооцоологдоно
          </p>
        )}

        {priceResult && (
          <>
            {/* base */}
            <div style={s.row}>
              <span style={{ color: 'var(--text2)' }}>Суурь үнэ</span>
              <span>{fmt(priceResult.base_price)}</span>
            </div>

            {/* discounts */}
            {priceResult.discounts?.map((d, i) => (
              <div key={i} style={s.row}>
                <span style={{ color: 'var(--text2)' }}>Хөнгөлөлт{d.label ? ` (${d.label})` : ''}</span>
                <span style={{ color: '#22c55e', fontWeight: 500 }}>-{fmt(d.amount)}</span>
              </div>
            ))}

            {/* surcharges */}
            {priceResult.surcharges?.map((sc, i) => (
              <div key={i} style={s.row}>
                <span style={{ color: 'var(--text2)' }}>
                  {sc.label || 'Яаралтай нэмэгдэл'}
                </span>
                <span style={{ color: '#eab308', fontWeight: 500 }}>+{fmt(sc.amount)}</span>
              </div>
            ))}

            {/* finishing */}
            {priceResult.finishing_cost > 0 && (
              <div style={s.row}>
                <span style={{ color: 'var(--text2)' }}>Finishing</span>
                <span>{fmt(priceResult.finishing_cost)}</span>
              </div>
            )}

            {/* addon */}
            {priceResult.addon_cost > 0 && (
              <div style={s.row}>
                <span style={{ color: 'var(--text2)' }}>Нэмэлт ажил</span>
                <span>{fmt(priceResult.addon_cost)}</span>
              </div>
            )}

            {/* divider */}
            <div style={{ borderTop: '1px solid var(--border)', margin: '10px 0' }} />

            {/* total */}
            <div style={{ ...s.row, fontSize: 22, fontWeight: 700, paddingTop: 4 }}>
              <span>Нийт</span>
              <span style={{ color: '#FF6B00' }}>{fmt(priceResult.final_price)}</span>
            </div>

            {/* unit price */}
            {quantity > 1 && (
              <div style={{ ...s.row, fontSize: 14 }}>
                <span style={{ color: 'var(--text3)' }}>Нэгжийн үнэ</span>
                <span style={{ color: 'var(--text2)' }}>{fmt(priceResult.unit_price)}/ш</span>
              </div>
            )}

            {/* market tactic badge */}
            {priceResult.tactic_applied && priceResult.vs_market_pct != null && (
              <div style={{
                marginTop: 12,
                padding: '8px 14px',
                borderRadius: 8,
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.2)',
                fontSize: 13,
                color: '#16a34a',
                fontWeight: 600,
                textAlign: 'center',
              }}>
                Зах зээлийн дунджаас {Math.abs(priceResult.vs_market_pct)}% хямд
              </div>
            )}

            {/* novat note */}
            <p style={{ color: 'var(--text4)', fontSize: 12, marginTop: 12, textAlign: 'center' }}>
              {priceResult.novat_note || 'НӨАТ ороогүй'}
            </p>

            {/* validity */}
            <p style={{ color: 'var(--text4)', fontSize: 12, textAlign: 'center' }}>
              Хүчинтэй: {priceResult.validity_hours || 72} цаг
            </p>

            {/* submit CTA */}
            {!showForm && (
              <button
                style={{ ...s.btnPrimary, width: '100%', marginTop: 16 }}
                onClick={() => setShowForm(true)}
              >
                Үнийн санал авах
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  /* ── main render ── */
  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .quote-layout { flex-direction: column !important; }
          .quote-right { position: static !important; order: -1; }
        }
      `}</style>

      <h1 style={s.h1}>Үнийн тооцоолуур</h1>
      <p style={s.subtitle}>Захиалгын үнийг шууд тооцоолно уу</p>

      {/* ── Step 1: Product selection ── */}
      {!selectedCode && (
        <>
          {catalogLoading ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <div style={{
                width: 32, height: 32, border: '3px solid var(--border)',
                borderTopColor: '#FF6B00', borderRadius: '50%',
                animation: 'spin 0.6s linear infinite', margin: '0 auto 12px',
              }} />
              <p style={{ color: 'var(--text3)', fontSize: 14 }}>Бүтээгдэхүүн ачааллаж байна...</p>
            </div>
          ) : (
            sortedCategories.map(cat => (
              <div key={cat} style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>{CATEGORY_ICONS[cat] || ''}</span>
                  {cat}
                  <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 400 }}>
                    ({grouped[cat].length})
                  </span>
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                  {grouped[cat].map(p => (
                    <button
                      key={p.code}
                      onClick={() => setSelectedCode(p.code)}
                      style={productCard(false)}
                    >
                      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>
                        {p.name_mn}
                      </div>
                      {p.name_en && (
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.name_en}</div>
                      )}
                      {p.subcategory && (
                        <div style={{
                          marginTop: 6, fontSize: 11, color: 'var(--text4)',
                          background: 'var(--surface2)', borderRadius: 4, padding: '2px 8px',
                          display: 'inline-block',
                        }}>
                          {p.subcategory}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ── Step 2: Product config + price panel ── */}
      {selectedCode && (
        <>
          {/* back button */}
          <button
            onClick={() => {
              setSelectedCode(null);
              setProduct(null);
              setPriceResult(null);
              setShowForm(false);
            }}
            style={{
              background: 'none', border: 'none', color: '#FF6B00',
              fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              marginBottom: 20, padding: 0, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            &#8592; Бүтээгдэхүүн солих
          </button>

          {productLoading ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <div style={{
                width: 32, height: 32, border: '3px solid var(--border)',
                borderTopColor: '#FF6B00', borderRadius: '50%',
                animation: 'spin 0.6s linear infinite', margin: '0 auto 12px',
              }} />
            </div>
          ) : product ? (
            <div className="quote-layout" style={s.twoCol}>
              {/* LEFT COLUMN - form */}
              <div style={s.leftCol}>
                {/* product title */}
                <div style={{ ...s.card, paddingBottom: 16 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{product.name_mn}</h2>
                  {product.name_en && (
                    <p style={{ color: 'var(--text3)', fontSize: 14, margin: 0 }}>{product.name_en}</p>
                  )}
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 12, padding: '2px 10px', borderRadius: 6,
                      background: 'rgba(255,107,0,0.08)', color: '#FF6B00', fontWeight: 500,
                    }}>
                      {product.category}
                    </span>
                    {product.subcategory && (
                      <span style={{
                        fontSize: 12, padding: '2px 10px', borderRadius: 6,
                        background: 'var(--surface2)', color: 'var(--text3)',
                      }}>
                        {product.subcategory}
                      </span>
                    )}
                    {product.unit_type && (
                      <span style={{
                        fontSize: 12, padding: '2px 10px', borderRadius: 6,
                        background: 'var(--surface2)', color: 'var(--text3)',
                      }}>
                        Нэгж: {product.unit_type}
                      </span>
                    )}
                  </div>
                </div>

                {/* Material selector */}
                {product.materials?.length > 0 && (
                  <div style={s.card}>
                    <span style={s.label}>Материал</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {product.materials.map(m => (
                        <button
                          key={m.code}
                          onClick={() => setMaterialCode(m.code)}
                          style={radioBtn(materialCode === m.code)}
                        >
                          {m.name_mn}
                          {m.price_per_unit != null && (
                            <span style={{ fontSize: 12, opacity: 0.7, marginLeft: 4 }}>
                              ({fmt(m.price_per_unit)})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size selector */}
                {product.sizes?.length > 0 && (
                  <div style={s.card}>
                    <span style={s.label}>Хэмжээ</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      {product.sizes.map(sz => (
                        <button
                          key={sz.code}
                          onClick={() => setSizeCode(sz.code)}
                          style={radioBtn(sizeCode === sz.code)}
                        >
                          {sz.name_mn}
                        </button>
                      ))}
                    </div>
                    {/* custom size inputs */}
                    {product.sizes.find(sz => sz.code === sizeCode)?.is_custom && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                        <div>
                          <span style={s.label}>Өргөн (м)</span>
                          <input
                            type="number"
                            min={0.01}
                            step={0.01}
                            value={customWidth}
                            onChange={e => setCustomWidth(Math.max(0.01, +e.target.value))}
                            style={s.input}
                          />
                        </div>
                        <div>
                          <span style={s.label}>Өндөр (м)</span>
                          <input
                            type="number"
                            min={0.01}
                            step={0.01}
                            value={customHeight}
                            onChange={e => setCustomHeight(Math.max(0.01, +e.target.value))}
                            style={s.input}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity */}
                <div style={s.card}>
                  <span style={s.label}>Тоо ширхэг</span>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, Math.round(+e.target.value)))}
                    style={{ ...s.input, maxWidth: 200 }}
                  />
                </div>

                {/* Finishing checkboxes */}
                {product.finishings && product.finishings.length > 0 && (
                  <div style={s.card}>
                    <span style={s.label}>Финиш боловсруулалт</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {product.finishings.map(f => (
                        <button
                          key={f.code}
                          onClick={() => toggleFinishing(f.code)}
                          style={checkBtn(finishingCodes.includes(f.code))}
                        >
                          <input
                            type="checkbox"
                            checked={finishingCodes.includes(f.code)}
                            onChange={() => toggleFinishing(f.code)}
                            style={s.checkbox}
                          />
                          {f.name_mn}
                          {f.price != null && (
                            <span style={{ fontSize: 12, opacity: 0.6, marginLeft: 4 }}>
                              +{fmt(f.price)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Addon checkboxes */}
                {product.addons && product.addons.length > 0 && (
                  <div style={s.card}>
                    <span style={s.label}>Нэмэлт ажил</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {product.addons.map(a => (
                        <button
                          key={a.code}
                          onClick={() => toggleAddon(a.code)}
                          style={checkBtn(addonCodes.includes(a.code))}
                        >
                          <input
                            type="checkbox"
                            checked={addonCodes.includes(a.code)}
                            onChange={() => toggleAddon(a.code)}
                            style={s.checkbox}
                          />
                          {a.name_mn}
                          {a.price != null && (
                            <span style={{ fontSize: 12, opacity: 0.6, marginLeft: 4 }}>
                              +{fmt(a.price)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rush + Pricing tier */}
                <div style={s.card}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <span style={s.label}>Хугацаа</span>
                      <div style={s.pillGroup}>
                        {RUSH_OPTIONS.map((r, i) => (
                          <button
                            key={r.label}
                            style={pill(rushIdx === i)}
                            onClick={() => setRushIdx(i)}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span style={s.label}>Үнийн горим</span>
                      <div style={s.pillGroup}>
                        <button
                          style={pill(pricingTier === 'b2b')}
                          onClick={() => setPricingTier('b2b')}
                        >
                          B2B
                        </button>
                        <button
                          style={pill(pricingTier === 'retail')}
                          onClick={() => setPricingTier('retail')}
                        >
                          Retail
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit form (inline) */}
                {showForm && (
                  <form onSubmit={handleSubmit} style={s.card}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Холбоо барих</h3>
                    <div style={{ display: 'grid', gap: 14 }}>
                      <div>
                        <span style={s.label}>Нэр *</span>
                        <input
                          value={formName}
                          onChange={e => setFormName(e.target.value)}
                          required
                          style={s.input}
                        />
                      </div>
                      <div>
                        <span style={s.label}>Имэйл *</span>
                        <input
                          type="email"
                          value={formEmail}
                          onChange={e => setFormEmail(e.target.value)}
                          required
                          style={s.input}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <span style={s.label}>Утас</span>
                          <input
                            value={formPhone}
                            onChange={e => setFormPhone(e.target.value)}
                            style={s.input}
                          />
                        </div>
                        <div>
                          <span style={s.label}>Компанийн нэр</span>
                          <input
                            value={formCompany}
                            onChange={e => setFormCompany(e.target.value)}
                            placeholder="Заавал биш"
                            style={s.input}
                          />
                        </div>
                      </div>
                      <div>
                        <span style={s.label}>Тэмдэглэл</span>
                        <textarea
                          value={formNotes}
                          onChange={e => setFormNotes(e.target.value)}
                          rows={3}
                          style={{ ...s.input, resize: 'vertical' as const }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        style={{ ...s.btnPrimary, opacity: submitting ? 0.6 : 1, width: '100%' }}
                      >
                        {submitting ? 'Илгээж байна...' : 'Үнийн санал илгээх'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* RIGHT COLUMN - price panel */}
              <div className="quote-right" style={s.rightCol}>
                {renderPricePanel()}
              </div>
            </div>
          ) : (
            <div style={{ ...s.card, textAlign: 'center' }}>
              <p style={{ color: 'var(--text3)' }}>Бүтээгдэхүүн олдсонгүй</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
