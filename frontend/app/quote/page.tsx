'use client';

import { useState, useMemo, FormEvent } from 'react';

/* ───────── price tables ───────── */

const TOVGOR_PRICES: Record<number, number> = {
  20: 35000, 30: 45000, 40: 60000, 50: 75000, 60: 95000,
  70: 140000, 80: 180000, 90: 235000, 100: 290000, 110: 330000, 120: 360000,
};
const TOVGOR_M2_RATE = 280000;

const NERJ_OPTIONS: Record<string, number> = { 'Асдаггүй': 850000, 'Асдаг LED': 1300000 };
const THREE_D_OPTIONS: Record<string, number> = { 'Гэрэлгүй': 850000, 'Гэрэлтэй LED': 1250000 };
const GERELT_OPTIONS: Record<string, number> = {
  'Дотор 4см': 280000, 'Дотор 6см': 320000, 'Дотор 8см': 350000,
  'Гадна булантай': 380000, 'Гадна сөхдөг': 450000,
};

const KRAN_OPTIONS: Record<string, number> = { '1цаг': 200000, '8цаг': 600000 };

const PAPER_COSTS: Record<number, number> = { 80: 60, 120: 90, 150: 120, 200: 160, 300: 220 };
const FINISHING_COSTS: Record<string, number> = { 'мат': 15, 'гянт': 12, 'UV': 20, 'soft_touch': 25 };
const ORGON_TYPES: Record<string, number> = { 'баннер': 8000, 'стикер': 12000, 'туг': 18000, 'даавуу': 22000 };
const PROMO_TYPES: Record<string, number> = { 'үзэг': 2500, 'дэвтэр': 8000, 'аяга': 12000, 'футболк': 18000 };
const SHAGNAL_TYPES: Record<string, number> = { 'болор': 45000, 'модон': 35000, 'медаль': 12000, 'тэмдэг': 8000 };

const RUSH_OPTIONS = [
  { label: 'Энгийн', pct: 0 },
  { label: '48цаг', pct: 0.15 },
  { label: '24цаг', pct: 0.30 },
] as const;

const PRICING_MODES = [
  { label: 'B2B', mult: 1.20 },
  { label: 'Retail', mult: 1.45 },
] as const;

const SIGNAGE_SUBTYPES = [
  'Товгор үсэг', 'Нерж үсэг', '3D үсэг', 'Гэрэлт самбар', 'PVC үсэг', 'Хөнгөн цагаан/Эпокси',
] as const;

const PRINT_SUBTYPES = ['Офсет хэвлэл', 'Өргөн хэвлэл', 'Промошн', 'Шагнал'] as const;

/* ───────── helpers ───────── */

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US') + '₮';
}

function qtyDiscount(qty: number): number {
  if (qty >= 5000) return 0.20;
  if (qty >= 1000) return 0.15;
  if (qty >= 500) return 0.10;
  if (qty >= 100) return 0.05;
  return 0;
}

function qtyDiscountLabel(qty: number): string | null {
  const d = qtyDiscount(qty);
  return d > 0 ? `-${d * 100}%` : null;
}

/* ───────── component ───────── */

