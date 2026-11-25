'use client'

import { useState, type ReactNode } from 'react'
import { ArrowRight, Phone, Mail, MapPin } from 'lucide-react'
import SiteNav from './SiteNav'
import { brand, hero as heroContent, about, products, work, contact, footerLinks } from './content'
import { EASE, ORANGE, HeroShader, SafeBoundary, OrangeButton, ImageSlot, Badge, Lines, Starburst } from './primitives'

/* ---------- 1. HERO ---------- */

type HeroProps = {
  label?: string
  headline?: string[]
  cta?: string
  ctaHref?: string
  /** Хоёрдогч элемент: товч эсвэл "Дизайн + хэвлэл · Нэг дор" тэмдэг */
  secondary?: ReactNode
}

export function Hero({
  label = heroContent.label,
  headline = heroContent.headline,
  cta = heroContent.cta,
  ctaHref = brand.orderHref,
  secondary,
}: HeroProps) {
  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#EFEFEF]">
      <div className="pointer-events-none absolute inset-0 z-10">
        <SafeBoundary>
          <HeroShader color={ORANGE} />
        </SafeBoundary>
      </div>

      <SiteNav />

      <div className="flex-1" />
      <div className="relative z-20 mx-auto w-full max-w-[1440px] px-5 pb-14 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
        <p className="mb-5 text-[13px] tracking-wide text-gray-900 sm:mb-8 sm:text-[14px]">{label}</p>
        <h1 className="text-[clamp(1.75rem,7vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-gray-900 sm:text-[clamp(2.5rem,5vw,4.2rem)]">
          <Lines lines={headline} />
        </h1>
        <div className="mt-8 flex flex-col gap-4 sm:mt-12 sm:flex-row sm:items-center sm:gap-5">
          <OrangeButton href={ctaHref}>{cta}</OrangeButton>
          {secondary ?? <HeroBadge />}
        </div>
      </div>
    </section>
  )
}

export function HeroBadge() {
  return (
    <div className="flex w-fit items-center gap-2 rounded-[4px] bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
      <Starburst className="h-5 w-5 fill-current text-[#FF6B00] sm:h-6 sm:w-6" />
      <span className="text-[13px] font-medium text-gray-900 sm:text-[14px]">{heroContent.badge}</span>
      <span className="rounded bg-gray-900 px-1.5 py-0.5 text-[10px] text-white sm:px-2 sm:text-[11px]">{heroContent.badgeTag}</span>
    </div>
  )
}

/* ---------- 2. ABOUT ---------- */
export function About() {
  const btn = <OrangeButton href="/about">{about.cta}</OrangeButton>
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

export function Products() {
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

export function Work({ step = work.step }: { step?: string }) {
  return (
    <section id="work" className="bg-[#F5F5F5] pb-16 pt-16 sm:pb-20 sm:pt-20 lg:pb-28 lg:pt-28">
      <div className="mx-auto max-w-[1440px]">
        <Badge n={step} label={work.pill} border="border-gray-300" />
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

export function Contact() {
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
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {footerLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-[13px] text-gray-300 transition-colors hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
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

