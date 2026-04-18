'use client'
import { useRouter } from 'next/navigation'

const F = "'DM Sans','Segoe UI',system-ui,sans-serif"

const SECTIONS = [
  {
    title: '1. Ерөнхий нөхцөл',
    body: `BizPrint платформыг ашигласнаар та энэхүү үйлчилгээний нөхцөлийг бүрэн хүлээн зөвшөөрч байна. Хэрэв та эдгээр нөхцөлтэй санал нийлэхгүй бол платформыг ашиглахаа зогсооно уу.

BizPrint нь Монгол Улсын хуулийн дагуу үйл ажиллагаагаа явуулдаг хэвлэлийн үйлчилгээний онлайн платформ юм.`,
  },
  {
    title: '2. Бүртгэл ба хаягийн аюулгүй байдал',
    body: `Та өөрийн бүртгэлийн мэдээллийн нууцлалыг хариуцна. Бусдад хандах эрх олгохгүй байх, бүртгэлийн аюулгүй байдлыг хангах үүрэг та өөрт байна.

Та үнэн зөв мэдээлэл оруулах үүрэгтэй. Буруу мэдээлэл оруулсан тохиолдолд захиалгын алдагдлыг BizPrint хариуцахгүй.`,
  },
  {
    title: '3. Захиалга ба төлбөр',
    body: `Захиалга хийснийхээ дараа та заасан хугацаанд төлбөрөө төлөх үүрэгтэй. Төлбөр хийгдээгүй захиалга 48 цагийн дараа автоматаар цуцлагдана.

Үнэ нь VAT (НӨАТ)-ыг багтаасан байна. Тусгай хөнгөлөлт авахын тулд sales@bizprint.mn хаягаар холбоо барина уу.`,
  },
  {
    title: '4. Хүргэлтийн нөхцөл',
    body: `Захиалга баталгаажсан өдрөөс эхлэн хэвлэлийн 3–7 ажлын өдрийн дотор бэлтгэгдэнэ. Хүргэлтийн хугацаа байршлаас хамаарч өөр байж болно.

Хүргэлтийн явцыг та бүртгэлдээ нэвтрэн хянах боломжтой. Хүргэлтийн асуудал гарвал 24 цагийн дотор info@bizprint.mn-д мэдэгдэнэ үү.`,
  },
  {
    title: '5. Буцаалт ба буцаан олголт',
    body: `Хэвлэлийн бүтээгдэхүүний онцлогоос шалтгаалан захиалга баталгаажсаны дараа цуцлах боломжгүй.

Зөвхөн дараах тохиолдолд буцаалт хийгдэнэ:
• Манай талаас буруу хэвлэсэн тохиолдолд
• Бүтээгдэхүүн гэмтэлтэй ирсэн тохиолдолд
• Захиалгатай таарахгүй бүтээгдэхүүн хүргэгдсэн тохиолдолд

Буцаалтыг хүлээн авсан өдрөөс хойш 3 ажлын өдрийн дотор шийдвэрлэнэ.`,
  },
  {
    title: '6. Оюуны өмч',
    body: `Та байршуулж буй дизайн файл, зураг, контент нь өөрийн бүтээл эсвэл эзэмших эрхтэй гэдгийг баталгаажуулна.

Бусдын оюуны өмчийн эрхийг зөрчсөн контент байршуулсан тохиолдолд бүх хариуцлагыг захиалагч хариуцна. BizPrint хариуцлага хүлээхгүй.`,
  },
  {
    title: '7. Хувийн мэдээлэл',
    body: `Таны оруулсан хувийн мэдээллийг зөвхөн захиалга боловсруулах, хүргэлт хийх, харилцагчтай холбоо барихад ашиглана.

Таны мэдээллийг гуравдагч этгээдэд зарахгүй, дамжуулахгүй. Дэлгэрэнгүй мэдээлэл авахыг хүсвэл privacy@bizprint.mn-д хандана уу.`,
  },
  {
    title: '8. Хориглосон үйлдлүүд',
    body: `Дараах үйлдлийг хориглоно:
• Хууль бус буюу ёс суртахуунд нийцэхгүй контент хэвлэх
• Бусдын оюуны өмч, брэндийг зөвшөөрөлгүй ашиглах
• Платформын техникийн системд халдах, эвдэх оролдлого хийх
• Бусад хэрэглэгчдийн бүртгэлд зөвшөөрөлгүй нэвтрэх

Зөрчил гарвал бид бүртгэлийг цуцлах эрхтэй.`,
  },
  {
    title: '9. Нөхцөл өөрчлөлт',
    body: `BizPrint нь энэхүү үйлчилгээний нөхцөлийг урьдчилан мэдэгдэлгүйгээр өөрчлөх эрхтэй. Өөрчлөлт гарсан тохиолдолд платформд мэдэгдэл гарна.

Өөрчлөлтийн дараа платформыг үргэлжлүүлэн ашигласнаар та шинэ нөхцөлийг хүлээн зөвшөөрсөн гэж үзнэ.`,
  },
  {
    title: '10. Холбоо барих',
    body: `Үйлчилгээний нөхцөлтэй холбоотой асуулт байвал:

📧 Имэйл: legal@bizprint.mn
📞 Утас: +976 7700-0000
📍 Хаяг: Улаанбаатар хот, Сүхбаатар дүүрэг

Ажлын цаг: Даваа–Баасан, 09:00–18:00`,
  },
]

export default function TermsPage() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: F }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 20, display: 'flex', alignItems: 'center' }}
          >
            ←
          </button>
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>
            <a href="/" style={{ color: '#FF6B00', textDecoration: 'none', fontWeight: 500 }}>BizPrint</a>
            {' / '}Үйлчилгээний нөхцөл
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        {/* Title */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 8, padding: '5px 12px', marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: '#FF6B00', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Хуулийн баримт бичиг</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', margin: '0 0 12px', lineHeight: 1.2 }}>
            Үйлчилгээний нөхцөл
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text2)', margin: 0, lineHeight: 1.6 }}>
            Сүүлчийн шинэчлэл: 2026 оны 1-р сарын 1 · BizPrint LLC-ийн хэвлэлийн платформ ашиглах нөхцөл, журам
          </p>
        </div>

        {/* Summary box */}
        <div style={{ background: 'rgba(255,107,0,0.04)', border: '1px solid rgba(255,107,0,0.15)', borderRadius: 16, padding: '20px 24px', marginBottom: 40 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#FF6B00', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Товч тайлбар</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              '✅ Захиалга хийснийхээ дараа 48 цагт төлбөр хийнэ',
              '✅ Байршуулах контент таны өмч байна',
              '✅ Хувийн мэдээллийг гуравдагч этгээдэд дамжуулахгүй',
              '✅ Хэвлэлийн алдааг бид бүрэн хариуцна',
              '⚠️ Баталгаажсан захиалгыг цуцлах боломжгүй',
            ].map((line, i) => (
              <div key={i} style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{line}</div>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {SECTIONS.map((section, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 14px' }}>
                {section.title}
              </h2>
              <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {section.body}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 48, padding: '24px', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16 }}>
            Асуулт байвал бидэнтэй холбоо барина уу
          </div>
          <a
            href="/contact"
            style={{ display: 'inline-block', background: '#FF6B00', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 600, fontSize: 14 }}
          >
            Холбоо барих →
          </a>
          <div style={{ marginTop: 20, fontSize: 12, color: 'var(--text3)' }}>
            © 2026 BizPrint LLC · Монгол Улс · Бүх эрх хуулиар хамгаалагдсан
          </div>
        </div>
      </div>
    </div>
  )
}
