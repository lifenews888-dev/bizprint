'use client';

import React, { useState, useCallback, useMemo, useEffect, FormEvent } from 'react';
import React, { useRouter } from 'next/navigation';
import React, { apiFetch, apiUpload, API_URL } from '@/lib/api';
import QuotePreview from '@/components/QuotePreview';

/* ─── DEFAULT PRICES ─── */
const DEFAULT_PRICES = {
  tovgor: { 20: 35000, 30: 45000, 40: 60000, 50: 75000, 60: 95000, 70: 140000, 80: 180000, 90: 235000, 100: 290000, 110: 330000, 120: 360000 } as Record<number, number>,
  nerj_off_m2: 850000, nerj_on_m2: 1100000,
  d3_off_m2: 850000, d3_on_m2: 1250000,
  pvc_m2: 280000, epoxy_m2: 650000,
  sb_in4_m2: 280000, sb_in6_m2: 320000, sb_in8_m2: 350000,
  sb_out_corner_m2: 380000, sb_out_fold_m2: 450000,
  tmr_m2: 650000, font_back_m2: 225000, font_metal_m2: 650000,
  extra_rele: 30000, extra_tog: 35000, extra_crane1: 200000, extra_crane8: 600000,
};

/* ─── OFFSET CONFIG ─── */
const SIZE_FACTOR: Record<string, number> = { A6: 0.25, A5: 0.5, A4: 1.0, A3: 2.0, BC: 0.1 };
const GSM_RATE: Record<number, number> = { 80: 60, 115: 90, 130: 110, 150: 130, 170: 155, 200: 180, 250: 220, 300: 270 };
const PRINT_RATE: Record<string, number> = { full: 65, bw: 30 };
const FINISH_RATE: Record<string, number> = { none: 0, mat: 18, gloss: 15, uv: 22, soft: 28 };
const FOLD_RATE: Record<string, number> = { none: 0, tri: 8, half: 5 };
const SETUP: Record<string, number> = { full: 35000, bw: 15000 };
const WIDE_RATE: Record<string, number> = { banner: 8000, sticker: 12000, flag: 18000, canvas: 22000 };

const RUSH_MAP: Record<string, number> = { normal: 0, '48h': 0.15, '24h': 0.30 };
const MARGIN_MAP: Record<string, number> = { b2b: 1.20, retail: 1.45 };

/* ─── helpers ─── */
function fmt(n: number): string {
  if (!n || isNaN(n) || !isFinite(n)) return '0₮';
  return Math.round(n).toLocaleString('en-US') + '₮';
}

/* ─── SIGNBOARD product types ─── */
const SIGN_PRODUCTS = [
  { key: 'tovgor', label: 'Товгор үсэг' },
  { key: 'nerj', label: 'Нерж үсэг' },
  { key: 'd3', label: '3D үсэг' },
  { key: 'sambar', label: 'Гэрэлт самбар' },
  { key: 'pvc', label: 'PVC үсэг' },
  { key: 'epoxy', label: 'Эпокси' },
  { key: 'font', label: 'Фонтой хаяг' },
  { key: 'tmr', label: 'Төмөр лист' },
] as const;

const TOVGOR_SIZES = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];

const OFFSET_PRODUCTS = ['Нэрийн хуудас', 'Флаер', 'Боршур', 'Постер', 'Ном', 'Каталог', 'Клендар', 'Меню'];
const OFFSET_SIZES = [
  { key: 'A6', label: 'A6' }, { key: 'A5', label: 'A5' }, { key: 'A4', label: 'A4' },
  { key: 'A3', label: 'A3' }, { key: 'BC', label: 'Нэрийн хуудас (90×50)' },
];
const GSM_OPTIONS = [80, 115, 130, 150, 170, 200, 250, 300];
const FINISH_OPTIONS = [
  { key: 'none', label: 'Байхгүй' }, { key: 'mat', label: 'Мат' },
  { key: 'gloss', label: 'Гянт' }, { key: 'uv', label: 'UV' }, { key: 'soft', label: 'Soft touch' },
];
const FOLD_OPTIONS = [
  { key: 'none', label: 'Байхгүй' }, { key: 'tri', label: 'Гурван хэсэг' }, { key: 'half', label: 'Хагас' },
];
const WIDE_TYPES = [
  { key: 'banner', label: 'Баннер' }, { key: 'sticker', label: 'Стикер' },
  { key: 'flag', label: 'Туг' }, { key: 'canvas', label: 'Даавуун хэвлэл' },
];

/* ─── Breakdown line type ─── */
interface BLine { label: string; amount: number; color?: string }

