'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', note: '' });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('cart') || '[]');
    if (stored.length === 0) router.push('/shop');
    setCart(stored);
  }, []);

  useEffect(() => {
    if (!invoiceNo) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:4000/payment/status/' + invoiceNo);
        const data = await res.json();
        if (data?.data?.invoice?.status === 'paid') {
          clearInterval(interval);
          localStorage.removeItem('cart');
          setStep(4);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [invoiceNo]);

  const total = cart.reduce((sum, i) => sum + (i.price || 0), 0);

  const handleOrder = async () => {
    if (!form.name || !form.phone || !form.address) { alert('Бүх талбарыг бөглөнө үү'); return; }
    setPlacing(true);
    try {
      const token = localStorage.getItem('token') || '';
      const userId = localStorage.getItem('userId') || null;
      await fetch('http://localhost:4000/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          customer_id: userId,
          items: cart.map(i => ({ product_id: i.id, quantity: i.quantity, price: i.price })),
          total_amount: total,
          delivery_address: form.address,
          customer_name: form.name,
          customer_phone: form.phone,
          note: form.note,
        }),
      });
      setStep(3);
    } catch { alert('Алдаа гарлаа'); }
    setPlacing(false);
  };

  const handleQRPay = async () => {
    setCheckingPayment(true);
    try {
      const res = await fetch('http://localhost:4000/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, orderId: Date.now().toString() }),
      });
      const data = await res.json();
      if (data?.success && data?.data) {
        setQrData(data.data);
        setInvoiceNo(String(data.data.invoiceNo || ''));
      } else {
        alert('QR үүсгэхэд алдаа гарлаа');
      }
    } catch { alert('Алдаа гарлаа'); }
    setCheckingPayment(false);
  };

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#F1F5F9', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 12, color: '#555', marginBottom: 6, display: 'block' };

  return (
    <div style={{ minHeight: '100vh', background: '#0F0F0F', color: '#F1F5F9', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      <div style={{ background: '#141414', borderBottom: '1px solid #1E1E1E', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--orange)', fontWeight: 700, fontSize: 18 }}>BizPrint</span>
        <span style={{ color: '#333', fontSize: 13 }}>/</span>
        <Link href="/cart" style={{ color: '#888', fontSize: 13, textDecoration: 'none' }}>Сагс</Link>
        <span style={{ color: '#333', fontSize: 13 }}>/</span>
        <span style={{ color: '#F1F5F9', fontSize: 13 }}>Захиалга</span>
      </div>

      {step < 4 && (
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
            {['Мэдээлэл', 'Баталгаажуулах', 'Төлбөр'].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: step > i+1 ? '#16a34a' : step === i+1 ? 'var(--orange)' : '#1E1E1E', color: step >= i+1 ? '#fff' : '#555' }}>
                    {step > i+1 ? '✓' : i+1}
                  </div>
                  <span style={{ fontSize: 13, color: step === i+1 ? '#F1F5F9' : '#555', fontWeight: step === i+1 ? 600 : 400 }}>{s}</span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 1, background: '#1E1E1E', margin: '0 12px' }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 40px' }}>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Хүргэлтийн мэдээлэл</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div><label style={lbl}>Нэр *</label><input style={inp} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Овог нэр" /></div>
                <div><label style={lbl}>Утас *</label><input style={inp} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="99001234" /></div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Хүргэлтийн хаяг *</label>
                <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' } as any} value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Дүүрэг, хороо, байр, тоот..." />
              </div>
              <div><label style={lbl}>Нэмэлт тэмдэглэл</label><input style={inp} value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="Хэвлэлийн онцгой шаардлага..." /></div>
            </div>
            <button onClick={() => { if (!form.name||!form.phone||!form.address) { alert('Бүх талбарыг бөглөнө үү'); return; } setStep(2); }} style={{ background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              Үргэлжлүүлэх
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Захиалга баталгаажуулах</div>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1E1E1E' }}>
                  <div>
                    <div style={{ fontSize: 14 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: '#555' }}>{item.quantity} ширхэг</div>
                  </div>
                  <div style={{ color: 'var(--orange)', fontWeight: 600 }}>₮{Number(item.price||0).toLocaleString()}</div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, marginBottom: 16 }}>
                <span style={{ color: '#888' }}>Нийт</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--orange)' }}>₮{total.toLocaleString()}</span>
              </div>
              <div style={{ background: '#1A1A1A', borderRadius: 8, padding: 14, fontSize: 13, color: '#888' }}>
                <div>{form.name} · {form.phone}</div>
                <div>{form.address}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, background: 'transparent', color: '#888', border: '1px solid #2A2A2A', borderRadius: 8, padding: '13px', fontSize: 14, cursor: 'pointer' }}>Буцах</button>
              <button onClick={handleOrder} disabled={placing} style={{ flex: 2, background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: placing?0.7:1 }}>
                {placing ? 'Илгээж байна...' : 'Захиалга баталгаажуулах'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: 10, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Төлбөр төлөх</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--orange)', marginBottom: 20 }}>₮{total.toLocaleString()}</div>

              {!qrData ? (
                <button onClick={handleQRPay} disabled={checkingPayment} style={{ background: '#1A1A1A', border: '2px solid var(--orange)', borderRadius: 10, padding: '16px 32px', cursor: 'pointer', color: '#F1F5F9', fontSize: 15, fontWeight: 600, width: '100%', opacity: checkingPayment?0.7:1 }}>
                  {checkingPayment ? 'QR үүсгэж байна...' : 'TDB QR Төлбөр'}
                </button>
              ) : (
                <div>
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>Happy Wallet апп-аар уншуулна уу</div>
                  {qrData.qrImage && (
                    <img src={qrData.qrImage} alt="QR Code" style={{ width: 220, height: 220, margin: '0 auto 16px', display: 'block', borderRadius: 12 }} />
                  )}
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>Төлбөр хүлээж байна...</div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--orange)', animation: 'pulse 1s infinite', animationDelay: i*0.2+'s' }} />
                    ))}
                  </div>
                  {invoiceNo && (
                    <div style={{ fontSize: 11, color: '#333', marginTop: 12 }}>Invoice: {invoiceNo}</div>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => setStep(2)} style={{ background: 'transparent', color: '#555', border: '1px solid #2A2A2A', borderRadius: 8, padding: '11px', fontSize: 13, cursor: 'pointer' }}>Буцах</button>
          </div>
        )}

        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ width: 72, height: 72, background: '#14532d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 24px' }}>✓</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', marginBottom: 10 }}>Төлбөр амжилттай!</h2>
            <p style={{ fontSize: 14, color: '#555', marginBottom: 32 }}>Таны захиалга баталгаажлаа. Удахгүй холбогдох болно.</p>
            <Link href="/shop" style={{ background: 'var(--orange)', color: '#fff', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              Дэлгүүр рүү буцах
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}