'use client'
import { useState } from 'react'
import type { Metadata } from 'next'
import Head from 'next/head'

const CATEGORIES = [
  { key: 'order', label: 'Захиалга', icon: '📦' },
  { key: 'payment', label: 'Төлбөр', icon: '💳' },
  { key: 'delivery', label: 'Хүргэлт', icon: '🚚' },
  { key: 'file', label: 'Файл', icon: '📁' },
  { key: 'price', label: 'Үнэ', icon: '💰' },
  { key: 'other', label: 'Бусад', icon: '❓' },
]

const FAQ_DATA: { category: string; q: string; a: string }[] = [
  // Захиалга
  { category: 'order', q: 'Хэрхэн захиалга өгөх вэ?', a: 'Бүтээгдэхүүн сонгоод, файлаа оруулж, тоо ширхэг зааж захиалга өгнө. AI автоматаар үнэ тооцоолж, хамгийн тохиромжтой үйлдвэрийг сонгоно.' },
  { category: 'order', q: 'Захиалгын хамгийн бага тоо хэд вэ?', a: 'Бүтээгдэхүүнээс хамааран ялгаатай. Нэрийн хуудас 50 ширхэгээс, флаер 100 ширхэгээс, баннер 1 ширхэгээс захиалж болно.' },
  { category: 'order', q: 'Захиалгаа хэрхэн хянах вэ?', a: 'Захиалга өгсний дараа Dashboard → Захиалгууд хэсгээс бодит цагийн статусыг хянах боломжтой.' },
  { category: 'order', q: 'Захиалга цуцлах боломжтой юу?', a: 'Хэвлэлд ороогүй бол захиалга цуцлах боломжтой. Хэвлэж эхэлсэн бол цуцлах боломжгүй.' },
  // Төлбөр
  { category: 'payment', q: 'Ямар төлбөрийн хэрэгсэл хүлээн авдаг вэ?', a: 'Банкны шилжүүлэг, QR код (QPay, SocialPay), бэлэн мөнгө зэрэг бүх төлбөрийн хэрэгслийг хүлээн авна.' },
  { category: 'payment', q: 'Төлбөр буцаалт хэрхэн хийх вэ?', a: 'Чанарын алдаа илэрсэн тохиолдолд 48 цагийн дотор буцаалт хүсэлт гаргаж болно. Баталгаажсаны дараа 3-5 ажлын өдөрт буцаалт хийгдэнэ.' },
  { category: 'payment', q: 'НӨАТ-тэй юу?', a: 'Тийм, бүх үнэ НӨАТ-тай (10%) үнээр харагдана. Нэхэмжлэх Dashboard-аас татаж авах боломжтой.' },
  { category: 'payment', q: 'Escrow төлбөр гэж юу вэ?', a: 'Захиалагч төлбөрөө BizPrint-д хадгалуулна. Захиалга хүргэгдсэний дараа 48-72 цагийн дотор үйлдвэрт шилжүүлнэ.' },
  // Хүргэлт
  { category: 'delivery', q: 'Хүргэлт хэдэн өдөр болдог вэ?', a: 'Улаанбаатар хотод 1-3 ажлын өдөр. Хөдөө орон нутагт 3-7 ажлын өдөр.' },
  { category: 'delivery', q: 'Хүргэлтийн төлбөр хэд вэ?', a: 'Улаанбаатар хотод 5,000₮-аас. 50,000₮-с дээш захиалгад хүргэлт үнэгүй.' },
  { category: 'delivery', q: 'Хүргэлтийг хянах боломжтой юу?', a: 'Тийм, Dashboard → Хүргэлт хэсгээс бодит цагаар хянах боломжтой. SMS мэдэгдэл ч илгээнэ.' },
  { category: 'delivery', q: 'Хөдөө орон нутагт хүргэж чадах уу?', a: 'Тийм, бүх аймгийн төв рүү хүргэлт хийнэ. Шуудангаар эсвэл автобусаар илгээнэ.' },
  // Файл
  { category: 'file', q: 'Ямар файлын формат хүлээн авдаг вэ?', a: 'PDF (зөвлөмж), AI, EPS, PSD, PNG, JPG. Хэвлэлд зориулсан PDF/X-1a формат хамгийн тохиромжтой.' },
  { category: 'file', q: 'Файлын хамгийн их хэмжээ хэд вэ?', a: 'Нэг файлд 50MB хүртэл. Том файл бол Google Drive/Dropbox линк илгээж болно.' },
  { category: 'file', q: 'Файл шалгалт хийдэг үү?', a: 'Тийм, AI Prepress систем автоматаар файлын чанар, нягтрал, өнгө, bleed зэргийг шалгана.' },
  { category: 'file', q: 'Дизайн хийлгэх боломжтой юу?', a: 'Тийм, манай Creator Marketplace-аас мэргэжлийн дизайнер хөлслөж болно.' },
  // Үнэ
  { category: 'price', q: 'Үнийн санал хэрхэн авах вэ?', a: 'AI Үнэ тооцоолуур ашиглан секундэд үнэ авах боломжтой. Эсвэл захиалга өгөхөд автоматаар үнэ тооцоолно.' },
  { category: 'price', q: 'Хөнгөлөлт байдаг уу?', a: 'Тийм, олон тоо захиалахад хөнгөлөлт автоматаар тооцоогдоно. Loyalty программд бүртгүүлсэн бол нэмэлт хөнгөлөлт авна.' },
  { category: 'price', q: 'Үнэ яагаад өөр өөр байдаг вэ?', a: 'Материал, хэмжээ, тоо ширхэг, цаасны төрөл, хэвлэлийн аргаас хамааран үнэ ялгаатай.' },
  { category: 'price', q: 'Хамгийн хямд хэвлэл юу вэ?', a: 'Дижитал хэвлэл (флаер, постер) хамгийн хямд. Офсет хэвлэл олон тоонд илүү хямд.' },
  // Бусад
  { category: 'other', q: 'BizPrint гэж юу вэ?', a: 'BizPrint бол Монголын анхны AI-д суурилсан хэвлэлийн B2B marketplace платформ юм.' },
  { category: 'other', q: 'Партнер болох боломжтой юу?', a: 'Тийм, үйлдвэр, дизайнер, хүргэлтийн компани бүгд партнер болж болно. /partner хуудаснаас бүртгүүлнэ.' },
  { category: 'other', q: 'Аюулгүй байдал хэрхэн хангадаг вэ?', a: 'SSL шифрлэлт, JWT токен, escrow төлбөр, KYC баталгаажуулалт зэргээр аюулгүй байдлыг хангана.' },
  { category: 'other', q: 'Утсаар захиалга өгөх боломжтой юу?', a: 'Тийм, bizprint.mn сайт утасны browser-д бүрэн тохирсон. Мөн +976 9911-1111 дугаараар залгаж болно.' },
]

