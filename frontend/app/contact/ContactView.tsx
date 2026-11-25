'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { brand } from '@/components/site/content'

const HOURS = [
  { d: 'Даваа – Баасан', t: '09:00 – 18:00', open: true },
  { d: 'Бямба, Ням', t: 'Амарна · онлайн захиалга авна', open: false },
]
const SOCIAL = [
  { label: 'Facebook', handle: 'bizprintpro', href: 'https://www.facebook.com/bizprintpro', bg: 'bg-[#1877F2]',
    icon: <path d="M14 8h3V4h-3c-2.8 0-4 1.8-4 4.3V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.2-.6.6-.6Z" /> },
  { label: 'Messenger', handle: 'm.me/bizprintpro', href: 'https://m.me/bizprintpro', bg: 'bg-gradient-to-br from-[#00B2FF] to-[#A033FF]',
    icon: <path d="M12 2C6.4 2 2 6.1 2 11.3c0 2.9 1.4 5.5 3.7 7.2V22l3.4-1.9c.9.3 1.9.4 2.9.4 5.6 0 10-4.1 10-9.2S17.6 2 12 2Zm1 12.4-2.5-2.7-5 2.7 5.5-5.8 2.6 2.7 4.9-2.7-5.5 5.8Z" /> },
  { label: 'Instagram', handle: '@bizprintpro25', href: 'https://www.instagram.com/bizprintpro25', bg: 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
    icon: <path d="M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM21 7.9c-.1-1.6-.4-3-1.6-4.1C18.2 2.6 16.8 2.3 15.2 2.2 13.5 2.1 10.5 2.1 8.8 2.2c-1.6.1-3 .4-4.1 1.6C3.5 4.9 3.2 6.3 3.1 7.9 3 9.6 3 14.4 3.1 16.1c.1 1.6.4 3 1.6 4.1 1.2 1.2 2.5 1.5 4.1 1.6 1.7.1 6.7.1 8.4 0 1.6-.1 3-.4 4.1-1.6 1.2-1.2 1.5-2.5 1.6-4.1.1-1.7.1-6.5 0-8.2Zm-2 9.9a3 3 0 0 1-1.7 1.7c-1.2.5-4 .4-5.3.4s-4.1.1-5.3-.4a3 3 0 0 1-1.7-1.7c-.5-1.2-.4-4-.4-5.3s-.1-4.1.4-5.3a3 3 0 0 1 1.7-1.7c1.2-.5 4-.4 5.3-.4s4.1-.1 5.3.4a3 3 0 0 1 1.7 1.7c.5 1.2.4 4 .4 5.3s.1 4.1-.4 5.3Z" /> },
]

/** Улаанбаатарын цагаар одоо ажиллаж байгаа эсэх */
function useOpenNow() {
  const [s, setS] = useState<{ open: boolean; label: string } | null>(null)
  useEffect(() => {
    const calc = () => {
      const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ulaanbaatar', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date())
      const g = (t: string) => p.find((x) => x.type === t)?.value || ''
      const wd = g('weekday'); const m = Number(g('hour')) * 60 + Number(g('minute'))
      const weekday = !['Sat', 'Sun'].includes(wd)
      const open = weekday && m >= 540 && m < 1080
      setS({ open, label: open ? `Одоо нээлттэй · 18:00 хүртэл` : weekday && m < 540 ? 'Өнөөдөр 09:00-д нээгдэнэ' : 'Одоо хаалттай · онлайнаар захиалаарай' })
    }
    calc(); const id = setInterval(calc, 60_000); return () => clearInterval(id)
  }, [])
  return s
}

function Icon({ d, className = 'h-5 w-5' }: { d: string; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}><path d={d} /></svg>
}
const I = {
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2Z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm18 2-10 7L2 6',
  pin: 'M12 21s-7-6.3-7-11.5A7 7 0 0 1 19 9.5C19 14.7 12 21 12 21Zm0-8.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-15v5l3 2',
  chat: 'M21 12a8.4 8.4 0 0 1-12.3 7.4L3 21l1.6-5.7A8.4 8.4 0 1 1 21 12Z',
  nav: 'M3 11 22 2l-9 19-2-8-8-2Z',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
}

