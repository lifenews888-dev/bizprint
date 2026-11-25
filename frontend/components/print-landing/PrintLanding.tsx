'use client'

import { Component, useEffect, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import './print-landing.css'
import { ArrowRight, Clock, Menu, X, Phone, Mail, MapPin } from 'lucide-react'
import { brand, nav, hero, about, products, work, contact } from './content'

const EASE = 'ease-[cubic-bezier(0.25,0.1,0.25,1)]'
const ORANGE = '#FF6B00' // BizPrint брэнд өнгө
const HeroShader = dynamic(() => import('./HeroShader'), { ssr: false })

/* ---------- жижиг туслах компонентууд ---------- */

/** Фоны shader ачаалагдахгүй / WebGPU байхгүй үед хуудсыг унагахгүй */
class SafeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function useUbTime() {
  const fmt = () =>
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Ulaanbaatar',
    }).format(new Date())
  const [time, setTime] = useState('--:--')
  useEffect(() => {
    setTime(fmt())
    const id = setInterval(() => setTime(fmt()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

function RollText({ children, h = 'h-[20px]' }: { children: ReactNode; h?: string }) {
  return (
    <span className={`relative flex flex-col overflow-hidden ${h}`}>
      <span className={`flex flex-col transition-transform duration-500 ${EASE} group-hover:-translate-y-1/2`}>
        <span className={`${h} flex items-center leading-none`}>{children}</span>
        <span className={`${h} flex items-center leading-none`} aria-hidden>
          {children}
        </span>
      </span>
    </span>
  )
}

function OrangeButton({ href, children, size = 'lg' }: { href: string; children: ReactNode; size?: 'sm' | 'lg' }) {
  return (
    <a
      href={href}
      style={{ backgroundColor: ORANGE }}
      className="group inline-flex w-fit items-center gap-3 rounded-full py-2 pl-5 pr-2 text-[13px] text-white transition-[filter] duration-300 hover:brightness-95 sm:pl-6 sm:text-[14px]"
    >
      <RollText>{children}</RollText>
      <span
        className={`flex items-center justify-center rounded-full bg-white ${size === 'lg' ? 'h-7 w-7 sm:h-8 sm:w-8' : 'h-6 w-6'}`}
      >
        <ArrowRight size={size === 'lg' ? 15 : 13} style={{ color: ORANGE }} className={`transition-transform duration-500 ${EASE} group-hover:-rotate-45`} />
      </span>
    </a>
  )
}

/** Зураг байхгүй бол брэнд өнгөтэй орлуулагч харуулна */
function ImageSlot({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed)
    return (
      <div className={`relative flex items-start overflow-hidden bg-gradient-to-br from-[#FF6B00] via-[#ff8a3d] to-[#7c3aed] p-4 ${className}`}>
        <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-gray-900">{alt}</span>
      </div>
    )
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
}

function Badge({ n, label, border = 'border-gray-200' }: { n: string; label: string; border?: string }) {
  return (
    <div className="mb-6 flex items-center gap-3 px-5 sm:mb-8 sm:px-8 lg:px-12">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-[11px] font-semibold text-white sm:h-7 sm:w-7 sm:text-[12px]">
        {n}
      </span>
      <span className={`rounded-full border ${border} px-3 py-1 text-[12px] font-medium text-gray-900 sm:px-4 sm:py-1.5 sm:text-[13px]`}>
        {label}
      </span>
    </div>
  )
}

function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((l, i) => (
        <span key={i}>
          {l}
          {i < lines.length - 1 && (
            <>
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
            </>
          )}
        </span>
      ))}
    </>
  )
}

function Starburst({ className = '' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className} aria-hidden>
      <path d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z" />
    </svg>
  )
}

/* ---------- 1. HERO ---------- */