export default function FaqPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const filtered = FAQ_DATA.filter(f => {
    const matchSearch = !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
    const matchCat = !activeCategory || f.category === activeCategory
    return matchSearch && matchCat
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_DATA.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 20px', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Түгээмэл <span style={{ color: '#FF6B00' }}>асуулт</span></h1>
        <p style={{ fontSize: 14, color: 'var(--text3)' }}>Хариулт олдохгүй бол бидэнтэй холбогдоорой</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Асуулт хайх..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 14, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
        />
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🔍</span>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => setActiveCategory(null)} style={{ padding: '8px 16px', borderRadius: 99, border: '1px solid var(--border)', background: !activeCategory ? '#FF6B00' : 'var(--surface)', color: !activeCategory ? '#fff' : 'var(--text2)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          Бүгд
        </button>
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setActiveCategory(activeCategory === c.key ? null : c.key)} style={{ padding: '8px 16px', borderRadius: 99, border: '1px solid var(--border)', background: activeCategory === c.key ? '#FF6B00' : 'var(--surface)', color: activeCategory === c.key ? '#fff' : 'var(--text2)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Accordion */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🤔</div>
            <p>Хайлтад тохирох асуулт олдсонгүй</p>
          </div>
        )}
        {filtered.map((f, i) => {
          const isOpen = openIdx === i
          return (
            <div key={i} style={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', overflow: 'hidden' }}>
              <button onClick={() => setOpenIdx(isOpen ? null : i)} style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flex: 1, paddingRight: 12 }}>{f.q}</span>
                <span style={{ fontSize: 18, color: 'var(--text3)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
              </button>
              {isOpen && (
                <div style={{ padding: '0 20px 16px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  {f.a}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Contact CTA */}
      <div style={{ textAlign: 'center', marginTop: 40, padding: 32, borderRadius: 16, background: 'rgba(255,107,0,0.05)', border: '1px solid rgba(255,107,0,0.2)' }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Хариулт олдсонгүй юу?</p>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Бидэнтэй холбогдоорой</p>
        <a href="tel:+97699111111" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 10, background: '#FF6B00', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>📞 +976 9911-1111</a>
      </div>
    </div>
  )
}
