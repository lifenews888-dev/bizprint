'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NewOrderPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>}>
      <NewOrderPage />
    </Suspense>
  );
}

const SIZES = [
  { label: 'A6 (105×148мм)', w: 105, h: 148 },
  { label: 'A5 (148×210мм)', w: 148, h: 210 },
  { label: 'A4 (210×297мм)', w: 210, h: 297 },
  { label: 'A3 (297×420мм)', w: 297, h: 420 },
  { label: 'A2 (420×594мм)', w: 420, h: 594 },
  { label: 'A1 (594×841мм)', w: 594, h: 841 },
  { label: '90×54мм', w: 90, h: 54 },
  { label: 'DL (99×210мм)', w: 99, h: 210 },
  { label: '1×2м', w: 1000, h: 2000 },
  { label: '1×3м', w: 1000, h: 3000 },
  { label: 'Захиалгат', w: 0, h: 0 },
];

const PAPERS = [
  'Glossy 130gsm', 'Glossy 170gsm', 'Matte 130gsm', 'Matte 170gsm',
  'Art card 250gsm', 'Art card 300gsm', 'Art card 350gsm',
  'Kraft цаас', 'Vinyl (наалт)', 'Синтетик (стенд суурьтай)', 'Canvas',
  'Энгийн цагаан 80gsm', 'Хулдаасан гадна', 'Хулдаасан дотор',
];

const FINISHINGS = [
  { v: 'laminate_matt',  l: 'Матт ламинат' },
  { v: 'laminate_gloss', l: 'Глосс ламинат' },
  { v: 'soft_touch',     l: 'Soft-touch' },
  { v: 'uv_coat',        l: 'УВ лак (бүлэг)' },
  { v: 'uv_spot',        l: 'УВ лак (хэсэг)' },
  { v: 'foil_gold',      l: 'Алт фольг' },
  { v: 'foil_silver',    l: 'Мөнгө фольг' },
  { v: 'emboss',         l: 'Тэмдэглэлт' },
  { v: 'fold',           l: 'Нугалах' },
  { v: 'die_cut',        l: 'Die-cut' },
  { v: 'perforate',      l: 'Цоолох' },
  { v: 'bind_staple',    l: 'Зүүгдэлт' },
  { v: 'bind_perfect',   l: 'Perfect bind' },
];

const QTY = [50, 100, 250, 500, 1000, 2000, 5000];

const CONTACTS = [
  { v: 'chat',  l: 'Доотоод чат',  i: '💬', d: 'Шүүд энэ сайтаар' },
  { v: 'viber', l: 'Viber',        i: '📱', d: 'Viber дугаараар' },
  { v: 'email', l: 'И-мэйл',      i: '📧', d: 'Имэйлээр' },
  { v: 'phone', l: 'Утас',         i: '📞', d: 'Утсаар залгана' },
];