function Hero() {
  const time = useUbTime()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#EFEFEF]">
      <div className="pointer-events-none absolute inset-0 z-10">
        <SafeBoundary>
          <HeroShader color={ORANGE} />
        </SafeBoundary>
      </div>

      {/* Цэс */}
      <header className="relative z-20 mx-auto w-full max-w-[1440px] p-2 sm:p-3">
        <nav className="flex items-center justify-between rounded-full bg-white p-[5px]">
          <div className="flex items-center gap-6">
            <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold tracking-tight text-white sm:h-10 sm:w-10 sm:text-[11px]" aria-label={brand.name}>
              {brand.short}
            </a>
            <ul className="hidden items-center gap-6 md:flex">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="text-[14px] text-gray-900 transition-colors duration-300 hover:text-gray-500">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden items-center gap-5 md:flex">
            <span className="hidden text-[13px] text-gray-600 lg:inline">{hero.availability}</span>
            <span className="flex items-center gap-1.5 text-[13px] text-gray-600">
              <Clock size={14} /> {time} · Улаанбаатар
            </span>
            <a href={brand.orderHref} className="group flex items-center gap-3 rounded-full bg-gray-900 py-2 pl-5 pr-2 text-[13px] font-medium text-white">
              <RollText>{hero.navCta}</RollText>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                <ArrowRight size={13} className={`text-gray-900 transition-transform duration-500 ${EASE} group-hover:-rotate-45`} />
              </span>
            </a>
          </div>

          <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-[13px] font-medium text-white md:hidden" aria-expanded={open}>
            <Menu size={15} /> Цэс
          </button>
        </nav>
      </header>

      {/* Гар утасны цэс */}
      <div className={`fixed inset-0 z-50 md:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-black/60 transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute inset-x-0 bottom-0 mx-3 mb-3 rounded-2xl bg-white p-5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'translate-y-0' : 'translate-y-[110%]'}`}>
          <div className="mb-6 flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-[12px] text-gray-600">
              <Clock size={13} /> {time} · Улаанбаатар
            </span>
            <button onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-[13px] font-medium text-white">
              <X size={15} /> Хаах
            </button>
          </div>
          <ul className="mb-8 space-y-1">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} onClick={() => setOpen(false)} className="block py-1 text-[28px] font-medium leading-tight text-gray-900">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <OrangeButton href={brand.orderHref}>{hero.cta}</OrangeButton>
        </div>
      </div>

      {/* Hero агуулга */}
      <div className="flex-1" />
      <div className="relative z-20 mx-auto w-full max-w-[1440px] px-5 pb-14 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
        <p className="mb-5 text-[13px] tracking-wide text-gray-900 sm:mb-8 sm:text-[14px]">{hero.label}</p>
        <h1 className="text-[clamp(1.75rem,7vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-gray-900 sm:text-[clamp(2.5rem,5vw,4.2rem)]">
          <Lines lines={hero.headline} />
        </h1>
        <div className="mt-8 flex flex-col gap-4 sm:mt-12 sm:flex-row sm:items-center sm:gap-5">
          <OrangeButton href={brand.orderHref}>{hero.cta}</OrangeButton>
          <div className="flex w-fit items-center gap-2 rounded-[4px] bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
            <Starburst className="h-5 w-5 fill-current text-[#FF6B00] sm:h-6 sm:w-6" />
            <span className="text-[13px] font-medium text-gray-900 sm:text-[14px]">{hero.badge}</span>
            <span className="rounded bg-gray-900 px-1.5 py-0.5 text-[10px] text-white sm:px-2 sm:text-[11px]">{hero.badgeTag}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- 2. ABOUT ---------- */

