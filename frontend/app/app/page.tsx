import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BizPrint Desktop — компьютерын апп | BizPrint',
  description:
    'Word, Illustrator, Photoshop, CorelDRAW-оос шууд хэвлэлийн захиалга. BP өнгөний каталог дизайны програмд, BizPrint хавтас, нэг товчоор дахин захиалах. Windows-д үнэгүй.',
}

const REPO = 'bizprintpro-alt/bizprint-desktop'
const RELEASES = `https://github.com/${REPO}/releases/latest`

type Release = { tag_name: string; published_at: string; assets: { name: string; browser_download_url: string; size: number }[] }

/** Хамгийн сүүлийн суулгагч (GitHub release) — цаг тутам шинэчилнэ; олдохгүй бол release хуудас руу */
async function latest() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { accept: 'application/vnd.github+json' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const r = (await res.json()) as Release
    const exe = r.assets.find((a) => /^BizPrint-Setup-.*\.exe$/.test(a.name))
    if (!exe) return null
    return { version: r.tag_name.replace(/^v/, ''), url: exe.browser_download_url, mb: Math.round(exe.size / 1048576), date: r.published_at }
  } catch {
    return null
  }
}

const FEATURES = [
  {
    icon: '🖨️',
    title: 'Аль ч програмаас Print → BizPrint',
    desc: 'Word, Excel, Illustrator, Photoshop, CorelDRAW — Print цэснээс "BizPrint" принтер сонгоход захиалга бөглөгдөж нээгдэнэ. Файл хөрвүүлж, сайтад оруулах шаардлагагүй.',
  },
  {
    icon: '🎨',
    title: 'BP өнгө дизайны програмд',
    desc: 'BP-R101 гэх мэт BizPrint-ийн бүх өнгийг Adobe, Corel-д spot өнгөөр суулгана. Тэр өнгөөрөө зурвал аль ч цех, аль ч принтер дээр ижилхэн хэвлэгдэнэ.',
  },
  {
    icon: '📁',
    title: 'BizPrint хавтас',
    desc: 'Documents\\BizPrint\\Захиалга\\DTF хэвлэл\\ гэх мэт хавтсанд файлаа хуулахад захиалга бэлэн. Нэрэнд BP-R101 бичвэл өнгө ч сонгогдоно.',
  },
  {
    icon: '🔁',
    title: 'Нэг товчоор дахин захиалах',
    desc: 'Өмнөх захиалгаа ижил файл, өнгө, тоо ширхэгээр нэг товчоор давтана. Байнгын хэвлэлтэй компаниудад цаг хэмнэнэ.',
  },
  {
    icon: '⚡',
    title: 'Төлбөрөөс принтер хүртэл автомат',
    desc: 'QR-оор төлмөгц файл автоматаар шалгагдаж, өнгөнд тохирох принтер рүү очно. Явц бодит цагаар харагдана.',
  },
  {
    icon: '🌐',
    title: 'bizprint.mn бүхэлдээ дотор нь',
    desc: 'Дэлгүүр, үнийн санал, нэрийн хуудасны editor, загвар, дизайнер — нэг бүртгэлээр, дахин нэвтрэхгүй.',
  },
]

const STEPS = [
  ['Татаж суулгах', 'Доорх товчийг дарж суулгагчийг ажиллуулна. Windows "танихгүй хэвлэгч" гэж анхааруулбал "More info → Run anyway".'],
  ['bizprint.mn бүртгэлээрээ нэвтрэх', 'Сайтын имэйл/утас, нууц үгээрээ. Бүртгэлгүй бол аппаас шууд бүртгүүлнэ.'],
  ['Принтер ба өнгө суулгах', 'Анхны танилцуулгаас нэг товчоор BizPrint принтер, BP өнгө, хавтсаа идэвхжүүлнэ.'],
] as const

const card: React.CSSProperties = { padding: 22, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)' }

export default async function DesktopAppPage() {
  const rel = await latest()
  const href = rel?.url ?? RELEASES
  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '48px 16px 64px', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      {/* Hero */}
      <section style={{ textAlign: 'center', marginBottom: 48 }}>
        <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 99, background: 'rgba(255,107,0,0.1)', color: '#FF6B00', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          Windows · үнэгүй
        </span>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, color: 'var(--text)', marginBottom: 12, lineHeight: 1.2 }}>
          Хэвлэх товч дарахад л<br />захиалга бэлэн
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text3)', maxWidth: 620, margin: '0 auto 28px', lineHeight: 1.7 }}>
          BizPrint Desktop нь таны компьютерт BizPrint принтер суулгаж, дизайны програмуудад BP өнгийг нэмнэ. Ажиллаж буй програмаасаа гаралгүй захиалж,
          өнгө яг таарсан хэвлэл авна.
        </p>
        <a
          href={href}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px', borderRadius: 12, background: '#FF6B00', color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 24px rgba(255,107,0,0.25)' }}
        >
          ⬇ Windows-д татах{rel ? ` (${rel.version})` : ''}
        </a>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 12 }}>
          Windows 10/11 (64-бит){rel ? ` · ${rel.mb} MB · ${new Date(rel.date).toLocaleDateString('mn-MN')}` : ''} · Шинэ хувилбар гармагц апп өөрөө шинэчлэгдэнэ
        </p>
      </section>

      {/* Яагаад апп */}
      <section style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 20, textAlign: 'center' }}>Вэбээс юугаараа ялгаатай вэ?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={card}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Суулгах алхам */}
      <section style={{ marginBottom: 56 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 20, textAlign: 'center' }}>3 алхмаар эхэлнэ</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 16 }}>
          {STEPS.map(([t, d], i) => (
            <div key={t} style={card}>
              <div style={{ width: 32, height: 32, borderRadius: 99, background: 'rgba(255,107,0,0.12)', color: '#FF6B00', fontWeight: 800, display: 'grid', placeItems: 'center', marginBottom: 10 }}>{i + 1}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{t}</h3>
              <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, margin: 0 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Цех / үйлдвэр */}
      <section style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: '1 1 320px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Хэвлэлийн үйлдвэр үү?</h3>
          <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, margin: 0 }}>
            Мөн энэ апп таны RIP-ийн hotfolder руу BizPrint-ийн захиалгыг автоматаар хүргэнэ (JDF тасалбартай). Үйлдвэрийн эрхээр нэвтрэхэд цехийн агент нээгдэнэ.
          </p>
        </div>
        <a href="/partner" style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
          Партнер болох →
        </a>
      </section>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 24 }}>
        Бүх хувилбар: <a href={RELEASES.replace(/\/latest$/, '')} style={{ color: '#FF6B00' }}>GitHub releases</a>
      </p>
    </div>
  )
}
