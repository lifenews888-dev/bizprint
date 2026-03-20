'use client';

import { useState, useCallback, useMemo, useEffect, FormEvent } from 'react';

const API = 'http://localhost:4000';

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
export default function QuotePage() {
  /* ─ remote config ─ */
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  useEffect(() => {
    fetch(`${API}/pricing-config/public`).then(r => r.ok ? r.json() : null)
      .then(d => { if (d && typeof d === 'object') setPrices({ ...DEFAULT_PRICES, ...d }); })
      .catch(() => {});
  }, []);

  /* ─ TAB ─ */
  const [tab, setTab] = useState<'sign' | 'print'>('sign');

  /* ─ common ─ */
  const [rush, setRush] = useState('normal');
  const [margin, setMargin] = useState<'b2b' | 'retail'>('retail');

  /* ─ SIGN state ─ */
  const [signProd, setSignProd] = useState('tovgor');
  const [tovgorSize, setTovgorSize] = useState(30);
  const [tovgorQty, setTovgorQty] = useState(1);
  const [nerjLit, setNerjLit] = useState(false);     // false=Асдаггүй true=Асдаг
  const [d3Lit, setD3Lit] = useState(false);
  const [sbLocation, setSbLocation] = useState<'in' | 'out'>('in');
  const [sbThickness, setSbThickness] = useState('4');
  const [sbOutType, setSbOutType] = useState('corner');
  const [dimW, setDimW] = useState(1);
  const [dimH, setDimH] = useState(1);
  const [extraRele, setExtraRele] = useState(false);
  const [extraTog, setExtraTog] = useState(false);
  const [extraCrane1, setExtraCrane1] = useState(false);
  const [extraCrane8, setExtraCrane8] = useState(false);

  /* ─ PRINT state ─ */
  const [printSub, setPrintSub] = useState<'offset' | 'wide'>('offset');
  const [offProduct, setOffProduct] = useState('Нэрийн хуудас');
  const [offSize, setOffSize] = useState('A4');
  const [offPages, setOffPages] = useState(1);
  const [offQty, setOffQty] = useState(100);
  const [offGsm, setOffGsm] = useState(130);
  const [offColor, setOffColor] = useState<'full' | 'bw'>('full');
  const [offSides, setOffSides] = useState<'single' | 'double'>('single');
  const [offFinish, setOffFinish] = useState('none');
  const [offFold, setOffFold] = useState('none');
  const [wideType, setWideType] = useState('banner');
  const [wideW, setWideW] = useState(1);
  const [wideL, setWideL] = useState(2);

  /* ─ modal ─ */
  const [showModal, setShowModal] = useState(false);
  const [mName, setMName] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mCompany, setMCompany] = useState('');
  const [mNotes, setMNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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
      lines.push({ label: 'Суурь үнэ', amount: c.base });
      if (c.extras > 0) lines.push({ label: 'Нэмэлт ажил', amount: c.extras });
      if (c.rushRate > 0) lines.push({ label: `Яаралтай (+${Math.round(c.rushRate * 100)}%)`, amount: c.rushAmt, color: '#eab308' });
      lines.push({ label: `Ашиг (${c.marginRate === 1.2 ? '20%' : '45%'})`, amount: c.marginAmt });
      total = c.total;
      unitQty = c.qty;
    } else if (printSub === 'offset') {
      const c = offsetCalc;
      lines.push({ label: 'Суурь үнэ', amount: c.subtotal });
      if (c.disc > 0) lines.push({ label: `Хөнгөлөлт (-${Math.round(c.disc * 100)}%)`, amount: -c.discAmt, color: '#22c55e' });
      if (c.rushRate > 0) lines.push({ label: `Яаралтай (+${Math.round(c.rushRate * 100)}%)`, amount: c.rushAmt, color: '#eab308' });
      lines.push({ label: `Ашиг (${c.marginRate === 1.2 ? '20%' : '45%'})`, amount: c.marginAmt });
      total = c.total;
      unitQty = c.qty;
    } else {
      const c = wideCalc;
      lines.push({ label: 'Суурь үнэ', amount: c.base });
      if (c.rushRate > 0) lines.push({ label: `Яаралтай (+${Math.round(c.rushRate * 100)}%)`, amount: c.rushAmt, color: '#eab308' });
      lines.push({ label: `Ашиг (${c.marginRate === 1.2 ? '20%' : '45%'})`, amount: c.marginAmt });
      total = c.total;
      unitQty = 1;
    }

    return { lines, total, unitPrice: unitQty > 0 ? total / unitQty : total };
  }, [tab, printSub, signCalc, offsetCalc, wideCalc]);

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

    try {
      const res = await fetch(`${API}/quotes-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: mName,
          guest_email: mEmail,
          guest_phone: mPhone,
          company_name: mCompany,
          notes: mNotes,
          product_name: productName,
          product_type: productType,
          product_subtype: productSubtype,
          dimensions: dims,
          quantity: qty,
          base_price: breakdown.lines[0]?.amount || 0,
          total_price: breakdown.total,
          unit_price: breakdown.unitPrice,
          margin_rate: MARGIN_MAP[margin],
          rush_type: rush,
          rush_fee: breakdown.lines.find(l => l.color === '#eab308')?.amount || 0,
          discount_amount: Math.abs(breakdown.lines.find(l => l.color === '#22c55e')?.amount || 0),
          pricing_mode: margin,
          extras,
          breakdown: breakdown.lines.map(l => ({ label: l.label, amount: Math.round(l.amount) })),
        }),
      });
      const data = await res.json();
      setSuccessMsg(`Имэйлээр илгээгдлээ #${data.quote_number || 'QT-?????'}`);
    } catch {
      setSuccessMsg('Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setSubmitting(false);
    }
  }, [mName, mEmail, mPhone, mCompany, mNotes, tab, signProd, tovgorSize, tovgorQty, dimW, dimH, extraRele, extraTog, extraCrane1, extraCrane8, printSub, offProduct, offSize, offPages, offQty, offGsm, offColor, offSides, offFinish, offFold, wideType, wideW, wideL, breakdown, margin, rush]);

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

      {/* Tovgor */}
      {signProd === 'tovgor' && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Хэмжээ</label>
            <select style={selectStyle} value={tovgorSize} onChange={e => setTovgorSize(Number(e.target.value))}>
              {TOVGOR_SIZES.map(s => <option key={s} value={s}>{s}см</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={labelStyle}>Тоо ширхэг</label>
            <input type="number" min={1} style={inputStyle} value={tovgorQty} onChange={e => setTovgorQty(Math.max(1, Number(e.target.value)))} />
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
          <DimInputs w={dimW} h={dimH} setW={setDimW} setH={setDimH} inputStyle={inputStyle} labelStyle={labelStyle} />
        </div>
      )}

      {/* 3D */}
      {signProd === 'd3' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={toggleStyle(!d3Lit)} onClick={() => setD3Lit(false)}>Гэрэлгүй</button>
            <button style={toggleStyle(d3Lit)} onClick={() => setD3Lit(true)}>Гэрэлтэй</button>
          </div>
          <DimInputs w={dimW} h={dimH} setW={setDimW} setH={setDimH} inputStyle={inputStyle} labelStyle={labelStyle} />
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
          <DimInputs w={dimW} h={dimH} setW={setDimW} setH={setDimH} inputStyle={inputStyle} labelStyle={labelStyle} />
        </div>
      )}

      {/* PVC / Epoxy / Font / TMR */}
      {['pvc', 'epoxy', 'font', 'tmr'].includes(signProd) && (
        <DimInputs w={dimW} h={dimH} setW={setDimW} setH={setDimH} inputStyle={inputStyle} labelStyle={labelStyle} />
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
          <input type="number" min={1} style={inputStyle} value={offPages} onChange={e => setOffPages(Math.max(1, Number(e.target.value)))} />
        </div>
        <div style={{ flex: 1, minWidth: 100 }}>
          <label style={labelStyle}>Тоо ширхэг</label>
          <input type="number" min={1} style={inputStyle} value={offQty} onChange={e => setOffQty(Math.max(1, Number(e.target.value)))} />
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
      <DimInputs w={wideW} h={wideL} setW={setWideW} setH={setWideL} inputStyle={inputStyle} labelStyle={labelStyle} wLabel="Өргөн (м)" hLabel="Урт (м)" />
    </div>
  );

  /* ═══════════ RENDER ═══════════ */
  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Үнийн тооцоолуур</h1>

        {/* ── TAB BUTTONS ── */}
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
              <div>
                <label style={labelStyle}>Үнийн горим</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={toggleStyle(margin === 'b2b')} onClick={() => setMargin('b2b')}>B2B (×1.20)</button>
                  <button style={toggleStyle(margin === 'retail')} onClick={() => setMargin('retail')}>Retail (×1.45)</button>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: price breakdown ── */}
          <div style={{ flex: '0 0 340px', minWidth: 300, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 24, position: 'sticky', top: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Үнийн задаргаа</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {breakdown.lines.map((line, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--text2)' }}>{line.label}</span>
                  <span style={{ fontWeight: 600, color: line.color || 'var(--text)' }}>
                    {line.amount < 0 ? '-' : line.amount > 0 && line.color ? '+' : ''}{fmt(Math.abs(line.amount))}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px solid var(--border2)', marginTop: 16, paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, fontWeight: 800, color: '#ef4444' }}>
                <span>НИЙТ</span>
                <span>{fmt(breakdown.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
                <span>Нэгж үнэ</span>
                <span>{fmt(breakdown.unitPrice)}/ш</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>НӨАТ ороогүй</div>
            </div>

            <button onClick={() => { setShowModal(true); setSuccessMsg(''); }} style={{
              marginTop: 20, width: '100%', padding: '14px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: '#FF6B00', color: '#fff', fontSize: 16, fontWeight: 700, transition: 'background .2s',
            }}>Үнийн санал авах</button>
          </div>
        </div>
      </div>

      {/* ═══════ MODAL ═══════ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Үнийн санал авах</h3>

            {successMsg ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#22c55e', marginBottom: 12 }}>{successMsg}</div>
                <button onClick={() => setShowModal(false)} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#FF6B00', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Хаах</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                <div>
                  <label style={labelStyle}>Тэмдэглэл</label>
                  <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={mNotes} onChange={e => setMNotes(e.target.value)} />
                </div>

                {/* breakdown summary in modal */}
                <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 14, fontSize: 13 }}>
                  {breakdown.lines.map((l, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'var(--text2)' }}>{l.label}</span>
                      <span style={{ fontWeight: 600, color: l.color || 'var(--text)' }}>{l.amount < 0 ? '-' : ''}{fmt(Math.abs(l.amount))}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#ef4444' }}>
                    <span>НИЙТ</span><span>{fmt(breakdown.total)}</span>
                  </div>
                </div>

                <button type="submit" disabled={submitting} style={{
                  padding: '12px 0', borderRadius: 10, border: 'none', cursor: submitting ? 'wait' : 'pointer',
                  background: submitting ? 'var(--text3)' : '#FF6B00', color: '#fff', fontSize: 15, fontWeight: 700,
                }}>{submitting ? 'Илгээж байна...' : 'Илгээх'}</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── SMALL COMPONENTS ─── */
function DimInputs({ w, h, setW, setH, inputStyle, labelStyle, wLabel, hLabel }: {
  w: number; h: number; setW: (v: number) => void; setH: (v: number) => void;
  inputStyle: React.CSSProperties; labelStyle: React.CSSProperties;
  wLabel?: string; hLabel?: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <label style={labelStyle}>{wLabel || 'Өргөн (м)'}</label>
        <input type="number" min={0.1} step={0.1} style={inputStyle} value={w} onChange={e => setW(Math.max(0.1, Number(e.target.value)))} />
      </div>
      <div style={{ flex: 1 }}>
        <label style={labelStyle}>{hLabel || 'Өндөр (м)'}</label>
        <input type="number" min={0.1} step={0.1} style={inputStyle} value={h} onChange={e => setH(Math.max(0.1, Number(e.target.value)))} />
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