function About() {
  const btn = <OrangeButton href="#contact">{about.cta}</OrangeButton>
  return (
    <section id="about" className="overflow-hidden bg-white pb-12 pt-16 sm:pb-16 sm:pt-20 lg:pb-24 lg:pt-32">
      <div className="mx-auto max-w-[1440px]">
        <Badge n={about.step} label={about.pill} />
        <h2 className="mb-12 px-5 text-[clamp(1.5rem,4vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.02em] text-gray-900 sm:mb-16 sm:px-8 lg:mb-28 lg:px-12">
          <Lines lines={about.headline} />
        </h2>

        {/* гар утас / таблет */}
        <div className="px-5 sm:px-8 lg:hidden">
          <p className="mb-6 text-[15px] font-medium leading-[1.6] text-gray-900 sm:text-[17px]">{about.paragraph.join(' ')}</p>
          {btn}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-5">
            <ImageSlot src={about.imageSmall} alt={about.imageSmallAlt} className="aspect-[438/346] w-full rounded-xl sm:w-[45%] sm:rounded-2xl" />
            <ImageSlot src={about.imageLarge} alt={about.imageLargeAlt} className="aspect-[900/600] w-full rounded-xl sm:w-[55%] sm:rounded-2xl" />
          </div>
        </div>

        {/* desktop */}
        <div className="hidden grid-cols-[26%_1fr_48%] items-end gap-6 px-12 lg:grid xl:gap-8">
          <ImageSlot src={about.imageSmall} alt={about.imageSmallAlt} className="aspect-[438/346] w-full self-end rounded-2xl" />
          <div className="flex justify-end self-start">
            <div>
              <p className="mb-8 whitespace-nowrap text-[16px] font-medium leading-[1.65] text-gray-900 xl:text-[18px]">
                {about.paragraph.map((l, i) => (
                  <span key={i}>
                    {l}
                    {i < about.paragraph.length - 1 && <br />}
                  </span>
                ))}
              </p>
              {btn}
            </div>
          </div>
          <ImageSlot src={about.imageLarge} alt={about.imageLargeAlt} className="aspect-[3/2] w-full self-end rounded-2xl" />
        </div>
      </div>
    </section>
  )
}

/* ---------- 3. БҮТЭЭГДЭХҮҮН (карусель) ---------- */