/* ─────────────────────────── PAGE ─────────────────────────── */
export default function DetailedQuote() {
  const router = useRouter();

  /* ─ logged-in user detection ─ */
  const [loggedUser, setLoggedUser] = useState<any>(null);
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      if (u?.id) {
        setLoggedUser(u);
        setMName(u.full_name || '');
        setMEmail(u.email || '');
        setMPhone(u.phone || '');
        setMCompany(u.company_name || u.company || '');
      }
    } catch {}
  }, []);

  /* ─ remote config ─ */
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  useEffect(() => {
    apiFetch<any>('/pricing-config/public', { auth: false }).catch(() => null)
      .then(d => { if (d && typeof d === 'object') setPrices({ ...DEFAULT_PRICES, ...d }); })
      .catch(() => {});
  }, []);

  /* ─ MODE & TAB ─ */
  const [mode, setMode] = useState<'quick' | 'advanced' | 'ai'>('quick');
  const [tab, setTab] = useState<'sign' | 'print'>('sign');
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  // AI quote user inputs
  const [aiQty, setAiQty] = useState(100);
  const [aiInnerGsm, setAiInnerGsm] = useState(100);
  const [aiCoverType, setAiCoverType] = useState<'soft' | 'hard'>('soft');
  const [aiCoverGsm, setAiCoverGsm] = useState(250);
  const [aiFinishing, setAiFinishing] = useState({ lamination: 'matt' as 'none' | 'matt' | 'gloss', uv: false, emboss: false, foil: false });
  const [aiShowPrice, setAiShowPrice] = useState(false);
  // Sign quote — text + logo
  const [signText, setSignText] = useState('');
  const [signLogo, setSignLogo] = useState<File | null>(null);
  const [signLogoUrl, setSignLogoUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [aiQuoteList, setAiQuoteList] = useState<{ id: string; label: string; qty: number; unitPrice: number; total: number; vat: number; grandTotal: number }[]>([]);

  /* ─ common ─ */
  const [rush, setRush] = useState('normal');
  const [margin, setMargin] = useState<'b2b' | 'retail'>('retail');

  /* ─ SIGN state ─ */
  const [signProd, setSignProd] = useState('tovgor');
  const [tovgorSize, setTovgorSize] = useState(30);
  const [tovgorQty, setTovgorQty] = useState(1);
  const [tovgorQtyStr, setTovgorQtyStr] = useState('1');
  const [nerjLit, setNerjLit] = useState(false);     // false=Асдаггүй true=Асдаг
  const [d3Lit, setD3Lit] = useState(false);
  const [sbLocation, setSbLocation] = useState<'in' | 'out'>('in');
  const [sbThickness, setSbThickness] = useState('4');
  const [sbOutType, setSbOutType] = useState('corner');
  const [dimW, setDimW] = useState(1);
  const [dimWStr, setDimWStr] = useState('1');
  const [dimH, setDimH] = useState(1);
  const [dimHStr, setDimHStr] = useState('1');
  const [extraRele, setExtraRele] = useState(false);
  const [extraTog, setExtraTog] = useState(false);
  const [extraCrane1, setExtraCrane1] = useState(false);
  const [extraCrane8, setExtraCrane8] = useState(false);

  /* ─ PRINT state ─ */
  const [printSub, setPrintSub] = useState<'offset' | 'wide'>('offset');
  const [offProduct, setOffProduct] = useState('Нэрийн хуудас');
  const [offSize, setOffSize] = useState('A4');
  const [offPages, setOffPages] = useState(1);
  const [offPagesStr, setOffPagesStr] = useState('1');
  const [offQty, setOffQty] = useState(100);
  const [offQtyStr, setOffQtyStr] = useState('100');
  const [offGsm, setOffGsm] = useState(130);
  const [offColor, setOffColor] = useState<'full' | 'bw'>('full');
  const [offSides, setOffSides] = useState<'single' | 'double'>('single');
  const [offFinish, setOffFinish] = useState('none');
  const [offFold, setOffFold] = useState('none');
  const [wideType, setWideType] = useState('banner');
  const [wideW, setWideW] = useState(1);
  const [wideWStr, setWideWStr] = useState('1');
  const [wideL, setWideL] = useState(2);
  const [wideLStr, setWideLStr] = useState('2');

  /* ─ modal ─ */
  const [showModal, setShowModal] = useState(false);
  const [mName, setMName] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mCompany, setMCompany] = useState('');
  const [mNotes, setMNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [lastQuoteIds, setLastQuoteIds] = useState<string[]>([]);

  /* ─ batch quotes (жагсаалтад нэмэх) ─ */
  const [savedQuotes, setSavedQuotes] = useState<any[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  // removeFromList, savedTotal — addToList нь displayTotal-аас хамааралтай тул доор зарлагдана
  const removeFromList = (id: string) => setSavedQuotes(prev => prev.filter(q => q.id !== id));
  const editQuote = (sq: any) => {
    const f = sq._form;
    if (!f) return;
    setTab(f.tab); setSignProd(f.signProd); setTovgorSize(f.tovgorSize); setTovgorQty(f.tovgorQty);
    if (f.signText !== undefined) setSignText(f.signText);
    if (f.extraRele !== undefined) setExtraRele(f.extraRele);
    if (f.extraTog !== undefined) setExtraTog(f.extraTog);
    if (f.extraCrane1 !== undefined) setExtraCrane1(f.extraCrane1);
    if (f.extraCrane8 !== undefined) setExtraCrane8(f.extraCrane8);
    setDimW(f.dimW); setDimH(f.dimH); setPrintSub(f.printSub); setOffProduct(f.offProduct);
    setOffSize(f.offSize); setOffPages(f.offPages); setOffQty(f.offQty); setOffGsm(f.offGsm);
    setOffColor(f.offColor); setOffSides(f.offSides); setOffFinish(f.offFinish); setOffFold(f.offFold);
    setWideType(f.wideType); setWideW(f.wideW); setWideL(f.wideL); setRush(f.rush);
    // Жагсаалтаас устгаж form руу буцаана
    setSavedQuotes(prev => prev.filter(q => q.id !== sq.id));
    setShowSaved(false);
  };
  const savedTotal = savedQuotes.reduce((s, q) => s + Number(q.total_price || 0), 0);

  /* ─── SIGN CALC ─── */
  const signCalc = useMemo(() => {
    const lines: BLine[] = [];
    let base = 0;

    if (signProd === 'tovgor') {
      const tovgorPrices = (prices.tovgor && typeof prices.tovgor === 'object') ? prices.tovgor : DEFAULT_PRICES.tovgor;
      const unit = (tovgorPrices as Record<number, number>)[tovgorSize] || 35000;
      base = unit * tovgorQty;
      lines.push({ label: `Товгор ${tovgorSize}см × ${tovgorQty}ш`, amount: base });
    } else if (signProd === 'nerj') {
      const area = dimW * dimH;
      const rate = nerjLit ? prices.nerj_on_m2 : prices.nerj_off_m2;
      base = rate * area;
      lines.push({ label: `Нерж ${nerjLit ? 'асдаг' : 'асдаггүй'} ${dimW}×${dimH}м`, amount: base });
    } else if (signProd === 'd3') {
      const area = dimW * dimH;
      const rate = d3Lit ? prices.d3_on_m2 : prices.d3_off_m2;
      base = rate * area;
      lines.push({ label: `3D ${d3Lit ? 'гэрэлтэй' : 'гэрэлгүй'} ${dimW}×${dimH}м`, amount: base });
    } else if (signProd === 'sambar') {
      const area = dimW * dimH;
      let rate: number;
      if (sbLocation === 'in') {
        rate = sbThickness === '4' ? prices.sb_in4_m2 : sbThickness === '6' ? prices.sb_in6_m2 : prices.sb_in8_m2;
        lines.push({ label: `Самбар дотор ${sbThickness}см ${dimW}×${dimH}м`, amount: 0 });
      } else {
        rate = sbOutType === 'corner' ? prices.sb_out_corner_m2 : prices.sb_out_fold_m2;
        lines.push({ label: `Самбар гадна ${sbOutType === 'corner' ? 'булантай' : 'сөхдөг'} ${dimW}×${dimH}м`, amount: 0 });
      }
      base = rate * area;
      lines[lines.length - 1].amount = base;
    } else if (signProd === 'pvc') {
      const area = dimW * dimH;
      base = prices.pvc_m2 * area;
      lines.push({ label: `PVC ${dimW}×${dimH}м`, amount: base });
    } else if (signProd === 'epoxy') {
      const area = dimW * dimH;
      base = prices.epoxy_m2 * area;
      lines.push({ label: `Эпокси ${dimW}×${dimH}м`, amount: base });
    } else if (signProd === 'font') {
      const area = dimW * dimH;
      base = prices.font_back_m2 * area;
      lines.push({ label: `Фонтой хаяг ${dimW}×${dimH}м`, amount: base });
    } else if (signProd === 'tmr') {
      const area = dimW * dimH;
      base = prices.tmr_m2 * area;
      lines.push({ label: `Төмөр лист ${dimW}×${dimH}м`, amount: base });
    }

    let extras = 0;
    if (extraRele) extras += prices.extra_rele;
    if (extraTog) extras += prices.extra_tog;
    if (extraCrane1) extras += prices.extra_crane1;
    if (extraCrane8) extras += prices.extra_crane8;

    const rushRate = RUSH_MAP[rush] || 0;
    const marginRate = MARGIN_MAP[margin];
    const rushAmt = base * rushRate;
    const marginAmt = (base + extras + rushAmt) * (marginRate - 1);
    const total = (base + extras + rushAmt) * marginRate;

    return { base, extras, rushRate, rushAmt, marginRate, marginAmt, total, lines, qty: signProd === 'tovgor' ? tovgorQty : 1 };
  }, [signProd, tovgorSize, tovgorQty, nerjLit, d3Lit, sbLocation, sbThickness, sbOutType, dimW, dimH, extraRele, extraTog, extraCrane1, extraCrane8, rush, margin, prices]);

  /* ─── OFFSET CALC ─── */
  const offsetCalc = useMemo(() => {
    const sf = SIZE_FACTOR[offSize] || 1;
    const paper = (GSM_RATE[offGsm] || 60) * sf * offPages * offQty;
    const pr = (PRINT_RATE[offColor] || 65) * sf * offPages * offQty * (offSides === 'double' ? 1.8 : 1);
    const fin = (FINISH_RATE[offFinish] || 0) * sf * offQty;
    const fold = (FOLD_RATE[offFold] || 0) * offQty;
    const setup = SETUP[offColor] || 35000;
    const subtotal = paper + pr + fin + fold + setup;

    const disc = offQty >= 5000 ? 0.20 : offQty >= 1000 ? 0.15 : offQty >= 500 ? 0.10 : offQty >= 100 ? 0.05 : 0;
    const discAmt = subtotal * disc;
    const afterDisc = subtotal - discAmt;
    const rushRate = RUSH_MAP[rush] || 0;
    const rushAmt = afterDisc * rushRate;
    const marginRate = MARGIN_MAP[margin];
    const marginAmt = (afterDisc + rushAmt) * (marginRate - 1);
    const total = (afterDisc + rushAmt) * marginRate;

    return { paper, print: pr, fin, fold, setup, subtotal, disc, discAmt, afterDisc, rushRate, rushAmt, marginRate, marginAmt, total, qty: offQty };
  }, [offSize, offGsm, offPages, offQty, offColor, offSides, offFinish, offFold, rush, margin]);

  /* ─── WIDE CALC ─── */
  const wideCalc = useMemo(() => {
    const rate = WIDE_RATE[wideType] || 8000;
    const base = rate * wideW * wideL;
    const rushRate = RUSH_MAP[rush] || 0;
    const rushAmt = base * rushRate;
    const marginRate = MARGIN_MAP[margin];
    const marginAmt = (base + rushAmt) * (marginRate - 1);
    const total = (base + rushAmt) * marginRate;
    return { base, rushRate, rushAmt, marginRate, marginAmt, total };
  }, [wideType, wideW, wideL, rush, margin]);

  /* ─── ACTIVE BREAKDOWN ─── */
  const breakdown = useMemo(() => {
    const lines: BLine[] = [];
    let total = 0;
    let unitQty = 1;

    if (tab === 'sign') {
      const c = signCalc;
      lines.push({ label: 'Тооцооллын үнэ', amount: c.base });
      if (c.extras > 0) lines.push({ label: 'Нэмэлт ажил', amount: c.extras });
      if (c.rushRate > 0) lines.push({ label: `Яаралтай (+${Math.round(c.rushRate * 100)}%)`, amount: c.rushAmt, color: '#eab308' });
      total = c.total;
      unitQty = c.qty;
    } else if (printSub === 'offset') {
      const c = offsetCalc;
      lines.push({ label: 'Тооцооллын үнэ', amount: c.subtotal });
      if (c.disc > 0) lines.push({ label: `Хөнгөлөлт (-${Math.round(c.disc * 100)}%)`, amount: -c.discAmt, color: '#22c55e' });
      if (c.rushRate > 0) lines.push({ label: `Яаралтай (+${Math.round(c.rushRate * 100)}%)`, amount: c.rushAmt, color: '#eab308' });
      total = c.total;
      unitQty = c.qty;
    } else {
      const c = wideCalc;
      lines.push({ label: 'Тооцооллын үнэ', amount: c.base });
      if (c.rushRate > 0) lines.push({ label: `Яаралтай (+${Math.round(c.rushRate * 100)}%)`, amount: c.rushAmt, color: '#eab308' });
      total = c.total;
      unitQty = 1;
    }

    return { lines, total, unitPrice: unitQty > 0 ? total / unitQty : total };
  }, [tab, printSub, signCalc, offsetCalc, wideCalc]);

  /* ─── API-BASED CALCULATION (authoritative when available) ─── */
  const [apiResult, setApiResult] = useState<any>(null);
  const [offAiResult, setOffAiResult] = useState<any>(null);   // AI layout+cost breakdown for offset tab
  const [offAiLoading, setOffAiLoading] = useState(false);

  const getPricingKey = () => {
    if (signProd === 'nerj') return nerjLit ? 'nerj_on_m2' : 'nerj_off_m2';
    if (signProd === 'd3') return d3Lit ? 'd3_on_m2' : 'd3_off_m2';
    if (signProd === 'sambar') {
      if (sbLocation === 'in') return `sb_in${sbThickness}_m2`;
      return sbOutType === 'corner' ? 'sb_out_corner_m2' : 'sb_out_fold_m2';
    }
    if (signProd === 'pvc') return 'pvc_m2';
    if (signProd === 'epoxy') return 'epoxy_m2';
    if (signProd === 'font') return 'font_back_m2';
    if (signProd === 'tmr') return 'tmr_m2';
    return '';
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      let endpoint = '';
      let body: any = {};

      if (tab === 'sign') {
        endpoint = 'calculate-hadag';
        body = {
          product: signProd,
          size: tovgorSize,
          quantity: tovgorQty,
          width: dimW,
          height: dimH,
          pricing_key: getPricingKey(),
          rush_hours: rush === '24h' ? 24 : rush === '48h' ? 48 : 0,
          pricing_mode: margin,
          extra_rele: extraRele,
          extra_tog: extraTog,
          extra_crane1: extraCrane1,
          extra_crane8: extraCrane8,
        };
      } else if (printSub === 'offset') {
        endpoint = 'calculate-offset';
        body = {
          product:    offProduct,
          size_code:  offSize,
          gsm:        offGsm,
          quantity:   offQty,
          color_mode: offColor,
          sides:      offSides,
          finish:     offFinish,
          fold:       offFold,
          rush_hours: rush === '24h' ? 24 : rush === '48h' ? 48 : 0,
        };
      } else {
        endpoint = 'calculate-wide';
        body = {
          type: wideType,
          width: wideW,
          length: wideL,
          rush_hours: rush === '24h' ? 24 : rush === '48h' ? 48 : 0,
          pricing_mode: margin,
        };
      }

      const isOffset = tab === 'print' && printSub === 'offset';

      if (isOffset) setOffAiLoading(true);

      apiFetch<any>(`/quote/calculate`, {
        method: 'POST',
        body: { ...body, calculation_type: endpoint },
        auth: false,
      }).catch(() => null)
        .then(d => {
          if (isOffset) {
            setOffAiLoading(false);
            if (d?.total_price) {
              setOffAiResult(d);
              setApiResult({ total_price: d.total_price, unit_price: d.unit_price });
            } else {
              setOffAiResult(null);
              setApiResult(null);
            }
          } else {
            setOffAiResult(null);
            setApiResult(d);
          }
        })
        .catch(() => { setApiResult(null); setOffAiResult(null); setOffAiLoading(false); });
    }, 400);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, signProd, tovgorSize, tovgorQty, dimW, dimH, extraRele, extraTog, extraCrane1, extraCrane8,
      printSub, offProduct, offSize, offPages, offQty, offGsm, offColor, offSides, offFinish, offFold,
      wideType, wideW, wideL, rush, margin, nerjLit, d3Lit, sbLocation, sbThickness, sbOutType]);

  /* ─── Display prices: prefer API result, fallback to client calc ─── */
  const displayTotal = apiResult?.total_price || breakdown.total;
  const displayUnitPrice = apiResult?.unit_price || breakdown.unitPrice;

  // Жагсаалтад нэмэх (displayTotal зарлагдсаны дараа)
  const addToList = useCallback(() => {
    if (!displayTotal || displayTotal <= 0) return;

    let productName = '';
    let productType = '';
    let productSubtype = '';
    let dims = '';
    let qty = 1;

    if (tab === 'sign') {
      const sp = SIGN_PRODUCTS.find(p => p.key === signProd);
      productName = sp?.label || signProd;
      productType = 'sign';
      productSubtype = signProd;
      qty = signProd === 'tovgor' ? tovgorQty : 1;
      dims = signProd === 'tovgor' ? `${tovgorSize}см` : `${dimW}×${dimH}м`;
    } else if (printSub === 'offset') {
      productName = offProduct;
      productType = 'offset';
      productSubtype = offProduct;
      qty = offQty;
      dims = `${offSize} ${offPages}хуудас`;
    } else {
      const wt = WIDE_TYPES.find(t => t.key === wideType);
      productName = wt?.label || wideType;
      productType = 'wide';
      productSubtype = wideType;
      dims = `${wideW}×${wideL}м`;
    }

    const newQuote = {
      id: Date.now().toString(),
      product_name: productName,
      product_type: productType,
      product_subtype: productSubtype,
      dimensions: dims,
      quantity: qty,
      total_price: displayTotal,
      unit_price: displayUnitPrice,
      breakdown: breakdown.lines.map(l => ({ label: l.label, amount: Math.round(l.amount) })),
      rush_type: rush,
      rush_fee: breakdown.lines.find(l => l.color === '#eab308')?.amount || 0,
      discount_amount: Math.abs(breakdown.lines.find(l => l.color === '#22c55e')?.amount || 0),
      margin_rate: MARGIN_MAP[margin],
      pricing_mode: margin,
      // Засварлахад хэрэгтэй form state
      _form: { tab, signProd, signText, extraRele, extraTog, extraCrane1, extraCrane8, tovgorSize, tovgorQty, dimW, dimH, printSub, offProduct, offSize, offPages, offQty, offGsm, offColor, offSides, offFinish, offFold, wideType, wideW, wideL, rush, margin },
    };
    setSavedQuotes(prev => [...prev, newQuote]);
  }, [tab, signProd, tovgorSize, tovgorQty, dimW, dimH, printSub, offProduct, offSize, offPages, offQty, wideType, wideW, wideL, displayTotal, displayUnitPrice, breakdown, rush, margin]);

  /* ─── MARKET ANALYSIS ─── */
  interface MarketData { has_data: boolean; market_avg_unit_price?: number; market_min_unit_price?: number; market_max_unit_price?: number; sample_count?: number; factories?: string[] }
  const [market, setMarket] = useState<MarketData | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      let params = '';
      if (tab === 'sign') {
        params = `product_type=sign&product_subtype=${signProd}`;
      } else if (printSub === 'offset') {
        params = `product_type=offset&product_subtype=${encodeURIComponent(offProduct)}&size=${offSize}&gsm=${offGsm}&quantity=${offQty}`;
      } else {
        params = `product_type=wide&product_subtype=${wideType}`;
      }
      apiFetch<any>(`/quote/market-analysis?${params}`, { auth: false })
        .then(r => r)
        .then(d => setMarket(d))
        .catch(() => setMarket(null));
    }, 400);
    return () => clearTimeout(timer);
  }, [tab, signProd, printSub, offProduct, offSize, offGsm, offQty, wideType]);

  const marketComparison = useMemo(() => {
    if (!market?.has_data || !market.market_avg_unit_price || !displayUnitPrice) return null;
    const diff = Math.round(((displayUnitPrice - market.market_avg_unit_price) / market.market_avg_unit_price) * 100);
    const position = diff < -5 ? 'cheap' : diff > 5 ? 'expensive' : 'average';
    return { diff, position, avg: market.market_avg_unit_price, min: market.market_min_unit_price!, max: market.market_max_unit_price!, count: market.sample_count!, factories: market.factories || [] };
  }, [market, displayUnitPrice]);

  /* ─── SUBMIT ─── */
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!mName || !mEmail) return;
    setSubmitting(true);

    let productName = '';
    let productType = '';
    let productSubtype = '';
    let dims = '';
    let qty = 1;
    let extras: Record<string, unknown> = {};

    if (tab === 'sign') {
      const sp = SIGN_PRODUCTS.find(p => p.key === signProd);
      productName = sp?.label || signProd;
      productType = 'sign';
      productSubtype = signProd;
      qty = signProd === 'tovgor' ? tovgorQty : 1;
      dims = signProd === 'tovgor' ? `${tovgorSize}см` : `${dimW}×${dimH}м`;
      extras = { extraRele, extraTog, extraCrane1, extraCrane8 };
    } else if (printSub === 'offset') {
      productName = offProduct;
      productType = 'offset';
      productSubtype = offProduct;
      qty = offQty;
      dims = `${offSize} ${offPages}хуудас`;
      extras = { gsm: offGsm, color: offColor, sides: offSides, finish: offFinish, fold: offFold };
    } else {
      const wt = WIDE_TYPES.find(t => t.key === wideType);
      productName = wt?.label || wideType;
      productType = 'wide';
      productSubtype = wideType;
      dims = `${wideW}×${wideL}м`;
    }

    // Одоогийн тооцоог batch-д нэмэх
    const currentQuote: any = {
      product_name: productName,
      product_type: productType,
      product_subtype: productSubtype,
      dimensions: dims,
      quantity: qty,
      size:       tab === 'sign' ? undefined : printSub === 'offset' ? offSize : `${wideW}×${wideL}м`,
      pages:      printSub === 'offset' ? offPages : undefined,
      paper_gsm:  printSub === 'offset' ? offGsm : undefined,
      color_mode: printSub === 'offset' ? (offColor === 'full' ? 'color' : 'bw') : undefined,
      sides:      printSub === 'offset' ? offSides : undefined,
      finishing:  printSub === 'offset' ? (offFinish !== 'none' ? offFinish : undefined) : undefined,
      paper_type: printSub === 'offset' ? `${offGsm}gsm` : undefined,
      base_price: breakdown.lines[0]?.amount || 0,
      total_price: displayTotal,
      unit_price: displayUnitPrice,
      margin_rate: MARGIN_MAP[margin],
      rush_type: rush,
      rush_fee: breakdown.lines.find(l => l.color === '#eab308')?.amount || 0,
      discount_amount: Math.abs(breakdown.lines.find(l => l.color === '#22c55e')?.amount || 0),
      pricing_mode: margin,
      extras,
      notes: mNotes,
      breakdown: breakdown.lines.map(l => ({ label: l.label, amount: Math.round(l.amount) })),
    };

    // Хадгалсан жагсаалт байвал зөвхөн тэдгээрийг, байхгүй бол одоогийн тооцоог илгээх
    const allQuotes = savedQuotes.length > 0 ? [...savedQuotes] : [currentQuote];

    try {
      const storedUser = typeof window !== 'undefined'
        ? (() => { try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null } })()
        : null;

      if (allQuotes.length > 1) {
        // BATCH: олон quote → нэг имэйл
        const data = await apiFetch<any>('/quote/batch', {
          method: 'POST',
          auth: false,
          body: {
            quotes: allQuotes,
            contact: {
              name: storedUser?.full_name || mName,
              email: storedUser?.email || mEmail,
              phone: storedUser?.phone || mPhone,
              company: mCompany,
            },
          },
        });

        setSavedQuotes([]); // Жагсаалт цэвэрлэх
        const ids = (data?.quotes || []).map((q: any) => q.id).filter(Boolean);
        setLastQuoteIds(ids);

        if (loggedUser) {
          setShowModal(false);
          router.push('/dashboard?section=quotes');
        } else {
          setSuccessMsg(`✅ ${data?.count || allQuotes.length} үнийн санал амжилттай!\nИмэйлээр илгээгдлээ: ${mEmail}`);
        }
      } else {
        // SINGLE: нэг quote
        const data = await apiFetch<any>('/quote', {
          method: 'POST',
          auth: false,
          body: {
            user_id: storedUser?.id || undefined,
            customer_name: storedUser?.full_name || mName,
            customer_email: storedUser?.email || mEmail,
            customer_phone: storedUser?.phone || mPhone,
            guest_name: mName,
            guest_email: mEmail,
            guest_phone: mPhone,
            company_name: mCompany,
            notes: mNotes,
            ...currentQuote,
          },
        });
        const qNum = data?.quote_number || data?.id?.slice(0, 8)?.toUpperCase() || '??????';
        if (data?.id) setLastQuoteIds([data.id]);

        if (loggedUser) {
          setShowModal(false);
          router.push('/dashboard?section=quotes');
        } else {
          setSuccessMsg(`✅ Амжилттай! #${qNum}\nИмэйлээр илгээгдлээ: ${mEmail}`);
        }
      }
    } catch {
      setSuccessMsg('❌ Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setSubmitting(false);
    }
  }, [mName, mEmail, mPhone, mCompany, mNotes, tab, signProd, tovgorSize, tovgorQty, dimW, dimH, extraRele, extraTog, extraCrane1, extraCrane8, printSub, offProduct, offSize, offPages, offQty, offGsm, offColor, offSides, offFinish, offFold, wideType, wideW, wideL, breakdown, margin, rush, displayTotal, displayUnitPrice, savedQuotes, loggedUser, router]);

  /* ───── Shared styles ───── */
  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, border: '2px solid',
    borderColor: active ? '#FF6B00' : 'var(--border2)', background: active ? 'rgba(255,107,0,0.12)' : 'var(--surface2)',
    color: active ? '#FF6B00' : 'var(--text)', transition: 'all .15s',
  });
  const selectStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--surface2)',
    color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%',
  };
  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--surface2)',
    color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%',
  };
  const labelStyle: React.CSSProperties = { fontSize: 13, color: 'var(--text2)', marginBottom: 4, display: 'block', fontWeight: 500 };
  const toggleStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13,
    border: 'none', background: active ? '#FF6B00' : 'var(--surface3)', color: active ? '#fff' : 'var(--text2)',
    transition: 'all .15s',
  });

  /* ───── SIGN FORM ───── */
  const signForm = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Product chips */}
      <div>
        <label style={labelStyle}>Бүтээгдэхүүн</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SIGN_PRODUCTS.map(p => (
            <button key={p.key} style={chipStyle(signProd === p.key)} onClick={() => setSignProd(p.key)}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Sign text + logo */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 200 }}>
          <label style={labelStyle}>Хаягны нэр / текст *</label>
          <input type="text" value={signText} onChange={e => setSignText(e.target.value)}
            placeholder='Жишээ: "BIZ MARKET"'
            style={inputStyle} />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={labelStyle}>Лого файл <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(заавал биш)</span></label>
          {signLogo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: '2px solid #10B981', background: '#F0FDF4' }}>
              <span style={{ fontSize: 12, color: '#10B981', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>✓ {signLogo.name.slice(0, 18)}</span>
              <button onClick={() => { setSignLogo(null); setSignLogoUrl('') }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 14, padding: '0 4px' }} title="Устгах">✕</button>
            </div>
          ) : (
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
              border: '1.5px dashed #D1D5DB', background: '#fff', fontSize: 12, color: '#888',
            }}>
              <input type="file" accept="image/*,.ai,.eps,.pdf" style={{ display: 'none' }}
                onChange={async e => {
                  if (!e.target.files?.[0]) return
                  const file = e.target.files[0]
                  setSignLogo(file); setSignLogoUrl(URL.createObjectURL(file))
                  try {
                    const fd = new FormData(); fd.append('file', file)
                    const res = await apiUpload<any>('/upload/file', fd)
                    if (res?.file_url) setSignLogoUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${res.file_url}`)
                  } catch {}
                }} />
              📎 Лого оруулах
            </label>
          )}
        </div>
      </div>

      {/* Tovgor */}
      {signProd === 'tovgor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {signText && (
            <div style={{ padding: '10px 14px', background: '#FFF7ED', borderRadius: 8, border: '1px solid #FFEDD5' }}>
              <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>Текст: <strong style={{ color: '#FF6B00' }}>{signText}</strong></div>
              <div style={{ fontSize: 10, color: '#888' }}>Үсгийн тоо: <strong>{signText.replace(/\s/g, '').length}</strong> (хоосон зайг тооцохгүй)</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={labelStyle}>Нэг үсгийн хэмжээ</label>
              <select style={selectStyle} value={tovgorSize} onChange={e => setTovgorSize(Number(e.target.value))}>
                {TOVGOR_SIZES.map(s => <option key={s} value={s}>{s}см</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={labelStyle}>Үсгийн тоо</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="number" min={1} step={1} style={{ ...inputStyle, flex: 1 }} value={tovgorQtyStr}
                  onChange={e => { setTovgorQtyStr(e.target.value); const n = parseInt(e.target.value); if (!isNaN(n) && n >= 1) setTovgorQty(n); }}
                  onBlur={e => { const n = parseInt(e.target.value); if (isNaN(n) || n < 1) { setTovgorQtyStr('1'); setTovgorQty(1); } }} />
                {signText && (
                  <button onClick={() => { const c = signText.replace(/\s/g, '').length; setTovgorQty(c || 1); setTovgorQtyStr(String(c || 1)); }}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #FF6B00', background: '#FFF7ED', color: '#FF6B00', fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Текстээс ({signText.replace(/\s/g, '').length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nerj */}
      {signProd === 'nerj' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={toggleStyle(!nerjLit)} onClick={() => setNerjLit(false)}>Асдаггүй</button>
            <button style={toggleStyle(nerjLit)} onClick={() => setNerjLit(true)}>Асдаг</button>
          </div>
          <DimInputs wStr={dimWStr} hStr={dimHStr} setW={v => { setDimW(v); setDimWStr(String(v)); }} setH={v => { setDimH(v); setDimHStr(String(v)); }} setWStr={setDimWStr} setHStr={setDimHStr} inputStyle={inputStyle} labelStyle={labelStyle} />
        </div>
      )}

      {/* 3D */}
      {signProd === 'd3' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={toggleStyle(!d3Lit)} onClick={() => setD3Lit(false)}>Гэрэлгүй</button>
            <button style={toggleStyle(d3Lit)} onClick={() => setD3Lit(true)}>Гэрэлтэй</button>
          </div>
          <DimInputs wStr={dimWStr} hStr={dimHStr} setW={v => { setDimW(v); setDimWStr(String(v)); }} setH={v => { setDimH(v); setDimHStr(String(v)); }} setWStr={setDimWStr} setHStr={setDimHStr} inputStyle={inputStyle} labelStyle={labelStyle} />
        </div>
      )}

      {/* Sambar */}
      {signProd === 'sambar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={toggleStyle(sbLocation === 'in')} onClick={() => setSbLocation('in')}>Дотор</button>
            <button style={toggleStyle(sbLocation === 'out')} onClick={() => setSbLocation('out')}>Гадна</button>
          </div>
          {sbLocation === 'in' ? (
            <div>
              <label style={labelStyle}>Зузаан</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['4', '6', '8'].map(t => (
                  <button key={t} style={toggleStyle(sbThickness === t)} onClick={() => setSbThickness(t)}>{t}см</button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label style={labelStyle}>Төрөл</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={toggleStyle(sbOutType === 'corner')} onClick={() => setSbOutType('corner')}>Булантай</button>
                <button style={toggleStyle(sbOutType === 'fold')} onClick={() => setSbOutType('fold')}>Сөхдөг</button>
              </div>
            </div>
          )}
          <DimInputs wStr={dimWStr} hStr={dimHStr} setW={v => { setDimW(v); setDimWStr(String(v)); }} setH={v => { setDimH(v); setDimHStr(String(v)); }} setWStr={setDimWStr} setHStr={setDimHStr} inputStyle={inputStyle} labelStyle={labelStyle} />
        </div>
      )}

      {/* PVC / Epoxy / Font / TMR */}
      {['pvc', 'epoxy', 'font', 'tmr'].includes(signProd) && (
        <DimInputs wStr={dimWStr} hStr={dimHStr} setW={v => { setDimW(v); setDimWStr(String(v)); }} setH={v => { setDimH(v); setDimHStr(String(v)); }} setWStr={setDimWStr} setHStr={setDimHStr} inputStyle={inputStyle} labelStyle={labelStyle} />
      )}

      {/* Extras */}
      <div>
        <label style={labelStyle}>Нэмэлт</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Checkbox checked={extraRele} onChange={setExtraRele} label={`Цагийн реле +${fmt(prices.extra_rele)}`} />
          <Checkbox checked={extraTog} onChange={setExtraTog} label={`Тог бууруулагч +${fmt(prices.extra_tog)}`} />
          <Checkbox checked={extraCrane1} onChange={setExtraCrane1} label={`Кран 1 цаг +${fmt(prices.extra_crane1)}`} />
          <Checkbox checked={extraCrane8} onChange={setExtraCrane8} label={`Кран өдөр +${fmt(prices.extra_crane8)}`} />
        </div>
      </div>
    </div>
  );

  /* ───── OFFSET FORM ───── */
  const offsetForm = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Бүтээгдэхүүн</label>
        <select style={selectStyle} value={offProduct} onChange={e => setOffProduct(e.target.value)}>
          {OFFSET_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={labelStyle}>Хэмжээ</label>
          <select style={selectStyle} value={offSize} onChange={e => setOffSize(e.target.value)}>
            {OFFSET_SIZES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 100 }}>
          <label style={labelStyle}>Хуудас тоо</label>
          <input type="number" min={1} step={1} style={inputStyle} value={offPagesStr}
            onChange={e => { setOffPagesStr(e.target.value); const n = parseInt(e.target.value); if (!isNaN(n) && n >= 1) setOffPages(n); }}
            onBlur={e => { const n = parseInt(e.target.value); if (isNaN(n) || n < 1) { setOffPagesStr('1'); setOffPages(1); } }} />
        </div>
        <div style={{ flex: 1, minWidth: 100 }}>
          <label style={labelStyle}>Тоо ширхэг</label>
          <input type="number" min={1} step={1} style={inputStyle} value={offQtyStr}
            onChange={e => { setOffQtyStr(e.target.value); const n = parseInt(e.target.value); if (!isNaN(n) && n >= 1) setOffQty(n); }}
            onBlur={e => { const n = parseInt(e.target.value); if (isNaN(n) || n < 1) { setOffQtyStr('1'); setOffQty(1); } }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <label style={labelStyle}>GSM</label>
          <select style={selectStyle} value={offGsm} onChange={e => setOffGsm(Number(e.target.value))}>
            {GSM_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={labelStyle}>Өнгө</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={toggleStyle(offColor === 'full')} onClick={() => setOffColor('full')}>Бүрэн өнгө</button>
            <button style={toggleStyle(offColor === 'bw')} onClick={() => setOffColor('bw')}>Хар цагаан</button>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={labelStyle}>Тал</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={toggleStyle(offSides === 'single')} onClick={() => setOffSides('single')}>Нэг тал</button>
            <button style={toggleStyle(offSides === 'double')} onClick={() => setOffSides('double')}>Хоёр тал</button>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={labelStyle}>Finishing</label>
          <select style={selectStyle} value={offFinish} onChange={e => setOffFinish(e.target.value)}>
            {FINISH_OPTIONS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={labelStyle}>Нугалалт</label>
          <select style={selectStyle} value={offFold} onChange={e => setOffFold(e.target.value)}>
            {FOLD_OPTIONS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  /* ───── WIDE FORM ───── */
  const wideForm = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Төрөл</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {WIDE_TYPES.map(t => (
            <button key={t.key} style={chipStyle(wideType === t.key)} onClick={() => setWideType(t.key)}>{t.label}</button>
          ))}
        </div>
      </div>
      <DimInputs wStr={wideWStr} hStr={wideLStr} setW={v => { setWideW(v); setWideWStr(String(v)); }} setH={v => { setWideL(v); setWideLStr(String(v)); }} setWStr={setWideWStr} setHStr={setWideLStr} inputStyle={inputStyle} labelStyle={labelStyle} wLabel="Өргөн (м)" hLabel="Урт (м)" />
    </div>
  );

  /* ═══════════ RENDER ═══════════ */
  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      {/* ═══ MODE SELECTOR HERO ═══ */}
      <div style={{ background: 'linear-gradient(135deg, #1C1917, #292524)', padding: '32px 16px', color: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>Үнийн <span style={{ color: '#FF6B00' }}>тооцоолуур</span></h1>
          <p style={{ fontSize: 14, color: '#A8A29E', marginBottom: 20 }}>3 аргаар үнэ тооцоолох боломжтой</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { key: 'quick' as const, icon: '⚡', label: 'Түргэн тооцоо', desc: 'Бүтээгдэхүүн → Хэмжээ → Тоо → Үнэ', color: '#FF6B00' },
              { key: 'advanced' as const, icon: '🧩', label: 'Нарийвчилсан', desc: 'Материал, finishing, машин, хүргэлт', color: '#8B5CF6' },
              { key: 'ai' as const, icon: '🤖', label: 'AI тооцоо', desc: 'Файл оруулах → Автомат шинжлэх → Үнэ', color: '#3B82F6' },
            ].map(m => (
              <button key={m.key} onClick={() => setMode(m.key)} style={{
                padding: '16px', borderRadius: 12, border: `2px solid ${mode === m.key ? m.color : 'transparent'}`,
                background: mode === m.key ? m.color + '15' : 'rgba(255,255,255,0.05)',
                cursor: 'pointer', textAlign: 'left', transition: 'all .2s',
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{m.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: mode === m.key ? m.color : '#fff', marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: '#A8A29E', lineHeight: 1.4 }}>{m.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

        {/* ═══ AI MODE ═══ */}
        {mode === 'ai' && (
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>AI файл шинжилгээ</h2>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>PDF, зураг файл оруулахад AI автоматаар хэмжээ, төрөл, материал тодорхойлж үнэ бодно</p>

              <label style={{ display: 'block', border: '2px dashed var(--border)', borderRadius: 14, padding: '40px 20px', cursor: 'pointer', transition: 'all .2s', background: aiFile ? '#F0FDF4' : 'var(--bg)' }}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#3B82F6' }}
                onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border)'; if (e.dataTransfer.files[0]) setAiFile(e.dataTransfer.files[0]) }}>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.ai,.eps" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.[0]) setAiFile(e.target.files[0]) }} />
                {aiFile ? (
                  <div><span style={{ fontSize: 28 }}>📄</span><div style={{ fontSize: 14, fontWeight: 600, marginTop: 8 }}>{aiFile.name}</div><div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{(aiFile.size / 1024 / 1024).toFixed(1)} MB</div></div>
                ) : (
                  <div><span style={{ fontSize: 28 }}>📤</span><div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8 }}>Файл чирж оруулах эсвэл энд дарна уу</div><div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>PDF, PNG, JPG, AI, EPS</div></div>
                )}
              </label>

              {aiFile && (
                <button onClick={async () => {
                  setAiLoading(true); setAiResult(null)
                  try {
                    const fd = new FormData(); fd.append('file', aiFile)
                    const res = await apiUpload<any>('/ai/pdf-inspector/inspect', fd)
                    if (res) setAiResult(res)
                    else setAiResult({ error: 'Хариу ирсэнгүй' })
                  } catch (e: any) { setAiResult({ error: e.message || 'AI шинжлэх алдаа' }) }
                  setAiLoading(false)
                }} disabled={aiLoading} style={{
                  marginTop: 16, width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                  background: '#3B82F6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  opacity: aiLoading ? 0.6 : 1,
                }}>
                  {aiLoading ? '🔄 Шинжилж байна...' : '🤖 AI шинжлэх'}
                </button>
              )}

              {/* AI Result */}
              {aiResult && !aiResult.error && (
                <div style={{ marginTop: 20, textAlign: 'left', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#3B82F6', margin: 0 }}>✅ AI шинжилгээний үр дүн</h3>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                      background: aiResult.score >= 80 ? '#10B98115' : aiResult.score >= 60 ? '#F59E0B15' : '#EF444415',
                      color: aiResult.score >= 80 ? '#10B981' : aiResult.score >= 60 ? '#F59E0B' : '#EF4444',
                    }}>Чанар: {aiResult.score}/100</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                      { l: '📐 Хэмжээ', v: aiResult.page_width_mm && aiResult.page_height_mm ? `${aiResult.page_width_mm}×${aiResult.page_height_mm}мм` : '—' },
                      { l: '📄 Хуудас', v: aiResult.pages || '—' },
                      { l: '🖨 Чанар', v: aiResult.checks?.resolution?.status === 'pass' ? 'Тохиромжтой' : aiResult.checks?.resolution?.status === 'warning' ? 'Дунд' : 'Бага' },
                      { l: '🎨 Өнгө', v: aiResult.checks?.color_mode?.status === 'pass' ? 'CMYK OK' : aiResult.checks?.color_mode?.detail?.includes('RGB') ? 'RGB (CMYK болгох)' : 'Хэвийн' },
                    ].map(r => (
                      <div key={r.l} style={{ background: 'var(--surface)', padding: '10px 12px', borderRadius: 8 }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{r.l}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{r.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Preflight checks */}
                  {aiResult.checks && (
                    <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {Object.entries(aiResult.checks).map(([key, check]: [string, any]) => {
                        const icon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : check.status === 'fail' ? '❌' : 'ℹ️'
                        const labels: Record<string, string> = { resolution: 'Чанар', color_mode: 'Өнгө', bleed: 'Bleed', fonts: 'Фонт', page_size: 'Хэмжээ', transparency: 'Transparency' }
                        return (
                          <span key={key} title={check.detail} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6,
                            background: check.status === 'pass' ? '#10B98110' : check.status === 'warning' ? '#F59E0B10' : check.status === 'fail' ? '#EF444410' : '#3B82F610',
                            color: check.status === 'pass' ? '#10B981' : check.status === 'warning' ? '#F59E0B' : check.status === 'fail' ? '#EF4444' : '#3B82F6',
                            fontWeight: 600, cursor: 'help',
                          }}>{icon} {labels[key] || key}</span>
                        )
                      })}
                    </div>
                  )}

                  {/* Summary */}
                  {aiResult.summary && (
                    <div style={{ padding: '10px 14px', background: aiResult.score >= 80 ? '#F0FDF4' : '#FFFBEB', borderRadius: 8, fontSize: 12, color: aiResult.score >= 80 ? '#166534' : '#92400E', marginBottom: 12, border: `1px solid ${aiResult.score >= 80 ? '#BBF7D0' : '#FDE68A'}` }}>
                      💡 {aiResult.summary}
                    </div>
                  )}

                  {/* Issues */}
                  {aiResult.issues?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      {aiResult.issues.filter((i: any) => i.severity !== 'info').map((issue: any, idx: number) => (
                        <div key={idx} style={{ fontSize: 11, padding: '6px 10px', borderRadius: 6, marginBottom: 4,
                          background: issue.severity === 'error' ? '#FEF2F2' : '#FFFBEB',
                          color: issue.severity === 'error' ? '#DC2626' : '#D97706',
                        }}>
                          {issue.severity === 'error' ? '❌' : '⚠️'} {issue.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* User input form — required before pricing */}
                  <div style={{ marginBottom: 12, padding: 16, background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📋 Хэвлэлийн тохиргоо</h4>

                    {/* Qty */}
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Тоо ширхэг *</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[50, 100, 200, 500, 1000].map(q => (
                          <button key={q} onClick={() => { setAiQty(q); setAiShowPrice(false) }} style={{
                            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            border: aiQty === q ? '2px solid #FF6B00' : '1px solid #E5E7EB',
                            background: aiQty === q ? '#FFF7ED' : '#fff', color: aiQty === q ? '#FF6B00' : '#555',
                          }}>{q}</button>
                        ))}
                        <input type="number" min={1} value={aiQty} onChange={e => { setAiQty(Number(e.target.value) || 1); setAiShowPrice(false) }}
                          style={{ width: 80, padding: '6px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, textAlign: 'center' }} />
                      </div>
                    </div>

                    {/* Inner paper GSM */}
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Дотор цаасны зузаан (gsm) *</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[80, 100, 120, 150].map(g => (
                          <button key={g} onClick={() => { setAiInnerGsm(g); setAiShowPrice(false) }} style={{
                            padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            border: aiInnerGsm === g ? '2px solid #8B5CF6' : '1px solid #E5E7EB',
                            background: aiInnerGsm === g ? '#F5F3FF' : '#fff', color: aiInnerGsm === g ? '#8B5CF6' : '#555',
                          }}>{g}gsm</button>
                        ))}
                      </div>
                    </div>

                    {/* Cover type */}
                    {(aiResult.pages || 0) > 4 && (
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Хавтасны төрөл *</label>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {[
                            { key: 'soft' as const, label: 'Зөөлөн хавтас', desc: 'Картон + ламинаци', price: '~600₮/ш' },
                            { key: 'hard' as const, label: 'Хатуу хавтас', desc: 'Хавтгай + даавуу/картон', price: '~3,000₮/ш' },
                          ].map(c => (
                            <button key={c.key} onClick={() => { setAiCoverType(c.key); setAiShowPrice(false) }} style={{
                              flex: 1, padding: '10px 12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                              border: aiCoverType === c.key ? '2px solid #10B981' : '1px solid #E5E7EB',
                              background: aiCoverType === c.key ? '#F0FDF4' : '#fff',
                            }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: aiCoverType === c.key ? '#10B981' : '#333' }}>{c.label}</div>
                              <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{c.desc}</div>
                              <div style={{ fontSize: 10, color: '#BBB', marginTop: 1 }}>{c.price}</div>
                            </button>
                          ))}
                        </div>
                        {aiCoverType === 'soft' && (
                          <div style={{ marginTop: 8 }}>
                            <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 3 }}>Хавтасны цаас (gsm)</label>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {[200, 250, 300].map(g => (
                                <button key={g} onClick={() => { setAiCoverGsm(g); setAiShowPrice(false) }} style={{
                                  padding: '4px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                                  border: aiCoverGsm === g ? '1.5px solid #10B981' : '1px solid #E5E7EB',
                                  background: aiCoverGsm === g ? '#F0FDF4' : '#fff', color: aiCoverGsm === g ? '#10B981' : '#888',
                                }}>{g}gsm</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Finishing */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Нэмэлт ажилбар</label>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[
                          { key: 'lamination', label: '✨ Ламинаци', options: ['none', 'matt', 'gloss'] as const },
                        ].map(f => (
                          <div key={f.key} style={{ display: 'flex', gap: 3 }}>
                            {f.options.map(o => (
                              <button key={o} onClick={() => { setAiFinishing(p => ({ ...p, lamination: o })); setAiShowPrice(false) }} style={{
                                padding: '5px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                                border: aiFinishing.lamination === o ? '1.5px solid #FF6B00' : '1px solid #E5E7EB',
                                background: aiFinishing.lamination === o ? '#FFF7ED' : '#fff', color: aiFinishing.lamination === o ? '#FF6B00' : '#888',
                              }}>{o === 'none' ? 'Байхгүй' : o === 'matt' ? 'Мат' : 'Гянт'}</button>
                            ))}
                          </div>
                        ))}
                        {[
                          { key: 'uv', label: 'UV лак', price: '+200₮/ш' },
                          { key: 'emboss', label: 'Тамга (emboss)', price: '+500₮/ш' },
                          { key: 'foil', label: 'Фольга тамга', price: '+800₮/ш' },
                        ].map(f => (
                          <button key={f.key} onClick={() => { setAiFinishing(p => ({ ...p, [f.key]: !(p as any)[f.key] })); setAiShowPrice(false) }} style={{
                            padding: '5px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                            border: (aiFinishing as any)[f.key] ? '1.5px solid #FF6B00' : '1px solid #E5E7EB',
                            background: (aiFinishing as any)[f.key] ? '#FFF7ED' : '#fff', color: (aiFinishing as any)[f.key] ? '#FF6B00' : '#888',
                          }}>
                            {(aiFinishing as any)[f.key] ? '✓ ' : ''}{f.label} <span style={{ color: '#BBB', fontSize: 9 }}>{f.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calculate button */}
                    <button onClick={() => setAiShowPrice(true)} style={{
                      width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: '#FF6B00', color: '#fff', fontSize: 14, fontWeight: 700,
                    }}>
                      💰 Үнэ тооцоолох
                    </button>
                  </div>

                  {/* Pricing result — customer-facing: unit price + total + VAT only */}
                  {aiShowPrice && (() => {
                    const w = aiResult.page_width_mm || 0
                    const h = aiResult.page_height_mm || 0
                    const pages = aiResult.pages || 1
                    let sizeKey = 'A4'
                    if (w <= 105 && h <= 148) sizeKey = 'A6'
                    else if (w <= 148 && h <= 210) sizeKey = 'A5'
                    else if (w <= 210 && h <= 297) sizeKey = 'A4'
                    else sizeKey = 'A3'
                    let productType = 'Хуудас'
                    if (pages === 1) productType = 'Постер / Флаер'
                    else if (pages <= 4) productType = 'Флаер'
                    else if (pages <= 16) productType = 'Брошур'
                    else if (pages <= 64) productType = 'Каталог'
                    else productType = 'Ном'

                    const qty = aiQty
                    const isBook = pages > 4
                    const imp: Record<string, number> = { A6: 16, A5: 8, A4: 4, A3: 2 }
                    const pps = imp[sizeKey] || 4
                    const ip = pages - (isBook ? 4 : 0)
                    const ts = Math.ceil(ip / pps)
                    const pt = qty < 100 ? 'digital' : 'offset'
                    const ppm: Record<number, number> = { 80: 120, 100: 150, 120: 180, 150: 220 }
                    const pc = ts * (ppm[aiInnerGsm] || 150) * qty
                    let prc = 0, sc = 0
                    if (pt === 'digital') prc = ip * 25 * qty; else { sc = 50000; prc = ts * 80 * qty }
                    let cc = 0
                    if (isBook) { cc = aiCoverType === 'hard' ? 3000 * qty : (({ 200: 300, 250: 400, 300: 500 } as any)[aiCoverGsm] + 400 + (aiFinishing.lamination !== 'none' ? 200 : 0)) * qty }
                    let fpu = 0
                    if (aiFinishing.lamination !== 'none') fpu += aiFinishing.lamination === 'matt' ? 180 : 150
                    if (aiFinishing.uv) fpu += 200; if (aiFinishing.emboss) fpu += 500; if (aiFinishing.foil) fpu += 800
                    const fc = fpu * qty
                    const cost = pc + prc + cc + sc + fc
                    const total = Math.round(cost * 1.30)
                    const unitPrice = Math.round(total / qty)
                    const vat = Math.round(total * 0.10)
                    const grandTotal = total + vat

                    const specs = [
                      `${sizeKey} (${w}×${h}мм)`,
                      `${pages} хуудас`,
                      `${aiInnerGsm}gsm`,
                      isBook ? (aiCoverType === 'hard' ? 'Хатуу хавтас' : `Зөөлөн хавтас ${aiCoverGsm}gsm`) : null,
                      aiFinishing.lamination !== 'none' ? (aiFinishing.lamination === 'matt' ? 'Мат ламинаци' : 'Гянт ламинаци') : null,
                      aiFinishing.uv ? 'UV лак' : null,
                      aiFinishing.emboss ? 'Тамга' : null,
                      aiFinishing.foil ? 'Фольга' : null,
                    ].filter(Boolean).join(' · ')

                    const addToList = () => {
                      setAiQuoteList(prev => [...prev, {
                        id: Date.now().toString(),
                        label: `${productType} ${sizeKey} ${pages}х`,
                        qty, unitPrice, total, vat, grandTotal,
                      }])
                      setAiShowPrice(false)
                      setAiFile(null)
                      setAiResult(null)
                    }

                    return (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ padding: 20, background: '#F0FDF4', borderRadius: 12, border: '1px solid #BBF7D0' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#10B981', marginBottom: 4 }}>💰 Үнийн санал</div>
                          <div style={{ fontSize: 11, color: '#888', marginBottom: 14 }}>{productType} · {specs}</div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                              <span>Нэгж үнэ</span>
                              <span style={{ fontWeight: 700 }}>₮{unitPrice.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                              <span>Тоо ширхэг</span>
                              <span style={{ fontWeight: 600 }}>×{qty}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #D1FAE5', color: '#333' }}>
                              <span style={{ fontWeight: 600 }}>Дүн</span>
                              <span style={{ fontWeight: 700 }}>₮{total.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888' }}>
                              <span>НӨАТ (10%)</span>
                              <span style={{ fontWeight: 600 }}>₮{vat.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '2px solid #10B981', marginTop: 4 }}>
                              <span style={{ fontSize: 15, fontWeight: 800, color: '#10B981' }}>НИЙТ</span>
                              <span style={{ fontSize: 22, fontWeight: 800, color: '#10B981' }}>₮{grandTotal.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button onClick={addToList} style={{
                            flex: 1, padding: '12px 0', borderRadius: 10, border: '2px solid #FF6B00',
                            background: '#fff', color: '#FF6B00', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          }}>+ Жагсаалтад нэмэх</button>
                          <button onClick={() => { addToList(); setShowModal(true) }} style={{
                            flex: 1, padding: '12px 0', borderRadius: 10, border: 'none',
                            background: '#FF6B00', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          }}>Үнийн санал авах</button>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Quote list */}
                  {aiQuoteList.length > 0 && (
                    <div style={{ marginBottom: 12, padding: 16, background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>📋 Үнийн саналын жагсаалт ({aiQuoteList.length})</div>
                      {aiQuoteList.map((q, i) => (
                        <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{q.label}</div>
                            <div style={{ fontSize: 10, color: '#888' }}>{q.qty}ш × ₮{q.unitPrice.toLocaleString()}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>₮{q.grandTotal.toLocaleString()}</span>
                            <button onClick={() => setAiQuoteList(prev => prev.filter((_, j) => j !== i))}
                              style={{ width: 20, height: 20, borderRadius: 4, border: 'none', background: '#FEE2E2', color: '#EF4444', fontSize: 10, cursor: 'pointer' }}>✕</button>
                          </div>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: 14, fontWeight: 800, color: '#FF6B00' }}>
                        <span>НИЙТ ({aiQuoteList.length} зүйл)</span>
                        <span>₮{aiQuoteList.reduce((s, q) => s + q.grandTotal, 0).toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button onClick={() => { setAiFile(null); setAiResult(null); setAiShowPrice(false) }} style={{
                          flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--border)',
                          background: 'var(--surface)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}>+ Өөр файл нэмэх</button>
                        <button onClick={() => setShowModal(true)} style={{
                          flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                          background: '#FF6B00', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}>📧 Нэгтгэн илгээх</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setMode('advanced') }} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🧩 Нарийвчлах</button>
                    <button onClick={() => router.push('/marketplace')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: '#EC4899', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🎨 Designer дуудах</button>
                  </div>
                </div>
              )}
              {aiResult?.error && (
                <div style={{ marginTop: 16, padding: 14, background: '#FEF2F2', borderRadius: 10, color: '#DC2626', fontSize: 12, border: '1px solid #FECACA' }}>⚠ {aiResult.error}</div>
              )}
            </div>
          </div>
        )}

        {/* ═══ QUICK / ADVANCED MODES ═══ */}
        {(mode === 'quick' || mode === 'advanced') && (<>

        {/* ── TAB BUTTONS (product type) ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { key: 'sign' as const, label: 'Хаяг реклам' },
            { key: 'print' as const, label: 'Хэвлэл' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '14px 32px', borderRadius: 10, fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer',
              background: tab === t.key ? '#FF6B00' : 'var(--surface2)', color: tab === t.key ? '#fff' : 'var(--text2)',
              transition: 'all .2s',
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* ── LEFT: calculator ── */}
          <div style={{ flex: '1 1 560px', minWidth: 320, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 24 }}>

            {tab === 'sign' && signForm}

            {tab === 'print' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={chipStyle(printSub === 'offset')} onClick={() => setPrintSub('offset')}>Офсет хэвлэл</button>
                  <button style={chipStyle(printSub === 'wide')} onClick={() => setPrintSub('wide')}>Өргөн хэвлэл</button>
                </div>
                {printSub === 'offset' ? offsetForm : wideForm}
              </div>
            )}

            {/* ── COMMON: rush & margin ── */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <label style={labelStyle}>Хугацаа</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={toggleStyle(rush === 'normal')} onClick={() => setRush('normal')}>Энгийн</button>
                  <button style={toggleStyle(rush === '48h')} onClick={() => setRush('48h')}>48цаг (+15%)</button>
                  <button style={toggleStyle(rush === '24h')} onClick={() => setRush('24h')}>24цаг (+30%)</button>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: clean price panel (customer-facing) ── */}
          <div style={{ flex: '0 0 340px', minWidth: 300, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 24, position: 'sticky', top: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>Үнийн санал</h2>

            {displayTotal > 0 ? (
              <>
                {/* Clean price display — no breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text2)' }}>
                    <span>Нэгж үнэ</span>
                    <span style={{ fontWeight: 700 }}>{fmt(displayUnitPrice)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text2)' }}>
                    <span>Тоо ширхэг</span>
                    <span style={{ fontWeight: 600 }}>×{displayUnitPrice > 0 ? Math.round(displayTotal / displayUnitPrice) : 1}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)', color: 'var(--text)' }}>
                    <span style={{ fontWeight: 600 }}>Дүн</span>
                    <span style={{ fontWeight: 700 }}>{fmt(displayTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text3)' }}>
                    <span>НӨАТ (10%)</span>
                    <span style={{ fontWeight: 600 }}>{fmt(Math.round(displayTotal * 0.1))}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '2px solid #FF6B00', marginTop: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#FF6B00' }}>НИЙТ</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#FF6B00' }}>{fmt(Math.round(displayTotal * 1.1))}</span>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: 14 }}>Параметр оруулна уу</div>
            )}

            {/* Saved quotes list */}
            {savedQuotes.length > 0 && (
              <div onClick={() => setShowSaved(!showSaved)} style={{
                marginTop: 16, background: '#FFF7ED', border: '2px solid #FF6B00', borderRadius: 12, padding: '12px 16px',
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FF6B00' }}>{savedQuotes.length} тооцоо хадгалагдсан</div>
                  <div style={{ fontSize: 12, color: '#9a3412' }}>Нийт: {fmt(savedTotal)} + НӨАТ</div>
                </div>
                <div style={{ fontSize: 12, color: '#FF6B00', fontWeight: 600 }}>{showSaved ? 'Хаах ▲' : 'Харах ▼'}</div>
              </div>
            )}
            {showSaved && savedQuotes.length > 0 && (
              <div style={{ marginTop: 8, background: 'var(--surface2)', borderRadius: 10, padding: 12 }}>
                {savedQuotes.map((sq, i) => (
                  <div key={sq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < savedQuotes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{sq.product_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sq.dimensions} · {sq.quantity}ш</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#FF6B00' }}>{fmt(sq.total_price)}</span>
                      <button onClick={(e) => { e.stopPropagation(); editQuote(sq); }} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: 11, padding: '2px 4px' }} title="Засварлах">✎</button>
                      <button onClick={(e) => { e.stopPropagation(); removeFromList(sq.id); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, padding: '2px 4px' }} title="Устгах">✕</button>
                    </div>
                  </div>
                ))}
                {/* Нийт дүн */}
                <div style={{ borderTop: '2px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Дүн: {fmt(savedTotal)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>НӨАТ (10%): {fmt(Math.round(savedTotal * 0.1))}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#FF6B00' }}>{fmt(Math.round(savedTotal * 1.1))}</div>
                </div>
              </div>
            )}

            {displayTotal > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                <button onClick={() => setShowPreview(true)} style={{
                  width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: '#1C1917', color: '#fff', fontSize: 13, fontWeight: 700,
                }}>📄 Үнийн санал харах</button>
                <button onClick={addToList} style={{
                  width: '100%', padding: '12px 0', borderRadius: 10, border: '2px solid #FF6B00', cursor: 'pointer',
                  background: 'transparent', color: '#FF6B00', fontSize: 13, fontWeight: 700,
                }}>+ Жагсаалтад нэмэх</button>
                <button onClick={() => { setShowModal(true); setSuccessMsg(''); }} style={{
                  width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: '#FF6B00', color: '#fff', fontSize: 13, fontWeight: 700,
                }}>{savedQuotes.length > 0 ? `📧 Бүгдийг илгээх (${savedQuotes.length})` : '📧 Үнийн санал илгээх'}</button>
              </div>
            )}
          </div>
        </div>
      </>)}
      </div>

      {/* ═══════ MODAL ═══════ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Үнийн санал авах</h3>

            {successMsg ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                {successMsg.split('\n').map((line, i) => (
                  <div key={i} style={{ fontSize: i === 0 ? 18 : 14, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? '#22c55e' : 'var(--text2)', marginBottom: 6 }}>{line}</div>
                ))}
                {lastQuoteIds.length > 0 && (
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>PDF үнийн санал татах:</div>
                    {lastQuoteIds.map((qid, i) => (
                      <a key={qid} href={`${API_URL}/quote/${qid}/pdf`} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border2)', color: '#FF6B00', fontWeight: 600, fontSize: 13, textDecoration: 'none', cursor: 'pointer' }}>
                        <span>📄</span> {lastQuoteIds.length > 1 ? `PDF #${i + 1} татах` : 'PDF татах'}
                      </a>
                    ))}
                  </div>
                )}
                <button onClick={() => { setShowModal(false); setLastQuoteIds([]); }} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, border: 'none', background: '#FF6B00', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Хаах</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Logged-in user: show their info (read-only) */}
                {loggedUser ? (
                  <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 14, fontSize: 13 }}>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Таны мэдээлэл</div>
                    <div style={{ fontWeight: 700 }}>{loggedUser.full_name}</div>
                    <div style={{ color: 'var(--text2)' }}>{loggedUser.email}</div>
                    {loggedUser.phone && <div style={{ color: 'var(--text2)' }}>{loggedUser.phone}</div>}
                  </div>
                ) : (
                  <>
                    <div>
                      <label style={labelStyle}>Нэр *</label>
                      <input style={inputStyle} value={mName} onChange={e => setMName(e.target.value)} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Имэйл *</label>
                      <input type="email" style={inputStyle} value={mEmail} onChange={e => setMEmail(e.target.value)} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Утас</label>
                      <input style={inputStyle} value={mPhone} onChange={e => setMPhone(e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>Компани</label>
                      <input style={inputStyle} value={mCompany} onChange={e => setMCompany(e.target.value)} />
                    </div>
                  </>
                )}
                <div>
                  <label style={labelStyle}>Тэмдэглэл</label>
                  <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={mNotes} onChange={e => setMNotes(e.target.value)} />
                </div>

                {/* Clean price summary — no breakdown */}
                <div style={{ background: '#F0FDF4', borderRadius: 10, padding: 16, fontSize: 13, border: '1px solid #BBF7D0' }}>
                  {savedQuotes.length > 0 && (
                    <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #D1FAE5' }}>
                      {savedQuotes.map((sq, i) => (
                        <div key={sq.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                          <span style={{ color: '#555' }}>{sq.product_name} ({sq.quantity}ш)</span>
                          <span style={{ fontWeight: 600 }}>{fmt(Math.round(sq.total_price * 1.1))}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#555' }}>Нэгж үнэ</span>
                    <span style={{ fontWeight: 700 }}>{fmt(displayUnitPrice)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#555' }}>Тоо ширхэг</span>
                    <span style={{ fontWeight: 600 }}>×{displayUnitPrice > 0 ? Math.round(displayTotal / displayUnitPrice) : 1}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #D1FAE5', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#333' }}>Дүн</span>
                    <span style={{ fontWeight: 700 }}>{fmt(displayTotal + savedTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#888' }}>НӨАТ (10%)</span>
                    <span style={{ fontWeight: 600 }}>{fmt(Math.round((displayTotal + savedTotal) * 0.1))}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '2px solid #10B981', marginTop: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#10B981' }}>НИЙТ</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#10B981' }}>{fmt(Math.round((displayTotal + savedTotal) * 1.1))}</span>
                  </div>
                </div>

                <button type="submit" disabled={submitting} style={{
                  padding: '12px 0', borderRadius: 10, border: 'none', cursor: submitting ? 'wait' : 'pointer',
                  background: submitting ? 'var(--text3)' : '#FF6B00', color: '#fff', fontSize: 15, fontWeight: 700,
                }}>
                  {submitting ? 'Илгээж байна...' : loggedUser ? '📋 Дашбоардад хадгалах →' : '📧 Имэйлээр авах'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Quote Preview */}
      {showPreview && displayTotal > 0 && (
        <QuotePreview
          open={showPreview}
          onClose={() => setShowPreview(false)}
          onSend={() => { setShowPreview(false); setShowModal(true); setSuccessMsg(''); }}
          data={{
            items: savedQuotes.length > 0
              ? savedQuotes.map(sq => ({
                  product: sq.product_name,
                  text: sq.text || signText || sq.product_name,
                  width: parseFloat(sq.dimensions?.split('×')[0] || '0') || dimW,
                  height: parseFloat(sq.dimensions?.split('×')[1] || '0') || dimH,
                  unit: 'м',
                  qty: sq.quantity || 1,
                  unitPrice: sq.unit_price || sq.total_price,
                  total: sq.total_price,
                }))
              : [{
                  product: tab === 'sign'
                    ? (SIGN_PRODUCTS.find(p => p.key === signProd)?.label || signProd)
                    : (printSub === 'offset' ? `${offProduct} (${offSize})` : 'Өргөн хэвлэл'),
                  text: signText || offProduct || '—',
                  width: tab === 'sign' ? (signProd === 'tovgor' ? tovgorSize / 100 * (signText.replace(/\s/g, '').length || 1) : dimW) : 0,
                  height: tab === 'sign' ? (signProd === 'tovgor' ? tovgorSize / 100 : dimH) : 0,
                  unit: tab === 'sign' ? (signProd === 'tovgor' ? 'см' : 'м') : 'мм',
                  qty: tab === 'sign' ? (signProd === 'tovgor' ? tovgorQty : 1) : offQty,
                  unitPrice: displayUnitPrice,
                  total: displayTotal,
                  isLetterBased: tab === 'sign' && signProd === 'tovgor',
                  letterSize: signProd === 'tovgor' ? tovgorSize : undefined,
                  letterCount: signProd === 'tovgor' ? tovgorQty : undefined,
                }],
            logoUrl: signLogoUrl || undefined,
            logoItem: signLogoUrl ? (() => {
              const signH = signProd === 'tovgor' ? tovgorSize : Math.round(dimH * 100);
              const lh = Math.round(signH * 1.18);
              const lw = lh;
              const area = (lw / 100) * (lh / 100);
              const lp = Math.round(Math.max(area * 500000, 80000));
              return { width: lw, height: lh, unit: 'см', price: lp };
            })() : null,
            customerName: loggedUser?.full_name || mName || '',
            customerEmail: loggedUser?.email || mEmail || '',
            customerPhone: loggedUser?.phone || mPhone || '',
            customerCompany: loggedUser?.company_name || mCompany || '',
            notes: mNotes || undefined,
            subtotal: displayTotal + savedTotal + (signLogoUrl ? (() => { const sh = signProd === 'tovgor' ? tovgorSize : dimH * 100; const lh = sh * 1.18; return Math.round(Math.max((lh/100)*(lh/100)*500000, 80000)) })() : 0),
            vat: Math.round((displayTotal + savedTotal + (signLogoUrl ? (() => { const sh = signProd === 'tovgor' ? tovgorSize : dimH * 100; const lh = sh * 1.18; return Math.round(Math.max((lh/100)*(lh/100)*500000, 80000)) })() : 0)) * 0.1),
            grandTotal: Math.round((displayTotal + savedTotal + (signLogoUrl ? (() => { const sh = signProd === 'tovgor' ? tovgorSize : dimH * 100; const lh = sh * 1.18; return Math.round(Math.max((lh/100)*(lh/100)*500000, 80000)) })() : 0)) * 1.1),
            quoteNumber: 'QT-' + String(Date.now()).slice(-6),
            date: new Date().toLocaleDateString('mn-MN'),
            validDays: 7,
          }}
        />
      )}
    </div>
  );
}

/* ─── SMALL COMPONENTS ─── */
function DimInputs({ wStr, hStr, setW, setH, setWStr, setHStr, inputStyle, labelStyle, wLabel, hLabel }: {
  wStr: string; hStr: string;
  setW: (v: number) => void; setH: (v: number) => void;
  setWStr: (v: string) => void; setHStr: (v: string) => void;
  inputStyle: React.CSSProperties; labelStyle: React.CSSProperties;
  wLabel?: string; hLabel?: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <label style={labelStyle}>{wLabel || 'Өргөн (м)'}</label>
        <input type="number" min={0.1} step={0.1} style={inputStyle} value={wStr}
          onChange={e => { setWStr(e.target.value); const n = parseFloat(e.target.value); if (!isNaN(n) && n >= 0.1) setW(n); }}
          onBlur={e => { const n = parseFloat(e.target.value); if (isNaN(n) || n < 0.1) { setWStr('0.1'); setW(0.1); } }} />
      </div>
      <div style={{ flex: 1 }}>
        <label style={labelStyle}>{hLabel || 'Өндөр (м)'}</label>
        <input type="number" min={0.1} step={0.1} style={inputStyle} value={hStr}
          onChange={e => { setHStr(e.target.value); const n = parseFloat(e.target.value); if (!isNaN(n) && n >= 0.1) setH(n); }}
          onBlur={e => { const n = parseFloat(e.target.value); if (isNaN(n) || n < 0.1) { setHStr('0.1'); setH(0.1); } }} />
      </div>
    </div>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: 18, height: 18, accentColor: '#FF6B00' }} />
      <span>{label}</span>
    </label>
  );
}
