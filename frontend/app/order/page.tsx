'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  name_mn: string
  category: string
  base_price: number
  min_quantity: number
}

export default function OrderPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(100)
  const [finish, setFinish] = useState('')
  const [side, setSide] = useState('')
  const [delivery, setDelivery] = useState(false)
  const [notes, setNotes] = useState('')
  const [quote, setQuote] = useState<any>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [paymentResult, setPaymentResult] = useState<any>(null)

  // $09; upload
  const [file, setFile] = useState<File | null>(null)
  const [uploadedFile, setUploadedFile] = useState<any>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetch('http://localhost:4000/products').then(r => r.json()).then(setProducts)
    const params = new URLSearchParams(window.location.search)
    const pid = params.get('product_id')
    if (pid) setProductId(pid)
  }, [])

  const uploadFile = async (f: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', f)
    const res = await fetch('http://localhost:4000/upload/file', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    setUploadedFile(data)
    setUploading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      uploadFile(f)
    }
  }

  const getQuote = async () => {
    if (!productId) return
    setLoading(true)
    const res = await fetch('http://localhost:4000/pricing/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId, quantity,
        options: { ...(finish && { finish }), ...(side && { side }) },
        delivery,
      }),
    })
    const data = await res.json()
    setQuote(data)
    setStep(2)
    setLoading(false)
  }

  const placeOrder = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const orderRes = await fetch('http://localhost:4000/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        customer_id: user.id,
        product_id: productId,
        quantity,
        total_price: quote.total,
        options: { ...(finish && { finish }), ...(side && { side }) },
        notes,
        design_file_url: uploadedFile?.file_url || null,
      }),
    })
    const order = await orderRes.json()

    const payRes = await fetch('http://localhost:4000/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: order.id,
        customer_id: user.id,
        amount: quote.total,
      }),
    })
    const payment = await payRes.json()
    setPaymentResult({ order, payment })
    setStep(3)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <a href="/" className="text-2xl font-bold text-orange-500">BizPrint</a>
        <a href="/dashboard" className="text-gray-400 hover:text-white text-sm"> Dashboard</a>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">

        {/* Steps */}
        <div className="flex items-center gap-2 mb-10">
          {['BMM34ME=', '=M 10B;0E', '";1@'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${step > i + 1 ? 'bg-green-500' : step === i + 1 ? 'bg-orange-500' : 'bg-gray-700'}`}>
                {step > i + 1 ? '' : i + 1}
              </div>
              <span className={`text-sm ${step === i + 1 ? 'text-white' : 'text-gray-500'}`}>{s}</span>
              {i < 2 && <div className="w-8 h-px bg-gray-700" />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <h1 className="text-2xl font-bold">0E80;3K= <M4MM;M;</h1>

            <div>
              <label className="block text-sm text-gray-400 mb-2">BMM34ME=</label>
              <select value={productId} onChange={e => setProductId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white">
                <option value="">!>=3>=> CC...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name_mn}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                ">> H8@EM3: <span className="text-orange-400 font-semibold">{quantity}</span>
              </label>
              <input type="range" min={10} max={5000} step={10}
                value={quantity} onChange={e => setQuantity(Number(e.target.value))}
                className="w-full accent-orange-500" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10</span><span>500</span><span>1000</span><span>5000</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">00H 1>;>2A@CC;0;B</label>
              <select value={finish} onChange={e => setFinish(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white">
                <option value="">09E39</option>
                <option value="matte_laminate">0BB ;0<8=0B (+20%)</option>
                <option value="gloss_laminate">;>AA ;0<8=0B (+18%)</option>
                <option value="soft_touch">O3:89 A5=A>@ (+35%)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">%M2;ME B0;</label>
              <select value={side} onChange={e => setSide(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white">
                <option value="">M3 B0;</option>
                <option value="double">%>Q@ B0; (+70%)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={delivery} onChange={e => setDelivery(e.target.checked)}
                className="accent-orange-500 w-4 h-4" />
              <span className="text-sm">%@3M;B EM@M3BM9 (+15,000)</span>
            </label>

            {/* Design D09; upload */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                8709= D09; <span className="text-gray-600">(70020; 18H  .pdf, .ai, .png, .jpg)</span>
              </label>
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all
                ${uploadedFile ? 'border-green-500 bg-green-500/10' : 'border-gray-700 hover:border-orange-500'}`}>
                {uploadedFile ? (
                  <div>
                    <div className="text-3xl mb-2"></div>
                    <p className="text-green-400 font-semibold text-sm">{file?.name}</p>
                    <p className="text-gray-400 text-xs mt-1">{uploadedFile.size_mb} MB</p>
                    <button onClick={() => { setFile(null); setUploadedFile(null) }}
                      className="mt-2 text-xs text-red-400 hover:underline">
                      #AB30E
                    </button>
                  </div>
                ) : uploading ? (
                  <div>
                    <div className="text-3xl mb-2"></div>
                    <p className="text-gray-400 text-sm">$09; upload E896 109=0...</p>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="text-3xl mb-2">=</div>
                    <p className="text-gray-400 text-sm">$09; A>=3>E MA2M; M=4 G8@ME</p>
                    <p className="text-gray-600 text-xs mt-1">PDF, AI, PNG, JPG  max 50MB</p>
                    <input type="file" className="hidden"
                      accept=".pdf,.ai,.png,.jpg,.jpeg,.eps"
                      onChange={handleFileChange} />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">"09;10@ (70020; 18H)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                rows={3} placeholder="0E80;3K= B09;10@, BCA309 EAM;B..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white resize-none" />
            </div>

            <button onClick={getQuote} disabled={!productId || loading || uploading}
              className="w-full py-4 bg-orange-500 rounded-xl font-semibold text-lg hover:bg-orange-600 disabled:opacity-50">
              {loading ? '">>F>>;6 109=0...' : uploading ? '$09; upload E896 109=0...' : '@3M;6;;ME '}
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && quote && (
          <div className="space-y-5">
            <h1 className="text-2xl font-bold">=89= A0=0; 10B;0E</h1>
            <div className="bg-gray-900 rounded-xl p-6 space-y-3">
              <h2 className="text-lg font-semibold text-orange-400">{quote.product_name}</h2>
              {[
                { label: '">> H8@EM3', value: `${quote.quantity} H8@EM3` },
                { label: 'M36 =M', value: `${Number(quote.unit_price).toLocaleString()}` },
                { label: '89B 4=', value: `${Number(quote.subtotal).toLocaleString()}` },
                { label: ';0BD>@< H8<B3M;', value: `${Number(quote.platform_margin).toLocaleString()}` },
                { label: '%@3M;B', value: `${Number(quote.delivery_fee).toLocaleString()}` },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-sm border-b border-gray-800 pb-2">
                  <span className="text-gray-400">{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
              {uploadedFile && (
                <div className="flex justify-between text-sm border-b border-gray-800 pb-2">
                  <span className="text-gray-400">8709= D09;</span>
                  <span className="text-green-400"> {file?.name}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xl pt-2">
                <span>89B B;E</span>
                <span className="text-orange-400">{Number(quote.total).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3 border border-gray-600 rounded-xl hover:border-orange-500">
                 CF0E
              </button>
              <button onClick={placeOrder} disabled={loading}
                className="flex-1 py-3 bg-orange-500 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50">
                {loading ? '0E80;6 109=0...' : '0E80;30 3E '}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && paymentResult && (
          <div className="space-y-5 text-center">
            <div className="text-6xl"><</div>
            <h1 className="text-2xl font-bold">0E80;30 0<68;BB09!</h1>
            <div className="bg-gray-900 rounded-xl p-6 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">0E80;3K= 4C300@</span>
                <span className="font-mono text-xs">{paymentResult.order.id.slice(0, 16)}...</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Invoice :>4</span>
                <span className="text-orange-400 font-semibold">{paymentResult.payment.invoice_code}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">";E 4=</span>
                <span className="font-bold text-lg">{Number(paymentResult.payment.amount).toLocaleString()}</span>
              </div>
              {uploadedFile && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">8709= D09;</span>
                  <span className="text-green-400"> %;MM= 02;00</span>
                </div>
              )}
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mt-4">
                <p className="text-orange-400 text-sm font-semibold mb-1">QPay QR :>4</p>
                <p className="text-xs text-gray-400">{paymentResult.payment.qr_text}</p>
                <a href={paymentResult.payment.qpay_url} target="_blank"
                  className="mt-2 block text-center py-2 bg-orange-500 rounded-lg text-sm font-semibold hover:bg-orange-600">
                  QPay-MM@ B;E
                </a>
              </div>
            </div>
            <a href="/dashboard"
              className="block py-3 border border-gray-600 rounded-xl hover:border-orange-500">
              Dashboard @CC 1CF0E
            </a>
          </div>
        )}
      </div>
    </main>
  )
}