function Products() {
  const loop = [...products.items, ...products.items]
  return (
    <section id="products" className="overflow-hidden bg-white pb-16 pt-8 sm:pb-20 lg:pb-28">
      <div className="mx-auto max-w-[1440px]">
        <Badge n={products.step} label={products.pill} />
        <div className="mb-10 flex flex-col gap-6 px-5 sm:mb-14 sm:flex-row sm:items-end sm:justify-between sm:px-8 lg:px-12">
          <h2 className="text-[clamp(1.75rem,7vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-gray-900 sm:text-[clamp(2.5rem,5vw,4.2rem)]">{products.headline}</h2>
          <OrangeButton href="#contact">{products.cta}</OrangeButton>
        </div>
      </div>
      <div className="group/marquee relative">
        <div className="animate-marquee flex w-max gap-5 px-5">
          {loop.map((p, i) => (
            <a key={i} href="#contact" className="group w-[240px] shrink-0 sm:w-[280px]" aria-hidden={i >= products.items.length}>
              <div className="overflow-hidden rounded-2xl">
                <ImageSlot src={p.image} alt={p.title} className={`aspect-[4/5] w-full transition-transform duration-700 ${EASE} group-hover:scale-[1.04]`} />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-gray-900">{p.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-600">{p.note}</p>
            </a>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white sm:w-24" />
      </div>
    </section>
  )
}

/* ---------- 4. ХИЙСЭН АЖИЛ ---------- */

function WorkMedia({ video, poster, alt }: { video: string; poster: string; alt: string }) {
  const [videoFailed, setVideoFailed] = useState(false)
  if (!video || videoFailed) return <ImageSlot src={poster} alt={alt} className="h-full w-full" />
  return (
    <video src={video} poster={poster} autoPlay muted loop playsInline onError={() => setVideoFailed(true)} className="h-full w-full object-cover" />
  )
}

function Work() {
  return (
    <section id="work" className="bg-[#F5F5F5] pb-16 pt-16 sm:pb-20 sm:pt-20 lg:pb-28 lg:pt-28">
      <div className="mx-auto max-w-[1440px]">
        <Badge n={work.step} label={work.pill} border="border-gray-300" />
        <h2 className="mb-10 px-5 text-[clamp(1.75rem,7vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-gray-900 sm:mb-14 sm:px-8 sm:text-[clamp(2.5rem,5vw,4.2rem)] lg:mb-16 lg:px-12">
          {work.headline}
        </h2>
        <div className="grid grid-cols-1 gap-5 px-5 sm:gap-6 sm:px-8 md:grid-cols-2 lg:gap-7 lg:px-12">
          {work.cards.map((c) => (
            <article key={c.title}>
              <a href="#contact" className={`group relative block ${c.aspect} cursor-pointer overflow-hidden rounded-2xl ${c.dark ? 'bg-[#6b6b6b]' : 'bg-[#1a1d2e]'}`}>
                <WorkMedia video={c.video} poster={c.poster} alt={c.title} />
                <span
                  className={`absolute bottom-4 left-4 flex h-9 w-9 items-center justify-end overflow-hidden rounded-full pr-[11px] transition-all duration-300 ease-in-out group-hover:w-[160px] ${c.dark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
                >
                  <span className="absolute left-4 whitespace-nowrap text-[13px] font-medium opacity-0 transition-opacity delay-100 duration-300 group-hover:opacity-100">{c.button}</span>
                  <ArrowRight size={14} className="shrink-0 -rotate-45 transition-transform duration-300 group-hover:rotate-0" />
                </span>
              </a>
              <p className="mt-4 text-[13px] leading-relaxed text-gray-600 sm:text-[14px]">{c.description}</p>
              <h3 className="mt-1 text-[14px] font-semibold text-gray-900 sm:text-[15px]">{c.title}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- 5. ХОЛБОО БАРИХ ---------- */

function Contact() {
  return (
    <footer id="contact" className="bg-gray-900 text-white">
      <div className="mx-auto max-w-[1440px] px-5 pb-10 pt-16 sm:px-8 sm:pt-20 lg:px-12 lg:pt-28">
        <h2 className="text-[clamp(1.75rem,7vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] sm:text-[clamp(2.5rem,5vw,4.2rem)]">
          <Lines lines={contact.headline} />
        </h2>
        <p className="mt-6 max-w-xl text-[15px] leading-[1.6] text-gray-300 sm:text-[17px]">{contact.paragraph}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <a href={brand.phoneHref} className="group flex items-center gap-3 rounded-2xl bg-white/5 p-5 transition-colors hover:bg-white/10">
            <Phone size={18} style={{ color: ORANGE }} />
            <span>
              <span className="block text-[12px] text-gray-400">Утас</span>
              <span className="text-[17px] font-medium">{brand.phone}</span>
            </span>
          </a>
          <a href={`mailto:${brand.email}`} className="group flex items-center gap-3 rounded-2xl bg-white/5 p-5 transition-colors hover:bg-white/10">
            <Mail size={18} style={{ color: ORANGE }} />
            <span>
              <span className="block text-[12px] text-gray-400">Имэйл</span>
              <span className="text-[17px] font-medium">{brand.email}</span>
            </span>
          </a>
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-5">
            <MapPin size={18} className="shrink-0" style={{ color: ORANGE }} />
            <span>
              <span className="block text-[12px] text-gray-400">Хаяг</span>
              <span className="text-[14px] font-medium leading-snug">{brand.address}</span>
            </span>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[10px] font-bold tracking-tight text-gray-900">{brand.short}</span>
            <span className="text-[13px] text-gray-400">
              © {new Date().getFullYear()} {brand.name} · {brand.company}
            </span>
          </div>
          <ul className="flex flex-wrap gap-5">
            {contact.socials.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noreferrer" className="text-[13px] text-gray-300 transition-colors hover:text-white">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

export default function PrintLanding() {
  return (
    <main className="print-landing bg-white font-sans text-gray-900">
      <Hero />
      <About />
      <Products />
      <Work />
      <Contact />
    </main>
  )
}