export default function QuotePage() {
  /* tabs */
  const [tab, setTab] = useState<'signage' | 'print'>('signage');

  /* signage state */
  const [sigSub, setSigSub] = useState<string>(SIGNAGE_SUBTYPES[0]);
  const [letterCount, setLetterCount] = useState(1);
  const [letterSize, setLetterSize] = useState(20);
  const [m2, setM2] = useState(1);
  const [nerjOpt, setNerjOpt] = useState(Object.keys(NERJ_OPTIONS)[0]);
  const [threeDOpt, setThreeDOpt] = useState(Object.keys(THREE_D_OPTIONS)[0]);
  const [gereltOpt, setGereltOpt] = useState(Object.keys(GERELT_OPTIONS)[0]);

  /* signage extras */
  const [exRam, setExRam] = useState(false);
  const [ramMeters, setRamMeters] = useState(1);
  const [exRelay, setExRelay] = useState(false);
  const [exPower, setExPower] = useState(false);
  const [exKran, setExKran] = useState(false);
  const [kranOpt, setKranOpt] = useState(Object.keys(KRAN_OPTIONS)[0]);

  /* print state */
  const [prtSub, setPrtSub] = useState<string>(PRINT_SUBTYPES[0]);
  const [qty, setQty] = useState(100);
  const [gsm, setGsm] = useState(80);
  const [finishing, setFinishing] = useState('мат');
  const [isColor, setIsColor] = useState(true);
  const [orgonType, setOrgonType] = useState(Object.keys(ORGON_TYPES)[0]);
  const [promoType, setPromoType] = useState(Object.keys(PROMO_TYPES)[0]);
  const [shagnalType, setShagnalType] = useState(Object.keys(SHAGNAL_TYPES)[0]);
  const [prtM2, setPrtM2] = useState(1);

  /* common */
  const [rushIdx, setRushIdx] = useState(0);
  const [modeIdx, setModeIdx] = useState(0);

  /* form */
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ quote_number: string } | null>(null);

  /* ── signage calc ── */
  const sigBase = useMemo(() => {
    switch (sigSub) {
      case 'Товгор үсэг': {
        let perLetter: number;
        if (letterSize <= 120 && TOVGOR_PRICES[letterSize]) {
          perLetter = TOVGOR_PRICES[letterSize];
        } else {
          const areaCm2 = letterSize * letterSize;
          perLetter = (areaCm2 / 10000) * TOVGOR_M2_RATE;
        }
        return perLetter * letterCount;
      }
      case 'Нерж үсэг': return (NERJ_OPTIONS[nerjOpt] ?? 850000) * m2;
      case '3D үсэг': return (THREE_D_OPTIONS[threeDOpt] ?? 850000) * m2;
      case 'Гэрэлт самбар': return (GERELT_OPTIONS[gereltOpt] ?? 280000) * m2;
      case 'PVC үсэг': return 280000 * m2;
      case 'Хөнгөн цагаан/Эпокси': return 650000 * m2;
      default: return 0;
    }
  }, [sigSub, letterCount, letterSize, m2, nerjOpt, threeDOpt, gereltOpt]);

  const sigExtras = useMemo(() => {
    let t = 0;
    if (exRam) t += ramMeters * 6500;
    if (exRelay) t += 30000;
    if (exPower) t += 35000;
    if (exKran) t += KRAN_OPTIONS[kranOpt] ?? 0;
    return t;
  }, [exRam, ramMeters, exRelay, exPower, exKran, kranOpt]);

  /* ── print calc ── */
  const prtCalc = useMemo(() => {
    let base = 0;
    let disc = 0;
    switch (prtSub) {
      case 'Офсет хэвлэл': {
        const paperCost = (PAPER_COSTS[gsm] ?? 60) * qty;
        const finCost = (FINISHING_COSTS[finishing] ?? 0) * qty;
        const setup = isColor ? 30000 : 15000;
        base = paperCost + finCost + setup;
        disc = qtyDiscount(qty);
        break;
      }
      case 'Өргөн хэвлэл': base = (ORGON_TYPES[orgonType] ?? 8000) * prtM2; break;
      case 'Промошн': { base = (PROMO_TYPES[promoType] ?? 2500) * qty; disc = qtyDiscount(qty); break; }
      case 'Шагнал': { base = (SHAGNAL_TYPES[shagnalType] ?? 45000) * qty; disc = qtyDiscount(qty); break; }
    }
    return { base, disc };
  }, [prtSub, qty, gsm, finishing, isColor, orgonType, prtM2, promoType, shagnalType]);

  /* ── final totals ── */
  const breakdown = useMemo(() => {
    const rush = RUSH_OPTIONS[rushIdx];
    const mode = PRICING_MODES[modeIdx];

    if (tab === 'signage') {
      const sub = sigBase;
      const extras = sigExtras;
      const beforeRush = sub + extras;
      const rushFee = beforeRush * rush.pct;
      const afterRush = beforeRush + rushFee;
      const total = afterRush * mode.mult;
      return { base: sub, extras, rushFee, discount: 0, discPct: 0, margin: total - afterRush, total };
    } else {
      const sub = prtCalc.base;
      const discAmt = sub * prtCalc.disc;
      const afterDisc = sub - discAmt;
      const rushFee = afterDisc * rush.pct;
      const afterRush = afterDisc + rushFee;
      const total = afterRush * mode.mult;
      return { base: sub, extras: 0, rushFee, discount: discAmt, discPct: prtCalc.disc, margin: total - afterRush, total };
    }
  }, [tab, sigBase, sigExtras, prtCalc, rushIdx, modeIdx]);

  /* ── submit ── */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formName || !formEmail) return;
    setSubmitting(true);
    try {
      const selectedSubtype = tab === 'signage' ? sigSub : prtSub;
      const dims: Record<string, any> = tab === 'signage'
        ? (sigSub === 'Товгор үсэг'
          ? { letter_count: letterCount, letter_size_cm: letterSize }
          : { m2 })
        : (prtSub === 'Офсет хэвлэл'
          ? { qty, gsm, finishing, is_color: isColor }
          : prtSub === 'Өргөн хэвлэл'
            ? { m2: prtM2, orgon_type: orgonType }
            : { qty });

      const extras = tab === 'signage' ? {
        rele: exRelay,
        tog: exPower,
        ...(exKran ? { crane: kranOpt } : {}),
      } : undefined;

      const body = {
        customer_name: formName,
        customer_email: formEmail,
        customer_phone: formPhone,
        company_name: formCompany || undefined,
        product_type: tab === 'signage' ? 'hadag' : 'khevlel',
        product_subtype: selectedSubtype,
        base_price: breakdown.base,
        total_price: breakdown.total,
        unit_price: breakdown.total,
        discount_amount: breakdown.discount,
        rush_fee: breakdown.rushFee,
        rush_type: RUSH_OPTIONS[rushIdx].label,
        pricing_mode: PRICING_MODES[modeIdx].label,
        notes: formNotes,
        breakdown,
        extras,
        dimensions: dims,
      };
      const res = await fetch('http://localhost:4000/quotes-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setSubmitResult({ quote_number: data.quote_number || '' });
      setSubmitted(true);
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  }

  /* ── styles ── */
  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 12, padding: 24, marginBottom: 20,
  };
  const label: React.CSSProperties = { display: 'block', color: 'var(--text2)', fontSize: 13, marginBottom: 6, fontWeight: 500 };
  const input: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--bg)', color: 'var(--text)', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box',
  };
  const select: React.CSSProperties = { ...input, appearance: 'auto' as const };
  const btnPrimary: React.CSSProperties = {
    background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 8,
    padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  };
  const pillGroup: React.CSSProperties = { display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' };
  const pill = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    background: active ? '#FF6B35' : 'var(--surface)', color: active ? '#fff' : 'var(--text)',
    border: 'none', fontFamily: 'inherit', transition: 'background .15s',
  });
  const checkbox: React.CSSProperties = { accentColor: '#FF6B35', marginRight: 8 };
  const badgeStyle: React.CSSProperties = {
    display: 'inline-block', background: '#FF6B35', color: '#fff', fontSize: 12,
    fontWeight: 600, borderRadius: 6, padding: '2px 8px', marginLeft: 8,
  };
  const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 15 };

  /* ── signage inputs ── */
  function renderSignageInputs() {
    switch (sigSub) {
      case 'Товгор үсэг':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <span style={label}>Үсэгний тоо</span>
              <input type="number" min={1} value={letterCount}
                onChange={e => setLetterCount(Math.max(1, +e.target.value))} style={input} />
            </div>
            <div>
              <span style={label}>Хэмжээ (см)</span>
              <select value={letterSize} onChange={e => setLetterSize(+e.target.value)} style={select}>
                {Object.keys(TOVGOR_PRICES).map(s => <option key={s} value={s}>{s}см</option>)}
                <option value={150}>150см (m²)</option>
                <option value={200}>200см (m²)</option>
              </select>
            </div>
          </div>
        );
      case 'Нерж үсэг':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <span style={label}>Талбай (m²)</span>
              <input type="number" min={0.1} step={0.1} value={m2}
                onChange={e => setM2(Math.max(0.1, +e.target.value))} style={input} />
            </div>
            <div>
              <span style={label}>Төрөл</span>
              <select value={nerjOpt} onChange={e => setNerjOpt(e.target.value)} style={select}>
                {Object.keys(NERJ_OPTIONS).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
        );
      case '3D үсэг':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <span style={label}>Талбай (m²)</span>
              <input type="number" min={0.1} step={0.1} value={m2}
                onChange={e => setM2(Math.max(0.1, +e.target.value))} style={input} />
            </div>
            <div>
              <span style={label}>Төрөл</span>
              <select value={threeDOpt} onChange={e => setThreeDOpt(e.target.value)} style={select}>
                {Object.keys(THREE_D_OPTIONS).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
        );
      case 'Гэрэлт самбар':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <span style={label}>Талбай (m²)</span>
              <input type="number" min={0.1} step={0.1} value={m2}
                onChange={e => setM2(Math.max(0.1, +e.target.value))} style={input} />
            </div>
            <div>
              <span style={label}>Төрөл</span>
              <select value={gereltOpt} onChange={e => setGereltOpt(e.target.value)} style={select}>
                {Object.keys(GERELT_OPTIONS).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
        );
      case 'PVC үсэг':
      case 'Хөнгөн цагаан/Эпокси':
        return (
          <div>
            <span style={label}>Талбай (m²)</span>
            <input type="number" min={0.1} step={0.1} value={m2}
              onChange={e => setM2(Math.max(0.1, +e.target.value))} style={input} />
          </div>
        );
      default: return null;
    }
  }

  /* ── print inputs ── */
  function renderPrintInputs() {
    switch (prtSub) {
      case 'Офсет хэвлэл':
        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <span style={label}>Тоо ширхэг</span>
                <input type="number" min={1} value={qty}
                  onChange={e => setQty(Math.max(1, +e.target.value))} style={input} />
              </div>
              <div>
                <span style={label}>Цаас (gsm)</span>
                <select value={gsm} onChange={e => setGsm(+e.target.value)} style={select}>
                  {Object.keys(PAPER_COSTS).map(g => <option key={g} value={g}>{g}gsm</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
              <div>
                <span style={label}>Финиш</span>
                <select value={finishing} onChange={e => setFinishing(e.target.value)} style={select}>
                  {Object.keys(FINISHING_COSTS).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <span style={label}>Өнгө</span>
                <div style={pillGroup}>
                  <button style={pill(isColor)} onClick={() => setIsColor(true)}>Өнгөт</button>
                  <button style={pill(!isColor)} onClick={() => setIsColor(false)}>Хар/цагаан</button>
                </div>
              </div>
            </div>
          </>
        );
      case 'Өргөн хэвлэл':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <span style={label}>Талбай (m²)</span>
              <input type="number" min={0.1} step={0.1} value={prtM2}
                onChange={e => setPrtM2(Math.max(0.1, +e.target.value))} style={input} />
            </div>
            <div>
              <span style={label}>Төрөл</span>
              <select value={orgonType} onChange={e => setOrgonType(e.target.value)} style={select}>
                {Object.keys(ORGON_TYPES).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
        );
      case 'Промошн':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <span style={label}>Тоо ширхэг</span>
              <input type="number" min={1} value={qty}
                onChange={e => setQty(Math.max(1, +e.target.value))} style={input} />
            </div>
            <div>
              <span style={label}>Төрөл</span>
              <select value={promoType} onChange={e => setPromoType(e.target.value)} style={select}>
                {Object.keys(PROMO_TYPES).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
        );
      case 'Шагнал':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <span style={label}>Тоо ширхэг</span>
              <input type="number" min={1} value={qty}
                onChange={e => setQty(Math.max(1, +e.target.value))} style={input} />
            </div>
            <div>
              <span style={label}>Төрөл</span>
              <select value={shagnalType} onChange={e => setShagnalType(e.target.value)} style={select}>
                {Object.keys(SHAGNAL_TYPES).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
        );
      default: return null;
    }
  }

  /* ── render ── */
  if (submitted) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 48px', textAlign: 'center' }}>
        <div style={{ ...card, padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
          <h2 style={{ color: 'var(--text)', marginBottom: 8 }}>Амжилттай!</h2>
          <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.6 }}>
            {submitResult?.quote_number
              ? `#${submitResult.quote_number} дугаартай үнийн санал ${formEmail} хаягруу илгээгдлээ.`
              : 'Таны үнийн санал хүлээн авлаа. Бид тантай удахгүй холбогдоно.'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <button style={btnPrimary} onClick={() => { setSubmitted(false); setShowForm(false); setSubmitResult(null); }}>
              Шинэ тооцоо
            </button>
            <a href="/dashboard" style={{ ...btnPrimary, background: '#1C1917', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Дашбоард харах &rarr;
            </a>
          </div>
        </div>
      </div>
    );
  }

  const discLabel = tab === 'print' ? qtyDiscountLabel(qty) : null;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 48px', color: 'var(--text)' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Үнийн тооцоолуур</h1>
      <p style={{ color: 'var(--text2)', marginBottom: 28, fontSize: 15 }}>Захиалгын үнийг шууд тооцоолно уу</p>

      {/* ── main tabs ── */}
      <div style={{ ...pillGroup, marginBottom: 28 }}>
        <button style={pill(tab === 'signage')} onClick={() => setTab('signage')}>Хаяг реклам</button>
        <button style={pill(tab === 'print')} onClick={() => setTab('print')}>Хэвлэл</button>
      </div>

      {/* ── subtype ── */}
      <div style={card}>
        <span style={label}>Төрөл сонгох</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(tab === 'signage' ? SIGNAGE_SUBTYPES : PRINT_SUBTYPES).map(s => (
            <button key={s}
              onClick={() => tab === 'signage' ? setSigSub(s) : setPrtSub(s)}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'inherit', border: '1px solid var(--border)',
                background: (tab === 'signage' ? sigSub : prtSub) === s ? '#FF6B35' : 'var(--bg)',
                color: (tab === 'signage' ? sigSub : prtSub) === s ? '#fff' : 'var(--text)',
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── inputs ── */}
      <div style={card}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          {tab === 'signage' ? sigSub : prtSub}
          {discLabel && <span style={badgeStyle}>{discLabel}</span>}
        </h3>
        {tab === 'signage' ? renderSignageInputs() : renderPrintInputs()}
      </div>

      {/* ── signage extras ── */}
      {tab === 'signage' && (
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Нэмэлт</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
              <input type="checkbox" checked={exRam} onChange={e => setExRam(e.target.checked)} style={checkbox} />
              Төмөр рам
              {exRam && (
                <span style={{ marginLeft: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="number" min={1} value={ramMeters}
                    onChange={e => setRamMeters(Math.max(1, +e.target.value))}
                    style={{ ...input, width: 80, padding: '6px 10px' }} />
                  <span style={{ color: 'var(--text2)', fontSize: 13 }}>м x 6,500₮</span>
                </span>
              )}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
              <input type="checkbox" checked={exRelay} onChange={e => setExRelay(e.target.checked)} style={checkbox} />
              Цагийн реле — 30,000₮
            </label>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
              <input type="checkbox" checked={exPower} onChange={e => setExPower(e.target.checked)} style={checkbox} />
              Тог бууруулагч — 35,000₮
            </label>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
              <input type="checkbox" checked={exKran} onChange={e => setExKran(e.target.checked)} style={checkbox} />
              Кран
              {exKran && (
                <select value={kranOpt} onChange={e => setKranOpt(e.target.value)}
                  style={{ ...select, width: 140, marginLeft: 12, padding: '6px 10px' }}>
                  {Object.entries(KRAN_OPTIONS).map(([k, v]) => (
                    <option key={k} value={k}>{k} — {fmt(v)}</option>
                  ))}
                </select>
              )}
            </label>
          </div>
        </div>
      )}

      {/* ── rush + pricing ── */}
      <div style={card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <span style={label}>Хугацаа</span>
            <div style={pillGroup}>
              {RUSH_OPTIONS.map((r, i) => (
                <button key={r.label} style={pill(rushIdx === i)} onClick={() => setRushIdx(i)}>
                  {r.label}{r.pct > 0 && ` (+${r.pct * 100}%)`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span style={label}>Үнийн горим</span>
            <div style={pillGroup}>
              {PRICING_MODES.map((m, i) => (
                <button key={m.label} style={pill(modeIdx === i)} onClick={() => setModeIdx(i)}>
                  {m.label} (x{m.mult.toFixed(2)})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── result ── */}
      <div style={{ ...card, background: 'var(--bg)', border: '2px solid #FF6B35' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Тооцоо</h3>
        <div style={row}><span style={{ color: 'var(--text2)' }}>Суурь үнэ</span><span>{fmt(breakdown.base)}</span></div>
        {breakdown.extras > 0 && (
          <div style={row}><span style={{ color: 'var(--text2)' }}>Нэмэлт</span><span>{fmt(breakdown.extras)}</span></div>
        )}
        {breakdown.discount > 0 && (
          <div style={row}><span style={{ color: 'var(--text2)' }}>Хөнгөлөлт ({(breakdown.discPct * 100).toFixed(0)}%)</span><span style={{ color: '#22c55e' }}>-{fmt(breakdown.discount)}</span></div>
        )}
        {breakdown.rushFee > 0 && (
          <div style={row}><span style={{ color: 'var(--text2)' }}>Яаралтай нэмэгдэл</span><span>{fmt(breakdown.rushFee)}</span></div>
        )}
        <div style={row}><span style={{ color: 'var(--text2)' }}>Маржин ({PRICING_MODES[modeIdx].label})</span><span>{fmt(breakdown.margin)}</span></div>
        <div style={{ ...row, borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 12, fontSize: 20, fontWeight: 700 }}>
          <span>Нийт</span><span style={{ color: '#FF6B35' }}>{fmt(breakdown.total)}</span>
        </div>
      </div>

      {/* ── CTA ── */}
      {!showForm && (
        <button style={{ ...btnPrimary, width: '100%' }} onClick={() => setShowForm(true)}>
          Үнийн санал авах
        </button>
      )}

      {/* ── inline form ── */}
      {showForm && (
        <form onSubmit={handleSubmit} style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Холбоо барих</h3>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <span style={label}>Нэр *</span>
              <input value={formName} onChange={e => setFormName(e.target.value)} required style={input} />
            </div>
            <div>
              <span style={label}>Имэйл *</span>
              <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} required style={input} />
            </div>
            <div>
              <span style={label}>Утас</span>
              <input value={formPhone} onChange={e => setFormPhone(e.target.value)} style={input} />
            </div>
            <div>
              <span style={label}>Компанийн нэр</span>
              <input value={formCompany} onChange={e => setFormCompany(e.target.value)} placeholder="Заавал биш" style={input} />
            </div>
            <div>
              <span style={label}>Тэмдэглэл</span>
              <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={3}
                style={{ ...input, resize: 'vertical' }} />
            </div>
            <button type="submit" disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Илгээж байна...' : 'Илгээх'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
