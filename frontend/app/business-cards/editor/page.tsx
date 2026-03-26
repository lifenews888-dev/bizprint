'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { usePricing } from '@/hooks/usePricing'
import { apiFetch, API_URL } from '@/lib/api'

/* ═══════════════════════════════════════
 *  Business Card Editor — Vistaprint-style
 *  Form-driven: type info → see it on card instantly
 *  NO drag-drop. Simple, guided, conversion-focused.
 * ═══════════════════════════════════════ */

// Card dimensions (mm) → display pixels (1mm ≈ 3.78px at 96dpi)
const CARD_W_MM = 90, CARD_H_MM = 55, BLEED_MM = 3
const SCALE = 5 // display scale — larger canvas for better editing
const W = CARD_W_MM * SCALE  // 450
const H = CARD_H_MM * SCALE  // 275
const BLEED = BLEED_MM * SCALE // 15
const SAFE = 4 * SCALE // 20 — safe margin

const TEMPLATES: Record<string, { accent: string; bg: string; textDark: string; textLight: string; dividerY?: number }> = {
  'minimal-1':    { accent: '#FF6B00', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280' },
  'corporate-1':  { accent: '#1E40AF', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280' },
  'creative-1':   { accent: '#7C3AED', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280' },
  'dark-1':       { accent: '#D4AF37', bg: '#111111', textDark: '#FFFFFF', textLight: '#9CA3AF' },
  'green-1':      { accent: '#059669', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280' },
  'red-1':        { accent: '#DC2626', bg: '#FFFFFF', textDark: '#111111', textLight: '#6B7280' },
}

const QTY_OPTIONS = [
  { qty: 100, label: '100 ширхэг' },
  { qty: 250, label: '250 ширхэг' },
  { qty: 500, label: '500 ширхэг' },
  { qty: 1000, label: '1,000 ширхэг' },
]

function EditorInner() {
  const sp = useSearchParams()
  const bcProductId = sp.get('bc') || ''
  const initialLayoutId = sp.get('layout') || ''
  const templateId = sp.get('template') || 'minimal-1'
  const [T, setT] = useState(TEMPLATES[templateId] || TEMPLATES['minimal-1'])

  const [frontImg, setFrontImg] = useState('')
  const [backImg, setBackImg] = useState('')
  const [zoneLayout, setZoneLayout] = useState<any[]>([])
  const [backZoneLayout, setBackZoneLayout] = useState<any[]>([])
  const [cardType, setCardType] = useState<'standard' | 'laminated' | 'embossed'>('standard')
  const [pricingTiers, setPricingTiers] = useState<{ qty: number; standard: number; laminated: number; embossed: number }[] | null>(null)

  // Load template from API if it's a UUID (admin-created)
  useEffect(() => {
    if (templateId.includes('-') && templateId.length > 20) {
      apiFetch(`/templates/${templateId}`).then((data: any) => {
        if (data?.canvas_data) {
          setT({ accent: data.canvas_data.accent || '#FF6B00', bg: data.canvas_data.bg || '#FFFFFF', textDark: data.canvas_data.textDark || '#111111', textLight: data.canvas_data.textLight || '#6B7280', dividerY: data.canvas_data.dividerY || 0 })
        }
        if (data?.zones?.length) setZoneLayout(data.zones)
        if (data?.back_zones?.length) setBackZoneLayout(data.back_zones)
        if (data?.front_preview_url) setFrontImg(data.front_preview_url)
        if (data?.back_preview_url) setBackImg(data.back_preview_url)
        if (data?.card_type) setCardType(data.card_type)
        if (data?.pricing_tiers?.length) setPricingTiers(data.pricing_tiers)
      }).catch(() => {})
    }
  }, [templateId])

  // Fetch business card layouts from API + set initial layout from URL
  const [bcPricing, setBcPricing] = useState<{ qty: number; unit_price: number }[]>([])
  useEffect(() => {
    apiFetch('/business-cards', { auth: false }).then((data: any) => {
      const products = Array.isArray(data) ? data : (data?.value ?? data?.data ?? [])
      if (products.length > 0) {
        // Find matching product or the one with most layouts
        const product = bcProductId
          ? products.find((p: any) => p.id === bcProductId) || products[0]
          : products.reduce((a: any, b: any) =>
              (b.layouts?.length || 0) > (a.layouts?.length || 0) ? b : a, products[0])
        const valid = (product.layouts || []).filter((l: any) => l.canvas_data)
        setBcLayouts(valid)

        // Set pricing from product tiers
        if (product.pricingTiers?.length) {
          setBcPricing(product.pricingTiers.map((t: any) => ({ qty: Number(t.quantity), unit_price: Number(t.unit_price) })))
        }

        // Auto-select initial layout from URL param
        if (initialLayoutId) {
          const match = valid.find((l: any) => l.id === initialLayoutId)
          if (match) {
            setSelectedBcLayout(initialLayoutId)
            if (match.canvas_data) {
              setT({ accent: match.canvas_data.accent || '#FF6B00', bg: match.canvas_data.bg || '#FFFFFF', textDark: match.canvas_data.textDark || '#111111', textLight: match.canvas_data.textLight || '#6B7280', dividerY: match.canvas_data.dividerY || 0 })
            }
          }
        }
      }
    }).catch(() => {})
  }, [bcProductId, initialLayoutId])

  const handleBcLayoutChange = (layoutId: string) => {
    setSelectedBcLayout(layoutId)
    const layout = bcLayouts.find((l: any) => l.id === layoutId)
    if (layout?.canvas_data) {
      setT({
        accent: layout.canvas_data.accent || '#FF6B00',
        bg: layout.canvas_data.bg || '#FFFFFF',
        textDark: layout.canvas_data.textDark || '#111111',
        textLight: layout.canvas_data.textLight || '#6B7280',
        dividerY: layout.canvas_data.dividerY || 0,
      })
    }
  }

  const [side, setSide] = useState<'front' | 'back'>('front')
  const [qty, setQty] = useState(100)
  const [logoUrl, setLogoUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    company_name: '', company_message: '', full_name: '', job_title: '',
    email: '', phone: '', address1: '', address2: '', website: '',
    facebook: '', instagram: '', linkedin: '', qr_text: '',
  })
  const [showSocial, setShowSocial] = useState(false)
  const [socialLinks, setSocialLinks] = useState<{ platform: string; value: string }[]>([])

  const SOCIAL_OPTIONS = [
    { key: 'facebook', label: 'Facebook', icon: 'f', color: '#1877F2' },
    { key: 'instagram', label: 'Instagram', icon: 'ig', color: '#E4405F' },
    { key: 'linkedin', label: 'LinkedIn', icon: 'in', color: '#0A66C2' },
    { key: 'tiktok', label: 'TikTok', icon: 'Tk', color: '#000000' },
    { key: 'twitter', label: 'X / Twitter', icon: 'X', color: '#1DA1F2' },
    { key: 'telegram', label: 'Telegram', icon: 'Tg', color: '#0088CC' },
    { key: 'youtube', label: 'YouTube', icon: 'Yt', color: '#FF0000' },
    { key: 'wechat', label: 'WeChat', icon: 'Wc', color: '#07C160' },
    { key: 'viber', label: 'Viber', icon: 'Vb', color: '#7360F2' },
    { key: 'whatsapp', label: 'WhatsApp', icon: 'Wa', color: '#25D366' },
  ]
  const addSocial = () => {
    const used = socialLinks.map(s => s.platform)
    const next = SOCIAL_OPTIONS.find(o => !used.includes(o.key))
    if (next) setSocialLinks([...socialLinks, { platform: next.key, value: '' }])
  }
  const removeSocial = (idx: number) => setSocialLinks(socialLinks.filter((_, i) => i !== idx))
  const updateSocial = (idx: number, field: 'platform' | 'value', val: string) => {
    setSocialLinks(socialLinks.map((s, i) => i === idx ? { ...s, [field]: val } : s))
  }
  const [showQr, setShowQr] = useState(false)
  const [ordering, setOrdering] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<any>(null)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'paid'>('idle')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showLayoutPicker, setShowLayoutPicker] = useState(false)
  const [layoutList, setLayoutList] = useState<any[]>([])
  const [bcLayouts, setBcLayouts] = useState<any[]>([])
  const [selectedBcLayout, setSelectedBcLayout] = useState('')
  const [editMode, setEditMode] = useState(false) // drag zones mode
  const [dragIdx, setDragIdx] = useState(-1)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, origX: 0, origY: 0 })
  const [zoom, setZoom] = useState(1)
  const zoomIn = () => setZoom(z => Math.min(2, Math.round((z + 0.1) * 10) / 10))
  const zoomOut = () => setZoom(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))
  const zoomReset = () => setZoom(1)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const apiPricing = usePricing({ product_type: 'digital', material: 'paper_300', quantity: qty, width_mm: 90, height_mm: 55 })
  const fmt = (n: number) => Math.round(n).toLocaleString('mn-MN')

  // Use admin pricing_tiers → bc product pricing → API pricing (fallback chain)
  const pricing = (() => {
    if (pricingTiers?.length) {
      const sorted = [...pricingTiers].sort((a, b) => a.qty - b.qty)
      const tier = sorted.reduce((best, t) => t.qty <= qty ? t : best, sorted[0])
      const unitPrice = tier[cardType] || tier.standard
      return { loading: false, data: { total_price: unitPrice * qty, unit_price: unitPrice, production_speed: '1-2 өдөр' } }
    }
    if (bcPricing.length > 0) {
      const sorted = [...bcPricing].sort((a, b) => a.qty - b.qty)
      const tier = sorted.reduce((best, t) => t.qty <= qty ? t : best, sorted[0])
      const unitPrice = tier.unit_price
      return { loading: false, data: { total_price: Math.round(unitPrice * qty), unit_price: unitPrice, production_speed: '1-2 өдөр' } }
    }
    return apiPricing
  })()

  // Build vCard string from form fields
  const buildVCard = () => {
    const lines = ['BEGIN:VCARD', 'VERSION:3.0']
    if (form.full_name) lines.push(`FN:${form.full_name}`)
    if (form.company_name) lines.push(`ORG:${form.company_name}`)
    if (form.job_title) lines.push(`TITLE:${form.job_title}`)
    if (form.phone) lines.push(`TEL;TYPE=WORK:${form.phone}`)
    if (form.email) lines.push(`EMAIL:${form.email}`)
    if (form.address1 || form.address2) lines.push(`ADR;TYPE=WORK:;;${form.address1};${form.address2};;;`)
    if (form.website) lines.push(`URL:${form.website}`)
    // Social links — use URL fields (widely supported by all phones)
    if (showSocial && socialLinks.length > 0) {
      const SOCIAL_URLS: Record<string, string> = {
        facebook: 'https://facebook.com/', instagram: 'https://instagram.com/',
        linkedin: 'https://linkedin.com/in/', tiktok: 'https://tiktok.com/@',
        twitter: 'https://x.com/', telegram: 'https://t.me/',
        youtube: 'https://youtube.com/@', whatsapp: 'https://wa.me/',
        viber: 'viber://chat?number=', wechat: 'weixin://',
      }
      for (const s of socialLinks) {
        if (s.value) {
          const base = SOCIAL_URLS[s.platform] || 'https://'
          const url = s.value.startsWith('http') ? s.value : `${base}${s.value}`
          lines.push(`URL;TYPE=${s.platform}:${url}`)
        }
      }
    }
    lines.push('END:VCARD')
    return lines.join('\n')
  }
  const qrValue = showQr ? (form.qr_text || buildVCard()) : ''

  const uploadLogo = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const tok = localStorage.getItem('access_token') || localStorage.getItem('token')
      const res = await fetch(`${API_URL}/upload/file`, { method: 'POST', body: fd, headers: tok ? { Authorization: `Bearer ${tok}` } : {} })
      const data = await res.json()
      if (data.file_url) setLogoUrl(data.file_url.startsWith('http') ? data.file_url : `${API_URL}/${data.file_url}`)
    } catch {} finally { setUploading(false) }
  }

  // Validation
  const warnings: string[] = []
  if (!form.full_name) warnings.push('Нэр оруулна уу')
  if (!form.phone && !form.email) warnings.push('Утас эсвэл имэйл оруулна уу')
  const isValid = warnings.length === 0

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const startPolling = (invoiceCode: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await apiFetch<any>(`/payment/status/${invoiceCode}`)
        if (res?.status === 'paid' || res?.status === 1 || res?.status === 'PAID') {
          setPaymentStatus('paid')
          if (pollRef.current) clearInterval(pollRef.current)
        }
      } catch {}
    }, 5000)
  }

  // Order + Payment handler
  const handleOrder = async () => {
    if (!isValid) return
    const tok = localStorage.getItem('access_token') || localStorage.getItem('token')
    if (!tok) { alert('Эхлээд нэвтэрнэ үү'); window.location.href = '/login'; return }
    setOrdering(true)
    try {
      const orderData = {
        product_name: 'Нэрийн хуудас',
        product_type: 'business_card',
        template_id: templateId,
        quantity: qty,
        total_price: pricing.data?.total_price || 0,
        unit_price: pricing.data?.unit_price || 0,
        form_data: form,
        logo_url: logoUrl,
        social: showSocial ? socialLinks.filter(s => s.value) : null,
        qr_text: showQr ? qrValue : null,
        zones: zoneLayout,
        canvas_data: T,
      }
      // 1. Create order
      const result: any = await apiFetch('/orders', { method: 'POST', body: {
        product_name: 'Нэрийн хуудас',
        quantity: qty,
        total_price: pricing.data?.total_price || 0,
        unit_price: pricing.data?.unit_price || 0,
        customer_name: form.full_name,
        customer_email: form.email,
        customer_phone: form.phone,
        notes: `Template: ${templateId}\nCompany: ${form.company_name}\nLayout zones: ${zoneLayout.length} zones`,
        options: orderData,
        status: 'draft',
        payment_status: 'pending',
      } })
      const order = result?.data || result
      setOrderSuccess(order)

      // 2. Create payment
      if (order?.id && order?.total_price) {
        try {
          const payRes = await apiFetch<any>('/payment/create', {
            method: 'POST',
            body: { orderId: order.id, amount: Number(order.total_price), method: 'qr' },
          })
          setPaymentData(payRes)
          setPaymentStatus('pending')
          const invoiceCode = payRes?.invoice_code || payRes?.invoiceNo
          if (invoiceCode) startPolling(invoiceCode)
        } catch (e: any) {
          console.log('Payment creation error:', e.message)
          // Fallback: redirect to checkout
          window.location.href = `/checkout?order_id=${order.id}`
          return
        }
      }
    } catch (e: any) {
      alert(e.message || 'Захиалга үүсгэхэд алдаа гарлаа. Нэвтэрсэн эсэхээ шалгана уу.')
    } finally { setOrdering(false) }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", background: '#F3F4F6' }}>
      {/* Top bar */}
      <div style={{ height: 52, background: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/business-cards" style={{ fontWeight: 800, fontSize: 16, color: '#FF6B00', textDecoration: 'none' }}>BizPrint</a>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <span style={{ fontSize: 14, color: '#374151' }}>Нэрийн хуудас засварлах</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center' }}>90 × 55 мм</span>
        </div>
      </div>

      {/* 3-column layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ═══ LEFT: Form ═══ */}
        <div style={{ width: 320, background: '#fff', borderRight: '1px solid #E5E7EB', overflow: 'auto', padding: '20px 16px', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 }}>Текст</div>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>Мэдээлэлээ оруулна уу. Нэрийн хуудсан дээр шууд харагдана.</p>

          {/* Basic fields */}
          {[
            { key: 'company_name', label: 'Company Name', placeholder: 'BizPrint LLC' },
            { key: 'company_message', label: 'Company Message', placeholder: 'Хэвлэлийн шийдэл' },
            { key: 'full_name', label: 'Full Name', placeholder: 'Бат-Эрдэнэ' },
            { key: 'job_title', label: 'Job Title', placeholder: 'Захирал' },
            { key: 'email', label: 'Email / Other', placeholder: 'info@bizprint.mn' },
            { key: 'address1', label: 'Address Line 1', placeholder: 'Сүхбаатар дүүрэг' },
            { key: 'address2', label: 'Address Line 2', placeholder: 'Улаанбаатар, Монгол' },
            { key: 'website', label: 'Web / Other', placeholder: 'www.bizprint.mn' },
            { key: 'phone', label: 'Phone / Other', placeholder: '+976 9911-2233' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 10 }}>
              <input value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.label}
                style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #E5E7EB', fontSize: 14, color: '#111', outline: 'none', background: 'transparent' }}
                onFocus={e => e.target.style.borderBottomColor = '#FF6B00'} onBlur={e => e.target.style.borderBottomColor = '#E5E7EB'} />
            </div>
          ))}

          {/* Logo upload */}
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            {logoUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#F9FAFB', borderRadius: 8 }}>
                <img src={logoUrl} alt="logo" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4 }} />
                <button onClick={() => setLogoUrl('')} style={{ fontSize: 12, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Устгах</button>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '1px dashed #D1D5DB', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#6B7280' }}>
                <span style={{ fontSize: 18 }}>📁</span>
                {uploading ? 'Оруулж байна...' : 'Лого оруулах'}
                <input type="file" accept="image/png" hidden onChange={e => { if (e.target.files?.[0]) uploadLogo(e.target.files[0]) }} />
              </label>
            )}
          </div>

          {/* ─── Social Links (dynamic, user picks platform) ─── */}
          <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12, marginBottom: 12 }}>
            <button onClick={() => setShowSocial(!showSocial)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Сошиал хаяг</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {showSocial && socialLinks.length > 0 && <span style={{ fontSize: 10, color: '#10B981' }}>{socialLinks.length} нэмэгдсэн</span>}
                <div style={{ width: 36, height: 20, borderRadius: 10, background: showSocial ? '#FF6B00' : '#D1D5DB', position: 'relative', transition: 'background .2s' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: showSocial ? 19 : 3, transition: 'left .2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </button>
            {showSocial && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {socialLinks.map((link, idx) => {
                  const opt = SOCIAL_OPTIONS.find(o => o.key === link.platform) || SOCIAL_OPTIONS[0]
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Platform selector — icon button that opens dropdown */}
                      <div style={{ position: 'relative' }}>
                        <select value={link.platform} onChange={e => updateSocial(idx, 'platform', e.target.value)}
                          style={{ width: 28, height: 28, opacity: 0, position: 'absolute', cursor: 'pointer', zIndex: 1 }} />
                        <span style={{ width: 28, height: 28, borderRadius: 6, background: opt.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{opt.icon}</span>
                        <select value={link.platform} onChange={e => updateSocial(idx, 'platform', e.target.value)}
                          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}>
                          {SOCIAL_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                        </select>
                      </div>
                      <input value={link.value} onChange={e => updateSocial(idx, 'value', e.target.value)} placeholder={opt.label + ' хаяг'}
                        style={{ flex: 1, padding: '8px 0', border: 'none', borderBottom: '1px solid #E5E7EB', fontSize: 13, color: '#111', outline: 'none', background: 'transparent' }} />
                      <button onClick={() => removeSocial(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#EF4444', padding: '0 4px', lineHeight: 1 }}>x</button>
                    </div>
                  )
                })}
                {socialLinks.length < 5 && (
                  <button onClick={addSocial} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#FF6B00', fontWeight: 500 }}>
                    + Сошиал нэмэх
                  </button>
                )}
                <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>Icon дарж платформ солих боломжтой. Ар тал дээр харагдана.</p>
              </div>
            )}
          </div>

          {/* ─── QR Code (toggle) ─── */}
          <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
            <button onClick={() => setShowQr(!showQr)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>QR код</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {showQr && <span style={{ fontSize: 10, color: '#10B981' }}>Нэмэгдсэн</span>}
                <div style={{ width: 36, height: 20, borderRadius: 10, background: showQr ? '#FF6B00' : '#D1D5DB', position: 'relative', transition: 'background .2s' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: showQr ? 19 : 3, transition: 'left .2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </button>
            {showQr && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 11, color: '#374151', margin: 0 }}>📇 Таны нэр, утас, имэйл, хаяг автоматаар QR дотор vCard хэлбэрээр орно.</p>
                {/* Show what's included in QR */}
                {(() => {
                  const items: string[] = []
                  if (form.full_name) items.push('Нэр')
                  if (form.phone) items.push('Утас')
                  if (form.email) items.push('Имэйл')
                  if (form.website) items.push('Вэб')
                  if (form.address1) items.push('Хаяг')
                  const socialCount = showSocial ? socialLinks.filter(s => s.value).length : 0
                  if (socialCount > 0) items.push(`${socialCount} сошиал`)
                  return items.length > 0 ? (
                    <div style={{ fontSize: 10, color: '#6B7280', margin: '4px 0 0', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      <span style={{ color: '#9CA3AF' }}>QR агуулга:</span>
                      {items.map(i => <span key={i} style={{ padding: '1px 6px', background: '#F3F4F6', borderRadius: 4, fontSize: 9 }}>{i}</span>)}
                    </div>
                  ) : null
                })()}
                <input value={form.qr_text} onChange={e => set('qr_text', e.target.value)} placeholder="Эсвэл өөр линк оруулах (заавал биш)"
                  style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #E5E7EB', fontSize: 13, color: '#111', outline: 'none', background: 'transparent' }} />
                <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>QR код нэрийн хуудасны өвөр/ар тал дээр байрлана.</p>

                {/* Trial + pricing info */}
                <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '10px 12px', border: '1px solid #10B98130' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>&#x2705;</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>Эхний 3 сар ҮНЭГҮЙ</span>
                  </div>
                  <p style={{ fontSize: 10, color: '#065F46', margin: 0, lineHeight: 1.5 }}>
                    Захиалга хийхэд QR дижитал карт автоматаар идэвхжинэ. Утсаар уншуулахад таны контакт мэдээлэл шууд хадгалагдана.
                  </p>
                </div>

                <div style={{ background: '#FFF7ED', borderRadius: 10, padding: '10px 12px', border: '1px solid #FF6B0030' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#C2410C', marginBottom: 2 }}>3 сарын дараа</div>
                  <p style={{ fontSize: 10, color: '#9A3412', margin: 0, lineHeight: 1.5 }}>
                    QR дижитал карт жилийн ₮29,900-аар сунгах боломжтой. Хугацаа дууcвал QR идэвхгүй болно.
                  </p>
                </div>

                <a href="/dashboard/customer/digital-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', background: '#F3F4F6', borderRadius: 8, textDecoration: 'none', fontSize: 11, color: '#374151', fontWeight: 500 }}>
                  <span>&#x1F4C7;</span> Дижитал карт удирдах
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ═══ CENTER: Preview ═══ */}
        <div
          onWheel={e => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); e.deltaY < 0 ? zoomIn() : zoomOut() } }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, background: '#F3F4F6', position: 'relative', overflow: 'hidden' }}>
          {/* Safety/Bleed legend */}
          <div style={{ position: 'absolute', top: 12, right: 16, display: 'flex', gap: 12, fontSize: 11, color: '#9CA3AF', zIndex: 2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 16, height: 0, borderTop: '1.5px dashed #10B981', display: 'inline-block' }} /> Safety Area</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 16, height: 0, borderTop: '1.5px solid #60A5FA', display: 'inline-block' }} /> Bleed</span>
          </div>

          {/* Dimension label */}
          <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
            {CARD_W_MM}×{CARD_H_MM} мм
          </div>

          {/* Card Preview — zoomable */}
          <div style={{ position: 'relative', transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease' }}>
            {/* Bleed outline */}
            <div style={{ position: 'absolute', inset: -BLEED, border: '1.5px solid #60A5FA', borderRadius: 4, pointerEvents: 'none' }} />
            {/* Safe zone outline */}
            <div style={{ position: 'absolute', inset: SAFE, border: '1.5px dashed #10B98150', borderRadius: 2, pointerEvents: 'none' }} />

            {/* THE CARD */}
            <div
              onMouseMove={e => {
                if (!editMode || dragIdx < 0) return
                const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y
                setZoneLayout(prev => prev.map((z, i) => i === dragIdx ? { ...z, x: Math.max(SAFE, Math.min(W - SAFE, dragStart.origX + dx)), y: Math.max(SAFE, Math.min(H - SAFE, dragStart.origY + dy)) } : z))
              }}
              onMouseUp={() => setDragIdx(-1)}
              onMouseLeave={() => setDragIdx(-1)}
              style={{
                width: W, height: H, background: T.bg, borderRadius: 4, position: 'relative', overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                border: editMode ? '2px dashed #FF6B0060' : 'none',
              }}>
              {/* Template background image (from admin upload) */}
              {side === 'front' && frontImg && <img src={frontImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              {side === 'back' && backImg && <img src={backImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}

              {side === 'front' ? (
                <>
                  {/* Accent bars */}
                  {!frontImg && <>
                    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: 6, background: T.accent }} />
                    <div style={{ position: 'absolute', left: 0, top: 0, width: 4, height: '100%', background: T.accent }} />
                    {(T as any).dividerY > 0 && <div style={{ position: 'absolute', left: 16, right: 16, top: (T as any).dividerY, height: 3, background: `linear-gradient(90deg, ${T.accent}, ${T.accent}40)`, borderRadius: 2 }} />}
                  </>}

                  {/* Render zones — FRONT SIDE ONLY shows: logo, name, job_title, company */}
                  {/* Render all front zones — admin controls what appears on front */}
                  {zoneLayout.length > 0 ? zoneLayout.map((z: any, idx: number) => {
                    const dragProps = editMode ? {
                      onMouseDown: (e: React.MouseEvent) => { e.preventDefault(); setDragIdx(idx); setDragStart({ x: e.clientX, y: e.clientY, origX: z.x, origY: z.y }) },
                      style: { cursor: 'move', outline: dragIdx === idx ? '2px solid #FF6B00' : '1px dashed #3B82F640', outlineOffset: 2 },
                    } : {}

                    // QR zone
                    if (z.type === 'qr') {
                      if (!showQr) return null
                      const qrSize = Math.min(z.w || 80, z.h || 80) || z.w || 80
                      return <div key={z.key} {...dragProps} style={{ position: 'absolute', left: z.x, top: z.y, width: qrSize, height: qrSize, background: '#fff', borderRadius: 4, padding: 3, border: `1px solid ${T.bg === '#111111' ? '#333' : '#E5E7EB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...dragProps.style }}>
                        <QRCodeSVG value={qrValue || 'https://bizprint.mn'} size={qrSize - 8} bgColor="#FFFFFF" fgColor="#000000" level="L" />
                      </div>
                    }
                    // Icon zones
                    if (z.type === 'icon') {
                      const ic = z.icon || ''
                      const ICON_COLORS: Record<string, string> = { fb: '#1877F2', ig: '#E4405F', 'in': '#0A66C2', phone: '#10B981', email: '#6B7280', web: '#3B82F6' }
                      const ICON_LABELS: Record<string, string> = { fb: 'f', ig: 'ig', 'in': 'in', phone: '\u260E', email: '@', web: '\u25CB' }
                      // Social icons: show only if user enabled + has value
                      const SOCIAL_MAP: Record<string, string> = { fb: 'facebook', ig: 'instagram', 'in': 'linkedin' }
                      if (SOCIAL_MAP[ic] && (!showSocial || !socialLinks.some(s => s.platform === SOCIAL_MAP[ic] && s.value))) return null
                      const color = ICON_COLORS[ic] || T.accent
                      const s = Math.min(z.w || 14, z.h || 14)
                      return <div key={z.key} {...dragProps} style={{ position: 'absolute', left: z.x, top: z.y, width: s, height: s, borderRadius: 4, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: s * 0.55, color: '#fff', fontWeight: 700, lineHeight: 1, ...dragProps.style }}>{ICON_LABELS[ic] || ''}</div>
                    }
                    // Logo
                    if (z.key === 'logo') {
                      return <div key={z.key} {...dragProps} style={{ position: 'absolute', left: z.x, top: z.y, width: z.w || 72, height: z.h || 72, background: logoUrl ? 'transparent' : (T.bg === '#111111' ? '#333' : '#E5E7EB'), borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...dragProps.style }}>
                        {logoUrl ? <img src={logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 9, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.3 }}>Лого</span>}
                      </div>
                    }
                    // Text zones
                    const value = (form as any)[z.key] || z.key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
                    const isAccent = z.fill === 'accent'
                    const color = isAccent ? T.accent : T.textLight
                    return <div key={z.key} {...dragProps} style={{ position: 'absolute', left: z.x, top: z.y, fontSize: z.fontSize || 10, fontWeight: z.fontWeight === 'bold' ? 700 : 400, color, textAlign: (z.align || 'left') as any, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: W - z.x - 16, ...dragProps.style }}>{value}</div>
                  }) : (
                    /* Fallback: default layout (no zones from API) */
                    <>
                      <div style={{ position: 'absolute', left: 20, top: 28, width: 72, height: 72, background: logoUrl ? 'transparent' : '#E5E7EB', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {logoUrl ? <img src={logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 9, color: '#9CA3AF', textAlign: 'center' }}>Лого</span>}
                      </div>
                      <div style={{ position: 'absolute', left: 104, top: 28, right: 16, fontSize: 18, fontWeight: 700, color: T.accent, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{form.company_name || 'Company Name'}</div>
                      <div style={{ position: 'absolute', left: 104, top: 50, right: 16, fontSize: 10, color: T.textLight }}>{form.company_message || 'Company Message'}</div>
                      <div style={{ position: 'absolute', right: 16, top: 100, fontSize: 15, fontWeight: 700, color: T.accent, textAlign: 'right' }}>{form.full_name || 'Full Name'}</div>
                      <div style={{ position: 'absolute', right: 16, top: 118, fontSize: 10, color: T.textLight, textAlign: 'right' }}>{form.job_title || 'Job Title'}</div>
                      <div style={{ position: 'absolute', right: 16, top: 132, fontSize: 9, color: T.textLight, textAlign: 'right' }}>{form.email || 'Email'}</div>
                      <div style={{ position: 'absolute', left: 16, right: 16, top: 154, height: 3, background: `linear-gradient(90deg, ${T.accent}, ${T.accent}40)`, borderRadius: 2 }} />
                      <div style={{ position: 'absolute', left: 16, bottom: 16, fontSize: 8, color: T.textLight, lineHeight: 1.5 }}><div>{form.address1 || 'Address'}</div><div>{form.address2 || 'City'}</div><div>{form.website || 'Web'}</div></div>
                      <div style={{ position: 'absolute', right: 16, bottom: 16, fontSize: 9, color: T.textLight, textAlign: 'right' }}>{form.phone || 'Phone'}</div>
                    </>
                  )}
                </>
              ) : (
                /* BACK SIDE — Лого+компани голд, social icon+нэр, QR баруунд */
                <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: 6, background: T.accent }} />
                  <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: 4, background: T.accent }} />

                  {/* Left: Logo + Company + Social */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20 }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="logo" style={{ width: 64, height: 64, objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: 64, height: 64, background: T.bg === '#111111' ? '#333' : '#F3F4F6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#9CA3AF' }}>Лого</div>
                    )}
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.accent, textAlign: 'center' }}>{form.company_name || 'Company'}</div>
                    {form.company_message && <div style={{ fontSize: 8, color: T.textLight, textAlign: 'center' }}>{form.company_message}</div>}

                    {/* Social — icon дээр, нэр доор */}
                    {showSocial && socialLinks.filter(s => s.value).length > 0 && (
                      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {socialLinks.filter(s => s.value).map((link, idx) => {
                          const opt = SOCIAL_OPTIONS.find(o => o.key === link.platform) || SOCIAL_OPTIONS[0]
                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, maxWidth: 60 }}>
                              <div style={{ width: 24, height: 24, borderRadius: 6, background: opt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 700, flexShrink: 0 }}>{opt.icon}</div>
                              <span style={{ fontSize: 6, color: T.textLight, textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.3 }}>{link.value}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right: QR */}
                  {showQr && qrValue && (
                    <div style={{ width: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, borderLeft: `1px solid ${T.bg === '#111111' ? '#333' : '#E5E7EB'}` }}>
                      <div style={{ width: 80, height: 80, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.bg === '#111111' ? '#444' : '#E5E7EB'}`, background: '#fff', padding: 3 }}>
                        <QRCodeSVG value={qrValue} size={74} bgColor="#FFFFFF" fgColor="#000000" level="L" />
                      </div>
                      <div style={{ fontSize: 7, color: T.textLight, textAlign: 'center' }}>{form.qr_text ? 'Scan me' : 'vCard'}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* END zoom wrapper */}

          {/* Front/Back toggle — OUTSIDE zoom, always normal size */}
          <div style={{ display: 'flex', gap: 12, marginTop: 12, zIndex: 5 }}>
            {(['front', 'back'] as const).map(s => (
              <button key={s} onClick={() => setSide(s)} style={{
                width: 80, height: 44, borderRadius: 8, cursor: 'pointer',
                border: side === s ? '2px solid #FF6B00' : '1px solid #D1D5DB',
                background: side === s ? '#FFF7ED' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontSize: 12, fontWeight: side === s ? 600 : 400,
                color: side === s ? '#FF6B00' : '#6B7280',
              }}>
                {s === 'front' ? 'Өвөр' : 'Ар'}
              </button>
            ))}
          </div>

          {/* ═══ ZOOM CONTROLS — bottom center floating ═══ */}
          <div style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 2,
            background: '#fff', borderRadius: 12, padding: '4px 6px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB', zIndex: 10,
          }}>
            <button onClick={zoomOut} disabled={zoom <= 0.5} style={{
              width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent',
              cursor: zoom <= 0.5 ? 'default' : 'pointer', fontSize: 16, color: zoom <= 0.5 ? '#D1D5DB' : '#374151',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} title="Жижигрүүлэх">−</button>

            <button onClick={zoomReset} style={{
              minWidth: 48, height: 32, borderRadius: 8, border: 'none', background: zoom !== 1 ? '#F3F4F6' : 'transparent',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} title="Анхны хэмжээ (давхар дарах)">
              {Math.round(zoom * 100)}%
            </button>

            <button onClick={zoomIn} disabled={zoom >= 2} style={{
              width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent',
              cursor: zoom >= 2 ? 'default' : 'pointer', fontSize: 16, color: zoom >= 2 ? '#D1D5DB' : '#374151',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} title="Томруулах">+</button>
          </div>
        </div>

        {/* ═══ RIGHT: Layout + Qty + Price + Actions ═══ */}
        <div style={{ width: 290, background: '#fff', borderLeft: '1px solid #E5E7EB', padding: '16px 14px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}>

          {/* Layout selector + Edit mode */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>Layout (байрлал)</span>
              {zoneLayout.length > 0 && (
                <button onClick={() => setEditMode(!editMode)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: editMode ? '#FF6B00' : '#F3F4F6', color: editMode ? '#fff' : '#6B7280' }}>
                  {editMode ? '✓ Засварлаж байна' : '✎ Чирж засах'}
                </button>
              )}
            </div>

            {/* Загвар сонгох dropdown — business card layouts from API */}
            {bcLayouts.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Загвар сонгох</div>
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedBcLayout}
                    onChange={e => handleBcLayoutChange(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', paddingLeft: selectedBcLayout ? 28 : 12,
                      borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff',
                      fontSize: 13, color: '#374151', cursor: 'pointer', appearance: 'none',
                    }}
                  >
                    <option value="">— Загвар сонгох —</option>
                    {bcLayouts.map((l: any) => (
                      <option key={l.id} value={l.id}>{l.name_mn || l.name}</option>
                    ))}
                  </select>
                  {/* Accent dot */}
                  {selectedBcLayout && (() => {
                    const sel = bcLayouts.find((l: any) => l.id === selectedBcLayout)
                    return sel ? (
                      <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, borderRadius: 5, backgroundColor: sel.canvas_data?.accent || '#FF6B00', border: '1px solid rgba(0,0,0,0.1)' }} />
                    ) : null
                  })()}
                  <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#9CA3AF', pointerEvents: 'none' }}>▼</div>
                </div>
                {/* Color swatches */}
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {bcLayouts.slice(0, 12).map((l: any) => {
                    const a = l.canvas_data?.accent || '#FF6B00'
                    const isActive = selectedBcLayout === l.id
                    return (
                      <button
                        key={l.id}
                        title={l.name_mn || l.name}
                        onClick={() => handleBcLayoutChange(l.id)}
                        style={{
                          width: 22, height: 22, borderRadius: 6, border: isActive ? '2px solid #111' : '1px solid #E5E7EB',
                          backgroundColor: a, cursor: 'pointer', transition: 'all .15s',
                          boxShadow: isActive ? '0 0 0 2px #FF6B00' : 'none',
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            <button onClick={async () => {
              try {
                const templates: any = await apiFetch('/templates?category=business_card', { auth: false })
                setLayoutList(Array.isArray(templates) ? templates : [])
                setShowLayoutPicker(true)
              } catch {}
            }} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, color: '#374151', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Загвар сонгох</span>
              <span style={{ fontSize: 11, color: '#FF6B00' }}>→</span>
            </button>
          </div>

          {/* Card Type selector */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 6 }}>Хэвлэлийн төрөл</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {([
                { key: 'standard', label: 'Энгийн', desc: '300гр цаас' },
                { key: 'laminated', label: 'Лактай', desc: 'Гялгар/Мат лак' },
                { key: 'embossed', label: 'Бүрэлттэй', desc: 'Тусгай эффект' },
              ] as const).map(ct => (
                <button key={ct.key} onClick={() => setCardType(ct.key)} style={{
                  flex: 1, padding: '8px 6px', borderRadius: 8, fontSize: 11, cursor: 'pointer', textAlign: 'center',
                  border: cardType === ct.key ? '2px solid #FF6B00' : '1px solid #E5E7EB',
                  background: cardType === ct.key ? '#FFF7ED' : '#fff', color: '#111',
                }}>
                  <div style={{ fontWeight: cardType === ct.key ? 700 : 500 }}>{ct.label}</div>
                  <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>{ct.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity — presets + custom input */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 6 }}>Тоо ширхэг</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
              {QTY_OPTIONS.map(q => (
                <button key={q.qty} onClick={() => setQty(q.qty)} style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  border: qty === q.qty ? '2px solid #FF6B00' : '1px solid #E5E7EB',
                  background: qty === q.qty ? '#FFF7ED' : '#fff', color: '#111', fontWeight: qty === q.qty ? 600 : 400,
                }}>{q.qty}</button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" min={10} value={qty} onChange={e => setQty(Math.max(10, Number(e.target.value) || 100))}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#111' }} />
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>ширхэг</span>
            </div>
          </div>

          {/* Price */}
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Нийт үнэ</div>
            {pricing.loading ? (
              <div style={{ fontSize: 22, fontWeight: 800, color: '#FF6B00' }}>...</div>
            ) : pricing.data ? (
              <>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#FF6B00' }}>₮{fmt(pricing.data.total_price)}</div>
                <div style={{ fontSize: 12, color: '#10B981', marginTop: 2 }}>₮{fmt(pricing.data.unit_price)} / нэгж</div>
                {pricing.data.production_speed && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>⏱ {pricing.data.production_speed}</div>}
              </>
            ) : (
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>Тооцоолж байна</div>
            )}
          </div>

          {/* Validation */}
          {warnings.length > 0 && (
            <div style={{ background: '#FEF3C7', borderRadius: 8, padding: 10 }}>
              {warnings.map((w, i) => <div key={i} style={{ fontSize: 11, color: '#92400E', display: 'flex', gap: 4, marginBottom: 2 }}>⚠ {w}</div>)}
            </div>
          )}
          {isValid && (
            <div style={{ background: '#DCFCE7', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#16A34A', fontSize: 13 }}>✓</span>
              <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 500 }}>Дизайн бэлэн</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button disabled={!isValid || ordering} onClick={handleOrder} style={{
              width: '100%', padding: '14px', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 700,
              cursor: isValid && !ordering ? 'pointer' : 'not-allowed',
              background: isValid ? '#FF6B00' : '#D1D5DB', color: '#fff',
            }}>
              {ordering ? 'Захиалж байна...' : `Төлж захиалах — ₮${pricing.data ? fmt(pricing.data.total_price) : '...'}`}
            </button>
            <p style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', margin: 0 }}>Төлбөр төлсний дараа загвар имэйлээр илгээгдэнэ</p>
          </div>
        </div>
      </div>

      {/* ═══ LAYOUT PICKER MODAL ═══ */}
      {showLayoutPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setShowLayoutPicker(false)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 900, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>Layout сонгох</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{layoutList.length} загвар — дарж сонгоно уу</div>
              </div>
              <button onClick={() => setShowLayoutPicker(false)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 16, color: '#6B7280' }}>✕</button>
            </div>
            {/* Grid */}
            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                {layoutList.map((tpl: any) => {
                  const a = tpl.canvas_data?.accent || '#FF6B00'
                  const bg = tpl.canvas_data?.bg || '#fff'
                  const lt = tpl.canvas_data?.textLight || '#6B7280'
                  const zones: any[] = Array.isArray(tpl.zones) ? tpl.zones : []
                  const DW = 180, DH = 110, sx = DW / 450, sy = DH / 275
                  const isDark = bg === '#111111' || bg === '#1F2937'
                  return (
                    <div key={tpl.id} onClick={() => {
                      if (tpl.zones?.length) setZoneLayout(tpl.zones)
                      if (tpl.canvas_data) setT({ accent: tpl.canvas_data.accent || '#FF6B00', bg: tpl.canvas_data.bg || '#fff', textDark: tpl.canvas_data.textDark || '#111', textLight: tpl.canvas_data.textLight || '#6B7280', dividerY: tpl.canvas_data.dividerY || 0 })
                      setShowLayoutPicker(false)
                    }} style={{ cursor: 'pointer', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden', transition: 'all .15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#FF6B00'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(255,107,0,0.15)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                      {/* Mini preview */}
                      <div style={{ padding: 10, background: '#F9FAFB', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: DW, height: DH, background: bg, borderRadius: 4, position: 'relative', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                          <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: Math.round(4 * sy), background: a }} />
                          <div style={{ position: 'absolute', left: 0, top: 0, width: Math.round(2 * sx), height: '100%', background: a }} />
                          {zones.map((z: any) => {
                            const x = Math.round(z.x * sx), y = Math.round(z.y * sy)
                            if (z.type === 'qr') {
                              const qs = Math.max(8, Math.round(Math.min(z.w||64, z.h||64) * ((sx+sy)/2)))
                              return <div key={z.key} style={{ position:'absolute', left:x, top:y, width:qs, height:qs, background:'#fff', borderRadius:1, border:'1px solid #ccc', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:qs-3, height:qs-3, background:'repeating-conic-gradient(#555 0% 25%, transparent 0% 50%) 0 0 / 3px 3px', opacity:0.5 }} /></div>
                            }
                            if (z.type === 'icon') {
                              const ic: Record<string,string> = { fb:'#1877F2', ig:'#E4405F', 'in':'#0A66C2', phone:'#10B981', email:'#6B7280', web:'#3B82F6' }
                              const s = Math.max(4, Math.round(Math.min(z.w||12, z.h||12) * ((sx+sy)/2)))
                              return <div key={z.key} style={{ position:'absolute', left:x, top:y, width:s, height:s, borderRadius:2, background: ic[z.icon] || a }} />
                            }
                            if (z.key === 'logo') return <div key={z.key} style={{ position: 'absolute', left: x, top: y, width: Math.round((z.w||50)*sx), height: Math.round((z.h||50)*sy), background: isDark ? '#333' : '#E5E7EB', borderRadius: 2, fontSize: 5, color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>L</div>
                            const sc = (sx+sy)/2, fs = Math.max(5, Math.round((z.fontSize||9)*sc))
                            const isAc = z.fill === 'accent'
                            const st: React.CSSProperties = { position: 'absolute', top: y, fontSize: fs, fontWeight: z.fontWeight === 'bold' ? 700 : 400, color: isAc ? a : lt, whiteSpace: 'nowrap', overflow: 'hidden', lineHeight: 1.1 }
                            if (z.align === 'center') { st.left = 4; st.right = 4; st.textAlign = 'center' }
                            else if (z.align === 'right') { st.right = Math.round(8*sx); st.textAlign = 'right' }
                            else { st.left = x; st.maxWidth = DW - x - 4 }
                            const labels: Record<string,string> = { company_name:'Co', full_name:'Name', job_title:'Title', email:'@', phone:'Ph', address1:'Addr', company_message:'Msg', website:'Web' }
                            return <div key={z.key} style={st}>{labels[z.key]||''}</div>
                          })}
                        </div>
                      </div>
                      <div style={{ padding: '8px 10px' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#111', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{tpl.title_mn || tpl.title}</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                          <div style={{ width: 12, height: 12, borderRadius: 3, background: a }} />
                          <div style={{ width: 12, height: 12, borderRadius: 3, background: bg, border: '1px solid #E5E7EB' }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PAYMENT MODAL ═══ */}
      {paymentStatus !== 'idle' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 480, padding: 32, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            {paymentStatus === 'paid' ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>&#x2705;</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 8 }}>Төлбөр амжилттай!</div>
                <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>Захиалга баталгаажлаа. Нэрийн хуудас бэлтгэгдэж эхэлнэ.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button onClick={() => window.location.href = '/dashboard/orders'} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#FF6B00', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Захиалгууд харах</button>
                  <button onClick={() => { setPaymentStatus('idle'); setPaymentData(null); setOrderSuccess(null) }} style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer' }}>Шинэ захиалга</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 4 }}>Төлбөр төлөх</div>
                <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>QR код уншуулж эсвэл банкаар шилжүүлнэ үү</p>

                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Төлөх дүн</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#FF6B00' }}>₮{pricing.data ? fmt(pricing.data.total_price) : '...'}</div>
                </div>

                {/* QR Image from TDB */}
                {paymentData?.qrImage ? (
                  <div style={{ marginBottom: 16 }}>
                    <img src={`data:image/png;base64,${paymentData.qrImage}`} alt="Payment QR" style={{ width: 220, height: 220, margin: '0 auto', display: 'block', borderRadius: 8 }} />
                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>Банкны аппаар QR уншуулна уу</p>
                  </div>
                ) : paymentData?.account_details ? (
                  <div style={{ background: '#F0FDF4', borderRadius: 10, padding: 14, marginBottom: 16, textAlign: 'left', fontSize: 13 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: '#111' }}>Банк шилжүүлэг</div>
                    <div style={{ color: '#374151', lineHeight: 1.8 }}>
                      <div>Банк: <b>{paymentData.account_details.bank || 'ХХБ'}</b></div>
                      <div>Данс: <b>{paymentData.account_details.account_number}</b></div>
                      <div>Нэр: <b>{paymentData.account_details.account_name}</b></div>
                      <div>Гүйлгээний утга: <b>{paymentData.account_details.reference || paymentData.invoice_code}</b></div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 24, color: '#9CA3AF', fontSize: 13 }}>Төлбөрийн мэдээлэл ачааллаж байна...</div>
                )}

                {/* Polling indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', animation: 'pulse 1.5s infinite' }} />
                  <span style={{ fontSize: 12, color: '#6B7280' }}>Төлбөр хүлээж байна...</span>
                </div>

                <button onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setPaymentStatus('idle'); setPaymentData(null) }}
                  style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>
                  Буцах
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function BusinessCardEditorPage() {
  return <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Ачааллаж байна...</div>}><EditorInner /></Suspense>
}