export default function ContactView({ lat, lng }: { lat: number; lng: number }) {
  const status = useOpenNow()
  const [copied, setCopied] = useState(false)
  const mapEmbed = `https://maps.google.com/maps?q=${lat},${lng}&z=17&hl=mn&output=embed`
  const mapOpen = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  const mapDir = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  const openChat = () => window.dispatchEvent(new Event('bizprint:open-chat'))
  const copy = async () => {
    try { await navigator.clipboard.writeText(brand.address); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {}
  }

  const actions = [
    { k: 'Утас', v: brand.phone, sub: 'Ажлын цагаар шууд холбогдоно', href: brand.phoneHref, icon: I.phone, tone: 'from-[#FF6B00] to-[#FF9A3D]' },
    { k: 'Имэйл', v: brand.email, sub: 'Файл, үнийн санал илгээх', href: `mailto:${brand.email}`, icon: I.mail, tone: 'from-[#8B5CF6] to-[#B794FF]' },
    { k: 'Онлайн чат', v: 'Одоо асуух', sub: 'Үнэ, хугацаа, захиалга', onClick: openChat, icon: I.chat, tone: 'from-[#FF6B00] to-[#8B5CF6]' },
  ]

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0F0B1E] text-white">
        <div className="pointer-events-none absolute -left-24 -top-32 h-[420px] w-[420px] rounded-full bg-[#FF6B00]/35 blur-[110px]" />
        <div className="pointer-events-none absolute -right-20 top-10 h-[460px] w-[460px] rounded-full bg-[#8B5CF6]/40 blur-[120px]" />
        <div className="relative mx-auto max-w-[1440px] px-5 pb-14 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pb-20">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[12px] font-medium uppercase tracking-[0.12em] text-white/80">
            <span className={`h-2 w-2 rounded-full ${status?.open ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {status ? status.label : 'Холбоо барих'}
          </p>
          <h1 className="max-w-3xl !text-white">Бидэнтэй холбогдоорой.</h1>
          <p className="mt-5 max-w-xl text-[15px] leading-[1.65] text-white/70 sm:text-[17px]">
            Хэвлэлийн захиалга, үнийн санал, файл бэлтгэл — утсаар, чатаар эсвэл оффис дээр ирж уулзаарай. Логос Төвийн 7 давхарт байрладаг.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {actions.map((a) => {
              const inner = (
                <>
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${a.tone} text-white shadow-lg`}>
                    <Icon d={a.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] uppercase tracking-[0.1em] text-white/55">{a.k}</span>
                    <span className="block truncate text-[19px] font-semibold text-white">{a.v}</span>
                    <span className="block text-[13px] text-white/55">{a.sub}</span>
                  </span>
                  <span className="text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-white"><Icon d={I.arrow} /></span>
                </>
              )
              const cls = 'group flex w-full items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-left backdrop-blur transition-colors hover:border-white/25 hover:bg-white/[0.1]'
              return a.href
                ? <a key={a.k} href={a.href} className={cls}>{inner}</a>
                : <button key={a.k} type="button" onClick={a.onClick} className={cls}>{inner}</button>
            })}
          </div>
        </div>
      </section>

      {/* MAP + INFO */}
      <section className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="relative min-h-[420px] overflow-hidden rounded-[28px] bg-gray-100 ring-1 ring-gray-200 lg:min-h-[560px]">
            <iframe
              src={mapEmbed}
              title="BizPrint байршил — Google Maps"
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-start p-4 sm:p-5">
              <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-white/95 p-3 pr-4 shadow-[0_12px_40px_rgba(17,24,39,0.18)] backdrop-blur">
                <img src="/brand/bizprint-mark-256.png" alt="" width={44} height={44} className="h-11 w-11 rounded-xl" />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-gray-900">BizPrint · Логос Төв, 701 тоот</p>
                  <p className="truncate text-[12px] text-gray-500">Лааганы гудамж, Чингэлтэй дүүрэг</p>
                </div>
                <a href={mapDir} target="_blank" rel="noopener noreferrer"
                  className="ml-1 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#FF6B00] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[#e65f00]">
                  <Icon d={I.nav} className="h-4 w-4" /> Чиглэл
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-[28px] border border-gray-200 p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]"><Icon d={I.pin} /></span>
                <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-gray-500">Хаяг</p>
              </div>
              <p className="text-[17px] font-semibold leading-snug text-gray-900">{brand.address}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-gray-600">Засгийн газрын авто баазын баруун талд, 50-р сургуулийн ойролцоо. Логос Төвийн 7 давхар.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a href={mapOpen} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-black">
                  Google Maps-д нээх
                </a>
                <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-[13px] text-gray-800 hover:border-gray-400">
                  <Icon d={I.copy} className="h-4 w-4" /> {copied ? 'Хуулагдлаа' : 'Хаяг хуулах'}
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-gray-200 p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-[#8B5CF6]"><Icon d={I.clock} /></span>
                <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-gray-500">Ажлын цаг</p>
              </div>
              <ul className="divide-y divide-gray-100">
                {HOURS.map((h) => (
                  <li key={h.d} className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
                    <span className="text-gray-600">{h.d}</span>
                    <span className={h.open ? 'font-semibold text-gray-900' : 'text-right text-gray-500'}>{h.t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[28px] bg-gradient-to-br from-[#FF6B00] to-[#8B5CF6] p-6 text-white">
              <p className="text-[19px] font-semibold leading-snug">Үнэ мэдэх үү?</p>
              <p className="mt-1 text-[14px] text-white/80">Хэмжээ, тоогоо оруулаад НӨАТ орсон үнээ шууд харна.</p>
              <Link href="/quote" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[14px] font-semibold text-gray-900 hover:bg-white/90">
                Үнэ тооцоолох <Icon d={I.arrow} className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOW TO GET HERE + SOCIAL */}
      <section className="bg-[#F6F5FA]">
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[440px_minmax(0,1fr)] lg:gap-16 lg:px-12 lg:py-20">
          <img src="/contact/bizprint-location.jpg" alt="BizPrint хаяг, байршил — Логос Төв 701 тоот" width={720} height={900}
            className="mx-auto w-full max-w-[440px] rounded-[28px] shadow-[0_24px_60px_rgba(17,24,39,0.15)]" />
          <div>
            <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.1em] text-gray-500">Хэрхэн ирэх вэ</p>
            <h2 className="text-[34px] font-semibold leading-tight text-gray-900 sm:text-[44px]">Логос Төв, 7 давхар — 701 тоот.</h2>
            <ol className="mt-8 space-y-4">
              {[
                ['Лааганы гудамж', 'Чингэлтэй дүүргийн 6-р хороо, Засгийн газрын авто баазын баруун талд.'],
                ['Логос Төв', 'Дээвэр дээрээ «LOGOS» бичигтэй цэнхэр шилэн барилга. Лифтээр 7 давхарт гарна.'],
                ['701 тоот', 'Захиалгаа ирж авах, дээж харах, файлаа өгөх боломжтой. Ирэхээсээ өмнө залгаарай.'],
              ].map(([t, s], i) => (
                <li key={t} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[14px] font-semibold text-white">{i + 1}</span>
                  <div>
                    <p className="text-[16px] font-semibold text-gray-900">{t}</p>
                    <p className="text-[14px] leading-relaxed text-gray-600">{s}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="mb-3 mt-10 text-[12px] font-medium uppercase tracking-[0.1em] text-gray-500">Сошиал</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {SOCIAL.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-gray-200 transition-shadow hover:shadow-md">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${s.bg}`}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">{s.icon}</svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-gray-900">{s.label}</span>
                    <span className="block truncate text-[12px] text-gray-500">{s.handle}</span>
                  </span>
                </a>
              ))}
            </div>
            <p className="mt-6 text-[13px] text-gray-500">{brand.company} · {brand.name}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