function NewOrderPage() {
  const router = useRouter();
  const params = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [customW, setCustomW] = useState(0);
  const [customH, setCustomH] = useState(0);

  const [spec, setSpec] = useState({
    productId: params.get('productId') || '',
    productName: params.get('name') || '',
    category: params.get('category') || '',
    quantity: +(params.get('qty') || 500),
    sizeLabel: 'A4 (210×297мм)',
    paperType: '',
    colorMode: 'CMYK',
    sides: 'double',
    finishing: [] as string[],
    notes: '',
    hasDesign: false,
    needsDesign: false,
  });

  const [contact, setContact] = useState({
    name: '', phone: '', email: '', company: '',
    viberNumber: '', preferredContact: 'chat',
  });

  const [files, setFiles] = useState<Array<{ file: File; preview?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string; number: string } | null>(null);

  const selSize = SIZES.find(s => s.label === spec.sizeLabel);
  const isCustom = selSize?.w === 0;

  const toggleFin = (v: string) => setSpec(p => ({
    ...p,
    finishing: p.finishing.includes(v) ? p.finishing.filter(f => f !== v) : [...p.finishing, v],
  }));

  const addFiles = (fl: FileList | null) => {
    if (!fl) return;
    const arr = Array.from(fl).slice(0, 5 - files.length).map(f => ({
      file: f,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }));
    setFiles(p => [...p, ...arr]);
  };

  const submit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries({
        product_id: spec.productId, product_name: spec.productName,
        category: spec.category, quantity: spec.quantity,
        size_label: spec.sizeLabel,
        width_mm: isCustom ? customW : (selSize?.w || 0),
        height_mm: isCustom ? customH : (selSize?.h || 0),
        paper_type: spec.paperType, color_mode: spec.colorMode,
        sides: spec.sides, finishing: JSON.stringify(spec.finishing),
        notes: spec.notes,
        has_design: spec.hasDesign, needs_design: spec.needsDesign,
      }).forEach(([k, v]) => fd.append(k, String(v)));
      Object.entries({
        customer_name: contact.name, customer_phone: contact.phone,
        customer_email: contact.email, customer_company: contact.company,
        viber_number: contact.viberNumber,
        preferred_contact: contact.preferredContact,
      }).forEach(([k, v]) => fd.append(k, v));
      files.forEach(f => fd.append('files', f.file));

      const token = localStorage.getItem('access_token') || '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inquiries`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();
      if (data.id) setResult({ id: data.id, number: data.inquiry_number });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (result) return (
    <div className="max-w-md mx-auto py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Амжилттай илгээгдлээ!</h2>
      <p className="text-sm text-gray-500 mb-2">Захиалгын дугаар</p>
      <p className="text-2xl font-mono font-bold text-orange-500 mb-6">{result.number}</p>
      <p className="text-xs text-gray-400 mb-8">
        Бид 30 минутын дотор тантай{' '}
        {contact.preferredContact === 'viber' ? 'Viber-ээр' :
         contact.preferredContact === 'email' ? 'имэйлээр' : 'чатаар'} холбогдоно.
      </p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => router.push(`/inquiries/${result.id}`)}
          className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium">
          Захиалга + чат харах
        </button>
        <button onClick={() => router.push('/')}
          className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400">
          Нүүр хуудас
        </button>
      </div>
    </div>
  );

  const step1Valid = spec.quantity > 0 && spec.sizeLabel;
  const step3Valid = contact.name && contact.phone;

  const stepBar = ['Тодорхойлолт', 'Файл', 'Холбоо барих', 'Батлах'];

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-1">
        {spec.productName || 'Захиалгын хүсэлт'}
      </h1>
      <p className="text-sm text-gray-500 mb-6">Бүтээлийг бөглөж илгээнэ үү</p>

      {/* Step indicator */}
      <div className="flex items-center mb-8 gap-1">
        {stepBar.map((s, i) => (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
              step > i+1 ? 'bg-green-500 text-white' : step === i+1 ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}>{step > i+1 ? '✓' : i+1}</div>
            <span className={`text-xs hidden sm:block truncate ${step === i+1 ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-400'}`}>{s}</span>
            {i < 3 && <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 mx-1" />}
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Тираж <span className="text-red-500">*</span></p>
            <div className="flex flex-wrap gap-2">
              {QTY.map(q => (
                <button key={q} onClick={() => setSpec(p => ({ ...p, quantity: q }))}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${spec.quantity === q ? 'bg-orange-500 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                  {q.toLocaleString()}
                </button>
              ))}
              <input type="number" placeholder="Бусад" onChange={e => e.target.value && setSpec(p => ({ ...p, quantity: +e.target.value }))}
                className="w-24 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent" />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Хэмжээ</p>
            <div className="flex flex-wrap gap-1.5">
              {SIZES.map(s => (
                <button key={s.label} onClick={() => setSpec(p => ({ ...p, sizeLabel: s.label }))}
                  className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${spec.sizeLabel === s.label ? 'bg-orange-500 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                  {s.label}
                </button>
              ))}
            </div>
            {isCustom && (
              <div className="flex gap-3 mt-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Өргөн (мм)</p>
                  <input type="number" value={customW} onChange={e => setCustomW(+e.target.value)}
                    className="w-24 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Өндөр (мм)</p>
                  <input type="number" value={customH} onChange={e => setCustomH(+e.target.value)}
                    className="w-24 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent" />
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Цаасны төрөл</p>
            <select value={spec.paperType} onChange={e => setSpec(p => ({ ...p, paperType: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-transparent">
              <option value="">Сонгоно уу</option>
              {PAPERS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Өнгийн горим</p>
            <div className="flex gap-2">
              {[['CMYK','4 өнгө (CMYK)'],['1C','1 өнгө'],['BW','Хар цагаан']].map(([v,l]) => (
                <button key={v} onClick={() => setSpec(p => ({ ...p, colorMode: v }))}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-colors ${spec.colorMode === v ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Хэвлэх тал</p>
            <div className="flex gap-2">
              {[['single','Нэг тал'],['double','Хоёр тал']].map(([v,l]) => (
                <button key={v} onClick={() => setSpec(p => ({ ...p, sides: v }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm border transition-colors ${spec.sides === v ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Боловсруулалт <span className="text-xs font-normal text-gray-400">(заавал биш)</span></p>
            <div className="flex flex-wrap gap-1.5">
              {FINISHINGS.map(f => (
                <button key={f.v} onClick={() => toggleFin(f.v)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${spec.finishing.includes(f.v) ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Эх бэлгүүл</p>
            <div className="flex gap-2">
              <button onClick={() => setSpec(p => ({ ...p, hasDesign: true, needsDesign: false }))}
                className={`flex-1 py-2.5 rounded-xl text-xs border transition-colors ${spec.hasDesign ? 'border-green-500 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                Бэлэн байна
              </button>
              <button onClick={() => setSpec(p => ({ ...p, hasDesign: false, needsDesign: true }))}
                className={`flex-1 py-2.5 rounded-xl text-xs border transition-colors ${spec.needsDesign ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                Дизайн шийлгүүл
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Нэмэлт тайлбар</p>
            <textarea value={spec.notes} onChange={e => setSpec(p => ({ ...p, notes: e.target.value }))}
              rows={3} placeholder="Тусгай шаардлага, лого өнгө, хэвлэлийн тэмдэглэл..."
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-transparent resize-none focus:outline-none focus:border-orange-400" />
          </div>

          <button onClick={() => setStep(2)} disabled={!step1Valid}
            className="w-full py-3 bg-orange-500 text-white font-medium rounded-xl disabled:opacity-50">
            Дараах →
          </button>
        </div>
      )}

      {/* STEP 2: File */}
      {step === 2 && (
        <div className="space-y-5">
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-10 text-center cursor-pointer hover:border-orange-400 transition-colors"
          >
            <div className="text-4xl mb-3">📁</div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Файл чирж тавих эсвэл дарж сонгох</p>
            <p className="text-xs text-gray-400 mt-1">PDF · AI · PSD · JPG · PNG · EPS — 50MB хүртэл</p>
            <input ref={fileRef} type="file" multiple accept=".pdf,.ai,.psd,.jpg,.jpeg,.png,.webp,.eps,.zip"
              className="hidden" onChange={e => addFiles(e.target.files)} />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  {f.preview
                    ? <img src={f.preview} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-xs font-bold text-red-600">PDF</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-gray-700 dark:text-gray-300">{f.file.name}</p>
                    <p className="text-xs text-gray-400">{(f.file.size/1024/1024).toFixed(1)} MB</p>
                  </div>
                  <button onClick={() => setFiles(p => p.filter((_,j) => j !== i))} className="text-gray-400 hover:text-red-500">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Имэйлээр файл илгээх</p>
            <p className="text-xs text-blue-600 dark:text-blue-500">
              Файл том бол <strong>design@bizprint.mn</strong> руу илгээнэ үү.
              Subject-д захиалгын дугаараа бичнэ үү.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400">← Буцах</button>
            <button onClick={() => setStep(3)} className="flex-1 py-3 bg-orange-500 text-white font-medium rounded-xl">Дараах →</button>
          </div>
        </div>
      )}

      {/* STEP 3: Contact */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Хаяш хүсэхэн авах вэ?</p>
            <div className="grid grid-cols-2 gap-2">
              {CONTACTS.map(c => (
                <button key={c.v} onClick={() => setContact(p => ({ ...p, preferredContact: c.v }))}
                  className={`p-3 rounded-xl text-left border transition-colors ${contact.preferredContact === c.v ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className="text-xl mb-1">{c.i}</div>
                  <div className={`text-xs font-medium ${contact.preferredContact === c.v ? 'text-orange-700 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'}`}>{c.l}</div>
                  <div className="text-xs text-gray-400">{c.d}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {[
              { k: 'name',    l: 'Нэр', ph: 'Таны нэр', req: true },
              { k: 'phone',   l: 'Утас', ph: '99xxxxxx', req: true },
              { k: 'email',   l: 'И-мэйл', ph: 'email@example.com', req: false },
              { k: 'company', l: 'Байгууллага', ph: 'Компанийн нэр', req: false },
            ].map(f => (
              <div key={f.k}>
                <p className="text-xs text-gray-500 mb-1">{f.l} {f.req && <span className="text-red-500">*</span>}</p>
                <input value={(contact as any)[f.k]} onChange={e => setContact(p => ({ ...p, [f.k]: e.target.value }))}
                  placeholder={f.ph}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:border-orange-400" />
              </div>
            ))}
            {contact.preferredContact === 'viber' && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Viber дугаар</p>
                <input value={contact.viberNumber} onChange={e => setContact(p => ({ ...p, viberNumber: e.target.value }))}
                  placeholder="Viber дугаар"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-transparent focus:outline-none focus:border-orange-400" />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400">← Буцах</button>
            <button onClick={() => setStep(4)} disabled={!step3Valid}
              className="flex-1 py-3 bg-orange-500 text-white font-medium rounded-xl disabled:opacity-50">Дараах →</button>
          </div>
        </div>
      )}

      {/* STEP 4: Confirm */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-2xl divide-y divide-gray-100 dark:divide-gray-800">
            {[
              ['Бүтээгдэхүүн', spec.productName || spec.category || '—'],
              ['Тираж', spec.quantity.toLocaleString() + ' ш'],
              ['Хэмжээ', spec.sizeLabel + (isCustom ? ` (${customW}×${customH}мм)` : '')],
              ['Цаас', spec.paperType || '—'],
              ['Өнгө', spec.colorMode === 'CMYK' ? '4 өнгө (CMYK)' : spec.colorMode === 'BW' ? 'Хар цагаан' : '1 өнгө'],
              ['Тал', spec.sides === 'double' ? 'Хоёр тал' : 'Нэг тал'],
              ['Боловсруулалт', spec.finishing.length > 0 ? spec.finishing.map(v => FINISHINGS.find(f => f.v === v)?.l || v).join(', ') : '—'],
              ['Эх бэлгүүл', spec.hasDesign ? 'Бэлэн байна' : spec.needsDesign ? 'Дизайн шийлгүүл' : '—'],
              ['Файл', files.length + ' файл'],
              ['Нэр', contact.name],
              ['Утас', contact.phone],
              ['Холбоо барих', CONTACTS.find(c => c.v === contact.preferredContact)?.l || ''],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center px-4 py-3 text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="text-gray-900 dark:text-gray-100 text-right max-w-[60%] truncate">{v}</span>
              </div>
            ))}
          </div>

          {spec.notes && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">Тэмдэглэл</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{spec.notes}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400">← Буцах</button>
            <button onClick={submit} disabled={loading}
              className="flex-1 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-medium rounded-xl disabled:opacity-50">
              {loading ? 'Илгээж байна...' : 'Захиалга илгээх →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
